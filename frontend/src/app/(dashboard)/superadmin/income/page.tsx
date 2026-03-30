'use client';


import { confirmAction } from '@/lib/dialog';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function SuperadminIncomePage() {
  const [stats, setStats] = useState<any>(null);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editIncome, setEditIncome] = useState<any>(null);
  const [form, setForm] = useState({
    amount: '',
    description: '',
    incomeDate: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [s, data] = await Promise.all([
      fetch('/api/dashboard/stats')
        .then((r) => r.json())
        .catch(() => null),
      fetch(`/api/incomes${search ? `?search=${search}` : ''}`)
        .then((r) => r.json())
        .catch(() => []),
    ]);
    setStats(s);
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
      await fetch(`/api/incomes/${editIncome.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction('Hapus catatan pendapatan ini?');
    if (!ok) return;
    await fetch(`/api/incomes/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const formatRp = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(v || 0);

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
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  };

  const chartData = generateChartData();
  const { sortedData, handleSort, sortBy, sortOrder } = useTableSort(filteredByPeriod);

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
          className="btn-dark shadow-sm"
        >
          <Plus size={18} />{' '}
          <span className="hidden sm:inline">Catat Pendapatan</span>
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          {
            label: 'Total Pendapatan',
            val: formatRp(stats?.totalIncome || 0),
            icon: DollarSign,
            color: 'text-primary',
            bg: 'bg-primary/8',
          },
          {
            label: 'Bulan Ini',
            val: formatRp(stats?.monthlyRevenue || 0),
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
            className="bg-white rounded-2xl px-5 py-3 border border-gray-100 shadow-sm flex items-start gap-4"
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
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="search-bar flex-1">
          <Search size={18} className="text-gray-400 ml-1 shrink-0" />
          <input
            className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
            placeholder="Cari keterangan transaksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            ['all', 'Semua'],
            ['day', 'Hari Ini'],
            ['week', '7 Hari'],
            ['month', 'Bulan Ini'],
            ['year', 'Tahun Ini'],
          ].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setPeriod(val)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${period === val ? 'bg-primary text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:border-primary/30'}`}
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
          <div className="overflow-x-auto w-full pb-4">
            <div
              style={{
                minWidth: `${Math.max(chartData.labels.length * 60, 600)}px`,
                height: 240,
              }}
            >
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
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Dibuat Oleh"
                field="user.name"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Keterangan"
                field="description"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Referensi"
                field="referenceId"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Jumlah"
                field="amount"
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
              sortedData.map((t, i) => (
                <tr
                  key={t.id || i}
                  className="hover:bg-gray-50/60 transition-colors border-b border-gray-50 last:border-0"
                >
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {fmtDate(t.incomeDate || t.date || t.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {t.user?.name || 'Sistem / Anonim'}
                  </td>
                  <td className="px-5 py-4 text-sm text-dark font-medium whitespace-normal max-w-md">
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
                  <td className="px-5 py-4 text-xs text-gray-400 font-mono">
                    {t.transactionId ||
                      t.referenceId ||
                      t.id?.slice(0, 12) ||
                      '-'}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-green-600">
                    + {formatRp(t.amount)}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {t.transactionId ? (
                      <span className="text-xs text-gray-400 italic">
                        Otomatis dari reservasi
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
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
                    Keterangan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sewa Ruang Meeting"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="form-input mb-2"
                  />
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
