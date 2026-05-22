import { useState, useEffect } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function FAQPage() {
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(API_ENDPOINTS.KNOWLEDGE_BASE.LIST, { params: { limit: 50 } })
      .then((res) => setItems(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">FAQ / Knowledge Base</h1>
      <p className="mt-1 text-slate-500">Pertanyaan umum yang dijawab otomatis oleh sistem</p>
      {loading ? <LoadingSpinner /> : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card !p-0 overflow-hidden">
              <button className="flex w-full items-center justify-between p-4 text-left" onClick={() => setOpenId(openId === item.id ? null : item.id)}>
                <div className="flex items-center gap-3">
                  <BookOpen size={18} className="text-primary-600 shrink-0" />
                  <span className="font-medium">{item.title}</span>
                </div>
                <ChevronDown size={18} className={`transition ${openId === item.id ? 'rotate-180' : ''}`} />
              </button>
              {openId === item.id && (
                <div className="border-t px-4 pb-4 text-sm text-slate-600 whitespace-pre-wrap">
                  <KBDetail id={item.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KBDetail({ id }) {
  const [content, setContent] = useState('');
  useEffect(() => {
    api.get(API_ENDPOINTS.KNOWLEDGE_BASE.DETAIL(id)).then((res) => setContent(res.data.data.content));
  }, [id]);
  return <p className="pt-3">{content || 'Memuat...'}</p>;
}
