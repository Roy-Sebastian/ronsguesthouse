import { galleryRepository } from '../repositories/gallery.repository';

export async function getAllGallery(filters?: { category?: string, isActive?: boolean }) {
  const where: any = {};
  if (filters?.category) where.category = filters.category;
  if (filters?.isActive !== undefined) where.isActive = filters.isActive;

  return galleryRepository.findAll({ where, orderBy: { createdAt: 'desc' } });
}

export async function getGalleryById(id: string) {
  return galleryRepository.findById(id);
}

export async function createGallery(data: any) {
  return galleryRepository.create({ data });
}

export async function updateGallery(id: string, data: any) {
  return galleryRepository.update(id, { data });
}

export async function deleteGallery(id: string) {
  await galleryRepository.delete(id);
}
