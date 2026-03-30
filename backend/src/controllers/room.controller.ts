import { Request, Response } from 'express';
import * as RoomsService from '../services/rooms.service';
import type { CreateRoomInput } from '../services/rooms.service';

export const getRooms = async (req: Request, res: Response) => {
	try {
		const status = req.query.status as string | undefined;
		const type = req.query.type as string | undefined;
		const checkIn = req.query.checkIn as string | undefined;
		const checkOut = req.query.checkOut as string | undefined;
		
		res.json(await RoomsService.getRooms(status, type, checkIn, checkOut));
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch rooms' });
	}
};

export const createRoom = async (req: Request, res: Response) => {
	try {
		const room = await RoomsService.createRoom(req.body as CreateRoomInput);
		res.status(201).json(room);
	} catch (error: any) {
		const statusCode = (error as any).statusCode || 400;
		res.status(statusCode).json({ error: error.message || 'Failed to create room' });
	}
};

export const getRoomById = async (req: Request, res: Response) => {
	try {
		const room = await RoomsService.getRoomById(String(req.params.id));
		if (!room) return res.status(404).json({ error: 'Room not found' });
		res.json(room);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch room' });
	}
};

export const updateRoom = async (req: Request, res: Response) => {
	try {
		const room = await RoomsService.updateRoom(String(req.params.id), req.body);
		res.json(room);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to update room' });
	}
};

export const deleteRoom = async (req: Request, res: Response) => {
	try {
		await RoomsService.deleteRoom(String(req.params.id));
		res.json({ success: true });
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to delete room' });
	}
};

