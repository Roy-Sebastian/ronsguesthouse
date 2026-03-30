"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const room_controller_1 = require("../controllers/room.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/rooms - Public + Staff
router.get('/', room_controller_1.getRooms);
// GET /api/rooms/:id - Public + Staff
router.get('/:id', room_controller_1.getRoomById);
// POST /api/rooms - Admin only
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('room.create'), room_controller_1.createRoom);
router.patch('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('room.edit'), room_controller_1.updateRoom);
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('room.delete'), room_controller_1.deleteRoom);
exports.default = router;
