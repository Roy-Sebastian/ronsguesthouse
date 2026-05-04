"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const addons_controller_1 = require("../controllers/addons.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Admin/Superadmin only (Master Data)
router.get('/master', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('addon.view'), addons_controller_1.getAll);
router.post('/master', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('addon.manage'), addons_controller_1.create);
router.patch('/master/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('addon.manage'), addons_controller_1.update);
router.delete('/master/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('addon.manage'), addons_controller_1.remove);
// Receptionist / Anyone with stay.edit (Available Add-Ons for Booking)
router.get('/available', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)(['addon.view', 'stay.edit']), addons_controller_1.getAvailable);
exports.default = router;
