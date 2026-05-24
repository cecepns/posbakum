import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { LOCATION_TYPES, formatDistance } from '@/utils/mapLocation';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LocationPickerMap from '@/components/map/LocationPickerMap';

const emptyForm = {
  name: '',
  location_type: 'pengadilan',
  address: '',
  latitude: '',
  longitude: '',
  distance_km: '',
  distance_info: '',
  case_type: '',
  case_fee: '',
  fee_notes: '',
  description: '',
  sort_order: 0,
  is_active: 1,
};

export default function AdminMapLocationsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const debouncedSearch = useDebounce(search);
  const { page, setPage, resetPage } = usePagination(10);

  const fetchData = () => {
    setLoading(true);
    api.get(API_ENDPOINTS.MAP_LOCATIONS.LIST, { params: { page, limit: 10, search: debouncedSearch } })
      .then((res) => {
        setItems(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, debouncedSearch]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditId(item.id);
    setForm({
      ...item,
      latitude: item.latitude ?? '',
      longitude: item.longitude ?? '',
      distance_km: item.distance_km ?? '',
      is_active: item.is_active ? 1 : 0,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      toast.error('Pilih lokasi pada peta terlebih dahulu');
      return;
    }
    try {
      const payload = {
        ...form,
        distance_km: form.distance_km === '' ? null : form.distance_km,
      };
      if (editId) await api.put(API_ENDPOINTS.MAP_LOCATIONS.UPDATE(editId), payload);
      else await api.post(API_ENDPOINTS.MAP_LOCATIONS.CREATE, payload);
      toast.success('Lokasi peta disimpan');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <span className="flex flex-col gap-2">
        Nonaktifkan lokasi ini dari peta beranda?
        <span className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              await api.delete(API_ENDPOINTS.MAP_LOCATIONS.DELETE(id));
              toast.dismiss(t.id);
              toast.success('Lokasi dinonaktifkan');
              fetchData();
            }}
            className="btn-danger text-xs !py-1"
          >
            Ya
          </button>
          <button type="button" onClick={() => toast.dismiss(t.id)} className="btn-secondary text-xs !py-1">
            Batal
          </button>
        </span>
      </span>
    ), { duration: 8000 });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Peta GIS</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola titik lokasi, jarak, dan tarif biaya perkara di beranda</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Tambah Lokasi
        </button>
      </div>

      <input
        className="input-field mt-4 max-w-md"
        placeholder="Cari nama, alamat, jenis perkara..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); resetPage(); }}
      />

      {loading ? <LoadingSpinner /> : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="pb-2 pr-4">Lokasi</th>
                <th className="pb-2 pr-4">Jarak</th>
                <th className="pb-2 pr-4">Tarif</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.case_type || '—'}</p>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{formatDistance(item) || '—'}</td>
                  <td className="py-3 pr-4 text-slate-600">{item.case_fee}</td>
                  <td className="py-3 pr-4">
                    <span className={`badge text-xs ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openEdit(item)} className="p-1" aria-label="Edit">
                        <Pencil size={16} />
                      </button>
                      <button type="button" onClick={() => handleDelete(item.id)} className="p-1 text-red-600" aria-label="Hapus">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && (
            <p className="py-8 text-center text-sm text-slate-500">Belum ada lokasi. Tambahkan titik pertama untuk peta beranda.</p>
          )}
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Lokasi Peta' : 'Tambah Lokasi Peta'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm">Nama lokasi *</label>
              <input className="input-field mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm">Tipe lokasi</label>
              <select className="input-field mt-1" value={form.location_type} onChange={(e) => setForm({ ...form, location_type: e.target.value })}>
                {LOCATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Urutan tampil</label>
              <input type="number" className="input-field mt-1" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm">Alamat</label>
              <textarea className="input-field mt-1" rows={2} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>

          <LocationPickerMap
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={({ lat, lng }) => setForm({ ...form, latitude: lat, longitude: lng })}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm">Jarak (km)</label>
              <input type="number" step="0.01" min="0" className="input-field mt-1" placeholder="Contoh: 2.5"
                value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Keterangan jarak</label>
              <input className="input-field mt-1" placeholder="Contoh: ±2,5 km dari Posbakum"
                value={form.distance_info || ''} onChange={(e) => setForm({ ...form, distance_info: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Jenis perkara</label>
              <input className="input-field mt-1" placeholder="Contoh: Cerai, Perdata"
                value={form.case_type || ''} onChange={(e) => setForm({ ...form, case_type: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Tarif biaya perkara *</label>
              <input className="input-field mt-1" placeholder="Contoh: Gratis (SKTM), Sesuai PERMA"
                value={form.case_fee} onChange={(e) => setForm({ ...form, case_fee: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm">Catatan tarif</label>
              <textarea className="input-field mt-1" rows={2} value={form.fee_notes || ''} onChange={(e) => setForm({ ...form, fee_notes: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm">Deskripsi popup</label>
              <textarea className="input-field mt-1" rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} />
              Tampilkan di peta beranda (aktif)
            </label>
          </div>

          <button type="submit" className="btn-primary w-full sm:w-auto">
            <MapPin size={16} /> Simpan Lokasi
          </button>
        </form>
      </Modal>
    </div>
  );
}
