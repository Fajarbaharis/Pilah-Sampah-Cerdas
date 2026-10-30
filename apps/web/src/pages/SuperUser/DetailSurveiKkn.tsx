import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  FileText,
  MapPin,
  Database,
  Sprout,
  Users,
  AlertTriangle,
  ArrowRight,
  Building,
  Map,
  CheckCircle2,
  Edit3,
  Home,
  ClipboardList,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  BarChart3,
  Calendar,
  Check,
  XCircle,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import EditSurveiModal from "./EditSurveiModal";
import DetailSurveiRwModal from "./DetailSurveiRwModal";
import { useAuthStore } from "../../store/useAuthStore";
import { normalizePercentage, formatPercentString } from "../../utils/surveyNormalizer";

type MainTabType = "BASELINE" | "ENDLINE" | "KOMPARASI";
type BaselineSubTabType = "overview" | "pemilahan" | "bank_sampah" | "karakter" | "key_player" | "potensi_risiko" | "rw_surveys";

export default function DetailSurveiKkn() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canEdit =
    user?.peran === "SUPER_USER" ||
    user?.peran === "DEVELOPER" ||
    user?.peran === "PANITIA_TASKFORCE" ||
    user?.peran === "TASK_FORCE" ||
    (user?.peran as string) === "TASKFORCE";

  const canDeleteRw = user?.peran === "SUPER_USER" || user?.peran === "DEVELOPER";

  // State Utama
  const [mainTab, setMainTab] = useState<MainTabType>("BASELINE");
  const [baselineSubTab, setBaselineSubTab] = useState<BaselineSubTabType>("overview");

  // State Data
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null); // Baseline
  const [endlineSurvey, setEndlineSurvey] = useState<any>(null); // Endline
  const [rwSurveys, setRwSurveys] = useState<any[]>([]); // Data survei level RW
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);

  // State Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRwSurvey, setSelectedRwSurvey] = useState<any | null>(null);
  const [isRwModalOpen, setIsRwModalOpen] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setIsLoadingDetail(true);
    try {
      // 1. Ambil data Baseline Kelurahan
      const resBaseline = await api.get(`/survei-kkn/${id}`);
      let kelurahanName = "";
      if (resBaseline.data.success) {
        setSelectedSurvey(resBaseline.data.data);
        kelurahanName = resBaseline.data.data?.namaKelurahan || "";
      }

      // 2. Ambil data Endline Kelurahan (jika ada)
      try {
        const resEndline = await api.get(`/evaluasi-dampak/endline/${id}`);
        if (resEndline.data.success && resEndline.data.data) {
          setEndlineSurvey(resEndline.data.data);
          if (!kelurahanName) kelurahanName = resEndline.data.data?.namaKelurahan || "";
        } else {
          setEndlineSurvey(null);
        }
      } catch {
        setEndlineSurvey(null);
      }

      // 3. Ambil data survei mikro level RW kelurahan ini (jika ada nama kelurahan)
      if (kelurahanName) {
        try {
          const resRw = await api.get(`/survey/data?kelurahan=${encodeURIComponent(kelurahanName)}`);
          if (resRw.data.success && resRw.data.data?.surveys) {
            setRwSurveys(resRw.data.data.surveys);
          }
        } catch {
          // RW query opsional
        }
      }
    } catch {
      showToast.error("Gagal memuat detail survei kelurahan");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleDeleteRwSurvey = async (rwId: string) => {
    try {
      const res = await api.delete(`/survey/${rwId}`);
      if (res.data.success) {
        showToast.success("Data survei RW berhasil dihapus");
        setIsRwModalOpen(false);
        setSelectedRwSurvey(null);
        // Reload data RW
        if (selectedSurvey?.namaKelurahan) {
          const resRw = await api.get(
            `/survey/data?kelurahan=${encodeURIComponent(selectedSurvey.namaKelurahan)}`
          );
          if (resRw.data.success && resRw.data.data?.surveys) {
            setRwSurveys(resRw.data.data.surveys);
          }
        }
      }
    } catch (e: any) {
      showToast.error(e.response?.data?.message || "Gagal menghapus survei RW");
    }
  };

  // Sub-tabs untuk tab Baseline
  const baselineTabs = [
    { id: "overview", label: "Ringkasan", icon: FileText },
    { id: "pemilahan", label: "Pemilahan", icon: Database },
    { id: "bank_sampah", label: "Bank Sampah", icon: Sprout },
    { id: "karakter", label: "Karakteristik", icon: MapPin },
    { id: "key_player", label: "Aktor (Key Player)", icon: Users },
    { id: "potensi_risiko", label: "Kesimpulan & Risiko", icon: AlertTriangle },
    { id: "rw_surveys", label: `Survei Lapangan RW (${rwSurveys.filter(s => !s.tahap || s.tahap.toLowerCase() === "baseline").length})`, icon: ClipboardList },
  ];

  const renderBool = (val: boolean | null | undefined) => {
    if (val === null || val === undefined) return <span className="text-slate-400 font-medium">— Belum tersedia</span>;
    return val ? <span className="text-emerald-600 font-bold">Ya</span> : <span className="text-rose-600 font-bold">Tidak</span>;
  };

  const renderValue = (val: any, suffix = "") => {
    if (val === null || val === undefined || val === "") return <span className="text-slate-400 font-medium">— Belum tersedia</span>;
    return <span className="text-slate-800 dark:text-slate-100 font-medium">{val} {suffix}</span>;
  };

  const calculateCompletion = () => {
    if (!selectedSurvey) return { percentage: 0, breakdown: [] };
    
    let completedSteps = 0;
    const breakdown = [
      { key: "Data Wilayah", isComplete: false },
      { key: "Data Pengumpulan", isComplete: false },
      { key: "Karakteristik", isComplete: false },
      { key: "Pemilahan", isComplete: false },
      { key: "Bank Sampah", isComplete: false },
      { key: "Aktor", isComplete: false },
      { key: "Kesimpulan", isComplete: false },
    ];

    if (selectedSurvey.kecamatan && selectedSurvey.jumlahRw && selectedSurvey.jumlahRt) {
      breakdown[0].isComplete = true; completedSteps++;
    }
    if (selectedSurvey.tanggalSurvei && selectedSurvey.enumerator) {
      breakdown[1].isComplete = true; completedSteps++;
    }
    if (selectedSurvey.karakteristikWilayah) {
      breakdown[2].isComplete = true; completedSteps++;
    }
    if (selectedSurvey.pemilahanSampah) {
      breakdown[3].isComplete = true; completedSteps++;
    }
    if (selectedSurvey.bankSampahPengolahan) {
      breakdown[4].isComplete = true; completedSteps++;
    }
    if (selectedSurvey.keyPlayers && selectedSurvey.keyPlayers.length > 0) {
      breakdown[5].isComplete = true; completedSteps++;
    }
    if (selectedSurvey.catatanKesimpulan) {
      breakdown[6].isComplete = true; completedSteps++;
    }

    return {
      percentage: Math.round((completedSteps / 7) * 100),
      breakdown
    };
  };

  // Filter survei mikro RW
  const baselineRwList = rwSurveys.filter(
    (s) => !s.tahap || s.tahap.toLowerCase() === "baseline"
  );
  const endlineRwList = rwSurveys.filter(
    (s) => s.tahap && s.tahap.toLowerCase() === "endline"
  );

  // Komponen Tabel RW
  const renderRwTable = (surveys: any[], tahapLabel: string) => {
    if (surveys.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed text-center px-4">
          <ClipboardList size={36} className="text-slate-300 dark:text-slate-600 mb-3" />
          <h5 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Belum Ada Survei RW {tahapLabel}
          </h5>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Survei mikro level RW yang diinput mahasiswa KKN melalui form publik <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">/survey/</code> akan otomatis tampil di sini.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList size={16} className="text-emerald-600" />
            Daftar Kontribusi Survei RW ({surveys.length} Data)
          </h5>
          <span className="text-xs font-semibold text-slate-500">Tahap: {tahapLabel}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-3">Wilayah</th>
                <th className="px-4 py-3">Surveyor & Kelompok</th>
                <th className="px-4 py-3 text-right">Pemilahan</th>
                <th className="px-4 py-3 text-right">Berat Total</th>
                <th className="px-4 py-3">Tgl Survei</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {surveys.map((rwItem: any) => {
                const normPilah = normalizePercentage(rwItem.persenPilah);
                return (
                  <tr key={rwItem.id || rwItem.kodeSurvey} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                      RW {rwItem.rw || "-"}
                      {rwItem.rt && <span className="text-slate-400 font-normal ml-1">/ RT {rwItem.rt}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      <div className="font-semibold">{rwItem.namaSurveyor || "-"}</div>
                      <div className="text-[10px] text-slate-400">NIM: {rwItem.nim || "-"} • Kelompok {rwItem.kelompok || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-800 dark:text-slate-100">
                      {normPilah.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-semibold">
                      {Number(rwItem.volumeTotal || 0).toLocaleString("id-ID")} kg/hari
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {rwItem.createdAt ? new Date(rwItem.createdAt).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {rwItem.status || "Lengkap"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedRwSurvey(rwItem);
                          setIsRwModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-lg transition cursor-pointer"
                      >
                        <Eye size={12} /> Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Sub-tab untuk Baseline
  const renderBaselineTabContent = () => {
    if (!selectedSurvey) return null;

    const {
      karakteristikWilayah: kw,
      pemilahanSampah: ps,
      bankSampahPengolahan: bs,
      keyPlayers: kp,
      volumeSampah: vs,
      catatanKesimpulan: pr,
    } = selectedSurvey;

    switch (baselineSubTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Map size={20} className="text-emerald-600" /> Informasi Wilayah
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b-2 border-slate-100 dark:border-slate-800 text-slate-400">
                        <th className="pb-3 font-bold uppercase tracking-wider">Data</th>
                        <th className="pb-3 font-bold uppercase tracking-wider text-right">Nilai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><MapPin size={16} /> Kecamatan</td>
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(selectedSurvey.kecamatan)}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><Map size={16} /> Jumlah RW</td>
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(selectedSurvey.jumlahRw, "RW")}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><Map size={16} /> Jumlah RT</td>
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(selectedSurvey.jumlahRt, "RT")}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><Users size={16} /> Jumlah KK</td>
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(selectedSurvey.jumlahKk, "KK")}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><Home size={16} /> Total Rumah</td>
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(selectedSurvey.jumlahRumahTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <ClipboardList size={20} className="text-emerald-600" /> Data Pengumpulan
                </h4>
                
                {(!selectedSurvey.tanggalSurvei || !selectedSurvey.enumerator) && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4 flex items-start gap-3">
                    <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-800 font-bold text-sm">Data belum lengkap</p>
                      <p className="text-amber-700 text-xs mt-1 leading-relaxed">Beberapa informasi belum tersedia karena belum diisi pada formulir sumber.</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm flex-1 content-start">
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Status Survei</span>
                    {calculateCompletion().percentage === 100 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold">
                        <CheckCircle2 size={14} /> Lengkap
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold">
                        <Info size={14} /> Belum Lengkap
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Tanggal Survei</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      {selectedSurvey.tanggalSurvei ? new Date(selectedSurvey.tanggalSurvei).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : <span className="text-slate-400 font-medium">— Belum tersedia</span>}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Enumerator</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{renderValue(selectedSurvey.enumerator)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Titik Kumpul</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{renderValue(selectedSurvey.titikKumpulMahasiswa)}</div>
                  </div>
                  {selectedSurvey.catatanData && (
                    <div className="col-span-2">
                      <span className="text-slate-500 font-medium block mb-1">Catatan Khusus</span>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
                        {selectedSurvey.catatanData}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Volume Sampah Overview */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Database size={20} className="text-emerald-600" /> Timbulan Sampah Baseline
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 text-center flex flex-col items-center justify-center min-h-[140px]">
                  <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider mb-2">Organik</p>
                  {vs?.organikKgPerHari !== undefined && vs?.organikKgPerHari !== null ? (
                    <>
                      <p className="text-5xl font-black text-emerald-600 mb-1">{vs.organikKgPerHari}</p>
                      <p className="text-xs text-emerald-700 font-bold uppercase">kg / hari</p>
                    </>
                  ) : (
                    <>
                      <p className="text-5xl font-black text-slate-300 mb-1">—</p>
                      <p className="text-xs text-slate-400 font-bold uppercase">Belum tersedia</p>
                    </>
                  )}
                </div>
                <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 text-center flex flex-col items-center justify-center min-h-[140px]">
                  <p className="text-xs text-amber-800 font-bold uppercase tracking-wider mb-2">Anorganik</p>
                  {vs?.anorganikKgPerHari !== undefined && vs?.anorganikKgPerHari !== null ? (
                    <>
                      <p className="text-5xl font-black text-amber-600 mb-1">{vs.anorganikKgPerHari}</p>
                      <p className="text-xs text-amber-700 font-bold uppercase">kg / hari</p>
                    </>
                  ) : (
                    <>
                      <p className="text-5xl font-black text-slate-300 mb-1">—</p>
                      <p className="text-xs text-slate-400 font-bold uppercase">Belum tersedia</p>
                    </>
                  )}
                </div>
                <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 text-center flex flex-col items-center justify-center min-h-[140px]">
                  <p className="text-xs text-rose-800 font-bold uppercase tracking-wider mb-2">Residu</p>
                  {vs?.residuKgPerHari !== undefined && vs?.residuKgPerHari !== null ? (
                    <>
                      <p className="text-5xl font-black text-rose-600 mb-1">{vs.residuKgPerHari}</p>
                      <p className="text-xs text-rose-700 font-bold uppercase">kg / hari</p>
                    </>
                  ) : (
                    <>
                      <p className="text-5xl font-black text-slate-300 mb-1">—</p>
                      <p className="text-xs text-slate-400 font-bold uppercase">Belum tersedia</p>
                    </>
                  )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center min-h-[140px]">
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider mb-2">Total</p>
                  {vs?.totalVolumeKgPerHari !== undefined && vs?.totalVolumeKgPerHari !== null ? (
                    <>
                      <p className="text-5xl font-black text-slate-800 dark:text-slate-100 mb-1">{vs.totalVolumeKgPerHari}</p>
                      <p className="text-xs text-slate-500 font-bold uppercase">kg / hari</p>
                    </>
                  ) : (
                    <>
                      <p className="text-5xl font-black text-slate-300 mb-1">—</p>
                      <p className="text-xs text-slate-400 font-bold uppercase">Belum tersedia</p>
                    </>
                  )}
                </div>
              </div>
              {vs?.catatan && <p className="text-sm text-slate-500 mt-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 italic">Catatan: {vs.catatan}</p>}
            </div>
          </div>
        );
      case "pemilahan":
        if (!ps) return (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
             <Database size={32} className="text-slate-300 mb-3" />
             <p className="text-slate-500 font-medium">Data pemilahan sampah baseline belum tersedia.</p>
          </div>
        );
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Database size={160} />
              </div>
              <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 relative z-10">
                <Database size={20} className="text-emerald-600" /> Statistik Pemilahan Warga (Baseline)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 mb-8">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Jumlah Rumah Memilah</p>
                  <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{renderValue(ps.jumlahRumahMemilah)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Rumah (Sample)</p>
                  <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{renderValue(ps.totalJumlahRumahDiRw)}</p>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div>
                  <p className="text-emerald-700 font-bold uppercase tracking-wider text-sm mb-1">Persentase Kepatuhan Pemilahan</p>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-emerald-600">
                      {formatPercentString(ps.persentasePemilahan)}
                    </span>
                  </div>
                </div>
                <div className="w-px h-16 bg-emerald-200 hidden md:block"></div>
                <div className="text-left md:text-right">
                  <p className="text-emerald-700 font-bold uppercase tracking-wider text-sm mb-2">Tingkat Kesadaran</p>
                  <span className="inline-block bg-white dark:bg-slate-900 text-emerald-700 px-5 py-2 rounded-xl font-bold border border-emerald-200 text-lg shadow-sm">
                    {renderValue(ps.tingkatPemilahan)}
                  </span>
                </div>
              </div>

              {ps.catatan && (
                <div className="mt-8 relative z-10">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Info size={14} /> Catatan Lapangan</h5>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {ps.catatan}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case "bank_sampah":
        if (!bs) return (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
             <Sprout size={32} className="text-slate-300 mb-3" />
             <p className="text-slate-500 font-medium">Data fasilitas bank sampah & pengolahan belum tersedia.</p>
          </div>
        );
        return (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Building size={32} />
                </div>
                <div>
                  <p className="text-xs text-emerald-700 uppercase font-bold tracking-wider mb-1">Bank Sampah Aktif</p>
                  <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{renderValue(bs.bankSampahAktif)}</p>
                </div>
              </div>
              <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Building size={32} />
                </div>
                <div>
                  <p className="text-xs text-rose-700 uppercase font-bold tracking-wider mb-1">Bank Sampah Tidak Aktif</p>
                  <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{renderValue(bs.bankSampahTidakAktif)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Sprout size={20} className="text-emerald-600" /> Fasilitas Ekosistem Pendukung (Baseline)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-sm mb-8">
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Biopori / Loseda</span> {renderBool(bs.bioporiLoseda)}
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Ecobrick / Daur Ulang</span> {renderBool(bs.ecobrickKerajinanDaurUlang)}
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Buruan Sae / Kebun Warga</span> {renderBool(bs.buruanSae)}
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Pengepul Mitra</span> {renderBool(bs.pengepulMitraDaurUlang)}
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 md:col-span-2">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Sistem Digitalisasi Data</span> {renderBool(bs.digitalisasiData)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jumlah Unit Komposter</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{renderValue(bs.jumlahUnitKomposter)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Titik Maggot / BSF</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{renderValue(bs.jumlahTitikMaggotBsf)}</p>
                </div>
                <div className="col-span-1 md:col-span-2 bg-sky-50/50 p-5 rounded-2xl border border-sky-100/60 mt-2">
                  <p className="text-xs text-sky-700 uppercase tracking-wider font-bold mb-2">Keterangan Aktivitas Lainnya</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {bs.aktivitasLainnyaKeterangan ? renderValue(bs.aktivitasLainnyaKeterangan) : <span className="text-slate-400 font-medium">— Belum tersedia</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case "karakter":
        if (!kw) return (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
             <MapPin size={32} className="text-slate-300 mb-3" />
             <p className="text-slate-500 font-medium">Data Karakteristik Wilayah belum tersedia.</p>
          </div>
        );
        return (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-emerald-600" /> Profil & Karakteristik Wilayah
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-100 dark:border-slate-800 text-slate-400">
                      <th className="pb-3 font-bold uppercase tracking-wider">Karakteristik Lingkungan</th>
                      <th className="pb-3 font-bold uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Padat Penduduk</td>
                      <td className="py-3.5 text-right">{renderBool(kw.padatPenduduk)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Banyak Kos/Kontrakan</td>
                      <td className="py-3.5 text-right">{renderBool(kw.banyakKosKontrakan)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Banyak UMKM/Warung</td>
                      <td className="py-3.5 text-right">{renderBool(kw.banyakUmkmWarungKafe)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Dekat Kampus/Sekolah</td>
                      <td className="py-3.5 text-right">{renderBool(kw.dekatKampusSekolah)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Dekat Pasar</td>
                      <td className="py-3.5 text-right">{renderBool(kw.pasar)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Dekat Bantaran Sungai</td>
                      <td className="py-3.5 text-right">{renderBool(kw.bantaranSungai)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Perkiraan Jml Kos</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{renderValue(kw.perkiraanJumlahKosKontrakan)}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Perkiraan Jml UMKM</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{renderValue(kw.perkiraanJumlahUmkmWarungKafe)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center md:col-span-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Karakter Lainnya</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                  {kw.karakterLainnyaFlag ? renderValue(kw.karakterLainnyaKeterangan) : <span className="text-slate-400">— Tidak ada spesifikasi lain</span>}
                </p>
              </div>
            </div>
          </div>
        );
      case "key_player":
        if (!kp || kp.length === 0) return (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
             <Users size={32} className="text-slate-300 mb-3" />
             <p className="text-slate-500 font-medium">Data Aktor / Key Player belum tersedia.</p>
          </div>
        );
        return (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users size={20} className="text-emerald-600" /> Daftar Aktor (Key Players)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">No</th>
                    <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Jenis Aktor / Posisi</th>
                    <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Kontak</th>
                    <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Peran Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {kp.map((actor: any, idx: number) => (
                    <tr key={actor.id} className="hover:bg-slate-50/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-slate-100">{renderValue(actor.nama)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-100">
                          {renderValue(actor.jenisAktor)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{renderValue(actor.kontak)}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{renderValue(actor.peran)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "potensi_risiko":
        if (!pr) return (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
             <AlertTriangle size={32} className="text-slate-300 mb-3" />
             <p className="text-slate-500 font-medium">Catatan kesimpulan dan risiko sosial belum tersedia.</p>
          </div>
        );
        return (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ArrowRight size={120} />
              </div>
              <h4 className="text-emerald-700 font-extrabold text-lg flex items-center gap-2 mb-4 relative z-10">
                <ArrowRight size={20} /> Rekomendasi / Prioritas Intervensi (Baseline)
              </h4>
              <div className="bg-emerald-50/50 p-6 rounded-xl text-emerald-900 leading-relaxed text-sm border border-emerald-100 whitespace-pre-wrap font-medium relative z-10">
                {pr.prioritasIntervensi ? renderValue(pr.prioritasIntervensi) : <span className="text-emerald-700/50 italic">— Belum tersedia</span>}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <AlertTriangle size={120} />
              </div>
              <h4 className="text-rose-600 font-extrabold text-lg flex items-center gap-2 mb-4 relative z-10">
                <AlertTriangle size={20} /> Catatan & Risiko Sosial
              </h4>
              <div className="bg-rose-50/50 p-6 rounded-xl text-rose-900 leading-relaxed text-sm border border-rose-100 whitespace-pre-wrap font-medium relative z-10">
                {pr.catatanTambahanRisikoSosial ? renderValue(pr.catatanTambahanRisikoSosial) : <span className="text-rose-700/50 italic">— Belum tersedia</span>}
              </div>
            </div>
          </div>
        );
      case "rw_surveys":
        return (
          <div className="space-y-6">
            {renderRwTable(baselineRwList, "Baseline")}
          </div>
        );
      default:
        return null;
    }
  };

  // Render Tab Endline
  const renderEndlineTab = () => {
    if (!endlineSurvey) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Calendar size={32} />
            </div>
            <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
              Data Survei Endline Belum Diisi
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg leading-relaxed">
              Survei Endline (akhir intervensi) mencatat kemajuan pemilahan dan timbulan sampah pasca-pelaksanaan KKN. Data ini akan divalidasi oleh Dosen Pembimbing Lapangan (DPL).
            </p>
          </div>

          {/* Jika ada survei RW tahap Endline */}
          <div className="mt-8">
            <h5 className="font-extrabold text-sm text-slate-700 dark:text-slate-200 mb-3">
              Survei Lapangan RW Tahap Endline
            </h5>
            {renderRwTable(endlineRwList, "Endline")}
          </div>
        </div>
      );
    }

    const {
      pemilahanSampah: ps,
      volumeSampah: vs,
      bankSampahPengolahan: bs,
      catatanKesimpulan: ck,
      validasiDpl,
    } = endlineSurvey;

    return (
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Banner Validasi DPL */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status Validasi DPL</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  endlineSurvey.statusValidasi === "TERVALIDASI"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : endlineSurvey.statusValidasi === "REVISI"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {endlineSurvey.statusValidasi || "BELUM_VALIDASI"}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Divalidasi oleh: <strong className="text-slate-800 dark:text-slate-200">{validasiDpl?.name || "DPL Belum Meninjau"}</strong>
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Tanggal Survei Endline:{" "}
            <strong>
              {endlineSurvey.tanggalSurvei
                ? new Date(endlineSurvey.tanggalSurvei).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
            </strong>
          </div>
        </div>

        {/* Metrik Capaian Endline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Capaian Pemilahan</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-indigo-600">
                {formatPercentString(ps?.persentasePemilahan)}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {ps?.jumlahRumahMemilah ?? 0} dari {ps?.totalJumlahRumahDiRw ?? 0} rumah sampel
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Timbulan Sampah</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">
                {vs?.totalVolumeKgPerHari ? Number(vs.totalVolumeKgPerHari).toFixed(1) : "—"}
              </h3>
              <span className="text-xs font-bold text-slate-400">kg / hari</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Residu: {vs?.residuKgPerHari ?? 0} kg • Organik: {vs?.organikKgPerHari ?? 0} kg
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Bank Sampah Aktif</span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-emerald-600">
                {bs?.bankSampahAktif ?? 0}
              </h3>
              <span className="text-xs font-bold text-slate-400">unit</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Komposter: {bs?.jumlahUnitKomposter || "0"} • Maggot: {bs?.jumlahTitikMaggotBsf || "0"}
            </p>
          </div>
        </div>

        {/* Rekomendasi & Catatan Akhir */}
        {(ck?.prioritasIntervensi || ck?.catatanTambahanRisikoSosial) && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Info size={16} className="text-indigo-600" /> Catatan Kesimpulan & Rekomendasi Tindak Lanjut Pasca-KKN
            </h4>
            {ck?.prioritasIntervensi && (
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                <strong>Rekomendasi Keberlanjutan:</strong> {ck.prioritasIntervensi}
              </div>
            )}
            {ck?.catatanTambahanRisikoSosial && (
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>Risiko & Kendala Lapangan:</strong> {ck.catatanTambahanRisikoSosial}
              </div>
            )}
          </div>
        )}

        {/* Tabel Survei Lapangan RW Endline */}
        <div className="mt-8">
          <h5 className="font-extrabold text-sm text-slate-700 dark:text-slate-200 mb-3">
            Survei Lapangan RW (Tahap Endline)
          </h5>
          {renderRwTable(endlineRwList, "Endline")}
        </div>
      </div>
    );
  };

  // Render Tab Komparasi Dampak
  const renderKomparasiTab = () => {
    const hasBaseline = Boolean(selectedSurvey);
    const hasEndline = Boolean(endlineSurvey);

    const bPilah = normalizePercentage(selectedSurvey?.pemilahanSampah?.persentasePemilahan);
    const ePilah = normalizePercentage(endlineSurvey?.pemilahanSampah?.persentasePemilahan);
    const deltaPilah = hasBaseline && hasEndline && bPilah !== null && ePilah !== null
      ? Number((ePilah - bPilah).toFixed(1))
      : null;

    const bVol = selectedSurvey?.volumeSampah?.totalVolumeKgPerHari
      ? Number(selectedSurvey.volumeSampah.totalVolumeKgPerHari)
      : null;
    const eVol = endlineSurvey?.volumeSampah?.totalVolumeKgPerHari
      ? Number(endlineSurvey.volumeSampah.totalVolumeKgPerHari)
      : null;
    const deltaVol = bVol !== null && eVol !== null
      ? Number((eVol - bVol).toFixed(1))
      : null;

    const bBs = Number(selectedSurvey?.bankSampahPengolahan?.bankSampahAktif) || 0;
    const eBs = Number(endlineSurvey?.bankSampahPengolahan?.bankSampahAktif) || 0;
    const deltaBs = hasBaseline && hasEndline ? eBs - bBs : null;

    return (
      <div className="space-y-8 max-w-5xl mx-auto">
        {!hasEndline && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 rounded-2xl flex items-start gap-3">
            <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 dark:text-amber-300 font-bold text-sm">
                Data Endline Belum Tersedia
              </p>
              <p className="text-amber-700 dark:text-amber-400 text-xs mt-1 leading-relaxed">
                Tabel di bawah saat ini menampilkan data Baseline (awal). Komparasi delta perubahan (<span className="font-semibold">Δ Baseline vs Endline</span>) akan otomatis terkalkulasi saat survei akhir (Endline) selesai diinput.
              </p>
            </div>
          </div>
        )}

        {/* 3 Kartu Ringkasan Delta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Kepatuhan Pemilahan */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <span className="text-xs uppercase font-extrabold text-indigo-600 tracking-wider">
              1. Δ Kepatuhan Pemilahan
            </span>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">
                  {deltaPilah !== null ? (
                    <span className={deltaPilah > 0 ? "text-emerald-600 flex items-center gap-1" : deltaPilah < 0 ? "text-rose-600 flex items-center gap-1" : "text-slate-600"}>
                      {deltaPilah > 0 ? <TrendingUp size={22} /> : deltaPilah < 0 ? <TrendingDown size={22} /> : <Minus size={22} />}
                      {deltaPilah > 0 ? "+" : ""}{deltaPilah}%
                    </span>
                  ) : (
                    <span className="text-slate-400 font-semibold">—</span>
                  )}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Baseline: {bPilah !== null ? `${bPilah.toFixed(1)}%` : "-"} ➜ Endline: {ePilah !== null ? `${ePilah.toFixed(1)}%` : "-"}
              </p>
            </div>
            <div className="text-[11px] font-bold text-slate-400">Target DLH: Kenaikan &gt; 0%</div>
          </div>

          {/* Card 2: Berat Sampah Harian */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <span className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider">
              2. Δ Total Berat Sampah
            </span>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">
                  {deltaVol !== null ? (
                    <span className={deltaVol < 0 ? "text-emerald-600 flex items-center gap-1" : deltaVol > 0 ? "text-amber-600 flex items-center gap-1" : "text-slate-600"}>
                      {deltaVol < 0 ? <TrendingDown size={22} /> : deltaVol > 0 ? <TrendingUp size={22} /> : <Minus size={22} />}
                      {deltaVol > 0 ? "+" : ""}{deltaVol} kg
                    </span>
                  ) : (
                    <span className="text-slate-400 font-semibold">—</span>
                  )}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Baseline: {bVol !== null ? `${bVol} kg` : "-"} ➜ Endline: {eVol !== null ? `${eVol} kg` : "-"}
              </p>
            </div>
            <div className="text-[11px] font-bold text-slate-400">Reduksi residu diutamakan</div>
          </div>

          {/* Card 3: Bank Sampah Aktif */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <span className="text-xs uppercase font-extrabold text-teal-600 tracking-wider">
              3. Δ Bank Sampah Aktif
            </span>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">
                  {deltaBs !== null ? (
                    <span className={deltaBs > 0 ? "text-emerald-600 flex items-center gap-1" : deltaBs < 0 ? "text-rose-600 flex items-center gap-1" : "text-slate-600"}>
                      {deltaBs > 0 ? "+" : ""}{deltaBs} unit
                    </span>
                  ) : (
                    <span className="text-slate-400 font-semibold">—</span>
                  )}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Baseline: {bBs} unit ➜ Endline: {hasEndline ? `${eBs} unit` : "-"}
              </p>
            </div>
            <div className="text-[11px] font-bold text-slate-400">Aktivasi unit bank sampah</div>
          </div>
        </div>

        {/* Tabel Komparasi Berdampingan (Side-by-Side) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-600" />
              Matriks Komparasi Indikator Keberhasilan (Baseline vs Endline)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                  <th className="px-5 py-3.5">Parameter Indikator</th>
                  <th className="px-5 py-3.5 text-center">Baseline (Kondisi Awal)</th>
                  <th className="px-5 py-3.5 text-center">Endline (Capaian Akhir)</th>
                  <th className="px-5 py-3.5 text-center">Perubahan (Delta)</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {/* 1. Pemilahan */}
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                    Kepatuhan Pemilahan Sampah (%)
                  </td>
                  <td className="px-5 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                    {bPilah !== null ? `${bPilah.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                    {ePilah !== null ? `${ePilah.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center font-extrabold">
                    {deltaPilah !== null ? (
                      <span className={deltaPilah > 0 ? "text-emerald-600" : deltaPilah < 0 ? "text-rose-600" : "text-slate-600"}>
                        {deltaPilah > 0 ? "+" : ""}{deltaPilah}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {deltaPilah !== null ? (
                      deltaPilah > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <Check size={10} /> Meningkat
                        </span>
                      ) : deltaPilah < 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          <XCircle size={10} /> Menurun
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          Tetap
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>

                {/* 2. Volume Sampah Organik */}
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                    Timbulan Sampah Organik (kg/hari)
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-400">
                    {selectedSurvey?.volumeSampah?.organikKgPerHari ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-400">
                    {endlineSurvey?.volumeSampah?.organikKgPerHari ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold">
                    {selectedSurvey?.volumeSampah?.organikKgPerHari !== undefined && endlineSurvey?.volumeSampah?.organikKgPerHari !== undefined ? (
                      `${(Number(endlineSurvey.volumeSampah.organikKgPerHari) - Number(selectedSurvey.volumeSampah.organikKgPerHari)).toFixed(1)} kg`
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-400">—</td>
                </tr>

                {/* 3. Volume Sampah Anorganik */}
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                    Timbulan Sampah Anorganik (kg/hari)
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-400">
                    {selectedSurvey?.volumeSampah?.anorganikKgPerHari ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-400">
                    {endlineSurvey?.volumeSampah?.anorganikKgPerHari ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold">
                    {selectedSurvey?.volumeSampah?.anorganikKgPerHari !== undefined && endlineSurvey?.volumeSampah?.anorganikKgPerHari !== undefined ? (
                      `${(Number(endlineSurvey.volumeSampah.anorganikKgPerHari) - Number(selectedSurvey.volumeSampah.anorganikKgPerHari)).toFixed(1)} kg`
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-400">—</td>
                </tr>

                {/* 4. Residu */}
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                    Timbulan Residu (kg/hari)
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-400">
                    {selectedSurvey?.volumeSampah?.residuKgPerHari ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-400">
                    {endlineSurvey?.volumeSampah?.residuKgPerHari ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold">
                    {selectedSurvey?.volumeSampah?.residuKgPerHari !== undefined && endlineSurvey?.volumeSampah?.residuKgPerHari !== undefined ? (
                      `${(Number(endlineSurvey.volumeSampah.residuKgPerHari) - Number(selectedSurvey.volumeSampah.residuKgPerHari)).toFixed(1)} kg`
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-400">—</td>
                </tr>

                {/* 5. Total Berat Sampah */}
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition bg-slate-50/40 dark:bg-slate-800/30">
                  <td className="px-5 py-3.5 font-black text-slate-900 dark:text-slate-100">
                    Total Berat Sampah (kg/hari)
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-slate-800 dark:text-slate-100">
                    {bVol !== null ? `${bVol} kg` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-slate-800 dark:text-slate-100">
                    {eVol !== null ? `${eVol} kg` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center font-black">
                    {deltaVol !== null ? (
                      <span className={deltaVol < 0 ? "text-emerald-600" : deltaVol > 0 ? "text-amber-600" : "text-slate-600"}>
                        {deltaVol > 0 ? "+" : ""}{deltaVol} kg
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {deltaVol !== null ? (
                      deltaVol <= 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <Check size={10} /> Reduksi Berhasil
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Meningkat
                        </span>
                      )
                    ) : "—"}
                  </td>
                </tr>

                {/* 6. Bank Sampah Aktif */}
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                    Bank Sampah Aktif (Unit)
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-400 font-semibold">{bBs}</td>
                  <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-400 font-semibold">{hasEndline ? eBs : "—"}</td>
                  <td className="px-5 py-3.5 text-center font-bold text-emerald-600">
                    {deltaBs !== null ? `${deltaBs > 0 ? "+" : ""}${deltaBs}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {deltaBs !== null && deltaBs > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check size={10} /> Bertambah
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const completion = calculateCompletion();
  const namaKelurahan = selectedSurvey?.namaKelurahan || endlineSurvey?.namaKelurahan || "";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 pb-20">
      {/* Header Area */}
      <div className="flex flex-col gap-6">
        <div>
          <button
            onClick={() => navigate("/superUser/data-survei-kkn")}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 font-bold mb-4 transition-colors cursor-pointer"
          >
            ← Kembali ke Data Survei KKN
          </button>
          
          {isLoadingDetail ? (
            <div className="h-9 w-64 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg"></div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 w-full">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  Detail Survei Kelurahan {namaKelurahan}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${completion.percentage === 100 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                    Baseline: {completion.percentage === 100 ? 'Lengkap' : 'Belum Lengkap'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${endlineSurvey ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    Endline: {endlineSurvey ? 'Tersedia' : 'Belum Ada'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {rwSurveys.length} Survei RW Terkoneksi
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs min-w-[280px]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kelengkapan Baseline</span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{completion.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-3">
                    <div className={`h-2 rounded-full ${completion.percentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${completion.percentage}%` }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    {completion.breakdown.map((b, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        {b.isComplete ? (
                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-300 dark:border-slate-600" />
                        )}
                        <span className={`text-[10px] font-bold ${b.isComplete ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>{b.key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3 MODE TAB UTAMA (Segmented Control) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1.5 max-w-fit">
          <button
            onClick={() => setMainTab("BASELINE")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              mainTab === "BASELINE"
                ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <FileText size={16} />
            <span>Tab Baseline (Kondisi Awal)</span>
          </button>

          <button
            onClick={() => setMainTab("ENDLINE")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              mainTab === "ENDLINE"
                ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Calendar size={16} />
            <span>Tab Endline (Capaian Akhir)</span>
          </button>

          <button
            onClick={() => setMainTab("KOMPARASI")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              mainTab === "KOMPARASI"
                ? "bg-white dark:bg-slate-900 text-teal-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <BarChart3 size={16} />
            <span>Perbandingan Dampak</span>
          </button>
        </div>

        {canEdit && mainTab === "BASELINE" && selectedSurvey && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all transform active:scale-95 cursor-pointer border border-emerald-500/20 shrink-0 self-start sm:self-auto"
          >
            <Edit3 size={15} />
            <span>Edit Data Baseline</span>
          </button>
        )}
      </div>

      {/* Sub-nav khusus jika sedang di TAB BASELINE */}
      {mainTab === "BASELINE" && (
        <div className="border-b border-slate-100 dark:border-slate-800 -mt-3">
          <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto scrollbar-none" aria-label="Sub Tabs">
            {baselineTabs.map((tab) => {
              const isActive = baselineSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setBaselineSubTab(tab.id as BaselineSubTabType)}
                  className={`${
                    isActive
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  } whitespace-nowrap py-3 border-b-2 font-bold text-xs sm:text-sm cursor-pointer transition-colors flex items-center gap-2`}
                >
                  <tab.icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Konten Utama Berdasarkan Main Tab */}
      <div className="min-h-[500px]">
        {isLoadingDetail ? (
          <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
            <p className="text-slate-500 font-medium">Memuat data survei kelurahan...</p>
          </div>
        ) : mainTab === "BASELINE" ? (
          renderBaselineTabContent()
        ) : mainTab === "ENDLINE" ? (
          renderEndlineTab()
        ) : (
          renderKomparasiTab()
        )}
      </div>

      {/* Edit Modal (Baseline) */}
      {selectedSurvey && (
        <EditSurveiModal
          isOpen={isEditModalOpen}
          kelurahanId={selectedSurvey.kelurahanId}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            fetchDetail();
          }}
        />
      )}

      {/* Detail Survei RW Modal */}
      <DetailSurveiRwModal
        isOpen={isRwModalOpen}
        survey={selectedRwSurvey}
        onClose={() => {
          setIsRwModalOpen(false);
          setSelectedRwSurvey(null);
        }}
        onDelete={handleDeleteRwSurvey}
        canDelete={canDeleteRw}
      />
    </div>
  );
}
