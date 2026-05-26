-- Migration: Client revisions (May 2026)
USE posbakum;

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
);

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
('wa_number', '6281234567890'),
('zoom_link', 'https://zoom.us/j/posbakum');

ALTER TABLE document_requests MODIFY document_type VARCHAR(100) NOT NULL;
ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS applicant_files JSON NULL COMMENT 'Lampiran dari pemohon' AFTER case_chronology;

INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('sk_decree_number', '');

ALTER TABLE tickets
  MODIFY service_type VARCHAR(100) DEFAULT 'konsultasi';

-- Seed layanan catalog (ignore duplicates)
INSERT IGNORE INTO layanan_catalog (name, slug, layanan_group, description, sort_order) VALUES
('Konsultasi Online', 'konsultasi', 'layanan_1', 'Chat/formulir dengan petugas Posbakum', 1),
('Informasi Prosedur', 'informasi', 'layanan_1', 'Tahapan berperkara, syarat dokumen, biaya', 2),
('Advis Hukum', 'advis', 'layanan_1', 'Analisis awal posisi hukum pemohon', 3),
('Informasi Perkara', 'perkara', 'layanan_1', 'Cek posisi perkara Anda', 4),
('Gugatan Cerai', 'gugatan_cerai', 'layanan_2', 'Cerai talak / cerai gugat', 1),
('Perubahan Nama', 'perubahan_nama', 'layanan_2', 'Perbaikan penulisan di KK, KTP, Akta', 2),
('Perwalian', 'perwalian', 'layanan_2', 'Perlindungan anak dan disabilitas', 3),
('Penetapan Kematian', 'penetapan_kematian', 'layanan_2', 'Akta kematian', 4),
('Pengampuan', 'pengampuan', 'layanan_2', 'Pengampuan warga', 5),
('Adopsi', 'adopsi', 'layanan_2', 'Pengangkatan anak', 6),
('Dokumen Lainnya', 'lainnya', 'layanan_2', 'Jenis permohonan lainnya', 7);
