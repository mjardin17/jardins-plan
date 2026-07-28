// src/routes/universal.routes.ts
import { Router } from 'express';
import { UniversalController } from '../controllers/universal.controller.ts';
import { ConnectionActivationController } from '../controllers/connection-activation.controller.ts';

const router = Router();

// Universal Core Business Routes
router.post('/onboard', UniversalController.processOnboarding);
router.get('/demo-profiles', UniversalController.getDemoProfiles);
router.post('/demo-profiles/:key', UniversalController.loadDemoPreset);
router.post('/correct-fact', UniversalController.correctFact);
router.get('/run-universality-test', UniversalController.runUniversalityTest);
router.post('/run-universality-test', UniversalController.runUniversalityTest);

// Connection Hub Routes
router.get('/connectors', ConnectionActivationController.getRegistry);
router.post('/connectors/connect', ConnectionActivationController.connectConnector);
router.post('/connectors/disconnect', ConnectionActivationController.disconnectConnector);
router.post('/connectors/test-auth', ConnectionActivationController.testAuth);
router.post('/connectors/test-read', ConnectionActivationController.testRead);
router.post('/connectors/test-write', ConnectionActivationController.testWrite);

// OAuth Security Routes
router.post('/oauth/initiate', ConnectionActivationController.initiateOAuth);
router.post('/oauth/callback', ConnectionActivationController.handleOAuthCallback);

// Worker Activation Engine & Dependency Routes
router.post('/worker/state', ConnectionActivationController.getWorkerState);
router.post('/worker/transition', ConnectionActivationController.transitionWorker);

// End-to-End Workflow Executors
router.post('/workflows/inbox/run', ConnectionActivationController.runInboxWorkflow);
router.post('/workflows/inbox/approve', ConnectionActivationController.approveInboxDraft);
router.post('/workflows/scheduling/run', ConnectionActivationController.runSchedulingWorkflow);
router.post('/workflows/scheduling/approve', ConnectionActivationController.approveSchedulingEvent);

// Tenant Audit Trail
router.get('/audit-logs', ConnectionActivationController.getAuditLogs);

export default router;
