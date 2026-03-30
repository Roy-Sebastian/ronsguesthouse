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
exports.remove = exports.update = exports.create = exports.getAvailable = exports.getAll = void 0;
const AddOnsService = __importStar(require("../services/addons.service"));
const getAll = async (req, res) => {
    try {
        res.json(await AddOnsService.getAllAddOns());
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch add-ons' });
    }
};
exports.getAll = getAll;
const getAvailable = async (req, res) => {
    try {
        // Currently same as getAll since there is no isActive field, 
        // but segregated strictly for business logic.
        res.json(await AddOnsService.getAllAddOns());
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch available add-ons' });
    }
};
exports.getAvailable = getAvailable;
const create = async (req, res) => {
    try {
        const data = await AddOnsService.createAddOn(req.body);
        res.status(201).json(data);
    }
    catch (error) {
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ error: error.message || 'Failed to create add-on' });
    }
};
exports.create = create;
const update = async (req, res) => {
    try {
        const data = await AddOnsService.updateAddOn(String(req.params.id), req.body);
        res.json(data);
    }
    catch (error) {
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ error: error.message || 'Failed to update add-on' });
    }
};
exports.update = update;
const remove = async (req, res) => {
    try {
        await AddOnsService.deleteAddOn(String(req.params.id));
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message || 'Failed to delete add-on' });
    }
};
exports.remove = remove;
