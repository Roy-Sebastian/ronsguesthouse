"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
exports.getUserById = getUserById;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const rbac_1 = require("../config/rbac");
const user_repository_1 = require("../repositories/user.repository");
function canManageRole(ctx) {
    if (ctx.role === 'superadmin')
        return true;
    const rolePermissions = (0, rbac_1.getRolePermissions)(ctx.role);
    const userPermissions = Array.isArray(ctx.permissions) ? ctx.permissions : [];
    const effective = new Set([...rolePermissions, ...userPermissions]);
    return effective.has('role.manage');
}
function sanitizePayload(ctx, payload) {
    const next = { ...payload };
    if (!canManageRole(ctx)) {
        delete next.role;
        delete next.permissions;
        delete next.isActive;
    }
    if (ctx.role !== 'superadmin' && next.role === 'superadmin') {
        delete next.role;
    }
    return next;
}
async function getAllUsers(search) {
    return user_repository_1.userRepository.findAll({
        where: search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }
            : undefined,
    });
}
async function getUserById(id) {
    return user_repository_1.userRepository.findById(id);
}
async function createUser(body, ctx) {
    const safe = sanitizePayload(ctx, body || {});
    return user_repository_1.userRepository.create({ data: safe });
}
async function updateUser(id, body, ctx) {
    const safe = sanitizePayload(ctx, body || {});
    delete safe.password;
    return user_repository_1.userRepository.update(id, { data: safe });
}
async function deleteUser(id) {
    await user_repository_1.userRepository.delete(id);
}
