import { useState, useEffect } from 'react';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

export default function OBHPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search);
  const { page, setPage, limit } = usePagination();

  useEffect(() => {
    setLoading(true);
    api.get(API_ENDPOINTS.OBH.LIST, { params: { page, limit, search: debouncedSearch, city } })
      .then((res) => { setItems(res.data.data); setPagination(res.data.pagination); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch, city]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Direktori OBH</h1>
      <p className="mt-1 text-slate-500">Organisasi Bantuan Hukum terakreditasi untuk pendampingan sidang</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input className="input-field max-w-xs" placeholder="Cari nama OBH..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <input className="input-field max-w-xs" placeholder="Filter kota..." value={city} onChange={(e) => { setCity(e.target.value); setPage(1); }} />
      </div>

      {loading ? <LoadingSpinner /> : !items.length ? <EmptyState title="OBH tidak ditemukan" /> : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {items.map((obh) => (
            <div key={obh.id} className="card">
              <div className="flex items-start gap-3">
                <Building2 className="h-8 w-8 text-primary-600 shrink-0" />
                <div>
                  <h3 className="font-semibold">{obh.name}</h3>
                  {obh.is_partner && <span className="badge bg-gold-100 text-gold-800 mt-1">Mitra PN</span>}
                  {obh.accreditation_no && <p className="text-xs text-slate-400 mt-1">Akreditasi: {obh.accreditation_no}</p>}
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                <p className="flex items-start gap-2"><MapPin size={14} className="shrink-0 mt-0.5" />{obh.address}, {obh.city}</p>
                {obh.phone && <p className="flex items-center gap-2"><Phone size={14} />{obh.phone}</p>}
                {obh.email && <p className="flex items-center gap-2"><Mail size={14} />{obh.email}</p>}
              </div>
              {obh.coverage_areas && <p className="mt-2 text-xs text-slate-500"><strong>Cakupan:</strong> {obh.coverage_areas}</p>}
            </div>
          ))}
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
