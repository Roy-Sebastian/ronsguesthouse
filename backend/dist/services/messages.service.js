"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMessages = getAllMessages;
exports.getMessageById = getMessageById;
exports.createMessage = createMessage;
exports.updateMessage = updateMessage;
exports.deleteMessage = deleteMessage;
exports.submitPublicMessage = submitPublicMessage;
const message_repository_1 = require("../repositories/message.repository");
async function getAllMessages() {
    return message_repository_1.messageRepository.findAll({ orderBy: { createdAt: 'desc' } });
}
async function getMessageById(id) {
    return message_repository_1.messageRepository.findById(id);
}
async function createMessage(data) {
    return message_repository_1.messageRepository.create({ data });
}
async function updateMessage(id, data) {
    return message_repository_1.messageRepository.update(id, { data });
}
async function deleteMessage(id) {
    await message_repository_1.messageRepository.delete(id);
}
async function submitPublicMessage(body) {
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const subject = String(body?.subject || '').trim();
    const message = String(body?.message || '').trim();
    const phone = body?.phone ? String(body.phone).trim() : null;
    if (!name || !email || !subject || !message) {
        throw Object.assign(new Error('Nama, email, subjek, dan pesan wajib diisi'), { statusCode: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw Object.assign(new Error('Format email tidak valid'), { statusCode: 400 });
    }
    if (message.length < 10) {
        throw Object.assign(new Error('Pesan minimal 10 karakter'), { statusCode: 400 });
    }
    return message_repository_1.messageRepository.create({
        data: { name, email, phone, subject, message, isRead: false },
    });
}
