'use client';

import { apiFetch } from '@/lib/apiFetch';
import { showToast } from '@/lib/toast';
import { confirmAction } from '@/lib/dialog';
import { Eye, Globe, Mail, Pencil, Phone, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { fmtDate } from '@/lib/formatters';

import { useEffect, useState } from 'react';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { useHasPermission } from '@/lib/useHasPermission';
import { Pagination } from '@/components/ui/Pagination';

const WORLD_COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina',
  'Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados',
  'Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina',
  'Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia',
  'Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros',
  'Congo (Brazzaville)','Congo (Kinshasa)','Costa Rica','Croatia','Cuba','Cyprus',
  'Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt',
  'El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji',
  'Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada',
  'Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland',
  'India','Iran','Iraq','Ireland','Israel','Italy','Ivory Coast','Jamaica','Japan','Jordan',
  'Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho',
  'Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia',
  'Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia',
  'Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia',
  'Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea',
  'North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama',
  'Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania',
  'Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines',
  'Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia',
  'Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia',
  'South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden',
  'Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo',
  'Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda',
  'Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan',
  'Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  idNumber: '',
  category: 'Lokal',
  nationality: '',
};

const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50';
const labelClass = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

function GuestForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  title,
  error,
  saving,
}: {
  formData: typeof EMPTY_FORM;
  onChange: (f: typeof EMPTY_FORM) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  title: string;
  error: string;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-100 shrink-0">
          <h2 className="page-title">{title}</h2>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        {error && (
          <div className="px-8 py-3 bg-red-50 text-red-700 text-sm border-b border-red-100 shrink-0 font-medium">
            {error}
          </div>
        )}
        <div className="overflow-y-auto flex-1 px-8 py-6">
        <form onSubmit={onSubmit} className="space-y-4">
          {([
            { key: 'fullName', label: 'Nama Lengkap', required: true },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'phone', label: 'No. Telepon', type: 'tel' },
            { key: 'idNumber', label: 'No. KTP / Identitas' },
          ] as { key: keyof typeof EMPTY_FORM; label: string; required?: boolean; type?: string }[]).map(({ key, label, required, type }) => (
            <div key={key}>
              <label className={labelClass}>
                {label} {required && <span className="text-red-400">*</span>}
              </label>
              <input
                required={required}
                type={type || 'text'}
                value={formData[key]}
                onChange={(e) => onChange({ ...formData, [key]: e.target.value })}
                className={inputClass}
              />
            </div>
          ))}
          <div>
            <label className={labelClass}>Kewarganegaraan</label>
            <select
              value={formData.category}
              onChange={(e) => onChange({ ...formData, category: e.target.value, nationality: '' })}
              className={inputClass}
            >
              <option value="Lokal">Indonesia</option>
              <option value="Luar Negeri">Luar Negeri</option>
            </select>
          </div>
          {formData.category === 'Luar Negeri' && (
            <div>
              <label className={labelClass}>Negara Asal</label>
              <input
                list="world-countries-superadmin"
                value={formData.nationality}
                onChange={(e) => onChange({ ...formData, nationality: e.target.value })}
                placeholder="Ketik atau pilih negara..."
                className={inputClass}
              />
              <datalist id="world-countries-superadmin">
                {WORLD_COUNTRIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-md">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default function SuperadminGuestsPage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateStart, dateEnd]);

  const canCreate = useHasPermission('guest.create');
  const canEdit   = useHasPermission('guest.edit');
  const canDelete = useHasPermission('guest.delete');

  const fetchGuests = async () => {
    setLoading(true);
    const data = await apiFetch(`/guests${search ? `?search=${search}` : ''}`)
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
      const res = await apiFetch('/guests', {
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
      setForm(EMPTY_FORM);
      showToast('Tamu berhasil ditambahkan');
      fetchGuests();
    } catch {
      setError('Terjadi kesalahan');
    }
    setSaving(false);
  };

  const openEdit = (g: any) => {
    setEditTarget(g);
    setEditForm({
      fullName: g.fullName || '',
      email: g.email || '',
      phone: g.phone || '',
      idNumber: g.idNumber || '',
      category: g.category || 'Lokal',
      nationality: g.nationality || '',
    });
    setError('');
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`/guests/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Gagal memperbarui tamu');
        setSaving(false);
        return;
      }
      setShowEdit(false);
      setEditTarget(null);
      showToast('Data tamu berhasil diperbarui');
      fetchGuests();
    } catch {
      setError('Terjadi kesalahan');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirmAction(
      `Hapus tamu ${name} secara permanen? Tindakan ini tidak bisa dibatalkan.`
    );
    if (!ok) return;

    try {
      await apiFetch(`/guests/${id}`, { method: 'DELETE' });
      showToast('Tamu berhasil dihapus', 'success');
      fetchGuests();
    } catch {
      showToast('Gagal menghapus tamu', 'error');
    }
  };

  const filtered = guests.filter((g) => {
    let dateMatch = true;
    if (dateStart || dateEnd) {
      const gDate = new Date(g.createdAt).getTime();
      if (dateStart) {
        const start = new Date(dateStart + 'T00:00:00').getTime();
        if (gDate < start) dateMatch = false;
      }
      if (dateEnd) {
        const end = new Date(dateEnd + 'T23:59:59').getTime();
        if (gDate > end) dateMatch = false;
      }
    }

    const searchMatch = !search ||
      g.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      g.email?.toLowerCase().includes(search.toLowerCase()) ||
      g.phone?.includes(search);

    return dateMatch && searchMatch;
  });

  const fmtDateLocal = (d: string) =>
    d
      ? new Date(d).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '-';

  const { sortedData, handleSort, sortBy, sortOrder } = useTableSort(filtered);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Data Tamu</h1>
          <p className="page-subtitle">Kelola informasi tamu penginapan</p>
        </div>
        {canCreate && (
          <button onClick={() => { setError(''); setForm(EMPTY_FORM); setShowCreate(true); }} className="btn btn-primary btn-md">
            <Plus size={16} /> <span>Tambah Tamu</span>
          </button>
        )}
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
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length,
          },
          {
            label: 'Tamu Tetap (2+ kunjungan)',
            val: guests.filter((g) => (g._count?.reservations || 0) >= 2).length,
          },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="font-serif text-3xl font-bold text-primary">{val}</div>
            <div className="text-sm text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-bar flex-1 m-0">
          <Search size={18} className="text-gray-400 ml-2 shrink-0" />
          <input
            className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
            placeholder="Cari nama, email, atau nomor telepon..."
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
              <SortableHeader label="Nama" field="fullName" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100" />
              <SortableHeader label="Email" field="email" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100" />
              <SortableHeader label="Telepon" field="phone" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100" />
              <SortableHeader label="No. Identitas" field="idNumber" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100" />
              <SortableHeader label="Negara" field="nationality" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100" />
              <SortableHeader label="Reservasi" field="_count.reservations" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100" />
              <SortableHeader label="Terdaftar" field="createdAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100" />
              <th className="px-5 py-3.5 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-20 text-center">
                  <div className="w-8 h-8 mx-auto border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-20" />
                  <div className="text-sm">Belum ada data tamu</div>
                </td>
              </tr>
            ) : (
              paginatedData.map((g) => (
                <tr key={g.id} className="hover:bg-red-50/20 transition-colors border-b border-gray-100 last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-primary-hover flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {g.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-semibold text-dark text-sm">{g.fullName}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{g.email || '-'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{g.phone || '-'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{g.idNumber || '-'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {g.category === 'Luar Negeri' ? (g.nationality || 'Luar Negeri') : 'Indonesia'}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{g._count?.reservations ?? 0}x</td>
                  <td className="px-5 py-4 text-sm text-gray-400">{fmtDateLocal(g.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelected(g)}
                        className="w-8 h-8 rounded-lg bg-primary/8 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all"
                        title="Lihat detail"
                      >
                        <Eye size={15} />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => openEdit(g)}
                          className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-500 hover:text-white text-blue-500 flex items-center justify-center transition-all"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(g.id, g.fullName)}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-500 hover:text-white text-red-400 flex items-center justify-center transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <Pagination page={currentPage} limit={itemsPerPage} total={sortedData.length} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Guest Detail Popup */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-100 shrink-0">
              <h2 className="page-title">Detail Tamu</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-8 py-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-primary-hover flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  {selected.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-dark text-lg">{selected.fullName}</h3>
                  <div className="text-xs text-gray-400">Tamu #{selected.id?.slice(0, 8)}</div>
                </div>
              </div>
              <dl className="space-y-3 text-sm">
                {[
                  ['Nama Lengkap', selected.fullName || '-'],
                  ['Email', selected.email || '-'],
                  ['Telepon', selected.phone || '-'],
                  ['No. Identitas', selected.idNumber || '-'],
                  ['Kewarganegaraan', selected.category === 'Luar Negeri' ? (selected.nationality || 'Luar Negeri') : 'Indonesia'],
                  ['Jumlah Reservasi', `${selected._count?.reservations ?? selected.reservations?.length ?? 0}x`],
                  ['Tanggal Terdaftar', fmtDateLocal(selected.createdAt)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between gap-4 border-b border-gray-100 pb-2.5 last:border-0">
                    <dt className="text-gray-400 shrink-0">{label}</dt>
                    <dd className="font-medium text-gray-800 text-right">{String(value)}</dd>
                  </div>
                ))}
              </dl>
              {selected.reservations?.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="font-semibold text-dark text-sm mb-3">
                    Riwayat Reservasi ({selected.reservations.length})
                  </h4>
                  <div className="space-y-2">
                    {selected.reservations.map((r: any) => (
                      <div key={r.id} className="bg-gray-50 rounded-xl px-3 py-2.5 text-xs text-gray-500 flex justify-between">
                        <span>Kamar {r.room?.roomNumber}</span>
                        <span>{new Date(r.checkInDate).toLocaleDateString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => setSelected(null)}
                className="mt-6 w-full py-2.5 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Create Modal */}
      {showCreate && (
        <GuestForm
          formData={form}
          onChange={setForm}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          title="Tambah Tamu"
          error={error}
          saving={saving}
        />
      )}

      {/* Edit Modal */}
      {showEdit && (
        <GuestForm
          formData={editForm}
          onChange={setEditForm}
          onSubmit={handleEdit}
          onCancel={() => { setShowEdit(false); setEditTarget(null); }}
          title="Edit Tamu"
          error={error}
          saving={saving}
        />
      )}

      {/* Delete Confirm */}
    </>
  );
}
