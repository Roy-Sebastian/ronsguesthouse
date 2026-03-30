'use client';

import { AlertCircle, CreditCard, Plus, Search, X } from 'lucide-react';
import { formatRp } from '@/lib/formatters';

import { useEffect, useState } from 'react';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';

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
  const [form, setForm] = useState({
    reservationId: '',
    amount: '',
    paymentMethod: 'cash',
    referenceId: '',
  });

  const fetchData = async () => {
    setLoading(true);
    const [tx, rev] = await Promise.all([
      fetch('/api/transactions')
        .then((r) => r.json())
        .catch(() => []),
      fetch('/api/reservations')
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
      const res = await fetch('/api/transactions', {
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
      alert(err.message);
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

  const filtered = transactions.filter(
    (t) =>
      !search ||
      t.reservation?.guest?.fullName
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      t.id.includes(search),
  );

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
          className="btn-primary"
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
          <Plus size={16} /> <span className="hidden sm:inline">Catat Pembayaran</span></button>
      </div>

      {pendingReservations.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800 text-sm mb-1">
              Tagihan Belum Lunas
            </h4>
            <div className="text-sm text-red-700 flex flex-col gap-1">
              {pendingReservations.map((r) => (
                <div key={r.id}>
                  {r.guest?.fullName} (Kamar {r.room?.roomNumber}) — Kurang:{' '}
                  <strong>{formatRp(r.total - r.paid)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="search-bar flex-1">
        <Search size={18} className="text-gray-400 ml-2 shrink-0" />
        <input
          className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700"
          placeholder="Cari nama tamu, ID Transaksi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Waktu"
                field="paymentDate"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
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
                label="Metode"
                field="paymentMethod"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Referensi"
                field="referenceId"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Jumlah"
                field="amount"
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
                <td colSpan={7} className="py-20 text-center">
                  <div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center text-gray-400">
                  <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
                  <h3 className="text-base font-medium">
                    Belaum ada transaksi
                  </h3>
                </td>
              </tr>
            ) : (
              sortedData.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 border-b border-gray-50 font-mono text-[0.7rem] text-gray-400">
                    {t.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50 text-xs text-gray-500">
                    {new Date(t.paymentDate).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50">
                    <strong className="font-medium text-gray-800 text-sm">
                      {t.reservation?.guest?.fullName}
                    </strong>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50 text-sm text-gray-600">
                    Kamar {t.reservation?.room?.roomNumber}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[0.65rem] font-bold rounded-full uppercase tracking-wider">
                      {methodOptions.find((mo) => mo.id === t.paymentMethod)
                        ?.label || t.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50 text-xs text-gray-500 font-mono">
                    {t.referenceId || '—'}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50 font-bold text-primary">
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
                  className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
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
