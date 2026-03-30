"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransaction = exports.getTransactions = exports.deleteItem = exports.updateItem = exports.createItem = exports.getItems = void 0;
const prisma_1 = require("../lib/prisma");
const getItems = async (req, res) => {
    try {
        const data = await prisma_1.prisma.koperasiItem.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch items' });
    }
};
exports.getItems = getItems;
const createItem = async (req, res) => {
    try {
        const { name, category, price, stock, description } = req.body;
        const data = await prisma_1.prisma.koperasiItem.create({
            data: {
                name,
                category,
                price,
                stock,
                description,
            },
        });
        res.status(201).json(data);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to create item' });
    }
};
exports.createItem = createItem;
const updateItem = async (req, res) => {
    try {
        const data = await prisma_1.prisma.koperasiItem.update({
            where: { id: String(req.params.id) },
            data: req.body,
        });
        res.json(data);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to update item' });
    }
};
exports.updateItem = updateItem;
const deleteItem = async (req, res) => {
    try {
        await prisma_1.prisma.koperasiItem.delete({
            where: { id: String(req.params.id) },
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to delete item' });
    }
};
exports.deleteItem = deleteItem;
const getTransactions = async (req, res) => {
    try {
        const data = await prisma_1.prisma.koperasiTransaction.findMany({
            include: {
                item: true,
                user: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};
exports.getTransactions = getTransactions;
const createTransaction = async (req, res) => {
    try {
        const { itemId, quantity, type } = req.body;
        // Type is "sale" or "restock"
        const item = await prisma_1.prisma.koperasiItem.findUnique({ where: { id: itemId } });
        if (!item)
            return res.status(404).json({ error: 'Item not found' });
        let newStock = item.stock;
        if (type === 'sale') {
            newStock -= Number(quantity);
        }
        else if (type === 'restock') {
            newStock += Number(quantity);
        }
        if (newStock < 0) {
            return res.status(400).json({ error: 'Not enough stock' });
        }
        const totalPrice = Number(quantity) * Number(item.price);
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // Update stock
            await tx.koperasiItem.update({
                where: { id: itemId },
                data: { stock: newStock },
            });
            // Record transaction
            const txn = await tx.koperasiTransaction.create({
                data: {
                    itemId,
                    quantity: Number(quantity),
                    totalPrice,
                    type,
                    userId: req.user?.id || (await tx.user.findFirst())?.id, // Fallback if no user
                },
            });
            // If sale, automatically record as Income
            if (type === 'sale') {
                const userId = req.user?.id || (await tx.user.findFirst())?.id;
                await tx.income.create({
                    data: {
                        amount: totalPrice,
                        description: `Penjualan Koperasi: ${item.name} (${quantity}x)`,
                        userId: userId,
                        incomeDate: new Date(),
                    },
                });
            }
            return txn;
        });
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.createTransaction = createTransaction;
