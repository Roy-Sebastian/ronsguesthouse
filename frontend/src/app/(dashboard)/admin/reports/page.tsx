'use client';

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Tooltip as ChartTooltip,
  Legend,
  LinearScale,
} from 'chart.js';
import {
  Activity,
  DollarSign,
  FileSpreadsheet,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, Legend);

interface IncomeTransaction {
  id: string;
  date: string;
  description: string;
  payment_method: string;
  amount: number;
}

export default function AdminReportsPage() {
  const [data, setData] = useState<{
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    monthlyIncome: any[];
    monthlyExpenses: any[];
    recentTransactions: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatRp = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(v);

  const fetchIncomesForExport = async (): Promise<IncomeTransaction[]> => {
    try {
      const res = await fetch('/api/incomes'); 
      if (!res.ok) throw new Error('API request failed');
      const json = await res.json();
      const records = Array.isArray(json) ? json : json.data || [];
      return records.map((inc: any) => ({
        id: inc.id,
        date: inc.incomeDate || inc.createdAt,
        description: inc.description || 'Tanpa Keterangan',
        payment_method: inc.transaction?.paymentMethod || 'cash',
        amount: Number(inc.amount),
      }));
    } catch {
      // Fallback: Using recentTransactions data from dashboard stats if fetching fails
      const fallbackIncomes = data?.recentTransactions.filter((tx: any) => tx.type === 'INCOME') || [];
      return fallbackIncomes.map((tx: any) => ({
        id: tx.id || Math.random().toString(),
        date: tx.date || new Date().toISOString(),
        description: tx.description || 'Pendapatan',
        payment_method: 'N/A',
        amount: Number(tx.amount),
      }));
    }
  };

  const handleExportExcel = async () => {
    const incomes = await fetchIncomesForExport();
    const worksheetData = incomes.map((item) => ({
      'Tanggal': new Date(item.date).toLocaleDateString('id-ID'),
      'Deskripsi': item.description,
      'Metode Pembayaran': item.payment_method,
      'Jumlah': item.amount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Pendapatan');
    XLSX.writeFile(workbook, 'Laporan_Pendapatan.xlsx');
  };

  const handleExportPDF = async () => {
    const incomes = await fetchIncomesForExport();
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Laporan Pendapatan Hotel', 14, 20);

    doc.setFontSize(11);
    const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Periode: ${data?.monthlyIncome?.[0]?.month || '-'} s/d ${data?.monthlyIncome?.[data.monthlyIncome.length - 1]?.month || '-'}`, 14, 30);
    doc.text(`Dicetak pada: ${today}`, 14, 36);

    const tableColumn = ['Tanggal', 'Deskripsi', 'Metode Pembayaran', 'Jumlah'];
    const tableRows = incomes.map((item) => [
      new Date(item.date).toLocaleDateString('id-ID'),
      item.description,
      item.payment_method,
      formatRp(item.amount),
    ]);

    const totalPendapatan = incomes.reduce((sum, item) => sum + item.amount, 0);

    autoTable(doc, {
      startY: 45,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: '#0f172a' },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 45;
    doc.setFontSize(12);
    doc.text(`Total Pendapatan: ${formatRp(totalPendapatan)}`, 14, finalY + 10);

    doc.save('Laporan_Pendapatan.pdf');
  };

  const months = Array.from(
    new Set([
      ...(data?.monthlyIncome?.map((i) => i.month) || []),
      ...(data?.monthlyExpenses?.map((e) => e.month) || []),
    ]),
  );

  const barChartData = {
    labels: months,
    datasets: [
      {
        label: 'Pendapatan',
        data: months.map((m) => {
          const inc =
            data?.monthlyIncome?.find((i: any) => i.month === m)?.income || 0;
          return Number(inc);
        }),
        backgroundColor: 'oklch(75% 0.183 55.934)',
        borderRadius: 4,
        barPercentage: 0.65,
      },
      {
        label: 'Pengeluaran',
        data: months.map((m) => {
          const exp =
            data?.monthlyExpenses?.find((e: any) => e.month === m)?.expense ||
            0;
          return Number(exp);
        }),
        backgroundColor: '#1a3a4a',
        borderRadius: 4,
        barPercentage: 0.65,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { size: 12 as const },
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            ` ${ctx.dataset.label}: ${formatRp(ctx.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { size: 12 as const }, color: '#6b7280' },
      },
      y: {
        grid: { color: '#f0ece5' },
        border: { display: false },
        ticks: {
          font: { size: 12 as const },
          color: '#6b7280',
          callback: (v: any) => {
            const val = Number(v);
            if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1).replace('.0', '')}jt`;
            if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
            return val;
          },
        },
      },
    },
  };

  const { sortedData: sortedTransactions, handleSort, sortBy, sortOrder } = useTableSort(data?.recentTransactions || []);

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-title">
            Laporan Keuangan
          </h1>
          <p className="page-subtitle">
            Ringkasan pendapatan dan pengeluaran
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportExcel}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="px-4 py-2 bg-dark hover:bg-dark-2 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <FileText size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            label: 'Total Pendapatan',
            value: formatRp(data?.totalIncome || 0),
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Total Pengeluaran',
            value: formatRp(data?.totalExpense || 0),
            icon: DollarSign,
            color: 'text-red-600',
            bg: 'bg-red-50',
          },
          {
            label: 'Laba Bersih',
            value: formatRp(data?.netProfit || 0),
            icon: Activity,
            color: 'text-dark',
            bg: 'bg-dark/5',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bg} ${color}`}
            >
              <Icon size={28} />
            </div>
            <div>
              <div
                className={`text-2xl font-serif font-bold ${label === 'Laba Bersih' ? 'text-primary' : 'text-gray-800'}`}
              >
                {value}
              </div>
              <div className="text-sm font-semibold text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-serif text-lg font-bold text-dark flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-primary" />
            Grafik Keuangan Bulanan
          </h3>
          {months.length > 0 ? (
            <div className="overflow-x-auto" style={{ height: 320 }}>
              <div
                style={{
                  minWidth: Math.max(months.length * 60, 600) + 'px',
                  height: '100%',
                }}
              >
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              Data belum tersedia
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 shrink-0">
            <h3 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
              <DollarSign size={18} className="text-primary" />
              Transaksi Terbaru
            </h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr>
                  <SortableHeader
                    label="Tanggal"
                    field="date"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
                  />
                  <SortableHeader
                    label="Jenis"
                    field="type"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
                  />
                  <SortableHeader
                    label="Keterangan"
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
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </td>
                  </tr>
                ) : (data?.recentTransactions || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-gray-400">
                      Belum ada transaksi
                    </td>
                  </tr>
                ) : (
                  sortedTransactions.map((tx: any, idx: number) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 border-b border-gray-50 text-xs text-gray-500">
                        {new Date(tx.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 border-b border-gray-50">
                        <span
                          className={`px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider rounded-md ${tx.type === 'INCOME' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                        >
                          {tx.type === 'INCOME' ? 'Pendapatan' : 'Pengeluaran'}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-50 text-sm text-gray-700">
                        {tx.description}
                      </td>
                      <td
                        className={`px-6 py-4 border-b border-gray-50 font-bold text-sm ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatRp(Number(tx.amount))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
