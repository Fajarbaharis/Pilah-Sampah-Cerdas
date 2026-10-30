/**
 * Unit Test untuk Survey KKN Controller & Service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { surveyService } from "../services/surveyService.js";
import { surveyController } from "./surveyController.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    studentKkn: {
      findFirst: vi.fn(),
    },
    surveiRw: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    surveiKelurahan: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    surveiVolumeSampah: {
      upsert: vi.fn(),
    },
    surveiPemilahanSampah: {
      upsert: vi.fn(),
    },
    surveiBankSampahPengolahan: {
      upsert: vi.fn(),
    },
    surveiCatatanKesimpulan: {
      upsert: vi.fn(),
    },
    endlineSurveiKelurahan: {
      upsert: vi.fn(),
    },
    endlineVolumeSampah: {
      upsert: vi.fn(),
    },
    endlinePemilahanSampah: {
      upsert: vi.fn(),
    },
    endlineBankSampahPengolahan: {
      upsert: vi.fn(),
    },
    endlineCatatanKesimpulan: {
      upsert: vi.fn(),
    },
  },
}));

describe("Survey Service & Controller Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("surveyService.verifyStudent", () => {
    it("harus mengembalikan registered: false jika NIM tidak ditemukan", async () => {
      (prisma.studentKkn.findFirst as any).mockResolvedValue(null);

      const result = await surveyService.verifyStudent("10122999");
      expect(result.registered).toBe(false);
      expect(result.message).toContain("tidak ditemukan");
    });

    it("harus mengembalikan data lengkap jika NIM terdaftar resmi", async () => {
      (prisma.studentKkn.findFirst as any).mockResolvedValue({
        id: "student-uuid-1",
        userId: "user-uuid-1",
        nim: "10122001",
        jurusan: "Teknik Informatika",
        fakultas: "Teknik dan Ilmu Komputer",
        noWa: "081234567890",
        user: { name: "Bani Haykal" },
        kelompok: {
          name: "Kelompok 04",
          kelurahan: "Dago",
          cakupanRw: ["RW 01", "RW 02"],
        },
      });

      const result = await surveyService.verifyStudent("10122001");
      expect(result.registered).toBe(true);
      expect(result.nama).toBe("Bani Haykal");
      expect(result.prodi).toBe("Teknik Informatika");
      expect(result.kelompok).toBe("Kelompok 04");
      expect(result.kelurahan).toBe("Dago");
    });
  });

  describe("surveyService.submitSurvey", () => {
    it("harus menolak submit jika NIM tidak terverifikasi di database", async () => {
      (prisma.studentKkn.findFirst as any).mockResolvedValue(null);

      await expect(
        surveyService.submitSurvey({
          nim: "99999999",
          kelurahan: "Dago",
          rw: "RW 01",
          rumah_pilah: 10,
          rumah_total: 50,
          vol_organik: 100,
          vol_anorganik: 50,
          vol_residu: 20,
          prioritas: "Sosialisasi pemilahan sampah organik rumah tangga",
        })
      ).rejects.toThrow("STUDENT_NOT_VERIFIED");
    });

    it("harus berhasil menyimpan survei jika NIM valid dan melakukan auto-agregasi", async () => {
      (prisma.studentKkn.findFirst as any).mockResolvedValue({
        id: "student-uuid-1",
        userId: "user-uuid-1",
        nim: "10122001",
        jurusan: "Teknik Informatika",
        fakultas: "Teknik dan Ilmu Komputer",
        noWa: "081234567890",
        user: { name: "Bani Haykal" },
        kelompok: { name: "Kelompok 04", kelurahan: "Dago" },
      });

      (prisma.surveiRw.create as any).mockResolvedValue({
        id: "srw-1",
        kodeSurvey: "BRS-TEST-1",
        tahap: "Endline",
        tahun: "2026",
        kelurahan: "Dago",
        rw: "RW 01",
        persenPilah: 20,
        volumeTotal: 170,
        createdAt: new Date(),
      });

      (prisma.surveiRw.findMany as any).mockResolvedValue([
        {
          rw: "RW 01",
          volumeOrganik: 100,
          volumeAnorganik: 50,
          volumeResidu: 20,
          volumeTotal: 170,
          rumahPilah: 10,
          rumahTotal: 50,
          bankSampahAktif: 1,
          bankSampahTidakAktif: 0,
          unitKomposter: 2,
          titikMaggot: 1,
          teknologi: ["Biopori/loseda"],
        },
      ]);

      (prisma.surveiKelurahan.findFirst as any).mockResolvedValue({
        kelurahanId: 1,
        namaKelurahan: "Dago",
      });

      const res = await surveyService.submitSurvey({
        id: "BRS-TEST-1",
        tahap: "Endline",
        tahun: 2026,
        nim: "10122001",
        kelurahan: "Dago",
        rw: "RW 01",
        rumah_pilah: 10,
        rumah_total: 50,
        vol_organik: 100,
        vol_anorganik: 50,
        vol_residu: 20,
        prioritas: "Sosialisasi pemilahan sampah organik rumah tangga",
      });

      expect(res.kodeSurvey).toBe("BRS-TEST-1");
      expect(prisma.surveiRw.create).toHaveBeenCalled();
      expect(prisma.endlineSurveiKelurahan.upsert).toHaveBeenCalled();
      expect(prisma.endlineVolumeSampah.upsert).toHaveBeenCalled();
      expect(prisma.endlinePemilahanSampah.upsert).toHaveBeenCalled();
    });

    it("harus berhasil menyimpan survei Baseline dan mengagregasi ke tabel surveiKelurahan", async () => {
      (prisma.studentKkn.findFirst as any).mockResolvedValue({
        id: "student-uuid-1",
        userId: "user-uuid-1",
        nim: "10122001",
        jurusan: "Teknik Informatika",
        fakultas: "Teknik dan Ilmu Komputer",
        noWa: "081234567890",
        user: { name: "Bani Haykal" },
        kelompok: { name: "Kelompok 04", kelurahan: "Dago" },
      });

      (prisma.surveiRw.create as any).mockResolvedValue({
        id: "srw-base-1",
        kodeSurvey: "BRS-BASE-1",
        tahap: "Baseline",
        tahun: "2026",
        kelurahan: "Dago",
        rw: "RW 01",
        persenPilah: 25,
        volumeTotal: 150,
        createdAt: new Date(),
      });

      (prisma.surveiRw.findMany as any).mockResolvedValue([
        {
          rw: "RW 01",
          volumeOrganik: 90,
          volumeAnorganik: 40,
          volumeResidu: 20,
          volumeTotal: 150,
          rumahPilah: 15,
          rumahTotal: 60,
          bankSampahAktif: 1,
          bankSampahTidakAktif: 0,
          unitKomposter: 1,
          titikMaggot: 1,
          teknologi: ["Biopori/loseda"],
        },
      ]);

      (prisma.surveiKelurahan.findFirst as any).mockResolvedValue({
        kelurahanId: 4,
        namaKelurahan: "Dago",
      });

      const res = await surveyService.submitSurvey({
        id: "BRS-BASE-1",
        tahap: "Baseline",
        tahun: 2026,
        nim: "10122001",
        kelurahan: "Dago",
        rw: "RW 01",
        rumah_pilah: 15,
        rumah_total: 60,
        vol_organik: 90,
        vol_anorganik: 40,
        vol_residu: 20,
        prioritas: "Sosialisasi awal pemilahan sampah",
      });

      expect(res.kodeSurvey).toBe("BRS-BASE-1");
      expect(prisma.surveiRw.create).toHaveBeenCalled();
      expect(prisma.surveiKelurahan.upsert).toHaveBeenCalled();
      expect(prisma.surveiVolumeSampah.upsert).toHaveBeenCalled();
      expect(prisma.surveiPemilahanSampah.upsert).toHaveBeenCalled();
    });
  });

  describe("surveyController HTTP Handlers", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
      req = { query: {}, body: {}, params: {} };
      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
    });

    it("verifyStudent handler harus mengembalikan 400 jika NIM tidak dikirim", async () => {
      await surveyController.verifyStudent(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Parameter NIM wajib disertakan." })
      );
    });

    it("submitSurvey handler harus mengembalikan 400 jika kelurahan atau RW kosong", async () => {
      req.body = { nim: "10122001" };
      await surveyController.submitSurvey(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
