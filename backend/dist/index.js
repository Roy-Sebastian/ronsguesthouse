"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config"); // Must be the very first import to load env vars early
const http_1 = require("http");
const path_1 = __importDefault(require("path"));
const node_1 = require("better-auth/node");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const auth_1 = require("./config/auth");
const socket_1 = require("./config/socket");
const expire_reservations_job_1 = require("./jobs/expire-reservations.job");
const auditLog_middleware_1 = require("./middlewares/auditLog.middleware");
const error_middleware_1 = require("./middlewares/error.middleware");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const port = process.env.PORT || 3001;
// Trust Cloudflare proxy to get real client IPs
app.set('trust proxy', true);
// Initialize Socket.IO
(0, socket_1.initSocket)(httpServer);
// CORS setup to allow the frontend (supports comma-separated FRONTEND_URL for www + non-www)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim());
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
// Better Auth Express Middleware
app.all(/^\/api\/auth/, (0, node_1.toNodeHandler)(auth_1.auth));
// Body parser
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Static files (for uploads)
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'public', 'uploads')));
// Default route
app.get('/', (req, res) => {
    res.send('Rons Guesthouse Backend API (Migrated to Node.js & Express)');
});
// Audit log middleware
app.use('/api', auditLog_middleware_1.auditLogMiddleware);
// API Routes
app.use('/api', routes_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Error handling
app.use(error_middleware_1.globalErrorHandler);
// Start server
httpServer.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    (0, expire_reservations_job_1.startExpirationJob)();
});
