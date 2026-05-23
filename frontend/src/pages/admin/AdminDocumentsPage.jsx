import { useState, useEffect } from 'react';
import { Search, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { useLayananCatalog } from '@/hooks/useLayananCatalog';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { DOC_TYPES, formatDate, formatStatus } from '@/utils/format';
import { getUploadUrl } from '@/utils/config';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const STATUS_OPTIONS = ['submitted', 'drafting', 'review', 'approved', 'completed', 'rejected'];

export default function AdminDocumentsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [draftFile, setDraftFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(search);
  const { page, setPage, limit, resetPage } = usePagination();
  const { bySlug } = useLayananCatalog('layanan_2');

  const typeLabel = (slug) => bySlug[slug] || DOC_TYPES[slug] || slug;

  const fetchData = () => {
    setLoading(true);
    api.get(API_ENDPOINTS.DOCUMENTS.LIST, { params: { page, limit, search: debouncedSearch } })
      .then((res) => { setItems(res.data.data); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, limit, debouncedSearch]);

  const openManage = (d) => {
    setSelected(d);
    setStatus(d.status);
    setNotes(d.staff_notes || '');
    setDraftFile(null);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('status', status);
      fd.append('staff_notes', notes);
      if (draftFile) fd.append('draft_file', draftFile);
      await api.patch(API_ENDPOINTS.DOCUMENTS.UPDATE(selected.id), fd);
      toast.success('Diperbarui');
      setSelected(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    } finally {
      setSaving(false);
    }
  };

  const applicant = selected?.applicant_data || {};
  const applicantFiles = selected?.applicant_files || [];

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
              <th className="px-4 py-3 text-left">Jenis Permohonan</th>
              <th className="px-4 py-3 text-left">Pemohon</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Aksi</th>
            </tr></thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{d.request_number}</td>
                  <td className="px-4 py-3">{typeLabel(d.document_type)}</td>
                  <td className="px-4 py-3">{d.user_name}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => openManage(d)} className="text-primary-700 text-sm">Kelola</button>
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
            <p className="text-sm"><strong>Jenis Permohonan:</strong> {typeLabel(selected.document_type)}</p>
            <div className="text-sm">
              <strong>Data Pemohon:</strong>
              <ul className="mt-1 list-inside list-disc text-slate-600">
                <li>Nama: {applicant.name || '-'}</li>
                <li>NIK: {applicant.nik || '-'}</li>
                <li>HP: {applicant.phone || '-'}</li>
                <li>Alamat: {applicant.address || '-'}</li>
              </ul>
            </div>
            <p className="text-sm whitespace-pre-wrap"><strong>Kronologi:</strong><br />{selected.case_chronology}</p>
            {applicantFiles.length > 0 && (
              <div>
                <p className="text-sm font-medium">Lampiran Pemohon</p>
                <ul className="mt-1 space-y-1">
                  {applicantFiles.map((f) => (
                    <li key={f.filename}>
                      <a href={getUploadUrl(f.filename)} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary-700 hover:underline">
                        <Download size={14} /> {f.original_name || f.filename}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selected.draft_file && (
              <div>
                <p className="text-sm font-medium">Dokumen Hasil (untuk diunduh pemohon)</p>
                <a href={getUploadUrl(selected.draft_file)} target="_blank" rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm text-primary-700 hover:underline">
                  <Download size={14} /> Unduh dokumen hasil
                </a>
              </div>
            )}
            <p className="text-sm text-slate-500">{formatDate(selected.created_at)}</p>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select className="input-field mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{formatStatus(s).label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Catatan Petugas</label>
              <textarea className="input-field mt-1" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium">
                <Upload size={16} /> Upload Lampiran Dokumen Hasil
              </label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setDraftFile(e.target.files?.[0] || null)} className="input-field" />
              <p className="mt-1 text-xs text-slate-400">Pemohon dapat mengunduh setelah status selesai</p>
            </div>
            <button onClick={handleUpdate} disabled={saving} className="btn-primary w-full">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
