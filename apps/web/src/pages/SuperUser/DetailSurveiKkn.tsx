import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
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
  Search,
  Phone,
  ExternalLink,
  Filter,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import EditSurveiModal from "./EditSurveiModal";
import DetailSurveiRwModal from "./DetailSurveiRwModal";
import { useAuthStore } from "../../store/useAuthStore";
import { normalizePercentage, formatPercentString } from "../../utils/surveyNormalizer";

type MainTabType = "BASELINE" | "ENDLINE" | "KOMPARASI";
type SubTabType = "overview" | "pemilahan" | "bank_sampah" | "karakter" | "key_player" | "potensi_risiko" | "rw_surveys";

export interface UnifiedKeyPlayer {
  id: string;
  scope: "KELURAHAN" | "RW";
  rwLabel: string;
  rwValue: string;
  nama: string;
  jenisAktor: string;
  kontak: string;
  peran: string;
  surveyorInfo?: {
    nama?: string;
    nim?: string;
    kelompok?: string;
  };
  tahap: string;
}

const cleanWaNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) clean = "62" + clean.substring(1);
  return clean;
};

const extractUnifiedKeyPlayers = (
  kelurahanSurvey: any,
  rwList: any[],
  tahapLabel: string
): UnifiedKeyPlayer[] => {
  const result: UnifiedKeyPlayer[] = [];

  // 1. Dari tingkat Kelurahan (Makro)
  const kelKp = kelurahanSurvey?.keyPlayers;
  if (Array.isArray(kelKp)) {
    kelKp.forEach((kp: any, idx: number) => {
      if (kp && (kp.nama?.trim() || kp.jenisAktor?.trim())) {
        result.push({
          id: `kel-${kp.id || idx}`,
          scope: "KELURAHAN",
          rwLabel: "Tingkat Kelurahan",
          rwValue: "KELURAHAN",
          nama: kp.nama || "-",
          jenisAktor: kp.jenisAktor || "Aparatur Kelurahan",
          kontak: kp.kontak || "",
          peran: kp.peran || "Aparatur / Stakeholder Tingkat Kelurahan",
          tahap: tahapLabel,
        });
      }
    });
  }

  // 2. Dari tingkat Mikro RW (survei_lapangan_kkn)
  if (Array.isArray(rwList)) {
    rwList.forEach((rwItem: any) => {
      let rawKpList: any[] = [];
      if (Array.isArray(rwItem.keyPlayer)) {
        rawKpList = rwItem.keyPlayer;
      } else if (typeof rwItem.keyPlayer === "string") {
        try {
          const parsed = JSON.parse(rwItem.keyPlayer);
          if (Array.isArray(parsed)) rawKpList = parsed;
        } catch {
          rawKpList = [];
        }
      }

      const rwRaw = String(rwItem.rw || "").trim();
      const rwFormatted = rwRaw ? (rwRaw.toLowerCase().startsWith("rw") ? rwRaw : `RW ${rwRaw}`) : "RW Belum Diatur";
      const surveyorName = rwItem.namaSurveyor || rwItem.nama || "";
      const surveyorNim = rwItem.nim || "";
      const kelompok = rwItem.kelompok || "";

      rawKpList.forEach((kp: any, kIdx: number) => {
        if (!kp) return;
        const nama = typeof kp === "string" ? kp : (kp.nama || "");
        const jenisAktor = typeof kp === "string" ? "Tokoh RW" : (kp.aktor || kp.jenis || kp.jenisAktor || "Tokoh RW");
        const kontak = typeof kp === "string" ? "" : (kp.kontak || "");
        const peran = typeof kp === "string" ? "" : (kp.peran || "");

        // Hanya masukkan entri jika minimal nama terisi
        if (nama && nama.trim() !== "") {
          result.push({
            id: `rw-${rwItem.id || rwItem.kodeSurvey || "item"}-${kIdx}`,
            scope: "RW",
            rwLabel: rwFormatted,
            rwValue: rwFormatted,
            nama: nama.trim(),
            jenisAktor: jenisAktor.trim(),
            kontak: kontak.trim(),
            peran: peran.trim() || "Aktor Penggerak / Pemangku Kepentingan RW",
            surveyorInfo: {
              nama: surveyorName,
              nim: surveyorNim,
              kelompok: kelompok,
            },
            tahap: tahapLabel,
          });
        }
      });
    });
  }

  return result;
};

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

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const getInitialMainTab = (): MainTabType => {
    const tabParam = searchParams.get("tab")?.toUpperCase();
    if (tabParam === "ENDLINE") return "ENDLINE";
    if (tabParam === "KOMPARASI") return "KOMPARASI";
    if (location.state?.tab?.toUpperCase() === "ENDLINE") return "ENDLINE";
    if (location.state?.tab?.toUpperCase() === "KOMPARASI") return "KOMPARASI";
    return "BASELINE";
  };

  // State Utama
  const [mainTab, setMainTab] = useState<MainTabType>(getInitialMainTab);
  const [baselineSubTab, setBaselineSubTab] = useState<SubTabType>("overview");
  const [endlineSubTab, setEndlineSubTab] = useState<SubTabType>("overview");

  useEffect(() => {
    const tabParam = searchParams.get("tab")?.toUpperCase();
    if (tabParam === "ENDLINE" && mainTab !== "ENDLINE") {
      setMainTab("ENDLINE");
    } else if (tabParam === "KOMPARASI" && mainTab !== "KOMPARASI") {
      setMainTab("KOMPARASI");
    } else if (tabParam === "BASELINE" && mainTab !== "BASELINE") {
      setMainTab("BASELINE");
    }
  }, [searchParams]);

  const handleMainTabChange = (tab: MainTabType) => {
    setMainTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    }, { replace: true });
  };

  // State Data
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null); // Baseline
  const [endlineSurvey, setEndlineSurvey] = useState<any>(null); // Endline
  const [rwSurveys, setRwSurveys] = useState<any[]>([]); // Data survei level RW
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);

  // State Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRwSurvey, setSelectedRwSurvey] = useState<any | null>(null);
  const [isRwModalOpen, setIsRwModalOpen] = useState(false);

  // State Filter Aktor Terpadu
  const [actorSearchQuery, setActorSearchQuery] = useState("");
  const [actorRwFilter, setActorRwFilter] = useState("ALL");

  // State Filter Temuan Kesimpulan & Risiko Multi-RW
  const [kesimpulanSearchQuery, setKesimpulanSearchQuery] = useState("");
  const [kesimpulanRwFilter, setKesimpulanRwFilter] = useState("ALL");

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

  // Sub-tabs untuk tab Baseline & Endline
  const baselineTabs = [
    { id: "overview", label: "Ringkasan", icon: FileText },
    { id: "pemilahan", label: "Pemilahan", icon: Database },
    { id: "bank_sampah", label: "Bank Sampah", icon: Sprout },
    { id: "karakter", label: "Karakteristik", icon: MapPin },
    { id: "key_player", label: "Aktor (Key Player)", icon: Users },
    { id: "potensi_risiko", label: "Kesimpulan & Risiko", icon: AlertTriangle },
    { id: "rw_surveys", label: `Survei Lapangan RW (${rwSurveys.filter(s => !s.tahap || s.tahap.toLowerCase() === "baseline").length})`, icon: ClipboardList },
  ];

  const endlineTabs = [
    { id: "overview", label: "Ringkasan", icon: FileText },
    { id: "pemilahan", label: "Pemilahan", icon: Database },
    { id: "bank_sampah", label: "Bank Sampah", icon: Sprout },
    { id: "karakter", label: "Karakteristik", icon: MapPin },
    { id: "key_player", label: "Aktor (Key Player)", icon: Users },
    { id: "potensi_risiko", label: "Kesimpulan & Risiko", icon: AlertTriangle },
    { id: "rw_surveys", label: `Survei Lapangan RW (${rwSurveys.filter(s => s.tahap && s.tahap.toLowerCase() === "endline").length})`, icon: ClipboardList },
  ];

  const renderBool = (val: boolean | null | undefined) => {
    if (val === null || val === undefined) return <span className="text-slate-400 font-medium">— Belum tersedia</span>;
    return val ? <span className="text-emerald-600 font-bold">Ya</span> : <span className="text-rose-600 font-bold">Tidak</span>;
  };

  const renderValue = (val: any, suffix = "") => {
    if (val === null || val === undefined || val === "") return <span className="text-slate-400 font-medium">— Belum tersedia</span>;
    return <span className="text-slate-800 dark:text-slate-100 font-medium">{val} {suffix}</span>;
  };

  const calculateCompletion = (surveyData: any) => {
    if (!surveyData) return { percentage: 0, breakdown: [] };
    
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

    if (surveyData.kecamatan && surveyData.jumlahRw && surveyData.jumlahRt) {
      breakdown[0].isComplete = true; completedSteps++;
    }
    if (surveyData.tanggalSurvei && surveyData.enumerator) {
      breakdown[1].isComplete = true; completedSteps++;
    }
    if (surveyData.karakteristikWilayah) {
      breakdown[2].isComplete = true; completedSteps++;
    }
    if (surveyData.pemilahanSampah) {
      breakdown[3].isComplete = true; completedSteps++;
    }
    if (surveyData.bankSampahPengolahan) {
      breakdown[4].isComplete = true; completedSteps++;
    }
    if (surveyData.keyPlayers && surveyData.keyPlayers.length > 0) {
      breakdown[5].isComplete = true; completedSteps++;
    }
    if (surveyData.catatanKesimpulan) {
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

  // Helper render tabel Direktori Aktor Terpadu (Kelurahan + RW)
  const renderUnifiedActorTable = (
    actors: UnifiedKeyPlayer[],
    tahapLabel: "Baseline" | "Endline",
    theme: "emerald" | "indigo"
  ) => {
    const isEmerald = theme === "emerald";

    // Opsi RW untuk filter dropdown (urutkan berdasarkan angka RW)
    const availableRwOptions = Array.from(
      new Set(actors.filter((a) => a.scope === "RW").map((a) => a.rwValue))
    ).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, "") || "0", 10);
      const numB = parseInt(b.replace(/\D/g, "") || "0", 10);
      return numA - numB;
    });

    const kelurahanCount = actors.filter((a) => a.scope === "KELURAHAN").length;
    const rwActorsCount = actors.filter((a) => a.scope === "RW").length;

    // Filter list
    const filtered = actors.filter((actor) => {
      if (actorRwFilter !== "ALL" && actor.rwValue !== actorRwFilter) {
        return false;
      }
      if (actorSearchQuery.trim()) {
        const q = actorSearchQuery.toLowerCase();
        const matchNama = actor.nama.toLowerCase().includes(q);
        const matchJenis = actor.jenisAktor.toLowerCase().includes(q);
        const matchPeran = actor.peran.toLowerCase().includes(q);
        const matchRw = actor.rwLabel.toLowerCase().includes(q);
        const matchSurveyor = actor.surveyorInfo?.nama?.toLowerCase().includes(q) || false;
        return matchNama || matchJenis || matchPeran || matchRw || matchSurveyor;
      }
      return true;
    });

    if (actors.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed text-center px-4 max-w-5xl mx-auto">
          <Users size={36} className="text-slate-300 dark:text-slate-600 mb-3" />
          <h5 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Belum Ada Data Aktor (Key Players) {tahapLabel}
          </h5>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
            Data aktor dapat bersumber dari data pokok kelurahan atau diinput oleh mahasiswa per-RW melalui lembar survei lapangan.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        {/* Header Direktori & Ringkasan */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Users size={18} className={isEmerald ? "text-emerald-600" : "text-indigo-600"} />
              Direktori Aktor & Pemangku Kepentingan ({tahapLabel})
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Agregasi tokoh kunci penggerak pengelolaan sampah dari tingkat Kelurahan dan seluruh RW binaan.
            </p>
          </div>

          {/* Metric Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
              Total: <strong>{actors.length} Tokoh</strong>
            </span>
            {kelurahanCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                <Building size={12} />
                {kelurahanCount} Kelurahan
              </span>
            )}
            {rwActorsCount > 0 && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-semibold border ${
                isEmerald
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60"
                  : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60"
              }`}>
                <MapPin size={12} />
                {rwActorsCount} Tokoh RW
              </span>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Input Pencarian */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={actorSearchQuery}
              onChange={(e) => setActorSearchQuery(e.target.value)}
              placeholder="Cari nama tokoh, jenis aktor, peran, atau RW..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>

          {/* Dropdown Filter Wilayah */}
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={actorRwFilter}
              onChange={(e) => setActorRwFilter(e.target.value)}
              aria-label="Filter Wilayah Aktor"
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition cursor-pointer"
            >
              <option value="ALL">Semua Wilayah ({actors.length})</option>
              {kelurahanCount > 0 && (
                <option value="KELURAHAN">Tingkat Kelurahan ({kelurahanCount})</option>
              )}
              {availableRwOptions.map((rwOpt) => {
                const count = actors.filter((a) => a.rwValue === rwOpt).length;
                return (
                  <option key={rwOpt} value={rwOpt}>
                    {rwOpt} ({count})
                  </option>
                );
              })}
            </select>

            {(actorSearchQuery || actorRwFilter !== "ALL") && (
              <button
                onClick={() => {
                  setActorSearchQuery("");
                  setActorRwFilter("ALL");
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Tabel Direktori Aktor */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                  <th className="px-4 py-3.5 text-center w-12">No</th>
                  <th className="px-4 py-3.5">Lingkup / RW</th>
                  <th className="px-4 py-3.5">Nama Tokoh</th>
                  <th className="px-4 py-3.5">Posisi / Stakeholder</th>
                  <th className="px-4 py-3.5">Kontak WhatsApp</th>
                  <th className="px-4 py-3.5">Peran Aktif Lapangan</th>
                  <th className="px-4 py-3.5">Sumber / Surveyor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      Tidak ada aktor yang cocok dengan kriteria pencarian / filter wilayah.
                    </td>
                  </tr>
                ) : (
                  filtered.map((actor, idx) => {
                    const cleanPhone = cleanWaNumber(actor.kontak);
                    return (
                      <tr
                        key={actor.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3.5 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {actor.scope === "KELURAHAN" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                              <Building size={11} />
                              Kelurahan
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              isEmerald
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60"
                                : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60"
                            }`}>
                              <MapPin size={11} />
                              {actor.rwLabel}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          {actor.nama}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {actor.jenisAktor}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {cleanPhone ? (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 transition shadow-2xs"
                              title={`Hubungi via WhatsApp (${actor.kontak})`}
                            >
                              <Phone size={12} className="text-emerald-600 dark:text-emerald-400" />
                              <span>{actor.kontak}</span>
                              <ExternalLink size={10} className="opacity-60" />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs italic">— Tidak ada kontak</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 max-w-xs leading-relaxed">
                          {actor.peran || "—"}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {actor.surveyorInfo?.nama ? (
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                <Users size={12} className="text-slate-400" />
                                <span>{actor.surveyorInfo.nama}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {actor.surveyorInfo.kelompok || "Mahasiswa KKN"}
                                {actor.surveyorInfo.nim ? ` (${actor.surveyorInfo.nim})` : ""}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                              Data Pokok Kelurahan
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Helper render Kompilasi Temuan & Risiko Multi-RW
  const renderKesimpulanMultiRw = (
    surveys: any[],
    tahapLabel: "Baseline" | "Endline",
    theme: "emerald" | "indigo",
    kelurahanCk?: any
  ) => {
    const isEmerald = theme === "emerald";

    // Opsi RW untuk filter dropdown
    const availableRwOptions = Array.from(
      new Set(surveys.map((s) => (s.rw ? String(s.rw).trim() : "")).filter(Boolean))
    ).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, "") || "0", 10);
      const numB = parseInt(b.replace(/\D/g, "") || "0", 10);
      return numA - numB;
    });

    const filteredSurveys = surveys.filter((s) => {
      if (kesimpulanRwFilter !== "ALL" && String(s.rw).trim() !== kesimpulanRwFilter) {
        return false;
      }
      if (kesimpulanSearchQuery.trim()) {
        const q = kesimpulanSearchQuery.toLowerCase();
        const p = (s.prioritas || "").toLowerCase();
        const r = (s.risiko || "").toLowerCase();
        const surveyor = (s.namaSurveyor || "").toLowerCase();
        const rwStr = `rw ${s.rw || ""}`.toLowerCase();
        return p.includes(q) || r.includes(q) || surveyor.includes(q) || rwStr.includes(q);
      }
      return true;
    });

    const hasKelurahanSummary =
      kelurahanCk?.prioritasIntervensi || kelurahanCk?.catatanTambahanRisikoSosial;

    return (
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Lapisan 1: Ringkasan Makro Kelurahan */}
        {hasKelurahanSummary && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    isEmerald
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200"
                      : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200"
                  }`}
                >
                  <Building size={13} />
                  Sintesis Rekomendasi Kelurahan ({tahapLabel})
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Rangkuman pokok intervensi dan risiko sosial umum tingkat kelurahan.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400">Total Masukan RW:</span>
                <span
                  className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-black ${
                    surveys.length > 0
                      ? isEmerald
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {surveys.length} RW Terdata
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div
                className={`p-5 rounded-xl border ${
                  isEmerald
                    ? "bg-emerald-50/50 border-emerald-100 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-200"
                    : "bg-indigo-50/50 border-indigo-100 text-indigo-950 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-200"
                }`}
              >
                <h5 className="font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ArrowRight size={15} /> Prioritas & Rekomendasi Utama
                </h5>
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                  {kelurahanCk.prioritasIntervensi || "— Belum ada prioritas tercatat."}
                </p>
              </div>

              <div className="p-5 rounded-xl border bg-rose-50/50 border-rose-100 text-rose-950 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-200">
                <h5 className="font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <AlertTriangle size={15} /> Catatan & Risiko Sosial
                </h5>
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                  {kelurahanCk.catatanTambahanRisikoSosial || "— Belum ada catatan risiko tercatat."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lapisan 2: Kompilasi Temuan, Rekomendasi & Risiko per-RW */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ClipboardList
                  size={18}
                  className={isEmerald ? "text-emerald-600" : "text-indigo-600"}
                />
                Kompilasi Temuan & Risiko Tiap RW ({surveys.length} RW Terdata)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian catatan spesifik yang dilaporkan mahasiswa KKN dari masing-masing RW binaan.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={kesimpulanSearchQuery}
                  onChange={(e) => setKesimpulanSearchQuery(e.target.value)}
                  placeholder="Cari isu / nama..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44"
                />
              </div>

              <select
                value={kesimpulanRwFilter}
                onChange={(e) => setKesimpulanRwFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Semua RW ({surveys.length})</option>
                {availableRwOptions.map((rwNum) => (
                  <option key={rwNum} value={rwNum}>
                    RW {rwNum}
                  </option>
                ))}
              </select>

              {(kesimpulanSearchQuery || kesimpulanRwFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setKesimpulanSearchQuery("");
                    setKesimpulanRwFilter("ALL");
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {surveys.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <ClipboardList size={36} className="mx-auto text-slate-300 mb-3" />
              <h5 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                Belum Ada Survei RW {tahapLabel} Masuk
              </h5>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Catatan rekomendasi dan risiko sosial dari tiap RW akan otomatis terkumpul di sini
                ketika mahasiswa KKN menginput formulir survei.
              </p>
            </div>
          ) : filteredSurveys.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-xs">
              Tidak ditemukan catatan RW yang cocok dengan pencarian / filter yang dipilih.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredSurveys.map((rwSurvey) => {
                const rwNum = rwSurvey.rw || "-";
                const surveyorName = rwSurvey.namaSurveyor || "Mahasiswa KKN";
                const kelompokStr = rwSurvey.kelompok ? `Kelompok ${rwSurvey.kelompok}` : "";
                const nimStr = rwSurvey.nim ? `NIM ${rwSurvey.nim}` : "";

                return (
                  <div
                    key={rwSurvey.id || `${rwSurvey.rw}-${rwSurvey.createdAt}`}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black ${
                            isEmerald
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                          }`}
                        >
                          RW {rwNum}
                        </span>
                        <div>
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                            {surveyorName}
                          </span>
                          <span className="text-xs text-slate-400 ml-2 font-normal">
                            {[kelompokStr, nimStr].filter(Boolean).join(" • ")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-[11px] text-slate-400">
                          {rwSurvey.createdAt
                            ? new Date(rwSurvey.createdAt).toLocaleDateString("id-ID")
                            : ""}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedRwSurvey(rwSurvey);
                            setIsRwModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-lg transition cursor-pointer"
                        >
                          <Eye size={12} /> Detail RW
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Kolom Prioritas RW */}
                      <div
                        className={`p-4 rounded-xl border ${
                          isEmerald
                            ? "bg-emerald-50/40 border-emerald-100/70 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-200"
                            : "bg-indigo-50/40 border-indigo-100/70 text-indigo-950 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-200"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1.5">
                          <ArrowRight
                            size={14}
                            className={isEmerald ? "text-emerald-600" : "text-indigo-600"}
                          />
                          <span>Rekomendasi / Prioritas Program RW {rwNum}</span>
                        </div>
                        <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">
                          {rwSurvey.prioritas || (
                            <span className="text-slate-400 italic">
                              — Tidak ada catatan prioritas khusus
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Kolom Risiko Sosial RW */}
                      <div className="p-4 rounded-xl border bg-rose-50/40 border-rose-100/70 text-rose-950 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-200">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1.5 text-rose-600 dark:text-rose-400">
                          <AlertTriangle size={14} />
                          <span>Catatan & Risiko Sosial Lapangan</span>
                        </div>
                        <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">
                          {rwSurvey.risiko || (
                            <span className="text-slate-400 italic">
                              — Tidak ada risiko sosial terlaporkan
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper render Tabel Matriks Kepatuhan Pemilahan per-RW
  const renderPemilahanRwBreakdown = (
    surveys: any[],
    tahapLabel: "Baseline" | "Endline",
    theme: "emerald" | "indigo"
  ) => {
    if (surveys.length === 0) return null;

    // Urutkan berdasarkan persentase tertinggi
    const sorted = [...surveys].sort((a, b) => {
      const pA = normalizePercentage(a.persenPilah);
      const pB = normalizePercentage(b.persenPilah);
      return pB - pA;
    });

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp
                size={16}
                className={theme === "emerald" ? "text-emerald-600" : "text-indigo-600"}
              />
              Peringkat & Kepatuhan Pemilahan Antar-RW ({surveys.length} RW Terdata)
            </h5>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian capaian pemilahan sampah warga per-RW diurutkan dari kepatuhan tertinggi.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
            Tahap: {tahapLabel}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-3 text-center w-12">Rank</th>
                <th className="px-4 py-3">Wilayah RW</th>
                <th className="px-4 py-3">Surveyor Lapangan</th>
                <th className="px-4 py-3 text-right">Rumah Memilah</th>
                <th className="px-4 py-3 text-right">Total Sampel</th>
                <th className="px-4 py-3 text-right">Persentase (%)</th>
                <th className="px-4 py-3 text-center">Tingkat Kesadaran</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.map((item, idx) => {
                const normPilah = normalizePercentage(item.persenPilah);
                const badgeColor =
                  normPilah >= 70
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : normPilah >= 30
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-rose-100 text-rose-800 border-rose-200";

                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="px-4 py-3.5 text-center font-black text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      RW {item.rw || "-"}
                      {item.jumlahRt ? (
                        <span className="text-slate-400 font-normal ml-1">
                          ({item.jumlahRt} RT)
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.namaSurveyor || "Mahasiswa KKN"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.kelompok ? `Kelompok ${item.kelompok}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-800 dark:text-slate-200">
                      {item.rumahPilah ?? 0}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-400">
                      {item.rumahTotal ?? 0}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-xs font-black border ${badgeColor}`}
                      >
                        {normPilah.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {item.tingkatPilah ||
                          (normPilah >= 70 ? "Tinggi" : normPilah >= 30 ? "Sedang" : "Rendah")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => {
                          setSelectedRwSurvey(item);
                          setIsRwModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 rounded transition cursor-pointer"
                      >
                        <Eye size={12} /> Rincian
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

  // Helper render Tabel Sebaran Fasilitas Bank Sampah & Pengolahan Tiap RW
  const renderBankSampahRwBreakdown = (
    surveys: any[],
    tahapLabel: "Baseline" | "Endline",
    theme: "emerald" | "indigo"
  ) => {
    if (surveys.length === 0) return null;

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sprout
                size={16}
                className={theme === "emerald" ? "text-emerald-600" : "text-indigo-600"}
              />
              Sebaran Fasilitas & Pengolahan Tiap RW ({surveys.length} RW Terdata)
            </h5>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemetaan ketersediaan Bank Sampah, unit komposter, titik maggot BSF, dan fasilitas
              pengolahan lingkungan di tiap RW.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
            Tahap: {tahapLabel}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-3 text-center w-12">No</th>
                <th className="px-4 py-3">Wilayah</th>
                <th className="px-4 py-3 text-center">Bank Sampah Aktif</th>
                <th className="px-4 py-3 text-center">Non-Aktif</th>
                <th className="px-4 py-3 text-center">Komposter</th>
                <th className="px-4 py-3 text-center">Titik Maggot</th>
                <th className="px-4 py-3">Aktivitas & Fasilitas Pendukung</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {surveys.map((item, idx) => {
                const tekList = Array.isArray(item.teknologi) ? item.teknologi : [];
                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="px-4 py-3.5 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      RW {item.rw || "-"}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {item.namaSurveyor || "Mahasiswa"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                          Number(item.bankSampahAktif || 0) > 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "text-slate-400"
                        }`}
                      >
                        {item.bankSampahAktif || 0} unit
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-400">
                      {item.bankSampahTidakAktif || 0} unit
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                          Number(item.unitKomposter || 0) > 0
                            ? "bg-blue-100 text-blue-800"
                            : "text-slate-400"
                        }`}
                      >
                        {item.unitKomposter || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                          Number(item.titikMaggot || 0) > 0
                            ? "bg-amber-100 text-amber-800"
                            : "text-slate-400"
                        }`}
                      >
                        {item.titikMaggot || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {tekList.length > 0 ? (
                          tekList.map((t: string, tIdx: number) => (
                            <span
                              key={tIdx}
                              className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            — Belum ada fasilitas tambahan
                          </span>
                        )}
                      </div>
                      {item.keteranganBankSampah && (
                        <div className="text-[11px] text-slate-500 mt-1 italic">
                          "{item.keteranganBankSampah}"
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => {
                          setSelectedRwSurvey(item);
                          setIsRwModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 rounded transition cursor-pointer"
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

  // Helper render Tabel Rincian Karakteristik Tiap RW
  const renderKarakteristikRwBreakdown = (
    surveys: any[],
    tahapLabel: "Baseline" | "Endline",
    theme: "emerald" | "indigo"
  ) => {
    if (surveys.length === 0) return null;

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MapPin
                size={16}
                className={theme === "emerald" ? "text-emerald-600" : "text-indigo-600"}
              />
              Rincian Profil & Karakteristik Tiap RW ({surveys.length} RW Terdata)
            </h5>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemetaan kondisi lingkungan, kepadatan, kos-kosan, UMKM, dan catatan spesifik dari masing-masing RW binaan.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
            Tahap: {tahapLabel}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-3 text-center w-12">No</th>
                <th className="px-4 py-3">Wilayah RW</th>
                <th className="px-4 py-3">Surveyor Lapangan</th>
                <th className="px-4 py-3 text-center">Jml Kos</th>
                <th className="px-4 py-3 text-center">Jml UMKM</th>
                <th className="px-4 py-3">Karakteristik Lingkungan Terdata</th>
                <th className="px-4 py-3">Catatan / Lainnya</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {surveys.map((item, idx) => {
                const karArray = Array.isArray(item.karakter) ? item.karakter : [];
                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="px-4 py-3.5 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      RW {item.rw || "-"}
                      {item.jumlahRt ? (
                        <span className="text-slate-400 font-normal ml-1">
                          ({item.jumlahRt} RT)
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.namaSurveyor || "Mahasiswa KKN"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.kelompok ? `Kelompok ${item.kelompok}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                          Number(item.jumlahKos || 0) > 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "text-slate-400"
                        }`}
                      >
                        {item.jumlahKos != null && item.jumlahKos !== ""
                          ? `${item.jumlahKos} unit`
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                          Number(item.jumlahUmkm || 0) > 0
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "text-slate-400"
                        }`}
                      >
                        {item.jumlahUmkm != null && item.jumlahUmkm !== ""
                          ? `${item.jumlahUmkm} unit`
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {karArray.length > 0 ? (
                          karArray.map((k: string, kIdx: number) => {
                            const isPadat = /padat/i.test(k);
                            const isKos = /kos/i.test(k);
                            const isUmkm = /umkm|warung/i.test(k);
                            const isSungai = /sungai|bantaran/i.test(k);
                            const isKampus = /kampus|sekolah/i.test(k);
                            const isPasar = /pasar/i.test(k);

                            let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
                            if (isPadat) badgeStyle = "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300";
                            else if (isKos) badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300";
                            else if (isUmkm) badgeStyle = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300";
                            else if (isSungai) badgeStyle = "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300";
                            else if (isKampus) badgeStyle = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300";
                            else if (isPasar) badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300";

                            return (
                              <span
                                key={kIdx}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badgeStyle}`}
                              >
                                {k}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            — Belum ada indikator terpilih
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        {item.karakterLain || <span className="text-slate-400 italic">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => {
                          setSelectedRwSurvey(item);
                          setIsRwModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 rounded transition cursor-pointer"
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
          <div className="space-y-6 max-w-5xl mx-auto">
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

            {/* Matriks Kepatuhan Pemilahan Antar-RW */}
            {renderPemilahanRwBreakdown(baselineRwList, "Baseline", "emerald")}
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

            {/* Matriks Fasilitas Bank Sampah & Pengolahan Tiap RW */}
            {renderBankSampahRwBreakdown(baselineRwList, "Baseline", "emerald")}
          </div>
        );
      case "karakter": {
        if (!kw && baselineRwList.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
              <MapPin size={32} className="text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Data Karakteristik Wilayah belum tersedia.</p>
            </div>
          );
        }

        // Hitung total akumulasi kos & UMKM dari RW survei baseline
        const totalRwKos = baselineRwList.reduce((acc, s) => acc + (Number(s.jumlahKos) || 0), 0);
        const totalRwUmkm = baselineRwList.reduce((acc, s) => acc + (Number(s.jumlahUmkm) || 0), 0);
        const rwKosReportedCount = baselineRwList.filter((s) => (Number(s.jumlahKos) || 0) > 0).length;
        const rwUmkmReportedCount = baselineRwList.filter((s) => (Number(s.jumlahUmkm) || 0) > 0).length;

        // Flag lingkungan gabungan (profil kelurahan OR survei RW)
        const checkKarakter = (propKey: string, regex: RegExp) => {
          const kelVal = kw ? Boolean((kw as any)[propKey]) : false;
          const rwVal = baselineRwList.some(
            (s) => Array.isArray(s.karakter) && s.karakter.some((k: any) => regex.test(String(k)))
          );
          return kelVal || rwVal;
        };

        const isPadat = checkKarakter("padatPenduduk", /padat/i);
        const isKos = checkKarakter("banyakKosKontrakan", /kos/i) || totalRwKos > 0;
        const isUmkm = checkKarakter("banyakUmkmWarungKafe", /umkm|warung/i) || totalRwUmkm > 0;
        const isKampus = checkKarakter("dekatKampusSekolah", /kampus|sekolah/i);
        const isPasar = checkKarakter("pasar", /pasar/i);
        const isSungai = checkKarakter("bantaranSungai", /sungai|bantaran/i);

        // Penentuan teks jumlah kos & UMKM
        let displayKos: any = kw?.perkiraanJumlahKosKontrakan;
        if (!displayKos || String(displayKos).trim() === "") {
          if (totalRwKos > 0) {
            displayKos = `${totalRwKos} unit (${rwKosReportedCount} RW)`;
          } else {
            displayKos = null;
          }
        } else if (!isNaN(Number(displayKos))) {
          displayKos = `${displayKos} unit`;
        }

        let displayUmkm: any = kw?.perkiraanJumlahUmkmWarungKafe;
        if (!displayUmkm || String(displayUmkm).trim() === "") {
          if (totalRwUmkm > 0) {
            displayUmkm = `${totalRwUmkm} unit (${rwUmkmReportedCount} RW)`;
          } else {
            displayUmkm = null;
          }
        } else if (!isNaN(Number(displayUmkm))) {
          displayUmkm = `${displayUmkm} unit`;
        }

        return (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Lapisan 1: Ringkasan Makro Kelurahan */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <MapPin size={20} className="text-emerald-600" /> Profil Karakteristik Wilayah (Baseline)
                </h4>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Sintesis Gabungan Makro & Mikro RW
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-100 dark:border-slate-800 text-slate-400">
                      <th className="pb-3 font-bold uppercase tracking-wider">Karakteristik Lingkungan</th>
                      <th className="pb-3 font-bold uppercase tracking-wider text-right">Status Gabungan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Padat Penduduk</td>
                      <td className="py-3.5 text-right">{renderBool(isPadat)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Banyak Kos/Kontrakan</td>
                      <td className="py-3.5 text-right">{renderBool(isKos)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Banyak UMKM/Warung</td>
                      <td className="py-3.5 text-right">{renderBool(isUmkm)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Dekat Kampus/Sekolah</td>
                      <td className="py-3.5 text-right">{renderBool(isKampus)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Dekat Pasar</td>
                      <td className="py-3.5 text-right">{renderBool(isPasar)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Dekat Bantaran Sungai</td>
                      <td className="py-3.5 text-right">{renderBool(isSungai)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Perkiraan Jml Kos</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {displayKos ? renderValue(displayKos) : <span className="text-slate-400 font-medium">— Belum tersedia</span>}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Perkiraan Jml UMKM</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {displayUmkm ? renderValue(displayUmkm) : <span className="text-slate-400 font-medium">— Belum tersedia</span>}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center md:col-span-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Karakter Lainnya</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                  {kw?.karakterLainnyaKeterangan ? renderValue(kw.karakterLainnyaKeterangan) : <span className="text-slate-400">— Tidak ada spesifikasi lain</span>}
                </p>
              </div>
            </div>

            {/* Lapisan 2: Rincian Karakteristik per-RW */}
            {renderKarakteristikRwBreakdown(baselineRwList, "Baseline", "emerald")}
          </div>
        );
      }
      case "key_player": {
        const baselineActors = extractUnifiedKeyPlayers(selectedSurvey, baselineRwList, "Baseline");
        return renderUnifiedActorTable(baselineActors, "Baseline", "emerald");
      }
      case "potensi_risiko":
        return renderKesimpulanMultiRw(baselineRwList, "Baseline", "emerald", pr);
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

  // Render Tab Endline Berdasarkan Sub-tab
  const renderEndlineTab = () => {
    // Jika user berada di sub-tab rw_surveys, tampilkan tabel RW Endline
    if (endlineSubTab === "rw_surveys") {
      return (
        <div className="space-y-6">
          {renderRwTable(endlineRwList, "Endline")}
        </div>
      );
    }

    const ps = endlineSurvey?.pemilahanSampah;
    const vs = endlineSurvey?.volumeSampah;
    const bs = endlineSurvey?.bankSampahPengolahan;
    const ck = endlineSurvey?.catatanKesimpulan;
    const kw = endlineSurvey?.karakteristikWilayah || selectedSurvey?.karakteristikWilayah;
    const kp = (endlineSurvey?.keyPlayers && endlineSurvey.keyPlayers.length > 0)
      ? endlineSurvey.keyPlayers
      : (selectedSurvey?.keyPlayers || []);

    const wilayahKecamatan = endlineSurvey?.kecamatan || selectedSurvey?.kecamatan;
    const wilayahRw = endlineSurvey?.jumlahRw || selectedSurvey?.jumlahRw;
    const wilayahRt = endlineSurvey?.jumlahRt || selectedSurvey?.jumlahRt;
    const wilayahKk = endlineSurvey?.jumlahKk || selectedSurvey?.jumlahKk;
    const wilayahRumah = endlineSurvey?.jumlahRumahTotal || selectedSurvey?.jumlahRumahTotal;
    const titikKumpul = endlineSurvey?.titikKumpulMahasiswa || selectedSurvey?.titikKumpulMahasiswa;

    switch (endlineSubTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {!endlineSurvey && (
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-indigo-950 dark:text-indigo-200">
                      Data Agregat Endline Kelurahan Sedang Berjalan
                    </h4>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">
                      Survei Endline (akhir intervensi KKN) mengagregasi data lapangan tingkat RW secara otomatis. Saat ini tercatat <b>{endlineRwList.length} survei RW Endline</b> yang masuk.
                    </p>
                  </div>
                </div>
                {endlineRwList.length > 0 && (
                  <button
                    onClick={() => setEndlineSubTab("rw_surveys")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <ClipboardList size={14} />
                    <span>Lihat {endlineRwList.length} Survei RW Endline</span>
                  </button>
                )}
              </div>
            )}

            {/* Grid 2 Kolom Selaras dengan Baseline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Map size={20} className="text-indigo-600" /> Informasi Wilayah (Evaluasi Endline)
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
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(wilayahKecamatan)}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><Map size={16} /> Cakupan RW</td>
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(wilayahRw, "RW")}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><Map size={16} /> Jumlah RT</td>
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(wilayahRt, "RT")}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><Users size={16} /> Jumlah KK</td>
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(wilayahKk, "KK")}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2"><Home size={16} /> Total Rumah Sampel</td>
                        <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{renderValue(wilayahRumah || ps?.totalJumlahRumahDiRw)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <ClipboardList size={20} className="text-indigo-600" /> Data Pengumpulan Endline
                </h4>

                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm flex-1 content-start">
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Status Evaluasi</span>
                    {endlineSurvey ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-bold">
                        <CheckCircle2 size={14} /> Tersedia
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold">
                        <Info size={14} /> Pengumpulan Berjalan
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Tanggal Survei</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      {endlineSurvey?.tanggalSurvei
                        ? new Date(endlineSurvey.tanggalSurvei).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                        : <span className="text-slate-400 font-medium">— Belum tersedia</span>}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Koordinator / Enumerator</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{renderValue(endlineSurvey?.enumerator || "Mahasiswa KKN")}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Titik Kumpul</span>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{renderValue(titikKumpul)}</div>
                  </div>
                  {endlineSurvey?.catatanData && (
                    <div className="col-span-2">
                      <span className="text-slate-500 font-medium block mb-1">Catatan Evaluasi</span>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
                        {endlineSurvey.catatanData}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metrik Capaian Endline (3 KPI Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Capaian Pemilahan</span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-indigo-600">
                    {ps?.persentasePemilahan != null ? formatPercentString(ps.persentasePemilahan) : "—"}
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

            {/* Volume Sampah Endline Cards Selaras dengan Baseline */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Database size={20} className="text-indigo-600" /> Timbulan Sampah Endline
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 text-center flex flex-col items-center justify-center min-h-[140px]">
                  <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider mb-2">Organik</p>
                  {vs?.organikKgPerHari != null ? (
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
                  {vs?.anorganikKgPerHari != null ? (
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
                  {vs?.residuKgPerHari != null ? (
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
                  {vs?.totalVolumeKgPerHari != null ? (
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
              {vs?.catatan && (
                <p className="text-sm text-slate-500 mt-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                  Catatan: {vs.catatan}
                </p>
              )}
            </div>
          </div>
        );

      case "pemilahan":
        if (!ps) {
          return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
              <Database size={32} className="text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Data pemilahan sampah endline belum tersedia.</p>
              {endlineRwList.length > 0 && (
                <button
                  onClick={() => setEndlineSubTab("rw_surveys")}
                  className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
                >
                  Lihat {endlineRwList.length} survei RW endline yang masuk →
                </button>
              )}
            </div>
          );
        }
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Database size={160} />
              </div>
              <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 relative z-10">
                <Database size={20} className="text-indigo-600" /> Statistik Pemilahan Warga (Endline)
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

              <div className="bg-indigo-50/70 border border-indigo-100 p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div>
                  <p className="text-indigo-700 font-bold uppercase tracking-wider text-sm mb-1">Persentase Kepatuhan Pemilahan (Akhir)</p>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-indigo-600">
                      {formatPercentString(ps.persentasePemilahan)}
                    </span>
                  </div>
                </div>
                <div className="w-px h-16 bg-indigo-200 hidden md:block"></div>
                <div className="text-left md:text-right">
                  <p className="text-indigo-700 font-bold uppercase tracking-wider text-sm mb-2">Tingkat Kesadaran</p>
                  <span className="inline-block bg-white dark:bg-slate-900 text-indigo-700 px-5 py-2 rounded-xl font-bold border border-indigo-200 text-lg shadow-sm">
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

            {/* Matriks Kepatuhan Pemilahan Antar-RW Endline */}
            {renderPemilahanRwBreakdown(endlineRwList, "Endline", "indigo")}
          </div>
        );

      case "bank_sampah":
        if (!bs) {
          return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
              <Sprout size={32} className="text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Data fasilitas bank sampah & pengolahan endline belum tersedia.</p>
            </div>
          );
        }
        return (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Building size={32} />
                </div>
                <div>
                  <p className="text-xs text-emerald-700 uppercase font-bold tracking-wider mb-1">Bank Sampah Aktif (Endline)</p>
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
                <Sprout size={20} className="text-indigo-600" /> Fasilitas Ekosistem Pendukung (Endline)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-sm mb-8">
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Biopori / Loseda</span> {renderBool(bs.bioporiLoseda)}
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Ecobrick / Daur Ulang</span> {renderBool(bs.ecobrickKerajinanDaurUlang)}
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Buruan Sae / Kebun Warga</span> {renderBool(bs.buruanSae)}
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Pengepul Mitra</span> {renderBool(bs.pengepulMitraDaurUlang)}
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800/60 md:col-span-2">
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
              </div>
              {bs.aktivitasLainnyaKeterangan && (
                <p className="text-xs text-slate-500 mt-4 italic bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  Keterangan: {bs.aktivitasLainnyaKeterangan}
                </p>
              )}
            </div>

            {/* Matriks Fasilitas Bank Sampah & Pengolahan Tiap RW Endline */}
            {renderBankSampahRwBreakdown(endlineRwList, "Endline", "indigo")}
          </div>
        );

      case "karakter": {
        if (!kw && endlineRwList.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
              <MapPin size={32} className="text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Data Karakteristik Wilayah endline belum tersedia.</p>
            </div>
          );
        }

        // Hitung total akumulasi kos & UMKM dari RW survei endline
        const totalRwKos = endlineRwList.reduce((acc, s) => acc + (Number(s.jumlahKos) || 0), 0);
        const totalRwUmkm = endlineRwList.reduce((acc, s) => acc + (Number(s.jumlahUmkm) || 0), 0);
        const rwKosReportedCount = endlineRwList.filter((s) => (Number(s.jumlahKos) || 0) > 0).length;
        const rwUmkmReportedCount = endlineRwList.filter((s) => (Number(s.jumlahUmkm) || 0) > 0).length;

        // Flag lingkungan gabungan (kelurahan OR survei RW Endline)
        const checkKarakter = (propKey: string, regex: RegExp) => {
          const kelVal = kw ? Boolean((kw as any)[propKey]) : false;
          const rwVal = endlineRwList.some(
            (s) => Array.isArray(s.karakter) && s.karakter.some((k: any) => regex.test(String(k)))
          );
          return kelVal || rwVal;
        };

        const isPadat = checkKarakter("padatPenduduk", /padat/i);
        const isKos = checkKarakter("banyakKosKontrakan", /kos/i) || totalRwKos > 0;
        const isUmkm = checkKarakter("banyakUmkmWarungKafe", /umkm|warung/i) || totalRwUmkm > 0;
        const isKampus = checkKarakter("dekatKampusSekolah", /kampus|sekolah/i);
        const isPasar = checkKarakter("pasar", /pasar/i);
        const isSungai = checkKarakter("bantaranSungai", /sungai|bantaran/i);

        let displayKos: any = kw?.perkiraanJumlahKosKontrakan;
        if (!displayKos || String(displayKos).trim() === "") {
          if (totalRwKos > 0) {
            displayKos = `${totalRwKos} unit (${rwKosReportedCount} RW)`;
          } else {
            displayKos = null;
          }
        } else if (!isNaN(Number(displayKos))) {
          displayKos = `${displayKos} unit`;
        }

        let displayUmkm: any = kw?.perkiraanJumlahUmkmWarungKafe;
        if (!displayUmkm || String(displayUmkm).trim() === "") {
          if (totalRwUmkm > 0) {
            displayUmkm = `${totalRwUmkm} unit (${rwUmkmReportedCount} RW)`;
          } else {
            displayUmkm = null;
          }
        } else if (!isNaN(Number(displayUmkm))) {
          displayUmkm = `${displayUmkm} unit`;
        }

        return (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Lapisan 1: Ringkasan Makro Kelurahan Endline */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <MapPin size={20} className="text-indigo-600" /> Profil Karakteristik Wilayah (Endline)
                </h4>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Sintesis Gabungan Makro & Mikro RW
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-100 dark:border-slate-800 text-slate-400">
                      <th className="pb-3 font-bold uppercase tracking-wider">Karakteristik Lingkungan</th>
                      <th className="pb-3 font-bold uppercase tracking-wider text-right">Status Gabungan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr><td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Padat Penduduk</td><td className="py-3.5 text-right">{renderBool(isPadat)}</td></tr>
                    <tr><td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Banyak Kos/Kontrakan</td><td className="py-3.5 text-right">{renderBool(isKos)}</td></tr>
                    <tr><td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Banyak UMKM/Warung</td><td className="py-3.5 text-right">{renderBool(isUmkm)}</td></tr>
                    <tr><td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Dekat Kampus/Sekolah</td><td className="py-3.5 text-right">{renderBool(isKampus)}</td></tr>
                    <tr><td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Area Pasar</td><td className="py-3.5 text-right">{renderBool(isPasar)}</td></tr>
                    <tr><td className="py-3.5 text-slate-600 dark:text-slate-400 font-medium">Bantaran Sungai</td><td className="py-3.5 text-right">{renderBool(isSungai)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Perkiraan Jml Kos (Endline)</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {displayKos ? renderValue(displayKos) : <span className="text-slate-400 font-medium">— Belum tersedia</span>}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Perkiraan Jml UMKM (Endline)</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {displayUmkm ? renderValue(displayUmkm) : <span className="text-slate-400 font-medium">— Belum tersedia</span>}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center md:col-span-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Karakter Lainnya</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                  {kw?.karakterLainnyaKeterangan ? renderValue(kw.karakterLainnyaKeterangan) : <span className="text-slate-400">— Tidak ada spesifikasi lain</span>}
                </p>
              </div>
            </div>

            {/* Lapisan 2: Rincian Karakteristik Tiap RW Endline */}
            {renderKarakteristikRwBreakdown(endlineRwList, "Endline", "indigo")}
          </div>
        );
      }

      case "key_player": {
        const endlineActors = extractUnifiedKeyPlayers(
          endlineSurvey || selectedSurvey,
          endlineRwList,
          "Endline"
        );
        return renderUnifiedActorTable(endlineActors, "Endline", "indigo");
      }

      case "potensi_risiko":
        return renderKesimpulanMultiRw(endlineRwList, "Endline", "indigo", ck);

      case "rw_surveys":
        return (
          <div className="space-y-6">
            {renderRwTable(endlineRwList, "Endline")}
          </div>
        );

      default:
        return null;
    }
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

  const baselineCompletion = calculateCompletion(selectedSurvey);
  const endlineCompletion = calculateCompletion(endlineSurvey);
  const activeCompletion = mainTab === "ENDLINE" ? endlineCompletion : baselineCompletion;
  const activeTabLabel = mainTab === "ENDLINE" ? "Endline" : "Baseline";
  const namaKelurahan = selectedSurvey?.namaKelurahan || endlineSurvey?.namaKelurahan || "";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 pb-20">
      {/* Header Area */}
      <div className="flex flex-col gap-6">
        <div>
          <button
            onClick={() => {
              if (mainTab === "ENDLINE" || searchParams.get("tab")?.toUpperCase() === "ENDLINE") {
                navigate("/hasil-survei/endline");
              } else {
                navigate("/hasil-survei/baseline");
              }
            }}
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
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${baselineCompletion.percentage === 100 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                    Baseline: {baselineCompletion.percentage === 100 ? 'Lengkap' : 'Belum Lengkap'}
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
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Kelengkapan {activeTabLabel}
                    </span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{activeCompletion.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-3">
                    <div className={`h-2 rounded-full ${activeCompletion.percentage === 100 ? 'bg-emerald-500' : mainTab === 'ENDLINE' ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${activeCompletion.percentage}%` }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    {activeCompletion.breakdown.map((b, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        {b.isComplete ? (
                          <CheckCircle2 size={12} className={mainTab === "ENDLINE" ? "text-indigo-500 shrink-0" : "text-emerald-500 shrink-0"} />
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
            onClick={() => handleMainTabChange("BASELINE")}
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
            onClick={() => handleMainTabChange("ENDLINE")}
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
            onClick={() => handleMainTabChange("KOMPARASI")}
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
          <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto scrollbar-none" aria-label="Sub Tabs Baseline">
            {baselineTabs.map((tab) => {
              const isActive = baselineSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setBaselineSubTab(tab.id as SubTabType)}
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

      {/* Sub-nav khusus jika sedang di TAB ENDLINE */}
      {mainTab === "ENDLINE" && (
        <div className="border-b border-slate-100 dark:border-slate-800 -mt-3">
          <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto scrollbar-none" aria-label="Sub Tabs Endline">
            {endlineTabs.map((tab) => {
              const isActive = endlineSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setEndlineSubTab(tab.id as SubTabType)}
                  className={`${
                    isActive
                      ? "border-indigo-600 text-indigo-600"
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
