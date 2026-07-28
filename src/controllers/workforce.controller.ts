import { Request, Response } from "express";
import { AIProviderRouter, MCPToolRegistry, INDUSTRY_PACKS, CircuitBreaker } from "../lib/workforce-engine.ts";
import { MultiAgentEngine } from "../lib/multi-agent-engine.ts";
import { runPhase65ValidationSuite } from "../tests/phase65-validation.test.ts";
import { logger } from "../lib/logger.ts";

export class WorkforceController {
  public static async executeAgent(req: Request, res: Response) {
    try {
      const { agentRole, taskPrompt, provider, model } = req.body;
      if (!taskPrompt) {
        return res.status(400).json({ error: "taskPrompt is required" });
      }

      const result = await AIProviderRouter.executePrompt(
        taskPrompt,
        {
          provider: provider || 'gemini',
          model: model || 'gemini-1.5-flash',
          systemInstruction: `You are an enterprise AI ${agentRole || 'workforce assistant'}.`,
        }
      );

      res.json({ success: true, result });
    } catch (err: any) {
      logger.error("Error in WorkforceController.executeAgent:", err);
      res.status(500).json({ error: err.message || "Execution failed" });
    }
  }

  public static async getIndustryPacks(req: Request, res: Response) {
    try {
      res.json({ success: true, industryPacks: INDUSTRY_PACKS });
    } catch (err: any) {
      logger.error("Error in WorkforceController.getIndustryPacks:", err);
      res.status(500).json({ error: "Failed to fetch industry packs" });
    }
  }

  public static async getMcpTools(req: Request, res: Response) {
    try {
      const tools = MCPToolRegistry.getRegisteredTools();
      res.json({ success: true, tools });
    } catch (err: any) {
      logger.error("Error in WorkforceController.getMcpTools:", err);
      res.status(500).json({ error: "Failed to fetch MCP tools" });
    }
  }

  public static async executeWorkflow(req: Request, res: Response) {
    try {
      const { workflowType, businessId, params } = req.body;
      if (!workflowType || !businessId) {
        return res.status(400).json({ error: "workflowType and businessId are required" });
      }

      const result = await MultiAgentEngine.simulateWorkflow(businessId, workflowType, params || {});
      res.json({ success: true, result });
    } catch (err: any) {
      logger.error("Error in WorkforceController.executeWorkflow:", err);
      res.status(500).json({ error: err.message || "Workflow execution failed" });
    }
  }

  public static async runPhase65Validation(req: Request, res: Response) {
    try {
      const suiteResults = await runPhase65ValidationSuite();
      const circuitMetrics = CircuitBreaker.getMetrics();

      res.json({
        success: suiteResults.summary.failed === 0,
        timestamp: new Date().toISOString(),
        validationSuite: suiteResults,
        systemTelemetry: {
          circuitBreakers: circuitMetrics,
          nodeVersion: process.version,
          memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          uptimeSeconds: Math.floor(process.uptime()),
        }
      });
    } catch (err: any) {
      logger.error("Error in WorkforceController.runPhase65Validation:", err);
      res.status(500).json({ error: err.message || "Validation suite execution failed" });
    }
  }
}
