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
exports.revealIdentity = exports.updateIdentity = exports.remove = exports.update = exports.create = exports.getById = exports.getAll = void 0;
const GuestsService = __importStar(require("../services/guests.service"));
const getAll = async (req, res) => {
    try {
        res.json(await GuestsService.getAllGuests());
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch guests' });
    }
};
exports.getAll = getAll;
const getById = async (req, res) => {
    try {
        const data = await GuestsService.getGuestById(String(req.params.id));
        if (!data)
            return res.status(404).json({ error: 'Not found' });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch guest' });
    }
};
exports.getById = getById;
const create = async (req, res) => {
    try {
        const result = await GuestsService.createGuest(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.create = create;
const update = async (req, res) => {
    try {
        const data = await GuestsService.updateGuest(String(req.params.id), req.body);
        res.json(data);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.update = update;
const remove = async (req, res) => {
    try {
        await GuestsService.deleteGuest(String(req.params.id));
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.remove = remove;
const crypto_util_1 = require("../utils/crypto.util");
const logger_1 = require("../config/logger");
const updateIdentity = async (req, res) => {
    try {
        const { idNumber } = req.body;
        if (!idNumber)
            return res.status(400).json({ error: 'KTP/ID Number is required' });
        const guestId = String(req.params.id);
        const encrypted = (0, crypto_util_1.encryptKtp)(idNumber);
        const hashed = (0, crypto_util_1.hashKtp)(idNumber);
        const data = await GuestsService.updateGuest(guestId, {
            idNumberEncrypted: encrypted,
            idNumberHash: hashed
        });
        logger_1.logger.info('Admin updated guest identity details', {
            guestId,
            adminId: req.user?.id || 'unknown-admin',
            timestamp: new Date().toISOString()
        });
        // Omit encrypted payload from response for security
        const sanitizedData = { ...data };
        delete sanitizedData.idNumberEncrypted;
        delete sanitizedData.idNumberHash;
        res.json(sanitizedData);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.updateIdentity = updateIdentity;
const revealIdentity = async (req, res) => {
    try {
        const guestId = String(req.params.id);
        const guest = await GuestsService.getGuestById(guestId);
        if (!guest)
            return res.status(404).json({ error: 'Guest not found' });
        if (!guest.idNumberEncrypted)
            return res.status(404).json({ error: 'No identity data stored for this guest' });
        const rawKtp = (0, crypto_util_1.decryptKtp)(guest.idNumberEncrypted);
        logger_1.logger.warn('SECURE AUDIT: Admin revealed guest identity details', {
            guestId,
            adminId: req.user?.id || 'unknown-admin',
            timestamp: new Date().toISOString()
        });
        res.json({ idNumber: rawKtp });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to reveal identity' });
    }
};
exports.revealIdentity = revealIdentity;
