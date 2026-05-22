import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Clock, Star, Zap, TrendingUp } from 'lucide-react';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/utils/format';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD)
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const stats = [
    { icon: Ticket, label: 'Total Tiket', value: data?.tickets?.total || 0, color: 'text-primary-600' },
    { icon: Zap, label: 'Auto-Reply', value: `${data?.auto_reply_rate || 0}%`, color: 'text-blue-600' },
    { icon: Clock, label: 'Rata Respon', value: `${data?.avg_response_minutes || 0} mnt`, color: 'text-orange-600' },
    { icon: Star, label: 'IKM Rata-rata', value: data?.ikm?.avg_rating || '0', color: 'text-gold-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard Posbakum</h1>
      <p className="text-slate-500">Ringkasan kinerja layanan SAMBAT</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <Icon className={`h-10 w-10 ${color}`} />
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="flex items-center gap-2 font-semibold"><TrendingUp size={18} /> Status Tiket</h2>
          <div className="mt-4 space-y-2">
            {[
              { label: 'Terbuka', count: data?.tickets?.open_count },
              { label: 'Diproses', count: data?.tickets?.in_progress_count },
              { label: 'Dijawab Otomatis', count: data?.tickets?.auto_answered_count },
              { label: 'Dijawab', count: data?.tickets?.answered_count },
              { label: 'Selesai', count: data?.tickets?.closed_count },
            ].map(({ label, count }) => (
              <div key={label} className="flex justify-between text-sm">
                <span>{label}</span>
                <span className="font-semibold">{count || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold">Kategori Terbanyak</h2>
          <div className="mt-4 space-y-2">
            {data?.top_categories?.length ? data.top_categories.map((c) => (
              <div key={c.category} className="flex justify-between text-sm">
                <span>{c.category || 'Umum'}</span>
                <span className="font-semibold">{c.count}</span>
              </div>
            )) : <p className="text-sm text-slate-400">Belum ada data</p>}
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Tiket Terbaru</h2>
          <Link to="/admin/tickets" className="text-sm text-primary-700">Lihat semua →</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500">
              <th className="pb-2 pr-4">No. Tiket</th><th className="pb-2 pr-4">Subjek</th><th className="pb-2 pr-4">Pemohon</th><th className="pb-2">Status</th>
            </tr></thead>
            <tbody>
              {data?.recent_tickets?.map((t) => (
                <tr key={t.ticket_number} className="border-b border-slate-100">
                  <td className="py-3 pr-4"><Link to="/admin/tickets" className="text-primary-700 font-medium">{t.ticket_number}</Link></td>
                  <td className="py-3 pr-4">{t.subject}</td>
                  <td className="py-3 pr-4">{t.user_name}</td>
                  <td className="py-3"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
