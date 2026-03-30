import { Request, Response } from 'express';
import * as RolesService from '../services/roles.service';

export const getRoles = (req: Request, res: Response) => {
	try {
		res.json(RolesService.getRoles());
	} catch (err: any) {
		res.status(500).json({ error: err.message || 'Failed to read roles' });
	}
};

export const updateRoles = async (req: Request, res: Response) => {
	try {
		await RolesService.updateRoles(req.body);
		res.json({ success: true });
	} catch (err: any) {
		res.status(500).json({ error: err.message || 'Failed to update roles' });
	}
};

