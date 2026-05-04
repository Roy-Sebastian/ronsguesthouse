import { loadRoleMatrix, normalizeRoleMatrix, saveRoleMatrix } from '../config/rbac';

export function getRoles() {
  return loadRoleMatrix();
}

export async function updateRoles(body: unknown) {
  const matrix = normalizeRoleMatrix(body);
  saveRoleMatrix(matrix);
  return { success: true };
}
