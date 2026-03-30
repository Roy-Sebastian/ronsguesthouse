import { Request, Response } from 'express';

import * as IncomesService from '../services/incomes.service';

export const getAll = async (req: Request, res: Response) => {
	try {
		const filter = String(req.query.filter || '');
		const search = String(req.query.search || '').trim();
		res.json(await IncomesService.getAllIncomes(filter, search));
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch incomes' });
	}
};

export const getById = async (req: Request, res: Response) => {
	try {
		const data = await IncomesService.getIncomeById(String(req.params.id));
		if (!data) return res.status(404).json({ error: 'Not found' });
		res.json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch income' });
	}
};

export const create = async (req: Request, res: Response) => {
	try {
		const data = await IncomesService.createIncome(req.body, req.user?.id);
		res.status(201).json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const update = async (req: Request, res: Response) => {
	try {
		const data = await IncomesService.updateIncome(String(req.params.id), req.body);
		res.json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const remove = async (req: Request, res: Response) => {
	try {
		await IncomesService.deleteIncome(String(req.params.id));
		res.json({ success: true });
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

