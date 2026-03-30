'use client';

import { CheckCircle, Send, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function GuestReviewPage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [form, setForm] = useState({ guestId: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/guests')
      .then((r) => r.json())
      .then((d) => setGuests(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim ulasan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-8 text-center max-w-2xl mx-auto pt-8">
        <h1 className="font-serif text-4xl font-bold text-dark mb-3">
          Tulis Ulasan Bintangmu
        </h1>
        <p className="text-gray-500 leading-relaxed">
          Bagikan pengalaman menginap Anda bersama kami. Masukan pelanggan
          selalu kami hargai untuk peningkatan pelayanan selanjutnya.
        </p>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 max-w-2xl mx-auto">
        <div className="h-2 bg-linear-to-r from-dark via-dark-2 to-primary"></div>

        {success ? (
          <div className="text-center py-20 px-6">
            <CheckCircle size={72} className="text-green-500 mx-auto mb-6" />
            <h3 className="font-serif text-3xl font-bold text-dark mb-3">
              Terima Kasih!
            </h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Ulasan Anda berhasil dikirim dan akan kami moderasi terlebih
              dahulu sebelum tampil di halaman utama.
            </p>
            <button
              className="px-6 py-3 bg-dark hover:bg-dark-2 text-white text-sm font-semibold rounded-lg transition-colors border-0"
              onClick={() => {
                setSuccess(false);
                setForm({ guestId: '', rating: 5, comment: '' });
              }}
            >
              Isi Ulasan Kembali
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-8 sm:p-12 flex flex-col gap-8"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                Pilih Profil Tamu Anda <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                value={form.guestId}
                onChange={(e) => setForm({ ...form, guestId: e.target.value })}
                required
              >
                <option value="">-- Pilih Nama --</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.fullName} ({g.idNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide text-center">
                Berapa Nilai Kepuasan Anda?{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm({ ...form, rating: n })}
                      className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${form.rating >= n ? 'border-primary bg-primary/10 text-primary scale-110 shadow-sm' : 'border-gray-200 text-gray-300 hover:border-gray-300 hover:bg-gray-50 bg-white'}`}
                    >
                      <Star
                        size={28}
                        fill={form.rating >= n ? 'currentColor' : 'none'}
                        strokeWidth={form.rating >= n ? 2 : 1.5}
                      />
                    </button>
                  ))}
                </div>
                <span className="font-semibold text-base py-1.5 px-4 rounded-full bg-gray-100 text-dark">
                  {
                    [
                      '',
                      'Sangat Buruk 😞',
                      'Kurang Memuaskan 😕',
                      'Cukup Baik 😐',
                      'Memuaskan 🙂',
                      'Sangat Amat Baik! 😍',
                    ][form.rating]
                  }
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                Ceritakan Pengalamanmu <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all resize-y"
                rows={5}
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                required
                placeholder="Apa yang Anda suka? Apa yang perlu ditingkatkan? Kebersihan kamar, fasilitas, dan staf layanan kami..."
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />{' '}
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-dark hover:bg-dark-2 text-white font-bold text-base rounded-xl transition-colors disabled:opacity-50 mt-2 shadow-lg shadow-dark/20 flex justify-center items-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={20} /> Kirim Testimoni
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
