// src/routes/ai-accessibility.routes.ts
import { Router } from 'express';
import { AIAccessibilityController } from '../controllers/ai-accessibility.controller.ts';

const router = Router();

// /api/discovery/ai-accessibility
router.post('/assess', AIAccessibilityController.assessBusiness);
router.get('/profile', AIAccessibilityController.getProfile);
router.put('/profile', AIAccessibilityController.updateProfile);
router.get('/preview-diff/:improvementId', AIAccessibilityController.getPreviewDiff);

export default router;
