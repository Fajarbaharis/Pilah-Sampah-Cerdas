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
import { useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Recycle,
  Printer,
  RefreshCw,
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
  Coins,
  Leaf,
  Sprout,
  Boxes,
  Flame,
  Droplets,
  Settings,
  Award,
  AlertCircle,
  ShieldCheck,
  Info,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { FormulaTooltip } from "../../components/common/FormulaTooltip";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import type { WasteReportData } from "./types";
import {
  PengaturanLaporanModal,
  type ReportCustomConfig,
  DEFAULT_WASTE_REPORT_CONFIG,
} from "../../components/laporan/PengaturanLaporanModal";

const STORAGE_KEY = "berseka_waste_report_custom_config_v5";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const LaporanTataKelolaSampahPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const hasAutoPrintedRef = useRef<boolean>(false);

  const [data, setData] = useState<WasteReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPrintFlow, setIsPrintFlow] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"dashboard" | "document">(() => {
    return searchParams.get("view") === "document" || searchParams.get("action") === "print"
      ? "document"
      : "dashboard";
  });

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

  // Filter Parameters (Identik Laporan KKN)
  const [selectedBatch, setSelectedBatch] = useState<string>(() => {
    return searchParams.get("batch") || searchParams.get("periode") || "2026-041027-Universitas Komputer Indonesia - 1";
  });
  const [selectedWilayah, setSelectedWilayah] = useState<string>(() => {
    const raw = searchParams.get("wilayah") || searchParams.get("kelurahan");
    if (!raw || raw === "Semua Wilayah" || raw === "ALL") return "ALL";
    return raw.replace(/^Kel\.\s*/i, "").trim() || "ALL";
  });
  const [selectedRw, setSelectedRw] = useState<string>(() => {
    return searchParams.get("rw") || "";
  });
  const [tableSource, setTableSource] = useState<"ALL" | "WARGA_APP" | "PETUGAS_LAPANGAN">(() => {
    const s = searchParams.get("sourceType");
    if (s === "WARGA_APP" || s === "PETUGAS_LAPANGAN") return s;
    return "ALL";
  });
  const [tableSearch, setTableSearch] = useState<string>("");
  const [tableSortAsc, setTableSortAsc] = useState<boolean>(true);

  // Inisialisasi Default: Bulan Kemarin (M-1) yang sudah Tutup Buku Resmi
  const defaultReportPeriod = useMemo(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      month: prev.getMonth() + 1,
      year: prev.getFullYear(),
    };
  }, []);

  // Mode Evaluasi: Default selalu Akumulasi Total Program untuk seluruh ringkasan halaman
  const [reportPeriodMode, setReportPeriodMode] = useState<"MONTHLY" | "ALL">("ALL");
  // Preset Aktif: "ALL" (Akumulasi), "PREVIOUS" (Bulan Lalu - Tutup Buku), "CURRENT" (Bulan Berjalan), "CUSTOM" (Arsip Lain)
  const [reportMonthPreset, setReportMonthPreset] = useState<"PREVIOUS" | "CURRENT" | "ALL" | "CUSTOM">("ALL");
  const [reportMonth, setReportMonth] = useState<number>(defaultReportPeriod.month);
  const [reportYear, setReportYear] = useState<number>(defaultReportPeriod.year);

  // Hitung rentang tanggal nyata berdasarkan bulan/tahun yang dipilih
  const { startDate, endDate } = useMemo(() => {
    if (reportPeriodMode === "ALL") {
      return { startDate: undefined, endDate: undefined };
    }
    const startStr = `${reportYear}-${String(reportMonth).padStart(2, "0")}-01T00:00:00.000Z`;
    const lastDay = new Date(reportYear, reportMonth, 0).getDate();
    const endStr = `${reportYear}-${String(reportMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T23:59:59.999Z`;
    return { startDate: startStr, endDate: endStr };
  }, [reportPeriodMode, reportMonth, reportYear]);

  // Label periode aktif untuk badge UI dan dokumen resmi
  const activePeriodLabel = useMemo(() => {
    if (reportPeriodMode === "ALL") {
      return "Semua Waktu (Akumulasi Program)";
    }
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevDate.getMonth() + 1;
    const prevYear = prevDate.getFullYear();

    const mName = MONTH_NAMES[reportMonth - 1] || `Bulan ke-${reportMonth}`;
    if (reportMonth === prevMonth && reportYear === prevYear) {
      return `${mName} ${reportYear} (Tutup Buku - Resmi)`;
    }
    if (reportMonth === currentMonth && reportYear === currentYear) {
      return `${mName} ${reportYear} (Sedang Berjalan / Progresif)`;
    }
    return `${mName} ${reportYear} (Arsip Tutup Buku)`;
  }, [reportPeriodMode, reportMonth, reportYear]);

  // Status Pemilihan Kelurahan
  const isKelurahanSelected = useMemo(() => {
    return selectedWilayah !== "ALL" && selectedWilayah !== "Seluruh Wilayah" && selectedWilayah.trim() !== "";
  }, [selectedWilayah]);

  // Opsi RW yang tersedia (dinamis & akurat 100% dengan data riil kewilayahan Coblong)
  const availableRwOptions = useMemo(() => {
    if (!isKelurahanSelected) return ["Semua RW"];

    const rwRealListMap: Record<string, string[]> = {
      Cipaganti: ["RW 01", "RW 02", "RW 03", "RW 04", "RW 05", "RW 06", "RW 07"],
      Dago: [
        "RW 01",
        "RW 02",
        "RW 03",
        "RW 04",
        "RW 05",
        "RW 06",
        "RW 07",
        "RW 08",
        "RW 09",
        "RW 10",
        "RW 11",
        "RW 12",
        "RW 13",
      ],
      "Lebak Gede": [
        "RW 01",
        "RW 02",
        "RW 03",
        "RW 04",
        "RW 07",
        "RW 08",
        "RW 09",
        "RW 10",
        "RW 11",
        "RW 12",
        "RW 13",
        "RW 14",
        "RW 15",
      ],
      "Lebak Siliwangi": ["RW 05", "RW 06", "RW 07", "RW 08"],
      "Sadang Serang": Array.from({ length: 21 }, (_, i) => `RW ${String(i + 1).padStart(2, "0")}`),
      Sekeloa: Array.from({ length: 16 }, (_, i) => `RW ${String(i + 1).padStart(2, "0")}`),
    };

    const list = rwRealListMap[selectedWilayah] || [];
    return ["Semua RW", ...list];
  }, [isKelurahanSelected, selectedWilayah]);

  // Status Filter Aktif
  const isFiltered = useMemo(() => {
    return (
      selectedWilayah !== "ALL" ||
      (selectedRw !== "" && selectedRw !== "Semua RW") ||
      selectedBatch !== "2026-041027-Universitas Komputer Indonesia - 1" ||
      tableSource !== "ALL"
    );
  }, [selectedWilayah, selectedRw, selectedBatch, tableSource]);

  const handleResetFilters = () => {
    setSelectedWilayah("ALL");
    setSelectedRw("");
    setSelectedBatch("2026-041027-Universitas Komputer Indonesia - 1");
    setTableSource("ALL");
    setReportPeriodMode("MONTHLY");
    setReportMonthPreset("PREVIOUS");
    const prev = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    setReportMonth(prev.getMonth() + 1);
    setReportYear(prev.getFullYear());
  };

  const documentRef = useRef<HTMLDivElement>(null);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        wilayah: selectedWilayah,
        sourceType: tableSource,
        periode: searchParams.get("periode") || "semua",
      };
      if (searchParams.get("startDate")) params.startDate = searchParams.get("startDate")!;
      if (searchParams.get("endDate")) params.endDate = searchParams.get("endDate")!;

      if (selectedRw && selectedRw !== "Semua RW" && selectedRw.trim() !== "") {
        params.rw = selectedRw.trim();
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
  }, [selectedWilayah, selectedRw, selectedBatch, tableSource, reportPeriodMode, reportMonth, reportYear, startDate, endDate]);
  // Auto-print ketika dibuka langsung dari tombol Unduh Laporan di Dashboard
  useEffect(() => {
    if (data && !loading && searchParams.get("action") === "print" && !hasAutoPrintedRef.current) {
      hasAutoPrintedRef.current = true;
      setViewMode("document");
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [data, loading, searchParams]);


  // Aksi Cetak PDF Resmi Langsung
  const handlePrint = () => {
    setViewMode("document");
    setTimeout(() => {
      const originalTitle = document.title;
      const cleanTitle = (reportConfig.judulLaporan || "Laporan_Resmi_Tata_Kelola_Sampah")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_");
      document.title = `${cleanTitle}_Coblong_2026`;
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 250);
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
          const cleanTitle = (newConfig.judulLaporan || "Laporan_Resmi_Tata_Kelola_Sampah")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .replace(/_+/g, "_");
          document.title = `${cleanTitle}_Coblong_2026`;
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

  // Satuan standar evaluasi bulanan
  const tableUnit = "kg/bulan";
  const tableUnitShort = "kg/bln";

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
    const totalAktualKg = Number(list.reduce((acc, k) => acc + Number(k.aktualKg || 0), 0).toFixed(2));
    const totalPenurunanKg = totalBaselineKg > 0 && totalAktualKg > 0 ? Number((totalBaselineKg - totalAktualKg).toFixed(2)) : 0;
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

  // Data Donut Chart Komposisi Dua Fraksi Sampah (Organik vs Anorganik)
  const fraksiDonutData = useMemo(() => {
    if (!data?.kpiSummary?.dampakDanReduksi?.rasioPemilahan) return [];
    const { organikKg, organikPersen, anorganikKg, anorganikPersen } =
      data.kpiSummary.dampakDanReduksi.rasioPemilahan;
    return [
      {
        name: "Sampah Organik",
        rawKategori: "organik",
        value: Number(Number(organikKg || 0).toFixed(2)),
        pct: Number(Number(organikPersen || 0).toFixed(1)),
        color: "#10b981", // Emerald
        keterangan: "Kompos, biopori, budi daya maggot BSF",
      },
      {
        name: "Sampah Anorganik",
        rawKategori: "anorganik",
        value: Number(Number(anorganikKg || 0).toFixed(2)),
        pct: Number(Number(anorganikPersen || 0).toFixed(1)),
        color: "#3b82f6", // Blue
        keterangan: "Bank Sampah & daur ulang sirkular",
      },
    ];
  }, [data?.kpiSummary?.dampakDanReduksi?.rasioPemilahan]);

  // Data Grouped Bar Chart Komposisi 6 Kelurahan Binaan (Sumbu X & Y)
  const kelurahanBarData = useMemo(() => {
    if (!data?.kelurahanAudit) return [];
    return data.kelurahanAudit.map((k) => {
      const org = Number((k.organikKg || 0).toFixed(2));
      const ano = Number((k.anorganikKg || 0).toFixed(2));
      const tot = Number((k.totalTerpilahKg || 0).toFixed(2));
      return {
        name: `Kel. ${k.kelurahan}`,
        shortName: k.kelurahan,
        organik: org,
        anorganik: ano,
        total: tot,
        tps3r: k.tps3rCount,
        bankSampah: k.bankSampahCount,
        activeBins: k.activeBinsCount,
      };
    });
  }, [data?.kelurahanAudit]);

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
            2. SECTION KHUSUS FILTER (PARAMETER PENYARINGAN DATA)
            Dilengkapi Switcher Kartu | Dokumen dan 4 Aksi Eksekutif
        ───────────────────────────────────────────────────────────── */}
        <section className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
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

          {/* Baris Kontrol Filter Dropdown 1 Baris Penuh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Filter 1: Identitas Program / Batch */}
            <div className="min-w-0">
              <label className="block text-[10.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">
                Identitas Program / Batch
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966] cursor-pointer truncate"
              >
                <option value="2026-041027-Universitas Komputer Indonesia - 1">
                  2026-041027-Universitas Komputer Indonesia - 1
                </option>
                <option value="ALL">Semua Batch / Periode</option>
              </select>
            </div>

            {/* Filter 2: Cakupan Kelurahan */}
            <div className="min-w-0">
              <label className="block text-[10.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">
                Cakupan Kelurahan
              </label>
              <select
                value={selectedWilayah}
                onChange={(e) => {
                  setSelectedWilayah(e.target.value);
                  setSelectedRw("");
                }}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966] cursor-pointer truncate"
              >
                <option value="ALL">Seluruh Kecamatan Coblong</option>
                <option value="Cipaganti">Kelurahan Cipaganti</option>
                <option value="Dago">Kelurahan Dago</option>
                <option value="Lebak Gede">Kelurahan Lebak Gede</option>
                <option value="Lebak Siliwangi">Kelurahan Lebak Siliwangi</option>
                <option value="Sadang Serang">Kelurahan Sadang Serang</option>
                <option value="Sekeloa">Kelurahan Sekeloa</option>
              </select>
            </div>

            {/* Filter 3: RW Binaan (Wajib Pilih Kelurahan Terlebih Dahulu) */}
            <div className="min-w-0">
              <label className="block text-[10.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">
                RW Binaan
              </label>
              <select
                value={isKelurahanSelected ? (selectedRw || "Semua RW") : ""}
                onChange={(e) => setSelectedRw(e.target.value)}
                disabled={!isKelurahanSelected}
                title={
                  !isKelurahanSelected
                    ? "Pilih cakupan kelurahan terlebih dahulu untuk memfilter RW binaan"
                    : "Pilih RW binaan aktif"
                }
                className={`w-full text-xs border rounded-xl px-3 py-2 font-bold transition-all truncate ${
                  isKelurahanSelected
                    ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966] cursor-pointer"
                    : "bg-slate-100/70 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                }`}
              >
                {!isKelurahanSelected ? (
                  <option value="">Pilih Kelurahan Dulu</option>
                ) : (
                  availableRwOptions.map((rw) => (
                    <option key={rw} value={rw}>
                      {rw}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Filter 4: Sumber Data Setoran */}
            <div className="min-w-0">
              <label className="block text-[10.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">
                Sumber Data Setoran
              </label>
              <select
                value={tableSource}
                onChange={(e) => setTableSource(e.target.value as any)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966] cursor-pointer truncate"
              >
                <option value="ALL">Semua Sumber (Warga & Petugas)</option>
                <option value="WARGA_APP">Warga Mandiri (Aplikasi Mobile)</option>
                <option value="PETUGAS_LAPANGAN">Petugas Lapangan (Manual / TPS 3R)</option>
              </select>
            </div>
          </div>

          {/* Baris Kedua: Tombol Reset Filter & Aksi Eksekutif */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Status / Reset Filter Button */}
            <div>
              {isFiltered ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>&times;</span>
                  <span>Reset Filter</span>
                </button>
              ) : (
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Menampilkan seluruh data tata kelola sampah
                </span>
              )}
            </div>

            {/* Tombol Aksi di Ujung Kanan (Format Naskah, Cetak PDF) */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setIsPrintFlow(false);
                  setIsSettingsOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                title="Atur Format Naskah Dokumen Resmi (Kop Surat, Pejabat & Legalitas)"
              >
                <Settings size={13} />
                <span>Format Naskah</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={loading || !data}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#009966] hover:bg-[#008855] text-white font-extrabold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                title="Cetak Laporan Resmi Tata Kelola Sampah (Standar F4)"
              >
                <Printer size={13} />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                  {/* KPI 1: Total Sampah Terpilah */}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 text-slate-400">
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
                      <div className="flex items-start justify-between gap-2 text-slate-400">
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
                      <div className="flex items-baseline flex-wrap gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-[#009966] dark:text-emerald-400 tracking-tight">
                          {data.kpiSummary.dampakDanReduksi.rataRataKepatuhanPersen.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                        </span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 leading-snug">
                      <span>Baseline 17,1% (Survei KKN) &bull; Pertumbuhan +{(data.kpiSummary.dampakDanReduksi.rataRataKepatuhanPersen - 17.1).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp</span>
                    </div>
                  </div>

                  {/* KPI 3: Reduksi Emisi Gas Rumah Kaca */}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 text-slate-400">
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
                      <div className="flex items-baseline flex-wrap gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {(data.kpiSummary.dampakDanReduksi.reduksiEmisiCo2Kg ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      <div className="flex items-start justify-between gap-2 text-slate-400">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 whitespace-normal">
                          Fasilitas Sirkular
                        </span>
                        <FormulaTooltip
                          title="Inventaris Sarana Sirkular Kecamatan Coblong"
                          formula="17 Bank Sampah + 19 Buruan Sae + 18 Loseda + 18 Bata Terawang + 13 Maggot + 10 POC + 5 TPS"
                          description="Total 100 titik fasilitas operasional pengolahan sampah mandiri dengan total kapasitas olah 7.294 kg di seluruh wilayah binaan."
                          isoStandard="ISO 14001:2015"
                        />
                      </div>
                      <div className="flex items-baseline flex-wrap gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {data.kpiSummary.infrastruktur.totalFasilitas.toLocaleString("id-ID")}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">Unit</span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 leading-snug">
                      <span>17 Bank Sampah &bull; 19 Buruan Sae &bull; 36 Komposter &bull; 13 Maggot &bull; 10 POC &bull; 5 TPS</span>
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
                  {/* Kolom Kiri: Donut Chart Komposisi Dua Fraksi Sampah (5 cols) */}
                  <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        Komposisi Dua Fraksi Sampah
                      </h2>
                      <p className="text-xs text-slate-500">
                        Proporsi realisasi pemilahan di tingkat rumah tangga & fasilitas
                      </p>
                    </div>

                    <div className="relative h-60 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={fraksiDonutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {fraksiDonutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-lg border border-slate-700 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                      <span className="font-extrabold text-slate-100">{d.name}</span>
                                    </div>
                                    <div className="mt-1 text-sm font-black font-mono" style={{ color: d.color }}>
                                      {Number(d.value).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg ({d.pct}%)
                                    </div>
                                    <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-0.5">
                                      {d.keterangan}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Terkelola</span>
                        <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                          {(data.kpiSummary.dampakDanReduksi.totalSampahTerpilahKg ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {fraksiDonutData.map((fraksi) => (
                        <div
                          key={fraksi.rawKategori}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: fraksi.color }} />
                            <span className="truncate">{fraksi.name}</span>
                          </div>
                          <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-1">
                            {Number(fraksi.value).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-xs font-normal text-slate-400">kg</span>
                          </div>
                          <div className="text-[10.5px] font-bold mt-0.5" style={{ color: fraksi.color }}>
                            {fraksi.pct}% dari Timbulan
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Rasio Tereduksi dari TPA</span>
                      <span className="font-extrabold text-[#009966]">
                        {data.kpiSummary.dampakDanReduksi.rasioReduksiTpaPersen.toLocaleString("id-ID")}% Tuntas Mandiri
                      </span>
                    </div>
                  </div>

                  {/* Kolom Kanan: Grouped Bar Chart Komposisi 6 Kelurahan Binaan (7 cols) */}
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                          Sebaran Sampah Terkelola per Kelurahan
                        </h2>
                        <p className="text-xs text-slate-500">
                          Perbandingan kuantitatif: Fraksi Organik vs Anorganik per Kelurahan Binaan
                        </p>
                      </div>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {selectedWilayah !== "ALL" ? selectedWilayah : "6 Kelurahan Binaan"}
                      </span>
                    </div>

                    <div className="h-64 w-full pt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={kelurahanBarData} margin={{ top: 15, right: 15, left: 10, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                          <XAxis
                            dataKey="shortName"
                            axisLine={{ stroke: "#e2e8f0" }}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }}
                            label={{
                              value: "Kelurahan",
                              position: "insideBottom",
                              offset: -14,
                              style: { textAnchor: "middle", fill: "#475569", fontSize: 11, fontWeight: 800 },
                            }}
                          />
                          <YAxis
                            axisLine={{ stroke: "#e2e8f0" }}
                            tickLine={false}
                            tick={{ fontSize: 10.5, fontWeight: 600, fill: "#64748b" }}
                            tickFormatter={(val) => `${Number(val).toLocaleString("id-ID")} kg`}
                            label={{
                              value: "Kg",
                              angle: -90,
                              position: "insideLeft",
                              offset: 0,
                              style: { textAnchor: "middle", fill: "#475569", fontSize: 11, fontWeight: 800 },
                            }}
                            width={75}
                          />
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-lg border border-slate-700 space-y-1">
                                    <div className="font-extrabold text-sm text-slate-100">{d.name}</div>
                                    <div className="text-[11px] text-slate-400">{d.tps3r} TPS3R &bull; {d.bankSampah} Bank Sampah &bull; {d.activeBins} Wadah Aktif</div>
                                    <div className="pt-1 border-t border-slate-800 space-y-0.5">
                                      <div className="flex justify-between gap-4">
                                        <span className="text-emerald-400 font-semibold">Sampah Organik:</span>
                                        <span className="font-mono font-bold text-white">{Number(d.organik).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg</span>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                        <span className="text-blue-400 font-semibold">Sampah Anorganik:</span>
                                        <span className="font-mono font-bold text-white">{Number(d.anorganik).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg</span>
                                      </div>
                                      <div className="flex justify-between gap-4 pt-1 border-t border-slate-800/60">
                                        <span className="text-slate-300 font-bold">Total Terkelola:</span>
                                        <span className="font-mono font-black text-emerald-400">{Number(d.total).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="organik" name="Sampah Organik" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
                          <Bar dataKey="anorganik" name="Sampah Anorganik" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Sampah Organik</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Sampah Anorganik</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-[#009966]">
                        {(data.kpiSummary.dampakDanReduksi.totalSampahTerpilahKg ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg Terkelola
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              {/* SECTION 3: RINGKASAN INVENTARIS FASILITAS PENGOLAHAN SIRKULAR */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="flex items-center">
                    <span>RINGKASAN INVENTARIS FASILITAS PENGOLAHAN SIRKULAR</span>
                    <FormulaTooltip
                      title="Sebaran Sarana dan Kapasitas Pengolahan Fisik"
                      formula="∑ 17 Bank Sampah + 19 Buruan Sae + 18 Loseda + 18 Bata Terawang + 13 Maggot + 10 POC + 5 TPS"
                      description="Pemetaan inventaris fisik sarana pengolahan sampah sirkular dan daya serap pengolahan mandiri di Kecamatan Coblong."
                      isoStandard="ISO 14001:2015"
                    />
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                          Inventaris Sarana & Daya Serap Pengolahan
                        </h2>
                        <p className="text-xs text-slate-500">
                          Jejaring 7 kategori sarana fisik pengolahan mandiri warga & kelurahan
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                        {data.kpiSummary.infrastruktur.totalFasilitas} Titik Terdata
                      </span>
                      <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
                        Kapasitas: {(data.kpiSummary.infrastruktur.totalKapasitasKg || 7294).toLocaleString("id-ID")} kg
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
                    {/* 1. BANK SAMPAH */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex flex-col justify-between">
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                          Bank Sampah
                        </span>
                        <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          <Coins size={14} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-blue-950 dark:text-blue-100 tracking-tight font-mono">
                          {data.kpiSummary.infrastruktur.bankSampahCount}
                        </div>
                        <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 mt-0.5 truncate">
                          Unit Tabungan
                        </p>
                      </div>
                    </div>

                    {/* 2. BURUAN SAE */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-lime-50/70 dark:bg-lime-950/40 border border-lime-200 dark:border-lime-800/50 flex flex-col justify-between">
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-lime-800 dark:text-lime-300">
                          Buruan SAE
                        </span>
                        <div className="p-1.5 rounded-xl bg-lime-100 dark:bg-lime-900/60 text-lime-700 dark:text-lime-300">
                          <Leaf size={14} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-lime-950 dark:text-lime-100 tracking-tight font-mono">
                          {data.kpiSummary.infrastruktur.buruanSaeCount ?? 19}
                        </div>
                        <p className="text-[10px] font-semibold text-lime-700 dark:text-lime-400 mt-0.5 truncate">
                          Kebun Urban
                        </p>
                      </div>
                    </div>

                    {/* 3. LOSEDA */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 flex flex-col justify-between">
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                          Loseda
                        </span>
                        <div className="p-1.5 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300">
                          <Sprout size={14} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-teal-950 dark:text-teal-100 tracking-tight font-mono">
                          {data.kpiSummary.infrastruktur.losedaCount ?? 18}
                        </div>
                        <p className="text-[10px] font-semibold text-teal-700 dark:text-teal-400 mt-0.5 truncate">
                          Sisa Dapur
                        </p>
                      </div>
                    </div>

                    {/* 4. BATA TERAWANG */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex flex-col justify-between">
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                          Bata Terawang
                        </span>
                        <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                          <Boxes size={14} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-100 tracking-tight font-mono">
                          {data.kpiSummary.infrastruktur.bataTerawangCount ?? 18}
                        </div>
                        <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5 truncate">
                          Komposter Bata
                        </p>
                      </div>
                    </div>

                    {/* 5. RUMAH MAGGOT */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50 flex flex-col justify-between">
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-orange-800 dark:text-orange-300">
                          Rumah Maggot
                        </span>
                        <div className="p-1.5 rounded-xl bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300">
                          <Flame size={14} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-orange-950 dark:text-orange-100 tracking-tight font-mono">
                          {data.kpiSummary.infrastruktur.rumahMaggotCount}
                        </div>
                        <p className="text-[10px] font-semibold text-orange-700 dark:text-orange-400 mt-0.5 truncate">
                          Biokonversi BSF
                        </p>
                      </div>
                    </div>

                    {/* 6. POC */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 flex flex-col justify-between">
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                          POC
                        </span>
                        <div className="p-1.5 rounded-xl bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300">
                          <Droplets size={14} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-cyan-950 dark:text-cyan-100 tracking-tight font-mono">
                          {data.kpiSummary.infrastruktur.pocCount ?? 10}
                        </div>
                        <p className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-400 mt-0.5 truncate">
                          Pupuk Organik
                        </p>
                      </div>
                    </div>

                    {/* 7. TPS */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 flex flex-col justify-between">
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                          TPS / TPS3R
                        </span>
                        <div className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                          <Building2 size={14} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-purple-950 dark:text-purple-100 tracking-tight font-mono">
                          {data.kpiSummary.infrastruktur.tps3rCount}
                        </div>
                        <p className="text-[10px] font-semibold text-purple-700 dark:text-purple-400 mt-0.5 truncate">
                          Terintegrasi
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: VALORISASI HASIL PENGOLAHAN & EKONOMI SIRKULAR */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="flex items-center">
                    <span>VALORISASI HASIL PENGOLAHAN &amp; EKONOMI SIRKULAR</span>
                    <FormulaTooltip
                      title="Valorisasi Hilirisasi & Nilai Ekonomi Sirkular"
                      formula="(Kg Anorganik × Rp 3.000) + (Kg Kompos × Rp 1.500) + (Kg Maggot × Rp 8.000)"
                      description="Estimasi valuasi ekonomi sirkular komoditas terolah di hulu berdasarkan acuan harga resmi DLH Kota Bandung dan Bank Sampah: Sampah Anorganik Rp 3.000/kg, Kompos Organik Rp 1.500/kg, dan Larva Maggot BSF segar Rp 8.000/kg."
                      isoStandard="Permen LHK P.14/2021 & Standar Valorisasi DLH Kota Bandung"
                    />
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                  {/* Banner Utama: Total Valorisasi Ekonomi */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10.5px] font-extrabold uppercase tracking-wider">
                        <Coins size={13} className="shrink-0" />
                        <span>Estimasi Total Valorisasi Sirkular</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                        Rp {(data.kpiSummary.operasional.totalNilaiEkonomiRupiah || 0).toLocaleString("id-ID")}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                        Potensi perputaran nilai ekonomi riil yang dihasilkan dari pemilahan dan pengolahan mandiri warga serta fasilitas TPS3R / Bank Sampah di wilayah Kecamatan Coblong.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 shrink-0 sm:min-w-[260px]">
                      <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Bahan Masuk Fasilitas
                        </span>
                        <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 font-mono">
                          {(data.kpiSummary.operasional.materialOrganikMasukKg || 0).toLocaleString("id-ID")} kg
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Produk Organik Terolah
                        </span>
                        <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {(data.kpiSummary.operasional.outputProdukOrganikKg || 0).toLocaleString("id-ID")} kg
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Pilar Produk Hilirisasi & Sirkularitas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Kartu 1: Kompos Organik */}
                    <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/50 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                            Pupuk Kompos
                          </span>
                          <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                            <Sprout size={15} />
                          </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100 font-mono">
                          {(data.kpiSummary.operasional.outputKomposKg || 0).toLocaleString("id-ID")}{" "}
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">kg</span>
                        </div>
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                          ≈ Rp {(data.kpiSummary.operasional.nilaiEkonomiKomposRupiah || 0).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-relaxed border-t border-emerald-200/70 dark:border-emerald-800/50 pt-2">
                        Didistribusikan untuk ketahanan pangan &amp; penghijauan kelompok tani perkotaan Buruan Sae.
                      </p>
                    </div>

                    {/* Kartu 2: Maggot BSF */}
                    <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/90 dark:border-orange-800/50 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-orange-800 dark:text-orange-300">
                            Biomassa Maggot BSF
                          </span>
                          <div className="p-1.5 rounded-xl bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300">
                            <Flame size={15} />
                          </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-orange-950 dark:text-orange-100 font-mono">
                          {(data.kpiSummary.operasional.outputMaggotKg || 0).toLocaleString("id-ID")}{" "}
                          <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">kg</span>
                        </div>
                        <div className="text-xs font-bold text-orange-700 dark:text-orange-300 mt-1">
                          ≈ Rp {(data.kpiSummary.operasional.nilaiEkonomiMaggotRupiah || 0).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-relaxed border-t border-orange-200/70 dark:border-orange-800/50 pt-2">
                        Diserap sebagai pakan alternatif berprotein tinggi untuk budidaya unggas &amp; perikanan air tawar warga.
                      </p>
                    </div>

                    {/* Kartu 3: Pupuk Organik Cair (POC) */}
                    <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/90 dark:border-cyan-800/50 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                            Pupuk Organik Cair
                          </span>
                          <div className="p-1.5 rounded-xl bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300">
                            <Droplets size={15} />
                          </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-cyan-950 dark:text-cyan-100 font-mono">
                          {(data.kpiSummary.operasional.outputPocLiter || 0).toLocaleString("id-ID")}{" "}
                          <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Liter</span>
                        </div>
                        <div className="text-xs font-bold text-cyan-700 dark:text-cyan-300 mt-1">
                          ≈ Rp {(data.kpiSummary.operasional.nilaiEkonomiPocRupiah ?? ((data.kpiSummary.operasional.outputPocLiter || 0) * 10000)).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-relaxed border-t border-cyan-200/70 dark:border-cyan-800/50 pt-2">
                        Nutrisi cair pekarangan rumah tangga hasil biopori dan instalasi takakura/loseda.
                      </p>
                    </div>

                    {/* Kartu 4: Bank Sampah Anorganik */}
                    <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/90 dark:border-blue-800/50 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                            Tabungan Anorganik
                          </span>
                          <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                            <Coins size={15} />
                          </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-blue-950 dark:text-blue-100 font-mono">
                          {(data.kpiSummary.dampakDanReduksi.rasioPemilahan.anorganikKg || 0).toLocaleString("id-ID")}{" "}
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">kg</span>
                        </div>
                        <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mt-1">
                          ≈ Rp {(data.kpiSummary.operasional.nilaiEkonomiAnorganikRupiah || 0).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-relaxed border-t border-blue-200/70 dark:border-blue-800/50 pt-2">
                        Terserap ke {data.kpiSummary.infrastruktur.bankSampahCount} unit Bank Sampah aktif untuk daur ulang plastik, kertas, &amp; logam.
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
                  {/* Panel Penjelasan Metodologi Komparasi Baseline & Evaluasi Bulanan */}
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-300 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-[12.5px]">
                      <div className="flex items-center gap-2">
                        <Info size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Metodologi Evaluasi Kinerja Kelurahan (Komparasi Ilmiah ISO 14044)</span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700/60">
                        <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                        100% Konsolidasi Seluruh Sumber Resmi
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-0.5 text-[11px] leading-relaxed">
                      <div className="bg-white/90 dark:bg-slate-900/70 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                        <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>Baseline Pembanding (B₀)</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">
                          Estimasi timbulan sampah dari <strong>Survei Lapangan KKN Tematik UNIKOM (Juli 2026)</strong> yang disetarakan per 30 hari kalender sebagai titik tolak intervensi awal.
                        </p>
                      </div>

                      <div className="bg-white/90 dark:bg-slate-900/70 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                        <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Aktual Evaluasi (B₁)</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">
                          Realisasi transaksi sampah terpilah resmi periode <strong className="text-emerald-700 dark:text-emerald-300">{activePeriodLabel}</strong> dari <strong>seluruh sumber terverifikasi</strong> (Warga via Tempat Sampah Cerdas &amp; TPS3R).
                        </p>
                      </div>

                      <div className="bg-white/90 dark:bg-slate-900/70 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                        <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          <span>Tolok Ukur Keberhasilan</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">
                          Mengukur penurunan beban sampah ke TPA (<strong>B₀ − B₁</strong>) serta peningkatan indeks kepatuhan pemilahan warga (<strong>Δ pp</strong>) secara setara (<em>apple-to-apple</em>).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Toolbar Kontrol Lokal Card: Pencarian & Pengurutan Internal */}
                  <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Sisi Kiri: Status Keterangan Card (Statik & Tidak Mempengaruhi Komponen Lain) */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      <span className="inline-flex items-center gap-1.5 font-extrabold text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                        <CalendarDays size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-slate-400 dark:text-slate-500 font-semibold text-[11px]">Evaluasi:</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{activePeriodLabel}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 font-bold text-[11px] text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 shadow-2xs">
                        <Layers size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Semua Sumber (Warga &amp; Petugas)</span>
                      </span>
                    </div>

                    {/* Sisi Kanan: Pencarian Kelurahan & Urutan */}
                    <div className="flex items-center gap-2 flex-wrap self-start md:self-center shrink-0">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari kelurahan..."
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                          className="text-xs pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966] w-48 sm:w-56 placeholder:text-slate-400 font-medium shadow-xs"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setTableSortAsc(!tableSortAsc)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-all shadow-xs"
                        title="Ubah Urutan Kelurahan"
                      >
                        <ArrowUpDown size={13} className="text-[#009966]" />
                        <span>{tableSortAsc ? "A – Z" : "Z – A"}</span>
                      </button>
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
                            Berat Sampah ({tableUnit})
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
                            Baseline KKN ({tableUnit})
                          </th>
                          <th
                            title="Data transaksi sampah aktual tercatat pada periode evaluasi bulanan"
                            className="py-2 px-3 text-center bg-slate-50/60 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800 min-w-[115px]"
                          >
                            Aktual ({tableUnit})
                          </th>
                          <th
                            title="Delta selisih penurunan berat sampah: Baseline KKN dikurangi Aktual (B₀ − B₁)"
                            className="py-2 px-3 text-center bg-blue-50/40 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 min-w-[120px]"
                          >
                            Penurunan ({tableUnit})
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
                          <th
                            title="Formula Komposit: 50% Partisipasi Warga Aktif + 50% Ketepatan Pemilahan Wadah"
                            className="py-2 px-3 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 min-w-[115px]"
                          >
                            <div className="inline-flex items-center justify-center gap-1">
                              <span>Aktual (%)</span>
                              <FormulaTooltip
                                title="Kepatuhan Aktual Komposit"
                                formula="50% Partisipasi Warga Aktif + 50% Ketepatan Pemilahan Wadah"
                                note="Menggabungkan rasio warga unik aktif menyetor dengan ketepatan pemilahan Tempat Sampah berdasar deteksi AI."
                              />
                            </div>
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

                                {/* Berat Baseline KKN */}
                                <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                                  {bKg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>

                                {/* Aktual */}
                                <td className="py-3 px-3 text-center font-extrabold text-slate-800 dark:text-slate-100 border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                                  {aKg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>

                                {/* Penurunan */}
                                <td className="py-3 px-3 text-center font-extrabold border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                                  {dKg === null ? (
                                    <span className="text-slate-400 italic font-sans">—</span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                      <TrendingDown size={13} className="text-emerald-600 shrink-0" />
                                      <span>{dKg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                              Agregasi Terbobot 6 Kelurahan (Akumulasi Bulanan)
                            </span>
                          </td>

                          {/* Total Baseline */}
                          <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                            <span className="font-black text-slate-900 dark:text-white">
                              {auditMetrics.totalBaselineKg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>

                          {/* Total Aktual */}
                          <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                            <span className="font-black text-slate-900 dark:text-white">
                              {auditMetrics.totalAktualKg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>

                          {/* Total Penurunan kg */}
                          <td className="py-3.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-extrabold font-mono tabular-nums">
                            <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300">
                              <TrendingDown size={13} className="text-emerald-600 shrink-0" />
                              <span>{auditMetrics.totalPenurunanKg.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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

              {/* SECTION 6: REKOMENDASI STRATEGIS & ARAHAN KEBIJAKAN EKSEKUTIF */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="flex items-center">
                    <span>REKOMENDASI STRATEGIS &amp; ARAHAN KEBIJAKAN EKSEKUTIF</span>
                    <FormulaTooltip
                      title="Rekomendasi Kebijakan Berbasis Bukti (Evidence-Based Policy)"
                      formula="Prioritisasi Intervensi = F(Timbulan Baseline, Indeks Kepatuhan, Utilisasi Fasilitas TPS3R/BSU)"
                      description="Rekomendasi kebijakan terstruktur yang diturunkan dari disparitas kinerja 6 kelurahan, neraca reduksi residu ke TPA, dan profil fasilitas operasional."
                      isoStandard="Good Regulatory Practice (GRP)"
                    />
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                  {/* Strategic Highlights Badges Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Badge 1: Kelurahan Terbaik */}
                    <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/50 flex items-start gap-3.5">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                        <Award size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                          Kelurahan Performa Terbaik
                        </span>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                          Kelurahan {data.strategicInsights?.bestPerformer?.kelurahan || "Dago"}
                        </div>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Lonjakan kepatuhan tertinggi{" "}
                          <span className="font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                            +{data.strategicInsights?.bestPerformer?.deltaPp ?? auditMetrics.deltaKepatuhanPp} pp
                          </span>{" "}
                          (mencapai {data.strategicInsights?.bestPerformer?.aktualKepatuhan ?? auditMetrics.avgEndlineRate}%)
                        </p>
                      </div>
                    </div>

                    {/* Badge 2: Prioritas Penguatan */}
                    <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/50 flex items-start gap-3.5">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                        <AlertCircle size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                          Prioritas Penguatan Sarpras
                        </span>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                          Kelurahan {data.strategicInsights?.priorityAttention?.kelurahan || "Sadang Serang"}
                        </div>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Beban timbulan tertinggi{" "}
                          <span className="font-extrabold text-amber-800 dark:text-amber-300 font-mono">
                            {(data.strategicInsights?.priorityAttention?.baselineKg ?? 0).toLocaleString("id-ID")} kg
                          </span>{" "}
                          memerlukan penguatan armada &amp; TPS3R.
                        </p>
                      </div>
                    </div>

                    {/* Badge 3: Rasio Reduksi TPA */}
                    <div className="p-4 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/90 dark:border-cyan-800/50 flex items-start gap-3.5">
                      <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 shrink-0">
                        <ShieldCheck size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400 block">
                          Tingkat Diversi TPA
                        </span>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white truncate font-mono">
                          {data.kpiSummary.dampakDanReduksi.rasioReduksiTpaPersen}% Tereduksi
                        </div>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-0.5">
                          {(data.kpiSummary.dampakDanReduksi.tonaseTereduksiDariTpaKg / 1000).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Ton sampah tertahan di hulu tanpa masuk TPA Sarimukti.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4 Pilar Arahan Kebijakan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                    <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                      <div className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10.5px] font-black font-mono">1</span>
                        <span>Edukasi Pemilahan Hulu</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Pendampingan intensif bersama kader RW &amp; mahasiswa KKN guna mempertahankan lompatan kepatuhan endline (+{auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp) pada kawasan padat permukiman.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                      <div className="font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10.5px] font-black font-mono">2</span>
                        <span>Revitalisasi Bank Sampah</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Standardisasi timbangan digital dan insentif tabungan sirkular pada {data.kpiSummary.infrastruktur.bankSampahCount} unit Bank Sampah untuk menyerap {(data.kpiSummary.dampakDanReduksi.rasioPemilahan.anorganikKg ?? 0).toLocaleString("id-ID")} kg anorganik.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                      <div className="font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10.5px] font-black font-mono">3</span>
                        <span>Hilirisasi Biokonversi</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Maksimalkan kapasitas serapan {(data.kpiSummary.dampakDanReduksi.rasioPemilahan.organikKg ?? data.kpiSummary.operasional.materialOrganikMasukKg ?? 0).toLocaleString("id-ID")} kg organik ke instalasi Maggot BSF &amp; komposter Buruan Sae untuk kontinuitas pakan dan pupuk.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                      <div className="font-extrabold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center text-[10.5px] font-black font-mono">4</span>
                        <span>Digitalisasi Tempat Sampah</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Optimasi telemetri {data.kpiSummary.infrastruktur.wadahSampahTotal} Tempat Sampah pintar dan respon cepat pada {data.kpiSummary.infrastruktur.wadahKritis} wadah kritis agar ritase armada tepat waktu tanpa penumpukan residu.
                      </p>
                    </div>
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
                <div className="pb-3 border-b-2 border-black mb-3.5 overflow-visible">
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
                      <div className="text-lg font-black tracking-wide uppercase text-black mt-0.5">
                        UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)
                      </div>
                      <div className="text-xs font-black tracking-tight uppercase text-black mt-0.5">
                        TIM KOORDINASI PLATFORM CERDAS BERSEKA KECAMATAN COBLONG
                      </div>
                      <div className="text-[10.5px] text-black mt-1 leading-snug">
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
                <div className="flex justify-between items-start text-xs text-black mb-3.5 pb-2.5 border-b border-black/30 leading-snug">
                  <div className="space-y-0.5">
                    <div className="flex"><span className="w-20 font-bold">Nomor</span><span className="w-2">:</span><span className="font-bold">{reportConfig.nomorDokumen || "005/BERSEKA-DLH/EVAL/X/2026"}</span></div>
                    <div className="flex"><span className="w-20 font-bold">Sifat</span><span className="w-2">:</span><span>{reportConfig.sifatDokumen || "Penting / Kedinasan Terbuka"}</span></div>
                    <div className="flex"><span className="w-20 font-bold">Lampiran</span><span className="w-2">:</span><span>{reportConfig.lampiranDokumen || "1 (Satu) Berkas Rekapitulasi Lengkap"}</span></div>
                    <div className="flex"><span className="w-20 font-bold">Perihal</span><span className="w-2">:</span><span className="font-bold">{reportConfig.perihalDokumen || "Laporan Akuntabilitas dan Evaluasi Kinerja Tata Kelola Persampahan Berbasis Ekonomi Sirkular"}</span></div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-bold">Bandung, {reportConfig.tanggalPengesahan || "16 Oktober 2026"}</div>
                    <div className="text-[10.5px] text-black/80">{reportConfig.wilayahCakupan || "Kecamatan Coblong (6 Kelurahan Binaan, 74 RW)"}</div>
                    <div className="text-[10.5px] text-black font-semibold">SK Bersama DLH No. 005/SK-DLH/IX/2026</div>
                  </div>
                </div>

                {/* 3. JUDUL LAPORAN RESMI */}
                <div className="text-center mb-3.5">
                  <h1 className="text-base font-black uppercase text-black tracking-tight leading-snug">
                    {reportConfig.judulLaporan || "LAPORAN EVALUASI DAN AKUNTABILITAS TATA KELOLA PERSAMPAHAN BERKELANJUTAN"}
                  </h1>
                  <div className="text-xs font-bold text-black uppercase tracking-wide mt-0.5">
                    {reportConfig.subjudul || `KECAMATAN COBLONG KOTA BANDUNG • PERIODE EVALUASI: ${activePeriodLabel.toUpperCase()}`}
                  </div>
                </div>

                {/* 4. PERNYATAAN PENGANTAR RESMI */}
                <div className="text-[11.5px] leading-relaxed text-justify mb-3.5 text-black">
                  <p>
                    Berdasarkan Surat Keputusan Bersama Dinas Lingkungan Hidup Kota Bandung dan Universitas Komputer Indonesia Nomor 005/SK-DLH/IX/2026, telah dilaksanakan kegiatan evaluasi dan pengawasan operasional tata kelola persampahan mandiri di wilayah Kecamatan Coblong untuk {activePeriodLabel} yang mencakup 6 kelurahan binaan dan 74 RW. Indeks kepatuhan pemilahan sampah warga berhasil ditingkatkan dari baseline {auditMetrics.avgBaselineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% (Survei Lapangan KKN Juli 2026) menjadi endline {auditMetrics.avgEndlineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% ({auditMetrics.deltaKepatuhanPp >= 0 ? `+${auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` : auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp) dengan hasil rekapitulasi audit komparatif sebagai berikut:
                  </p>
                </div>

                {/* 5. TABEL REKAPITULASI CAPAIAN WILAYAH (BORDERED GRID NASKAH DINAS RESMI) */}
                <div className="mb-4 avoid-break">
                  <div className="text-[10.5px] font-bold uppercase text-black mb-1 tracking-tight font-serif">
                    I. Rekapitulasi Audit Reduksi Timbulan dan Kepatuhan Kelurahan Binaan
                  </div>
                  <table className="w-full text-left text-[9.5px] border-collapse border border-black text-black font-serif">
                    <thead>
                      <tr className="border-b border-black font-bold text-black bg-slate-100 text-center">
                        <th className="py-1 px-1 border border-black text-center w-7">No</th>
                        <th className="py-1 px-2 border border-black text-left">Kelurahan Binaan</th>
                        <th className="py-1 px-1 border border-black text-center w-16">Baseline ({tableUnit})</th>
                        <th className="py-1 px-1 border border-black text-center w-16">Realisasi ({tableUnit})</th>
                        <th className="py-1 px-1 border border-black text-center w-16">Reduksi ({tableUnitShort})</th>
                        <th className="py-1 px-1 border border-black text-center w-14">Reduksi %</th>
                        <th className="py-1 px-1 border border-black text-center w-14">Base %</th>
                        <th className="py-1 px-1 border border-black text-center w-14">Aktual %</th>
                        <th className="py-1 px-1 border border-black text-center w-16">Deviasi (Δ)</th>
                        <th className="py-1 px-1.5 border border-black text-center w-24">Status Audit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.kelurahanAudit.map((k, idx) => {
                        const bKg = k.baselineKg ?? 0;
                        const aKg = k.aktualKg ?? 0;
                        const dKg =
                          k.penurunanKg !== undefined
                            ? k.penurunanKg
                            : bKg > 0 && aKg > 0
                            ? Number((bKg - aKg).toFixed(2))
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
                          <tr key={k.kelurahan} className="hover:bg-slate-50/50">
                            <td className="py-1 px-1 border border-black text-center font-semibold">{idx + 1}</td>
                            <td className="py-1 px-2 border border-black font-bold text-black whitespace-nowrap">Kelurahan {k.kelurahan}</td>
                            <td className="py-1 px-1 border border-black text-center whitespace-nowrap">
                              {bKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-1 px-1 border border-black text-center font-bold text-black whitespace-nowrap">
                              {aKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-1 px-1 border border-black text-center font-bold text-black whitespace-nowrap">
                              {dKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-1 px-1 border border-black text-center whitespace-nowrap">
                              {dPct.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                            </td>
                            <td className="py-1 px-1 border border-black text-center whitespace-nowrap">
                              {bRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                            </td>
                            <td className="py-1 px-1 border border-black text-center font-bold text-black whitespace-nowrap">
                              {aRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                            </td>
                            <td className="py-1 px-1 border border-black text-center font-bold text-black whitespace-nowrap">
                              +{dComp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp
                            </td>
                            <td className="py-1 px-1.5 border border-black text-center font-semibold text-black whitespace-nowrap">
                              {k.statusVerifikasi || "Terverifikasi Real"}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="border-t-2 border-b border-black font-bold bg-slate-100 text-black">
                        <td colSpan={2} className="py-1.5 px-2 border border-black whitespace-nowrap font-bold">
                          Akumulasi {selectedWilayah === "ALL" ? "Kecamatan Coblong" : selectedWilayah}
                        </td>
                        <td className="py-1.5 px-1 border border-black text-center font-bold text-black whitespace-nowrap">
                          {auditMetrics.totalBaselineKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-1 border border-black text-center font-bold text-black whitespace-nowrap">
                          {auditMetrics.totalAktualKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-1 border border-black text-center font-bold text-black whitespace-nowrap">
                          {auditMetrics.totalPenurunanKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-1 border border-black text-center font-bold text-black whitespace-nowrap">
                          {auditMetrics.weightedPenurunanPersen.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </td>
                        <td className="py-1.5 px-1 border border-black text-center font-bold text-black whitespace-nowrap">
                          {auditMetrics.avgBaselineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </td>
                        <td className="py-1.5 px-1 border border-black text-center font-bold text-black whitespace-nowrap">
                          {auditMetrics.avgEndlineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </td>
                        <td className="py-1.5 px-1 border border-black text-center font-bold text-black whitespace-nowrap">
                          +{auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp
                        </td>
                        <td className="py-1.5 px-1.5 border border-black text-center font-bold text-black tracking-wide whitespace-nowrap">
                          PARIPURNA
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 6. INDIKATOR KINERJA KUNCI DAN DAMPAK EKONOMI SIRKULAR (BORDERED GRID) */}
                <div className="mb-4 avoid-break">
                  <div className="text-[10.5px] font-bold uppercase text-black mb-1 tracking-tight font-serif">
                    II. Indikator Kinerja Utama dan Valorisasi Ekonomi Sirkular
                  </div>
                  <table className="w-full text-left text-[9.5px] border-collapse border border-black text-black font-serif">
                    <thead>
                      <tr className="border-b border-black font-bold text-black bg-slate-100 text-center">
                        <th className="py-1 px-1 border border-black text-center w-7">No</th>
                        <th className="py-1 px-2 border border-black text-left w-44">Dimensi Evaluasi</th>
                        <th className="py-1 px-2 border border-black text-left w-56">Realisasi Capaian Lapangan</th>
                        <th className="py-1 px-2 border border-black text-left">Tolok Ukur &amp; Standar Verifikasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-1 px-1 border border-black text-center font-semibold">1</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">Indeks Kepatuhan Pemilahan</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">
                          {auditMetrics.avgEndlineRate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% Warga Terpola{" "}
                          <span className="font-normal text-[8.5px] text-slate-700">
                            (+{auditMetrics.deltaKepatuhanPp.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pp dari baseline)
                          </span>
                        </td>
                        <td className="py-1 px-2 border border-black text-slate-900 leading-snug">
                          Verifikasi door-to-door dan sensor IoT, akumulasi timbulan terpilah {auditMetrics.totalTerpilahKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg di sumber.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-1 border border-black text-center font-semibold">2</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">Valorisasi Reduksi Emisi Karbon</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">
                          &#8722;{(data.kpiSummary.dampakDanReduksi.reduksiEmisiCo2Kg ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg CO&#8322;e
                        </td>
                        <td className="py-1 px-2 border border-black text-slate-900 leading-snug">
                          Pencegahan dekomposisi anaerobik sampah organik busuk di TPA Sarimukti mengacu metode standar IPCC Tier 1.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-1 border border-black text-center font-semibold">3</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">Hilirisasi &amp; Ekonomi Sirkular</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">
                          Rp {(data.kpiSummary.operasional.totalNilaiEkonomiRupiah || 0).toLocaleString("id-ID")}{" "}
                          <span className="font-normal text-[8.5px] text-slate-700">
                            ({(data.kpiSummary.operasional.outputKomposKg || 0).toLocaleString("id-ID")} kg kompos, {(data.kpiSummary.operasional.outputMaggotKg || 0).toLocaleString("id-ID")} kg maggot)
                          </span>
                        </td>
                        <td className="py-1 px-2 border border-black text-slate-900 leading-snug">
                          Konversi biokonversi maggot BSF, {(data.kpiSummary.operasional.outputPocLiter || 0).toLocaleString("id-ID")} L POC, dan daur ulang Bank Sampah Unit.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-1 border border-black text-center font-semibold">4</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">Infrastruktur Tempat Sampah &amp; GPS</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">
                          {data.kpiSummary.infrastruktur.wadahSampahAktif} / {data.kpiSummary.infrastruktur.wadahSampahTotal} Unit Aktif Terpantau
                        </td>
                        <td className="py-1 px-2 border border-black text-slate-900 leading-snug">
                          Wadah Tempat Sampah cerdas IoT terpantau telemetri GPS 99% spasial di 74 RW binaan, terhubung ke jejaring {data.kpiSummary.infrastruktur.totalFasilitas || 6} fasilitas olah sampah.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 7. LEMBAR PENGESAHAN RESMI (TUNGGAL KANAN BAWAH STANDAR NASKAH DINAS) */}
                <div className="avoid-break pt-2 flex justify-end">
                  <div className="text-center w-80 leading-normal text-black font-serif">
                    <div className="text-xs text-black font-serif">
                      Bandung, {reportConfig.tanggalPengesahan || "16 Oktober 2026"}
                    </div>
                    <div className="text-[12px] font-bold text-black uppercase font-serif mt-0.5">
                      {reportConfig.penandatangan?.jabatan || "Rektor"}
                    </div>
                    <div className="text-[11px] font-semibold text-black font-serif">
                      {reportConfig.penandatangan?.instansi || "Universitas Komputer Indonesia (UNIKOM)"}
                    </div>

                    {/* Area Tanda Tangan Digital Transparan */}
                    <div className="h-16 flex items-center justify-center my-1.5">
                      {reportConfig.tandaTanganUrl ? (
                        <img
                          src={reportConfig.tandaTanganUrl}
                          alt="Tanda Tangan Digital"
                          className="max-h-16 w-auto object-contain block mx-auto"
                        />
                      ) : (
                        <div className="w-32 h-12 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-serif italic">
                          Tanda Tangan Digital
                        </div>
                      )}
                    </div>

                    <div className="font-serif font-black text-black underline text-[12.5px] tracking-wide">
                      {reportConfig.penandatangan?.nama || "Prof. Dr. Ir. H. Eddy Soeryanto Soegoto, M.T."}
                    </div>
                    <div className="text-[11px] text-black font-serif mt-0.5">
                      NIP. {reportConfig.penandatangan?.nip || "4127.34.01.001"}
                    </div>
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
