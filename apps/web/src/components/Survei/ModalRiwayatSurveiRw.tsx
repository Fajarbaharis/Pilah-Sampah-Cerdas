import React, { useState, useEffect } from "react";
import { X, History, CheckCircle2, ArrowRight, User, Phone, MapPin, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";

interface ModalRiwayatSurveiRwProps {
  isOpen: boolean;
  onClose: () => void;
  surveyId: string | null;
}

export const ModalRiwayatSurveiRw: React.FC<ModalRiwayatSurveiRwProps> = ({
  isOpen,
  onClose,
  surveyId,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen && surveyId) {
      fetchRiwayat(surveyId);
    } else {
      setData(null);
      setExpandedVersions({});
    }
  }, [isOpen, surveyId]);

  const fetchRiwayat = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/survey/${id}/riwayat`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error("Gagal memuat riwayat survei RW:", err);
      showToast.error("Gagal memuat linimasa riwayat survei RW.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (idKey: string) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [idKey]: !prev[idKey],
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <History size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Linimasa Riwayat Survei RW
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {data
                  ? `${data.kelurahan} — ${data.rw} (${data.tahap} ${data.tahun})`
                  : "Memuat detail wilayah..."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Memuat riwayat revisi...</p>
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Data riwayat tidak ditemukan.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {/* 🟢 Versi Terkini (Aktif) */}
              <div className="relative group">
                {/* Node Bulat */}
                <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950/70 flex items-center justify-center text-white">
                  <CheckCircle2 size={12} strokeWidth={3} />
                </div>

                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 transition-all">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-600 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs">
                        Versi {data.versi || 1} (Aktif)
                      </span>
                      {data.terakhirDiubahOleh && (
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          Revisi Terakhir
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <Calendar size={13} className="text-slate-400" />
                      <span>
                        Survei:{" "}
                        {data.tanggalSurvei
                          ? new Date(data.tanggalSurvei).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Surveyor Info */}
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 font-bold mb-3">
                    <User size={13} className="text-emerald-600" />
                    <span>{data.namaSurveyor}</span>
                    <span className="text-slate-400 font-normal">
                      (NIM: {data.nim} · {data.kelompok})
                    </span>
                  </div>

                  {/* Metric Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/40 text-xs">
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Wilayah</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {data.jumlahRt} RT · {data.jumlahKk} KK
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Pemilahan</span>
                      <span className="font-bold text-emerald-600">
                        {Number(data.persenPilah || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Volume Total</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {Number(data.volumeTotal || 0).toFixed(1)} kg/hari
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Bank Sampah</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {data.bankSampahAktif || 0} Aktif
                      </span>
                    </div>
                  </div>

                  {/* Waktu Input */}
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock size={11} />
                    <span>
                      Diperbarui di sistem:{" "}
                      {new Date(data.updatedAt || data.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      WIB
                    </span>
                  </div>
                </div>
              </div>

              {/* ⚪ Versi-Versi Sebelumnya (Snapshot Arsip) */}
              {Array.isArray(data.riwayat) && data.riwayat.length > 0 ? (
                data.riwayat.map((r: any) => {
                  const isExp = !!expandedVersions[r.id];
                  return (
                    <div key={r.id} className="relative group">
                      {/* Node Bulat */}
                      <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-slate-100 dark:ring-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                        {r.versi}
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-slate-300 transition-all shadow-2xs">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                              Versi {r.versi} (Arsip)
                            </span>
                            {r.alasanPerubahan && (
                              <span className="text-[11px] text-slate-500 italic">
                                {r.alasanPerubahan}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                            <Calendar size={13} className="text-slate-400" />
                            <span>
                              Survei:{" "}
                              {r.tanggalSurvei
                                ? new Date(r.tanggalSurvei).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })
                                : "—"}
                            </span>
                          </div>
                        </div>

                        {/* Surveyor Info */}
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-bold mb-3">
                          <User size={13} className="text-slate-400" />
                          <span>{r.namaSurveyor}</span>
                          <span className="text-slate-400 font-normal">
                            (NIM: {r.nim} · {r.kelompok})
                          </span>
                        </div>

                        {/* Metric Comparison Mini Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              Wilayah
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {r.jumlahRt} RT · {r.jumlahKk} KK
                            </span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              Pemilahan
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {Number(r.persenPilah || 0).toFixed(1)}%
                            </span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              Volume Total
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {Number(r.volumeTotal || 0).toFixed(1)} kg
                            </span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              Bank Sampah
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {r.bankSampahAktif || 0} Aktif
                            </span>
                          </div>
                        </div>

                        {/* Toggle Rincian Versi Lama */}
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleExpand(r.id)}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-bold cursor-pointer"
                          >
                            {isExp ? (
                              <>
                                Sembunyikan Rincian <ChevronUp size={12} />
                              </>
                            ) : (
                              <>
                                Lihat Rincian Lengkap <ChevronDown size={12} />
                              </>
                            )}
                          </button>
                          <span className="text-[10px] text-slate-400">
                            Diarsipkan:{" "}
                            {new Date(r.createdAt).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {isExp && (
                          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-2 border border-slate-200/60 dark:border-slate-700/60 animate-in fade-in duration-150">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Kontak WhatsApp:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{r.noWa || "—"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Tingkat Pemilahan:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{r.tingkatPilah || "—"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Organik / Anorganik / Residu:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                  {Number(r.volumeOrganik || 0).toFixed(1)} / {Number(r.volumeAnorganik || 0).toFixed(1)} / {Number(r.volumeResidu || 0).toFixed(1)} kg
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Prioritas Pengelolaan:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{r.prioritas || "—"}</span>
                              </div>
                            </div>
                            {r.catatanValidasi && (
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-400 text-[11px]">
                                <b>Catatan Validasi Sistem:</b> {r.catatanValidasi}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 italic">
                  Belum ada revisi atau pembaruan sebelumnya. Ini adalah data survei versi pertama (asli).
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};