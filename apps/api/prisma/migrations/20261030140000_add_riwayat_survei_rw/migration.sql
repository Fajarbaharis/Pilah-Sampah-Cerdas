-- AlterTable
ALTER TABLE "survei_rw" ADD COLUMN IF NOT EXISTS "terakhir_diubah_nim" VARCHAR(20);
ALTER TABLE "survei_rw" ADD COLUMN IF NOT EXISTS "terakhir_diubah_oleh" VARCHAR(150);
ALTER TABLE "survei_rw" ADD COLUMN IF NOT EXISTS "versi" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE IF NOT EXISTS "riwayat_survei_rw" (
    "id" TEXT NOT NULL,
    "id_survei_rw" TEXT NOT NULL,
    "versi" INTEGER NOT NULL,
    "tahap" VARCHAR(20) NOT NULL,
    "tahun" VARCHAR(10) NOT NULL,
    "tanggal_survei" DATE NOT NULL,
    "nim" VARCHAR(20) NOT NULL,
    "nama_surveyor" VARCHAR(150) NOT NULL,
    "prodi" VARCHAR(100) NOT NULL,
    "kelompok" VARCHAR(50) NOT NULL,
    "no_wa" VARCHAR(30) NOT NULL,
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
    "alasan_perubahan" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "riwayat_survei_rw_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "riwayat_survei_rw_id_survei_rw_idx" ON "riwayat_survei_rw"("id_survei_rw");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'riwayat_survei_rw_id_survei_rw_fkey'
    ) THEN
        ALTER TABLE "riwayat_survei_rw" ADD CONSTRAINT "riwayat_survei_rw_id_survei_rw_fkey" FOREIGN KEY ("id_survei_rw") REFERENCES "survei_rw"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
