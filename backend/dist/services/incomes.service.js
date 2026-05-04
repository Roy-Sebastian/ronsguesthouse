"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllIncomes = getAllIncomes;
exports.getIncomeById = getIncomeById;
exports.createIncome = createIncome;
exports.updateIncome = updateIncome;
exports.deleteIncome = deleteIncome;
const income_repository_1 = require("../repositories/income.repository");
async function getAllIncomes(filter, search, dateStart, dateEnd) {
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
    // Explicit date range overrides preset filter if both supplied
    if (dateStart || dateEnd) {
        const rangeFilter = {};
        if (dateStart)
            rangeFilter.gte = new Date(dateStart + 'T00:00:00');
        if (dateEnd)
            rangeFilter.lte = new Date(dateEnd + 'T23:59:59');
        whereClause = { ...whereClause, incomeDate: rangeFilter };
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
function validateIncomeAmount(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
        throw Object.assign(new Error('Jumlah pendapatan harus angka lebih dari 0'), { statusCode: 400 });
    }
    return n;
}
async function createIncome(data, userId) {
    validateIncomeAmount(data?.amount);
    return income_repository_1.incomeRepository.create({ data: { ...data, userId: userId ?? data.userId } });
}
async function updateIncome(id, data) {
    if (data?.amount !== undefined)
        validateIncomeAmount(data.amount);
    return income_repository_1.incomeRepository.update(id, { data });
}
async function deleteIncome(id) {
    await income_repository_1.incomeRepository.delete(id);
}
