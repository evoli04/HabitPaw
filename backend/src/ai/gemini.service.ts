import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError, GoogleGenAI, type Schema } from '@google/genai';

/**
 * Thin wrapper around the Gemini SDK: owns the client, the model name and the
 * translation of upstream failures into HTTP exceptions. Feature services talk
 * to this, never to `@google/genai` directly.
 */
@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenAI;
  readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.config.getOrThrow<string>('GEMINI_API_KEY'),
      vertexai: false, // force the AI Studio endpoint, not Vertex AI
    });
    this.model = this.config.getOrThrow<string>('GEMINI_MODEL');
  }

  /** Runs a prompt in JSON mode and returns the parsed payload. */
  async generateJson<T>(prompt: string, responseSchema: Schema): Promise<T> {
    let rawText: string | undefined;

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema },
      });
      rawText = response.text;
    } catch (error) {
      throw this.toHttpException(error);
    }

    if (!rawText) {
      this.logger.error(
        `Gemini returned an empty response (model=${this.model})`,
      );
      throw new BadGatewayException('AI service returned an empty response');
    }

    try {
      return JSON.parse(stripCodeFence(rawText)) as T;
    } catch {
      this.logger.error(
        `Gemini returned non-JSON output: ${rawText.slice(0, 500)}`,
      );
      throw new BadGatewayException('AI service returned malformed output');
    }
  }

  /**
   * Upstream detail is logged, never returned to the client: the message can
   * carry quota/project information that clients have no business seeing.
   */
  private toHttpException(error: unknown): HttpException {
    const status = error instanceof ApiError ? error.status : undefined;
    const detail = error instanceof Error ? error.message : String(error);

    if (status === 404) {
      // Google retires models; a retired id 404s even though ListModels still shows it.
      this.logger.error(
        `Gemini model "${this.model}" was rejected with 404. It is likely retired — ` +
          `set GEMINI_MODEL to a current model. Upstream: ${detail}`,
      );
      return new ServiceUnavailableException(
        'AI service is not configured correctly',
      );
    }

    if (status === 429) {
      this.logger.warn(
        `Gemini quota exhausted (model=${this.model}). Upstream: ${detail}`,
      );
      return new HttpException(
        'AI service is rate limited, try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (status === 400 || status === 401 || status === 403) {
      this.logger.error(
        `Gemini rejected the API key or request (status=${status}). Upstream: ${detail}`,
      );
      return new ServiceUnavailableException(
        'AI service is not configured correctly',
      );
    }

    this.logger.error(
      `Gemini call failed (status=${status ?? 'unknown'}). Upstream: ${detail}`,
    );
    return new BadGatewayException('AI service is unavailable');
  }
}

/** JSON mode should never fence its output, but some models still do. */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/, '')
    .trim();
}
