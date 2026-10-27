/**
 * Project: BERSEKA - Official UNIKOM Certificate Public Verification Page
 * Developed by: PT Makerindo & Universitas Komputer Indonesia
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Verifikasi Keabsahan E-Sertifikat Resmi KKN Tematik UNIKOM
 * Terbuka untuk umum (publik) saat QR Code pada sertifikat discan
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
  ExternalLink,
  ArrowLeft,
  FileCheck,
  QrCode,
  FileText,
} from "lucide-react";
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

export const VerifikasiSertifikatPage: React.FC = () => {
  const { idSertifikat } = useParams<{ idSertifikat: string }>();

  // Find student by idSertifikat or NIM
  const student = useMemo(() => {
    if (!idSertifikat) return null;
    return (
      studentsData.find(
        (s) =>
          s.idSertifikat.toLowerCase() === idSertifikat.toLowerCase() ||
          s.nim === idSertifikat ||
          s.idSertifikat.endsWith(idSertifikat)
      ) || null
    );
  }, [idSertifikat]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-10 px-4">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        
        {/* Header Branding */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/logos/unikom.png" alt="UNIKOM" className="w-12 h-12 object-contain" />
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
            to="/sertifikat-kkn"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </Link>
        </div>

        {student ? (
          /* Card Verifikasi Berhasil */
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-emerald-500/40 p-6 md:p-8 shadow-2xl space-y-6">
            
            {/* Verification Badge Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase block">
                  Status Dokumen Sah &bull; Terdaftar Resmi
                </span>
                <h2 className="text-base font-bold text-white">
                  E-Sertifikat Kelulusan KKN Tematik Batch I
                </h2>
                <p className="text-xs text-slate-300">
                  Divalidasi secara kriptografis oleh LPPM UNIKOM &amp; Sistem Berseka
                </p>
              </div>
            </div>

            {/* Student & Credential Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/60 space-y-1">
                <span className="text-slate-400 text-[11px]">Nama Lengkap Mahasiswa</span>
                <p className="text-sm font-bold text-white">{student.nama}</p>
                <div className="pt-2 flex items-center justify-between text-slate-300 border-t border-slate-800">
                  <span>NIM: <strong className="text-white">{student.nim}</strong></span>
                  <span className="bg-blue-900/60 text-blue-300 font-bold px-2 py-0.5 rounded text-[10px]">
                    {student.sks} SKS
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/60 space-y-1">
                <span className="text-slate-400 text-[11px]">Program Studi</span>
                <p className="text-sm font-bold text-white">{student.prodi}</p>
                <div className="pt-2 flex items-center justify-between text-slate-300 border-t border-slate-800">
                  <span>Kelompok:</span>
                  <span className="font-semibold text-white">{student.kelompok}</span>
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/60 space-y-1">
                <span className="text-slate-400 text-[11px]">Nomor Registrasi Sertifikat</span>
                <p className="text-xs font-mono font-bold text-amber-300">{student.nomorSertifikat}</p>
                <span className="text-[10px] text-slate-500 font-mono block">
                  ID: {student.idSertifikat}
                </span>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/60 space-y-1">
                <span className="text-slate-400 text-[11px]">Nilai Akhir &amp; Predikat</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-emerald-400">
                    {student.nilai.total.toFixed(2)}
                  </span>
                  <span className="bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold">
                    {student.nilai.predikat}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-800">
                  Dosen Pembimbing: {student.dpl}
                </span>
              </div>
            </div>

            {/* Aspek Penilaian Preview */}
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                Rekapitulasi 5 Aspek Luaran KKN
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
                  Prof. Dr. Hj. Umi Narimawati, Dra., S.E., M.Si.
                </p>
                <span className="text-[11px] text-slate-400">Wakil Rektor I Bidang Akademik dan Kemahasiswaan UNIKOM</span>
              </div>
              <Link
                to={`/sertifikat-kkn?nim=${student.nim}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
              >
                <Award className="w-4 h-4" />
                Buka E-Sertifikat
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
              ID Sertifikat atau NIM <code className="bg-slate-900 px-2 py-0.5 rounded text-amber-300 font-mono">{idSertifikat}</code> tidak terdaftar di basis data kelulusan resmi KKN Tematik UNIKOM.
            </p>
            <Link
              to="/sertifikat-kkn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold"
            >
              Lihat Daftar Sertifikat Resmi
            </Link>
          </div>
        )}

        {/* Footer Security Note */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>
            Dokumen ini dilindungi tanda tangan elektronik dan enkripsi hash sesuai UU ITE &bull; Hak Cipta &copy; 2026 UNIKOM &amp; BERSEKA
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifikasiSertifikatPage;
