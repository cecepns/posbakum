import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, FileText, Plus, Star } from 'lucide-react';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/utils/format';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get(API_ENDPOINTS.TICKETS.LIST, { params: { limit: 5 } }),
      api.get(API_ENDPOINTS.DOCUMENTS.LIST, { params: { limit: 5 } }),
    ]).then(([t, d]) => {
      setTickets(t.data.data);
      setDocuments(d.data.data);
    }).finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Dashboard Saya</h1>
      <p className="text-slate-500">Selamat datang, {user.name}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link to="/konsultasi" className="card flex items-center gap-3 hover:border-primary-300 transition">
          <Plus className="h-8 w-8 text-primary-600" />
          <div><p className="font-semibold">Konsultasi Baru</p><p className="text-sm text-slate-500">Ajukan pertanyaan hukum</p></div>
        </Link>
        <Link to="/dokumen" className="card flex items-center gap-3 hover:border-primary-300 transition">
          <FileText className="h-8 w-8 text-primary-600" />
          <div><p className="font-semibold">Permohonan Dokumen</p><p className="text-sm text-slate-500">Bantuan susun dokumen</p></div>
        </Link>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Ticket size={20} /> Tiket Konsultasi</h2>
          <Link to="/tracking" className="text-sm text-primary-700">Lacak tiket →</Link>
        </div>
        {loading ? <LoadingSpinner /> : !tickets.length ? <EmptyState title="Belum ada tiket" description="Ajukan konsultasi pertama Anda" /> : (
          <div className="mt-4 space-y-3">
            {tickets.map((t) => (
              <Link key={t.id} to={`/dashboard/tickets/${t.id}`} className="card flex flex-wrap items-center justify-between gap-2 hover:border-primary-200 transition">
                <div>
                  <p className="font-medium text-primary-800">{t.ticket_number}</p>
                  <p className="text-sm">{t.subject}</p>
                  <p className="text-xs text-slate-400">{formatDate(t.created_at)}</p>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><FileText size={20} /> Permohonan Dokumen</h2>
        {!documents.length ? <EmptyState title="Belum ada permohonan dokumen" /> : (
          <div className="mt-4 space-y-3">
            {documents.map((d) => (
              <div key={d.id} className="card flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{d.request_number}</p>
                  <p className="text-sm text-slate-500">{d.document_type}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
