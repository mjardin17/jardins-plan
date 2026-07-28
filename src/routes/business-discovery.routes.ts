// src/routes/business-discovery.routes.ts
import { Router } from 'express';
import { BusinessDiscoveryController } from '../controllers/business-discovery.controller.ts';

const router = Router();

// Autonomous Business Discovery & Diagnostic Endpoints
router.get('/data', BusinessDiscoveryController.getDiscoveryData);
router.get('/interview', BusinessDiscoveryController.getInterviewQuestions);
router.post('/interview/answer', BusinessDiscoveryController.submitAnswer);
router.post('/workers/autonomy', BusinessDiscoveryController.updateWorkerAutonomy);
router.post('/experiments/results', BusinessDiscoveryController.updateExperimentResults);

export default router;
