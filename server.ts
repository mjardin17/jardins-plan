import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { runMigration } from "./src/db/migrate.ts";
import { initializeDatabaseTables } from "./src/db/init.ts";
import { logger } from "./src/lib/logger.ts";
import { configManager } from "./src/lib/config-manager.ts";
import { DurableJobQueue } from "./src/lib/job-queue.ts";
import { observabilityMiddleware } from "./src/middleware/observability.middleware.ts";

// Import Modular Routers
import healthRoutes from "./src/routes/health.routes.ts";
import authRoutes from "./src/routes/auth.routes.ts";
import businessRoutes from "./src/routes/business.routes.ts";
import jobsRoutes from "./src/routes/jobs.routes.ts";
import workforceRoutes from "./src/routes/workforce.routes.ts";
import growthRoutes from "./src/routes/growth.routes.ts";
import competitorRoutes from "./src/routes/competitor.routes.ts";
import marketplaceRoutes from "./src/routes/marketplace.routes.ts";
import crmRoutes from "./src/routes/crm.routes.ts";
import universalRoutes from "./src/routes/universal.routes.ts";
import discoveryRoutes from "./src/routes/business-discovery.routes.ts";

dotenv.config();

// Ensure platform/UI-provided secret name maps to standard Stripe variable
if (process.env.Secret && !process.env.STRIPE_SECRET_KEY) {
  process.env.STRIPE_SECRET_KEY = process.env.Secret;
}

// Environment-aware initialization and validation
configManager.initialize();

const app = express();
const PORT = 3000;

// Dynamic Security Headers
app.use((req, res, next) => {
  if (req.path.startsWith("/widget/")) {
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseapp.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://*.googleapis.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          imgSrc: ["'self'", "data:", "https://*.google.com", "https://*.googleapis.com", "https://*.googleusercontent.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseapp.com"],
          frameAncestors: ["*"],
        },
      },
      xFrameOptions: false,
    })(req, res, next);
  } else {
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseapp.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://*.stripe.com", "https://*.googleapis.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          imgSrc: ["'self'", "data:", "https://*.google.com", "https://*.googleapis.com", "https://*.stripe.com", "https://*.googleusercontent.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          connectSrc: ["'self'", "https://*.stripe.com", "https://*.googleapis.com", "https://*.firebaseapp.com"],
          frameAncestors: ["'self'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: "sameorigin",
      },
    })(req, res, next);
  }
});

// Configure CORS Policy
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || "http://localhost:3000",
  "http://localhost:5173",
  "https://giga-discovery-n5jvd.firebaseapp.com"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error("CORS policy violation: Origin not allowed."));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(observabilityMiddleware);

// ----------------------------------------
// Register Route Modules
// ----------------------------------------
app.use("/", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/workforce", workforceRoutes);
app.use("/api/growth", growthRoutes);
app.use("/api/competitors", competitorRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/universal", universalRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api", crmRoutes);

// Start Server Bootstrap
async function startServer() {
  try {
    await initializeDatabaseTables();
    await runMigration();
    logger.info("PostgreSQL database schema successfully migrated and verified.");
  } catch (err) {
    logger.error("Failed to run database schema migrations:", err);
  }

  // Start Background Job Processing Worker
  DurableJobQueue.startWorker(5000);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`AI Workforce Production Server listening on http://0.0.0.0:${PORT}`);
  });

  // Graceful Shutdown Signal Handlers
  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);
    DurableJobQueue.stopWorker();
    server.close(() => {
      logger.info("HTTP Server closed. Process exiting cleanly.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

startServer();
