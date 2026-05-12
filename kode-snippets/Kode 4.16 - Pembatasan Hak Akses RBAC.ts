// Kode 4.16 - Potongan Kode Pembatasan Hak Akses (RBAC)
// File: backend/src/middlewares/auth.middleware.ts

const getEffectivePermissionSet = (req: Request) => {
  const rolePermissions = getRolePermissions(req.user?.role);
  const userPermissions = Array.isArray(req.user?.permissions)
    ? req.user.permissions
    : [];

  // Superadmin selalu mendapat akses penuh, tidak bisa di-override
  if (req.user?.role === 'superadmin') {
    return new Set(ALL_PERMISSION_KEYS);
  }

  // Gabungkan permission role + permission khusus user
  return new Set([...rolePermissions, ...userPermissions]);
};

export const requirePermission = (permission: string | string[]) => {
  const permissions = Array.isArray(permission) ? permission : [permission];

  return (req: Request, res: Response, next: NextFunction) => {
    const permissionSet = getEffectivePermissionSet(req);
    const hasPermission = permissions.some((p) => permissionSet.has(p));

    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};

// Contoh penggunaan di route:
// router.get('/users', requireAuth, requirePermission('user.view'), usersController.getAll);
// router.delete('/users/:id', requireAuth, requirePermission('user.delete'), usersController.delete);
