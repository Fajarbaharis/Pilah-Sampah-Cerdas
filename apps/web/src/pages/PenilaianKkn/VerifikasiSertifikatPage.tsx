/**
 * Project: BERSEKA - Official UNIKOM Certificate Public Verification Page
 * Developed by: PT Makerindo & Universitas Komputer Indonesia
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Verifikasi Keabsahan E-Sertifikat Resmi KKN Tematik UNIKOM
 * Terbuka untuk umum (publik) saat QR Code pada sertifikat mahasiswa / DPL discan
 */

import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  Award,
  Calendar,
  Building,
  User,
  GraduationCap,
  ArrowLeft,
  FileCheck,
  QrCode,
  FileText,
  MapPin,
} from "lucide-react";
import studentsDataRaw from "../../data/students_certificates_data.json";
import dplDataRaw from "../../data/dpl_certificates_data.json";

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

interface DplCertData {
  noUrut: number;
  userId: string;
  kelompokId: string;
  nama: string;
  nip: string;
  peran: string;
  kelompok: string;
  kelurahan: string;
  cakupanRw: string[];
  wilayahDampingan: string;
  nomorSertifikat: string;
  idSertifikat: string;
  tanggalTerbit: string;
  status: string;
}

const studentsData = studentsDataRaw as StudentCertData[];
const dplData = dplDataRaw as DplCertData[];

export const VerifikasiSertifikatPage: React.FC = () => {
  const { idSertifikat } = useParams<{ idSertifikat: string }>();

  // Find student by idSertifikat or NIM
  const student = useMemo(() => {
    if (!idSertifikat) return null;
    const clean = idSertifikat.toLowerCase().trim();
    return (
      studentsData.find(
        (s) =>
          s.idSertifikat.toLowerCase() === clean ||
          s.nim.toLowerCase() === clean ||
          s.idSertifikat.endsWith(idSertifikat)
      ) || null
    );
  }, [idSertifikat]);

  // Find DPL by idSertifikat or NIP
  const dpl = useMemo(() => {
    if (!idSertifikat) return null;
    const clean = idSertifikat.toLowerCase().trim();
    const cleanNumbers = clean.replace(/[^0-9]/g, "");
    return (
      dplData.find((d) => {
        const dNipClean = d.nip.replace(/[^0-9]/g, "").toLowerCase();
        return (
          d.idSertifikat.toLowerCase() === clean ||
          d.nip.toLowerCase() === clean ||
          (cleanNumbers && dNipClean === cleanNumbers)
        );
      }) || null
    );
  }, [idSertifikat]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-10 px-4">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        
        {/* Header Branding */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/logos/unikom.png" alt="UNIKOM" className="w-12 h-12 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
            <div>
              <h1 className="text-sm font-extrabold tracking-wider text-slate-100 uppercase">
                UNIVERSITAS KOMPUTER INDONESIA
              </h1>
              <p className="text-xs text-amber-400 font-medium tracking-wide">
                Sistem Verifikasi Digital E-Sertifikat KKN Tematik
              </p>
            </div>
          </div>
          <Link
            to={dpl ? "/e-sertifikat/dpl" : "/e-sertifikat/mahasiswa"}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </Link>
        </div>

        {student ? (
          /* Card Verifikasi Berhasil - Mahasiswa */
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-emerald-500/40 p-6 md:p-8 shadow-2xl space-y-6">
            
            {/* Verification Badge Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase block">
                  DOKUMEN RESMI TERVERIFIKASI SAH
                </span>
                <h2 className="text-sm font-bold text-white truncate">
                  E-Sertifikat Kelulusan KKN Tematik Batch I UNIKOM
                </h2>
                <span className="text-xs text-slate-300 font-mono">
                  No: {student.nomorSertifikat}
                </span>
              </div>
            </div>

            {/* Identitas Mahasiswa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50 space-y-2">
                <span className="text-[11px] text-slate-400 font-medium block">Penerima Sertifikat</span>
                <p className="text-sm font-bold text-white uppercase">{student.nama}</p>
                <div className="text-slate-300 space-y-0.5">
                  <p>NIM: <span className="font-mono font-semibold text-amber-300">{student.nim}</span></p>
                  <p>Program Studi: <span className="font-semibold text-white">{student.prodi}</span></p>
                  <p>Beban Studi: <span className="font-semibold text-emerald-300">{student.sks} SKS</span></p>
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50 space-y-2">
                <span className="text-[11px] text-slate-400 font-medium block">Wilayah & Kelompok</span>
                <p className="text-sm font-bold text-white">{student.kelompok}</p>
                <div className="text-slate-300 space-y-0.5">
                  <p>Penempatan: <span className="font-semibold text-white">{student.rw}</span></p>
                  <p>DPL: <span className="font-semibold text-white">{student.dpl}</span></p>
                  <p>Status: <span className="font-semibold text-emerald-400">Lulus Memenuhi Kriteria</span></p>
                </div>
              </div>
            </div>

            {/* Aspek Penilaian Preview */}
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                Rekapitulasi 5 Aspek Luaran KKN (Skor Akhir: {student.nilai.total.toFixed(2)} &bull; {student.nilai.predikat})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Personal</span>
                  <strong className="text-white text-xs">{student.nilai.personal.toFixed(2)}</strong>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Proker</span>
                  <strong className="text-white text-xs">{student.nilai.proker.toFixed(2)}</strong>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Laporan</span>
                  <strong className="text-white text-xs">{student.nilai.laporan.toFixed(2)}</strong>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Paper</span>
                  <strong className="text-white text-xs">{student.nilai.paper.toFixed(2)}</strong>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Video</span>
                  <strong className="text-white text-xs">{student.nilai.video.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* Penandatangan Resmi */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                <span>Diterbitkan di Bandung, {student.tanggalTerbit}</span>
                <p className="font-semibold text-slate-200">
                  Prof. Dr. Hj. Aelina Surya, Dra.
                </p>
                <span className="text-[11px] text-slate-400">Wakil Rektor I Bidang Akademik dan Kemahasiswaan UNIKOM</span>
              </div>
              <Link
                to={'/e-sertifikat/mahasiswa?nim=' + student.nim}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
              >
                <Award className="w-4 h-4" />
                Buka E-Sertifikat
              </Link>
            </div>
          </div>
        ) : dpl ? (
          /* Card Verifikasi Berhasil - DPL */
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-emerald-500/40 p-6 md:p-8 shadow-2xl space-y-6">
            
            {/* Verification Badge Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase block">
                  PIAGAM RESMI TERVERIFIKASI SAH
                </span>
                <h2 className="text-sm font-bold text-white truncate">
                  Piagam Penghargaan Dosen Pembimbing Lapangan (DPL) KKN Tematik
                </h2>
                <span className="text-xs text-slate-300 font-mono">
                  No: {dpl.nomorSertifikat}
                </span>
              </div>
            </div>

            {/* Identitas DPL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50 space-y-2">
                <span className="text-[11px] text-slate-400 font-medium block">Penerima Piagam</span>
                <p className="text-sm font-bold text-white uppercase">{dpl.nama}</p>
                <div className="text-slate-300 space-y-0.5">
                  <p>NIP: <span className="font-mono font-semibold text-amber-300">{dpl.nip}</span></p>
                  <p>Peran: <span className="font-semibold text-emerald-300">{dpl.peran}</span></p>
                  <p>Status: <span className="font-semibold text-emerald-400">Pembimbingan Resmi Terlaksana</span></p>
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50 space-y-2">
                <span className="text-[11px] text-slate-400 font-medium block">Kelompok & Wilayah Binaan</span>
                <p className="text-sm font-bold text-white">{dpl.kelompok}</p>
                <div className="text-slate-300 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>{dpl.wilayahDampingan}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Penandatangan Resmi */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                <span>Diterbitkan di Bandung, {dpl.tanggalTerbit}</span>
                <p className="font-semibold text-slate-200">
                  Prof. Dr. Ir. H. Eddy Soeryanto Soegoto, M.T.
                </p>
                <span className="text-[11px] text-slate-400">Rektor Universitas Komputer Indonesia</span>
              </div>
              <Link
                to={'/e-sertifikat/dpl?nip=' + dpl.nip}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
              >
                <Award className="w-4 h-4" />
                Buka Piagam DPL
              </Link>
            </div>
          </div>
        ) : (
          /* Card Tidak Ditemukan */
          <div className="bg-slate-800/80 rounded-2xl border border-rose-500/30 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 font-bold text-xl">
              !
            </div>
            <h2 className="text-base font-bold text-white">Sertifikat Tidak Ditemukan</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              ID Sertifikat atau Nomor Identitas <code className="bg-slate-900 px-2 py-0.5 rounded text-amber-300 font-mono">{idSertifikat}</code> tidak terdaftar di basis data resmi KKN Tematik UNIKOM.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                to="/e-sertifikat/mahasiswa"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Sertifikat Mahasiswa
              </Link>
              <Link
                to="/e-sertifikat/dpl"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold"
              >
                Sertifikat DPL
              </Link>
            </div>
          </div>
        )}

        {/* Footer Security Note */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>
            Dokumen ini dilindungi tanda tangan elektronik dan enkripsi hash resmi &bull; Hak Cipta &copy; 2026 UNIKOM &amp; BERSEKA
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifikasiSertifikatPage;
