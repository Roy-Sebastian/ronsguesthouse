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
exports.deleteRoom = exports.updateRoom = exports.getRoomById = exports.createRoom = exports.getRooms = void 0;
const RoomsService = __importStar(require("../services/rooms.service"));
const getRooms = async (req, res) => {
    try {
        const status = req.query.status;
        const type = req.query.type;
        const checkIn = req.query.checkIn;
        const checkOut = req.query.checkOut;
        res.json(await RoomsService.getRooms(status, type, checkIn, checkOut));
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch rooms' });
    }
};
exports.getRooms = getRooms;
const createRoom = async (req, res) => {
    try {
        const room = await RoomsService.createRoom(req.body);
        res.status(201).json(room);
    }
    catch (error) {
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ error: error.message || 'Failed to create room' });
    }
};
exports.createRoom = createRoom;
const getRoomById = async (req, res) => {
    try {
        const room = await RoomsService.getRoomById(String(req.params.id));
        if (!room)
            return res.status(404).json({ error: 'Room not found' });
        res.json(room);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch room' });
    }
};
exports.getRoomById = getRoomById;
const updateRoom = async (req, res) => {
    try {
        const room = await RoomsService.updateRoom(String(req.params.id), req.body);
        res.json(room);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to update room' });
    }
};
exports.updateRoom = updateRoom;
const deleteRoom = async (req, res) => {
    try {
        await RoomsService.deleteRoom(String(req.params.id));
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to delete room' });
    }
};
exports.deleteRoom = deleteRoom;
