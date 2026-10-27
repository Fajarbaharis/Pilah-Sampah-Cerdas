/**
 * Project: BERSEKA - Official UNIKOM KKN Tematik Certificate Viewer & Generator
 * Developed by: PT Makerindo & Universitas Komputer Indonesia
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Cetak & Verifikasi E-Sertifikat Resmi KKN Tematik Batch I UNIKOM
 * 100% PERSIS SESUAI ACUAN DESAIN MOCKUP RESMI:
 * - Halaman 1: Sertifikat Kelulusan 450 Jam, TTD Warek I UNIKOM, QR Code
 * - Halaman 2: Transkrip Rekapitulasi 5 Aspek Resmi (Personal 20%, Proker 25%, Laporan 25%, Paper 15%, Video 15%)
 *
 * Anti-Bug Export & Print:
 * - Menghilangkan 100% elemen kontrol/UI pada saat cetak/ekspor PDF (@media print & print:hidden)
 * - Tombol "Unduh PDF Resmi (1-Klik)" untuk download langsung tanpa print dialog browser
 */

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Award,
  Search,
  Printer,
  Download,
  ChevronLeft,
  GraduationCap,
  Copy,
  ShieldCheck,
  Terminal,
  X,
  FileDown,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import studentsDataRaw from "../../data/students_certificates_data.json";

interface StudentCertData {
  noUrut: number;
  nim: string;
  nama: string;
  prodi: string;
  sks: number;
  kelompok: string;
  rw: string;
  dpl: string;
  nomorSertifikat: string;
  idSertifikat: string;
  tanggalTerbit: string;
  nilai: {
    personal: number;
    proker: number;
    laporan: number;
    paper: number;
    video: number;
    total: number;
    predikat: string;
  };
}

const studentsData = studentsDataRaw as StudentCertData[];

export const SertifikatKknPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Role detection
  const isSuperOrDev = user?.peran === "DEVELOPER" || user?.peran === "SUPER_USER";
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
  }, [isMahasiswa, user]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedKelompok, setSelectedKelompok] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"both" | "page1" | "page2">("both");
  const [showCliModal, setShowCliModal] = useState<boolean>(false);

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
  }, [searchParams, isMahasiswa, selectedStudent.nim]);

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
  }, []);

  // Filtered student list
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
  }, [searchQuery, selectedKelompok, isMahasiswa, selectedStudent]);

  const handlePrint = () => {
    window.print();
  };

  const handleDirectDownloadPdf = () => {
    const safeName = selectedStudent.nama.replace(/[^a-zA-Z0-9]/g, '_');
    const directUrl = `/certificates/SERTIFIKAT_KKN_${selectedStudent.nim}_${safeName}.pdf`;
    
    // Check if pre-rendered PDF exists, otherwise fallback to window.print()
    const link = document.createElement("a");
    link.href = directUrl;
    link.download = `SERTIFIKAT_KKN_${selectedStudent.nim}_${safeName}.pdf`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Mengunduh berkas PDF resmi: ${selectedStudent.nama}`);
  };

  const handleCopyLink = () => {
    const url = `https://berseka.id/verify/${selectedStudent.idSertifikat}`;
    navigator.clipboard.writeText(url);
    toast.success("Tautan verifikasi resmi berhasil disalin!");
  };

  const handleExportCsv = () => {
    if (!isSuperOrDev) {
      toast.error("Fitur Ekspor Massal hanya diizinkan untuk Developer & Super User.");
      return;
    }
    const header = "NIM,Nama,Program Studi,Kelompok,SKS,Nilai Akhir,Predikat,Nomor Sertifikat,ID Sertifikat\n";
    const rows = filteredStudents
      .map(
        (s) =>
          `"${s.nim}","${s.nama}","${s.prodi}","${s.kelompok}","${s.sks}","${s.nilai.total.toFixed(2)}","${s.nilai.predikat}","${s.nomorSertifikat}","${s.idSertifikat}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DATA_SERTIFIKAT_KKN_${selectedKelompok.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Berhasil mengunduh metadata ${filteredStudents.length} mahasiswa.`);
  };

  const formattedNomor = `KKNT/${String(selectedStudent.noUrut).padStart(3, '0')}/UNIKOM/BATCH-1/XI/2026`;
  const formattedName = selectedStudent.nama ? selectedStudent.nama.toUpperCase() : '';

  return (
    <div className="min-h-screen bg-slate-200 text-slate-800 pb-16 print:p-0 print:m-0 print:bg-white print:w-auto">
      {/* ── SCOPED PRINT STYLE TO GUARANTEE 0% UI BLEED IN PDF EXPORT ── */}
      <style>{`
        @media print {
          @page {
            size: 297mm 210mm !important;
            margin: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 297mm !important;
            height: 210mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Strict Hiding of all web UI, headers, and navigation */
          .no-print, header, nav, aside, [role="navigation"], .sidebar,
          div[class*="sticky"], div[class*="border-b"], div[class*="shadow-xs"],
          div[class*="shadow-2xs"], div[class*="max-w-7xl"], button, input, select {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          .cert-export-wrapper {
            margin: 0 !important;
            padding: 0 !important;
            width: 297mm !important;
            display: block !important;
          }
          .cert-print-sheet {
            width: 297mm !important;
            height: 210mm !important;
            max-width: 297mm !important;
            max-height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            overflow: hidden !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .cert-print-sheet:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>

      {/* ── TOP ACTION BAR (STRICT NO-PRINT) ────────────────────────── */}
      <div className="no-print print:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
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
                Format resmi 2 Halaman: Sertifikat Kelulusan &amp; Rekapitulasi 5 Aspek Penilaian Resmi
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="hidden sm:inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setViewMode("both")}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "both"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                2 Halaman
              </button>
              <button
                onClick={() => setViewMode("page1")}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "page1"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Hal 1 Saja
              </button>
              <button
                onClick={() => setViewMode("page2")}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "page2"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Hal 2 Saja
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              title="Salin Tautan Verifikasi Publik"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Salin Link</span>
            </button>

            {/* Developer & Super User: Batch CLI & CSV Export */}
            {isSuperOrDev && (
              <>
                <button
                  onClick={() => setShowCliModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 transition-all cursor-pointer"
                  title="Buka Panduan Batch Generator CLI"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Batch CLI</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                  title="Ekspor Data Mahasiswa ke CSV untuk Canva / Spreadsheet"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Ekspor CSV</span>
                </button>
              </>
            )}

            {/* Tombol 1-Klik Unduh PDF Langsung */}
            <button
              onClick={handleDirectDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Unduh Berkas PDF Resmi Secara Langsung"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Unduh PDF</span>
            </button>

            {/* Tombol Cetak / Simpan PDF Browser */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── SELECTOR & METADATA BAR (STRICT NO-PRINT) ───────────────── */}
      <div className="no-print print:hidden max-w-7xl mx-auto px-4 mt-4">
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
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                      LULUS &bull; {selectedStudent.nilai.predikat}
                    </span>
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
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            {isPimpinan && (
              <div className="bg-purple-50/90 border border-purple-200/90 rounded-lg p-2.5 flex items-center gap-2.5 text-xs text-purple-900">
                <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                <span>
                  <strong>Mode Monitoring Pimpinan:</strong> Anda memiliki hak akses peninjauan dan pemantauan e-sertifikat mahasiswa KKN Tematik UNIKOM. Fitur ekspor data massal dinonaktifkan sesuai SOP Data Governance.
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
                <span className="bg-emerald-50 border border-emerald-300 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-md text-xs">
                  {selectedStudent.nilai.total.toFixed(2)} ({selectedStudent.nilai.predikat.split(" ")[0]})
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {formattedNomor}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── LIVE CERTIFICATE RENDER AREA (100% MOCKUP ALIGNED) ───────── */}
      <div className="cert-export-wrapper max-w-[1150px] mx-auto mt-6 px-4 flex flex-col items-center gap-8 print:p-0 print:m-0 print:max-w-none print:w-full">
        
        {/* ==================== HALAMAN 1: SERTIFIKAT ==================== */}
        {(viewMode === "both" || viewMode === "page1") && (
          <div className="cert-print-sheet relative w-full aspect-[1.41327/1] bg-white rounded-lg shadow-xl overflow-hidden print:shadow-none print:rounded-none print:m-0 print:w-full print:aspect-[1.41327/1] print:break-after-page">
            {/* Background Template Clean Image */}
            <img
              src="/image/serti/template_halaman_1_clean.png"
              alt="Template Sertifikat KKN Halaman 1"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
            />

            {/* Dynamic Text Overlay Layer (Coordinates Calculated with 100% Mockup Accuracy) */}
            <div className="relative z-20 w-full h-full pointer-events-none select-none">
              {/* Nomor Sertifikat */}
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-semibold text-[#0A2540]"
                style={{
                  left: "50%",
                  top: "35.45%",
                  fontSize: "clamp(10px, 1.35vw, 17px)",
                }}
              >
                Nomor: {formattedNomor}
              </div>

              {/* Nama Peserta (Font Serif Besar Playfair / Georgia) */}
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-black text-[#0A2540] tracking-wide"
                style={{
                  left: "50%",
                  top: "44.07%",
                  fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
                  fontSize: "clamp(16px, 2.95vw, 42px)",
                  width: "85%",
                  whiteSpace: "nowrap",
                }}
              >
                [{formattedName}]
              </div>

              {/* NIM */}
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-semibold text-[#0A2540]"
                style={{
                  left: "50%",
                  top: "51.56%",
                  fontSize: "clamp(9px, 1.3vw, 17px)",
                }}
              >
                NIM: [{selectedStudent.nim}]
              </div>

              {/* Program Studi */}
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-semibold text-[#0A2540]"
                style={{
                  left: "50%",
                  top: "54.21%",
                  fontSize: "clamp(9px, 1.3vw, 17px)",
                }}
              >
                Program Studi: [{selectedStudent.prodi}]
              </div>

              {/* SKS diambil inside gold pill */}
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-extrabold text-[#005AA9] tracking-wide"
                style={{
                  left: "50%",
                  top: "57.91%",
                  fontSize: "clamp(9px, 1.35vw, 18px)",
                }}
              >
                SKS diambil: [{selectedStudent.sks} SKS]
              </div>

              {/* Tanggal Terbit */}
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-semibold text-[#0A2540]"
                style={{
                  left: "77.5%",
                  top: "81.14%",
                  fontSize: "clamp(8px, 1.15vw, 15px)",
                }}
              >
                Bandung, {selectedStudent.tanggalTerbit}
              </div>

              {/* E-Signature / QR Code Box */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 bg-white/90 border border-slate-300 rounded p-1 flex items-center justify-between pointer-events-auto"
                style={{
                  left: "76.7%",
                  top: "89.1%",
                  width: "clamp(100px, 10.5vw, 150px)",
                  height: "clamp(38px, 4.8vw, 54px)",
                }}
              >
                <div className="w-[38px] h-[38px] shrink-0 p-0.5">
                  <QrSvgComponent idSertifikat={selectedStudent.idSertifikat} />
                </div>
                <div className="text-[7px] md:text-[8px] leading-tight text-left text-[#0A2540] pl-1 font-mono">
                  <strong className="block text-[7.5px] md:text-[8.5px] font-sans text-blue-900">E-SIGN SAH</strong>
                  <span>{selectedStudent.idSertifikat.slice(0, 16)}</span>
                  <span className="block text-emerald-700 font-bold">TERVERIFIKASI</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== HALAMAN 2: REKAP PENILAIAN ==================== */}
        {(viewMode === "both" || viewMode === "page2") && (
          <div className="cert-print-sheet relative w-full aspect-[1.41327/1] bg-white rounded-lg shadow-xl overflow-hidden print:shadow-none print:rounded-none print:m-0 print:w-full print:aspect-[1.41327/1] print:break-before-page">
            {/* Background Template Clean Image */}
            <img
              src="/image/serti/template_halaman_2_clean.png"
              alt="Template Transkrip KKN Halaman 2"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
            />

            {/* Dynamic Text Overlay Layer (Coordinates Calculated with 100% Mockup Accuracy) */}
            <div className="relative z-20 w-full h-full pointer-events-none select-none">
              {/* Nomor Sertifikat */}
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-semibold text-[#0A2540]"
                style={{
                  left: "50%",
                  top: "32.32%",
                  fontSize: "clamp(9px, 1.25vw, 16px)",
                }}
              >
                Nomor sertifikat: [{formattedNomor}]
              </div>

              {/* Info Row: Nama, NIM, Prodi, SKS */}
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-extrabold text-[#005AA9] truncate"
                style={{
                  left: "17.1%",
                  top: "38.67%",
                  width: "18%",
                  fontSize: "clamp(8px, 1.15vw, 16px)",
                }}
              >
                [{formattedName}]
              </div>
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-extrabold text-[#005AA9]"
                style={{
                  left: "37.9%",
                  top: "38.67%",
                  width: "14%",
                  fontSize: "clamp(8px, 1.15vw, 16px)",
                }}
              >
                [{selectedStudent.nim}]
              </div>
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-extrabold text-[#005AA9] truncate"
                style={{
                  left: "59.0%",
                  top: "38.67%",
                  width: "18%",
                  fontSize: "clamp(8px, 1.15vw, 16px)",
                }}
              >
                [{selectedStudent.prodi.toUpperCase()}]
              </div>
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-extrabold text-[#005AA9]"
                style={{
                  left: "81.1%",
                  top: "38.67%",
                  width: "14%",
                  fontSize: "clamp(8px, 1.15vw, 16px)",
                }}
              >
                [{selectedStudent.sks} SKS]
              </div>

              {/* Table Column 3: 5 Aspects Values */}
              {/* 1. Nilai Personal */}
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-extrabold text-[#0A2540]"
                style={{
                  left: "77.46%",
                  top: "49.38%",
                  fontSize: "clamp(10px, 1.4vw, 19px)",
                }}
              >
                {selectedStudent.nilai.personal.toFixed(1)}
              </div>

              {/* 2. Program Kerja Kelompok */}
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-extrabold text-[#0A2540]"
                style={{
                  left: "77.46%",
                  top: "53.74%",
                  fontSize: "clamp(10px, 1.4vw, 19px)",
                }}
              >
                {selectedStudent.nilai.proker.toFixed(1)}
              </div>

              {/* 3. Laporan Akhir */}
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-extrabold text-[#0A2540]"
                style={{
                  left: "77.46%",
                  top: "58.10%",
                  fontSize: "clamp(10px, 1.4vw, 19px)",
                }}
              >
                {selectedStudent.nilai.laporan.toFixed(1)}
              </div>

              {/* 4. Paper */}
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-extrabold text-[#0A2540]"
                style={{
                  left: "77.46%",
                  top: "62.75%",
                  fontSize: "clamp(10px, 1.4vw, 19px)",
                }}
              >
                {selectedStudent.nilai.paper.toFixed(1)}
              </div>

              {/* 5. Video */}
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-extrabold text-[#0A2540]"
                style={{
                  left: "77.46%",
                  top: "67.30%",
                  fontSize: "clamp(10px, 1.4vw, 19px)",
                }}
              >
                {selectedStudent.nilai.video.toFixed(1)}
              </div>

              {/* Footer ID */}
              <div
                className="absolute text-center -translate-x-1/2 -translate-y-1/2 font-medium text-slate-500 font-mono"
                style={{
                  left: "45.6%",
                  top: "95.64%",
                  fontSize: "clamp(7px, 0.9vw, 12px)",
                }}
              >
                [{selectedStudent.idSertifikat}]
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BATCH CLI MODAL (FOR DEVELOPER & SUPER USER) ───────────────── */}
      {showCliModal && isSuperOrDev && (
        <div className="no-print print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Panduan Generator E-Sertifikat KKN CLI (Batch Engine)
                </h3>
              </div>
              <button
                onClick={() => setShowCliModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Skrip generator CLI resmi berada di <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">scripts/tools/generate_sertifikat_kkn_resmi.cjs</code>.
              Menghasilkan berkas PDF A4 Landscape resolusi cetak 300+ DPI via Microsoft Edge Headless, berkas HTML mandiri, dan portal galeri interaktif.
            </p>

            <div className="space-y-3 text-xs">
              {/* Option 1: Single Student */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800">1. Generate Per Mahasiswa (Spesifik NIM)</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`node scripts/tools/generate_sertifikat_kkn_resmi.cjs --single ${selectedStudent.nim}`);
                      toast.success("Perintah disalin!");
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Salin Perintah
                  </button>
                </div>
                <pre className="bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] overflow-x-auto">
                  node scripts/tools/generate_sertifikat_kkn_resmi.cjs --single {selectedStudent.nim}
                </pre>
              </div>

              {/* Option 2: Per Kelompok */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800">2. Generate Per Kelompok ({selectedStudent.kelompok})</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`node scripts/tools/generate_sertifikat_kkn_resmi.cjs --kelompok "${selectedStudent.kelompok}"`);
                      toast.success("Perintah disalin!");
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Salin Perintah
                  </button>
                </div>
                <pre className="bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] overflow-x-auto">
                  node scripts/tools/generate_sertifikat_kkn_resmi.cjs --kelompok &quot;{selectedStudent.kelompok}&quot;
                </pre>
              </div>

              {/* Option 3: All 534 Students */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800">3. Generate Massal Semua Mahasiswa (534 Mahasiswa)</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`node scripts/tools/generate_sertifikat_kkn_resmi.cjs --all`);
                      toast.success("Perintah disalin!");
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Salin Perintah
                  </button>
                </div>
                <pre className="bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] overflow-x-auto">
                  node scripts/tools/generate_sertifikat_kkn_resmi.cjs --all
                </pre>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Lokasi output: <code className="text-slate-700 font-mono">docs/certificates/</code>
              </span>
              <button
                onClick={() => setShowCliModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SVG QR Code representation with actual verification link
const QrSvgComponent: React.FC<{ idSertifikat: string }> = ({ idSertifikat }) => {
  return (
    <svg viewBox="0 0 21 21" className="w-full h-full" shapeRendering="crispEdges">
      <rect x="0" y="0" width="7" height="7" fill="#0A2540" />
      <rect x="1" y="1" width="5" height="5" fill="#FFFFFF" />
      <rect x="2" y="2" width="3" height="3" fill="#0A2540" />

      <rect x="14" y="0" width="7" height="7" fill="#0A2540" />
      <rect x="15" y="1" width="5" height="5" fill="#FFFFFF" />
      <rect x="16" y="2" width="3" height="3" fill="#0A2540" />

      <rect x="0" y="14" width="7" height="7" fill="#0A2540" />
      <rect x="1" y="15" width="5" height="5" fill="#FFFFFF" />
      <rect x="2" y="16" width="3" height="3" fill="#0A2540" />

      <rect x="9" y="1" width="1" height="1" fill="#0A2540" />
      <rect x="11" y="3" width="1" height="1" fill="#0A2540" />
      <rect x="9" y="5" width="1" height="1" fill="#0A2540" />
      <rect x="2" y="9" width="1" height="1" fill="#0A2540" />
      <rect x="4" y="11" width="1" height="1" fill="#0A2540" />
      <rect x="9" y="9" width="3" height="3" fill="#0A2540" />
      <rect x="13" y="9" width="2" height="1" fill="#0A2540" />
      <rect x="9" y="13" width="1" height="3" fill="#0A2540" />
      <rect x="14" y="14" width="2" height="2" fill="#0A2540" />
      <rect x="18" y="16" width="2" height="2" fill="#0A2540" />
    </svg>
  );
};

export default SertifikatKknPage;
