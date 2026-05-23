'use client';
import { apiFetch } from '@/lib/apiFetch';
import { showToast } from '@/lib/toast';
import { permissionsGroups } from '@/lib/rbac';
import { TableActions } from '@/components/ui/TableActions';

import {
  Eye,
  EyeOff,
  Plus,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
import swal from '@/lib/swal';
import { Pagination } from '@/components/ui/Pagination';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
}

const roleBadge: Record<string, string> = {
  superadmin: 'bg-purple-50 text-purple-700',
  admin: 'bg-amber-50 text-amber-700',
  receptionist: 'bg-blue-50 text-blue-700',
};

const roleLabel: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  receptionist: 'Resepsionis',
};

export default function SuperadminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'receptionist',
    phone: '',
    permissions: [] as string[],
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/users${search ? `?search=${search}` : ''}`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const { sortedData, handleSort, sortBy, sortOrder } = useTableSort(users);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiFetch(`/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchUsers();
    } catch {
      await swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal merubah status pengguna' });
    }
  };

  const handleDelete = async (id: string, role: string) => {
    if (role === 'superadmin') {
      await swal.fire({ icon: 'info', title: 'Info', text: 'Tidak dapat menghapus superadmin!' });
      return;
    }
    const result = await swal.fire({
      icon: 'warning',
      title: 'Konfirmasi',
      text: 'Yakin ingin menghapus pengguna ini?',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch {
      await swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus' });
    }
  };

  const togglePermission = (permId: string) => {
    setForm((prev) => {
      const perms = prev.permissions || [];
      if (perms.includes(permId)) {
        return { ...prev, permissions: perms.filter((p) => p !== permId) };
      } else {
        return { ...prev, permissions: [...perms, permId] };
      }
    });
  };

  const openCreate = () => {
    setEditId(null);
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'receptionist',
      phone: '',
      permissions: ['reservation.view', 'reservation.create', 'guest.view'],
    });
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setShowModal(true);
  };

  const openEdit = async (user: User) => {
    if (user.role === 'superadmin') {
      await swal.fire({ icon: 'info', title: 'Info', text: 'Superadmin access bypasses granular permissions, manage directly via config.' });
      return;
    }
    setEditId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: '', // blank on edit
      role: user.role,
      phone: user.phone || '',
      permissions: user.permissions || [],
    });
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Client-side confirm password validation (only for create or when password is being changed)
    if (!editId && form.password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      setSaving(false);
      return;
    }
    if (editId && form.password && form.password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      setSaving(false);
      return;
    }

    try {
      let res;
      if (editId) {
        // Update
        const payload = {
          name: form.name,
          role: form.role,
          phone: form.phone,
          permissions: form.permissions,
          ...(form.password ? { password: form.password } : {}),
        };
        res = await apiFetch(`/users/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create via admin user endpoint (goes through requirePermission('user.create'))
        res = await apiFetch('/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            phone: form.phone,
            permissions: form.permissions,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');

      setShowModal(false);
      showToast(editId ? 'Pengguna berhasil diperbarui' : 'Pengguna berhasil ditambahkan');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            Manajemen Pengguna
          </h1>
          <p className="page-subtitle">
            Kelola staf, hak akses (RBAC), dan status akun
          </p>
        </div>
        <button
          className="btn btn-primary btn-md"
          onClick={openCreate}
        >
          <Plus size={16} /> <span>Tambah Pengguna</span></button>
      </div>

      <div className="search-bar flex-1">
        <Search size={18} className="text-gray-400 ml-2 shrink-0" />
        <input
          className="w-full text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700"
          placeholder="Cari nama, email, role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card table-wrapper">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr>
              <SortableHeader
                label="Pengguna"
                field="name"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Role"
                field="role"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Status"
                field="isActive"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <SortableHeader
                label="Hak Akses"
                field="permissions"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <th>
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="w-8 h-8 mx-auto border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-20" />
                  <div className="text-sm">Tidak ada data pengguna</div>
                </td>
              </tr>
            ) : (
              paginatedData.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-red-50/20 transition-colors border-b border-gray-100 last:border-0 relative"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-dark text-sm">
                      {u.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {u.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold ${roleBadge[u.role] || roleBadge.guest}`}
                    >
                      {roleLabel[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(u.id, u.isActive)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                        u.isActive
                           ? 'text-green-700 bg-green-50 hover:bg-green-100'
                           : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                      }`}
                      disabled={u.role === 'superadmin'}
                    >
                      {u.isActive ? (
                        <ToggleRight size={16} />
                      ) : (
                        <ToggleLeft size={16} />
                      )}
                      {u.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {u.role === 'superadmin' ? (
                      <span className="text-xs text-gray-400 italic">
                        All Permissions
                      </span>
                    ) : (
                      <div className="flex gap-1 flex-wrap max-w-50">
                        {u.permissions?.slice(0, 2).map((p) => (
                          <span
                            key={p}
                            className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded shadow-sm border border-blue-100"
                          >
                            {p}
                          </span>
                        ))}
                        {(u.permissions?.length || 0) > 2 && (
                          <span className="text-[10px] text-gray-400">
                            +{u.permissions.length - 2}
                          </span>
                        )}
                        {(!u.permissions || u.permissions.length === 0) && (
                          <span className="text-xs text-gray-400">
                            Tidak ada permission kustom
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <TableActions
                        viewPermission="user.view"
                        editPermission="user.edit"
                        deletePermission="user.delete"
                        onEdit={u.role === 'superadmin' ? undefined : () => openEdit(u)}
                        onDelete={u.role === 'superadmin' ? undefined : () => handleDelete(u.id, u.role)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <Pagination page={currentPage} limit={itemsPerPage} total={sortedData.length} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative z-10 animate-slideUp max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="font-serif text-xl font-bold text-dark">
                {editId ? 'Atur Hak Akses & Profil' : 'Tambah Pengguna Baru'}
              </h2>
              <button
                className="text-gray-400 hover:bg-gray-100 rounded-lg p-1 transition-colors"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            {error && (
              <div className="px-6 py-3 bg-red-50 text-red-600 text-sm border-b border-red-100 shrink-0 font-medium">
                {error}
              </div>
            )}

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">

              <form id="userForm" onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nama Lengkap*
                    </label>
                    <input
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nomor HP
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>
                  {!editId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email*
                      </label>
                      <input
                        required
                        type="email"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {editId ? 'Ubah Password (opsional)' : 'Password*'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editId}
                        className="w-full px-3.5 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm"
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {(!editId || form.password) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Konfirmasi Password*
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required={!editId || !!form.password}
                          className={`w-full px-3.5 py-2.5 pr-10 border rounded-lg text-sm ${
                            confirmPassword && form.password !== confirmPassword
                              ? 'border-red-400 bg-red-50'
                              : 'border-gray-300'
                          }`}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmPassword && form.password !== confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
                      )}
                    </div>
                  )}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Role Pengguna*
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                    >
                      <option value="admin">Admin (Gudang/Laporan)</option>
                      <option value="receptionist">
                        Resepsionis (Front Desk)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">
                    Role-Based Access Control (RBAC)
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Centang modul yang dapat diakses oleh karyawan ini di
                    dashboard mereka.
                  </p>

                  <div className="space-y-4">
                    {permissionsGroups.map((grp) => (
                      <div key={grp.group}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          {grp.group}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {grp.permissions.map((perm) => (
                            <label
                              key={perm.key}
                              className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={form.permissions.includes(perm.key)}
                                onChange={() => togglePermission(perm.key)}
                                className="mt-0.5 accent-primary h-4 w-4 rounded"
                              />
                              <div className="text-sm font-medium text-gray-800">
                                {perm.label}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50/50">
              <button
                type="button"
                className="btn btn-outline btn-md"
                onClick={() => setShowModal(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                form="userForm"
                className="btn btn-primary btn-md"
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Simpan Pengguna'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
