import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default("dev-jwt-secret-key-change-in-prod-123456789"),
  SECURITY_ENCRYPTION_KEY: z.string().default("dev-encryption-key-32-chars-minimum-sec"),
  SECURITY_ENCRYPTION_SALT: z.string().default("dev-encryption-salt-16-chars-min"),
  GEMINI_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
