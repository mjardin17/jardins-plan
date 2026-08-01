import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  SECURITY_ENCRYPTION_KEY: z.string().optional(),
  SECURITY_ENCRYPTION_SALT: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  ALLOW_IN_MEMORY_DEV_FALLBACK: z.string().optional(),
  ALLOW_DEV_SECRET_FALLBACK: z.string().optional(),
});

export const env = envSchema.parse(process.env);
