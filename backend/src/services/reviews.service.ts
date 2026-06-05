import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import { getIO } from '../config/socket';
import { reviewRepository } from '../repositories/review.repository';

export async function getAllReviews(where?: any, include?: any) {
  return reviewRepository.findAll({
    where,
    include: include || {
      guest: { select: { fullName: true } },
      reservation: { select: { bookingCode: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getReviewById(id: string) {
  return reviewRepository.findById(id, {
    include: {
      guest: { select: { fullName: true } },
      reservation: { select: { bookingCode: true } },
    },
  });
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

// ─── Public Review Functions ──────────────────────────────────────

/**
 * Get approved reviews for public display (homepage).
 * Returns guest display name, rating, comment, room type.
 */
export async function getApprovedReviews(limit = 20) {
  const reviews = await (prisma as any).review.findMany({
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

  return reviews.map((r: any) => {
    // Use displayName if set, otherwise fall back to masked guest name
    let publicName = r.displayName?.trim() || null;
    if (!publicName) {
      const fullName = r.guest?.fullName || 'Tamu Anonim';
      const parts = fullName.split(' ');
      publicName =
        parts.length > 1
          ? `${parts[0]} ${parts[1][0]}.`
          : parts[0];
    }

    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment || '',
      guest: publicName,
      room: r.reservation?.room?.roomType
        ? `${r.reservation.room.roomType.replace('_', ' ')} Room`
        : 'Guest House',
      createdAt: r.createdAt,
    };
  });
}

/**
 * Submit a review from a public guest using booking code only.
 * Validates:
 *  1. Reservation exists
 *  2. Reservation status is checked_out
 *  3. No existing review for this reservation
 */
export async function submitPublicReview(
  bookingCode: string,
  rating: number,
  comment: string | undefined,
  displayName: string | undefined,
) {
  // Normalize inputs
  const normalizedCode = bookingCode.trim().toUpperCase();
  const resolvedDisplayName = displayName?.trim() || 'Tamu Anonim';

  // 1. Find reservation by booking code only (no email required)
  const reservation: any = await prisma.reservation.findFirst({
    where: { bookingCode: normalizedCode },
    include: {
      guest: { select: { id: true, fullName: true } },
      review: { select: { id: true } },
    } as any,
  });

  if (!reservation) {
    throw Object.assign(
      new Error('Kode booking tidak ditemukan'),
      { statusCode: 404 },
    );
  }

  // 2. Check reservation status — only checked_out guests may leave a review
  if (reservation.status !== 'checked_out') {
    throw Object.assign(
      new Error('Ulasan hanya dapat dikirim setelah masa menginap selesai (check-out)'),
      { statusCode: 400 },
    );
  }

  // 3. Check for existing review (one review per reservation)
  if (reservation.review) {
    throw Object.assign(
      new Error('Kamu sudah pernah memberikan review untuk reservasi ini'),
      { statusCode: 409 },
    );
  }

  // 4. Validate rating
  if (!rating || rating < 1 || rating > 5) {
    throw Object.assign(new Error('Rating harus antara 1 - 5'), {
      statusCode: 400,
    });
  }

  // 5. Guard against missing guest relation
  if (!reservation.guest || !reservation.guest.id) {
    logger.error('Guest relation missing for reservation', {
      reservationId: reservation.id,
      bookingCode: normalizedCode,
    });
    throw Object.assign(
      new Error('Data tamu tidak ditemukan untuk reservasi ini. Hubungi admin.'),
      { statusCode: 500 },
    );
  }

  // 6. Create review (comment is optional)
  try {
    const review = await (prisma as any).review.create({
      data: {
        guestId: reservation.guest.id,
        reservationId: reservation.id,
        rating,
        displayName: resolvedDisplayName,
        comment: comment?.trim() || null,
        status: 'pending', // requires admin moderation
      },
    });

    logger.info('Public review submitted', {
      reviewId: review.id,
      reservationId: reservation.id,
      rating,
    });

    const io = getIO();
    if (io) {
      io.emit('new_review', {
        id: review.id,
        displayName: review.displayName,
        rating: review.rating,
      });
    }

    return review;
  } catch (createError: any) {
    // Log the full Prisma error for debugging
    logger.error('Failed to create review', {
      error: createError.message,
      code: createError.code,
      meta: createError.meta,
      reservationId: reservation.id,
      bookingCode: normalizedCode,
    });

    // Prisma unique constraint violation (P2002) — duplicate review
    if (createError.code === 'P2002') {
      throw Object.assign(
        new Error('Kamu sudah pernah memberikan review untuk reservasi ini'),
        { statusCode: 409 },
      );
    }

    throw createError;
  }
}
