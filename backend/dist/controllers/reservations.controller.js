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
exports.removeAddOn = exports.addAddOn = exports.remove = exports.update = exports.create = exports.getById = exports.getAll = exports.getReminders = void 0;
const ReservationService = __importStar(require("../services/reservation.service"));
const getReminders = async (req, res, next) => {
    try {
        const data = await ReservationService.getReminders();
        res.json(data);
    }
    catch (error) {
        next(error);
    }
};
exports.getReminders = getReminders;
const getAll = async (req, res, next) => {
    try {
        const data = await ReservationService.getAll();
        res.json(data);
    }
    catch (error) {
        next(error);
    }
};
exports.getAll = getAll;
const getById = async (req, res, next) => {
    try {
        const data = await ReservationService.getById(String(req.params.id));
        if (!data)
            return res.status(404).json({ error: 'Not found' });
        res.json(data);
    }
    catch (error) {
        next(error);
    }
};
exports.getById = getById;
const create = async (req, res, next) => {
    try {
        const requestUserId = req.user?.id;
        const socketSource = req.user?.role === 'guest' || req.body?.channel === 'online'
            ? 'online'
            : 'internal';
        const data = await ReservationService.createReservation(req.body, requestUserId, socketSource);
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
};
exports.create = create;
const update = async (req, res, next) => {
    try {
        const data = await ReservationService.updateReservation(String(req.params.id), req.body);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
};
exports.update = update;
const remove = async (req, res, next) => {
    try {
        const data = await ReservationService.deleteReservation(String(req.params.id));
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.remove = remove;
const addAddOn = async (req, res, next) => {
    try {
        const reservationId = String(req.params.id || '');
        const qty = Number(req.body?.quantity || 1);
        const addOnId = String(req.body?.addOnId || '');
        const notes = String(req.body?.notes || '').trim();
        if (!reservationId)
            return res.status(400).json({ error: 'reservation id is required' });
        if (!addOnId)
            return res.status(400).json({ error: 'addOnId is required' });
        if (!Number.isFinite(qty) || qty <= 0)
            return res.status(400).json({ error: 'quantity must be greater than 0' });
        const result = await ReservationService.addReservationAddOn({
            reservationId,
            addOnId,
            quantity: qty,
            notes,
            userId: req.user?.id || null,
        });
        res.json(result.bookingAddOn);
    }
    catch (error) {
        next(error);
    }
};
exports.addAddOn = addAddOn;
const removeAddOn = async (req, res, next) => {
    try {
        const reservationId = String(req.params.id || '');
        const bookingAddOnId = String(req.params.addonId || '');
        if (!reservationId || !bookingAddOnId) {
            return res.status(400).json({ error: 'reservationId dan addonId diperlukan' });
        }
        await ReservationService.removeReservationAddOn(reservationId, bookingAddOnId, req.user?.id || null);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
};
exports.removeAddOn = removeAddOn;
