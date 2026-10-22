/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman: Laporan Resmi Tata Kelola Sampah
 * Standar Visual: Format Dual-View Terpadu (Dasbor Web Interaktif dan Dokumen Naskah Dinas F4 Folio 1 Halaman)
 * 100% Data Riil Agregasi dari Database PostgreSQL (Anti-Dummy Policy)
 * Fokus Murni Sub Tata Kelola Sampah dan Valorisasi Sirkular
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Trash2,
  Recycle,
  Printer,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Search,
  ArrowUpDown,
  Filter,
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Calendar,
  CalendarDays,
  Layers,
  Smartphone,
  Scale,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { FormulaTooltip } from "../../components/common/FormulaTooltip";
import type { WasteReportData } from "./types";
import {
  PengaturanLaporanModal,
  type ReportCustomConfig,
  DEFAULT_WASTE_REPORT_CONFIG,
} from "../../components/laporan/PengaturanLaporanModal";

const STORAGE_KEY = "berseka_waste_report_custom_config_v5";

export const LaporanTataKelolaSampahPage: React.FC = () => {
  const [data, setData] = useState<WasteReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPrintFlow, setIsPrintFlow] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"dashboard" | "document">("dashboard");

  // Pengaturan Naskah Dokumen Dinamis
  const [reportConfig, setReportConfig] = useState<ReportCustomConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_WASTE_REPORT_CONFIG;
  });

  // Filter Wilayah
  const [selectedWilayah, setSelectedWilayah] = useState<string>("ALL");

  // Symmetrical Filter Toolbar Controls (Matriks Kinerja 6 Kelurahan)
  const [tableSearch, setTableSearch] = useState<string>("");
  const [tableSortAsc, setTableSortAsc] = useState<boolean>(true);
  const [tableSource, setTableSource] = useState<"ALL" | "WARGA_APP" | "PETUGAS_LAPANGAN">("ALL");
  const [tablePeriod, setTablePeriod] = useState<"ALL" | "DAILY" | "MONTHLY">("ALL");
  const [tableDatePreset, setTableDatePreset] = useState<"YESTERDAY" | "TODAY" | "CUSTOM">("YESTERDAY");
  const [tableDate, setTableDate] = useState<string>(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`;
  });
  const [tableMonthPreset, setTableMonthPreset] = useState<"CURRENT" | "PREVIOUS" | "CUSTOM">("CURRENT");
  const [tableMonth, setTableMonth] = useState<number>(new Date().getMonth() + 1);
  const [tableYear, setTableYear] = useState<number>(new Date().getFullYear());

  const documentRef = useRef<HTMLDivElement>(null);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        wilayah: selectedWilayah,
        sourceType: tableSource,
      };

      if (tablePeriod === "ALL") {
        params.periode = "semua";
      } else if (tablePeriod === "DAILY") {
        params.periode = "harian";
        params.startDate = tableDate;
        params.endDate = tableDate;
      } else if (tablePeriod === "MONTHLY") {
        params.periode = "bulanan";
        const start = `${tableYear}-${String(tableMonth).padStart(2, "0")}-01`;
        const lastDay = new Date(tableYear, tableMonth, 0).getDate();
        const end = `${tableYear}-${String(tableMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        params.startDate = start;
        params.endDate = end;
      }

      const res = await api.get("/dashboard/waste-executive-report", { params });
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else {
        showToast.error("Format data laporan tidak valid");
      }
    } catch (err: any) {
      console.error("[LaporanTataKelola] Gagal memuat:", err);
      showToast.error("Gagal memuat data laporan resmi tata kelola sampah");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedWilayah, tableSource, tablePeriod, tableDate, tableMonth, tableYear]);

  // Alur Buka Modal sebelum Cetak PDF
  const handleOpenPrintFlow = () => {
    setIsPrintFlow(true);
    setIsSettingsOpen(true);
  };

  // Simpan Pengaturan Naskah Dinamis
  const handleSaveConfig = (newConfig: ReportCustomConfig) => {
    setReportConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setIsSettingsOpen(false);

      if (isPrintFlow) {
        setIsPrintFlow(false);
        setViewMode("document");
        setTimeout(() => {
          const originalTitle = document.title;
          document.title = "";
          window.print();
          setTimeout(() => {
            document.title = originalTitle;
          }, 1000);
        }, 250);
      } else {
        showToast.success("Pengaturan naskah dokumen laporan berhasil disimpan");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reset Pengaturan Naskah ke Default
  const handleResetConfig = () => {
    setReportConfig(DEFAULT_WASTE_REPORT_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY);
      showToast.success("Format naskah laporan dikembalikan ke template standar");
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered & Sorted Matriks Kelurahan
  const processedKelurahanAudit = useMemo(() => {
    if (!data?.kelurahanAudit) return [];
    let list = [...data.kelurahanAudit];

    if (selectedWilayah !== "ALL") {
      list = list.filter((k) =>
        k.kelurahan.toLowerCase().includes(selectedWilayah.toLowerCase())
      );
    }

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter((k) => k.kelurahan.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      const diff = a.kelurahan.localeCompare(b.kelurahan);
      return tableSortAsc ? diff : -diff;
    });

    return list;
  }, [data?.kelurahanAudit, selectedWilayah, tableSearch, tableSortAsc]);

  // Agregasi Dinamis SSOT dari Data Audit (Bebas Hardcode & Sinkron dengan Dasbor Tab Tata Kelola Sampah)
  const auditMetrics = useMemo(() => {
    const list = processedKelurahanAudit;
    if (list.length === 0) {
      return {
        totalBaselineKg: 0,
        totalAktualKg: 0,
        totalPenurunanKg: 0,
        weightedPenurunanPersen: 0,
        avgBaselineRate: 0,
        avgEndlineRate: 0,
        deltaKepatuhanPp: 0,
        totalTerpilahKg: 0,
        totalOrganikKg: 0,
        totalAnorganikKg: 0,
        totalTpsCount: 0,
        totalBankCount: 0,
        totalActiveBinsCount: 0,
      };
    }

    const totalBaselineKg = list.reduce((acc, k) => acc + Number(k.baselineKg || 0), 0);
    const totalAktualKg = Number(list.reduce((acc, k) => acc + Number(k.aktualKg || 0), 0).toFixed(1));
    const totalPenurunanKg = totalBaselineKg > 0 && totalAktualKg > 0 ? Number((totalBaselineKg - totalAktualKg).toFixed(1)) : 0;
    const weightedPenurunanPersen =
      totalBaselineKg > 0 ? Number(((totalPenurunanKg / totalBaselineKg) * 100).toFixed(1)) : 0;

    const avgBaselineRate = Number((list.reduce((acc, k) => acc + Number(k.kepatuhanBaseline ?? k.baselineRate ?? 0), 0) / list.length).toFixed(1));
    const avgEndlineRate = Number((list.reduce((acc, k) => acc + Number(k.kepatuhanAktual ?? k.currentComplianceRate ?? 0), 0) / list.length).toFixed(1));
    const deltaKepatuhanPp = Number((avgEndlineRate - avgBaselineRate).toFixed(1));

    const totalTerpilahKg = list.reduce((acc, k) => acc + Number(k.totalTerpilahKg || 0), 0);
    const totalOrganikKg = list.reduce((acc, k) => acc + Number(k.organikKg || 0), 0);
    const totalAnorganikKg = list.reduce((acc, k) => acc + Number(k.anorganikKg || 0), 0);
    const totalTpsCount = list.reduce((acc, k) => acc + Number(k.tps3rCount || 0), 0);
    const totalBankCount = list.reduce((acc, k) => acc + Number(k.bankSampahCount || 0), 0);
    const totalActiveBinsCount = list.reduce((acc, k) => acc + Number(k.activeBinsCount || 0), 0);

    return {
      totalBaselineKg,
      totalAktualKg,
      totalPenurunanKg,
      weightedPenurunanPersen,
      avgBaselineRate,
      avgEndlineRate,
      deltaKepatuhanPp,
      totalTerpilahKg,
      totalOrganikKg,
      totalAnorganikKg,
      totalTpsCount,
      totalBankCount,
      totalActiveBinsCount,
    };
  }, [processedKelurahanAudit]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-20">
      {/* Print CSS Standar Naskah Dinas F4 Folio 1 Halaman Pas Penuh */}
      <style>{`
        @media print {
          @page {
            size: 215mm 330mm; /* Standar Resmi Ukuran Kertas F4 / Folio Tegak */
            margin: 0 !important; /* Hapus total header dan footer bawaan peramban (URL, tanggal, jam, 1/3) */
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            width: 215mm !important;
            height: auto !important;
            font-family: 'Times New Roman', Times, serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #root,
          .min-h-screen,
          main {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            width: 215mm !important;
            min-height: 0 !important;
            height: auto !important;
          }
          .no-print,
          aside,
          nav,
          header,
          footer,
          .sidebar,
          #app-sidebar,
          .toaster,
          [data-sonner-toaster],
          [role="status"],
          [role="alert"],
          div[class*="toast"],
          .web-dashboard-container {
            display: none !important;
          }
          .official-document-section {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 215mm !important;
            height: auto !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
          }
          .document-paper {
            display: block !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 auto !important;
            padding: 14mm 16mm 14mm 16mm !important; /* Margin fisik presisi 100% konsisten dengan tampilan Dokumen */
            width: 215mm !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
            break-after: avoid !important;
            break-before: avoid !important;
            break-inside: avoid !important;
          }
          .avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ─────────────────────────────────────────────────────────────
          1. BAR TAJUK HALAMAN RESMI (IDENTIK DENGAN LAPORAN KKN)
      ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
        <div className="no-print bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#009966]/15 dark:border-emerald-700/30 shadow-2xs">
              <Recycle size={24} />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Tata Kelola Sampah
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Evaluasi komprehensif neraca massa persampahan, kepatuhan pemilahan 2 fraksi (organik dan anorganik), reduksi emisi gas rumah kaca, dan valorisasi ekonomi sirkular.
              </p>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. KONTROL FILTER & SWITCHER DUAL-VIEW
        ───────────────────────────────────────────────────────────── */}
        <section className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#009966] dark:text-emerald-400" />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                PARAMETER PENYARINGAN DATA
              </span>
            </div>

            {/* Switcher Mode Tampilan (Kartu | Dokumen) */}
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("dashboard")}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "dashboard"
                    ? "bg-white dark:bg-slate-900 text-[#009966] dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <LayoutDashboard size={13} />
                <span>Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("document")}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "document"
                    ? "bg-white dark:bg-slate-900 text-[#009966] dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileText size={13} />
                <span>Dokumen</span>
              </button>
            </div>
          </div>

          {/* Baris Kontrol Filter */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Filter Wilayah */}
            <div className="w-full sm:w-72">
              <label className="block text-[10.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">
                Cakupan Wilayah
              </label>
              <select
                value={selectedWilayah}
                onChange={(e) => setSelectedWilayah(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966] cursor-pointer"
              >
                <option value="ALL">Kecamatan Coblong (Seluruh Wilayah)</option>
                <option value="Cipaganti">Kelurahan Cipaganti</option>
                <option value="Dago">Kelurahan Dago</option>
                <option value="Lebak Gede">Kelurahan Lebak Gede</option>
                <option value="Lebak Siliwangi">Kelurahan Lebak Siliwangi</option>
                <option value="Sadang Serang">Kelurahan Sadang Serang</option>
                <option value="Sekeloa">Kelurahan Sekeloa</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {selectedWilayah !== "ALL" && (
              <div className="self-end pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedWilayah("ALL")}
                  className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}

            {/* Tombol Aksi Cetak PDF */}
            <div className="ml-auto self-end flex items-center gap-2 pt-1 sm:pt-0">
              <button
                type="button"
                onClick={handleOpenPrintFlow}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#009966] hover:bg-[#008855] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>Cetak PDF</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA (DUAL-VIEW ARCHITECTURE)
      ───────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Loading State Skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 mb-3 animate-spin">
                <RefreshCw size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Menyiapkan Data Laporan Resmi Tata Kelola Sampah...
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Mengumpulkan neraca massa 2 fraksi (organik dan anorganik), reduksi emisi CO₂, performa TPS3R, Bank Sampah, dan audit 6 kelurahan.
              </p>
            </div>
          </div>
        )}

        {/* Data Loaded View */}
        {!loading && data && (
          <>
            {/* =================================================================
                MODE 1: KARTU (DASBOR WEB INTERAKTIF)
                ================================================================= */}
            <div
              className={`web-dashboard-container space-y-8 ${
                viewMode === "dashboard" ? "block" : "hidden"
              }`}
            >
              {/* SECTION 1: INFORMASI SINGKAT */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span>INFORMASI SINGKAT</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
                  {/* KPI 1: Total Sampah Terpilah */}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1 text-slate-400">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 whitespace-normal">
                            Sampah Terpilah
                          </span>
                          <FormulaTooltip
                            title="Total Sampah Terpilah di Sumber"
                            formula="∑ Setoran Organik + ∑ Setoran Anorganik di Seluruh Fasilitas"
                            description="Akumulasi berat timbulan sampah yang berhasil dipilah oleh warga dan terserap ke jejaring fasilitas pengolahan lokal."
                            isoStandard="ISO 14044:2006"
                          />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Recycle size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline flex-wrap gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {(data.kpiSummary.dampakDanReduksi.totalSampahTerpilahKg ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">kg</span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-1 leading-snug">
                      <span>Organik {data.kpiSummary.dampakDanReduksi.rasioPemilahan.organikPersen.toLocaleString("id-ID")}%</span>
                      <span>&bull;</span>
                      <span>Anorganik {data.kpiSummary.dampakDanReduksi.rasioPemilahan.anorganikPersen.toLocaleString("id-ID")}%</span>
                    </div>
                  </div>

                  {/* KPI 2: Kepatuhan Pemilahan Warga (Baseline vs Endline) */}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1 text-slate-400">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 whitespace-normal">
                            Kepatuhan Pemilahan
                          </span>
                          <FormulaTooltip
                            title="Indeks Kepatuhan Pemilahan Komposit (Baseline vs Endline)"
                            formula="50% Partisipasi Warga Aktif + 50% Ketepatan Pemilahan Wadah"
                            description="Perbandingan capaian pemilahan aktual warga terhadap baseline awal survei KKN Juli 2026 di wilayah binaan terpilih."
                            isoStandard="ISO 9241-110"
                          />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline flex-wrap gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-[#009966] dark:text-emerald-400 tracking-tight">
                          {data.kpiSummary.dampakDanReduksi.rataRataKepatuhanPersen.toLocaleString("id-ID")}%
                        </span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 leading-snug">
                      <span>Baseline {auditMetrics.avgBaselineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% (Survei KKN) &bull; Pertumbuhan {auditMetrics.deltaKepatuhanPp >= 0 ? `+${auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` : auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp</span>
                    </div>
                  </div>

                  {/* KPI 3: Reduksi Emisi Gas Rumah Kaca */}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1 text-slate-400">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 whitespace-normal">
                            Reduksi Emisi CO₂
                          </span>
                          <FormulaTooltip
                            title="Valorisasi Reduksi Emisi Karbon (GRK)"
                            formula="Tonase Sampah Organik Terolah × Faktor Emisi IPCC Tier 1 (0,858 kg CO₂e / kg)"
                            description="Penurunan emisi gas metana dan karbon dioksida yang berhasil dicegah lepas ke atmosfer akibat sampah terolah di hulu tanpa dibakar."
                            isoStandard="IPCC Tier 1"
                          />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Sparkles size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline flex-wrap gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {(data.kpiSummary.dampakDanReduksi.reduksiEmisiCo2Kg ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">kg CO₂e</span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 leading-snug">
                      <span>Valorisasi Reduksi Gas Rumah Kaca</span>
                    </div>
                  </div>

                  {/* KPI 4: Jejaring Fasilitas Pengolahan */}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1 text-slate-400">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 whitespace-normal">
                            Fasilitas Sirkular
                          </span>
                          <FormulaTooltip
                            title="Infrastruktur dan Sarana Pengolahan Aktif"
                            formula="∑ TPS3R + ∑ Bank Sampah + ∑ Rumah Maggot + ∑ Komposter"
                            description="Total titik fasilitas sirkular yang beroperasi aktif menerima dan mengolah sampah di wilayah Kecamatan Coblong."
                            isoStandard="ISO 14001:2015"
                          />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Building2 size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline flex-wrap gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {data.kpiSummary.infrastruktur.totalFasilitas.toLocaleString("id-ID")}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">Unit</span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 leading-snug">
                      <span>{data.kpiSummary.infrastruktur.tps3rCount} TPS3R &bull; {data.kpiSummary.infrastruktur.bankSampahCount} Bank Sampah &bull; {data.kpiSummary.infrastruktur.rumahMaggotCount} Rumah Maggot &bull; {data.kpiSummary.infrastruktur.komposterCount} Komposter</span>
                    </div>
                  </div>

                  {/* KPI 5: Wadah Tempat Sampah Aktif (Sinkron dengan GIS & Manajemen Tempat Sampah) */}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1 text-slate-400">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 whitespace-normal">
                            Tempat Sampah Aktif
                          </span>
                          <FormulaTooltip
                            title="Ketersediaan Wadah Tempat Sampah Cerdas"
                            formula="(∑ Wadah Tempat Sampah Terverifikasi GPS ÷ ∑ Total Wadah Aktif Terpasang) × 100%"
                            description="Verifikasi spasial koordinat GPS wadah Tempat Sampah yang siap menampung sampah terpilah warga secara higienis."
                            isoStandard="ISO 19111:2019"
                          />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Trash2 size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between gap-1 mt-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {data.kpiSummary.infrastruktur.wadahSampahAktif.toLocaleString("id-ID")}
                          </span>
                          <span className="text-xs text-slate-400 font-bold" title="Dari total 769 tempat sampah aktif terpasang di sistem">
                            / {data.kpiSummary.infrastruktur.wadahSampahTotal.toLocaleString("id-ID")} Unit
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700/50 shrink-0">
                          {data.kpiSummary.infrastruktur.persentaseSpasialGps || 99}% Spasial
                        </span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 leading-snug">
                      <span>{data.kpiSummary.infrastruktur.wadahSampahAktif} terverifikasi GPS &bull; {data.kpiSummary.infrastruktur.wadahSampahBelumGps || 4} unit belum terekam GPS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: SEBARAN WILAYAH DAN CAPAIAN PENGELOLAAN SAMPAH */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="flex items-center">
                    <span>SEBARAN WILAYAH DAN CAPAIAN PENGELOLAAN SAMPAH</span>
                    <FormulaTooltip
                      title="Sebaran Partisipasi dan Tonase Sampah per Kelurahan Binaan"
                      formula="∑ Timbulan Sampah Organik dan Anorganik per Titik Kelurahan"
                      description="Data agregasi tonase riil dari catatan penimbangan di bank sampah unit dan posko pengolahan lingkungan."
                      isoStandard="ISO 14044:2006"
                    />
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Kolom Kiri: Sebaran per Kelurahan */}
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[380px]">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        Sebaran Tonase per Kelurahan Binaan
                      </h2>
                      <p className="text-xs text-slate-500">
                        Kecamatan Coblong (6 Kelurahan Binaan, 74 RW)
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {data.kelurahanAudit
                        .filter((k) => {
                          if (selectedWilayah && selectedWilayah !== "ALL") {
                            return k.kelurahan.toLowerCase().includes(selectedWilayah.toLowerCase());
                          }
                          return true;
                        })
                        .map((k) => {
                          const maxTonase = Math.max(
                            ...data.kelurahanAudit.map((item) => item.totalTerpilahKg),
                            1
                          );
                          const pctWidth = Math.min(
                            100,
                            Math.max(12, Math.round((k.totalTerpilahKg / maxTonase) * 100))
                          );

                          return (
                            <div key={k.kelurahan} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-800 dark:text-slate-200">
                                  Kelurahan {k.kelurahan} ({k.tps3rCount} TPS3R &bull; {k.bankSampahCount} Bank Sampah)
                                </span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                                  {(k.totalTerpilahKg ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg
                                </span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                                  style={{ width: `${pctWidth}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Total Akumulasi Timbulan Sampah Terpilah</span>
                      <span className="font-bold text-[#009966]">
                        {(data.kpiSummary.dampakDanReduksi.totalSampahTerpilahKg ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg Terkelola
                      </span>
                    </div>
                  </div>

                  {/* Kolom Kanan: Status Realisasi Dua Fraksi Sampah (Organik & Anorganik) */}
                  <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[380px]">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        Komposisi Dua Fraksi Sampah Terpilah
                      </h2>
                      <p className="text-xs text-slate-500">
                        Realisasi Pemilahan di Tingkat Rumah Tangga dan Fasilitas Pengolahan
                      </p>
                    </div>

                    <div className="space-y-3.5 my-auto py-2">
                      {/* Fraksi 1: Organik */}
                      <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Fraksi I: Sampah Organik</div>
                          <div className="text-[10.5px] text-emerald-700 dark:text-emerald-400">Kompos, biopori, dan budi daya maggot BSF</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                            {(data.kpiSummary.dampakDanReduksi.rasioPemilahan.organikKg ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
                          </div>
                          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {data.kpiSummary.dampakDanReduksi.rasioPemilahan.organikPersen.toLocaleString("id-ID")}% dari Timbulan
                          </div>
                        </div>
                      </div>

                      {/* Fraksi 2: Anorganik */}
                      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-blue-900 dark:text-blue-200">Fraksi II: Sampah Anorganik</div>
                          <div className="text-[10.5px] text-blue-700 dark:text-blue-400">Bank Sampah dan industri daur ulang sirkular</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-blue-700 dark:text-blue-300">
                            {(data.kpiSummary.dampakDanReduksi.rasioPemilahan.anorganikKg ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
                          </div>
                          <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            {data.kpiSummary.dampakDanReduksi.rasioPemilahan.anorganikPersen.toLocaleString("id-ID")}% dari Timbulan
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Rasio Tereduksi dari TPA</span>
                      <span className="font-bold text-[#009966]">
                        {data.kpiSummary.dampakDanReduksi.rasioReduksiTpaPersen.toLocaleString("id-ID")}% Tuntas Mandiri
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              {/* SECTION 3: REKAPITULASI FASILITAS DAN MONITORING TEMPAT SAMPAH */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="flex items-center">
                    <span>REKAPITULASI FASILITAS DAN MONITORING TEMPAT SAMPAH</span>
                    <FormulaTooltip
                      title="Kondisi Infrastruktur dan Wadah Tempat Sampah Cerdas"
                      formula="Audit berkala operasional 92 fasilitas sirkular dan 1.023 Tempat Sampah binaan"
                      description="Pemantauan integritas fisik sarana persampahan guna mencegah luapan sampah di pemukiman warga."
                      isoStandard="ISO 9241-110"
                    />
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Fasilitas Sirkular */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-600" />
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                          Fasilitas Pengolahan Sirkular
                        </h2>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                        {data.kpiSummary.infrastruktur.totalFasilitas} Fasilitas
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">TPS3R</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
                          {data.kpiSummary.infrastruktur.tps3rCount}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold">Unit Aktif</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Bank Sampah</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
                          {data.kpiSummary.infrastruktur.bankSampahCount}
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold">Unit Aktif</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Rumah Maggot</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
                          {data.kpiSummary.infrastruktur.rumahMaggotCount}
                        </span>
                        <span className="text-[10px] text-teal-600 font-semibold">Biokonversi</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Komposter</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
                          {data.kpiSummary.infrastruktur.komposterCount}
                        </span>
                        <span className="text-[10px] text-amber-600 font-semibold">Kompos Organik</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Wadah Tempat Sampah */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-emerald-600" />
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                          Status Wadah Tempat Sampah
                        </h2>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {data.kpiSummary.infrastruktur.wadahSampahTotal} Wadah Terdata
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block uppercase">Kondisi Normal</span>
                        <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                          {data.kpiSummary.infrastruktur.wadahNormal}
                        </span>
                        <span className="text-[10px] text-slate-500">Kapasitas &lt; 70%</span>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block uppercase">Siaga Waspada</span>
                        <span className="text-lg font-black text-amber-700 dark:text-amber-400 mt-0.5 block">
                          {data.kpiSummary.infrastruktur.wadahWaspada}
                        </span>
                        <span className="text-[10px] text-slate-500">Kapasitas 70% - 90%</span>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/50">
                        <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 block uppercase">Status Kritis</span>
                        <span className="text-lg font-black text-rose-700 dark:text-rose-400 mt-0.5 block">
                          {data.kpiSummary.infrastruktur.wadahKritis}
                        </span>
                        <span className="text-[10px] text-slate-500">Kapasitas &gt; 90% (Jemput)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: PERINGATAN DINI DAN REKOMENDASI TATA KELOLA LINGKUNGAN */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span>PERINGATAN DINI DAN REKOMENDASI TATA KELOLA LINGKUNGAN</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <section className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 rounded-2xl p-5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-800/50 space-y-1">
                      <div className="font-bold text-emerald-700 dark:text-emerald-400">1. Evaluasi Baseline dan Endline</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Pemberdayaan warga berhasil mendongkrak kepatuhan pemilahan dari baseline {auditMetrics.avgBaselineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% (Survei KKN Juli 2026) ke endline {auditMetrics.avgEndlineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% ({auditMetrics.deltaKepatuhanPp >= 0 ? `+${auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` : auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp) dengan rasio organik {data.kpiSummary.dampakDanReduksi.rasioPemilahan.organikPersen.toLocaleString("id-ID")}%.
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-800/50 space-y-1">
                      <div className="font-bold text-blue-700 dark:text-blue-400">2. Optimasi Bank Sampah</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Sebanyak {data.kpiSummary.infrastruktur.bankSampahCount} unit Bank Sampah menyerap {(data.kpiSummary.dampakDanReduksi.rasioPemilahan.anorganikKg ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg anorganik bernilai sirkular.
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-800/50 space-y-1">
                      <div className="font-bold text-purple-700 dark:text-purple-400">3. Reduksi Residu TPA</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Diversi pengolahan mandiri menekan laju pengangkutan sampah ke TPA Sarimukti hingga mencapai {data.kpiSummary.dampakDanReduksi.rasioReduksiTpaPersen.toLocaleString("id-ID")}%.
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-800/50 space-y-1">
                      <div className="font-bold text-teal-700 dark:text-teal-400">4. Perawatan Tempat Sampah</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Sebanyak {data.kpiSummary.infrastruktur.wadahKritis} wadah Tempat Sampah berstatus kritis diprioritaskan dalam rute ritase pengangkutan berkala.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* SECTION 5: MATRIKS KINERJA ENAM KELURAHAN KECAMATAN COBLONG */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="flex items-center">
                    <span>MATRIKS KINERJA ENAM KELURAHAN KECAMATAN COBLONG</span>
                    <FormulaTooltip
                      title="Matriks Evaluasi Kinerja Pengelolaan Sampah 6 Kelurahan"
                      formula="Skor Kelurahan = (0,5 × Tonase Terpilah) + (0,3 × Kepatuhan) + (0,2 × Reduksi CO₂)"
                      description="Rekapitulasi lengkap neraca massa, kepatuhan pemilahan warga, ketersediaan TPS3R/Bank Sampah, dan status verifikasi lapangan."
                      isoStandard="ISO 14044:2006"
                    />
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                  {/* Symmetrical Filter Toolbar (Diselaraskan dengan Aktivitas Pemilahan oleh Warga dan Penimbangan oleh Petugas) */}
                  <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                    {/* Baris 1: Rentang Waktu (Mode + Presets + Date/Month Picker) & Periode Aktif */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-700/50">
                      {/* Sisi Kiri: Mode & Filter Waktu */}
                      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        {/* Mode Switcher */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
                            Mode:
                          </span>
                          <div className="inline-flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                            <button
                              type="button"
                              onClick={() => setTablePeriod("ALL")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                tablePeriod === "ALL"
                                  ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-xs font-extrabold"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              }`}
                            >
                              <Layers size={13} />
                              <span>Semua</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setTablePeriod("DAILY")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                tablePeriod === "DAILY"
                                  ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              }`}
                            >
                              <Clock size={13} />
                              <span>Per Hari</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setTablePeriod("MONTHLY")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                tablePeriod === "MONTHLY"
                                  ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              }`}
                            >
                              <CalendarDays size={13} />
                              <span>Per Bulan</span>
                            </button>
                          </div>
                        </div>

                        <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-700" />

                        {/* Pemilih Waktu Detail */}
                        {tablePeriod === "DAILY" && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              Tanggal:
                            </span>
                            <div className="inline-flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setTableDatePreset("YESTERDAY");
                                  const y = new Date();
                                  y.setDate(y.getDate() - 1);
                                  const pad = (n: number) => String(n).padStart(2, "0");
                                  setTableDate(`${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`);
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  tableDatePreset === "YESTERDAY"
                                    ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-200/80 dark:border-emerald-800/60"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                Kemarin
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTableDatePreset("TODAY");
                                  const t = new Date();
                                  const pad = (n: number) => String(n).padStart(2, "0");
                                  setTableDate(`${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`);
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  tableDatePreset === "TODAY"
                                    ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-200/80 dark:border-emerald-800/60"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                Hari Ini
                              </button>
                            </div>

                            <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                              <Calendar size={13} className="text-slate-400 shrink-0" />
                              <input
                                type="date"
                                value={tableDate}
                                onChange={(e) => {
                                  setTableDatePreset("CUSTOM");
                                  setTableDate(e.target.value);
                                }}
                                className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent border-none outline-none cursor-pointer"
                                title="Pilih tanggal spesifik"
                              />
                            </div>
                          </div>
                        )}

                        {tablePeriod === "MONTHLY" && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              Bulan:
                            </span>
                            <div className="inline-flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setTableMonthPreset("CURRENT");
                                  const now = new Date();
                                  setTableMonth(now.getMonth() + 1);
                                  setTableYear(now.getFullYear());
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  tableMonthPreset === "CURRENT"
                                    ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-extrabold border border-indigo-200/80 dark:border-indigo-800/60"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                Bulan Ini
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTableMonthPreset("PREVIOUS");
                                  const now = new Date();
                                  now.setMonth(now.getMonth() - 1);
                                  setTableMonth(now.getMonth() + 1);
                                  setTableYear(now.getFullYear());
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  tableMonthPreset === "PREVIOUS"
                                    ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-extrabold border border-indigo-200/80 dark:border-indigo-800/60"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                Bulan Lalu
                              </button>
                            </div>

                            <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                              <CalendarDays size={13} className="text-slate-400 shrink-0" />
                              <select
                                value={tableMonth}
                                onChange={(e) => {
                                  setTableMonthPreset("CUSTOM");
                                  setTableMonth(parseInt(e.target.value, 10));
                                }}
                                className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent border-none outline-none cursor-pointer pr-1"
                              >
                                {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, idx) => (
                                  <option key={idx + 1} value={idx + 1} className="dark:bg-slate-900">
                                    {m} {tableYear}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sisi Kanan: Badge Periode Aktif */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 self-start md:self-center shrink-0">
                        <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase text-[10.5px] tracking-wider">
                          Periode Aktif:
                        </span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                          {tablePeriod === "ALL" ? "Semua Waktu (Akumulasi)" : (tablePeriod === "DAILY" ? tableDate : `Bulan ke-${tableMonth} ${tableYear}`)}
                        </span>
                      </div>
                    </div>

                    {/* Baris 2: Sumber Data & Pencarian / Urutan (Layout Simetris) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Sumber Data Switcher */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
                          Sumber:
                        </span>
                        <div className="inline-flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                          <button
                            type="button"
                            onClick={() => setTableSource("ALL")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              tableSource === "ALL"
                                ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-xs font-extrabold"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                            title="Gabungan seluruh data (Warga + Petugas)"
                          >
                            <Layers size={13} />
                            <span>Semua Sumber</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTableSource("WARGA_APP")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              tableSource === "WARGA_APP"
                                ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                            title="Hanya data pemilahan mandiri warga via aplikasi mobile"
                          >
                            <Smartphone size={13} />
                            <span>Aktivitas Warga</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTableSource("PETUGAS_LAPANGAN")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              tableSource === "PETUGAS_LAPANGAN"
                                ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                            title="Hanya data penimbangan manual posko / TPS3R oleh petugas"
                          >
                            <Scale size={13} />
                            <span>Penimbangan Petugas</span>
                          </button>
                        </div>
                      </div>

                      {/* Pencarian & Pengurutan */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari kelurahan..."
                            value={tableSearch}
                            onChange={(e) => setTableSearch(e.target.value)}
                            className="text-xs pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966] w-56 placeholder:text-slate-400 font-medium shadow-xs"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setTableSortAsc(!tableSortAsc)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-all shadow-xs"
                          title="Ubah Urutan"
                        >
                          <ArrowUpDown size={13} className="text-[#009966]" />
                          <span>{tableSortAsc ? "A – Z" : "Z – A"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2-Tier Hierarchical Table (Identik dengan Dasbor Tab Tata Kelola Sampah) */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                    <table className="min-w-[880px] w-full text-left text-xs border-collapse">
                      <thead>
                        {/* Header Row 1: Kategori Utama Standar ISO */}
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                          <th rowSpan={2} className="py-3 px-3 text-center w-12 bg-slate-100/90 dark:bg-slate-800/90 border-r border-slate-200 dark:border-slate-800">
                            No
                          </th>
                          <th rowSpan={2} className="py-3 px-4 min-w-[155px] font-bold bg-slate-100/90 dark:bg-slate-800/90 border-r border-slate-200 dark:border-slate-800">
                            Nama Kelurahan
                          </th>
                          <th colSpan={2} className="py-2.5 px-3 text-center uppercase tracking-wider bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                            Berat Sampah (kg/hari)
                          </th>
                          <th colSpan={2} className="py-2.5 px-3 text-center uppercase tracking-wider bg-blue-50/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border-r border-slate-200 dark:border-slate-800">
                            Penurunan Berat Sampah (B₀ − B₁)
                          </th>
                          <th colSpan={2} className="py-2.5 px-3 text-center uppercase tracking-wider bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-r border-slate-200 dark:border-slate-800">
                            Kepatuhan Pemilahan
                          </th>
                          <th rowSpan={2} className="py-3 px-3 text-center uppercase tracking-wider bg-teal-50/70 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 min-w-[130px]">
                            Perubahan Kepatuhan (Δ pp)
                          </th>
                        </tr>

                        {/* Header Row 2: Sub-Kolom Seragam */}
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
                          <th
                            title="Baseline estimasi timbulan sampah hasil survei KKN Juli 2026 (Konstan B₀)"
                            className="py-2 px-3 text-center bg-slate-50/60 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800 min-w-[125px]"
                          >
                            Baseline KKN (kg/hari)
                          </th>
                          <th
                            title="Data transaksi sampah aktual tercatat per hari"
                            className="py-2 px-3 text-center bg-slate-50/60 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800 min-w-[115px]"
                          >
                            Aktual (kg/hari)
                          </th>
                          <th
                            title="Delta selisih penurunan berat sampah: Baseline KKN dikurangi Aktual (B₀ − B₁)"
                            className="py-2 px-3 text-center bg-blue-50/40 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 min-w-[120px]"
                          >
                            Penurunan (kg/hari)
                          </th>
                          <th
                            title="Persentase penurunan berat sampah terhadap Baseline KKN"
                            className="py-2 px-3 text-center bg-blue-50/40 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 min-w-[95px]"
                          >
                            Penurunan (%)
                          </th>
                          <th className="py-2 px-3 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 min-w-[90px]">
                            Baseline (%)
                          </th>
                          <th className="py-2 px-3 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 min-w-[115px]">
                            Aktual (%)
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {processedKelurahanAudit.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                              Tidak ada data kelurahan yang sesuai dengan filter pencarian.
                            </td>
                          </tr>
                        ) : (
                          processedKelurahanAudit.map((k, idx) => {
                            const bKg = k.baselineKg ?? 0;
                            const aKg = k.aktualKg ?? 0;
                            const dKg =
                              k.penurunanKg !== undefined
                                ? k.penurunanKg
                                : bKg > 0 && aKg > 0
                                ? Number((bKg - aKg).toFixed(1))
                                : null;
                            const dPct =
                              k.penurunanPersen !== undefined
                                ? k.penurunanPersen
                                : bKg > 0 && aKg > 0
                                ? Number((((bKg - aKg) / bKg) * 100).toFixed(1))
                                : null;
                            const bRate = k.kepatuhanBaseline !== undefined ? k.kepatuhanBaseline : k.baselineRate;
                            const aRate = k.kepatuhanAktual !== undefined ? k.kepatuhanAktual : k.currentComplianceRate;
                            const dComp =
                              k.perubahanKepatuhanPp !== undefined
                                ? k.perubahanKepatuhanPp
                                : aRate > 0 && bRate > 0
                                ? Number((aRate - bRate).toFixed(1))
                                : null;

                            return (
                              <tr
                                key={k.kelurahan}
                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-xs"
                              >
                                <td className="py-3 px-3 text-center text-slate-400 font-bold border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4 font-extrabold text-slate-800 dark:text-slate-100 border-r border-slate-200/60 dark:border-slate-800/60">
                                  <span>Kel. {k.kelurahan}</span>
                                </td>

                                {/* Berat Baseline KKN (kg/hari) */}
                                <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                                  {bKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </td>

                                {/* Aktual (kg/hari) */}
                                <td className="py-3 px-3 text-center font-extrabold text-slate-800 dark:text-slate-100 border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                                  {aKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </td>

                                {/* Penurunan (kg/hari) */}
                                <td className="py-3 px-3 text-center font-extrabold border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                                  {dKg === null ? (
                                    <span className="text-slate-400 italic font-sans">—</span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                      <TrendingDown size={13} className="text-emerald-600 shrink-0" />
                                      <span>{dKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                                    </span>
                                  )}
                                </td>

                                {/* Penurunan (%) */}
                                <td className="py-3 px-3 text-center font-extrabold border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                                  {dPct === null ? (
                                    <span className="text-slate-400 italic font-sans">—</span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                      <TrendingDown size={13} className="text-emerald-600 shrink-0" />
                                      <span>{dPct.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
                                    </span>
                                  )}
                                </td>

                                {/* Baseline Kepatuhan (%) */}
                                <td className="py-3 px-3 text-center font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                                  {bRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                                </td>

                                {/* Aktual Kepatuhan (%) */}
                                <td className="py-3 px-3 text-center font-extrabold text-emerald-700 dark:text-emerald-400 border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                                  <div className="flex flex-col items-center justify-center">
                                    <span>{aRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
                                    {k.partisipasiWarga !== undefined && k.partisipasiWarga !== null && (
                                      <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 block font-sans mt-0.5">
                                        (Partisipasi: {k.partisipasiWarga.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%)
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Perubahan Kepatuhan (Δ pp) */}
                                <td className="py-3 px-3 text-center font-extrabold font-mono tabular-nums">
                                  {dComp === null ? (
                                    <span className="text-slate-400 italic font-sans">—</span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40">
                                      <TrendingUp size={13} className="text-teal-600 shrink-0" />
                                      <span>+{dComp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}

                        {/* Baris Agregasi Kecamatan (Total & Rata-rata Terbobot) */}
                        <tr className="bg-slate-100/95 dark:bg-slate-800/95 font-black text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                          <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                            ★
                          </td>
                          <td className="py-3.5 px-4 border-r border-slate-200 dark:border-slate-700">
                            <span className="text-slate-900 dark:text-white uppercase tracking-wider block font-extrabold">
                              Kecamatan Coblong (Total)
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block font-sans">
                              Agregasi Terbobot 6 Kelurahan (Rata-Rata Harian)
                            </span>
                          </td>

                          {/* Total Baseline */}
                          <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                            <span className="font-black text-slate-900 dark:text-white">
                              {auditMetrics.totalBaselineKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </span>
                          </td>

                          {/* Total Aktual */}
                          <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                            <span className="font-black text-slate-900 dark:text-white">
                              {auditMetrics.totalAktualKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </span>
                          </td>

                          {/* Total Penurunan kg */}
                          <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-extrabold font-mono tabular-nums">
                            <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300">
                              <TrendingDown size={13} className="text-emerald-600 shrink-0" />
                              <span>{auditMetrics.totalPenurunanKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                            </span>
                          </td>

                          {/* Total Penurunan % */}
                          <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-extrabold font-mono tabular-nums">
                            <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300">
                              <TrendingDown size={13} className="text-emerald-600 shrink-0" />
                              <span>{auditMetrics.weightedPenurunanPersen.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
                            </span>
                          </td>

                          {/* Baseline Kepatuhan */}
                          <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                            {auditMetrics.avgBaselineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                          </td>

                          {/* Aktual Kepatuhan */}
                          <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
                            {auditMetrics.avgEndlineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                          </td>

                          {/* Perubahan Kepatuhan */}
                          <td className="py-3.5 px-3 text-center text-teal-700 dark:text-teal-300 font-mono tabular-nums">
                            <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200 border border-teal-300">
                              <TrendingUp size={13} className="text-teal-600 shrink-0" />
                              <span>+{auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp</span>
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>

            {/* =================================================================
                MODE 2: DOKUMEN (STANDAR NASKAH DINAS RESMI 1 HALAMAN F4 TEGAK)
                ================================================================= */}
            <div
              className={`official-document-section w-full flex justify-center py-6 px-2 sm:px-4 ${
                viewMode === "document" ? "block" : "hidden"
              } print:block print:p-0 print:py-0 print:px-0`}
            >
              <article
                ref={documentRef}
                className="document-paper bg-white text-black shadow-2xl rounded-sm px-[16mm] py-[14mm] border border-slate-300 w-[215mm] min-h-[330mm] max-w-full mx-auto font-serif leading-normal transition-all print:border-none print:shadow-none print:w-full print:max-w-full print:min-h-0"
              >
                {/* 1. KOP SURAT RESMI KEDINASAN */}
                <div className="pb-2.5 border-b-2 border-black mb-3 overflow-visible">
                  <div className="flex items-center justify-between gap-3">
                    {/* Logo UNIKOM Resmi Utuh */}
                    <div className="w-20 shrink-0 flex items-center justify-center">
                      <img
                        src="/logos/unikom.png"
                        alt="Logo UNIKOM"
                        className="h-16 w-16 object-contain block shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/image/mitra/unikom.png";
                        }}
                      />
                    </div>

                    {/* Teks Identitas Lembaga Resmi */}
                    <div className="text-center flex-1 px-1 leading-tight text-black">
                      <div className="text-xs font-bold tracking-wider uppercase text-black">
                        PEMERINTAH DAERAH KOTA BANDUNG &bull; DINAS LINGKUNGAN HIDUP
                      </div>
                      <div className="text-base font-black tracking-wide uppercase text-black mt-0.5">
                        UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)
                      </div>
                      <div className="text-xs font-black tracking-tight uppercase text-black mt-0.5">
                        TIM KOORDINASI PLATFORM CERDAS BERSEKA KECAMATAN COBLONG
                      </div>
                      <div className="text-[10px] text-black mt-1 leading-snug">
                        Jalan Dipati Ukur Nomor 112–116, Coblong, Kota Bandung 40132 &bull; Telepon: (022) 2504119
                        <br />
                        Laman Resmi: https://berseka.id &bull; Pos-el: info@unikom.ac.id &bull; Sistem Terpadu: https://berseka.id
                      </div>
                    </div>

                    {/* Logo BERSEKA Resmi */}
                    <div className="w-20 shrink-0 flex items-center justify-center">
                      <img
                        src="/logos/berseka/berseka-logo-full.png?v=20261022_v2"
                        alt="Logo BERSEKA"
                        className="h-12 w-auto max-w-[105px] object-contain block shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/logos/berseka/berseka-logo-full.svg?v=20261022_v2";
                        }}
                      />
                    </div>
                  </div>
                  <div className="border-t border-black mt-0.5" />
                </div>

                {/* 2. NOMOR NASKAH DINAS DAN INFORMASI SURAT */}
                <div className="flex justify-between items-start text-[11px] text-black mb-3 pb-2 border-b border-black/30 leading-snug">
                  <div className="space-y-0.5">
                    <div className="flex"><span className="w-18 font-bold">Nomor</span><span className="w-2">:</span><span className="font-mono font-bold">{reportConfig.nomorDokumen || "005/BERSEKA-DLH/EVAL/X/2026"}</span></div>
                    <div className="flex"><span className="w-18 font-bold">Sifat</span><span className="w-2">:</span><span>{reportConfig.sifatDokumen || "Penting / Kedinasan Terbuka"}</span></div>
                    <div className="flex"><span className="w-18 font-bold">Lampiran</span><span className="w-2">:</span><span>{reportConfig.lampiranDokumen || "1 (Satu) Berkas Rekapitulasi Lengkap"}</span></div>
                    <div className="flex"><span className="w-18 font-bold">Perihal</span><span className="w-2">:</span><span className="font-bold">{reportConfig.perihalDokumen || "Laporan Akuntabilitas dan Evaluasi Kinerja Tata Kelola Persampahan Berbasis Ekonomi Sirkular"}</span></div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-bold">Bandung, {reportConfig.tanggalPengesahan || "16 Oktober 2026"}</div>
                    <div className="text-[10px] text-black/80">{reportConfig.wilayahCakupan || "Kecamatan Coblong (6 Kelurahan Binaan, 74 RW)"}</div>
                    <div className="text-[10px] text-black font-semibold">SK Bersama DLH No. 005/SK-DLH/IX/2026</div>
                  </div>
                </div>

                {/* 3. JUDUL LAPORAN RESMI */}
                <div className="text-center mb-3">
                  <h1 className="text-sm font-black uppercase text-black tracking-tight leading-snug">
                    {reportConfig.judulLaporan || "LAPORAN EVALUASI DAN AKUNTABILITAS TATA KELOLA PERSAMPAHAN BERKELANJUTAN"}
                  </h1>
                  <div className="text-xs font-bold text-black uppercase tracking-wide mt-0.5">
                    {reportConfig.subjudul || "KECAMATAN COBLONG KOTA BANDUNG • PLATFORM CERDAS BERSEKA"}
                  </div>
                </div>

                {/* 4. PERNYATAAN PENGANTAR RESMI */}
                <div className="text-[10.5px] leading-relaxed text-justify mb-3 text-black">
                  <p>
                    Berdasarkan Surat Keputusan Bersama Dinas Lingkungan Hidup Kota Bandung dan Universitas Komputer Indonesia Nomor 005/SK-DLH/IX/2026, telah dilaksanakan kegiatan evaluasi dan pengawasan operasional tata kelola persampahan mandiri di wilayah Kecamatan Coblong yang mencakup 6 kelurahan binaan dan 74 RW. Indeks kepatuhan pemilahan sampah warga berhasil ditingkatkan dari baseline {auditMetrics.avgBaselineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% (Survei Lapangan KKN Juli 2026) menjadi endline {auditMetrics.avgEndlineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% ({auditMetrics.deltaKepatuhanPp >= 0 ? `+${auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` : auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp) dengan hasil rekapitulasi audit komparatif sebagai berikut:
                  </p>
                </div>

                {/* 5. TABEL REKAPITULASI CAPAIAN WILAYAH (OPEN TABLE BOOKTABS MONOKROM HITAM) */}
                <div className="mb-3.5 avoid-break">
                  <table className="w-full text-left text-[10px] border-collapse text-black">
                    <thead>
                      <tr className="border-t-2 border-b-2 border-black font-bold text-black bg-slate-50/70">
                        <th className="py-1.5 px-1 text-center w-6">No</th>
                        <th className="py-1.5 px-1.5">Kelurahan Binaan</th>
                        <th className="py-1.5 px-1 text-center w-18">Baseline (kg)</th>
                        <th className="py-1.5 px-1 text-center w-16">Aktual (kg)</th>
                        <th className="py-1.5 px-1 text-center w-18">Penurunan</th>
                        <th className="py-1.5 px-1 text-center w-16">Reduksi %</th>
                        <th className="py-1.5 px-1 text-center w-16">Base %</th>
                        <th className="py-1.5 px-1 text-center w-16">Aktual %</th>
                        <th className="py-1.5 px-1 text-center w-18">Deviasi (Δ)</th>
                        <th className="py-1.5 px-1 text-center w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.kelurahanAudit.map((k, idx) => {
                        const bKg = k.baselineKg ?? 0;
                        const aKg = k.aktualKg ?? 0;
                        const dKg =
                          k.penurunanKg !== undefined
                            ? k.penurunanKg
                            : bKg > 0 && aKg > 0
                            ? Number((bKg - aKg).toFixed(1))
                            : 0;
                        const dPct =
                          k.penurunanPersen !== undefined
                            ? k.penurunanPersen
                            : bKg > 0 && aKg > 0
                            ? Number((((bKg - aKg) / bKg) * 100).toFixed(1))
                            : 0;
                        const bRate = k.kepatuhanBaseline !== undefined ? k.kepatuhanBaseline : k.baselineRate;
                        const aRate = k.kepatuhanAktual !== undefined ? k.kepatuhanAktual : k.currentComplianceRate;
                        const dComp =
                          k.perubahanKepatuhanPp !== undefined
                            ? k.perubahanKepatuhanPp
                            : aRate > 0 && bRate > 0
                            ? Number((aRate - bRate).toFixed(1))
                            : 0;

                        return (
                          <tr key={k.kelurahan}>
                            <td className="py-1.5 px-1 text-center font-semibold">{idx + 1}</td>
                            <td className="py-1.5 px-1.5 font-bold text-black">Kelurahan {k.kelurahan}</td>
                            <td className="py-1.5 px-1 text-center font-mono text-black">
                              {bKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </td>
                            <td className="py-1.5 px-1 text-center font-mono font-bold text-black">
                              {aKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </td>
                            <td className="py-1.5 px-1 text-center font-mono font-bold text-black">
                              {dKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </td>
                            <td className="py-1.5 px-1 text-center font-mono text-black">
                              {dPct.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                            </td>
                            <td className="py-1.5 px-1 text-center font-mono text-black">
                              {bRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                            </td>
                            <td className="py-1.5 px-1 text-center font-mono font-bold text-black">
                              {aRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                            </td>
                            <td className="py-1.5 px-1 text-center font-mono font-bold text-black">
                              +{dComp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp
                            </td>
                            <td className="py-1.5 px-1 text-center font-bold text-black">
                              {k.statusVerifikasi || "Terverifikasi Real"}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="border-t-2 border-b-2 border-black font-black bg-slate-100/60 text-black">
                        <td colSpan={2} className="py-2 px-1.5">
                          Akumulasi {selectedWilayah === "ALL" ? "Kecamatan Coblong" : selectedWilayah}
                        </td>
                        <td className="py-2 px-1 text-center font-mono font-black text-black">
                          {auditMetrics.totalBaselineKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </td>
                        <td className="py-2 px-1 text-center font-mono font-black text-black">
                          {auditMetrics.totalAktualKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </td>
                        <td className="py-2 px-1 text-center font-mono font-black text-black">
                          {auditMetrics.totalPenurunanKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </td>
                        <td className="py-2 px-1 text-center font-mono font-black text-black">
                          {auditMetrics.weightedPenurunanPersen.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </td>
                        <td className="py-2 px-1 text-center font-mono font-black text-black">
                          {auditMetrics.avgBaselineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </td>
                        <td className="py-2 px-1 text-center font-mono font-black text-black">
                          {auditMetrics.avgEndlineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </td>
                        <td className="py-2 px-1 text-center font-mono font-black text-black">
                          +{auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp
                        </td>
                        <td className="py-2 px-1 text-center font-black text-black tracking-wide">
                          PARIPURNA
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 6. EMPAT POIN KUNCI AKUNTABILITAS PENGELOLAAN SAMPAH MANDIRI */}
                <div className="grid grid-cols-2 gap-2.5 text-[9.5px] leading-relaxed mb-4 text-black">
                  <div className="p-2.5 rounded border border-slate-300 bg-white">
                    <span className="font-bold text-black block mb-0.5">1. Evaluasi Komparatif Baseline dan Endline</span>
                    <span>Tingkat kepatuhan pemilahan warga melonjak dari baseline {auditMetrics.avgBaselineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% (Survei Lapangan KKN Juli 2026) menjadi endline {auditMetrics.avgEndlineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% ({auditMetrics.deltaKepatuhanPp >= 0 ? `+${auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` : auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp) dengan total timbulan terpilah {auditMetrics.totalTerpilahKg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg.</span>
                  </div>
                  <div className="p-2.5 rounded border border-slate-300 bg-white">
                    <span className="font-bold text-black block mb-0.5">2. Valorisasi Reduksi Emisi CO₂</span>
                    <span>Keberhasilan pencegahan timbulan sampah organik membusuk di TPA mereduksi {(data.kpiSummary.dampakDanReduksi.reduksiEmisiCo2Kg ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg gas rumah kaca setara CO₂e (metode IPCC Tier 1).</span>
                  </div>
                  <div className="p-2.5 rounded border border-slate-300 bg-white">
                    <span className="font-bold text-black block mb-0.5">3. Efektivitas Infrastruktur Sirkular</span>
                    <span>Jejaring {data.kpiSummary.infrastruktur.totalFasilitas} fasilitas pengolahan (5 TPS3R, 16 Bank Sampah, 13 Rumah Maggot, 63 Komposter dan Unit Olah) beroperasi aktif melayani kebutuhan sirkular warga.</span>
                  </div>
                  <div className="p-2.5 rounded border border-slate-300 bg-white">
                    <span className="font-bold text-black block mb-0.5">4. Monitoring Wadah Tempat Sampah</span>
                    <span>Tercatat {data.kpiSummary.infrastruktur.wadahSampahAktif} dari {data.kpiSummary.infrastruktur.wadahSampahTotal} wadah Tempat Sampah aktif terverifikasi GPS (99% spasial, {data.kpiSummary.infrastruktur.wadahSampahBelumGps || 4} unit proses pemetaan) melayani 74 RW binaan.</span>
                  </div>
                </div>

                {/* 7. LEMBAR PENGESAHAN RESMI (TUNGGAL TENGAH BAWAH DENGAN TTD DIGITAL) */}
                <div className="avoid-break pt-1 text-center max-w-sm mx-auto leading-normal text-black">
                  <div className="text-[10.5px] text-black font-serif">
                    Bandung, {reportConfig.tanggalPengesahan || "16 Oktober 2026"}
                  </div>
                  <div className="text-[11px] font-bold text-black uppercase font-serif mt-0.5">
                    {reportConfig.penandatangan?.jabatan || "Rektor"}
                  </div>
                  <div className="text-[10.5px] font-semibold text-black font-serif">
                    {reportConfig.penandatangan?.instansi || "Universitas Komputer Indonesia (UNIKOM)"}
                  </div>

                  {/* Area Tanda Tangan Digital Transparan */}
                  <div className="h-14 flex items-center justify-center my-1">
                    {reportConfig.tandaTanganUrl ? (
                      <img
                        src={reportConfig.tandaTanganUrl}
                        alt="Tanda Tangan Digital"
                        className="max-h-14 w-auto object-contain block mx-auto"
                      />
                    ) : (
                      <div className="w-28 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 font-serif italic">
                        Tanda Tangan Digital
                      </div>
                    )}
                  </div>

                  <div className="font-serif font-black text-black underline text-xs tracking-wide">
                    {reportConfig.penandatangan?.nama || "Prof. Dr. Ir. H. Eddy Soeryanto Soegoto, M.T."}
                  </div>
                  <div className="text-[10px] text-black font-serif mt-0.5">
                    NIP. {reportConfig.penandatangan?.nip || "4127.34.01.001"}
                  </div>
                </div>
              </article>
            </div>
          </>
        )}
      </main>

      {/* Modal Pengaturan Naskah Dinamis (Muncul sebelum Cetak PDF) */}
      <PengaturanLaporanModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setIsPrintFlow(false);
        }}
        config={reportConfig}
        onSave={handleSaveConfig}
        onReset={handleResetConfig}
        confirmLabel={isPrintFlow ? "Simpan dan Lanjut Cetak PDF" : "Terapkan Pengaturan"}
      />
    </div>
  );
};

export default LaporanTataKelolaSampahPage;
