import { useState, useEffect } from 'react';
import { Search, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { useAuth } from '@/context/AuthContext';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/utils/format';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminUsersPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(search);
  const { page, setPage, limit, resetPage } = usePagination();

  useEffect(() => {
    setLoading(true);
    api.get(API_ENDPOINTS.USERS.LIST, { params: { page, limit, search: debouncedSearch } })
      .then((res) => { setItems(res.data.data); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setSaving(true);
    try {
      await api.patch(API_ENDPOINTS.USERS.PASSWORD(selected.id), { password });
      toast.success('Password berhasil diperbarui');
      setSelected(null);
      setPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Pengguna</h1>
      {!isAdmin && <p className="mt-1 text-sm text-amber-600">Hanya super admin yang dapat mengubah password pengguna.</p>}
      <input className="input-field mt-4 max-w-md" placeholder="Cari nama, email, NIK..." value={search}
        onChange={(e) => { setSearch(e.target.value); resetPage(); }} />
      {loading ? <LoadingSpinner /> : (
        <div className="card mt-4 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr>
              <th className="px-4 py-3 text-left">Nama</th>
              <th className="px-4 py-3 text-left">NIK</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Terdaftar</th>
              {isAdmin && <th className="px-4 py-3 text-left">Aksi</th>}
            </tr></thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.nik}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3"><span className="badge bg-slate-100">{u.role}</span></td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(u.created_at)}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        <button onClick={() => { setSelected(u); setPassword(''); }}
                          className="inline-flex items-center gap-1 text-sm text-primary-700">
                          <KeyRound size={14} /> Ganti Password
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Ganti Password — ${selected?.name}`}>
        {selected && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <p className="text-sm text-slate-500">Reset password untuk {selected.email}</p>
            <div>
              <label className="text-sm font-medium">Password Baru</label>
              <input type="password" className="input-field mt-1" value={password}
                onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Menyimpan...' : 'Simpan Password'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
