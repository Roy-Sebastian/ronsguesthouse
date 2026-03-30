import { Request, Response } from 'express';
import * as AmenitiesService from '../services/amenities.service';

export const getAll = async (req: Request, res: Response) => {
	try {
		res.json(await AmenitiesService.getAllAmenities());
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch amenities' });
	}
};

export const getById = async (req: Request, res: Response) => {
	try {
		const data = await AmenitiesService.getAmenityById(String(req.params.id));
		if (!data) return res.status(404).json({ error: 'Not found' });
		res.json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch amenity' });
	}
};

export const create = async (req: Request, res: Response) => {
	try {
		const data = await AmenitiesService.createAmenity(req.body);
		res.status(201).json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const update = async (req: Request, res: Response) => {
	try {
		const data = await AmenitiesService.updateAmenity(String(req.params.id), req.body);
		res.json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const remove = async (req: Request, res: Response) => {
	try {
		await AmenitiesService.deleteAmenity(String(req.params.id));
		res.json({ success: true });
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};
