import { Router } from 'express';

import * as controller from '../controllers/roles.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// Public read — all authenticated dashboard users need this to render their sidebar correctly
router.get('/', requireAuth, controller.getRoles);
// Write — restricted to users with role management permission
router.post('/', requireAuth, requirePermission('role.manage'), controller.updateRoles);

export default router;
