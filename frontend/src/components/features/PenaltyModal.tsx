'use client';

import { apiFetch } from '@/lib/apiFetch';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

const PENALTY_TYPE_LABEL: Record<string, string> = {
  late_checkout: 'Telat Checkout',
  room_damage:   'Kerusakan Kamar',
  missing_items: 'Barang Hilang',
  other:         'Lainnya',
};

const PENALTY_TYPES = Object.keys(PENALTY_TYPE_LABEL);

interface PenaltyModalProps {
  reservationId: string;
  guestName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

export default function PenaltyModal({ reservationId, guestName, onClose, onSuccess }: PenaltyModalProps) {
  const [form, setForm] = useState({
    type: 'other',
    amount: '',
    description: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Nominal denda harus lebih dari 0');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch('/penalties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          type: form.type,
          amount: Number(form.amount),
          description: form.description,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menambahkan denda');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-dark">Tambah Denda</h2>
              <p className="text-xs text-gray-400">{guestName}</p>
            </div>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Jenis Denda
            </label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50 font-medium text-dark"
            >
              {PENALTY_TYPES.map((t) => (
                <option key={t} value={t}>{PENALTY_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Nominal Denda (Rp)
            </label>
            <input
              type="number"
              min="1"
              required
              placeholder="Contoh: 150000"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50 font-medium text-dark"
            />
            {form.amount && Number(form.amount) > 0 && (
              <p className="mt-1 text-xs text-primary font-semibold">{formatRp(Number(form.amount))}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Keterangan <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Kaca kamar mandi pecah"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-gray-50 text-dark"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Catatan (opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
              disabled={saving}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><AlertTriangle size={16} /> Kenakan Denda</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
