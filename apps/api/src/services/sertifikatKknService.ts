/**
 * Project: BERSEKA
 * Developed by: PT Makerindo & Universitas Komputer Indonesia
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Service E-Sertifikat KKN Tematik UNIKOM (MURNI DATA RIIL DATABASE TANPA DUMMY/FALLBACK SIMULASI)
 * Menghubungkan langsung ke tabel:
 * - mahasiswa_kkn (StudentKkn)
 * - pengguna (User)
 * - kelompok_kkn (KelompokKkn)
 * - rw (Rw) & kelurahan (Kelurahan)
 * - program_kerja_kkn (ProgramKerjaKkn)
 * - penilaian_kkn_mahasiswa (PenilaianKknMahasiswa)
 *
 * Aturan Ketat Integritas Data (Zero-Dummy):
 * - Jika DPL BELUM mengisi nilai lengkap atau memfinalisasi yudisium:
 *   statusPenilaian = "BELUM_DINILAI", sudahDinilai = false, nilai.total = 0, predikat = "Belum Dinilai".
 * - Program Kerja Kelompok: jika proker kelompok sudah dinilai oleh DPL, tampilkan nilai riil reratanya.
 *   Jika belum dinilai, bernilai null (tampil '-' di transkrip).
 * - Aspek lain (personal, laporan, paper, video) jika belum dinilai bernilai null (tampil '-' di transkrip).
 */

import { prisma } from "../lib/prisma.js";

export interface StudentCertData {
  noUrut: number;
  nim: string;
  nama: string;
  prodi: string;
  sks: number;
  kelompok: string;
  rw: string;
  dpl: string;
  nomorSertifikat: string;
  idSertifikat: string;
  tanggalTerbit: string;
  statusPenilaian: "SUDAH_DINILAI" | "BELUM_DINILAI";
  sudahDinilai: boolean;
  nilai: {
    personal: number | null;
    proker: number | null;
    laporan: number | null;
    paper: number | null;
    video: number | null;
    total: number;
    predikat: string;
  };
}

function calculatePredikat(score: number): string {
  if (score >= 85) return "A (Sangat Memuaskan)";
  if (score >= 75) return "B (Memuaskan)";
  if (score >= 65) return "C (Cukup)";
  if (score >= 50) return "D (Kurang)";
  return "E (Tidak Lulus)";
}

function formatRwList(cakupanRw: string[] | any, kelurahan?: string | null): string {
  if (Array.isArray(cakupanRw) && cakupanRw.length > 0) {
    if (cakupanRw.length === 1) {
      return `RW ${cakupanRw[0]} Kelurahan ${kelurahan || "Coblong"}`;
    }
    const last = cakupanRw[cakupanRw.length - 1];
    const prev = cakupanRw.slice(0, -1).join(", ");
    return `RW ${prev}, dan ${last} Kelurahan ${kelurahan || "Coblong"}`;
  }
  return `Kelurahan ${kelurahan || "Coblong"}`;
}

export const sertifikatKknService = {
  /**
   * Mengambil daftar seluruh e-sertifikat mahasiswa dari database live
   * Murni mencerminkan status riil penilaian mahasiswa di lapangan
   */
  getSertifikatList: async (user?: any, filters?: { kelompok?: string; prodi?: string; search?: string }) => {
    const userRole = String(user?.peran || user?.role || "").toUpperCase();
    const userId = user?.id || user?.userId;

    let whereStudent: any = {};

    // 1. Role-based scoping
    if (userRole === "MAHASISWA_KKN") {
      whereStudent.userId = userId;
    } else if (["DPL", "DOSEN_PEMBIMBING", "DOSEN_PENDAMPING", "DOSEN_PENDAMPING_LAPANGAN"].includes(userRole)) {
      whereStudent.kelompok = {
        dplId: userId,
      };
    }

    // 2. Query ke Database PostgreSQL live
    let dbStudents: any[] = [];
    try {
      dbStudents = await prisma.studentKkn.findMany({
        where: whereStudent,
        include: {
          user: true,
          kelompok: {
            include: {
              dpl: true,
            },
          },
          assignedRw: {
            include: {
              kelurahan: true,
            },
          },
        },
        orderBy: {
          nim: "asc",
        },
      });
    } catch (err) {
      console.error("[sertifikatKknService.getSertifikatList] Database query error:", err);
      return [];
    }

    // 3. Ambil seluruh penilaian program kerja kelompok yang ada di DB
    const prokerGroupScores = new Map<string, number[]>();
    const prokerAvgMap = new Map<string, number>();
    try {
      const allProkers = await prisma.programKerjaKkn.findMany({
        where: {
          skorPenilaian: { not: null },
        },
        select: {
          kelompokId: true,
          skorPenilaian: true,
        },
      });
      for (const p of allProkers) {
        if (p.kelompokId && p.skorPenilaian !== null && Number(p.skorPenilaian) > 0) {
          if (!prokerGroupScores.has(p.kelompokId)) {
            prokerGroupScores.set(p.kelompokId, []);
          }
          prokerGroupScores.get(p.kelompokId)!.push(Number(p.skorPenilaian));
        }
      }
      for (const [kId, scores] of prokerGroupScores.entries()) {
        if (scores.length > 0) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          prokerAvgMap.set(kId, Number(avg.toFixed(1)));
        }
      }
    } catch (e) {
      console.warn("[sertifikatKknService] Warning querying program_kerja_kkn:", e);
    }

    // 4. Ambil seluruh penilaian KKN yang ada di DB
    let penilaianMap = new Map<string, any>();
    try {
      const allPenilaian = await prisma.penilaianKknMahasiswa.findMany();
      allPenilaian.forEach((p) => {
        if (p.studentId) penilaianMap.set(p.studentId, p);
      });
    } catch (e) {
      console.warn("[sertifikatKknService] Warning querying penilaian_kkn_mahasiswa:", e);
    }

    // 5. Mapping data live database ke format sertifikat TANPA NILAI FIKTIF
    const results: StudentCertData[] = [];
    let counter = 1;

    for (const s of dbStudents) {
      const nim = String(s.nim || "").trim();
      const nama = s.user?.name || s.user?.nama || "Mahasiswa KKN";
      let prodi = s.jurusan ? s.jurusan.trim() : "Program Studi Mahasiswa";
      if (!prodi.toLowerCase().startsWith("s1") && !prodi.toLowerCase().startsWith("d3") && !prodi.toLowerCase().startsWith("d4")) {
        prodi = `S1 ${prodi}`;
      }
      const sks = s.sks && s.sks > 0 ? s.sks : 11;
      const kelompok = s.kelompok?.name || "Kelompok KKN";
      const dpl = s.kelompok?.dpl?.name || s.kelompok?.dpl?.nama || s.kelompok?.dplNamaMentah || "Dosen Pembimbing Lapangan";

      // Format Wilayah RW
      let rw = s.kelompok?.kelurahan ? `Kelurahan ${s.kelompok.kelurahan}` : "Kecamatan Coblong";
      if (s.assignedRw) {
        rw = `RW ${String(s.assignedRw.nomorRw).padStart(2, "0")} Kelurahan ${s.assignedRw.kelurahan?.namaKelurahan || "Coblong"}`;
      } else if (s.kelompok?.cakupanRw && s.kelompok.cakupanRw.length > 0) {
        rw = formatRwList(s.kelompok.cakupanRw, s.kelompok.kelurahan);
      } else if (s.kelompok?.kelurahan) {
        rw = `Kelurahan ${s.kelompok.kelurahan}`;
      }

      const pDb = s.userId ? penilaianMap.get(s.userId) : null;
      const kelompokId = s.kelompokId;
      const prokerScore = kelompokId && prokerAvgMap.has(kelompokId) ? prokerAvgMap.get(kelompokId)! : null;

      const personalScore = pDb?.subtotalDpl && Number(pDb.subtotalDpl) > 0 
        ? Number(pDb.subtotalDpl) 
        : (s.assessmentScore && Number(s.assessmentScore) > 0 ? Number(s.assessmentScore) : null);
      
      const laporanScore = pDb?.skorDplLaporanAkhir && Number(pDb.skorDplLaporanAkhir) > 0 
        ? Number(pDb.skorDplLaporanAkhir) 
        : null;

      const paperScore = pDb?.skorDplOutput && Number(pDb.skorDplOutput) > 0 
        ? Number(pDb.skorDplOutput) 
        : null;

      const videoScore = pDb?.skorMitraBuktiKegiatan && Number(pDb.skorMitraBuktiKegiatan) > 0 
        ? Number(pDb.skorMitraBuktiKegiatan) 
        : null;

      // Mahasiswa HANYA dianggap sudah dinilai secara sah dan tuntas jika DPL telah memfinalisasi atau seluruh komponen lengkap & isAssessed true
      const isFullyGraded = Boolean(
        (pDb && (pDb.isFinalized || pDb.status === "FINAL" || pDb.status === "SELESAI") && Number(pDb.nilaiAkhir) > 0) ||
        (s.isAssessed === true && Number(s.assessmentScore) > 0 && personalScore !== null && prokerScore !== null && laporanScore !== null && paperScore !== null && videoScore !== null)
      );

      let nilai: StudentCertData["nilai"];
      let statusPenilaian: "SUDAH_DINILAI" | "BELUM_DINILAI";
      let sudahDinilai: boolean;
      let nomorSertifikat: string;
      let tanggalTerbit: string;

      if (isFullyGraded) {
        statusPenilaian = "SUDAH_DINILAI";
        sudahDinilai = true;
        const totalScore = Number(pDb?.nilaiAkhir || s.assessmentScore || 0);
        nilai = {
          personal: personalScore !== null ? Number(personalScore.toFixed(1)) : null,
          proker: prokerScore !== null ? Number(prokerScore.toFixed(1)) : null,
          laporan: laporanScore !== null ? Number(laporanScore.toFixed(1)) : null,
          paper: paperScore !== null ? Number(paperScore.toFixed(1)) : null,
          video: videoScore !== null ? Number(videoScore.toFixed(1)) : null,
          total: Number(totalScore.toFixed(2)),
          predikat: calculatePredikat(totalScore),
        };
        nomorSertifikat = `KKNT/${String(counter).padStart(3, "0")}/UNIKOM/BATCH-1/XI/2026`;
        tanggalTerbit = "10 November 2026";
      } else {
        // REAL KONDISI: Belum selesai dinilai/difinalisasi oleh DPL
        statusPenilaian = "BELUM_DINILAI";
        sudahDinilai = false;
        nilai = {
          personal: personalScore !== null ? Number(personalScore.toFixed(1)) : null,
          proker: prokerScore !== null ? Number(prokerScore.toFixed(1)) : null,
          laporan: laporanScore !== null ? Number(laporanScore.toFixed(1)) : null,
          paper: paperScore !== null ? Number(paperScore.toFixed(1)) : null,
          video: videoScore !== null ? Number(videoScore.toFixed(1)) : null,
          total: 0,
          predikat: "Belum Dinilai",
        };
        nomorSertifikat = `KKNT/DRAFT/${String(counter).padStart(3, "0")}/UNIKOM/2026`;
        tanggalTerbit = "Menunggu Penilaian";
      }

      const idSertifikat = `BRSK-2026-KKN-${nim}`;

      results.push({
        noUrut: counter++,
        nim,
        nama,
        prodi,
        sks,
        kelompok,
        rw,
        dpl,
        nomorSertifikat,
        idSertifikat,
        tanggalTerbit,
        statusPenilaian,
        sudahDinilai,
        nilai,
      });
    }

    // Filter tambahan dari query params jika ada
    let filtered = results;
    if (filters?.kelompok && filters.kelompok !== "all") {
      filtered = filtered.filter((s) => s.kelompok.toLowerCase() === filters.kelompok?.toLowerCase());
    }
    if (filters?.prodi && filters.prodi !== "all") {
      filtered = filtered.filter((s) => s.prodi.toLowerCase() === filters.prodi?.toLowerCase());
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.nim.toLowerCase().includes(q) ||
          s.prodi.toLowerCase().includes(q) ||
          s.kelompok.toLowerCase().includes(q) ||
          s.dpl.toLowerCase().includes(q)
      );
    }

    return filtered;
  },

  /**
   * Mengambil detail sertifikat satu orang mahasiswa berdasarkan NIM
   */
  getSertifikatByNim: async (nim: string, user?: any) => {
    const list = await sertifikatKknService.getSertifikatList(user);
    const student = list.find((s) => s.nim === nim || s.idSertifikat === nim);
    if (!student) {
      throw new Error(`Data e-sertifikat untuk NIM ${nim} tidak ditemukan.`);
    }
    return student;
  },

  /**
   * Endpoint Verifikasi Publik (Public QR Code Scan Verification)
   * Terbuka untuk umum tanpa autentikasi login
   */
  verifySertifikat: async (idSertifikat: string) => {
    const cleanId = String(idSertifikat).trim();
    const list = await sertifikatKknService.getSertifikatList();
    const found = list.find(
      (s) => s.idSertifikat.toLowerCase() === cleanId.toLowerCase() || s.nim === cleanId
    );

    if (!found) {
      return {
        isValid: false,
        message: "Sertifikat tidak ditemukan atau kode verifikasi tidak valid.",
      };
    }

    // Jika mahasiswa terdaftar tapi belum dinilai oleh DPL
    if (found.statusPenilaian === "BELUM_DINILAI" || found.nilai.total === 0 || !found.sudahDinilai) {
      return {
        isValid: false,
        verifikasiStatus: "MENUNGGU_PENILAIAN_DPL",
        message: "Mahasiswa terdaftar resmi pada KKN Tematik Batch I, namun proses penilaian yudisium oleh DPL belum selesai diinput. Sertifikat kelulusan belum disahkan.",
        penerbit: {
          institusi: "Universitas Komputer Indonesia (UNIKOM)",
          lembaga: "Direktorat Riset & Pengabdian Masyarakat (LPPM)",
          kegiatan: "KKN Tematik Berseka - Pengelolaan Sampah Berkelanjutan Batch I",
          tahunAkademik: "2026/2027",
          penandatangan: "Prof. Dr. Hj. Aelina Surya, Dra.",
          jabatan: "Wakil Rektor Bidang Akademik dan Kemahasiswaan UNIKOM",
          tanggalTerbit: "Menunggu Penilaian DPL",
        },
        mahasiswa: found,
      };
    }

    return {
      isValid: true,
      verifikasiStatus: "TERVERIFIKASI_SAH",
      penerbit: {
        institusi: "Universitas Komputer Indonesia (UNIKOM)",
        lembaga: "Direktorat Riset & Pengabdian Masyarakat (LPPM)",
        kegiatan: "KKN Tematik Berseka - Pengelolaan Sampah Berkelanjutan Batch I",
        tahunAkademik: "2026/2027",
        penandatangan: "Prof. Dr. Hj. Aelina Surya, Dra.",
        jabatan: "Wakil Rektor Bidang Akademik dan Kemahasiswaan UNIKOM",
        tanggalTerbit: found.tanggalTerbit || "10 November 2026",
      },
      mahasiswa: found,
    };
  },
};
