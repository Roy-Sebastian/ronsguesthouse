"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMessages = getAllMessages;
exports.getMessageById = getMessageById;
exports.createMessage = createMessage;
exports.updateMessage = updateMessage;
exports.deleteMessage = deleteMessage;
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
