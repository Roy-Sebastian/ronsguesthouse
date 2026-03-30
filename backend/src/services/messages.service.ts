import { messageRepository } from '../repositories/message.repository';

export async function getAllMessages() {
  return messageRepository.findAll({ orderBy: { createdAt: 'desc' } });
}

export async function getMessageById(id: string) {
  return messageRepository.findById(id);
}

export async function createMessage(data: any) {
  return messageRepository.create({ data });
}

export async function updateMessage(id: string, data: any) {
  return messageRepository.update(id, { data });
}

export async function deleteMessage(id: string) {
  await messageRepository.delete(id);
}
