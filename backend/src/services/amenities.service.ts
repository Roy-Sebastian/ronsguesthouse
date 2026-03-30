import { amenityRepository } from '../repositories';

export async function getAllAmenities() {
  return amenityRepository.findAll({ orderBy: { createdAt: 'desc' } });
}

export async function getAmenityById(id: string) {
  return amenityRepository.findById(id);
}

export async function createAmenity(data: any) {
  return amenityRepository.create({ data });
}

export async function updateAmenity(id: string, data: any) {
  return amenityRepository.update(id, { data });
}

export async function deleteAmenity(id: string) {
  await amenityRepository.delete(id);
}
