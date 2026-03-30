import { Request, Response } from 'express';

import * as DashboardService from '../services/dashboard.service';

export const getStats = async (req: Request, res: Response) => {
  try {
    const data = await DashboardService.getDashboardStats();
    res.json(data);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
