import { Router } from 'express';

import * as controller from '../controllers/amenities.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, requirePermission('amenity.manage'), controller.getAll);
router.get('/:id', requireAuth, requirePermission('amenity.manage'), controller.getById);
router.post('/', requireAuth, requirePermission('amenity.manage'), controller.create);
router.patch('/:id', requireAuth, requirePermission('amenity.manage'), controller.update);
router.put('/:id', requireAuth, requirePermission('amenity.manage'), controller.update);
router.delete('/:id', requireAuth, requirePermission('amenity.manage'), controller.remove);

export default router;