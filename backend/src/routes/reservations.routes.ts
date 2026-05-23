import { Router } from 'express';

import * as controller from '../controllers/reservations.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get(
	'/utils/reminders',
	requireAuth,
	requirePermission('reservation.view'),
	controller.getReminders,
);
router.get(
	'/utils/recent',
	requireAuth,
	requirePermission('reservation.view'),
	controller.getRecent,
);
router.get(
	'/utils/badge-counts',
	requireAuth,
	requirePermission('reservation.view'),
	controller.getBadgeCounts,
);
router.get('/', requireAuth, requirePermission('reservation.view'), controller.getAll);
router.get('/:id', requireAuth, requirePermission('reservation.view'), controller.getById);
router.post('/', requireAuth, requirePermission('reservation.create'), controller.create);
router.patch('/:id', requireAuth, requirePermission('reservation.edit'), controller.update);
router.put('/:id', requireAuth, requirePermission('reservation.edit'), controller.update);
router.delete(
	'/:id',
	requireAuth,
	requirePermission('reservation.delete'),
	controller.remove,
);

router.post(
	'/:id/addons',
	requireAuth,
	requirePermission(['addon.manage', 'reservation.edit']),
	controller.addAddOn,
);

router.delete(
	'/:id/addons/:addonId',
	requireAuth,
	requirePermission(['addon.manage', 'reservation.edit']),
	controller.removeAddOn,
);

export default router;