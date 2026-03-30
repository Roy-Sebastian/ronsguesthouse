'use client';

import { confirmAction } from '@/lib/dialog';
import { formatRp } from '@/lib/formatters';

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { DollarSign, Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function SuperadminExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<any>(null);
  const [form, setForm] = useState({
    category: 'utilities',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    const [statsData, expensesData] = await Promise.all([
      fetch('/api/dashboard/stats')
        .then((r) => r.json())
        .catch(() => null),
      fetch(`/api/expenses${search ? `?search=${search}` : ''}`)
        .then((r) => r.json())
        .catch(() => []),
    ]);
    setStats(statsData);
    setExpenses(Array.isArray(expensesData) ? expensesData : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, [search]);

  const openCreate = () => {
    setEditExpense(null);
    setForm({
      category: 'utilities',
      amount: '',
      description: '',
      expenseDate: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };
  const openEdit = (e: any) => {
    setEditExpense(e);
    setForm({
      category: e.category,
      amount: e.amount.toString(),
      description: e.description || '',
      expenseDate: new Date(e.expenseDate).toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      amount: Number(form.amount),
      expenseDate: form.expenseDate
        ? new Date(form.expenseDate).toISOString()
        : new Date().toISOString(),
    };
    if (editExpense) {
      await fetch(`/api/expenses/${editExpense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setShowModal(false);
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction('Hapus catatan pengeluaran ini?');
    if (!ok) return;
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    fetchExpenses();
  };

  

  const filteredByPeriod = expenses.filter((t) => {
    const matchSearch =
      !search || t.description?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    if (period === 'all') return true;
    const d = new Date(t.expenseDate || t.createdAt);
    const now = new Date();

    if (period === 'day') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    if (period === 'week') {
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

  const generateChartData = () => {
    const sorted = [...filteredByPeriod].sort(
      (a, b) =>
        new Date(a.expenseDate || a.createdAt).getTime() -
        new Date(b.expenseDate || b.createdAt).getTime(),
    );
    const groups: Record<string, number> = {};
    sorted.forEach((t) => {
      const d = new Date(t.expenseDate || t.createdAt);
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
          label: 'Pengeluaran (Rp)',
          data: Object.values(groups),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
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
      {/* Page header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            Pengeluaran
          </h1>
          <p className="page-subtitle">
            Catat dan pantau pengeluaran operasional
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={openCreate}
        >
          <Plus size={16} />{' '}
          <span className="hidden sm:inline">Catat Pengeluaran</span>
        </button>
      </div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="search-bar flex-1">
          <Search size={18} className="text-gray-400 ml-2 shrink-0" />
          <input
            className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700"
            placeholder="Cari deskripsi pengeluaran..."
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
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                period === val
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-primary/30'
              }`}
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
            Statistik Pengeluaran{' '}
            {period === 'day' ? '(Per Jam)' : '(Per Hari)'}
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
                field="expenseDate"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Kategori"
                field="category"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Deskripsi"
                field="description"
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
              <SortableHeader
                label="Dicatat Oleh"
                field="user.name"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <th className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                </td>
              </tr>
            ) : filteredByPeriod.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-gray-400">
                  <DollarSign size={48} className="mx-auto mb-4 opacity-20" />
                  <h3 className="text-base font-medium">
                    Belum ada pengeluaran
                  </h3>
                </td>
              </tr>
            ) : (
              sortedData.map((ex) => (
                <tr
                  key={ex.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 border-b border-gray-50 text-sm text-gray-500">
                    {new Date(ex.expenseDate).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50">
                    <span className="px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 rounded-md">
                      {ex.category === 'utilities'
                        ? 'Operasional'
                        : ex.category === 'salary'
                          ? 'Gaji'
                          : ex.category === 'maintenance'
                            ? 'Perawatan'
                            : ex.category === 'marketing'
                              ? 'Pemasaran'
                              : ex.category === 'supplies'
                                ? 'Persediaan'
                                : 'Lainnya'}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50 text-sm text-gray-700">
                    {ex.description || '—'}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50 font-bold text-red-600">
                    {formatRp(Number(ex.amount))}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50 text-xs text-gray-500">
                    {ex.user?.name}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors"
                        onClick={() => openEdit(ex)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => handleDelete(ex.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
                {editExpense ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
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
                  Kategori*
                </label>
                <select
                  className="form-input"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  required
                >
                  <option value="utilities">
                    Operasional (Listrik, Air, Internet)
                  </option>
                  <option value="salary">Gaji Karyawan</option>
                  <option value="maintenance">Perawatan & Perbaikan</option>
                  <option value="marketing">Pemasaran</option>
                  <option value="supplies">Persediaan/Supplies</option>
                  <option value="other">Lainnya...</option>
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
                    Tanggal*
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.expenseDate}
                    onChange={(e) =>
                      setForm({ ...form, expenseDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Deskripsi / Catatan Tambahan
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Contoh: Beli galon air minum, perbaikan AC kamar 101"
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
                  {saving ? 'Menyimpan...' : 'Simpan Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
