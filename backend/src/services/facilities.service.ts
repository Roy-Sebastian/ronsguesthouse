import { facilityRepository } from '../repositories/facility.repository';

export async function getAllFacilities() {
  return facilityRepository.findAll({ orderBy: { createdAt: 'desc' } });
}

export async function getFacilityById(id: string) {
  return facilityRepository.findById(id);
}

export async function createFacility(data: any) {
  return facilityRepository.create({ data });
}

export async function updateFacility(id: string, data: any) {
  return facilityRepository.update(id, { data });
}

export async function deleteFacility(id: string) {
  await facilityRepository.delete(id);
}
