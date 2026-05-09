"use client";
import { apiFetch } from '@/lib/apiFetch';

import { useEffect, useState } from "react";
import { Star, CheckCircle, XCircle, Trash2, Clock } from "lucide-react";
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import swal from '@/lib/swal';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const fetchReviews = async () => {
    setLoading(true);
    let url = `/api/reviews?status=${filter}`;
    if (dateStart) url += `&startDate=${dateStart}`;
    if (dateEnd) url += `&endDate=${dateEnd}`;
    const data = await fetch(url).then(r => r.json()).catch(() => []);
    setReviews(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [filter, dateStart, dateEnd]);

  const updateStatus = async (id: string, status: string) => {
    const result = await swal.fire({
      icon: 'warning',
      title: 'Konfirmasi',
      text: `Tandai ulasan sebagai ${status}?`,
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    await apiFetch(`/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchReviews();
  };

  const handleDelete = async (id: string) => {
    const result = await swal.fire({
      icon: 'warning',
      title: 'Konfirmasi',
      text: 'Hapus ulasan ini permanen?',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    await apiFetch(`/reviews/${id}`, { method: "DELETE" });
    fetchReviews();
  };

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Moderasi Ulasan</h1>
          <p className="page-subtitle">Tinjau ulasan dari tamu penginapan</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { id: "pending", label: "Menunggu Moderasi", icon: Clock },
          { id: "approved", label: "Disetujui (Tampil Publik)", icon: CheckCircle },
          { id: "rejected", label: "Ditolak", icon: XCircle }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 -mb-px ${filter === id ? "border-primary text-dark bg-white rounded-t-lg" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-t-lg"}`}
          >
            <Icon size={16} className={filter === id ? "text-primary" : "opacity-50"} /> {label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex justify-end">
        <DateRangeFilter
          startDate={dateStart}
          endDate={dateEnd}
          onStartDateChange={setDateStart}
          onEndDateChange={setDateEnd}
          className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center"><div className="w-8 h-8 mx-auto border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : reviews.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border border-gray-100"><Star size={48} className="mx-auto mb-4 opacity-20" /><h3 className="text-base font-medium">Tidak ada ulasan {filter}</h3></div>
        ) : (
          reviews.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-semibold text-dark text-sm">{r.guest?.fullName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{new Date(r.createdAt).toLocaleString("id-ID")}</div>
                </div>
                <div className="flex gap-0.5 text-primary-light">{Array.from({length: 5}).map((_, i) => <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} color="currentColor" className={i >= r.rating ? "opacity-30" : ""} />)}</div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1 italic">"{r.comment}"</p>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                {filter === "pending" && (
                  <>
                    <button className="btn btn-success btn-sm" onClick={() => updateStatus(r.id, "approved")}><CheckCircle size={14} /> Setujui</button>
                    <button className="btn btn-danger btn-sm" onClick={() => updateStatus(r.id, "rejected")}><XCircle size={14} /> Tolak</button>
                  </>
                )}
                <button className="btn btn-ghost btn-icon text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(r.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
