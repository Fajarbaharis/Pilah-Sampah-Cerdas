/**
 * Project: BERSEKA - Official UNIKOM Certificate Public Verification Page
 * Developed by: PT Makerindo & Universitas Komputer Indonesia
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Verifikasi Keabsahan E-Sertifikat Resmi KKN Tematik UNIKOM
 * Terbuka untuk umum (publik) saat QR Code pada sertifikat discan
 * Terhubung langsung ke Live REST API: /api/v1/sertifikat-kkn/verify/:idSertifikat
 */

import React, { useState, useEffect, useMemo } from "react";
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
  Loader2,
  XCircle,
} from "lucide-react";
import studentsDataRaw from "../../data/students_certificates_data.json";
import {
  sertifikatKknService,
  type StudentCertData,
  type VerificationResult,
} from "../../services/sertifikatKknService";

const fallbackStudents = studentsDataRaw as StudentCertData[];

export const VerifikasiSertifikatPage: React.FC = () => {
  const isStaging = isStagingEnv();
  const { idSertifikat } = useParams<{ idSertifikat: string }>();

  const [verifResult, setVerifResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Local fallback lookup
  const fallbackStudent = useMemo(() => {
    if (!idSertifikat) return null;
    return (
      fallbackStudents.find(
        (s) =>
          s.idSertifikat.toLowerCase() === idSertifikat.toLowerCase() ||
          s.nim === idSertifikat ||
          s.idSertifikat.endsWith(idSertifikat)
      ) || null
    );
  }, [idSertifikat]);

  // Live API Verification
  useEffect(() => {
    let mounted = true;
    if (!idSertifikat) {
      setIsLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await sertifikatKknService.verifySertifikat(idSertifikat);
        if (mounted) setVerifResult(res);
      } catch (err) {
        console.warn("[VerifikasiSertifikatPage] API verification fallback:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    verify();
    return () => {
      mounted = false;
    };
  }, [idSertifikat]);

  const student = verifResult?.mahasiswa || fallbackStudent;
  const isVerified = verifResult ? verifResult.isValid : Boolean(fallbackStudent);
  const penerbit = verifResult?.penerbit || {
    institusi: "Universitas Komputer Indonesia (UNIKOM)",
    lembaga: "Direktorat Riset & Pengabdian Masyarakat (LPPM)",
    kegiatan: "KKN Tematik Berseka - Pengelolaan Sampah Berkelanjutan Batch I",
    tahunAkademik: "2026/2027",
    penandatangan: "Prof. Dr. Hj. Aelina Surya, Dra.",
    jabatan: "Wakil Rektor Bidang Akademik dan Kemahasiswaan UNIKOM",
    tanggalTerbit: student?.tanggalTerbit || "10 November 2026",
  };

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
            to={isStaging ? "/sertifikat-kkn" : "/"}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700 p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-300">Memeriksa keabsahan sertifikat pada database server...</p>
          </div>
        ) : isVerified && student ? (
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
                <p className="text-xs text-slate-400 mt-0.5">
                  ID Verifikasi: <code className="text-amber-400 font-mono font-bold">{student.idSertifikat}</code>
                </p>
              </div>
            </div>

            {/* Student Biodata Summary */}
            <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-700/60 space-y-3">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block border-b border-slate-800 pb-2">
                Informasi Penerima Sertifikat
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nama Lengkap:</span>
                  <span className="font-bold text-slate-100 text-sm">{student.nama}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">NIM:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">{student.nim}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Program Studi:</span>
                  <span className="font-semibold text-slate-200">{student.prodi}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Beban Akademik:</span>
                  <span className="font-semibold text-blue-400">{student.sks} SKS &bull; 450 Jam Kegiatan</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Kelompok & Wilayah:</span>
                  <span className="font-semibold text-slate-200">{student.kelompok} ({student.rw})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Dosen Pembimbing (DPL):</span>
                  <span className="font-semibold text-slate-200">{student.dpl}</span>
                </div>
              </div>
            </div>

            {/* Academic Grade & Aspects */}
            <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  Hasil Yudisium & Nilai Akhir
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {student.nilai.predikat}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs pt-1">
                <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/40">
                  <span className="text-[10px] text-slate-400 block">Personal (20%)</span>
                  <span className="text-sm font-bold text-white mt-1 block">{student.nilai.personal}</span>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/40">
                  <span className="text-[10px] text-slate-400 block">Proker (25%)</span>
                  <span className="text-sm font-bold text-white mt-1 block">{student.nilai.proker}</span>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/40">
                  <span className="text-[10px] text-slate-400 block">Laporan (25%)</span>
                  <span className="text-sm font-bold text-white mt-1 block">{student.nilai.laporan}</span>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/40">
                  <span className="text-[10px] text-slate-400 block">Paper (15%)</span>
                  <span className="text-sm font-bold text-white mt-1 block">{student.nilai.paper}</span>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/40">
                  <span className="text-[10px] text-slate-400 block">Video (15%)</span>
                  <span className="text-sm font-bold text-white mt-1 block">{student.nilai.video}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 text-slate-300">
                <span>Nilai Akhir Kumulatif:</span>
                <span className="text-base font-extrabold text-amber-400">{student.nilai.total} / 100</span>
              </div>
            </div>

            {/* Official Certification Signature Block */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-4 border border-blue-500/20 text-xs space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Otoritas Penandatangan Resmi</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Dokumen ini ditandatangani secara elektronik (TTE) oleh <strong>{penerbit.penandatangan}</strong> ({penerbit.jabatan}) pada tanggal <strong>{penerbit.tanggalTerbit}</strong> dan tercatat sah dalam Sistem Informasi Akademik KKN Tematik UNIKOM.
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/80">
              {isStaging && (
                <Link
                  to={`/sertifikat-kkn?nim=${student.nim}`}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  Lihat Lembar Sertifikat Asli
                </Link>
              )}
              <span className="text-[11px] text-slate-500 font-mono">
                No. Reg: {student.nomorSertifikat}
              </span>
            </div>

          </div>
        ) : (
          /* Card Verifikasi Gagal */
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-red-500/40 p-8 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sertifikat Tidak Ditemukan</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                ID Sertifikat <code className="text-red-400 font-mono font-bold">{idSertifikat}</code> tidak terdaftar di pangkalan data resmi KKN Tematik UNIKOM Batch I.
              </p>
            </div>
            <Link
              to={isStaging ? "/sertifikat-kkn" : "/"}
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline pt-2"
            >
              {isStaging ? "Kembali ke Halaman Pencarian Sertifikat" : "Kembali ke Beranda"}
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 pt-4">
          &copy; 2026 Universitas Komputer Indonesia &bull; Sistem Berseka KKN Tematik &bull; Dilindungi Hak Cipta
        </div>

      </div>
    </div>
  );
};

export default VerifikasiSertifikatPage;
