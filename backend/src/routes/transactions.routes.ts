import { Router } from 'express';

import * as midtransController from '../controllers/midtrans.controller';
import * as controller from '../controllers/transactions.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';
import { publicRateLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

router.post(
	'/midtrans/charge',
	requireAuth,
	requirePermission('transaction.create'),
	midtransController.charge,
);
router.post('/midtrans/notification', midtransController.notification);

// POST /api/transactions/payment/snap-token — rate-limited, requires auth
router.post('/payment/snap-token', publicRateLimiter, requireAuth, midtransController.createSnapToken);

// GET /api/transactions/payment/status/:order_id — requires auth
router.get('/payment/status/:order_id', requireAuth, midtransController.checkPaymentStatus);

router.get('/', requireAuth, requirePermission('transaction.view'), controller.getAll);
router.get('/:id', requireAuth, requirePermission('transaction.view'), controller.getById);
router.post('/', requireAuth, requirePermission('transaction.create'), controller.create);
router.patch('/:id', requireAuth, requirePermission('transaction.edit'), controller.update);
router.put('/:id', requireAuth, requirePermission('transaction.edit'), controller.update);
router.delete('/:id', requireAuth, requirePermission('transaction.delete'), controller.remove);

export default router;
