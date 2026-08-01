import dotenv from "dotenv";
dotenv.config();
console.log("GEMINI KEY CHECK:", process.env.GEMINI_API_KEY ? "Loaded successfully! ✅" : "UNDEFINED ❌");

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai"; // 1. SDK'yı içeri aktarın

console.log("--- ENV KONTROL ---");
console.log("URL:", process.env.SUPABASE_URL);
console.log("KEY Var mı?:", !!process.env.SUPABASE_ANON_KEY);
console.log("KEY Başlangıcı:", process.env.SUPABASE_ANON_KEY?.slice(0, 15));
console.log("EMAIL:", process.env.USER_EMAIL);
console.log("-------------------");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 2. SDK istemcisini başlatın (process.env.GEMINI_API_KEY değerini otomatik okur)



  // 2. SDK istemcisini Google AI Studio modunu zorlayarak başlatın
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  vertexai: false // Bu satır SDK'nın Vertex AI yerine AI Studio kullanmasını sağlar
});
 
const PetStatusSchema = z.object({
  pet_mood: z.enum([
    "HAPPY",
    "SAD",
    "HUNGRY",
    "ENERGETIC",
    "DEPRESSED",
  ]),
  health_change: z.number().int(),
  urgent_task_suggestion: z.object({
    task_name: z.string(),
    reason: z.string(),
  }),
  pet_dialogue: z.string(),
});

async function loginAndGetToken() {
  console.log("🔑 Supabase üzerinde kullanıcı ile giriş yapılıyor...");
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.USER_EMAIL,
    password: process.env.USER_PASSWORD,
  });

  if (error) {
    console.error("❌ Login Hatası:", error.message);
    return false;
  }

  console.log("✅ Giriş başarılı! Access Token alındı.");
  return true;
}

async function updatePetStatus(historySummary, currentHealth, catId) {
  try {
    console.log("🧠 Yapay zeka yanıtı hesaplanıyor...");

    const prompt = `
Sen HabitPaw uygulamasındaki evcil hayvanın durumunu hesaplayan yapay zeka motorusun.

Kullanıcının son alışkanlık geçmişi özeti:
${historySummary}

Evcil hayvanın mevcut sağlığı: %${currentHealth}

Lütfen SADECE aşağıdaki JSON formatında cevap ver:

{
  "pet_mood": "HAPPY",
  "health_change": 10,
  "urgent_task_suggestion": {
    "task_name": "Su iç",
    "reason": "Bugün hiç su alışkanlığı tamamlanmadı."
  },
  "pet_dialogue": "Bugün biraz daha ilgine ihtiyacım var!"
}
`;

    // 3. Manuel fetch yerine resmi SDK metodunu kullanın (AQ anahtarları ile uyumludur)
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Projenizde kullandığınız model adı
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text;
    const parsedData = PetStatusSchema.parse(JSON.parse(rawText));

    console.log("\n🐾 [HabitPaw AI]");
    console.log(JSON.stringify(parsedData, null, 2));

    if (catId) {
      console.log(`💾 Kedi veritabanında güncelleniyor...`);

      const newHealth = Math.max(
        0,
        Math.min(100, currentHealth + parsedData.health_change)
      );

      const { error } = await supabase
        .from("cats")
        .update({
          mood: parsedData.pet_mood,
          health: newHealth,
          dialogue: parsedData.pet_dialogue,
          urgent_task: parsedData.urgent_task_suggestion,
        })
        .eq("id", catId);

      if (error) {
        console.error("❌ Supabase Güncelleme Hatası:", error);
      } else {
        console.log("✅ Supabase başarıyla güncellendi!");
      }
    }

    return parsedData;
  } catch (err) {
    console.error("❌ AI Hatası:", err);
  }
}

async function runWithSupabaseData() {
  const loggedIn = await loginAndGetToken();
  if (!loggedIn) return;

  console.log("📡 Supabase verileri okunuyor...");

  const { data: habits } = await supabase.from("habits").select("*");
  const { data: cats } = await supabase.from("cats").select("*");

  const historySummary =
    habits && habits.length
      ? JSON.stringify(habits)
      : "Henüz alışkanlık verisi yok.";

  const currentHealth =
    cats && cats.length ? cats[0].health ?? 80 : 80;

  const catId =
    cats && cats.length ? cats[0].id : null;

  await updatePetStatus(historySummary, currentHealth, catId);
}

runWithSupabaseData();