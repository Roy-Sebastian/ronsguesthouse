import { Router } from 'express';

import * as controller from '../controllers/audit-logs.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, requirePermission('audit.view'), controller.getAll);
router.get('/:id', requireAuth, requirePermission('audit.view'), controller.getById);

export default router;