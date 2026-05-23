import { Link } from 'react-router-dom';
import { MessageSquare, FileText, Building2, Info, Gavel, FileCheck } from 'lucide-react';
import { useLayananCatalog } from '@/hooks/useLayananCatalog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const groupMeta = {
  layanan_1: {
    title: 'Layanan 1: Informasi, Konsultasi & Advis Hukum',
    icon: MessageSquare,
    link: '/konsultasi',
  },
  layanan_2: {
    title: 'Layanan 2: Bantuan Pembuatan Dokumen Hukum',
    icon: FileText,
    link: '/dokumen',
  },
};

const layanan3 = {
  title: 'Layanan 3: Direktori OBH & Pendampingan',
  icon: Building2,
  items: [
    { name: 'Direktori OBH Resmi', desc: 'LBH terakreditasi UU No. 16/2011', link: '/obh' },
    { name: 'Rekomendasi OBH', desc: 'Berdasarkan lokasi dan jenis perkara', link: '/obh' },
    { name: 'Pengalihan/Referensi', desc: 'Pendampingan sidang via OBH mitra PN', link: '/obh' },
  ],
};

export default function LayananPage() {
  const { items: layanan1, loading: loading1 } = useLayananCatalog('layanan_1');
  const { items: layanan2, loading: loading2 } = useLayananCatalog('layanan_2');

  const buildSections = () => {
    const sections = [];
    for (const group of ['layanan_1', 'layanan_2']) {
      const meta = groupMeta[group];
      const items = group === 'layanan_1' ? layanan1 : layanan2;
      sections.push({
        ...meta,
        items: items.map((i) => ({
          name: i.name,
          desc: i.description || '',
          link: meta.link,
        })),
      });
    }
    sections.push({
      ...layanan3,
    });
    return sections;
  };

  const sections = buildSections();
  const isLoading = loading1 || loading2;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Layanan Posbakum</h1>
      <p className="mt-1 text-slate-500">Tiga layanan utama bantuan hukum gratis</p>
      {isLoading ? <LoadingSpinner /> : (
        <div className="mt-8 space-y-8">
          {sections.map(({ title, icon: Icon, items }) => (
            <div key={title} className="card">
              <div className="flex items-center gap-3 border-b pb-4">
                <Icon className="h-7 w-7 text-primary-700" />
                <h2 className="text-lg font-semibold">{title}</h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                  <Link key={item.name} to={item.link} className="rounded-lg border p-4 transition hover:border-primary-300 hover:bg-primary-50">
                    <h3 className="font-medium text-primary-800">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Info, text: 'Waktu respons formulir: maks 1×24 jam' },
          { icon: Gavel, text: 'Chat: direspon saat jam kerja' },
          { icon: FileCheck, text: 'Online via formulir, WA, atau Zoom' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm">
            <Icon size={18} className="text-primary-600 shrink-0" /> {text}
          </div>
        ))}
      </div>
    </div>
  );
}
