import { userRepository } from '../repositories/user.repository';
import { loadRoleMatrix, normalizeRoleMatrix, saveRoleMatrix } from '../config/rbac';

export function getRoles() {
  return loadRoleMatrix();
}

export async function updateRoles(body: unknown) {
  const matrix = normalizeRoleMatrix(body);
  saveRoleMatrix(matrix);

  for (const roleKey of Object.keys(matrix)) {
    if (roleKey === 'superadmin') continue;
    const permissionsObj = matrix[roleKey as keyof typeof matrix];
    const permsArray = Object.keys(permissionsObj).filter((k) => permissionsObj[k]);

    await userRepository.updateMany({
      where: { role: roleKey as any },
      data: { permissions: permsArray },
    });
  }

  return { success: true };
}
