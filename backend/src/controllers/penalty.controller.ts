import { Request, Response } from 'express';

import * as PenaltyService from '../services/penalty.service';

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const reservationId = req.query.reservationId as string | undefined;

    res.json(await PenaltyService.getAllPenalties(page, limit, search, status, reservationId));
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch penalties' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const data = await PenaltyService.getPenaltyById(String(req.params.id));
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch penalty' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const data = await PenaltyService.createPenalty(req.body, userId);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const data = await PenaltyService.updatePenalty(String(req.params.id), req.body, userId);
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await PenaltyService.deletePenalty(String(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
};
