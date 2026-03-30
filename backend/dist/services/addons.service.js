"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAddOns = getAllAddOns;
exports.validateAddOnInput = validateAddOnInput;
exports.createAddOn = createAddOn;
exports.deleteAddOn = deleteAddOn;
exports.updateAddOn = updateAddOn;
const addon_repository_1 = require("../repositories/addon.repository");
async function getAllAddOns() {
    return addon_repository_1.addonRepository.findAll();
}
function validateAddOnInput(input) {
    if (!input.name)
        throw Object.assign(new Error('Nama layanan wajib diisi'), { statusCode: 400 });
    if (!Number.isFinite(input.price) || input.price < 0)
        throw Object.assign(new Error('Harga layanan tidak valid'), { statusCode: 400 });
}
async function createAddOn(body) {
    const payload = {
        name: String(body?.name || '').trim(),
        category: String(body?.category || 'general'),
        price: Number(body?.price || 0),
        description: body?.description ? String(body.description) : null,
        imageUrl: body?.imageUrl ? String(body.imageUrl) : null,
        stock: Number(body?.stock || 0),
    };
    validateAddOnInput(payload);
    return addon_repository_1.addonRepository.create({ data: payload });
}
async function deleteAddOn(id) {
    await addon_repository_1.addonRepository.delete(id);
}
async function updateAddOn(id, body) {
    const payload = {
        name: String(body?.name || '').trim(),
        category: String(body?.category || 'general'),
        price: Number(body?.price || 0),
        description: body?.description ? String(body.description) : null,
        imageUrl: body?.imageUrl ? String(body.imageUrl) : null,
        stock: Number(body?.stock || 0),
    };
    validateAddOnInput(payload);
    return addon_repository_1.addonRepository.update(id, { data: payload });
}
