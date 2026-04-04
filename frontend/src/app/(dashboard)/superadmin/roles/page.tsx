'use client';


import { defaultRoleMatrix, permissionsGroups } from '@/lib/rbac';
import { Check, Save, ShieldCheck, RotateCcw } from 'lucide-react';
import { Fragment, useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const roles = [
  {
    key: 'superadmin',
    label: 'Super Admin',
    color: 'text-red-600 bg-red-50 border-red-100',
  },
  {
    key: 'admin',
    label: 'Admin',
    color: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  {
    key: 'receptionist',
    label: 'Resepsionis',
    color: 'text-green-600 bg-green-50 border-green-100',
  },
  {
    key: 'guest',
    label: 'Tamu',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
  },
];

const defaultMatrix: Record<string, Record<string, boolean>> = defaultRoleMatrix;

export default function SuperadminRolesPage() {
  const [matrix, setMatrix] = useState(defaultMatrix);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/roles')
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setMatrix(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (role: string, perm: string) => {
    if (role === 'superadmin') return; // superadmin always has all
    setMatrix((m) => ({
      ...m,
      [role]: { ...m[role], [perm]: !m[role][perm] },
    }));
  };

  const toggleGroup = (role: string, perms: string[]) => {
    if (role === 'superadmin') return;
    const allOn = perms.every((p) => matrix[role][p]);
    setMatrix((m) => ({
      ...m,
      [role]: {
        ...m[role],
        ...Object.fromEntries(perms.map((p) => [p, !allOn])),
      },
    }));
  };

  const handleReset = () => {
    Swal.fire({
      title: 'Reset Hak Akses?',
      text: 'Semua hak akses akan dikembalikan ke settingan bawaan. Perubahan akan langsung disimpan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Reset',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setMatrix(defaultMatrix);
        setSaving(true);
        try {
          const res = await fetch('/api/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(defaultMatrix)
          });
          if (!res.ok) throw new Error('Failed to save');
          Swal.fire('Ter-reset!', 'Konfigurasi telah dikembalikan ke default.', 'success');
        } catch (err) {
          Swal.fire('Gagal!', 'Gagal mereset matrix roles.', 'error');
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matrix)
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
      Swal.fire({ title: 'Berhasil!', text: 'Hak akses berhasil disimpan', icon: 'success', timer: 2000, showConfirmButton: false });
        setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      Swal.fire('Error!', 'Gagal menyimpan matrix roles.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            Role & Hak Akses
          </h1>
          <p className="page-subtitle">
            Konfigurasi hak akses untuk setiap peran pengguna
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-all inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <RotateCcw size={16} /> Reset Default
          </button>
          <button
            onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all inline-flex items-center gap-2 shadow-sm disabled:opacity-60 ${saved ? 'bg-green-500 text-white' : 'bg-primary hover:bg-primary-hover text-white'}`}
        >
          {saved ? (
            <>
              <Check size={16} /> Tersimpan
            </>
          ) : saving ? (
            'Menyimpan...'
          ) : (
            <>
              <Save size={16} /> Simpan Perubahan
            </>
          )}
        </button>
        </div>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {roles.map((r) => (
          <div
            key={r.key}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${r.color}`}
          >
            {r.label}
          </div>
        ))}
      </div>

      <div className="card table-wrapper">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="px-6 py-4 bg-gray-50/60 text-left text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100 min-w-55">
                Hak Akses
              </th>
              {roles.map((r) => (
                <th
                  key={r.key}
                  className="px-5 py-4 bg-gray-50/60 text-center text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100 min-w-30"
                >
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionsGroups.map(({ group, permissions }) => (
              <Fragment key={group}>
                {/* Group header */}
                <tr key={`group-${group}`} className="bg-gray-50/40">
                  <td
                    className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest"
                    colSpan={1}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={13} className="text-primary" />
                      {group}
                    </div>
                  </td>
                  {roles.map((r) => {
                    const perms = permissions.map((p) => p.key);
                    const allOn = perms.every((p) => matrix[r.key][p]);
                    return (
                      <td key={r.key} className="px-5 py-3 text-center">
                        <button
                          onClick={() => toggleGroup(r.key, perms)}
                          disabled={r.key === 'superadmin'}
                          title={allOn ? 'Nonaktifkan semua' : 'Aktifkan semua'}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition-all ${r.key === 'superadmin' ? 'cursor-not-allowed' : 'cursor-pointer'} ${allOn ? 'bg-primary border-primary' : 'bg-white border-gray-200 hover:border-primary/50'}`}
                        >
                          {allOn && <Check size={11} className="text-white" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
                {/* Permission rows */}
                {permissions.map(({ key, label }) => (
                  <tr
                    key={key}
                    className="hover:bg-gray-50/60 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <td className="px-6 py-3.5 text-gray-600 pl-10">{label}</td>
                    {roles.map((r) => (
                      <td key={r.key} className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => toggle(r.key, key)}
                          disabled={r.key === 'superadmin'}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition-all ${r.key === 'superadmin' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${matrix[r.key][key] ? 'bg-primary border-primary' : 'bg-white border-gray-200 hover:border-primary/50'}`}
                        >
                          {matrix[r.key][key] && (
                            <Check size={11} className="text-white" />
                          )}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        * Super Admin selalu memiliki semua hak akses dan tidak dapat
        dimodifikasi. Perubahan hak akses akan efektif setelah pengguna login
        ulang.
      </p>
    </>
  );
}
