import { Router } from 'express';

import * as controller from '../controllers/messages.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, requirePermission('message.view'), controller.getAll);
router.get('/:id', requireAuth, requirePermission('message.view'), controller.getById);
router.post('/', requireAuth, requirePermission('message.create'), controller.create);
router.patch('/:id', requireAuth, requirePermission('message.edit'), controller.update);
router.put('/:id', requireAuth, requirePermission('message.edit'), controller.update);
router.delete('/:id', requireAuth, requirePermission('message.delete'), controller.remove);

export default router;