"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.create = exports.getById = exports.getAll = void 0;
const TransactionService = __importStar(require("../services/transaction.service"));
const getAll = async (req, res) => {
    try {
        const data = await TransactionService.getAllTransactions();
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};
exports.getAll = getAll;
const getById = async (req, res) => {
    try {
        const data = await TransactionService.getTransactionById(String(req.params.id));
        if (!data)
            return res.status(404).json({ error: 'Not found' });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch transaction' });
    }
};
exports.getById = getById;
const create = async (req, res) => {
    try {
        const data = await TransactionService.createTransaction(req.body, req.user?.id);
        res.status(201).json(data);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.create = create;
const update = async (req, res) => {
    try {
        const data = await TransactionService.updateTransaction(String(req.params.id), req.body, req.user?.id);
        res.json(data);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.update = update;
const remove = async (req, res) => {
    try {
        await TransactionService.deleteTransaction(String(req.params.id));
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.remove = remove;
