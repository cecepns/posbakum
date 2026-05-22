import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, isStaff } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.identifier, form.password);
      toast.success('Login berhasil');
      navigate(isStaff || ['admin', 'staff'].includes(user.role) ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card">
        <div className="mb-6 text-center">
          <LogIn className="mx-auto h-10 w-10 text-primary-700" />
          <h1 className="mt-3 text-2xl font-bold">Masuk</h1>
          <p className="text-sm text-slate-500">Gunakan NIK atau email Anda</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">NIK / Email</label>
            <input className="input-field" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Memproses...' : 'Masuk'}</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Belum punya akun? <Link to="/register" className="text-primary-700 font-medium">Daftar</Link>
        </p>
        <p className="mt-2 text-center text-xs text-slate-400">Demo admin: admin@posbakum.local / admin123</p>
      </div>
    </div>
  );
}
