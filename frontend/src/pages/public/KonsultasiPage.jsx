import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Send, Paperclip, MessageCircle, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { useAuth } from '@/context/AuthContext';
import { SERVICE_TYPES } from '@/utils/format';

export default function KonsultasiPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: '', question: '', service_type: 'konsultasi', category: '', contact_method: 'form',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Silakan login terlebih dahulu'); navigate('/login'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append('files', f));
      const res = await api.post(API_ENDPOINTS.TICKETS.CREATE, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.data?.auto_replied) {
        toast.success(`Dijawab otomatis! Tiket: ${res.data.data.ticket_number}`);
      } else {
        toast.success(`Tiket dibuat: ${res.data.data.ticket_number}`);
      }
      navigate(`/dashboard/tickets/${res.data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan konsultasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Konsultasi Online</h1>
      <p className="mt-1 text-slate-500">Pertanyaan umum dijawab otomatis oleh Knowledge Base</p>

      {!user && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm">
          <Link to="/login" className="font-medium text-amber-800">Login</Link> atau <Link to="/register" className="font-medium text-amber-800">daftar</Link> untuk mengajukan konsultasi.
        </div>
      )}

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Jenis Layanan</label>
          <select className="input-field" value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })}>
            {Object.entries(SERVICE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Kategori (opsional)</label>
          <input className="input-field" placeholder="Contoh: cerai, waris, pidana" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Subjek / Judul Pertanyaan</label>
          <input className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Pertanyaan / Kronologi</label>
          <textarea className="input-field" rows={6} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required
            placeholder="Jelaskan pertanyaan hukum Anda selengkap mungkin..." />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Metode Kontak</label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'form', label: 'Formulir', icon: Send },
              { value: 'chat', label: 'WhatsApp', icon: MessageCircle },
              { value: 'video', label: 'Video Call', icon: Video },
            ].map(({ value, label, icon: Icon }) => (
              <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 ${form.contact_method === value ? 'border-primary-500 bg-primary-50' : ''}`}>
                <input type="radio" name="contact" value={value} checked={form.contact_method === value}
                  onChange={(e) => setForm({ ...form, contact_method: e.target.value })} className="sr-only" />
                <Icon size={16} /> {label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium"><Paperclip size={16} /> Lampiran (PDF/JPG, max 5 file)</label>
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => setFiles([...e.target.files])} className="input-field" />
        </div>
        <button type="submit" disabled={loading || !user} className="btn-primary w-full">
          {loading ? 'Mengirim...' : <><Send size={16} /> Ajukan Konsultasi</>}
        </button>
      </form>
    </div>
  );
}
