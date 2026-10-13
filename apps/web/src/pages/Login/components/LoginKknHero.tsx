/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: LoginKknHero
 * Deskripsi: Panel visual kiri Halaman Login (KKN Tematik) sesuai acuan desain resmi:
 * - Header Tipografi Kontras: "KKN Tematik"
 * - Card Linimasa Kegiatan (Dinamis dari /api/v1/kkn/timeline):
 *   Aturan Windowing: Maksimal 3 tahapan (yang sudah, yang sedang, dan yang akan jika ada).
 *   Jika berada di tahap akhir, cukup 2 tahapan (yang sudah dan yang sedang).
 * - Card Informasi Penting (Statis): 3 kartu panduan operasional mahasiswa KKN.
 */

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Check,
  CircleDot,
  Megaphone,
  ClipboardCheck,
  Users,
  Info,
} from "lucide-react";
import api from "../../../services/api";

export interface TimelineStage {
  id: string;
  kegiatanUtama: string;
  deskripsi?: string;
  tahapMinggu?: string;
  statusPelaksanaan: "SELESAI" | "SEDANG_BERJALAN" | "BELUM_DIMULAI";
  fase?: string;
  tanggal?: string;
}

export interface WindowedTimelineItem {
  id: string;
  title: string;
  subtitle: string;
  status: "completed" | "active" | "upcoming";
  badgeLabel: string;
}

// Fallback jika jaringan lambat / offline
const FALLBACK_TIMELINE: WindowedTimelineItem[] = [
  {
    id: "fb-1",
    title: "Survei & Pendataan Baseline",
    subtitle: "Pengumpulan data awal di lokasi KKN dan verifikasi warga.",
    status: "completed",
    badgeLabel: "Selesai",
  },
  {
    id: "fb-2",
    title: "Pelaksanaan Program Kerja",
    subtitle: "Pendampingan warga, pemilahan sampah, dan pencatatan logbook.",
    status: "active",
    badgeLabel: "Sedang berjalan",
  },
  {
    id: "fb-3",
    title: "Evaluasi & Laporan Akhir",
    subtitle: "Penyusunan laporan akhir dan presentasi hasil kegiatan.",
    status: "upcoming",
    badgeLabel: "Berikutnya",
  },
];

export interface LoginKknHeroProps {
  className?: string;
}

export const LoginKknHero: React.FC<LoginKknHeroProps> = ({ className = "" }) => {
  const [stages, setStages] = useState<WindowedTimelineItem[]>(FALLBACK_TIMELINE);

  useEffect(() => {
    let isMounted = true;

    async function fetchLinimasa() {
      try {
        const res = await api.get("/kkn/timeline");
        const rawList: TimelineStage[] = res.data?.data ?? [];
        if (!Array.isArray(rawList) || rawList.length === 0) return;

        // Cari tahapan aktif yang sedang berjalan
        const activeIdx = rawList.findIndex(
          (item) => item.statusPelaksanaan === "SEDANG_BERJALAN"
        );

        let windowed: WindowedTimelineItem[] = [];

        if (activeIdx !== -1) {
          // 1. Yang sudah (1 item selesai terakhir sebelum yang sedang berjalan)
          const pastItem = activeIdx > 0 ? rawList[activeIdx - 1] : null;
          // 2. Yang sedang berjalan
          const currentItem = rawList[activeIdx];
          // 3. Yang akan datang (jika masih ada agenda berikutnya)
          const nextItem = activeIdx + 1 < rawList.length ? rawList[activeIdx + 1] : null;

          if (pastItem) {
            windowed.push({
              id: pastItem.id || "stage-past",
              title: pastItem.kegiatanUtama,
              subtitle:
                pastItem.deskripsi ||
                `${pastItem.tahapMinggu ? `${pastItem.tahapMinggu} • ` : ""}${pastItem.tanggal || pastItem.fase || "Tahap sebelumnya"}`,
              status: "completed",
              badgeLabel: "Selesai",
            });
          }

          windowed.push({
            id: currentItem.id || "stage-active",
            title: currentItem.kegiatanUtama,
            subtitle:
              currentItem.deskripsi ||
              `${currentItem.tahapMinggu ? `${currentItem.tahapMinggu} • ` : ""}${currentItem.tanggal || currentItem.fase || "Tahap sedang berlangsung"}`,
            status: "active",
            badgeLabel: "Sedang berjalan",
          });

          if (nextItem) {
            windowed.push({
              id: nextItem.id || "stage-next",
              title: nextItem.kegiatanUtama,
              subtitle:
                nextItem.deskripsi ||
                `${nextItem.tahapMinggu ? `${nextItem.tahapMinggu} • ` : ""}${nextItem.tanggal || nextItem.fase || "Tahap mendatang"}`,
              status: "upcoming",
              badgeLabel: "Berikutnya",
            });
          }
        } else {
          // Jika tidak ada status SEDANG_BERJALAN eksplisit, ambil 2-3 item terdekat
          const completedList = rawList.filter((i) => i.statusPelaksanaan === "SELESAI");
          const upcomingList = rawList.filter((i) => i.statusPelaksanaan === "BELUM_DIMULAI");

          if (completedList.length > 0) {
            const lastComp = completedList[completedList.length - 1];
            windowed.push({
              id: lastComp.id || "stage-c",
              title: lastComp.kegiatanUtama,
              subtitle: lastComp.deskripsi || lastComp.tahapMinggu || "Tahap selesai",
              status: "completed",
              badgeLabel: "Selesai",
            });
          }
          if (upcomingList.length > 0) {
            const firstUp = upcomingList[0];
            windowed.push({
              id: firstUp.id || "stage-u1",
              title: firstUp.kegiatanUtama,
              subtitle: firstUp.deskripsi || firstUp.tahapMinggu || "Tahap aktif",
              status: "active",
              badgeLabel: "Sedang berjalan",
            });
            if (upcomingList.length > 1) {
              const secondUp = upcomingList[1];
              windowed.push({
                id: secondUp.id || "stage-u2",
                title: secondUp.kegiatanUtama,
                subtitle: secondUp.deskripsi || secondUp.tahapMinggu || "Tahap berikutnya",
                status: "upcoming",
                badgeLabel: "Berikutnya",
              });
            }
          }
        }

        if (isMounted && windowed.length > 0) {
          setStages(windowed);
        }
      } catch (_err) {
        // Fallback dipertahankan
      }
    }

    fetchLinimasa();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      aria-label="Informasi KKN Tematik BERSEKA"
      className={`relative w-full h-full flex flex-col justify-between p-6 sm:p-8 lg:p-11 bg-gradient-to-br from-[#eaf6f2] via-[#f3faf7] to-[#e8f2fc] overflow-hidden text-left ${className}`}
    >
      {/* Aksen Dekoratif Halus Latar Belakang */}
      <div className="absolute -top-16 -right-16 w-60 h-60 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-16 w-72 h-72 bg-blue-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* Konten Utama Panel Kiri */}
      <div className="relative z-10 flex flex-col justify-between h-full space-y-5 sm:space-y-6">
        
        {/* 1. Header Utama: KKN Tematik */}
        <div>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-black tracking-tight leading-none">
            <span className="text-[#0f2142]">KKN </span>
            <span className="text-[#138861]">Tematik</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5">
            Sistem Informasi Pengelolaan & Pemilahan Sampah Berkelanjutan
          </p>
        </div>

        {/* 2. Card Linimasa Kegiatan (Dinamis 2-3 Tahapan) */}
        <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(15,33,66,0.06)] border border-slate-200/80">
          {/* Header Card */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#138861] flex items-center justify-center border border-emerald-100/80">
                <Calendar size={18} strokeWidth={2.4} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Linimasa Kegiatan
              </h3>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200/70 px-2.5 py-1 rounded-full">
              <Info size={13} className="text-[#138861]" />
              <span>Tahapan Program</span>
            </div>
          </div>

          {/* Stepper Timeline List */}
          <div className="pt-3.5 space-y-1">
            {stages.map((stage, idx) => {
              const isLast = idx === stages.length - 1;
              const isActive = stage.status === "active";
              const isCompleted = stage.status === "completed";

              return (
                <div
                  key={stage.id}
                  className={`flex items-start gap-3.5 transition-all duration-200 ${
                    isActive
                      ? "bg-[#ecfdf5] border border-emerald-300/80 rounded-xl p-3 sm:p-3.5 shadow-xs"
                      : "p-2 sm:p-2.5"
                  }`}
                >
                  {/* Indicator Column + Connecting Line */}
                  <div className="flex flex-col items-center shrink-0 self-stretch">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-[#10b981] text-white flex items-center justify-center shadow-xs">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    ) : isActive ? (
                      <div className="w-6 h-6 rounded-full bg-[#138861] text-white flex items-center justify-center ring-4 ring-emerald-100/90 shadow-xs">
                        <CircleDot size={14} strokeWidth={2.6} />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center" />
                    )}

                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 my-1 ${
                          isCompleted
                            ? "bg-[#10b981]/70"
                            : "bg-slate-200"
                        }`}
                        style={{ minHeight: "22px" }}
                      />
                    )}
                  </div>

                  {/* Text Description + Badge */}
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-3">
                    <div className="min-w-0 flex-1 pr-1">
                      <h4
                        className={`text-xs sm:text-sm font-bold leading-snug break-words ${
                          isActive
                            ? "text-emerald-950 font-extrabold"
                            : "text-slate-800"
                        }`}
                      >
                        {stage.title}
                      </h4>
                      <p
                        className={`text-xs mt-1 leading-relaxed break-words ${
                          isActive ? "text-emerald-900/90 font-medium" : "text-slate-600"
                        }`}
                      >
                        {stage.subtitle}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 self-start sm:self-start mt-0.5 sm:mt-0">
                      {isActive ? (
                        <span className="inline-block bg-[#138861] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs whitespace-nowrap">
                          {stage.badgeLabel}
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-block bg-slate-100 text-slate-700 border border-slate-200/90 text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          {stage.badgeLabel}
                        </span>
                      ) : (
                        <span className="inline-block bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          {stage.badgeLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Card Informasi Penting (Statis Sesuai Arahan Pimpinan) */}
        <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(15,33,66,0.06)] border border-slate-200/80">
          {/* Header Card */}
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#138861] flex items-center justify-center border border-emerald-100/80">
              <Megaphone size={18} strokeWidth={2.4} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Informasi Penting
            </h3>
          </div>

          {/* Grid 3 Sub-card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Sub-card 1: Logbook */}
            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 flex sm:flex-col items-start gap-2.5 hover:border-emerald-200 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                <ClipboardCheck size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 leading-tight">
                  Catatan harian (<em>logbook</em>)
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Catat kegiatan harian dan unggah bukti dokumentasi.
                </p>
              </div>
            </div>

            {/* Sub-card 2: DPL */}
            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 flex sm:flex-col items-start gap-2.5 hover:border-blue-200 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                <Users size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 leading-tight">
                  Koordinasi dengan DPL
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Laporkan perkembangan dan kendala pelaksanaan program.
                </p>
              </div>
            </div>

            {/* Sub-card 3: Evaluasi */}
            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 flex sm:flex-col items-start gap-2.5 hover:border-amber-200 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                <Calendar size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 leading-tight">
                  Jadwal evaluasi kegiatan
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Pantau pengumuman resmi dan tahapan penilaian tim KKN.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-3 border-t border-slate-100 mt-3.5">
            <Info size={13} className="shrink-0 text-[#138861]" />
            <span>Jadwal dan pengumuman mengikuti ketetapan tim KKN.</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default LoginKknHero;
