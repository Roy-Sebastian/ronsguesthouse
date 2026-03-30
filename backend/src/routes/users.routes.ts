import { Router } from 'express';
import * as controller from '../controllers/users.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, requirePermission('user.view'), controller.getAll);
router.get('/:id', requireAuth, requirePermission('user.view'), controller.getById);
router.post('/', requireAuth, requirePermission('user.create'), controller.create);
router.patch('/:id', requireAuth, requirePermission('user.edit'), controller.update);
router.put('/:id', requireAuth, requirePermission('user.edit'), controller.update);
router.delete('/:id', requireAuth, requirePermission('user.delete'), controller.remove);

export default router;