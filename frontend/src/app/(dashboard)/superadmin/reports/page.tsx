'use client';
import { apiFetch } from '@/lib/apiFetch';

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
import { formatRp } from '@/lib/formatters';

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

export default function SuperadminReportsPage() {
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
    apiFetch('/dashboard/stats')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  

  const fetchIncomesForExport = async (): Promise<IncomeTransaction[]> => {
    try {
      const res = await apiFetch('/incomes'); 
      if (!res.ok) throw new Error('API request failed');
      const json = await res.json();
      const records = Array.isArray(json) ? json : json.data || [];
      return records.map((inc: any) => ({
        id: inc.id,
        date: inc.incomeDate || inc.createdAt,
        description: inc.description || 'Tanpa Keterangan',
        payment_method: inc.paymentMethod || inc.transaction?.paymentMethod || 'cash',
        amount: Number(inc.amount),
        guest_name: inc.transaction?.reservation?.guest?.fullName || inc.guestNameSnapshot || '-',
        room_number: inc.transaction?.reservation?.room?.roomNumber || '-',
        staff_name: inc.user?.name || '-',
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
        guest_name: '-',
        room_number: '-',
        staff_name: '-',
      }));
    }
  };

  const handleExportExcel = async () => {
    const incomes = await fetchIncomesForExport();
    let no = 1;
    const worksheetData = incomes.map((item: any) => ({
      'No': no++,
      'Tanggal': new Date(item.date).toLocaleDateString('id-ID'),
      'Nama Tamu': (item as any).guest_name,
      'No. Kamar': (item as any).room_number,
      'Deskripsi': item.description,
      'Metode Pembayaran': item.payment_method,
      'Dicatat Oleh': (item as any).staff_name,
      'Jumlah (Rp)': item.amount,
    }));
    const total = incomes.reduce((s: number, i: any) => s + i.amount, 0);
    worksheetData.push({ 'No': '' as any, 'Tanggal': '', 'Nama Tamu': '', 'No. Kamar': '', 'Deskripsi': 'TOTAL', 'Metode Pembayaran': '', 'Dicatat Oleh': '', 'Jumlah (Rp)': total });
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    worksheet['!cols'] = [
      { wch: 5 }, { wch: 14 }, { wch: 24 }, { wch: 10 },
      { wch: 40 }, { wch: 18 }, { wch: 20 }, { wch: 18 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Pendapatan');
    XLSX.writeFile(workbook, 'Laporan_Pendapatan.xlsx');
  };

  const handleExportPDF = async () => {
    const incomes = await fetchIncomesForExport();
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalPendapatan = incomes.reduce((sum, item) => sum + item.amount, 0);

    // -- Header band ---------------------------------------------
    doc.setFillColor('#0f172a');
    doc.rect(0, 0, W, 50, 'F');
    doc.setFillColor('#C4922A');
    doc.rect(0, 47, W, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor('#FFFFFF');
    doc.text("RON'S GUEST HOUSE", 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor('#94a3b8');
    doc.text('LAPORAN KEUANGAN', 14, 29);

    doc.setFontSize(8);
    doc.setTextColor('#64748b');
    doc.text(`Dicetak: ${today}`, W - 14, 29, { align: 'right' });

    // -- Stats cards ----------------------------------------------
    const statsY = 58;
    const cardW = (W - 28 - 8) / 3;
    const cardH = 26;

    const stats = [
      { label: 'TOTAL PENDAPATAN', value: formatRp(data?.totalIncome || 0), accent: '#16a34a' },
      { label: 'TOTAL PENGELUARAN', value: formatRp(data?.totalExpense || 0), accent: '#dc2626' },
      { label: 'LABA BERSIH', value: formatRp(data?.netProfit || 0), accent: '#C4922A' },
    ];

    stats.forEach((stat, i) => {
      const x = 14 + i * (cardW + 4);
      doc.setFillColor('#F8F6F2');
      doc.rect(x, statsY, cardW, cardH, 'F');
      doc.setFillColor(stat.accent);
      doc.rect(x, statsY, 3, cardH, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor('#6b7280');
      doc.text(stat.label, x + 7, statsY + 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor('#1f2937');
      doc.text(stat.value, x + 7, statsY + 19);
    });

    // -- Section title --------------------------------------------
    const sectionY = statsY + cardH + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor('#374151');
    doc.text('RINCIAN TRANSAKSI PENDAPATAN', 14, sectionY);
    doc.setDrawColor('#C4922A');
    doc.setLineWidth(0.5);
    doc.line(14, sectionY + 2, 80, sectionY + 2);

    // -- Data table -----------------------------------------------
    const tableRows = incomes.map((item: any) => [
      new Date(item.date).toLocaleDateString('id-ID'),
      item.description,
      item.payment_method,
      formatRp(item.amount),
    ]);

    autoTable(doc, {
      startY: sectionY + 6,
      head: [['Tanggal', 'Deskripsi', 'Metode', 'Jumlah']],
      body: tableRows,
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
        textColor: [55, 65, 81] as [number, number, number],
        lineColor: [235, 232, 225] as [number, number, number],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [15, 23, 42] as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
      },
      alternateRowStyles: { fillColor: [248, 246, 242] as [number, number, number] },
      columnStyles: {
        0: { cellWidth: 27 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 28 },
        3: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14, bottom: 20 },
    });

    // -- Total row ------------------------------------------------
    const finalY = (doc as any).lastAutoTable.finalY || sectionY + 30;
    doc.setFillColor('#C4922A');
    doc.rect(14, finalY, W - 28, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor('#1f2937');
    doc.text('TOTAL PENDAPATAN', 19, finalY + 7.5);
    doc.text(formatRp(totalPendapatan), W - 19, finalY + 7.5, { align: 'right' });

    // -- Footer ---------------------------------------------------
    const footerY = H - 12;
    doc.setDrawColor('#C4922A');
    doc.setLineWidth(0.4);
    doc.line(14, footerY - 4, W - 14, footerY - 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor('#9ca3af');
    doc.text("Ron's Guest House  �  Laporan Keuangan Resmi", 14, footerY);
    doc.text(today, W - 14, footerY, { align: 'right' });

    doc.save('Laporan_Keuangan_RonsGuestHouse.pdf');
  };

  const months = Array.from(
    new Set([
      ...(data?.monthlyIncome?.map((i) => i.month) || []),
      ...(data?.monthlyExpenses?.map((e) => e.month) || []),
    ]),
  ).filter((m) => {
    const inc = Number(data?.monthlyIncome?.find((i: any) => i.month === m)?.income || 0);
    const exp = Number(data?.monthlyExpenses?.find((e: any) => e.month === m)?.expense || 0);
    return inc > 0 || exp > 0;
  });

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
            className="btn btn-primary btn-md"
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
                  />
                  <SortableHeader
                    label="Jenis"
                    field="type"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Keterangan"
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
                      className="hover:bg-red-50/20 transition-colors"
                    >
                      <td className="px-6 py-4 border-b border-gray-100 text-xs text-gray-500">
                        {new Date(tx.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100">
                        <span
                          className={`px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider rounded-md ${tx.type === 'INCOME' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                        >
                          {tx.type === 'INCOME' ? 'Pendapatan' : 'Pengeluaran'}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 text-sm text-gray-700">
                        {tx.description}
                      </td>
                      <td
                        className={`px-6 py-4 border-b border-gray-100 font-bold text-sm ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}
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
