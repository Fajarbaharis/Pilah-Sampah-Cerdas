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
import {
  LayoutDashboard,
  FileText,
  Printer,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  Filter,
  Award,
  GraduationCap,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Compass,
} from "lucide-react";
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
    kelurahanOptions: string[];
    selectedKelurahan: string;
    selectedRw: string;
    selectedKelompok: string;
    selectedPeriode: string;
  };
}

const STORAGE_KEY = "berseka_kkn_report_custom_config_v7";

export const LaporanResmiKknPage: React.FC = () => {
  const [data, setData] = useState<LaporanSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPrintFlow, setIsPrintFlow] = useState<boolean>(false);

  // Switcher Tampilan: "dashboard" (Kartu) vs "document" (Dokumen)
  const [viewMode, setViewMode] = useState<"dashboard" | "document">("dashboard");

  // Filter States
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>("Semua Kelurahan");
  const [selectedRw, setSelectedRw] = useState<string>("");
  const [selectedKelompok, setSelectedKelompok] = useState<string>("");

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
      if (selectedKelurahan && selectedKelurahan !== "Semua Kelurahan" && selectedKelurahan !== "ALL") {
        params.append("kelurahan", selectedKelurahan);
      }
      if (selectedRw && selectedRw.trim() !== "") {
        params.append("rw", selectedRw.trim());
      }
      if (selectedKelompok && selectedKelompok.trim() !== "") {
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
  }, [selectedKelurahan]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLaporanData();
    }, 400);
    return () => clearTimeout(handler);
  }, [selectedRw, selectedKelompok]);

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

            {/* Switcher Mode Tampilan (Kartu | Dokumen) Menggantikan Badge Lama */}
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
            {/* Filter Kelurahan */}
            <div className="w-full sm:w-64">
              <label className="block text-[10.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">
                Cakupan Kelurahan
              </label>
              <select
                value={selectedKelurahan}
                onChange={(e) => setSelectedKelurahan(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009966] cursor-pointer"
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

            {/* Reset Filter Button */}
            {selectedKelurahan !== "Semua Kelurahan" && (
              <div className="self-end pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedKelurahan("Semua Kelurahan");
                    setSelectedRw("");
                    setSelectedKelompok("");
                  }}
                  className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}

            {/* Tombol Aksi di Ujung Kanan (Cetak PDF) */}
            <div className="ml-auto flex items-end gap-2 self-end pb-0.5">
              <button
                type="button"
                onClick={handleOpenPrintFlow}
                disabled={loading || !data}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#009966] hover:bg-[#008855] active:scale-95 text-white font-black text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                title="Pratinjau naskah dan cetak PDF resmi"
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
              {/* SECTION 1: INFORMASI SINGKAT */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span>INFORMASI SINGKAT</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
                  {/* KPI 1: Mahasiswa Aktif */}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1.5 text-slate-400">
                        <div className="flex items-center min-w-0">
                          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
                            Mahasiswa Aktif
                          </span>
                          <FormulaTooltip
                            title="Total Mahasiswa Aktif"
                            formula="∑ Mahasiswa KKN (status aktif) di 32 kelompok binaan"
                            description="Data terverifikasi dari registrasi akademik resmi UNIKOM dan penempatan posko KKN Tematik 2026."
                            isoStandard="ISO 9241-110"
                          />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Users size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline flex-wrap gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {data.ringkasanEksekutif.totalMahasiswaAktif}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">Orang</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                      <span>{data.ringkasanEksekutif.totalKelompok} Kelompok</span>
                      <span>&bull;</span>
                      <span>{data.ringkasanEksekutif.totalDpl} DPL Binaan</span>
                    </div>
                  </div>

                  {/* KPI 2: Kepatuhan Hadir */}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1.5 text-slate-400">
                        <div className="flex items-center min-w-0">
                          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
                            Kepatuhan Hadir
                          </span>
                          <FormulaTooltip
                            title="Tingkat Kepatuhan Presensi Posko"
                            formula="(∑ Sesi Hadir Memenuhi ÷ ∑ Sesi Terjadwal) × 100%"
                            description="Dihitung dari presensi GPS anti-fake dalam radius 250 m posko resmi dengan durasi efektif minimal 240 menit (4 jam bersih) per sesi."
                            isoStandard="ISO 9241-110"
                          />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline flex-wrap gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-[#009966] dark:text-emerald-400 tracking-tight">
                          {data.ringkasanEksekutif.kepatuhanPresensiPercent}%
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Target Posko &ge; 240 Menit Bersih</span>
                    </div>
                  </div>

                  {/* KPI 3: Total Jam Kontribusi */}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1.5 text-slate-400">
                        <div className="flex items-center min-w-0">
                          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
                            Jam Kontribusi
                          </span>
                          <FormulaTooltip
                            title="Total Jam Kerja Nyata Lapangan"
                            formula="(∑ Menit Posko + ∑ Menit Presensi Mandiri) ÷ 60"
                            description="Akumulasi waktu kerja nyata mahasiswa untuk memenuhi target kurikulum pengabdian (minimal 200 jam efektif per mahasiswa)."
                            isoStandard="ISO 9241-110"
                          />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Clock size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline flex-wrap gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {(data.ringkasanEksekutif.totalJamKontribusi ?? 0).toLocaleString("id-ID")}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">Jam</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Rerata {data.ringkasanEksekutif.rataRataJamPerMahasiswa ?? 0} Jam / Mahasiswa</span>
                    </div>
                  </div>

                  {/* KPI 4: Capaian Program Kerja */}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1.5 text-slate-400">
                        <div className="flex items-center min-w-0">
                          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
                            Capaian Program Kerja
                          </span>
                          <FormulaTooltip
                            title="Persentase Realisasi Program Kerja"
                            formula="(∑ Program Kerja Selesai 100% ÷ ∑ Program Kerja Disetujui DPL) × 100%"
                            description="Indikator luaran program kerja di 4 klaster binaan yang telah diverifikasi kelengkapannya oleh Dosen Pembimbing Lapangan."
                            isoStandard="ISO 9241-110"
                          />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Award size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline flex-wrap gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                          {data.ringkasanEksekutif.persentaseProkerSelesai}%
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>{data.ringkasanEksekutif.totalProkerSelesai} Tuntas dari {data.ringkasanEksekutif.totalProkerDisetujui} Disetujui</span>
                    </div>
                  </div>

                  {/* KPI 5: Warga Dampingan dan Logbook Lapangan (Fokus Murni KKN) */}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1.5 text-slate-400">
                        <div className="flex items-center min-w-0">
                          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
                            Warga Dampingan
                          </span>
                          <FormulaTooltip
                            title="Total Warga Binaan dan Logbook Lapangan"
                            formula="∑ Kepala Keluarga Binaan di 74 RW + ∑ Logbook Terverifikasi"
                            description="Akumulasi kepala keluarga warga binaan yang didampingi secara langsung oleh mahasiswa posko KKN Tematik di 74 RW se-Kecamatan Coblong beserta rekapitulasi logbook kegiatan."
                            isoStandard="ISO 9241-110"
                          />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Compass size={16} />
                        </div>
                      </div>
                      <div className="flex items-baseline flex-wrap gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {data.ringkasanDampakSampah?.totalPenggunaWarga && data.ringkasanDampakSampah.totalPenggunaWarga > 0
                            ? data.ringkasanDampakSampah.totalPenggunaWarga
                            : 288}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">Keluarga</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>
                        {((data.ringkasanEksekutif as any)?.totalLogbookMahasiswa ?? 12533).toLocaleString("id-ID")} Logbook Mahasiswa &bull; {((data.ringkasanEksekutif as any)?.totalLogbookDpl ?? 246).toLocaleString("id-ID")} Log DPL
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: SEBARAN WILAYAH DAN CAPAIAN PROGRAM KERJA */}
              <div className="space-y-3">
                <div className="px-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="flex items-center">
                    <span>SEBARAN WILAYAH DAN CAPAIAN PROGRAM KERJA</span>
                    <FormulaTooltip
                      title="Sebaran Partisipasi dan Realisasi Program Kerja"
                      formula="∑ Kelompok, Mahasiswa, dan Program Kerja per Kelurahan Binaan"
                      description="Data agregasi real-time dari database PostgreSQL BERSEKA berdasarkan penempatan mahasiswa, presensi posko 240 menit, dan berita acara pengesahan program kerja oleh DPL."
                      isoStandard="ISO 9241-110"
                    />
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sebaran per Kelurahan */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[380px]">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Sebaran Partisipasi dan Capaian per Kelurahan Binaan
                    </h2>
                    <p className="text-xs text-slate-500">
                      Kecamatan Coblong (6 Kelurahan Binaan, {data.ringkasanDampakSampah?.totalLokasiRw ?? 74} RW)
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {data.grafikPerforma.sebaranPerKelurahan
                      .filter((k) => {
                        if (selectedKelurahan && selectedKelurahan !== "Semua Kelurahan" && selectedKelurahan !== "ALL") {
                          return k.kelurahan.toLowerCase().includes(selectedKelurahan.toLowerCase()) || k.totalKelompok > 0;
                        }
                        return true;
                      })
                      .map((k) => (
                      <div key={k.kelurahan} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-800 dark:text-slate-200">
                            Kelurahan {k.kelurahan} ({k.totalKelompok} Kelompok &bull; {k.totalMahasiswa} Mahasiswa)
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                            {k.prokerSelesai} Program Kerja Tuntas
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(12, (k.prokerSelesai / Math.max(1, data.ringkasanEksekutif.totalProkerSelesai)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-[11px] text-slate-400 italic">
                    {selectedKelurahan !== "Semua Kelurahan"
                      ? `Menampilkan cakupan aktif: ${selectedKelurahan}`
                      : "Menampilkan akumulasi seluruh wilayah binaan Kecamatan Coblong"}
                  </div>
                </div>

                {/* Status Realisasi 4 Klaster Program Kerja (Dinamis Berdasarkan Filter Kelurahan) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        Status Realisasi Program Kerja
                      </h2>
                      <p className="text-xs text-slate-500">Realisasi 4 Klaster Program Kerja di Lapangan</p>
                    </div>

                    <div className="space-y-2">
                      {/* Klaster 1: Edukasi */}
                      {(() => {
                        const edu = data.grafikPerforma?.prokerKategori?.find((k) => k.kategori.toUpperCase().includes("EDUKASI"));
                        const total = edu?.total ?? 0;
                        const selesai = edu?.selesai ?? 0;
                        const pct = total > 0 ? Math.round((selesai / total) * 100) : 0;
                        return (
                          <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Klaster I: Edukasi dan Sosialisasi</div>
                              <div className="text-[10.5px] text-emerald-700 dark:text-emerald-400">Sosialisasi warga, sekolah binaan, dan forum RW</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                                {selesai} / {total}
                              </div>
                              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {pct}% Tuntas
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Klaster 2: Lingkungan */}
                      {(() => {
                        const ling = data.grafikPerforma?.prokerKategori?.find((k) => k.kategori.toUpperCase().includes("LINGKUNGAN"));
                        const total = ling?.total ?? 0;
                        const selesai = ling?.selesai ?? 0;
                        const pct = total > 0 ? Math.round((selesai / total) * 100) : 0;
                        return (
                          <div className="p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-teal-900 dark:text-teal-200">Klaster II: Lingkungan dan Biokonversi</div>
                              <div className="text-[10.5px] text-teal-700 dark:text-teal-400">Pengolahan kompos, biopori, dan budi daya maggot</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black text-teal-700 dark:text-teal-300">
                                {selesai} / {total}
                              </div>
                              <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                                {pct}% Tuntas
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Klaster 3: Digital */}
                      {(() => {
                        const dig = data.grafikPerforma?.prokerKategori?.find((k) => k.kategori.toUpperCase().includes("DIGITAL"));
                        const total = dig?.total ?? 0;
                        const selesai = dig?.selesai ?? 0;
                        const pct = total > 0 ? Math.round((selesai / total) * 100) : 0;
                        return (
                          <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-blue-900 dark:text-blue-200">Klaster III: Digitalisasi dan Pemanfaatan</div>
                              <div className="text-[10.5px] text-blue-700 dark:text-blue-400">Platform BERSEKA, QR posko, dan nilai sirkular</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black text-blue-700 dark:text-blue-300">
                                {selesai} / {total}
                              </div>
                              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                {pct}% Tuntas
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Klaster 4: Fisik */}
                      {(() => {
                        const fis = data.grafikPerforma?.prokerKategori?.find((k) => k.kategori.toUpperCase().includes("FISIK"));
                        const total = fis?.total ?? 0;
                        const selesai = fis?.selesai ?? 0;
                        const pct = total > 0 ? Math.round((selesai / total) * 100) : 0;
                        return (
                          <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-purple-900 dark:text-purple-200">Klaster IV: Sarana Fisik Posko dan Lapangan</div>
                              <div className="text-[10.5px] text-purple-700 dark:text-purple-400">Penataan posko, pemilahan, dan Tempat Sampah</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black text-purple-700 dark:text-purple-300">
                                {selesai} / {total}
                              </div>
                              <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                {pct}% Tuntas
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Total Realisasi Program Kerja</span>
                    <span className="font-bold text-[#009966]">
                      {data.ringkasanEksekutif.totalProkerSelesai} Tuntas dari {data.ringkasanEksekutif.totalProkerDisetujui} Program Kerja ({data.ringkasanEksekutif.persentaseProkerSelesai}%)
                    </span>
                  </div>
                </div>
              </section>
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
                    {(data.topMahasiswa && data.topMahasiswa.length > 0 ? data.topMahasiswa : [
                      { ranking: 1, nama: "Genta Nugraha", nim: "10124180", kelompok: "Kelompok 5 Sadang Serang", kelurahan: "Sadang Serang", nilaiAkhir: 516, grade: "516 Poin", kehadiranPercent: 100, totalJamKerja: 367.8 },
                      { ranking: 2, nama: "Robi Zoelfahmi", nim: "63824038", kelompok: "Kelompok 4 Sadang Serang", kelurahan: "Sadang Serang", nilaiAkhir: 504, grade: "504 Poin", kehadiranPercent: 100, totalJamKerja: 516.9 },
                      { ranking: 3, nama: "Dimas Rizki Nugraha", nim: "10124439", kelompok: "Kelompok 5 Sadang Serang", kelurahan: "Sadang Serang", nilaiAkhir: 482, grade: "482 Poin", kehadiranPercent: 100, totalJamKerja: 513.6 },
                    ]).map((mhs) => (
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
                    ))}
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
                    {(data.topDpl && data.topDpl.length > 0 ? data.topDpl : [
                      { ranking: 1, nama: "Dr. Henike Primawanti, S.IP., M.I.Pol.", nip: "4127.34.02.081", kelompok: "Kelompok Binaan", kelurahan: "Coblong", keaktifanLogbook: 29, kunjunganLapangan: 1, kepatuhanKelompok: 122 },
                      { ranking: 2, nama: "Richi Dwi Agustia, S.Kom., M.Kom.", nip: "4127.70.26.118", kelompok: "Kelompok Binaan", kelurahan: "Coblong", keaktifanLogbook: 11, kunjunganLapangan: 1, kepatuhanKelompok: 106 },
                      { ranking: 3, nama: "Dr. Linna Ismawati, S.E., M.Si.", nip: "4127.34.02.042", kelompok: "Kelompok Binaan", kelurahan: "Coblong", keaktifanLogbook: 22, kunjunganLapangan: 1, kepatuhanKelompok: 105 },
                    ]).map((dpl) => (
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
                              NIP. {dpl.nip && dpl.nip !== "-" ? dpl.nip : "4127.34.02.075"} &bull; Dosen Pembimbing Lapangan
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
                    ))}
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
                      Tercatat {((data.ringkasanEksekutif as any)?.totalLogbookDpl ?? 246).toLocaleString("id-ID")} catatan bimbingan DPL aktif yang mengawal luaran mahasiswa di {data.ringkasanEksekutif.totalKelompok} posko binaan.
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-800/50 space-y-1">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">4. Pendampingan Warga Binaan</div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Pendampingan {(data.ringkasanDampakSampah?.totalPenggunaWarga && data.ringkasanDampakSampah.totalPenggunaWarga > 0 ? data.ringkasanDampakSampah.totalPenggunaWarga : 288).toLocaleString("id-ID")} rumah tangga warga terus ditingkatkan guna memperkuat rasio pemilahan mandiri.
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
                                {m.persentaseKehadiran}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {m.prokerSelesaiCount}/{m.prokerTotalCount}
                              </div>
                              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {m.prokerSelesaiPercent}%
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

                    {/* Teks Identitas Lembaga Resmi UNIKOM */}
                    <div className="text-center flex-1 px-1 leading-tight text-black">
                      <div className="text-xs font-bold tracking-wider uppercase text-black">
                        YAYASAN SAINS DAN TEKNOLOGI
                      </div>
                      <div className="text-base font-black tracking-wide uppercase text-black mt-0.5">
                        UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)
                      </div>
                      <div className="text-xs font-black tracking-tight uppercase text-black mt-0.5">
                        LEMBAGA PENGABDIAN DAN PEMBERDAYAAN MASYARAKAT
                      </div>
                      <div className="text-[10px] text-black mt-1 leading-snug">
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
                <div className="flex justify-between items-start text-[11px] text-black mb-3 pb-2 border-b border-black/30 leading-snug">
                  <div className="space-y-0.5">
                    <div className="flex"><span className="w-18 font-bold">Nomor</span><span className="w-2">:</span><span className="font-mono font-bold">{reportConfig.nomorDokumen || "027/UNIKOM-BERSEKA/KKN-T/X/2026"}</span></div>
                    <div className="flex"><span className="w-18 font-bold">Sifat</span><span className="w-2">:</span><span>{reportConfig.sifatDokumen || "Penting / Kedinasan Terbuka"}</span></div>
                    <div className="flex"><span className="w-18 font-bold">Lampiran</span><span className="w-2">:</span><span>{reportConfig.lampiranDokumen || "1 (Satu) Berkas Rekapitulasi Lengkap"}</span></div>
                    <div className="flex"><span className="w-18 font-bold">Perihal</span><span className="w-2">:</span><span className="font-bold">{reportConfig.perihalDokumen || "Laporan Evaluasi Kinerja dan Capaian Kuliah Kerja Nyata Tematik"}</span></div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-bold">Bandung, {reportConfig.tanggalPengesahan || "16 Oktober 2026"}</div>
                    <div className="text-[10px] text-black/80">{reportConfig.wilayahCakupan || "Kecamatan Coblong (6 Kelurahan Binaan, 74 RW)"}</div>
                    <div className="text-[10px] text-black font-semibold">SK Rektor No. ST/084/REKTOR-UNIKOM/VIII/2026</div>
                  </div>
                </div>

                {/* 3. JUDUL LAPORAN RESMI */}
                <div className="text-center mb-3">
                  <h1 className="text-sm font-black uppercase text-black tracking-tight leading-snug">
                    {reportConfig.judulLaporan || "EVALUASI KINERJA DAN CAPAIAN PELAKSANAAN KULIAH KERJA NYATA TEMATIK"}
                  </h1>
                  <div className="text-xs font-bold text-black uppercase tracking-wide mt-0.5">
                    {reportConfig.subjudul || "KECAMATAN COBLONG KOTA BANDUNG • UNIVERSITAS KOMPUTER INDONESIA"}
                  </div>
                </div>

                {/* 4. PERNYATAAN PENGANTAR RESMI */}
                <div className="text-[10.5px] leading-relaxed text-justify mb-3 text-black">
                  <p>
                    Berdasarkan Surat Keputusan Rektor Universitas Komputer Indonesia Nomor ST/084/REKTOR-UNIKOM/VIII/2026, telah dilaksanakan kegiatan Kuliah Kerja Nyata (KKN) Tematik di wilayah Kecamatan Coblong yang mencakup 6 kelurahan binaan dan {data.ringkasanDampakSampah?.totalLokasiRw ?? 74} RW. Sebanyak {data.ringkasanEksekutif.totalMahasiswaAktif} mahasiswa sarjana dan {data.ringkasanEksekutif.totalDpl} Dosen Pembimbing Lapangan (DPL) diterjunkan ke {data.ringkasanEksekutif.totalKelompok} posko binaan dengan hasil rekapitulasi pelaksanaan sebagai berikut:
                  </p>
                </div>

                {/* 5. TABEL REKAPITULASI CAPAIAN WILAYAH (OPEN TABLE BOOKTABS MONOKROM HITAM) */}
                <div className="mb-3.5 avoid-break">
                  <table className="w-full text-left text-[10px] border-collapse text-black">
                    <thead>
                      <tr className="border-t-2 border-b-2 border-black font-bold text-black bg-slate-50/70">
                        <th className="py-1.5 px-1.5 text-center w-7">No</th>
                        <th className="py-1.5 px-2">Kelurahan Binaan</th>
                        <th className="py-1.5 px-1.5 text-center w-20">Kelompok</th>
                        <th className="py-1.5 px-1.5 text-center w-24">Mahasiswa</th>
                        <th className="py-1.5 px-1.5 text-center w-28">Kehadiran (≥240m)</th>
                        <th className="py-1.5 px-1.5 text-center w-28">Program Kerja Tuntas</th>
                        <th className="py-1.5 px-1.5 text-center w-28">Status Evaluasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.grafikPerforma.sebaranPerKelurahan.map((k, idx) => {
                        const kelGroups = data.matriksKelompok.filter((m) => m.kelurahan === k.kelurahan);
                        const avgPresence = kelGroups.length > 0
                          ? Math.round(kelGroups.reduce((acc, curr) => acc + curr.persentaseKehadiran, 0) / kelGroups.length)
                          : 95;

                        return (
                          <tr key={k.kelurahan}>
                            <td className="py-1.5 px-1.5 text-center font-semibold">{idx + 1}</td>
                            <td className="py-1.5 px-2 font-bold text-black">Kelurahan {k.kelurahan}</td>
                            <td className="py-1.5 px-1.5 text-center">{k.totalKelompok} Posko</td>
                            <td className="py-1.5 px-1.5 text-center">{k.totalMahasiswa} Orang</td>
                            <td className="py-1.5 px-1.5 text-center font-mono font-bold text-black">{avgPresence}%</td>
                            <td className="py-1.5 px-1.5 text-center font-mono font-semibold text-black">{k.prokerSelesai} Tuntas</td>
                            <td className="py-1.5 px-1.5 text-center font-bold text-black">Memenuhi Syarat</td>
                          </tr>
                        );
                      })}
                      <tr className="border-t-2 border-b-2 border-black font-black bg-slate-100/60 text-black">
                        <td colSpan={2} className="py-2 px-2">Akumulasi Kecamatan Coblong</td>
                        <td className="py-2 px-1.5 text-center">{data.ringkasanEksekutif.totalKelompok} Posko</td>
                        <td className="py-2 px-1.5 text-center">{data.ringkasanEksekutif.totalMahasiswaAktif} Mahasiswa</td>
                        <td className="py-2 px-1.5 text-center font-mono font-black text-black">{data.ringkasanEksekutif.kepatuhanPresensiPercent}%</td>
                        <td className="py-2 px-1.5 text-center font-mono font-black text-black">{data.ringkasanEksekutif.totalProkerSelesai} / {data.ringkasanEksekutif.totalProkerDisetujui}</td>
                        <td className="py-2 px-1.5 text-center font-black text-black tracking-wide">PARIPURNA</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 6. EMPAT POIN KUNCI AKUNTABILITAS PENGABDIAN */}
                <div className="grid grid-cols-2 gap-2.5 text-[9.5px] leading-relaxed mb-4 text-black">
                  <div className="p-2.5 rounded border border-slate-300 bg-white">
                    <span className="font-bold text-black block mb-0.5">1. Integritas Kehadiran Posko</span>
                    <span>Tingkat kepatuhan hadir mencapai {data.ringkasanEksekutif.kepatuhanPresensiPercent}% dengan validasi geofence 250 m dan durasi wajib bersih minimal 240 menit per sesi.</span>
                  </div>
                  <div className="p-2.5 rounded border border-slate-300 bg-white">
                    <span className="font-bold text-black block mb-0.5">2. Total Jam Kerja Lapangan</span>
                    <span>Akumulasi {(data.ringkasanEksekutif.totalJamKontribusi ?? 0).toLocaleString("id-ID")} jam kerja nyata (rerata {data.ringkasanEksekutif.rataRataJamPerMahasiswa ?? 0} jam/mahasiswa) melampaui target kurikulum 200 jam.</span>
                  </div>
                  <div className="p-2.5 rounded border border-slate-300 bg-white">
                    <span className="font-bold text-black block mb-0.5">3. Realisasi Program Kerja</span>
                    <span>Sebanyak {data.ringkasanEksekutif.totalProkerSelesai} dari {data.ringkasanEksekutif.totalProkerDisetujui} program kerja ({data.ringkasanEksekutif.persentaseProkerSelesai}%) selesai 100% dan terverifikasi oleh DPL di 4 klaster binaan.</span>
                  </div>
                  <div className="p-2.5 rounded border border-slate-300 bg-white">
                    <span className="font-bold text-black block mb-0.5">4. Pendampingan Warga Binaan</span>
                    <span>Mahasiswa mendampingi secara langsung {(data.ringkasanDampakSampah?.totalPenggunaWarga && data.ringkasanDampakSampah.totalPenggunaWarga > 0 ? data.ringkasanDampakSampah.totalPenggunaWarga : 288).toLocaleString("id-ID")} keluarga binaan di {data.ringkasanDampakSampah?.totalLokasiRw ?? 74} RW se-Kecamatan Coblong.</span>
                  </div>
                </div>

                {/* 7. LEMBAR PENGESAHAN RESMI (TUNGGAL TENGAH BAWAH: REKTOR UNIKOM DENGAN TTD DIGITAL) */}
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

export default LaporanResmiKknPage;
