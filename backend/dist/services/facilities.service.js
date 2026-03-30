"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFacilities = getAllFacilities;
exports.getFacilityById = getFacilityById;
exports.createFacility = createFacility;
exports.updateFacility = updateFacility;
exports.deleteFacility = deleteFacility;
const facility_repository_1 = require("../repositories/facility.repository");
async function getAllFacilities() {
    return facility_repository_1.facilityRepository.findAll({ orderBy: { createdAt: 'desc' } });
}
async function getFacilityById(id) {
    return facility_repository_1.facilityRepository.findById(id);
}
async function createFacility(data) {
    return facility_repository_1.facilityRepository.create({ data });
}
async function updateFacility(id, data) {
    return facility_repository_1.facilityRepository.update(id, { data });
}
async function deleteFacility(id) {
    await facility_repository_1.facilityRepository.delete(id);
}
