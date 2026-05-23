import { Request, Response, NextFunction } from 'express';

import * as ReservationService from '../services/reservation.service';

export const getReminders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await ReservationService.getReminders();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getRecent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const since = req.query.since ? new Date(String(req.query.since)) : new Date(Date.now() - 60_000);
    const data = await ReservationService.getRecent(since);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await ReservationService.getAll();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await ReservationService.getById(String(req.params.id));
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUserId = req.user?.id;
    const socketSource =
      req.user?.role === 'guest' || req.body?.channel === 'online'
        ? 'online'
        : 'internal';
    const data = await ReservationService.createReservation(req.body, requestUserId, socketSource);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await ReservationService.updateReservation(String(req.params.id), req.body, req.user?.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await ReservationService.deleteReservation(String(req.params.id));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
export const addAddOn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservationId = String(req.params.id || '');
    const qty = Number(req.body?.quantity || 1);
    const addOnId = String(req.body?.addOnId || '');
    const notes = String(req.body?.notes || '').trim();
    if (!reservationId) return res.status(400).json({ error: 'reservation id is required' });
    if (!addOnId) return res.status(400).json({ error: 'addOnId is required' });
    if (!Number.isFinite(qty) || qty <= 0)
      return res.status(400).json({ error: 'quantity must be greater than 0' });

    const result = await ReservationService.addReservationAddOn({
      reservationId,
      addOnId,
      quantity: qty,
      notes,
      userId: req.user?.id || null,
    });
    res.json(result.bookingAddOn);
  } catch (error) {
    next(error);
  }
};

export const removeAddOn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservationId = String(req.params.id || '');
    const bookingAddOnId = String(req.params.addonId || '');
    if (!reservationId || !bookingAddOnId) {
      return res.status(400).json({ error: 'reservationId dan addonId diperlukan' });
    }
    
    await ReservationService.removeReservationAddOn(
      reservationId, 
      bookingAddOnId, 
      req.user?.id || null
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getBadgeCounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await ReservationService.getBadgeCounts();
    res.json(data);
  } catch (error) {
    next(error);
  }
};