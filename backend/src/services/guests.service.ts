import { getIO } from '../config/socket';
import { dbRepository } from '../repositories/db.repository';
import { guestRepository } from '../repositories/guest.repository';
import { reservationRepository } from '../repositories/reservation.repository';
import { stayRepository } from '../repositories/stay.repository';
import { transactionRepository } from '../repositories/transaction.repository';
import { userRepository } from '../repositories/user.repository';

export async function getAllGuests() {
  return guestRepository.findAll({ orderBy: { createdAt: 'desc' } });
}

export async function getGuestById(id: string) {
  return guestRepository.findById(id);
}

export interface CreateGuestInput {
  category?: string;
  roomId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  paymentMethod?: string;
  amount?: number | string;
  deposit?: string;
  notes?: string;
  userId?: string;
  fullName: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: string;
  previousLocation?: string;
  nextDestination?: string;
  purposeOfVisit?: string;
  signature?: string;
  passportNo?: string;
}

export async function createGuest(input: CreateGuestInput) {
  const {
    category,
    roomId,
    checkInDate,
    checkOutDate,
    paymentMethod,
    amount,
    deposit,
    notes,
    userId,
    fullName,
    idNumber,
    phone,
    email,
    address,
    nationality,
    dateOfBirth,
    gender,
    previousLocation,
    nextDestination,
    purposeOfVisit,
    signature,
    passportNo,
  } = input;

  const result = await dbRepository.transaction(async (tx) => {
    const identity =
      category === 'Lokal'
        ? idNumber || `LOCAL-${Date.now()}`
        : passportNo || idNumber || `INTL-${Date.now()}`;

    const guest = await guestRepository.create({
      data: {
        fullName,
        idNumber: identity,
        phone: phone || '000000',
        email,
        address,
        nationality: category === 'Lokal' ? 'Indonesia' : nationality || 'Unknown',
        category: category || 'Lokal',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        previousLocation,
        nextDestination,
        purposeOfVisit,
        signature,
      },
    }, tx);

    if (roomId) {
      let fallbackUser = userId;
      if (!fallbackUser) {
        const firstUsers = await userRepository.findAll({ take: 1 }, tx);
        if (firstUsers.length > 0) fallbackUser = firstUsers[0].id;
      }

      const cin = checkInDate ? new Date(checkInDate) : new Date();
      const cout = checkOutDate
        ? new Date(checkOutDate)
        : new Date(Date.now() + 86400000);

      const resv = await reservationRepository.create({
        data: {
          guestId: guest.id,
          roomId,
          userId: fallbackUser as string,
          checkInDate: cin,
          checkOutDate: cout,
          status: 'checked_in',
          totalPrice: amount ? Number(amount) : 0,
          specialRequests: notes,
        },
      }, tx);

      await stayRepository.create({
        data: {
          reservationId: resv.id,
          checkInAt: new Date(),
          notes: deposit ? `Deposit: ${deposit}. ${notes || ''}` : notes,
        },
      }, tx);

      let mappedPaymentMethod: any = 'cash';
      if (paymentMethod === 'transfer' || paymentMethod === 'aplikasi')
        mappedPaymentMethod = 'transfer';

      await transactionRepository.create({
        data: {
          reservationId: resv.id,
          amount: amount ? Number(amount) : 0,
          paymentMethod: mappedPaymentMethod,
          notes: deposit ? `Deposit: ${deposit}` : '',
          paymentStatus: 'paid',
        },
      }, tx);

      try {
        const io = getIO();
        if (io) {
          io.emit('room_booked', { roomId, checkInDate: cin, checkOutDate: cout });
        }
      } catch (e) {}
    }

    return guest;
  });

  return result;
}

export async function updateGuest(id: string, data: any) {
  return guestRepository.update(id, { data });
}

export async function deleteGuest(id: string) {
  await guestRepository.delete(id);
}
