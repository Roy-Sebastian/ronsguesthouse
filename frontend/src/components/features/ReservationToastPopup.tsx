'use client';

import { useNotifications } from '@/providers/NotificationProvider';
import type { PaymentToast, ReviewToast, MessageToast } from '@/providers/NotificationProvider';
import { BedDouble, CalendarDays, X, CheckCircle2, CreditCard, Star, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

// ─── Reservation Toast ────────────────────────────────────────────────────────

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: { id: string; guestName: string; roomNumber: string; bookingCode: string; source: string; checkInDate: string };
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const formattedDate = toast.checkInDate
    ? new Date(toast.checkInDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    : '-';

  return (
    <div
      className={`
        w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
        <div className="flex items-center gap-2">

          <span className="text-sm font-bold text-green-800 tracking-wide">
            Reservasi Baru
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${toast.source === 'Online'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
              }`}
          >
            {toast.source}
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-700 transition-colors p-0.5 rounded-full hover:bg-gray-100"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 shrink-0">
            Tamu
          </span>
          <span className="text-sm font-semibold text-gray-900 truncate">
            {toast.guestName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BedDouble size={12} className="text-gray-400 shrink-0 ml-0.5" />
          <span className="text-xs text-gray-500 w-[3.25rem] shrink-0">Kamar</span>
          <span className="text-sm font-medium text-gray-800">
            {toast.roomNumber}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays size={12} className="text-gray-400 shrink-0 ml-0.5" />
          <span className="text-xs text-gray-500 w-[3.25rem] shrink-0">Check-in</span>
          <span className="text-sm text-gray-700">{formattedDate}</span>
        </div>
        <div className="pt-1">
          <span className="text-[10px] font-mono text-gray-400">
            #{toast.bookingCode.slice(0, 12)}
          </span>
        </div>
      </div>

      {/* Progress bar auto-dismiss */}
      <div className="h-1 bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-green-400 origin-left animate-[shrink_8s_linear_forwards]" />
      </div>
    </div>
  );
}

// ─── Payment Confirmed Toast ──────────────────────────────────────────────────

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: 'Tunai',
  transfer: 'Transfer Bank',
  qris: 'QRIS / E-Wallet',
  credit_card: 'Kartu Kredit',
  debit_card: 'Kartu Debit',
};

function PaymentToastItem({
  toast,
  onDismiss,
}: {
  toast: PaymentToast;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const formattedAmount = toast.amount
    ? `Rp ${Number(toast.amount).toLocaleString('id-ID')}`
    : '-';

  const methodLabel = PAYMENT_METHOD_LABEL[toast.paymentMethod] ?? toast.paymentMethod;

  return (
    <div
      className={`
        w-80 bg-white border border-emerald-200 rounded-2xl shadow-2xl overflow-hidden
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-bold text-emerald-800 tracking-wide">
            Pembayaran Dikonfirmasi
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-700 transition-colors p-0.5 rounded-full hover:bg-gray-100"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 shrink-0">
            Tamu
          </span>
          <span className="text-sm font-semibold text-gray-900 truncate">
            {toast.guestName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BedDouble size={12} className="text-gray-400 shrink-0 ml-0.5" />
          <span className="text-xs text-gray-500 w-[3.25rem] shrink-0">Kamar</span>
          <span className="text-sm font-medium text-gray-800">
            {toast.roomNumber}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard size={12} className="text-gray-400 shrink-0 ml-0.5" />
          <span className="text-xs text-gray-500 w-[3.25rem] shrink-0">Bayar</span>
          <span className="text-sm font-semibold text-emerald-700">
            {formattedAmount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 ml-0.5">via {methodLabel}</span>
        </div>
        <div className="pt-1">
          <span className="text-[10px] font-mono text-gray-400">
            #{toast.bookingCode.slice(0, 12)}
          </span>
        </div>
      </div>

      {/* Progress bar auto-dismiss */}
      <div className="h-1 bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-400 origin-left animate-[shrink_10s_linear_forwards]" />
      </div>
    </div>
  );
}

// ─── Review Toast ─────────────────────────────────────────────────────────────

function ReviewToastItem({
  toast,
  onDismiss,
}: {
  toast: ReviewToast;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`
        w-80 bg-white border border-amber-200 rounded-2xl shadow-2xl overflow-hidden
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-amber-500 shrink-0" fill="currentColor" />
          <span className="text-sm font-bold text-amber-800 tracking-wide">
            Ulasan Baru Masuk
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-700 transition-colors p-0.5 rounded-full hover:bg-gray-100"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 shrink-0">
            Dari
          </span>
          <span className="text-sm font-semibold text-gray-900 truncate">
            {toast.displayName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 shrink-0">
            Rating
          </span>
          <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                fill={i < toast.rating ? 'currentColor' : 'none'}
                className={i >= toast.rating ? 'text-gray-200' : ''}
              />
            ))}
          </div>
        </div>
        <div className="pt-1">
          <span className="text-[10px] font-mono text-gray-400 italic">
            Menunggu persetujuan admin...
          </span>
        </div>
      </div>

      {/* Progress bar auto-dismiss */}
      <div className="h-1 bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-amber-400 origin-left animate-[shrink_8s_linear_forwards]" />
      </div>
    </div>
  );
}

// ─── Message Toast ────────────────────────────────────────────────────────────

function MessageToastItem({
  toast,
  onDismiss,
}: {
  toast: MessageToast;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`
        w-80 bg-white border border-blue-200 rounded-2xl shadow-2xl overflow-hidden
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-blue-600 shrink-0" />
          <span className="text-sm font-bold text-blue-800 tracking-wide">
            Pesan Baru Masuk
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-700 transition-colors p-0.5 rounded-full hover:bg-gray-100"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 shrink-0">
            Pengirim
          </span>
          <span className="text-sm font-semibold text-gray-900 truncate">
            {toast.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 shrink-0">
            Subjek
          </span>
          <span className="text-sm font-medium text-gray-800 truncate">
            {toast.subject}
          </span>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
          "{toast.message}"
        </p>
      </div>

      {/* Progress bar auto-dismiss */}
      <div className="h-1 bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-400 origin-left animate-[shrink_8s_linear_forwards]" />
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function ReservationToastPopup() {
  const {
    toasts,
    dismissToast,
    paymentToasts,
    dismissPaymentToast,
    reviewToasts,
    dismissReviewToast,
    messageToasts = [],
    dismissMessageToast,
  } = useNotifications();

  if (toasts.length === 0 && paymentToasts.length === 0 && reviewToasts.length === 0 && messageToasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
      {paymentToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <PaymentToastItem toast={toast} onDismiss={dismissPaymentToast} />
        </div>
      ))}
      {reviewToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ReviewToastItem toast={toast} onDismiss={dismissReviewToast} />
        </div>
      ))}
      {messageToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <MessageToastItem toast={toast} onDismiss={dismissMessageToast} />
        </div>
      ))}
    </div>
  );
}
