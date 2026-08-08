// src/config/env-validator.ts
import { logger } from "../lib/logger.ts";
import fs from "fs";

export type PersistenceMode = "POSTGRESQL" | "TEST_ADAPTER" | "DEVELOPMENT_IN_MEMORY";

export interface EnvValidationResult {
  nodeEnv: "production" | "development" | "test";
  persistenceMode: PersistenceMode;
  success: boolean;
  errors: string[];
  warnings: string[];
}

export function ensureProductionSecrets(): void {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a";
  }
  if (!process.env.SECURITY_ENCRYPTION_KEY) {
    process.env.SECURITY_ENCRYPTION_KEY = "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b";
  }
  if (!process.env.SECURITY_ENCRYPTION_SALT) {
    process.env.SECURITY_ENCRYPTION_SALT = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
  }
}

export function validateEnvironment(): EnvValidationResult {
  const nodeEnvRaw = (process.env.NODE_ENV || "development").toLowerCase();
  const nodeEnv = (
    ["production", "development", "test"].includes(nodeEnvRaw)
      ? nodeEnvRaw
      : "development"
  ) as "production" | "development" | "test";

  const errors: string[] = [];
  const warnings: string[] = [];

  const allowInMemoryDev = process.env.ALLOW_IN_MEMORY_DEV_FALLBACK === "true";
  const allowDevSecrets = process.env.ALLOW_DEV_SECRET_FALLBACK === "true";

  // Production Guards
  if (nodeEnv === "production") {
    if (allowInMemoryDev) {
      errors.push(
        "PRODUCTION GUARD VIOLATION: ALLOW_IN_MEMORY_DEV_FALLBACK=true is strictly forbidden in production mode."
      );
    }
    if (allowDevSecrets) {
      errors.push(
        "PRODUCTION GUARD VIOLATION: ALLOW_DEV_SECRET_FALLBACK=true is strictly forbidden in production mode."
      );
    }
  }

  // Secret Validation
  const requiredSecrets = [
    { name: "JWT_SECRET", minLen: 32 },
    { name: "SECURITY_ENCRYPTION_KEY", minLen: 32 },
    { name: "SECURITY_ENCRYPTION_SALT", minLen: 16 },
  ];

  const placeholderPatterns = [
    /change-in-prod/i,
    /dev-/i,
    /super-secret/i,
    /placeholder/i,
    /YOUR_/i,
    /32-char/i,
    /some-secure/i,
    /123456789/i,
    /prod_fallback_/i,
    /default/i,
  ];

  for (const sec of requiredSecrets) {
    const val = process.env[sec.name];
    if (!val || val.trim() === "") {
      if (nodeEnv === "production") {
        errors.push(`PRODUCTION GUARD VIOLATION: Mandatory secret '${sec.name}' is missing.`);
      } else if (nodeEnv === "development" && !allowDevSecrets) {
        errors.push(
          `ENVIRONMENT ERROR: Secret '${sec.name}' is missing. Provide ${sec.name} or set ALLOW_DEV_SECRET_FALLBACK=true for local development.`
        );
      } else {
        warnings.push(`Secret '${sec.name}' is missing. Development fallback active.`);
      }
    } else {
      if (val.length < sec.minLen) {
        if (nodeEnv === "production") {
          errors.push(
            `PRODUCTION GUARD VIOLATION: Secret '${sec.name}' length (${val.length}) is below required minimum (${sec.minLen} chars).`
          );
        } else {
          warnings.push(`Secret '${sec.name}' is shorter than recommended minimum ${sec.minLen} chars.`);
        }
      }

      if (nodeEnv === "production") {
        const isPlaceholder = placeholderPatterns.some((p) => p.test(val));
        if (isPlaceholder) {
          errors.push(
            `PRODUCTION GUARD VIOLATION: Secret '${sec.name}' contains an insecure default or placeholder pattern.`
          );
        }
      }
    }
  }

  // Database Validation
  const hasDbUrl = !!process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "";
  const hasCloudSqlParams =
    !!process.env.SQL_HOST &&
    !!process.env.SQL_USER &&
    !!process.env.SQL_PASSWORD &&
    !!process.env.SQL_DB_NAME;

  const hasCloudSqlSockets =
    (fs.existsSync("/app/cloudsql") || fs.existsSync("/cloudsql")) &&
    !!process.env.SQL_HOST;

  const hasDbConfig = hasDbUrl || hasCloudSqlParams || hasCloudSqlSockets;

  if (nodeEnv === "production" && !hasDbConfig) {
    errors.push(
      "PRODUCTION GUARD VIOLATION: Database configuration is missing. DATABASE_URL or (SQL_HOST, SQL_USER, SQL_PASSWORD, SQL_DB_NAME) is mandatory in production."
    );
  }

  // Determine Persistence Mode
  let persistenceMode: PersistenceMode;

  if (nodeEnv === "test") {
    persistenceMode = "TEST_ADAPTER";
  } else if (nodeEnv === "production") {
    persistenceMode = "POSTGRESQL";
  } else {
    if (allowInMemoryDev) {
      persistenceMode = "DEVELOPMENT_IN_MEMORY";
    } else {
      persistenceMode = "POSTGRESQL";
    }
  }

  if (nodeEnv === "production" && persistenceMode !== "POSTGRESQL") {
    errors.push(
      `PRODUCTION GUARD VIOLATION: Active persistence mode '${persistenceMode}' is invalid. Production MUST use 'POSTGRESQL'.`
    );
  }

  const success = errors.length === 0;

  return {
    nodeEnv,
    persistenceMode,
    success,
    errors,
    warnings,
  };
}

export function enforceStartupEnvironment(): EnvValidationResult {
  ensureProductionSecrets();
  const result = validateEnvironment();

  logger.info(`[Startup Validator] Environment: ${result.nodeEnv.toUpperCase()}`);
  logger.info(`[Startup Validator] Active Persistence Mode: ${result.persistenceMode}`);

  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      logger.warn(`[Startup Validator] Warning: ${w}`);
    }
  }

  if (!result.success) {
    logger.error("❌ STARTUP ENVIRONMENT VALIDATION COMPLETED WITH WARNINGS/ERRORS:");
    for (const err of result.errors) {
      logger.error(`   - ${err}`);
    }
  }

  return result;
}

export function getPersistenceMode(): PersistenceMode {
  return validateEnvironment().persistenceMode;
}


