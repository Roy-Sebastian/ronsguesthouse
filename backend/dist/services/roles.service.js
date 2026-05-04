"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoles = getRoles;
exports.updateRoles = updateRoles;
const rbac_1 = require("../config/rbac");
function getRoles() {
    return (0, rbac_1.loadRoleMatrix)();
}
async function updateRoles(body) {
    const matrix = (0, rbac_1.normalizeRoleMatrix)(body);
    (0, rbac_1.saveRoleMatrix)(matrix);
    return { success: true };
}
