import { addonRepository } from '../repositories/addon.repository';

export async function getAllAddOns() {
  return addonRepository.findAll();
}

export interface CreateAddOnInput {
  name: string;
  category?: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  stock?: number;
}

export function validateAddOnInput(input: CreateAddOnInput) {
  if (!input.name) throw Object.assign(new Error('Nama layanan wajib diisi'), { statusCode: 400 });
  if (!Number.isFinite(input.price) || input.price < 0)
    throw Object.assign(new Error('Harga layanan tidak valid'), { statusCode: 400 });
}

export async function createAddOn(body: any) {
  const payload: CreateAddOnInput = {
    name: String(body?.name || '').trim(),
    category: String(body?.category || 'general'),
    price: Number(body?.price || 0),
    description: body?.description ? String(body.description) : null,
    imageUrl: body?.imageUrl ? String(body.imageUrl) : null,
    stock: Number(body?.stock || 0),
  };
  validateAddOnInput(payload);
  return addonRepository.create({ data: payload });
}

export async function deleteAddOn(id: string) {
  await addonRepository.delete(id);
}

export async function updateAddOn(id: string, body: any) {
  const payload: CreateAddOnInput = {
    name: String(body?.name || '').trim(),
    category: String(body?.category || 'general'),
    price: Number(body?.price || 0),
    description: body?.description ? String(body.description) : null,
    imageUrl: body?.imageUrl ? String(body.imageUrl) : null,
    stock: Number(body?.stock || 0),
  };
  validateAddOnInput(payload);
  return addonRepository.update(id, { data: payload });
}
