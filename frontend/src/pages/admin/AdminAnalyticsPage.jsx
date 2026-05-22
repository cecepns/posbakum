import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(API_ENDPOINTS.ANALYTICS.DASHBOARD)
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const maxMonthly = Math.max(...(data?.monthly_tickets?.map((m) => m.count) || [1]), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics & Laporan Kinerja</h1>
      <p className="text-slate-500">Data untuk menyempurnakan SOP layanan Posbakum</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-700">{data?.auto_reply_rate || 0}%</p>
          <p className="text-sm text-slate-500">Pertanyaan dijawab otomatis</p>
          <p className="text-xs text-slate-400 mt-1">Target: 70%</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-orange-600">{data?.avg_response_minutes || 0} mnt</p>
          <p className="text-sm text-slate-500">Rata-rata waktu respon</p>
          <p className="text-xs text-slate-400 mt-1">Target: &lt;15 menit</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gold-600">{data?.ikm?.avg_rating || 0}/5</p>
          <p className="text-sm text-slate-500">Indeks Kepuasan (IKM)</p>
          <p className="text-xs text-slate-400 mt-1">{data?.ikm?.total || 0} penilaian</p>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="flex items-center gap-2 font-semibold"><TrendingUp size={18} /> Tiket per Bulan</h2>
        <div className="mt-4 flex items-end gap-2 h-40">
          {data?.monthly_tickets?.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-primary-600 rounded-t transition-all" style={{ height: `${(m.count / maxMonthly) * 100}%`, minHeight: m.count ? '4px' : 0 }} />
              <span className="text-[10px] text-slate-500 rotate-[-45deg] origin-top-left whitespace-nowrap">{m.month?.slice(5)}</span>
              <span className="text-xs font-medium">{m.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 mt-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold">Kategori Pertanyaan Terbanyak</h2>
          <div className="mt-4 space-y-3">
            {data?.top_categories?.map((c, i) => (
              <div key={c.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{c.category || 'Umum'}</span>
                  <span className="font-medium">{c.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600 rounded-full" style={{ width: `${(c.count / (data.top_categories[0]?.count || 1)) * 100}%` }} />
                </div>
              </div>
            )) || <p className="text-sm text-slate-400">Belum ada data</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="flex items-center gap-2 font-semibold"><BarChart3 size={18} /> Knowledge Base Terpopuler</h2>
          <div className="mt-4 space-y-2">
            {data?.top_knowledge_base?.map((kb) => (
              <div key={kb.title} className="flex justify-between text-sm border-b pb-2">
                <span>{kb.title}</span>
                <span className="font-medium text-primary-700">{kb.use_count}x</span>
              </div>
            )) || <p className="text-sm text-slate-400">Belum ada data</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
