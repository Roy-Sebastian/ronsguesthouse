import { Request, Response } from 'express';

import * as ReviewsService from '../services/reviews.service';

// ─── Admin CRUD ────────────────────────────────────────────────────

export const getAll = async (req: Request, res: Response) => {
	try {
		const status = req.query.status as string | undefined;
		const where = status ? { status } : undefined;
		res.json(await ReviewsService.getAllReviews(where));
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

// ─── Public Endpoints ──────────────────────────────────────────────

/**
 * GET /api/public/reviews
 * Returns approved reviews for public homepage display.
 */
export const getApprovedReviews = async (_req: Request, res: Response) => {
	try {
		const reviews = await ReviewsService.getApprovedReviews();
		res.json(reviews);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch reviews' });
	}
};

/**
 * POST /api/public/reviews
 * Submit a review from a guest using their booking code + email.
 * Body: { bookingCode, email, rating, comment }
 */
export const submitPublicReview = async (req: Request, res: Response) => {
	try {
		const { bookingCode, email, rating, comment } = req.body;

		if (!bookingCode || !email || !rating || !comment) {
			return res.status(400).json({
				error: 'bookingCode, email, rating, dan comment wajib diisi',
			});
		}

		const review = await ReviewsService.submitPublicReview(
			String(bookingCode),
			String(email),
			Number(rating),
			String(comment),
		);

		res.status(201).json({
			success: true,
			message: 'Ulasan berhasil dikirim! Ulasan Anda akan ditinjau terlebih dahulu oleh admin.',
			review: { id: review.id, rating: review.rating, status: review.status },
		});
	} catch (error: any) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({ error: error.message || 'Gagal mengirim ulasan' });
	}
};
