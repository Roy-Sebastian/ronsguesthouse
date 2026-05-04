"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllExpenses = getAllExpenses;
exports.getExpenseById = getExpenseById;
exports.createExpense = createExpense;
exports.updateExpense = updateExpense;
exports.deleteExpense = deleteExpense;
const expense_repository_1 = require("../repositories/expense.repository");
async function getAllExpenses(filter, search, dateStart, dateEnd) {
    const now = new Date();
    let whereClause = {};
    if (filter === 'day') {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        whereClause = { expenseDate: { gte: start } };
    }
    else if (filter === 'week') {
        const start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        whereClause = { expenseDate: { gte: start } };
    }
    else if (filter === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause = { expenseDate: { gte: start } };
    }
    else if (filter === 'year') {
        const start = new Date(now.getFullYear(), 0, 1);
        whereClause = { expenseDate: { gte: start } };
    }
    if (dateStart || dateEnd) {
        const rangeFilter = {};
        if (dateStart)
            rangeFilter.gte = new Date(dateStart + 'T00:00:00');
        if (dateEnd)
            rangeFilter.lte = new Date(dateEnd + 'T23:59:59');
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
    return expense_repository_1.expenseRepository.findAll({
        where: whereClause,
        include: { user: { select: { name: true, role: true } } },
    });
}
async function getExpenseById(id) {
    return expense_repository_1.expenseRepository.findById(id);
}
function validateExpenseAmount(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
        throw Object.assign(new Error('Jumlah pengeluaran harus angka lebih dari 0'), { statusCode: 400 });
    }
    return n;
}
async function createExpense(body, userId) {
    validateExpenseAmount(body?.amount);
    const data = { ...body };
    if (userId)
        data.userId = userId;
    return expense_repository_1.expenseRepository.create({ data });
}
async function updateExpense(id, data) {
    if (data?.amount !== undefined)
        validateExpenseAmount(data.amount);
    return expense_repository_1.expenseRepository.update(id, { data });
}
async function deleteExpense(id) {
    await expense_repository_1.expenseRepository.delete(id);
}
