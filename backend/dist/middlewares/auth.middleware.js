"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = exports.requireAuth = void 0;
const auth_1 = require("../config/auth");
const rbac_1 = require("../config/rbac");
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
const requireAuth = async (req, res, next) => {
    try {
        const session = await auth_1.auth.api.getSession({
            headers: normalizeHeaders(req.headers),
        });
        if (!session?.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (session.user.isActive === false) {
            return res.status(403).json({ error: 'Account is inactive' });
        }
        req.user = session.user;
        next();
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.requireAuth = requireAuth;
const requireRole = (roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
};
exports.requireRole = requireRole;
const getEffectivePermissionSet = (req) => {
    const rolePermissions = (0, rbac_1.getRolePermissions)(req.user?.role);
    const userPermissions = Array.isArray(req.user?.permissions)
        ? req.user.permissions
        : [];
    // Superadmin keeps full access regardless of custom overrides.
    if (req.user?.role === 'superadmin') {
        return new Set(rbac_1.ALL_PERMISSION_KEYS);
    }
    return new Set([...rolePermissions, ...userPermissions]);
};
const hasAnyPermission = (req, permissions) => {
    const permissionSet = getEffectivePermissionSet(req);
    return permissions.some((permission) => permissionSet.has(permission));
};
const requirePermission = (permission) => {
    const permissions = Array.isArray(permission) ? permission : [permission];
    return (req, res, next) => {
        if (!hasAnyPermission(req, permissions)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
