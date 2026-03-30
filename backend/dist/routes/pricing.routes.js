"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pricing_controller_1 = require("../controllers/pricing.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const router = (0, express_1.Router)();
// ─── Public endpoints (rate-limited) ───────────────────────────────
// GET /api/pricing/calculate?roomId=X&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
router.get('/calculate', rate_limit_middleware_1.publicRateLimiter, pricing_controller_1.calculatePrice);
// POST /api/pricing/check-availability { roomId, checkIn, checkOut }
router.post('/check-availability', rate_limit_middleware_1.publicRateLimiter, pricing_controller_1.checkAvailability);
// ─── Protected endpoints ───────────────────────────────────────────
// GET /api/pricing/:roomId?startDate=...&endDate=...
router.get('/:roomId', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('room.edit'), pricing_controller_1.getRoomPrices);
// POST /api/pricing { roomId, date, price }
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('room.edit'), pricing_controller_1.upsertPrice);
// POST /api/pricing/bulk { roomId, entries: [{ date, price }] }
router.post('/bulk', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('room.edit'), pricing_controller_1.bulkUpsertPrices);
// DELETE /api/pricing/:id
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('room.edit'), pricing_controller_1.deletePrice);
exports.default = router;
