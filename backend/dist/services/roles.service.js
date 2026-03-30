"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoles = getRoles;
exports.updateRoles = updateRoles;
const user_repository_1 = require("../repositories/user.repository");
const rbac_1 = require("../config/rbac");
function getRoles() {
    return (0, rbac_1.loadRoleMatrix)();
}
async function updateRoles(body) {
    const matrix = (0, rbac_1.normalizeRoleMatrix)(body);
    (0, rbac_1.saveRoleMatrix)(matrix);
    for (const roleKey of Object.keys(matrix)) {
        if (roleKey === 'superadmin')
            continue;
        const permissionsObj = matrix[roleKey];
        const permsArray = Object.keys(permissionsObj).filter((k) => permissionsObj[k]);
        await user_repository_1.userRepository.updateMany({
            where: { role: roleKey },
            data: { permissions: permsArray },
        });
    }
    return { success: true };
}
