'use client';

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Tooltip as ChartTooltip,
  Filler,
  Legend,
  LinearScale,
} from 'chart.js';
import {
  Activity,
  ArrowDownIcon,
  ArrowUpIcon,
  BedDouble,
  CalendarCheck,
  DollarSign,
  Mail,
  MoreVertical,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { STATUS_BADGE, STATUS_LABEL } from '@/lib/constants';

import { formatRp, calculateDays } from '@/lib/formatters';

import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Filler,
  ChartTooltip,
  Legend
);




export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  

  

  const lineLabels: string[] =
    stats?.monthlyIncome?.map((item: any) => {
      const parts = item.month.split(' ');
      return parts[0].toUpperCase();
    }) || [];

  const incomeValues: number[] =
    stats?.monthlyIncome?.map((item: any) => Number(item.income || 0)) || [];

  const expenseValues: number[] =
    stats?.monthlyExpenses?.map((item: any) => Number(item.expense || 0)) || [];

  // Data for Bar Chart
  const barChartData = {
    labels: lineLabels.length > 0 ? lineLabels : ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
    datasets: [
      {
        label: 'Pendapatan',
        data: incomeValues.length > 0 ? incomeValues : [20000000, 39000000, 11000000, 21000000, 26000000, 39000000],
        backgroundColor: 'oklch(75% 0.183 55.934)',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: 'Pengeluaran',
        data: expenseValues.length > 0 ? expenseValues : [8000000, 10000000, 9000000, 31000000, 18000000, 13000000],
        backgroundColor: '#ef4444',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true, 
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 20,
          font: { size: 12, family: 'sans-serif' }
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${formatRp(ctx.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { font: { size: 11 as const }, color: '#9ca3af' },
      },
      y: {
        grid: { color: '#f3f4f6', drawBorder: false },
        border: { display: false, dash: [4, 4] },
        ticks: {
          font: { size: 11 as const },
          color: '#9ca3af',
          stepSize: 10000000,
          callback: (v: any) => `${(Number(v) / 1000000).toFixed(0)}M`,
        },
      },
    },
  };

  // Data for Doughnut Chart
  const pieStats = stats?.incomeStatistics || [
    { name: 'Standard', percentage: 53 },
    { name: 'Deluxe', percentage: 31 },
    { name: 'Suite', percentage: 16 }
  ];
  
  const pieColors = [
    'oklch(75% 0.183 55.934)', // Primary
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b'  // Amber
  ].slice(0, pieStats.length);

  const pieChartData = {
    labels: pieStats.map((p: any) => p.name),
    datasets: [
      {
        data: pieStats.map((p: any) => p.percentage),
        backgroundColor: pieColors,
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.raw}%`,
        },
      },
    },
  };

  const renderTrendBadge = (change: number) => {
    const isPositive = change > 0;
    const isZero = change === 0;
    const value = Math.abs(change).toFixed(1);
    
    return (
      <div className={`px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-semibold
        ${isZero ? 'bg-gray-100 text-gray-500' : isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
      >
        {isPositive ? '+' : isZero ? '' : '-'}{value}%
        {isPositive ? <ArrowUpIcon size={10} /> : isZero ? null : <ArrowDownIcon size={10} />}
      </div>
    );
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="page-title">
          Dashboard
        </h1>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Reservasi */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-gray-500 text-sm mb-3">Total Reservasi</div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-800">{stats?.totalReservationsCurrent ?? '0'}</span>
              {renderTrendBadge(stats?.totalReservationsChange || 0)}
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-4">Bulan ini</div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-gray-500 text-sm mb-3">Occupancy Rate</div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-800">{stats?.occupancyRateCurrent?.toFixed(0) ?? '0'}%</span>
              {renderTrendBadge(stats?.occupancyRateChange || 0)}
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-4">Bulan ini</div>
        </div>

        {/* Pendapatan */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-gray-500 text-sm mb-3">Pendapatan</div>
            <div className="flex items-center gap-3">
              <span className="text-2xl lg:text-3xl font-bold text-gray-800">
                {stats ? formatRp(stats.totalIncomeCurrent) : 'Rp 0'}
              </span>
              {renderTrendBadge(stats?.totalIncomeChange || 0)}
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-4">Bulan ini</div>
        </div>

        {/* Total Tamu */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-gray-500 text-sm mb-3">Total Tamu</div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-800">{stats?.totalGuestsCurrent ?? '0'}</span>
              {renderTrendBadge(stats?.totalGuestsChange || 0)}
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-4">Bulan ini</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Chart: Pendapatan vs Pengeluaran */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Pendapatan vs Pengeluaran</h3>
          </div>
          <div style={{ height: 280 }} className="w-full">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Right Chart: Income Statistics */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Income Statistics</h3>
            <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={16}/></button>
          </div>
          <div className="flex-1 relative flex items-center justify-center min-h-[160px]">
            <div className="w-48 h-48 absolute">
              <Doughnut data={pieChartData} options={pieChartOptions} />
            </div>
            {/* Center Text Overlays if any could go here */}
          </div>
          {/* Custom Pie Legend */}
          <div className="flex justify-center gap-4 mt-6">
            {pieStats.map((p: any, i: number) => (
              <div key={p.name} className="flex flex-col items-center">
                <span className="text-xl font-bold text-gray-800">{p.percentage}%</span>
                <span className="text-[10px] text-gray-400">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent reservations Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr>
                {[
                  'No.',
                  'Nama Tamu',
                  'Kamar',
                  'Check-in',
                  'Check-out',
                  'Total Hari',
                  'Status',
                  'Total Harga',
                  'Dibuat oleh',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 bg-gray-200/50 text-xs font-semibold text-gray-600 border-b border-gray-100"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(!stats?.recentReservations || stats.recentReservations.length === 0) ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-sm">
                    Belum ada data reservasi.
                  </td>
                </tr>
              ) : (
                stats.recentReservations.map((r: any, idx: number) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-4 border-b border-gray-100 text-sm text-gray-500">
                      {idx + 1}.
                    </td>
                    <td className="px-5 py-4 border-b border-gray-100">
                      <strong className="font-medium text-gray-700 text-sm">
                        {r.guest?.fullName || 'Anonim'}
                      </strong>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-100 text-sm text-gray-500">
                      {r.room?.roomNumber ? `${r.room.roomType ? r.room.roomType.charAt(0).toUpperCase() + r.room.roomType.slice(1) : ''} Room - ${r.room.roomNumber}` : 'Room'}
                    </td>
                    <td className="px-5 py-4 border-b border-gray-100 text-sm text-gray-500">
                      {new Date(r.checkInDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric'})}
                    </td>
                    <td className="px-5 py-4 border-b border-gray-100 text-sm text-gray-500">
                      {new Date(r.checkOutDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric'})}
                    </td>
                    <td className="px-5 py-4 border-b border-gray-100 text-sm text-gray-500">
                      {calculateDays(r.checkInDate, r.checkOutDate)} hari
                    </td>
                    <td className="px-5 py-4 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-100 text-sm font-medium text-gray-700">
                      {formatRp(Number(r.totalPrice))}
                    </td>
                    <td className="px-5 py-4 border-b border-gray-100 text-sm text-gray-500">
                      {r.user?.name || 'Sistem'} - {new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric'})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
