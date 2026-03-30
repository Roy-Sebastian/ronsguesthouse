"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const midtransController = __importStar(require("../controllers/midtrans.controller"));
const controller = __importStar(require("../controllers/transactions.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const router = (0, express_1.Router)();
router.post('/midtrans/charge', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('transaction.create'), midtransController.charge);
router.post('/midtrans/notification', midtransController.notification);
// POST /api/transactions/payment/snap-token — rate-limited, requires auth
router.post('/payment/snap-token', rate_limit_middleware_1.publicRateLimiter, auth_middleware_1.requireAuth, midtransController.createSnapToken);
// GET /api/transactions/payment/status/:order_id — requires auth
router.get('/payment/status/:order_id', auth_middleware_1.requireAuth, midtransController.checkPaymentStatus);
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('transaction.view'), controller.getAll);
router.get('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('transaction.view'), controller.getById);
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('transaction.create'), controller.create);
router.patch('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('transaction.edit'), controller.update);
router.put('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('transaction.edit'), controller.update);
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('transaction.delete'), controller.remove);
exports.default = router;
