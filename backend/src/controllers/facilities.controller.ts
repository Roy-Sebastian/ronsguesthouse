import { Request, Response } from 'express';

import * as FacilitiesService from '../services/facilities.service';

export const getAll = async (req: Request, res: Response) => {
	try {
		res.json(await FacilitiesService.getAllFacilities());
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch facilities' });
	}
};

export const getById = async (req: Request, res: Response) => {
	try {
		const data = await FacilitiesService.getFacilityById(String(req.params.id));
		if (!data) return res.status(404).json({ error: 'Not found' });
		res.json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch facility' });
	}
};

export const create = async (req: Request, res: Response) => {
	try {
		const data = await FacilitiesService.createFacility(req.body);
		res.status(201).json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const update = async (req: Request, res: Response) => {
	try {
		const data = await FacilitiesService.updateFacility(String(req.params.id), req.body);
		res.json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const remove = async (req: Request, res: Response) => {
	try {
		await FacilitiesService.deleteFacility(String(req.params.id));
		res.json({ success: true });
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};
