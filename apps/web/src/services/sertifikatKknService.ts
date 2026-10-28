/**
 * Project: BERSEKA - Official UNIKOM Certificate Service
 * Developed by: PT Makerindo & Universitas Komputer Indonesia
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Frontend Service untuk E-Sertifikat KKN Tematik UNIKOM
 * Mengambil data live real-time dari REST API:
 * - GET /api/v1/sertifikat-kkn/list
 * - GET /api/v1/sertifikat-kkn/detail/:nim
 * - GET /api/v1/sertifikat-kkn/verify/:idSertifikat
 */

import api from "../utils/api";
import fallbackStudentsRaw from "../data/students_certificates_data.json";

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
  statusPenilaian?: "SUDAH_DINILAI" | "BELUM_DINILAI";
  sudahDinilai?: boolean;
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

export interface VerificationResult {
  isValid: boolean;
  verifikasiStatus?: string;
  penerbit?: {
    institusi: string;
    lembaga: string;
    kegiatan: string;
    tahunAkademik: string;
    penandatangan: string;
    jabatan: string;
    tanggalTerbit: string;
  };
  mahasiswa?: StudentCertData;
  message?: string;
}

export const sertifikatKknService = {
  /**
   * Mengambil daftar e-sertifikat mahasiswa langsung dari backend API (Database live)
   */
  getSertifikatList: async (params?: { kelompok?: string; prodi?: string; search?: string; forceRefresh?: boolean }): Promise<StudentCertData[]> => {
    try {
      const queryParams: any = { ...params };
      if (params?.forceRefresh) {
        queryParams._t = Date.now();
      }
      const res = await api.get("/sertifikat-kkn/list", { params: queryParams });
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        return res.data.data as StudentCertData[];
      }
    } catch (err) {
      console.warn("[sertifikatKknService.getSertifikatList] Live API query failed, fallback to local data:", err);
    }
    // Fallback data jika API offline
    let list = fallbackStudentsRaw as unknown as StudentCertData[];
    if (params?.kelompok && params.kelompok !== "ALL" && params.kelompok !== "all") {
      list = list.filter((s) => s.kelompok.toLowerCase() === params.kelompok?.toLowerCase());
    }
    if (params?.prodi && params.prodi !== "ALL" && params.prodi !== "all") {
      list = list.filter((s) => s.prodi.toLowerCase() === params.prodi?.toLowerCase());
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.nim.toLowerCase().includes(q) ||
          s.prodi.toLowerCase().includes(q)
      );
    }
    return list;
  },

  /**
   * Mengambil detail sertifikat mahasiswa berdasarkan NIM dari API live
   */
  getSertifikatByNim: async (nim: string): Promise<StudentCertData | null> => {
    try {
      const res = await api.get(`/sertifikat-kkn/detail/${encodeURIComponent(nim)}`);
      if (res.data?.success && res.data?.data) {
        return res.data.data as StudentCertData;
      }
    } catch (err) {
      console.warn(`[sertifikatKknService.getSertifikatByNim] Failed to fetch NIM ${nim} from API:`, err);
    }
    // Fallback
    const local = (fallbackStudentsRaw as unknown as StudentCertData[]).find((s) => s.nim === nim || s.idSertifikat === nim);
    return local || null;
  },

  /**
   * Memverifikasi keabsahan sertifikat melalui QR Code secara publik
   */
  verifySertifikat: async (idSertifikat: string): Promise<VerificationResult> => {
    try {
      const res = await api.get(`/sertifikat-kkn/verify/${encodeURIComponent(idSertifikat)}`);
      if (res.data) {
        return res.data as VerificationResult;
      }
    } catch (err: any) {
      console.warn(`[sertifikatKknService.verifySertifikat] API verification failed for ${idSertifikat}:`, err);
      if (err.response?.data) return err.response.data as VerificationResult;
    }

    // Fallback verifikasi lokal jika server unreachable
    const found = (fallbackStudentsRaw as unknown as StudentCertData[]).find(
      (s) => s.idSertifikat.toLowerCase() === idSertifikat.toLowerCase() || s.nim === idSertifikat
    );

    if (found) {
      const isGraded = found.statusPenilaian === "SUDAH_DINILAI" && Boolean(found.sudahDinilai) && found.nilai && found.nilai.total > 0;
      if (!isGraded) {
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
            tanggalTerbit: "Menunggu Penilaian",
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
    }

    return {
      isValid: false,
      message: "Sertifikat tidak ditemukan atau kode verifikasi tidak sah.",
    };
  },
};
