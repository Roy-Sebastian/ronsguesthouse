'use client';
import { apiFetch } from '@/lib/apiFetch';
import { ROOM_TYPE_LABEL } from '@/lib/constants';


import { BedDouble, RefreshCw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

const statusConfig: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  available: {
    label: 'Tersedia',
    badge: 'bg-green-50 text-green-700 border-green-100',
    dot: 'bg-green-500',
  },
  occupied: {
    label: 'Ditempati',
    badge: 'bg-blue-50 text-blue-700 border-blue-100',
    dot: 'bg-blue-500',
  },
  maintenance: {
    label: 'Perbaikan',
    badge: 'bg-amber-50 text-amber-700 border-amber-100',
    dot: 'bg-amber-500',
  },
  cleaning: {
    label: 'Dibersihkan',
    badge: 'bg-purple-50 text-purple-700 border-purple-100',
    dot: 'bg-purple-500',
  },
  reserved: {
    label: 'Dipesan',
    badge: 'bg-sky-50 text-sky-700 border-sky-100',
    dot: 'bg-sky-500',
  },
};

const roomTypeBg: Record<string, string> = {
  standard: 'from-sky-800 to-sky-950',
  city_view: 'from-violet-800 to-violet-950',
  suite: 'from-amber-700 to-amber-950',
  family: 'from-emerald-800 to-emerald-950',
};

export default function ReceptionistRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchRooms = async () => {
    setLoading(true);
    const data = await apiFetch('/rooms')
      .then((r) => r.json())
      .catch(() => []);
    setRooms(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filtered = rooms.filter((r) => {
    const matchSearch =
      r.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
      r.roomType?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || r.status === filter;
    return matchSearch && matchFilter;
  });

  const statusCounts = Object.keys(statusConfig).reduce(
    (acc, k) => ({ ...acc, [k]: rooms.filter((r) => r.status === k).length }),
    {} as Record<string, number>,
  );

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            Status Kamar
          </h1>
          <p className="page-subtitle">
            Pantau ketersediaan dan status kamar secara real-time
          </p>
        </div>
        <button
          onClick={fetchRooms}
          className="px-5 py-2.5 bg-white border border-gray-200 hover:border-primary/30 text-dark text-sm font-semibold rounded-lg transition-all inline-flex items-center gap-2"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />{' '}
          Refresh
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {Object.entries(statusConfig).map(([key, { label, dot }]) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? 'all' : key)}
            className={`bg-white rounded-2xl p-4 border transition-all text-left ${filter === key ? 'border-primary/30 ring-2 ring-primary/10 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              <span className="text-xs font-semibold text-gray-500">
                {label}
              </span>
            </div>
            <div className="page-title">
              {statusCounts[key] || 0}
            </div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="search-bar flex-1">
        <Search size={18} className="text-gray-400 ml-2 shrink-0" />
        <input
          className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
          placeholder="Cari nomor kamar atau tipe..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 animate-pulse"
            >
              <div className="h-28 bg-gray-100 rounded-t-2xl" />
              <div className="p-4">
                <div className="h-3 bg-gray-100 rounded-full w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100">
          <BedDouble size={48} className="text-gray-300 mb-4" />
          <h3 className="font-semibold text-dark mb-1">
            Tidak ada kamar ditemukan
          </h3>
          <p className="text-sm text-gray-400">
            Coba ubah filter atau kata kunci pencarian
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((room) => {
            const cfg = statusConfig[room.status] || {
              label: room.status,
              badge: 'bg-gray-100 text-gray-500 border-gray-200',
              dot: 'bg-gray-400',
            };
            return (
              <div
                key={room.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
              >
                <div
                  className={`h-24 bg-linear-to-br ${roomTypeBg[room.roomType] || 'from-dark to-dark-3'} relative flex items-center justify-center`}
                >
                  <BedDouble size={40} className="text-white/20" />
                  <div className="absolute top-2 right-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  </div>
                  <div className="absolute bottom-2 left-3 text-white font-serif text-lg font-bold">
                    {room.roomNumber}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-xs text-gray-400 capitalize mb-1.5">
                    {ROOM_TYPE_LABEL[room.roomType] || room.roomType}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}
                  >
                    {cfg.label}
                  </span>
                  {room.status === 'occupied' && room.currentReservation && (
                    <div className="mt-2 text-xs text-gray-400 truncate">
                      {room.currentReservation?.guest?.fullName || 'Tamu'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
