// Smallest possible "is Gemini reachable?" check.
// Run: npm run check:gemini
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Root .env wins; backend/.env fills in whatever it doesn't define (dotenv keeps the first value).
dotenv.config({ path: [".env", "backend/.env"] });

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

// Never print the key itself.
console.log("GEMINI_API_KEY:", apiKey ? "loaded ✅" : "MISSING ❌ (see .env.example)");
console.log("GEMINI_MODEL:", model);
if (!apiKey) process.exit(1);

const ai = new GoogleGenAI({ apiKey, vertexai: false });

try {
  const response = await ai.models.generateContent({ model, contents: "Merhaba" });
  console.log("✅", response.text);
} catch (e) {
  console.error(`❌ ${model} failed (status ${e?.status ?? "?"}):`, e?.message);
  if (e?.status === 404) {
    console.error("   Model retired for this key. List the ones you can call:");
    console.error("   curl \"https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY\"");
  }
  process.exit(1);
}
