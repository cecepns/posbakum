import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/utils/format';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTicket = () => {
    api.get(API_ENDPOINTS.TICKETS.DETAIL(id))
      .then((res) => setTicket(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTicket(); }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    try {
      await api.post(API_ENDPOINTS.TICKETS.REPLY(id), { message: reply });
      setReply('');
      fetchTicket();
      toast.success('Balasan terkirim');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const updateStatus = async (status) => {
    try {
      await api.patch(API_ENDPOINTS.TICKETS.STATUS(id), { status });
      fetchTicket();
      toast.success('Status diperbarui');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const handleDelete = () => {
    toast((t) => (
      <span className="flex flex-col gap-2">
        Hapus tiket ini secara permanen?
        <span className="flex gap-2">
          <button onClick={async () => {
            try {
              await api.delete(API_ENDPOINTS.TICKETS.DELETE(id));
              toast.dismiss(t.id);
              toast.success('Tiket dihapus');
              navigate('/admin/tickets');
            } catch (err) {
              toast.error(err.response?.data?.message || 'Gagal menghapus');
            }
          }} className="btn-danger text-xs !py-1">Ya, Hapus</button>
          <button onClick={() => toast.dismiss(t.id)} className="btn-secondary text-xs !py-1">Batal</button>
        </span>
      </span>
    ), { duration: 10000 });
  };

  if (loading) return <LoadingSpinner />;
  if (!ticket) return <p>Tiket tidak ditemukan</p>;

  return (
    <div>
      <Link to="/admin/tickets" className="text-sm text-primary-700">← Kembali</Link>
      <div className="card mt-4">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{ticket.ticket_number}</h1>
            <p className="text-slate-500">{ticket.user_name} • {ticket.user_phone} • NIK: {ticket.nik}</p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
        <h2 className="mt-3 font-semibold">{ticket.subject}</h2>
        <p className="mt-2 text-sm whitespace-pre-wrap">{ticket.question}</p>
        {ticket.is_auto_replied && <p className="mt-2 text-sm text-blue-600">Auto-reply via KB: {ticket.kb_title}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {['in_progress', 'answered', 'closed'].map((s) => (
            <button key={s} onClick={() => updateStatus(s)} className="btn-secondary text-xs capitalize">
              {s.replace('_', ' ')}
            </button>
          ))}
          {ticket.status === 'closed' && (
            <button onClick={handleDelete} className="btn-danger text-xs inline-flex items-center gap-1">
              <Trash2 size={14} /> Hapus Tiket
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {ticket.replies?.map((r) => (
          <div key={r.id} className={`rounded-lg p-4 text-sm ${r.is_staff || r.is_auto ? 'bg-primary-50' : 'bg-slate-50'}`}>
            <p className="text-xs text-slate-500">{r.author_name || 'Sistem'} • {formatDate(r.created_at)}</p>
            <p className="whitespace-pre-wrap mt-1">{r.message}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleReply} className="card mt-4">
        <textarea className="input-field" rows={4} placeholder="Balasan petugas..." value={reply} onChange={(e) => setReply(e.target.value)} />
        <button type="submit" className="btn-primary mt-2"><Send size={16} /> Kirim Balasan</button>
      </form>

      {ticket.feedback && (
        <div className="card mt-4 text-sm">
          <p>Rating IKM: {'★'.repeat(ticket.feedback.rating)} ({ticket.feedback.rating}/5)</p>
          {ticket.feedback.comment && <p className="mt-1">{ticket.feedback.comment}</p>}
        </div>
      )}
    </div>
  );
}
