require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;

const uploadDir = path.resolve(__dirname, process.env.UPLOAD_DIR || 'uploads-posbakum');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadDir));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'posbakum',
  waitForConnections: true,
  connectionLimit: 10,
});

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = /\.(pdf|jpg|jpeg|png|doc|docx)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Tipe file tidak diizinkan'));
  },
});

// --- Helpers ---
const sanitize = (str) => (typeof str === 'string' ? str.trim().slice(0, 5000) : str);

const paginate = (page, limit, total) => ({
  page: Number(page),
  limit: Number(limit),
  total,
  totalPages: Math.ceil(total / limit) || 1,
});

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const [rows] = await pool.query('SELECT id, nik, name, email, phone, role FROM users WHERE id = ? AND is_active = 1', [decoded.id]);
    if (!rows.length) return res.status(401).json({ success: false, message: 'User tidak valid' });
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!['admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  }
  next();
};

const superAdminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Hanya super admin yang dapat melakukan aksi ini' });
  }
  next();
};

const parseJsonField = (val, fallback = null) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

const getSiteSettings = async () => {
  const [rows] = await pool.query('SELECT setting_key, setting_value FROM site_settings');
  const settings = {
    wa_number: process.env.WA_CONTACT || '6281234567890',
    zoom_link: process.env.ZOOM_LINK || 'https://zoom.us',
    sk_decree_number: '',
  };
  for (const row of rows) settings[row.setting_key] = row.setting_value;
  return settings;
};

let hasApplicantFilesColumn = null;
const ensureApplicantFilesColumn = async () => {
  if (hasApplicantFilesColumn === true) return true;
  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM document_requests LIKE ?', ['applicant_files']);
    if (cols.length) {
      hasApplicantFilesColumn = true;
      return true;
    }
    await pool.query('ALTER TABLE document_requests ADD COLUMN applicant_files JSON NULL');
    hasApplicantFilesColumn = true;
    return true;
  } catch (err) {
    console.warn('document_requests.applicant_files migration:', err.message);
    hasApplicantFilesColumn = false;
    return false;
  }
};

const DOC_STATUS_LABELS = {
  submitted: 'Diajukan',
  drafting: 'Sedang disusun',
  review: 'Dalam review',
  approved: 'Disetujui',
  completed: 'Selesai',
  rejected: 'Ditolak',
};

const generateTicketNumber = () => {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SAM-${ymd}-${rand}`;
};

const generateRequestNumber = () => {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `DOC-${Date.now().toString().slice(-6)}-${rand}`;
};

// Auto-reply knowledge base matcher
const findKnowledgeBaseMatch = async (question) => {
  const [rows] = await pool.query(
    'SELECT * FROM knowledge_base WHERE is_active = 1 ORDER BY use_count DESC'
  );
  const q = question.toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const kb of rows) {
    const keywords = kb.keywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
    let score = 0;
    for (const kw of keywords) {
      if (q.includes(kw)) score += kw.length > 4 ? 2 : 1;
    }
    if (score > bestScore && score >= 2) {
      bestScore = score;
      best = kb;
    }
  }
  return best;
};

// Seed admin password on first run
const seedAdmin = async () => {
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    `UPDATE users SET password = ? WHERE email IN ('admin@posbakum.local', 'petugas@posbakum.local')`,
    [hash]
  ).catch(() => {});
};

const ensureSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS layanan_catalog (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      layanan_group ENUM('layanan_1', 'layanan_2') NOT NULL,
      description TEXT,
      sort_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `).catch(() => {});

  await pool.query(
    `INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES (?, ?), (?, ?), (?, ?)`,
    [
      'wa_number', process.env.WA_CONTACT || '6281234567890',
      'zoom_link', process.env.ZOOM_LINK || 'https://zoom.us',
      'sk_decree_number', '',
    ]
  ).catch(() => {});

  await ensureApplicantFilesColumn();

  const seeds = [
    ['Konsultasi Online', 'konsultasi', 'layanan_1', 'Chat/formulir dengan petugas Posbakum', 1],
    ['Informasi Prosedur', 'informasi', 'layanan_1', 'Tahapan berperkara, syarat dokumen, biaya', 2],
    ['Advis Hukum', 'advis', 'layanan_1', 'Analisis awal posisi hukum pemohon', 3],
    ['Informasi Perkara', 'perkara', 'layanan_1', 'Cek posisi perkara Anda', 4],
    ['Gugatan Cerai', 'gugatan_cerai', 'layanan_2', 'Cerai talak / cerai gugat', 1],
    ['Perubahan Nama', 'perubahan_nama', 'layanan_2', 'Perbaikan penulisan di KK, KTP, Akta', 2],
    ['Perwalian', 'perwalian', 'layanan_2', 'Perlindungan anak dan disabilitas', 3],
    ['Penetapan Kematian', 'penetapan_kematian', 'layanan_2', 'Akta kematian', 4],
    ['Pengampuan', 'pengampuan', 'layanan_2', 'Pengampuan warga', 5],
    ['Adopsi', 'adopsi', 'layanan_2', 'Pengangkatan anak', 6],
    ['Dokumen Lainnya', 'lainnya', 'layanan_2', 'Jenis permohonan lainnya', 7],
  ];
  for (const row of seeds) {
    await pool.query(
      'INSERT IGNORE INTO layanan_catalog (name, slug, layanan_group, description, sort_order) VALUES (?, ?, ?, ?, ?)',
      row
    ).catch(() => {});
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS map_locations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      location_type VARCHAR(100) DEFAULT 'pengadilan',
      address TEXT,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      distance_km DECIMAL(8, 2) NULL,
      distance_info VARCHAR(255) NULL,
      case_type VARCHAR(150) NULL,
      case_fee VARCHAR(255) NOT NULL,
      fee_notes TEXT NULL,
      description TEXT NULL,
      sort_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `).catch(() => {});

  const mapSeeds = [
    ['Posbakum PN Pekalongan', 'posbakum', 'Kompleks Pengadilan Negeri Pekalongan', -6.8886, 109.675, 0, 'Lokasi referensi layanan', 'Semua perkara', 'Gratis (SKTM)', 'Bantuan hukum gratis bagi yang tidak mampu dengan SKTM dari kelurahan/desa.', 'Titik layanan Posbakum di Pengadilan Negeri Pekalongan.', 1],
    ['Pengadilan Negeri Pekalongan', 'pengadilan', 'Jl. Merdeka, Pekalongan', -6.8892, 109.6765, 0.5, '±500 m dari Posbakum', 'Perdata & Pidana Umum', 'Sesuai PERMA / SK biaya', 'Biaya perkara mengikuti ketentuan Mahkamah Agung.', 'Pengadilan tingkat pertama untuk wilayah Pekalongan.', 2],
    ['Pengadilan Agama Pekalongan', 'pengadilan', 'Pekalongan', -6.901, 109.662, 2.5, '±2,5 km dari Posbakum', 'Cerai Talak & Perkara Agama', 'Sesuai PERMA PA', 'Cerai talak dan perkara di bawah kewenangan PA.', 'Klik marker untuk detail jarak dan tarif.', 3],
  ];
  for (const row of mapSeeds) {
    const [exists] = await pool.query('SELECT id FROM map_locations WHERE name = ? LIMIT 1', [row[0]]).catch(() => [[]]);
    if (!exists?.length) {
      await pool.query(
        `INSERT INTO map_locations (name, location_type, address, latitude, longitude, distance_km, distance_info, case_type, case_fee, fee_notes, description, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      ).catch(() => {});
    }
  }
};

// --- AUTH ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nik, name, email, phone, password, address } = req.body;
    if (!nik || !name || !email || !password) {
      return res.status(400).json({ success: false, message: 'NIK, nama, email, dan password wajib diisi' });
    }
    if (!/^\d{16}$/.test(nik)) {
      return res.status(400).json({ success: false, message: 'NIK harus 16 digit angka' });
    }
    const [existing] = await pool.query('SELECT id FROM users WHERE nik = ? OR email = ?', [nik, email]);
    if (existing.length) {
      return res.status(400).json({ success: false, message: 'NIK atau email sudah terdaftar' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (nik, name, email, phone, password, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [sanitize(nik), sanitize(name), sanitize(email), sanitize(phone), hashed, sanitize(address), 'citizen']
    );
    const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES || '7d' });
    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: { id: result.insertId, nik, name, email, role: 'citizen' },
      token,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'NIK/email dan password wajib diisi' });
    }
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE (nik = ? OR email = ?) AND is_active = 1',
      [sanitize(identifier), sanitize(identifier)]
    );
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password))) {
      return res.status(401).json({ success: false, message: 'NIK/email atau password salah' });
    }
    const user = rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES || '7d' });
    res.json({
      success: true,
      data: { id: user.id, nik: user.nik, name: user.name, email: user.email, phone: user.phone, role: user.role },
      token,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ success: true, data: req.user });
});

// --- KNOWLEDGE BASE ---
app.get('/api/knowledge-base', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', sort = 'title', order = 'asc' } = req.query;
    const offset = (page - 1) * limit;
    const allowedSort = ['title', 'category', 'use_count', 'created_at'];
    const sortCol = allowedSort.includes(sort) ? sort : 'title';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

    let where = 'WHERE is_active = 1';
    const params = [];
    if (search) {
      where += ' AND (title LIKE ? OR keywords LIKE ? OR content LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (category) {
      where += ' AND category = ?';
      params.push(category);
    }

    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM knowledge_base ${where}`, params);
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT id, title, category, keywords, LEFT(content, 200) as excerpt, view_count, use_count, is_active, created_at
       FROM knowledge_base ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    res.json({ success: true, data: rows, pagination: paginate(page, limit, total) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/knowledge-base/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM knowledge_base WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Artikel tidak ditemukan' });
    await pool.query('UPDATE knowledge_base SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/knowledge-base', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, category, keywords, content, is_active = 1 } = req.body;
    if (!title || !category || !keywords || !content) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }
    const [result] = await pool.query(
      'INSERT INTO knowledge_base (title, category, keywords, content, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [sanitize(title), sanitize(category), sanitize(keywords), sanitize(content), is_active, req.user.id]
    );
    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Knowledge base ditambahkan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/knowledge-base/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, category, keywords, content, is_active } = req.body;
    await pool.query(
      'UPDATE knowledge_base SET title=?, category=?, keywords=?, content=?, is_active=? WHERE id=?',
      [sanitize(title), sanitize(category), sanitize(keywords), sanitize(content), is_active ?? 1, req.params.id]
    );
    res.json({ success: true, message: 'Knowledge base diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/knowledge-base/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE knowledge_base SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Knowledge base dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- LAYANAN CATALOG ---
app.get('/api/layanan-catalog', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', group = '', include_inactive = '' } = req.query;
    const offset = (page - 1) * limit;
    let where = include_inactive === 'true' ? 'WHERE 1=1' : 'WHERE is_active = 1';
    const params = [];
    if (group) {
      where += ' AND layanan_group = ?';
      params.push(group);
    }
    if (search) {
      where += ' AND (name LIKE ? OR slug LIKE ? OR description LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM layanan_catalog ${where}`, params);
    const [rows] = await pool.query(
      `SELECT * FROM layanan_catalog ${where} ORDER BY sort_order ASC, name ASC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    res.json({ success: true, data: rows, pagination: paginate(page, limit, countRows[0].total) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/layanan-catalog', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, slug, layanan_group, description, sort_order = 0, is_active = 1 } = req.body;
    if (!name || !slug || !layanan_group) {
      return res.status(400).json({ success: false, message: 'Nama, slug, dan grup layanan wajib diisi' });
    }
    const [result] = await pool.query(
      'INSERT INTO layanan_catalog (name, slug, layanan_group, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [sanitize(name), sanitize(slug), layanan_group, sanitize(description), Number(sort_order), is_active ? 1 : 0]
    );
    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Jenis layanan ditambahkan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/layanan-catalog/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, slug, layanan_group, description, sort_order, is_active } = req.body;
    await pool.query(
      'UPDATE layanan_catalog SET name=?, slug=?, layanan_group=?, description=?, sort_order=?, is_active=? WHERE id=?',
      [sanitize(name), sanitize(slug), layanan_group, sanitize(description), Number(sort_order) || 0, is_active ? 1 : 0, req.params.id]
    );
    res.json({ success: true, message: 'Jenis layanan diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/layanan-catalog/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE layanan_catalog SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Jenis layanan dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- SITE SETTINGS ---
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getSiteSettings();
    res.json({
      success: true,
      data: {
        wa_number: settings.wa_number,
        zoom_link: settings.zoom_link,
        sk_decree_number: settings.sk_decree_number || '',
        wa_link: `https://wa.me/${String(settings.wa_number).replace(/\D/g, '')}?text=${encodeURIComponent('Halo Posbakum, saya ingin konsultasi hukum')}`,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/settings', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { wa_number, zoom_link, sk_decree_number } = req.body;
    if (wa_number !== undefined) {
      await pool.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['wa_number', sanitize(wa_number), sanitize(wa_number)]
      );
    }
    if (zoom_link !== undefined) {
      await pool.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['zoom_link', sanitize(zoom_link), sanitize(zoom_link)]
      );
    }
    if (sk_decree_number !== undefined) {
      await pool.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['sk_decree_number', sanitize(sk_decree_number), sanitize(sk_decree_number)]
      );
    }
    res.json({ success: true, message: 'Pengaturan disimpan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- TICKETS ---
app.post('/api/tickets', authMiddleware, upload.array('files', 5), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { subject, question, service_type, category, contact_method } = req.body;
    if (!subject || !question) {
      return res.status(400).json({ success: false, message: 'Subjek dan pertanyaan wajib diisi' });
    }

    const ticketNumber = generateTicketNumber();
    const settings = await getSiteSettings();
    const waContact = String(settings.wa_number || '').replace(/\D/g, '') || '6281234567890';
    const waLink = `https://wa.me/${waContact}?text=${encodeURIComponent(`Halo Posbakum, tiket ${ticketNumber}`)}`;
    const zoomLink = settings.zoom_link || 'https://zoom.us';

    const [result] = await conn.query(
      `INSERT INTO tickets (ticket_number, user_id, service_type, category, subject, question, contact_method, wa_link, zoom_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ticketNumber, req.user.id, service_type || 'konsultasi', sanitize(category), sanitize(subject), sanitize(question),
        'form', waLink, zoomLink]
    );
    const ticketId = result.insertId;

    if (req.files?.length) {
      for (const file of req.files) {
        await conn.query(
          'INSERT INTO ticket_attachments (ticket_id, filename, original_name, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
          [ticketId, file.filename, file.originalname, file.size, file.mimetype]
        );
      }
    }

    const kbMatch = await findKnowledgeBaseMatch(question);
    let autoReplied = false;

    if (kbMatch) {
      await conn.query(
        `UPDATE tickets SET status='auto_answered', is_auto_replied=1, kb_id=?, first_response_at=NOW() WHERE id=?`,
        [kbMatch.id, ticketId]
      );
      await conn.query(
        'INSERT INTO ticket_replies (ticket_id, user_id, message, is_staff, is_auto) VALUES (?, ?, ?, 1, 1)',
        [ticketId, req.user.id, kbMatch.content]
      );
      await conn.query('UPDATE knowledge_base SET use_count = use_count + 1 WHERE id = ?', [kbMatch.id]);
      autoReplied = true;
    }

    const [staffUsers] = await conn.query("SELECT id FROM users WHERE role IN ('admin','staff')");
    for (const staff of staffUsers) {
      await conn.query(
        'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
        [staff.id, 'Tiket Baru', `Tiket ${ticketNumber}: ${subject}`, 'ticket_new', ticketId, 'ticket']
      );
    }

    await conn.commit();
    res.status(201).json({
      success: true,
      message: autoReplied ? 'Pertanyaan dijawab otomatis dari Knowledge Base' : 'Tiket konsultasi berhasil dibuat',
      data: { id: ticketId, ticket_number: ticketNumber, auto_replied: autoReplied, kb_title: kbMatch?.title },
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

app.get('/api/tickets', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', sort = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    const isStaff = ['admin', 'staff'].includes(req.user.role);

    let where = isStaff ? 'WHERE 1=1' : 'WHERE t.user_id = ?';
    const params = isStaff ? [] : [req.user.id];

    if (search) {
      where += ' AND (t.ticket_number LIKE ? OR t.subject LIKE ? OR u.name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (status) {
      where += ' AND t.status = ?';
      params.push(status);
    }

    const allowedSort = { created_at: 't.created_at', ticket_number: 't.ticket_number', status: 't.status' };
    const sortCol = allowedSort[sort] || 't.created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM tickets t LEFT JOIN users u ON t.user_id = u.id ${where}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT t.*, u.name as user_name, u.phone as user_phone,
              s.name as assigned_name,
              (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) as reply_count
       FROM tickets t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users s ON t.assigned_to = s.id
       ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    res.json({ success: true, data: rows, pagination: paginate(page, limit, countRows[0].total) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/tickets/track/:ticketNumber', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.id, t.ticket_number, t.subject, t.status, t.is_auto_replied, t.created_at, t.first_response_at, t.closed_at,
              u.name as user_name
       FROM tickets t LEFT JOIN users u ON t.user_id = u.id
       WHERE t.ticket_number = ?`,
      [req.params.ticketNumber]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });

    const [replies] = await pool.query(
      `SELECT r.message, r.is_staff, r.is_auto, r.created_at, u.name
       FROM ticket_replies r LEFT JOIN users u ON r.user_id = u.id
       WHERE r.ticket_id = ? ORDER BY r.created_at ASC`,
      [rows[0].id]
    );

    const [feedback] = await pool.query('SELECT rating, comment FROM feedback WHERE ticket_id = ?', [rows[0].id]);

    res.json({
      success: true,
      data: { ...rows[0], replies, feedback: feedback[0] || null },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/tickets/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.nik,
              s.name as assigned_name, kb.title as kb_title
       FROM tickets t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users s ON t.assigned_to = s.id
       LEFT JOIN knowledge_base kb ON t.kb_id = kb.id
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });

    const ticket = rows[0];
    if (req.user.role === 'citizen' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    const [replies] = await pool.query(
      `SELECT r.*, u.name as author_name FROM ticket_replies r
       LEFT JOIN users u ON r.user_id = u.id WHERE r.ticket_id = ? ORDER BY r.created_at ASC`,
      [req.params.id]
    );
    const [attachments] = await pool.query('SELECT * FROM ticket_attachments WHERE ticket_id = ?', [req.params.id]);
    const [feedback] = await pool.query('SELECT * FROM feedback WHERE ticket_id = ?', [req.params.id]);

    res.json({ success: true, data: { ...ticket, replies, attachments, feedback: feedback[0] || null } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/tickets/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Pesan wajib diisi' });

    const [tickets] = await pool.query('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
    if (!tickets.length) return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });

    const ticket = tickets[0];
    const isStaff = ['admin', 'staff'].includes(req.user.role);
    if (!isStaff && ticket.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    await pool.query(
      'INSERT INTO ticket_replies (ticket_id, user_id, message, is_staff) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.id, sanitize(message), isStaff ? 1 : 0]
    );

    const newStatus = isStaff ? 'answered' : 'in_progress';
    const updates = { status: newStatus };
    if (isStaff && !ticket.first_response_at) {
      await pool.query(
        'UPDATE tickets SET status=?, first_response_at=NOW(), assigned_to=? WHERE id=?',
        [newStatus, req.user.id, req.params.id]
      );
    } else {
      await pool.query('UPDATE tickets SET status=? WHERE id=?', [newStatus, req.params.id]);
    }

    const notifyUserId = isStaff ? ticket.user_id : null;
    if (notifyUserId) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
        [notifyUserId, 'Balasan Tiket', `Tiket ${ticket.ticket_number} telah dibalas`, 'ticket_reply', ticket.id, 'ticket']
      );
    }

    res.json({ success: true, message: 'Balasan terkirim' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/tickets/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, assigned_to } = req.body;
    const allowed = ['open', 'in_progress', 'answered', 'closed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }
    const closedAt = status === 'closed' ? 'NOW()' : 'NULL';
    await pool.query(
      `UPDATE tickets SET status=?, assigned_to=?, closed_at=${status === 'closed' ? 'NOW()' : 'NULL'} WHERE id=?`,
      [status, assigned_to || null, req.params.id]
    );

    const [ticket] = await pool.query('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
    if (ticket.length) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
        [ticket[0].user_id, 'Status Tiket Diperbarui', `Tiket ${ticket[0].ticket_number} sekarang: ${status}`, 'ticket_status', ticket[0].id, 'ticket']
      );
    }

    res.json({ success: true, message: 'Status tiket diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/tickets/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });
    if (rows[0].status !== 'closed') {
      return res.status(400).json({ success: false, message: 'Hanya tiket berstatus selesai yang dapat dihapus' });
    }
    const [attachments] = await pool.query('SELECT filename FROM ticket_attachments WHERE ticket_id = ?', [req.params.id]);
    await pool.query('DELETE FROM tickets WHERE id = ?', [req.params.id]);
    for (const att of attachments) {
      const filePath = path.join(uploadDir, att.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ success: true, message: 'Tiket dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- FEEDBACK ---
app.post('/api/feedback', authMiddleware, async (req, res) => {
  try {
    const { ticket_id, rating, comment } = req.body;
    if (!ticket_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating 1-5 wajib diisi' });
    }
    const [ticket] = await pool.query('SELECT * FROM tickets WHERE id = ? AND user_id = ?', [ticket_id, req.user.id]);
    if (!ticket.length) return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan' });
    if (!['answered', 'closed', 'auto_answered'].includes(ticket[0].status)) {
      return res.status(400).json({ success: false, message: 'Tiket belum selesai' });
    }

    await pool.query(
      'INSERT INTO feedback (ticket_id, user_id, rating, comment) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE rating=?, comment=?',
      [ticket_id, req.user.id, rating, sanitize(comment), rating, sanitize(comment)]
    );
    await pool.query('UPDATE tickets SET status = "closed", closed_at = NOW() WHERE id = ?', [ticket_id]);

    res.json({ success: true, message: 'Terima kasih atas penilaian Anda' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- DOCUMENT REQUESTS ---
app.post('/api/documents', authMiddleware, upload.array('files', 5), async (req, res) => {
  try {
    const document_type = req.body.document_type;
    const applicant_data = parseJsonField(req.body.applicant_data, {});
    const case_chronology = req.body.case_chronology;
    if (!document_type || !case_chronology) {
      return res.status(400).json({ success: false, message: 'Jenis permohonan dan kronologi wajib diisi' });
    }
    const applicantFiles = (req.files || []).map((f) => ({
      filename: f.filename,
      original_name: f.originalname,
      file_size: f.size,
      mime_type: f.mimetype,
    }));
    const requestNumber = generateRequestNumber();
    const supportsApplicantFiles = await ensureApplicantFilesColumn();
    let result;
    if (supportsApplicantFiles) {
      [result] = await pool.query(
        'INSERT INTO document_requests (request_number, user_id, document_type, applicant_data, case_chronology, applicant_files) VALUES (?, ?, ?, ?, ?, ?)',
        [requestNumber, req.user.id, document_type, JSON.stringify(applicant_data || {}), sanitize(case_chronology),
          applicantFiles.length ? JSON.stringify(applicantFiles) : null]
      );
    } else {
      [result] = await pool.query(
        'INSERT INTO document_requests (request_number, user_id, document_type, applicant_data, case_chronology) VALUES (?, ?, ?, ?, ?)',
        [requestNumber, req.user.id, document_type, JSON.stringify(applicant_data || {}), sanitize(case_chronology)]
      );
    }

    const [staffUsers] = await pool.query("SELECT id FROM users WHERE role IN ('admin','staff')");
    for (const staff of staffUsers) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
        [staff.id, 'Permohonan Dokumen Baru', `${requestNumber} - ${document_type}`, 'document_new', result.insertId, 'document']
      );
    }

    res.status(201).json({ success: true, data: { id: result.insertId, request_number: requestNumber } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/documents', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    const isStaff = ['admin', 'staff'].includes(req.user.role);

    let where = isStaff ? 'WHERE 1=1' : 'WHERE d.user_id = ?';
    const params = isStaff ? [] : [req.user.id];

    if (search) {
      where += ' AND (d.request_number LIKE ? OR u.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      where += ' AND d.status = ?';
      params.push(status);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM document_requests d LEFT JOIN users u ON d.user_id = u.id ${where}`,
      params
    );
    const [rows] = await pool.query(
      `SELECT d.*, u.name as user_name FROM document_requests d
       LEFT JOIN users u ON d.user_id = u.id ${where}
       ORDER BY d.created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const data = rows.map((row) => ({
      ...row,
      applicant_data: parseJsonField(row.applicant_data, {}),
      applicant_files: parseJsonField(row.applicant_files, []),
    }));

    res.json({ success: true, data, pagination: paginate(page, limit, countRows[0].total) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/documents/:id', authMiddleware, adminMiddleware, upload.single('draft_file'), async (req, res) => {
  try {
    const [beforeRows] = await pool.query('SELECT * FROM document_requests WHERE id = ?', [req.params.id]);
    if (!beforeRows.length) {
      return res.status(404).json({ success: false, message: 'Permohonan tidak ditemukan' });
    }
    const before = beforeRows[0];

    const { status, staff_notes, assigned_to } = req.body;
    const updates = [];
    const params = [];
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (staff_notes !== undefined) { updates.push('staff_notes = ?'); params.push(sanitize(staff_notes)); }
    if (assigned_to !== undefined) { updates.push('assigned_to = ?'); params.push(assigned_to || null); }
    if (req.file) {
      if (before.draft_file) {
        const oldPath = path.join(uploadDir, before.draft_file);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.push('draft_file = ?');
      params.push(req.file.filename);
    }
    if (updates.length) {
      params.push(req.params.id);
      await pool.query(`UPDATE document_requests SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [doc] = await pool.query('SELECT * FROM document_requests WHERE id = ?', [req.params.id]);
    if (!doc.length) {
      return res.json({ success: true, message: 'Permohonan dokumen diperbarui' });
    }
    const updated = doc[0];
    const reqNo = updated.request_number;

    if (staff_notes !== undefined && String(staff_notes || '').trim() && staff_notes !== before.staff_notes) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
        [updated.user_id, 'Balasan Permohonan Dokumen', `Permohonan ${reqNo}: ${sanitize(staff_notes).slice(0, 200)}`, 'document_reply', updated.id, 'document']
      );
    }

    if (status !== undefined && status !== before.status) {
      const statusLabel = DOC_STATUS_LABELS[status] || status;
      const title = status === 'completed' ? 'Dokumen Siap Diunduh' : 'Status Permohonan Dokumen';
      const message = status === 'completed'
        ? `Permohonan ${reqNo} selesai. Lampiran dokumen tersedia di dashboard.`
        : `Permohonan ${reqNo} diperbarui menjadi: ${statusLabel}`;
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
        [updated.user_id, title, message, `document_${status}`, updated.id, 'document']
      );
    } else if (req.file && !status) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
        [updated.user_id, 'Draf Dokumen Tersedia', `Permohonan ${reqNo}: admin mengunggah draf dokumen.`, 'document_draft', updated.id, 'document']
      );
    }

    res.json({ success: true, message: 'Permohonan dokumen diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- OBH ---
app.get('/api/obh', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', city = '', case_type = '' } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE is_active = 1';
    const params = [];
    if (search) {
      where += ' AND (name LIKE ? OR address LIKE ? OR coverage_areas LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (city) {
      where += ' AND city LIKE ?';
      params.push(`%${city}%`);
    }
    if (case_type) {
      where += ' AND case_types LIKE ?';
      params.push(`%${case_type}%`);
    }

    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM obh_organizations ${where}`, params);
    const [rows] = await pool.query(
      `SELECT * FROM obh_organizations ${where} ORDER BY is_partner DESC, name ASC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    res.json({ success: true, data: rows, pagination: paginate(page, limit, countRows[0].total) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/obh', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, accreditation_no, address, city, province, phone, email, website, coverage_areas, case_types, is_partner } = req.body;
    const [result] = await pool.query(
      `INSERT INTO obh_organizations (name, accreditation_no, address, city, province, phone, email, website, coverage_areas, case_types, is_partner)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sanitize(name), sanitize(accreditation_no), sanitize(address), sanitize(city), sanitize(province),
        sanitize(phone), sanitize(email), sanitize(website), sanitize(coverage_areas), sanitize(case_types), is_partner ? 1 : 0]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/obh/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const fields = req.body;
    await pool.query(
      `UPDATE obh_organizations SET name=?, accreditation_no=?, address=?, city=?, province=?,
       phone=?, email=?, website=?, coverage_areas=?, case_types=?, is_partner=?, is_active=? WHERE id=?`,
      [fields.name, fields.accreditation_no, fields.address, fields.city, fields.province,
        fields.phone, fields.email, fields.website, fields.coverage_areas, fields.case_types,
        fields.is_partner ? 1 : 0, fields.is_active ?? 1, req.params.id]
    );
    res.json({ success: true, message: 'OBH diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/obh/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE obh_organizations SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'OBH dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- MAP LOCATIONS (GIS) ---
const parseMapLocationBody = (body) => {
  const lat = Number(body.latitude);
  const lng = Number(body.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { error: 'Koordinat latitude/longitude tidak valid' };
  }
  if (!body.name?.trim()) return { error: 'Nama lokasi wajib diisi' };
  if (!body.case_fee?.trim()) return { error: 'Tarif biaya perkara wajib diisi' };
  return {
    name: sanitize(body.name),
    location_type: sanitize(body.location_type || 'pengadilan'),
    address: sanitize(body.address || ''),
    latitude: lat,
    longitude: lng,
    distance_km: body.distance_km === '' || body.distance_km == null ? null : Number(body.distance_km),
    distance_info: sanitize(body.distance_info || ''),
    case_type: sanitize(body.case_type || ''),
    case_fee: sanitize(body.case_fee),
    fee_notes: sanitize(body.fee_notes || ''),
    description: sanitize(body.description || ''),
    sort_order: Number(body.sort_order) || 0,
    is_active: body.is_active === 0 || body.is_active === false ? 0 : 1,
  };
};

app.get('/api/map-locations/public', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, location_type, address, latitude, longitude, distance_km, distance_info,
              case_type, case_fee, fee_notes, description, sort_order
       FROM map_locations WHERE is_active = 1 ORDER BY sort_order ASC, name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/map-locations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (search) {
      where += ' AND (name LIKE ? OR address LIKE ? OR case_type LIKE ? OR case_fee LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM map_locations ${where}`, params);
    const [rows] = await pool.query(
      `SELECT * FROM map_locations ${where} ORDER BY sort_order ASC, name ASC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    res.json({ success: true, data: rows, pagination: paginate(page, limit, countRows[0].total) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/map-locations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const parsed = parseMapLocationBody(req.body);
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
    const [result] = await pool.query(
      `INSERT INTO map_locations (name, location_type, address, latitude, longitude, distance_km, distance_info,
        case_type, case_fee, fee_notes, description, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [parsed.name, parsed.location_type, parsed.address, parsed.latitude, parsed.longitude,
        parsed.distance_km, parsed.distance_info, parsed.case_type, parsed.case_fee, parsed.fee_notes,
        parsed.description, parsed.sort_order, parsed.is_active]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/map-locations/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const parsed = parseMapLocationBody(req.body);
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
    const [rows] = await pool.query('SELECT id FROM map_locations WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Lokasi tidak ditemukan' });
    await pool.query(
      `UPDATE map_locations SET name=?, location_type=?, address=?, latitude=?, longitude=?, distance_km=?,
        distance_info=?, case_type=?, case_fee=?, fee_notes=?, description=?, sort_order=?, is_active=? WHERE id=?`,
      [parsed.name, parsed.location_type, parsed.address, parsed.latitude, parsed.longitude,
        parsed.distance_km, parsed.distance_info, parsed.case_type, parsed.case_fee, parsed.fee_notes,
        parsed.description, parsed.sort_order, parsed.is_active, req.params.id]
    );
    res.json({ success: true, message: 'Lokasi peta diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/map-locations/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE map_locations SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Lokasi dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = '' } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE user_id = ?';
    const params = [req.user.id];
    if (unread_only === 'true') {
      where += ' AND is_read = 0';
    }
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM notifications ${where}`, params);
    const [rows] = await pool.query(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    const [unreadCount] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({
      success: true,
      data: rows,
      unread_count: unreadCount[0].count,
      pagination: paginate(page, limit, countRows[0].total),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/notifications/read-all', authMiddleware, async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
  res.json({ success: true, message: 'Semua notifikasi ditandai dibaca' });
});

app.patch('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// --- ANALYTICS ---
app.get('/api/analytics/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [ticketStats] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(status = 'open') as open_count,
        SUM(status = 'in_progress') as in_progress_count,
        SUM(status = 'answered') as answered_count,
        SUM(status = 'auto_answered') as auto_answered_count,
        SUM(status = 'closed') as closed_count,
        SUM(is_auto_replied = 1) as auto_reply_count
      FROM tickets
    `);

    const [avgResponse] = await pool.query(`
      SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, first_response_at)) as avg_minutes
      FROM tickets WHERE first_response_at IS NOT NULL
    `);

    const [ikm] = await pool.query(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total_feedback FROM feedback
    `);

    const [topQuestions] = await pool.query(`
      SELECT category, COUNT(*) as count FROM tickets
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category ORDER BY count DESC LIMIT 10
    `);

    const [topKB] = await pool.query(`
      SELECT title, use_count, category FROM knowledge_base
      WHERE is_active = 1 ORDER BY use_count DESC LIMIT 10
    `);

    const [monthlyTickets] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
      FROM tickets GROUP BY month ORDER BY month DESC LIMIT 12
    `);

    const [recentTickets] = await pool.query(`
      SELECT t.ticket_number, t.subject, t.status, t.created_at, u.name as user_name
      FROM tickets t LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC LIMIT 5
    `);

    const total = ticketStats[0].total || 0;
    const autoRate = total ? Math.round((ticketStats[0].auto_reply_count / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        tickets: ticketStats[0],
        auto_reply_rate: autoRate,
        avg_response_minutes: Math.round(avgResponse[0]?.avg_minutes || 0),
        ikm: { avg_rating: Number(ikm[0]?.avg_rating || 0).toFixed(1), total: ikm[0]?.total_feedback || 0 },
        top_categories: topQuestions,
        top_knowledge_base: topKB,
        monthly_tickets: monthlyTickets.reverse(),
        recent_tickets: recentTickets,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- USERS (admin) ---
app.patch('/api/users/:id/password', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }
    const [target] = await pool.query('SELECT id, role FROM users WHERE id = ?', [req.params.id]);
    if (!target.length) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    if (target[0].role === 'admin' && Number(req.params.id) !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Tidak dapat mengubah password admin lain' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.params.id]);
    res.json({ success: true, message: 'Password berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (search) {
      where += ' AND (name LIKE ? OR email LIKE ? OR nik LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (role) {
      where += ' AND role = ?';
      params.push(role);
    }
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM users ${where}`, params);
    const [rows] = await pool.query(
      `SELECT id, nik, name, email, phone, role, is_active, created_at FROM users ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    res.json({ success: true, data: rows, pagination: paginate(page, limit, countRows[0].total) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health check
app.get('/api/health', (_, res) => res.json({ success: true, message: 'Posbakum SAMBAT API is running' }));

// Error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: 'File terlalu besar atau tidak valid' });
  }
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

app.listen(PORT, async () => {
  try {
    await ensureSchema();
    await seedAdmin();
    console.log(`Posbakum SAMBAT API running on http://localhost:${PORT}`);
  } catch (e) {
    console.log(`Server started (DB may need setup): ${e.message}`);
  }
});
