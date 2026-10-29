/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Reusable Component: UnduhLaporanButton
 * Tombol Unduh Laporan Eksekutif Format PDF & Spreadsheet Excel (.xlsx)
 * Menghasilkan Dokumen Naskah Dinas Sah KKN & Tata Kelola Lingkungan Berstandar Industri
 * Sesuai Acuan Baku Pimpinan UNIKOM x BERSEKA.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  ChevronDown,
  Printer,
  Sparkles,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { downloadLaporanEksekutifPdf } from "../../utils/downloadLaporanEksekutifPdf";
import { fetchExecutiveReportData } from "../../utils/executiveReportDataFetcher";

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
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isPreparing, setIsPreparing] = useState<boolean>(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState<boolean>(false);
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
   * 100% Dinamis dari Database Riil via fetchExecutiveReportData
   */
  const handleDownloadPdf = async () => {
    if (isPreparing) return;
    setIsOpen(false);

    // 1. Buka jendela dokumen secara sinkronis pada gesture klik pertama pengguna.
    // Hal ini mutlak agar browser TIDAK memblokir jendela popup karena delay request async backend.
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Menyiapkan Laporan Eksekutif - BERSEKA</title>
          <style>
            body {
              margin: 0;
              height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background-color: #0f172a;
              color: #f8fafc;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .spinner {
              width: 42px;
              height: 42px;
              border: 3.5px solid rgba(255,255,255,0.15);
              border-top-color: #10b981;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin-bottom: 16px;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            h2 { font-size: 14pt; font-weight: 700; margin: 0 0 6px 0; color: #ffffff; }
            p { font-size: 9pt; color: #94a3b8; margin: 0; }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h2>Menyiapkan Laporan Eksekutif</h2>
          <p>Mengompilasi data real-time KKN &amp; Tata Kelola Sampah Coblong...</p>
        </body>
        </html>
      `);
      printWindow.document.close();
    }

    setIsPreparing(true);
    showToast.info("Menyiapkan Laporan Eksekutif...");

    try {
      const data = await fetchExecutiveReportData(filters);
      downloadLaporanEksekutifPdf(data, printWindow);
      showToast.success("Laporan Eksekutif siap dipratinjau!");
    } catch (error) {
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }
      console.error("[UnduhLaporanButton] Gagal menyiapkan dokumen PDF:", error);
      showToast.error("Gagal menyiapkan laporan. Silakan coba lagi.");
    } finally {
      setIsPreparing(false);
    }
  };

  /**
   * Action 2: Unduh Spreadsheet Rekapitulasi Data Excel (.xlsx)
   * Menyediakan berkas tabular lengkap untuk pengolahan angka dan statistik eksekutif
   */
  const handleDownloadXlsx = async () => {
    if (isExportingXlsx || isPreparing) return;
    setIsOpen(false);
    setIsExportingXlsx(true);
    showToast.info("Menyiapkan berkas spreadsheet Excel (.xlsx)...");

    try {
      let endpoint = "/dashboard/kkn-executive/export";
      const params: Record<string, any> = {};

      if (reportType === "kkn") {
        endpoint = "/dashboard/kkn-executive/export";
        if (filters?.periode) params.periode = filters.periode;
        if (filters?.kelurahan && filters.kelurahan !== "Semua Kelurahan") params.kelurahan = filters.kelurahan;
        if (filters?.rw && filters.rw !== "Semua RW") params.rw = filters.rw;
        if (filters?.kelompok && filters.kelompok !== "Semua Kelompok") params.kelompok = filters.kelompok;
      } else {
        endpoint = "/dashboard/waste-executive-report/export";
        if (filters?.wilayah && filters.wilayah !== "Semua Wilayah") params.wilayah = filters.wilayah;
        if (filters?.rw && filters.rw !== "Semua RW") params.rw = filters.rw;
        if (filters?.periode) params.periode = filters.periode;
        if (filters?.startDate) params.startDate = filters.startDate;
        if (filters?.endDate) params.endDate = filters.endDate;
        if (filters?.sourceType) params.sourceType = filters.sourceType;
      }

      const response = await api.get(endpoint, {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().split("T")[0];
      const filenamePrefix =
        reportType === "kkn"
          ? "Laporan_Eksekutif_KKN"
          : "Laporan_Eksekutif_Tata_Kelola_Sampah";
      link.setAttribute("download", `${filenamePrefix}_${timestamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast.success("Spreadsheet Excel (.xlsx) berhasil diunduh!");
    } catch (error) {
      console.error("[UnduhLaporanButton] Gagal mengunduh spreadsheet Excel:", error);
      showToast.error("Gagal mengunduh berkas spreadsheet. Silakan coba lagi.");
    } finally {
      setIsExportingXlsx(false);
    }
  };

  const isBusy = isPreparing || isExportingXlsx;
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
        {/* Tombol Utama: Unduh Laporan (Aksi Cepat 1-Klik) */}
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isBusy}
          className={`inline-flex items-center gap-2 pl-3.5 pr-3 h-10 ${leftRoundedClasses} text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#009966] dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait`}
          title={`Unduh Laporan Eksekutif ${reportTitle}`}
        >
          {isBusy ? (
            <Loader2 size={15} className="text-[#009966] dark:text-emerald-400 animate-spin shrink-0" />
          ) : (
            <FileText size={15} className="text-[#009966] dark:text-emerald-400 shrink-0" />
          )}
          <span>
            {isPreparing
              ? "Menyiapkan..."
              : isExportingXlsx
              ? "Mengunduh Excel..."
              : "Unduh Laporan"}
          </span>
        </button>

        {/* Pemisah Vertikal Halus */}
        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />

        {/* Tombol Panah Dropdown (Pilihan Format Laporan) */}
        <button
          type="button"
          onClick={() => !isBusy && setIsOpen(!isOpen)}
          disabled={isBusy}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className={`px-2.5 h-10 ${rightRoundedClasses} text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-60`}
          title="Pilihan format unduhan laporan (PDF & Spreadsheet Excel)"
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
            disabled={isBusy}
            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-start gap-3 cursor-pointer group disabled:opacity-60"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-800/50 group-hover:scale-105 transition-transform mt-0.5">
              <Printer size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-[#009966] dark:group-hover:text-emerald-400 transition-colors">
                  Laporan Eksekutif (PDF)
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  Acuan Resmi
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Format naskah dinas cetak resmi standar pimpinan (7 Bagian Utama lengkap).
              </p>
            </div>
          </button>

          {/* Opsi 2: Rekapitulasi Data Tabular Excel (.xlsx) */}
          <button
            type="button"
            onClick={handleDownloadXlsx}
            disabled={isBusy}
            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-start gap-3 cursor-pointer group disabled:opacity-60 mt-1"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-800/50 group-hover:scale-105 transition-transform mt-0.5">
              <FileSpreadsheet size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Rekapitulasi Data (XLSX)
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                  Excel
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Format spreadsheet tabular (.xlsx) untuk pengolahan angka, statistik, dan arsip data.
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default UnduhLaporanButton;
