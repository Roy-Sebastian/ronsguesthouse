import { expenseRepository } from '../repositories/expense.repository';

export async function getAllExpenses(filter?: string, search?: string, dateStart?: string, dateEnd?: string) {
  const now = new Date();
  let whereClause: any = {};

  if (filter === 'day') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    whereClause = { expenseDate: { gte: start } };
  } else if (filter === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    whereClause = { expenseDate: { gte: start } };
  } else if (filter === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    whereClause = { expenseDate: { gte: start } };
  } else if (filter === 'year') {
    const start = new Date(now.getFullYear(), 0, 1);
    whereClause = { expenseDate: { gte: start } };
  }

  if (dateStart || dateEnd) {
    const rangeFilter: any = {};
    if (dateStart) rangeFilter.gte = new Date(dateStart + 'T00:00:00');
    if (dateEnd)   rangeFilter.lte = new Date(dateEnd   + 'T23:59:59');
    whereClause = { ...whereClause, expenseDate: rangeFilter };
  }

  if (search) {
    whereClause = {
      ...whereClause,
      OR: [
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  return expenseRepository.findAll({
    where: whereClause,
    include: { user: { select: { name: true, role: true } } },
  });
}

export async function getExpenseById(id: string) {
  return expenseRepository.findById(id);
}

function validateExpenseAmount(amount: any) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    throw Object.assign(new Error('Jumlah pengeluaran harus angka lebih dari 0'), { statusCode: 400 });
  }
  return n;
}

export async function createExpense(body: any, userId?: string) {
  validateExpenseAmount(body?.amount);
  const data = { ...body };
  if (userId) data.userId = userId;
  return expenseRepository.create({ data });
}

export async function updateExpense(id: string, data: any) {
  if (data?.amount !== undefined) validateExpenseAmount(data.amount);
  return expenseRepository.update(id, { data });
}

export async function deleteExpense(id: string) {
  await expenseRepository.delete(id);
}
