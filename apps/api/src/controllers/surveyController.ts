/**
 * Project: BERSEKA
 * Controller untuk Form Survey KKN (survey.berseka.id)
 */

import { Request, Response } from "express";
import { surveyService } from "../services/surveyService.js";

export const surveyController = {
  /**
   * GET /api/v1/survey/verify-student
   * Verifikasi mahasiswa KKN via NIM
   */
  verifyStudent: async (req: Request, res: Response): Promise<void> => {
    try {
      const nim = (req.query.nim as string) || "";
      if (!nim) {
        res.status(400).json({
          success: false,
          message: "Parameter NIM wajib disertakan.",
        });
        return;
      }

      const result = await surveyService.verifyStudent(nim);
      if (!result.registered) {
        res.status(404).json({
          success: false,
          message: result.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error verifyStudent:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan internal server saat memverifikasi NIM.",
      });
    }
  },

  /**
   * POST /api/v1/survey/submit
   * Simpan data survei RW dan sinkronisasi ke kelurahan
   */
  submitSurvey: async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = req.body;
      if (!payload || !payload.nim || !payload.kelurahan || !payload.rw) {
        res.status(400).json({
          success: false,
          message: "Data survei tidak lengkap (NIM, kelurahan, dan RW wajib diisi).",
        });
        return;
      }

      const result = await surveyService.submitSurvey(payload);

      res.status(201).json({
        success: true,
        message: "Data survei berhasil disimpan dan disinkronkan ke database.",
        data: {
          id: result.kodeSurvey,
          tahap: result.tahap,
          tahun: result.tahun,
          kelurahan: result.kelurahan,
          rw: result.rw,
          persen_pilah: result.persenPilah,
          vol_total: result.volumeTotal,
          waktu_kirim: result.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Error submitSurvey:", error);
      if (error.message === "STUDENT_NOT_VERIFIED") {
        res.status(403).json({
          success: false,
          message:
            error.details ||
            "Pengisian ditolak: NIM tidak terdaftar resmi sebagai mahasiswa KKN di database Berseka.",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || "Terjadi kesalahan saat memproses data survei.",
      });
    }
  },

  /**
   * GET /api/v1/survey/data
   * Ambil ringkasan metrik, rekap kelurahan, dan riwayat survei
   */
  getSurveyData: async (req: Request, res: Response): Promise<void> => {
    try {
      const search = (req.query.search as string) || "";
      const data = await surveyService.getSurveyData(search);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error("Error getSurveyData:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data survei.",
      });
    }
  },

  /**
   * DELETE /api/v1/survey/:id
   * Hapus survei berdasarkan ID
   */
  getKelompokList: async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await surveyService.getKelompokList();
      res.json({ success: true, data });
    } catch (error) {
      console.error("getKelompokList error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil daftar kelompok." });
    }
  },

  deleteSurvey: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await surveyService.deleteSurvey(id);

      res.status(200).json({
        success: true,
        message: "Survei berhasil dihapus.",
      });
    } catch (error: any) {
      console.error("Error deleteSurvey:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Gagal menghapus data survei.",
      });
    }
  },
};
