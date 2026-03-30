import { Router } from 'express';

const router = Router();

import amenitiesRoutes from './amenities.routes';
import auditLogsRoutes from './audit-logs.routes';
import expensesRoutes from './expenses.routes';
import facilitiesRoutes from './facilities.routes';
import galleryRoutes from './gallery.routes';
import guestsRoutes from './guests.routes';
import incomesRoutes from './incomes.routes';
import messagesRoutes from './messages.routes';
import reservationsRoutes from './reservations.routes';
import reviewsRoutes from './reviews.routes';
import staysRoutes from './stays.routes';
import transactionsRoutes from './transactions.routes';
import usersRoutes from './users.routes';
router.use('/users', usersRoutes);
router.use('/guests', guestsRoutes);
router.use('/reservations', reservationsRoutes);
router.use('/stays', staysRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/amenities', amenitiesRoutes);
router.use('/facilities', facilitiesRoutes);
router.use('/expenses', expensesRoutes);
router.use('/incomes', incomesRoutes);
router.use('/gallery', galleryRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/messages', messagesRoutes);
router.use('/audit-logs', auditLogsRoutes);

import dashboardRoutes from './dashboard.routes';
router.use('/dashboard', dashboardRoutes);

import uploadRoutes from './upload.routes';
router.use('/upload', uploadRoutes);

// Rooms route is already manual, import it
import roomRoutes from './room.routes';
router.use('/rooms', roomRoutes);


import rolesRoutes from './roles.routes';
router.use('/roles', rolesRoutes);

import addonsRoutes from './addons.routes';
router.use('/addons', addonsRoutes);

import pricingRoutes from './pricing.routes';
router.use('/pricing', pricingRoutes);

import { publicRateLimiter, guestAccessRateLimiter } from '../middlewares/rate-limit.middleware';
import { publicBook, checkBookingAccess, forgotBooking } from '../controllers/public-booking.controller';
router.post('/public/book', publicRateLimiter, publicBook);
router.post('/public/check-booking', guestAccessRateLimiter, checkBookingAccess);
router.post('/public/forgot-booking', guestAccessRateLimiter, forgotBooking);

export default router;

