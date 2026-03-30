'use client';


import { Eye, Mail, MapPin, Phone, Plus, Search, Users, X } from 'lucide-react';
import { fmtDate } from '@/lib/formatters';

import { useEffect, useState } from 'react';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';

export default function AdminGuestsPage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    idNumber: '',
  });

  const fetchGuests = async () => {
    setLoading(true);
    const data = await fetch(`/api/guests${search ? `?search=${search}` : ''}`)
      .then((r) => r.json())
      .catch(() => []);
    setGuests(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchGuests();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Gagal menambahkan tamu');
        setSaving(false);
        return;
      }
      setShowCreate(false);
      setForm({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        idNumber: '',
      });
      fetchGuests();
    } catch {
      setError('Terjadi kesalahan');
    }
    setSaving(false);
  };

  const filtered = guests.filter(
    (g) =>
      g.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      g.email?.toLowerCase().includes(search.toLowerCase()) ||
      g.phone?.includes(search),
  );

  const fmtDate = (d: string) =>
    d
      ? new Date(d).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '-';

  const { sortedData, handleSort, sortBy, sortOrder } = useTableSort(filtered);

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Data Tamu</h1>
          <p className="page-subtitle">
            Kelola informasi tamu penginapan
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Tambah Tamu</span></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Tamu', val: guests.length },
          {
            label: 'Tamu Baru Bulan Ini',
            val: guests.filter((g) => {
              const d = new Date(g.createdAt);
              const now = new Date();
              return (
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear()
              );
            }).length,
          },
          {
            label: 'Tamu Tetap (2+ kunjungan)',
            val: guests.filter((g) => (g._count?.reservations || 0) >= 2)
              .length,
          },
        ].map(({ label, val }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="font-serif text-3xl font-bold text-primary">
              {val}
            </div>
            <div className="text-sm text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="search-bar flex-1">
        <Search size={18} className="text-gray-400 ml-2 shrink-0" />
        <input
          className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
          placeholder="Cari nama, email, atau nomor telepon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card table-wrapper">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr>
              <SortableHeader
                label="Nama"
                field="fullName"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Email"
                field="email"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Telepon"
                field="phone"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="No. Identitas"
                field="idNumber"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Reservasi"
                field="_count.reservations"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <SortableHeader
                label="Terdaftar"
                field="createdAt"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100"
              />
              <th className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                Detail
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="w-8 h-8 mx-auto border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-20" />
                  <div className="text-sm">Belum ada data tamu</div>
                </td>
              </tr>
            ) : (
              sortedData.map((g) => (
                <tr
                  key={g.id}
                  className="hover:bg-gray-50/60 transition-colors border-b border-gray-50 last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-primary-hover flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {g.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-semibold text-dark text-sm">
                        {g.fullName}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {g.email || '-'}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {g.phone || '-'}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {g.idNumber || '-'}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {g._count?.reservations ?? 0}x
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-400">
                    {fmtDate(g.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelected(g)}
                      className="w-8 h-8 rounded-lg bg-primary/8 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Guest Detail Drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md bg-white h-full overflow-y-auto p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="page-title">
                Detail Tamu
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-primary-hover flex items-center justify-center text-white text-2xl font-bold">
                {selected.fullName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-dark text-lg">
                  {selected.fullName}
                </h3>
                <div className="text-xs text-gray-400">
                  Tamu #{selected.id?.slice(0, 8)}
                </div>
              </div>
            </div>
            <div className="space-y-4 text-sm">
              {[
                { Icon: Mail, label: 'Email', val: selected.email },
                { Icon: Phone, label: 'Telepon', val: selected.phone },
                { Icon: MapPin, label: 'Alamat', val: selected.address },
              ].map(
                ({ Icon, label, val }) =>
                  val && (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-primary shrink-0">
                        <Icon size={15} />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">
                          {label}
                        </div>
                        <div className="text-gray-700">{val}</div>
                      </div>
                    </div>
                  ),
              )}
              {selected.idNumber && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-primary shrink-0">
                    <span className="text-xs font-bold">ID</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">
                      No. Identitas
                    </div>
                    <div className="text-gray-700">{selected.idNumber}</div>
                  </div>
                </div>
              )}
            </div>
            {selected.reservations?.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-semibold text-dark text-sm mb-3">
                  Riwayat Reservasi ({selected.reservations.length})
                </h4>
                <div className="space-y-2">
                  {selected.reservations.map((r: any) => (
                    <div
                      key={r.id}
                      className="bg-gray-50 rounded-xl px-3 py-2.5 text-xs text-gray-500 flex justify-between"
                    >
                      <span>Kamar {r.room?.roomNumber}</span>
                      <span>
                        {new Date(r.checkInDate).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="page-title">
                Tambah Tamu
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { key: 'fullName', label: 'Nama Lengkap', required: true },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'phone', label: 'No. Telepon', type: 'tel' },
                { key: 'idNumber', label: 'No. KTP / Identitas' },
                { key: 'address', label: 'Alamat' },
              ].map(({ key, label, required, type }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    {label}{' '}
                    {required && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    required={required}
                    type={type || 'text'}
                    value={(form as any)[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-60 shadow-sm"
                >
                  {saving ? 'Menyimpan...' : 'Tambah Tamu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
