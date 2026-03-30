"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllExpenses = getAllExpenses;
exports.getExpenseById = getExpenseById;
exports.createExpense = createExpense;
exports.updateExpense = updateExpense;
exports.deleteExpense = deleteExpense;
const expense_repository_1 = require("../repositories/expense.repository");
async function getAllExpenses(filter) {
    const now = new Date();
    let whereClause = {};
    if (filter === 'day') {
        const start = new Date(now.setHours(0, 0, 0, 0));
        whereClause = { createdAt: { gte: start } };
    }
    else if (filter === 'week') {
        const start = new Date(now.setDate(now.getDate() - now.getDay()));
        start.setHours(0, 0, 0, 0);
        whereClause = { createdAt: { gte: start } };
    }
    else if (filter === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause = { createdAt: { gte: start } };
    }
    else if (filter === 'year') {
        const start = new Date(now.getFullYear(), 0, 1);
        whereClause = { createdAt: { gte: start } };
    }
    return expense_repository_1.expenseRepository.findAll({
        where: whereClause,
        include: { user: { select: { name: true, role: true } } },
    });
}
async function getExpenseById(id) {
    return expense_repository_1.expenseRepository.findById(id);
}
async function createExpense(body, userId) {
    const data = { ...body };
    if (userId)
        data.userId = userId;
    return expense_repository_1.expenseRepository.create({ data });
}
async function updateExpense(id, data) {
    return expense_repository_1.expenseRepository.update(id, { data });
}
async function deleteExpense(id) {
    await expense_repository_1.expenseRepository.delete(id);
}
