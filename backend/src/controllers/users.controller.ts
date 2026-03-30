import { Request, Response } from 'express';
import * as UsersService from '../services/users.service';
import type { RequesterContext } from '../services/users.service';

export const getAll = async (req: Request, res: Response) => {
	try {
		const search = String(req.query.search || '').trim();
		res.json(await UsersService.getAllUsers(search || undefined));
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch users' });
	}
};

export const getById = async (req: Request, res: Response) => {
	try {
		const data = await UsersService.getUserById(String(req.params.id));
		if (!data) return res.status(404).json({ error: 'Not found' });
		res.json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch user' });
	}
};

export const create = async (req: Request, res: Response) => {
	try {
		const ctx: RequesterContext = { role: req.user?.role, permissions: req.user?.permissions };
		const data = await UsersService.createUser(req.body, ctx);
		res.status(201).json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const update = async (req: Request, res: Response) => {
	try {
		const ctx: RequesterContext = { role: req.user?.role, permissions: req.user?.permissions };
		const data = await UsersService.updateUser(String(req.params.id), req.body, ctx);
		res.json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const remove = async (req: Request, res: Response) => {
	try {
		await UsersService.deleteUser(String(req.params.id));
		res.json({ success: true });
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};