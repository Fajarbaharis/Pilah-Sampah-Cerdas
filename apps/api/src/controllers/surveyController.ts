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
      let payload = req.body;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch (parseErr) {
          res.status(400).json({
            success: false,
            message: "Format payload survei tidak valid (JSON parse error).",
          });
          return;
        }
      }

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

      if (error.message === "BASELINE_REQUIRED") {
        res.status(400).json({
          success: false,
          code: "BASELINE_REQUIRED",
          message:
            error.details ||
            "Survei Endline belum dapat disimpan karena data Baseline belum tersedia. Silakan isi survei Baseline terlebih dahulu.",
        });
        return;
      }

      if (error.message === "KELURAHAN_MISMATCH" || error.message === "RW_MISMATCH") {
        res.status(400).json({
          success: false,
          message:
            error.details || "Wilayah survei tidak sesuai dengan wilayah penugasan kelompok Anda.",
          code: error.message,
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
      const tahap = (req.query.tahap as string) || "";
      const kelurahan = (req.query.kelurahan as string) || "";
      const data = await surveyService.getSurveyData(search, tahap, kelurahan);

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
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Autentikasi diperlukan. Silakan login sebagai Super Admin atau Developer.",
        });
        return;
      }

      const roleUpper = String(user.role || "").toUpperCase();
      const isAllowed = ["SUPER_USER", "SUPERUSER", "SUPER_ADMIN", "ADMIN_DLH", "DEVELOPER"].includes(roleUpper);

      if (!isAllowed) {
        res.status(403).json({
          success: false,
          message: "Akses ditolak. Penghapusan data survei RW secara permanen (hard delete) khusus dibatasi untuk Super Admin atau Developer.",
        });
        return;
      }

      await surveyService.deleteSurvey(id);

      res.status(200).json({
        success: true,
        message: "Survei RW dan seluruh riwayat revisinya berhasil dihapus secara permanen.",
      });
    } catch (error: any) {
      console.error("Error deleteSurvey:", error);
      const statusCode = error.message === "NOT_FOUND" ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message === "NOT_FOUND" ? "Data survei tidak ditemukan." : "Gagal menghapus data survei.",
      });
    }
  },

  getSurveyRiwayat: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const survey = await surveyService.getSurveyRiwayat(id);
      if (!survey) {
        res.status(404).json({
          success: false,
          message: "Data survei tidak ditemukan.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: survey,
      });
    } catch (error: any) {
      console.error("Error getSurveyRiwayat:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil riwayat revisi survei.",
      });
    }
  },

  /**
   * GET /api/v1/survey/check-rw
   * Pengecekan real-time apakah RW sudah pernah disurvei
   */
  checkRw: async (req: Request, res: Response): Promise<void> => {
    try {
      const kelurahan = (req.query.kelurahan as string) || "";
      const rw = (req.query.rw as string) || "";
      const tahap = (req.query.tahap as string) || "Endline";
      const tahun = (req.query.tahun as string) || "2026";

      if (!kelurahan || !rw) {
        res.status(400).json({
          success: false,
          message: "Parameter kelurahan dan rw wajib disertakan.",
        });
        return;
      }

      const result = await surveyService.checkRwSurvey(kelurahan, rw, tahap, tahun);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error checkRw:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memeriksa status RW.",
      });
    }
  },
};
