import { Request, Response } from 'express';

import * as AuditLogsService from '../services/audit-logs.service';

export const getAll = async (req: Request, res: Response) => {
	try {
		res.json(await AuditLogsService.getAllAuditLogs());
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch audit-logs' });
	}
};

export const getById = async (req: Request, res: Response) => {
	try {
		const data = await AuditLogsService.getAuditLogById(String(req.params.id));
		if (!data) return res.status(404).json({ error: 'Not found' });
		res.json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch auditlog' });
	}
};

export const create = async (req: Request, res: Response) => {
	try {
		const data = await AuditLogsService.createAuditLog(req.body);
		res.status(201).json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const update = async (req: Request, res: Response) => {
	try {
		const data = await AuditLogsService.updateAuditLog(String(req.params.id), req.body);
		res.json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const remove = async (req: Request, res: Response) => {
	try {
		await AuditLogsService.deleteAuditLog(String(req.params.id));
		res.json({ success: true });
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};