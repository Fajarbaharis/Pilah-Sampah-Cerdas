/**
 * Project: BERSEKA - Official UNIKOM DPL Certificate Viewer & Generator
 * Developed by: PT Makerindo & Universitas Komputer Indonesia
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Cetak & Verifikasi E-Sertifikat Penghargaan DPL KKN Tematik Batch I UNIKOM
 * 1 Halaman Eksklusif Piagam Penghargaan Dosen Pembimbing Lapangan (MURNI VECTOR HTML/CSS + SVG):
 * - Frame background bersih resolusi tinggi (/image/serti/certificate_frame_hires.png)
 * - Teks, Nomor Sertifikat, Nama DPL, NIP, Kelompok, dan QR Code 100% Vector Presisi
 * - Fitur Cetak A4 Landscape & Simpan PDF Langsung
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Award,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Printer,
  Download,
  X,
  CheckCircle2,
  FileSpreadsheet,
  RotateCcw,
  Copy,
  Check,
  Filter,
  Users,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import fallbackDplRaw from "../../data/dpl_certificates_data.json";
import { sertifikatKknService, type DplCertData } from "../../services/sertifikatKknService";
import { PageHeader } from "../../components/common/PageHeader";

export const SertifikatDplPage: React.FC = () => {
  const { user } = useAuthStore();
  const [dplList, setDplList] = useState<DplCertData[]>(fallbackDplRaw as DplCertData[]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(true);
  const [isLiveDatabase, setIsLiveDatabase] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Tersinkron");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [hasCopiedId, setHasCopiedId] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Click outside listener for search autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch live database from API
  const fetchLiveData = async (force: boolean = false) => {
    if (force) setIsSyncing(true);
    try {
      const liveList = await sertifikatKknService.getDplSertifikatList({ forceRefresh: force });
      if (liveList && liveList.length > 0) {
        setDplList(liveList);
        setIsLiveDatabase(true);
        const now = new Date();
        const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        setLastSyncTime(`Pukul ${timeStr} WIB`);
        if (force) {
          toast.success(`Data live database berhasil diperbarui (${liveList.length} DPL)!`);
        }
      }
    } catch (err) {
      console.warn("[SertifikatDplPage] Fallback to bundled dataset:", err);
      if (force) {
        toast.error("Gagal menyinkronkan data live database, menggunakan data lokal.");
      }
    } finally {
      setIsLoadingLive(false);
      if (force) setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchLiveData(false);
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Role detection
  const isDpl = ["DPL", "DOSEN_PEMBIMBING", "DOSEN_PENDAMPING", "DOSEN_PENDAMPING_LAPANGAN"].includes(
    user?.peran || user?.role || ""
  );

  // Match current logged in DPL
  const currentDpl = useMemo(() => {
    if (!isDpl || !user) return null;
    const cleanNip = user.nip ? String(user.nip).replace(/[^0-9]/g, "") : "";
    const cleanPhone = user.phone ? String(user.phone).trim() : "";
    const cleanName = user.name ? user.name.toLowerCase().trim() : "";
    return (
      dplList.find((d) => {
        const dNipClean = d.nip.replace(/[^0-9]/g, "");
        return (
          (cleanNip && dNipClean === cleanNip) ||
          d.userId === user.id ||
          (cleanName && d.nama.toLowerCase().trim().includes(cleanName))
        );
      }) || null
    );
  }, [isDpl, user, dplList]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>("ALL");

  // Initial DPL selection
  const initialKey = searchParams.get("nip") || searchParams.get("id") || "";
  const [selectedDpl, setSelectedDpl] = useState<DplCertData>(() => {
    if (isDpl && currentDpl) return currentDpl;
    if (initialKey) {
      const found = dplList.find(
        (d) =>
          d.nip.toLowerCase() === initialKey.toLowerCase() ||
          d.idSertifikat.toLowerCase() === initialKey.toLowerCase() ||
          d.nip.replace(/[^0-9]/g, "") === initialKey.replace(/[^0-9]/g, "")
      );
      if (found) return found;
    }
    return dplList[0] || (fallbackDplRaw[0] as DplCertData);
  });

  // Lock to self if DPL
  useEffect(() => {
    if (isDpl && currentDpl) {
      setSelectedDpl(currentDpl);
    }
  }, [isDpl, currentDpl]);

  // Sync selected DPL with query params
  useEffect(() => {
    if (!isDpl && selectedDpl) {
      setSearchParams({ nip: selectedDpl.nip }, { replace: true });
    }
  }, [selectedDpl, isDpl, setSearchParams]);

  // Kelurahan List for filter
  const kelurahanList = useMemo(() => {
    const set = new Set<string>();
    dplList.forEach((d) => {
      if (d.kelurahan) set.add(d.kelurahan);
    });
    return Array.from(set).sort();
  }, [dplList]);

  // Filtered DPL list
  const filteredDplList = useMemo(() => {
    let list = dplList;
    if (selectedKelurahan !== "ALL") {
      list = list.filter((d) => d.kelurahan.toLowerCase() === selectedKelurahan.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.nama.toLowerCase().includes(q) ||
          d.nip.toLowerCase().includes(q) ||
          d.kelompok.toLowerCase().includes(q) ||
          d.kelurahan.toLowerCase().includes(q)
      );
    }
    return list;
  }, [dplList, selectedKelurahan, searchQuery]);

  // Autocomplete Suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return dplList
      .filter(
        (d) =>
          d.nama.toLowerCase().includes(q) ||
          d.nip.toLowerCase().includes(q) ||
          d.kelompok.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [dplList, searchQuery]);

  // Navigation handlers
  const currentIndex = useMemo(() => {
    return filteredDplList.findIndex((d) => d.idSertifikat === selectedDpl.idSertifikat);
  }, [filteredDplList, selectedDpl]);

  const handlePrevDpl = () => {
    if (currentIndex > 0) {
      setSelectedDpl(filteredDplList[currentIndex - 1]);
    }
  };

  const handleNextDpl = () => {
    if (currentIndex < filteredDplList.length - 1) {
      setSelectedDpl(filteredDplList[currentIndex + 1]);
    }
  };

  // Direct Print / Save as PDF
  const handlePrintCertificate = () => {
    toast("Membuka dialog Simpan PDF / Cetak (Pilih 'Save as PDF' - Ukuran A4 Landscape)...", {
      icon: "🖨️",
    });
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Copy ID Sertifikat
  const handleCopyId = () => {
    navigator.clipboard.writeText(selectedDpl.idSertifikat);
    setHasCopiedId(true);
    toast.success(`ID Sertifikat disalin: ${selectedDpl.idSertifikat}`);
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  // Copy Verification URL
  const handleCopyVerifyUrl = () => {
    const url = `${window.location.origin}/verify-dpl/${selectedDpl.idSertifikat}`;
    navigator.clipboard.writeText(url);
    toast.success("Tautan verifikasi keabsahan disalin!");
  };

  // Export dataset for Canva Bulk Create
  const handleDownloadCanvaCsv = () => {
    const headers = [
      "No",
      "Nama_DPL",
      "NIP_DPL",
      "Kelompok",
      "Kelurahan",
      "Wilayah_Dampingan",
      "Nomor_Sertifikat",
      "ID_Sertifikat",
      "Tanggal_Terbit",
      "URL_Verifikasi",
    ];

    const rows = filteredDplList.map((d, idx) => {
      const verifyUrl = `${window.location.origin}/verify-dpl/${d.idSertifikat}`;
      return [
        idx + 1,
        `"${d.nama.replace(/"/g, '""')}"`,
        `"${d.nip}"`,
        `"${d.kelompok}"`,
        `"${d.kelurahan}"`,
        `"${d.wilayahDampingan.replace(/"/g, '""')}"`,
        `"${d.nomorSertifikat}"`,
        `"${d.idSertifikat}"`,
        `"${d.tanggalTerbit}"`,
        `"${verifyUrl}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DATA_CANVA_BULK_DPL_${filteredDplList.length}_DOSEN.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Berhasil mengunduh CSV untuk Canva Bulk Create (${filteredDplList.length} DPL)!`);
  };

  return (
    <div className="w-full max-w-full space-y-5 text-slate-800 dark:text-slate-100 min-w-0 print:p-0 print:m-0 print:bg-white">
      {/* ── GOOGLE FONTS & EXACT A4 PRINT STYLES ────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');
        
        .font-cinzel {
          font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
        }

        .font-playfair {
          font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
        }

        @page {
          size: 297mm 210mm landscape;
          margin: 0;
        }

        @media print {
          @page {
            size: 297mm 210mm landscape;
            margin: 0;
          }
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .cert-export-wrapper {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            gap: 0 !important;
          }
          .cert-print-sheet {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            max-width: none !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          .cert-univ-title {
            font-size: 24pt !important;
            line-height: 1.1 !important;
          }
          .cert-univ-tagline {
            font-size: 8pt !important;
            letter-spacing: 3px !important;
          }
          .cert-title-main {
            font-size: 34pt !important;
            line-height: 1 !important;
            letter-spacing: 2.5px !important;
          }
          .cert-title-sub1 {
            font-size: 15.5pt !important;
            margin-top: 6px !important;
          }
          .cert-title-sub2 {
            font-size: 13.5pt !important;
            margin-top: 3px !important;
          }
          .cert-number {
            font-size: 11pt !important;
            margin-top: 6px !important;
          }
          .cert-given-to {
            font-size: 11.5pt !important;
            margin-top: 8px !important;
          }
          .cert-recipient-name {
            font-size: 27pt !important;
            margin-top: 4px !important;
            line-height: 1.1 !important;
          }
          .cert-bio-text {
            font-size: 11pt !important;
            line-height: 1.3 !important;
          }
          .cert-narrative {
            font-size: 11pt !important;
            line-height: 1.5 !important;
          }
          .cert-footer-text {
            font-size: 10pt !important;
            line-height: 1.25 !important;
          }
        }
      `}</style>

      {/* ── TOP HEADER (NO PRINT) ───────────────────────────────────────── */}
      <div className="no-print space-y-4">
        <PageHeader
          title="E-Sertifikat DPL KKN Tematik"
          subtitle="Piagam Penghargaan Resmi Dosen Pembimbing Lapangan KKN Tematik Batch I UNIKOM 2026"
        />

        {/* Action Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Status Live Database Badge */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isLiveDatabase ? "Live Database UNIKOM" : "Data Terverifikasi"}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                &bull; {lastSyncTime}
              </span>
              <button
                type="button"
                onClick={() => fetchLiveData(true)}
                disabled={isSyncing}
                className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                title="Perbarui data dari server"
              >
                <RotateCcw size={13} className={isSyncing ? "animate-spin text-blue-600" : ""} />
              </button>
            </div>

            {/* Quick Actions Right */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleDownloadCanvaCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 transition-all cursor-pointer shadow-2xs"
                title="Ekspor CSV untuk Canva Bulk Create"
              >
                <FileSpreadsheet size={14} />
                <span className="hidden sm:inline">Ekspor CSV Canva</span>
              </button>

              <button
                type="button"
                onClick={handleCopyVerifyUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
                title="Salin tautan verifikasi publik QR Code"
              >
                <ExternalLink size={14} />
                <span className="hidden sm:inline">Tautan Verifikasi</span>
              </button>

              <button
                type="button"
                onClick={handlePrintCertificate}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
                title="Cetak langsung atau simpan sebagai PDF vektor A4"
              >
                <Printer size={14} />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>

          {/* Search, Filter, and Selector Bar (Hidden for restricted DPL self-view) */}
          {!isDpl && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              
              {/* Search with Autocomplete */}
              <div ref={searchContainerRef} className="relative flex-1 min-w-[240px]">
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Cari DPL berdasarkan Nama, NIP, atau Kelompok..."
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {isSearchFocused && searchSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto py-1 divide-y divide-slate-100 dark:divide-slate-700/50">
                    {searchSuggestions.map((d) => (
                      <button
                        key={d.idSertifikat}
                        type="button"
                        onClick={() => {
                          setSelectedDpl(d);
                          setIsSearchFocused(false);
                          setSearchQuery("");
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {d.nama}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            NIP: {d.nip} &bull; {d.kelompok}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shrink-0">
                          {d.kelurahan}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Kelurahan Filter */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={selectedKelurahan}
                  onChange={(e) => setSelectedKelurahan(e.target.value)}
                  className="text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Kelurahan ({dplList.length} DPL)</option>
                  {kelurahanList.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prev / Next Pagination */}
              <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={handlePrevDpl}
                  disabled={currentIndex <= 0}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="DPL Sebelumnya"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-semibold px-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {currentIndex + 1} / {filteredDplList.length}
                </span>
                <button
                  type="button"
                  onClick={handleNextDpl}
                  disabled={currentIndex >= filteredDplList.length - 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="DPL Selanjutnya"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* DPL Info Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3.5 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                Dosen: {selectedDpl.nama}
              </span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-slate-600 dark:text-slate-300 font-mono">
                NIP: {selectedDpl.nip}
              </span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {selectedDpl.kelompok}
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                ID: {selectedDpl.idSertifikat}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                title="Salin ID Sertifikat"
              >
                {hasCopiedId ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIVE CERTIFICATE RENDER AREA (100% CANVA EXACT MOCKUP) ─── */}
      <div className="cert-export-wrapper max-w-[1150px] mx-auto mt-4 px-2 flex flex-col items-center gap-8 print:p-0 print:m-0 print:max-w-none print:w-full">
        
        {/* ==================== HALAMAN 1: PIAGAM PENGHARGAAN DPL ==================== */}
        <div
          className="cert-print-sheet relative w-full aspect-[1.414/1] bg-white rounded-lg shadow-xl overflow-hidden print:shadow-none print:rounded-none print:m-0 print:w-full print:aspect-[1.414/1] print:break-after-avoid"
          style={{
            backgroundImage: "url('/image/serti/certificate_frame_hires.png')",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Inner Content Area */}
          <div className="absolute inset-0 flex flex-col items-center px-8 md:px-16 pt-7 md:pt-10 pb-6 select-none box-border justify-between">
            
            {/* TOP SECTION: Header & Title */}
            <div className="flex flex-col items-center w-full">
              {/* Header UNIKOM */}
              <div className="flex flex-col items-center ml-10 md:ml-16 mt-1">
                <h1 className="cert-univ-title font-cinzel text-lg md:text-2xl font-black text-[#0A2540] tracking-wide m-0 leading-tight">
                  UNIVERSITAS KOMPUTER INDONESIA
                </h1>
                <div className="flex items-center gap-3 mt-1 w-full justify-center">
                  <div className="h-[1px] bg-[#C5A059] flex-1 max-w-[70px] md:max-w-[90px]" />
                  <p className="cert-univ-tagline text-[7px] md:text-[8pt] font-bold text-[#0A2540] tracking-[2.5px] uppercase m-0">
                    ILMU &bull; TEKNOLOGI &bull; KREATIVITAS &bull; UNTUK INDONESIA
                  </p>
                  <div className="h-[1px] bg-[#C5A059] flex-1 max-w-[70px] md:max-w-[90px]" />
                </div>
              </div>

              {/* Title PIAGAM PENGHARGAAN */}
              <div className="flex items-center justify-center gap-4 mt-3 md:mt-5 w-full">
                <div className="h-[1.5px] bg-[#C5A059] w-12 md:w-24" />
                <h2 className="cert-title-main font-cinzel text-xl md:text-4xl font-extrabold text-[#0A2540] tracking-[3px] m-0 leading-none">
                  PIAGAM PENGHARGAAN
                </h2>
                <div className="h-[1.5px] bg-[#C5A059] w-12 md:w-24" />
              </div>

              <div className="cert-title-sub1 text-xs md:text-[15pt] font-extrabold text-[#005AA9] tracking-wide mt-1.5 uppercase">
                DOSEN PEMBIMBING LAPANGAN (DPL)
              </div>
              <div className="cert-title-sub2 text-[10px] md:text-[13pt] font-extrabold text-[#005AA9] tracking-wide mt-0.5 uppercase">
                KULIAH KERJA NYATA TEMATIK BATCH I TAHUN AKADEMIK 2026/2027
              </div>
              <div className="cert-number text-[10px] md:text-[11pt] font-semibold text-[#0A2540] mt-1">
                Nomor: {selectedDpl.nomorSertifikat}
              </div>

              <div className="cert-given-to font-playfair text-[10px] md:text-[11.5pt] italic text-[#0A2540] mt-2">
                Diberikan dengan penuh rasa hormat dan apresiasi kepada:
              </div>

              {/* Recipient DPL Name */}
              <div className="cert-recipient-name font-playfair text-xl md:text-[26pt] font-black text-[#0A2540] tracking-wide mt-1 uppercase text-center whitespace-nowrap">
                {selectedDpl.nama}
              </div>

              {/* Diamond Divider */}
              <div className="flex items-center justify-center gap-3 w-full max-w-[420px] md:max-w-[480px] mt-1">
                <div className="h-[1px] bg-[#C5A059] flex-1" />
                <span className="text-[#C5A059] text-[8pt] md:text-[10pt] leading-none">&#9670;</span>
                <div className="h-[1px] bg-[#C5A059] flex-1" />
              </div>

              {/* NIP & Role Badge */}
              <div className="cert-bio-text text-[10px] md:text-[11pt] font-semibold text-[#0A2540] mt-1">
                NIP: {selectedDpl.nip}
              </div>

              {/* Role Pill */}
              <div className="mt-1.5 border-[1.2px] border-[#C5A059] rounded-full px-5 py-0.5 bg-white shadow-2xs">
                <span className="text-[10px] md:text-[11pt] font-extrabold text-[#005AA9] tracking-wide">
                  Dosen Pembimbing Lapangan &bull; {selectedDpl.kelompok}
                </span>
              </div>

              {/* Narrative of Appreciation */}
              <div className="cert-narrative text-[9px] md:text-[11pt] text-[#0A2540] text-center max-w-[760px] mt-2.5 leading-relaxed font-normal px-4">
                Atas dedikasi, bimbingan, keteladanan, dan kontribusi nyata dalam mendampingi mahasiswa
                Kuliah Kerja Nyata Tematik (KKN-T) Pengelolaan Sampah dan Lingkungan Hidup Berseka
                di wilayah <span className="font-bold">{selectedDpl.kelompok}</span> (
                <span className="font-semibold">{selectedDpl.wilayahDampingan}</span>).
              </div>
            </div>

            {/* BOTTOM SECTION: Signatures & Validation QR */}
            <div className="w-full flex items-end justify-between px-6 md:px-14 pb-2 md:pb-4 mt-2">
              
              {/* Left Column: QR Code & ID */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-22 md:h-22 bg-white p-1 rounded-md border border-[#0A2540]/20 shadow-xs flex items-center justify-center">
                  {/* Real QR SVG pointing to public verification */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      `${typeof window !== "undefined" ? window.location.origin : "https://berseka.id"}/verify-dpl/${selectedDpl.idSertifikat}`
                    )}`}
                    alt="QR Verification"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[7px] md:text-[8pt] font-mono font-bold text-[#0A2540] mt-1 tracking-tight">
                  {selectedDpl.idSertifikat}
                </div>
                <div className="text-[6.5px] md:text-[7pt] text-slate-500 font-semibold tracking-wide">
                  Scan untuk Validasi Keabsahan
                </div>
              </div>

              {/* Center Seal / Watermark placeholder */}
              <div className="hidden md:flex flex-col items-center opacity-80">
                <div className="w-14 h-14 rounded-full border border-[#C5A059]/40 flex items-center justify-center">
                  <ShieldCheck size={28} className="text-[#005AA9]" />
                </div>
                <span className="text-[7pt] text-[#C5A059] font-bold tracking-widest uppercase mt-1">
                  OFFICIAL SEAL
                </span>
              </div>

              {/* Right Column: Signature & Official Stamped Date */}
              <div className="flex flex-col items-center text-center">
                <div className="cert-footer-text text-[9px] md:text-[10pt] font-semibold text-[#0A2540] mb-1">
                  Bandung, {selectedDpl.tanggalTerbit}
                </div>
                <div className="cert-footer-text text-[8px] md:text-[9.5pt] font-bold text-[#0A2540]">
                  Rektor Universitas Komputer Indonesia
                </div>
                
                {/* Official Signature Space */}
                <div className="h-12 md:h-16 flex items-center justify-center my-0.5">
                  <img
                    src="/image/serti/a0cf9f4f-7ca2-43c9-903b-b56b556dfc67.jpeg"
                    alt="Tanda Tangan Rektor UNIKOM"
                    className="h-10 md:h-14 object-contain mix-blend-multiply opacity-90"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>

                <div className="cert-footer-text font-bold text-[9px] md:text-[11pt] text-[#0A2540] underline tracking-wide">
                  Prof. Dr. Ir. H. Eddy Soeryanto Soegoto, M.T.
                </div>
                <div className="cert-footer-text text-[7px] md:text-[8.5pt] font-semibold text-[#0A2540]">
                  NIP: 4127.34.02.001
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default SertifikatDplPage;
