import 'dotenv/config'; // Must be the very first import to load env vars early

import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { auth } from './config/auth';
import { initSocket } from './config/socket';
import apiRoutes from './routes';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

// ... (rest of configuration will be unchanged)
const port = process.env.PORT || 3001;

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
import path from 'path';
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'public', 'uploads')),
);

// Default route
app.get('/', (req, res) => {
  res.send('Rons Guesthouse Backend API (Migrated to Node.js & Express)');
});

import { auditLogMiddleware } from './middlewares/auditLog.middleware';
app.use('/api', auditLogMiddleware);

// -- Register other routes here --
app.use('/api', apiRoutes);

import { globalErrorHandler } from './middlewares/error.middleware';
app.use(globalErrorHandler);

// Start server
import { startExpirationJob } from './jobs/expire-reservations.job';
httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  startExpirationJob();
});
