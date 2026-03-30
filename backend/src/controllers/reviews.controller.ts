import { Request, Response } from 'express';

import * as ReviewsService from '../services/reviews.service';

export const getAll = async (req: Request, res: Response) => {
	try {
		res.json(await ReviewsService.getAllReviews());
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch reviews' });
	}
};

export const getById = async (req: Request, res: Response) => {
	try {
		const data = await ReviewsService.getReviewById(String(req.params.id));
		if (!data) return res.status(404).json({ error: 'Not found' });
		res.json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch review' });
	}
};

export const create = async (req: Request, res: Response) => {
	try {
		const data = await ReviewsService.createReview(req.body);
		res.status(201).json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const update = async (req: Request, res: Response) => {
	try {
		const data = await ReviewsService.updateReview(String(req.params.id), req.body);
		res.json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const remove = async (req: Request, res: Response) => {
	try {
		await ReviewsService.deleteReview(String(req.params.id));
		res.json({ success: true });
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

