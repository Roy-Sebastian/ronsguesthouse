'use client';

import {
  BedDouble,
  CalendarCheck,
  CheckCircle,
  Clock,
  CreditCard,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const statusBadge: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-700',
  checked_in: 'bg-green-50 text-green-700',
  checked_out: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-50 text-red-700',
  pending: 'bg-amber-50 text-amber-700',
  no_show: 'bg-red-50 text-red-700',
};
const statusLabel: Record<string, string> = {
  confirmed: 'Dikonfirmasi',
  checked_in: 'Check In',
  checked_out: 'Check Out',
  cancelled: 'Dibatalkan',
  pending: 'Pending',
  no_show: 'No Show',
};

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

function loadSnapScript(clientKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (window.snap) {
      resolve();
      return;
    }
    const isProduction =
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    const script = document.createElement('script');
    script.src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

export default function GuestDashboard() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string>('');

  const fetchReservations = () => {
    setLoading(true);
    fetch('/api/reservations')
      .then((r) => r.json())
      .then((d) => {
        setReservations(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const formatRp = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(v);

  const handlePay = async (reservationId: string) => {
    setPaying(reservationId);
    try {
      const res = await fetch('/api/transactions/midtrans/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses pembayaran');

      const { snap_token, client_key } = data;
      await loadSnapScript(client_key);

      window.snap!.pay(snap_token, {
        onSuccess: () => fetchReservations(),
        onPending: () => fetchReservations(),
        onError: () => {},
        onClose: () => {},
      });
    } catch (e: any) {
      alert(e.message || 'Gagal memproses pembayaran');
    } finally {
      setPaying('');
    }
  };

  const canPay = (r: any) =>
    ['pending', 'confirmed'].includes(r.status) &&
    (!r.transaction || r.transaction.paymentStatus !== 'paid');

  const isPaid = (r: any) => r.transaction?.paymentStatus === 'paid';

  return (
    <>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-dark">
          Reservasi Saya
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat riwayat dan status pemesanan kamar Anda
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
          <CalendarCheck size={64} className="mx-auto mb-6 opacity-20" />
          <h3 className="font-serif text-2xl text-dark mb-2">
            Belum Ada Reservasi
          </h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Anda belum pernah melakukan reservasi kamar bersama kami. Silakan
            hubungi kami untuk memesan.
          </p>
          <Link
            href="/rooms"
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors inline-block text-sm shadow-md"
          >
            Lihat Pilihan Kamar
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row md:items-start gap-6 hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-dark" />

              <div className="flex-1 min-w-0 pl-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="font-serif text-2xl font-bold text-dark flex items-center gap-2 truncate">
                    <BedDouble size={22} className="text-primary" />
                    Kamar {r.room?.roomNumber} —{' '}
                    <span className="text-lg font-sans font-medium text-gray-500 tracking-wide">
                      {r.room?.roomType}
                    </span>
                  </h3>
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md ${statusBadge[r.status] || 'bg-gray-100 text-gray-700'}`}
                  >
                    {statusLabel[r.status] || r.status}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 text-sm text-gray-500 mb-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100 w-fit">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                      Check-In
                    </span>
                    <strong className="text-gray-800 text-base">
                      {new Date(r.checkInDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                  </div>
                  <div className="hidden sm:block w-px bg-gray-200"></div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                      Check-Out
                    </span>
                    <strong className="text-gray-800 text-base">
                      {new Date(r.checkOutDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                  </div>
                  <div className="hidden sm:block w-px bg-gray-200"></div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                      Jumlah Tamu
                    </span>
                    <strong className="text-gray-800 text-base">
                      {r.numGuests} Orang
                    </strong>
                  </div>
                </div>

                {r.specialRequests && (
                  <div className="text-sm bg-primary/5 text-primary-hover p-3 rounded-lg border border-primary/20 max-w-xl">
                    <span className="font-semibold block mb-1">
                      Catatan Tambahan:
                    </span>{' '}
                    {r.specialRequests}
                  </div>
                )}
              </div>

              <div className="md:text-right flex flex-col justify-center items-start md:items-end shrink-0 pl-1 border-t md:border-t-0 md:border-l border-gray-100 pt-5 md:pt-0 md:pl-6">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                  Total Tagihan
                </div>
                <div className="text-3xl font-bold text-primary mb-4">
                  {formatRp(Number(r.totalPrice))}
                </div>

                {/* Payment status badge */}
                {isPaid(r) && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-100 mb-3">
                    <CheckCircle size={13} /> Lunas
                  </div>
                )}
                {r.transaction?.paymentStatus === 'pending' && !isPaid(r) && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg border border-amber-100 mb-3">
                    <Clock size={13} /> Menunggu Pembayaran
                  </div>
                )}

                {/* Pay button */}
                {canPay(r) && (
                  <button
                    onClick={() => handlePay(r.id)}
                    disabled={paying === r.id}
                    className="w-full md:w-auto mb-3 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {paying === r.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} /> Bayar Sekarang
                      </>
                    )}
                  </button>
                )}

                {r.status === 'checked_out' && (
                  <Link
                    href="/guest/reviews"
                    className="px-5 py-2.5 bg-dark hover:bg-dark-2 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Star size={16} className="text-primary-light" /> Berikan
                    Ulasan Kehadiran
                  </Link>
                )}
                {r.status === 'confirmed' && isPaid(r) && (
                  <div className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100 text-center">
                    Menunggu Kedatangan
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
