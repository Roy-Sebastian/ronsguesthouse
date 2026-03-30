import { Router } from 'express';
import * as controller from '../controllers/expenses.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get(
  '/',
  requireAuth,
  requirePermission('expense.view'),
  controller.getAll,
);
router.get(
  '/:id',
  requireAuth,
  requirePermission('expense.view'),
  controller.getById,
);
router.post(
  '/',
  requireAuth,
  requirePermission('expense.create'),
  controller.create,
);
router.patch(
  '/:id',
  requireAuth,
  requirePermission('expense.edit'),
  controller.update,
);
router.put(
  '/:id',
  requireAuth,
  requirePermission('expense.edit'),
  controller.update,
);
router.delete(
  '/:id',
  requireAuth,
  requirePermission('expense.delete'),
  controller.remove,
);

export default router;
