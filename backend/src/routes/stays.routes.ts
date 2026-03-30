import { Router } from 'express';

import * as controller from '../controllers/stays.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, requirePermission('stay.view'), controller.getAll);
router.get('/:id', requireAuth, requirePermission('stay.view'), controller.getById);
router.post('/', requireAuth, requirePermission('stay.create'), controller.create);
router.patch('/:id', requireAuth, requirePermission('stay.edit'), controller.update);
router.put('/:id', requireAuth, requirePermission('stay.edit'), controller.update);
router.delete('/:id', requireAuth, requirePermission('stay.delete'), controller.remove);

export default router;