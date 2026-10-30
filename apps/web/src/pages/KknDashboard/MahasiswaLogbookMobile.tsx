/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Mobile Logbook List & Detail View for Mahasiswa KKN
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  PlusCircle,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  Search,
  Filter,
  X,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { logbookApiService, type LogbookMahasiswaItem } from "../../services/logbookService";
import showToast from "../../utils/showToast";
import { safeFormatDateShort, safeFormatDateLong } from "../../utils/safeDateUtils";
import { resolveImageUrl, handleDokumentasiImageError } from "../../utils/imageUrl";
import { useAuthStore } from "../../store/useAuthStore";

interface MahasiswaLogbookMobileProps {
  onOpenCreateModal: () => void;
  onOpenEditModal?: (log: LogbookMahasiswaItem) => void;
  refreshTrigger?: number;
}

export const MahasiswaLogbookMobile: React.FC<MahasiswaLogbookMobileProps> = ({
  onOpenCreateModal,
  onOpenEditModal,
  refreshTrigger,
}) => {
  const { user } = useAuthStore();
  const [logbooks, setLogbooks] = useState<LogbookMahasiswaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPekan, setSelectedPekan] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Detail State
  const [selectedLogbook, setSelectedLogbook] = useState<LogbookMahasiswaItem | null>(null);

  // Modal Delete State
  const [deleteTargetLogbook, setDeleteTargetLogbook] = useState<LogbookMahasiswaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchLogbooks();
  }, [refreshTrigger]);

  const fetchLogbooks = async () => {
    try {
      setIsLoading(true);
      const data = await logbookApiService.getMahasiswaLogbooks();
      setLogbooks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal memuat logbook", err);
      showToast.error("Gagal memuat daftar logbook");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logbooks.filter((log) => {
      // 1. Status Filter
      if (statusFilter === "APPROVED" && log.statusApproval !== "DISETUJUI_DPL") return false;
      if (
        statusFilter === "PENDING" &&
        log.statusApproval !== "MENUNGGU_VERIFIKASI_DPL" &&
        log.statusApproval !== "MENUNGGU_PERSETUJUAN_KETUA"
      ) {
        return false;
      }
      if (
        statusFilter === "REVISION" &&
        log.statusApproval !== "PERLU_REVISI_DPL" &&
        log.statusApproval !== "DITOLAK_KETUA"
      ) {
        return false;
      }

      // 2. Pekan Filter
      if (selectedPekan !== "ALL" && String(log.pekanKe) !== selectedPekan) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchDesc = (log.deskripsi || "").toLowerCase().includes(q);
        const matchTempat = (log.tempat || "").toLowerCase().includes(q);
        if (!matchDesc && !matchTempat) return false;
      }

      return true;
    });
  }, [logbooks, statusFilter, selectedPekan, searchQuery]);

  const handleEdit = (log: LogbookMahasiswaItem) => {
    if (log.statusApproval === "DITOLAK_DPL") {
      showToast.error("Logbook yang telah ditolak mutlak oleh DPL tidak dapat diubah kembali.");
      return;
    }
    if (onOpenEditModal) {
      setSelectedLogbook(null);
      onOpenEditModal(log);
    } else {
      showToast.info("Fasilitas edit sedang dibuka...");
    }
  };

  const handlePromptDelete = (log: LogbookMahasiswaItem) => {
    setDeleteTargetLogbook(log);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetLogbook) return;
    setIsDeleting(true);
    try {
      await logbookApiService.deleteMahasiswaLogbook(deleteTargetLogbook.id);
      showToast.success("Logbook kegiatan KKN berhasil dihapus.");
      setDeleteTargetLogbook(null);
      if (selectedLogbook?.id === deleteTargetLogbook.id) {
        setSelectedLogbook(null);
      }
      fetchLogbooks();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal menghapus catatan logbook.");
    } finally {
      setIsDeleting(false);
    }
  };

  const canEditLogbook = (log: LogbookMahasiswaItem) => {
    return log.statusApproval !== "DITOLAK_DPL";
  };

  const canDeleteLogbook = (log: LogbookMahasiswaItem) => {
    if (!user?.id) return true;
    return !log.penulisId || log.penulisId === user.id;
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Banner & Action Button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Logbook KKN Mahasiswa</h2>
            <p className="text-[11px] text-slate-500">Laporan harian aktivitas &amp; validasi DPL</p>
          </div>
          <button
            onClick={fetchLogbooks}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
            title="Segarkan data logbook"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* CTA Button */}
        <button
          onClick={onOpenCreateModal}
          className="w-full py-3 bg-[#035941] hover:bg-[#02402e] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <PlusCircle size={16} />
          <span>+ Catat Logbook Kegiatan Baru</span>
        </button>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Cari aktivitas atau lokasi logbook..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#035941]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter Segmented Controls */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-[10px] font-bold">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`py-1.5 rounded-xl transition cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Semua ({logbooks.length})
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`py-1.5 rounded-xl transition cursor-pointer ${
              statusFilter === "APPROVED"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Valid DPL
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`py-1.5 rounded-xl transition cursor-pointer ${
              statusFilter === "PENDING"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Menunggu
          </button>
          <button
            onClick={() => setStatusFilter("REVISION")}
            className={`py-1.5 rounded-xl transition cursor-pointer ${
              statusFilter === "REVISION"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Revisi
          </button>
        </div>

        {/* Sub-filter Pekan Ke- */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold scrollbar-none pt-1">
          <span className="text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Filter size={12} />
            Pekan:
          </span>
          {[
            { id: "ALL", label: "Semua Pekan" },
            { id: "1", label: "Pekan 1" },
            { id: "2", label: "Pekan 2" },
            { id: "3", label: "Pekan 3" },
            { id: "4", label: "Pekan 4" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPekan(p.id)}
              className={`py-1 px-2.5 rounded-xl whitespace-nowrap transition cursor-pointer shrink-0 border ${
                selectedPekan === p.id
                  ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-500 font-extrabold"
                  : "bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Logbook List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={24} className="animate-spin text-emerald-600" />
            <span>Memuat logbook...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400 space-y-2">
            <FileText size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-slate-700 dark:text-slate-300">
              {logbooks.length === 0 ? "Belum ada catatan logbook" : "Tidak ada logbook yang sesuai"}
            </p>
            <p className="text-[11px]">
              {logbooks.length === 0
                ? "Mulai catat aktivitas harian KKN Anda dengan tombol di atas."
                : searchQuery
                ? `Tidak ditemukan logbook dengan kata kunci "${searchQuery}".`
                : "Tidak ada aktivitas pada filter status atau pekan ini."}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isApproved = log.statusApproval === "DISETUJUI_DPL";
            const isRevision =
              log.statusApproval === "PERLU_REVISI_DPL" || log.statusApproval === "DITOLAK_KETUA";
            const isRejected = log.statusApproval === "DITOLAK_DPL";
            const editable = canEditLogbook(log);

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLogbook(log)}
                className={`bg-white dark:bg-slate-900 border ${
                  isRevision
                    ? "border-amber-300 dark:border-amber-800/80 shadow-xs shadow-amber-900/10"
                    : isRejected
                    ? "border-rose-200 dark:border-rose-900/40"
                    : "border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60"
                } rounded-3xl p-4 shadow-2xs transition cursor-pointer space-y-3 group active:scale-[0.99]`}
              >
                {/* Top Badges & Action Buttons */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : isRevision
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : isRejected
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                      }`}
                    >
                      {isApproved
                        ? "✓ Disetujui DPL"
                        : isRevision
                        ? "⚠ Perlu Revisi"
                        : isRejected
                        ? "✕ Ditolak DPL"
                        : "⏳ Menunggu Validasi"}
                    </span>

                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      Pekan ke-{log.pekanKe || 1}
                    </span>
                  </div>

                  {/* Inline Quick Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {editable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(log);
                        }}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/60 text-slate-500 transition cursor-pointer"
                        title="Koreksi / Edit Logbook"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                    {canDeleteLogbook(log) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePromptDelete(log);
                        }}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 text-slate-500 transition cursor-pointer"
                        title="Hapus Logbook"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                    {log.deskripsi}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {safeFormatDateShort(log.tanggalKegiatan, true)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {log.waktuMulai} - {log.waktuSelesai}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {log.tempat}
                    </span>
                  </div>
                </div>

                {/* Foto Bukti */}
                {log.fotoBuktiUrl && (
                  <div className="h-32 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
                    <img
                      src={resolveImageUrl(log.fotoBuktiUrl)}
                      alt="Bukti Foto"
                      onError={(e) => handleDokumentasiImageError(e, "Bukti Foto Kegiatan")}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Catatan DPL */}
                {log.catatanDpl && (
                  <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 space-y-0.5">
                    <span className="font-bold text-[10px] uppercase flex items-center gap-1">
                      <AlertCircle size={12} />
                      Catatan DPL:
                    </span>
                    <p>{log.catatanDpl}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 3. Modal Detail Logbook */}
      {selectedLogbook && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedLogbook(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[88vh] flex flex-col animate-in slide-in-from-bottom duration-200"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Detail Logbook Kegiatan</h3>
              <button
                onClick={() => setSelectedLogbook(null)}
                className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status Validasi:</span>
                <span className="font-bold text-emerald-600">{selectedLogbook.statusApproval}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pekan Kegiatan:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Pekan ke-{selectedLogbook.pekanKe || 1}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tanggal:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {safeFormatDateLong(selectedLogbook.tanggalKegiatan)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Waktu &amp; Durasi:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedLogbook.waktuMulai} - {selectedLogbook.waktuSelesai}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Lokasi:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLogbook.tempat}</span>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Deskripsi Lengkap:</span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  {selectedLogbook.deskripsi}
                </p>
              </div>

              {selectedLogbook.catatanDpl && (
                <div className="space-y-1 pt-1">
                  <span className="font-bold text-amber-600 uppercase text-[10px]">Catatan DPL:</span>
                  <p className="text-amber-800 dark:text-amber-200 leading-relaxed bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-900/60 font-medium">
                    {selectedLogbook.catatanDpl}
                  </p>
                </div>
              )}

              {selectedLogbook.fotoBuktiUrl && (
                <div className="space-y-1 pt-2">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Foto Bukti Lapangan:</span>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img
                      src={resolveImageUrl(selectedLogbook.fotoBuktiUrl)}
                      alt="Foto Bukti"
                      onError={(e) => handleDokumentasiImageError(e, "Foto Bukti Lapangan")}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer: Edit, Hapus, Tutup */}
            <div className="p-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 shrink-0 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {canEditLogbook(selectedLogbook) && (
                  <button
                    type="button"
                    onClick={() => handleEdit(selectedLogbook)}
                    className="py-2.5 px-3 bg-[#035941] hover:bg-[#02402e] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Pencil size={14} />
                    <span>Koreksi / Edit</span>
                  </button>
                )}
                {canDeleteLogbook(selectedLogbook) && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedLogbook;
                      setSelectedLogbook(null);
                      handlePromptDelete(target);
                    }}
                    className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-rose-200 dark:border-rose-900/40"
                  >
                    <Trash2 size={14} />
                    <span>Hapus Logbook</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogbook(null)}
                className="w-full py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-bold rounded-xl text-xs text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Konfirmasi Hapus Logbook */}
      {deleteTargetLogbook && (
        <div
          className="fixed inset-0 z-[110] bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => !isDeleting && setDeleteTargetLogbook(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in slide-in-from-bottom duration-200"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Hapus Logbook Kegiatan?
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Logbook tanggal{" "}
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {safeFormatDateShort(deleteTargetLogbook.tanggalKegiatan)}
                </span>{" "}
                akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
              <p className="font-bold truncate">{deleteTargetLogbook.tempat}</p>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                {deleteTargetLogbook.deskripsi}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 pb-[calc(env(safe-area-inset-bottom,0px))]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetLogbook(null)}
                className="py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
