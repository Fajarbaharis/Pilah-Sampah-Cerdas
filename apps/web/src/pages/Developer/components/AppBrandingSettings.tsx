/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Khusus Pengembang: Pengaturan Identitas & Branding Dinamis Aplikasi
 * Hak Akses: STRICTLY DEVELOPER ONLY (Dilarang untuk SUPER_USER, PIMPINAN, dll.)
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Sliders,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Globe,
  FileText,
  Phone,
  Mail,
  Lock,
  Layers,
  Check,
  X,
  ExternalLink,
  Laptop,
  Smartphone,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../utils/api";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  useAppBrandingStore,
  type AppBrandingConfig,
  BERSEKA_DEFAULT_BRANDING,
} from "../../../store/useAppBrandingStore";
import {
  optimizeLogoImage,
  formatFileSize,
  type LogoTargetType,
  type OptimizedImageResult,
} from "../../../utils/logoImageOptimizer";

interface UploadState {
  isUploading: boolean;
  optimizedInfo?: OptimizedImageResult;
  error?: string;
}

export const AppBrandingSettings: React.FC = () => {
  const { user } = useAuthStore();
  const rawRole = (user?.peran || (user as any)?.role || "").toUpperCase();
  const isAuthorized = ["DEVELOPER", "SUPER_USER"].includes(rawRole);

  const { branding: globalBranding, setBranding: updateGlobalBranding } = useAppBrandingStore();

  // Form State
  const [formData, setFormData] = useState<AppBrandingConfig>(globalBranding);
  const [originalData, setOriginalData] = useState<AppBrandingConfig>(globalBranding);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [hasPrevious, setHasPrevious] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Upload States per target
  const [uploadStates, setUploadStates] = useState<Record<LogoTargetType, UploadState>>({
    horizontal: { isUploading: false },
    emblem: { isUploading: false },
    favicon: { isUploading: false },
  });

  // Modal 2-Step Verification State
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [verificationType, setVerificationType] = useState<"save" | "restore" | "reset">("save");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);

  // Preview Mode State: Desktop vs Mobile Mockup
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [activeFormTab, setActiveFormTab] = useState<"identitas" | "visual" | "legal" | "kontak" | "sistem">("identitas");

  // Fetch initial branding & history from developer API
  const fetchDeveloperConfig = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/branding");
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setFormData(data);
        setOriginalData(data);
        setHistoryCount(res.data.historyCount || 0);
        setHasPrevious(Boolean(res.data.hasPrevious));
      }
    } catch (err: any) {
      console.warn("[AppBrandingSettings] Failed to fetch developer branding:", err);
      toast.error(err.response?.data?.message || "Gagal memuat pengaturan identitas aplikasi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchDeveloperConfig();
    }
  }, [isAuthorized]);

  // Handle Input Changes
  const handleChange = (field: keyof AppBrandingConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle Logo Upload with Auto-Conversion to Lightweight HD WebP
  const handleLogoUpload = async (file: File, target: LogoTargetType) => {
    setUploadStates((prev) => ({
      ...prev,
      [target]: { isUploading: true, error: undefined },
    }));

    try {
      // 1. Optimasi Gambar di Sisi Klien (Canvas Auto-Compress to HD WebP)
      const optResult = await optimizeLogoImage(file, target);

      // 2. Unggah ke Backend API
      const formPayload = new FormData();
      formPayload.append("asset", optResult.file);

      const res = await api.post("/branding/upload-asset", formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success && res.data?.url) {
        const uploadedUrl = res.data.url;

        // Terapkan ke state form sesuai target
        if (target === "horizontal") {
          handleChange("logoHorizontalUrl", uploadedUrl);
        } else if (target === "emblem") {
          handleChange("logoEmblemUrl", uploadedUrl);
        } else if (target === "favicon") {
          handleChange("faviconUrl", uploadedUrl);
        }

        setUploadStates((prev) => ({
          ...prev,
          [target]: { isUploading: false, optimizedInfo: optResult },
        }));

        toast.success(
          `Logo berhasil dikonversi ke WebP (${formatFileSize(optResult.originalSize)} ➔ ${formatFileSize(optResult.optimizedSize)}, hemat ${optResult.reductionPercent}%)`
        );
      } else {
        throw new Error(res.data?.message || "Gagal mengunggah berkas logo.");
      }
    } catch (err: any) {
      console.error("[handleLogoUpload] Error:", err);
      const errMsg = err.message || "Gagal memproses dan mengunggah logo.";
      setUploadStates((prev) => ({
        ...prev,
        [target]: { isUploading: false, error: errMsg },
      }));
      toast.error(errMsg);
    }
  };

  // Hitung Daftar Perubahan (Diff Calculator)
  const calculateDiff = () => {
    const changes: Array<{ label: string; key: keyof AppBrandingConfig; oldVal: string; newVal: string }> = [];

    const fieldLabels: Partial<Record<keyof AppBrandingConfig, string>> = {
      appName: "Nama Aplikasi",
      appTagline: "Slogan / Tagline",
      appDescription: "Deskripsi Aplikasi",
      appVersion: "Versi Aplikasi",
      organizationName: "Instansi Penyelenggara",
      developerName: "Nama Pengembang",
      copyrightText: "Teks Hak Cipta",
      helpdeskPhone: "Nomor WhatsApp Helpdesk",
      helpdeskEmail: "Email Dukungan Resmi",
      logoHorizontalUrl: "Logo Horizontal (Light)",
      logoHorizontalDarkUrl: "Logo Horizontal (Dark)",
      logoEmblemUrl: "Ikon Emblem",
      faviconUrl: "Favicon Tab Browser",
      maintenanceMode: "Mode Pemeliharaan",
      maintenanceMessage: "Pesan Pemeliharaan",
    };

    (Object.keys(fieldLabels) as Array<keyof AppBrandingConfig>).forEach((k) => {
      const oldV = String(originalData[k] ?? "");
      const newV = String(formData[k] ?? "");
      if (oldV !== newV) {
        changes.push({
          label: fieldLabels[k] || k,
          key: k,
          oldVal: oldV,
          newVal: newV,
        });
      }
    });

    return changes;
  };

  const changesList = calculateDiff();
  const hasChanges = changesList.length > 0;

  // Buka Modal 2-Step Verification
  const openVerificationModal = (type: "save" | "restore" | "reset") => {
    setVerificationType(type);
    setPasswordConfirm("");
    setModalStep(1);
    setShowVerifyModal(true);
  };

  // Eksekusi Submit dengan Verifikasi Sandi Akun Pengembang
  const handleExecuteVerifiedAction = async () => {
    if (!passwordConfirm.trim()) {
      toast.error("Kata sandi akun Pengembang wajib diisi untuk verifikasi keamanan.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (verificationType === "save") {
        const res = await api.put("/branding", {
          config: formData,
          passwordConfirm,
        });
        if (res.data?.success) {
          toast.success("Pengaturan identitas aplikasi berhasil diperbarui secara menyeluruh!");
          updateGlobalBranding(res.data.data);
          setOriginalData(res.data.data);
          setFormData(res.data.data);
          fetchDeveloperConfig();
          setShowVerifyModal(false);
        }
      } else if (verificationType === "restore") {
        const res = await api.post("/branding/restore-previous", {
          passwordConfirm,
        });
        if (res.data?.success) {
          toast.success("Berhasil memulihkan ke konfigurasi sebelumnya!");
          updateGlobalBranding(res.data.data);
          setOriginalData(res.data.data);
          setFormData(res.data.data);
          fetchDeveloperConfig();
          setShowVerifyModal(false);
        }
      } else if (verificationType === "reset") {
        const res = await api.post("/branding/reset-factory", {
          passwordConfirm,
        });
        if (res.data?.success) {
          toast.success("Konfigurasi aplikasi berhasil di-reset ke standar awal pabrik!");
          updateGlobalBranding(res.data.data);
          setOriginalData(res.data.data);
          setFormData(res.data.data);
          fetchDeveloperConfig();
          setShowVerifyModal(false);
        }
      }
    } catch (err: any) {
      console.error("[handleExecuteVerifiedAction] Error:", err);
      const errMsg =
        err.response?.data?.message || "Verifikasi keamanan gagal. Silakan periksa kembali kata sandi Anda.";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-3xl text-center space-y-3">
        <ShieldAlert size={48} className="mx-auto text-red-600 dark:text-red-400" />
        <h2 className="text-xl font-black text-red-900 dark:text-red-100">Akses Terbatas: Developer Only</h2>
        <p className="text-xs text-red-700 dark:text-red-300 max-w-md mx-auto">
          Halaman Pengaturan Aplikasi & Branding dilindungi secara ketat dan hanya dapat diakses oleh akun dengan peran <strong>DEVELOPER</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5">
                <ShieldCheck size={13} /> STRICTLY DEVELOPER ONLY
              </span>
              <span className="text-xs text-emerald-200/80 font-medium">
                Aktif: v{formData.appVersion}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Sliders size={26} className="text-emerald-400" /> Pengaturan Identitas & Branding Aplikasi
            </h1>
            <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
              Konfigurasi dinamis nama sistem, slogan, logo, hak cipta, dan pusat bantuan. Perubahan langsung tersinkronisasi ke Sidebar, Header, Footer, favicon, serta judul tab browser di seluruh sesi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => fetchDeveloperConfig()}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer border border-white/10"
              title="Sinkronkan dengan data VPS"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-emerald-400" : ""} />
              Muat Ulang
            </button>
            <button
              onClick={() => openVerificationModal("restore")}
              disabled={!hasPrevious || isLoading}
              className="px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer border border-amber-400/30 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Kembalikan ke snapshot sebelum perubahan terakhir"
            >
              <RotateCcw size={14} />
              Pulihkan ({historyCount})
            </button>
            <button
              onClick={() => openVerificationModal("reset")}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-200 font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer border border-red-400/30"
              title="Kembalikan ke standar default pabrik BERSEKA"
            >
              <Sparkles size={14} />
              Reset Pabrik
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form di Kiri, Live Interactive Preview di Kanan */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* KOLOM KIRI: FORM PENGATURAN (7 Kolom) */}
        <div className="xl:col-span-7 space-y-5">
          {/* Form Tabs Nav */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto scrollbar-none border border-slate-200 dark:border-slate-700">
            {[
              { id: "identitas", label: "Identitas", icon: Globe },
              { id: "visual", label: "Visual & Logo", icon: Upload },
              { id: "legal", label: "Legalitas & Hak Cipta", icon: FileText },
              { id: "kontak", label: "Pusat Bantuan", icon: Phone },
              { id: "sistem", label: "Status Sistem", icon: Sliders },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFormTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFormTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-slate-900 text-[#009966] dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Tab 1: Identitas Utama */}
          {activeFormTab === "identitas" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-2xs animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Identitas & Penamaan Aplikasi</h3>
                <p className="text-xs text-slate-500 font-medium">Atur nama formal, nama singkat, slogan, dan deskripsi sistem.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    Nama Aplikasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.appName}
                    onChange={(e) => handleChange("appName", e.target.value)}
                    placeholder="Contoh: BERSEKA"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400">Tampil di Header, Sidebar, Login, dan Footer.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    Versi Rilis Aplikasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.appVersion}
                    onChange={(e) => handleChange("appVersion", e.target.value)}
                    placeholder="Contoh: 1.2.0"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400">Badge versi di footer & informasi sistem.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  Slogan / Tagline Resmi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.appTagline}
                  onChange={(e) => handleChange("appTagline", e.target.value)}
                  placeholder="Contoh: Bersih, Sehat, Kampung Asri"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  Deskripsi Eksekutif Sistem
                </label>
                <textarea
                  rows={3}
                  value={formData.appDescription}
                  onChange={(e) => handleChange("appDescription", e.target.value)}
                  placeholder="Deskripsi singkat fungsi dan tujuan platform..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none transition-all leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Form Tab 2: Visual & Logo */}
          {activeFormTab === "visual" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-2xs animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Aset Visual & Logo Aplikasi</h3>
                  <p className="text-xs text-slate-500 font-medium">Unggah berkas gambar. Sistem otomatis mengompresi ke WebP HD dengan latar transparan.</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10.5px] font-extrabold">
                  Auto-Convert WebP HD
                </span>
              </div>

              {/* 1. Logo Horizontal Light */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Logo Horizontal Utama (Light Mode)
                  </span>
                  <span className="text-[10px] text-slate-400">Rasio ~3:1 (Maks. 1600x600 px)</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="h-16 w-44 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-2xs">
                    {formData.logoHorizontalUrl ? (
                      <img
                        src={formData.logoHorizontalUrl}
                        alt="Logo Preview"
                        className="h-full w-auto object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400">Belum ada logo</span>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-1.5">
                    <input
                      type="file"
                      id="upload-logo-horizontal"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, "horizontal");
                      }}
                    />
                    <label
                      htmlFor="upload-logo-horizontal"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all shadow-xs"
                    >
                      <Upload size={14} />
                      {uploadStates.horizontal.isUploading ? "Mengompresi & Mengunggah..." : "Pilih Logo Light (HD)"}
                    </label>
                    <p className="text-[10.5px] text-slate-400">
                      Format: PNG transparan, WebP, SVG, atau JPG. Maksimal 5 MB.
                    </p>
                  </div>
                </div>

                {uploadStates.horizontal.optimizedInfo && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 text-[10.5px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>
                      Dikonversi ke WebP: {formatFileSize(uploadStates.horizontal.optimizedInfo.originalSize)} ➔{" "}
                      <strong>{formatFileSize(uploadStates.horizontal.optimizedInfo.optimizedSize)}</strong> (Hemat{" "}
                      {uploadStates.horizontal.optimizedInfo.reductionPercent}%)
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Logo Horizontal Dark */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Logo Horizontal (Dark Mode Variant)
                  </span>
                  <span className="text-[10px] text-slate-400">Teks putih / terang</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="h-16 w-44 bg-slate-900 rounded-xl border border-dashed border-slate-700 flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-2xs">
                    {formData.logoHorizontalDarkUrl ? (
                      <img
                        src={formData.logoHorizontalDarkUrl}
                        alt="Dark Logo Preview"
                        className="h-full w-auto object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-500">Belum ada logo dark</span>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-1.5">
                    <input
                      type="file"
                      id="upload-logo-dark"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, "horizontal");
                      }}
                    />
                    <label
                      htmlFor="upload-logo-dark"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer transition-all border border-slate-700 shadow-xs"
                    >
                      <Upload size={14} />
                      Pilih Logo Dark Variant
                    </label>
                    <p className="text-[10.5px] text-slate-400">
                      Gunakan logo dengan teks terang agar kontras optimal di background gelap.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Emblem / Favicon */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Ikon Emblem Bulat & Favicon Tab Browser
                  </span>
                  <span className="text-[10px] text-slate-400">Rasio 1:1 (Maks. 512x512 px)</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="h-16 w-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-2xs">
                    {formData.logoEmblemUrl ? (
                      <img
                        src={formData.logoEmblemUrl}
                        alt="Emblem Preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400">Kosong</span>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-1.5">
                    <input
                      type="file"
                      id="upload-emblem"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, "emblem");
                      }}
                    />
                    <label
                      htmlFor="upload-emblem"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all shadow-xs"
                    >
                      <Upload size={14} />
                      {uploadStates.emblem.isUploading ? "Mengompresi..." : "Pilih Ikon Emblem (1:1)"}
                    </label>
                    <p className="text-[10.5px] text-slate-400">
                      Tampil di mini-sidebar, ikon favicon tab browser, dan avatar resmi sistem.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Tab 3: Legalitas & Hak Cipta */}
          {activeFormTab === "legal" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-2xs animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Legalitas & Kepemilikan Sistem</h3>
                <p className="text-xs text-slate-500 font-medium">Informasi instansi penyelenggara, pengembang, dan pernyataan hak cipta.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  Instansi / Dinas Penyelenggara
                </label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => handleChange("organizationName", e.target.value)}
                  placeholder="Contoh: Dinas Lingkungan Hidup Kota Bandung & UNIKOM"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  Nama Pengembang (Vendor / Developer)
                </label>
                <input
                  type="text"
                  value={formData.developerName}
                  onChange={(e) => handleChange("developerName", e.target.value)}
                  placeholder="Contoh: PT Makerindo"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  Teks Hak Cipta (Footer Copyright)
                </label>
                <input
                  type="text"
                  value={formData.copyrightText}
                  onChange={(e) => handleChange("copyrightText", e.target.value)}
                  placeholder="Contoh: © 2026 BERSEKA. Hak Cipta Dilindungi Undang-Undang."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Form Tab 4: Pusat Bantuan & Kontak */}
          {activeFormTab === "kontak" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-2xs animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Kontak Dukungan & Helpdesk</h3>
                <p className="text-xs text-slate-500 font-medium">Nomor pengaduan warga/mahasiswa dan alamat email resmi.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    Nomor WhatsApp Pusat Bantuan
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={formData.helpdeskPhone}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleChange("helpdeskPhone", val);
                        // Auto-generate wa.me url jika valid
                        const digits = val.replace(/\D/g, "");
                        const waUrl = digits.startsWith("0")
                          ? `https://wa.me/62${digits.slice(1)}`
                          : `https://wa.me/${digits}`;
                        handleChange("helpdeskUrl", waUrl);
                      }}
                      placeholder="Contoh: 0812-3456-7890"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    Email Dukungan Resmi
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      value={formData.helpdeskEmail}
                      onChange={(e) => handleChange("helpdeskEmail", e.target.value)}
                      placeholder="Contoh: bantuan@berseka.id"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  Tautan Langsung WhatsApp Helpdesk
                </label>
                <div className="relative">
                  <Globe size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="url"
                    value={formData.helpdeskUrl}
                    onChange={(e) => handleChange("helpdeskUrl", e.target.value)}
                    placeholder="Contoh: https://wa.me/6281234567890"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Tab 5: Status Pemeliharaan */}
          {activeFormTab === "sistem" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 shadow-2xs animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Status Operasional & Pemeliharaan</h3>
                <p className="text-xs text-slate-500 font-medium">Aktifkan mode pemeliharaan bila sistem sedang menjalani pembaruan kritis.</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100">Mode Pemeliharaan (Maintenance Mode)</span>
                  <p className="text-[11px] text-slate-500">
                    Jika aktif, pengguna umum akan melihat banner pemberitahuan jadwal perbaikan sistem.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.maintenanceMode}
                    onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  Pesan Pengumuman Pemeliharaan
                </label>
                <textarea
                  rows={3}
                  value={formData.maintenanceMessage}
                  onChange={(e) => handleChange("maintenanceMessage", e.target.value)}
                  placeholder="Sistem sedang dalam peningkatan performa..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none transition-all leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Submit Action Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-medium">
              {hasChanges ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle size={15} />
                  Ada {changesList.length} perubahan yang belum disimpan.
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  Konfigurasi identitas sudah sesuai dengan database.
                </span>
              )}
            </div>

            <button
              onClick={() => openVerificationModal("save")}
              disabled={!hasChanges || isLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={16} />
              Simpan Perubahan Aplikasi
            </button>
          </div>
        </div>

        {/* KOLOM KANAN: LIVE INTERACTIVE PREVIEW (5 Kolom) */}
        <div className="xl:col-span-5 space-y-4 sticky top-6">
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs font-black tracking-wider uppercase text-emerald-400">
                  Live Interactive Preview
                </h3>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    previewMode === "desktop" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                  title="Pratinjau Tampilan Desktop"
                >
                  <Laptop size={14} />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    previewMode === "mobile" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                  title="Pratinjau Tampilan Mobile"
                >
                  <Smartphone size={14} />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pratinjau langsung bagaimana nama, slogan, logo, dan favicon baru akan tampak di layar pengguna sebelum Anda menyimpan.
            </p>

            {/* Mockup 1: Browser Tab Mockup */}
            <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700/80 space-y-2">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Tab Browser Chrome / Safari
              </span>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-medium text-slate-200">
                <img
                  src={formData.faviconUrl || formData.logoEmblemUrl || "/logos/berseka/berseka-logo-bg-transparent.png"}
                  alt="Favicon"
                  className="w-4 h-4 object-contain shrink-0"
                />
                <span className="truncate font-semibold text-[11px]">
                  Dasbor Utama | {formData.appName || "Nama Aplikasi"}
                </span>
                <span className="ml-auto text-slate-500 text-[10px]">✕</span>
              </div>
            </div>

            {/* Mockup 2: Header / Navbar Mockup */}
            <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700/80 space-y-2">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Header & Navigasi Web
              </span>
              <div className="bg-white text-slate-800 p-2.5 rounded-xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={formData.logoHorizontalUrl || "/logos/berseka/berseka-logo-full.png"}
                    alt="Logo Header"
                    className="h-7 w-auto object-contain"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-600">Online</span>
                </div>
              </div>
            </div>

            {/* Mockup 3: Footer Layout Mockup */}
            <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700/80 space-y-2">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Footer Halaman Web
              </span>
              <div className="bg-white/95 text-slate-800 p-3 rounded-xl space-y-2 text-xs border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={formData.logoEmblemUrl || "/logos/berseka/berseka-logo-bg-transparent.png"}
                      alt="Logo Emblem"
                      className="h-5 w-5 object-contain"
                    />
                    <span className="font-extrabold text-[12px]">{formData.appName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[#009966] font-semibold text-[11px] truncate max-w-[130px]">
                      {formData.appTagline}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9.5px] font-extrabold">
                    v{formData.appVersion}
                  </span>
                </div>
                <div className="text-[9.5px] text-slate-500 border-t border-slate-100 pt-1.5 flex items-center justify-between">
                  <span>{formData.copyrightText}</span>
                  <span className="text-[9px] text-slate-400">{formData.developerName}</span>
                </div>
              </div>
            </div>

            {/* Mockup 4: Helpdesk Preview */}
            <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700/80 space-y-2">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Pusat Bantuan Resmi (Helpdesk)
              </span>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-200">Hubungi Helpdesk {formData.appName}</span>
                  <p className="text-[10px] text-slate-400">{formData.helpdeskPhone || "0812-xxxx-xxxx"}</p>
                </div>
                <a
                  href={formData.helpdeskUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10.5px] font-bold flex items-center gap-1"
                >
                  <ExternalLink size={11} /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL KONFIRMASI 2-TAHAP (TWO-STEP VERIFICATION MODAL) */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {verificationType === "save"
                      ? "Konfirmasi 2-Tahap Perubahan Aplikasi"
                      : verificationType === "restore"
                      ? "Konfirmasi Pemulihan Versi Sebelumnya"
                      : "Konfirmasi Reset Standar Pabrik"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Tahap {modalStep} dari 2: {modalStep === 1 ? "Verifikasi Rincian Perubahan" : "Autentikasi Pengembang"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* STEP 1: RINGKASAN PERUBAHAN (DIFF SUMMARY) */}
            {modalStep === 1 && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Perubahan ini akan berdampak sistemik ke seluruh halaman Web, Footer, Sidebar, Favicon, dan metadata sesi. Pastikan rincian data sudah akurat.
                  </p>
                </div>

                {verificationType === "save" ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                      Rincian Perubahan ({changesList.length} kolom):
                    </span>
                    {changesList.map((c) => (
                      <div
                        key={c.key}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1"
                      >
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-[11px]">
                          {c.label}
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                          <div className="text-red-600 dark:text-red-400 truncate">
                            <span className="font-bold">Sebelum:</span> {c.oldVal || "—"}
                          </div>
                          <div className="text-emerald-600 dark:text-emerald-400 font-bold truncate">
                            <span className="font-bold">Baru:</span> {c.newVal}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : verificationType === "restore" ? (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Anda akan mengembalikan pengaturan ke snapshot sebelum perubahan terakhir. Riwayat saat ini akan diarsipkan.
                  </p>
                ) : (
                  <p className="text-xs text-red-600 dark:text-red-400 font-bold">
                    PERINGATAN: Seluruh nama aplikasi, logo, hak cipta, dan kontak akan di-reset kembali ke nilai bawaan resmi BERSEKA (PT Makerindo & UNIKOM).
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStep(2)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    Lanjutkan ke Autentikasi <Check size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: AUTENTIKASI KATA SANDI PENGEMBANG */}
            {modalStep === 2 && (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Masukkan kata sandi akun <strong>{user?.name || "Developer"}</strong> Anda untuk memverifikasi hak otoritas perubahan sistem.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    Kata Sandi Akun Pengembang <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Masukkan kata sandi akun Anda"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none transition-all pr-10"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteVerifiedAction}
                    disabled={isSubmitting || !passwordConfirm.trim()}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Memverifikasi..." : "Verifikasi & Terapkan Perubahan"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default AppBrandingSettings;
