import { Request, Response } from 'express';

import * as StaysService from '../services/stays.service';

export const getAll = async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		const search = req.query.search as string;
		const status = req.query.status as string;
		const dateStart = req.query.dateStart as string | undefined;
		const dateEnd = req.query.dateEnd as string | undefined;

		res.json(await StaysService.getAllStays(page, limit, search, status, dateStart, dateEnd));
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch stays' });
	}
};

export const getById = async (req: Request, res: Response) => {
	try {
		const data = await StaysService.getStayById(String(req.params.id));
		if (!data) return res.status(404).json({ error: 'Not found' });
		res.json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch stay' });
	}
};

export const create = async (req: Request, res: Response) => {
	try {
		const { reservationId, notes } = req.body;
		const data = await StaysService.createStay(String(reservationId), notes);
		res.status(201).json(data);
	} catch (error: any) {
		const statusCode = (error as any).statusCode || 400;
		res.status(statusCode).json({ error: error.message });
	}
};

export const update = async (req: Request, res: Response) => {
	try {
		const data = await StaysService.updateStay(String(req.params.id), req.body);
		res.json(data);
	} catch (error: any) {
		const statusCode = (error as any).statusCode || 400;
		res.status(statusCode).json({ error: error.message });
	}
};

export const remove = async (req: Request, res: Response) => {
	try {
		await StaysService.deleteStay(String(req.params.id));
		res.json({ success: true });
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};
