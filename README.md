# SAMBAT - Posbakum Online

**Sahabat Masyarakat Dalam Bantuan Hukum Terpercaya**

Aplikasi konsultasi hukum online dengan ticketing system, knowledge base auto-reply, feedback IKM, dan analytics dashboard.

## Fitur Utama

### Masyarakat (Mobile Web)
- Registrasi & login dengan NIK
- Form konsultasi online + upload dokumen
- Tracking status tiket (SAM-YYYYMMDD-XXXX)
- Auto-reply Knowledge Base untuk pertanyaan umum
- Rating & feedback setelah konsultasi selesai
- Permohonan bantuan dokumen hukum
- Direktori OBH terakreditasi
- Integrasi WhatsApp & Zoom link

### Admin/Petugas (Dashboard PC)
- Notifikasi tiket baru
- Manajemen tiket (balas, ubah status)
- CRUD Knowledge Base templates
- Manajemen permohonan dokumen
- Direktori OBH
- Analytics & laporan kinerja (IKM, auto-reply rate, waktu respon)
- Manajemen pengguna

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React + Vite + PWA + TailwindCSS + Lucide + react-hot-toast |
| Backend | Express.js + MySQL |
| Auth | JWT + bcrypt |

## Instalasi

### 1. Database

```bash
mysql -u root -p < backend/sql/database.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env sesuai konfigurasi MySQL Anda
npm install
npm run dev
```

API berjalan di `https://api.kingcreativestudio.my.id/posbakum`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Web berjalan di `http://localhost:5173`

## Akun Demo

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@posbakum.local | admin123 |
| Petugas | petugas@posbakum.local | admin123 |

## Struktur Project

```
posbakum/
├── backend/
│   ├── server.js          # API server tunggal
│   ├── sql/database.sql   # Schema + sample data
│   ├── uploads-posbakum/  # File upload konsultasi
│   └── .env
├── frontend/
│   └── src/
│       ├── components/    # UI reusable
│       ├── pages/         # Public, citizen, admin
│       ├── hooks/         # useDebounce, usePagination
│       └── utils/         # api, endpoints, format
└── README.md
```

## API Endpoints

- `POST /api/auth/register` - Registrasi masyarakat
- `POST /api/auth/login` - Login (NIK atau email)
- `POST /api/tickets` - Buat tiket konsultasi (auto KB match)
- `GET /api/tickets/track/:number` - Tracking publik
- `GET /api/analytics/dashboard` - Dashboard admin
- `GET /api/obh` - Direktori OBH
- `POST /api/feedback` - Rating IKM

Semua GET list support: `?page=1&limit=10&search=...&sort=...&filter=...`

## Environment Variables

```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=posbakum
JWT_SECRET=your_secret
WA_CONTACT=6281234567890
ZOOM_LINK=https://zoom.us/j/posbakum
```

## Production Build

```bash
cd frontend && npm run build
cd backend && npm start
```

Serve `frontend/dist` via nginx atau static middleware Express.
# posbakum
