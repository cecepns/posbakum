import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { formatDate } from '@/utils/format';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminNotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    api.get(API_ENDPOINTS.NOTIFICATIONS.LIST, { params: { limit: 50 } })
      .then((res) => setItems(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const markAllRead = async () => {
    await api.patch(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
    fetchData();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Bell /> Notifikasi</h1>
        <button onClick={markAllRead} className="btn-secondary text-sm">Tandai semua dibaca</button>
      </div>
      <div className="mt-6 space-y-2">
        {items.map((n) => (
          <div key={n.id} className={`card !py-3 ${!n.is_read ? 'border-primary-300 bg-primary-50/30' : ''}`}>
            <p className="font-medium text-sm">{n.title}</p>
            <p className="text-sm text-slate-600">{n.message}</p>
            <p className="text-xs text-slate-400 mt-1">{formatDate(n.created_at)}</p>
          </div>
        ))}
        {!items.length && <p className="text-center text-slate-400 py-8">Tidak ada notifikasi</p>}
      </div>
    </div>
  );
}
