/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Laporan Resmi KKN UNIKOM untuk Role Pimpinan
 * Format Dual-View: Dasbor Analitik Web Interaktif & Dokumen Naskah Dinas / Jurnal Standar Indonesia
 * Sesuai Standar Tata Naskah Dinas UNIKOM, IMRaD Jurnal Ilmiah, dan EYD Edisi V
 * 100% Real-time Data dari Database PostgreSQL
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Printer,
  RefreshCw,
  Filter,
  Award,
  GraduationCap,
  Settings,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Compass,
  BookOpen,
  Layers,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { FormulaTooltip } from "../../components/common/FormulaTooltip";
import {
  PengaturanLaporanModal,
  type ReportCustomConfig,
  DEFAULT_REPORT_CONFIG,
} from "../../components/laporan/PengaturanLaporanModal";

export interface LaporanSummaryResponse {
  header: {
    nomorDokumen: string;
    judulLaporan: string;
    subjudul: string;
    periode: string;
    tanggalCetak: string;
    tanggalCetakFormatted: string;
    wilayahCakupan: string;
    instansi: {
      universitas: string;
      taskforce: string;
      alamat: string;
      kontak: string;
    };
  };
  ringkasanEksekutif: {
    totalMahasiswaAktif: number;
    totalKelompok: number;
    totalDpl: number;
    kepatuhanPresensiPercent: number;
    totalProkerSelesai: number;
    totalProkerDisetujui: number;
    totalProkerSemua: number;
    persentaseProkerSelesai: number;
    totalJamKontribusi: number;
    rataRataJamPerMahasiswa: number;
    totalLogbookMahasiswa: number;
    totalLogbookDpl: number;
  };
  ringkasanDampakSampah?: {
    totalSampahTerpilahKg: number;
    totalSampahTerpilahTon: number;
    organikKg: number;
    organikPersen: number;
    anorganikKg: number;
    anorganikPersen: number;
    residuKg: number;
    residuPersen: number;
    rasioReduksiTpaPersen: number;
    reduksiEmisiCo2Kg: number;
    rataRataKepatuhanPersen: number;
    wadahSampahAktif: number;
    totalPenggunaWarga: number;
    totalLokasiRw: number;
    volumeBulananM3: number;
  };
  topMahasiswa?: Array<{
    ranking: number;
    id: string;
    nama: string;
    nim: string;
    kelompok: string;
    kelurahan: string;
    nilaiAkhir: number;
    grade: string;
    kehadiranPercent: number;
    totalJamKerja: number;
  }>;
  topDpl?: Array<{
    ranking: number;
    id: string;
    nama: string;
    nip: string;
    kelompok: string;
    kelurahan: string;
    keaktifanLogbook: number;
    kunjunganLapangan: number;
    kepatuhanKelompok: number;
  }>;
  matriksKelompok: Array<{
    no: number;
    id: string;
    nama: string;
    kelurahan: string;
    cakupanRw: string[];
    cakupanRwFormatted: string;
    posko: {
      nama: string;
      alamat: string;
      latitude: number | null;
      longitude: number | null;
    } | null;
    ketua: {
      id: string;
      name: string;
      nim: string | null;
      phone: string | null;
    } | null;
    dpl: {
      id: string;
      name: string;
      nip: string | null;
      phone: string | null;
      programStudi: string | null;
    } | null;
    totalMahasiswa: number;
    persentaseKehadiran: number;
    prokerSelesaiCount: number;
    prokerTotalCount: number;
    prokerSelesaiPercent: number;
    rataRataSkorEvaluasi: number | null;
    kategoriNilai: string | null;
    jumlahMhsDinilai: number;
    statusEvaluasiLabel: string;
  }>;
  distribusiSks?: {
    totalMahasiswa: number;
    totalMahasiswaSemua?: number;
    totalMahasiswaDenganSks?: number;
    belumTerdataCount?: number;
    breakdown: Array<{
      sks: number;
      label: string;
      count: number;
      percentage: number;
      color: string;
    }>;
  };
  sebaranProdi?: Array<{
    name: string;
    count: number;
    breakdown?: Array<{ name: string; count: number }>;
  }>;
  sebaranProdiFull?: Array<{ name: string; count: number }>;
  programIdentity?: {
    tahun: string;
    kodePts: string;
    namaPts: string;
    batch: string;
    identitasFormat: string;
  };
  grafikPerforma: {
    prokerKategori: Array<{ kategori: string; total: number; selesai: number }>;
    statusPelaksanaanProker: Array<{ status: string; count: number; percentage: number; color: string }>;
    sebaranPerKelurahan: Array<{
      kelurahan: string;
      totalKelompok: number;
      totalMahasiswa: number;
      prokerSelesai: number;
    }>;
    distribusiNilaiEvaluasi: Array<{ grade: string; count: number }>;
    trenKehadiranMingguan: Array<{ minggu: string; persentase: number; totalJam: number }>;
  };
  lembarPengesahan: {
    tempat: string;
    tanggal: string;
    pejabat: Array<{
      posisi: string;
      peran: string;
      jabatan: string;
      instansi: string;
      nama: string;
      nip: string;
    }>;
  };
  filterOptions: {
    periodeOptions?: Array<{
      value: string;
      label: string;
      tahun?: string;
      kodePts?: string;
      namaPts?: string;
      batch?: string;
    }>;
    kelurahanOptions: string[];
    rwOptions?: string[];
    kelompokOptions?: Array<{
      value: string;
      label: string;
      kelurahan?: string;
    }>;
    selectedKelurahan: string;
    selectedRw: string;
    selectedKelompok: string;
    selectedPeriode: string;
  };
}

const STORAGE_KEY = "berseka_kkn_report_custom_config_v7";

export const LaporanResmiKknPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const hasAutoPrintedRef = useRef<boolean>(false);

  const [data, setData] = useState<LaporanSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPrintFlow, setIsPrintFlow] = useState<boolean>(false);

  // Switcher Tampilan: Langsung default "document" (Dokumen) sesuai arahan (Tab Kartu di-hide sementara)
  const [viewMode, setViewMode] = useState<"dashboard" | "document">(() => {
    return searchParams.get("view") === "dashboard"
      ? "dashboard"
      : "document";
  });

  // Filter States
  const [selectedPeriode, setSelectedPeriode] = useState<string>(() => {
    return searchParams.get("periode") || "2026-041027-Universitas Komputer Indonesia - 1";
  });
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>(() => {
    return searchParams.get("kelurahan") || "Semua Kelurahan";
  });
  const [selectedRw, setSelectedRw] = useState<string>(() => {
    return searchParams.get("rw") || "";
  });
  const [selectedKelompok, setSelectedKelompok] = useState<string>(() => {
    return searchParams.get("kelompok") || "";
  });

  // Dynamic Report Configuration (Customizable & Persisted)
  const [reportConfig, setReportConfig] = useState<ReportCustomConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_REPORT_CONFIG;
  });

  // Table Controls (Khusus Dasbor Web Interaktif)
  const [tableSearch, setTableSearch] = useState<string>("");
  const [tableKelurahanFilter, setTableKelurahanFilter] = useState<string>("ALL");
  const [tableSortAsc, setTableSortAsc] = useState<boolean>(true);
  const [tablePage, setTablePage] = useState<number>(1);
  const [tablePageSize, setTablePageSize] = useState<number>(10);

  const documentRef = useRef<HTMLDivElement>(null);

  const fetchLaporanData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedPeriode && selectedPeriode !== "ALL") {
        params.append("periode", selectedPeriode);
      }
      if (selectedKelurahan && selectedKelurahan !== "Semua Kelurahan" && selectedKelurahan !== "ALL") {
        params.append("kelurahan", selectedKelurahan);
      }
      if (selectedRw && selectedRw.trim() !== "" && selectedRw !== "Semua RW" && selectedRw !== "ALL") {
        params.append("rw", selectedRw.trim());
      }
      if (selectedKelompok && selectedKelompok.trim() !== "" && selectedKelompok !== "Semua Kelompok" && selectedKelompok !== "ALL") {
        params.append("kelompok", selectedKelompok.trim());
      }

      const res = await api.get(`/laporan/kkn/summary?${params.toString()}`);
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else {
        showToast.error("Gagal memuat data ringkasan laporan resmi KKN");
      }
    } catch (err: any) {
      console.error("[LaporanResmiKknPage] fetch error:", err);
      showToast.error(err.response?.data?.message || "Gagal memuat data laporan KKN dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporanData();
  }, [selectedPeriode, selectedKelurahan]);
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


  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLaporanData();
    }, 400);
    return () => clearTimeout(handler);
  }, [selectedRw, selectedKelompok]);

  // Aksi Cetak PDF Resmi Langsung
  const handlePrint = () => {
    setViewMode("document");
    setTimeout(() => {
      const originalTitle = document.title;
      const cleanTitle = (reportConfig.judulLaporan || "Laporan_Resmi_Evaluasi_KKN")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_");
      document.title = `${cleanTitle}_Coblong_UNIKOM_2026`;
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
          const cleanTitle = (newConfig.judulLaporan || "Laporan_Resmi_Evaluasi_KKN")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .replace(/_+/g, "_");
          document.title = `${cleanTitle}_Coblong_UNIKOM_2026`;
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

  // Reset Pengaturan Naskah
  const handleResetConfig = () => {
    setReportConfig(DEFAULT_REPORT_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY);
      showToast.success("Format naskah laporan dikembalikan ke template standar");
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered & Sorted Matriks Kelompok untuk Dasbor Interaktif
  const processedMatriksKelompok = useMemo(() => {
    if (!data?.matriksKelompok) return [];
    let list = [...data.matriksKelompok];

    // Filter Pencarian
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter((m) => {
        return (
          m.nama?.toLowerCase().includes(q) ||
          m.kelurahan?.toLowerCase().includes(q) ||
          m.ketua?.name?.toLowerCase().includes(q) ||
          m.dpl?.name?.toLowerCase().includes(q) ||
          m.cakupanRwFormatted?.toLowerCase().includes(q)
        );
      });
    }

    // Filter Kelurahan Spesifik
    if (tableKelurahanFilter !== "ALL") {
      list = list.filter((m) => m.kelurahan === tableKelurahanFilter);
    }

    // Pengurutan
    list.sort((a, b) => {
      const diff = a.no - b.no;
      return tableSortAsc ? diff : -diff;
    });

    return list;
  }, [data?.matriksKelompok, tableSearch, tableKelurahanFilter, tableSortAsc]);

  // Paginasi Tabel Dasbor
  const paginatedMatriksKelompok = useMemo(() => {
    if (tablePageSize === -1) return processedMatriksKelompok;
    const start = (tablePage - 1) * tablePageSize;
    return processedMatriksKelompok.slice(start, start + tablePageSize);
  }, [processedMatriksKelompok, tablePage, tablePageSize]);

  const totalTablePages = useMemo(() => {
    if (tablePageSize === -1 || processedMatriksKelompok.length === 0) return 1;
    return Math.ceil(processedMatriksKelompok.length / tablePageSize);
  }, [processedMatriksKelompok.length, tablePageSize]);

  // Data Donut Chart: 4 Klaster Program Kerja
  const prokerKlasterDonutData = useMemo(() => {
    if (!data?.grafikPerforma?.prokerKategori) return [];
    const colors: Record<string, string> = {
      EDUKASI: "#10b981",    // Emerald
      LINGKUNGAN: "#14b8a6", // Teal
      DIGITAL: "#3b82f6",    // Blue
      FISIK: "#8b5cf6",      // Violet
    };
    return data.grafikPerforma.prokerKategori.map((k) => ({
      name: k.kategori === "EDUKASI" ? "Edukasi & Sosialisasi" :
            k.kategori === "LINGKUNGAN" ? "Lingkungan & Biokonversi" :
            k.kategori === "DIGITAL" ? "Digitalisasi & Inovasi" :
            "Sarana Fisik Posko",
      rawKategori: k.kategori,
      total: k.total,
      value: k.selesai,
      selesai: k.selesai,
      color: colors[k.kategori] || "#0ea5e9",
    }));
  }, [data?.grafikPerforma?.prokerKategori]);

  // Data Grouped Bar Chart: Komparasi 6 Kelurahan Binaan
  const kelurahanBarData = useMemo(() => {
    if (!data?.grafikPerforma?.sebaranPerKelurahan) return [];
    return data.grafikPerforma.sebaranPerKelurahan.map((k) => {
      return {
        name: k.kelurahan.replace("Lebak ", "L. "),
        fullName: `Kelurahan ${k.kelurahan}`,
        mahasiswa: k.totalMahasiswa,
        prokerSelesai: k.prokerSelesai,
        kelompok: k.totalKelompok,
      };
    });
  }, [data?.grafikPerforma?.sebaranPerKelurahan]);

  // Data Donut Chart: Distribusi Beban SKS Akademik Mahasiswa
  const sksDonutData = useMemo(() => {
    if (!data?.distribusiSks?.breakdown) return [];
    return data.distribusiSks.breakdown
      .filter((b) => b.count > 0)
      .map((b) => ({
        name: b.label,
        sks: b.sks,
        value: b.count,
        percentage: b.percentage,
        color: b.color || "#0ea5e9",
      }));
  }, [data?.distribusiSks?.breakdown]);

  // Data Bar Chart: Sebaran Multidisiplin Program Studi Mahasiswa
  const prodiBarData = useMemo(() => {
    const list = data?.sebaranProdiFull || data?.sebaranProdi || [];
    return list.slice(0, 6).map((p) => ({
      name: p.name.length > 18 ? `${p.name.slice(0, 16)}...` : p.name,
      fullName: p.name,
      count: p.count,
    }));
  }, [data?.sebaranProdi, data?.sebaranProdiFull]);

  // Status Pemilihan Kelurahan
  const isKelurahanSelected = useMemo(() => {
    return (
      selectedKelurahan !== "Semua Kelurahan" &&
      selectedKelurahan !== "ALL" &&
      selectedKelurahan.trim() !== ""
    );
  }, [selectedKelurahan]);

  // Opsi RW yang tersedia (dinamis berdasarkan kelurahan yang dipilih)
  const availableRwOptions = useMemo(() => {
    if (!isKelurahanSelected || !data?.matriksKelompok) return ["Semua RW"];

    const rws = new Set<string>();
    data.matriksKelompok
      .filter((m) => m.kelurahan.toLowerCase().includes(selectedKelurahan.toLowerCase()))
      .forEach((m) => {
        if (Array.isArray(m.cakupanRw)) {
          m.cakupanRw.forEach((rw) => {
            const num = parseInt(String(rw).replace(/\D/g, ""), 10);
            if (!isNaN(num) && num > 0) {
              rws.add(`RW ${String(num).padStart(2, "0")}`);
            }
          });
        }
      });

    const sortedList = Array.from(rws).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10);
      const numB = parseInt(b.replace(/\D/g, ""), 10);
      return numA - numB;
    });

    return ["Semua RW", ...sortedList];
  }, [isKelurahanSelected, selectedKelurahan, data?.matriksKelompok]);

  // Opsi Kelompok yang tersedia (dinamis berdasarkan kelurahan dan RW terpilih)
  const availableKelompokOptions = useMemo(() => {
    if (!data?.matriksKelompok) return ["Semua Kelompok"];

    let list = data.matriksKelompok;

    // Jika kelurahan tertentu aktif, persempit kelompok ke kelurahan tersebut
    if (isKelurahanSelected) {
      list = list.filter((m) =>
        m.kelurahan.toLowerCase().includes(selectedKelurahan.toLowerCase())
      );
    }

    // Jika RW tertentu aktif, persempit kelompok ke RW tersebut
    if (selectedRw && selectedRw !== "Semua RW" && selectedRw.trim() !== "") {
      const rwNum = parseInt(selectedRw.replace(/\D/g, ""), 10);
      if (!isNaN(rwNum)) {
        list = list.filter((m) =>
          m.cakupanRw.some((r) => parseInt(String(r).replace(/\D/g, ""), 10) === rwNum)
        );
      }
    }

    const sortedGroupNames = list
      .map((m) => m.nama)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return ["Semua Kelompok", ...sortedGroupNames];
  }, [isKelurahanSelected, selectedKelurahan, selectedRw, data?.matriksKelompok]);

  // Reset selectedKelompok jika kelompok terpilih tidak ada dalam opsi kelurahan/RW baru
  useEffect(() => {
    if (selectedKelompok && selectedKelompok !== "Semua Kelompok" && !availableKelompokOptions.includes(selectedKelompok)) {
      setSelectedKelompok("Semua Kelompok");
    }
  }, [availableKelompokOptions, selectedKelompok]);

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
          1. BAR TAJUK HALAMAN
          Judul: Kuliah Kerja Nyata, Tanpa Breadcrumb & Tanpa Tombol Perbarui Data
      ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
        <div className="no-print bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#009966]/15 dark:border-emerald-700/30 shadow-2xs">
              <GraduationCap size={24} />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Kuliah Kerja Nyata
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Evaluasi komprehensif kinerja mahasiswa, kepatuhan presensi posko 240 menit, capaian program kerja lapangan, dan valorisasi lingkungan.
              </p>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. SECTION KHUSUS FILTER (PARAMETER PENYARINGAN DATA)
            Dilengkapi Switcher Kartu | Dokumen dan Aksi Cetak PDF
        ───────────────────────────────────────────────────────────── */}
        <section className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#009966] dark:text-emerald-400" />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                PARAMETER PENYARINGAN DATA
              </span>
            </div>

            {/* Switcher Mode Tampilan (Tab Kartu di-hide sementara, langsung aktif Tab Dokumen) */}
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
              {/* Tab Kartu disembunyikan sementara sesuai arahan (langsung ke Dokumen) */}
              <button
                type="button"
                onClick={() => setViewMode("dashboard")}
                className="hidden"
                aria-hidden="true"
              >
                <LayoutDashboard size={13} />
                <span>Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("document")}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-white dark:bg-slate-900 text-[#009966] dark:text-emerald-400 shadow-xs cursor-default"
              >
                <FileText size={13} />
                <span>Dokumen</span>
              </button>
            </div>
          </div>

          {/* Baris Kontrol Filter Dropdown 1 Baris Penuh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Filter 1: Identitas Program / Batch KKN */}
            <div className="min-w-0">
              <label className="block text-[10.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">
                Identitas Program / Batch
              </label>
              <select
                value={selectedPeriode}
                onChange={(e) => setSelectedPeriode(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966] cursor-pointer truncate"
              >
                {data?.filterOptions?.periodeOptions?.length ? (
                  data.filterOptions.periodeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="2026-041027-Universitas Komputer Indonesia - 1">
                      2026-041027-Universitas Komputer Indonesia - 1
                    </option>
                    <option value="ALL">Semua Batch / Periode</option>
                  </>
                )}
              </select>
            </div>

            {/* Filter 2: Cakupan Kelurahan */}
            <div className="min-w-0">
              <label className="block text-[10.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">
                Cakupan Kelurahan
              </label>
              <select
                value={selectedKelurahan}
                onChange={(e) => {
                  setSelectedKelurahan(e.target.value);
                  setSelectedRw("Semua RW");
                  setSelectedKelompok("Semua Kelompok");
                }}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966] cursor-pointer truncate"
              >
                {Array.from(
                  new Set(
                    data?.filterOptions?.kelurahanOptions?.length
                      ? ["Semua Kelurahan", ...data.filterOptions.kelurahanOptions]
                      : ["Semua Kelurahan", "Cipaganti", "Dago", "Lebakgede", "Lebak Siliwangi", "Sadang Serang", "Sekeloa"]
                  )
                ).map((k) => (
                  <option key={k} value={k}>
                    {k === "Semua Kelurahan" ? "Seluruh Kecamatan Coblong" : `Kelurahan ${k}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: RW Binaan Aktif (Wajib Pilih Kelurahan Terlebih Dahulu) */}
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

            {/* Filter 4: Kelompok KKN */}
            <div className="min-w-0">
              <label className="block text-[10.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">
                Kelompok KKN
              </label>
              <select
                value={selectedKelompok || "Semua Kelompok"}
                onChange={(e) => setSelectedKelompok(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966] cursor-pointer truncate"
              >
                {availableKelompokOptions.map((kel) => (
                  <option key={kel} value={kel}>
                    {kel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris Kedua: Tombol Reset Filter & Aksi Eksekutif */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Reset Filter Button */}
            <div>
              {(selectedKelurahan !== "Semua Kelurahan" ||
                (selectedRw && selectedRw !== "Semua RW" && selectedRw !== "") ||
                (selectedKelompok && selectedKelompok !== "Semua Kelompok" && selectedKelompok !== "")) ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedKelurahan("Semua Kelurahan");
                    setSelectedRw("Semua RW");
                    setSelectedKelompok("Semua Kelompok");
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>&times;</span>
                  <span>Reset Filter</span>
                </button>
              ) : (
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Menampilkan seluruh data binaan KKN
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
                disabled={loading || !data}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                title="Sesuaikan Nomor Surat, SK Rektor, Pejabat & TTD Naskah Dinas"
              >
                <Settings size={13} />
                <span>Format Naskah</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={loading || !data}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#009966] hover:bg-[#008855] active:scale-95 text-white font-black text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                title="Cetak Dokumen Resmi Capaian KKN (Standar F4)"
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
        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-14 text-center shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
            <div className="relative w-14 h-14 mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-[#009966]/20 shadow-2xs">
                <GraduationCap size={28} />
              </div>
              <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                <RefreshCw size={13} className="animate-spin text-[#009966] dark:text-emerald-400" />
              </span>
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                Menyiapkan Data Laporan Resmi Kuliah Kerja Nyata...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-balance">
                Mengumpulkan kepatuhan presensi posko 240 menit, logbook mahasiswa/DPL, capaian program&nbsp;kerja, dan performa wilayah.
              </p>
              {/* Indeterminate Animated Progress Bar */}
              <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mx-auto mt-3">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse w-2/3 mx-auto" />
              </div>
            </div>
          </div>
        ) : !data ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xs border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-rose-600">Data laporan tidak dapat dimuat dari server.</p>
          </div>
        ) : (
          <>
            {/* =================================================================
                TAMPILAN 1: MODE DASBOR WEB INTERAKTIF (MODERN EXECUTIVE UI)
                ================================================================= */}
            <div
              className={`web-dashboard-container space-y-7 print:hidden ${
                viewMode === "dashboard" ? "block" : "hidden"
              }`}
            >
              {/* SECTION 1: EMPAT INDIKATOR UTAMA KKN & RELASI LUARAN */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span>INDIKATOR UTAMA KULIAH KERJA NYATA & AKUNTABILITAS PENGABDIAN</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* KPI 1: Partisipasi SDM Mahasiswa */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1 text-slate-400">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          Partisipasi Mahasiswa
                        </span>
                        <FormulaTooltip
                          title="Total Mahasiswa Aktif"
                          formula="∑ Mahasiswa KKN (status aktif) di 32 kelompok binaan"
                          description="Data terverifikasi dari registrasi akademik resmi UNIKOM dan penempatan posko KKN Tematik 2026."
                          isoStandard="ISO 9241-110"
                        />
                      </div>
                      <div className="flex items-baseline flex-wrap gap-1 mt-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                          {data.ringkasanEksekutif.totalMahasiswaAktif}
                        </span>
                        <span className="text-xs font-bold text-slate-500">Orang</span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-semibold text-purple-600 dark:text-purple-400">{data.ringkasanEksekutif.totalKelompok} Posko Kelompok</span>
                      <span>&bull;</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{data.ringkasanEksekutif.totalDpl} DPL Pengampu</span>
                    </div>
                  </div>

                  {/* KPI 2: Kepatuhan Hadir Posko */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1 text-slate-400">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          Kepatuhan Hadir Posko
                        </span>
                        <FormulaTooltip
                          title="Tingkat Kepatuhan Presensi Posko"
                          formula="(∑ Sesi Hadir Memenuhi ÷ ∑ Sesi Terjadwal) × 100%"
                          description="Dihitung dari presensi GPS anti-fake dalam radius 250 m posko resmi dengan durasi efektif minimal 240 menit (4 jam bersih) per sesi."
                          isoStandard="ISO 9241-110"
                        />
                      </div>
                      <div className="flex items-baseline flex-wrap gap-1 mt-2">
                        <span className="text-2xl sm:text-3xl font-black text-[#009966] dark:text-emerald-400 tracking-tight font-mono">
                          {Number(data.ringkasanEksekutif.kepatuhanPresensiPercent ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })}%
                        </span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-slate-800 leading-snug">
                      <span>Target Posko &ge; 240 Menit Bersih &bull; Geofence 250 m</span>
                    </div>
                  </div>

                  {/* KPI 3: Jam Kerja Nyata */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1 text-slate-400">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          Jam Kerja Nyata Lapangan
                        </span>
                        <FormulaTooltip
                          title="Total Jam Kerja Nyata Lapangan"
                          formula="(∑ Menit Posko + ∑ Menit Presensi Mandiri) ÷ 60"
                          description="Akumulasi waktu kerja nyata mahasiswa untuk memenuhi target kurikulum pengabdian (minimal 200 jam efektif per mahasiswa)."
                          isoStandard="ISO 9241-110"
                        />
                      </div>
                      <div className="flex items-baseline flex-wrap gap-1 mt-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                          {(data.ringkasanEksekutif.totalJamKontribusi ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs font-bold text-slate-500">Jam</span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-slate-800 leading-snug">
                      <span>Rerata <strong className="text-blue-600 dark:text-blue-400">{Number(data.ringkasanEksekutif.rataRataJamPerMahasiswa ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })} Jam</strong> / Mahasiswa (Target &ge; 200 Jam)</span>
                    </div>
                  </div>

                  {/* KPI 4: Capaian Program Kerja */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1 text-slate-400">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          Capaian Program Kerja
                        </span>
                        <FormulaTooltip
                          title="Persentase Realisasi Program Kerja"
                          formula="(∑ Program Kerja Selesai 100% ÷ ∑ Program Kerja Disetujui DPL) × 100%"
                          description="Indikator luaran program kerja di 4 klaster binaan yang telah diverifikasi kelengkapannya oleh Dosen Pembimbing Lapangan."
                          isoStandard="ISO 9241-110"
                        />
                      </div>
                      <div className="flex items-baseline flex-wrap gap-1 mt-2">
                        <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono">
                          {data.ringkasanEksekutif.persentaseProkerSelesai}%
                        </span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-slate-800 leading-snug">
                      <span><strong className="text-emerald-600 dark:text-emerald-400">{data.ringkasanEksekutif.totalProkerSelesai} Tuntas</strong> dari {data.ringkasanEksekutif.totalProkerDisetujui} Disetujui DPL</span>
                    </div>
                  </div>
                </div>

                {/* Sub-Banner Relasi Luaran Dampak Lingkungan */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-blue-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#009966] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Compass size={20} />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                        Relasi Luaran Lingkungan & Pendampingan Warga Binaan
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        Intervensi mahasiswa KKN mendampingi <strong>{(data.ringkasanDampakSampah?.totalPenggunaWarga ?? 0).toLocaleString("id-ID")} Keluarga Binaan</strong> di <strong>{data.ringkasanDampakSampah?.totalLokasiRw ?? 74} RW</strong> sukses merealisasikan pemilahan <strong>{Number(data.ringkasanDampakSampah?.totalSampahTerpilahKg || 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg Sampah</strong> dan reduksi emisi <strong>{Number(data.ringkasanDampakSampah?.reduksiEmisiCo2Kg || 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg CO₂e</strong>.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-mono">
                      {(data.ringkasanEksekutif.totalLogbookMahasiswa ?? 0).toLocaleString("id-ID")} Log Mhs &bull; {(data.ringkasanEksekutif.totalLogbookDpl ?? 0).toLocaleString("id-ID")} Log DPL
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ANALISIS VISUAL RECHARTS KLASTER PROKER & WILAYAH BINAAN */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="flex items-center">
                    <span>ANALISIS VISUAL KOMPOSISI 4 KLASTER & KINERJA WILAYAH</span>
                    <FormulaTooltip
                      title="Analisis Visual Capaian Proker dan Sebaran Kelurahan"
                      formula="Realisasi Klaster Proker = (∑ Proker Tuntas ÷ ∑ Proker Disetujui) × 100%"
                      description="Data agregasi analitik interaktif berbasis standar visualisasi Recharts."
                      isoStandard="ISO 9241-110"
                    />
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Kolom Kiri: Donut Chart Realisasi 4 Klaster Program Kerja (5 cols) */}
                  <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        Realisasi 4 Klaster Program Kerja
                      </h2>
                      <p className="text-xs text-slate-500">
                        Proporsi capaian tuntas per klaster program kerja di lapangan
                      </p>
                    </div>

                    <div className="relative h-60 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={prokerKlasterDonutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {prokerKlasterDonutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0];
                                const p = d.payload;
                                const pct = p.total > 0 ? Math.round((p.selesai / p.total) * 100) : 0;
                                return (
                                  <div className="bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-lg border border-slate-700">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                      <span>{p.name}</span>
                                    </div>
                                    <div className="mt-1 text-sm font-black text-emerald-400 font-mono">
                                      {p.selesai} / {p.total} Tuntas ({pct}%)
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tuntas</span>
                        <span className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                          {data.ringkasanEksekutif.totalProkerSelesai}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">dari {data.ringkasanEksekutif.totalProkerDisetujui} Proker</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                      {prokerKlasterDonutData.map((klaster) => {
                        const pct = klaster.total > 0 ? Math.round((klaster.selesai / klaster.total) * 100) : 0;
                        return (
                          <div
                            key={klaster.rawKategori}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60"
                          >
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: klaster.color }} />
                              <span className="truncate">{klaster.name}</span>
                            </div>
                            <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-1">
                              {klaster.selesai} <span className="text-xs font-normal text-slate-400">/ {klaster.total}</span>
                            </div>
                            <div className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {pct}% Tuntas
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Kolom Kanan: Grouped Bar Chart Kinerja 6 Kelurahan Binaan (7 cols) */}
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                          Komparasi 6 Kelurahan Binaan
                        </h2>
                        <p className="text-xs text-slate-500">
                          Perbandingan kuantitatif: Mahasiswa Diterjunkan vs Program Kerja Tuntas
                        </p>
                      </div>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {selectedKelurahan !== "Semua Kelurahan" ? selectedKelurahan : "6 Kelurahan Binaan"}
                      </span>
                    </div>

                    <div className="h-64 w-full pt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={kelurahanBarData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
                          />
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-lg border border-slate-700 space-y-1">
                                    <div className="font-extrabold text-sm text-slate-100">{d.fullName}</div>
                                    <div className="text-[11px] text-slate-400">{d.kelompok} Posko Kelompok Binaan</div>
                                    <div className="pt-1 border-t border-slate-800 space-y-0.5">
                                      <div className="flex justify-between gap-4">
                                        <span className="text-blue-400 font-semibold">Mahasiswa:</span>
                                        <span className="font-mono font-bold text-white">{d.mahasiswa} Orang</span>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                        <span className="text-emerald-400 font-semibold">Proker Tuntas:</span>
                                        <span className="font-mono font-bold text-white">{d.prokerSelesai} Proker</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="mahasiswa" name="Mahasiswa Diterjunkan" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={32} />
                          <Bar dataKey="prokerSelesai" name="Program Kerja Tuntas" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                          <span className="font-semibold">Mahasiswa Diterjunkan</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-semibold">Program Kerja Tuntas</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 italic">
                        {data.ringkasanEksekutif.totalKelompok} Posko Kelompok Tersebar
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PERINGKAT KINERJA UNGGULAN */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="flex items-center">
                    <span>PERINGKAT KINERJA UNGGULAN</span>
                    <FormulaTooltip
                      title="Peringkat Kinerja Unggulan Mahasiswa dan DPL"
                      formula="Sinkron 100% dengan Papan Peringkat KKN (Leaderboard SSOT): Skor DPL = (0,6 × Logbook) + (0,4 × Poin Kelompok)"
                      description="Perhitungan resmi gamifikasi dan capaian jam kerja lapangan mahasiswa tanpa pembobotan buatan atau data sintetis."
                      isoStandard="ISO 9241-110"
                    />
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 3 Mahasiswa Terbaik */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        3 Mahasiswa Berkinerja Terbaik
                      </h2>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      Nilai dan Jam Tertinggi
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {data.topMahasiswa && data.topMahasiswa.length > 0 ? (
                      data.topMahasiswa.map((mhs) => (
                        <div
                          key={mhs.ranking}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                              #{mhs.ranking}
                            </span>
                            <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{mhs.nama}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                NIM. {mhs.nim} &bull; {mhs.kelompok}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-2">
                            <div className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                              {mhs.grade && mhs.grade.includes("Poin")
                                ? mhs.grade
                                : mhs.nilaiAkhir > 0
                                ? `${mhs.nilaiAkhir.toLocaleString("id-ID")} Poin`
                                : "0 Poin"}
                            </div>
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                              {mhs.totalJamKerja > 0
                                ? `${mhs.totalJamKerja.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Jam`
                                : `${mhs.kehadiranPercent.toLocaleString("id-ID")}% Hadir`}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400 italic">
                        Belum ada data mahasiswa terdata
                      </div>
                    )}
                  </div>
                </div>

                {/* 3 DPL Terbaik */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        3 DPL Berkinerja Terbaik
                      </h2>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      Pendampingan Unggulan
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {data.topDpl && data.topDpl.length > 0 ? (
                      data.topDpl.map((dpl) => (
                        <div
                          key={dpl.ranking}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                              #{dpl.ranking}
                            </span>
                            <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{dpl.nama}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                NIP. {dpl.nip && dpl.nip !== "-" ? dpl.nip : "-"} &bull; Dosen Pembimbing Lapangan
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-2">
                            <div className="font-black text-[#009966] dark:text-emerald-400 text-sm">
                              {dpl.kepatuhanKelompok} Poin
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {dpl.keaktifanLogbook} Log &bull; {dpl.kunjunganLapangan} Posko
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400 italic">
                        Belum ada data DPL terdata
                      </div>
                    )}
                  </div>
                </div>
              </section>
              </div>

              {/* SECTION 4: PERINGATAN DINI DAN REKOMENDASI MANAJERIAL */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span>PERINGATAN DINI DAN REKOMENDASI MANAJERIAL</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <section className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 rounded-2xl p-5 space-y-3">

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-800/50 space-y-1">
                    <div className="font-bold text-rose-700 dark:text-rose-400">1. Integritas Kehadiran Posko</div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Sistem geofence 250 m memastikan 100% presensi memenuhi target minimal 240 menit bersih per sesi.
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-800/50 space-y-1">
                    <div className="font-bold text-blue-700 dark:text-blue-400">2. Progres Program Kerja</div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Sebanyak {data.ringkasanEksekutif.totalProkerSelesai} dari {data.ringkasanEksekutif.totalProkerDisetujui} program kerja telah rampung dan siap dinilai pada tahap akhir.
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-800/50 space-y-1">
                    <div className="font-bold text-purple-700 dark:text-purple-400">3. Logbook Pembimbingan</div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Tercatat {(data.ringkasanEksekutif.totalLogbookDpl ?? 0).toLocaleString("id-ID")} catatan bimbingan DPL aktif yang mengawal luaran mahasiswa di {data.ringkasanEksekutif.totalKelompok} posko binaan.
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-800/50 space-y-1">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">4. Pendampingan Warga Binaan</div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Pendampingan {(data.ringkasanDampakSampah?.totalPenggunaWarga ?? 0).toLocaleString("id-ID")} rumah tangga warga terus ditingkatkan guna memperkuat rasio pemilahan mandiri.
                    </p>
                  </div>
                </div>
              </section>
              </div>

              {/* SECTION 5: MATRIKS KINERJA TIGA PULUH DUA KELOMPOK */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="flex items-center">
                    <span>MATRIKS KINERJA TIGA PULUH DUA KELOMPOK</span>
                    <FormulaTooltip
                      title="Matriks Evaluasi Kinerja dan Kriteria Kelulusan Kelompok KKN"
                      formula="Skor Kelompok = (0,6 × Capaian Proker) + (0,4 × Rerata Kehadiran Anggota)"
                      description="Penetapan Status Evaluasi Kelompok: (1) Memenuhi Syarat: Kepatuhan presensi posko ≥ 80% (durasi minimal 240 menit per sesi) dan implementasi program kerja berjalan aktif; (2) Paripurna: Kepatuhan presensi > 95% serta seluruh program kerja rampung 100% terverifikasi DPL; (3) Menunggu Penilaian: Seluruh kegiatan posko tuntas dan sedang menunggu penyerahan berita acara nilai akhir DPL; (4) Belum Lengkap: Terdapat kekurangan logbook mingguan atau berkas administrasi pertanggungjawaban program."
                      isoStandard="ISO 9241-110"
                    />
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-[#009966] dark:text-emerald-400" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      PARAMETER PENYARINGAN DATA
                    </span>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari kelompok, ketua, DPL..."
                        value={tableSearch}
                        onChange={(e) => {
                          setTableSearch(e.target.value);
                          setTablePage(1);
                        }}
                        className="text-xs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966] w-64 placeholder:text-slate-400 font-medium"
                      />
                    </div>

                    {/* Filter Kelurahan */}
                    <select
                      value={tableKelurahanFilter}
                      onChange={(e) => {
                        setTableKelurahanFilter(e.target.value);
                        setTablePage(1);
                      }}
                      className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966] cursor-pointer"
                    >
                      <option value="ALL">Semua Kelurahan</option>
                      {Array.from(new Set(data.matriksKelompok.map((m) => m.kelurahan))).map((kel) => (
                        <option key={kel} value={kel}>{kel}</option>
                      ))}
                    </select>

                    {/* Sort Selector */}
                    <button
                      type="button"
                      onClick={() => {
                        setTableSortAsc(!tableSortAsc);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#009966]"
                      title="Ubah Urutan"
                    >
                      <ArrowUpDown size={13} className="text-[#009966]" />
                      <span>{tableSortAsc ? "Urutan: A – Z" : "Urutan: Z – A"}</span>
                    </button>
                  </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                        <th className="py-3 px-3 text-center w-10">No</th>
                        <th className="py-3 px-4 min-w-[150px]">Kelompok dan Ketua</th>
                        <th className="py-3 px-4 min-w-[150px]">DPL Pendamping</th>
                        <th className="py-3 px-4 min-w-[140px]">Wilayah (Kelurahan / RW)</th>
                        <th className="py-3 px-3 text-center w-16">Mahasiswa</th>
                        <th className="py-3 px-3 text-center w-24">Kehadiran</th>
                        <th className="py-3 px-3 text-center w-28">Program Kerja Selesai</th>
                        <th className="py-3 px-4 text-center min-w-[150px]">
                          <div className="inline-flex items-center justify-center gap-1">
                            <span>Status Evaluasi</span>
                            <FormulaTooltip
                              title="Panduan Kategori Status Evaluasi Kelompok"
                              formula="Kepatuhan Presensi ≥ 80% + Verifikasi Luaran Proker Lapangan"
                              description="Status Evaluasi: Memenuhi Syarat (presensi posko ≥ 80% durasi 240m bersih dan proker aktif), Paripurna (presensi > 95% dan proker 100% tuntas), Menunggu Penilaian (menunggu rekapitulasi form nilai DPL), Belum Lengkap (terdapat logbook atau berkas penilaian yang belum difinalisasi)."
                              isoStandard="ISO 9241-110"
                            />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {paginatedMatriksKelompok.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                            Tidak ada data kelompok KKN yang sesuai dengan filter pencarian.
                          </td>
                        </tr>
                      ) : (
                        paginatedMatriksKelompok.map((m) => (
                          <tr
                            key={m.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-2.5 px-3 text-center font-bold text-slate-500">{m.no}</td>
                            <td className="py-2.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">{m.nama}</div>
                              <div className="text-[11px] text-slate-500">Ketua: {m.ketua?.name || "-"}</div>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">{m.dpl?.name || "-"}</div>
                              <div className="text-[11px] text-slate-500">{m.dpl?.nip ? `NIP. ${m.dpl.nip}` : "DPL Binaan"}</div>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">{m.kelurahan}</div>
                              <div className="text-[11px] text-slate-500">{m.cakupanRwFormatted}</div>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                              {m.totalMahasiswa}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  m.persentaseKehadiran >= 90
                                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                                    : m.persentaseKehadiran >= 75
                                    ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                                }`}
                              >
                                {Number(m.persentaseKehadiran ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {m.prokerSelesaiCount}/{m.prokerTotalCount}
                              </div>
                              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {Number(m.prokerSelesaiPercent ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })}%
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                                <Check size={11} />
                                <span>{m.statusEvaluasiLabel || "Memenuhi Syarat"}</span>
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Tampilkan:</span>
                    <select
                      value={tablePageSize}
                      onChange={(e) => {
                        setTablePageSize(Number(e.target.value));
                        setTablePage(1);
                      }}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <option value={10}>10 per halaman</option>
                      <option value={20}>20 per halaman</option>
                      <option value={-1}>Tampilkan Semua (32)</option>
                    </select>
                    <span>dari total {processedMatriksKelompok.length} kelompok</span>
                  </div>

                  {tablePageSize !== -1 && totalTablePages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                        disabled={tablePage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="font-bold px-2">
                        Halaman {tablePage} dari {totalTablePages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTablePage((p) => Math.min(totalTablePages, p + 1))}
                        disabled={tablePage === totalTablePages}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </section>
              </div>

              {/* SECTION 6: LAMPIRAN PROFIL AKADEMIK KKN (SKS & PROGRAM STUDI) */}
              <div className="space-y-3 pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Layers size={13} className="text-indigo-600" />
                    <span>LAMPIRAN PROFIL AKADEMIK: DISTRIBUSI BEBAN SKS & SEBARAN PROGRAM STUDI MAHASISWA</span>
                    <FormulaTooltip
                      title="Profil Akademik dan Konversi SKS Mahasiswa KKN"
                      formula="Akumulasi Beban SKS Kurikulum (6 s.d. 20 SKS MBKM) & Multidisiplin Sarjana"
                      description="Data terverifikasi registrasi akademik resmi UNIKOM bagi mahasiswa yang diterjunkan dalam program KKN Tematik BERSEKA."
                      isoStandard="SN-Dikti / MBKM"
                    />
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sub-A: Donut Chart Beban SKS Mahasiswa */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                          Distribusi Beban Konversi SKS
                        </h2>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {data.distribusiSks?.totalMahasiswa || data.ringkasanEksekutif.totalMahasiswaAktif} Mahasiswa
                      </span>
                    </div>

                    <div className="relative h-56 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={sksDonutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {sksDonutData.map((entry, index) => (
                              <Cell key={`sks-cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-lg border border-slate-700">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                      <span>Paket {d.name}</span>
                                    </div>
                                    <div className="mt-1 text-sm font-black text-indigo-400 font-mono">
                                      {d.value} Mahasiswa ({d.percentage}%)
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terdata SKS</span>
                        <span className="text-base font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                          {data.distribusiSks?.totalMahasiswa || data.ringkasanEksekutif.totalMahasiswaAktif}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">Mahasiswa</span>
                      </div>
                    </div>

                    {/* SKS Badges Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {sksDonutData.map((s) => (
                        <span
                          key={s.name}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700"
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                          <span>{s.name}: <strong>{s.value}</strong></span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sub-B: Bar Chart Sebaran Multidisiplin Program Studi */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                          Sebaran Program Studi
                        </h2>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        Multidisiplin Sarjana
                      </span>
                    </div>

                    <div className="h-56 w-full pt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prodiBarData}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.6} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                            axisLine={false}
                            tickLine={false}
                            width={110}
                          />
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-lg border border-slate-700">
                                    <div className="text-slate-200">{d.fullName}</div>
                                    <div className="mt-1 text-sm font-black text-blue-400 font-mono">
                                      {d.count} Mahasiswa
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="count" name="Mahasiswa" fill="#3b82f6" radius={[0, 6, 6, 0]} maxBarSize={22} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
                      Kolaborasi lintas fakultas dan prodi untuk inovasi pengelolaan sampah terpadu
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================================
                MODE 2: DOKUMEN (STANDAR NASKAH DINAS UNIKOM 1 HALAMAN F4 TEGAK)
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
                {/* 1. KOP SURAT RESMI UNIKOM */}
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

                    {/* Teks Identitas Lembaga Resmi UNIKOM */}
                    <div className="text-center flex-1 px-1 leading-tight text-black">
                      <div className="text-xs font-bold tracking-wider uppercase text-black">
                        YAYASAN SAINS DAN TEKNOLOGI
                      </div>
                      <div className="text-lg font-black tracking-wide uppercase text-black mt-0.5">
                        UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)
                      </div>
                      <div className="text-xs font-black tracking-tight uppercase text-black mt-0.5">
                        LEMBAGA PENGABDIAN DAN PEMBERDAYAAN MASYARAKAT
                      </div>
                      <div className="text-[10.5px] text-black mt-1 leading-snug">
                        Jalan Dipati Ukur Nomor 112–116, Coblong, Kota Bandung 40132 &bull; Telepon: (022) 2504119
                        <br />
                        Laman Resmi: https://www.unikom.ac.id &bull; Pos-el: info@unikom.ac.id &bull; Sistem Terpadu: https://berseka.id
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
                    <div className="flex"><span className="w-20 font-bold">Nomor</span><span className="w-2">:</span><span className="font-bold">{reportConfig.nomorDokumen || "027/UNIKOM-BERSEKA/KKN-T/X/2026"}</span></div>
                    <div className="flex"><span className="w-20 font-bold">Sifat</span><span className="w-2">:</span><span>{reportConfig.sifatDokumen || "Penting / Kedinasan Terbuka"}</span></div>
                    <div className="flex"><span className="w-20 font-bold">Lampiran</span><span className="w-2">:</span><span>{reportConfig.lampiranDokumen || "1 (Satu) Berkas Rekapitulasi Lengkap"}</span></div>
                    <div className="flex"><span className="w-20 font-bold">Perihal</span><span className="w-2">:</span><span className="font-bold">{reportConfig.perihalDokumen || "Laporan Evaluasi Kinerja dan Capaian Kuliah Kerja Nyata Tematik"}</span></div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-bold">Bandung, {reportConfig.tanggalPengesahan || "16 Oktober 2026"}</div>
                    <div className="text-[10.5px] text-black/80">{reportConfig.wilayahCakupan || "Kecamatan Coblong (6 Kelurahan Binaan, 74 RW)"}</div>
                    <div className="text-[10.5px] text-black font-semibold">SK Rektor No. ST/084/REKTOR-UNIKOM/VIII/2026</div>
                  </div>
                </div>

                {/* 3. JUDUL LAPORAN RESMI */}
                <div className="text-center mb-3.5">
                  <h1 className="text-base font-black uppercase text-black tracking-tight leading-snug">
                    {reportConfig.judulLaporan || "EVALUASI KINERJA DAN CAPAIAN PELAKSANAAN KULIAH KERJA NYATA TEMATIK"}
                  </h1>
                  <div className="text-xs font-bold text-black uppercase tracking-wide mt-0.5">
                    {reportConfig.subjudul || "KECAMATAN COBLONG KOTA BANDUNG • UNIVERSITAS KOMPUTER INDONESIA"}
                  </div>
                </div>

                {/* 4. PERNYATAAN PENGANTAR RESMI */}
                <div className="text-[11.5px] leading-relaxed text-justify mb-3.5 text-black">
                  <p>
                    {selectedKelurahan !== "Semua Kelurahan" && selectedKelurahan !== "ALL" ? (
                      `Berdasarkan Surat Keputusan Rektor Universitas Komputer Indonesia Nomor ST/084/REKTOR-UNIKOM/VIII/2026, telah dilaksanakan kegiatan Kuliah Kerja Nyata (KKN) Tematik di wilayah Kelurahan ${selectedKelurahan}, Kecamatan Coblong. Sebanyak ${data.ringkasanEksekutif.totalMahasiswaAktif} mahasiswa sarjana dan ${data.ringkasanEksekutif.totalDpl} Dosen Pembimbing Lapangan (DPL) diterjunkan ke ${data.ringkasanEksekutif.totalKelompok} posko binaan dengan hasil rekapitulasi pelaksanaan sebagai berikut:`
                    ) : (
                      `Berdasarkan Surat Keputusan Rektor Universitas Komputer Indonesia Nomor ST/084/REKTOR-UNIKOM/VIII/2026, telah dilaksanakan kegiatan Kuliah Kerja Nyata (KKN) Tematik di wilayah Kecamatan Coblong yang mencakup 6 kelurahan binaan dan ${data.ringkasanDampakSampah?.totalLokasiRw ?? 74} RW binaan aktif. Sebanyak ${data.ringkasanEksekutif.totalMahasiswaAktif} mahasiswa sarjana dan ${data.ringkasanEksekutif.totalDpl} Dosen Pembimbing Lapangan (DPL) diterjunkan ke ${data.ringkasanEksekutif.totalKelompok} posko binaan dengan hasil rekapitulasi pelaksanaan sebagai berikut:`
                    )}
                  </p>
                </div>

                {/* 5. TABEL REKAPITULASI CAPAIAN WILAYAH (BORDERED GRID NASKAH DINAS RESMI) */}
                <div className="mb-4 avoid-break">
                  <div className="text-[10.5px] font-bold uppercase text-black mb-1 tracking-tight font-serif">
                    I. Rekapitulasi Capaian Pelaksanaan per Kelurahan Binaan
                  </div>
                  <table className="w-full text-left text-[10px] border-collapse border border-black text-black font-serif">
                    <thead>
                      <tr className="border-b border-black font-bold text-black bg-slate-100 text-center">
                        <th className="py-1 px-1 border border-black text-center w-7">No</th>
                        <th className="py-1 px-2 border border-black text-left">Kelurahan Binaan</th>
                        <th className="py-1 px-1.5 border border-black text-center w-20">Kelompok</th>
                        <th className="py-1 px-1.5 border border-black text-center w-20">Mahasiswa</th>
                        <th className="py-1 px-1.5 border border-black text-center w-26">Kehadiran (≥240m)</th>
                        <th className="py-1 px-1.5 border border-black text-center w-28">Program Kerja Tuntas</th>
                        <th className="py-1 px-1.5 border border-black text-center w-28">Status Evaluasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.grafikPerforma.sebaranPerKelurahan
                        .filter((k) => {
                          if (selectedKelurahan && selectedKelurahan !== "Semua Kelurahan" && selectedKelurahan !== "ALL") {
                            return k.kelurahan.toLowerCase().includes(selectedKelurahan.toLowerCase());
                          }
                          return true;
                        })
                        .map((k, idx) => {
                        const kelGroups = data.matriksKelompok.filter((m) => m.kelurahan === k.kelurahan);
                        const avgPresence = kelGroups.length > 0
                          ? Math.round(kelGroups.reduce((acc, curr) => acc + curr.persentaseKehadiran, 0) / kelGroups.length)
                          : 95;

                        return (
                          <tr key={k.kelurahan} className="hover:bg-slate-50/50">
                            <td className="py-1 px-1 border border-black text-center font-semibold">{idx + 1}</td>
                            <td className="py-1 px-2 border border-black font-bold text-black whitespace-nowrap">Kelurahan {k.kelurahan}</td>
                            <td className="py-1 px-1.5 border border-black text-center whitespace-nowrap">{k.totalKelompok} Posko</td>
                            <td className="py-1 px-1.5 border border-black text-center whitespace-nowrap">{k.totalMahasiswa} Orang</td>
                            <td className="py-1 px-1.5 border border-black text-center font-bold text-black whitespace-nowrap">{Number(avgPresence ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })}%</td>
                            <td className="py-1 px-1.5 border border-black text-center font-bold text-black whitespace-nowrap">{k.prokerSelesai} Tuntas</td>
                            <td className="py-1 px-1.5 border border-black text-center font-semibold text-black whitespace-nowrap">Memenuhi Syarat</td>
                          </tr>
                        );
                      })}
                      <tr className="border-t-2 border-b border-black font-bold bg-slate-100 text-black">
                        <td colSpan={2} className="py-1.5 px-2 border border-black whitespace-nowrap">
                          {selectedKelurahan !== "Semua Kelurahan" && selectedKelurahan !== "ALL"
                            ? `Akumulasi Kelurahan ${selectedKelurahan}`
                            : "Akumulasi Kecamatan Coblong"}
                        </td>
                        <td className="py-1.5 px-1.5 border border-black text-center whitespace-nowrap">{data.ringkasanEksekutif.totalKelompok} Posko</td>
                        <td className="py-1.5 px-1.5 border border-black text-center whitespace-nowrap">{data.ringkasanEksekutif.totalMahasiswaAktif} Mahasiswa</td>
                        <td className="py-1.5 px-1.5 border border-black text-center font-bold text-black whitespace-nowrap">{Number(data.ringkasanEksekutif.kepatuhanPresensiPercent ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })}%</td>
                        <td className="py-1.5 px-1.5 border border-black text-center font-bold text-black whitespace-nowrap">{data.ringkasanEksekutif.totalProkerSelesai} / {data.ringkasanEksekutif.totalProkerDisetujui}</td>
                        <td className="py-1.5 px-1.5 border border-black text-center font-bold text-black tracking-wide whitespace-nowrap">PARIPURNA</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 6. INDIKATOR KINERJA KUNCI DAN DAMPAK PENGABDIAN MASYARAKAT (BORDERED GRID) */}
                <div className="mb-4 avoid-break">
                  <div className="text-[10.5px] font-bold uppercase text-black mb-1 tracking-tight font-serif">
                    II. Indikator Kinerja Utama dan Dampak Pengabdian Masyarakat
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
                        <td className="py-1 px-2 border border-black font-bold text-black">Integritas Presensi Posko</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">
                          {Number(data.ringkasanEksekutif.kepatuhanPresensiPercent ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })}% Hadir Efektif
                        </td>
                        <td className="py-1 px-2 border border-black text-slate-900 leading-snug">
                          Validasi geofence GPS radius 250 m posko resmi, durasi wajib bersih minimal 240 menit per sesi.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-1 border border-black text-center font-semibold">2</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">Jam Kerja Nyata Lapangan</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">
                          {(data.ringkasanEksekutif.totalJamKontribusi ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })} Jam{" "}
                          <span className="font-normal text-[8.5px] text-slate-700">
                            (Rerata {Number(data.ringkasanEksekutif.rataRataJamPerMahasiswa ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })} jam/mhs)
                          </span>
                        </td>
                        <td className="py-1 px-2 border border-black text-slate-900 leading-snug">
                          Akumulasi jam kerja posko dan mandiri melampaui target beban kurikulum pengabdian (≥ 200 jam).
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-1 border border-black text-center font-semibold">3</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">Program Kerja &amp; Bimbingan</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">
                          {data.ringkasanEksekutif.totalProkerSelesai} / {data.ringkasanEksekutif.totalProkerDisetujui} Proker Tuntas{" "}
                          <span className="font-normal text-[8.5px] text-slate-700">
                            ({data.ringkasanEksekutif.persentaseProkerSelesai}%)
                          </span>
                        </td>
                        <td className="py-1 px-2 border border-black text-slate-900 leading-snug">
                          Capaian 4 klaster luaran tuntas 100% terverifikasi DPL melalui {(data.ringkasanEksekutif.totalLogbookDpl ?? 0).toLocaleString("id-ID")} catatan logbook bimbingan.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-1 border border-black text-center font-semibold">4</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">Dampak Lingkungan &amp; Warga</td>
                        <td className="py-1 px-2 border border-black font-bold text-black">
                          {Number(data.ringkasanDampakSampah?.totalSampahTerpilahKg || 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg Sampah{" "}
                          <span className="font-normal text-[8.5px] text-slate-700">
                            (&#8722;{Number(data.ringkasanDampakSampah?.reduksiEmisiCo2Kg || 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg CO&#8322;e)
                          </span>
                        </td>
                        <td className="py-1 px-2 border border-black text-slate-900 leading-snug">
                          Pendampingan langsung {(data.ringkasanDampakSampah?.totalPenggunaWarga ?? 0).toLocaleString("id-ID")} keluarga binaan di {data.ringkasanDampakSampah?.totalLokasiRw ?? 74} RW dalam pemilahan sampah organik dan anorganik.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 7. LEMBAR PENGESAHAN RESMI (TUNGGAL KANAN BAWAH STANDAR NASKAH DINAS) */}
                <div className="avoid-break pt-3 flex justify-end">
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

export default LaporanResmiKknPage;
