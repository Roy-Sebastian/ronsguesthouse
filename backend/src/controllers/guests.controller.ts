import { Request, Response } from 'express';
import * as GuestsService from '../services/guests.service';
import type { CreateGuestInput } from '../services/guests.service';

export const getAll = async (req: Request, res: Response) => {
	try {
		res.json(await GuestsService.getAllGuests());
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch guests' });
	}
};

export const getById = async (req: Request, res: Response) => {
	try {
		const data = await GuestsService.getGuestById(String(req.params.id));
		if (!data) return res.status(404).json({ error: 'Not found' });
		res.json(data);
	} catch (error: any) {
		res.status(500).json({ error: error.message || 'Failed to fetch guest' });
	}
};

export const create = async (req: Request, res: Response) => {
	try {
		const result = await GuestsService.createGuest(req.body as CreateGuestInput);
		res.status(201).json(result);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const update = async (req: Request, res: Response) => {
	try {
		const data = await GuestsService.updateGuest(String(req.params.id), req.body);
		res.json(data);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const remove = async (req: Request, res: Response) => {
	try {
		await GuestsService.deleteGuest(String(req.params.id));
		res.json({ success: true });
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

import { encryptKtp, hashKtp, decryptKtp } from '../utils/crypto.util';
import { logger } from '../config/logger';

export const updateIdentity = async (req: Request, res: Response) => {
	try {
        const { idNumber } = req.body;
        if (!idNumber) return res.status(400).json({ error: 'KTP/ID Number is required' });
        
        const guestId = String(req.params.id);
        const encrypted = encryptKtp(idNumber);
        const hashed = hashKtp(idNumber);

        const data = await GuestsService.updateGuest(guestId, {
            idNumberEncrypted: encrypted,
            idNumberHash: hashed
        });

        logger.info('Admin updated guest identity details', { 
            guestId, 
            adminId: req.user?.id || 'unknown-admin',
            timestamp: new Date().toISOString()
        });

        // Omit encrypted payload from response for security
        const sanitizedData = { ...data } as any;
        delete sanitizedData.idNumberEncrypted;
        delete sanitizedData.idNumberHash;

		res.json(sanitizedData);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const revealIdentity = async (req: Request, res: Response) => {
    try {
        const guestId = String(req.params.id);
        const guest = await GuestsService.getGuestById(guestId);
        
        if (!guest) return res.status(404).json({ error: 'Guest not found' });
        if (!guest.idNumberEncrypted) return res.status(404).json({ error: 'No identity data stored for this guest' });

        const rawKtp = decryptKtp(guest.idNumberEncrypted);

        logger.warn('SECURE AUDIT: Admin revealed guest identity details', { 
            guestId, 
            adminId: req.user?.id || 'unknown-admin',
            timestamp: new Date().toISOString()
        });

        res.json({ idNumber: rawKtp });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to reveal identity' });
    }
};
