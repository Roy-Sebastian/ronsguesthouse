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
exports.submitPublicReview = exports.getApprovedReviews = exports.remove = exports.update = exports.create = exports.getById = exports.getAll = void 0;
const ReviewsService = __importStar(require("../services/reviews.service"));
// ─── Admin CRUD ────────────────────────────────────────────────────
const getAll = async (req, res) => {
    try {
        const status = req.query.status;
        const where = status ? { status } : undefined;
        res.json(await ReviewsService.getAllReviews(where));
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch reviews' });
    }
};
exports.getAll = getAll;
const getById = async (req, res) => {
    try {
        const data = await ReviewsService.getReviewById(String(req.params.id));
        if (!data)
            return res.status(404).json({ error: 'Not found' });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch review' });
    }
};
exports.getById = getById;
const create = async (req, res) => {
    try {
        const data = await ReviewsService.createReview(req.body);
        res.status(201).json(data);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.create = create;
const update = async (req, res) => {
    try {
        const data = await ReviewsService.updateReview(String(req.params.id), req.body);
        res.json(data);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.update = update;
const remove = async (req, res) => {
    try {
        await ReviewsService.deleteReview(String(req.params.id));
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.remove = remove;
// ─── Public Endpoints ──────────────────────────────────────────────
/**
 * GET /api/public/reviews
 * Returns approved reviews for public homepage display.
 */
const getApprovedReviews = async (_req, res) => {
    try {
        const reviews = await ReviewsService.getApprovedReviews();
        res.json(reviews);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch reviews' });
    }
};
exports.getApprovedReviews = getApprovedReviews;
/**
 * POST /api/public/reviews
 * Submit a review from a guest using their booking code + email.
 * Body: { bookingCode, email, rating, comment }
 */
const submitPublicReview = async (req, res) => {
    try {
        const { bookingCode, email, rating, comment } = req.body;
        if (!bookingCode || !email || !rating || !comment) {
            return res.status(400).json({
                error: 'bookingCode, email, rating, dan comment wajib diisi',
            });
        }
        const review = await ReviewsService.submitPublicReview(String(bookingCode), String(email), Number(rating), String(comment));
        res.status(201).json({
            success: true,
            message: 'Ulasan berhasil dikirim! Ulasan Anda akan ditinjau terlebih dahulu oleh admin.',
            review: { id: review.id, rating: review.rating, status: review.status },
        });
    }
    catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message || 'Gagal mengirim ulasan' });
    }
};
exports.submitPublicReview = submitPublicReview;
