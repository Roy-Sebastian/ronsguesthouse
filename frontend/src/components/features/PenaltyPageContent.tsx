'use client';

import { apiFetch } from '@/lib/apiFetch';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { useTableSort } from '@/hooks/useTableSort';
import { confirmAction, showError } from '@/lib/dialog';
import { formatRp } from '@/lib/formatters';
import { AlertTriangle, Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const PENALTY_TYPE_OPTIONS = [
  { value: 'late_checkout', label: 'Keterlambatan Checkout' },
  { value: 'room_damage', label: 'Kerusakan Kamar' },
  { value: 'missing_items', label: 'Barang Hilang' },
  { value: 'other', label: 'Lainnya' },
];

const PENALTY_TYPE_LABEL: Record<string, string> = {
  late_checkout: 'Keterlambatan Checkout',
  room_damage: 'Kerusakan Kamar',
  missing_items: 'Barang Hilang',
  other: 'Lainnya',
};

const PENALTY_TYPE_BADGE: Record<string, string> = {
  late_checkout: 'bg-amber-50 text-amber-700 border border-amber-200',
  room_damage: 'bg-red-50 text-red-700 border border-red-200',
  missing_items: 'bg-purple-50 text-purple-700 border border-purple-200',
  other: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Belum Dibayar' },
  { value: 'paid', label: 'Sudah Dibayar' },
  { value: 'waived', label: 'Dibebaskan' },
];

const STATUS_LABEL: Record<string, string> = {
  pending: 'Belum Dibayar',
  paid: 'Sudah Dibayar',
  waived: 'Dibebaskan',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  paid: 'bg-green-50 text-green-700 border border-green-200',
  waived: 'bg-gray-100 text-gray-600 border border-gray-200',
};

interface PenaltyPageContentProps {
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
}

export default function PenaltyPageContent({
  canEdit = true,
  canDelete = true,
  canCreate = true,
}: PenaltyPageContentProps) {
  const [penalties, setPenalties] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPenalty, setEditPenalty] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    reservationId: '',
    type: 'late_checkout',
    amount: '',
    description: '',
    notes: '',
    status: 'pending',
  });

  const fetchPenalties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/penalties?${params.toString()}`);
      const json = await res.json();
      setPenalties(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setPenalties([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await apiFetch('/reservations');
      const json = await res.json();
      const list = Array.isArray(json) ? json : json?.data || [];
      setReservations(list);
    } catch {
      setReservations([]);
    }
  };

  useEffect(() => {
    fetchPenalties();
  }, [search, statusFilter]);

  useEffect(() => {
    fetchReservations();
  }, []);

  const openCreate = () => {
    setEditPenalty(null);
    setForm({
      reservationId: '',
      type: 'late_checkout',
      amount: '',
      description: '',
      notes: '',
      status: 'pending',
    });
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditPenalty(p);
    setForm({
      reservationId: p.reservationId,
      type: p.type,
      amount: String(p.amount),
      description: p.description || '',
      notes: p.notes || '',
      status: p.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reservationId) {
      showError('Reservasi wajib dipilih');
      return;
    }
    if (Number(form.amount) <= 0) {
      showError('Jumlah denda harus lebih dari 0');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        reservationId: form.reservationId,
        type: form.type,
        amount: Number(form.amount),
        description: form.description,
        notes: form.notes || null,
        status: form.status,
      };

      const res = editPenalty
        ? await apiFetch(`/penalties/${editPenalty.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await apiFetch('/penalties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal menyimpan denda');
      }

      setShowModal(false);
      fetchPenalties();
    } catch (err: any) {
      showError(err.message || 'Gagal menyimpan denda');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction(
      'Hapus denda ini? Pendapatan dan total transaksi akan disesuaikan secara otomatis.',
    );
    if (!ok) return;
    try {
      const res = await apiFetch(`/penalties/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal menghapus denda');
      }
      fetchPenalties();
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus denda');
    }
  };

  const totalPending = penalties
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalPaid = penalties
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const { sortedData, handleSort, sortBy, sortOrder } = useTableSort(penalties);

  return (
    <>
      {/* Page header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Manajemen Denda</h1>
          <p className="page-subtitle">
            Kelola denda untuk keterlambatan checkout, kerusakan, atau barang hilang. Denda otomatis menambah total transaksi & pendapatan.
          </p>
        </div>
        {canCreate && (
          <button className="btn btn-secondary btn-md" onClick={openCreate}>
            <Plus size={16} />{' '}
            <span className="hidden sm:inline">Tambah Denda</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">
            Total Denda
          </div>
          <div className="text-2xl font-bold text-dark">{penalties.length}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">
            Belum Dibayar
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {formatRp(totalPending)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">
            Sudah Dibayar
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatRp(totalPaid)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-4 mb-6 xl:items-center">
        <div className="search-bar flex-1 m-0">
          <Search size={18} className="text-gray-400 ml-2 shrink-0" />
          <input
            className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700"
            placeholder="Cari berdasarkan deskripsi, kode booking, nama tamu, kamar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {[
            ['', 'Semua'],
            ['pending', 'Belum Bayar'],
            ['paid', 'Sudah Bayar'],
            ['waived', 'Dibebaskan'],
          ].map(([val, lbl]) => (
            <button
              key={val || 'all'}
              onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === val
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-primary/30'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card table-wrapper">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr>
              <SortableHeader
                label="Tanggal"
                field="createdAt"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Kode Booking"
                field="reservation.bookingCode"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
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
                label="Tipe"
                field="type"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Deskripsi"
                field="description"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Jumlah"
                field="amount"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Status"
                field="status"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              {(canEdit || canDelete) && (
                <th>
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-20 text-center">
                  <div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-20 text-center text-gray-400">
                  <AlertTriangle size={48} className="mx-auto mb-4 opacity-20" />
                  <h3 className="text-base font-medium">Belum ada denda dicatat</h3>
                </td>
              </tr>
            ) : (
              sortedData.map((p) => (
                <tr key={p.id} className="hover:bg-red-50/20 transition-colors">
                  <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-sm font-mono text-gray-700">
                    {p.reservation?.bookingCode || '-'}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-700">
                    {p.reservation?.guest?.fullName || '-'}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-500">
                    {p.reservation?.room?.roomNumber || '-'}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md ${PENALTY_TYPE_BADGE[p.type] || PENALTY_TYPE_BADGE.other}`}
                    >
                      {PENALTY_TYPE_LABEL[p.type] || 'Lainnya'}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-700 max-w-[240px] truncate">
                    {p.description || '-'}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 font-bold text-red-600">
                    {formatRp(Number(p.amount))}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md ${STATUS_BADGE[p.status] || STATUS_BADGE.pending}`}
                    >
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <button
                            className="btn btn-ghost btn-icon text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => openEdit(p)}
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            onClick={() => handleDelete(p.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-200 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slideUp">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-dark">
                {editPenalty ? 'Edit Denda' : 'Tambah Denda Baru'}
              </h2>
              <button
                className="text-gray-400 hover:bg-gray-100 rounded-lg p-1 transition-colors"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reservasi*
                </label>
                <select
                  className="form-input"
                  value={form.reservationId}
                  onChange={(e) =>
                    setForm({ ...form, reservationId: e.target.value })
                  }
                  required
                  disabled={!!editPenalty}
                >
                  <option value="">— Pilih Reservasi —</option>
                  {reservations.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.bookingCode} — {r.guest?.fullName || 'Tamu'} —{' '}
                      Kamar {r.room?.roomNumber || '-'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tipe Denda*
                  </label>
                  <select
                    className="form-input"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    required
                  >
                    {PENALTY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Jumlah (Rp)*
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    required
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Deskripsi*
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Contoh: Pecah gelas kamar mandi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Catatan Tambahan
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Detail tambahan jika ada"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <strong>Info:</strong> Denda akan otomatis menambah total transaksi reservasi. Jika transaksi sudah lunas, pendapatan juga ikut diperbarui.
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  className="btn btn-outline btn-md"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-secondary btn-md"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Denda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
