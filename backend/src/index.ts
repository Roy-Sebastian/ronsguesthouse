import 'dotenv/config'; // Must be the very first import to load env vars early
import { createServer } from 'http';
import path from 'path';

import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express from 'express';

import { auth } from './config/auth';
import { initSocket } from './config/socket';
import { startExpirationJob } from './jobs/expire-reservations.job';
import { auditLogMiddleware } from './middlewares/auditLog.middleware';
import { globalErrorHandler } from './middlewares/error.middleware';
import apiRoutes from './routes';

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3001;

// Initialize Socket.IO
initSocket(httpServer);

// CORS setup to allow the frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
);

// Better Auth Express Middleware
app.all(/^\/api\/auth/, toNodeHandler(auth));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (for uploads)
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'public', 'uploads')),
);

// Default route
app.get('/', (req, res) => {
  res.send('Rons Guesthouse Backend API (Migrated to Node.js & Express)');
});

// Audit log middleware
app.use('/api', auditLogMiddleware);

// API Routes
app.use('/api', apiRoutes);

// Error handling
app.use(globalErrorHandler);

// Start server
httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  startExpirationJob();
});
