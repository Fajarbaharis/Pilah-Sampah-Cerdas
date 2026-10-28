/**
 * Project: BERSEKA
 * Developed by: PT Makerindo & Universitas Komputer Indonesia
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Controller E-Sertifikat KKN Tematik UNIKOM
 */

import { Request, Response } from "express";
import { sertifikatKknService } from "../services/sertifikatKknService.js";

export const sertifikatKknController = {
  /**
   * Mengambil daftar e-sertifikat mahasiswa dari database live
   */
  getList: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { kelompok, prodi, search } = req.query;

      const data = await sertifikatKknService.getSertifikatList(user, {
        kelompok: kelompok as string | undefined,
        prodi: prodi as string | undefined,
        search: search as string | undefined,
      });

      res.status(200).json({
        success: true,
        total: data.length,
        data,
      });
    } catch (error: any) {
      console.error("[sertifikatKknController.getList] Error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Gagal memuat data e-sertifikat",
      });
    }
  },

  /**
   * Mengambil detail sertifikat satu orang mahasiswa berdasarkan NIM
   */
  getByNim: async (req: Request, res: Response): Promise<void> => {
    try {
      const { nim } = req.params;
      const user = req.user;

      if (!nim) {
        res.status(400).json({ success: false, message: "NIM wajib disertakan" });
        return;
      }

      const data = await sertifikatKknService.getSertifikatByNim(nim, user);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error("[sertifikatKknController.getByNim] Error:", error);
      res.status(404).json({
        success: false,
        message: error.message || "Data sertifikat mahasiswa tidak ditemukan",
      });
    }
  },

  /**
   * Endpoint Verifikasi Publik QR Code (Public Verification Endpoint)
   */
  verify: async (req: Request, res: Response): Promise<void> => {
    try {
      const { idSertifikat } = req.params;

      if (!idSertifikat) {
        res.status(400).json({ success: false, message: "ID Sertifikat wajib disertakan" });
        return;
      }

      const result = await sertifikatKknService.verifySertifikat(idSertifikat);
      if (!result.isValid) {
        res.status(404).json({
          success: false,
          ...result,
        });
        return;
      }

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error("[sertifikatKknController.verify] Error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Terjadi kesalahan saat memverifikasi sertifikat",
      });
    }
  },

  /**
   * Mengambil daftar e-sertifikat penghargaan DPL dari database live
   */
  getDplList: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { kelurahan, search } = req.query;

      const data = await sertifikatKknService.getDplSertifikatList(user, {
        kelurahan: kelurahan as string | undefined,
        search: search as string | undefined,
      });

      res.status(200).json({
        success: true,
        total: data.length,
        data,
      });
    } catch (error: any) {
      console.error("[sertifikatKknController.getDplList] Error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Gagal memuat data e-sertifikat DPL",
      });
    }
  },

  /**
   * Mengambil detail sertifikat satu orang DPL berdasarkan NIP atau ID
   */
  getDplByNip: async (req: Request, res: Response): Promise<void> => {
    try {
      const { nip } = req.params;
      const user = req.user;

      if (!nip) {
        res.status(400).json({ success: false, message: "NIP atau ID DPL wajib disertakan" });
        return;
      }

      const data = await sertifikatKknService.getDplSertifikatByNipOrId(nip, user);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error("[sertifikatKknController.getDplByNip] Error:", error);
      res.status(404).json({
        success: false,
        message: error.message || "Data sertifikat DPL tidak ditemukan",
      });
    }
  },

  /**
   * Endpoint Verifikasi Publik QR Code Sertifikat Penghargaan DPL
   */
  verifyDpl: async (req: Request, res: Response): Promise<void> => {
    try {
      const { idSertifikat } = req.params;

      if (!idSertifikat) {
        res.status(400).json({ success: false, message: "ID Sertifikat DPL wajib disertakan" });
        return;
      }

      const result = await sertifikatKknService.verifyDplSertifikat(idSertifikat);
      if (!result.isValid) {
        res.status(404).json({
          success: false,
          ...result,
        });
        return;
      }

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error("[sertifikatKknController.verifyDpl] Error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Terjadi kesalahan saat memverifikasi sertifikat DPL",
      });
    }
  },
};
