"use client";
import { apiFetch } from '@/lib/apiFetch';
import swal from '@/lib/swal';
import { showToast } from '@/lib/toast';
import { Pagination } from '@/components/ui/Pagination';

import { useEffect, useState } from "react";
import { Mail, Search, MailOpen, Phone, Trash2 } from "lucide-react";
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    const res = await apiFetch("/messages").catch(() => null);
    const data = res ? await res.json().catch(() => []) : [];
    setMessages(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateStart, dateEnd]);

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const result = await swal.fire({
      icon: 'warning',
      title: 'Hapus Pesan',
      text: 'Apakah Anda yakin ingin menghapus pesan ini secara permanen?',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    setDeletingId(id);
    const res = await apiFetch(`/messages/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (res.ok) {
      showToast('Pesan berhasil dihapus');
      if (selected?.id === id) setSelected(null);
      fetchMessages();
    } else {
      showToast('Gagal menghapus pesan', 'error');
    }
  };

  const handleRead = async (msg: any) => {
    setSelected(msg);
    if (!msg.isRead) {
      await apiFetch(`/messages/${msg.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isRead: true }) });
      setMessages(msgs => msgs.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
    }
  };

  const filtered = messages.filter(m => {
    let dateMatch = true;
    if (dateStart || dateEnd) {
      const mDate = new Date(m.createdAt).getTime();
      if (dateStart) {
        const start = new Date(dateStart + 'T00:00:00').getTime();
        if (mDate < start) dateMatch = false;
      }
      if (dateEnd) {
        const end = new Date(dateEnd + 'T23:59:59').getTime();
        if (mDate > end) dateMatch = false;
      }
    }

    const searchMatch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.subject.toLowerCase().includes(search.toLowerCase());
    return dateMatch && searchMatch;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedMessages = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="mb-8">
        <h1 className="page-title">Pesan Masuk</h1>
        <p className="page-subtitle">Pertanyaan dan masukan dari pengunjung</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-bar flex-1 m-0">
          <Search size={18} className="text-gray-400 ml-2 shrink-0" />
          <input className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700" placeholder="Cari nama pengirim atau subjek..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <DateRangeFilter
          startDate={dateStart}
          endDate={dateEnd}
          onStartDateChange={setDateStart}
          onEndDateChange={setDateEnd}
          className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Inbox List */}
        <div className="w-full lg:w-1/3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
             <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Mail size={16} /> Kotak Masuk</h3>
             <span className="text-xs text-gray-500">{filtered.length} Pesan</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-20 flex justify-center"><div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-gray-400"><Mail size={32} className="mx-auto mb-3 opacity-20" /><p className="text-sm">Tidak ada pesan</p></div>
            ) : (
              <div className="divide-y divide-gray-100">
                {paginatedMessages.map(m => (
                  <div
                    key={m.id}
                    className={`relative group w-full text-left p-4 hover:bg-gray-50 transition-colors cursor-pointer ${selected?.id === m.id ? "bg-primary/5 border-l-2 border-primary" : "border-l-2 border-transparent"} ${!m.isRead ? "font-semibold text-dark" : "text-gray-600"}`}
                    onClick={() => handleRead(m)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="truncate text-sm flex-1 mr-2">{m.name}</div>
                      <div className="flex items-center gap-1.5">
                        <div className="text-[0.65rem] text-gray-400 whitespace-nowrap">{new Date(m.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</div>
                        {/* Tombol hapus inline di setiap item */}
                        <button
                          title="Hapus pesan"
                          disabled={deletingId === m.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 shrink-0"
                          onClick={(e) => handleDelete(m.id, e)}
                        >
                          {deletingId === m.id
                            ? <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                            : <Trash2 size={14} />
                          }
                        </button>
                      </div>
                    </div>
                    <div className="truncate text-sm mb-1">{m.subject}</div>
                    <div className={`truncate text-xs ${!m.isRead ? "text-gray-600 font-medium" : "text-gray-400"}`}>{m.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Pagination
            page={currentPage}
            limit={itemsPerPage}
            total={filtered.length}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Message View */}
        <div className="w-full lg:w-2/3 bg-white rounded-2xl border border-gray-100 shadow-sm h-[600px] flex flex-col">
          {selected ? (
            <>
              <div className="px-8 py-6 border-b border-gray-100 shrink-0">
                <h2 className="font-serif text-2xl font-bold text-dark mb-4">{selected.subject}</h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-dark/5 text-dark flex items-center justify-center font-bold text-lg">{selected.name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 text-sm mb-0.5">{selected.name}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Mail size={12} /> {selected.email}</span>
                      {selected.phone && <span className="flex items-center gap-1"><Phone size={12} /> {selected.phone}</span>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 text-right">
                    <div>{new Date(selected.createdAt).toLocaleDateString("id-ID")}</div>
                    <div>{new Date(selected.createdAt).toLocaleTimeString("id-ID")}</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm whitespace-pre-wrap text-sm leading-relaxed text-gray-700 font-medium">
                  {selected.message}
                </div>
              </div>
              <div className="px-8 py-4 border-t border-gray-100 shrink-0 flex gap-3 flex-wrap">
                <a href={`mailto:${selected.email}`} className="btn btn-primary btn-md">Balas via Email</a>
                {selected.phone && <a href={`https://wa.me/${selected.phone.replace(/^0/,"62")}`} target="_blank" rel="noreferrer" className="btn btn-success btn-md">Balas via WhatsApp</a>}
                <button
                  className="btn btn-danger btn-md ml-auto flex items-center gap-1.5"
                  disabled={deletingId === selected.id}
                  onClick={() => handleDelete(selected.id)}
                >
                  {deletingId === selected.id
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Trash2 size={16} />
                  }
                  <span>Hapus Pesan</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <MailOpen size={64} className="mb-4 opacity-20" />
              <h3 className="text-lg font-serif">Pilih pesan untuk dibaca</h3>
              <p className="text-sm mt-1">Pilih salah satu pesan dari kotak masuk di samping</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
