'use client';
import { apiFetch } from '@/lib/apiFetch';
import { showToast } from '@/lib/toast';

import { confirmAction } from '@/lib/dialog';
import { formatRp, fmtDate } from '@/lib/formatters';

import { parseIncomeDescription } from '@/lib/income-description';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import {
  ArrowUpRight,
  Calendar,
  DollarSign,
  Edit,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { Pagination } from '@/components/ui/Pagination';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AdminIncomePage() {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editIncome, setEditIncome] = useState<any>(null);
  const [form, setForm] = useState({
    amount: '',
    description: '',
    incomeDate: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, period, dateStart, dateEnd]);

  const fetchData = async () => {
    setLoading(true);
    const data = await apiFetch(`/incomes${search ? `?search=${search}` : ''}`)
      .then((r) => r.json())
      .catch(() => []);
    setIncomes(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const openCreate = () => {
    setEditIncome(null);
    setForm({
      amount: '',
      description: '',
      incomeDate: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const openEdit = (e: any) => {
    setEditIncome(e);
    setForm({
      amount: e.amount.toString(),
      description: e.description || '',
      incomeDate: new Date(e.incomeDate || e.createdAt)
        .toISOString()
        .split('T')[0],
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      amount: Number(form.amount),
      incomeDate: new Date(form.incomeDate).toISOString(),
    };
    if (editIncome) {
      await apiFetch(`/incomes/${editIncome.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch('/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setShowModal(false);
    showToast(editIncome ? 'Pendapatan berhasil diperbarui' : 'Pendapatan berhasil dicatat');
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction('Hapus catatan pendapatan ini?');
    if (!ok) return;
    await apiFetch(`/incomes/${id}`, { method: 'DELETE' });
    showToast('Pendapatan berhasil dihapus');
    fetchData();
  };

  

  const fmtDate = (d: string) =>
    d
      ? new Date(d).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '-';

  const incomeTransactions = incomes.filter(
    (t) =>
      !search || t.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredByPeriod = incomeTransactions.filter((t) => {
    const incomeTime = new Date(t.incomeDate || t.createdAt).getTime();

    if (dateStart || dateEnd) {
      if (dateStart && incomeTime < new Date(dateStart + 'T00:00:00').getTime()) return false;
      if (dateEnd && incomeTime > new Date(dateEnd + 'T23:59:59').getTime()) return false;
      return true;
    }

    if (period === 'all') return true;
    const d = new Date(t.incomeDate || t.createdAt);
    const now = new Date();

    if (period === 'day') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    if (period === 'week') {
      // 7 Hari Terakhir
      return now.getTime() - d.getTime() < 7 * 86400000;
    }
    if (period === 'month') {
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }
    if (period === 'year') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalIncome = filteredByPeriod.reduce(
    (s, t) => s + Number(t.amount || 0),
    0,
  );

  const totalIncomeAll = incomes.reduce((s, t) => s + Number(t.amount || 0), 0);
  const monthlyIncomeCurrent = incomes.filter((t) => {
    const d = new Date(t.incomeDate || t.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, t) => s + Number(t.amount || 0), 0);

  const generateChartData = () => {
    const sorted = [...filteredByPeriod].sort(
      (a, b) =>
        new Date(a.incomeDate || a.createdAt).getTime() -
        new Date(b.incomeDate || b.createdAt).getTime(),
    );
    const groups: Record<string, number> = {};
    sorted.forEach((t) => {
      const d = new Date(t.incomeDate || t.createdAt);
      let key = '';
      if (period === 'day') {
        key = d.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });
      } else if (period === 'week') {
        key = d.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: '2-digit',
          month: 'short',
        });
      } else if (period === 'month') {
        key = d.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      } else {
        key = d.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
      groups[key] = (groups[key] || 0) + Number(t.amount || 0);
    });

    return {
      labels: Object.keys(groups),
      datasets: [
        {
          label: 'Pendapatan (Rp)',
          data: Object.values(groups),
          backgroundColor: 'rgba(230,168,48,0.8)',
          borderRadius: 4,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
          borderSkipped: false,
        },
      ],
    };
  };

  const chartData = generateChartData();
  const { sortedData, handleSort, sortBy, sortOrder } = useTableSort(filteredByPeriod);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            Pendapatan
          </h1>
          <p className="page-subtitle">
            Pantau dan analisis pendapatan penginapan
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn btn-primary btn-md shadow-sm"
        >
          <Plus size={18} />{' '}
          <span>Catat Pendapatan</span>
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          {
            label: 'Total Pendapatan',
            val: formatRp(totalIncomeAll),
            icon: DollarSign,
            color: 'text-primary',
            bg: 'bg-primary/8',
          },
          {
            label: 'Bulan Ini',
            val: formatRp(monthlyIncomeCurrent),
            icon: Calendar,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Transaksi',
            val: filteredByPeriod.length,
            icon: ArrowUpRight,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Rata-rata / Transaksi',
            val:
              filteredByPeriod.length > 0
                ? formatRp(totalIncome / filteredByPeriod.length)
                : 'Rp 0',
            icon: TrendingUp,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          },
        ].map(({ label, val, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex items-start gap-4"
          >
            <div
              className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}
            >
              <Icon size={20} className={color} />
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">{label}</div>
              <div className="font-serif text-xl font-bold text-dark">
                {val}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-4 mb-5 xl:items-center">
        <div className="search-bar flex-1 m-0">
          <Search size={18} className="text-gray-400 ml-1 shrink-0" />
          <input
            className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
            placeholder="Cari keterangan transaksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <DateRangeFilter
            startDate={dateStart}
            endDate={dateEnd}
            onStartDateChange={(v) => { setDateStart(v); setPeriod('all'); }}
            onEndDateChange={(v) => { setDateEnd(v); setPeriod('all'); }}
            className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
          />
          <div className="hidden sm:block w-px h-6 bg-gray-200 mx-2"></div>
          {[
            ['all', 'Semua'],
            ['day', 'Hari Ini'],
            ['week', '7 Hari'],
            ['month', 'Bulan Ini'],
            ['year', 'Tahun Ini'],
          ].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => { setPeriod(val); setDateStart(''); setDateEnd(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === val ? 'bg-primary text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:border-primary/30'}`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {chartData.labels.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-dark mb-5 text-sm">
            Statistik Pendapatan {period === 'day' ? '(Per Jam)' : '(Per Hari)'}
          </h2>
          <div className="w-full">
            <div style={{ height: 280 }}>
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(0,0,0,0.04)' },
                      ticks: {
                        callback: (v) =>
                          'Rp ' + Number(v).toLocaleString('id-ID'),
                      },
                    },
                    x: { grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Transactions table */}
      <div className="card table-wrapper">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr>
              <SortableHeader
                label="Tanggal"
                field="incomeDate"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-4 py-3 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Dibuat Oleh"
                field="user.name"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-4 py-3 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Keterangan"
                field="description"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-4 py-3 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Sumber & Referensi"
                field="referenceId"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-4 py-3 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Jumlah"
                field="amount"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-4 py-3 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <th className="px-6 py-3.5 bg-gray-50 text-[11px] font-bold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200 text-center">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="w-8 h-8 mx-auto border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </td>
              </tr>
            ) : filteredByPeriod.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-gray-400">
                  <TrendingUp size={40} className="mx-auto mb-3 opacity-20" />
                  <div className="text-sm">Belum ada data pendapatan</div>
                </td>
              </tr>
            ) : (
              paginatedData.map((t, i) => (
                <tr
                  key={t.id || i}
                  className="hover:bg-red-50/20 transition-colors border-b border-gray-100 last:border-0"
                >
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {fmtDate(t.incomeDate || t.date || t.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {t.user?.name || 'Sistem / Anonim'}
                  </td>
                  <td className="px-4 py-3 text-sm text-dark font-medium whitespace-normal max-w-md">
                    {(() => {
                      const parsed = parseIncomeDescription(t.description);
                      return (
                        <div className="space-y-2">
                          <p className="text-sm text-dark font-medium leading-snug">
                            {parsed.main}
                          </p>
                          {parsed.addOns.length > 0 && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                                Add-On Diambil ({parsed.addOns.length})
                              </span>
                              <ul className="space-y-1">
                                {parsed.addOns.map((addOn, idx) => (
                                  <li
                                    key={`${t.id || i}-addon-${idx}`}
                                    className="text-xs text-gray-600 leading-snug"
                                  >
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span>- {addOn.label}</span>
                                      {addOn.quantity !== null && (
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                                          x{addOn.quantity}
                                        </span>
                                      )}
                                      {addOn.total !== null && (
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                          {formatRp(addOn.total)}
                                        </span>
                                      )}
                                    </div>
                                    {addOn.note && (
                                      <p className="mt-0.5 ml-2 text-[11px] text-gray-500">
                                        Catatan: {addOn.note}
                                      </p>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    {t.transactionId ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold tracking-wide uppercase">
                            Sistem Reservasi
                          </span>
                        </div>
                        {(t.transaction?.reservation?.room?.roomNumber || t.roomNumberSnapshot) && (
                          <span className="text-sm font-semibold text-[#191919]">
                            Kamar {t.transaction?.reservation?.room?.roomNumber || t.roomNumberSnapshot}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 truncate max-w-[150px]">
                          {t.transaction?.reservation?.guest?.fullName || t.guestNameSnapshot || 'Tamu Anonim'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold tracking-wide uppercase">
                            Kasir / Manual
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 font-mono mt-1">
                          {t.referenceId || t.id?.slice(0, 12)}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-green-600">
                    + {formatRp(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {t.transactionId ? (
                      <span className="text-xs text-gray-400 italic opacity-60">
                        Sistem Terkunci
                      </span>
                    ) : (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => openEdit(t)}
                          className="btn btn-ghost btn-icon text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="btn btn-danger btn-sm btn-icon"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          page={currentPage}
          limit={itemsPerPage}
          total={sortedData.length}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
              <h3 className="font-semibold text-[#191919] text-lg">
                {editIncome ? 'Edit Pendapatan' : 'Catat Pendapatan Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#64748B] hover:bg-[#E2E8F0] p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1.5">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={form.incomeDate}
                    onChange={(e) =>
                      setForm({ ...form, incomeDate: e.target.value })
                    }
                    className="form-input mb-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1.5">
                    Kategori / Keterangan
                  </label>
                  <select
                    required
                    value={form.description.split(' - ')[0] || ''}
                    onChange={(e) => {
                      const base = e.target.value;
                      if (!base) return setForm({ ...form, description: '' });
                      if (base === 'Lainnya') return setForm({ ...form, description: 'Lainnya - ' });
                      setForm({ ...form, description: base });
                    }}
                    className="form-input mb-2"
                  >
                    <option value="" disabled>-- Pilih Kategori --</option>
                    <option value="Denda Keterlambatan Check-Out">Denda Keterlambatan Check-Out</option>
                    <option value="Denda Kerusakan Fasilitas">Denda Kerusakan Fasilitas</option>
                    <option value="Sewa Ruangan Eksternal">Sewa Ruangan Eksternal</option>
                    <option value="Penjualan Konsumsi Tambahan">Penjualan Konsumsi Tambahan (Kasir)</option>
                    <option value="Lainnya">Lainnya (Isi Manual)</option>
                  </select>

                  {form.description.startsWith('Lainnya') && (
                    <input
                      type="text"
                      required
                      placeholder="Tuliskan keterangan manual..."
                      value={form.description.replace('Lainnya - ', '')}
                      onChange={(e) =>
                        setForm({ ...form, description: `Lainnya - ${e.target.value}` })
                      }
                      className="form-input mb-2"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-1.5">
                    Jumlah (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1000000"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    className="form-input mb-2"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-[#64748B] hover:bg-[#F1F5F9] font-medium rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#191919] hover:bg-[#191919]/90 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
