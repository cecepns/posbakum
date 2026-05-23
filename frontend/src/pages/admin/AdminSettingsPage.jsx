import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminSettingsPage() {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({ wa_number: '', zoom_link: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(API_ENDPOINTS.SETTINGS.GET)
      .then((res) => setForm({
        wa_number: res.data.data.wa_number || '',
        zoom_link: res.data.data.zoom_link || '',
      }))
      .finally(() => setLoading(false));
  }, []);

  if (!isAdmin) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(API_ENDPOINTS.SETTINGS.UPDATE, form);
      toast.success('Pengaturan disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold">Pengaturan Kontak</h1>
      <p className="mt-1 text-sm text-slate-500">Nomor WhatsApp dan link video call yang ditampilkan di halaman beranda</p>
      <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nomor WhatsApp</label>
          <input className="input-field" placeholder="6281234567890" value={form.wa_number}
            onChange={(e) => setForm({ ...form, wa_number: e.target.value })} required />
          <p className="mt-1 text-xs text-slate-400">Format internasional tanpa +, contoh: 6281234567890</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Link Video Call (Zoom/Google Meet)</label>
          <input className="input-field" placeholder="https://zoom.us/j/..." value={form.zoom_link}
            onChange={(e) => setForm({ ...form, zoom_link: e.target.value })} required />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </form>
    </div>
  );
}
