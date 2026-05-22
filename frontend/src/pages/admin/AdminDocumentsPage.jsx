import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { DOC_TYPES, formatDate } from '@/utils/format';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminDocumentsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const debouncedSearch = useDebounce(search);
  const { page, setPage, limit, setLimit, resetPage } = usePagination();

  const fetchData = () => {
    setLoading(true);
    api.get(API_ENDPOINTS.DOCUMENTS.LIST, { params: { page, limit, search: debouncedSearch } })
      .then((res) => { setItems(res.data.data); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, limit, debouncedSearch]);

  const handleUpdate = async () => {
    try {
      await api.patch(API_ENDPOINTS.DOCUMENTS.UPDATE(selected.id), { status, staff_notes: notes });
      toast.success('Diperbarui');
      setSelected(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Permohonan Dokumen</h1>
      <div className="mt-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input className="input-field pl-9" placeholder="Cari..." value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card mt-4 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr>
              <th className="px-4 py-3 text-left">No. Permohonan</th>
              <th className="px-4 py-3 text-left">Jenis</th>
              <th className="px-4 py-3 text-left">Pemohon</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Aksi</th>
            </tr></thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{d.request_number}</td>
                  <td className="px-4 py-3">{DOC_TYPES[d.document_type] || d.document_type}</td>
                  <td className="px-4 py-3">{d.user_name}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setSelected(d); setStatus(d.status); setNotes(d.staff_notes || ''); }} className="text-primary-700 text-sm">Kelola</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Permohonan ${selected?.request_number}`}>
        {selected && (
          <div className="space-y-4">
            <p className="text-sm"><strong>Jenis:</strong> {DOC_TYPES[selected.document_type]}</p>
            <p className="text-sm whitespace-pre-wrap"><strong>Kronologi:</strong><br />{selected.case_chronology}</p>
            <p className="text-sm text-slate-500">{formatDate(selected.created_at)}</p>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select className="input-field mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>
                {['submitted', 'drafting', 'review', 'approved', 'completed', 'rejected'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Catatan Petugas</label>
              <textarea className="input-field mt-1" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button onClick={handleUpdate} className="btn-primary w-full">Simpan</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
