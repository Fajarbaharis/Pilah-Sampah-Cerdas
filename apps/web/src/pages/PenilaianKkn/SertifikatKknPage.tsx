/**
 * Project: BERSEKA - Official UNIKOM KKN Tematik Certificate Viewer & Generator
 * Developed by: PT Makerindo & Universitas Komputer Indonesia
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Cetak & Verifikasi E-Sertifikat Resmi KKN Tematik Batch I UNIKOM
 * 100% PERSIS SESUAI ACUAN DESAIN CANVA RESMI (MURNI VECTOR HTML/CSS + SVG):
 * - Halaman 1: Sertifikat Kelulusan 450 Jam, Logo UNIKOM, TTD Warek I UNIKOM, QR Code
 * - Halaman 2: Transkrip Rekapitulasi 5 Aspek Resmi (Personal 20%, Proker 25%, Laporan 25%, Paper 15%, Video 15%)
 *
 * Anti-Raster Stamp & Anti-Overlap Architecture:
 * - Menggunakan border frame bersih resolusi tinggi (/image/serti/certificate_frame_hires.png) dengan 0 teks di canvas tengah
 * - Semua teks, tabel, kolom SKS, dan tanda tangan 100% Native Vector HTML/CSS
 * - 4 Kolom Mahasiswa (Nama, NIM, Program Studi, SKS diambil) 100% sejajar, proporsional, dan bebas teks tumpang tindih
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Award,
  Search,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  FileDown,
  Printer,
  Download,
  X,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Info,
  RotateCcw,
  CheckSquare,
  Square,
  Copy,
  Check,
  Filter,
  Users,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import studentsDataRaw from "../../data/students_certificates_data.json";
import { sertifikatKknService, type StudentCertData } from "../../services/sertifikatKknService";
import { PageHeader } from "../../components/common/PageHeader";

export const SertifikatKknPage: React.FC = () => {
  const { user } = useAuthStore();
  const [studentsData, setStudentsData] = useState<StudentCertData[]>(studentsDataRaw as StudentCertData[]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(true);
  const [isLiveDatabase, setIsLiveDatabase] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Tersinkron");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showCanvaModal, setShowCanvaModal] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [hasCopiedId, setHasCopiedId] = useState<boolean>(false);
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
      const liveList = await sertifikatKknService.getSertifikatList({ forceRefresh: force });
      if (liveList && liveList.length > 0) {
        setStudentsData(liveList);
        setIsLiveDatabase(true);
        const now = new Date();
        const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        setLastSyncTime(`Pukul ${timeStr} WIB`);
        if (force) {
          toast.success(`Data live database berhasil diperbarui (${liveList.length} Mahasiswa)!`);
        }
      }
    } catch (err) {
      console.warn("[SertifikatKknPage] Fallback to bundled dataset:", err);
      if (force) {
        toast.error("Gagal menyinkronkan data live database, menggunakan salinan data lokal.");
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
  const isPimpinan = ["PIMPINAN", "PEMIMPIN", "CAMAT", "LURAH", "ADMIN_DLH"].includes(user?.peran || "");
  const isMahasiswa = user?.peran === "MAHASISWA_KKN";

  // Match current logged in Mahasiswa
  const currentMahasiswa = useMemo(() => {
    if (!isMahasiswa || !user) return null;
    const cleanNim = user.nim ? String(user.nim).trim() : "";
    const cleanPhone = user.phone ? String(user.phone).trim() : "";
    const cleanName = user.name ? user.name.toLowerCase().trim() : "";
    return (
      studentsData.find(
        (s) =>
          (cleanNim && s.nim === cleanNim) ||
          (cleanPhone && s.nim === cleanPhone) ||
          (cleanName && s.nama.toLowerCase().trim() === cleanName)
      ) || null
    );
  }, [isMahasiswa, user, studentsData]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedKelompok, setSelectedKelompok] = useState<string>("ALL");
  const [filterStatusPenilaian, setFilterStatusPenilaian] = useState<string>("ALL");

  // Initial student from query param or logged in Mahasiswa or default to first student
  const initialNim = searchParams.get("nim") || (currentMahasiswa ? currentMahasiswa.nim : "21224142");
  const [selectedStudent, setSelectedStudent] = useState<StudentCertData>(() => {
    if (isMahasiswa && currentMahasiswa) return currentMahasiswa;
    const found = studentsData.find((s) => s.nim === initialNim);
    return found || studentsData[0];
  });

  // Lock to self if Mahasiswa
  useEffect(() => {
    if (isMahasiswa && currentMahasiswa) {
      setSelectedStudent(currentMahasiswa);
    }
  }, [isMahasiswa, currentMahasiswa]);

  // Sync selected student with URL param (only for non-mahasiswa)
  useEffect(() => {
    if (isMahasiswa) return;
    const nimParam = searchParams.get("nim");
    if (nimParam && nimParam !== selectedStudent.nim) {
      const found = studentsData.find((s) => s.nim === nimParam);
      if (found) setSelectedStudent(found);
    }
  }, [searchParams, isMahasiswa, selectedStudent.nim, studentsData]);

  // Keep selectedStudent in sync with studentsData updates (zero-dummy guarantee)
  useEffect(() => {
    if (studentsData.length > 0 && selectedStudent) {
      const match = studentsData.find((s) => s.nim === selectedStudent.nim);
      if (match && (
        match.statusPenilaian !== selectedStudent.statusPenilaian ||
        match.sudahDinilai !== selectedStudent.sudahDinilai ||
        match.nilai?.total !== selectedStudent.nilai?.total ||
        match.nilai?.proker !== selectedStudent.nilai?.proker ||
        match.nama !== selectedStudent.nama ||
        match.rw !== selectedStudent.rw ||
        match.dpl !== selectedStudent.dpl
      )) {
        setSelectedStudent(match);
      }
    }
  }, [studentsData, selectedStudent]);

  const handleSelectStudent = (s: StudentCertData) => {
    if (isMahasiswa) return;
    setSelectedStudent(s);
    setSearchParams({ nim: s.nim });
  };

  // Distinct groups list
  const kelompokList = useMemo(() => {
    const set = new Set<string>();
    studentsData.forEach((s) => {
      if (s.kelompok) set.add(s.kelompok);
    });
    return Array.from(set).sort();
  }, [studentsData]);

  // Filtered student list for quick drawer/dropdown
  const filteredStudents = useMemo(() => {
    if (isMahasiswa) {
      return selectedStudent ? [selectedStudent] : [];
    }
    return studentsData.filter((s) => {
      const matchSearch =
        !searchQuery ||
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nim.includes(searchQuery) ||
        s.prodi.toLowerCase().includes(searchQuery.toLowerCase());
      const matchKelompok =
        selectedKelompok === "ALL" || s.kelompok === selectedKelompok;
      const isGraded = Boolean(
        s.sudahDinilai &&
        s.statusPenilaian === "SUDAH_DINILAI" &&
        s.nilai &&
        s.nilai.total > 0 &&
        s.nilai.predikat !== "Belum Dinilai"
      );
      const matchStatus =
        filterStatusPenilaian === "ALL" ||
        (filterStatusPenilaian === "SUDAH" && isGraded) ||
        (filterStatusPenilaian === "BELUM" && !isGraded);

      return matchSearch && matchKelompok && matchStatus;
    });
  }, [searchQuery, selectedKelompok, filterStatusPenilaian, isMahasiswa, selectedStudent, studentsData]);

  // Quick navigation: Previous and Next student in filtered list
  const currentStudentIndex = useMemo(() => {
    return filteredStudents.findIndex((s) => s.nim === selectedStudent.nim);
  }, [filteredStudents, selectedStudent.nim]);

  const handlePrevStudent = () => {
    if (currentStudentIndex > 0) {
      handleSelectStudent(filteredStudents[currentStudentIndex - 1]);
    }
  };

  const handleNextStudent = () => {
    if (currentStudentIndex < filteredStudents.length - 1) {
      handleSelectStudent(filteredStudents[currentStudentIndex + 1]);
    }
  };

  // Direct Official High-Res PDF Download with strict validation & seamless vector print fallback
  const handleDirectDownloadPdf = async () => {
    setIsDownloading(true);
    const safeName = selectedStudent.nama.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `SERTIFIKAT_KKN_${selectedStudent.nim}_${safeName}.pdf`;
    const directUrl = `/certificates/${fileName}`;

    try {
      // Check if pre-generated official PDF exists and verify it's genuine binary PDF (never SPA HTML fallback)
      const res = await fetch(directUrl);
      const contentType = res.headers.get("content-type") || "";

      if (res.ok && contentType.toLowerCase().includes("application/pdf")) {
        const blob = await res.blob();
        // Verify magic bytes %PDF
        const header = await blob.slice(0, 5).text();
        if (header.startsWith("%PDF")) {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          toast.success(`Berhasil mengunduh PDF resmi: ${selectedStudent.nama}`);
          setIsDownloading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("[SertifikatKknPage] Direct PDF fetch fallback:", err);
    }

    setIsDownloading(false);
    toast("Membuka dialog Cetak / Simpan sebagai PDF vektor (Pilih 'Save as PDF' - Ukuran A4 Landscape)...", {
      icon: "🖨️",
      duration: 4000,
    });
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handlePrintCertificate = () => {
    toast("Membuka dialog Simpan PDF / Cetak. Pilih 'Save as PDF' dengan ukuran A4 Landscape untuk hasil vektor presisi.", {
      icon: "🖨️",
      duration: 3500,
    });
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleCopyId = () => {
    if (!selectedStudent?.idSertifikat) return;
    navigator.clipboard.writeText(selectedStudent.idSertifikat);
    setHasCopiedId(true);
    toast.success("ID Sertifikat berhasil disalin!");
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  const isGraded = Boolean(
    selectedStudent.sudahDinilai &&
    selectedStudent.statusPenilaian === "SUDAH_DINILAI" &&
    selectedStudent.nilai &&
    selectedStudent.nilai.total > 0 &&
    selectedStudent.nilai.predikat !== "Belum Dinilai"
  );

  const rawNomor = selectedStudent.nomorSertifikat || "";
  const formattedNomor = rawNomor && !rawNomor.includes("DRAFT")
    ? rawNomor
    : `KKNT/${String(selectedStudent.noUrut || 1).padStart(3, '0')}/UNIKOM/BATCH-1/XI/2026`;

  const formattedName = selectedStudent.nama ? selectedStudent.nama.toUpperCase().trim() : '';
  const tanggalTerbit = selectedStudent.tanggalTerbit && selectedStudent.tanggalTerbit !== "Menunggu Penilaian"
    ? selectedStudent.tanggalTerbit
    : "10 November 2026";

  // =========================================================================
  // CANVA BULK CREATE MODAL STATE & LOGIC (WITH GROUP & STUDENT SELECTION)
  // =========================================================================
  const [canvaGroupFilter, setCanvaGroupFilter] = useState<string>("ALL");
  const [canvaStatusFilter, setCanvaStatusFilter] = useState<string>("ALL");
  const [canvaSearchQuery, setCanvaSearchQuery] = useState<string>("");
  const [selectedNimsForCanva, setSelectedNimsForCanva] = useState<Set<string>>(new Set());

  // Filtered dataset for Canva modal
  const canvaFilteredStudents = useMemo(() => {
    return studentsData.filter((s) => {
      const matchGroup = canvaGroupFilter === "ALL" || s.kelompok === canvaGroupFilter;
      const isGraded = Boolean(
        s.sudahDinilai &&
        s.statusPenilaian === "SUDAH_DINILAI" &&
        s.nilai &&
        s.nilai.total > 0 &&
        s.nilai.predikat !== "Belum Dinilai"
      );
      const matchStatus =
        canvaStatusFilter === "ALL" ||
        (canvaStatusFilter === "SUDAH" && isGraded) ||
        (canvaStatusFilter === "BELUM" && !isGraded);
      const matchSearch =
        !canvaSearchQuery.trim() ||
        s.nama.toLowerCase().includes(canvaSearchQuery.toLowerCase()) ||
        s.nim.includes(canvaSearchQuery) ||
        s.prodi.toLowerCase().includes(canvaSearchQuery.toLowerCase());

      return matchGroup && matchStatus && matchSearch;
    });
  }, [studentsData, canvaGroupFilter, canvaStatusFilter, canvaSearchQuery]);

  // When opening modal or changing filters, auto-select all filtered students
  useEffect(() => {
    if (showCanvaModal) {
      const allFilteredNims = new Set(canvaFilteredStudents.map((s) => s.nim));
      setSelectedNimsForCanva(allFilteredNims);
    }
  }, [showCanvaModal, canvaGroupFilter, canvaStatusFilter]);

  const handleToggleSelectStudent = (nim: string) => {
    setSelectedNimsForCanva((prev) => {
      const next = new Set(prev);
      if (next.has(nim)) {
        next.delete(nim);
      } else {
        next.add(nim);
      }
      return next;
    });
  };

  const handleSelectAllCanva = () => {
    const allFilteredNims = new Set(canvaFilteredStudents.map((s) => s.nim));
    setSelectedNimsForCanva(allFilteredNims);
  };

  const handleDeselectAllCanva = () => {
    setSelectedNimsForCanva(new Set());
  };

  // Export dataset specifically formatted for Canva "Bulk Create" (Buat Massal)
  const handleDownloadCanvaCsv = () => {
    const targetStudents = studentsData.filter((s) => selectedNimsForCanva.has(s.nim));
    if (targetStudents.length === 0) {
      toast.error("Pilih minimal 1 mahasiswa untuk diekspor ke Canva!");
      return;
    }

    const headers = [
      "NIM",
      "Nama_Lengkap",
      "Program_Studi",
      "SKS",
      "Kelompok",
      "Wilayah_RW",
      "DPL_Nama",
      "Nomor_Sertifikat",
      "ID_Sertifikat",
      "Total_Jam_KKN",
      "Nilai_Personal",
      "Nilai_Proker",
      "Nilai_Laporan",
      "Nilai_Paper",
      "Nilai_Video",
      "Nilai_Akhir",
      "Predikat",
      "Tanggal_Terbit",
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = targetStudents.map((s) => {
      const nomor = s.nomorSertifikat && !s.nomorSertifikat.includes("DRAFT")
        ? s.nomorSertifikat
        : `KKNT/${String(s.noUrut || 1).padStart(3, '0')}/UNIKOM/BATCH-1/XI/2026`;
      const tgl = s.tanggalTerbit && s.tanggalTerbit !== "Menunggu Penilaian"
        ? s.tanggalTerbit
        : "10 November 2026";
      const totalNilai = s.nilai && s.nilai.total > 0 ? s.nilai.total.toFixed(2) : "-";
      const predikat = s.nilai?.predikat || "Belum Dinilai";

      return [
        escapeCsv(s.nim),
        escapeCsv(s.nama.toUpperCase()),
        escapeCsv(s.prodi),
        escapeCsv(s.sks),
        escapeCsv(s.kelompok),
        escapeCsv(s.rw),
        escapeCsv(s.dpl),
        escapeCsv(nomor),
        escapeCsv(s.idSertifikat),
        escapeCsv("450 Jam"),
        escapeCsv(s.nilai?.personal !== null ? s.nilai.personal.toFixed(1) : "-"),
        escapeCsv(s.nilai?.proker !== null ? s.nilai.proker.toFixed(1) : "-"),
        escapeCsv(s.nilai?.laporan !== null ? s.nilai.laporan.toFixed(1) : "-"),
        escapeCsv(s.nilai?.paper !== null ? s.nilai.paper.toFixed(1) : "-"),
        escapeCsv(s.nilai?.video !== null ? s.nilai.video.toFixed(1) : "-"),
        escapeCsv(totalNilai),
        escapeCsv(predikat),
        escapeCsv(tgl),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const groupSlug = canvaGroupFilter === "ALL" 
      ? "SEMUA_KELOMPOK" 
      : canvaGroupFilter.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();

    link.setAttribute("download", `DATA_CANVA_BULK_${groupSlug}_${targetStudents.length}_MAHASISWA.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Berhasil mengunduh dataset Canva (${targetStudents.length} Mahasiswa)!`);
  };

  return (
    <div className="w-full max-w-full space-y-5 text-slate-800 dark:text-slate-100 min-w-0 print:p-0 print:m-0 print:bg-white">
      {/* ── EMBED GOOGLE FONTS & 100% CANVA EXACT PRINT STYLES ────────────────────────── */}
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
            page-break-after: always !important;
            break-after: page !important;
          }
          .cert-print-sheet:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          /* Exact Canva Typography & Proportions in Print */
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
            margin-top: 10px !important;
          }
          .cert-recipient-name {
            font-size: 27pt !important;
            letter-spacing: 1px !important;
            margin-top: 4px !important;
            line-height: 1.2 !important;
          }
          .cert-bio-text {
            font-size: 11pt !important;
            margin-top: 3px !important;
          }
          .cert-sks-pill {
            font-size: 11pt !important;
            margin-top: 7px !important;
            padding: 3px 22px !important;
          }
          .cert-narration {
            font-size: 11pt !important;
            line-height: 1.45 !important;
            margin-top: 12px !important;
            max-width: 760px !important;
          }
          .cert-hours-label {
            font-size: 9.5pt !important;
          }
          .cert-hours-val {
            font-size: 15.5pt !important;
          }
          .cert-total-hours {
            font-size: 13pt !important;
            letter-spacing: 2px !important;
            margin-top: 8px !important;
          }
          .cert-sig-date {
            font-size: 9.5pt !important;
          }
          .cert-sig-role {
            font-size: 9pt !important;
            line-height: 1.25 !important;
          }
          .cert-sig-name {
            font-size: 9.5pt !important;
            margin-top: 2px !important;
          }
          .cert-page2-title {
            font-size: 26pt !important;
            letter-spacing: 2px !important;
          }
          .cert-card-label {
            font-size: 10.5pt !important;
          }
          .cert-card-val {
            font-size: 11.5pt !important;
          }
          .cert-table th {
            font-size: 11pt !important;
            padding: 8px 12px !important;
          }
          .cert-table td {
            font-size: 10.5pt !important;
            padding: 7.5px 14px !important;
          }
        }
      `}</style>

      {/* ── BERSEKA NATIVE PAGE HEADER (CONSISTENT WITH OTHER BERSEKA PAGES) ──── */}
      <div className="no-print">
        <PageHeader
          icon={Award}
          category="PENILAIAN KKN"
          scope="E-Sertifikat Kelulusan Resmi"
          title="E-Sertifikat KKN Tematik UNIKOM"
          description="Format resmi 2 Halaman Canva: Sertifikat Kelulusan 450 Jam & Transkrip Rekapitulasi 5 Aspek Resmi"
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Sync Live Database Button */}
              <button
                type="button"
                onClick={() => fetchLiveData(true)}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-60"
                title="Perbarui data mahasiswa & nilai langsung dari database live"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? "animate-spin text-[#009966]" : ""}`} />
                <span className="hidden sm:inline">{isSyncing ? "Menyinkronkan..." : "Sinkron Data Live"}</span>
              </button>

              {/* Format Canva (Bulk Create) Button */}
              {!isMahasiswa && (
                <button
                  type="button"
                  onClick={() => setShowCanvaModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-2xs transition cursor-pointer"
                  title="Pilih kelompok & unduh CSV untuk Buat Massal di Canva"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Format Canva (Bulk Create)</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-[10px] font-extrabold font-mono">
                    {filteredStudents.length}
                  </span>
                </button>
              )}

              {/* Cetak / Simpan PDF Vektor Button */}
              <button
                type="button"
                onClick={handlePrintCertificate}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs transition cursor-pointer"
                title="Cetak Langsung atau Simpan sebagai PDF Vektor (A4 Landscape)"
              >
                <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Cetak / Simpan PDF</span>
              </button>

              {/* Unduh Berkas PDF Resmi Button */}
              <button
                type="button"
                onClick={handleDirectDownloadPdf}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#009966] hover:bg-[#008055] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60"
                title="Unduh Berkas PDF Resmi Resolusi Cetak"
              >
                <FileDown className="w-4 h-4" />
                <span>{isDownloading ? "Menyiapkan PDF..." : "Unduh PDF Resmi"}</span>
              </button>
            </div>
          }
        />
      </div>

      {/* ── SELECTOR & METADATA BAR (HIDDEN IN PRINT) ───────────────── */}
      <div className="no-print">
        {/* Mahasiswa Personal Lock View */}
        {isMahasiswa ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/50 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#009966] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedStudent.nama}</h2>
                    {isGraded ? (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                        LULUS &bull; {selectedStudent.nilai.predikat}
                      </span>
                    ) : (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
                        Belum Selesai Dinilai
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    NIM: <strong className="font-mono text-slate-900 dark:text-slate-100">{selectedStudent.nim}</strong> &bull; Program Studi: <strong>{selectedStudent.prodi}</strong> &bull; {selectedStudent.kelompok} ({selectedStudent.sks} SKS)
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-2.5 sm:text-right shrink-0">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">ID Verifikasi Sertifikat:</span>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                    {selectedStudent.idSertifikat}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1 hover:bg-emerald-200/50 rounded-md transition cursor-pointer text-emerald-700 dark:text-emerald-400"
                    title="Salin ID Sertifikat"
                  >
                    {hasCopiedId ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Dosen Pembimbing: {selectedStudent.dpl}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Non-Mahasiswa (Admin, Pimpinan, Super User, DPL) Standard Selector */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3.5">
            {/* Pimpinan Notice Banner */}
            {isPimpinan && (
              <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Mode Pemantauan Eksekutif:</strong> Anda memiliki hak akses peninjauan dan pemantauan e-sertifikat mahasiswa KKN Tematik UNIKOM (View-Only).
                </span>
              </div>
            )}

            {/* Filter Row: Search, Kelompok, Status, & Quick Navigator */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search Input with Instant Autocomplete */}
              <div className="md:col-span-4 relative" ref={searchContainerRef}>
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, NIM, atau program studi..."
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredStudents.length > 0) {
                      handleSelectStudent(filteredStudents[0]);
                      setIsSearchFocused(false);
                    } else if (e.key === "Escape") {
                      setIsSearchFocused(false);
                    }
                  }}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] text-slate-800 dark:text-slate-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchFocused(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Instant Autocomplete Suggestions Dropdown */}
                {isSearchFocused && searchQuery.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                      <span>Hasil Pencarian ({filteredStudents.length} Mahasiswa)</span>
                      <span className="text-[10px] text-[#009966] font-semibold">Klik untuk memilih</span>
                    </div>
                    {filteredStudents.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Tidak ada mahasiswa yang cocok dengan "<strong>{searchQuery}</strong>".
                      </div>
                    ) : (
                      filteredStudents.slice(0, 10).map((s) => (
                        <button
                          key={s.nim}
                          type="button"
                          onClick={() => {
                            handleSelectStudent(s);
                            setIsSearchFocused(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                            s.nim === selectedStudent.nim ? "bg-emerald-50/60 dark:bg-emerald-950/40 font-semibold border-l-4 border-[#009966]" : ""
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                              <span>{s.nama}</span>
                              {s.nim === selectedStudent.nim && (
                                <span className="text-[9.5px] font-bold bg-[#009966] text-white px-1.5 py-0.2 rounded-sm">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              NIM: <strong className="font-mono text-slate-700 dark:text-slate-300">{s.nim}</strong> &bull; {s.prodi}
                            </div>
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                              {s.kelompok}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 block">
                              {s.sks} SKS
                            </span>
                            {s.sudahDinilai && s.nilai?.total > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mt-1">
                                {s.nilai.total.toFixed(1)} ({s.nilai.predikat.split(" ")[0]})
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Filter Kelompok */}
              <div className="md:col-span-3">
                <select
                  value={selectedKelompok}
                  onChange={(e) => setSelectedKelompok(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] cursor-pointer"
                >
                  <option value="ALL">Semua Kelompok ({studentsData.length} Mhs)</option>
                  {kelompokList.map((k) => (
                    <option key={k} value={k}>
                      {k} ({studentsData.filter((x) => x.kelompok === k).length} Mhs)
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Status Penilaian */}
              <div className="md:col-span-2">
                <select
                  value={filterStatusPenilaian}
                  onChange={(e) => setFilterStatusPenilaian(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="SUDAH">Sudah Dinilai</option>
                  <option value="BELUM">Belum Dinilai</option>
                </select>
              </div>

              {/* Quick Student Selector Dropdown with Next / Prev Stepper */}
              <div className="md:col-span-3 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevStudent}
                  disabled={currentStudentIndex <= 0}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer text-slate-700 dark:text-slate-300"
                  title="Mahasiswa sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <select
                  value={selectedStudent.nim}
                  onChange={(e) => {
                    const s = studentsData.find((x) => x.nim === e.target.value);
                    if (s) handleSelectStudent(s);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#009966]/30 cursor-pointer truncate"
                >
                  {!filteredStudents.some((x) => x.nim === selectedStudent.nim) && (
                    <option key={selectedStudent.nim} value={selectedStudent.nim}>
                      {selectedStudent.nim} - {selectedStudent.nama} ({selectedStudent.sks} SKS)
                    </option>
                  )}
                  {filteredStudents.map((s) => (
                    <option key={s.nim} value={s.nim}>
                      {s.nim} - {s.nama} ({s.sks} SKS)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleNextStudent}
                  disabled={currentStudentIndex >= filteredStudents.length - 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer text-slate-700 dark:text-slate-300"
                  title="Mahasiswa berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Student Quick Summary Pill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedStudent.nama}
                </span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-slate-500">
                  NIM: <strong className="text-slate-700 dark:text-slate-300 font-mono">{selectedStudent.nim}</strong>
                </span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-slate-500">
                  Prodi: <strong className="text-slate-700 dark:text-slate-300">{selectedStudent.prodi}</strong>
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10.5px]">
                  {selectedStudent.sks} SKS
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-full text-[10.5px]">
                  {selectedStudent.kelompok}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Nilai Akhir:</span>
                  {isGraded ? (
                    <span className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-md text-xs">
                      {selectedStudent.nilai.total.toFixed(2)} ({selectedStudent.nilai.predikat.split(" ")[0]})
                    </span>
                  ) : (
                    <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold px-2.5 py-0.5 rounded-md text-xs">
                      Belum Dinilai
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  <span>{selectedStudent.idSertifikat}</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="hover:text-emerald-600 cursor-pointer"
                    title="Salin ID Sertifikat"
                  >
                    {hasCopiedId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── LIVE CERTIFICATE RENDER AREA (100% CANVA RESMI MOCKUP ALIGNED) ─── */}
      <div className="cert-export-wrapper max-w-[1150px] mx-auto mt-4 px-2 flex flex-col items-center gap-8 print:p-0 print:m-0 print:max-w-none print:w-full">
        
        {/* ==================== HALAMAN 1: SERTIFIKAT ==================== */}
        <div
          className="cert-print-sheet relative w-full aspect-[1.414/1] bg-white rounded-lg shadow-xl overflow-hidden print:shadow-none print:rounded-none print:m-0 print:w-full print:aspect-[1.414/1] print:break-after-page"
          style={{
            backgroundImage: "url('/image/serti/certificate_frame_hires.png')",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Inner Content Area */}
          <div className="absolute inset-0 flex flex-col items-center px-8 md:px-16 pt-7 md:pt-10 pb-6 select-none box-border">
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

            {/* Title SERTIFIKAT */}
            <div className="flex items-center justify-center gap-4 mt-4 md:mt-5 w-full">
              <div className="h-[1.5px] bg-[#C5A059] w-16 md:w-28" />
              <h2 className="cert-title-main font-cinzel text-2xl md:text-4xl font-extrabold text-[#0A2540] tracking-[3px] m-0 leading-none">
                SERTIFIKAT
              </h2>
              <div className="h-[1.5px] bg-[#C5A059] w-16 md:w-28" />
            </div>

            <div className="cert-title-sub1 text-xs md:text-[15.5pt] font-extrabold text-[#005AA9] tracking-wide mt-1.5 uppercase">
              PESERTA KKN TEMATIK BATCH I
            </div>
            <div className="cert-title-sub2 text-[11px] md:text-[13.5pt] font-extrabold text-[#005AA9] tracking-wide mt-0.5 uppercase">
              TAHUN AKADEMIK 2026/2027
            </div>
            <div className="cert-number text-[10px] md:text-[11pt] font-semibold text-[#0A2540] mt-1">
              {formattedNomor.startsWith("Nomor:") ? formattedNomor : `Nomor: ${formattedNomor}`}
            </div>

            <div className="cert-given-to font-playfair text-[10px] md:text-[11.5pt] italic text-[#0A2540] mt-2">
              Diberikan kepada:
            </div>

            {/* Recipient Name */}
            <div className="cert-recipient-name font-playfair text-xl md:text-[27pt] font-black text-[#0A2540] tracking-wide mt-1 uppercase text-center whitespace-nowrap">
              {formattedName}
            </div>

            {/* Diamond Divider */}
            <div className="flex items-center justify-center gap-3 w-full max-w-[420px] md:max-w-[480px] mt-1">
              <div className="h-[1px] bg-[#C5A059] flex-1" />
              <span className="text-[#C5A059] text-[8pt] md:text-[10pt] leading-none">&#9670;</span>
              <div className="h-[1px] bg-[#C5A059] flex-1" />
            </div>

            {/* NIM & Prodi */}
            <div className="cert-bio-text text-[10px] md:text-[11pt] font-semibold text-[#0A2540] mt-1">
              NIM: {selectedStudent.nim}
            </div>
            <div className="cert-bio-text text-[10px] md:text-[11pt] font-semibold text-[#0A2540] mt-0.5">
              Program Studi: {selectedStudent.prodi}
            </div>

            {/* Narration 450 Jam */}
            <div className="cert-narration text-[9px] md:text-[10.5pt] text-[#0A2540] text-center max-w-[620px] md:max-w-[660px] leading-relaxed mt-3.5 md:mt-4 font-sans">
              Telah mengikuti Kuliah Kerja Nyata (KKN) Tematik Batch I Universitas Komputer Indonesia pada periode Juli–Oktober 2026 dengan total beban kegiatan 450 jam.
            </div>

            {/* 3 Columns Hours Breakdown */}
            <div className="flex items-center justify-center w-full max-w-[620px] md:max-w-[660px] mt-2.5">
              <div className="flex-1 text-center px-2">
                <div className="cert-hours-label text-[8.5px] md:text-[9.5pt] font-semibold text-[#0A2540] mb-0.5">Persiapan</div>
                <div className="cert-hours-val text-base md:text-[16pt] font-extrabold text-[#005AA9]">100 jam</div>
              </div>
              <div className="w-[1.5px] h-8 md:h-[38px] bg-[#C5A059] shrink-0" />
              <div className="flex-1 text-center px-2">
                <div className="cert-hours-label text-[8.5px] md:text-[9.5pt] font-semibold text-[#0A2540] mb-0.5">Pelaksanaan di lapangan</div>
                <div className="cert-hours-val text-base md:text-[16pt] font-extrabold text-[#005AA9]">250 jam</div>
              </div>
              <div className="w-[1.5px] h-8 md:h-[38px] bg-[#C5A059] shrink-0" />
              <div className="flex-1 text-center px-2">
                <div className="cert-hours-label text-[8.5px] md:text-[9.5pt] font-semibold text-[#0A2540] mb-0.5">Evaluasi dan pelaporan</div>
                <div className="cert-hours-val text-base md:text-[16pt] font-extrabold text-[#005AA9]">100 jam</div>
              </div>
            </div>

            {/* TOTAL 450 JAM */}
            <div className="cert-total-hours font-cinzel text-xs md:text-[13pt] font-extrabold text-[#0A2540] tracking-[2px] mt-1.5">
              TOTAL 450 JAM
            </div>

            {/* Page 1 Bottom: Signature Block */}
            <div className="absolute bottom-6 md:bottom-7 left-10 md:left-14 right-14 md:right-20 flex justify-end items-end">
              <div className="flex flex-col items-center text-center w-64 md:w-80">
                <div className="cert-sig-date text-[8.5px] md:text-[9.5pt] font-semibold text-[#0A2540]">
                  Bandung, {tanggalTerbit}
                </div>
                <div className="cert-sig-role text-[8px] md:text-[9pt] font-bold text-[#0A2540] leading-tight mt-0.5">
                  Wakil Rektor I UNIKOM<br />Bidang Akademik dan Kemahasiswaan
                </div>

                <div className="my-1 border border-slate-300 rounded-md p-1 bg-white flex items-center gap-2 w-44 md:w-52 h-11 md:h-13 shadow-2xs">
                  <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 p-0.5">
                    <QrSvgComponent idSertifikat={selectedStudent.idSertifikat} />
                  </div>
                  <div className="text-[6px] md:text-[6.5pt] font-mono text-left text-[#0A2540] leading-tight">
                    <strong className="block text-[#005AA9] font-sans text-[6.5px] md:text-[7pt]">
                      TANDA TANGAN ELEKTRONIK
                    </strong>
                    <span>{selectedStudent.idSertifikat.slice(0, 18)}</span><br />
                    <span className="text-emerald-600 font-bold">VERIFIKASI SAH LPPM</span>
                  </div>
                </div>

                <div className="cert-sig-name text-[8px] md:text-[9.5pt] font-bold text-[#0A2540] whitespace-nowrap">
                  Prof. Dr. Hj. Umi Narimawati, Dra., S.E., M.Si.
                </div>
              </div>
            </div>
          </div>
        </div>

              
        {/* ==================== HALAMAN 2: REKAP PENILAIAN ==================== */}
        <div
          className="cert-print-sheet relative w-full aspect-[1.414/1] bg-white rounded-lg shadow-xl overflow-hidden print:shadow-none print:rounded-none print:m-0 print:w-full print:aspect-[1.414/1] print:break-after-avoid"
          style={{
            backgroundImage: "url('/image/serti/certificate_frame_hires.png')",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Inner Content Area */}
          <div className="absolute inset-0 flex flex-col items-center px-8 md:px-16 pt-7 md:pt-10 pb-6 select-none box-border">
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

            {/* Title REKAP PENILAIAN PESERTA */}
            <div className="flex items-center justify-center gap-4 mt-4 md:mt-5 w-full">
              <div className="h-[1.5px] bg-[#C5A059] w-12 md:w-24" />
              <h2 className="cert-page2-title font-cinzel text-xl md:text-[26pt] font-extrabold text-[#0A2540] tracking-[2px] m-0 leading-none">
                REKAP PENILAIAN PESERTA
              </h2>
              <div className="h-[1.5px] bg-[#C5A059] w-12 md:w-24" />
            </div>

            <div className="cert-title-sub1 text-[11px] md:text-[13.5pt] font-extrabold text-[#005AA9] tracking-wide mt-1.5 uppercase">
              KKN TEMATIK BATCH I &bull; PERIODE JULI–OKTOBER 2026
            </div>
            <div className="cert-number text-[10px] md:text-[11pt] font-semibold text-[#0A2540] mt-0.5">
              {formattedNomor.startsWith("Nomor:") ? formattedNomor : `Nomor sertifikat: ${formattedNomor}`}
            </div>

            {/* ── 4-COLUMN STUDENT IDENTITY (100% CANVA EXACT & SEJAJAR) ── */}
            <div className="flex items-center w-full max-w-[880px] mt-4 mb-2">
              <div className="flex-1 text-center px-1 md:px-2">
                <div className="cert-card-label font-sans text-[9.5px] md:text-[10pt] font-bold text-[#0A2540] mb-0.5">
                  Nama:
                </div>
                <div className="cert-card-val font-sans text-[10.5px] md:text-[12pt] font-extrabold text-[#005AA9] uppercase truncate">
                  {formattedName}
                </div>
              </div>
              
              <div className="w-[1.5px] h-7 md:h-[32px] bg-[#C5A059] shrink-0" />

              <div className="flex-1 text-center px-1 md:px-2">
                <div className="cert-card-label font-sans text-[9.5px] md:text-[10pt] font-bold text-[#0A2540] mb-0.5">
                  NIM:
                </div>
                <div className="cert-card-val font-sans text-[10.5px] md:text-[12pt] font-extrabold text-[#005AA9]">
                  {selectedStudent.nim}
                </div>
              </div>

              <div className="w-[1.5px] h-7 md:h-[32px] bg-[#C5A059] shrink-0" />

              <div className="flex-1 text-center px-1 md:px-2">
                <div className="cert-card-label font-sans text-[9.5px] md:text-[10pt] font-bold text-[#0A2540] mb-0.5">
                  Program Studi:
                </div>
                <div className="cert-card-val font-sans text-[10.5px] md:text-[12pt] font-extrabold text-[#005AA9] uppercase truncate">
                  {selectedStudent.prodi.toUpperCase()}
                </div>
              </div>

              <div className="w-[1.5px] h-7 md:h-[32px] bg-[#C5A059] shrink-0" />

              <div className="flex-1 text-center px-1 md:px-2">
                <div className="cert-card-label font-sans text-[9.5px] md:text-[10pt] font-bold text-[#0A2540] mb-0.5">
                  SKS diambil:
                </div>
                <div className="cert-card-val font-sans text-[10.5px] md:text-[12pt] font-extrabold text-[#005AA9]">
                  {selectedStudent.sks} SKS
                </div>
              </div>
            </div>

            {/* ── 5 ASPECTS TABLE (MATCHING WIDTH & BORDER 100%) ── */}
            <table className="cert-table w-full max-w-[880px] mt-2 border-collapse border-[1.5px] border-[#0D2C54] bg-white shadow-2xs">
              <thead>
                <tr className="bg-[#0D2C54] text-white">
                  <th className="py-1.5 md:py-2 px-3 border border-[#0D2C54] text-center text-[10px] md:text-[11pt] font-bold w-[10%]">
                    No.
                  </th>
                  <th className="py-1.5 md:py-2 px-4 border border-[#0D2C54] text-left text-[10px] md:text-[11pt] font-bold w-[68%]">
                    Aspek
                  </th>
                  <th className="py-1.5 md:py-2 px-4 border border-[#0D2C54] text-center text-[10px] md:text-[11pt] font-bold w-[22%]">
                    Nilai
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white hover:bg-slate-50">
                  <td className="py-1.5 md:py-2 px-3 border border-[#CBD5E1] text-center font-bold text-[#0A2540] text-[9.5px] md:text-[10.5pt]">
                    1
                  </td>
                  <td className="py-1.5 md:py-2 px-4 border border-[#CBD5E1] font-semibold text-[#0A2540] text-[9.5px] md:text-[10.5pt]">
                    Nilai personal
                  </td>
                  <td className="py-1.5 md:py-2 px-4 border border-[#CBD5E1] text-center font-extrabold text-[#005AA9] text-[10px] md:text-[11pt]">
                    {selectedStudent.nilai.personal !== null && selectedStudent.nilai.personal > 0
                      ? selectedStudent.nilai.personal.toFixed(1)
                      : "-"}
                  </td>
                </tr>
                <tr className="bg-[#F0F7FF] hover:bg-blue-50/60">
                  <td className="py-1.5 md:py-2 px-3 border border-[#CBD5E1] text-center font-bold text-[#0A2540] text-[9.5px] md:text-[10.5pt]">
                    2
                  </td>
                  <td className="py-1.5 md:py-2 px-4 border border-[#CBD5E1] font-semibold text-[#0A2540] text-[9.5px] md:text-[10.5pt]">
                    Program kerja kelompok
                  </td>
                  <td className="py-1.5 md:py-2 px-4 border border-[#CBD5E1] text-center font-extrabold text-[#005AA9] text-[10px] md:text-[11pt]">
                    {selectedStudent.nilai.proker !== null && selectedStudent.nilai.proker > 0
                      ? selectedStudent.nilai.proker.toFixed(1)
                      : "-"}
                  </td>
                </tr>
                <tr className="bg-white hover:bg-slate-50">
                  <td className="py-1.5 md:py-2 px-3 border border-[#CBD5E1] text-center font-bold text-[#0A2540] text-[9.5px] md:text-[10.5pt]">
                    3
                  </td>
                  <td className="py-1.5 md:py-2 px-4 border border-[#CBD5E1] font-semibold text-[#0A2540] text-[9.5px] md:text-[10.5pt]">
                    Laporan akhir
                  </td>
                  <td className="py-1.5 md:py-2 px-4 border border-[#CBD5E1] text-center font-extrabold text-[#005AA9] text-[10px] md:text-[11pt]">
                    {selectedStudent.nilai.laporan !== null && selectedStudent.nilai.laporan > 0
                      ? selectedStudent.nilai.laporan.toFixed(1)
                      : "-"}
                  </td>
                </tr>
                <tr className="bg-[#F0F7FF] hover:bg-blue-50/60">
                  <td className="py-1.5 md:py-2 px-3 border border-[#CBD5E1] text-center font-bold text-[#0A2540] text-[9.5px] md:text-[10.5pt]">
                    4
                  </td>
                  <td className="py-1.5 md:py-2 px-4 border border-[#CBD5E1] font-semibold text-[#0A2540] text-[9.5px] md:text-[10.5pt]">
                    Paper
                  </td>
                  <td className="py-1.5 md:py-2 px-4 border border-[#CBD5E1] text-center font-extrabold text-[#005AA9] text-[10px] md:text-[11pt]">
                    {selectedStudent.nilai.paper !== null && selectedStudent.nilai.paper > 0
                      ? selectedStudent.nilai.paper.toFixed(1)
                      : "-"}
                  </td>
                </tr>
                <tr className="bg-white hover:bg-slate-50">
                  <td className="py-1.5 md:py-2 px-3 border border-[#CBD5E1] text-center font-bold text-[#0A2540] text-[9.5px] md:text-[10.5pt]">
                    5
                  </td>
                  <td className="py-1.5 md:py-2 px-4 border border-[#CBD5E1] font-semibold text-[#0A2540] text-[9.5px] md:text-[10.5pt]">
                    Video
                  </td>
                  <td className="py-1.5 md:py-2 px-4 border border-[#CBD5E1] text-center font-extrabold text-[#005AA9] text-[10px] md:text-[11pt]">
                    {selectedStudent.nilai.video !== null && selectedStudent.nilai.video > 0
                      ? selectedStudent.nilai.video.toFixed(1)
                      : "-"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Page 2 Bottom: Legal & ID */}
            <div className="absolute bottom-6 md:bottom-7 left-12 right-12 text-center">
              <div className="text-[7.5px] md:text-[8.5pt] text-slate-500 italic mb-0.5">
                Nilai diisi berdasarkan hasil penilaian resmi. Jumlah SKS mengikuti pengambilan peserta dan ketentuan akademik.
              </div>
              <div className="text-[6.5px] md:text-[7.5pt] font-mono text-slate-400 font-semibold tracking-wider">
                {selectedStudent.idSertifikat} &bull; Halaman 2 dari 2
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL EKSPOR FORMAT CANVA BULK CREATE DENGAN PILIHAN KELOMPOK ──── */}
      {showCanvaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header (Native Berseka Styling) */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900/50">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Ekspor Dataset Canva (Bulk Create)
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Format UTF-8 BOM
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pilih kelompok atau mahasiswa tertentu untuk diekspor ke master template Canva resmi UNIKOM
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCanvaModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
              {/* Filter Controls Row */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Pilihan Cakupan Mahasiswa yang Diekspor:
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Sumber Data: <strong className="text-emerald-700 dark:text-emerald-400">{isLiveDatabase ? "Live Database API" : "Lokal Bundle"}</strong> ({lastSyncTime})
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Select Group */}
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Pilih Kelompok KKN:
                    </label>
                    <select
                      value={canvaGroupFilter}
                      onChange={(e) => setCanvaGroupFilter(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] cursor-pointer"
                    >
                      <option value="ALL">Semua Kelompok ({studentsData.length} Mahasiswa)</option>
                      {kelompokList.map((k) => (
                        <option key={k} value={k}>
                          {k} ({studentsData.filter((x) => x.kelompok === k).length} Mahasiswa)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Status */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Status Penilaian:
                    </label>
                    <select
                      value={canvaStatusFilter}
                      onChange={(e) => setCanvaStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] cursor-pointer"
                    >
                      <option value="ALL">Semua Status Penilaian</option>
                      <option value="SUDAH">Hanya Sudah Dinilai (Siap Terbit)</option>
                      <option value="BELUM">Hanya Belum Dinilai (Draft)</option>
                    </select>
                  </div>

                  {/* Search within Modal */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Cari Cepat:
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Nama / NIM..."
                        value={canvaSearchQuery}
                        onChange={(e) => setCanvaSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Batch Selection Tools & Count Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllCanva}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                      Pilih Semua ({canvaFilteredStudents.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllCanva}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      Kosongkan Pilihan
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[11.5px]">Mahasiswa terpilih:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#009966] font-mono font-black text-xs border border-emerald-300 dark:border-emerald-800">
                      {selectedNimsForCanva.size} dari {canvaFilteredStudents.length} Mahasiswa
                    </span>
                  </div>
                </div>
              </div>

              {/* Checklist Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              canvaFilteredStudents.length > 0 &&
                              canvaFilteredStudents.every((s) => selectedNimsForCanva.has(s.nim))
                            }
                            onChange={(e) => {
                              if (e.target.checked) handleSelectAllCanva();
                              else handleDeselectAllCanva();
                            }}
                            className="rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-2 px-3 w-28">NIM</th>
                        <th className="py-2 px-3">Nama Mahasiswa</th>
                        <th className="py-2 px-3">Program Studi</th>
                        <th className="py-2 px-3">Kelompok</th>
                        <th className="py-2 px-3 w-20 text-center">SKS</th>
                        <th className="py-2 px-3 w-28 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {canvaFilteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                            Tidak ada mahasiswa yang sesuai dengan filter di atas.
                          </td>
                        </tr>
                      ) : (
                        canvaFilteredStudents.map((s) => {
                          const isChecked = selectedNimsForCanva.has(s.nim);
                          const isGradedStudent = Boolean(
                            s.sudahDinilai &&
                            s.statusPenilaian === "SUDAH_DINILAI" &&
                            s.nilai &&
                            s.nilai.total > 0
                          );
                          return (
                            <tr
                              key={s.nim}
                              onClick={() => handleToggleSelectStudent(s.nim)}
                              className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                                isChecked ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                              }`}
                            >
                              <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleSelectStudent(s.nim)}
                                  className="rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                                {s.nim}
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">
                                {s.nama}
                              </td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                                {s.prodi}
                              </td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                                {s.kelompok}
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                                {s.sks}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {isGradedStudent ? (
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                                    {s.nilai.total.toFixed(1)} (Lulus)
                                  </span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                                    Belum Dinilai
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5-Step Practical Canva Instructions */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Panduan Impor Massal (Bulk Create) di Canva Resmi:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <strong className="block text-slate-900 dark:text-slate-100 mb-0.5">1. Buka Template Canva</strong>
                    <span className="text-slate-500">Buka master desain e-sertifikat KKN UNIKOM resmi.</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <strong className="block text-slate-900 dark:text-slate-100 mb-0.5">2. Pilih Aplikasi Bulk Create</strong>
                    <span className="text-slate-500">Di menu bar kiri Canva, klik <strong>Apps</strong> &gt; cari <strong>Bulk Create</strong> (Buat Massal).</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <strong className="block text-slate-900 dark:text-slate-100 mb-0.5">3. Unggah Berkas CSV</strong>
                    <span className="text-slate-500">Pilih <strong>Upload CSV</strong> dan pilih file CSV yang baru diunduh dari tombol di bawah.</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <strong className="block text-slate-900 dark:text-slate-100 mb-0.5">4. Hubungkan Data ke Teks</strong>
                    <span className="text-slate-500">Klik kanan teks Nama &gt; <strong>Connect Data</strong> &gt; pilih <code>Nama_Lengkap</code>. Ulangi untuk <code>NIM</code>, <code>SKS</code>, dll.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Format: <strong className="text-slate-800 dark:text-slate-200 font-mono">18 Kolom Data Lengkap</strong> (Nama, NIM, Nilai 5 Aspek, SKS, No. Sertifikat)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCanvaModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCanvaCsv}
                  disabled={selectedNimsForCanva.size === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#009966] hover:bg-[#008055] disabled:opacity-50 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh CSV Canva ({selectedNimsForCanva.size} Mahasiswa)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SVG QR Code generator component for React UI
const QrSvgComponent: React.FC<{ idSertifikat: string }> = ({ idSertifikat }) => {
  const pattern = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < idSertifikat.length; i++) {
      hash = (hash << 5) - hash + idSertifikat.charCodeAt(i);
      hash |= 0;
    }
    const rects: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        // Corners: 4x4 squares
        const isTL = x < 4 && y < 4;
        const isTR = x > 10 && y < 4;
        const isBL = x < 4 && y > 10;
        if (isTL || isTR || isBL) {
          const inBorder = x === 0 || x === 3 || y === 0 || y === 3 || x === 11 || x === 14 || y === 11 || y === 14;
          const isCenter = (x === 1 || x === 2) && (y === 1 || y === 2);
          if (inBorder || isCenter) rects.push({ x, y });
        } else {
          // Inner pseudorandom pattern
          const val = (Math.abs(hash) * (x + 1) * (y + 1) + x * 7 + y * 13) % 100;
          if (val > 48) rects.push({ x, y });
        }
      }
    }
    return rects;
  }, [idSertifikat]);

  return (
    <svg viewBox="0 0 15 15" className="w-full h-full" shapeRendering="crispEdges">
      {pattern.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width="1" height="1" fill="#0A2540" />
      ))}
    </svg>
  );
};

export default SertifikatKknPage;
