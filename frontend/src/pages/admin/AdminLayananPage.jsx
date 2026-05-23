import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { useDebounce } from '@/hooks/useDebounce';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

const emptyForm = { name: '', slug: '', layanan_group: 'layanan_1', description: '', sort_order: 0, is_active: 1 };

export default function AdminLayananPage() {
  const [items, setItems] = useState([]);
  const [group, setGroup] = useState('layanan_1');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(search);

  const fetchData = () => {
    setLoading(true);
    api.get(API_ENDPOINTS.LAYANAN_CATALOG.LIST, {
      params: { group, search: debouncedSearch, limit: 100, include_inactive: 'true' },
    })
      .then((res) => setItems(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [group, debouncedSearch]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, layanan_group: group });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      slug: item.slug,
      layanan_group: item.layanan_group,
      description: item.description || '',
      sort_order: item.sort_order || 0,
      is_active: item.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(API_ENDPOINTS.LAYANAN_CATALOG.UPDATE(editId), form);
        toast.success('Diperbarui');
      } else {
        await api.post(API_ENDPOINTS.LAYANAN_CATALOG.CREATE, form);
        toast.success('Ditambahkan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <span className="flex flex-col gap-2">
        Nonaktifkan jenis layanan ini?
        <span className="flex gap-2">
          <button onClick={async () => {
            await api.delete(API_ENDPOINTS.LAYANAN_CATALOG.DELETE(id));
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
        <h1 className="text-2xl font-bold">Jenis Layanan</h1>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Tambah</button>
      </div>
      <p className="mt-1 text-sm text-slate-500">Kelola jenis layanan fleksibel untuk Layanan 1 (konsultasi) dan Layanan 2 (permohonan dokumen)</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { value: 'layanan_1', label: 'Layanan 1 — Konsultasi' },
          { value: 'layanan_2', label: 'Layanan 2 — Permohonan Dokumen' },
        ].map(({ value, label }) => (
          <button key={value} type="button" onClick={() => setGroup(value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${group === value ? 'bg-primary-700 text-white' : 'bg-white border text-slate-600'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="relative mt-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input className="input-field pl-9" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <LoadingSpinner /> : !items.length ? <EmptyState /> : (
        <div className="card mt-4 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr>
              <th className="px-4 py-3 text-left">Nama</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">Urutan</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Aksi</th>
            </tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500">{item.slug}</td>
                  <td className="px-4 py-3">{item.sort_order}</td>
                  <td className="px-4 py-3">{item.is_active ? 'Aktif' : 'Nonaktif'}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(item)} className="text-primary-700"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Jenis Layanan' : 'Tambah Jenis Layanan'}>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Grup Layanan</label>
            <select className="input-field mt-1" value={form.layanan_group} onChange={(e) => setForm({ ...form, layanan_group: e.target.value })}>
              <option value="layanan_1">Layanan 1 — Konsultasi</option>
              <option value="layanan_2">Layanan 2 — Permohonan Dokumen</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Nama</label>
            <input className="input-field mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium">Slug (unik, tanpa spasi)</label>
            <input className="input-field mt-1" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required disabled={!!editId} />
          </div>
          <div>
            <label className="text-sm font-medium">Deskripsi</label>
            <textarea className="input-field mt-1" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Urutan</label>
              <input type="number" className="input-field mt-1" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select className="input-field mt-1" value={form.is_active} onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })}>
                <option value={1}>Aktif</option>
                <option value={0}>Nonaktif</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </form>
      </Modal>
    </div>
  );
}
