import { expenseRepository } from '../repositories/expense.repository';

export async function getAllExpenses(filter?: string) {
  const now = new Date();
  let whereClause: any = {};

  if (filter === 'day') {
    const start = new Date(now.setHours(0, 0, 0, 0));
    whereClause = { createdAt: { gte: start } };
  } else if (filter === 'week') {
    const start = new Date(now.setDate(now.getDate() - now.getDay()));
    start.setHours(0, 0, 0, 0);
    whereClause = { createdAt: { gte: start } };
  } else if (filter === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    whereClause = { createdAt: { gte: start } };
  } else if (filter === 'year') {
    const start = new Date(now.getFullYear(), 0, 1);
    whereClause = { createdAt: { gte: start } };
  }

  return expenseRepository.findAll({
    where: whereClause,
    include: { user: { select: { name: true, role: true } } },
  });
}

export async function getExpenseById(id: string) {
  return expenseRepository.findById(id);
}

export async function createExpense(body: any, userId?: string) {
  const data = { ...body };
  if (userId) data.userId = userId;
  return expenseRepository.create({ data });
}

export async function updateExpense(id: string, data: any) {
  return expenseRepository.update(id, { data });
}

export async function deleteExpense(id: string) {
  await expenseRepository.delete(id);
}
