/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Store: Global Dynamic Application Branding & Identity Store
 * Mengelola identitas nama, slogan, logo, favicon, dan versi aplikasi secara dinamis.
 */

import { create } from "zustand";
import api from "../utils/api";

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

// Export runtime object to guarantee Vite/esbuild never throws missing export error
export const AppBrandingConfig = {};

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

const STORAGE_KEY = "berseka_app_branding_cache_v2";

// Memuat cache awal dari localStorage untuk mencegah layout/branding flicker
const getInitialBranding = (): AppBrandingConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("berseka_app_branding_cache");
    if (raw) {
      const parsed = JSON.parse(raw);
      // Jika masih cache versi lama dengan nomor dummy, utamakan default yang baru
      if (parsed.helpdeskPhone === "+62 812-3456-7890") {
        return { ...BERSEKA_DEFAULT_BRANDING };
      }
      return { ...BERSEKA_DEFAULT_BRANDING, ...parsed };
    }
  } catch {
    // fallback
  }
  return BERSEKA_DEFAULT_BRANDING;
};

// Menerapkan perubahan favicon, title, dan meta head secara dinamis
export const applyBrandingToHead = (config: AppBrandingConfig) => {
  if (typeof document === "undefined") return;

  // 1. Perbarui Favicon & Apple Touch Icon
  const faviconTarget = config.faviconUrl || config.logoEmblemUrl;
  if (faviconTarget) {
    const cleanUrl = faviconTarget.startsWith("data:")
      ? faviconTarget
      : `${faviconTarget}${faviconTarget.includes("?") ? "&" : "?"}v=${encodeURIComponent(config.updatedAt || Date.now())}`;

    // Target link favicon standard & shortcut
    const iconSelectors = ["link[rel*='icon']", "link[rel='apple-touch-icon']"];
    let updatedAny = false;

    iconSelectors.forEach((selector) => {
      const links = document.querySelectorAll<HTMLLinkElement>(selector);
      links.forEach((l) => {
        l.href = cleanUrl;
        updatedAny = true;
      });
    });

    if (!updatedAny) {
      const link = document.createElement("link");
      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      link.href = cleanUrl;
      document.getElementsByTagName("head")[0].appendChild(link);
    }
  }

  // 2. Perbarui Document Title Dinamis
  if (config.appName) {
    const currentTitle = document.title;
    if (!currentTitle || currentTitle.includes("BERSEKA")) {
      document.title = config.appTagline
        ? `${config.appName} - ${config.appTagline}`
        : config.appName;
    }
  }

  // 3. Perbarui Meta Tags
  try {
    const metaAppTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (metaAppTitle && config.appName) {
      metaAppTitle.setAttribute("content", config.appName);
    }

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && config.appDescription) {
      metaDesc.setAttribute(
        "content",
        `${config.appName} - ${config.appTagline}. ${config.appDescription}`
      );
    }
  } catch {
    // ignore
  }
};

interface AppBrandingState {
  branding: AppBrandingConfig;
  isLoading: boolean;
  lastFetchedAt: number | null;
  fetchBranding: (force?: boolean) => Promise<AppBrandingConfig>;
  setBranding: (newConfig: AppBrandingConfig) => void;
  formatPageTitle: (pageName?: string) => string;
}

export const useAppBrandingStore = create<AppBrandingState>((set, get) => ({
  branding: getInitialBranding(),
  isLoading: false,
  lastFetchedAt: null,

  fetchBranding: async (force = false) => {
    const { lastFetchedAt, branding } = get();
    // Cache selama 5 menit jika bukan force refresh
    if (!force && lastFetchedAt && Date.now() - lastFetchedAt < 5 * 60 * 1000) {
      return branding;
    }

    try {
      set({ isLoading: true });
      const res = await api.get("/branding/public");
      if (res.data?.success && res.data?.data) {
        const remoteConfig: AppBrandingConfig = {
          ...BERSEKA_DEFAULT_BRANDING,
          ...res.data.data,
        };

        // Simpan ke localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteConfig));
        } catch {
          // ignore
        }

        applyBrandingToHead(remoteConfig);
        set({
          branding: remoteConfig,
          isLoading: false,
          lastFetchedAt: Date.now(),
        });
        return remoteConfig;
      }
    } catch (err) {
      console.warn("[useAppBrandingStore] Failed to fetch public branding, using local cache:", err);
    } finally {
      set({ isLoading: false });
    }
    return branding;
  },

  setBranding: (newConfig: AppBrandingConfig) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch {
      // ignore
    }
    applyBrandingToHead(newConfig);
    set({ branding: newConfig, lastFetchedAt: Date.now() });
  },

  formatPageTitle: (pageName?: string) => {
    const { appName, appTagline } = get().branding;
    if (!pageName) {
      return `${appName} — ${appTagline}`;
    }
    return `${pageName} | ${appName}`;
  },
}));

// Inisialisasi awal saat bundle dimuat
if (typeof window !== "undefined") {
  applyBrandingToHead(getInitialBranding());
}
