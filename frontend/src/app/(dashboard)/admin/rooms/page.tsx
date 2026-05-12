'use client';
import { apiFetch } from '@/lib/apiFetch';
import { showToast } from '@/lib/toast';
import { TableActions } from '@/components/ui/TableActions';
import { formatRp } from '@/lib/formatters';
import { ROOM_TYPE_LABEL, getRoomTypeByNumber } from '@/lib/constants';


import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import 'filepond/dist/filepond.min.css';
import { BedDouble, Edit, Info, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import swal from '@/lib/swal';

registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType);

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState<any>(null);
  const [form, setForm] = useState({
    roomNumber: '',
    roomType: 'standard',
    floor: 1,
    capacity: 2,
    pricePerNight: '',
    status: 'available',
    description: '',
    imageUrl: '',
    selectedAmenities: [] as string[],
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [r, a] = await Promise.all([
      apiFetch('/rooms')
        .then((res) => res.json())
        .catch(() => []),
      apiFetch('/amenities')
        .then((res) => res.json())
        .catch(() => []),
    ]);
    setRooms(Array.isArray(r) ? r : []);
    setAmenities(Array.isArray(a) ? a : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditRoom(null);
    setFile(null);
    setForm({
      roomNumber: '',
      roomType: 'standard',
      floor: 1,
      capacity: 2,
      pricePerNight: '',
      status: 'available',
      description: '',
      imageUrl: '',
      selectedAmenities: [],
    });
    setShowModal(true);
  };
  const openEdit = (r: any) => {
    setEditRoom(r);
    setFile(null);
    setForm({
      roomNumber: r.roomNumber,
      roomType: r.roomType,
      floor: r.floor || 1,
      capacity: r.capacity,
      pricePerNight: Number(r.pricePerNight).toString(),
      status: r.status,
      description: r.description || '',
      imageUrl: r.imageUrl || '',
      selectedAmenities: r.roomAmenities?.map((ra: any) => ra.amenityId) || [],
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let finalImageUrl = form.imageUrl;

    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalImageUrl = uploadData.url;
        }
      } catch (err) {
        console.error('Image upload failed', err);
      }
    }

    const payload = {
      ...form,
      imageUrl: finalImageUrl,
      floor: Number(form.floor),
      capacity: Number(form.capacity),
      pricePerNight: Number(form.pricePerNight),
    };
    if (editRoom) {
      await apiFetch(`/rooms/${editRoom.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch('/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setShowModal(false);
    showToast(editRoom ? 'Kamar berhasil diperbarui' : 'Kamar berhasil ditambahkan');
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const result = await swal.fire({
      icon: 'warning',
      title: 'Konfirmasi',
      text: 'Hapus kamar ini?',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    await apiFetch(`/rooms/${id}`, { method: 'DELETE' });
    showToast('Kamar berhasil dihapus');
    fetchData();
  };

  const toggleAmenity = (id: string) =>
    setForm((f) => ({
      ...f,
      selectedAmenities: f.selectedAmenities.includes(id)
        ? f.selectedAmenities.filter((aid) => aid !== id)
        : [...f.selectedAmenities, id],
    }));
  

  const filtered = rooms.filter(
    (r) =>
      !search ||
      r.roomNumber.includes(search) ||
      r.roomType.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            Manajemen Kamar
          </h1>
          <p className="page-subtitle">
            Kelola inventaris dan tipe kamar penginapan
          </p>
        </div>
        <button
          className="btn btn-primary btn-md"
          onClick={openCreate}
        >
          <Plus size={16} /> <span>Tambah Kamar</span></button>
      </div>

      <div className="search-bar flex-1">
        <Search size={18} className="text-gray-400 ml-2 shrink-0" />
        <input
          className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700"
          placeholder="Cari nomor urut kamar, tipe kamar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400">
            <BedDouble size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-base font-medium">Tidak ada data kamar</h3>
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div
                className="h-32 p-5 flex flex-col justify-between relative bg-cover bg-center"
                style={
                  r.imageUrl
                    ? {
                        backgroundImage: `url(${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}${r.imageUrl})`,
                      }
                    : {
                        background:
                          'linear-gradient(to bottom right, #1a3a4a, #102330)',
                      }
                }
              >
                <div className="absolute inset-0 bg-black/40 z-0"></div>
                <div className="flex justify-between items-start z-10">
                  <span
                    className={`px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider rounded-md text-white ${r.status === 'available' ? 'bg-green-500/80 backdrop-blur-sm' : r.status === 'occupied' ? 'bg-red-500/80 backdrop-blur-sm' : 'bg-gray-500/80 backdrop-blur-sm'}`}
                  >
                    {r.status === 'available'
                      ? 'Tersedia'
                      : r.status === 'occupied'
                        ? 'Terisi'
                        : 'Maintenance'}
                  </span>
                  <div className="flex bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden py-0.5 px-1 opacity-100 transition-opacity">
                    <TableActions
                      editPermission="room.edit"
                      deletePermission="room.delete"
                      onEdit={() => openEdit(r)}
                      onDelete={() => handleDelete(r.id)}
                    />
                  </div>
                </div>
                <div className="z-10">
                  <div className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
                    {ROOM_TYPE_LABEL[r.roomType] || r.roomType}
                  </div>
                  <h3 className="font-serif text-3xl font-bold text-white leading-none">
                    {r.roomNumber}
                  </h3>
                </div>
                <BedDouble
                  size={64}
                  className="absolute bottom-2 right-2 text-white/5"
                />
              </div>
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">Harga / Malam</span>
                    <span className="font-bold text-primary text-lg">
                      {formatRp(Number(r.pricePerNight))}
                    </span>
                  </div>
                  <div className="text-right flex flex-col">
                    <span className="text-xs text-gray-400">Kapasitas</span>
                    <span className="font-medium text-gray-700 text-sm">
                      {r.capacity} Orang
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 flex gap-2 flex-wrap">
                  {r.roomAmenities?.slice(0, 3).map((ra: any) => (
                    <span
                      key={ra.amenity?.id}
                      className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md border border-gray-100 whitespace-nowrap"
                    >
                      {ra.amenity?.name}
                    </span>
                  ))}
                  {r.roomAmenities?.length > 3 && (
                    <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md border border-gray-100">
                      +{r.roomAmenities.length - 3}
                    </span>
                  )}
                  {!r.roomAmenities?.length && (
                    <span className="text-xs text-gray-400 italic">
                      Tidak ada amenitas khusus
                    </span>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="font-serif text-xl font-bold text-dark">
                {editRoom ? 'Edit Kamar' : 'Tambah Kamar Baru'}
              </h2>
              <button
                className="text-gray-400 hover:bg-gray-100 rounded-lg p-1 transition-colors"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="roomForm" onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nomor Kamar*
                    </label>
                    <input
                      className="form-input"
                      value={form.roomNumber}
                      onChange={(e) => {
                        const num = e.target.value;
                        const autoType = getRoomTypeByNumber(num);
                        setForm({ ...form, roomNumber: num, roomType: autoType });
                      }}
                      required
                      placeholder="1–10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tipe Kamar*
                    </label>
                    <select
                      className="form-input"
                      value={form.roomType}
                      onChange={(e) =>
                        setForm({ ...form, roomType: e.target.value })
                      }
                    >
                      <option value="city_view">City View</option>
                      <option value="standard">Standard</option>
                      <option value="suite">Suite</option>
                      <option value="family">Family</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Lantai (Floor)*
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      min={1}
                      value={form.floor}
                      onChange={(e) =>
                        setForm({ ...form, floor: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Kapasitas (Orang)*
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      min={1}
                      value={form.capacity}
                      onChange={(e) =>
                        setForm({ ...form, capacity: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Harga / Malam (Rp)*
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      min={0}
                      value={form.pricePerNight}
                      onChange={(e) =>
                        setForm({ ...form, pricePerNight: e.target.value })
                      }
                      required
                      placeholder="150000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Status*
                    </label>
                    <select
                      className="form-input"
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      <option value="available">Tersedia</option>
                      <option value="occupied">
                        Terisi (Peringatan: Gunakan Check-in jika mengubah ini
                        secara manual)
                      </option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Gambar Kamar (opsional)
                    </label>
                    <FilePond
                      files={file ? [file] : []}
                      onupdatefiles={(fileItems) => {
                        setFile((fileItems[0]?.file as File) || null);
                      }}
                      allowMultiple={false}
                      acceptedFileTypes={['image/*']}
                      name="file"
                      labelIdle='Drag & Drop gambar atau <span class="filepond--label-action">Browse</span>'
                    />
                    {form.imageUrl && (
                      <p className="text-xs text-green-600 mb-4">
                        Kamar ini sudah memiliki gambar tertaut.
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Deskripsi
                    </label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenitas Kamar
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((a) => (
                      <label
                        key={a.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm cursor-pointer transition-colors ${form.selectedAmenities.includes(a.id) ? 'border-primary bg-primary/5 text-primary-hover font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={form.selectedAmenities.includes(a.id)}
                          onChange={() => toggleAmenity(a.id)}
                        />
                        {a.name}
                      </label>
                    ))}
                    {amenities.length === 0 && (
                      <span className="text-xs text-gray-400 italic flex items-center gap-1">
                        <Info size={12} /> Belum ada data amenitas. Tambahkan di
                        menu Amenitas.
                      </span>
                    )}
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50/50">
              <button
                type="button"
                className="btn btn-outline btn-md"
                onClick={() => setShowModal(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                form="roomForm"
                className="btn btn-primary btn-md"
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Simpan Kamar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
