"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAuditLogs = getAllAuditLogs;
exports.getAuditLogById = getAuditLogById;
exports.createAuditLog = createAuditLog;
exports.updateAuditLog = updateAuditLog;
exports.deleteAuditLog = deleteAuditLog;
const repositories_1 = require("../repositories");
const prisma_1 = require("../config/prisma");
const WITH_USER = { user: { select: { id: true, name: true, email: true, role: true } } };
async function getAllAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        repositories_1.auditLogRepository.findAll({ orderBy: { createdAt: 'desc' }, include: WITH_USER, skip, take: limit }),
        prisma_1.prisma.auditLog.count(),
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
}
async function getAuditLogById(id) {
    return repositories_1.auditLogRepository.findById(id, { include: WITH_USER });
}
async function createAuditLog(data) {
    return repositories_1.auditLogRepository.create({ data, include: WITH_USER });
}
async function updateAuditLog(id, data) {
    return repositories_1.auditLogRepository.update(id, { data, include: WITH_USER });
}
async function deleteAuditLog(id) {
    await repositories_1.auditLogRepository.delete(id);
}
