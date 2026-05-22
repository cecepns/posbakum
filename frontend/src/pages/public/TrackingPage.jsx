import { useState } from 'react';
import { Search, MessageSquare } from 'lucide-react';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/utils/format';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function TrackingPage() {
  const [ticketNumber, setTicketNumber] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!ticketNumber.trim()) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await api.get(API_ENDPOINTS.TICKETS.TRACK(ticketNumber.trim()));
      setData(res.data.data);
    } catch {
      setError('Tiket tidak ditemukan. Periksa nomor tiket Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Lacak Status Tiket</h1>
      <p className="mt-1 text-slate-500">Masukkan nomor tiket (contoh: SAM-20260521-1234)</p>

      <form onSubmit={handleTrack} className="card mt-6">
        <div className="flex gap-2">
          <input className="input-field flex-1" placeholder="Nomor tiket..." value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)} />
          <button type="submit" className="btn-primary"><Search size={16} /> Lacak</button>
        </div>
      </form>

      {loading && <LoadingSpinner />}
      {error && <p className="mt-4 text-center text-red-600">{error}</p>}

      {data && (
        <div className="card mt-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm text-slate-500">Nomor Tiket</p>
              <p className="text-lg font-bold text-primary-800">{data.ticket_number}</p>
            </div>
            <StatusBadge status={data.status} />
          </div>
          <div>
            <p className="font-medium">{data.subject}</p>
            <p className="text-sm text-slate-500">Pemohon: {data.user_name} • {formatDate(data.created_at)}</p>
          </div>
          {data.is_auto_replied && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              Pertanyaan ini telah dijawab otomatis oleh Knowledge Base
            </div>
          )}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold"><MessageSquare size={18} /> Riwayat Balasan</h3>
            {data.replies?.length ? data.replies.map((r, i) => (
              <div key={i} className={`rounded-lg p-3 text-sm ${r.is_staff || r.is_auto ? 'bg-primary-50 border-l-4 border-primary-500' : 'bg-slate-50'}`}>
                <p className="text-xs text-slate-500 mb-1">
                  {r.is_auto ? 'Jawaban Otomatis (KB)' : r.is_staff ? 'Petugas Posbakum' : 'Anda'} • {formatDate(r.created_at)}
                </p>
                <p className="whitespace-pre-wrap">{r.message}</p>
              </div>
            )) : <p className="text-sm text-slate-400">Belum ada balasan</p>}
          </div>
          {data.feedback && (
            <p className="text-sm text-slate-500">Rating: {'⭐'.repeat(data.feedback.rating)}</p>
          )}
        </div>
      )}
    </div>
  );
}
