import { useState, useEffect } from 'react';
import { X, Calendar, Plus, Trash } from 'lucide-react';
import AddOnModal from './AddOnModal';
import swal from '@/lib/swal';

interface EditStayModalProps {
  stay: any;
  onClose: () => void;
  onSuccess: () => void;
  onRefresh?: () => void;
}

export default function EditStayModal({ stay, onClose, onSuccess, onRefresh }: EditStayModalProps) {
  const formatDateTimeLocal = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const [checkIn, setCheckIn] = useState(formatDateTimeLocal(stay?.checkInAt));
  const [checkOut, setCheckOut] = useState(formatDateTimeLocal(stay?.checkOutAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [localStay, setLocalStay] = useState(stay);
  const [showAddOn, setShowAddOn] = useState(false);
  const [removing, setRemoving] = useState<string|null>(null);

  const fetchStay = async () => {
    try {
      const res = await fetch(`/api/stays/${stay.id}`);
      if (res.ok) {
        const data = await res.json();
        setLocalStay(data);
        if (onRefresh) onRefresh();
      }
    } catch (e) {}
  };

  const handleRemoveAddon = async (addonId: string) => {
    const result = await swal.fire({
      icon: 'warning',
      title: 'Konfirmasi',
      text: 'Yakin ingin menghapus layanan ini?',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    setRemoving(addonId);
    try {
      const res = await fetch(`/api/reservations/${localStay.reservationId}/addons/${addonId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal menghapus layanan');
      await fetchStay();
    } catch (e: any) {
      await swal.fire({ icon: 'error', title: 'Gagal', text: e.message });
    } finally {
      setRemoving(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload: any = {};
      if (checkIn) payload.checkInAt = new Date(checkIn).toISOString();
      if (checkOut) payload.checkOutAt = new Date(checkOut).toISOString();

      const res = await fetch(`/api/stays/${stay.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengubah waktu menginap');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 animate-slideUp">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-dark flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Edit Waktu Menginap
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 bg-gray-50 border border-gray-100 rounded-lg p-3">
             <div className="text-sm font-semibold text-gray-800">
                {localStay?.reservation?.guest?.fullName}
             </div>
             <div className="text-xs text-gray-500 mt-0.5">
                Kamar {localStay?.reservation?.room?.roomNumber} 
                <span className="capitalize"> ({localStay?.reservation?.room?.roomType})</span>
             </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Waktu Check-In
              </label>
              <input
                type="datetime-local"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Waktu Check-Out (Opsional)
              </label>
              <input
                type="datetime-local"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
              />
              <p className="text-[11px] text-gray-400 mt-1">Kosongkan jika tamu belum keluar/check-out.</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Layanan Tambahan (Add-Ons)</label>
              <button
                type="button"
                onClick={() => setShowAddOn(true)}
                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
              >
                <Plus size={14} /> Tambah Layanan
              </button>
            </div>
            
            {localStay?.reservation?.bookingAddons?.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {localStay.reservation.bookingAddons.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg p-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-dark truncate">{b.addOn?.name}</div>
                        <div className="text-xs text-gray-500">{b.quantity}x @ Rp{Number(b.addOn?.price).toLocaleString('id-ID')} = Rp{Number(b.totalPrice).toLocaleString('id-ID')}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAddon(b.id)}
                        disabled={removing === b.id}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors disabled:opacity-50"
                      >
                        <Trash size={16} />
                      </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-center text-gray-400 py-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                Belum ada layanan terdaftar
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-md"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-md"
            >
              {saving && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {showAddOn && (
        <AddOnModal
          reservationId={localStay?.reservationId}
          onClose={() => setShowAddOn(false)}
          onSuccess={() => {
            setShowAddOn(false);
            fetchStay();
          }}
        />
      )}
    </div>
  );
}
