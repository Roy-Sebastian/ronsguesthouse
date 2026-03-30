"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllIncomes = getAllIncomes;
exports.getIncomeById = getIncomeById;
exports.createIncome = createIncome;
exports.updateIncome = updateIncome;
exports.deleteIncome = deleteIncome;
const income_repository_1 = require("../repositories/income.repository");
async function getAllIncomes(filter, search) {
    const now = new Date();
    let whereClause = {};
    if (filter === 'day') {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        whereClause = { incomeDate: { gte: start } };
    }
    else if (filter === 'week') {
        const start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        whereClause = { incomeDate: { gte: start } };
    }
    else if (filter === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause = { incomeDate: { gte: start } };
    }
    else if (filter === 'year') {
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
    return income_repository_1.incomeRepository.findAll({
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
async function getIncomeById(id) {
    return income_repository_1.incomeRepository.findById(id, {
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
async function createIncome(data, userId) {
    return income_repository_1.incomeRepository.create({ data: { ...data, userId: userId ?? data.userId } });
}
async function updateIncome(id, data) {
    return income_repository_1.incomeRepository.update(id, { data });
}
async function deleteIncome(id) {
    await income_repository_1.incomeRepository.delete(id);
}
