"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAmenities = getAllAmenities;
exports.getAmenityById = getAmenityById;
exports.createAmenity = createAmenity;
exports.updateAmenity = updateAmenity;
exports.deleteAmenity = deleteAmenity;
const repositories_1 = require("../repositories");
async function getAllAmenities() {
    return repositories_1.amenityRepository.findAll({ orderBy: { createdAt: 'desc' } });
}
async function getAmenityById(id) {
    return repositories_1.amenityRepository.findById(id);
}
async function createAmenity(data) {
    return repositories_1.amenityRepository.create({ data });
}
async function updateAmenity(id, data) {
    return repositories_1.amenityRepository.update(id, { data });
}
async function deleteAmenity(id) {
    await repositories_1.amenityRepository.delete(id);
}
