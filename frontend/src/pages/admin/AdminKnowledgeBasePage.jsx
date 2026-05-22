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
import EmptyState from '@/components/ui/EmptyState';

const emptyForm = { title: '', category: '', keywords: '', content: '', is_active: 1 };

export default function AdminKnowledgeBasePage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(search);
  const { page, setPage, limit, setLimit, resetPage } = usePagination();

  const fetchData = () => {
    setLoading(true);
    api.get(API_ENDPOINTS.KNOWLEDGE_BASE.LIST, { params: { page, limit, search: debouncedSearch } })
      .then((res) => { setItems(res.data.data); setPagination(res.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, limit, debouncedSearch]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };

  const openEdit = async (id) => {
    const res = await api.get(API_ENDPOINTS.KNOWLEDGE_BASE.DETAIL(id));
    const d = res.data.data;
    setForm({ title: d.title, category: d.category, keywords: d.keywords, content: d.content, is_active: d.is_active });
    setEditId(id);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(API_ENDPOINTS.KNOWLEDGE_BASE.UPDATE(editId), form);
        toast.success('Diperbarui');
      } else {
        await api.post(API_ENDPOINTS.KNOWLEDGE_BASE.CREATE, form);
        toast.success('Ditambahkan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <span className="flex flex-col gap-2">
        Hapus artikel KB ini?
        <span className="flex gap-2">
          <button onClick={async () => {
            await api.delete(API_ENDPOINTS.KNOWLEDGE_BASE.DELETE(id));
            toast.dismiss(t.id);
            toast.success('Dinonaktifkan');
            fetchData();
          }} className="btn-danger text-xs !py-1">Ya</button>
          <button onClick={() => toast.dismiss(t.id)} className="btn-secondary text-xs !py-1">Batal</button>
        </span>
      </span>
    ), { duration: 10000 });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Tambah Template</button>
      </div>

      <div className="mt-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input className="input-field pl-9" placeholder="Cari..." value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} />
        </div>
        <select className="input-field w-auto" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); resetPage(); }}>
          {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : !items.length ? <EmptyState /> : (
        <div className="card mt-4 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr>
              <th className="px-4 py-3 text-left">Judul</th>
              <th className="px-4 py-3 text-left">Kategori</th>
              <th className="px-4 py-3 text-left">Penggunaan</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{item.use_count}x</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(item.id)} className="p-1 hover:text-primary-700"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Template' : 'Tambah Template'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="text-sm font-medium">Judul</label><input className="input-field mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div><label className="text-sm font-medium">Kategori</label><input className="input-field mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></div>
          <div><label className="text-sm font-medium">Keywords (pisah koma)</label><input className="input-field mt-1" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} required /></div>
          <div><label className="text-sm font-medium">Konten Jawaban</label><textarea className="input-field mt-1" rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /></div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </form>
      </Modal>
    </div>
  );
}
