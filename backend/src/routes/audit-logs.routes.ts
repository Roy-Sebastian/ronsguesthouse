import { Router } from 'express';
import * as controller from '../controllers/audit-logs.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, requirePermission('audit.view'), controller.getAll);
router.get('/:id', requireAuth, requirePermission('audit.view'), controller.getById);
router.post('/', requireAuth, requirePermission('audit.view'), controller.create);
router.patch('/:id', requireAuth, requirePermission('audit.view'), controller.update);
router.put('/:id', requireAuth, requirePermission('audit.view'), controller.update);
router.delete('/:id', requireAuth, requirePermission('audit.view'), controller.remove);

export default router;