'use client';
import { apiFetch } from '@/lib/apiFetch';
import { showToast } from '@/lib/toast';

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
import { ArrowDownRight, Calendar, DollarSign, Edit, Plus, Search, Trash2, TrendingDown, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { Pagination } from '@/components/ui/Pagination';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<any>(null);
  const [form, setForm] = useState({
    category: 'utilities',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, period, dateStart, dateEnd]);

  const fetchExpenses = async () => {
    setLoading(true);
    const data = await apiFetch(`/expenses${search ? `?search=${search}` : ''}`)
      .then((r) => r.json())
      .catch(() => []);
    setExpenses(Array.isArray(data) ? data : []);
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
      await apiFetch(`/expenses/${editExpense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setShowModal(false);
    showToast(editExpense ? 'Pengeluaran berhasil diperbarui' : 'Pengeluaran berhasil dicatat');
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction('Hapus catatan pengeluaran ini?');
    if (!ok) return;
    await apiFetch(`/expenses/${id}`, { method: 'DELETE' });
    showToast('Pengeluaran berhasil dihapus');
    fetchExpenses();
  };

  

  const filteredByPeriod = expenses.filter((t) => {
    const matchSearch =
      !search || t.description?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    const expenseTime = new Date(t.expenseDate || t.createdAt).getTime();

    if (dateStart || dateEnd) {
      if (dateStart && expenseTime < new Date(dateStart + 'T00:00:00').getTime()) return false;
      if (dateEnd && expenseTime > new Date(dateEnd + 'T23:59:59').getTime()) return false;
      return true;
    }

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
          borderRadius: 4,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
          borderSkipped: false,
        },
      ],
    };
  };

  const totalExpense = filteredByPeriod.reduce((s, t) => s + Number(t.amount || 0), 0);

  const monthlyExpense = expenses.filter((t) => {
    const d = new Date(t.expenseDate || t.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, t) => s + Number(t.amount || 0), 0);

  const chartData = generateChartData();
  const { sortedData, handleSort, sortBy, sortOrder } = useTableSort(filteredByPeriod);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          className="btn btn-primary btn-md"
          onClick={openCreate}
        >
          <Plus size={16} />{' '}
          <span>Catat Pengeluaran</span>
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Pengeluaran', val: formatRp(totalExpense), icon: DollarSign, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Bulan Ini', val: formatRp(monthlyExpense), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Transaksi', val: filteredByPeriod.length, icon: ArrowDownRight, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Rata-rata / Transaksi', val: filteredByPeriod.length > 0 ? formatRp(totalExpense / filteredByPeriod.length) : 'Rp 0', icon: TrendingDown, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(({ label, val, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">{label}</div>
              <div className="font-serif text-xl font-bold text-dark">{val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-4 mb-6 xl:items-center">
        <div className="search-bar flex-1 m-0">
          <Search size={18} className="text-gray-400 ml-2 shrink-0" />
          <input
            className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700"
            placeholder="Cari deskripsi pengeluaran..."
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                field="expenseDate"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Kategori"
                field="category"
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
                label="Dicatat Oleh"
                field="user.name"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <th className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100 text-center">
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
              paginatedData.map((ex) => (
                <tr
                  key={ex.id}
                  className="hover:bg-red-50/20 transition-colors"
                >
                  <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-500">
                    {new Date(ex.expenseDate).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md ${
                      ex.category === 'utilities' ? 'bg-blue-50 text-blue-600' :
                      ex.category === 'salary' ? 'bg-purple-50 text-purple-600' :
                      ex.category === 'maintenance' ? 'bg-orange-50 text-orange-600' :
                      ex.category === 'marketing' ? 'bg-pink-50 text-pink-600' :
                      ex.category === 'supplies' ? 'bg-teal-50 text-teal-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {ex.category === 'utilities' ? 'Operasional' : 
                       ex.category === 'salary' ? 'Gaji' : 
                       ex.category === 'maintenance' ? 'Perawatan' : 
                       ex.category === 'marketing' ? 'Pemasaran' : 
                       ex.category === 'supplies' ? 'Persediaan' : 
                       'Lainnya'}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-700">
                    {ex.description || '-'}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 font-bold text-red-600">
                    - {formatRp(Number(ex.amount))}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-xs text-gray-500">
                    {ex.user?.name}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="btn btn-ghost btn-icon text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        onClick={() => openEdit(ex)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
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
        <Pagination
          page={currentPage}
          limit={itemsPerPage}
          total={sortedData.length}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-200 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
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
