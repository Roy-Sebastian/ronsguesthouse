import { Router } from 'express';
import * as controller from '../controllers/reviews.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, requirePermission('review.manage'), controller.getAll);
router.get('/:id', requireAuth, requirePermission('review.manage'), controller.getById);
router.post('/', requireAuth, requirePermission('review.manage'), controller.create);
router.patch('/:id', requireAuth, requirePermission('review.manage'), controller.update);
router.put('/:id', requireAuth, requirePermission('review.manage'), controller.update);
router.delete('/:id', requireAuth, requirePermission('review.manage'), controller.remove);

export default router;