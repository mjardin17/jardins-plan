// src/routes/deployable-improvements.routes.ts
import { Router } from 'express';
import { DeployableImprovementController } from '../controllers/deployable-improvement.controller.ts';

const router = Router();

// /api/discovery/improvements
router.get('/', DeployableImprovementController.listImprovements);
router.get('/:id', DeployableImprovementController.getImprovement);
router.post('/generate-from-opportunity', DeployableImprovementController.generateFromOpportunity);
router.patch('/:id/assumptions', DeployableImprovementController.updateAssumptions);
router.post('/:id/assumptions/:assumptionId/confirm', DeployableImprovementController.confirmAssumption);
router.post('/:id/request-approval', DeployableImprovementController.requestApproval);
router.post('/:id/approve', DeployableImprovementController.approveImprovement);
router.post('/:id/reject', DeployableImprovementController.rejectImprovement);
router.get('/:id/validate-readiness', DeployableImprovementController.validateReadiness);
router.post('/:id/deploy', DeployableImprovementController.deployImprovement);
router.post('/:id/rollback', DeployableImprovementController.rollbackDeployment);
router.post('/:id/evaluate-performance', DeployableImprovementController.evaluatePerformance);
router.post('/:id/disable', DeployableImprovementController.disableImprovement);

export default router;
