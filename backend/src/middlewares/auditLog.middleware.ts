import { NextFunction, Request, Response } from 'express';
import { auth } from '../config/auth';
import { getIO } from '../config/socket';
import { auditLogRepository } from '../repositories/audit-log.repository';

const normalizeHeaders = (headers: Request['headers']): Record<string, string> => {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') {
      normalized[key] = value;
    } else if (Array.isArray(value)) {
      normalized[key] = value.join(', ');
    }
  }
  return normalized;
};

export const auditLogMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    let user = req.user;
    if (!user) {
      try {
        const session = await auth.api.getSession({
          headers: normalizeHeaders(req.headers),
        });
        user = session?.user;
      } catch (e) {}
    }

    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 400 && user?.id) {
        let pathParts = (req.baseUrl || req.path).split('/').filter(Boolean);
        let entity = pathParts[pathParts.length - 1] || 'system';
        if (entity === 'api')
          entity = pathParts[pathParts.length - 1] || 'system';

        let action = 'CREATE';
        if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
        if (req.method === 'DELETE') action = 'DELETE';

        try {
          const entityIdStr = req.params?.id || req.body?.id || null;

          const log = await auditLogRepository.create({
            data: {
              userId: user.id,
              action: action,
              entity: entity,
              entityId: entityIdStr ? String(entityIdStr) : null,
              newValues: req.body ? JSON.parse(JSON.stringify(req.body)) : null,
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
            const io = getIO();
            io.emit('new_audit_log', log);
          } catch (e) {
          }
        } catch (err) {
          console.error('Failed to save audit log:', err);
        }
      }
    });
  }
  next();
};
