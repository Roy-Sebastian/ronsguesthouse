'use client';
import { apiFetch } from '@/lib/apiFetch';

import { AlertTriangle, Clock, LogIn, LogOut, Search, PackagePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import AddOnModal from '@/components/features/AddOnModal';
import PenaltyModal from '@/components/features/PenaltyModal';
import StayDetailModal from '@/components/features/StayDetailModal';
import CheckInConfirmModal from '@/components/features/CheckInConfirmModal';
import CheckOutBillModal from '@/components/features/CheckOutBillModal';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import swal from '@/lib/swal';

export default function ReceptionistStaysPage() {
  const [stays, setStays] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [addonReservationId, setAddonReservationId] = useState<string | null>(null);
  const [penaltyStay, setPenaltyStay] = useState<any | null>(null);
  const [detailStay, setDetailStay] = useState<any | null>(null);
  const [checkInReservation, setCheckInReservation] = useState<any | null>(null);
  const [checkOutStay, setCheckOutStay] = useState<any | null>(null);

  const fetchStays = async () => {
    setLoading(true);
    const [stRes, resRes] = await Promise.all([
      apiFetch('/stays?limit=500')
        .then((r) => r.json())
        .then((r) => (Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : []))
        .catch(() => []),
      apiFetch('/reservations')
        .then((r) => r.json())
        .then((r) => (Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : []))
        .catch(() => []),
    ]);
    setStays(stRes);
    setReservations(resRes);
    setLoading(false);
  };

  useEffect(() => {
    fetchStays();
  }, []);

  const handleCheckIn = async (reservationId: string) => {
    try {
      const res = await apiFetch('/stays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal check-in');
      }
      fetchStays();
    } catch (e: any) {
      await swal.fire({ icon: 'error', title: 'Gagal', text: e.message });
    }
  };

  const handleCheckOut = async (stayId: string) => {
    try {
      const res = await apiFetch(`/stays/${stayId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal check-out');
      }
      fetchStays();
    } catch (e: any) {
      await swal.fire({ icon: 'error', title: 'Gagal', text: e.message });
    }
  };

  const matchDate = (startObj: string | Date, endObj: string | Date | null) => {
    if (!dateStart && !dateEnd) return true;
    const startT = new Date(startObj).getTime();
    const endT = endObj ? new Date(endObj).getTime() : new Date().getTime(); // default to now if not checked out

    if (dateStart) {
      const fStart = new Date(dateStart + 'T00:00:00').getTime();
      if (endT < fStart) return false;
    }
    if (dateEnd) {
      const fEnd = new Date(dateEnd + 'T23:59:59').getTime();
      if (startT > fEnd) return false;
    }
    return true;
  };

  const pendingArrivals = reservations.filter(
    (r) =>
      r.status === 'confirmed' &&
      matchDate(r.checkInDate, r.checkOutDate) &&
      (!search ||
        r.guest?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        r.room?.roomNumber?.includes(search)),
  );
  const activeStays = stays.filter(
    (s) =>
      !s.checkOutAt &&
      matchDate(s.checkInAt, s.checkOutAt) &&
      (!search ||
        s.reservation?.guest?.fullName
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        s.reservation?.room?.roomNumber?.includes(search)),
  );
  const historyStays = stays.filter((s) => s.checkOutAt && matchDate(s.checkInAt, s.checkOutAt));

  const { sortedData: sortedHistoryStays, handleSort, sortBy, sortOrder } = useTableSort(historyStays);

  return (
    <>
      <div className="mb-8">
        <h1 className="page-title">
          Check-In / Check-Out
        </h1>
        <p className="page-subtitle">
          Kelola kedatangan dan keberangkatan tamu
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="search-bar flex-1 m-0">
          <Search size={18} className="text-gray-400 ml-2 shrink-0" />
          <input
            className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700"
            placeholder="Cari nama tamu atau nomor kamar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <DateRangeFilter
          startDate={dateStart}
          endDate={dateEnd}
          onStartDateChange={setDateStart}
          onEndDateChange={setDateEnd}
          className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Arrivals */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h3 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
              <LogIn size={18} className="text-primary" /> Tamu Akan Datang
            </h3>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
              {pendingArrivals.length} Reservasi
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : pendingArrivals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Clock size={40} className="mb-3 opacity-20" />
                <h3 className="text-sm font-medium">
                  Tidak ada jadwal kedatangan
                </h3>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingArrivals.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-gray-800 text-sm mb-1">
                        {r.guest?.fullName}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-medium text-primary">
                          Kamar {r.room?.roomNumber}
                        </span>
                        <span>
                          {new Date(r.checkInDate).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-md"
                      onClick={() => setCheckInReservation(r)}
                    >
                      <LogIn size={14} /> Check In
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Departures */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h3 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
              <LogOut size={18} className="text-primary" /> Tamu Menginap Aktif
            </h3>
            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">
              {activeStays.length} Kamar
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : activeStays.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <LogOut size={40} className="mb-3 opacity-20" />
                <h3 className="text-sm font-medium">
                  Tidak ada tamu yang menginap
                </h3>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeStays.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between border-l-4 border-l-green-500"
                  >
                    <div>
                      <div className="font-semibold text-gray-800 text-sm mb-1">
                        {s.reservation?.guest?.fullName}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-medium text-green-600">
                          Kamar {s.reservation?.room?.roomNumber}
                        </span>
                        <span>
                          Check-In:{' '}
                          {new Date(s.checkInAt).toLocaleString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 shrink-0"
                        onClick={() => setAddonReservationId(s.reservationId)}
                      >
                        <PackagePlus size={14} /> + Layanan
                      </button>
                      <button
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 shrink-0"
                        onClick={() => setPenaltyStay(s)}
                      >
                        <AlertTriangle size={14} /> + Denda
                      </button>
                      <button
                        className="btn btn-primary btn-md"
                        onClick={() => setCheckOutStay(s)}
                      >
                        <LogOut size={14} /> Selesai
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <h2 className="font-serif text-xl font-bold text-dark mb-4">
        Riwayat Terakhir
      </h2>
      <div className="card table-wrapper">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr>
              <SortableHeader
                label="Tamu"
                field="reservation.guest.fullName"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Kamar"
                field="reservation.room.roomNumber"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Check-In"
                field="checkInAt"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Check-Out"
                field="checkOutAt"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                  <div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                </td>
              </tr>
            ) : historyStays.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-20 text-center text-gray-400">
                  Belum ada riwayat check-out
                </td>
              </tr>
            ) : (
              sortedHistoryStays.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-red-50/20 transition-colors cursor-pointer"
                  onClick={() => setDetailStay(s)}
                >
                  <td className="px-6 py-4 border-b border-gray-100">
                    <strong className="font-medium text-gray-800 text-sm">
                      {s.reservation?.guest?.fullName}
                    </strong>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100 text-sm text-gray-600">
                    Kamar {s.reservation?.room?.roomNumber}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100 text-xs text-gray-500">
                    {new Date(s.checkInAt).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100 text-xs text-gray-500">
                    {s.checkOutAt
                      ? new Date(s.checkOutAt).toLocaleString('id-ID')
                      : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {addonReservationId && (
        <AddOnModal
          reservationId={addonReservationId}
          onClose={() => setAddonReservationId(null)}
          onSuccess={fetchStays}
        />
      )}

      {penaltyStay && (
        <PenaltyModal
          reservationId={penaltyStay.reservationId}
          guestName={penaltyStay.reservation?.guest?.fullName ?? '-'}
          onClose={() => setPenaltyStay(null)}
          onSuccess={fetchStays}
        />
      )}

      {detailStay && (
        <StayDetailModal
          stay={detailStay}
          onClose={() => setDetailStay(null)}
        />
      )}

      {checkInReservation && (
        <CheckInConfirmModal
          reservation={checkInReservation}
          onConfirm={handleCheckIn}
          onClose={() => setCheckInReservation(null)}
        />
      )}

      {checkOutStay && (
        <CheckOutBillModal
          stay={checkOutStay}
          onConfirm={handleCheckOut}
          onClose={() => setCheckOutStay(null)}
        />
      )}
    </>
  );
}
