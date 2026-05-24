-- GIS map locations (jarak & tarif biaya perkara)
CREATE TABLE IF NOT EXISTS map_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location_type VARCHAR(100) DEFAULT 'pengadilan' COMMENT 'pengadilan, posbakum, zona',
  address TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  distance_km DECIMAL(8, 2) NULL COMMENT 'Jarak referensi (km)',
  distance_info VARCHAR(255) NULL COMMENT 'Keterangan jarak tambahan',
  case_type VARCHAR(150) NULL COMMENT 'Jenis perkara',
  case_fee VARCHAR(255) NOT NULL COMMENT 'Tarif biaya perkara',
  fee_notes TEXT NULL,
  description TEXT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_map_locations_active ON map_locations(is_active, sort_order);

INSERT INTO map_locations (name, location_type, address, latitude, longitude, distance_km, distance_info, case_type, case_fee, fee_notes, description, sort_order, is_active) VALUES
('Posbakum PN Pekalongan', 'posbakum', 'Kompleks Pengadilan Negeri Pekalongan', -6.88860000, 109.67500000, 0.00, 'Lokasi referensi layanan', 'Semua perkara', 'Gratis (SKTM)', 'Bantuan hukum gratis bagi yang tidak mampu dengan SKTM dari kelurahan/desa.', 'Titik layanan Posbakum di Pengadilan Negeri Pekalongan.', 1, 1),
('Pengadilan Negeri Pekalongan', 'pengadilan', 'Jl. Merdeka, Pekalongan', -6.88920000, 109.67650000, 0.50, '±500 m dari Posbakum', 'Perdata & Pidana Umum', 'Sesuai PERMA / SK biaya', 'Biaya perkara mengikuti ketentuan Mahkamah Agung. Posbakum membantu permohonan pembebasan biaya.', 'Pengadilan tingkat pertama untuk wilayah Pekalongan.', 2, 1),
('Pengadilan Agama Pekalongan', 'pengadilan', 'Pekalongan', -6.90100000, 109.66200000, 2.50, '±2,5 km dari Posbakum', 'Cerai Talak & Perkara Agama', 'Sesuai PERMA PA', 'Cerai talak dan perkara di bawah kewenangan PA.', 'Klik untuk informasi jarak dan tarif perkara agama.', 3, 1);
