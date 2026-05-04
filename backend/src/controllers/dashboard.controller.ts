import { Request, Response } from 'express';

import * as DashboardService from '../services/dashboard.service';

export const getStats = async (req: Request, res: Response) => {
  try {
    const dateStart = req.query.dateStart ? String(req.query.dateStart) : undefined;
    const dateEnd   = req.query.dateEnd   ? String(req.query.dateEnd)   : undefined;
    const data = await DashboardService.getDashboardStats(dateStart, dateEnd);
    res.json(data);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
