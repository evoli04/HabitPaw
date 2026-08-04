import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HabitFrequency, Prisma } from '@prisma/client';
import { Type, type Schema } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';
import { HabitsService } from '../habits/habits.service';
import { GeminiService } from './gemini.service';
import { ExperienceLevel, SuggestHabitsDto } from './dto/suggest-habits.dto';
import {
  HabitSuggestionDto,
  SuggestHabitsResponseDto,
} from './dto/habit-suggestion.dto';

const MAX_SUGGESTIONS = 3;
const REMINDER_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Mirrors HabitSuggestionDto — Gemini is constrained to this shape in JSON mode. */
const SUGGESTIONS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          frequency: { type: Type.STRING, enum: Object.values(HabitFrequency) },
          reminderTime: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['title', 'description', 'frequency', 'reason'],
      },
    },
  },
  required: ['suggestions'],
};

interface RawSuggestion {
  title?: unknown;
  description?: unknown;
  frequency?: unknown;
  reminderTime?: unknown;
  reason?: unknown;
}

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly habits: HabitsService,
  ) {}

  async suggestHabits(
    userId: string,
    dto: SuggestHabitsDto,
  ): Promise<SuggestHabitsResponseDto> {
    const existingHabits = await this.prisma.habit.findMany({
      where: { userId, isActive: true },
      select: { title: true, frequency: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const prompt = buildPrompt(dto, existingHabits);
    const raw = await this.gemini.generateJson<{
      suggestions?: RawSuggestion[];
    }>(prompt, SUGGESTIONS_SCHEMA);

    const suggestions = (raw.suggestions ?? [])
      .map(normalizeSuggestion)
      .filter(
        (suggestion): suggestion is HabitSuggestionDto => suggestion !== null,
      )
      .slice(0, MAX_SUGGESTIONS);

    if (suggestions.length === 0) {
      throw new BadRequestException(
        'AI could not produce a usable habit suggestion for this goal',
      );
    }

    const recommendation = await this.prisma.aiRecommendation.create({
      data: {
        userId,
        goal: dto.goal,
        requestContext: {
          goal: dto.goal,
          dailyMinutes: dto.dailyMinutes ?? null,
          level: dto.level ?? null,
          notes: dto.notes ?? null,
          existingHabitTitles: existingHabits.map((habit) => habit.title),
        },
        suggestions: suggestions as unknown as Prisma.InputJsonValue,
        model: this.gemini.model,
      },
      select: { id: true },
    });

    return {
      recommendationId: recommendation.id,
      model: this.gemini.model,
      suggestions,
    };
  }

  /** Turns stored suggestions into real habits — the AI never writes to `habits` itself. */
  async acceptSuggestions(
    userId: string,
    recommendationId: string,
    indexes: number[],
  ) {
    const recommendation = await this.prisma.aiRecommendation.findFirst({
      where: { id: recommendationId, userId },
      select: { suggestions: true },
    });
    if (!recommendation)
      throw new NotFoundException('Recommendation not found');

    const stored =
      recommendation.suggestions as unknown as HabitSuggestionDto[];
    const unique = [...new Set(indexes)];

    const invalid = unique.filter((index) => index >= stored.length);
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Suggestion index out of range: ${invalid.join(', ')}`,
      );
    }

    const created: Awaited<ReturnType<HabitsService['create']>>[] = [];
    for (const index of unique) {
      const suggestion = stored[index];
      created.push(
        await this.habits.create(userId, {
          title: suggestion.title,
          description: suggestion.description,
          frequency: suggestion.frequency,
          reminderTime: suggestion.reminderTime,
        }),
      );
    }

    return created;
  }
}

function buildPrompt(
  dto: SuggestHabitsDto,
  existingHabits: { title: string; frequency: HabitFrequency }[],
): string {
  const existing = existingHabits.length
    ? existingHabits
        .map((habit) => `- ${habit.title} (${habit.frequency})`)
        .join('\n')
    : '- (kullanıcının henüz alışkanlığı yok)';

  return `Sen HabitPaw uygulamasının alışkanlık koçusun. Kullanıcının hedefine uygun,
somut ve ölçülebilir en fazla ${MAX_SUGGESTIONS} alışkanlık öner.

Kullanıcının hedefi: "${dto.goal}"
Günlük ayırabileceği süre: ${dto.dailyMinutes ? `${dto.dailyMinutes} dakika` : 'belirtilmedi'}
Deneyim seviyesi: ${dto.level ?? ExperienceLevel.beginner}
Ek notlar: ${dto.notes ?? 'yok'}

Kullanıcının hâlihazırda takip ettiği alışkanlıklar:
${existing}

Kurallar:
- Mevcut alışkanlıkları tekrar etme, onları tamamlayan yeni öneriler ver.
- title en fazla 100 karakter, description en fazla 500 karakter olsun.
- frequency yalnızca ${Object.values(HabitFrequency).join(', ')} değerlerinden biri olsun.
- reminderTime verirsen 24 saatlik HH:mm formatında olsun, emin değilsen alanı boş bırak.
- Tüm metinler Türkçe olsun.`;
}

function normalizeSuggestion(raw: RawSuggestion): HabitSuggestionDto | null {
  const title = asTrimmedString(raw.title);
  const description = asTrimmedString(raw.description);
  const reason = asTrimmedString(raw.reason);
  if (!title || !description || !reason) return null;

  const frequency = Object.values(HabitFrequency).includes(
    raw.frequency as HabitFrequency,
  )
    ? (raw.frequency as HabitFrequency)
    : HabitFrequency.daily;

  const reminderTime = asTrimmedString(raw.reminderTime);

  return {
    // Truncated rather than rejected: the DB columns are VarChar(100)/VarChar(500).
    title: title.slice(0, 100),
    description: description.slice(0, 500),
    frequency,
    reminderTime:
      reminderTime && REMINDER_TIME_PATTERN.test(reminderTime)
        ? reminderTime
        : undefined,
    reason: reason.slice(0, 500),
  };
}

function asTrimmedString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
