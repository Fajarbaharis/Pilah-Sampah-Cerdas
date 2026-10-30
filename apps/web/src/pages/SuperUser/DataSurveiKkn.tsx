import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Search,
  Loader2,
  Eye,
  Edit3,
  Building2,
  Layers,
  PlusCircle,
  ExternalLink,
  Trash2,
  Filter,
  CheckCircle2,
  Phone,
  BarChart3,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { useAuthStore } from "../../store/useAuthStore";
import EditSurveiModal from "./EditSurveiModal";
import DetailSurveiRwModal from "./DetailSurveiRwModal";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";

interface DataSurveiKknProps {
  type?: "BASELINE" | "ENDLINE";
}

const DAFTAR_KELURAHAN = [
  "Semua Kelurahan",
  "Sadang Serang",
  "Lebak Siliwangi",
  "Sekeloa",
  "Dago",
  "Lebak Gede",
  "Cipaganti",
];

export default function DataSurveiKkn({ type: propType }: DataSurveiKknProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const isEndline =
    propType === "ENDLINE" ||
    location.pathname.includes("endline") ||
    searchParams.get("type")?.toUpperCase() === "ENDLINE" ||
    searchParams.get("tipe")?.toUpperCase() === "ENDLINE";

  // Tab State
  const [activeTab, setActiveTab] = useState<"kelurahan" | "rw">("kelurahan");

  // Tab 1: Data Kelurahan (Makro)
  const [surveys, setSurveys] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEditKelurahanId, setSelectedEditKelurahanId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Tab 2: Data Lapangan RW (Mikro)
  const [rwSurveys, setRwSurveys] = useState<any[]>([]);
  const [rwMetrics, setRwMetrics] = useState<any>(null);
  const [isLoadingRw, setIsLoadingRw] = useState(false);
  const [rwSearchQuery, setRwSearchQuery] = useState("");
  const [rwKelurahanFilter, setRwKelurahanFilter] = useState("Semua Kelurahan");
  const [rwCurrentPage, setRwCurrentPage] = useState(1);
  const [selectedRwSurvey, setSelectedRwSurvey] = useState<any | null>(null);
  const [isRwModalOpen, setIsRwModalOpen] = useState(false);

  const limit = 10;
  const rwLimit = 10;

  const canEditKelurahan =
    user?.peran === "SUPER_USER" ||
    user?.peran === "DEVELOPER" ||
    user?.peran === "PANITIA_TASKFORCE" ||
    user?.peran === "TASK_FORCE" ||
    (user?.peran as string) === "TASKFORCE";

  const canDeleteRw =
    user?.peran === "SUPER_USER" ||
    user?.peran === "DEVELOPER";

  // 1. Fetch Kelurahan Data (Makro)
  const fetchSurveys = async (page: number, search: string = "") => {
    setIsLoading(true);
    try {
      if (isEndline) {
        const response = await api.get(`/evaluasi-dampak/endline`, {
          params: { page, limit, search },
        });
        if (response.data.success) {
          setSurveys(response.data.data);
          setMeta(response.data.meta);
        }
      } else {
        const response = await api.get(`/survei-kkn`, {
          params: { page, limit, search },
        });
        if (response.data.success) {
          setSurveys(response.data.data);
          setMeta(response.data.meta);
        }
      }
    } catch (error: any) {
      console.error(error);
      showToast.error(error.response?.data?.message || "Gagal memuat data survei kelurahan");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch RW Surveys Data (Mikro)
  const fetchRwSurveys = async (search: string = "", kelurahan: string = "Semua Kelurahan") => {
    setIsLoadingRw(true);
    try {
      const tahapParam = isEndline ? "Endline" : "Baseline";
      const kelParam = kelurahan === "Semua Kelurahan" ? "" : kelurahan;
      const response = await api.get(`/survey/data`, {
        params: {
          search,
          tahap: tahapParam,
          kelurahan: kelParam,
        },
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setRwSurveys(data.surveys || []);
        setRwMetrics(data.metrics || null);
      }
    } catch (error: any) {
      console.error("Gagal memuat data survei RW:", error);
      showToast.error("Gagal memuat data survei lapangan RW");
    } finally {
      setIsLoadingRw(false);
    }
  };

  // Debounced search for Kelurahan
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
      fetchSurveys(1, searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, isEndline]);

  useEffect(() => {
    if (!searchQuery) {
      fetchSurveys(currentPage, "");
    }
  }, [currentPage, isEndline]);

  // Debounced search for RW
  useEffect(() => {
    const handler = setTimeout(() => {
      setRwCurrentPage(1);
      fetchRwSurveys(rwSearchQuery, rwKelurahanFilter);
    }, 500);
    return () => clearTimeout(handler);
  }, [rwSearchQuery, rwKelurahanFilter, isEndline]);

  // Trigger RW fetch saat tab RW dibuka
  useEffect(() => {
    if (activeTab === "rw") {
      fetchRwSurveys(rwSearchQuery, rwKelurahanFilter);
    }
  }, [activeTab]);

  const handleOpenDetail = (kelurahanId: number) => {
    navigate(`/superUser/data-survei-kkn/${kelurahanId}`);
  };

  const handleOpenRwDetail = (surveyItem: any) => {
    setSelectedRwSurvey(surveyItem);
    setIsRwModalOpen(true);
  };

  const handleDeleteRwSurvey = async (id: string) => {
    try {
      const res = await api.delete(`/survey/${id}`);
      if (res.data.success) {
        showToast.success("Data survei RW berhasil dihapus.");
        setIsRwModalOpen(false);
        setSelectedRwSurvey(null);
        // Refresh kedua dataset
        fetchRwSurveys(rwSearchQuery, rwKelurahanFilter);
        fetchSurveys(currentPage, searchQuery);
      }
    } catch (err: any) {
      console.error(err);
      showToast.error(err.response?.data?.message || "Gagal menghapus data survei RW");
    }
  };

  const cleanWaNumber = (phone: string | null | undefined) => {
    if (!phone) return "";
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.substring(1);
    return clean;
  };

  // Paginasi lokal untuk data RW
  const rwStartIndex = (rwCurrentPage - 1) * rwLimit;
  const paginatedRwSurveys = rwSurveys.slice(rwStartIndex, rwStartIndex + rwLimit);
  const rwTotalPages = Math.ceil(rwSurveys.length / rwLimit) || 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header Section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {isEndline ? "Data Survei Endline KKN" : "Data Survei Baseline KKN"}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black border ${
                  isEndline
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                }`}
              >
                {isEndline ? "🟢 Survei Akhir (Endline)" : "🔵 Survei Awal (Baseline)"}
              </span>
            </div>
            <p className="text-slate-500 mt-1.5 font-medium text-sm">
              {isEndline
                ? "Monitoring dan rekap data hasil survei evaluasi akhir (Endline) pemilahan sampah pasca-kegiatan KKN Tematik."
                : "Monitoring dan rekap data hasil survei kondisi awal (Baseline) pemilahan sampah oleh mahasiswa KKN."}
            </p>
          </div>

          {/* Quick Action Button: Input Survei Lapangan */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open("/survey", "_blank")}
              className="inline-flex items-center gap-2 bg-[#009966] hover:bg-[#008055] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-[#009966]/20 transition-all cursor-pointer hover:shadow-lg active:scale-95"
              title="Buka Form Survei KKN Lapangan di Tab Baru"
            >
              <PlusCircle size={18} />
              <span>Input Survei Baru</span>
              <ExternalLink size={14} className="opacity-70" />
            </button>
          </div>
        </div>

        {/* Tab Ganda Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-6 pb-px">
          <button
            onClick={() => setActiveTab("kelurahan")}
            className={`inline-flex items-center gap-2 px-5 py-3 font-extrabold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === "kelurahan"
                ? "border-[#009966] text-[#009966] dark:text-[#00b377]"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Building2 size={18} />
            <span>Ringkasan Kelurahan</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "kelurahan"
                  ? "bg-[#009966]/10 text-[#009966]"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              {meta?.total || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("rw")}
            className={`inline-flex items-center gap-2 px-5 py-3 font-extrabold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === "rw"
                ? "border-[#009966] text-[#009966] dark:text-[#00b377]"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Layers size={18} />
            <span>Data Lapangan RW</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "rw"
                  ? "bg-[#009966]/10 text-[#009966]"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              {rwSurveys.length}
            </span>
          </button>
        </div>

        {/* ================= TAB 1: RINGKASAN KELURAHAN (MAKRO) ================= */}
        {activeTab === "kelurahan" && (
          <div>
            {/* Search & Actions Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama kelurahan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009966] focus:border-transparent transition-all font-medium text-slate-700 dark:text-slate-300 placeholder-slate-400 text-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
              <div className="flex gap-3">
                <div className="bg-[#009966]/10 text-[#009966] px-4 py-2 rounded-xl font-bold text-sm border border-[#009966]/20">
                  Total Data: {meta?.total || 0} Kelurahan
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">No</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Kelurahan</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Kecamatan</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Tanggal Survei</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Enumerator</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Jml RW/RT</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoading && surveys.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <Loader2 className="animate-spin text-[#009966] mx-auto mb-3" size={32} />
                          <span className="text-slate-500 font-medium">Memuat data survei kelurahan...</span>
                        </td>
                      </tr>
                    ) : surveys.length === 0 ? (
                      <EmptyTableState
                        colSpan={7}
                        entityName={isEndline ? "Survei Endline" : "Survei Baseline"}
                        isSearch={!!searchQuery}
                        searchQuery={searchQuery}
                        onResetSearch={() => setSearchQuery("")}
                      />
                    ) : (
                      surveys.map((survey, index) => (
                        <tr
                          key={survey.kelurahanId}
                          className="hover:bg-slate-50/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-slate-500">
                            {(currentPage - 1) * limit + index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-extrabold text-slate-800 dark:text-slate-100 text-[15px]">
                              {survey.namaKelurahan}
                            </span>
                            {survey._count?.keyPlayers > 0 && (
                              <div className="mt-1">
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                                  {survey._count.keyPlayers} Aktor Tersimpan
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                            {survey.kecamatan || "Coblong"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {survey.tanggalSurvei ? new Date(survey.tanggalSurvei).toLocaleDateString("id-ID") : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {survey.enumerator || "Mahasiswa KKN"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                                RW: {survey.jumlahRw || 0}
                              </span>
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                                RT: {survey.jumlahRt || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canEditKelurahan && (
                                <button
                                  onClick={() => {
                                    setSelectedEditKelurahanId(survey.kelurahanId);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all font-bold text-xs cursor-pointer shadow-2xs"
                                  title="Edit Data Survei"
                                >
                                  <Edit3 size={14} /> Edit
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenDetail(survey.kelurahanId)}
                                className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:border-[#009966] hover:text-[#009966] transition-all font-bold text-xs cursor-pointer shadow-2xs"
                              >
                                <Eye size={14} /> Lihat Detail
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {meta && meta.total > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={meta.totalPages || 1}
                  totalItems={meta.total}
                  itemsPerPage={limit}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: DATA LAPANGAN RW (MIKRO) ================= */}
        {activeTab === "rw" && (
          <div>
            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    placeholder="Cari RW, nama surveyor, NIM..."
                    value={rwSearchQuery}
                    onChange={(e) => setRwSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009966] focus:border-transparent transition-all font-medium text-slate-700 dark:text-slate-300 placeholder-slate-400 text-sm"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>

                <div className="relative w-full sm:w-56">
                  <select
                    value={rwKelurahanFilter}
                    onChange={(e) => setRwKelurahanFilter(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009966] focus:border-transparent transition-all font-bold text-slate-700 dark:text-slate-300 text-xs appearance-none cursor-pointer"
                  >
                    {DAFTAR_KELURAHAN.map((kel) => (
                      <option key={kel} value={kel}>
                        {kel}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="bg-[#009966]/10 text-[#009966] px-3.5 py-2 rounded-xl font-bold text-xs border border-[#009966]/20">
                  Total: {rwSurveys.length} Isian RW
                </div>
              </div>
            </div>

            {/* Micro RW Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">No</th>
                      <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">Kode & Waktu</th>
                      <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">Kelurahan & RW</th>
                      <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">RT / KK</th>
                      <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">Pemilahan</th>
                      <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">Total Sampah</th>
                      <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">Surveyor KKN</th>
                      <th className="px-5 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {isLoadingRw && rwSurveys.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <Loader2 className="animate-spin text-[#009966] mx-auto mb-3" size={32} />
                          <span className="text-slate-500 font-medium">Memuat data survei lapangan RW...</span>
                        </td>
                      </tr>
                    ) : paginatedRwSurveys.length === 0 ? (
                      <EmptyTableState
                        colSpan={8}
                        entityName="Survei RW"
                        isSearch={!!rwSearchQuery || rwKelurahanFilter !== "Semua Kelurahan"}
                        searchQuery={rwSearchQuery}
                        onResetSearch={() => {
                          setRwSearchQuery("");
                          setRwKelurahanFilter("Semua Kelurahan");
                        }}
                      />
                    ) : (
                      paginatedRwSurveys.map((item, idx) => {
                        const pctPilah = Number(item.persenPilah) || 0;
                        const volTotal = Number(item.volumeTotal) || 0;

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors group text-xs"
                          >
                            <td className="px-5 py-4 font-bold text-slate-400">
                              {rwStartIndex + idx + 1}
                            </td>

                            <td className="px-5 py-4">
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {item.kodeSurvey || "—"}
                              </span>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {item.tanggalSurvei
                                  ? new Date(item.tanggalSurvei).toLocaleDateString("id-ID")
                                  : new Date(item.createdAt).toLocaleDateString("id-ID")}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="font-black text-slate-900 dark:text-white text-sm">
                                {item.rw}
                              </div>
                              <div className="text-slate-500 font-semibold">{item.kelurahan}</div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="text-slate-800 dark:text-slate-200 font-bold">
                                {item.jumlahRt ?? 0} RT
                              </div>
                              <div className="text-[11px] text-slate-400">{item.jumlahKk ?? 0} KK</div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-block w-2 h-2 rounded-full ${
                                    pctPilah >= 50
                                      ? "bg-emerald-500"
                                      : pctPilah >= 20
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                  }`}
                                />
                                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                  {pctPilah.toFixed(1)}%
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {item.rumahPilah ?? 0} dari {item.rumahTotal ?? item.jumlahKk ?? 0} KK
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {volTotal.toFixed(1)} kg
                              </div>
                              <div className="text-[10px] text-slate-400">per hari</div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="font-extrabold text-slate-800 dark:text-slate-200">
                                {item.namaSurveyor || "—"}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                NIM: {item.nim || "—"} · {item.kelompok || "KKN"}
                              </div>
                              {item.noWa && (
                                <a
                                  href={`https://wa.me/${cleanWaNumber(item.noWa)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold hover:underline mt-0.5"
                                >
                                  <Phone size={10} /> {item.noWa}
                                </a>
                              )}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenRwDetail(item)}
                                  className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-lg hover:border-[#009966] hover:text-[#009966] transition font-bold text-xs cursor-pointer shadow-2xs"
                                  title="Lihat Detail Survei RW"
                                >
                                  <Eye size={13} /> Detail
                                </button>

                                {canDeleteRw && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Hapus data survei ${item.rw} ${item.kelurahan} (${item.kodeSurvey})?`
                                        )
                                      ) {
                                        handleDeleteRwSurvey(item.id);
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                                    title="Hapus Data RW"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* RW Pagination */}
              {rwSurveys.length > rwLimit && (
                <Pagination
                  currentPage={rwCurrentPage}
                  totalPages={rwTotalPages}
                  totalItems={rwSurveys.length}
                  itemsPerPage={rwLimit}
                  onPageChange={(p) => setRwCurrentPage(p)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Kelurahan Modal */}
      {selectedEditKelurahanId && (
        <EditSurveiModal
          isOpen={isEditModalOpen}
          kelurahanId={selectedEditKelurahanId}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEditKelurahanId(null);
          }}
          onSuccess={() => {
            fetchSurveys(currentPage, searchQuery);
          }}
        />
      )}

      {/* Modal Detail Mikro Survei RW */}
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
