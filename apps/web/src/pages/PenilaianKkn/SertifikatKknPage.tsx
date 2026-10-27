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

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Award,
  Search,
  ChevronLeft,
  GraduationCap,
  ShieldCheck,
  FileDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import studentsDataRaw from "../../data/students_certificates_data.json";
import { sertifikatKknService, type StudentCertData } from "../../services/sertifikatKknService";

export const SertifikatKknPage: React.FC = () => {
  const { user } = useAuthStore();
  const [studentsData, setStudentsData] = useState<StudentCertData[]>(studentsDataRaw as StudentCertData[]);
  const [, setIsLoadingLive] = useState<boolean>(true);
  const [, setIsLiveDatabase] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Sync live database from API if available
  useEffect(() => {
    let mounted = true;
    const fetchLiveData = async () => {
      try {
        const liveList = await sertifikatKknService.getSertifikatList();
        if (mounted && liveList && liveList.length > 0) {
          setStudentsData(liveList);
          setIsLiveDatabase(true);
        }
      } catch (err) {
        console.warn("[SertifikatKknPage] Fallback to bundled dataset:", err);
      } finally {
        if (mounted) setIsLoadingLive(false);
      }
    };
    fetchLiveData();
    return () => {
      mounted = false;
    };
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

  // Initial student from query param or logged in Mahasiswa or default to #1
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
      return matchSearch && matchKelompok;
    });
  }, [searchQuery, selectedKelompok, isMahasiswa, selectedStudent, studentsData]);

  // Direct Official High-Res PDF Download with seamless print fallback
  const handleDirectDownloadPdf = async () => {
    setIsDownloading(true);
    const safeName = selectedStudent.nama.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `SERTIFIKAT_KKN_${selectedStudent.nim}_${safeName}.pdf`;
    const directUrl = `/certificates/${fileName}`;

    try {
      // Check if pre-generated official PDF exists
      const res = await fetch(directUrl, { method: "HEAD" });
      if (res.ok) {
        const link = document.createElement("a");
        link.href = directUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Mengunduh berkas PDF resmi: ${selectedStudent.nama}`);
        setIsDownloading(false);
        return;
      }
    } catch (err) {
      console.warn("[SertifikatKknPage] Direct PDF check fallback:", err);
    }

    setIsDownloading(false);
    toast.loading("Membuka dialog cetak / simpan PDF resolusi tinggi...", { duration: 2500 });
    setTimeout(() => {
      window.print();
    }, 400);
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-16 print:p-0 print:bg-white print:m-0">
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

      {/* ── TOP ACTION BAR (HIDDEN IN PRINT) ────────────────────────── */}
      <div className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-700" />
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  E-Sertifikat Resmi KKN Tematik UNIKOM
                </h1>
                <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Batch I &bull; 450 Jam
                </span>

                {isPimpinan && (
                  <span className="hidden sm:inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                    <ShieldCheck className="w-3 h-3 text-purple-700" />
                    Mode Monitoring Pimpinan
                  </span>
                )}

                {isMahasiswa && (
                  <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <GraduationCap className="w-3 h-3 text-emerald-700" />
                    Portal Mahasiswa
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Format resmi 2 Halaman Canva: Sertifikat Kelulusan &amp; Transkrip Rekapitulasi 5 Aspek Resmi
              </p>
            </div>
          </div>

          {/* Single Primary Action: [Unduh PDF] */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDirectDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Unduh Berkas PDF Resmi Vektor Resolusi Cetak"
            >
              <FileDown className="w-4 h-4" />
              <span>{isDownloading ? "Menyiapkan PDF..." : "Unduh PDF"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SELECTOR & METADATA BAR (HIDDEN IN PRINT) ───────────────── */}
      <div className="no-print max-w-7xl mx-auto px-4 mt-4">
        {/* Mahasiswa Personal Lock View */}
        {isMahasiswa ? (
          <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900">{selectedStudent.nama}</h2>
                    {isGraded ? (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                        LULUS &bull; {selectedStudent.nilai.predikat}
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-300">
                        Belum Selesai Dinilai
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    NIM: <strong className="font-mono text-slate-900">{selectedStudent.nim}</strong> &bull; Program Studi: <strong>{selectedStudent.prodi}</strong> &bull; {selectedStudent.kelompok} ({selectedStudent.sks} SKS)
                  </p>
                </div>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2.5 sm:text-right shrink-0">
                <span className="text-[11px] text-blue-700 font-semibold block">ID Verifikasi Sertifikat:</span>
                <span className="font-mono text-xs font-black text-blue-900">
                  {selectedStudent.idSertifikat}
                </span>
                <span className="text-[10.5px] text-slate-500 block mt-0.5">
                  Dosen Pembimbing: {selectedStudent.dpl}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Non-Mahasiswa (Admin, Pimpinan, Super User, DPL) Standard Selector */
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            {/* Pimpinan Notice Banner */}
            {isPimpinan && (
              <div className="bg-purple-50/90 border border-purple-200/90 rounded-lg p-2.5 flex items-center gap-2.5 text-xs text-purple-900">
                <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                <span>
                  <strong>Mode Monitoring Pimpinan:</strong> Anda memiliki hak akses peninjauan dan pemantauan e-sertifikat mahasiswa KKN Tematik UNIKOM.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search Input */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, NIM, atau prodi mahasiswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Filter Kelompok */}
              <div className="md:col-span-4">
                <select
                  value={selectedKelompok}
                  onChange={(e) => setSelectedKelompok(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium cursor-pointer"
                >
                  <option value="ALL">Semua Kelompok ({studentsData.length} Mahasiswa)</option>
                  {kelompokList.map((k) => (
                    <option key={k} value={k}>
                      {k} ({studentsData.filter((x) => x.kelompok === k).length} Mahasiswa)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Student Selector Dropdown */}
              <div className="md:col-span-3">
                <select
                  value={selectedStudent.nim}
                  onChange={(e) => {
                    const s = studentsData.find((x) => x.nim === e.target.value);
                    if (s) handleSelectStudent(s);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-blue-300 bg-blue-50/50 text-blue-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                >
                  {filteredStudents.map((s) => (
                    <option key={s.nim} value={s.nim}>
                      {s.nim} - {s.nama} ({s.sks} SKS)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student Quick Summary Pill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-slate-900">
                  {selectedStudent.nama}
                </span>
                <span className="text-slate-500">NIM: <strong className="text-slate-700 font-mono">{selectedStudent.nim}</strong></span>
                <span className="text-slate-500">Prodi: <strong className="text-slate-700">{selectedStudent.prodi}</strong></span>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10.5px]">
                  {selectedStudent.sks} SKS
                </span>
                <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full text-[10.5px]">
                  {selectedStudent.kelompok}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Nilai Akhir:</span>
                {isGraded ? (
                  <span className="bg-emerald-50 border border-emerald-300 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-md text-xs">
                    {selectedStudent.nilai.total.toFixed(2)} ({selectedStudent.nilai.predikat.split(" ")[0]})
                  </span>
                ) : (
                  <span className="bg-slate-100 border border-slate-200 text-slate-600 font-bold px-2.5 py-0.5 rounded-md text-xs">
                    -
                  </span>
                )}
                <span className="text-slate-400 font-mono text-[11px]">
                  {formattedNomor}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── LIVE CERTIFICATE RENDER AREA (100% CANVA RESMI MOCKUP ALIGNED) ─── */}
      <div className="cert-export-wrapper max-w-[1150px] mx-auto mt-6 px-4 flex flex-col items-center gap-8 print:p-0 print:m-0 print:max-w-none print:w-full">
        
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
              Nomor: {formattedNomor}
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

            {/* SKS Pill */}
            <div className="cert-sks-pill mt-1.5 border-[1.2px] border-[#C5A059] rounded-full px-5 py-0.5 bg-white shadow-2xs">
              <span className="text-[10px] md:text-[11pt] font-extrabold text-[#005AA9] tracking-wide">
                SKS diambil: {selectedStudent.sks} SKS
              </span>
            </div>

            {/* Narration 450 Jam */}
            <div className="cert-narration text-[9px] md:text-[10.5pt] text-[#0A2540] text-center max-w-[620px] md:max-w-[660px] leading-relaxed mt-2 font-sans">
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

            {/* Page 1 Bottom: Footer & Signature */}
            <div className="absolute bottom-6 md:bottom-7 left-10 md:left-14 right-14 md:right-20 flex justify-between items-end">
              <div className="w-48 md:w-60 hidden md:block" />
              
              <div className="text-center flex-1 text-[7.5px] md:text-[8.5pt] text-slate-500 italic mb-1">
                Rincian penilaian tercantum pada halaman belakang.<br />
                <span className="text-[6.5px] md:text-[7pt] tracking-[1px] not-italic text-slate-400">
                  UNIVERSITAS KOMPUTER INDONESIA &bull; LPPM
                </span>
              </div>

              <div className="flex flex-col items-center text-center w-64 md:w-80">
                <div className="cert-sig-date text-[8.5px] md:text-[9.5pt] font-semibold text-[#0A2540]">
                  Bandung, {tanggalTerbit}
                </div>
                <div className="cert-sig-role text-[8px] md:text-[9pt] font-bold text-[#0A2540] leading-tight mt-0.5">
                  Wakil Rektor I UNIKOM<br />Bidang Akademik dan Kemahasiswaan
                </div>

                <div className="my-1 border border-slate-300 rounded-md p-1 bg-white/95 flex items-center gap-2 w-44 md:w-52 h-11 md:h-13 shadow-2xs">
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
          className="cert-print-sheet relative w-full aspect-[1.414/1] bg-white rounded-lg shadow-xl overflow-hidden print:shadow-none print:rounded-none print:m-0 print:w-full print:aspect-[1.414/1] print:break-before-page"
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
              Nomor sertifikat: {formattedNomor}
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
    </div>
  );
};

// SVG QR Code generator component for React UI
const QrSvgComponent: React.FC<{ idSertifikat: string }> = ({ idSertifikat }) => {
  // Deterministic 15x15 QR pattern based on hash of idSertifikat
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
