// Prototype of the cat-mood AI engine. The production version lives in the NestJS
// backend (backend/src/ai) — this script is kept for quick experiments.
// Run: npm run pet
import dotenv from "dotenv";

// Root .env wins; backend/.env fills in whatever it doesn't define (dotenv keeps the first value).
dotenv.config({ path: [".env", "backend/.env"] });

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

const SUPABASE_URL = process.env.SUPABASE_URL;
// backend/.env uses Supabase's newer name for the same public key.
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

console.log("--- ENV KONTROL ---");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "yüklendi ✅" : "EKSİK ❌");
console.log("GEMINI_MODEL:", MODEL);
console.log("SUPABASE_URL:", SUPABASE_URL ?? "EKSİK ❌");
console.log("SUPABASE anahtarı:", SUPABASE_KEY ? "yüklendi ✅" : "EKSİK ❌");
console.log("USER_EMAIL:", process.env.USER_EMAIL ?? "tanımsız (Supabase adımı atlanacak)");
console.log("-------------------");

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY yok. .env.example dosyasına bak.");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  vertexai: false, // AI Studio endpoint, not Vertex AI
});

const supabase =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const PetStatusSchema = z.object({
  pet_mood: z.enum(["HAPPY", "SAD", "HUNGRY", "ENERGETIC", "DEPRESSED"]),
  health_change: z.number().int(),
  urgent_task_suggestion: z.object({
    task_name: z.string(),
    reason: z.string(),
  }),
  pet_dialogue: z.string(),
});

// Same shape as PetStatusSchema, expressed for Gemini's JSON mode.
const responseSchema = {
  type: "OBJECT",
  properties: {
    pet_mood: {
      type: "STRING",
      enum: ["HAPPY", "SAD", "HUNGRY", "ENERGETIC", "DEPRESSED"],
    },
    health_change: { type: "INTEGER" },
    urgent_task_suggestion: {
      type: "OBJECT",
      properties: {
        task_name: { type: "STRING" },
        reason: { type: "STRING" },
      },
      required: ["task_name", "reason"],
    },
    pet_dialogue: { type: "STRING" },
  },
  required: ["pet_mood", "health_change", "urgent_task_suggestion", "pet_dialogue"],
};

async function loginAndGetToken() {
  if (!supabase || !process.env.USER_EMAIL || !process.env.USER_PASSWORD) {
    console.log("ℹ️ Supabase kimlik bilgileri yok — örnek verilerle devam ediliyor.");
    return false;
  }

  console.log("🔑 Supabase üzerinde kullanıcı ile giriş yapılıyor...");
  const { error } = await supabase.auth.signInWithPassword({
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
  console.log("🧠 Yapay zeka yanıtı hesaplanıyor...");

  const prompt = `
Sen HabitPaw uygulamasındaki evcil hayvanın durumunu hesaplayan yapay zeka motorusun.

Kullanıcının son alışkanlık geçmişi özeti:
${historySummary}

Evcil hayvanın mevcut sağlığı: %${currentHealth}

Yalnızca istenen JSON alanlarını doldur, açıklama ekleme.
`;

  let parsedData;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema },
    });
    parsedData = PetStatusSchema.parse(JSON.parse(response.text));
  } catch (err) {
    console.error(`❌ AI Hatası (${MODEL}, status ${err?.status ?? "?"}):`, err?.message ?? err);
    if (err?.status === 404) {
      console.error("   Bu model artık bu anahtarla çağrılamıyor. GEMINI_MODEL değerini güncelle.");
    }
    return;
  }

  console.log("\n🐾 [HabitPaw AI]");
  console.log(JSON.stringify(parsedData, null, 2));

  if (supabase && catId) {
    console.log("💾 Kedi veritabanında güncelleniyor...");
    const newHealth = Math.max(0, Math.min(100, currentHealth + parsedData.health_change));

    const { error } = await supabase
      .from("cats")
      .update({
        mood: parsedData.pet_mood,
        health: newHealth,
        dialogue: parsedData.pet_dialogue,
        urgent_task: parsedData.urgent_task_suggestion,
      })
      .eq("id", catId);

    // NOTE: prisma/schema.prisma's Cat model has no mood/health/dialogue/urgent_task
    // columns yet, so this update fails until the schema catches up.
    if (error) {
      console.error("❌ Supabase Güncelleme Hatası:", error.message);
    } else {
      console.log("✅ Supabase başarıyla güncellendi!");
    }
  }

  return parsedData;
}

async function runWithSupabaseData() {
  const loggedIn = await loginAndGetToken();

  let historySummary = "Bugün 4 alışkanlıktan 1'i tamamlandı, su içme alışkanlığı atlandı.";
  let currentHealth = 80;
  let catId = null;

  if (loggedIn) {
    console.log("📡 Supabase verileri okunuyor...");
    const { data: habits } = await supabase.from("habits").select("*");
    const { data: cats } = await supabase.from("cats").select("*");

    if (habits?.length) historySummary = JSON.stringify(habits);
    if (cats?.length) {
      currentHealth = cats[0].health ?? 80;
      catId = cats[0].id;
    }
  }

  await updatePetStatus(historySummary, currentHealth, catId);
}

runWithSupabaseData();
