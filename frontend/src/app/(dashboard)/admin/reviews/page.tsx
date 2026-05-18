"use client";

import { apiFetch } from '@/lib/apiFetch';
import { showToast } from '@/lib/toast';
import { useEffect, useState } from "react";
import { Star, CheckCircle, XCircle, Trash2, Clock, Hash, User } from "lucide-react";
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import swal from '@/lib/swal';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

interface Review {
  id: string;
  rating: number;
  displayName?: string | null;
  comment?: string | null;
  status: ReviewStatus;
  createdAt: string;
  guest?: { fullName: string };
  reservation?: { bookingCode: string };
}

const STATUS_CONFIG: Record<ReviewStatus, { label: string; badge: string }> = {
  pending:  { label: 'Menunggu',  badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  approved: { label: 'Disetujui', badge: 'bg-green-50 text-green-700 border border-green-200' },
  rejected: { label: 'Ditolak',   badge: 'bg-red-50 text-red-700 border border-red-200' },
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewStatus>('pending');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [counts, setCounts] = useState<Record<ReviewStatus, number>>({ pending: 0, approved: 0, rejected: 0 });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Fetch current filter
      let url = `/reviews?status=${filter}`;
      if (dateStart) url += `&startDate=${dateStart}`;
      if (dateEnd)   url += `&endDate=${dateEnd}`;
      const res  = await apiFetch(url);
      const data = res.ok ? await res.json() : [];
      setReviews(Array.isArray(data) ? data : []);

      // Fetch counts for all statuses (only on initial + filter change, not date change)
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        apiFetch('/reviews?status=pending'),
        apiFetch('/reviews?status=approved'),
        apiFetch('/reviews?status=rejected'),
      ]);
      const [p, a, r] = await Promise.all([
        pendingRes.ok  ? pendingRes.json()  : [],
        approvedRes.ok ? approvedRes.json() : [],
        rejectedRes.ok ? rejectedRes.json() : [],
      ]);
      setCounts({
        pending:  Array.isArray(p) ? p.length : 0,
        approved: Array.isArray(a) ? a.length : 0,
        rejected: Array.isArray(r) ? r.length : 0,
      });
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [filter, dateStart, dateEnd]);

  const updateStatus = async (id: string, status: ReviewStatus) => {
    const label = status === 'approved' ? 'menyetujui' : 'menolak';
    const result = await swal.fire({
      icon: 'warning',
      title: 'Konfirmasi',
      text: `Yakin ingin ${label} ulasan ini?`,
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;

    const res = await apiFetch(`/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast(status === 'approved' ? 'Ulasan berhasil disetujui ✅' : 'Ulasan berhasil ditolak');
      fetchReviews();
    } else {
      showToast('Gagal memperbarui status ulasan', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await swal.fire({
      icon: 'warning',
      title: 'Hapus Ulasan',
      text: 'Ulasan yang dihapus tidak dapat dikembalikan.',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    const res = await apiFetch(`/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Ulasan berhasil dihapus');
      fetchReviews();
    } else {
      showToast('Gagal menghapus ulasan', 'error');
    }
  };

  const tabs: { id: ReviewStatus; label: string; icon: typeof Clock }[] = [
    { id: 'pending',  label: 'Menunggu',        icon: Clock },
    { id: 'approved', label: 'Disetujui',        icon: CheckCircle },
    { id: 'rejected', label: 'Ditolak',          icon: XCircle },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Moderasi Ulasan</h1>
          <p className="page-subtitle">Tinjau dan kelola ulasan dari tamu penginapan</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 -mb-px ${
              filter === id
                ? 'border-primary text-dark bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-t-lg'
            }`}
          >
            <Icon size={15} className={filter === id ? 'text-primary' : 'opacity-40'} />
            {label}
            {counts[id] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                id === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : id === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {counts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Date filter */}
      <div className="mb-6 flex justify-end">
        <DateRangeFilter
          startDate={dateStart}
          endDate={dateEnd}
          onStartDateChange={setDateStart}
          onEndDateChange={setDateEnd}
          className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
        />
      </div>

      {/* Review cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
            <Star size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-base font-medium">Tidak ada ulasan {STATUS_CONFIG[filter].label.toLowerCase()}</h3>
          </div>
        ) : (
          reviews.map((r) => {
            const displayName = r.displayName || r.guest?.fullName || 'Tamu Anonim';
            const bookingCode = r.reservation?.bookingCode;
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Header row */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    {/* Display name */}
                    <div className="flex items-center gap-1.5 font-semibold text-dark text-sm truncate">
                      <User size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{displayName}</span>
                    </div>
                    {/* Guest fullName (from DB relation) if different */}
                    {r.guest?.fullName && r.guest.fullName !== displayName && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate pl-4">
                        Tamu: {r.guest.fullName}
                      </div>
                    )}
                    {/* Booking code */}
                    {bookingCode && (
                      <div className="flex items-center gap-1 mt-1">
                        <Hash size={11} className="text-gray-300 flex-shrink-0" />
                        <span className="text-xs font-mono text-gray-400">{bookingCode}</span>
                      </div>
                    )}
                  </div>
                  {/* Star rating */}
                  <div className="flex gap-0.5 text-yellow-400 flex-shrink-0 ml-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} fill={i < r.rating ? 'currentColor' : 'none'} color="currentColor" className={i >= r.rating ? 'opacity-25' : ''} />
                    ))}
                  </div>
                </div>

                {/* Status badge */}
                <span className={`self-start text-xs px-2 py-0.5 rounded-full font-medium mb-3 ${STATUS_CONFIG[r.status].badge}`}>
                  {STATUS_CONFIG[r.status].label}
                </span>

                {/* Comment */}
                <p className="text-gray-600 text-sm leading-relaxed mb-2 flex-1 italic">
                  {r.comment ? `"${r.comment}"` : <span className="not-italic text-gray-300">— tidak ada komentar —</span>}
                </p>

                {/* Date */}
                <div className="text-xs text-gray-300 mb-4">
                  {new Date(r.createdAt).toLocaleString('id-ID')}
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                  {r.status !== 'approved' && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => updateStatus(r.id, 'approved')}
                    >
                      <CheckCircle size={14} /> Setujui
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => updateStatus(r.id, 'rejected')}
                    >
                      <XCircle size={14} /> Tolak
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-icon text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(r.id)}
                    title="Hapus ulasan"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
