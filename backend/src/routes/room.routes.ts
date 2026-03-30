import { Router } from 'express';

import {
  createRoom,
  deleteRoom,
  getRoomById,
  getRooms,
  updateRoom,
} from '../controllers/room.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/rooms - Public + Staff
router.get('/', getRooms);

// GET /api/rooms/:id - Public + Staff
router.get('/:id', getRoomById);

// POST /api/rooms - Admin only
router.post('/', requireAuth, requirePermission('room.create'), createRoom);

router.patch(
  '/:id',
  requireAuth,
  requirePermission('room.edit'),
  updateRoom,
);
router.delete(
  '/:id',
  requireAuth,
  requirePermission('room.delete'),
  deleteRoom,
);

export default router;
