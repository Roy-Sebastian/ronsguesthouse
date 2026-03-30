import { incomeRepository } from '../repositories/income.repository';

export async function getAllIncomes(filter?: string, search?: string) {
  const now = new Date();
  let whereClause: any = {};

  if (filter === 'day') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    whereClause = { incomeDate: { gte: start } };
  } else if (filter === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    whereClause = { incomeDate: { gte: start } };
  } else if (filter === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    whereClause = { incomeDate: { gte: start } };
  } else if (filter === 'year') {
    const start = new Date(now.getFullYear(), 0, 1);
    whereClause = { incomeDate: { gte: start } };
  }

  if (search) {
    whereClause = {
      ...whereClause,
      OR: [
        { description: { contains: search, mode: 'insensitive' } },
        { transactionId: { contains: search, mode: 'insensitive' } },
        { user: { is: { name: { contains: search, mode: 'insensitive' } } } },
      ],
    };
  }

  return incomeRepository.findAll({
    where: whereClause,
    orderBy: { incomeDate: 'desc' },
    include: {
      transaction: {
        include: {
          reservation: {
            include: {
              guest: { select: { fullName: true } },
              room: { select: { roomNumber: true } }
            }
          }
        }
      },
      user: { select: { name: true, role: true } }
    },
  });
}

export async function getIncomeById(id: string) {
  return incomeRepository.findById(id, {
    include: {
      transaction: {
        include: {
          reservation: {
            include: {
              guest: { select: { fullName: true } },
              room: { select: { roomNumber: true } }
            }
          }
        }
      }
    },
  });
}

export async function createIncome(data: any, userId?: string) {
  return incomeRepository.create({ data: { ...data, userId: userId ?? data.userId } });
}

export async function updateIncome(id: string, data: any) {
  return incomeRepository.update(id, { data });
}

export async function deleteIncome(id: string) {
  await incomeRepository.delete(id);
}
