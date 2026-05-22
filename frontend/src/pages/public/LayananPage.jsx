import { Link } from 'react-router-dom';
import { MessageSquare, FileText, Building2, Info, Gavel, FileCheck } from 'lucide-react';

const layanan = [
  {
    title: 'Layanan 1: Informasi, Konsultasi & Advis Hukum',
    icon: MessageSquare,
    items: [
      { name: 'Konsultasi Online Gratis', desc: 'Chat/formulir dengan petugas Posbakum', link: '/konsultasi' },
      { name: 'Informasi Prosedur Perkara', desc: 'Tahapan berperkara, syarat dokumen, biaya', link: '/konsultasi' },
      { name: 'Advis Hukum', desc: 'Analisis awal posisi hukum pemohon', link: '/konsultasi' },
      { name: 'Informasi Perkara Real-time', desc: 'Cek posisi perkara Anda', link: '/konsultasi' },
    ],
  },
  {
    title: 'Layanan 2: Bantuan Pembuatan Dokumen Hukum',
    icon: FileText,
    items: [
      { name: 'Gugatan Cerai', desc: 'Cerai talak / cerai gugat', link: '/dokumen' },
      { name: 'Perubahan Nama', desc: 'Perbaikan penulisan di KK, KTP, Akta', link: '/dokumen' },
      { name: 'Perwalian & Pengampuan', desc: 'Perlindungan anak dan disabilitas', link: '/dokumen' },
      { name: 'Penetapan Kematian & Adopsi', desc: 'Akta kematian, pengangkatan anak', link: '/dokumen' },
    ],
  },
  {
    title: 'Layanan 3: Direktori OBH & Pendampingan',
    icon: Building2,
    items: [
      { name: 'Direktori OBH Resmi', desc: 'LBH terakreditasi UU No. 16/2011', link: '/obh' },
      { name: 'Rekomendasi OBH', desc: 'Berdasarkan lokasi dan jenis perkara', link: '/obh' },
      { name: 'Pengalihan/Referensi', desc: 'Pendampingan sidang via OBH mitra PN', link: '/obh' },
    ],
  },
];

export default function LayananPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Layanan Posbakum</h1>
      <p className="mt-1 text-slate-500">Tiga layanan utama bantuan hukum gratis</p>
      <div className="mt-8 space-y-8">
        {layanan.map(({ title, icon: Icon, items }) => (
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
