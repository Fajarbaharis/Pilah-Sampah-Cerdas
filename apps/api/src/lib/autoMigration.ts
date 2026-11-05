import { prisma } from "./prisma.js";

/**
 * Otomatisasi migrasi skema & pemulihan state saat startup (ISO/IEC 12207 Arsitektur Terpisah)
 */
export async function runAutoMigrations(): Promise<void> {
  try {
    const alterStatements = [
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "id_rw" INTEGER;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "id_rt" INTEGER;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "harus_ganti_password" BOOLEAN DEFAULT false;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "subtipe_warga" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "nip" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "institusi" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "jabatan" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "program_studi" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "jenjang_pendidikan" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "provinsi" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "kabupaten" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "jumlah_anggota_keluarga" INTEGER;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "skor_penilaian_dpl" DECIMAL(5,2) DEFAULT 0.0;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "is_ketua" BOOLEAN DEFAULT false;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "jenjang_pendidikan" TEXT;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "id_kelompok" TEXT;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "catatan_penilaian_dpl" TEXT;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "sudah_dinilai" BOOLEAN DEFAULT false;',
      'ALTER TABLE "kelompok_kkn" ADD COLUMN IF NOT EXISTS "id_dpl" TEXT;',
      'ALTER TABLE "kelompok_kkn" ADD COLUMN IF NOT EXISTS "kelurahan" TEXT;',
      // QC-27: Link Google Drive per kelompok
      'ALTER TABLE "kelompok_kkn" ADD COLUMN IF NOT EXISTS "link_google_drive" TEXT;',
      'ALTER TABLE "kelompok_kkn" ADD COLUMN IF NOT EXISTS "qr_diunduh_pada" TIMESTAMP(3);',
      'ALTER TABLE "tempat_sampah" ADD COLUMN IF NOT EXISTS "id_kelompok" TEXT;',
      'ALTER TABLE "jadwal" ADD COLUMN IF NOT EXISTS "is_aktif" BOOLEAN NOT NULL DEFAULT true;',
      // QC-36: Advance scheduling — bulan efektif polygon area kerja
      'ALTER TABLE "jadwal" ADD COLUMN IF NOT EXISTS "effective_month" TEXT;',
      'ALTER TABLE "jadwal" ADD COLUMN IF NOT EXISTS "status_kegiatan" TEXT NOT NULL DEFAULT \'AKTIF\';',
      'ALTER TABLE "jadwal" ADD COLUMN IF NOT EXISTS "detail_skip" JSONB;',
      'ALTER TABLE "kehadiran_kegiatan" ADD COLUMN IF NOT EXISTS "durasi_aktual_dalam_zona_menit" INTEGER;',
      'ALTER TABLE "kehadiran_kegiatan" ADD COLUMN IF NOT EXISTS "log_jeda" JSONB;',
      'ALTER TABLE "kehadiran_kegiatan" ADD COLUMN IF NOT EXISTS "deskripsi_kegiatan" TEXT;',
      'ALTER TABLE "kehadiran_kegiatan" ADD COLUMN IF NOT EXISTS "foto_url" TEXT;',
      'ALTER TABLE "kehadiran_kegiatan" ADD COLUMN IF NOT EXISTS "platform_os" TEXT DEFAULT \'ANDROID\';',
      'ALTER TABLE "kelompok_kkn" ADD COLUMN IF NOT EXISTS "auto_polygon" JSONB;',
      'ALTER TABLE "kelompok_kkn" ADD COLUMN IF NOT EXISTS "auto_polygon_updated_at" TIMESTAMP(3);',
      'ALTER TABLE "kelompok_kkn" ADD COLUMN IF NOT EXISTS "auto_polygon_student_count" INTEGER;',
      'ALTER TABLE "kelompok_kkn" ADD COLUMN IF NOT EXISTS "id_mpl" TEXT;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "id_mpl" TEXT;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "id_rw_ditugaskan" INTEGER;',
      'ALTER TABLE "mahasiswa_kkn" ADD COLUMN IF NOT EXISTS "status_whitelist" TEXT DEFAULT \'PENDING\';',
      'ALTER TABLE "posko_kkn" ADD COLUMN IF NOT EXISTS "radius" INTEGER DEFAULT 500;',
      `CREATE TABLE IF NOT EXISTS "posko_kkn_multi" (
        "id" TEXT PRIMARY KEY,
        "id_kelompok" TEXT NOT NULL,
        "nama" TEXT NOT NULL,
        "alamat" TEXT NOT NULL,
        "latitude" DECIMAL(11, 8) NOT NULL,
        "longitude" DECIMAL(11, 8) NOT NULL,
        "is_utama" BOOLEAN DEFAULT false,
        "radius" INTEGER DEFAULT 500,
        "foto_url" TEXT,
        "keterangan" TEXT,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      'CREATE INDEX IF NOT EXISTS "posko_kkn_multi_id_kelompok_idx" ON "posko_kkn_multi"("id_kelompok");',
      `CREATE TABLE IF NOT EXISTS "presensi_mandiri" (
        "id" TEXT PRIMARY KEY,
        "id_mahasiswa" TEXT NOT NULL,
        "id_kelompok" TEXT,
        "latitude" DECIMAL(11, 8) NOT NULL,
        "longitude" DECIMAL(11, 8) NOT NULL,
        "deskripsi_kegiatan" VARCHAR(500) NOT NULL,
        "foto_url" TEXT NOT NULL,
        "platform_os" TEXT DEFAULT 'ANDROID',
        "status" TEXT NOT NULL DEFAULT 'AKTIF',
        "waktu_checkin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "waktu_checkout" TIMESTAMP(3),
        "durasi_menit" INTEGER,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      'ALTER TABLE "presensi_mandiri" ADD COLUMN IF NOT EXISTS "platform_os" TEXT DEFAULT \'ANDROID\';',
      'CREATE INDEX IF NOT EXISTS "presensi_mandiri_id_mahasiswa_waktu_checkin_idx" ON "presensi_mandiri"("id_mahasiswa", "waktu_checkin" DESC);',
      'CREATE INDEX IF NOT EXISTS "presensi_mandiri_id_kelompok_idx" ON "presensi_mandiri"("id_kelompok");',
      'CREATE INDEX IF NOT EXISTS "presensi_mandiri_status_idx" ON "presensi_mandiri"("status");',
      `CREATE TABLE IF NOT EXISTS "pengajuan_izin_mahasiswa" (
        "id" TEXT PRIMARY KEY,
        "id_mahasiswa" TEXT NOT NULL,
        "tipe" TEXT NOT NULL,
        "alasan" TEXT NOT NULL,
        "url_bukti" TEXT,
        "tanggal_mulai" TIMESTAMP(3) NOT NULL,
        "tanggal_selesai" TIMESTAMP(3) NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "id_pereview" TEXT,
        "direview_pada" TIMESTAMP(3),
        "alasan_penolakan" TEXT,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "lampiran_file" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "lampiran_urls" JSONB;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "ada_lampiran" BOOLEAN DEFAULT false;',
      'ALTER TABLE "penilaian_kkn_mahasiswa" ADD COLUMN IF NOT EXISTS "id_mpl" TEXT;',
      'ALTER TABLE "jejak_audit" ADD COLUMN IF NOT EXISTS "hash" TEXT;',
      'ALTER TABLE "jejak_audit" ADD COLUMN IF NOT EXISTS "previous_hash" TEXT;',
      'ALTER TABLE "fasilitas" ADD COLUMN IF NOT EXISTS "id_pendaftar" TEXT;',
      'ALTER TABLE "pemanfaatan_sampah" ADD COLUMN IF NOT EXISTS "id_program_kerja" TEXT;',
      'ALTER TABLE "pemanfaatan_sampah" ALTER COLUMN "id_rw" DROP NOT NULL;',
      'ALTER TABLE "kritik_saran_pemanfaatan" ADD COLUMN IF NOT EXISTS "id_program_kerja" TEXT;',
      'UPDATE "fasilitas" SET "status_persetujuan" = \'APPROVED\' WHERE "status_persetujuan" = \'PENDING\';',
      `DO $$ BEGIN
        CREATE TYPE "StatusProker" AS ENUM ('BELUM_DISETUJUI', 'DITERIMA', 'DITOLAK', 'SEDANG_BERJALAN', 'SELESAI');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "StatusPenilaianKkn" AS ENUM ('DRAFT', 'TERSIMPAN', 'FINAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      `DO $$ BEGIN
        ALTER TYPE "FacilityType" ADD VALUE IF NOT EXISTS 'posko_kkn';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      `DO $$ BEGIN
        ALTER TYPE "StatusProker" ADD VALUE IF NOT EXISTS 'SEDANG_BERJALAN';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      `DO $$ BEGIN
        ALTER TYPE "StatusProker" ADD VALUE IF NOT EXISTS 'SELESAI';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      `CREATE TABLE IF NOT EXISTS "program_kerja_kkn" (
        "id" TEXT PRIMARY KEY,
        "id_kelompok" TEXT NOT NULL,
        "nomor" INTEGER,
        "deskripsi" TEXT NOT NULL,
        "kategori" TEXT DEFAULT 'LAINNYA',
        "sumber" TEXT DEFAULT 'MAHASISWA',
        "waktu_pelaksanaan" TEXT,
        "link_google_drive" TEXT,
        "kebutuhan_biaya" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        "status" "StatusProker" NOT NULL DEFAULT 'BELUM_DISETUJUI',
        "catatan_dpl" TEXT,
        "id_pereview" TEXT,
        "direview_pada" TIMESTAMP(3),
        "skor_penilaian" DECIMAL(5,2),
        "evaluasi_dpl" TEXT,
        "aspek_penilaian" JSONB,
        "predikat" TEXT,
        "status_penilaian" TEXT DEFAULT 'BELUM_DINILAI',
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `DO $$ BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='kegiatan_harian_kkn') THEN 
          ALTER TABLE "kegiatan_harian_kkn" ALTER COLUMN "foto_bukti_url" DROP NOT NULL; 
        END IF; 
      END $$;`,
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "judul" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "nomor" INTEGER;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "id_mahasiswa" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "kategori" TEXT DEFAULT \'LAINNYA\';',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "sumber" TEXT DEFAULT \'MAHASISWA\';',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "waktu_pelaksanaan" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "link_google_drive" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "kebutuhan_biaya" DECIMAL(12,2) DEFAULT 0.00;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "catatan_dpl" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "id_pereview" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "direview_pada" TIMESTAMP(3);',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "skor_penilaian" DECIMAL(5,2);',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "evaluasi_dpl" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "aspek_penilaian" JSONB;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "predikat" TEXT;',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "status_penilaian" TEXT DEFAULT \'BELUM_DINILAI\';',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "status_usulan" TEXT DEFAULT \'BELUM_DISETUJUI\';',
      'ALTER TABLE "program_kerja_kkn" ADD COLUMN IF NOT EXISTS "status_pelaksanaan" TEXT DEFAULT \'BELUM_MULAI\';',
      `UPDATE "program_kerja_kkn" SET "status_usulan" = 'DISETUJUI', "status_pelaksanaan" = 'SELESAI' WHERE "status"::text = 'SELESAI' AND ("status_pelaksanaan" IS NULL OR "status_pelaksanaan" = 'BELUM_MULAI');`,
      `UPDATE "program_kerja_kkn" SET "status_usulan" = 'DISETUJUI', "status_pelaksanaan" = 'SEDANG_BERJALAN' WHERE "status"::text = 'SEDANG_BERJALAN' AND ("status_pelaksanaan" IS NULL OR "status_pelaksanaan" = 'BELUM_MULAI');`,
      `UPDATE "program_kerja_kkn" SET "status_usulan" = 'DISETUJUI' WHERE "status"::text IN ('DITERIMA', 'DISETUJUI') AND ("status_usulan" IS NULL OR "status_usulan" = 'BELUM_DISETUJUI');`,
      `UPDATE "program_kerja_kkn" SET "status_usulan" = 'DITOLAK' WHERE "status"::text IN ('DITOLAK', 'TIDAK_DISETUJUI') AND ("status_usulan" IS NULL OR "status_usulan" = 'BELUM_DISETUJUI');`,
      `UPDATE "program_kerja_kkn" SET "status_usulan" = 'BELUM_DISETUJUI' WHERE "status_usulan" IS NULL;`,
      `UPDATE "program_kerja_kkn" SET "status_pelaksanaan" = 'BELUM_MULAI' WHERE "status_pelaksanaan" IS NULL;`,
      `CREATE TABLE IF NOT EXISTS "buku_panduan" (
        "id" TEXT PRIMARY KEY,
        "judul" TEXT NOT NULL,
        "kategori_peran" TEXT NOT NULL,
        "deskripsi" TEXT,
        "file_url" TEXT,
        "link_url" TEXT,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "master_kegiatan_sampah" (
        "id" TEXT PRIMARY KEY,
        "nama" TEXT NOT NULL UNIQUE,
        "kategori" TEXT NOT NULL,
        "deskripsi" TEXT,
        "status_aktif" BOOLEAN NOT NULL DEFAULT true,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "penilaian_kkn_mahasiswa" (
        "id" TEXT PRIMARY KEY,
        "id_mahasiswa" TEXT NOT NULL UNIQUE,
        "id_kelompok" TEXT,
        "id_dpl" TEXT,
        "id_mitra" TEXT,
        "nama_mitra_penilai" TEXT,
        "skor_mitra_kehadiran" INTEGER NOT NULL DEFAULT 0,
        "skor_mitra_warga_binaan" INTEGER NOT NULL DEFAULT 0,
        "skor_mitra_proker" INTEGER NOT NULL DEFAULT 0,
        "skor_mitra_komunikasi" INTEGER NOT NULL DEFAULT 0,
        "skor_mitra_tanggung_jawab" INTEGER NOT NULL DEFAULT 0,
        "skor_mitra_bukti_kegiatan" INTEGER NOT NULL DEFAULT 0,
        "skor_mitra_dampak" INTEGER NOT NULL DEFAULT 0,
        "skor_mitra_inisiatif" INTEGER NOT NULL DEFAULT 0,
        "subtotal_mitra" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        "skor_dpl_perencanaan" INTEGER NOT NULL DEFAULT 0,
        "skor_dpl_kontribusi" INTEGER NOT NULL DEFAULT 0,
        "skor_dpl_logbook" INTEGER NOT NULL DEFAULT 0,
        "skor_dpl_analisis" INTEGER NOT NULL DEFAULT 0,
        "skor_dpl_output" INTEGER NOT NULL DEFAULT 0,
        "skor_dpl_laporan_akhir" INTEGER NOT NULL DEFAULT 0,
        "subtotal_dpl" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        "nilai_akhir" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        "kategori_nilai" TEXT,
        "catatan_dpl" TEXT,
        "catatan_mitra" TEXT,
        "status" "StatusPenilaianKkn" NOT NULL DEFAULT 'DRAFT',
        "is_finalized" BOOLEAN NOT NULL DEFAULT false,
        "difinalisasi_pada" TIMESTAMP(3),
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "kritik_saran_pemanfaatan" (
        "id" TEXT PRIMARY KEY,
        "id_pengguna" TEXT NOT NULL,
        "warga_nama" TEXT NOT NULL,
        "id_program_kerja" TEXT,
        "kategori" TEXT DEFAULT 'Pemanfaatan Sampah',
        "judul" TEXT NOT NULL,
        "isi_kritik_saran" TEXT NOT NULL,
        "rating" INTEGER DEFAULT 5,
        "status" TEXT DEFAULT 'MENUNGGU',
        "tanggapan" TEXT,
        "ditanggapi_oleh" TEXT,
        "ditanggapi_pada" TIMESTAMP(3),
        "foto_bukti_url" TEXT,
        "id_rw" INTEGER,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "pemanfaatan_sampah" (
        "id" TEXT PRIMARY KEY,
        "id_rw" INTEGER,
        "id_program_kerja" TEXT,
        "nomor_cara_pemanfaatan" TEXT NOT NULL,
        "program" TEXT NOT NULL,
        "teknologi" TEXT NOT NULL,
        "bahan_baku" TEXT NOT NULL,
        "volume_bahan_baku" DECIMAL(10,2) NOT NULL,
        "unit_bahan_baku" TEXT NOT NULL,
        "hasil" DECIMAL(10,2) NOT NULL,
        "unit_hasil" TEXT NOT NULL,
        "foto_dokumentasi_url" TEXT NOT NULL,
        "tanggal_pencatatan" TIMESTAMP(3) NOT NULL,
        "jenis_komoditas" TEXT,
        "luas_lahan_m2" DECIMAL(8,2),
        "volume_pupuk_dipakai_kg" DECIMAL(8,2),
        "bibit_telur_gram" DECIMAL(8,2),
        "hasil_kasgot_kg" DECIMAL(8,2),
        "volume_bioaktivator_liter" DECIMAL(8,2),
        "masa_fermentasi_hari" INTEGER,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "timeline_kkn" (
        "id" TEXT PRIMARY KEY,
        "tahap_minggu" TEXT NOT NULL,
        "tanggal" TEXT NOT NULL,
        "tanggal_mulai" TIMESTAMP(3),
        "tanggal_selesai" TIMESTAMP(3),
        "fase" TEXT NOT NULL,
        "kegiatan_utama" TEXT NOT NULL,
        "output_target" TEXT NOT NULL,
        "pic_keterangan" TEXT NOT NULL,
        "status_pelaksanaan" TEXT NOT NULL DEFAULT 'BELUM_DIMULAI',
        "id_kelompok" TEXT,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      'ALTER TABLE "timeline_kkn" ADD COLUMN IF NOT EXISTS "tanggal_mulai" TIMESTAMP(3);',
      'ALTER TABLE "timeline_kkn" ADD COLUMN IF NOT EXISTS "tanggal_selesai" TIMESTAMP(3);',
      'CREATE INDEX IF NOT EXISTS "timeline_kkn_id_kelompok_idx" ON "timeline_kkn"("id_kelompok");',
      'CREATE INDEX IF NOT EXISTS "timeline_kkn_fase_idx" ON "timeline_kkn"("fase");',
      'CREATE INDEX IF NOT EXISTS "timeline_kkn_status_pelaksanaan_idx" ON "timeline_kkn"("status_pelaksanaan");',
      `DO $$ BEGIN
        CREATE TYPE "TipeAktivitasKkn" AS ENUM ('KELOMPOK', 'INDIVIDU');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      `DO $$ BEGIN
        CREATE TYPE "StatusLogbookKkn" AS ENUM ('MENUNGGU_PERSETUJUAN_KETUA', 'DITOLAK_KETUA', 'MENUNGGU_VERIFIKASI_DPL', 'DISETUJUI_DPL', 'PERLU_REVISI_DPL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      `CREATE TABLE IF NOT EXISTS "logbook_kkn" (
        "id" TEXT PRIMARY KEY,
        "nomor" INTEGER,
        "id_kelompok" TEXT NOT NULL,
        "id_penulis" TEXT NOT NULL,
        "tanggal_kegiatan" DATE NOT NULL,
        "waktu_mulai" TEXT,
        "waktu_selesai" TEXT,
        "tempat" TEXT NOT NULL,
        "deskripsi" TEXT NOT NULL,
        "foto_bukti_url" TEXT NOT NULL,
        "tipe_aktivitas" "TipeAktivitasKkn" NOT NULL DEFAULT 'KELOMPOK',
        "id_program_kerja" TEXT,
        "id_fasilitas" TEXT,
        "status_persetujuan" "StatusLogbookKkn" NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI_DPL',
        "id_ketua_penyetuju" TEXT,
        "disetujui_ketua_pada" TIMESTAMP(3),
        "catatan_ketua" TEXT,
        "id_dpl_verifikator" TEXT,
        "diverifikasi_dpl_pada" TIMESTAMP(3),
        "catatan_dpl" TEXT,
        "pekan_ke" INTEGER NOT NULL DEFAULT 1,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "logbook_dpl" (
        "id" TEXT PRIMARY KEY,
        "id_dpl" TEXT NOT NULL,
        "id_kelompok" TEXT NOT NULL,
        "tanggal" DATE NOT NULL,
        "pekan_ke" INTEGER NOT NULL,
        "tempat" TEXT NOT NULL,
        "deskripsi" TEXT NOT NULL,
        "arahan_evaluasi" TEXT,
        "foto_bukti_url" TEXT,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      'ALTER TABLE "logbook_dpl" ADD COLUMN IF NOT EXISTS "waktu_mulai" TEXT;',
      'ALTER TABLE "logbook_dpl" ADD COLUMN IF NOT EXISTS "waktu_selesai" TEXT;',
      'ALTER TABLE "logbook_dpl" ADD COLUMN IF NOT EXISTS "kategori" TEXT DEFAULT \'Kunjungan Lapangan\';',
      'ALTER TABLE "logbook_dpl" ADD COLUMN IF NOT EXISTS "id_program_kerja" TEXT;',
      'ALTER TABLE "logbook_dpl" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT \'TERKIRIM\';',
      'ALTER TABLE "logbook_dpl" ADD COLUMN IF NOT EXISTS "durasi_menit" INTEGER DEFAULT 120;',
      'ALTER TABLE "logbook_dpl" ADD COLUMN IF NOT EXISTS "simpan_lokasi" BOOLEAN DEFAULT true;',
      'CREATE INDEX IF NOT EXISTS "logbook_kkn_id_kelompok_tanggal_idx" ON "logbook_kkn"("id_kelompok", "tanggal_kegiatan" DESC);',
      'CREATE INDEX IF NOT EXISTS "logbook_kkn_id_penulis_idx" ON "logbook_kkn"("id_penulis");',
      'CREATE INDEX IF NOT EXISTS "logbook_kkn_status_persetujuan_idx" ON "logbook_kkn"("status_persetujuan");',
      `CREATE TABLE IF NOT EXISTS "sinkronisasi_notifikasi_user" (
        "id" TEXT PRIMARY KEY,
        "id_pengguna" TEXT NOT NULL UNIQUE,
        "terakhir_sinkron" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" TEXT DEFAULT 'SYNCED',
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "master_luaran_sampah" (
        "id" SERIAL PRIMARY KEY,
        "nama" TEXT UNIQUE NOT NULL,
        "kategori" TEXT NOT NULL DEFAULT 'ORGANIK',
        "satuan_default" TEXT NOT NULL DEFAULT 'kg',
        "deskripsi" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      'CREATE INDEX IF NOT EXISTS "logbook_dpl_id_dpl_pekan_idx" ON "logbook_dpl"("id_dpl", "pekan_ke");',
      'CREATE INDEX IF NOT EXISTS "lokasi_mahasiswa_id_mahasiswa_direkam_pada_idx" ON "lokasi_mahasiswa"("id_mahasiswa", "direkam_pada" DESC);',
      `DO $$ BEGIN
        CREATE TYPE "FacilityOwnership" AS ENUM ('MILIK_RW', 'PRIBADI');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      'ALTER TABLE "fasilitas" ADD COLUMN IF NOT EXISTS "kepemilikan" "FacilityOwnership" NOT NULL DEFAULT \'PRIBADI\';',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "id_komunitas" TEXT;',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "is_test_account" BOOLEAN NOT NULL DEFAULT false;',
      'CREATE INDEX IF NOT EXISTS "pengguna_is_test_account_idx" ON "pengguna"("is_test_account");',
      `CREATE TABLE IF NOT EXISTS "universitas_mitra" (
        "id" TEXT NOT NULL,
        "nama" TEXT NOT NULL,
        "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "universitas_mitra_pkey" PRIMARY KEY ("id")
      );`,
      'CREATE UNIQUE INDEX IF NOT EXISTS "universitas_mitra_nama_key" ON "universitas_mitra"("nama");',
      'ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "id_universitas" TEXT;',
      `DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'pengguna_id_universitas_fkey'
        ) THEN
          ALTER TABLE "pengguna" ADD CONSTRAINT "pengguna_id_universitas_fkey" FOREIGN KEY ("id_universitas") REFERENCES "universitas_mitra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;`,
      `INSERT INTO "universitas_mitra" ("id", "nama", "dibuat_pada", "diperbarui_pada")
       SELECT 'unikom-indonesia', 'Universitas Komputer Indonesia (UNIKOM)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       WHERE NOT EXISTS (SELECT 1 FROM "universitas_mitra" LIMIT 1);`,
      `UPDATE "pengguna" 
       SET "id_universitas" = (SELECT "id" FROM "universitas_mitra" WHERE "nama" ILIKE '%unikom%' OR "nama" ILIKE '%komputer indonesia%' LIMIT 1)
       WHERE "id_universitas" IS NULL 
         AND ("institusi" ILIKE '%unikom%' OR "institusi" ILIKE '%komputer indonesia%');`,
    ];

    await Promise.allSettled(alterStatements.map((stmt) => prisma.$executeRawUnsafe(stmt)));
    console.log("[AutoMigration] Database columns checked and synced successfully.");

    // Auto-heal & synchronize Posko KKN photos with facilities records
    try {
      const { poskoKknService } = await import("../services/poskoKknService.js");
      await poskoKknService.syncPoskoPhotosWithFacilities();
    } catch (syncErr) {
      console.warn("[AutoMigration] Posko photo sync error:", syncErr);
    }

    const dummyUser = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: "Ketua RT" } },
          { name: { contains: "Ketua RW" } },
          { name: { contains: "Lurah " } },
          { name: { contains: "Camat " } },
          { name: { startsWith: "Asep RW" } },
          { name: { startsWith: "Bambang RT" } },
        ],
      },
    });
    if (dummyUser) {
      console.log(
        "[AutoSanitize] Found dummy RT/RW/Lurah/Camat names in DB. Please run naming sanitization scripts manually."
      );
    }

    // Auto-restore IoT background telemetri simulator jika sebelumnya aktif sebelum restart
    try {
      const { iotSimulationService } = await import("../services/iotSimulationService.js");
      await iotSimulationService.restoreFromPersistence();
    } catch (iotRestoreErr: any) {
      console.warn("[IoT Simulation] Gagal memulihkan status aliran otomatis:", iotRestoreErr?.message);
    }
  } catch (e: any) {
    console.error("[AutoMigration Log]", e?.message || e);
  }

}
