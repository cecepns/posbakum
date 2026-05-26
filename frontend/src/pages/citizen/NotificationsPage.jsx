import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { formatDate } from '@/utils/format';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';

const referenceLink = (n) => {
  if (n.reference_type === 'ticket' && n.reference_id) {
    return `/dashboard/tickets/${n.reference_id}`;
  }
  if (n.reference_type === 'document') {
    return '/dashboard';
  }
  return null;
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    api.get(API_ENDPOINTS.NOTIFICATIONS.LIST, { params: { limit: 50 } })
      .then((res) => setItems(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const markAllRead = async () => {
    await api.patch(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
    fetchData();
  };

  const markRead = async (id) => {
    await api.patch(API_ENDPOINTS.NOTIFICATIONS.READ(id));
    fetchData();
  };

  if (authLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Bell /> Notifikasi Saya</h1>
        <button type="button" onClick={markAllRead} className="btn-secondary text-sm">Tandai semua dibaca</button>
      </div>
      <p className="mt-1 text-sm text-slate-500">Riwayat balasan tiket, pembaruan permohonan dokumen, dan status layanan</p>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="mt-6 space-y-2">
          {items.map((n) => {
            const href = referenceLink(n);
            const content = (
              <div className={`card !py-3 ${!n.is_read ? 'border-primary-300 bg-primary-50/30' : ''}`}>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-slate-600">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(n.created_at)}</p>
              </div>
            );

            if (href) {
              return (
                <Link
                  key={n.id}
                  to={href}
                  onClick={() => { if (!n.is_read) markRead(n.id); }}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={n.id}
                type="button"
                className="block w-full text-left"
                onClick={() => { if (!n.is_read) markRead(n.id); }}
              >
                {content}
              </button>
            );
          })}
          {!items.length && <p className="py-8 text-center text-slate-400">Tidak ada notifikasi</p>}
        </div>
      )}
    </div>
  );
}
