import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../lib/logger.ts";

export function observabilityMiddleware(req: Request, res: Response, next: NextFunction) {
  const correlationId = (req.headers["x-correlation-id"] as string) || `corr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const requestId = (req.headers["x-request-id"] as string) || `req_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  (req as any).correlationId = correlationId;
  (req as any).requestId = requestId;

  res.setHeader("X-Correlation-ID", correlationId);
  res.setHeader("X-Request-ID", requestId);

  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info(`[HTTP] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
      correlationId,
      requestId,
      statusCode: res.statusCode,
      method: req.method,
      path: req.path,
    });
  });

  next();
}
