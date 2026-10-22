/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Controller: Branding & Dynamic Application Settings
 * Hak Akses: STRICTLY DEVELOPER ONLY
 */

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { brandingService } from "../services/brandingService.js";

export class BrandingController {
  /**
   * Mengambil konfigurasi identitas publik (Tanpa Otentikasi)
   * Digunakan oleh Web Guest, Login, Register, Landing Page, dan Mobile Startup
   */
  async getPublicBranding(_req: Request, res: Response): Promise<void> {
    try {
      const data = await brandingService.getBranding();
      res.status(200).json({
        success: true,
        data: data.config,
      });
    } catch (error: any) {
      console.error("[BrandingController] getPublicBranding error:", error);
      res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Gagal memuat konfigurasi identitas aplikasi.",
      });
    }
  }

  /**
   * Mengambil konfigurasi lengkap beserta riwayat (Khusus DEVELOPER)
   */
  async getDeveloperBranding(req: Request, res: Response): Promise<void> {
    try {
      const data = await brandingService.getBranding();
      res.status(200).json({
        success: true,
        data: data.config,
        historyCount: data.historyCount,
        hasPrevious: data.hasPrevious,
      });
    } catch (error: any) {
      console.error("[BrandingController] getDeveloperBranding error:", error);
      res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memuat pengaturan aplikasi untuk pengembang.",
      });
    }
  }

  /**
   * Verifikasi Keamanan 2-Tahap: Memeriksa kata sandi akun Pengembang
   */
  private async verifyDeveloperPassword(userId: string, passwordConfirm?: string): Promise<boolean> {
    if (!passwordConfirm) return false;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) return false;
    return bcrypt.compare(passwordConfirm, user.password);
  }

  /**
   * Memperbarui konfigurasi identitas aplikasi
   * Wajib Verifikasi 2-Tahap dengan Kata Sandi Akun Developer
   */
  async updateBranding(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { config, passwordConfirm } = req.body;

      if (!config || typeof config !== "object") {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "Data konfigurasi tidak valid.",
        });
        return;
      }

      // Verifikasi Keamanan Tahap 2
      const isVerified = await this.verifyDeveloperPassword(userId, passwordConfirm);
      if (!isVerified) {
        res.status(401).json({
          success: false,
          code: "SECURITY_VERIFICATION_FAILED",
          message:
            "Verifikasi Keamanan Gagal: Kata sandi akun Pengembang tidak sesuai. Perubahan dibatalkan.",
        });
        return;
      }

      // Ambil nama user developer
      const devUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const developerName = devUser?.name || "Developer";
      const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip;
      const roleName = req.user?.role || "DEVELOPER";

      const updated = await brandingService.updateBranding(
        config,
        developerName,
        userId,
        ipAddress,
        roleName
      );

      res.status(200).json({
        success: true,
        message: "Pengaturan identitas aplikasi berhasil diperbarui secara menyeluruh.",
        data: updated,
      });
    } catch (error: any) {
      console.error("[BrandingController] updateBranding error:", error);
      res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memperbarui pengaturan aplikasi.",
      });
    }
  }

  /**
   * Mengunggah Aset Logo / Favicon
   */
  async uploadAsset(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "Berkas gambar logo wajib disertakan.",
        });
        return;
      }

      const relativeUrl = `/uploads/${req.file.filename}`;
      res.status(200).json({
        success: true,
        message: "Berkas logo berhasil diunggah.",
        url: relativeUrl,
      });
    } catch (error: any) {
      console.error("[BrandingController] uploadAsset error:", error);
      res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal mengunggah berkas logo.",
      });
    }
  }

  /**
   * Mengembalikan ke snapshot sebelumnya (Restore Previous Version)
   */
  async restorePrevious(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { passwordConfirm } = req.body;

      const isVerified = await this.verifyDeveloperPassword(userId, passwordConfirm);
      if (!isVerified) {
        res.status(401).json({
          success: false,
          code: "SECURITY_VERIFICATION_FAILED",
          message:
            "Verifikasi Keamanan Gagal: Kata sandi akun Pengembang tidak sesuai. Pemulihan dibatalkan.",
        });
        return;
      }

      const devUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const developerName = devUser?.name || "Developer";
      const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip;
      const roleName = req.user?.role || "DEVELOPER";

      const restored = await brandingService.restorePrevious(
        developerName,
        userId,
        ipAddress,
        roleName
      );

      res.status(200).json({
        success: true,
        message: "Konfigurasi identitas aplikasi berhasil dipulihkan ke versi sebelumnya.",
        data: restored,
      });
    } catch (error: any) {
      console.error("[BrandingController] restorePrevious error:", error);
      res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memulihkan versi sebelumnya.",
      });
    }
  }

  /**
   * Mengembalikan ke Pengaturan Awal Pabrik (Reset Factory Defaults)
   */
  async resetFactory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { passwordConfirm } = req.body;

      const isVerified = await this.verifyDeveloperPassword(userId, passwordConfirm);
      if (!isVerified) {
        res.status(401).json({
          success: false,
          code: "SECURITY_VERIFICATION_FAILED",
          message:
            "Verifikasi Keamanan Gagal: Kata sandi akun Pengembang tidak sesuai. Reset dibatalkan.",
        });
        return;
      }

      const devUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const developerName = devUser?.name || "Developer";
      const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip;
      const roleName = req.user?.role || "DEVELOPER";

      const resetData = await brandingService.resetFactory(
        developerName,
        userId,
        ipAddress,
        roleName
      );

      res.status(200).json({
        success: true,
        message: "Pengaturan identitas aplikasi berhasil dikembalikan ke standar awal pabrik.",
        data: resetData,
      });
    } catch (error: any) {
      console.error("[BrandingController] resetFactory error:", error);
      res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal melakukan reset pabrik.",
      });
    }
  }
}

export const brandingController = new BrandingController();
