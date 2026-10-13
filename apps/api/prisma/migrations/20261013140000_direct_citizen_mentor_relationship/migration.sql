-- AlterTable: Add id_mahasiswa_pendamping and id_kelompok_kkn to pengguna
ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "id_mahasiswa_pendamping" TEXT;
ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "id_kelompok_kkn" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pengguna_id_mahasiswa_pendamping_idx" ON "pengguna"("id_mahasiswa_pendamping");
CREATE INDEX IF NOT EXISTS "pengguna_id_kelompok_kkn_idx" ON "pengguna"("id_kelompok_kkn");
CREATE INDEX IF NOT EXISTS "pengguna_id_peran_id_rw_idx" ON "pengguna"("id_peran", "id_rw");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pengguna_id_mahasiswa_pendamping_fkey'
    ) THEN
        ALTER TABLE "pengguna" ADD CONSTRAINT "pengguna_id_mahasiswa_pendamping_fkey" FOREIGN KEY ("id_mahasiswa_pendamping") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pengguna_id_kelompok_kkn_fkey'
    ) THEN
        ALTER TABLE "pengguna" ADD CONSTRAINT "pengguna_id_kelompok_kkn_fkey" FOREIGN KEY ("id_kelompok_kkn") REFERENCES "kelompok_kkn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Data Backfill: Backfill existing active citizens from their registered bins
UPDATE "pengguna" u
SET "id_mahasiswa_pendamping" = b."id_mahasiswa_pendaftar",
    "id_kelompok_kkn" = b."id_kelompok"
FROM "tempat_sampah" b
WHERE b."id_pengguna" = u."id"
  AND b."id_mahasiswa_pendaftar" IS NOT NULL
  AND u."id_mahasiswa_pendamping" IS NULL;
