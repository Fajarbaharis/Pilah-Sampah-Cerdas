/**
 * Project: BERSEKA - Official UNIKOM KKN Tematik Certificate Viewer & Generator
 * Developed by: PT Makerindo & Universitas Komputer Indonesia
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Cetak & Verifikasi E-Sertifikat Resmi KKN Tematik Batch I UNIKOM
 * Terintegrasi 100% dengan Acuan Desain Mockup Resmi (Halaman 1 Sertifikat + Halaman 2 Rekap Nilai 5 Aspek)
 * Dilengkapi Role-Based Guards:
 * - Mahasiswa: Khusus melihat & mengunduh sertifikat miliknya sendiri
 * - Pimpinan: Mode monitoring & pratinjau (read-only, tanpa ekspor massal)
 * - Developer & Super User: Akses penuh ekspor CSV dan batch generator CLI
 */

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Award,
  Search,
  Printer,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
  Users,
  Building,
  GraduationCap,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  SlidersHorizontal,
  ShieldCheck,
  Terminal,
  X,
  AlertCircle,
  Eye,
  Info,
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
  const isDpl = ["DPL", "DOSEN_PEMBIMBING", "DOSEN_PENDAMPING", "DOSEN_PENDAMPING_LAPANGAN"].includes(user?.peran || "");

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
  }, [searchQuery, selectedKelompok, isMahasiswa, selectedStudent]);

  const handlePrint = () => {
    window.print();
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Perintah ${label} berhasil disalin!`);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-16 print:p-0 print:bg-white print:m-0">
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

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
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
          /* Non-Mahasiswa (Admin, Pimpinan, Super User, DPL) Standard Selector */
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            {/* Pimpinan Notice Banner */}
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
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
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
                  className="w-full px-3 py-2 text-xs rounded-lg border border-blue-300 bg-blue-50/50 text-blue-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
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
                <span className="text-slate-500">NIM: <strong className="text-slate-700">{selectedStudent.nim}</strong></span>
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
                  {selectedStudent.nomorSertifikat}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── LIVE CERTIFICATE RENDER AREA ────────────────────────────── */}
      <div className="max-w-[1150px] mx-auto mt-6 px-4 flex flex-col items-center gap-8 print:p-0 print:m-0 print:max-w-none">
        
        {/* ==================== HALAMAN 1: SERTIFIKAT ==================== */}
        {(viewMode === "both" || viewMode === "page1") && (
          <div className="certificate-page-container relative w-full aspect-[1.414/1] bg-white rounded-lg shadow-xl overflow-hidden print:shadow-none print:rounded-none print:m-0 print:w-full print:aspect-[1.414/1] print:break-after-page">
            {/* Vector SVG Border Frame */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <CertificateSvgFrame />
            </div>

            {/* Inner Content Area */}
            <div className="relative z-20 h-full w-full p-8 md:p-12 flex flex-col justify-between box-border">
              {/* Header Logos & Title */}
              <div className="text-center pt-2">
                <div className="flex items-center justify-center gap-6 mb-2">
                  {/* UNIKOM Logo placeholder / graphic */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-linear-to-br from-yellow-400 via-amber-500 to-blue-900 p-0.5 flex items-center justify-center shadow-xs">
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-black text-blue-950 text-xs tracking-tighter">
                        UNIKOM
                      </div>
                    </div>
                    <div className="text-left">
                      <h2 className="text-[13px] md:text-sm font-black text-slate-900 tracking-wider uppercase leading-tight font-serif">
                        Universitas Komputer Indonesia
                      </h2>
                      <p className="text-[9.5px] md:text-[10.5px] text-slate-500 tracking-widest uppercase">
                        Quality is Our Tradition &bull; Bandung, Jawa Barat
                      </p>
                    </div>
                  </div>
                </div>

                {/* Certificate Main Title */}
                <div className="mt-3">
                  <h1 className="text-2xl md:text-4xl font-serif font-black tracking-widest text-[#0E335E] uppercase">
                    SERTIFIKAT KELULUSAN
                  </h1>
                  <p className="text-[11px] md:text-xs font-medium text-slate-500 tracking-widest uppercase mt-0.5 font-mono">
                    Nomor: {selectedStudent.nomorSertifikat}
                  </p>
                  <div className="w-32 h-0.5 bg-linear-to-r from-transparent via-[#C5A059] to-transparent mx-auto mt-2" />
                </div>
              </div>

              {/* Recipient & Statement */}
              <div className="text-center my-auto py-2">
                <p className="text-xs md:text-sm text-slate-600 font-serif italic mb-2">
                  Diberikan dengan penuh kehormatan dan apresiasi kepada:
                </p>
                <div className="inline-block relative">
                  <h2 className="text-2xl md:text-4xl font-serif font-black text-slate-900 tracking-wide border-b-2 border-slate-300 pb-1 px-8">
                    {selectedStudent.nama}
                  </h2>
                </div>
                <p className="text-xs md:text-sm font-mono font-bold text-slate-700 mt-2">
                  NIM: {selectedStudent.nim} &bull; Program Studi: {selectedStudent.prodi}
                </p>

                <p className="max-w-2xl mx-auto text-xs md:text-sm text-slate-700 leading-relaxed mt-4 font-serif">
                  Telah dinyatakan <strong className="text-blue-950 font-bold uppercase">LULUS</strong> dan menyelesaikan seluruh rangkaian pelaksanaan
                  <strong className="text-blue-950 font-bold"> Kuliah Kerja Nyata (KKN) Tematik UNIKOM Batch I Tahun Akademik 2026/2027</strong> dengan beban setara
                  <strong className="text-blue-950 font-bold"> 450 Jam Kegiatan Lapangan ({selectedStudent.sks} SKS)</strong> yang berlokasi di wilayah
                  <strong className="text-blue-950 font-bold"> {selectedStudent.kelompok} (Kecamatan Coblong, Kota Bandung)</strong>.
                </p>

                <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-300 px-4 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-900">
                    Predikat Kelulusan: {selectedStudent.nilai.predikat} (Nilai Akhir: {selectedStudent.nilai.total.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Signatures & QR Section */}
              <div className="grid grid-cols-3 items-end pt-4 pb-2 text-center text-xs">
                {/* Left: QR Code & Verification Info */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 p-1.5 bg-white border border-slate-300 rounded-lg shadow-2xs">
                    <QrPlaceholder text={`https://berseka.id/verify/${selectedStudent.idSertifikat}`} />
                  </div>
                  <span className="text-[9.5px] font-mono text-slate-500 mt-1">
                    ID: {selectedStudent.idSertifikat}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Scan untuk Verifikasi Resmi
                  </span>
                </div>

                {/* Center: Official Seal / Stamp */}
                <div className="flex flex-col items-center pb-2">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-dashed border-[#C5A059] flex items-center justify-center p-1 text-center">
                    <div className="w-full h-full rounded-full bg-amber-50/50 flex flex-col items-center justify-center text-[8.5px] font-bold text-amber-900 leading-tight">
                      <span>PANITIA</span>
                      <Award className="w-3.5 h-3.5 text-amber-700 my-0.5" />
                      <span>KKN 2026</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">
                    Bandung, {selectedStudent.tanggalTerbit}
                  </span>
                </div>

                {/* Right: Signature */}
                <div className="flex flex-col items-center">
                  <p className="text-[11px] font-serif text-slate-600 mb-10">
                    Wakil Rektor I Bidang Akademik &amp; Kemahasiswaan
                  </p>
                  <p className="font-serif font-bold text-slate-900 text-xs md:text-sm underline">
                    Prof. Dr. Hj. Umi Narimawati, Dra., S.E., M.Si.
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    NIP. 4127.34.02.015
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== HALAMAN 2: REKAP PENILAIAN ==================== */}
        {(viewMode === "both" || viewMode === "page2") && (
          <div className="certificate-page-container relative w-full aspect-[1.414/1] bg-white rounded-lg shadow-xl overflow-hidden print:shadow-none print:rounded-none print:m-0 print:w-full print:aspect-[1.414/1] print:break-before-page">
            {/* Vector SVG Border Frame */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <CertificateSvgFrame />
            </div>

            {/* Inner Content Area */}
            <div className="relative z-20 h-full w-full p-8 md:p-12 flex flex-col justify-between box-border">
              {/* Header Page 2 */}
              <div className="text-center pt-2">
                <h2 className="text-xl md:text-3xl font-serif font-black tracking-wider text-[#0E335E] uppercase">
                  TRANSKRIP REKAPITULASI PENILAIAN KKN TEMATIK
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Lampiran E-Sertifikat Kelulusan Nomor: {selectedStudent.nomorSertifikat}
                </p>
                <div className="w-24 h-0.5 bg-linear-to-r from-transparent via-[#C5A059] to-transparent mx-auto mt-2" />
              </div>

              {/* Student Metadata Card */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 my-2 text-xs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10.5px] text-slate-500 block">Nama Mahasiswa</span>
                    <strong className="text-slate-900 font-bold text-sm">{selectedStudent.nama}</strong>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-500 block">Nomor Induk Mahasiswa (NIM)</span>
                    <strong className="text-slate-800 font-mono text-sm">{selectedStudent.nim}</strong>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-500 block">Program Studi &amp; SKS</span>
                    <strong className="text-slate-800">{selectedStudent.prodi} ({selectedStudent.sks} SKS)</strong>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-500 block">Kelompok &amp; DPL</span>
                    <strong className="text-slate-800">{selectedStudent.kelompok}</strong>
                    <span className="text-[10.5px] text-slate-500 block truncate">{selectedStudent.dpl}</span>
                  </div>
                </div>
              </div>

              {/* 5 Aspects Grades Table */}
              <div className="my-auto py-2">
                <table className="w-full border-collapse border border-slate-300 text-xs md:text-sm">
                  <thead>
                    <tr className="bg-[#0E335E] text-white text-center font-bold">
                      <th className="py-2 px-3 border border-slate-300 w-12">NO</th>
                      <th className="py-2 px-4 border border-slate-300 text-left">KOMPONEN PENILAIAN KKN</th>
                      <th className="py-2 px-3 border border-slate-300 w-28">BOBOT</th>
                      <th className="py-2 px-3 border border-slate-300 w-28">NILAI ANGKA</th>
                      <th className="py-2 px-3 border border-slate-300 w-32">KETERANGAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono font-bold">1</td>
                      <td className="py-2 px-4 font-semibold text-slate-800">
                        Nilai Personal / Kinerja Mandiri
                        <span className="block text-[11px] text-slate-500 font-normal">
                          Kedisiplinan, presensi lapangan 450 jam, keaktifan &amp; inisiatif kerja
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-600">20%</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 text-sm">
                        {selectedStudent.nilai.personal.toFixed(1)}
                      </td>
                      <td className="py-2 px-3 text-center text-[11px] text-slate-600">Sangat Baik</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono font-bold">2</td>
                      <td className="py-2 px-4 font-semibold text-slate-800">
                        Program Kerja Kelompok
                        <span className="block text-[11px] text-slate-500 font-normal">
                          Perencanaan, realisasi aksi pilah sampah di RW dampingan, dampak warga
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-600">25%</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 text-sm">
                        {selectedStudent.nilai.proker.toFixed(1)}
                      </td>
                      <td className="py-2 px-3 text-center text-[11px] text-slate-600">Sangat Baik</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono font-bold">3</td>
                      <td className="py-2 px-4 font-semibold text-slate-800">
                        Laporan Akhir KKN
                        <span className="block text-[11px] text-slate-500 font-normal">
                          Sistematika penulisan, kelengkapan data survei baseline &amp; endline, evaluasi
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-600">25%</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 text-sm">
                        {selectedStudent.nilai.laporan.toFixed(1)}
                      </td>
                      <td className="py-2 px-3 text-center text-[11px] text-slate-600">Sangat Baik</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono font-bold">4</td>
                      <td className="py-2 px-4 font-semibold text-slate-800">
                        Paper / Artikel Ilmiah
                        <span className="block text-[11px] text-slate-500 font-normal">
                          Publikasi ilmiah pengabdian kepada masyarakat berbasis tata kelola sampah
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-600">15%</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 text-sm">
                        {selectedStudent.nilai.paper.toFixed(1)}
                      </td>
                      <td className="py-2 px-3 text-center text-[11px] text-slate-600">Sangat Baik</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-mono font-bold">5</td>
                      <td className="py-2 px-4 font-semibold text-slate-800">
                        Video Dokumenter KKN
                        <span className="block text-[11px] text-slate-500 font-normal">
                          Kreativitas publikasi audio-visual, sinematografi, pesan edukasi masyarakat
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-600">15%</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 text-sm">
                        {selectedStudent.nilai.video.toFixed(1)}
                      </td>
                      <td className="py-2 px-3 text-center text-[11px] text-slate-600">Sangat Baik</td>
                    </tr>
                    {/* TOTAL ROW */}
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td colSpan={2} className="py-2 px-4 text-right uppercase tracking-wider text-xs">
                        NILAI AKHIR KUMULATIF (100%)
                      </td>
                      <td className="py-2 px-3 text-center text-slate-700">100%</td>
                      <td className="py-2 px-3 text-center font-mono text-base text-blue-900 font-black">
                        {selectedStudent.nilai.total.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center text-xs font-black text-emerald-800">
                        {selectedStudent.nilai.predikat}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Signatures Page 2 */}
              <div className="grid grid-cols-2 items-end pt-4 pb-2 text-center text-xs">
                <div className="flex flex-col items-center">
                  <p className="text-[11px] font-serif text-slate-600 mb-10">
                    Dosen Pembimbing Lapangan (DPL)
                  </p>
                  <p className="font-serif font-bold text-slate-900 text-xs md:text-sm underline">
                    {selectedStudent.dpl}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Dosen Pembimbing {selectedStudent.kelompok}
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="text-[11px] font-serif text-slate-600 mb-10">
                    Ketua Panitia Pelaksana KKN Tematik
                  </p>
                  <p className="font-serif font-bold text-slate-900 text-xs md:text-sm underline">
                    Dr. Rahma Wahdiniwaty, Dra., M.Si.
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    NIP. 4127.34.01.002
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BATCH CLI MODAL (FOR DEVELOPER & SUPER USER) ───────────────── */}
      {showCliModal && isSuperOrDev && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
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
                    onClick={() => copyToClipboard(`node scripts/tools/generate_sertifikat_kkn_resmi.cjs --single ${selectedStudent.nim}`, "Single Mahasiswa")}
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
                    onClick={() => copyToClipboard(`node scripts/tools/generate_sertifikat_kkn_resmi.cjs --kelompok "${selectedStudent.kelompok}"`, "Per Kelompok")}
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
                    onClick={() => copyToClipboard(`node scripts/tools/generate_sertifikat_kkn_resmi.cjs --all`, "Semua Mahasiswa")}
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

// SVG Border Frame matching the official mockup
const CertificateSvgFrame: React.FC = () => (
  <svg
    viewBox="0 0 1122 793"
    className="w-full h-full"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer Dark Navy Strip (#0E335E) */}
    <rect x="0" y="0" width="1122" height="793" fill="none" stroke="#0E335E" strokeWidth="18" />

    {/* Top Right Royal Blue Diagonal Corner */}
    <polygon points="1020,0 1122,0 1122,102" fill="#005AA9" />
    <polygon points="980,0 1020,0 1122,102 1122,142" fill="#0E335E" />
    <polygon points="1060,0 1122,0 1122,62" fill="#C5A059" opacity="0.9" />

    {/* Bottom Left Royal Blue Diagonal Corner */}
    <polygon points="0,691 0,793 102,793" fill="#005AA9" />
    <polygon points="0,651 0,691 102,793 142,793" fill="#0E335E" />
    <polygon points="0,731 0,793 62,793" fill="#C5A059" opacity="0.9" />

    {/* Chamfered Gold Framing Line */}
    <path
      d="M 40 40 L 760 40 L 980 40 L 1082 142 L 1082 753 L 362 753 L 142 753 L 40 651 Z"
      fill="none"
      stroke="#C5A059"
      strokeWidth="1.6"
    />
  </svg>
);

// Quick SVG QR Code visual representation for React UI
const QrPlaceholder: React.FC<{ text: string }> = ({ text }) => {
  return (
    <svg viewBox="0 0 21 21" className="w-full h-full" shapeRendering="crispEdges">
      {/* 3 standard QR position markers */}
      <rect x="0" y="0" width="7" height="7" fill="#0E335E" />
      <rect x="1" y="1" width="5" height="5" fill="#FFFFFF" />
      <rect x="2" y="2" width="3" height="3" fill="#0E335E" />

      <rect x="14" y="0" width="7" height="7" fill="#0E335E" />
      <rect x="15" y="1" width="5" height="5" fill="#FFFFFF" />
      <rect x="16" y="2" width="3" height="3" fill="#0E335E" />

      <rect x="0" y="14" width="7" height="7" fill="#0E335E" />
      <rect x="1" y="15" width="5" height="5" fill="#FFFFFF" />
      <rect x="2" y="16" width="3" height="3" fill="#0E335E" />

      {/* Pattern bits */}
      <rect x="9" y="1" width="1" height="1" fill="#0E335E" />
      <rect x="11" y="3" width="1" height="1" fill="#0E335E" />
      <rect x="9" y="5" width="1" height="1" fill="#0E335E" />
      <rect x="2" y="9" width="1" height="1" fill="#0E335E" />
      <rect x="4" y="11" width="1" height="1" fill="#0E335E" />
      <rect x="9" y="9" width="3" height="3" fill="#0E335E" />
      <rect x="13" y="9" width="2" height="1" fill="#0E335E" />
      <rect x="9" y="13" width="1" height="3" fill="#0E335E" />
      <rect x="14" y="14" width="2" height="2" fill="#0E335E" />
      <rect x="18" y="16" width="2" height="2" fill="#0E335E" />
    </svg>
  );
};

export default SertifikatKknPage;
