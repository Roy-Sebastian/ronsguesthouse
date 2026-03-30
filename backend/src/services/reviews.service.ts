import { reviewRepository } from '../repositories/review.repository';

export async function getAllReviews(where?: any, include?: any) {
  return reviewRepository.findAll({
    where,
    include,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getReviewById(id: string) {
  return reviewRepository.findById(id);
}

export async function createReview(data: any) {
  return reviewRepository.create({ data });
}

export async function updateReview(id: string, data: any) {
  return reviewRepository.update(id, { data });
}

export async function deleteReview(id: string) {
  await reviewRepository.delete(id);
}
