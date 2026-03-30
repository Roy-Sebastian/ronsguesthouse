import { Router } from 'express';

import * as controller from '../controllers/gallery.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';
import { uploadMedia } from '../middlewares/upload.middleware';

const router = Router();
// GET PUBLIK
router.get('/', controller.getAll);

// GET ADMIN
router.get('/:id', requireAuth, requirePermission('gallery.manage'), controller.getById);
router.post('/', requireAuth, requirePermission('gallery.manage'), uploadMedia.single('file'), controller.create);
router.patch('/:id', requireAuth, requirePermission('gallery.manage'), controller.update);
router.put('/:id', requireAuth, requirePermission('gallery.manage'), uploadMedia.single('file'), controller.update);
router.delete('/:id', requireAuth, requirePermission('gallery.manage'), controller.remove);

export default router;