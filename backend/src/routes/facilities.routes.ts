import { Router } from 'express';

import * as controller from '../controllers/facilities.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, requirePermission('facility.manage'), controller.getAll);
router.get('/:id', requireAuth, requirePermission('facility.manage'), controller.getById);
router.post('/', requireAuth, requirePermission('facility.manage'), controller.create);
router.patch('/:id', requireAuth, requirePermission('facility.manage'), controller.update);
router.put('/:id', requireAuth, requirePermission('facility.manage'), controller.update);
router.delete('/:id', requireAuth, requirePermission('facility.manage'), controller.remove);

export default router;