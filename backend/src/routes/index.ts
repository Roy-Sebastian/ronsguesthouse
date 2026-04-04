import { Router } from 'express';

import addonsRoutes from './addons.routes';
import amenitiesRoutes from './amenities.routes';
import auditLogsRoutes from './audit-logs.routes';
import dashboardRoutes from './dashboard.routes';
import expensesRoutes from './expenses.routes';
import facilitiesRoutes from './facilities.routes';
import galleryRoutes from './gallery.routes';
import guestsRoutes from './guests.routes';
import incomesRoutes from './incomes.routes';
import messagesRoutes from './messages.routes';
import pricingRoutes from './pricing.routes';
import reservationsRoutes from './reservations.routes';
import reviewsRoutes from './reviews.routes';
import rolesRoutes from './roles.routes';
import roomRoutes from './room.routes';
import staysRoutes from './stays.routes';
import transactionsRoutes from './transactions.routes';
import uploadRoutes from './upload.routes';
import usersRoutes from './users.routes';
import { checkBookingAccess, forgotBooking, publicBook } from '../controllers/public-booking.controller';
import { getApprovedReviews, submitPublicReview } from '../controllers/reviews.controller';
import { guestAccessRateLimiter, publicRateLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

// Modular Routes
router.use('/addons', addonsRoutes);
router.use('/amenities', amenitiesRoutes);
router.use('/audit-logs', auditLogsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/expenses', expensesRoutes);
router.use('/facilities', facilitiesRoutes);
router.use('/gallery', galleryRoutes);
router.use('/guests', guestsRoutes);
router.use('/incomes', incomesRoutes);
router.use('/messages', messagesRoutes);
router.use('/pricing', pricingRoutes);
router.use('/reservations', reservationsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/roles', rolesRoutes);
router.use('/rooms', roomRoutes);
router.use('/stays', staysRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/upload', uploadRoutes);
router.use('/users', usersRoutes);

// Public API Routes (with rate limiting)
router.post('/public/book', publicRateLimiter, publicBook);
router.post('/public/check-booking', guestAccessRateLimiter, checkBookingAccess);
router.post('/public/forgot-booking', guestAccessRateLimiter, forgotBooking);
router.get('/public/reviews', publicRateLimiter, getApprovedReviews);
router.post('/public/reviews', publicRateLimiter, submitPublicReview);

export default router;
