import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/utils/format';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminTicketsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search);
  const { page, setPage, limit, setLimit, resetPage } = usePagination();

  useEffect(() => {
    setLoading(true);
    api.get(API_ENDPOINTS.TICKETS.LIST, { params: { page, limit, search: debouncedSearch, status } })
      .then((res) => { setItems(res.data.data); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch, status]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Manajemen Tiket</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input className="input-field pl-9" placeholder="Cari tiket..." value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }} />
        </div>
        <select className="input-field w-auto" value={status} onChange={(e) => { setStatus(e.target.value); resetPage(); }}>
          <option value="">Semua Status</option>
          <option value="open">Menunggu</option>
          <option value="auto_answered">Auto Reply</option>
          <option value="in_progress">Diproses</option>
          <option value="answered">Dijawab</option>
          <option value="closed">Selesai</option>
        </select>
        <select className="input-field w-auto" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); resetPage(); }}>
          {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}/hal</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : !items.length ? <EmptyState /> : (
        <div className="card mt-4 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr>
              <th className="px-4 py-3 text-left">No. Tiket</th>
              <th className="px-4 py-3 text-left">Subjek</th>
              <th className="px-4 py-3 text-left">Pemohon</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Tanggal</th>
            </tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3"><Link to={`/admin/tickets/${t.id}`} className="font-medium text-primary-700">{t.ticket_number}</Link></td>
                  <td className="px-4 py-3">{t.subject}</td>
                  <td className="px-4 py-3">{t.user_name}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(t.created_at)}</td>
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
