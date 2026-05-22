import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const emptyForm = { name: '', accreditation_no: '', address: '', city: '', province: '', phone: '', email: '', website: '', coverage_areas: '', case_types: '', is_partner: 0 };

export default function AdminOBHPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const debouncedSearch = useDebounce(search);
  const { page, setPage, limit, resetPage } = usePagination(10);

  const fetchData = () => {
    setLoading(true);
    api.get(API_ENDPOINTS.OBH.LIST, { params: { page, limit: 10, search: debouncedSearch } })
      .then((res) => { setItems(res.data.data); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, debouncedSearch]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editId) await api.put(API_ENDPOINTS.OBH.UPDATE(editId), form);
      else await api.post(API_ENDPOINTS.OBH.CREATE, form);
      toast.success('Disimpan');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <span className="flex flex-col gap-2">Nonaktifkan OBH ini?
        <span className="flex gap-2">
          <button onClick={async () => { await api.delete(API_ENDPOINTS.OBH.DELETE(id)); toast.dismiss(t.id); fetchData(); }} className="btn-danger text-xs !py-1">Ya</button>
          <button onClick={() => toast.dismiss(t.id)} className="btn-secondary text-xs !py-1">Batal</button>
        </span>
      </span>
    ), { duration: 8000 });
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Direktori OBH</h1>
        <button onClick={() => { setEditId(null); setForm(emptyForm); setModalOpen(true); }} className="btn-primary"><Plus size={16} /> Tambah OBH</button>
      </div>
      <input className="input-field mt-4 max-w-md" placeholder="Cari..." value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} />

      {loading ? <LoadingSpinner /> : (
        <div className="card mt-4 space-y-3">
          {items.map((obh) => (
            <div key={obh.id} className="flex justify-between items-start border-b pb-3">
              <div>
                <p className="font-medium">{obh.name} {obh.is_partner ? <span className="badge bg-gold-100 text-gold-800 text-xs">Mitra</span> : null}</p>
                <p className="text-sm text-slate-500">{obh.city} • {obh.phone}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditId(obh.id); setForm(obh); setModalOpen(true); }} className="p-1"><Pencil size={16} /></button>
                <button onClick={() => handleDelete(obh.id)} className="p-1 text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit OBH' : 'Tambah OBH'} size="lg">
        <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
          {['name', 'accreditation_no', 'city', 'province', 'phone', 'email', 'website'].map((key) => (
            <div key={key} className={key === 'name' ? 'sm:col-span-2' : ''}>
              <label className="text-sm capitalize">{key.replace('_', ' ')}</label>
              <input className="input-field mt-1" value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={key === 'name' || key === 'address'} />
            </div>
          ))}
          <div className="sm:col-span-2"><label className="text-sm">Alamat</label><textarea className="input-field mt-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></div>
          <div className="sm:col-span-2"><label className="text-sm">Cakupan Layanan</label><textarea className="input-field mt-1" value={form.coverage_areas} onChange={(e) => setForm({ ...form, coverage_areas: e.target.value })} /></div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" checked={!!form.is_partner} onChange={(e) => setForm({ ...form, is_partner: e.target.checked ? 1 : 0 })} /> Mitra PN
          </label>
          <button type="submit" className="btn-primary sm:col-span-2">Simpan</button>
        </form>
      </Modal>
    </div>
  );
}
