import { Router } from 'express';

import {
  calculatePrice,
  checkAvailability,
  getRoomPrices,
  upsertPrice,
  bulkUpsertPrices,
  deletePrice,
} from '../controllers/pricing.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';
import { publicRateLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

// ─── Public endpoints (rate-limited) ───────────────────────────────

// GET /api/pricing/calculate?roomId=X&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
router.get('/calculate', publicRateLimiter, calculatePrice);

// POST /api/pricing/check-availability { roomId, checkIn, checkOut }
router.post('/check-availability', publicRateLimiter, checkAvailability);

// ─── Protected endpoints ───────────────────────────────────────────

// GET /api/pricing/:roomId?startDate=...&endDate=...
router.get('/:roomId', requireAuth, requirePermission('room.edit'), getRoomPrices);

// POST /api/pricing { roomId, date, price }
router.post('/', requireAuth, requirePermission('room.edit'), upsertPrice);

// POST /api/pricing/bulk { roomId, entries: [{ date, price }] }
router.post('/bulk', requireAuth, requirePermission('room.edit'), bulkUpsertPrices);

// DELETE /api/pricing/:id
router.delete('/:id', requireAuth, requirePermission('room.edit'), deletePrice);

export default router;
