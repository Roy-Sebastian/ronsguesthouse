'use client';
import { apiFetch } from '@/lib/apiFetch';
import { showToast } from '@/lib/toast';
import { formatRp } from '@/lib/formatters';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import swal from '@/lib/swal';



interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  pricePerNight: number;
}

interface RoomPriceOverride {
  id: string;
  roomId: string;
  date: string;
  price: number;
}



function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0 = Sunday
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isWeekend(year: number, month: number, day: number) {
  const d = new Date(year, month, day);
  return d.getDay() === 0 || d.getDay() === 6;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];



export default function AdminPricingPage() {
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [overrides, setOverrides] = useState<RoomPriceOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Calendar state
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // Selection
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [bulkPrice, setBulkPrice] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  
  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId),
    [rooms, selectedRoomId],
  );

  const overrideMap = useMemo(() => {
    const m = new Map<string, RoomPriceOverride>();
    overrides.forEach((o) => {
      const dateStr = o.date.split('T')[0]; // normalize ISO to YYYY-MM-DD
      m.set(dateStr, { ...o, date: dateStr });
    });
    return m;
  }, [overrides]);

  

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/rooms');
      const data = await res.json();
      const roomList = Array.isArray(data) ? data : [];
      setRooms(roomList);
      if (roomList.length > 0 && !selectedRoomId) {
        setSelectedRoomId(roomList[0].id);
      }
    } catch {
      setRooms([]);
    }
    setLoading(false);
  }, []);

  const fetchPrices = useCallback(async () => {
    if (!selectedRoomId) return;
    try {
      // Fetch overrides for the visible 2-month range
      const startDate = new Date(viewYear, viewMonth, 1);
      const endDate = new Date(viewYear, viewMonth + 2, 0);
      const res = await fetch(
        `/api/pricing/${selectedRoomId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      );
      const data = await res.json();
      setOverrides(Array.isArray(data) ? data : []);
    } catch {
      setOverrides([]);
    }
  }, [selectedRoomId, viewYear, viewMonth]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const toggleDate = (dateKey: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  const selectAllWeekends = () => {
    const days = getDaysInMonth(viewYear, viewMonth);
    const weekends = new Set<string>();
    for (let d = 1; d <= days; d++) {
      if (isWeekend(viewYear, viewMonth, d)) {
        weekends.add(formatDateKey(viewYear, viewMonth, d));
      }
    }
    setSelectedDates(weekends);
  };

  const selectAllDates = () => {
    const days = getDaysInMonth(viewYear, viewMonth);
    const all = new Set<string>();
    for (let d = 1; d <= days; d++) {
      all.add(formatDateKey(viewYear, viewMonth, d));
    }
    setSelectedDates(all);
  };

  const clearSelection = () => setSelectedDates(new Set());

  const applyBulkPrice = async () => {
    if (!selectedRoomId || selectedDates.size === 0 || !bulkPrice) return;
    setSaving(true);
    try {
      const entries = Array.from(selectedDates).map((date) => ({
        date,
        price: Number(bulkPrice),
      }));
      await apiFetch('/pricing/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: selectedRoomId, entries }),
      });
      await fetchPrices();
      setSelectedDates(new Set());
      setBulkPrice('');
      setShowBulkModal(false);
      showToast('Harga berhasil diatur');
    } catch (err) {
      await swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyimpan harga' });
    }
    setSaving(false);
  };

  const deleteOverride = async (id: string) => {
    const result = await swal.fire({
      icon: 'warning',
      title: 'Konfirmasi',
      text: 'Hapus override harga ini? Harga akan kembali ke harga dasar.',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await apiFetch(`/pricing/${id}`, { method: 'DELETE' });
      await fetchPrices();
      showToast('Override harga berhasil dihapus');
    } catch {
      await swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus harga' });
    }
  };

  const deleteSelectedOverrides = async () => {
    const toDelete = Array.from(selectedDates)
      .map((d) => overrideMap.get(d))
      .filter(Boolean);
    if (toDelete.length === 0) {
      await swal.fire({ icon: 'info', title: 'Info', text: 'Tidak ada override harga pada tanggal yang dipilih' });
      return;
    }
    const result = await swal.fire({
      icon: 'warning',
      title: 'Konfirmasi',
      text: `Hapus ${toDelete.length} override harga?`,
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    setSaving(true);
    try {
      await Promise.all(
        toDelete.map((o) => apiFetch(`/pricing/${o!.id}`, { method: 'DELETE' })),
      );
      await fetchPrices();
      setSelectedDates(new Set());
    } catch {
      await swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus harga' });
    }
    setSaving(false);
  };

  

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const basePrice = selectedRoom ? Number(selectedRoom.pricePerNight) : 0;

  const calendarCells = [];
  // Blank cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(<div key={`blank-${i}`} className="h-20 bg-gray-50/50" />);
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatDateKey(viewYear, viewMonth, day);
    const override = overrideMap.get(dateKey);
    const price = override ? Number(override.price) : basePrice;
    const isOverride = !!override;
    const isSelected = selectedDates.has(dateKey);
    const isWknd = isWeekend(viewYear, viewMonth, day);
    const today = new Date();
    const isPast =
      new Date(viewYear, viewMonth, day) <
      new Date(today.getFullYear(), today.getMonth(), today.getDate());

    calendarCells.push(
      <button
        key={dateKey}
        type="button"
        onClick={() => toggleDate(dateKey)}
        className={`
          h-20 p-1.5 text-left flex flex-col border transition-all duration-150 relative group
          ${isSelected ? 'ring-2 ring-primary bg-primary/5 border-primary' : 'border-gray-100 hover:border-gray-300'}
          ${isPast ? 'opacity-50' : ''}
          ${isWknd && !isSelected ? 'bg-orange-50/50' : ''}
        `}
      >
        <div className="flex items-center justify-between w-full">
          <span
            className={`text-xs font-semibold ${isWknd ? 'text-orange-600' : 'text-gray-700'} ${isSelected ? 'text-primary' : ''}`}
          >
            {day}
          </span>
          {isOverride && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteOverride(override.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-100 rounded"
              title="Hapus override"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          )}
        </div>
        <div className="mt-auto">
          <span
            className={`text-[10px] font-bold block truncate ${isOverride ? 'text-green-700' : 'text-gray-400'}`}
          >
            {formatRp(price)}
          </span>
          {isOverride && (
            <span className="text-[8px] bg-green-100 text-green-700 px-1 rounded font-medium">
              OVERRIDE
            </span>
          )}
        </div>
      </button>,
    );
  }

  

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Harga Kamar</h1>
          <p className="page-subtitle">
            Atur harga khusus (override) per tanggal untuk setiap kamar. Harga override akan menggantikan harga dasar saat tamu melakukan booking.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="py-20 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
          <DollarSign size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-base font-medium">Belum ada data kamar</h3>
          <p className="text-sm mt-1">Tambahkan kamar terlebih dahulu di menu Kamar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Room Selector */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pilih Kamar
            </label>
            <select
              className="form-input max-w-md"
              value={selectedRoomId}
              onChange={(e) => {
                setSelectedRoomId(e.target.value);
                setSelectedDates(new Set());
              }}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roomNumber} - {r.roomType} (Base: {formatRp(Number(r.pricePerNight))}/malam)
                </option>
              ))}
            </select>
          </div>

          {/* Calendar Header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <h2 className="text-lg font-serif font-bold text-gray-900 min-w-[180px] text-center">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={selectAllWeekends}
                  className="px-3 py-1.5 text-xs font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
                >
                  Pilih Weekend
                </button>
                <button
                  onClick={selectAllDates}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  Pilih Semua
                </button>
                {selectedDates.size > 0 && (
                  <>
                    <button
                      onClick={clearSelection}
                      className="px-3 py-1.5 text-xs font-semibold bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      Batal Pilih
                    </button>
                    <button
                      onClick={() => setShowBulkModal(true)}
                      className="btn btn-primary-outline btn-sm"
                    >
                      <Save size={12} /> Set Harga ({selectedDates.size} tanggal)
                    </button>
                    <button
                      onClick={deleteSelectedOverrides}
                      className="btn btn-danger-outline btn-sm"
                    >
                      <RotateCcw size={12} /> Reset Override
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="px-6 py-2 border-b border-gray-100 flex items-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
                <span>Harga Dasar: {selectedRoom ? formatRp(basePrice) : '-'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
                <span>Override (Harga Khusus)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-orange-50 border border-orange-200" />
                <span>Weekend</span>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7">
              {DAY_NAMES.map((d) => (
                <div
                  key={d}
                  className={`text-center text-xs font-bold py-2 ${d === 'Min' || d === 'Sab' ? 'text-orange-600 bg-orange-50/50' : 'text-gray-500 bg-gray-50'}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">{calendarCells}</div>
          </div>

          {/* Overrides Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Daftar Override Aktif ({overrides.length})
              </h3>
            </div>
            {overrides.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
                Belum ada harga override untuk kamar ini
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Harga Override</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Harga Dasar</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Selisih</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {overrides
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((o) => {
                        const oprice = Number(o.price);
                        const diff = oprice - basePrice;
                        return (
                          <tr key={o.id} className="hover:bg-red-50/20 transition-colors">
                            <td className="px-6 py-3 font-medium">
                              {new Date(o.date).toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-6 py-3 font-bold text-green-700">
                              {formatRp(oprice)}
                            </td>
                            <td className="px-6 py-3 text-gray-400">
                              {formatRp(basePrice)}
                            </td>
                            <td className="px-6 py-3">
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded-md ${diff > 0 ? 'bg-red-50 text-red-700' : diff < 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}
                              >
                                {diff > 0 ? '+' : ''}{formatRp(diff)}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <button
                                onClick={() => deleteOverride(o.id)}
                                className="btn btn-ghost btn-icon text-gray-400 hover:text-red-600 hover:bg-red-50"
                                title="Hapus"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Price Modal */}
      {showBulkModal && (
        <div
          className="fixed inset-0 bg-black/50 z-200 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBulkModal(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-serif text-xl font-bold text-dark">Set Harga Override</h2>
              <p className="text-sm text-gray-500 mt-1">
                Harga ini akan diterapkan untuk{' '}
                <strong className="text-primary">{selectedDates.size} tanggal</strong> yang dipilih
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Harga Dasar Saat Ini
                </label>
                <div className="form-input bg-gray-50 text-gray-500 cursor-not-allowed">
                  {formatRp(basePrice)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Harga Override Baru (Rp) *
                </label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="Contoh: 500000"
                  autoFocus
                />
              </div>
              <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                <strong>Tanggal terpilih:</strong>{' '}
                {Array.from(selectedDates)
                  .sort()
                  .map((d) =>
                    new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    }),
                  )
                  .join(', ')}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button
                type="button"
                className="btn btn-outline btn-md"
                onClick={() => setShowBulkModal(false)}
              >
                Batal
              </button>
              <button
                onClick={applyBulkPrice}
                disabled={saving || !bulkPrice}
                className="btn btn-primary btn-md disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}{' '}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
