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
const StaysService = __importStar(require("../services/stays.service"));
const getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const status = req.query.status;
        res.json(await StaysService.getAllStays(page, limit, search, status));
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch stays' });
    }
};
exports.getAll = getAll;
const getById = async (req, res) => {
    try {
        const data = await StaysService.getStayById(String(req.params.id));
        if (!data)
            return res.status(404).json({ error: 'Not found' });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch stay' });
    }
};
exports.getById = getById;
const create = async (req, res) => {
    try {
        const { reservationId, notes } = req.body;
        const data = await StaysService.createStay(String(reservationId), notes);
        res.status(201).json(data);
    }
    catch (error) {
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ error: error.message });
    }
};
exports.create = create;
const update = async (req, res) => {
    try {
        const data = await StaysService.updateStay(String(req.params.id), req.body);
        res.json(data);
    }
    catch (error) {
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ error: error.message });
    }
};
exports.update = update;
const remove = async (req, res) => {
    try {
        await StaysService.deleteStay(String(req.params.id));
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.remove = remove;
