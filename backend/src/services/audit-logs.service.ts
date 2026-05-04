import { auditLogRepository } from '../repositories';
import { prisma } from '../config/prisma';

const WITH_USER = { user: { select: { id: true, name: true, email: true, role: true } } } as const;

export async function getAllAuditLogs(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    auditLogRepository.findAll({ orderBy: { createdAt: 'desc' }, include: WITH_USER, skip, take: limit }),
    prisma.auditLog.count(),
  ]);
  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getAuditLogById(id: string) {
  return auditLogRepository.findById(id, { include: WITH_USER });
}

export async function createAuditLog(data: any) {
  return auditLogRepository.create({ data, include: WITH_USER });
}

export async function updateAuditLog(id: string, data: any) {
  return auditLogRepository.update(id, { data, include: WITH_USER });
}

export async function deleteAuditLog(id: string) {
  await auditLogRepository.delete(id);
}
