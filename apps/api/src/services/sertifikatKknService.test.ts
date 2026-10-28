/**
 * Project: BERSEKA
 * Unit Test for E-Sertifikat KKN Tematik Service
 * Validates role-scoping, zero-dummy integrity, and public QR verification
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { sertifikatKknService } from "./sertifikatKknService.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    studentKkn: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    programKerjaKkn: {
      findMany: vi.fn(),
    },
    penilaianKknMahasiswa: {
      findMany: vi.fn(),
    },
    kelompokKkn: {
      findMany: vi.fn(),
    },
  },
}));

describe("sertifikatKknService - Integrity & Scoping Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array if database query throws error", async () => {
    vi.mocked(prisma.studentKkn.findMany).mockRejectedValueOnce(new Error("DB Error"));
    const list = await sertifikatKknService.getSertifikatList({ peran: "SUPER_USER", id: "u1" });
    expect(list).toEqual([]);
  });

  it("should properly format student certificates and respect zero-dummy rule", async () => {
    const mockStudents = [
      {
        id: "s1",
        nim: "21224142",
        jurusan: "Manajemen",
        sks: 11,
        userId: "user-1",
        kelompokId: "kel-4",
        assessmentScore: null,
        isAssessed: false,
        user: { name: "Bani Haykal Permana" },
        kelompok: {
          id: "kel-4",
          name: "Kelompok 4 Dago",
          kelurahan: "Dago",
          cakupanRw: ["11", "12", "13"],
          dpl: { name: "Dr. Linna Ismawati, S.E., M.Si." },
        },
        assignedRw: null,
      },
      {
        id: "s2",
        nim: "21124805",
        jurusan: "S1 Akuntansi",
        sks: 19,
        userId: "user-2",
        kelompokId: "kel-1",
        assessmentScore: 78,
        isAssessed: true,
        user: { name: "Anugrah Rizky Agustian" },
        kelompok: {
          id: "kel-1",
          name: "Kelompok 1 Sadang Serang",
          kelurahan: "Sadang Serang",
          cakupanRw: ["21"],
          dpl: { name: "Dr. Agus Mulyana, S.Kom., M.T." },
        },
        assignedRw: {
          nomorRw: 21,
          kelurahan: { namaKelurahan: "Sadang Serang" },
        },
      },
    ];

    const mockProkers = [
      { kelompokId: "kel-1", skorPenilaian: 87 },
      { kelompokId: "kel-4", skorPenilaian: 92 },
    ];

    const mockPenilaian = [
      {
        studentId: "user-2",
        subtotalDpl: 78,
        skorDplLaporanAkhir: 80,
        skorDplOutput: 80,
        skorMitraBuktiKegiatan: 88,
        nilaiAkhir: 85.08,
        isFinalized: true,
        status: "FINAL",
      },
    ];

    vi.mocked(prisma.studentKkn.findMany).mockResolvedValueOnce(mockStudents as any);
    vi.mocked(prisma.programKerjaKkn.findMany).mockResolvedValueOnce(mockProkers as any);
    vi.mocked(prisma.penilaianKknMahasiswa.findMany).mockResolvedValueOnce(mockPenilaian as any);

    const list = await sertifikatKknService.getSertifikatList({ peran: "SUPER_USER", id: "u1" });
    expect(list.length).toBe(2);

    // Bani: Belum dinilai / Not finalized
    const bani = list.find((s) => s.nim === "21224142");
    expect(bani).toBeDefined();
    expect(bani?.statusPenilaian).toBe("BELUM_DINILAI");
    expect(bani?.sudahDinilai).toBe(false);
    expect(bani?.nilai.total).toBe(0);
    expect(bani?.nilai.predikat).toBe("Belum Dinilai");
    expect(bani?.nomorSertifikat).toContain("KKNT-MHS/DRAFT/");
    expect(bani?.prodi).toBe("S1 Manajemen");
    expect(bani?.rw).toBe("RW 11, 12, dan 13 Kelurahan Dago");
    expect(bani?.idSertifikat).toBe("BRSK-2026-KKN-21224142");

    // Anugrah: Finalized / Graded
    const anugrah = list.find((s) => s.nim === "21124805");
    expect(anugrah).toBeDefined();
    expect(anugrah?.statusPenilaian).toBe("SUDAH_DINILAI");
    expect(anugrah?.sudahDinilai).toBe(true);
    expect(anugrah?.nilai.total).toBe(85.08);
    expect(anugrah?.nilai.predikat).toContain("A");
    expect(anugrah?.nomorSertifikat).toContain("UNIKOM/BATCH-1/XI/2026");
    expect(anugrah?.rw).toBe("RW 21 Kelurahan Sadang Serang");
  });

  it("should scope students for MAHASISWA_KKN role", async () => {
    vi.mocked(prisma.studentKkn.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.programKerjaKkn.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.penilaianKknMahasiswa.findMany).mockResolvedValueOnce([]);

    await sertifikatKknService.getSertifikatList({ peran: "MAHASISWA_KKN", id: "mhs-123" });
    expect(prisma.studentKkn.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "mhs-123",
        }),
      })
    );
  });

  it("should scope students for DPL role", async () => {
    vi.mocked(prisma.studentKkn.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.programKerjaKkn.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.penilaianKknMahasiswa.findMany).mockResolvedValueOnce([]);

    await sertifikatKknService.getSertifikatList({ peran: "DPL", id: "dpl-999" });
    expect(prisma.studentKkn.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          kelompok: {
            dplId: "dpl-999",
          },
        }),
      })
    );
  });

  it("should return invalid when verifying non-existent certificate ID", async () => {
    vi.mocked(prisma.studentKkn.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.programKerjaKkn.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.penilaianKknMahasiswa.findMany).mockResolvedValueOnce([]);

    const result = await sertifikatKknService.verifySertifikat("NON-EXISTENT-ID");
    expect(result.isValid).toBe(false);
  });

  it("should retrieve DPL certificates and scope correctly for DPL user", async () => {
    const mockKelompok = [
      {
        id: "kel-4",
        name: "Kelompok 4 Dago",
        kelurahan: "Dago",
        cakupanRw: ["11", "12", "13"],
        dplId: "dpl-linna",
        dpl: {
          name: "Dr. Linna Ismawati, S.E., M.Si.",
          nip: "4127.34.02.008",
        },
        _count: { students: 10 },
      },
    ];

    vi.mocked((prisma as any).kelompokKkn.findMany).mockResolvedValueOnce(mockKelompok);

    const dplList = await sertifikatKknService.getDplSertifikatList({ peran: "DPL", id: "dpl-linna" });
    expect(dplList.length).toBe(1);
    expect(dplList[0].nama).toBe("Dr. Linna Ismawati, S.E., M.Si.");
    expect(dplList[0].idSertifikat).toBe("BRSK-2026-DPL-41273402008");
    expect(dplList[0].peran).toBe("Dosen Pembimbing Lapangan (DPL)");
  });

  it("should verify valid DPL certificate", async () => {
    const mockKelompok = [
      {
        id: "kel-4",
        name: "Kelompok 4 Dago",
        kelurahan: "Dago",
        cakupanRw: ["11", "12", "13"],
        dplId: "dpl-linna",
        dpl: {
          name: "Dr. Linna Ismawati, S.E., M.Si.",
          nip: "4127.34.02.008",
        },
        _count: { students: 10 },
      },
    ];

    vi.mocked((prisma as any).kelompokKkn.findMany).mockResolvedValueOnce(mockKelompok);

    const res = await sertifikatKknService.verifyDplSertifikat("BRSK-2026-DPL-41273402008");
    expect(res.isValid).toBe(true);
    expect(res.verifikasiStatus).toBe("TERVERIFIKASI_SAH");
    expect(res.dpl?.nama).toBe("Dr. Linna Ismawati, S.E., M.Si.");
  });
});
