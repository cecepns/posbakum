import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { useAuth } from '@/context/AuthContext';
import { useLayananCatalog } from '@/hooks/useLayananCatalog';
import { DOC_TYPES } from '@/utils/format';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DokumenPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items: layananItems, loading: layananLoading } = useLayananCatalog('layanan_2');
  const [form, setForm] = useState({
    document_type: 'gugatan_cerai',
    case_chronology: '',
    applicant_name: '', applicant_nik: '', applicant_address: '', applicant_phone: '',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const permohonanOptions = layananItems.length
    ? layananItems.map((i) => ({ value: i.slug, label: i.name }))
    : Object.entries(DOC_TYPES).map(([value, label]) => ({ value, label }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Silakan login'); navigate('/login'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('document_type', form.document_type);
      fd.append('case_chronology', form.case_chronology);
      fd.append('applicant_data', JSON.stringify({
        name: form.applicant_name,
        nik: form.applicant_nik,
        address: form.applicant_address,
        phone: form.applicant_phone,
      }));
      files.forEach((f) => fd.append('files', f));
      const res = await api.post(API_ENDPOINTS.DOCUMENTS.CREATE, fd);
      toast.success(`Permohonan ${res.data.data.request_number} berhasil`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Permohonan Bantuan Dokumen</h1>
      <p className="mt-1 text-slate-500">Layanan 2: Bantuan pembuatan dokumen hukum</p>
      {!user && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm">
          <Link to="/login" className="font-medium text-amber-800">Login</Link> untuk mengajukan permohonan dokumen.
        </div>
      )}
      <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Jenis Permohonan</label>
          {layananLoading ? <LoadingSpinner /> : (
            <select className="input-field" value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })}>
              {permohonanOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { key: 'applicant_name', label: 'Nama Pemohon' },
            { key: 'applicant_nik', label: 'NIK Pemohon' },
            { key: 'applicant_phone', label: 'No. HP' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium">{label}</label>
              <input className="input-field" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
            </div>
          ))}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Alamat</label>
          <input className="input-field" value={form.applicant_address} onChange={(e) => setForm({ ...form, applicant_address: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Kronologi Kasus</label>
          <textarea className="input-field" rows={6} value={form.case_chronology} onChange={(e) => setForm({ ...form, case_chronology: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium">
            <Paperclip size={16} /> Upload Dokumen Pendukung (PDF/JPG, max 5 file)
          </label>
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => setFiles([...e.target.files])} className="input-field" />
        </div>
        <button type="submit" disabled={loading || !user} className="btn-primary w-full">
          <FileText size={16} /> Ajukan Permohonan
        </button>
      </form>
    </div>
  );
}
