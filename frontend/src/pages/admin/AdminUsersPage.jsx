import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';
import { formatDate } from '@/utils/format';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminUsersPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search);
  const { page, setPage, limit, resetPage } = usePagination();

  useEffect(() => {
    setLoading(true);
    api.get(API_ENDPOINTS.USERS.LIST, { params: { page, limit, search: debouncedSearch } })
      .then((res) => { setItems(res.data.data); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Pengguna</h1>
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
            </tr></thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.nik}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3"><span className="badge bg-slate-100">{u.role}</span></td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
