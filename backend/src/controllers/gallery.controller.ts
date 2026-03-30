import { Request, Response } from 'express';

import * as GalleryService from '../services/gallery.service';

export const getAll = async (req: Request, res: Response) => {
	try {
		const filters: any = {};
		if (req.query.category) filters.category = String(req.query.category);
		if (req.query.isActive) filters.isActive = req.query.isActive === 'true';

		res.json(await GalleryService.getAllGallery(filters));
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch gallery' });
	}
};

export const getById = async (req: Request, res: Response) => {
	try {
		const data = await GalleryService.getGalleryById(String(req.params.id));
		if (!data) return res.status(404).json({ error: 'Not found' });
		res.json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch gallery item' });
	}
};

export const create = async (req: Request, res: Response) => {
	try {
        if (!req.file) throw new Error('No image file uploaded');
        const imageUrl = `/uploads/${req.file.filename}`;
		const data = await GalleryService.createGallery({
            category: req.body.category,
            imageUrl
        });
		res.status(201).json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const update = async (req: Request, res: Response) => {
	try {
        const payload: any = {};
        if (req.body.category) payload.category = req.body.category;
        
        if (req.file) {
            payload.imageUrl = `/uploads/${req.file.filename}`;
        }
		const data = await GalleryService.updateGallery(String(req.params.id), payload);
		res.json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const remove = async (req: Request, res: Response) => {
	try {
		await GalleryService.deleteGallery(String(req.params.id));
		res.json({ success: true });
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};
