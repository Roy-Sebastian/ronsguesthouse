"use client";

import { TableActions } from '@/components/ui/TableActions';
import { confirmAction } from '@/lib/dialog';
import { Plus, Search, Trash2, ShoppingBag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';

export default function SuperadminAddonsPage() {
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', category: 'general', price: 0, description: '' });
  const [saving, setSaving] = useState(false);

  const fetchAddons = async () => {
    setLoading(true);
    const data = await fetch('/api/addons/master').then((r) => r.json()).catch(() => []);
    setAddons(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAddons();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', category: 'general', price: 0, description: '' });
    setShowModal(true);
  };

  const openEdit = (a: any) => {
    setEditId(a.id);
    setForm({ name: a.name, category: a.category || 'general', price: Number(a.price), description: a.description || '' });
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const url = editId ? `/api/addons/master/${editId}` : '/api/addons/master';
    const method = editId ? 'PATCH' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    });
    setSaving(false);
    setShowModal(false);
    setEditId(null);
    setForm({ name: '', category: 'general', price: 0, description: '' });
    fetchAddons();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction('Hapus layanan ini?');
    if (!ok) return;
    await fetch('/api/addons/master/' + id, { method: 'DELETE' });
    fetchAddons();
  };

  const filtered = addons.filter((a) =>
    a.name?.toLowerCase().includes(search.toLowerCase())
  );

  const { sortedData, handleSort, sortBy, sortOrder } = useTableSort(filtered);

  return (
    <>
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <ShoppingBag className="text-primary" />
              Master Layanan / Add-On
            </h1>
            <p className="page-subtitle">
              Kelola layanan tambahan tamu tanpa manajemen stok.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="btn btn-primary btn-md"
          >
            <Plus size={18} /> Tambah Layanan
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari layanan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-9"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500">
                <tr>
                  <SortableHeader
                    label="Nama Layanan"
                    field="name"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    className="px-6 py-4 font-medium"
                  />
                  <SortableHeader
                    label="Harga"
                    field="price"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    className="px-6 py-4 font-medium"
                  />
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">Memuat data...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">Belum ada data layanan</td>
                  </tr>
                ) : (
                  sortedData.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{a.name}</div>
                        <div className="text-xs text-gray-500">{a.category}</div>
                      </td>
                      <td className="px-6 py-4">Rp {Number(a.price).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right">
                        <TableActions
                            deletePermission="addon.manage"
                            editPermission="addon.manage"
                            onDelete={() => handleDelete(a.id)}
                            onEdit={() => openEdit(a)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold">{editId ? 'Edit Layanan' : 'Tambah Layanan'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Layanan</label>
                <input required type="text" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="form-input" placeholder="cth: Extra Bed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga</label>
                <input required type="number" value={form.price} onChange={e=>setForm({...form, price: Number(e.target.value)})} className="form-input" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="form-input">
                  <option value="general">Umum</option>
                  <option value="extra_bed">Extra Bed</option>
                  <option value="food">Makanan / Minuman</option>
                  <option value="laundry">Laundry</option>
                  <option value="rental">Penyewaan</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-md">Batal</button>
                <button type="submit" disabled={saving} className="btn btn-primary btn-md">
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