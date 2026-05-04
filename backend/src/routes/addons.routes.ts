import { Router } from 'express';

import { create, getAll, remove, getAvailable, update } from '../controllers/addons.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// Admin/Superadmin only (Master Data)
router.get('/master', requireAuth, requirePermission('addon.view'), getAll);
router.post('/master', requireAuth, requirePermission('addon.manage'), create);
router.patch('/master/:id', requireAuth, requirePermission('addon.manage'), update);
router.delete('/master/:id', requireAuth, requirePermission('addon.manage'), remove);

// Receptionist / Anyone with stay.edit (Available Add-Ons for Booking)
router.get('/available', requireAuth, requirePermission(['addon.view', 'stay.edit']), getAvailable);

export default router;
