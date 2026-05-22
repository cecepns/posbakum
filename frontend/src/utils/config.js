/**
 * Konfigurasi URL API & upload.
 * Set di .env — tanpa proxy Vite.
 */
const trimSlash = (url) => (url || '').replace(/\/$/, '');

export const API_BASE_URL = trimSlash(
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
);

export const UPLOAD_BASE_URL = trimSlash(
  import.meta.env.VITE_UPLOAD_URL || 'http://localhost:5001/uploads'
);

/** URL lengkap file upload dari backend (nama file atau path /uploads/...) */
export const getUploadUrl = (filename) => {
  if (!filename) return '';
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
  const name = String(filename).replace(/^\/?uploads\//, '');
  return `${UPLOAD_BASE_URL}/${name}`;
};
