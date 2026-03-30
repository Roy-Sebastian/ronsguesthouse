'use client';

import { Clock, LogIn, LogOut, Search, PackagePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import AddOnModal from '@/components/features/AddOnModal';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';

export default function ReceptionistStaysPage() {
  const [stays, setStays] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addonReservationId, setAddonReservationId] = useState<string | null>(null);

  const fetchStays = async () => {
    setLoading(true);
    const [stRes, resRes] = await Promise.all([
      fetch('/api/stays?limit=1000')
        .then((r) => r.json())
        .then((r) => r.data || [])
        .catch(() => []),
      fetch('/api/reservations?limit=1000')
        .then((r) => r.json())
        .then((r) => r.data || r)
        .catch(() => []),
    ]);
    setStays(Array.isArray(stRes) ? stRes : []);
    setReservations(Array.isArray(resRes) ? resRes : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStays();
  }, []);

  const handleCheckIn = async (reservationId: string) => {
    try {
      const res = await fetch('/api/stays', {
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
      alert(e.message);
    }
  };

  const handleCheckOut = async (stayId: string) => {
    if (!confirm('Selesaikan masa menginap tamu (Check-Out)?')) return;
    try {
      const res = await fetch(`/api/stays/${stayId}`, {
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
      alert(e.message);
    }
  };

  const pendingArrivals = reservations.filter(
    (r) =>
      r.status === 'confirmed' &&
      (!search ||
        r.guest?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        r.room?.roomNumber?.includes(search)),
  );
  const activeStays = stays.filter(
    (s) =>
      !s.checkOutAt &&
      (!search ||
        s.reservation?.guest?.fullName
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        s.reservation?.room?.roomNumber?.includes(search)),
  );
  const historyStays = stays.filter((s) => s.checkOutAt).slice(0, 5);

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

      <div className="search-bar flex-1">
        <Search size={18} className="text-gray-400 ml-2 shrink-0" />
        <input
          className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700"
          placeholder="Cari nama tamu atau nomor kamar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
                      className="px-3.5 py-2 bg-dark hover:bg-dark-2 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0"
                      onClick={() => handleCheckIn(r.id)}
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
                        className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 shrink-0"
                        onClick={() => handleCheckOut(s.id)}
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
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Kamar"
                field="reservation.room.roomNumber"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Check-In"
                field="checkInAt"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Check-Out"
                field="checkOutAt"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
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
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 border-b border-gray-50">
                    <strong className="font-medium text-gray-800 text-sm">
                      {s.reservation?.guest?.fullName}
                    </strong>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50 text-sm text-gray-600">
                    Kamar {s.reservation?.room?.roomNumber}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50 text-xs text-gray-500">
                    {new Date(s.checkInAt).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50 text-xs text-gray-500">
                    {s.checkOutAt
                      ? new Date(s.checkOutAt).toLocaleString('id-ID')
                      : '—'}
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
    </>
  );
}
