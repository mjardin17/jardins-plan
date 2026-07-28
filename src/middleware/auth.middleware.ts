import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../lib/logger.ts";
import { db as pgDb } from "../db/index.ts";
import { sql } from "drizzle-orm";

const rateLimitCache = new Map<string, { count: number; expires: number }>();

export function generateSessionToken(email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + 24 * 3600 * 1000 })).toString("base64url");
  const secret = process.env.JWT_SECRET || "dev-jwt-secret-key-change-in-prod-123456789";
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function verifySessionToken(token: string): string | null {
  try {
    const [header, payload, signature] = token.split(".");
    const secret = process.env.JWT_SECRET || "dev-jwt-secret-key-change-in-prod-123456789";
    const expectedSig = crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
    if (signature !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (Date.now() > data.exp) return null;
    return data.email;
  } catch {
    return null;
  }
}

export function getAuthenticatedUserEmail(req: Request): string | null {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const email = verifySessionToken(token);
    if (email) return email;
  }

  const cookiesStr = req.headers.cookie;
  if (cookiesStr) {
    const cookies = cookiesStr.split(";").reduce((acc, cookie) => {
      const parts = cookie.trim().split("=");
      const key = parts[0];
      const value = parts.slice(1).join("=");
      if (key) acc[key] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);

    const token = cookies["session_token"];
    if (token) {
      const email = verifySessionToken(token);
      if (email) return email;
    }
  }
  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const email = getAuthenticatedUserEmail(req);
  if (!email) {
    return res.status(401).json({ error: "Unauthorized access. Authentication token missing or expired." });
  }
  (req as any).userEmail = email;
  next();
}

export function encryptSecret(text: string): string {
  if (!text) return "";
  const secretKey = process.env.SECURITY_ENCRYPTION_KEY || "dev-encryption-key-32-chars-minimum-sec";
  const salt = process.env.SECURITY_ENCRYPTION_SALT || "dev-salt-32-chars-minimum-sec";
  try {
    const key = crypto.scryptSync(secretKey, salt, 32);
    const nonce = crypto.randomBytes(12); // 96-bit nonce for GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `v2:gcm:${nonce.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err: any) {
    throw new Error(`Encryption failed: ${err.message}`);
  }
}

export function decryptSecret(encryptedText: string): string {
  if (!encryptedText) return "";
  const secretKey = process.env.SECURITY_ENCRYPTION_KEY || "dev-encryption-key-32-chars-minimum-sec";
  const salt = process.env.SECURITY_ENCRYPTION_SALT || "dev-salt-32-chars-minimum-sec";

  // Check for Version 2 AES-256-GCM Envelope Format
  if (encryptedText.startsWith("v2:gcm:")) {
    const parts = encryptedText.split(":");
    if (parts.length !== 5) {
      throw new Error("Decryption failed: Invalid GCM envelope structure.");
    }
    const nonce = Buffer.from(parts[2], "hex");
    const authTag = Buffer.from(parts[3], "hex");
    const ciphertext = parts[4];

    try {
      const key = crypto.scryptSync(secretKey, salt, 32);
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(ciphertext, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (err: any) {
      throw new Error(`Authenticated Decryption Failed (Tampered or Invalid Key): ${err.message}`);
    }
  }

  // Fallback for Legacy AES-256-CBC Format (iv:ciphertext)
  if (!encryptedText.includes(":")) {
    throw new Error("Decryption failed: Invalid format (missing IV separator).");
  }

  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");

  try {
    const key = crypto.scryptSync(secretKey, salt, 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    try {
      const key = crypto.scryptSync(secretKey, "salt", 32);
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (err: any) {
      throw new Error(`Legacy CBC Decryption failed: ${err.message}`);
    }
  }
}

export function rateLimiter(limit: number, windowMs: number, options?: { routeClass?: string }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown-ip";
    const routeClass = options?.routeClass || "api";
    const key = `rl:${routeClass}:${ip}:${req.path}`;
    const now = Date.now();

    // Clean up expired entries periodically
    if (rateLimitCache.size > 1000) {
      for (const [k, val] of rateLimitCache.entries()) {
        if (now > val.expires) rateLimitCache.delete(k);
      }
    }

    let cacheVal = rateLimitCache.get(key);
    if (!cacheVal || now > cacheVal.expires) {
      cacheVal = { count: 1, expires: now + windowMs };
      rateLimitCache.set(key, cacheVal);
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", limit - 1);
      res.setHeader("X-RateLimit-Reset", Math.ceil(cacheVal.expires / 1000));
      return next();
    }

    cacheVal.count++;
    const remaining = Math.max(0, limit - cacheVal.count);
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(cacheVal.expires / 1000));

    if (cacheVal.count > limit) {
      const retryAfterSec = Math.ceil((cacheVal.expires - now) / 1000);
      res.setHeader("Retry-After", retryAfterSec);
      logger.warn(`[RateLimiter] Blocked IP ${ip} on route ${req.path}. Exceeded ${limit} requests in ${windowMs}ms.`);
      return res.status(429).json({
        error: "Too many requests. Rate limit exceeded.",
        retryAfterSeconds: retryAfterSec,
      });
    }

    next();
  };
}

export function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function validateName(name: string): boolean {
  if (!name || name.trim().length === 0) return false;
  if (name.length > 80) return false;
  if (name.includes("<") || name.includes(">") || name.includes("script")) return false;
  return true;
}
