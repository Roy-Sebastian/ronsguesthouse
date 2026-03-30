import { X, Calendar, User, BedDouble, Receipt, Info } from 'lucide-react';

interface StayDetailModalProps {
  stay: any;
  onClose: () => void;
}

export default function StayDetailModal({ stay, onClose }: StayDetailModalProps) {
  if (!stay) return null;

  const res = stay.reservation;
  const addons = res?.bookingAddons || [];
  
  const roomTotal = Number(res?.totalPrice || 0);
  const addOnsTotal = addons.reduce((sum: number, a: any) => sum + Number(a.totalPrice || 0), 0);
  const grandTotal = roomTotal + addOnsTotal;

  const fmtRp = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(v);

  const fmtDate = (d: string) =>
    d
      ? new Date(d).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-serif font-bold text-dark flex items-center gap-2">
            <Receipt className="text-primary" />
            Detail Riwayat Menginap
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <User size={14} /> Informasi Tamu
              </h3>
              <div className="font-semibold text-gray-800">{res?.guest?.fullName || '-'}</div>
              <div className="text-sm text-gray-600 mt-1">{res?.guest?.phone || '-'}</div>
              <div className="text-sm text-gray-600 truncate">{res?.guest?.email || '-'}</div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <BedDouble size={14} /> Informasi Kamar
              </h3>
              <div className="font-semibold text-gray-800">
                Kamar {res?.room?.roomNumber || '-'} <span className="text-sm font-normal text-gray-500 capitalize">({res?.room?.roomType || '-'})</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Kapasitas: {res?.room?.capacity || '-'} Orang
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-100 rounded-xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Calendar size={14} /> Durasi Menginap
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Check-In Aktual</div>
                <div className="font-medium text-gray-800 text-sm">{fmtDate(stay.checkInAt)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Check-Out Aktual</div>
                <div className="font-medium text-gray-800 text-sm">{fmtDate(stay.checkOutAt)}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Receipt size={14} /> Rincian Biaya
            </h3>
            
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-sm font-medium text-gray-800">
                <span>Biaya Kamar</span>
                <span>{fmtRp(roomTotal)}</span>
              </div>
              
              <div className="px-4 py-3">
                <div className="text-xs font-bold text-gray-500 mb-2">ADD-ONS / LAYANAN</div>
                {addons.length === 0 ? (
                  <div className="text-sm flex items-center gap-2 text-gray-400 italic">
                    <Info size={14} /> Tidak ada add-ons
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addons.map((addon: any) => (
                      <div key={addon.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {addon.addOn?.name || 'Item'} <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded ml-1">x{addon.quantity}</span>
                        </span>
                        <span className="text-gray-800">{fmtRp(Number(addon.totalPrice || 0))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="px-4 py-4 bg-gray-900 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-white uppercase text-sm tracking-widest">Grand Total</span>
                <span className="font-bold text-white text-lg">{fmtRp(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
