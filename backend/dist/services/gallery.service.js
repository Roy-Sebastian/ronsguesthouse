"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllGallery = getAllGallery;
exports.getGalleryById = getGalleryById;
exports.createGallery = createGallery;
exports.updateGallery = updateGallery;
exports.deleteGallery = deleteGallery;
const gallery_repository_1 = require("../repositories/gallery.repository");
async function getAllGallery(filters) {
    const where = {};
    if (filters?.category)
        where.category = filters.category;
    if (filters?.isActive !== undefined)
        where.isActive = filters.isActive;
    return gallery_repository_1.galleryRepository.findAll({ where, orderBy: { createdAt: 'desc' } });
}
async function getGalleryById(id) {
    return gallery_repository_1.galleryRepository.findById(id);
}
async function createGallery(data) {
    return gallery_repository_1.galleryRepository.create({ data });
}
async function updateGallery(id, data) {
    return gallery_repository_1.galleryRepository.update(id, { data });
}
async function deleteGallery(id) {
    await gallery_repository_1.galleryRepository.delete(id);
}
