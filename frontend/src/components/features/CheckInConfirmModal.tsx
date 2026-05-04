'use client';

import { LogIn, User, BedDouble, Calendar, CreditCard, X, CheckCircle } from 'lucide-react';

interface Reservation {
  id: string;
  bookingCode?: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests?: number;
  totalPrice?: number;
  guest?: {
    fullName?: string;
    phone?: string;
    email?: string;
    idNumber?: string;
    nationality?: string;
  };
  room?: {
    roomNumber?: string;
    roomType?: string;
  };
}

interface CheckInConfirmModalProps {
  reservation: Reservation;
  onConfirm: (reservationId: string) => Promise<void>;
  onClose: () => void;
}

const fmtRp = (v: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);

const fmtDate = (d: string) =>
  d
    ? new Date(d).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

export default function CheckInConfirmModal({
  reservation,
  onConfirm,
  onClose,
}: CheckInConfirmModalProps) {
  const nights = Math.max(
    1,
    Math.round(
      (new Date(reservation.checkOutDate).getTime() -
        new Date(reservation.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  const handleConfirm = async () => {
    await onConfirm(reservation.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-green-50">
          <h2 className="text-lg font-serif font-bold text-dark flex items-center gap-2">
            <LogIn size={20} className="text-green-600" />
            Konfirmasi Check-In
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Verifikasi Identitas */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <User size={13} /> Verifikasi Identitas Tamu
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Nama Lengkap</span>
                <span className="font-semibold text-gray-800">{reservation.guest?.fullName || '-'}</span>
              </div>
              {reservation.guest?.idNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">No. Identitas</span>
                  <span className="font-semibold text-gray-800">{reservation.guest.idNumber}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">No. Telepon</span>
                <span className="font-semibold text-gray-800">{reservation.guest?.phone || '-'}</span>
              </div>
              {reservation.guest?.email && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email</span>
                  <span className="font-semibold text-gray-800 truncate max-w-[200px]">{reservation.guest.email}</span>
                </div>
              )}
              {reservation.guest?.nationality && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Kewarganegaraan</span>
                  <span className="font-semibold text-gray-800">{reservation.guest.nationality}</span>
                </div>
              )}
            </div>
          </div>

          {/* Detail Kamar */}
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <BedDouble size={13} /> Detail Kamar
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Kamar</span>
                <span className="font-semibold text-gray-800">
                  No. {reservation.room?.roomNumber} — <span className="capitalize">{reservation.room?.roomType}</span>
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Jumlah Tamu</span>
                <span className="font-semibold text-gray-800">{reservation.numGuests || 1} Orang</span>
              </div>
            </div>
          </div>

          {/* Durasi */}
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Calendar size={13} /> Durasi Menginap
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Check-In</span>
                <span className="font-semibold text-gray-800">{fmtDate(reservation.checkInDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Check-Out</span>
                <span className="font-semibold text-gray-800">{fmtDate(reservation.checkOutDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Durasi</span>
                <span className="font-semibold text-gray-800">{nights} Malam</span>
              </div>
            </div>
          </div>

          {/* Total */}
          {reservation.totalPrice !== undefined && (
            <div className="p-4 bg-gray-900 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <CreditCard size={16} />
                <span className="font-semibold text-sm">Total Pembayaran</span>
              </div>
              <span className="font-bold text-white text-lg">{fmtRp(Number(reservation.totalPrice))}</span>
            </div>
          )}

          {/* Booking code */}
          {reservation.bookingCode && (
            <p className="text-center text-xs text-gray-400 font-mono">
              Kode Booking: {reservation.bookingCode}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <CheckCircle size={16} />
            Konfirmasi Check-In
          </button>
        </div>
      </div>
    </div>
  );
}
