import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import dotenv from 'dotenv';

// Root .env wins; backend/.env fills in whatever it doesn't define.
dotenv.config({ path: ['.env', 'backend/.env'] });

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, vertexai: false });

const HabitSchema = z.object({
  suggestions: z.array(
    z.object({
      habit_name: z.string(),
      description: z.string(),
      frequency: z.string()
    })
  )
});

async function getHabitSuggestions(goal, duration, level) {
  try {
    const prompt = `Sen HabitPaw uygulamasının akıllı alışkanlık koçusun. 
    Kullanıcının hedefi: "${goal}"
    Günlük ayırabileceği süre: ${duration}
    Zorluk seviyesi: ${level}
    
    Bu bilgilere uygun, kullanıcıyı sıkmayacak en fazla 3 tane alışkanlık öner.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            suggestions: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  habit_name: { type: 'STRING' },
                  description: { type: 'STRING' },
                  frequency: { type: 'STRING' }
                },
                required: ['habit_name', 'description', 'frequency']
              }
            }
          },
          required: ['suggestions']
        }
      }
    });

    const responseText = response.text;
    const parsedData = HabitSchema.parse(JSON.parse(responseText));
    
    console.log("🚀 Gemini'dan Gelen Temiz Veri:");
    console.log(JSON.stringify(parsedData, null, 2));
    return parsedData;

  } catch (error) {
    console.log("⚠️ Bir hata oluştu!");
    console.log(error);
  }
}

getHabitSuggestions("Daha üretken olmak ve odaklanmak istiyorum", "20 dakika", "Başlangıç");