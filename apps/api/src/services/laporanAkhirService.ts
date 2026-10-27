/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { prisma } from "../lib/prisma.js";
import { parseProkerDeskripsi } from "./dplService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";

export class LaporanAkhirService {
  /**
   * Mengunggah / Memperbarui Laporan Akhir Tingkat Kelompok oleh Perwakilan Mahasiswa
   */
  async submitLaporanAkhirIndividu(userId: string, payload: any, file?: any) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: {
        kelompok: {
          include: { dpl: true },
        },
        user: true,
      },
    });

    if (!student || !student.kelompokId) {
      throw new Error("Mahasiswa belum terdaftar dalam kelompok KKN.");
    }

    const fileUrl = file ? `/uploads/${file.filename}` : payload.fileUrl;
    if (!fileUrl) {
      throw new Error("Berkas PDF Laporan Akhir wajib diunggah.");
    }

    const defaultJudul = `Laporan Akhir KKN ${student.kelompok?.name || student.user?.name || student.nim}`;
    const judulStr = (payload.judul || defaultJudul).trim();
    const deskripsiStr = (payload.deskripsi || "").trim();
    const formattedDeskripsi = `**${judulStr}**\n\n${deskripsiStr}`;

    // Cek apakah kelompok ini sudah pernah submit sebelumnya (Tingkat Kelompok)
    const existing = await prisma.programKerjaKkn.findFirst({
      where: {
        kelompokId: student.kelompokId,
        kategori: "LAPORAN_AKHIR",
      },
    });

    let result;
    if (existing) {
      result = await prisma.programKerjaKkn.update({
        where: { id: existing.id },
        data: {
          studentId: student.id, // Perbarui pencatat pengunggah versi terakhir
          deskripsi: formattedDeskripsi,
          attachmentFile: fileUrl,
          linkGoogleDrive: fileUrl,
          hasAttachment: true,
          statusUsulan: "MENUNGGU_TELAAH",
          status: "BELUM_DISETUJUI" as any,
          statusPenilaian: "BELUM_DINILAI",
          updatedAt: new Date(),
        },
      });
    } else {
      result = await prisma.programKerjaKkn.create({
        data: {
          kelompokId: student.kelompokId,
          studentId: student.id,
          kategori: "LAPORAN_AKHIR",
          deskripsi: formattedDeskripsi,
          attachmentFile: fileUrl,
          linkGoogleDrive: fileUrl,
          hasAttachment: true,
          statusUsulan: "MENUNGGU_TELAAH",
          status: "BELUM_DISETUJUI" as any,
          statusPenilaian: "BELUM_DINILAI",
          sumber: "MAHASISWA",
        },
      });
    }

    // Notifikasi Otomatis ke DPL Kelompok
    if (student.kelompok?.dplId) {
      try {
        await notificationIntegrationService.sendToUser({
          userId: student.kelompok.dplId,
          title: "Laporan Akhir Kelompok Masuk 📄",
          message: `${student.user?.name || "Mahasiswa"} (${student.kelompok.name || "Kelompok"}) telah mengunggah Laporan Akhir KKN. Silakan ditelaah.`,
          triggerType: "LAPORAN_AKHIR_SUBMITTED",
          dataPayload: {
            event: "REFRESH_LAPORAN_AKHIR_DPL",
            studentId: student.id,
            kelompokId: student.kelompokId,
            laporanId: result.id,
            click_action: "FLUTTER_NOTIFICATION_CLICK",
          },
        });
      } catch (notifErr: any) {
        console.warn("[LaporanAkhirService] Gagal mengirimkan notifikasi DPL:", notifErr?.message);
      }
    }

    return result;
  }

  /**
   * Alias submitLaporanAkhir untuk kompatibilitas Controller/Client
   */
  async submitLaporanAkhir(userId: string, payload: any, file?: any) {
    return this.submitLaporanAkhirIndividu(userId, payload, file);
  }

  /**
   * Mengambil Laporan Akhir Tingkat Kelompok Milik Mahasiswa yang Sedang Login
   * Seluruh anggota kelompok dapat melihat laporan yang diajukan oleh rekannya secara transparan.
   */
  async getLaporanAkhirMe(userId: string) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: {
        kelompok: { include: { dpl: true } },
        user: { include: { penilaianKkn: true } },
      },
    });

    if (!student || !student.kelompokId) {
      throw new Error("Mahasiswa tidak ditemukan atau belum terdaftar dalam kelompok.");
    }

    // 1. CARI LAPORAN AKHIR TINGKAT KELOMPOK (Bukan per studentId saja)
    const laporan = await prisma.programKerjaKkn.findFirst({
      where: {
        kelompokId: student.kelompokId,
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

    const dplInfo = student.kelompok?.dpl
      ? {
          id: student.kelompok.dpl.id,
          name: student.kelompok.dpl.name,
          phone: student.kelompok.dpl.phone || null,
        }
      : null;

    if (!laporan) {
      return {
        hasSubmitted: false,
        kelompokId: student.kelompokId,
        namaKelompok: student.kelompok?.name || null,
        dpl: dplInfo,
        data: null,
      };
    }

    const parsed = parseProkerDeskripsi(laporan.deskripsi);
    const fileUrl = laporan.attachmentFile || laporan.linkGoogleDrive || null;
    const scoreVal =
      laporan.skorPenilaian !== null && laporan.skorPenilaian !== undefined
        ? Number(laporan.skorPenilaian)
        : null;

    let statusTelaah = laporan.statusUsulan || "MENUNGGU_TELAAH";
    if (!fileUrl) {
      statusTelaah = "BELUM_UNGGAH";
    } else if (laporan.statusPenilaian === "DISETUJUI" || scoreVal !== null) {
      statusTelaah = "DISETUJUI";
    } else if (laporan.statusPenilaian === "PERLU_REVISI") {
      statusTelaah = "PERLU_REVISI";
    }

    let predikat = laporan.predikat || "Belum Dinilai";
    if (scoreVal !== null && (!laporan.predikat || laporan.predikat === "Belum Dinilai")) {
      if (scoreVal >= 85) predikat = "A (Sangat Baik)";
      else if (scoreVal >= 75) predikat = "B (Baik)";
      else if (scoreVal >= 65) predikat = "C (Cukup)";
      else predikat = "D (Kurang)";
    }

    // 2. IDENTIFIKASI PENGUNGGAH DOKUMEN KELOMPOK
    const submittedByName =
      laporan.student?.user?.name ||
      (laporan.student?.nim ? `Mahasiswa NIM ${laporan.student.nim}` : "Perwakilan Kelompok");

    const payloadDetail = {
      id: laporan.id,
      judul: parsed.judul || `Laporan Akhir KKN ${student.kelompok?.name || "Kelompok"}`,
      deskripsi: parsed.deskripsi || laporan.deskripsi,
      fileUrl,
      fileName: fileUrl
        ? `Laporan_Akhir_${(student.kelompok?.name || "Kelompok").replace(/\s+/g, "_")}.pdf`
        : null,
      isGoogleDrive: Boolean(fileUrl && fileUrl.includes("drive.google.com")),
      statusTelaah,
      status: laporan.status || statusTelaah,
      nilaiAkhir: scoreVal,
      skorPenilaian: scoreVal,
      predikat,
      catatanDpl: laporan.catatanDpl || laporan.evaluasiDpl || "",
      catatanRevisi: laporan.catatanDpl || laporan.evaluasiDpl || "",
      aspekPenilaian: laporan.aspekPenilaian || null,
      submittedBy: submittedByName,
      submittedByNim: laporan.student?.nim || null,
      submittedAt: laporan.createdAt ? (laporan.createdAt instanceof Date ? laporan.createdAt.toISOString() : new Date(laporan.createdAt).toISOString()) : new Date().toISOString(),
      updatedAt: laporan.updatedAt ? (laporan.updatedAt instanceof Date ? laporan.updatedAt.toISOString() : new Date(laporan.updatedAt).toISOString()) : new Date().toISOString(),
    };

    return {
      hasSubmitted: true,
      id: laporan.id,
      kelompokId: student.kelompokId,
      namaKelompok: student.kelompok?.name || null,
      ...payloadDetail,
      dpl: dplInfo,
      laporan: payloadDetail,
      data: payloadDetail,
    };
  }

  /**
   * Mengambil Riwayat Pengajuan Laporan Akhir Tingkat Kelompok (Version History)
   * Seluruh anggota kelompok dapat melihat riwayat pengajuan dokumen kelompok secara seragam.
   */
  async getLaporanAkhirHistory(userId: string) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
    });

    if (!student || !student.kelompokId) return [];

    // Query berdasarkan kelompokId (agar riwayat kelompok tampil seragam)
    const list = await prisma.programKerjaKkn.findMany({
      where: {
        kelompokId: student.kelompokId,
        kategori: "LAPORAN_AKHIR",
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        kelompok: {
          include: { dpl: { select: { id: true, name: true, phone: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return list.map((item) => {
      const parsed = parseProkerDeskripsi(item.deskripsi);
      const scoreVal =
        item.skorPenilaian !== null && item.skorPenilaian !== undefined
          ? Number(item.skorPenilaian)
          : null;
      const fileUrl = item.attachmentFile || item.linkGoogleDrive || null;
      let statusTelaah = item.statusUsulan || "MENUNGGU_TELAAH";
      if (!fileUrl) {
        statusTelaah = "BELUM_UNGGAH";
      } else if (item.statusPenilaian === "DISETUJUI" || scoreVal !== null) {
        statusTelaah = "DISETUJUI";
      } else if (item.statusPenilaian === "PERLU_REVISI") {
        statusTelaah = "PERLU_REVISI";
      }

      let predikat = item.predikat || "Belum Dinilai";
      if (scoreVal !== null && (!item.predikat || item.predikat === "Belum Dinilai")) {
        if (scoreVal >= 85) predikat = "A (Sangat Baik)";
        else if (scoreVal >= 75) predikat = "B (Baik)";
        else if (scoreVal >= 65) predikat = "C (Cukup)";
        else predikat = "D (Kurang)";
      }

      const submittedByName =
        item.student?.user?.name ||
        (item.student?.nim ? `Mahasiswa NIM ${item.student.nim}` : "Perwakilan Kelompok");

      return {
        id: item.id,
        judul: parsed.judul || `Laporan Akhir KKN ${item.kelompok?.name || ""}`,
        deskripsi: parsed.deskripsi || item.deskripsi,
        fileUrl,
        fileName: fileUrl ? `Laporan_Akhir_${item.id.slice(-6)}.pdf` : null,
        statusTelaah,
        status: item.status || statusTelaah,
        nilaiAkhir: scoreVal,
        skorPenilaian: scoreVal,
        predikat,
        catatanDpl: item.catatanDpl || item.evaluasiDpl || null,
        aspekPenilaian: item.aspekPenilaian || null,
        submittedBy: submittedByName,
        submittedByNim: item.student?.nim || null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
  }

  /**
   * Matriks Progres Laporan Akhir Seluruh Mahasiswa dalam Suatu Kelompok (Khusus DPL)
   */
  async getLaporanAkhirDplMatrix(kelompokId: string) {
    const kelompok = await prisma.kelompokKkn.findUnique({
      where: { id: kelompokId },
      include: {
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                fotoProfil: true,
              },
            },
          },
          orderBy: { nim: "asc" },
        },
      },
    });

    if (!kelompok) {
      throw new Error("Kelompok KKN tidak ditemukan.");
    }

    // Ambil seluruh proker berkategori LAPORAN_AKHIR di kelompok ini
    const laporans = await prisma.programKerjaKkn.findMany({
      where: {
        kelompokId,
        kategori: "LAPORAN_AKHIR",
      },
    });

    let totalSudahSubmit = 0;
    const mahasiswaList = kelompok.students.map((st) => {
      const laporan = laporans.find((l) => l.studentId === st.id);
      const hasSubmitted = Boolean(laporan && (laporan.attachmentFile || laporan.linkGoogleDrive));

      if (hasSubmitted) {
        totalSudahSubmit++;
      }

      const parsed = laporan ? parseProkerDeskripsi(laporan.deskripsi) : { judul: null, deskripsi: null };
      const fileUrl = laporan ? (laporan.attachmentFile || laporan.linkGoogleDrive || null) : null;
      const scoreVal = laporan?.skorPenilaian ? Number(laporan.skorPenilaian) : null;

      let statusTelaah = "BELUM_UNGGAH";
      if (hasSubmitted) {
        if (laporan?.statusPenilaian === "DISETUJUI" || scoreVal !== null) {
          statusTelaah = "DISETUJUI";
        } else if (laporan?.statusPenilaian === "PERLU_REVISI") {
          statusTelaah = "PERLU_REVISI";
        } else {
          statusTelaah = laporan?.statusUsulan || "MENUNGGU_TELAAH";
        }
      }

      return {
        studentId: st.id,
        userId: st.userId,
        nama: st.user?.name || "Mahasiswa KKN",
        nim: st.nim,
        jurusan: st.jurusan || null,
        fakultas: st.fakultas || null,
        isKetua: Boolean(st.isKetua),
        hasSubmitted,
        laporanId: laporan?.id || null,
        judulLaporan: parsed.judul || null,
        fileUrl,
        fileName: fileUrl ? `Laporan_Akhir_${(st.user?.name || st.nim).replace(/\s+/g, "_")}.pdf` : null,
        statusTelaah,
        nilaiAkhir: scoreVal,
        predikat: laporan?.predikat || (scoreVal !== null ? (scoreVal >= 85 ? "A" : "B") : "Belum Dinilai"),
        catatanDpl: laporan?.catatanDpl || laporan?.evaluasiDpl || null,
        aspekPenilaian: laporan?.aspekPenilaian || null,
        submittedAt: laporan?.createdAt || null,
        updatedAt: laporan?.updatedAt || null,
      };
    });

    return {
      success: true,
      kelompokId: kelompok.id,
      namaKelompok: kelompok.name,
      totalMahasiswa: kelompok.students.length,
      totalSudahSubmit,
      totalBelumSubmit: kelompok.students.length - totalSudahSubmit,
      mahasiswa: mahasiswaList,
    };
  }
}

export const laporanAkhirService = new LaporanAkhirService();
