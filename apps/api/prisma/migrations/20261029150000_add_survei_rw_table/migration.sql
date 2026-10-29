-- CreateTable
CREATE TABLE IF NOT EXISTS "survei_rw" (
    "id" TEXT NOT NULL,
    "kode_survey" VARCHAR(50) NOT NULL,
    "tahap" VARCHAR(20) NOT NULL,
    "tahun" VARCHAR(10) NOT NULL,
    "tanggal_survei" DATE NOT NULL,
    "nim" VARCHAR(20) NOT NULL,
    "nama_surveyor" VARCHAR(150) NOT NULL,
    "prodi" VARCHAR(100) NOT NULL,
    "kelompok" VARCHAR(50) NOT NULL,
    "no_wa" VARCHAR(30) NOT NULL,
    "id_student_kkn" TEXT,
    "kota" VARCHAR(100) NOT NULL DEFAULT 'Kota Bandung',
    "kecamatan" VARCHAR(100) NOT NULL DEFAULT 'Coblong',
    "kelurahan" VARCHAR(100) NOT NULL,
    "rw" VARCHAR(20) NOT NULL,
    "jumlah_rt" INTEGER NOT NULL,
    "jumlah_kk" INTEGER NOT NULL,
    "karakter" JSONB,
    "karakter_lain" TEXT,
    "jumlah_kos" INTEGER,
    "jumlah_umkm" INTEGER,
    "rumah_pilah" INTEGER NOT NULL,
    "rumah_total" INTEGER NOT NULL,
    "persen_pilah" DECIMAL(5,2) NOT NULL,
    "tingkat_pilah" VARCHAR(50) NOT NULL,
    "bank_sampah_aktif" INTEGER NOT NULL DEFAULT 0,
    "bank_sampah_tidak_aktif" INTEGER NOT NULL DEFAULT 0,
    "unit_komposter" INTEGER NOT NULL DEFAULT 0,
    "titik_maggot" INTEGER NOT NULL DEFAULT 0,
    "keterangan_bank_sampah" TEXT,
    "teknologi" JSONB,
    "teknologi_lain" TEXT,
    "key_player" JSONB,
    "volume_organik" DECIMAL(10,2) NOT NULL,
    "volume_anorganik" DECIMAL(10,2) NOT NULL,
    "volume_residu" DECIMAL(10,2) NOT NULL,
    "volume_total" DECIMAL(10,2) NOT NULL,
    "prioritas" TEXT NOT NULL,
    "risiko" TEXT,
    "catatan_validasi" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'TERKIRIM',
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survei_rw_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "survei_rw_kode_survey_key" ON "survei_rw"("kode_survey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "survei_rw_kelurahan_rw_idx" ON "survei_rw"("kelurahan", "rw");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "survei_rw_tahap_tahun_idx" ON "survei_rw"("tahap", "tahun");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "survei_rw_nim_idx" ON "survei_rw"("nim");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'survei_rw_id_student_kkn_fkey'
    ) THEN
        ALTER TABLE "survei_rw" ADD CONSTRAINT "survei_rw_id_student_kkn_fkey" FOREIGN KEY ("id_student_kkn") REFERENCES "mahasiswa_kkn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
