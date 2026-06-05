import { messageRepository } from '../repositories/message.repository';
import { getIO } from '../config/socket';
import { logger } from '../config/logger';

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

export async function submitPublicMessage(body: any) {
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

  const createdMessage = await messageRepository.create({
    data: { name, email, phone, subject, message, isRead: false },
  });

  try {
    const io = getIO();
    if (io) {
      io.emit('new_message', {
        id: createdMessage.id,
        name: createdMessage.name,
        email: createdMessage.email,
        subject: createdMessage.subject,
        message: createdMessage.message,
        createdAt: createdMessage.createdAt,
      });
    }
  } catch (e) {
    logger.error('Socket emit error for new message', { error: e });
  }

  return createdMessage;
}
