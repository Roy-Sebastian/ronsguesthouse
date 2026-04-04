'use client';

import PublicFooter from '@/components/layout/PublicFooter';
import PublicNavbar from '@/components/layout/PublicNavbar';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { CheckCircle, Send, Star } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// ─── Inner Component ─────────────────────────────────────────────────────────

function ReviewFormContent() {
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    bookingCode: searchParams.get('code') || '',
    email: searchParams.get('email') || '',
    rating: 5,
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/public/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim ulasan');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-gray-900 font-sans selection:bg-red-900 selection:text-white">
      <PublicNavbar />

      {/* Hero Header */}
      <section className="bg-white text-gray-900 pt-32 pb-20 px-4 border-b border-gray-100">
        <ScrollReveal>
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif mb-4">Tulis Ulasan</h1>
            <div className="w-16 h-0.5 bg-red-800 mx-auto mb-6" />
            <p className="text-gray-600 font-light max-w-2xl mx-auto">
              Bagikan pengalaman menginap Anda. Masukan Anda sangat berharga untuk peningkatan pelayanan kami.
            </p>
          </div>
        </ScrollReveal>
      </section>

      <section className="py-16 px-4 max-w-2xl mx-auto">
        {success ? (
          <ScrollReveal>
            <div className="bg-white border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-serif mb-4 text-gray-900">Terima Kasih!</h2>
              <p className="text-gray-500 font-light max-w-md mx-auto mb-6">
                Ulasan Anda berhasil dikirim dan akan ditinjau oleh tim kami terlebih dahulu sebelum ditampilkan di halaman utama.
              </p>
              <button
                onClick={() => {
                  setSuccess(false);
                  setForm({ bookingCode: '', email: '', rating: 5, comment: '' });
                }}
                className="inline-block bg-black hover:bg-gray-800 text-white px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors"
              >
                Tulis Ulasan Lainnya
              </button>
            </div>
          </ScrollReveal>
        ) : (
          <ScrollReveal>
            <div className="bg-white border border-gray-100 shadow-sm p-8 md:p-12">
              <h3 className="text-2xl font-serif mb-8 text-gray-900 border-b border-gray-100 pb-4">
                Formulir Ulasan
              </h3>

              {error && (
                <div className="mb-8 bg-red-50 text-red-900 border border-red-200 p-4 text-sm font-light">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Booking Code & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">
                      Kode Booking *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.bookingCode}
                      onChange={(e) => setForm({ ...form, bookingCode: e.target.value.toUpperCase() })}
                      className="w-full border-b border-gray-300 py-2 bg-transparent focus:outline-none focus:border-red-800 transition-colors font-light text-gray-900 placeholder-gray-300 uppercase"
                      placeholder="RONS-XXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border-b border-gray-300 py-2 bg-transparent focus:outline-none focus:border-red-800 transition-colors font-light text-gray-900 placeholder-gray-300"
                      placeholder="nama@email.com"
                    />
                  </div>
                </div>

                {/* Star Rating */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-4 font-bold text-center">
                    Rating Anda *
                  </label>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-3 justify-center">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setForm({ ...form, rating: n })}
                          className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
                            form.rating >= n
                              ? 'border-yellow-400 bg-yellow-50 text-yellow-500 scale-110 shadow-sm'
                              : 'border-gray-200 text-gray-300 hover:border-gray-300 hover:bg-gray-50 bg-white'
                          }`}
                        >
                          <Star
                            className="w-6 h-6"
                            fill={form.rating >= n ? 'currentColor' : 'none'}
                            strokeWidth={form.rating >= n ? 2 : 1.5}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="font-medium text-sm py-1.5 px-4 rounded-full bg-gray-100 text-gray-700">
                      {
                        ['', 'Sangat Buruk 😞', 'Kurang Memuaskan 😕', 'Cukup Baik 😐', 'Memuaskan 🙂', 'Luar Biasa! 😍'][form.rating]
                      }
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">
                    Ceritakan Pengalaman Anda *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    className="w-full border-b border-gray-300 py-2 bg-transparent focus:outline-none focus:border-red-800 transition-colors font-light text-gray-900 placeholder-gray-300 resize-none"
                    placeholder="Apa yang Anda suka? Kebersihan, fasilitas, staf, lokasi..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center px-8 py-4 bg-red-800 hover:bg-black text-white text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Ulasan'} <Send className="w-4 h-4 ml-2" />
                </button>
              </form>
            </div>
          </ScrollReveal>
        )}
      </section>

      <PublicFooter />
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function PublicReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center">Loading...</div>}>
      <ReviewFormContent />
    </Suspense>
  );
}
