import { Router } from 'express';

import * as controller from '../controllers/incomes.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get(
  '/',
  requireAuth,
  requirePermission('income.view'),
  controller.getAll,
);
router.get(
  '/:id',
  requireAuth,
  requirePermission('income.view'),
  controller.getById,
);
router.post(
  '/',
  requireAuth,
  requirePermission('income.create'),
  controller.create,
);
router.patch(
  '/:id',
  requireAuth,
  requirePermission('income.edit'),
  controller.update,
);
router.delete(
  '/:id',
  requireAuth,
  requirePermission('income.delete'),
  controller.remove,
);

export default router;
