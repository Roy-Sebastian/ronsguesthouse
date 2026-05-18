'use client';
import { apiFetch } from '@/lib/apiFetch';
import { showToast } from '@/lib/toast';
import { confirmAction } from '@/lib/dialog';
import { TableActions } from '@/components/ui/TableActions';
import { STATUS_BADGE, STATUS_LABEL } from '@/lib/constants';

import { formatRp, fmtDate } from '@/lib/formatters';



import { CalendarCheck, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import swal from '@/lib/swal';
import { useNotifications } from '@/providers/NotificationProvider';



export default function SuperadminReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<string>('');
  const [viewReservation, setViewReservation] = useState<any | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid' | 'partial'>('unpaid');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [guestSearch, setGuestSearch] = useState('');
  const [guestDropdownOpen, setGuestDropdownOpen] = useState(false);
  const [priceOverride, setPriceOverride] = useState(false);
  const [form, setForm] = useState({
    guestId: '',
    roomId: '',
    checkInDate: '',
    checkOutDate: '',
    numGuests: 1,
    specialRequests: '',
    totalPrice: 0,
    status: '',
  });

  const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    pending:    ['pending', 'confirmed', 'cancelled', 'no_show'],
    confirmed:  ['confirmed', 'checked_in', 'cancelled', 'no_show'],
    checked_in: ['checked_in', 'checked_out'],
  };

  const { paymentToasts } = useNotifications();

  const fetchAll = async () => {
    setLoading(true);
    const [res, g, r] = await Promise.all([
      apiFetch('/reservations')
        .then((x) => x.json())
        .catch(() => []),
      apiFetch('/guests')
        .then((x) => x.json())
        .catch(() => []),
      apiFetch('/rooms')
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

  // Auto-refresh reservations when a payment is confirmed in real-time
  useEffect(() => {
    if (paymentToasts.length > 0) {
      fetchAll();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentToasts.length]);

  const calcPrice = () => {
    if (priceOverride) return;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.roomId, form.checkInDate, form.checkOutDate, priceOverride]);

  const resetForm = () => {
    setEditId(null);
    setForm({ guestId: '', roomId: '', checkInDate: '', checkOutDate: '', numGuests: 1, specialRequests: '', totalPrice: 0, status: '' });
    setPaymentStatus('unpaid');
    setPaymentMethod('cash');
    setPaymentAmount('');
    setGuestSearch('');
    setGuestDropdownOpen(false);
    setPriceOverride(false);
    setError('');
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (r: any) => {
    setEditId(r.id);
    setOriginalStatus(r.status || 'pending');
    setGuestSearch(r.guest?.fullName || '');
    setPriceOverride(false);
    setForm({
      guestId: r.guestId || r.guest?.id || '',
      roomId: r.roomId || r.room?.id || '',
      checkInDate: r.checkInDate?.slice(0, 10) || '',
      checkOutDate: r.checkOutDate?.slice(0, 10) || '',
      numGuests: r.numGuests || 1,
      specialRequests: r.specialRequests || '',
      totalPrice: Number(r.totalPrice) || 0,
      status: r.status || 'pending',
    });
    setError('');
    setShowModal(true);
  };

  const executeSave = async (isPast: boolean) => {
    setSaving(true);
    setError('');
    try {
      const url = editId ? `/api/reservations/${editId}` : '/api/reservations';
      const method = editId ? 'PATCH' : 'POST';
      const { status, ...createForm } = form;
      const body = editId
        ? { numGuests: form.numGuests, specialRequests: form.specialRequests, status: form.status }
        : { ...createForm, channel: 'internal', ...(isPast && { status: 'checked_out' }) };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Gagal menyimpan reservasi');
        setSaving(false);
        return;
      }
      if (!editId && paymentStatus !== 'unpaid') {
        const resData = await res.json();
        const txAmount = paymentStatus === 'paid' ? form.totalPrice : Number(paymentAmount);
        if (txAmount > 0) {
          await apiFetch('/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservationId: resData.id, amount: txAmount, paymentMethod, paymentStatus: 'paid' }),
          });
        }
      }
      setShowModal(false);
      resetForm();
      showToast(editId ? 'Reservasi berhasil diperbarui' : 'Reservasi berhasil dibuat');
      fetchAll();
    } catch {
      setError('Terjadi kesalahan');
    }
    setSaving(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestId) { setError('Pilih tamu terlebih dahulu'); return; }
    if (!editId) {
      const today = new Date().toISOString().split('T')[0];
      if (form.checkOutDate && form.checkOutDate < today) {
        const ok = await confirmAction('Tanggal check-out yang diinput sudah berlalu. Apakah ini reservasi yang belum tercatat? Reservasi akan langsung dikonfirmasi dan masuk ke riwayat.', 'Reservasi Masa Lalu?');
        if (ok) {
          await executeSave(true);
        }
        return;
      }
    }
    await executeSave(false);
  };


  const handleDelete = async (id: string) => {
    const result = await swal.fire({
      icon: 'warning',
      title: 'Konfirmasi',
      text: 'Hapus reservasi ini secara permanen? Tindakan ini tidak bisa dibatalkan.',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await apiFetch(`/reservations/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menghapus reservasi');
      }
      fetchAll();
      showToast('Reservasi berhasil dihapus');
    } catch (e: any) {
      await swal.fire({ icon: 'error', title: 'Gagal', text: e.message });
    }
  };
  const sortedGuests = [...guests].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, 'id', { sensitivity: 'base' }),
  );
  const filteredGuests = guestSearch
    ? sortedGuests.filter((g) => {
        const q = guestSearch.toLowerCase();
        return (
          g.fullName.toLowerCase().includes(q) ||
          (g.phone && g.phone.includes(q)) ||
          (g.email && g.email.toLowerCase().includes(q))
        );
      })
    : sortedGuests;

  const filtered = reservations.filter((r) => {
    let dateMatch = true;
    if (dateStart || dateEnd) {
      const rCheckIn = new Date(r.checkInDate).getTime();
      const rCheckOut = new Date(r.checkOutDate).getTime();

      if (dateStart) {
        const fStart = new Date(dateStart + 'T00:00:00').getTime();
        if (rCheckOut < fStart) dateMatch = false;
      }
      if (dateEnd) {
        const fEnd = new Date(dateEnd + 'T23:59:59').getTime();
        if (rCheckIn > fEnd) dateMatch = false;
      }
    }

    const searchMatch = !search ||
      r.guest?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.room?.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
      r.status?.toLowerCase().includes(search.toLowerCase());

    return dateMatch && searchMatch;
  });

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
          onClick={openCreate}
          className="btn btn-primary btn-md"
        >
          <Plus size={16} /> <span>Buat Reservasi</span></button>
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

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-bar flex-1 m-0">
          <Search size={18} className="text-gray-400 ml-2 shrink-0" />
          <input
            className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
            placeholder="Cari nama tamu, nomor kamar, atau status..."
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
                  className="hover:bg-red-50/20 transition-colors border-b border-gray-100 last:border-0"
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
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-500'}`}
                    >
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <TableActions
                        viewPermission="reservation.view"
                        editPermission="reservation.edit"
                        onView={() => setViewReservation(r)}
                        onEdit={() => openEdit(r)}
                        deletePermission="reservation.delete"
                        onDelete={() => handleDelete(r.id)}
                        editClassName="btn btn-ghost btn-icon text-green-600 hover:bg-green-50 hover:text-green-700"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-100 shrink-0">
              <h2 className="page-title">
                {editId ? 'Edit Reservasi' : 'Buat Reservasi'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-8 py-6">
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Tamu
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Ketik nama tamu..."
                    value={guestSearch}
                    disabled={!!editId}
                    onChange={(e) => {
                      setGuestSearch(e.target.value);
                      setGuestDropdownOpen(true);
                      setForm((f) => ({ ...f, guestId: '' }));
                    }}
                    onFocus={() => setGuestDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setGuestDropdownOpen(false), 150)}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/15 bg-gray-50 pr-8 disabled:opacity-60 ${form.guestId ? 'border-green-400 focus:border-green-400' : 'border-gray-200 focus:border-primary'}`}
                  />
                  {form.guestId && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xs font-bold">✓</span>
                  )}
                  {!editId && guestDropdownOpen && (filteredGuests.length > 0 || guestSearch) && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredGuests.length > 0 ? filteredGuests.map((g) => (
                        <div
                          key={g.id}
                          onMouseDown={() => {
                            setForm((f) => ({ ...f, guestId: g.id }));
                            setGuestSearch(g.fullName);
                            setGuestDropdownOpen(false);
                          }}
                          className="px-4 py-2.5 hover:bg-primary/5 cursor-pointer border-b border-gray-50 last:border-0"
                        >
                          <div className="text-sm font-medium text-gray-900 truncate">{g.fullName}</div>
                          <div className="text-xs text-gray-400 mt-0.5 truncate">
                            {g.phone
                              ? <>{g.phone}{g.email ? <span className="hidden sm:inline"> · {g.email}</span> : null}</>
                              : g.email
                                ? g.email
                                : g.idNumber
                                  ? <>NIK: ****{String(g.idNumber).slice(-4)}</>
                                  : <span className="font-mono">#{String(g.id).slice(-6).toUpperCase()}</span>
                            }
                          </div>
                        </div>
                      )) : (
                        <div className="px-4 py-2.5 text-sm text-gray-400">Tamu tidak ditemukan</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Kamar
                </label>
                <select
                  required
                  disabled={!!editId}
                  value={form.roomId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, roomId: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50 disabled:opacity-60"
                >
                  <option value="">Pilih kamar...</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Kamar {r.roomNumber} - {r.roomType}
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
                    disabled={!!editId}
                    value={form.checkInDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, checkInDate: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Check-Out
                  </label>
                  <input
                    type="date"
                    required
                    disabled={!!editId}
                    value={form.checkOutDate}
                    min={form.checkInDate || undefined}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, checkOutDate: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50 disabled:opacity-60"
                  />
                </div>
              </div>
              {editId && (() => {
                const opts = ALLOWED_TRANSITIONS[originalStatus] ?? [];
                const isTerminal = opts.length === 0;
                return (
                  <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                    <label className="block text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                      Status Reservasi
                    </label>
                    <select
                      disabled={isTerminal}
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl text-sm font-semibold outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white disabled:opacity-60 text-green-800"
                    >
                      {isTerminal
                        ? <option value={form.status}>{STATUS_LABEL[form.status] || form.status}</option>
                        : opts.map((s) => (
                          <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>
                        ))
                      }
                    </select>
                    {isTerminal && (
                      <p className="mt-1.5 text-xs text-green-600">Status ini tidak dapat diubah lagi.</p>
                    )}
                  </div>
                );
              })()}
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
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Permintaan Khusus
                </label>
                <textarea
                  rows={2}
                  value={form.specialRequests}
                  onChange={(e) => setForm((f) => ({ ...f, specialRequests: e.target.value }))}
                  placeholder="Opsional..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50 resize-none"
                />
              </div>
              {!editId && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Status Pembayaran
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as 'unpaid' | 'paid' | 'partial')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50"
                    >
                      <option value="unpaid">Belum Bayar</option>
                      <option value="paid">Lunas</option>
                      <option value="partial">Sebagian</option>
                    </select>
                  </div>
                  {paymentStatus !== 'unpaid' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Metode Pembayaran
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50"
                        >
                          <option value="cash">Tunai (Cash)</option>
                          <option value="transfer">Transfer Bank</option>
                          <option value="credit_card">Kartu Kredit</option>
                          <option value="qris">QRIS</option>
                        </select>
                      </div>
                      {paymentStatus === 'partial' && (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Jumlah Dibayar
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="Masukkan jumlah..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Harga Total
                  </label>
                  {priceOverride && (
                    <button
                      type="button"
                      onClick={() => {
                        setPriceOverride(false);
                        const room = rooms.find((r) => r.id === form.roomId);
                        if (room && form.checkInDate && form.checkOutDate) {
                          const nights = Math.max(1, Math.ceil((new Date(form.checkOutDate).getTime() - new Date(form.checkInDate).getTime()) / 86400000));
                          setForm((f) => ({ ...f, totalPrice: Number(room.pricePerNight) * nights }));
                        }
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Reset otomatis
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min={0}
                  value={form.totalPrice || ''}
                  onChange={(e) => {
                    setPriceOverride(true);
                    setForm((f) => ({ ...f, totalPrice: Number(e.target.value) }));
                  }}
                  placeholder="Masukkan harga..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {priceOverride ? '⚠ Harga diatur manual' : 'Dihitung otomatis berdasarkan kamar & tanggal'}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary btn-md"
                >
                  {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Buat Reservasi'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Past Reservation Confirmation removed */}

      {/* View Detail Modal */}
      {viewReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-100 shrink-0">
              <h2 className="page-title">Detail Reservasi</h2>
              <button
                onClick={() => setViewReservation(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-8 py-6">
            <dl className="space-y-3 text-sm">
              {[
                ['Kode Booking', viewReservation.bookingCode || '-'],
                ['Tamu', viewReservation.guest?.fullName || '-'],
                ['Email', viewReservation.guest?.email || '-'],
                ['Telepon', viewReservation.guest?.phone || '-'],
                ['Kamar', viewReservation.room ? `Kamar ${viewReservation.room.roomNumber} – ${viewReservation.room.roomType}` : '-'],
                ['Check-In', fmtDate(viewReservation.checkInDate)],
                ['Check-Out', fmtDate(viewReservation.checkOutDate)],
                ['Jumlah Tamu', viewReservation.numGuests],
                ['Total', formatRp(viewReservation.totalPrice)],
                ['Status', viewReservation.status],
                ['Permintaan Khusus', viewReservation.specialRequests || '-'],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-0">
                  <dt className="text-gray-400 shrink-0">{label}</dt>
                  <dd className="font-medium text-gray-800 text-right">{String(value)}</dd>
                </div>
              ))}
            </dl>
            <button
              onClick={() => setViewReservation(null)}
              className="mt-6 w-full py-2.5 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
            >
              Tutup
            </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
