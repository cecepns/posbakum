import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ nik: '', name: '', email: '', phone: '', password: '', address: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{16}$/.test(form.nik)) return toast.error('NIK harus 16 digit');
    setLoading(true);
    try {
      await register(form);
      toast.success('Registrasi berhasil');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="card">
        <div className="mb-6 text-center">
          <UserPlus className="mx-auto h-10 w-10 text-primary-700" />
          <h1 className="mt-3 text-2xl font-bold">Daftar Akun</h1>
          <p className="text-sm text-slate-500">Pencari keadilan / masyarakat</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'nik', label: 'NIK (16 digit)', type: 'text', maxLength: 16 },
            { key: 'name', label: 'Nama Lengkap', type: 'text' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'phone', label: 'No. HP/WhatsApp', type: 'tel' },
            { key: 'password', label: 'Password', type: 'password' },
          ].map(({ key, label, type, maxLength }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium">{label}</label>
              <input type={type} maxLength={maxLength} className="input-field" value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={key !== 'phone'} />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-sm font-medium">Alamat</label>
            <textarea className="input-field" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Memproses...' : 'Daftar'}</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Sudah punya akun? <Link to="/login" className="text-primary-700 font-medium">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
