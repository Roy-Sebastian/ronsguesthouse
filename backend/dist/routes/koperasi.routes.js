"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const koperasi_controller_1 = require("../controllers/koperasi.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const auditLog_middleware_1 = require("../middlewares/auditLog.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
// Items
router.get('/items', koperasi_controller_1.getItems);
router.post('/items', auditLog_middleware_1.auditLogMiddleware, koperasi_controller_1.createItem);
router.put('/items/:id', auditLog_middleware_1.auditLogMiddleware, koperasi_controller_1.updateItem);
router.delete('/items/:id', auditLog_middleware_1.auditLogMiddleware, koperasi_controller_1.deleteItem);
// Transactions
router.get('/transactions', koperasi_controller_1.getTransactions);
router.post('/transactions', auditLog_middleware_1.auditLogMiddleware, koperasi_controller_1.createTransaction);
exports.default = router;
