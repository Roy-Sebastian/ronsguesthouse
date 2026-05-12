'use client';
import { apiFetch } from '@/lib/apiFetch';
import { showToast } from '@/lib/toast';
import { confirmAction } from '@/lib/dialog';
import {
  AirVent, Bath, Bed, BookOpen, Building2, Bus, Car, Coffee,
  Dumbbell, Flame, Lightbulb, Lock, type LucideIcon, Music, Package,
  Phone, Plug, Plus, Refrigerator, Search, Shield, Shirt, ShowerHead,
  Snowflake, Sofa, Star, Sun, Trash2, Trees, Tv, Utensils, Waves,
  Wind, Wifi, Wrench, X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const ICON_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'Waves', label: 'Kolam Renang', icon: Waves },
  { value: 'Car', label: 'Parkir', icon: Car },
  { value: 'Dumbbell', label: 'Gym', icon: Dumbbell },
  { value: 'Utensils', label: 'Restoran', icon: Utensils },
  { value: 'Coffee', label: 'Kafe', icon: Coffee },
  { value: 'Wifi', label: 'WiFi Umum', icon: Wifi },
  { value: 'Building2', label: 'Gedung', icon: Building2 },
  { value: 'Trees', label: 'Taman', icon: Trees },
  { value: 'Sun', label: 'Outdoor', icon: Sun },
  { value: 'Shield', label: 'Keamanan', icon: Shield },
  { value: 'Bus', label: 'Shuttle', icon: Bus },
  { value: 'Music', label: 'Hiburan', icon: Music },
  { value: 'BookOpen', label: 'Bacaan', icon: BookOpen },
  { value: 'Shirt', label: 'Laundry', icon: Shirt },
  { value: 'Phone', label: 'Telepon', icon: Phone },
  { value: 'Tv', label: 'TV Umum', icon: Tv },
  { value: 'AirVent', label: 'AC Umum', icon: AirVent },
  { value: 'Bath', label: 'Kamar Mandi', icon: Bath },
  { value: 'ShowerHead', label: 'Shower', icon: ShowerHead },
  { value: 'Refrigerator', label: 'Kulkas', icon: Refrigerator },
  { value: 'Plug', label: 'Stop Kontak', icon: Plug },
  { value: 'Lightbulb', label: 'Penerangan', icon: Lightbulb },
  { value: 'Sofa', label: 'Ruang Santai', icon: Sofa },
  { value: 'Bed', label: 'Tempat Tidur', icon: Bed },
  { value: 'Lock', label: 'Keamanan Kamar', icon: Lock },
  { value: 'Wind', label: 'Kipas Umum', icon: Wind },
  { value: 'Flame', label: 'Pemanas', icon: Flame },
  { value: 'Snowflake', label: 'Pendingin Ruang', icon: Snowflake },
  { value: 'Package', label: 'Perlengkapan', icon: Package },
  { value: 'Star', label: 'Unggulan', icon: Star },
  { value: 'Wrench', label: 'Umum', icon: Wrench },
];

const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map((o) => [o.value, o.icon]));

function FacilityIcon({ name, size = 20 }: { name?: string | null; size?: number }) {
  const Icon = (name && ICON_MAP[name] ? ICON_MAP[name] : Building2) as LucideIcon;
  return <Icon size={size} />;
}

export default function ReceptionistFacilitiesPage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: '' });
  const [saving, setSaving] = useState(false);

  const fetchFacilities = async () => {
    setLoading(true);
    const data = await apiFetch('/facilities')
      .then((r) => r.json())
      .catch(() => []);
    setFacilities(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await apiFetch('/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ name: '', description: '', icon: '' });
    showToast('Fasilitas berhasil ditambahkan');
    fetchFacilities();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction('Hapus fasilitas umum ini?');
    if (!ok) return;
    await apiFetch(`/facilities/${id}`, { method: 'DELETE' });
    showToast('Fasilitas berhasil dihapus');
    fetchFacilities();
  };

  const filtered = facilities.filter(
    (f) => !search || f.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Fasilitas Umum</h1>
          <p className="page-subtitle">Kelola data fasilitas umum penginapan (contoh: Kolam Renang, Parkir)</p>
        </div>
        <button
          className="btn btn-primary btn-md"
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} /> <span>Tambah Fasilitas</span>
        </button>
      </div>

      <div className="search-bar flex-1">
        <Search size={18} className="text-gray-400 ml-2 shrink-0" />
        <input
          className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700"
          placeholder="Cari nama fasilitas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400">
            <Building2 size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-base font-medium">Tidak ada fasilitas</h3>
          </div>
        ) : (
          filtered.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <FacilityIcon name={f.icon} size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-base">{f.name}</h3>
                </div>
                <button
                  className="p-1.5 text-red-300 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  onClick={() => handleDelete(f.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4 flex-1">
                {f.description || 'Tidak ada deskripsi'}
              </p>
              <div className="pt-4 border-t border-gray-50 text-xs text-gray-400">
                Ditambahkan: {new Date(f.createdAt).toLocaleDateString('id-ID')}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-200 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-dark">Tambah Fasilitas</h2>
              <button
                className="text-gray-400 hover:bg-gray-100 rounded-lg p-1 transition-colors"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Fasilitas*</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Ex: Kolam Renang, Parkir Luas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ikon</label>
                <div className="grid grid-cols-8 gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-44 overflow-y-auto">
                  {ICON_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        title={opt.label}
                        onClick={() => setForm({ ...form, icon: opt.value })}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                          form.icon === opt.value
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-gray-400 hover:bg-white hover:text-gray-700 hover:shadow-sm'
                        }`}
                      >
                        <Icon size={18} />
                      </button>
                    );
                  })}
                </div>
                {form.icon && (
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <FacilityIcon name={form.icon} size={13} />
                    {ICON_OPTIONS.find((o) => o.value === form.icon)?.label}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Opsional"
                />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  className="btn btn-outline btn-md"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-md"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
