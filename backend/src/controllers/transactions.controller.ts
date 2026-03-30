import { Request, Response } from 'express';

import * as TransactionService from '../services/transaction.service';

export const getAll = async (req: Request, res: Response) => {
  try {
    const data = await TransactionService.getAllTransactions();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const data = await TransactionService.getTransactionById(String(req.params.id));
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const data = await TransactionService.createTransaction(req.body, req.user?.id);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const data = await TransactionService.updateTransaction(
      String(req.params.id),
      req.body,
      req.user?.id,
    );
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await TransactionService.deleteTransaction(String(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};