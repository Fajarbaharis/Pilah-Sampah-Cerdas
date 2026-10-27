/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Unit Test: Laporan Akhir KKN Sub-Modul Tingkat Kelompok (Group-Level Submission & Visibility)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { laporanAkhirService, cleanLaporanTitle } from "./laporanAkhirService.js";
import { prisma } from "../lib/prisma.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    studentKkn: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    programKerjaKkn: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    kelompokKkn: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("./notificationIntegrationService.js", () => ({
  notificationIntegrationService: {
    sendToUser: vi.fn().mockResolvedValue({ success: true }),
    sendToUsers: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe("LaporanAkhirService - Modul Tingkat Kelompok (Group-Level)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitLaporanAkhirIndividu / submitLaporanAkhir", () => {
    it("harus menolak jika mahasiswa belum terdaftar dalam kelompok KKN", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue(null);

      await expect(
        laporanAkhirService.submitLaporanAkhirIndividu("user-tanpa-kelompok", {
          judul: "Laporan KKN",
        })
      ).rejects.toThrow("Mahasiswa belum terdaftar dalam kelompok KKN.");
    });

    it("harus berhasil create laporan akhir baru tingkat kelompok jika belum pernah ada", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
        kelompokId: "kelompok-10",
        nim: "10119001",
        user: { name: "Budi Mahasiswa" },
        kelompok: {
          id: "kelompok-10",
          name: "Kelompok 10 Coblong",
          dplId: "dpl-user-99",
        },
      } as any);

      vi.mocked(prisma.programKerjaKkn.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.programKerjaKkn.create).mockResolvedValue({
        id: "proker-laporan-1",
        kelompokId: "kelompok-10",
        studentId: "student-1",
        kategori: "LAPORAN_AKHIR",
        deskripsi: "**Laporan Akhir KKN Budi**\n\nAbstrak laporan",
        attachmentFile: "/uploads/laporan.pdf",
        statusUsulan: "MENUNGGU_TELAAH",
      } as any);

      const result = await laporanAkhirService.submitLaporanAkhirIndividu(
        "user-1",
        {
          judul: "Laporan Akhir KKN Budi",
          deskripsi: "Abstrak laporan",
        },
        { filename: "laporan.pdf" } as any
      );

      expect(result.id).toBe("proker-laporan-1");
      expect(prisma.programKerjaKkn.findFirst).toHaveBeenCalledWith({
        where: {
          kelompokId: "kelompok-10",
          kategori: "LAPORAN_AKHIR",
        },
        orderBy: { updatedAt: "desc" },
      });
      expect(prisma.programKerjaKkn.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          kelompokId: "kelompok-10",
          studentId: "student-1",
          kategori: "LAPORAN_AKHIR",
          attachmentFile: "/uploads/laporan.pdf",
          statusUsulan: "MENUNGGU_TELAAH",
        }),
      });

      expect(notificationIntegrationService.sendToUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "dpl-user-99",
          triggerType: "LAPORAN_AKHIR_SUBMITTED",
          dataPayload: expect.objectContaining({
            studentId: "student-1",
            kelompokId: "kelompok-10",
          }),
        })
      );
    });

    it("harus memperbarui (update) laporan tingkat kelompok jika sudah pernah diunggah sebelumnya", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "student-2",
        userId: "user-2",
        kelompokId: "kelompok-10",
        nim: "10119002",
        user: { name: "Siti Anggota" },
        kelompok: {
          id: "kelompok-10",
          name: "Kelompok 10 Coblong",
          dplId: "dpl-user-99",
        },
      } as any);

      vi.mocked(prisma.programKerjaKkn.findFirst).mockResolvedValue({
        id: "proker-laporan-existing",
        kelompokId: "kelompok-10",
        studentId: "student-1",
        kategori: "LAPORAN_AKHIR",
        statusUsulan: "PERLU_REVISI",
      } as any);

      vi.mocked(prisma.programKerjaKkn.update).mockResolvedValue({
        id: "proker-laporan-existing",
        kelompokId: "kelompok-10",
        studentId: "student-2", // Tercatat pengunggah versi revisi
        attachmentFile: "/uploads/revisi-siti.pdf",
        statusUsulan: "MENUNGGU_TELAAH",
      } as any);

      const result = await laporanAkhirService.submitLaporanAkhir(
        "user-2",
        {
          judul: "Laporan Akhir KKN Kelompok 10 (Revisi)",
          deskripsi: "Perbaikan Bab 4",
        },
        { filename: "revisi-siti.pdf" } as any
      );

      expect(result.id).toBe("proker-laporan-existing");
      expect(prisma.programKerjaKkn.update).toHaveBeenCalledWith({
        where: { id: "proker-laporan-existing" },
        data: expect.objectContaining({
          studentId: "student-2",
          attachmentFile: "/uploads/revisi-siti.pdf",
          statusUsulan: "MENUNGGU_TELAAH",
        }),
      });
    });
  });


    it("harus menolak pengajuan baru jika kelompok sudah mengajukan dan status belum revisi/ditolak", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "student-2",
        userId: "user-2",
        kelompokId: "kelompok-10",
        user: { name: "Siti" },
        kelompok: { id: "kelompok-10", name: "Kelompok 10" },
      } as any);

      vi.mocked(prisma.programKerjaKkn.findFirst).mockResolvedValue({
        id: "proker-laporan-1",
        kelompokId: "kelompok-10",
        statusUsulan: "MENUNGGU_TELAAH",
        statusPenilaian: "BELUM_DINILAI",
      } as any);

      await expect(
        laporanAkhirService.submitLaporanAkhir("user-2", {
          linkGoogleDrive: "https://drive.google.com/file/d/123",
          judul: "Laporan Akhir Kelompok 10",
        })
      ).rejects.toThrow(
        "Kelompok Anda sudah mengajukan Laporan Akhir KKN. Pengajuan hanya dapat dilakukan 1 kali kecuali jika DPL meminta revisi."
      );
    });

    it("harus menolak jika tautan Google Drive / berkas kosong", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
        kelompokId: "kelompok-10",
      } as any);

      await expect(
        laporanAkhirService.submitLaporanAkhir("user-1", {
          judul: "Laporan Akhir KKN",
        })
      ).rejects.toThrow("Tautan Google Drive Laporan Akhir wajib dicantumkan.");
    });

    it("cleanLaporanTitle harus menormalkan asterisks markdown dan duplicate prefixes", () => {
      expect(cleanLaporanTitle("Laporan Akhir KKN: Laporan Akhir KKN: **[wulan mahasiswa] laporan akhir yy**")).toBe("Laporan Akhir KKN: [wulan mahasiswa] laporan akhir yy");
      expect(cleanLaporanTitle("Laporan Akhir KKN Kelompok 10 Coblong")).toBe("Laporan Akhir KKN Kelompok 10 Coblong");
      expect(cleanLaporanTitle("**Judul Proyek Inovasi**")).toBe("Laporan Akhir KKN: Judul Proyek Inovasi");
      expect(cleanLaporanTitle("", "Kelompok 10")).toBe("Laporan Akhir KKN Kelompok 10");
    });

  describe("getLaporanAkhirMe", () => {
    it("harus mengembalikan data null jika kelompok belum mengunggah laporan", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
        kelompokId: "kelompok-10",
        kelompok: { name: "Kelompok 10" },
      } as any);

      vi.mocked(prisma.programKerjaKkn.findFirst).mockResolvedValue(null);

      const res = await laporanAkhirService.getLaporanAkhirMe("user-1");

      expect(res.hasSubmitted).toBe(false);
      expect(res.data).toBeNull();
      expect(prisma.programKerjaKkn.findFirst).toHaveBeenCalledWith({
        where: {
          kelompokId: "kelompok-10",
          kategori: "LAPORAN_AKHIR",
        },
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true, phone: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    });

    it("harus mengembalikan laporan tingkat kelompok dan mengidentifikasi pengunggah (submittedBy) untuk rekan sekelompok", async () => {
      // Mahasiswa B (Siti) login, melihat dokumen yang diunggah oleh Mahasiswa A (Budi)
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "student-2",
        userId: "user-2",
        nim: "10119002",
        user: { name: "Siti Mahasiswa" },
        kelompokId: "kelompok-10",
        kelompok: {
          name: "Kelompok 10 Coblong",
          dpl: { id: "dpl-1", name: "Dr. Dosen", phone: "0812345" },
        },
      } as any);

      vi.mocked(prisma.programKerjaKkn.findFirst).mockResolvedValue({
        id: "laporan-kelompok-10",
        kelompokId: "kelompok-10",
        studentId: "student-1", // Diunggah oleh Budi
        kategori: "LAPORAN_AKHIR",
        deskripsi: "**Laporan Akhir KKN Kelompok 10**\n\nIsi abstrak laporan kelompok",
        attachmentFile: "/uploads/laporan-kelompok-10.pdf",
        statusUsulan: "DISETUJUI",
        statusPenilaian: "DISETUJUI",
        skorPenilaian: 90,
        predikat: "A (Sangat Baik)",
        createdAt: new Date("2026-10-01T10:00:00Z"),
        updatedAt: new Date("2026-10-02T10:00:00Z"),
        student: {
          nim: "10119001",
          user: { id: "user-1", name: "Budi Ketua Kelompok", phone: "08111" },
        },
      } as any);

      const res = await laporanAkhirService.getLaporanAkhirMe("user-2");

      expect(prisma.programKerjaKkn.findFirst).toHaveBeenCalledWith({
        where: {
          kelompokId: "kelompok-10",
          kategori: "LAPORAN_AKHIR",
        },
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true, phone: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      expect(res.hasSubmitted).toBe(true);
      expect(res.id).toBe("laporan-kelompok-10");
      expect(res.nilaiAkhir).toBe(90);
      expect(res.statusTelaah).toBe("DISETUJUI");
      expect(res.submittedBy).toBe("Budi Ketua Kelompok");
      expect(res.submittedByNim).toBe("10119001");
      expect(res.dpl?.name).toBe("Dr. Dosen");
      expect(res.laporan.submittedBy).toBe("Budi Ketua Kelompok");
      expect(res.data.submittedBy).toBe("Budi Ketua Kelompok");
    });
  });

  describe("getLaporanAkhirHistory", () => {
    it("harus mengembalikan riwayat versi laporan tingkat kelompok", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
        kelompokId: "kelompok-10",
      } as any);

      vi.mocked(prisma.programKerjaKkn.findMany).mockResolvedValue([
        {
          id: "lap-rev-2",
          kelompokId: "kelompok-10",
          studentId: "student-2",
          deskripsi: "**Laporan Akhir KKN (Rev 2)**\n\nPerbaikan Bab 3",
          attachmentFile: "/uploads/lap-rev2.pdf",
          skorPenilaian: 88,
          statusUsulan: "DISETUJUI",
          statusPenilaian: "DISETUJUI",
          predikat: "A (Sangat Baik)",
          createdAt: new Date("2026-10-03T10:00:00Z"),
          updatedAt: new Date("2026-10-03T10:00:00Z"),
          student: {
            nim: "10119002",
            user: { id: "u-2", name: "Siti", phone: "082" },
          },
          kelompok: {
            name: "Kelompok 10 Coblong",
            dpl: { id: "d-1", name: "Dr. Dosen", phone: "081" },
          },
        } as any,
      ]);

      const history = await laporanAkhirService.getLaporanAkhirHistory("user-1");

      expect(history.length).toBe(1);
      expect(history[0].id).toBe("lap-rev-2");
      expect(history[0].submittedBy).toBe("Siti");
      expect(history[0].submittedByNim).toBe("10119002");
      expect(history[0].statusTelaah).toBe("DISETUJUI");
    });
  });

  describe("getLaporanAkhirDplMatrix", () => {
    it("harus menyajikan matriks per-mahasiswa dalam kelompok KKN", async () => {
      vi.mocked(prisma.kelompokKkn.findUnique).mockResolvedValue({
        id: "kelompok-10",
        name: "Kelompok 10 Coblong",
        students: [
          {
            id: "st-1",
            userId: "u-1",
            nim: "10119001",
            isKetua: true,
            user: { name: "Ahmad" },
          },
          {
            id: "st-2",
            userId: "u-2",
            nim: "10119002",
            isKetua: false,
            user: { name: "Siti" },
          },
        ],
      } as any);

      vi.mocked(prisma.programKerjaKkn.findMany).mockResolvedValue([
        {
          id: "lap-ahmad",
          studentId: "st-1",
          kategori: "LAPORAN_AKHIR",
          attachmentFile: "/uploads/laporan-ahmad.pdf",
          deskripsi: "**Laporan Ahmad**\n\nAbstrak",
          statusUsulan: "MENUNGGU_TELAAH",
          statusPenilaian: "BELUM_DINILAI",
          skorPenilaian: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ]);

      const matrix = await laporanAkhirService.getLaporanAkhirDplMatrix("kelompok-10");

      expect(matrix.totalMahasiswa).toBe(2);
      expect(matrix.totalSudahSubmit).toBe(1);
      expect(matrix.totalBelumSubmit).toBe(1);

      const ahmad = matrix.mahasiswa.find((m) => m.studentId === "st-1");
      const siti = matrix.mahasiswa.find((m) => m.studentId === "st-2");

      expect(ahmad?.hasSubmitted).toBe(true);
      expect(ahmad?.fileUrl).toBe("/uploads/laporan-ahmad.pdf");
      expect(ahmad?.statusTelaah).toBe("MENUNGGU_TELAAH");

      expect(siti?.hasSubmitted).toBe(false);
      expect(siti?.fileUrl).toBeNull();
      expect(siti?.statusTelaah).toBe("BELUM_UNGGAH");
    });
  });
});
