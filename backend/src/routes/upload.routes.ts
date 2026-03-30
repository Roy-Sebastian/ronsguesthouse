import { Router } from 'express';

import * as controller from '../controllers/upload.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';
import { uploadMedia } from '../middlewares/upload.middleware';

const router = Router();

router.post(
  '/',
  requireAuth,
  requirePermission(['gallery.manage', 'facility.manage', 'amenity.manage']),
  uploadMedia.single('file'),
  controller.uploadFile,
);

export default router;
