'use client';
import { apiFetch } from '@/lib/apiFetch';

import { AlertCircle, CreditCard, Plus, Search, X } from 'lucide-react';
import { formatRp } from '@/lib/formatters';

import { useEffect, useState } from 'react';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import swal from '@/lib/swal';

const methodOptions = [
  { id: 'cash', label: 'Tunai (Cash)' },
  { id: 'transfer', label: 'Transfer Bank' },
  { id: 'credit_card', label: 'Kartu Kredit' },
  { id: 'qris', label: 'QRIS' },
];

export default function ReceptionistTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [dateStart, setDateStart] = useState(today);
  const [dateEnd, setDateEnd] = useState('');
  const [form, setForm] = useState({
    reservationId: '',
    amount: '',
    paymentMethod: 'cash',
    referenceId: '',
  });

  const fetchData = async () => {
    setLoading(true);
    const [tx, rev] = await Promise.all([
      apiFetch('/transactions')
        .then((r) => r.json())
        .catch(() => []),
      apiFetch('/reservations')
        .then((r) => r.json())
        .catch(() => []),
    ]);
    setTransactions(Array.isArray(tx) ? tx : []);
    setReservations(Array.isArray(rev) ? rev : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      const res = await apiFetch('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mencatat transaksi');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      await swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  

  const pendingReservations = reservations
    .map((r) => {
      const paid = transactions
        .filter((t) => t.reservationId === r.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const total = Number(r.totalPrice);
      return {
        ...r,
        paid,
        total,
        isPaidStr:
          paid >= total ? 'Lunas' : paid > 0 ? 'Sebagian' : 'Belum Bayar',
      };
    })
    .filter((r) => r.status !== 'cancelled' && r.isPaidStr !== 'Lunas');

  const filtered = transactions.filter((t) => {
    let dateMatch = true;
    if (dateStart || dateEnd) {
      const txD = new Date(t.paymentDate).getTime();
      if (dateStart) {
        const start = new Date(dateStart + 'T00:00:00').getTime();
        if (txD < start) dateMatch = false;
      }
      if (dateEnd) {
        const end = new Date(dateEnd + 'T23:59:59').getTime();
        if (txD > end) dateMatch = false;
      }
    }

    const searchMatch = !search ||
      t.reservation?.guest?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      t.id.includes(search);

    return dateMatch && searchMatch;
  });

  const { sortedData, handleSort, sortBy, sortOrder } = useTableSort(filtered);

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            Transaksi & Pembayaran
          </h1>
          <p className="page-subtitle">
            Kelola pembayaran dari tamu
          </p>
        </div>
        <button
          className="btn btn-primary btn-md"
          onClick={() => {
            setForm({
              reservationId: '',
              amount: '',
              paymentMethod: 'cash',
              referenceId: '',
            });
            setShowModal(true);
          }}
        >
          <Plus size={16} /> <span>Catat Pembayaran</span></button>
      </div>

      {pendingReservations.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg shrink-0">
              <AlertCircle size={16} className="text-red-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-base font-bold text-gray-900">Tagihan Belum Lunas</h2>
              <p className="text-xs text-gray-500">{pendingReservations.length} reservasi memerlukan pembayaran</p>
            </div>
            <span className="ml-auto shrink-0 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
              {pendingReservations.length} Pending
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingReservations.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm border-l-4 border-l-red-400 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 text-sm truncate">{r.guest?.fullName}</div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        Kamar {r.room?.roomNumber}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.isPaidStr === 'Sebagian'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {r.isPaidStr}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                      <span>CI: {r.checkInDate ? new Date(r.checkInDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}</span>
                      <span>→</span>
                      <span>CO: {r.checkOutDate ? new Date(r.checkOutDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Kurang Bayar</div>
                    <div className="text-base font-bold text-red-600">{formatRp(r.total - r.paid)}</div>
                  </div>
                  <button
                    className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity shrink-0"
                    onClick={() => {
                      setForm({
                        reservationId: r.id,
                        amount: String(r.total - r.paid),
                        paymentMethod: 'cash',
                        referenceId: '',
                      });
                      setShowModal(true);
                    }}
                  >
                    Bayar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-bar flex-1 m-0">
          <Search size={18} className="text-gray-400 ml-2 shrink-0" />
          <input
            className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700"
            placeholder="Cari nama tamu, ID Transaksi..."
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
                label="ID Trx"
                field="id"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Waktu"
                field="paymentDate"
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
                label="Metode"
                field="paymentMethod"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Referensi"
                field="referenceId"
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center text-gray-400">
                  <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
                  <h3 className="text-base font-medium">
                    Belum ada transaksi
                  </h3>
                </td>
              </tr>
            ) : (
              sortedData.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-red-50/20 transition-colors"
                >
                  <td className="px-6 py-4 border-b border-gray-100 font-mono text-[0.7rem] text-gray-400">
                    {t.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100 text-xs text-gray-500">
                    {new Date(t.paymentDate).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100">
                    <strong className="font-medium text-gray-800 text-sm">
                      {t.reservation?.guest?.fullName}
                    </strong>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100 text-sm text-gray-600">
                    Kamar {t.reservation?.room?.roomNumber}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[0.65rem] font-bold rounded-full uppercase tracking-wider">
                      {methodOptions.find((mo) => mo.id === t.paymentMethod)
                        ?.label || t.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100 text-xs text-gray-500 font-mono">
                    {t.referenceId || '-'}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100 font-bold text-primary">
                    {formatRp(Number(t.amount))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-200 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-dark">
                Catat Pembayaran
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
                  Pilih Reservasi*
                </label>
                <select
                  className="form-input"
                  value={form.reservationId}
                  onChange={(e) => {
                    const rId = e.target.value;
                    const res = pendingReservations.find((r) => r.id === rId);
                    setForm({
                      ...form,
                      reservationId: rId,
                      amount: res ? String(res.total - res.paid) : '',
                    });
                  }}
                  required
                >
                  <option value="">-- Pilih --</option>
                  {pendingReservations.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.guest?.fullName} - Kamar {r.room?.roomNumber} (Kurang:{' '}
                      {formatRp(r.total - r.paid)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Metode*
                  </label>
                  <select
                    className="form-input"
                    value={form.paymentMethod}
                    onChange={(e) =>
                      setForm({ ...form, paymentMethod: e.target.value })
                    }
                  >
                    {methodOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  No. Referensi (Opsional)
                </label>
                <input
                  className="form-input"
                  value={form.referenceId}
                  onChange={(e) =>
                    setForm({ ...form, referenceId: e.target.value })
                  }
                  placeholder="Ref transfer / mesin EDC"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  className="btn btn-outline btn-md"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-md"
                  disabled={saving}
                >
                  {saving ? 'Memproses...' : 'Simpan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
