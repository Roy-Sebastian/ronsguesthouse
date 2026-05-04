'use client';
import { apiFetch } from '@/lib/apiFetch';

import { Image as ImageIcon, Trash2, Upload, X, Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function AdminGalleryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState('umum');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [editId, setEditId] = useState<string | null>(null);

  const fetchGallery = async () => {
    setLoading(true);
    const data = await apiFetch('/gallery?all=true')
      .then((r) => r.json())
      .catch(() => []);
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const resetModal = () => {
    setShowModal(false);
    setEditId(null);
    setFile(null);
    setPreview('');
    setCategory('umum');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setCategory(item.category || 'umum');
    setPreview(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}${item.imageUrl}`);
    setFile(null);
    setShowModal(true);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !editId) return; // when creating, file is required. when editing, optional
    setSaving(true);

    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('category', category);

    try {
      const url = editId ? `/api/gallery/${editId}` : '/api/gallery';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });
      if (!res.ok) throw new Error('Gagal upload');
      resetModal();
      fetchGallery();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus foto ini?')) return;
    try {
      await apiFetch(`/gallery/${id}`, {
        method: 'DELETE',
      });
      fetchGallery();
    } catch (e: any) {
      alert('Gagal menghapus');
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const res = await apiFetch(`/gallery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentState }),
      });
      if (res.ok) {
        setItems(prev => prev.map(item => item.id === id ? { ...item, isActive: !currentState } : item));
      } else {
        alert('Gagal mengubah status publik');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan');
    }
  };

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            Manajemen Galeri
          </h1>
          <p className="page-subtitle">
            Kelola foto-foto penginapan untuk halaman publik
          </p>
        </div>
        <button
          className="btn btn-primary btn-md"
          onClick={() => setShowModal(true)}
        >
          <Upload size={16} /> Upload Foto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
            <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-base font-medium">
              Belum ada foto yang diupload
            </h3>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group relative hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="aspect-4/3 bg-gray-100 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}${item.imageUrl}`}
                  alt={item.caption || 'Gallery'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleToggleActive(item.id, item.isActive ?? true)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg ${item.isActive !== false ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                    title={item.isActive !== false ? 'Sembunyikan dari Publik' : 'Tampilkan ke Publik'}
                  >
                    <ImageIcon size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="btn btn-primary btn-md"
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-lg"
                    title="Hapus"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 font-medium truncate uppercase tracking-wider">
                    {item.category || 'UMUM'}
                  </p>
                  <p className="text-[0.65rem] text-gray-400 mt-1">
                    {new Date(item.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div>
                  {item.isActive !== false ? (
                    <span className="px-2 py-1 bg-green-50 text-green-600 border border-green-200 text-[0.65rem] font-bold uppercase tracking-wider rounded-md">Publik</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 border border-gray-200 text-[0.65rem] font-bold uppercase tracking-wider rounded-md">Tersembunyi</span>
                  )}
                </div>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-dark">
                {editId ? 'Edit Foto' : 'Upload Foto'}
              </h2>
              <button
                className="text-gray-400 hover:bg-gray-100 rounded-lg p-1 transition-colors"
                onClick={resetModal}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 flex flex-col gap-4">
              <div
                onClick={() => !preview && fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl overflow-hidden aspect-4/3 flex flex-col items-center justify-center relative cursor-pointer outline-none transition-colors ${preview ? 'border-primary' : 'border-gray-300 hover:border-primary hover:bg-primary/5'}`}
              >
                <input
                  type="file"
                  ref={fileRef}
                  accept="image/*"
                  onChange={handleFile}
                  className="hidden"
                />
                {preview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreview('');
                        setFile(null);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div className="text-center text-gray-400 px-4">
                    <ImageIcon
                      size={32}
                      className="mx-auto mb-3 text-gray-300"
                    />
                    <p className="text-sm font-medium text-gray-500">
                      Klik untuk pilih gambar
                    </p>
                    <p className="text-xs mt-1">JPG, PNG maks 5MB</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kategori
                </label>
                <select
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="umum">Umum</option>
                  <option value="hero">Hero Image</option>
                  <option value="kamar">Kamar</option>
                  <option value="fasilitas">Fasilitas</option>
                  <option value="eksterior">Eksterior</option>
                  <option value="interior">Interior</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  className="btn btn-outline btn-md"
                  onClick={resetModal}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-md"
                  disabled={saving || (!file && !editId)}
                >
                  {saving ? 'Menyimpan...' : editId ? 'Simpan' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
