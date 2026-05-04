"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
exports.getUserById = getUserById;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../config/prisma");
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
    const { password, email, name, phone, role, permissions } = body || {};
    if (!email || !password || !name)
        throw new Error('Nama, email, dan password wajib diisi');
    if (password.length < 8)
        throw new Error('Password minimal 8 karakter');
    const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (existing)
        throw new Error('Email sudah terdaftar');
    const safe = sanitizePayload(ctx, { role, permissions, phone });
    const hashed = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma_1.prisma.user.create({
        data: {
            name,
            email,
            emailVerified: true,
            role: safe.role || 'receptionist',
            permissions: safe.permissions || [],
            phone: safe.phone || null,
            isActive: true,
        },
    });
    await prisma_1.prisma.account.create({
        data: {
            userId: user.id,
            accountId: user.id,
            providerId: 'credential',
            password: hashed,
        },
    });
    return user;
}
async function updateUser(id, body, ctx) {
    const { password, ...rest } = body || {};
    const safe = sanitizePayload(ctx, rest);
    const user = await user_repository_1.userRepository.update(id, { data: safe });
    if (password && typeof password === 'string' && password.length >= 8) {
        const hashed = await bcryptjs_1.default.hash(password, 10);
        await prisma_1.prisma.account.updateMany({
            where: { userId: id, providerId: 'credential' },
            data: { password: hashed },
        });
    }
    return user;
}
async function deleteUser(id, ctx) {
    const target = await user_repository_1.userRepository.findById(id);
    if (!target)
        throw new Error('Pengguna tidak ditemukan');
    if (target.role === 'superadmin')
        throw new Error('Akun superadmin tidak dapat dihapus');
    if (target.id === ctx.requesterId)
        throw new Error('Tidak dapat menghapus akun sendiri');
    await user_repository_1.userRepository.delete(id);
}
