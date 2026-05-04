import { Request, Response } from 'express';

import * as ExpensesService from '../services/expenses.service';

export const getAll = async (req: Request, res: Response) => {
	try {
		const filter = String(req.query.filter || '');
		const search = req.query.search as string | undefined;
		const dateStart = req.query.dateStart as string | undefined;
		const dateEnd = req.query.dateEnd as string | undefined;
		res.json(await ExpensesService.getAllExpenses(filter, search, dateStart, dateEnd));
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch expenses' });
	}
};

export const getById = async (req: Request, res: Response) => {
	try {
		const data = await ExpensesService.getExpenseById(String(req.params.id));
		if (!data) return res.status(404).json({ error: 'Not found' });
		res.json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch expense' });
	}
};

export const create = async (req: Request, res: Response) => {
	try {
		const data = await ExpensesService.createExpense(req.body, req.user?.id);
		res.status(201).json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const update = async (req: Request, res: Response) => {
	try {
		const data = await ExpensesService.updateExpense(String(req.params.id), req.body);
		res.json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const remove = async (req: Request, res: Response) => {
	try {
		await ExpensesService.deleteExpense(String(req.params.id));
		res.json({ success: true });
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};
