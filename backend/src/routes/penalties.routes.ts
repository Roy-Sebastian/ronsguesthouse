import { Router } from 'express';

import * as controller from '../controllers/penalty.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, requirePermission('penalty.view'), controller.getAll);
router.get('/:id', requireAuth, requirePermission('penalty.view'), controller.getById);
router.post('/', requireAuth, requirePermission('penalty.create'), controller.create);
router.patch('/:id', requireAuth, requirePermission('penalty.edit'), controller.update);
router.put('/:id', requireAuth, requirePermission('penalty.edit'), controller.update);
router.delete('/:id', requireAuth, requirePermission('penalty.delete'), controller.remove);

export default router;
