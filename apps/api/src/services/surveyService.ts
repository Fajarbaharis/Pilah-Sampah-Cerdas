/**
 * Project: BERSEKA
 * Service Layer untuk Fitur Form Survey KKN (Baseline & Endline)
 * Menangani validasi relasi mahasiswa KKN, penyimpanan survei tingkat RW,
 * dan sinkronisasi/agregasi otomatis ke tabel kelurahan untuk Evaluasi Dampak KKN.
 */

import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

export interface SurveySubmitDto {
  id?: string;
  tahap?: string; // "Baseline" | "Endline"
  tahun?: string | number;
  tanggal?: string;
  tanggalSurvei?: string;
  nama?: string;
  namaSurveyor?: string;
  nim: string;
  prodi?: string;
  kelompok?: string;
  wa?: string;
  noWa?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan: string;
  rw: string;
  jml_rt?: number | string;
  jumlahRt?: number | string;
  jml_kk?: number | string;
  jumlahKk?: number | string;
  karakter?: string[];
  karakter_lain?: string;
  karakterLain?: string;
  jml_kos?: number | string | null;
  jumlahKos?: number | string | null;
  jml_umkm?: number | string | null;
  jumlahUmkm?: number | string | null;
  rumah_pilah?: number | string;
  rumahPilah?: number | string;
  rumah_total?: number | string;
  rumahTotal?: number | string;
  persen_pilah?: number | string;
  persenPilah?: number | string;
  tingkat_pilah?: string;
  tingkatPilah?: string;
  bs_aktif?: number | string;
  bankSampahAktif?: number | string;
  bs_nonaktif?: number | string;
  bankSampahTidakAktif?: number | string;
  bs_catatan?: string;
  keteranganBankSampah?: string;
  komposter?: number | string;
  unitKomposter?: number | string;
  maggot?: number | string;
  titikMaggot?: number | string;
  teknologi?: string[];
  teknologi_lain?: string;
  teknologiLain?: string;
  key_player?: Array<{ aktor: string; nama: string; kontak: string; peran: string }>;
  keyPlayer?: Array<{ aktor: string; nama: string; kontak: string; peran: string }>;
  vol_organik?: number | string;
  volumeOrganik?: number | string;
  vol_anorganik?: number | string;
  volumeAnorganik?: number | string;
  vol_residu?: number | string;
  volumeResidu?: number | string;
  volumeTotal?: number | string;
  prioritas: string;
  risiko?: string;
  catatan_validasi?: string;
  catatanValidasi?: string;
}

const KELURAHAN_ID_FALLBACK: Record<string, number> = {
  sadangserang: 1,
  "sadang serang": 1,
  lebaksiliwangi: 2,
  "lebak siliwangi": 2,
  sekeloa: 3,
  dago: 4,
  lebakgede: 5,
  "lebak gede": 5,
  cipaganti: 6,
};

const OFFICIAL_KELURAHAN_NAMES: Record<number, string> = {
  1: "Sadang Serang",
  2: "Lebak Siliwangi",
  3: "Sekeloa",
  4: "Dago",
  5: "Lebak Gede",
  6: "Cipaganti",
};

interface BaselineFallbackData {
  enumerator: string | null;
  tanggalSurvei: string;
  volOrganik: number | null;
  volAnorganik: number | null;
  volResidu: number | null;
  volTotal: number | null;
  rumahPilah: number | null;
  rumahTotal: number | null;
  persenPilah: number | null;
  tingkatPilah: string;
  catatanData: string | null;
  bankSampah?: {
    aktif: number;
    tidakAktif: number;
    komposter: string;
    maggot: string;
    biopori: boolean;
    ecobrick: boolean;
    buruanSae: boolean;
    pengepul: boolean;
    digitalisasi: boolean;
  };
  catatanKesimpulan?: {
    prioritas: string;
    risiko: string;
  };
}

const OFFICIAL_BASELINE_FALLBACKS: Record<number, BaselineFallbackData> = {
  1: {
    enumerator: "Ayu Kusumawati",
    tanggalSurvei: "2026-07-01",
    volOrganik: 5100.0,
    volAnorganik: 2198.5,
    volResidu: 1500.0,
    volTotal: 8798.5,
    rumahPilah: 843,
    rumahTotal: 3400,
    persenPilah: 0.248,
    tingkatPilah: "Sebagian kecil",
    catatanData: null,
    bankSampah: {
      aktif: 3,
      tidakAktif: 1,
      komposter: "5",
      maggot: "2",
      biopori: true,
      ecobrick: true,
      buruanSae: true,
      pengepul: true,
      digitalisasi: true,
    },
    catatanKesimpulan: {
      prioritas: "Peningkatan kapasitas pengolahan organik; Sentra Maggot Coblong",
      risiko: "Volume timbulan sampah sangat besar",
    },
  },
  2: {
    enumerator: "Setiadi",
    tanggalSurvei: "2026-07-15",
    volOrganik: 7.0,
    volAnorganik: 3.0,
    volResidu: 2.0,
    volTotal: 12.0,
    rumahPilah: 127,
    rumahTotal: 850,
    persenPilah: 0.15,
    tingkatPilah: "Sebagian kecil",
    catatanData: null,
    bankSampah: {
      aktif: 1,
      tidakAktif: 0,
      komposter: "2",
      maggot: "1",
      biopori: true,
      ecobrick: true,
      buruanSae: true,
      pengepul: true,
      digitalisasi: false,
    },
    catatanKesimpulan: {
      prioritas: "Sticker edukasi di pintu kos; Kos Sadar Sampah",
      risiko: "Banyak kos mahasiswa pasif",
    },
  },
  3: {
    enumerator: "Nugi",
    tanggalSurvei: "2026-07-13",
    volOrganik: 6482.27,
    volAnorganik: 3241.13,
    volResidu: 1080.38,
    volTotal: 10803.78,
    rumahPilah: 921,
    rumahTotal: 5173,
    persenPilah: 0.178,
    tingkatPilah: "Sebagian kecil",
    catatanData: null,
    bankSampah: {
      aktif: 5,
      tidakAktif: 10,
      komposter: "25",
      maggot: "1",
      biopori: false,
      ecobrick: false,
      buruanSae: true,
      pengepul: false,
      digitalisasi: false,
    },
    catatanKesimpulan: {
      prioritas: "Pembentukan bank sampah, sarana prasarana pengolahan organik RW, dan DTDE",
      risiko: "Ekonomi kebanyakan menengah ke bawah, tingkat pendidikan rata-rata SMA, banyak pekerja sektor informal",
    },
  },
  4: {
    enumerator: "Taufik",
    tanggalSurvei: "2026-07-14",
    volOrganik: 350.0,
    volAnorganik: 150.0,
    volResidu: 100.0,
    volTotal: 600.0,
    rumahPilah: 240,
    rumahTotal: 2400,
    persenPilah: 0.1,
    tingkatPilah: "Sebagian kecil",
    catatanData: null,
    bankSampah: {
      aktif: 2,
      tidakAktif: 1,
      komposter: "3",
      maggot: "0",
      biopori: true,
      ecobrick: true,
      buruanSae: true,
      pengepul: true,
      digitalisasi: true,
    },
    catatanKesimpulan: {
      prioritas: "Kerja sama pemilahan sisa makanan kafe/kuliner; Optimalisasi Bank Sampah",
      risiko: "Volume sampah kafe/kuliner tinggi",
    },
  },
  5: {
    enumerator: "Hardiansyah",
    tanggalSurvei: "2026-07-15",
    volOrganik: 200.0,
    volAnorganik: 50.0,
    volResidu: null,
    volTotal: 3003.5,
    rumahPilah: 496,
    rumahTotal: 2288,
    persenPilah: 0.216,
    tingkatPilah: "Sebagian kecil",
    catatanData: null,
    bankSampah: {
      aktif: 1,
      tidakAktif: 0,
      komposter: "54",
      maggot: "3",
      biopori: false,
      ecobrick: false,
      buruanSae: false,
      pengepul: false,
      digitalisasi: false,
    },
    catatanKesimpulan: {
      prioritas: "Pembentukan bank sampah; Edukasi pemilahan secara massal",
      risiko: "Individu cenderung sulit diintervensi, rentan penolakan ketika edukasi door to door",
    },
  },
  6: {
    enumerator: null,
    tanggalSurvei: "2026-07-16",
    volOrganik: null,
    volAnorganik: null,
    volResidu: null,
    volTotal: null,
    rumahPilah: null,
    rumahTotal: null,
    persenPilah: 0.1367,
    tingkatPilah: "Sebagian kecil",
    catatanData: "Data survei baseline pemilahan 13,67% diinput secara manual sebagai data real.",
    bankSampah: {
      aktif: 2,
      tidakAktif: 0,
      komposter: "",
      maggot: "RT 7 (1 hari 200 kg)",
      biopori: false,
      ecobrick: false,
      buruanSae: false,
      pengepul: false,
      digitalisasi: false,
    },
    catatanKesimpulan: {
      prioritas: "Masyarakat dimotivasi untuk membuat bank sampah",
      risiko: "Rumah besar di Jalan Cipaganti sulit ditemui",
    },
  },
};

export const surveyService = {
  /**
   * Verifikasi Mahasiswa KKN berdasarkan NIM untuk memastikan pengisi form terdaftar resmi di database.
   */
  verifyStudent: async (rawNim: string) => {
    const nimClean = (rawNim || "").replace(/\D/g, "").trim();
    if (!nimClean) {
      return {
        registered: false,
        message: "NIM wajib diisi.",
      };
    }

    const student = await prisma.studentKkn.findFirst({
      where: { nim: nimClean },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        kelompok: { select: { id: true, name: true, kelurahan: true, cakupanRw: true } },
      },
    });

    if (!student) {
      return {
        registered: false,
        message: `NIM ${nimClean} tidak ditemukan dalam database Mahasiswa KKN Berseka.`,
      };
    }

    return {
      registered: true,
      studentId: student.id,
      userId: student.userId,
      nama: student.user?.name || "",
      nim: student.nim || nimClean,
      prodi: student.jurusan || "",
      fakultas: student.fakultas || "",
      kelompok: student.kelompok?.name || "",
      kelurahan: student.kelompok?.kelurahan || "",
      cakupanRw: student.kelompok?.cakupanRw || null,
      wa: student.noWa || student.user?.phone || "",
    };
  },

  /**
   * Menyimpan submission survei tingkat RW dan mengagregasi ke tingkat kelurahan.
   */
  submitSurvey: async (payload: SurveySubmitDto) => {
    const cleanNim = (payload.nim || "").replace(/\D/g, "").trim();
    if (!cleanNim) {
      throw new Error("NIM_REQUIRED");
    }

    // 1. Verifikasi wajib mahasiswa KKN
    const studentCheck = await surveyService.verifyStudent(cleanNim);
    if (!studentCheck.registered) {
      const err = new Error("STUDENT_NOT_VERIFIED");
      (err as any).details = studentCheck.message;
      throw err;
    }

    // Validasi kesesuaian Kelurahan binaan kelompok
    if (studentCheck.kelurahan && studentCheck.kelurahan.trim() !== "") {
      const normalizeKel = (k: string) =>
        (k || "").toLowerCase().replace(/^(kelurahan|desa)\s*/i, "").replace(/\s+/g, "").trim();
      const normPayloadKel = normalizeKel(payload.kelurahan);
      const normAssignedKel = normalizeKel(studentCheck.kelurahan);
      if (
        normPayloadKel !== normAssignedKel &&
        !normPayloadKel.includes(normAssignedKel) &&
        !normAssignedKel.includes(normPayloadKel)
      ) {
        const err = new Error("KELURAHAN_MISMATCH");
        (err as any).details = `Kelurahan ${payload.kelurahan} tidak sesuai dengan wilayah penugasan kelompok Anda (${studentCheck.kelurahan}).`;
        throw err;
      }
    }

    // Validasi kesesuaian cakupan RW binaan kelompok
    if (studentCheck.cakupanRw) {
      let allowedRws: string[] = [];
      if (Array.isArray(studentCheck.cakupanRw)) {
        allowedRws = studentCheck.cakupanRw.map((r: any) => String(r).replace(/\D/g, "")).filter(Boolean);
      } else if (typeof studentCheck.cakupanRw === "string") {
        try {
          const parsed = JSON.parse(studentCheck.cakupanRw);
          if (Array.isArray(parsed)) {
            allowedRws = parsed.map((r: any) => String(r).replace(/\D/g, "")).filter(Boolean);
          }
        } catch {
          const match = studentCheck.cakupanRw.match(/\d+/g);
          if (match) allowedRws = match;
        }
      }

      if (allowedRws.length > 0) {
        const payloadRwDigit = (payload.rw || "").replace(/\D/g, "");
        const isMatch = allowedRws.some((r) => parseInt(r, 10) === parseInt(payloadRwDigit, 10));
        if (!isMatch) {
          const err = new Error("RW_MISMATCH");
          const formattedAllowed = allowedRws
            .map((r) => `RW ${String(parseInt(r, 10)).padStart(2, "0")}`)
            .join(", ");
          (err as any).details = `RW ${payload.rw} bukan bagian dari cakupan RW binaan kelompok Anda (${formattedAllowed}).`;
          throw err;
        }
      }
    }

    const kodeSurvey = payload.id || `BRS-${Date.now().toString(36).toUpperCase()}`;
    const tahap = payload.tahap === "Baseline" ? "Baseline" : "Endline";
    const tahun = String(payload.tahun || new Date().getFullYear());
    const tanggalSurvei = payload.tanggal
      ? new Date(payload.tanggal)
      : payload.tanggalSurvei
        ? new Date(payload.tanggalSurvei)
        : new Date();

    // Validasi prasyarat: Endline hanya boleh disimpan jika data Baseline untuk RW tersebut sudah ada
    if (tahap === "Endline") {
      const baselineCount = await prisma.surveiRw.count({
        where: {
          kelurahan: { equals: payload.kelurahan.trim(), mode: "insensitive" },
          rw: { equals: payload.rw.trim(), mode: "insensitive" },
          tahap: { equals: "Baseline", mode: "insensitive" },
        },
      });

      if (baselineCount === 0) {
        const err = new Error("BASELINE_REQUIRED");
        (err as any).details = `Survei Endline untuk RW ${payload.rw} belum dapat disimpan karena data Baseline belum tersedia. Silakan isi survei Baseline terlebih dahulu.`;
        throw err;
      }
    }

    const rumahPilah = Number(payload.rumah_pilah ?? payload.rumahPilah) || 0;
    const rumahTotal = Number(payload.rumah_total ?? payload.rumahTotal) || 0;
    const persenPilah = rumahTotal > 0 ? (rumahPilah / rumahTotal) * 100 : 0;

    let tingkatPilah = payload.tingkat_pilah || payload.tingkatPilah || "";
    if (!tingkatPilah) {
      tingkatPilah =
        rumahPilah === 0
          ? "Belum ada"
          : persenPilah < 30
            ? "Sebagian kecil"
            : persenPilah <= 70
              ? "Sebagian besar"
              : "Mayoritas / hampir semua";
    }

    const volOrganik = Number(String(payload.vol_organik ?? payload.volumeOrganik ?? "0").replace(",", ".")) || 0;
    const volAnorganik = Number(String(payload.vol_anorganik ?? payload.volumeAnorganik ?? "0").replace(",", ".")) || 0;
    const volResidu = Number(String(payload.vol_residu ?? payload.volumeResidu ?? "0").replace(",", ".")) || 0;
    const volTotal = volOrganik + volAnorganik + volResidu;

    const cleanWa = (payload.wa || payload.noWa || studentCheck.wa || "").replace(/\D/g, "").replace(/^62/, "0");

    // 2. Simpan atau perbarui entri survei RW (Single Master dengan Snapshot Riwayat Revisi)
    const existing = await prisma.surveiRw.findFirst({
      where: {
        kelurahan: payload.kelurahan,
        rw: payload.rw,
        tahap,
        tahun,
      },
      orderBy: { createdAt: "desc" },
    });

    let resultSurvey;

    if (existing) {
      // Cadangkan versi sebelumnya ke tabel riwayat_survei_rw sebelum diperbarui
      await prisma.riwayatSurveiRw.create({
        data: {
          surveiRwId: existing.id,
          versi: existing.versi,
          tahap: existing.tahap,
          tahun: existing.tahun,
          tanggalSurvei: existing.tanggalSurvei,
          nim: existing.nim,
          namaSurveyor: existing.namaSurveyor,
          prodi: existing.prodi,
          kelompok: existing.kelompok,
          noWa: existing.noWa,
          kelurahan: existing.kelurahan,
          rw: existing.rw,
          jumlahRt: existing.jumlahRt,
          jumlahKk: existing.jumlahKk,
          karakter: existing.karakter ?? Prisma.DbNull,
          karakterLain: existing.karakterLain,
          jumlahKos: existing.jumlahKos,
          jumlahUmkm: existing.jumlahUmkm,
          rumahPilah: existing.rumahPilah,
          rumahTotal: existing.rumahTotal,
          persenPilah: existing.persenPilah,
          tingkatPilah: existing.tingkatPilah,
          bankSampahAktif: existing.bankSampahAktif,
          bankSampahTidakAktif: existing.bankSampahTidakAktif,
          unitKomposter: existing.unitKomposter,
          titikMaggot: existing.titikMaggot,
          keteranganBankSampah: existing.keteranganBankSampah,
          teknologi: existing.teknologi ?? Prisma.DbNull,
          teknologiLain: existing.teknologiLain,
          keyPlayer: existing.keyPlayer ?? Prisma.DbNull,
          volumeOrganik: existing.volumeOrganik,
          volumeAnorganik: existing.volumeAnorganik,
          volumeResidu: existing.volumeResidu,
          volumeTotal: existing.volumeTotal,
          prioritas: existing.prioritas,
          risiko: existing.risiko,
          catatanValidasi: existing.catatanValidasi,
          alasanPerubahan: `Diperbarui oleh ${payload.nama || studentCheck.nama} (NIM: ${cleanNim})`,
          createdAt: existing.updatedAt || existing.createdAt,
        },
      });

      // Update data aktif di master survei_rw dan naikkan nomor versi
      resultSurvey = await prisma.surveiRw.update({
        where: { id: existing.id },
        data: {
          kodeSurvey,
          tanggalSurvei,
          nim: cleanNim,
          namaSurveyor: payload.nama || payload.namaSurveyor || studentCheck.nama,
          prodi: payload.prodi || studentCheck.prodi,
          kelompok: payload.kelompok || studentCheck.kelompok,
          noWa: cleanWa,
          studentId: studentCheck.studentId || null,
          jumlahRt: Number(payload.jml_rt ?? payload.jumlahRt) || 1,
          jumlahKk: Number(payload.jml_kk ?? payload.jumlahKk) || 1,
          karakter: payload.karakter || [],
          karakterLain: payload.karakter_lain || payload.karakterLain || null,
          jumlahKos: (payload.jml_kos ?? payload.jumlahKos) != null ? Number(payload.jml_kos ?? payload.jumlahKos) : null,
          jumlahUmkm: (payload.jml_umkm ?? payload.jumlahUmkm) != null ? Number(payload.jml_umkm ?? payload.jumlahUmkm) : null,
          rumahPilah,
          rumahTotal,
          persenPilah: new Prisma.Decimal(persenPilah.toFixed(2)),
          tingkatPilah,
          bankSampahAktif: Number(payload.bs_aktif ?? payload.bankSampahAktif) || 0,
          bankSampahTidakAktif: Number(payload.bs_nonaktif ?? payload.bankSampahTidakAktif) || 0,
          unitKomposter: Number(payload.komposter ?? payload.unitKomposter) || 0,
          titikMaggot: Number(payload.maggot ?? payload.titikMaggot) || 0,
          keteranganBankSampah: payload.bs_catatan || payload.keteranganBankSampah || null,
          teknologi: payload.teknologi || [],
          teknologiLain: payload.teknologi_lain || payload.teknologiLain || null,
          keyPlayer: payload.key_player || payload.keyPlayer || [],
          volumeOrganik: new Prisma.Decimal(volOrganik.toFixed(2)),
          volumeAnorganik: new Prisma.Decimal(volAnorganik.toFixed(2)),
          volumeResidu: new Prisma.Decimal(volResidu.toFixed(2)),
          volumeTotal: new Prisma.Decimal(volTotal.toFixed(2)),
          prioritas: payload.prioritas || "Optimalisasi pemilahan di sumber",
          risiko: payload.risiko || null,
          catatanValidasi: payload.catatan_validasi || payload.catatanValidasi || null,
          versi: existing.versi + 1,
          terakhirDiubahOleh: payload.nama || payload.namaSurveyor || studentCheck.nama,
          terakhirDiubahNim: cleanNim,
          updatedAt: new Date(),
        },
      });
    } else {
      // Simpan sebagai data baru (Versi 1)
      resultSurvey = await prisma.surveiRw.create({
        data: {
          kodeSurvey,
          tahap,
          tahun,
          tanggalSurvei,
          nim: cleanNim,
          namaSurveyor: payload.nama || payload.namaSurveyor || studentCheck.nama,
          prodi: payload.prodi || studentCheck.prodi,
          kelompok: payload.kelompok || studentCheck.kelompok,
          noWa: cleanWa,
          studentId: studentCheck.studentId || null,
          kota: payload.kota || "Kota Bandung",
          kecamatan: payload.kecamatan || "Coblong",
          kelurahan: payload.kelurahan,
          rw: payload.rw,
          jumlahRt: Number(payload.jml_rt ?? payload.jumlahRt) || 1,
          jumlahKk: Number(payload.jml_kk ?? payload.jumlahKk) || 1,
          karakter: payload.karakter || [],
          karakterLain: payload.karakter_lain || payload.karakterLain || null,
          jumlahKos: (payload.jml_kos ?? payload.jumlahKos) != null ? Number(payload.jml_kos ?? payload.jumlahKos) : null,
          jumlahUmkm: (payload.jml_umkm ?? payload.jumlahUmkm) != null ? Number(payload.jml_umkm ?? payload.jumlahUmkm) : null,
          rumahPilah,
          rumahTotal,
          persenPilah: new Prisma.Decimal(persenPilah.toFixed(2)),
          tingkatPilah,
          bankSampahAktif: Number(payload.bs_aktif ?? payload.bankSampahAktif) || 0,
          bankSampahTidakAktif: Number(payload.bs_nonaktif ?? payload.bankSampahTidakAktif) || 0,
          unitKomposter: Number(payload.komposter ?? payload.unitKomposter) || 0,
          titikMaggot: Number(payload.maggot ?? payload.titikMaggot) || 0,
          keteranganBankSampah: payload.bs_catatan || payload.keteranganBankSampah || null,
          teknologi: payload.teknologi || [],
          teknologiLain: payload.teknologi_lain || payload.teknologiLain || null,
          keyPlayer: payload.key_player || payload.keyPlayer || [],
          volumeOrganik: new Prisma.Decimal(volOrganik.toFixed(2)),
          volumeAnorganik: new Prisma.Decimal(volAnorganik.toFixed(2)),
          volumeResidu: new Prisma.Decimal(volResidu.toFixed(2)),
          volumeTotal: new Prisma.Decimal(volTotal.toFixed(2)),
          prioritas: payload.prioritas || "Optimalisasi pemilahan di sumber",
          risiko: payload.risiko || null,
          catatanValidasi: payload.catatan_validasi || payload.catatanValidasi || null,
          status: "TERKIRIM",
          versi: 1,
        },
      });
    }

    // 3. Sinkronisasi Agregasi Otomatis ke Tingkat Kelurahan (Evaluasi Dampak)
    try {
      await surveyService.aggregateKelurahan(payload.kelurahan, tahap, tahun);
    } catch (aggErr) {
      console.error("Gagal sinkronisasi agregasi kelurahan:", aggErr);
    }

    return resultSurvey;
  },

  /**
   * Mengagregasi data seluruh RW pada kelurahan tertentu ke tabel SurveiKelurahan / EndlineSurveiKelurahan
   */
  aggregateKelurahan: async (namaKelurahan: string, tahap: string, tahun: string) => {
    // Cari ID dan Nama Resmi Kelurahan terlebih dahulu agar pencarian RW mencakup variasi penulisan
    const cleanKelName = namaKelurahan.trim().toLowerCase();
    const existingKel = await prisma.surveiKelurahan.findFirst({
      where: {
        OR: [
          { namaKelurahan: { equals: namaKelurahan.trim(), mode: "insensitive" } },
          { namaKelurahan: { contains: cleanKelName, mode: "insensitive" } },
        ],
      },
      select: { kelurahanId: true, namaKelurahan: true },
    });

    const kelurahanId = existingKel?.kelurahanId ?? KELURAHAN_ID_FALLBACK[cleanKelName] ?? 1;
    const finalKelName = existingKel?.namaKelurahan ?? OFFICIAL_KELURAHAN_NAMES[kelurahanId] ?? namaKelurahan;

    // Ambil data survei terbaru per RW untuk kelurahan, tahap, dan tahun yang sesuai
    const allRwSurveys = await prisma.surveiRw.findMany({
      where: {
        OR: [
          { kelurahan: { equals: namaKelurahan.trim(), mode: "insensitive" } },
          { kelurahan: { equals: finalKelName, mode: "insensitive" } },
          { kelurahan: { contains: cleanKelName.replace(/\s+/g, ""), mode: "insensitive" } },
        ],
        tahap,
        tahun,
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter deduplikasi: hanya ambil versi paling baru untuk setiap RW
    const rwMap = new Map<string, (typeof allRwSurveys)[0]>();
    for (const s of allRwSurveys) {
      if (!rwMap.has(s.rw)) {
        rwMap.set(s.rw, s);
      }
    }
    const latestSurveys = Array.from(rwMap.values());

    // Hitung agregasi
    let sumOrganik = 0;
    let sumAnorganik = 0;
    let sumResidu = 0;
    let sumTotalVolume = 0;
    let sumRumahPilah = 0;
    let sumRumahTotal = 0;
    let sumBsAktif = 0;
    let sumBsNonaktif = 0;
    let sumKomposter = 0;
    let sumMaggot = 0;
    let sumJumlahKos = 0;
    let sumJumlahUmkm = 0;
    const allTeknologi = new Set<string>();
    const allKarakterLain: string[] = [];

    const karakterHas = (karakterArray: any, keyword: string) => {
      if (!Array.isArray(karakterArray)) return false;
      const kw = keyword.toLowerCase();
      return karakterArray.some((k) => String(k).toLowerCase().includes(kw));
    };

    for (const s of latestSurveys) {
      sumOrganik += Number(s.volumeOrganik) || 0;
      sumAnorganik += Number(s.volumeAnorganik) || 0;
      sumResidu += Number(s.volumeResidu) || 0;
      sumTotalVolume += Number(s.volumeTotal) || 0;
      sumRumahPilah += s.rumahPilah || 0;
      sumRumahTotal += s.rumahTotal || 0;
      sumBsAktif += s.bankSampahAktif || 0;
      sumBsNonaktif += s.bankSampahTidakAktif || 0;
      sumKomposter += s.unitKomposter || 0;
      sumMaggot += s.titikMaggot || 0;

      if (s.jumlahKos && s.jumlahKos > 0) sumJumlahKos += s.jumlahKos;
      if (s.jumlahUmkm && s.jumlahUmkm > 0) sumJumlahUmkm += s.jumlahUmkm;
      if (s.karakterLain && String(s.karakterLain).trim()) {
        allKarakterLain.push(String(s.karakterLain).trim());
      }

      if (Array.isArray(s.teknologi)) {
        s.teknologi.forEach((t) => allTeknologi.add(String(t)));
      }
    }

    const hasRwPadat = latestSurveys.some((s) => karakterHas(s.karakter, "padat"));
    const hasRwKos = latestSurveys.some((s) => karakterHas(s.karakter, "kos") || (s.jumlahKos && s.jumlahKos > 0));
    const hasRwUmkm = latestSurveys.some(
      (s) => karakterHas(s.karakter, "umkm") || karakterHas(s.karakter, "warung") || (s.jumlahUmkm && s.jumlahUmkm > 0)
    );
    const hasRwKampus = latestSurveys.some(
      (s) => karakterHas(s.karakter, "kampus") || karakterHas(s.karakter, "sekolah")
    );
    const hasRwPasar = latestSurveys.some((s) => karakterHas(s.karakter, "pasar"));
    const hasRwSungai = latestSurveys.some(
      (s) => karakterHas(s.karakter, "sungai") || karakterHas(s.karakter, "bantaran")
    );

    const pctPilah = sumRumahTotal > 0 ? (sumRumahPilah / sumRumahTotal) : 0;
    const tingkatPilah =
      sumRumahPilah === 0
        ? "Belum ada"
        : pctPilah < 0.3
          ? "Sebagian kecil"
          : pctPilah <= 0.7
            ? "Sebagian besar"
            : "Mayoritas / hampir semua";

    if (latestSurveys.length === 0) {
      if (tahap === "Endline") {
        // Jika seluruh survei RW Endline pada kelurahan ini telah dihapus, hapus entri Endline kelurahan
        await prisma.endlineSurveiKelurahan.delete({
          where: { kelurahanId },
        }).catch(() => null);
        return;
      } else if (tahap === "Baseline") {
        // Jika seluruh survei RW Baseline dihapus, pulihkan profil baseline wilayah resmi
        const fallback = OFFICIAL_BASELINE_FALLBACKS[kelurahanId];
        if (fallback) {
          await prisma.surveiKelurahan.update({
            where: { kelurahanId },
            data: {
              tanggalSurvei: new Date(fallback.tanggalSurvei),
              enumerator: fallback.enumerator,
              catatanData: fallback.catatanData,
            },
          }).catch(() => null);

          await prisma.surveiVolumeSampah.upsert({
            where: { kelurahanId },
            create: {
              kelurahanId,
              organikKgPerHari: fallback.volOrganik != null ? new Prisma.Decimal(fallback.volOrganik.toFixed(2)) : null,
              anorganikKgPerHari: fallback.volAnorganik != null ? new Prisma.Decimal(fallback.volAnorganik.toFixed(2)) : null,
              residuKgPerHari: fallback.volResidu != null ? new Prisma.Decimal(fallback.volResidu.toFixed(2)) : null,
              totalVolumeKgPerHari: fallback.volTotal != null ? new Prisma.Decimal(fallback.volTotal.toFixed(2)) : null,
              catatan: fallback.catatanData || "Baseline profil wilayah resmi",
            },
            update: {
              organikKgPerHari: fallback.volOrganik != null ? new Prisma.Decimal(fallback.volOrganik.toFixed(2)) : null,
              anorganikKgPerHari: fallback.volAnorganik != null ? new Prisma.Decimal(fallback.volAnorganik.toFixed(2)) : null,
              residuKgPerHari: fallback.volResidu != null ? new Prisma.Decimal(fallback.volResidu.toFixed(2)) : null,
              totalVolumeKgPerHari: fallback.volTotal != null ? new Prisma.Decimal(fallback.volTotal.toFixed(2)) : null,
              catatan: fallback.catatanData || "Baseline profil wilayah resmi",
            },
          }).catch(() => null);

          await prisma.surveiPemilahanSampah.upsert({
            where: { kelurahanId },
            create: {
              kelurahanId,
              jumlahRumahMemilah: fallback.rumahPilah,
              totalJumlahRumahDiRw: fallback.rumahTotal,
              persentasePemilahan: fallback.persenPilah != null ? new Prisma.Decimal(fallback.persenPilah.toFixed(4)) : null,
              tingkatPemilahan: fallback.tingkatPilah,
              catatan: fallback.catatanData || "Baseline profil wilayah resmi",
            },
            update: {
              jumlahRumahMemilah: fallback.rumahPilah,
              totalJumlahRumahDiRw: fallback.rumahTotal,
              persentasePemilahan: fallback.persenPilah != null ? new Prisma.Decimal(fallback.persenPilah.toFixed(4)) : null,
              tingkatPemilahan: fallback.tingkatPilah,
              catatan: fallback.catatanData || "Baseline profil wilayah resmi",
            },
          }).catch(() => null);

          if (fallback.bankSampah) {
            await prisma.surveiBankSampahPengolahan.upsert({
              where: { kelurahanId },
              create: {
                kelurahanId,
                bankSampahAktif: fallback.bankSampah.aktif,
                bankSampahTidakAktif: fallback.bankSampah.tidakAktif,
                jumlahUnitKomposter: fallback.bankSampah.komposter,
                jumlahTitikMaggotBsf: fallback.bankSampah.maggot,
                bioporiLoseda: fallback.bankSampah.biopori,
                ecobrickKerajinanDaurUlang: fallback.bankSampah.ecobrick,
                buruanSae: fallback.bankSampah.buruanSae,
                pengepulMitraDaurUlang: fallback.bankSampah.pengepul,
                digitalisasiData: fallback.bankSampah.digitalisasi,
                aktivitasLainnyaKeterangan: null,
              },
              update: {
                bankSampahAktif: fallback.bankSampah.aktif,
                bankSampahTidakAktif: fallback.bankSampah.tidakAktif,
                jumlahUnitKomposter: fallback.bankSampah.komposter,
                jumlahTitikMaggotBsf: fallback.bankSampah.maggot,
                bioporiLoseda: fallback.bankSampah.biopori,
                ecobrickKerajinanDaurUlang: fallback.bankSampah.ecobrick,
                buruanSae: fallback.bankSampah.buruanSae,
                pengepulMitraDaurUlang: fallback.bankSampah.pengepul,
                digitalisasiData: fallback.bankSampah.digitalisasi,
                aktivitasLainnyaKeterangan: null,
              },
            }).catch(() => null);
          }

          if (fallback.catatanKesimpulan) {
            await prisma.surveiCatatanKesimpulan.upsert({
              where: { kelurahanId },
              create: {
                kelurahanId,
                prioritasIntervensi: fallback.catatanKesimpulan.prioritas,
                catatanTambahanRisikoSosial: fallback.catatanKesimpulan.risiko,
              },
              update: {
                prioritasIntervensi: fallback.catatanKesimpulan.prioritas,
                catatanTambahanRisikoSosial: fallback.catatanKesimpulan.risiko,
              },
            }).catch(() => null);
          }
        }
        return;
      }
    }

    if (tahap === "Endline") {
      // Upsert Endline Kelurahan
      await prisma.endlineSurveiKelurahan.upsert({
        where: { kelurahanId },
        create: {
          kelurahanId,
          namaKelurahan: finalKelName,
          kecamatan: "Coblong",
          tanggalSurvei: new Date(),
          enumerator: `Mahasiswa KKN (${latestSurveys.length} RW)`,
          catatanData: `Agregasi otomatis dari ${latestSurveys.length} RW via survey.berseka.id`,
        },
        update: {
          namaKelurahan: finalKelName,
          tanggalSurvei: new Date(),
          enumerator: `Mahasiswa KKN (${latestSurveys.length} RW)`,
          catatanData: `Agregasi otomatis dari ${latestSurveys.length} RW via survey.berseka.id`,
        },
      });

      // Upsert Endline Volume
      await prisma.endlineVolumeSampah.upsert({
        where: { kelurahanId },
        create: {
          kelurahanId,
          organikKgPerHari: new Prisma.Decimal(sumOrganik.toFixed(2)),
          anorganikKgPerHari: new Prisma.Decimal(sumAnorganik.toFixed(2)),
          residuKgPerHari: new Prisma.Decimal(sumResidu.toFixed(2)),
          totalVolumeKgPerHari: new Prisma.Decimal(sumTotalVolume.toFixed(2)),
          catatan: `Total volume harian dihitung dari akumulasi ${latestSurveys.length} RW.`,
        },
        update: {
          organikKgPerHari: new Prisma.Decimal(sumOrganik.toFixed(2)),
          anorganikKgPerHari: new Prisma.Decimal(sumAnorganik.toFixed(2)),
          residuKgPerHari: new Prisma.Decimal(sumResidu.toFixed(2)),
          totalVolumeKgPerHari: new Prisma.Decimal(sumTotalVolume.toFixed(2)),
          catatan: `Total volume harian dihitung dari akumulasi ${latestSurveys.length} RW.`,
        },
      });

      // Upsert Endline Pemilahan
      await prisma.endlinePemilahanSampah.upsert({
        where: { kelurahanId },
        create: {
          kelurahanId,
          jumlahRumahMemilah: sumRumahPilah,
          totalJumlahRumahDiRw: sumRumahTotal,
          persentasePemilahan: new Prisma.Decimal(pctPilah.toFixed(4)),
          tingkatPemilahan: tingkatPilah,
          catatan: `Tingkat pemilahan rata-rata wilayah dari ${latestSurveys.length} RW.`,
        },
        update: {
          jumlahRumahMemilah: sumRumahPilah,
          totalJumlahRumahDiRw: sumRumahTotal,
          persentasePemilahan: new Prisma.Decimal(pctPilah.toFixed(4)),
          tingkatPemilahan: tingkatPilah,
          catatan: `Tingkat pemilahan rata-rata wilayah dari ${latestSurveys.length} RW.`,
        },
      });

      // Upsert Endline Bank Sampah & Pengolahan
      await prisma.endlineBankSampahPengolahan.upsert({
        where: { kelurahanId },
        create: {
          kelurahanId,
          bankSampahAktif: sumBsAktif,
          bankSampahTidakAktif: sumBsNonaktif,
          jumlahUnitKomposter: String(sumKomposter),
          jumlahTitikMaggotBsf: String(sumMaggot),
          bioporiLoseda: allTeknologi.has("Biopori/loseda"),
          ecobrickKerajinanDaurUlang: allTeknologi.has("Ecobrick/kerajinan daur ulang"),
          buruanSae: allTeknologi.has("Buruan Sae"),
          pengepulMitraDaurUlang: allTeknologi.has("Pengepul/mitra daur ulang"),
          digitalisasiData: allTeknologi.has("Digitalisasi data (WA/aplikasi)"),
          aktivitasLainnyaKeterangan: `Fasilitas aktif terlaporkan di ${latestSurveys.length} RW`,
        },
        update: {
          bankSampahAktif: sumBsAktif,
          bankSampahTidakAktif: sumBsNonaktif,
          jumlahUnitKomposter: String(sumKomposter),
          jumlahTitikMaggotBsf: String(sumMaggot),
          bioporiLoseda: allTeknologi.has("Biopori/loseda"),
          ecobrickKerajinanDaurUlang: allTeknologi.has("Ecobrick/kerajinan daur ulang"),
          buruanSae: allTeknologi.has("Buruan Sae"),
          pengepulMitraDaurUlang: allTeknologi.has("Pengepul/mitra daur ulang"),
          digitalisasiData: allTeknologi.has("Digitalisasi data (WA/aplikasi)"),
          aktivitasLainnyaKeterangan: `Fasilitas aktif terlaporkan di ${latestSurveys.length} RW`,
        },
      });

      // Update kesimpulan dari survei RW terbaru jika ada
      const samplePrioritas = latestSurveys[0]?.prioritas;
      const sampleRisiko = latestSurveys[0]?.risiko;
      if (samplePrioritas || sampleRisiko) {
        await prisma.endlineCatatanKesimpulan.upsert({
          where: { kelurahanId },
          create: {
            kelurahanId,
            prioritasIntervensi: samplePrioritas || "Optimalisasi pemilahan di sumber",
            catatanTambahanRisikoSosial: sampleRisiko || null,
          },
          update: {
            prioritasIntervensi: samplePrioritas || undefined,
            catatanTambahanRisikoSosial: sampleRisiko || undefined,
          },
        });
      }
    } else if (tahap === "Baseline") {
      // Upsert Baseline Kelurahan
      await prisma.surveiKelurahan.upsert({
        where: { kelurahanId },
        create: {
          kelurahanId,
          namaKelurahan: finalKelName,
          kecamatan: "Coblong",
          tanggalSurvei: new Date(),
          enumerator: `Mahasiswa KKN (${latestSurveys.length} RW)`,
          catatanData: `Agregasi otomatis Baseline dari ${latestSurveys.length} RW via survey.berseka.id`,
        },
        update: {
          namaKelurahan: finalKelName,
          tanggalSurvei: new Date(),
          enumerator: `Mahasiswa KKN (${latestSurveys.length} RW)`,
          catatanData: `Agregasi otomatis Baseline dari ${latestSurveys.length} RW via survey.berseka.id`,
        },
      });

      // Upsert Baseline Volume
      await prisma.surveiVolumeSampah.upsert({
        where: { kelurahanId },
        create: {
          kelurahanId,
          organikKgPerHari: new Prisma.Decimal(sumOrganik.toFixed(2)),
          anorganikKgPerHari: new Prisma.Decimal(sumAnorganik.toFixed(2)),
          residuKgPerHari: new Prisma.Decimal(sumResidu.toFixed(2)),
          totalVolumeKgPerHari: new Prisma.Decimal(sumTotalVolume.toFixed(2)),
          catatan: `Total volume harian Baseline dihitung dari akumulasi ${latestSurveys.length} RW.`,
        },
        update: {
          organikKgPerHari: new Prisma.Decimal(sumOrganik.toFixed(2)),
          anorganikKgPerHari: new Prisma.Decimal(sumAnorganik.toFixed(2)),
          residuKgPerHari: new Prisma.Decimal(sumResidu.toFixed(2)),
          totalVolumeKgPerHari: new Prisma.Decimal(sumTotalVolume.toFixed(2)),
          catatan: `Total volume harian Baseline dihitung dari akumulasi ${latestSurveys.length} RW.`,
        },
      });

      // Upsert Baseline Pemilahan
      await prisma.surveiPemilahanSampah.upsert({
        where: { kelurahanId },
        create: {
          kelurahanId,
          jumlahRumahMemilah: sumRumahPilah,
          totalJumlahRumahDiRw: sumRumahTotal,
          persentasePemilahan: new Prisma.Decimal(pctPilah.toFixed(4)),
          tingkatPemilahan: tingkatPilah,
          catatan: `Tingkat pemilahan rata-rata wilayah Baseline dari ${latestSurveys.length} RW.`,
        },
        update: {
          jumlahRumahMemilah: sumRumahPilah,
          totalJumlahRumahDiRw: sumRumahTotal,
          persentasePemilahan: new Prisma.Decimal(pctPilah.toFixed(4)),
          tingkatPemilahan: tingkatPilah,
          catatan: `Tingkat pemilahan rata-rata wilayah Baseline dari ${latestSurveys.length} RW.`,
        },
      });

      // Upsert Baseline Bank Sampah & Pengolahan
      await prisma.surveiBankSampahPengolahan.upsert({
        where: { kelurahanId },
        create: {
          kelurahanId,
          bankSampahAktif: sumBsAktif,
          bankSampahTidakAktif: sumBsNonaktif,
          jumlahUnitKomposter: String(sumKomposter),
          jumlahTitikMaggotBsf: String(sumMaggot),
          bioporiLoseda: allTeknologi.has("Biopori/loseda"),
          ecobrickKerajinanDaurUlang: allTeknologi.has("Ecobrick/kerajinan daur ulang"),
          buruanSae: allTeknologi.has("Buruan Sae"),
          pengepulMitraDaurUlang: allTeknologi.has("Pengepul/mitra daur ulang"),
          digitalisasiData: allTeknologi.has("Digitalisasi data (WA/aplikasi)"),
          aktivitasLainnyaKeterangan: `Fasilitas aktif terlaporkan di ${latestSurveys.length} RW`,
        },
        update: {
          bankSampahAktif: sumBsAktif,
          bankSampahTidakAktif: sumBsNonaktif,
          jumlahUnitKomposter: String(sumKomposter),
          jumlahTitikMaggotBsf: String(sumMaggot),
          bioporiLoseda: allTeknologi.has("Biopori/loseda"),
          ecobrickKerajinanDaurUlang: allTeknologi.has("Ecobrick/kerajinan daur ulang"),
          buruanSae: allTeknologi.has("Buruan Sae"),
          pengepulMitraDaurUlang: allTeknologi.has("Pengepul/mitra daur ulang"),
          digitalisasiData: allTeknologi.has("Digitalisasi data (WA/aplikasi)"),
          aktivitasLainnyaKeterangan: `Fasilitas aktif terlaporkan di ${latestSurveys.length} RW`,
        },
      });

      // Update kesimpulan dari survei RW terbaru jika ada
      const samplePrioritas = latestSurveys[0]?.prioritas;
      const sampleRisiko = latestSurveys[0]?.risiko;
      if (samplePrioritas || sampleRisiko) {
        await prisma.surveiCatatanKesimpulan.upsert({
          where: { kelurahanId },
          create: {
            kelurahanId,
            prioritasIntervensi: samplePrioritas || "Optimalisasi pemilahan di sumber",
            catatanTambahanRisikoSosial: sampleRisiko || null,
          },
          update: {
            prioritasIntervensi: samplePrioritas || undefined,
            catatanTambahanRisikoSosial: sampleRisiko || undefined,
          },
        });
      }

      // Upsert/sinkronisasi Karakteristik Wilayah gabungan (Makro Kelurahan + Mikro RW)
      const existingKarakter = await prisma.surveiKarakteristikWilayah.findUnique({
        where: { kelurahanId },
      });

      const finalKos = sumJumlahKos > 0 ? String(sumJumlahKos) : (existingKarakter?.perkiraanJumlahKosKontrakan || "");
      const finalUmkm = sumJumlahUmkm > 0 ? String(sumJumlahUmkm) : (existingKarakter?.perkiraanJumlahUmkmWarungKafe || "");

      const combinedKarakterLain = Array.from(
        new Set(
          [existingKarakter?.karakterLainnyaKeterangan, ...allKarakterLain]
            .filter((item): item is string => Boolean(item && item.trim()))
        )
      ).join("; ");

      await prisma.surveiKarakteristikWilayah.upsert({
        where: { kelurahanId },
        create: {
          kelurahanId,
          padatPenduduk: hasRwPadat,
          banyakKosKontrakan: hasRwKos,
          banyakUmkmWarungKafe: hasRwUmkm,
          dekatKampusSekolah: hasRwKampus,
          pasar: hasRwPasar,
          bantaranSungai: hasRwSungai,
          karakterLainnyaFlag: Boolean(combinedKarakterLain),
          karakterLainnyaKeterangan: combinedKarakterLain || null,
          perkiraanJumlahKosKontrakan: finalKos || null,
          perkiraanJumlahUmkmWarungKafe: finalUmkm || null,
        },
        update: {
          padatPenduduk: existingKarakter?.padatPenduduk != null ? (existingKarakter.padatPenduduk || hasRwPadat) : hasRwPadat,
          banyakKosKontrakan: existingKarakter?.banyakKosKontrakan != null ? (existingKarakter.banyakKosKontrakan || hasRwKos) : hasRwKos,
          banyakUmkmWarungKafe: existingKarakter?.banyakUmkmWarungKafe != null ? (existingKarakter.banyakUmkmWarungKafe || hasRwUmkm) : hasRwUmkm,
          dekatKampusSekolah: existingKarakter?.dekatKampusSekolah != null ? (existingKarakter.dekatKampusSekolah || hasRwKampus) : hasRwKampus,
          pasar: existingKarakter?.pasar != null ? (existingKarakter.pasar || hasRwPasar) : hasRwPasar,
          bantaranSungai: existingKarakter?.bantaranSungai != null ? (existingKarakter.bantaranSungai || hasRwSungai) : hasRwSungai,
          karakterLainnyaFlag: Boolean(combinedKarakterLain),
          karakterLainnyaKeterangan: combinedKarakterLain || existingKarakter?.karakterLainnyaKeterangan || null,
          perkiraanJumlahKosKontrakan: finalKos || existingKarakter?.perkiraanJumlahKosKontrakan || null,
          perkiraanJumlahUmkmWarungKafe: finalUmkm || existingKarakter?.perkiraanJumlahUmkmWarungKafe || null,
        },
      });
    }
  },

  /**
   * Mengambil seluruh data survei RW beserta agregasi rekap per kelurahan
   */
  getSurveyData: async (search?: string, tahap?: string, kelurahan?: string) => {
    const where: Prisma.SurveiRwWhereInput = {};

    if (tahap && tahap.toUpperCase() !== "SEMUA") {
      where.tahap = { equals: tahap, mode: "insensitive" };
    }

    if (kelurahan && kelurahan.toUpperCase() !== "SEMUA") {
      where.kelurahan = { equals: kelurahan, mode: "insensitive" };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { namaSurveyor: { contains: q, mode: "insensitive" } },
            { nim: { contains: q, mode: "insensitive" } },
            { kelurahan: { contains: q, mode: "insensitive" } },
            { rw: { contains: q, mode: "insensitive" } },
            { kelompok: { contains: q, mode: "insensitive" } },
            { kodeSurvey: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    const surveys = await prisma.surveiRw.findMany({
      where,
      include: {
        riwayat: {
          select: {
            id: true,
            versi: true,
            namaSurveyor: true,
            nim: true,
            tanggalSurvei: true,
            createdAt: true,
          },
          orderBy: { versi: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Hitung rekap per kelurahan & tahap (menggunakan data terbaru per RW)
    const latestMap: Record<string, (typeof surveys)[0]> = {};
    surveys.forEach((d) => {
      const k = `${d.tahun}|${d.tahap}|${d.kelurahan}|${d.rw}`;
      if (!latestMap[k]) latestMap[k] = d;
    });

    const groups: Record<
      string,
      {
        kel: string;
        tahap: string;
        tahun: string;
        rw: number;
        o: number;
        a: number;
        r: number;
        t: number;
        p: number;
      }
    > = {};

    Object.values(latestMap).forEach((d) => {
      const k = `${d.kelurahan}|${d.tahap}|${d.tahun}`;
      if (!groups[k]) {
        groups[k] = {
          kel: d.kelurahan,
          tahap: d.tahap,
          tahun: d.tahun,
          rw: 0,
          o: 0,
          a: 0,
          r: 0,
          t: 0,
          p: 0,
        };
      }
      const g = groups[k];
      g.rw++;
      g.o += Number(d.volumeOrganik) || 0;
      g.a += Number(d.volumeAnorganik) || 0;
      g.r += Number(d.volumeResidu) || 0;
      g.t += Number(d.volumeTotal) || 0;
      g.p += Number(d.persenPilah) || 0;
    });

    const rekap = Object.values(groups).sort(
      (a, b) => a.kel.localeCompare(b.kel) || a.tahap.localeCompare(b.tahap)
    );

    const metrics = {
      total: surveys.length,
      baseline: surveys.filter((s) => s.tahap === "Baseline").length,
      endline: surveys.filter((s) => s.tahap === "Endline").length,
      rwCount: new Set(surveys.map((s) => `${s.kelurahan}|${s.rw}`)).size,
    };

    return {
      metrics,
      rekap,
      surveys,
    };
  },

  /**
   * Mengembalikan daftar semua KelompokKkn dari database.
   * Digunakan form frontend sebagai referensi kelompok mahasiswa KKN.
   */
  getKelompokList: async () => {
    return prisma.kelompokKkn.findMany({
      select: { id: true, name: true, kelurahan: true, cakupanRw: true },
      orderBy: { name: "asc" },
    });
  },

  /**
   * Cek apakah RW pada kelurahan, tahap, dan tahun tertentu sudah pernah disurvei
   */
  checkRwSurvey: async (kelurahan: string, rw: string, tahap: string, tahun: string) => {
    if (!kelurahan || !rw) {
      return { exists: false, survey: null, hasBaseline: false, baselineSurvey: null };
    }

    const cleanKel = kelurahan.trim();
    const cleanRw = rw.trim();
    const cleanTahap = tahap.trim();
    const cleanTahun = (tahun || "").trim();

    // 1. Ambil survei untuk tahap dan RW yang sedang aktif diperiksa
    const whereTarget: Prisma.SurveiRwWhereInput = {
      kelurahan: { equals: cleanKel, mode: "insensitive" },
      rw: { equals: cleanRw, mode: "insensitive" },
      tahap: { equals: cleanTahap, mode: "insensitive" },
    };
    if (cleanTahun) {
      whereTarget.tahun = { equals: cleanTahun, mode: "insensitive" };
    }

    const existing = await prisma.surveiRw.findFirst({
      where: whereTarget,
      orderBy: { createdAt: "desc" },
    });

    // 2. Ambil survei baseline untuk RW ini
    let baseline: any = null;
    if (cleanTahap.toLowerCase() === "baseline") {
      baseline = existing;
    } else {
      const whereBaseline: Prisma.SurveiRwWhereInput = {
        kelurahan: { equals: cleanKel, mode: "insensitive" },
        rw: { equals: cleanRw, mode: "insensitive" },
        tahap: { equals: "Baseline", mode: "insensitive" },
      };
      if (cleanTahun) {
        whereBaseline.tahun = { equals: cleanTahun, mode: "insensitive" };
      }
      baseline = await prisma.surveiRw.findFirst({
        where: whereBaseline,
        orderBy: { createdAt: "desc" },
      });
      // Fallback tanpa batas tahun jika belum ketemu
      if (!baseline && cleanTahun) {
        baseline = await prisma.surveiRw.findFirst({
          where: {
            kelurahan: { equals: cleanKel, mode: "insensitive" },
            rw: { equals: cleanRw, mode: "insensitive" },
            tahap: { equals: "Baseline", mode: "insensitive" },
          },
          orderBy: { createdAt: "desc" },
        });
      }
    }

    return {
      exists: !!existing,
      survey: existing || null,
      hasBaseline: !!baseline,
      baselineSurvey: baseline || null,
    };
  },

  /**
   * Menghapus satu survei RW (opsional)
   */
  deleteSurvey: async (id: string, nim?: string) => {
    const existing = await prisma.surveiRw.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("NOT_FOUND");
    }
    if (nim && existing.nim && existing.nim.trim() !== nim.trim()) {
      throw new Error("FORBIDDEN");
    }
    const deleted = await prisma.surveiRw.delete({ where: { id } });
    // Re-aggregate
    try {
      await surveyService.aggregateKelurahan(existing.kelurahan, existing.tahap, existing.tahun);
    } catch (e) {
      console.error("Gagal sinkronisasi agregasi kelurahan pasca-hapus:", e);
    }
    return deleted;
  },

  /**
   * Mengambil riwayat revisi linimasa lengkap dari survei RW tertentu
   */
  getSurveyRiwayat: async (id: string) => {
    const survey = await prisma.surveiRw.findUnique({
      where: { id },
      include: {
        riwayat: {
          orderBy: { versi: "desc" },
        },
      },
    });
    return survey;
  },
};
