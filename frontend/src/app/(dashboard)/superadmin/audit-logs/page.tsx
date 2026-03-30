'use client';


import { Activity, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';

export default function SuperadminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/audit-logs')
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      });

    // Real-time events
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const socket = io(backendUrl, { path: '/api/socket.io' });
    socket.on('new_audit_log', (newLog) => {
      setLogs((prev) => {
        if (prev.find((l) => l.id === newLog.id)) return prev;
        return [newLog, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filtered = logs.filter(
    (l) =>
      !search ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity?.toLowerCase().includes(search.toLowerCase()),
  );

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

      <div className="search-bar flex-1">
        <Search size={18} className="text-gray-400 ml-2 shrink-0" />
        <input
          className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700"
          placeholder="Cari aktivitas, pengguna, entitas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Pengguna"
                field="user.name"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Aksi"
                field="action"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Entitas"
                field="entity"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-6 py-4 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="ID Entitas"
                field="entityId"
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
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 border-b border-gray-50 text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50">
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
                  <td className="px-6 py-4 border-b border-gray-50">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium rounded-md font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50 text-sm text-gray-700">
                    {log.entity}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-50 text-xs text-gray-400 font-mono">
                    {log.entityId?.slice(0, 8) || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
