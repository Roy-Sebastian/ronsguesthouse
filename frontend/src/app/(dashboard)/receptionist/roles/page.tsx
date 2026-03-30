'use client';


import { ShieldAlert } from 'lucide-react';

export default function ReceptionistRolesPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
          <ShieldAlert size={16} />
          Akses Dibatasi
        </div>
        <h1 className="font-serif text-2xl font-bold">Pengaturan Role Tidak Tersedia</h1>
        <p className="mt-2 text-sm leading-relaxed">
          Halaman ini hanya dapat dikelola oleh Super Admin. Untuk perubahan hak akses,
          gunakan menu <strong>Super Admin - Role &amp; Hak Akses</strong>.
        </p>
      </div>
    </>
  );
}
