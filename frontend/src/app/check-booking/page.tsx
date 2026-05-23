'use client';

import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { BACKEND_URL, formatRoomType } from '@/lib/constants';
import { Search, Loader2, Star, CheckCircle, Clock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

// ─── Component ───────────────────────────────────────────────────────────────

function CheckBookingContent() {
  // ── Hooks ──────────────────────────────────────────────────────────────────
  const searchParams = useSearchParams();
  const initialCode = (searchParams.get('code') || '').toUpperCase();

  const [bookingCode, setBookingCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  // ── Handlers & Helpers ─────────────────────────────────────────────────────

  const runCheck = useCallback(async (code: string) => {
    if (!code) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/public/check-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingCode: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to check booking');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialCode) runCheck(initialCode);
  }, [initialCode, runCheck]);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    runCheck(bookingCode);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'settlement':
      case 'capture':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium uppercase">PAID</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium uppercase">PENDING PAYMENT</span>;
      case 'expire':
      case 'cancel':
      case 'deny':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium uppercase">EXPIRED / CANCELLED</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium uppercase">{status}</span>;
    }
  };

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-800">
      <PublicNavbar />

      {/* Hero Header */}
      <section className="bg-white text-gray-900 pt-32 pb-20 px-4 border-b border-gray-100">
        <ScrollReveal>
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif mb-4">Check Booking</h1>
            <div className="w-16 h-0.5 bg-red-800 mx-auto mb-6" />
            <p className="text-gray-600 font-light max-w-2xl mx-auto">
              Enter your booking code to track your reservation status.
            </p>
          </div>
        </ScrollReveal>
      </section>

      <main className="flex-grow py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-8 md:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-neutral-200/50 mb-10">
            <form onSubmit={handleCheck} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-widest uppercase text-neutral-500">Booking Code</label>
                <input
                  type="text"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                  placeholder="RONS-XXXXXXXX"
                  required
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-800 focus:border-red-800 transition-all outline-none uppercase"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50/50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !bookingCode}
                className="w-full flex items-center justify-center gap-2 px-8 py-3.5 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-medium tracking-wide transition-all shadow-lg shadow-red-900/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                TRACK BOOKING
              </button>
            </form>
          </div>

          {result && (
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-neutral-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="border-b border-neutral-100 bg-neutral-50/50 px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-500 mb-1">Payment Status</h3>
                  <div>{getStatusBadge(result.transaction?.paymentStatus || 'unknown')}</div>
                </div>
                <div className="text-left sm:text-right">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-500 mb-1">Booking Code</h3>
                  <p className="font-mono text-lg font-bold text-neutral-900">{result.bookingCode}</p>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold tracking-widest uppercase text-neutral-900 border-b border-neutral-100 pb-2">Guest Details</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Name</span>
                        <span className="font-medium">{result.guest.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Email</span>
                        <span className="font-medium">{result.guest.email || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Phone No.</span>
                        <span className="font-medium">{result.guest.phone || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold tracking-widest uppercase text-neutral-900 border-b border-neutral-100 pb-2">Stay Details</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Room</span>
                        <span className="font-medium">{formatRoomType(result.room.roomType)} - {result.room.roomNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Check-In</span>
                        <span className="font-medium">{new Date(result.checkInDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Check-Out</span>
                        <span className="font-medium">{new Date(result.checkOutDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t border-neutral-100">
                        <span className="text-neutral-900">Total Amount</span>
                        <span className="text-red-800">Rp {Number(result.totalPrice).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review CTA — only for checked_out reservations */}
          {result && result.status === 'checked_out' && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!result.hasReview ? (
                // Guest hasn't reviewed yet → show CTA
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-neutral-200/50 p-6 text-center">
                  <Star className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">Bagaimana pengalaman Anda?</h3>
                  <p className="text-sm text-neutral-500 mb-4">Bagikan ulasan untuk membantu kami meningkatkan layanan</p>
                  <a
                    href={`/review?code=${encodeURIComponent(result.bookingCode)}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-800 hover:bg-red-900 text-white rounded-xl font-medium tracking-wide transition-all shadow-lg shadow-red-900/20 text-sm"
                  >
                    <Star className="w-4 h-4" /> Tulis Ulasan
                  </a>
                </div>
              ) : result.reviewStatus === 'pending' ? (
                // Review submitted but awaiting moderation
                <div className="bg-amber-50 rounded-2xl ring-1 ring-amber-200 p-6 text-center">
                  <Clock className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-amber-800 mb-1">Ulasan Sedang Ditinjau</h3>
                  <p className="text-sm text-amber-600">Ulasan kamu sedang menunggu persetujuan admin sebelum ditampilkan.</p>
                </div>
              ) : result.reviewStatus === 'approved' ? (
                // Review approved and live
                <div className="bg-green-50 rounded-2xl ring-1 ring-green-200 p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-green-800 mb-1">Ulasan Sudah Tampil</h3>
                  <p className="text-sm text-green-600">Terima kasih! Ulasan kamu sudah tampil di halaman utama kami.</p>
                </div>
              ) : (
                // Review rejected
                <div className="bg-neutral-100 rounded-2xl ring-1 ring-neutral-200 p-6 text-center">
                  <Star className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-neutral-700 mb-1">Ulasan Tidak Dapat Ditampilkan</h3>
                  <p className="text-sm text-neutral-500">Ulasan kamu tidak memenuhi pedoman kami dan tidak dapat dipublikasikan.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

export default function CheckBookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CheckBookingContent />
    </Suspense>
  );
}
