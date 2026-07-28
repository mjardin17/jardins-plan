import { AIProviderRouter } from "../lib/workforce-engine.ts";

export async function runAITests() {
  console.log("----------------------------------------");
  console.log("🤖 Running AI Endpoint Validation Tests...");

  const result = await AIProviderRouter.executePrompt("Echo word 'ACTIVE' only.", {
    provider: "gemini",
    temperature: 0.1,
  });

  if (!result || !result.text) {
    throw new Error("AI test failed: AIProviderRouter returned empty text.");
  }

  console.log(`  ✅ Gemini API Integration Output: "${result.text.trim()}"`);
  console.log("  ✅ All AI Endpoint Tests Passed!");
}
