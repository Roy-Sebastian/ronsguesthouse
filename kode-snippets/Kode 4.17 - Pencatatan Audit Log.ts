// Kode 4.17 - Potongan Kode Pencatatan Audit Log
// File: backend/src/middlewares/auditLog.middleware.ts

export const auditLogMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {

    res.on('finish', async () => {
      // Hanya catat jika request berhasil (2xx atau 3xx)
      if (res.statusCode >= 200 && res.statusCode < 400 && user?.id) {
        const fullPath = (req.baseUrl + req.path).replace(/\/+/g, '/');
        const pathParts = fullPath.split('/').filter((p) => p && p !== 'api');

        // Ekstrak entitas dari URL — abaikan UUID dan angka
        const entity = pathParts.find((p) => !/^[0-9a-f-]{8,}$|^\d+$/.test(p)) || 'system';

        let action = 'CREATE';
        if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
        if (req.method === 'DELETE') action = 'DELETE';

        // Hapus field sensitif sebelum disimpan
        const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'creditCard', 'cvv'];
        const sanitizeBody = (body: any) => {
          const clean = { ...body };
          for (const field of SENSITIVE_FIELDS) delete clean[field];
          return clean;
        };

        const log = await auditLogRepository.create({
          data: {
            userId: user.id,
            action,
            entity,
            entityId: req.params?.id || null,
            newValues: sanitizeBody(req.body),
            ipAddress: req.ip || null,
            userAgent: req.headers['user-agent'] || null,
          },
        });

        // Kirim real-time ke dashboard via WebSocket
        const io = getIO();
        io.emit('new_audit_log', log);
      }
    });
  }
  next();
};
