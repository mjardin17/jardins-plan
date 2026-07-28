import { Request, Response } from "express";
import { db as pgDb } from "../db/index.ts";
import { users, auditLogs } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { authProvider } from "../lib/auth-provider.ts";
import {
  generateSessionToken,
  getAuthenticatedUserEmail,
  validateEmail,
} from "../middleware/auth.middleware.ts";
import { logger } from "../lib/logger.ts";

export class AuthController {
  public static async getMe(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);
    if (!email) return res.status(401).json({ error: "Not authenticated" });

    try {
      const results = await pgDb.select().from(users).where(eq(users.email, email));
      const user = results[0];
      if (user) {
        res.json({ user });
      } else {
        res.status(401).json({ error: "Not authenticated" });
      }
    } catch (err: any) {
      logger.error("Error in AuthController.getMe:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  public static async login(req: Request, res: Response) {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Identity token is required to authenticate." });
    }

    try {
      const decodedToken = await authProvider.verifyIdToken(idToken);
      const email = decodedToken.email;

      if (!email || !validateEmail(email)) {
        return res.status(400).json({ error: "Please provide a valid corporate email address inside the identity token." });
      }

      let results = await pgDb.select().from(users).where(eq(users.email, email));
      let user = results[0];
      if (!user) {
        const name = email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1);
        const role = email.startsWith("owner") ? "owner" : "admin";
        const inserted = await pgDb.insert(users).values({
          email,
          uid: decodedToken.uid,
          name,
          onboarded: false,
          role,
        }).returning();
        user = inserted[0];
      } else if (!user.uid) {
        await pgDb.update(users).set({ uid: decodedToken.uid }).where(eq(users.id, user.id));
        user.uid = decodedToken.uid;
      }

      if (!user.role) {
        const role = email.startsWith("owner") ? "owner" : "admin";
        await pgDb.update(users).set({ role }).where(eq(users.id, user.id));
        user.role = role;
      }

      const token = generateSessionToken(email);

      await pgDb.insert(auditLogs).values({
        businessId: user.businessId || null,
        userEmail: email,
        action: "USER_LOGIN_SUCCESS",
        ip: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
        timestamp: new Date(),
        details: `Successfully logged in via secure Identity Provider verification. Role: ${user.role}`
      });

      res.cookie("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" || req.headers["x-forwarded-proto"] === "https",
        sameSite: "lax",
        maxAge: 24 * 3600 * 1000
      });

      res.json({ success: true, user, token });
    } catch (err: any) {
      logger.error("Error in AuthController.login:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }

  public static async logout(req: Request, res: Response) {
    const email = getAuthenticatedUserEmail(req);

    try {
      let businessId: string | null = null;
      if (email) {
        const results = await pgDb.select().from(users).where(eq(users.email, email));
        if (results[0]) businessId = results[0].businessId;
      }

      await pgDb.insert(auditLogs).values({
        businessId,
        userEmail: email || "unknown",
        action: "USER_LOGOUT",
        ip: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1",
        timestamp: new Date(),
        details: "User successfully terminated active session."
      });

      res.clearCookie("session_token");
      res.json({ success: true });
    } catch (err: any) {
      logger.error("Error in AuthController.logout:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
