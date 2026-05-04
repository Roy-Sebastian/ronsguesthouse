'use client';

import { LogOut, Receipt, X, BedDouble, PackagePlus, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';

interface CheckOutBillModalProps {
  stay: any;
  onConfirm: (stayId: string) => Promise<void>;
  onClose: () => void;
}

const fmtRp = (v: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);

const PENALTY_TYPE_LABEL: Record<string, string> = {
  late_checkout: 'Telat Checkout',
  room_damage: 'Kerusakan Kamar',
  missing_items: 'Barang Hilang',
  other: 'Lainnya',
};

export default function CheckOutBillModal({ stay, onConfirm, onClose }: CheckOutBillModalProps) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  // Load full reservation detail including addons & penalties
  useEffect(() => {
    if (!stay?.reservationId) return;
    apiFetch(`/reservations/${stay.reservationId}`)
      .then((r) => r.json())
      .then((d) => {
        setDetail(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [stay?.reservationId]);

  const res = detail || stay?.reservation;
  const addons = res?.bookingAddons || [];
  const penalties = res?.penalties || [];

  const roomTotal = Number(res?.totalPrice || 0);
  const addOnsTotal = addons.reduce((sum: number, a: any) => sum + Number(a.totalPrice || 0), 0);
  const penaltyTotal = penalties.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const grandTotal = roomTotal + addOnsTotal + penaltyTotal;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm(stay.id);
      onClose();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-50 shrink-0">
          <h2 className="text-lg font-serif font-bold text-dark flex items-center gap-2">
            <LogOut size={20} className="text-amber-600" />
            Konfirmasi Check-Out
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Guest info */}
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tamu</p>
            <p className="font-semibold text-gray-800">{res?.guest?.fullName || stay?.reservation?.guest?.fullName || '-'}</p>
            <p className="text-sm text-gray-500">
              Kamar {res?.room?.roomNumber || stay?.reservation?.room?.roomNumber || '-'}
            </p>
          </div>

          {/* Bill breakdown */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Receipt size={13} /> Rincian Tagihan
            </h3>

            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="w-7 h-7 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {/* Room cost */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <BedDouble size={14} className="text-gray-400" /> Biaya Kamar
                  </div>
                  <span className="font-semibold text-gray-800">{fmtRp(roomTotal)}</span>
                </div>

                {/* Add-ons */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2">
                    <PackagePlus size={12} /> ADD-ONS / LAYANAN
                  </div>
                  {addons.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 italic">
                      <Info size={13} /> Tidak ada add-on
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {addons.map((a: any) => (
                        <div key={a.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {a.addOn?.name || 'Item'}{' '}
                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded ml-1">x{a.quantity}</span>
                          </span>
                          <span className="text-gray-800">{fmtRp(Number(a.totalPrice || 0))}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-semibold border-t border-dashed border-gray-200 pt-1.5 mt-1.5">
                        <span className="text-gray-500">Subtotal Add-On</span>
                        <span>{fmtRp(addOnsTotal)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Penalties */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2">
                    <AlertTriangle size={12} className="text-red-400" /> DENDA
                  </div>
                  {penalties.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 italic">
                      <Info size={13} /> Tidak ada denda
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {penalties.map((p: any) => (
                        <div key={p.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{PENALTY_TYPE_LABEL[p.type] ?? p.type}</span>
                          <span className="text-red-600 font-semibold">{fmtRp(Number(p.amount))}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-semibold border-t border-dashed border-gray-200 pt-1.5 mt-1.5">
                        <span className="text-gray-500">Subtotal Denda</span>
                        <span className="text-red-600">{fmtRp(penaltyTotal)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="px-4 py-4 bg-gray-900 flex justify-between items-center">
                  <span className="font-bold text-white uppercase text-sm tracking-widest">Grand Total</span>
                  <span className="font-bold text-white text-xl">{fmtRp(grandTotal)}</span>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-center text-gray-400">
            Pastikan tamu telah menyelesaikan seluruh pembayaran sebelum menekan "Selesaikan Check-Out"
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming || loading}
            className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
          >
            {confirming ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            Selesaikan Check-Out
          </button>
        </div>
      </div>
    </div>
  );
}
