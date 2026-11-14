'use client';

import { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '@/components/ui';
import { usePermissions } from '@/lib/permissions';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';

interface KelurahanRef {
    id: string;
    nama: string;
    kodeKemendagri?: string;
    kecamatan?: {
        nama: string;
    };
}

interface KecamatanRef {
    id: string;
    nama: string;
    kelurahan: KelurahanRef[];
}

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    kelurahanId?: string | null;
    kelurahan?: {
        id: string;
        nama: string;
        kecamatan?: {
            nama: string;
        };
    } | null;
    createdAt: string;
}

const ROLE_OPTIONS = [
    { value: 'SUPERADMIN', label: 'Super Admin (Akses Penuh - Nisa)', group: 'DLHK' },
    { value: 'ADMIN', label: 'Admin DLHK', group: 'DLHK' },
    { value: 'OPERATOR', label: 'Operator Transdepo', group: 'DLHK' },
    { value: 'VIEWER', label: 'Viewer / Tamu (Hanya Lihat)', group: 'DLHK' },
    { value: 'GATEKEEPER', label: 'Petugas TPA / Gatekeeper', group: 'DLHK' },
    { value: 'LPS_KETUA', label: 'Ketua LPS (Kelurahan)', group: 'LPS' },
    { value: 'LPS_SEKRETARIS', label: 'Sekretaris LPS (Kelurahan)', group: 'LPS' },
    { value: 'LPS_BENDAHARA', label: 'Bendahara LPS (Kelurahan)', group: 'LPS' },
];

export default function UsersPage() {
    const { isSuperAdmin } = usePermissions();
    const [users, setUsers] = useState<User[]>([]);
    const [kecamatanList, setKecamatanList] = useState<KecamatanRef[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'OPERATOR',
        kelurahanId: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchWilayah();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWilayah = async () => {
        try {
            const res = await fetch('/api/wilayah');
            const data = await res.json();
            if (Array.isArray(data)) {
                setKecamatanList(data);
            }
        } catch (error) {
            console.error('Error fetching wilayah:', error);
        }
    };

    const isLpsRole = (role: string) => {
        return ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'].includes(role);
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({
            email: '',
            password: '',
            name: '',
            role: 'OPERATOR',
            kelurahanId: '',
        });
        setShowModal(true);
        setMessage(null);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '',
            name: user.name,
            role: user.role,
            kelurahanId: user.kelurahanId || user.kelurahan?.id || '',
        });
        setShowModal(true);
        setMessage(null);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormData({
            email: '',
            password: '',
            name: '',
            role: 'OPERATOR',
            kelurahanId: '',
        });
        setMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        if (isLpsRole(formData.role) && !formData.kelurahanId) {
            setMessage({ type: 'error', text: 'Silakan pilih Kelurahan untuk akun pengurus LPS' });
            setSubmitting(false);
            return;
        }

        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
            const method = editingUser ? 'PUT' : 'POST';

            const payload = {
                email: formData.email,
                name: formData.name,
                role: formData.role,
                kelurahanId: isLpsRole(formData.role) ? formData.kelurahanId : null,
                ...(formData.password ? { password: formData.password } : {}),
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'Terjadi kesalahan' });
            } else {
                setMessage({
                    type: 'success',
                    text: editingUser ? 'Data user berhasil diperbarui' : 'User baru berhasil dibuat',
                });
                await fetchUsers();
                setTimeout(() => {
                    closeModal();
                }, 800);
            }
        } catch (error) {
            console.error('Error submitting:', error);
            setMessage({ type: 'error', text: 'Terjadi kesalahan pada server' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Hapus user "${user.name}" (${user.email})?`)) return;

        try {
            const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });

            if (res.ok) {
                fetchUsers();
            } else {
                alert('Gagal menghapus user');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Terjadi kesalahan saat menghapus user');
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role?.toUpperCase()) {
            case 'SUPERADMIN':
                return {
                    label: 'Super Admin',
                    style: 'bg-purple-100 text-purple-800 font-bold border border-purple-300',
                };
            case 'ADMIN':
                return {
                    label: 'Admin DLHK',
                    style: 'bg-indigo-100 text-indigo-700 font-medium border border-indigo-200',
                };
            case 'VIEWER':
                return {
                    label: 'Viewer / Tamu',
                    style: 'bg-amber-100 text-amber-800 font-medium border border-amber-200',
                };
            case 'OPERATOR':
                return {
                    label: 'Operator',
                    style: 'bg-blue-100 text-blue-700 font-medium border border-blue-200',
                };
            case 'GATEKEEPER':
                return {
                    label: 'Gatekeeper TPA',
                    style: 'bg-slate-100 text-slate-700 font-medium border border-slate-200',
                };
            case 'LPS_KETUA':
                return {
                    label: 'Ketua LPS',
                    style: 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300',
                };
            case 'LPS_SEKRETARIS':
                return {
                    label: 'Sekretaris LPS',
                    style: 'bg-teal-100 text-teal-800 font-semibold border border-teal-300',
                };
            case 'LPS_BENDAHARA':
                return {
                    label: 'Bendahara LPS',
                    style: 'bg-cyan-100 text-cyan-800 font-semibold border border-cyan-300',
                };
            default:
                return {
                    label: role || 'User',
                    style: 'bg-gray-100 text-gray-700',
                };
        }
    };

    // Filter users based on search query & selected role
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch =
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.kelurahan?.nama && u.kelurahan.nama.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (u.kelurahan?.kecamatan?.nama && u.kelurahan.kecamatan.nama.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchesSearch) return false;

            if (selectedRoleFilter === 'ALL') return true;
            if (selectedRoleFilter === 'DLHK') {
                return ['SUPERADMIN', 'ADMIN', 'OPERATOR', 'VIEWER', 'GATEKEEPER'].includes(u.role);
            }
            if (selectedRoleFilter === 'LPS') {
                return ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'].includes(u.role);
            }
            return u.role === selectedRoleFilter;
        });
    }, [users, searchQuery, selectedRoleFilter]);

    return (
        <div className="space-y-6">
            {/* Read-Only Notice for non-superadmin users */}
            <ReadOnlyBanner featureName="Users" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manajemen User</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Kelola akun pengguna sistem DLHK & akun Pengurus LPS Kelurahan
                    </p>
                </div>
                {isSuperAdmin && (
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2.5 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Tambah User Baru</span>
                    </button>
                )}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
                <div className="relative flex-1">
                    <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama, email, role, atau kelurahan..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <select
                        value={selectedRoleFilter}
                        onChange={(e) => setSelectedRoleFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-purple-500 cursor-pointer"
                    >
                        <option value="ALL">Semua Role ({users.length})</option>
                        <option value="DLHK">Akun DLHK & TPA</option>
                        <option value="LPS">Akun Pengurus LPS Kelurahan</option>
                        <option value="SUPERADMIN">Super Admin (Nisa)</option>
                        <option value="LPS_KETUA">Ketua LPS</option>
                        <option value="LPS_SEKRETARIS">Sekretaris LPS</option>
                        <option value="LPS_BENDAHARA">Bendahara LPS</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <GlassCard className="overflow-hidden" hover={false}>
                {loading ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Memuat data pengguna...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/80 border-b border-gray-100">
                                <tr>
                                    <th className="text-left py-3.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nama & Email</th>
                                    <th className="text-left py-3.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role Akses</th>
                                    <th className="text-left py-3.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Wilayah Kelurahan</th>
                                    <th className="text-left py-3.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Terdaftar</th>
                                    <th className="text-right py-3.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map((user) => {
                                    const badge = getRoleBadge(user.role);
                                    const isLps = isLpsRole(user.role);
                                    return (
                                        <tr key={user.id} className="hover:bg-purple-50/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden ${
                                                        isLps
                                                            ? 'bg-linear-to-br from-green-600 to-emerald-700'
                                                            : 'bg-linear-to-br from-purple-600 to-indigo-700 ring-2 ring-purple-200'
                                                    }`}>
                                                        {user.role === 'SUPERADMIN' ? (
                                                            <img
                                                                src="/avatar-superadmin.png"
                                                                alt={user.name}
                                                                className="w-full h-full object-cover object-center"
                                                            />
                                                        ) : (
                                                            user.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-800 text-sm">{user.name}</div>
                                                        <div className="text-gray-500 font-mono text-xs">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${badge.style}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {user.kelurahan ? (
                                                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg w-fit font-medium">
                                                        <span>📍</span>
                                                        <span>
                                                            {user.kelurahan.nama.toLowerCase().startsWith('pasar') ? user.kelurahan.nama : `Kel. ${user.kelurahan.nama}`}
                                                            {user.kelurahan.kecamatan?.nama && (
                                                                <span className="text-gray-500 text-[11px] font-normal"> (Kec. {user.kelurahan.kecamatan.nama})</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                ) : isLps ? (
                                                    <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                                        ⚠️ Belum terhubung kelurahan
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Pusat / DLHK</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-gray-500 text-xs">
                                                {new Date(user.createdAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    {isSuperAdmin ? (
                                                        <>
                                                            <button
                                                                onClick={() => openEditModal(user)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                                title="Edit User"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(user)}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                                title="Hapus User"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Lihat Saja</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                Tidak ada user yang sesuai dengan pencarian atau filter.
                            </div>
                        )}
                    </div>
                )}
            </GlassCard>

            {/* Modal Tambah / Edit User */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8 overflow-hidden animate-fadeIn">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-purple-50 to-white">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {editingUser ? 'Edit Pengguna' : 'Tambah User Baru'}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {editingUser
                                        ? `Memperbarui akun ${editingUser.name}`
                                        : 'Daftarkan akun admin, operator, atau pengurus LPS kelurahan'}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {message && (
                                <div className={`p-3.5 rounded-xl text-sm font-medium ${
                                    message.type === 'success'
                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                        : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                    {message.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Nama Lengkap / Jabatan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Ketua LPS Sidomulyo Barat atau Ahmad Fauzi"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Email Login <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="Contoh: ketua.sidomulyobarat@lps.pekanbaru.go.id"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm font-mono"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Password {editingUser && <span className="text-gray-400 font-normal text-xs">(kosongkan jika tidak diganti)</span>} {!editingUser && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="password"
                                    placeholder={editingUser ? '•••••••• (Biarkan kosong jika tetap)' : 'Minimal 6 karakter'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm"
                                    required={!editingUser}
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Role / Hak Akses <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => {
                                        const newRole = e.target.value;
                                        setFormData({
                                            ...formData,
                                            role: newRole,
                                            // jika berganti ke non-LPS, kosongkan kelurahanId
                                            kelurahanId: isLpsRole(newRole) ? formData.kelurahanId : '',
                                        });
                                    }}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm font-medium cursor-pointer"
                                >
                                    <optgroup label="Pengurus LPS Kelurahan">
                                        <option value="LPS_KETUA">Ketua LPS (Kelurahan)</option>
                                        <option value="LPS_SEKRETARIS">Sekretaris LPS (Kelurahan)</option>
                                        <option value="LPS_BENDAHARA">Bendahara LPS (Kelurahan)</option>
                                    </optgroup>
                                    <optgroup label="Internal DLHK & Operasional">
                                        <option value="SUPERADMIN">Super Admin (Akses Penuh - Nisa)</option>
                                        <option value="ADMIN">Admin DLHK</option>
                                        <option value="OPERATOR">Operator Transdepo</option>
                                        <option value="VIEWER">Viewer / Tamu (Hanya Lihat)</option>
                                        <option value="GATEKEEPER">Petugas TPA / Gatekeeper</option>
                                    </optgroup>
                                </select>
                            </div>

                            {/* Dropdown Kelurahan (Muncul jika role LPS dipilih) */}
                            {isLpsRole(formData.role) && (
                                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-2 animate-fadeIn">
                                    <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
                                        <span>📍</span>
                                        <span>Wilayah Kelurahan LPS <span className="text-red-500">*</span></span>
                                    </div>
                                    <p className="text-xs text-emerald-700">
                                        Akun ini akan terkunci hanya dapat melihat data armada, timbangan, dan laporan bulanan dari kelurahan yang dipilih.
                                    </p>
                                    <select
                                        value={formData.kelurahanId}
                                        onChange={(e) => setFormData({ ...formData, kelurahanId: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-white border border-emerald-300 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-medium cursor-pointer"
                                        required={isLpsRole(formData.role)}
                                    >
                                        <option value="">-- Pilih Salah Satu Kelurahan --</option>
                                        {kecamatanList.map((kec) => (
                                            <optgroup key={kec.id} label={`Kecamatan ${kec.nama}`}>
                                                {kec.kelurahan.map((kel) => (
                                                    <option key={kel.id} value={kel.id}>
                                                        {kel.nama.toLowerCase().startsWith('pasar') ? kel.nama : `Kel. ${kel.nama}`}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Modal Footer Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold text-sm shadow-md disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Buat User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
