import React from "react";
import {
  X,
  Printer,
  Calendar,
  User,
  MapPin,
  Home,
  Trash2,
  Phone,
  BarChart2,
  Layers,
  Users,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
} from "lucide-react";

interface DetailSurveiRwModalProps {
  isOpen: boolean;
  survey: any | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export default function DetailSurveiRwModal({
  isOpen,
  survey,
  onClose,
  onDelete,
  canDelete = false,
}: DetailSurveiRwModalProps) {
  if (!isOpen || !survey) return null;

  const formatDate = (val: string | Date | null | undefined) => {
    if (!val) return "—";
    try {
      return new Date(val).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return String(val);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper parsing array / JSON
  const parseList = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return val.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  // Parsing key players
  let keyPlayers: any[] = [];
  if (Array.isArray(survey.keyPlayer)) {
    keyPlayers = survey.keyPlayer;
  } else if (typeof survey.keyPlayer === "string") {
    try {
      const parsed = JSON.parse(survey.keyPlayer);
      if (Array.isArray(parsed)) keyPlayers = parsed;
    } catch {
      keyPlayers = [];
    }
  }

  // Filter key players yang memang diisi nama/kontak/perannya
  const validKeyPlayers = keyPlayers.filter(
    (kp) =>
      kp &&
      ((kp.nama && kp.nama.trim() !== "") ||
        (kp.kontak && kp.kontak.trim() !== "") ||
        (kp.peran && kp.peran.trim() !== ""))
  );

  const cleanWa = (phone: string | null | undefined) => {
    if (!phone) return "";
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.substring(1);
    return clean;
  };

  const persenPilah = Number(survey.persenPilah) || 0;
  const volOrganik = Number(survey.volumeOrganik) || 0;
  const volAnorganik = Number(survey.volumeAnorganik) || 0;
  const volResidu = Number(survey.volumeResidu) || 0;
  const volTotal = Number(survey.volumeTotal) || (volOrganik + volAnorganik + volResidu);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-[#009966]/10 text-[#009966] border border-[#009966]/20">
                {survey.kodeSurvey || "SURVEI-RW"}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                  survey.tahap === "Endline"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                }`}
              >
                {survey.tahap || "Endline"} · {survey.tahun || "2026"}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {survey.rw} {survey.kelurahan}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Kecamatan {survey.kecamatan || "Coblong"}, {survey.kota || "Kota Bandung"} · Tanggal Survei:{" "}
              {formatDate(survey.tanggalSurvei || survey.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Cetak Detail Survei"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Card 1: IDENTITAS SURVEYOR & WILAYAH */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#009966] flex items-center gap-2 mb-3">
              <User size={15} /> 1. Identitas Surveyor & Wilayah Lapangan
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800/80">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Surveyor</div>
                  <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                    {survey.namaSurveyor || "—"}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    NIM: {survey.nim || "—"} · {survey.prodi || "—"}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Kelompok KKN: <span className="font-semibold text-slate-700 dark:text-slate-300">{survey.kelompok || "—"}</span>
                  </div>
                  {survey.noWa && (
                    <div className="mt-1.5">
                      <a
                        href={`https://wa.me/${cleanWa(survey.noWa)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        <Phone size={12} /> WhatsApp: {survey.noWa} <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cakupan Wilayah RW</div>
                  <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                    {survey.rw} — Kelurahan {survey.kelurahan}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Jumlah RT</div>
                      <div className="text-base font-black text-slate-800 dark:text-slate-100">
                        {survey.jumlahRt ?? "—"} RT
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Jumlah KK / Rumah</div>
                      <div className="text-base font-black text-slate-800 dark:text-slate-100">
                        {survey.jumlahKk ?? "—"} KK
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: PEMILAHAN SAMPAH DI SUMBER */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#009966] flex items-center gap-2 mb-3">
              <BarChart2 size={15} /> 2. Pemilahan Sampah di Sumber (Rumah Tangga)
            </h3>
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/40">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Rumah Tangga Memilah</div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {survey.rumahPilah ?? 0}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">dari total {survey.rumahTotal ?? survey.jumlahKk ?? 0} KK</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Persentase Pemilahan</div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {persenPilah.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Tingkat Partisipasi Warga</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Kategori Pemilahan</div>
                  <div className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                    {survey.tingkatPilah || (persenPilah > 50 ? "Sebagian besar" : "Sebagian kecil")}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Klasifikasi KKN</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: TIMBULAN SAMPAH HARIAN */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#009966] flex items-center gap-2 mb-3">
              <Layers size={15} /> 3. Timbulan Sampah Harian (kg/hari)
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800/80">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">Organik</div>
                  <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {volOrganik.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400">kg/hari</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-blue-600 uppercase">Anorganik</div>
                  <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {volAnorganik.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400">kg/hari</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-amber-600 uppercase">Residu</div>
                  <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {volResidu.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400">kg/hari</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-rose-600 uppercase">Total Harian</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {volTotal.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400">kg/hari</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: INFRASTRUKTUR & METODE PENGOLAHAN */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#009966] flex items-center gap-2 mb-3">
              <Home size={15} /> 4. Infrastruktur & Metode Pengolahan Sampah
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800/80 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Bank Sampah</div>
                  <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                    Aktif: <span className="text-emerald-600">{survey.bankSampahAktif ?? 0}</span> · Nonaktif:{" "}
                    <span className="text-slate-400">{survey.bankSampahTidakAktif ?? 0}</span>
                  </div>
                  {survey.keteranganBankSampah && (
                    <div className="text-xs text-slate-500 mt-1 italic">
                      "{survey.keteranganBankSampah}"
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Unit Komposter</div>
                  <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                    {survey.unitKomposter ?? 0} Unit
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Pengolahan organik mandiri</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Titik Budidaya Maggot</div>
                  <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                    {survey.titikMaggot ?? 0} Titik
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Biokonversi BSF</div>
                </div>
              </div>

              {/* Teknologi & Karakteristik Wilayah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Teknologi / Metode Terapan
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parseList(survey.teknologi).length > 0 ? (
                      parseList(survey.teknologi).map((t, idx) => (
                        <span
                          key={idx}
                          className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-md"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Tidak ada metode terapan spesifik</span>
                    )}
                    {survey.teknologiLain && (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                        {survey.teknologiLain}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Karakteristik Lingkungan RW
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parseList(survey.karakter).length > 0 ? (
                      parseList(survey.karakter).map((k, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold px-2.5 py-1 rounded-md"
                        >
                          {k}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Karakteristik standar</span>
                    )}
                    {(survey.jumlahKos > 0 || survey.jumlahUmkm > 0) && (
                      <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold px-2.5 py-1 rounded-md">
                        {survey.jumlahKos ? `${survey.jumlahKos} Kos ` : ""}{survey.jumlahUmkm ? `· ${survey.jumlahUmkm} UMKM` : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: AKTOR KUNCI & CATATAN LAPANGAN */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#009966] flex items-center gap-2 mb-3">
              <Users size={15} /> 5. Aktor Kunci (Key Players) & Catatan Lapangan
            </h3>
            <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200/60 dark:border-amber-900/40 space-y-4">
              {/* Tabel Aktor Kunci */}
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                  Daftar Tokoh / Pihak Berpengaruh:
                </div>
                {validKeyPlayers.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-black">
                          <th className="px-3 py-2.5">Pihak / Tokoh</th>
                          <th className="px-3 py-2.5">Nama</th>
                          <th className="px-3 py-2.5">No. WhatsApp</th>
                          <th className="px-3 py-2.5">Peran Lapangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {validKeyPlayers.map((kp, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300">
                              {kp.aktor || kp.namaAktor || `Tokoh ${idx + 1}`}
                            </td>
                            <td className="px-3 py-2 font-extrabold text-slate-900 dark:text-slate-100">
                              {kp.nama || "—"}
                            </td>
                            <td className="px-3 py-2">
                              {kp.kontak ? (
                                <a
                                  href={`https://wa.me/${cleanWa(kp.kontak)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline"
                                >
                                  <Phone size={10} /> {kp.kontak}
                                </a>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                              {kp.peran || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    Tidak ada rincian aktor kunci yang diisi secara khusus untuk RW ini.
                  </div>
                )}
              </div>

              {/* Prioritas & Risiko */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1 mb-1">
                    <Lightbulb size={13} /> Prioritas Program Intervensi
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {survey.prioritas || "—"}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1 mb-1">
                    <AlertTriangle size={13} /> Kendala / Potensi Risiko
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {survey.risiko || "Tidak ada catatan risiko khusus."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Apakah Anda yakin ingin menghapus data survei ${survey.rw} ${survey.kelurahan}? Tindakan ini akan memperbarui agregasi kelurahan.`
                    )
                  ) {
                    onDelete(survey.id);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 font-bold text-xs transition cursor-pointer"
              >
                <Trash2 size={13} /> Hapus Data RW Ini
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
