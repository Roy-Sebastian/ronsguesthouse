"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllReviews = getAllReviews;
exports.getReviewById = getReviewById;
exports.createReview = createReview;
exports.updateReview = updateReview;
exports.deleteReview = deleteReview;
const review_repository_1 = require("../repositories/review.repository");
async function getAllReviews(where, include) {
    return review_repository_1.reviewRepository.findAll({
        where,
        include,
        orderBy: { createdAt: 'desc' },
    });
}
async function getReviewById(id) {
    return review_repository_1.reviewRepository.findById(id);
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
