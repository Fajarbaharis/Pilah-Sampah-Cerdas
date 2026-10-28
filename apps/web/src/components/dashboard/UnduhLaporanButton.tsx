/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Reusable Component: UnduhLaporanButton
 * Tombol Unduh Laporan Eksekutif dengan Dukungan Utama Format PDF (Naskah Dinas Standar F4)
 * & Rekapitulasi Spreadsheet Excel (.xlsx) untuk Tab KKN dan Tata Kelola Sampah
 * Acuan: LAPORAN EKSEKUTIF PELAKSANAAN KULIAH KERJA NYATA (KKN) & TATA KELOLA LINGKUNGAN (7 Bagian Utama)
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Download,
  ChevronDown,
  Printer,
  Table,
  ExternalLink,
  Sparkles,
  Loader2,
  FileCheck2,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { downloadLaporanEksekutifPdf } from "../../utils/downloadLaporanEksekutifPdf";

export interface UnduhLaporanFilters {
  // Filter KKN
  periode?: string;
  kelurahan?: string;
  rw?: string;
  kelompok?: string;

  // Filter Tata Kelola Sampah
  wilayah?: string;
  startDate?: string;
  endDate?: string;
  sourceType?: string;
  timeFilter?: string;
}

export interface UnduhLaporanButtonProps {
  reportType: "kkn" | "waste";
  filters?: UnduhLaporanFilters;
  variant?: "pill" | "rounded";
  className?: string;
}

export const UnduhLaporanButton: React.FC<UnduhLaporanButtonProps> = ({
  reportType,
  filters,
  variant = "rounded",
  className = "",
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  /**
   * Action 1: Unduh Laporan Eksekutif PDF (Acuan Baku 7 Bab KKN & Tata Kelola Lingkungan)
   * Menghasilkan dokumen cetak resmi instan sesuai acuan baku pimpinan UNIKOM & BERSEKA
   */
  const handleDownloadPdf = () => {
    setIsOpen(false);
    showToast.success("Membuka Laporan Eksekutif Resmi PDF...");

    downloadLaporanEksekutifPdf({
      periode: filters?.periode ? filters.periode : "KKN 2026",
      cakupanWilayah:
        filters?.kelurahan && filters.kelurahan !== "Semua Kelurahan" && filters.kelurahan !== "ALL"
          ? `Kelurahan ${filters.kelurahan}, Kecamatan Coblong`
          : filters?.wilayah && filters.wilayah !== "Semua Wilayah" && filters.wilayah !== "ALL"
          ? `Kelurahan ${filters.wilayah.replace(/^Kel\.\s*/i, "")}, Kecamatan Coblong`
          : "Kecamatan Coblong (6 Kelurahan Binaan, 86 RW)",
    });
  };

  /**
   * Action 2: Unduh Laporan Naskah Dinas F4 Spesifik Halaman (via Tab Baru)
   */
  const handleDownloadSpecificPdf = () => {
    setIsOpen(false);
    showToast.success("Menyiapkan naskah dinas F4 spesifik...");

    const params = new URLSearchParams();
    params.set("view", "document");
    params.set("action", "print");

    if (reportType === "kkn") {
      if (filters?.periode && filters.periode !== "ALL") {
        params.set("periode", filters.periode);
      }
      if (filters?.kelurahan && filters.kelurahan !== "Semua Kelurahan" && filters.kelurahan !== "ALL") {
        params.set("kelurahan", filters.kelurahan);
      }
      if (filters?.rw && filters.rw !== "Semua RW" && filters.rw.trim() !== "") {
        params.set("rw", filters.rw.trim());
      }
      if (filters?.kelompok && filters.kelompok !== "Semua Kelompok" && filters.kelompok.trim() !== "") {
        params.set("kelompok", filters.kelompok.trim());
      }

      const targetUrl = `/laporan/kkn?${params.toString()}`;
      const win = window.open(targetUrl, "_blank");
      if (!win) {
        navigate(targetUrl);
      }
    } else {
      if (filters?.wilayah && filters.wilayah !== "Semua Wilayah" && filters.wilayah !== "ALL") {
        params.set("wilayah", filters.wilayah);
      }
      if (filters?.rw && filters.rw !== "Semua RW" && filters.rw.trim() !== "") {
        params.set("rw", filters.rw.trim());
      }
      if (filters?.startDate) {
        params.set("startDate", filters.startDate);
      }
      if (filters?.endDate) {
        params.set("endDate", filters.endDate);
      }
      if (filters?.sourceType && filters.sourceType !== "ALL") {
        params.set("sourceType", filters.sourceType);
      }
      if (filters?.periode || filters?.timeFilter) {
        params.set("periode", filters.periode || filters.timeFilter || "semua");
      }

      const targetUrl = `/laporan/tata-kelola-sampah?${params.toString()}`;
      const win = window.open(targetUrl, "_blank");
      if (!win) {
        navigate(targetUrl);
      }
    }
  };

  /**
   * Action 3: Unduh Rekapitulasi Spreadsheet Excel (.xlsx)
   */
  const handleDownloadExcel = async () => {
    setIsOpen(false);
    try {
      setIsDownloadingExcel(true);
      const params: Record<string, string> = {};

      if (reportType === "kkn") {
        if (filters?.periode) params.periode = filters.periode;
        if (filters?.kelurahan && filters.kelurahan !== "Semua Kelurahan") params.kelurahan = filters.kelurahan;
        if (filters?.rw && filters.rw !== "Semua RW") params.rw = filters.rw;
        if (filters?.kelompok && filters.kelompok !== "Semua Kelompok") params.kelompok = filters.kelompok;

        const res = await api.get("/dashboard/kkn-executive/export", {
          params,
          responseType: "blob",
        });

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `Laporan_Eksekutif_KKN_${(filters?.periode || "Semua").replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}.xlsx`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        showToast.success("Laporan Eksekutif KKN (Excel) berhasil diunduh!");
      } else {
        if (filters?.wilayah && filters.wilayah !== "Semua Wilayah" && filters.wilayah !== "ALL") {
          params.wilayah = filters.wilayah;
        }
        if (filters?.rw && filters.rw !== "Semua RW") params.rw = filters.rw;
        if (filters?.periode || filters?.timeFilter) params.periode = filters.periode || filters.timeFilter || "semua";
        if (filters?.startDate) params.startDate = filters.startDate;
        if (filters?.endDate) params.endDate = filters.endDate;
        if (filters?.sourceType) params.sourceType = filters.sourceType;

        const res = await api.get("/dashboard/waste-executive-report/export", {
          params,
          responseType: "blob",
        });

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `Laporan_Resmi_Tata_Kelola_Sampah_${Date.now()}.xlsx`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        showToast.success("Laporan Resmi Tata Kelola Sampah (Excel) berhasil diunduh!");
      }
    } catch (err: any) {
      console.error("[UnduhLaporanButton] export error:", err);
      showToast.error("Gagal mengunduh file spreadsheet laporan");
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  /**
   * Action 4: Buka Halaman Dokumen Laporan Interaktif
   */
  const handleOpenInteractive = () => {
    setIsOpen(false);
    const params = new URLSearchParams();
    params.set("view", "document");

    if (reportType === "kkn") {
      if (filters?.periode && filters.periode !== "ALL") params.set("periode", filters.periode);
      if (filters?.kelurahan && filters.kelurahan !== "Semua Kelurahan" && filters.kelurahan !== "ALL") {
        params.set("kelurahan", filters.kelurahan);
      }
      navigate(`/laporan/kkn?${params.toString()}`);
    } else {
      if (filters?.wilayah && filters.wilayah !== "Semua Wilayah" && filters.wilayah !== "ALL") {
        params.set("wilayah", filters.wilayah);
      }
      navigate(`/laporan/tata-kelola-sampah?${params.toString()}`);
    }
  };

  const roundedClasses = variant === "pill" ? "rounded-full" : "rounded-xl";
  const leftRoundedClasses = variant === "pill" ? "rounded-l-full" : "rounded-l-xl";
  const rightRoundedClasses = variant === "pill" ? "rounded-r-full" : "rounded-r-xl";

  const reportTitle =
    reportType === "kkn" ? "Kuliah Kerja Nyata (KKN)" : "Tata Kelola Sampah";

  return (
    <div ref={dropdownRef} className={`relative inline-flex items-center ${className}`}>
      {/* Split Button Container */}
      <div
        className={`inline-flex items-center ${roundedClasses} border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs hover:border-[#009966]/60 dark:hover:border-emerald-500/60 transition-all select-none`}
      >
        {/* Tombol Utama: Unduh Laporan PDF (Aksi Cepat 1-Klik) */}
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloadingExcel}
          className={`inline-flex items-center gap-2 pl-3.5 pr-2.5 h-10 ${leftRoundedClasses} text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#009966] dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50`}
          title={`Unduh Laporan Eksekutif ${reportTitle} dalam Format PDF (Acuan Resmi 7 Bagian)`}
        >
          <FileText size={15} className="text-[#009966] dark:text-emerald-400 shrink-0" />
          <span>Unduh Laporan</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#e5f7ed] dark:bg-emerald-950/80 text-[#009966] dark:text-emerald-400 border border-[#009966]/20 dark:border-emerald-700/40">
            PDF
          </span>
        </button>

        {/* Pemisah Vertikal Halus */}
        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />

        {/* Tombol Panah Dropdown (Pilihan Format Laporan) */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className={`px-2.5 h-10 ${rightRoundedClasses} text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
          title="Pilihan format unduhan laporan (PDF Acuan Eksekutif, Naskah Dinas F4, Excel, atau Buka Dokumen)"
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Menu Pilihan Dropdown Eksekutif */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-84 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Menu */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
                PILIHAN FORMAT LAPORAN
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                <Sparkles size={10} />
                <span>Eksekutif</span>
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate mt-0.5">
              Laporan Eksekutif KKN &amp; Tata Kelola Lingkungan
            </p>
          </div>

          {/* Opsi 1: Laporan Eksekutif Lengkap PDF (Acuan 7 Bab Resmi Pimpinan) */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-start gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-800/50 group-hover:scale-105 transition-transform mt-0.5">
              <Printer size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-[#009966] dark:group-hover:text-emerald-400 transition-colors">
                  Laporan Eksekutif KKN &amp; Lingkungan (PDF)
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  Acuan Resmi
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Format lengkap 7 Bagian Utama (Demografi, Presensi, Proker, Peringatan Dini, Neraca Sampah &amp; Rekomendasi).
              </p>
            </div>
          </button>

          {/* Opsi 2: Dokumen Naskah Dinas F4 Spesifik */}
          <button
            type="button"
            onClick={handleDownloadSpecificPdf}
            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-start gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50 group-hover:scale-105 transition-transform mt-0.5">
              <FileCheck2 size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Naskah Dinas F4 {reportTitle}
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                  F4 Folio
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Dokumen kedinasan pas 1 lembar F4 dengan Nomor Surat &amp; SK Rektor UNIKOM.
              </p>
            </div>
          </button>

          {/* Opsi 3: Rekapitulasi Data Excel (.xlsx) */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={isDownloadingExcel}
            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-start gap-3 cursor-pointer group disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200/50 dark:border-sky-800/50 group-hover:scale-105 transition-transform mt-0.5">
              {isDownloadingExcel ? (
                <Loader2 size={16} className="animate-spin text-sky-600" />
              ) : (
                <Table size={16} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Rekapitulasi Data (Excel .xlsx)
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                  Tabel
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Unduh dataset angka terpilah dan capaian per kelurahan dalam format spreadsheet.
              </p>
            </div>
          </button>

          {/* Opsi 4: Buka Halaman Dokumen Interaktif */}
          <button
            type="button"
            onClick={handleOpenInteractive}
            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-start gap-3 cursor-pointer group border-t border-slate-100 dark:border-slate-800 mt-1"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform mt-0.5">
              <ExternalLink size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#009966] dark:group-hover:text-emerald-400 transition-colors">
                Buka Lembar Dokumen Penuh
              </span>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Lihat naskah dinas interaktif dan sesuaikan kop surat, nomor surat, serta nama penandatangan.
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default UnduhLaporanButton;
