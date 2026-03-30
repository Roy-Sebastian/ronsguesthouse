import { Router } from 'express';
import * as controller from '../controllers/roles.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, requirePermission('role.manage'), controller.getRoles);
router.post('/', requireAuth, requirePermission('role.manage'), controller.updateRoles);

export default router;
