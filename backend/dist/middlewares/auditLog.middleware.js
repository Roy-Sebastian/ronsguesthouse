"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogMiddleware = void 0;
const auth_1 = require("../config/auth");
const socket_1 = require("../config/socket");
const audit_log_repository_1 = require("../repositories/audit-log.repository");
const normalizeHeaders = (headers) => {
    const normalized = {};
    for (const [key, value] of Object.entries(headers)) {
        if (typeof value === 'string') {
            normalized[key] = value;
        }
        else if (Array.isArray(value)) {
            normalized[key] = value.join(', ');
        }
    }
    return normalized;
};
const auditLogMiddleware = async (req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        let user = req.user;
        if (!user) {
            try {
                const session = await auth_1.auth.api.getSession({
                    headers: normalizeHeaders(req.headers),
                });
                user = session?.user;
            }
            catch (e) { }
        }
        res.on('finish', async () => {
            if (res.statusCode >= 200 && res.statusCode < 400 && user?.id) {
                const fullPath = (req.baseUrl + req.path).replace(/\/+/g, '/');
                const pathParts = fullPath.split('/').filter((p) => p && p !== 'api');
                // entity = first meaningful segment (e.g. 'audit-logs', 'users'), skip UUIDs/numbers
                const entity = pathParts.find((p) => !/^[0-9a-f-]{8,}$|^\d+$/.test(p)) || 'system';
                let action = 'CREATE';
                if (req.method === 'PUT' || req.method === 'PATCH')
                    action = 'UPDATE';
                if (req.method === 'DELETE')
                    action = 'DELETE';
                const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'creditCard', 'cvv'];
                const sanitizeBody = (body) => {
                    if (!body || typeof body !== 'object')
                        return body;
                    const clean = { ...body };
                    for (const field of SENSITIVE_FIELDS)
                        delete clean[field];
                    return clean;
                };
                try {
                    const entityIdStr = req.params?.id || req.body?.id || null;
                    const log = await audit_log_repository_1.auditLogRepository.create({
                        data: {
                            userId: user.id,
                            action: action,
                            entity: entity,
                            entityId: entityIdStr ? String(entityIdStr) : null,
                            newValues: req.body ? sanitizeBody(JSON.parse(JSON.stringify(req.body))) : null,
                            ipAddress: req.ip || req.socket?.remoteAddress || null,
                            userAgent: req.headers['user-agent'] || null,
                        },
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    role: true,
                                },
                            },
                        },
                    });
                    try {
                        const io = (0, socket_1.getIO)();
                        io.emit('new_audit_log', log);
                    }
                    catch (e) {
                    }
                }
                catch (err) {
                    console.error('Failed to save audit log:', err);
                }
            }
        });
    }
    next();
};
exports.auditLogMiddleware = auditLogMiddleware;
