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
  nama?: string;
  nim: string;
  prodi?: string;
  kelompok?: string;
  wa?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan: string;
  rw: string;
  jml_rt?: number | string;
  jml_kk?: number | string;
  karakter?: string[];
  karakter_lain?: string;
  jml_kos?: number | string | null;
  jml_umkm?: number | string | null;
  rumah_pilah: number | string;
  rumah_total: number | string;
  tingkat_pilah?: string;
  bs_aktif?: number | string;
  bs_nonaktif?: number | string;
  bs_catatan?: string;
  komposter?: number | string;
  maggot?: number | string;
  teknologi?: string[];
  teknologi_lain?: string;
  key_player?: Array<{ aktor: string; nama: string; kontak: string; peran: string }>;
  vol_organik: number | string;
  vol_anorganik: number | string;
  vol_residu: number | string;
  prioritas: string;
  risiko?: string;
  catatan_validasi?: string;
}

const KELURAHAN_ID_FALLBACK: Record<string, number> = {
  dago: 1,
  lebakgede: 2,
  "lebak gede": 2,
  sekeloa: 3,
  lebaksiliwangi: 4,
  "lebak siliwangi": 4,
  sadangserang: 5,
  "sadang serang": 5,
  cipaganti: 6,
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

    const kodeSurvey = payload.id || `BRS-${Date.now().toString(36).toUpperCase()}`;
    const tahap = payload.tahap === "Baseline" ? "Baseline" : "Endline";
    const tahun = String(payload.tahun || new Date().getFullYear());
    const tanggalSurvei = payload.tanggal ? new Date(payload.tanggal) : new Date();

    const rumahPilah = Number(payload.rumah_pilah) || 0;
    const rumahTotal = Number(payload.rumah_total) || 0;
    const persenPilah = rumahTotal > 0 ? (rumahPilah / rumahTotal) * 100 : 0;

    let tingkatPilah = payload.tingkat_pilah || "";
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

    const volOrganik = Number(String(payload.vol_organik || "0").replace(",", ".")) || 0;
    const volAnorganik = Number(String(payload.vol_anorganik || "0").replace(",", ".")) || 0;
    const volResidu = Number(String(payload.vol_residu || "0").replace(",", ".")) || 0;
    const volTotal = volOrganik + volAnorganik + volResidu;

    const cleanWa = (payload.wa || studentCheck.wa || "").replace(/\D/g, "").replace(/^62/, "0");

    // 2. Simpan entri survei RW
    const created = await prisma.surveiRw.create({
      data: {
        kodeSurvey,
        tahap,
        tahun,
        tanggalSurvei,
        nim: cleanNim,
        namaSurveyor: payload.nama || studentCheck.nama,
        prodi: payload.prodi || studentCheck.prodi,
        kelompok: payload.kelompok || studentCheck.kelompok,
        noWa: cleanWa,
        studentId: studentCheck.studentId || null,
        kota: payload.kota || "Kota Bandung",
        kecamatan: payload.kecamatan || "Coblong",
        kelurahan: payload.kelurahan,
        rw: payload.rw,
        jumlahRt: Number(payload.jml_rt) || 1,
        jumlahKk: Number(payload.jml_kk) || 1,
        karakter: payload.karakter || [],
        karakterLain: payload.karakter_lain || null,
        jumlahKos: payload.jml_kos != null ? Number(payload.jml_kos) : null,
        jumlahUmkm: payload.jml_umkm != null ? Number(payload.jml_umkm) : null,
        rumahPilah,
        rumahTotal,
        persenPilah: new Prisma.Decimal(persenPilah.toFixed(2)),
        tingkatPilah,
        bankSampahAktif: Number(payload.bs_aktif) || 0,
        bankSampahTidakAktif: Number(payload.bs_nonaktif) || 0,
        unitKomposter: Number(payload.komposter) || 0,
        titikMaggot: Number(payload.maggot) || 0,
        keteranganBankSampah: payload.bs_catatan || null,
        teknologi: payload.teknologi || [],
        teknologiLain: payload.teknologi_lain || null,
        keyPlayer: payload.key_player || [],
        volumeOrganik: new Prisma.Decimal(volOrganik.toFixed(2)),
        volumeAnorganik: new Prisma.Decimal(volAnorganik.toFixed(2)),
        volumeResidu: new Prisma.Decimal(volResidu.toFixed(2)),
        volumeTotal: new Prisma.Decimal(volTotal.toFixed(2)),
        prioritas: payload.prioritas,
        risiko: payload.risiko || null,
        catatanValidasi: payload.catatan_validasi || null,
        status: "TERKIRIM",
      },
    });

    // 3. Sinkronisasi Agregasi Otomatis ke Tingkat Kelurahan (Evaluasi Dampak)
    try {
      await surveyService.aggregateKelurahan(payload.kelurahan, tahap, tahun);
    } catch (aggErr) {
      console.error("Gagal sinkronisasi agregasi kelurahan:", aggErr);
    }

    return created;
  },

  /**
   * Mengagregasi data seluruh RW pada kelurahan tertentu ke tabel SurveiKelurahan / EndlineSurveiKelurahan
   */
  aggregateKelurahan: async (namaKelurahan: string, tahap: string, tahun: string) => {
    // Ambil data survei terbaru per RW untuk kelurahan, tahap, dan tahun yang sesuai
    const allRwSurveys = await prisma.surveiRw.findMany({
      where: {
        kelurahan: { equals: namaKelurahan, mode: "insensitive" },
        tahap,
        tahun,
      },
      orderBy: { createdAt: "desc" },
    });

    if (allRwSurveys.length === 0) return;

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
    const allTeknologi = new Set<string>();

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

      if (Array.isArray(s.teknologi)) {
        s.teknologi.forEach((t) => allTeknologi.add(String(t)));
      }
    }

    const pctPilah = sumRumahTotal > 0 ? (sumRumahPilah / sumRumahTotal) : 0;
    const tingkatPilah =
      sumRumahPilah === 0
        ? "Belum ada"
        : pctPilah < 0.3
          ? "Sebagian kecil"
          : pctPilah <= 0.7
            ? "Sebagian besar"
            : "Mayoritas / hampir semua";

    // Cari ID Kelurahan
    const cleanKelName = namaKelurahan.trim().toLowerCase();
    const existingKel = await prisma.surveiKelurahan.findFirst({
      where: { namaKelurahan: { contains: cleanKelName.replace(/\s+/g, ""), mode: "insensitive" } },
      select: { kelurahanId: true, namaKelurahan: true },
    });

    const kelurahanId = existingKel?.kelurahanId ?? KELURAHAN_ID_FALLBACK[cleanKelName] ?? 1;
    const finalKelName = existingKel?.namaKelurahan || namaKelurahan;

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
    }
  },

  /**
   * Mengambil seluruh data survei RW beserta agregasi rekap per kelurahan
   */
  getSurveyData: async (search?: string) => {
    const where: Prisma.SurveiRwWhereInput = {};
    if (search) {
      where.OR = [
        { namaSurveyor: { contains: search, mode: "insensitive" } },
        { nim: { contains: search, mode: "insensitive" } },
        { kelurahan: { contains: search, mode: "insensitive" } },
        { rw: { contains: search, mode: "insensitive" } },
      ];
    }

    const surveys = await prisma.surveiRw.findMany({
      where,
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
   * Menghapus satu survei RW (opsional)
   */
  deleteSurvey: async (id: string) => {
    const existing = await prisma.surveiRw.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("NOT_FOUND");
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
};
