import { z } from "zod";
import assert from "assert";

export async function runUnitTests() {
  console.log("----------------------------------------");
  console.log("🧪 Running Unit Tests...");

  // 1. Zod Schema Validation Test
  const schema = z.object({
    name: z.string().min(1),
    amount: z.number().positive(),
  });

  const validData = { name: "Test Lead", amount: 150 };
  const parsed = schema.parse(validData);
  if (parsed.name !== "Test Lead" || parsed.amount !== 150) {
    throw new Error("Unit test failed: Zod schema parsing output mismatch.");
  }

  // Invalid data test
  let caughtError = false;
  try {
    schema.parse({ name: "", amount: -10 });
  } catch {
    caughtError = true;
  }
  if (!caughtError) {
    throw new Error("Unit test failed: Invalid schema data was not caught.");
  }

  console.log("  ✅ Zod Schema Validation: Passed");
  console.log("  ✅ All Unit Tests Passed!");
}
