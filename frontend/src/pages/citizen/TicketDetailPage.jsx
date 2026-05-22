import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, Star, ExternalLink, MessageCircle, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/utils/format';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchTicket = () => {
    api.get(API_ENDPOINTS.TICKETS.DETAIL(id))
      .then((res) => setTicket(res.data.data))
      .catch(() => toast.error('Tiket tidak ditemukan'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user) fetchTicket(); }, [id, user]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(API_ENDPOINTS.TICKETS.REPLY(id), { message: reply });
      setReply('');
      fetchTicket();
      toast.success('Balasan terkirim');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    } finally {
      setSending(false);
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error('Pilih rating');
    try {
      await api.post(API_ENDPOINTS.FEEDBACK.CREATE, { ticket_id: Number(id), rating, comment });
      toast.success('Terima kasih atas penilaian Anda');
      fetchTicket();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  if (!user) return <Navigate to="/login" />;
  if (loading) return <LoadingSpinner />;
  if (!ticket) return <p className="p-8 text-center">Tiket tidak ditemukan</p>;

  const canRate = ['answered', 'closed', 'auto_answered'].includes(ticket.status) && !ticket.feedback;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/dashboard" className="text-sm text-primary-700">← Kembali</Link>
      <div className="card mt-4">
        <div className="flex flex-wrap justify-between gap-2">
          <div>
            <p className="text-sm text-slate-500">Tiket</p>
            <h1 className="text-xl font-bold text-primary-800">{ticket.ticket_number}</h1>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
        <h2 className="mt-3 font-semibold">{ticket.subject}</h2>
        <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{ticket.question}</p>
        <p className="mt-2 text-xs text-slate-400">{formatDate(ticket.created_at)}</p>

        {(ticket.wa_link || ticket.zoom_link) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {ticket.contact_method === 'chat' && ticket.wa_link && (
              <a href={ticket.wa_link} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
            {ticket.contact_method === 'video' && ticket.zoom_link && (
              <a href={ticket.zoom_link} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
                <Video size={16} /> Video Call <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="font-semibold">Percakapan</h3>
        {ticket.replies?.map((r) => (
          <div key={r.id} className={`rounded-lg p-4 text-sm ${r.is_staff || r.is_auto ? 'bg-primary-50 border-l-4 border-primary-500' : 'bg-slate-50'}`}>
            <p className="text-xs text-slate-500 mb-1">
              {r.is_auto ? 'Jawaban Otomatis' : r.is_staff ? 'Petugas' : 'Anda'} • {formatDate(r.created_at)}
            </p>
            <p className="whitespace-pre-wrap">{r.message}</p>
          </div>
        ))}
      </div>

      {ticket.status !== 'closed' && (
        <form onSubmit={handleReply} className="card mt-4">
          <textarea className="input-field" rows={3} placeholder="Tulis balasan..." value={reply} onChange={(e) => setReply(e.target.value)} />
          <button type="submit" disabled={sending} className="btn-primary mt-2"><Send size={16} /> Kirim</button>
        </form>
      )}

      {canRate && (
        <form onSubmit={handleFeedback} className="card mt-4">
          <h3 className="flex items-center gap-2 font-semibold"><Star size={18} className="text-gold-500" /> Beri Penilaian (IKM)</h3>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)}
                className={`text-2xl ${n <= rating ? 'text-gold-500' : 'text-slate-300'}`}>★</button>
            ))}
          </div>
          <textarea className="input-field mt-3" rows={2} placeholder="Komentar (opsional)" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button type="submit" className="btn-primary mt-2">Kirim Penilaian</button>
        </form>
      )}

      {ticket.feedback && (
        <div className="card mt-4 text-sm">
          <p>Penilaian Anda: {'★'.repeat(ticket.feedback.rating)}{'☆'.repeat(5 - ticket.feedback.rating)}</p>
          {ticket.feedback.comment && <p className="mt-1 text-slate-500">{ticket.feedback.comment}</p>}
        </div>
      )}
    </div>
  );
}
