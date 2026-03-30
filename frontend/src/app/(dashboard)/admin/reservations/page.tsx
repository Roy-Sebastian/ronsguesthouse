'use client';

import { TableActions } from '@/components/ui/TableActions';


import { CalendarCheck, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';

const statusBadge: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
  checked_in: 'bg-green-50 text-green-700 border-green-100',
  checked_out: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  no_show: 'bg-red-50 text-red-700 border-red-100',
};
const statusLabel: Record<string, string> = {
  confirmed: 'Dikonfirmasi',
  checked_in: 'Check In',
  checked_out: 'Check Out',
  cancelled: 'Dibatalkan',
  pending: 'Pending',
  no_show: 'No Show',
};

export default function SuperadminReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    guestId: '',
    roomId: '',
    checkInDate: '',
    checkOutDate: '',
    numGuests: 1,
    specialRequests: '',
    totalPrice: 0,
  });

  const fetchAll = async () => {
    setLoading(true);
    const [res, g, r] = await Promise.all([
      fetch('/api/reservations')
        .then((x) => x.json())
        .catch(() => []),
      fetch('/api/guests')
        .then((x) => x.json())
        .catch(() => []),
      fetch('/api/rooms')
        .then((x) => x.json())
        .catch(() => []),
    ]);
    setReservations(Array.isArray(res) ? res : []);
    setGuests(Array.isArray(g) ? g : []);
    setRooms(Array.isArray(r) ? r : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const calcPrice = () => {
    const room = rooms.find((r) => r.id === form.roomId);
    if (!room || !form.checkInDate || !form.checkOutDate) return;
    const nights = Math.max(
      1,
      Math.ceil(
        (new Date(form.checkOutDate).getTime() -
          new Date(form.checkInDate).getTime()) /
          86400000,
      ),
    );
    setForm((f) => ({ ...f, totalPrice: Number(room.pricePerNight) * nights }));
  };

  useEffect(() => {
    calcPrice();
  }, [form.roomId, form.checkInDate, form.checkOutDate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, channel: 'internal' }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Gagal membuat reservasi');
        setSaving(false);
        return;
      }
      setShowModal(false);
      setForm({
        guestId: '',
        roomId: '',
        checkInDate: '',
        checkOutDate: '',
        numGuests: 1,
        specialRequests: '',
        totalPrice: 0,
      });
      fetchAll();
    } catch {
      setError('Terjadi kesalahan');
    }
    setSaving(false);
  };

  const handleStatus = async (id: string, status: string) => {
    await fetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  const formatRp = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(v);
  const fmtDate = (d: string) =>
    d
      ? new Date(d).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '-';

  const filtered = reservations.filter(
    (r) =>
      r.guest?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.room?.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
      r.status?.toLowerCase().includes(search.toLowerCase()),
  );

  const { sortedData, handleSort, sortBy, sortOrder } = useTableSort(filtered);

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Reservasi</h1>
          <p className="page-subtitle">
            Kelola semua reservasi tamu
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Buat Reservasi</span></button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', val: reservations.length, color: 'text-dark' },
          {
            label: 'Pending',
            val: reservations.filter((r) => r.status === 'pending').length,
            color: 'text-amber-600',
          },
          {
            label: 'Check In',
            val: reservations.filter((r) => r.status === 'checked_in').length,
            color: 'text-green-600',
          },
          {
            label: 'Dibatalkan',
            val: reservations.filter((r) => r.status === 'cancelled').length,
            color: 'text-red-600',
          },
        ].map(({ label, val, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className={`font-serif text-3xl font-bold ${color}`}>
              {val}
            </div>
            <div className="text-sm text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="search-bar flex-1">
        <Search size={18} className="text-gray-400 ml-2 shrink-0" />
        <input
          className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
          placeholder="Cari nama tamu, nomor kamar, atau status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card table-wrapper">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr>
              <SortableHeader
                label="Tamu"
                field="guest.fullName"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Kamar"
                field="room.roomNumber"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Check-In"
                field="checkInDate"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Check-Out"
                field="checkOutDate"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Jml Tamu"
                field="numGuests"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Total"
                field="totalPrice"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Status"
                field="status"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <th className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-20 text-center">
                  <div className="w-8 h-8 mx-auto border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-gray-400">
                  <CalendarCheck
                    size={40}
                    className="mx-auto mb-3 opacity-20"
                  />
                  <div className="text-sm">Belum ada reservasi</div>
                </td>
              </tr>
            ) : (
              sortedData.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50/60 transition-colors border-b border-gray-50 last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-dark text-sm">
                      {r.guest?.fullName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {r.guest?.email}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    Kamar {r.room?.roomNumber}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {fmtDate(r.checkInDate)}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {fmtDate(r.checkOutDate)}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {r.numGuests}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-dark">
                    {formatRp(r.totalPrice)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge[r.status] || 'bg-gray-100 text-gray-500'}`}
                    >
                      {statusLabel[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <TableActions
                        viewPermission="reservation.view"
                        editPermission="reservation.edit"
                        onView={() => alert('Detail reservasi segera hadir')}
                        onEdit={() => alert('Edit reservasi segera hadir')}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="page-title">
                Buat Reservasi
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Tamu
                </label>
                <select
                  required
                  value={form.guestId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, guestId: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50"
                >
                  <option value="">Pilih tamu...</option>
                  {guests.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Kamar
                </label>
                <select
                  required
                  value={form.roomId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, roomId: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50"
                >
                  <option value="">Pilih kamar...</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Kamar {r.roomNumber} — {r.roomType}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Check-In
                  </label>
                  <input
                    type="date"
                    required
                    value={form.checkInDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, checkInDate: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Check-Out
                  </label>
                  <input
                    type="date"
                    required
                    value={form.checkOutDate}
                    min={form.checkInDate || undefined}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, checkOutDate: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Jumlah Tamu
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.numGuests}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      numGuests: Number(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50"
                />
              </div>
              {form.totalPrice > 0 && (
                <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 text-sm font-semibold text-dark">
                  Estimasi Total: {formatRp(form.totalPrice)}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-60 shadow-sm"
                >
                  {saving ? 'Menyimpan...' : 'Buat Reservasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
