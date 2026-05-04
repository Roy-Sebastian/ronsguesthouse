"use client";
import { useEffect, useState } from "react";
import { CalendarCheck, LogIn, LogOut, Users, Loader2, Info } from "lucide-react";
import Link from "next/link";

export default function ReceptionistDashboard() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [stays, setStays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    Promise.all([
      fetch("/api/reservations?limit=500").then(r => r.json()).then(r => r.data || r),
      fetch("/api/stays?limit=500").then(r => r.json()).then(r => r.data || []),
    ]).then(([res, sta]) => {
      setReservations(Array.isArray(res) ? res : []);
      setStays(Array.isArray(sta) ? sta : []);
      setLoading(false);
    });
  }, []);

  const todayCheckIns = reservations.filter(r => r.checkInDate?.startsWith(today) && r.status === "confirmed");
  const todayCheckOuts = stays.filter(s => !s.checkOutAt && s.reservation?.checkOutDate?.startsWith(today));
  const activeStays = stays.filter(s => !s.checkOutAt);

  return (
    <>
      <div className="mb-8">
        <h1 className="page-title">Dashboard Resepsionis</h1>
        <p className="page-subtitle">Aktivitas hari ini - {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Check-In Hari Ini", value: todayCheckIns.length, icon: LogIn, color: "text-green-600", bg: "bg-green-50" },
          { label: "Check-Out Hari Ini", value: todayCheckOuts.length, icon: LogOut, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Tamu Aktif", value: activeStays.length, icon: Users, color: "text-primary", bg: "bg-primary/10" },
          { label: "Total Reservasi Aktif", value: reservations.filter(r=>r.status!=="cancelled").length, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
              <Icon size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{loading ? <Loader2 className="animate-spin text-gray-400" size={20} /> : value}</div>
              <div className="text-sm font-medium text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-green-50/30">
            <h3 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
              <LogIn size={18} className="text-green-600" />
              Antrean Check-In Hari Ini
            </h3>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">{todayCheckIns.length}</span>
          </div>
          <div className="flex-1 p-0">
            {loading ? (
              <div className="p-8 flex justify-center text-gray-400"><Loader2 className="animate-spin" size={24} /></div>
            ) : todayCheckIns.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
                  <Info size={20} />
                </div>
                <p className="text-gray-500 font-medium">Tidak ada jadwal Check-In untuk hari ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {todayCheckIns.map(r => (
                  <div key={r.id} className="p-4 hover:bg-red-50/20 transition-colors flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">{r.guest?.fullName}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs shrink-0">Kmr {r.room?.roomNumber}</span>
                        <span>�</span>
                        <span>{r.numGuests} Tamu</span>
                      </div>
                    </div>
                    <Link href="/receptionist/reservations" className="btn btn-success btn-md">
                      Kelola
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-amber-50/30">
            <h3 className="font-serif text-lg font-bold text-dark flex items-center gap-2">
              <LogOut size={18} className="text-amber-600" />
              Antrean Check-Out Hari Ini
            </h3>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">{todayCheckOuts.length}</span>
          </div>
          <div className="flex-1 p-0">
            {loading ? (
              <div className="p-8 flex justify-center text-gray-400"><Loader2 className="animate-spin" size={24} /></div>
            ) : todayCheckOuts.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
                  <Info size={20} />
                </div>
                <p className="text-gray-500 font-medium">Tidak ada jadwal Check-Out untuk hari ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {todayCheckOuts.map(s => (
                  <div key={s.id} className="p-4 hover:bg-red-50/20 transition-colors flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">{s.reservation?.guest?.fullName}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                         <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs shrink-0">Kmr {s.reservation?.room?.roomNumber}</span>
                         <span>�</span>
                         <span className="text-green-600 font-medium">Menginap</span>
                      </div>
                    </div>
                    <Link href="/receptionist/stays" className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors shrink-0">
                      Proses
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}