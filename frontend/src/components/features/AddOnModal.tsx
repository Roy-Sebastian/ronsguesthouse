'use client';

import { DollarSign, PackagePlus, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AddOnModalProps {
  reservationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddOnModal({ reservationId, onClose, onSuccess }: AddOnModalProps) {
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    addOnId: '',
    quantity: 1,
    notes: '',
  });

  useEffect(() => {
    fetch('/api/addons/available')
      .then((r) => r.json())
      .then((d) => {
        setAddons(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectedAddon = addons.find((a) => a.id === form.addOnId);
  const totalPrice = selectedAddon ? Number(selectedAddon.price) * form.quantity : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/reservations/${reservationId}/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menambahkan layanan');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const formatRp = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(v);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 text-primary">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PackagePlus size={20} />
            </div>
            <h2 className="font-serif text-xl font-bold text-dark">Tambah Layanan</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Pilih Layanan (Add-On)
              </label>
              <select
                required
                value={form.addOnId}
                onChange={(e) => setForm({ ...form, addOnId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50 font-medium text-dark"
              >
                <option value="">-- Pilih Layanan --</option>
                {addons.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {formatRp(Number(a.price))}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Kuantitas
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50 font-medium text-dark"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Total Harga
                </label>
                <div className="w-full px-4 py-3 border border-primary/20 rounded-xl text-sm bg-primary/5 font-bold text-primary flex items-center">
                  {formatRp(totalPrice)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Catatan Opsional
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Misal: Tambah extra bed di ruang tengah..."
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50 text-dark resize-none"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving || !form.addOnId}
                className="btn btn-primary btn-md"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={18} /> Simpan Layanan
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
