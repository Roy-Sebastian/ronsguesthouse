'use client';

import { apiFetch } from '@/lib/apiFetch';

import { History, Search } from 'lucide-react';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { formatRp, fmtDate } from '@/lib/formatters';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Pagination } from '@/components/ui/Pagination';
import { TableActions } from '@/components/ui/TableActions';
import StayDetailModal from '@/components/features/StayDetailModal';
import EditStayModal from '@/components/features/EditStayModal';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
import swal from '@/lib/swal';

export default function ReceptionistHistoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [stays, setStays] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [dateStart, setDateStart] = useState(searchParams.get('dateStart') || '');
  const [dateEnd, setDateEnd] = useState(searchParams.get('dateEnd') || '');
  const [selectedStay, setSelectedStay] = useState<any | null>(null);
  const [editStay, setEditStay] = useState<any | null>(null);

  const handleDeleteStay = async (id: string) => {
    const result = await swal.fire({
      icon: 'warning',
      title: 'Konfirmasi',
      text: 'Yakin ingin menghapus riwayat menginap ini secara permanen?',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await apiFetch(`/stays/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      fetchHistory();
    } catch (e: any) {
      await swal.fire({ icon: 'error', title: 'Gagal', text: e.message });
    }
  };

  const currentPage = Number(searchParams.get('page')) || 1;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('status', 'checked_out');
    params.set('page', String(currentPage));
    params.set('limit', '10');
    if (search) params.set('search', search);
    if (dateStart) params.set('dateStart', dateStart);
    if (dateEnd) params.set('dateEnd', dateEnd);

    try {
      const res = await apiFetch(`/stays?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setStays(json.data || []);
        if (json.meta) setMeta(json.meta);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, dateStart, dateEnd]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      let changed = false;
      if (search !== searchParams.get('search')) {
        if (search) params.set('search', search); else params.delete('search');
        changed = true;
      }
      if (dateStart !== (searchParams.get('dateStart') || '')) {
        if (dateStart) params.set('dateStart', dateStart); else params.delete('dateStart');
        changed = true;
      }
      if (dateEnd !== (searchParams.get('dateEnd') || '')) {
        if (dateEnd) params.set('dateEnd', dateEnd); else params.delete('dateEnd');
        changed = true;
      }
      if (changed) {
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, dateStart, dateEnd, searchParams, pathname, router]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const fmtDate = (d: string) =>
    d
      ? new Date(d).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '-';

  const nights = (cin: string, cout: string) => {
    if (!cin || !cout) return '-';
    return (
      Math.max(
        1,
        Math.ceil((new Date(cout).getTime() - new Date(cin).getTime()) / 86400000),
      ) + ' malam'
    );
  };

  const { sortedData, handleSort, sortBy, sortOrder } = useTableSort(stays);

  return (
    <>
      <div className="mb-8">
        <h1 className="page-title">
          Riwayat Tamu
        </h1>
        <p className="page-subtitle">
          Riwayat tamu yang telah selesai menginap
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="font-serif text-2xl font-bold text-primary">
            {meta.total}
          </div>
          <div className="text-sm text-gray-400 mt-1">Total Riwayat</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-bar flex-1 m-0">
          <Search size={18} className="text-gray-400 ml-2 shrink-0" />
          <input
            className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700"
            placeholder="Cari nama tamu atau nomor kamar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <DateRangeFilter
          startDate={dateStart}
          endDate={dateEnd}
          onStartDateChange={setDateStart}
          onEndDateChange={setDateEnd}
          className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr>
                <SortableHeader
                  label="Tamu"
                  field="reservation.guest.fullName"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Kamar"
                  field="reservation.room.roomNumber"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Check-In"
                  field="checkInAt"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Check-Out"
                  field="checkOutAt"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-6 py-3.5 bg-gray-50 text-[11px] font-bold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200 whitespace-nowrap">
                  Total
                </th>
                <th className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100 text-center">
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
              ) : stays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400">
                    <History size={40} className="mx-auto mb-3 opacity-20" />
                    <div className="text-sm">Data tidak ditemukan</div>
                  </td>
                </tr>
              ) : (
                sortedData.map((s) => {
                  const rTotal = Number(s.reservation?.totalPrice || 0);
                  const aTotal = (s.reservation?.bookingAddons || []).reduce((acc: number, cur: any) => acc + Number(cur.totalPrice || 0), 0);
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-red-50/20 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-dark text-sm">
                          {s.reservation?.guest?.fullName || '-'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {s.reservation?.room?.roomNumber || '-'} <span className="capitalize text-xs text-gray-400">({s.reservation?.room?.roomType || '-'})</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {fmtDate(s.checkInAt)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {fmtDate(s.checkOutAt)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-dark">
                        {formatRp(rTotal + aTotal)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <TableActions
                          viewPermission="stay.view"
                          editPermission="stay.edit"
                          deletePermission="stay.delete"
                          onView={() => setSelectedStay(s)}
                          onEdit={() => setEditStay(s)}
                          onDelete={() => handleDeleteStay(s.id)}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={meta.page} limit={meta.limit} total={meta.total} totalPages={meta.totalPages} />
      </div>

      {selectedStay && (
        <StayDetailModal stay={selectedStay} onClose={() => setSelectedStay(null)} />
      )}

      {editStay && (
        <EditStayModal
          stay={editStay}
          onClose={() => setEditStay(null)}
          onSuccess={() => {
            setEditStay(null);
            fetchHistory();
          }}
          onRefresh={() => fetchHistory()}
        />
      )}
    </>
  );
}
