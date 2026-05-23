import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, FileText, Building2, Search, Clock, Star, Shield, ArrowRight, MessageCircle, Video } from 'lucide-react';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';
import berakhlakImg from '@/assets/berakhlak.jpeg';
import menpisoptimaImg from '@/assets/menpisoptima.jpeg';

const features = [
  { icon: MessageSquare, title: 'Konsultasi Online', desc: 'Ajukan pertanyaan hukum, dapatkan jawaban dengan nomor tiket terlacak.', to: '/konsultasi', action: 'Ajukan Konsultasi' },
  { icon: Clock, title: 'Respon Cepat', desc: 'Knowledge Base otomatis menjawab 70% pertanyaan umum dalam hitungan detik.', to: '/faq', action: 'Lihat FAQ' },
  { icon: Search, title: 'Tracking Tiket', desc: 'Pantau status konsultasi: menunggu, diproses, dijawab, selesai.', to: '/tracking', action: 'Lacak Tiket' },
  { icon: FileText, title: 'Bantuan Dokumen', desc: 'Bantuan penyusunan gugatan cerai, perwalian, adopsi, dan dokumen lainnya.', to: '/dokumen', action: 'Ajukan Dokumen' },
  { icon: Building2, title: 'Direktori OBH', desc: 'Temukan Lembaga Bantuan Hukum terakreditasi untuk pendampingan sidang.', to: '/obh', action: 'Cari OBH' },
  { icon: Star, title: 'Feedback IKM', desc: 'Nilai layanan untuk perbaikan berkelanjutan Posbakum.', to: '/dashboard', action: 'Dashboard Saya' },
];

export default function HomePage() {
  const [contact, setContact] = useState({ wa_link: '', zoom_link: '' });

  useEffect(() => {
    api.get(API_ENDPOINTS.SETTINGS.GET)
      .then((res) => setContact(res.data.data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-gold-500/20 px-3 py-1 text-xs font-medium text-gold-300">Posbakum Online</span>
            <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
              SAMBAT
            </h1>
            <p className="mt-2 text-lg text-gold-300 md:text-xl">Sahabat Masyarakat Dalam Bantuan Hukum Terpercaya</p>
            <p className="mt-4 text-primary-100 md:text-lg">
              Konsultasi hukum gratis, tracking tiket, jawaban otomatis, dan bantuan dokumen langsung dari browser HP Anda tanpa perlu install aplikasi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/konsultasi" className="btn-primary !bg-gold-500 !text-primary-900 hover:!bg-gold-400">Ajukan Konsultasi</Link>
              <Link to="/tracking" className="btn-header-outline">Lacak Tiket</Link>
            </div>
            {(contact.wa_link || contact.zoom_link) && (
              <div className="mt-6 flex flex-wrap gap-3">
                {contact.wa_link && (
                  <a href={contact.wa_link} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-500">
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                )}
                {contact.zoom_link && (
                  <a href={contact.zoom_link} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500">
                    <Video size={18} /> Video Call
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl justify-center px-4 py-6">
          <img
            src={berakhlakImg}
            alt="BerAKHLAK - Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif"
            className="h-10 w-auto object-contain md:h-12"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { value: '<15 menit', label: 'Target Respon', icon: Clock },
            { value: '70%', label: 'Auto-Reply KB', icon: Shield },
            { value: '24/7', label: 'Akses Online', icon: MessageSquare },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className="rounded-lg bg-primary-50 p-3"><Icon className="h-6 w-6 text-primary-700" /></div>
              <div>
                <p className="text-2xl font-bold text-primary-800">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">Fitur Unggulan</h2>
          <p className="mt-2 text-center text-slate-500">Inovasi ticketing, knowledge base, dan feedback loop</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc, to, action }) => (
              <div key={title} className="card flex flex-col hover:border-primary-200 hover:shadow-md transition">
                <Icon className="h-8 w-8 text-primary-600" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 flex-1 text-sm text-slate-500">{desc}</p>
                <Link
                  to={to}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:text-primary-800"
                >
                  {action}
                  <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="card bg-primary-50 text-center">
          <h2 className="text-xl font-bold text-primary-900">Butuh Bantuan Hukum?</h2>
          <p className="mt-2 text-slate-600">Daftar gratis dengan NIK, ajukan konsultasi, dan pantau statusnya kapan saja.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn-primary">Daftar Sekarang</Link>
            <Link to="/layanan" className="btn-secondary">Lihat Layanan</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Mahkamah Agung RI</p>
          <p className="max-w-2xl text-sm font-semibold leading-snug text-slate-800 md:text-base">
            Pelatihan Kepemimpinan Pengawas (PKP) Angkatan IV Tahun 2026 Mahkamah Agung RI
          </p>
          <img
            src={menpisoptimaImg}
            alt="MenpimOptima - Optimalkan Pembelajaran Interaktif, Menyenangkan, dan Adaptif"
            className="mt-2 h-12 w-auto object-contain md:h-14"
          />
          <p className="mt-4 text-sm text-slate-500">
            Dikembangkan oleh <span className="font-medium text-slate-700">Imanuel Bambang Nugroho</span>
          </p>
        </div>
      </section>
    </div>
  );
}
