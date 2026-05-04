import { Request, Response } from 'express';

import * as MessagesService from '../services/messages.service';

export const getAll = async (req: Request, res: Response) => {
	try {
		res.json(await MessagesService.getAllMessages());
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch messages' });
	}
};

export const getById = async (req: Request, res: Response) => {
	try {
		const data = await MessagesService.getMessageById(String(req.params.id));
		if (!data) return res.status(404).json({ error: 'Not found' });
		res.json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch message' });
	}
};

export const create = async (req: Request, res: Response) => {
	try {
		const data = await MessagesService.createMessage(req.body);
		res.status(201).json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const update = async (req: Request, res: Response) => {
	try {
		const data = await MessagesService.updateMessage(String(req.params.id), req.body);
		res.json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const remove = async (req: Request, res: Response) => {
	try {
		await MessagesService.deleteMessage(String(req.params.id));
		res.json({ success: true });
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const submitPublic = async (req: Request, res: Response) => {
	try {
		const data = await MessagesService.submitPublicMessage(req.body);
		res.status(201).json({ success: true, id: data.id });
	} catch (error: any) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).json({ error: error.message || 'Gagal mengirim pesan' });
	}
};
