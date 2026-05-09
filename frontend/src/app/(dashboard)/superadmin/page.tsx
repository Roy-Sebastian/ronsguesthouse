"use client";

import { useEffect, useState } from "react";
import { Users, BedDouble, CalendarCheck, Activity, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";

interface SystemStats { totalRooms: number; totalGuests: number; totalReservations: number; }

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/rooms").then(r => r.json()),
      fetch("/api/guests").then(r => r.json()),
      fetch("/api/reservations").then(r => r.json()),
      fetch("/api/audit-logs?page=1&limit=10").then(r => r.json()),
    ]).then(([rooms, guests, reservations, logs]) => {
      setStats({
        totalRooms: Array.isArray(rooms) ? rooms.length : 0,
        totalGuests: Array.isArray(guests) ? guests.length : 0,
        totalReservations: Array.isArray(reservations) ? reservations.length : 0,
      });
      const logsData = Array.isArray(logs?.data) ? logs.data : Array.isArray(logs) ? logs : [];
      setAuditLogs(logsData.slice(0, 10));
    }).catch(() => {});
  }, []);

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard Super Admin</h1>
          <p className="page-subtitle">Pantau dan kelola seluruh sistem penginapan</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Kamar", value: stats?.totalRooms ?? "�", icon: BedDouble, iconColor: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Tamu", value: stats?.totalGuests ?? "�", icon: Users, iconColor: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Reservasi", value: stats?.totalReservations ?? "�", icon: CalendarCheck, iconColor: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Status Sistem", value: "Aktif", icon: ShieldCheck, iconColor: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(({ label, value, icon: Icon, iconColor, bg }) => (
          <div key={label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg} ${iconColor}`}>
              <Icon size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{value}</div>
              <div className="text-sm font-medium text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[
          { href: "/superadmin/users", label: "Kelola Pengguna", desc: "Tambah, edit, atau nonaktifkan akun", icon: Users, color: "text-dark", bg: "bg-dark/5" },
          { href: "/superadmin/audit-logs", label: "Audit Log", desc: "Pantau semua aktivitas sistem", icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
        ].map(({ href, label, desc, icon: Icon, color, bg }) => (
          <Link key={href} href={href} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}><Icon size={22} /></div>
            <div>
              <div className="font-semibold text-gray-800 mb-0.5">{label}</div>
              <div className="text-sm text-gray-500">{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            Aktivitas Terkini
          </h3>
          <Link href="/superadmin/audit-logs" className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition-colors">Lihat Semua</Link>
        </div>
        {auditLogs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400">
            <Clock size={40} className="mb-3 opacity-20" />
            <h3 className="text-sm font-medium">Belum ada log aktivitas</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Pengguna</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Aksi</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Entitas</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-red-50/20 transition-colors">
                    <td className="px-6 py-4 border-b border-gray-100">
                      <div className="font-medium text-gray-800 text-sm">{log.user?.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{log.user?.role}</div>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-100">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-100 text-sm text-gray-700">{log.entity}</td>
                    <td className="px-6 py-4 border-b border-gray-100 text-xs text-gray-500">{new Date(log.createdAt).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
