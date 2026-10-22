/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Service: Branding & Dynamic Application Settings
 * Hak Akses: STRICTLY DEVELOPER ONLY
 */

import { prisma } from "../lib/prisma.js";
import { redisService } from "./redisService.js";

export interface AppBrandingConfig {
  appName: string;
  appTagline: string;
  appDescription: string;
  appVersion: string;
  organizationName: string;
  developerName: string;
  copyrightText: string;
  helpdeskPhone: string;
  helpdeskEmail: string;
  helpdeskUrl: string;
  logoHorizontalUrl: string;
  logoHorizontalDarkUrl: string;
  logoEmblemUrl: string;
  faviconUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updatedAt: string;
  updatedBy: string;
}

export const BERSEKA_DEFAULT_BRANDING: AppBrandingConfig = {
  appName: "BERSEKA",
  appTagline: "Bersih, Sehat, Kampung Asri",
  appDescription:
    "Platform Cerdas Tata Kelola Sampah Berkelanjutan & Ekosistem KKN Tematik Terintegrasi di Kecamatan Coblong, Kota Bandung",
  appVersion: "1.0.0",
  organizationName: "CDC UNIKOM & Dinas Lingkungan Hidup Kota Bandung",
  developerName: "PT Makerindo",
  copyrightText: "© 2026 BERSEKA. Bersih, Sehat, Kampung Asri. Hak Cipta Dilindungi Undang-Undang.",
  helpdeskPhone: "+62 857-1551-6065",
  helpdeskEmail: "cdc@unikom.ac.id",
  helpdeskUrl: "https://wa.me/6285715516065",
  logoHorizontalUrl: "/logos/berseka/berseka-logo-full.webp",
  logoHorizontalDarkUrl: "/logos/berseka/berseka-logo-full.png",
  logoEmblemUrl: "/logos/berseka/berseka-logo-bg-transparent.png",
  faviconUrl: "/logos/berseka/berseka-logo-bg-transparent.png",
  maintenanceMode: false,
  maintenanceMessage:
    "Sistem BERSEKA sedang dalam pemeliharaan berkala untuk peningkatan performa. Silakan kembali dalam beberapa saat.",
  updatedAt: new Date().toISOString(),
  updatedBy: "System Default",
};

const CONFIG_KEY = "app_branding_config";
const HISTORY_KEY = "app_branding_history";
const MAX_HISTORY_ITEMS = 10;

export class BrandingService {
  /**
   * Mengambil konfigurasi branding aktif dengan Redis caching
   */
  async getBranding(): Promise<{
    config: AppBrandingConfig;
    historyCount: number;
    hasPrevious: boolean;
  }> {
    // 1. Cek Redis Cache
    try {
      const cached = await redisService.getConfigCache(CONFIG_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const historyCount = await this.getHistoryCount();
        return {
          config: { ...BERSEKA_DEFAULT_BRANDING, ...parsed },
          historyCount,
          hasPrevious: historyCount > 0,
        };
      }
    } catch (err) {
      console.warn("[brandingService] Redis cache lookup failed:", err);
    }

    // 2. Cek Database PostgreSQL
    const record = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });

    let currentConfig: AppBrandingConfig = BERSEKA_DEFAULT_BRANDING;
    if (record && record.value) {
      try {
        currentConfig = { ...BERSEKA_DEFAULT_BRANDING, ...JSON.parse(record.value) };
      } catch (e) {
        console.error("[brandingService] Failed to parse branding JSON from DB:", e);
      }
    } else {
      // Inisialisasi default ke DB jika belum ada
      try {
        await prisma.systemConfig.upsert({
          where: { key: CONFIG_KEY },
          update: {
            value: JSON.stringify(BERSEKA_DEFAULT_BRANDING),
            tipe: "JSON",
            deskripsi: "Konfigurasi Identitas, Nama, Logo, dan Hak Cipta Dinamis Aplikasi",
            updatedBy: "System Init",
          },
          create: {
            key: CONFIG_KEY,
            value: JSON.stringify(BERSEKA_DEFAULT_BRANDING),
            tipe: "JSON",
            deskripsi: "Konfigurasi Identitas, Nama, Logo, dan Hak Cipta Dinamis Aplikasi",
            updatedBy: "System Init",
          },
        });
      } catch (err) {
        console.warn("[brandingService] Auto-seed default branding warning:", err);
      }
    }

    // 3. Simpan ke Redis Cache
    try {
      await redisService.setConfigCache(CONFIG_KEY, JSON.stringify(currentConfig));
    } catch (err) {
      console.warn("[brandingService] Failed to set Redis cache:", err);
    }

    const historyCount = await this.getHistoryCount();
    return {
      config: currentConfig,
      historyCount,
      hasPrevious: historyCount > 0,
    };
  }

  /**
   * Menghitung jumlah snapshot riwayat yang tersimpan
   */
  private async getHistoryCount(): Promise<number> {
    try {
      const hist = await prisma.systemConfig.findUnique({
        where: { key: HISTORY_KEY },
      });
      if (hist && hist.value) {
        const list = JSON.parse(hist.value);
        return Array.isArray(list) ? list.length : 0;
      }
    } catch {
      // ignore
    }
    return 0;
  }

  /**
   * Memperbarui konfigurasi identitas aplikasi (STRICTLY DEVELOPER)
   */
  async updateBranding(
    newValues: Partial<AppBrandingConfig>,
    developerName: string,
    developerId: string,
    ipAddress?: string,
    roleName: string = "DEVELOPER"
  ): Promise<AppBrandingConfig> {
    // 1. Ambil config saat ini untuk dijadikan history snapshot
    const current = (await this.getBranding()).config;

    // 2. Simpan snapshot saat ini ke riwayat
    await this.pushToHistory(current);

    // 3. Susun data baru
    const updated: AppBrandingConfig = {
      ...current,
      ...newValues,
      updatedAt: new Date().toISOString(),
      updatedBy: developerName || "Developer",
    };

    const jsonStr = JSON.stringify(updated);

    // 4. Upsert ke database
    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      update: {
        value: jsonStr,
        updatedBy: developerName,
      },
      create: {
        key: CONFIG_KEY,
        value: jsonStr,
        tipe: "JSON",
        deskripsi: "Konfigurasi Identitas, Nama, Logo, dan Hak Cipta Dinamis Aplikasi",
        updatedBy: developerName,
      },
    });

    // 5. Invalidate Redis Cache
    try {
      await redisService.invalidateConfigCache(CONFIG_KEY);
      await redisService.setConfigCache(CONFIG_KEY, jsonStr);
    } catch (err) {
      console.warn("[brandingService] Failed to update Redis cache:", err);
    }

    // 6. Catat Jejak Audit (AuditTrail)
    try {
      await prisma.auditTrail.create({
        data: {
          action: "UPDATE_APP_BRANDING",
          userId: developerId,
          roleName: roleName.toUpperCase(),
          featureCategory: "PENGATURAN_APLIKASI",
          endpoint: "/api/v1/branding",
          ipAddress: ipAddress || "127.0.0.1",
          oldValue: current as any,
          newValue: updated as any,
        },
      });
    } catch (auditErr) {
      console.warn("[brandingService] Failed to record AuditTrail:", auditErr);
    }

    return updated;
  }

  /**
   * Menyimpan snapshot ke riwayat (Stack LIFO, maksimal 10 snapshot)
   */
  private async pushToHistory(snapshot: AppBrandingConfig): Promise<void> {
    try {
      const record = await prisma.systemConfig.findUnique({
        where: { key: HISTORY_KEY },
      });

      let list: AppBrandingConfig[] = [];
      if (record && record.value) {
        list = JSON.parse(record.value);
        if (!Array.isArray(list)) list = [];
      }

      list.unshift(snapshot);
      if (list.length > MAX_HISTORY_ITEMS) {
        list = list.slice(0, MAX_HISTORY_ITEMS);
      }

      await prisma.systemConfig.upsert({
        where: { key: HISTORY_KEY },
        update: {
          value: JSON.stringify(list),
          updatedBy: snapshot.updatedBy,
        },
        create: {
          key: HISTORY_KEY,
          value: JSON.stringify(list),
          tipe: "JSON",
          deskripsi: "Riwayat Snapshot Konfigurasi Identitas Aplikasi untuk Rollback/Restore",
          updatedBy: snapshot.updatedBy,
        },
      });
    } catch (err) {
      console.warn("[brandingService] Failed to push branding history:", err);
    }
  }

  /**
   * Mengembalikan konfigurasi ke snapshot sebelumnya (Restore Previous Version)
   */
  async restorePrevious(
    developerName: string,
    developerId: string,
    ipAddress?: string,
    roleName: string = "DEVELOPER"
  ): Promise<AppBrandingConfig> {
    const record = await prisma.systemConfig.findUnique({
      where: { key: HISTORY_KEY },
    });

    if (!record || !record.value) {
      throw new Error("Tidak ada riwayat konfigurasi sebelumnya yang dapat dipulihkan.");
    }

    let list: AppBrandingConfig[] = JSON.parse(record.value);
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("Riwayat konfigurasi sebelumnya kosong.");
    }

    // Ambil snapshot terakhir
    const previousSnapshot = list.shift()!;

    // Simpan sisa riwayat
    await prisma.systemConfig.update({
      where: { key: HISTORY_KEY },
      data: {
        value: JSON.stringify(list),
        updatedBy: developerName,
      },
    });

    // Ambil state saat ini untuk audit trail
    const current = (await this.getBranding()).config;

    // Terapkan snapshot sebelumnya
    const restoredConfig: AppBrandingConfig = {
      ...previousSnapshot,
      updatedAt: new Date().toISOString(),
      updatedBy: `${developerName} (Dipulihkan dari riwayat)`,
    };

    const jsonStr = JSON.stringify(restoredConfig);

    await prisma.systemConfig.update({
      where: { key: CONFIG_KEY },
      data: {
        value: jsonStr,
        updatedBy: developerName,
      },
    });

    // Invalidate Redis Cache
    try {
      await redisService.invalidateConfigCache(CONFIG_KEY);
      await redisService.setConfigCache(CONFIG_KEY, jsonStr);
    } catch (err) {
      console.warn("[brandingService] Failed to update Redis cache:", err);
    }

    // Catat Jejak Audit
    try {
      await prisma.auditTrail.create({
        data: {
          action: "RESTORE_PREVIOUS_APP_BRANDING",
          userId: developerId,
          roleName: roleName.toUpperCase(),
          featureCategory: "PENGATURAN_APLIKASI",
          endpoint: "/api/v1/branding/restore-previous",
          ipAddress: ipAddress || "127.0.0.1",
          oldValue: current as any,
          newValue: restoredConfig as any,
        },
      });
    } catch (auditErr) {
      console.warn("[brandingService] Failed to record AuditTrail:", auditErr);
    }

    return restoredConfig;
  }

  /**
   * Mengembalikan konfigurasi ke Pengaturan Awal Pabrik (Factory Defaults)
   */
  async resetFactory(
    developerName: string,
    developerId: string,
    ipAddress?: string,
    roleName: string = "DEVELOPER"
  ): Promise<AppBrandingConfig> {
    const current = (await this.getBranding()).config;

    // Simpan snapshot saat ini sebelum di-reset pabrik
    await this.pushToHistory(current);

    const factoryConfig: AppBrandingConfig = {
      ...BERSEKA_DEFAULT_BRANDING,
      updatedAt: new Date().toISOString(),
      updatedBy: `${developerName} (Reset Pabrik)`,
    };

    const jsonStr = JSON.stringify(factoryConfig);

    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      update: {
        value: jsonStr,
        updatedBy: developerName,
      },
      create: {
        key: CONFIG_KEY,
        value: jsonStr,
        tipe: "JSON",
        deskripsi: "Konfigurasi Identitas, Nama, Logo, dan Hak Cipta Dinamis Aplikasi",
        updatedBy: developerName,
      },
    });

    // Invalidate Redis Cache
    try {
      await redisService.invalidateConfigCache(CONFIG_KEY);
      await redisService.setConfigCache(CONFIG_KEY, jsonStr);
    } catch (err) {
      console.warn("[brandingService] Failed to update Redis cache:", err);
    }

    // Catat Jejak Audit
    try {
      await prisma.auditTrail.create({
        data: {
          action: "RESET_FACTORY_APP_BRANDING",
          userId: developerId,
          roleName: roleName.toUpperCase(),
          featureCategory: "PENGATURAN_APLIKASI",
          endpoint: "/api/v1/branding/reset-factory",
          ipAddress: ipAddress || "127.0.0.1",
          oldValue: current as any,
          newValue: factoryConfig as any,
        },
      });
    } catch (auditErr) {
      console.warn("[brandingService] Failed to record AuditTrail:", auditErr);
    }

    return factoryConfig;
  }
}

export const brandingService = new BrandingService();
