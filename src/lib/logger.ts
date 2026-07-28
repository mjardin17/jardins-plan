// src/lib/logger.ts

export interface LogContext {
  userId?: string;
  businessId?: string;
  traceId?: string;
  [key: string]: any;
}

function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const sensitiveKeys = [
    "password",
    "idtoken",
    "stripesecretkey",
    "twiliotoken",
    "secret",
    "jwt",
    "key",
    "token",
    "password_hash"
  ];

  const sanitized: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (sensitiveKeys.includes(k.toLowerCase())) {
      sanitized[k] = "••••••••••••••••";
    } else if (typeof v === "object") {
      sanitized[k] = sanitizeObject(v);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

export const logger = {
  info(message: string, context?: LogContext) {
    const logObj = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      message,
      context: context ? sanitizeObject(context) : undefined,
    };
    console.log(JSON.stringify(logObj));
  },

  warn(message: string, context?: LogContext) {
    const logObj = {
      timestamp: new Date().toISOString(),
      level: "WARN",
      message,
      context: context ? sanitizeObject(context) : undefined,
    };
    console.warn(JSON.stringify(logObj));
  },

  error(message: string, error?: any, context?: LogContext) {
    const errDetails = error instanceof Error
      ? { name: error.name, message: error.message }
      : error;

    const logObj = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      message,
      error: errDetails ? sanitizeObject(errDetails) : undefined,
      context: context ? sanitizeObject(context) : undefined,
    };
    console.error(JSON.stringify(logObj));
  }
};
