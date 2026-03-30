import { Router } from 'express';
import * as controller from '../controllers/guests.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, requirePermission('guest.view'), controller.getAll);
router.get('/:id', requireAuth, requirePermission('guest.view'), controller.getById);
router.post('/', requireAuth, requirePermission('guest.create'), controller.create);
router.patch('/:id', requireAuth, requirePermission('guest.edit'), controller.update);
router.put('/:id', requireAuth, requirePermission('guest.edit'), controller.update);
router.delete('/:id', requireAuth, requirePermission('guest.delete'), controller.remove);

router.put('/:id/identity', requireAuth, requirePermission('guest.edit'), controller.updateIdentity);
router.get('/:id/reveal-identity', requireAuth, requirePermission('guest.view'), controller.revealIdentity);

export default router;