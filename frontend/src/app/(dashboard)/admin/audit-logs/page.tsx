'use client';
import { apiFetch } from '@/lib/apiFetch';


import { Activity, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';

const PAGE_SIZE = 10;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const fetchLogs = (p: number) => {
    setLoading(true);
    apiFetch(`/audit-logs?page=${p}&limit=${PAGE_SIZE}`)
      .then((r) => r.json())
      .then((res) => {
        setLogs(Array.isArray(res.data) ? res.data : []);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs(page);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const socket = io(backendUrl, { path: '/api/socket.io', transports: ['websocket', 'polling'] });
    socket.on('new_audit_log', (newLog: any) => {
      if (page === 1) {
        setLogs((prev) => {
          if (prev.find((l) => l.id === newLog.id)) return prev;
          return [newLog, ...prev].slice(0, PAGE_SIZE);
        });
        setTotal((t) => t + 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [page]);

  const filtered = logs.filter((l) => {
    let dateMatch = true;
    if (dateStart || dateEnd) {
      const logD = new Date(l.createdAt).getTime();
      if (dateStart) {
        const start = new Date(dateStart + 'T00:00:00').getTime();
        if (logD < start) dateMatch = false;
      }
      if (dateEnd) {
        const end = new Date(dateEnd + 'T23:59:59').getTime();
        if (logD > end) dateMatch = false;
      }
    }

    const searchMatch = !search ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity?.toLowerCase().includes(search.toLowerCase());

    return dateMatch && searchMatch;
  });

  const { sortedData, handleSort, sortBy, sortOrder } = useTableSort(filtered);

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">
            Riwayat aktivitas di dalam sistem (Real-time)
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-bar flex-1 m-0">
          <Search size={18} className="text-gray-400 ml-2 shrink-0" />
          <input
            className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700"
            placeholder="Cari aktivitas, pengguna, entitas..."
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

      <div className="card table-wrapper">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr>
              <SortableHeader
                label="Waktu"
                field="createdAt"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Pengguna"
                field="user.name"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Aksi"
                field="action"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Entitas"
                field="entity"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="ID Entitas"
                field="entityId"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center text-gray-400">
                  <Activity size={48} className="mx-auto mb-4 opacity-20" />
                  <h3 className="text-base font-medium">
                    Tidak ada log aktivitas
                  </h3>
                </td>
              </tr>
            ) : (
              sortedData.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-red-50/20 transition-colors"
                >
                  <td className="px-6 py-4 border-b border-gray-100 text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100">
                    <div className="font-medium text-gray-800 text-sm">
                      {log.user?.name || 'System'}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider rounded-md ${
                          log.user?.role === 'superadmin'
                            ? 'bg-purple-50 text-purple-600'
                            : log.user?.role === 'admin'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {log.user?.role || 'SYSTEM'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium rounded-md font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100 text-sm text-gray-700">
                    {log.entity}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-100 text-xs text-gray-400 font-mono">
                    {log.entityId?.slice(0, 8) || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>{total} log total</span>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Sebelumnya
            </button>
            <span className="px-2">
              Hal {page} / {totalPages}
            </span>
            <button
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </>
  );
}
