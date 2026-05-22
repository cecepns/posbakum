export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export const formatStatus = (status) => {
  const map = {
    open: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
    auto_answered: { label: 'Dijawab Otomatis', color: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'Diproses', color: 'bg-orange-100 text-orange-800' },
    answered: { label: 'Dijawab', color: 'bg-green-100 text-green-800' },
    closed: { label: 'Selesai', color: 'bg-slate-100 text-slate-800' },
    submitted: { label: 'Diajukan', color: 'bg-yellow-100 text-yellow-800' },
    drafting: { label: 'Penyusunan', color: 'bg-orange-100 text-orange-800' },
    review: { label: 'Review', color: 'bg-blue-100 text-blue-800' },
    approved: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
    completed: { label: 'Selesai', color: 'bg-slate-100 text-slate-800' },
    rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-800' },
  };
  return map[status] || { label: status, color: 'bg-slate-100 text-slate-800' };
};

export const DOC_TYPES = {
  gugatan_cerai: 'Gugatan Cerai',
  perubahan_nama: 'Perubahan Nama',
  perwalian: 'Perwalian',
  penetapan_kematian: 'Penetapan Kematian',
  pengampuan: 'Pengampuan',
  adopsi: 'Adopsi (Pengangkatan Anak)',
  lainnya: 'Dokumen Lainnya',
};

export const SERVICE_TYPES = {
  konsultasi: 'Konsultasi Online',
  informasi: 'Informasi Prosedur',
  advis: 'Advis Hukum',
  perkara: 'Informasi Perkara',
  dokumen: 'Bantuan Dokumen',
};
