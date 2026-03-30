"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAuditLogs = getAllAuditLogs;
exports.getAuditLogById = getAuditLogById;
exports.createAuditLog = createAuditLog;
exports.updateAuditLog = updateAuditLog;
exports.deleteAuditLog = deleteAuditLog;
const repositories_1 = require("../repositories");
const WITH_USER = { user: { select: { id: true, name: true, email: true } } };
async function getAllAuditLogs() {
    return repositories_1.auditLogRepository.findAll({ orderBy: { createdAt: 'desc' }, include: WITH_USER });
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
