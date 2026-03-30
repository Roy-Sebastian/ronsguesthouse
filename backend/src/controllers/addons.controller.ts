import { Request, Response } from 'express';

import * as AddOnsService from '../services/addons.service';

export const getAll = async (req: Request, res: Response) => {
	try {
		res.json(await AddOnsService.getAllAddOns());
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch add-ons' });
	}
};

export const getAvailable = async (req: Request, res: Response) => {
	try {
		// Currently same as getAll since there is no isActive field, 
		// but segregated strictly for business logic.
		res.json(await AddOnsService.getAllAddOns());
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch available add-ons' });
	}
};

export const create = async (req: Request, res: Response) => {
	try {
		const data = await AddOnsService.createAddOn(req.body);
		res.status(201).json(data);
	} catch (error: any) {
		const statusCode = (error as any).statusCode || 400;
		res.status(statusCode).json({ error: error.message || 'Failed to create add-on' });
	}
};

export const update = async (req: Request, res: Response) => {
	try {
		const data = await AddOnsService.updateAddOn(String(req.params.id), req.body);
		res.json(data);
	} catch (error: any) {
		const statusCode = (error as any).statusCode || 400;
		res.status(statusCode).json({ error: error.message || 'Failed to update add-on' });
	}
};

export const remove = async (req: Request, res: Response) => {
	try {
		await AddOnsService.deleteAddOn(String(req.params.id));
		res.json({ success: true });
	} catch (error: any) {
		res.status(400).json({ error: error.message || 'Failed to delete add-on' });
	}
};

