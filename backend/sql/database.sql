-- Posbakum SAMBAT Database
-- Sahabat Masyarakat Dalam Bantuan Hukum Terpercaya

CREATE DATABASE IF NOT EXISTS posbakum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE posbakum;

-- Users (masyarakat & petugas)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nik VARCHAR(16) UNIQUE,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  role ENUM('citizen', 'admin', 'staff') DEFAULT 'citizen',
  address TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Knowledge Base (auto-reply templates)
CREATE TABLE knowledge_base (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  keywords TEXT NOT NULL COMMENT 'Comma-separated keywords for matching',
  content TEXT NOT NULL,
  view_count INT DEFAULT 0,
  use_count INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Consultation Tickets
CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  service_type ENUM('konsultasi', 'informasi', 'advis', 'perkara', 'dokumen') DEFAULT 'konsultasi',
  category VARCHAR(100),
  subject VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  status ENUM('open', 'auto_answered', 'in_progress', 'answered', 'closed') DEFAULT 'open',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  assigned_to INT,
  kb_id INT COMMENT 'Knowledge base used for auto-reply',
  is_auto_replied TINYINT(1) DEFAULT 0,
  contact_method ENUM('form', 'chat', 'video') DEFAULT 'form',
  wa_link VARCHAR(500),
  zoom_link VARCHAR(500),
  first_response_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (kb_id) REFERENCES knowledge_base(id) ON DELETE SET NULL
);

-- Ticket Replies
CREATE TABLE ticket_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  is_staff TINYINT(1) DEFAULT 0,
  is_auto TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ticket Attachments
CREATE TABLE ticket_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Feedback & Rating (IKM)
CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL UNIQUE,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Document Requests (Layanan 2)
CREATE TABLE document_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  document_type ENUM(
    'gugatan_cerai', 'perubahan_nama', 'perwalian',
    'penetapan_kematian', 'pengampuan', 'adopsi', 'lainnya'
  ) NOT NULL,
  applicant_data JSON,
  case_chronology TEXT NOT NULL,
  status ENUM('submitted', 'drafting', 'review', 'approved', 'completed', 'rejected') DEFAULT 'submitted',
  draft_file VARCHAR(255),
  staff_notes TEXT,
  assigned_to INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- OBH Directory (Layanan 3)
CREATE TABLE obh_organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  accreditation_no VARCHAR(100),
  address TEXT NOT NULL,
  city VARCHAR(100),
  province VARCHAR(100),
  phone VARCHAR(30),
  email VARCHAR(150),
  website VARCHAR(255),
  coverage_areas TEXT COMMENT 'Jenis perkara yang ditangani',
  case_types TEXT COMMENT 'Comma-separated case types',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_partner TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  reference_id INT,
  reference_type VARCHAR(50),
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_number ON tickets(ticket_number);
CREATE INDEX idx_kb_category ON knowledge_base(category);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- Sample Admin (password: admin123)
INSERT INTO users (nik, name, email, phone, password, role) VALUES
('0000000000000001', 'Admin Posbakum', 'admin@posbakum.local', '081234567890',
 '$2b$10$rQZ8K8Y5Y5Y5Y5Y5Y5Y5YuGKxGxGxGxGxGxGxGxGxGxGxGxGxGxG', 'admin');

-- Note: Run backend once to hash password properly, or use:
-- Password for demo: admin123 (will be set by seed in server)

-- Sample Staff
INSERT INTO users (nik, name, email, phone, password, role) VALUES
('0000000000000002', 'Petugas Posbakum', 'petugas@posbakum.local', '081234567891',
 '$2b$10$rQZ8K8Y5Y5Y5Y5Y5Y5Y5YuGKxGxGxGxGxGxGxGxGxGxGxGxGxGxG', 'staff');

-- Knowledge Base Samples
INSERT INTO knowledge_base (title, category, keywords, content, is_active) VALUES
('Biaya Perkara Cerai', 'perkara_cerai', 'biaya,cerai,gugatan,talak,ongkos,mahkamah',
 'Biaya perkara cerai di Pengadilan Negeri umumnya meliputi biaya persidangan, biaya panggilan, dan Posbakum gratis bagi yang tidak mampu. Bawa SKTM dari kelurahan/desa ke loket Posbakum.', 1),
('Syarat Gugatan Cerai', 'informasi_cerai', 'cerai,syarat,gugatan,talak,perceraian,dokumen',
 'Persyaratan: Surat Gugatan, Kutipan Akta Nikah, KTP & KK, surat kuasa (jika diwakilkan), bukti pendukung. Cerai Talak di PA, Cerai Gugat di PN/PA. Posbakum bantu susun gugatan gratis.', 1),
('Hak Waris Tanah', 'perkara_waris', 'waris,harta,tanah,hak,ahli,wasiat',
 'Hak waris ditentukan UU Perkawinan, wasiat (maks 1/3), dan hukum adat. Ahli waris: keturunan, garis lurus ke atas, istri/suami. Ajukan konsultasi dengan dokumen kepemilikan.', 1),
('Biaya Nikah & Catatan Sipil', 'nikah_biaya', 'nikah,biaya,perkawinan,akad,catatan',
 'Pencatatan nikah di KUA gratis. Akta nikah sesuai tarif daerah. Posbakum konsultasi gratis prosedur perkawinan dan perceraian.', 1),
('Bantuan Hukum Prodeo', 'prodeo', 'prodeo,bantuan,hukum,gratis,tidak mampu',
 'Prodeo untuk yang tidak mampu (SKTM), perkara pidana/perdata tertentu. Syarat: SKTM lurah/kades, KTP, berkas perkara. Posbakum PN bantu permohonan.', 1);

-- Sample OBH
INSERT INTO obh_organizations (name, accreditation_no, address, city, province, phone, email, coverage_areas, case_types, is_partner, is_active) VALUES
('LBH Pekalongan', 'LBH-001/2015', 'Jl. Merdeka No. 10, Pekalongan', 'Pekalongan', 'Jawa Tengah', '0285-123456', 'info@lbhpekalongan.org', 'Pidana, Perdata, HAM', 'pidana,perdata,hukum_acara', 1, 1),
('LBH Semarang', 'LBH-002/2016', 'Jl. Pemuda No. 5, Semarang', 'Semarang', 'Jawa Tengah', '024-7654321', 'kontak@lbhsemarang.or.id', 'Perdata, Pidana, Ketenagakerjaan', 'perdata,pidana,ketenagakerjaan', 1, 1),
('Yayasan Bantuan Hukum Keluarga', 'YBH-003/2018', 'Jl. Diponegoro No. 22, Pekalongan', 'Pekalongan', 'Jawa Tengah', '0285-987654', 'ybh@keluarga.or.id', 'Keluarga, Perceraian, Waris', 'cerai,waris,perwalian,adopsi', 1, 1);
