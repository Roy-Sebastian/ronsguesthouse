import { Router } from 'express';
import * as controller from '../controllers/dashboard.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();
router.get(
	'/stats',
	requireAuth,
	requirePermission(['dashboard.view', 'report.view']),
	controller.getStats,
);

export default router;