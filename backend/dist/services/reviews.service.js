"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllReviews = getAllReviews;
exports.getReviewById = getReviewById;
exports.createReview = createReview;
exports.updateReview = updateReview;
exports.deleteReview = deleteReview;
exports.getApprovedReviews = getApprovedReviews;
exports.submitPublicReview = submitPublicReview;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
const review_repository_1 = require("../repositories/review.repository");
async function getAllReviews(where, include) {
    return review_repository_1.reviewRepository.findAll({
        where,
        include: include || { guest: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
    });
}
async function getReviewById(id) {
    return review_repository_1.reviewRepository.findById(id, {
        include: { guest: { select: { fullName: true } } },
    });
}
async function createReview(data) {
    return review_repository_1.reviewRepository.create({ data });
}
async function updateReview(id, data) {
    return review_repository_1.reviewRepository.update(id, { data });
}
async function deleteReview(id) {
    await review_repository_1.reviewRepository.delete(id);
}
// ─── Public Review Functions ──────────────────────────────────────
/**
 * Get approved reviews for public display (homepage).
 * Returns guest name (first name + initial), rating, comment, room type.
 */
async function getApprovedReviews(limit = 20) {
    const reviews = await prisma_1.prisma.review.findMany({
        where: { status: 'approved' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
            guest: { select: { fullName: true } },
            reservation: {
                select: {
                    room: { select: { roomType: true } },
                },
            },
        },
    });
    // Map to public-safe format with masked names
    return reviews.map((r) => {
        const fullName = r.guest?.fullName || 'Anonymous';
        const parts = fullName.split(' ');
        const maskedName = parts.length > 1
            ? `${parts[0]} ${parts[1][0]}.`
            : parts[0];
        return {
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            guest: maskedName,
            room: r.reservation?.room?.roomType
                ? `${r.reservation.room.roomType} Room`
                : 'Guest House',
            createdAt: r.createdAt,
        };
    });
}
/**
 * Submit a review from a public guest using booking code + email.
 * Validates:
 *  1. Reservation exists & matches email
 *  2. Reservation status is checked_out
 *  3. No existing review for this reservation
 */
async function submitPublicReview(bookingCode, email, rating, comment) {
    // Normalize inputs
    const normalizedCode = bookingCode.trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();
    // 1. Find reservation
    const reservation = await prisma_1.prisma.reservation.findFirst({
        where: {
            bookingCode: normalizedCode,
            guest: { email: normalizedEmail },
        },
        include: {
            guest: { select: { id: true, fullName: true, email: true } },
            review: { select: { id: true } },
        },
    });
    if (!reservation) {
        throw Object.assign(new Error('Kode booking atau email tidak ditemukan'), { statusCode: 404 });
    }
    // 2. Check reservation status
    if (reservation.status !== 'checked_out') {
        throw Object.assign(new Error('Ulasan hanya dapat dikirim setelah Anda check-out'), { statusCode: 400 });
    }
    // 3. Check for existing review
    if (reservation.review) {
        throw Object.assign(new Error('Anda sudah pernah memberikan ulasan untuk reservasi ini'), { statusCode: 409 });
    }
    // 4. Validate rating
    if (!rating || rating < 1 || rating > 5) {
        throw Object.assign(new Error('Rating harus antara 1 - 5'), {
            statusCode: 400,
        });
    }
    // 5. Validate comment
    if (!comment || comment.trim().length < 10) {
        throw Object.assign(new Error('Komentar minimal 10 karakter'), { statusCode: 400 });
    }
    // 6. Create review
    const review = await prisma_1.prisma.review.create({
        data: {
            guestId: reservation.guest.id,
            reservationId: reservation.id,
            rating,
            comment: comment.trim(),
            status: 'pending', // requires admin moderation
        },
    });
    logger_1.logger.info('Public review submitted', {
        reviewId: review.id,
        reservationId: reservation.id,
        rating,
    });
    return review;
}
