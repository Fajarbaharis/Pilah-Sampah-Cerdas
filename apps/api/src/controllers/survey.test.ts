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
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    surveiKelurahan: {
      findFirst: vi.fn(),
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

    it("harus menolak submit jika kelurahan tidak sesuai dengan wilayah kelompok", async () => {
      (prisma.studentKkn.findFirst as any).mockResolvedValue({
        id: "student-uuid-1",
        userId: "user-uuid-1",
        nim: "10122001",
        jurusan: "Teknik Informatika",
        user: { name: "Bani Haykal" },
        kelompok: {
          name: "Kelompok 04",
          kelurahan: "Dago",
          cakupanRw: ["01", "02"],
        },
      });

      await expect(
        surveyService.submitSurvey({
          nim: "10122001",
          kelurahan: "Sadang Serang",
          rw: "RW 01",
          rumah_pilah: 10,
          rumah_total: 50,
          vol_organik: 100,
          vol_anorganik: 50,
          vol_residu: 20,
          prioritas: "Sosialisasi pemilahan sampah",
        })
      ).rejects.toThrow("KELURAHAN_MISMATCH");
    });

    it("harus menolak submit jika RW di luar cakupan RW binaan kelompok", async () => {
      (prisma.studentKkn.findFirst as any).mockResolvedValue({
        id: "student-uuid-1",
        userId: "user-uuid-1",
        nim: "10122001",
        jurusan: "Teknik Informatika",
        user: { name: "Bani Haykal" },
        kelompok: {
          name: "Kelompok 04",
          kelurahan: "Dago",
          cakupanRw: ["01", "02"],
        },
      });

      await expect(
        surveyService.submitSurvey({
          nim: "10122001",
          kelurahan: "Dago",
          rw: "RW 05",
          rumah_pilah: 10,
          rumah_total: 50,
          vol_organik: 100,
          vol_anorganik: 50,
          vol_residu: 20,
          prioritas: "Sosialisasi pemilahan sampah",
        })
      ).rejects.toThrow("RW_MISMATCH");
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

    it("submitSurvey handler harus mengembalikan 400 jika wilayah RW atau kelurahan mismatch", async () => {
      req.body = { nim: "10122001", kelurahan: "Dago", rw: "RW 99" };
      vi.spyOn(surveyService, "submitSurvey").mockRejectedValueOnce(
        Object.assign(new Error("RW_MISMATCH"), {
          details: "RW RW 99 bukan bagian dari cakupan RW binaan kelompok Anda (RW 01, RW 02).",
        })
      );

      await surveyController.submitSurvey(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "RW_MISMATCH",
          message: expect.stringContaining("bukan bagian dari cakupan RW binaan"),
        })
      );
    });

    it("checkRw handler harus mengembalikan 400 jika parameter kelurahan atau rw tidak ada", async () => {
      req.query = { kelurahan: "Dago" };
      await surveyController.checkRw(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Parameter kelurahan dan rw wajib disertakan." })
      );
    });

    it("checkRw handler harus mengembalikan status exists jika RW sudah disurvei", async () => {
      req.query = { kelurahan: "Dago", rw: "RW 01", tahap: "Endline", tahun: "2026" };
      (prisma.surveiRw.findFirst as any).mockResolvedValue({
        id: "srw-1",
        kodeSurvey: "BRS-123",
        namaSurveyor: "Bani",
        nim: "10122001",
        kelompok: "Kelompok 04",
        kelurahan: "Dago",
        rw: "RW 01",
        tahap: "Endline",
        tahun: "2026",
        createdAt: new Date(),
      });

      await surveyController.checkRw(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          exists: true,
          survey: expect.objectContaining({
            kodeSurvey: "BRS-123",
            kelurahan: "Dago",
            rw: "RW 01",
          }),
        },
      });
    });

    it("deleteSurvey handler harus mengembalikan 403 jika NIM tidak cocok", async () => {
      req.params = { id: "srw-1" };
      req.query = { nim: "10122999" };
      (prisma.surveiRw.findUnique as any).mockResolvedValue({
        id: "srw-1",
        nim: "10122001",
        kelurahan: "Dago",
        tahap: "Endline",
        tahun: "2026",
      });

      await surveyController.deleteSurvey(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("hanya berhak menghapus"),
        })
      );
    });

    it("deleteSurvey handler harus mengembalikan 200 jika NIM cocok", async () => {
      req.params = { id: "srw-1" };
      req.query = { nim: "10122001" };
      (prisma.surveiRw.findUnique as any).mockResolvedValue({
        id: "srw-1",
        nim: "10122001",
        kelurahan: "Dago",
        tahap: "Endline",
        tahun: "2026",
      });
      (prisma.surveiRw.delete as any).mockResolvedValue({ id: "srw-1" });
      (prisma.surveiRw.findMany as any).mockResolvedValue([]);

      await surveyController.deleteSurvey(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: "Survei berhasil dihapus." })
      );
    });
  });
});
