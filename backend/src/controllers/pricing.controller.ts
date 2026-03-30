import { Request, Response } from 'express';

import * as PricingService from '../services/pricing.service';

export const calculatePrice = async (req: Request, res: Response) => {
  try {
    const { roomId, checkIn, checkOut } = req.query;
    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'roomId, checkIn, and checkOut are required' });
    }

    const result = await PricingService.calculateBookingPrice(
      String(roomId),
      new Date(String(checkIn)),
      new Date(String(checkOut)),
    );
    res.json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || 'Failed to calculate price' });
  }
};

export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const { roomId, checkIn, checkOut } = req.body;
    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'roomId, checkIn, and checkOut are required' });
    }

    await PricingService.validateBookingInput(
      String(roomId),
      new Date(String(checkIn)),
      new Date(String(checkOut)),
    );

    const result = await PricingService.checkRoomAvailability(
      String(roomId),
      new Date(String(checkIn)),
      new Date(String(checkOut)),
    );
    res.json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || 'Failed to check availability' });
  }
};

export const getRoomPrices = async (req: Request, res: Response) => {
  try {
    const roomId = String(req.params.roomId);
    const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
    const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;
    const result = await PricingService.getRoomPrices(roomId, startDate, endDate);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch room prices' });
  }
};

export const upsertPrice = async (req: Request, res: Response) => {
  try {
    const { roomId, date, price } = req.body;
    if (!roomId || !date || price === undefined) {
      return res.status(400).json({ error: 'roomId, date, and price are required' });
    }
    const result = await PricingService.upsertRoomPrice(String(roomId), new Date(String(date)), Number(price));
    res.json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || 'Failed to upsert price' });
  }
};

export const bulkUpsertPrices = async (req: Request, res: Response) => {
  try {
    const { roomId, entries } = req.body;
    if (!roomId || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'roomId and entries[] are required' });
    }
    const result = await PricingService.bulkUpsertRoomPrices(String(roomId), entries);
    res.json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || 'Failed to bulk upsert prices' });
  }
};

export const deletePrice = async (req: Request, res: Response) => {
  try {
    await PricingService.deleteRoomPrice(String(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete price' });
  }
};
