import { auditLogRepository } from '../repositories';

const WITH_USER = { user: { select: { id: true, name: true, email: true } } } as const;

export async function getAllAuditLogs() {
  return auditLogRepository.findAll({ orderBy: { createdAt: 'desc' }, include: WITH_USER });
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
