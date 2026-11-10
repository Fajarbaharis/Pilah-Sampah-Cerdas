/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Penilaian Individu Mahasiswa KKN (Komposisi 50% DPL + 50% MPL)
 * Desain Full Tabel dengan Form Penilaian Pop-up Modal Ringkas, Responsif & Efisien
 * 100% Real Database PostgreSQL Integration via Prisma
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  User,
  Loader2,
  GraduationCap,
  Edit3,
  Eye,
  CheckCircle2,
  Award,
  Users,
  FileText,
  Building2,
  Clock,
  AlertCircle,
  HelpCircle,
  Save,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  penilaianKknApiService,
  type StudentRekapItem,
} from "../../services/penilaianKknApiService";
import { useAuthStore } from "../../store/useAuthStore";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import {
  formatPersonName,
  formatKelompokName,
  formatWilayahName,
  formatProdiName,
} from "../../utils/textFormatter";
import { sortKelompokList, sortStudentsRoster } from "../../utils/sortUtils";
import { isTestStudent, isTestKelompok } from "../../utils/filterTestingUtils";

// 6 Aspek Akademik DPL (Total Bobot 100% -> Kontribusi 50% Nilai Akhir)
const ASPEK_DPL_CONFIG = [
  {
    key: "skorDplPerencanaan" as const,
    no: 1,
    title: "Perencanaan & Pemahaman Program",
    bobot: 20,
    deskripsi: "Pemahaman konteks wilayah dan kesiapan rencana kerja",
  },
  {
    key: "skorDplKontribusi" as const,
    no: 2,
    title: "Kontribusi Individu",
    bobot: 10,
    deskripsi: "Keaktifan, dedikasi, dan kerja nyata dalam tim KKN",
  },
  {
    key: "skorDplLogbook" as const,
    no: 3,
    title: "Logbook & Dokumentasi Akademik",
    bobot: 20,
    deskripsi: "Kelengkapan, ketepatan waktu, dan validitas logbook harian",
  },
  {
    key: "skorDplAnalisis" as const,
    no: 4,
    title: "Analisis Masalah & Solusi",
    bobot: 20,
    deskripsi: "Kemampuan identifikasi persoalan sampah dan rumusan solusi",
  },
  {
    key: "skorDplOutput" as const,
    no: 5,
    title: "Output, Outcome, & Dampak",
    bobot: 20,
    deskripsi: "Realisasi target fisik/edukasi dan dampak bagi warga binaan",
  },
  {
    key: "skorDplLaporanAkhir" as const,
    no: 6,
    title: "Laporan Akhir, Esai Lap. & Refleksi",
    bobot: 10,
    deskripsi: "Kualitas penulisan laporan akhir, esai lapangan, dan refleksi diri",
  },
];

// 4 Aspek Lapangan Mitra / MPL (Total Bobot 100% -> Kontribusi 50% Nilai Akhir)
const ASPEK_MITRA_CONFIG = [
  {
    key: "skorMitraKehadiran" as const,
    no: 1,
    title: "Kedisiplinan & Integritas Lapangan",
    bobot: 25,
    deskripsi:
      "Tingkat kehadiran fisik, kepatuhan jam kerja riil di lokasi KKN, dan ketepatan waktu",
  },
  {
    key: "skorMitraTanggungJawab" as const,
    no: 2,
    title: "Etika Kerja, Sikap & Tanggung Jawab",
    bobot: 25,
    deskripsi:
      "Sopan santun, ketaatan norma sosial warga RW/Kelurahan, dedikasi, dan inisiatif solutif",
  },
  {
    key: "skorMitraWargaBinaan" as const,
    no: 3,
    title: "Komunikasi & Pendampingan Warga Binaan",
    bobot: 25,
    deskripsi:
      "Pendekatan sosial dalam memotivasi warga memilah sampah serta koordinasi berkala dengan aparat RW/Kelurahan",
  },
  {
    key: "skorMitraProker" as const,
    no: 4,
    title: "Kontribusi Nyata & Eksekusi Program Kerja",
    bobot: 25,
    deskripsi:
      "Kinerja eksekusi kegiatan pengelolaan sampah di tingkat RW, posko KKN, dan dampak kebersihan lingkungan",
  },
];

export const PenilaianKknMahasiswaPage: React.FC = () => {
  const { user } = useAuthStore();
  const rawRole = String(user?.peran || (user as any)?.role || "").toUpperCase();
  const isPimpinan =
    rawRole === "PIMPINAN" ||
    rawRole === "PEMIMPIN" ||
    rawRole === "CAMAT" ||
    rawRole === "LURAH";
  const isMplUser =
    !isPimpinan &&
    (rawRole === "MPL" ||
      rawRole === "MITRA_PEMBIMBING_LAPANGAN" ||
      rawRole === "MITRA_PENDAMPING_LAPANGAN" ||
      rawRole === "RW" ||
      rawRole === "ADMIN_RW");
  const isDplUser =
    !isPimpinan &&
    (rawRole === "DPL" || rawRole === "DOSEN_PEMBIMBING" || rawRole === "DOSEN_PENDAMPING");
  const isAdminTeknis =
    rawRole === "SUPER_USER" ||
    rawRole === "DEVELOPER" ||
    rawRole === "ADMIN_DLH" ||
    rawRole === "PANITIA_TASKFORCE";

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [students, setStudents] = useState<StudentRekapItem[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeStudent, setActiveStudent] = useState<StudentRekapItem | null>(null);
  const [evaluatorTab, setEvaluatorTab] = useState<"DPL" | "MPL">(isMplUser ? "MPL" : "DPL");
  const [bobotDpl, setBobotDpl] = useState<number>(50);
  const [bobotMpl, setBobotMpl] = useState<number>(50);

  const isStudentFinalized = Boolean(activeStudent?.isFinalized || activeStudent?.status === "FINAL");
  // Perubahan Logika Kunci: Role yang berhak (DPL, MPL, SU, Developer) tetap dapat mengedit nilai komponennya meskipun status sudah FINAL
  const isDplTabEditable = !isPimpinan && (isDplUser || isAdminTeknis);
  const isMplTabEditable = !isPimpinan && (isMplUser || isAdminTeknis);
  const isCurrentTabEditable = evaluatorTab === "DPL" ? isDplTabEditable : isMplTabEditable;

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterKelompok, setFilterKelompok] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Form State inside Modal
  const [formScores, setFormScores] = useState<{
    skorDplPerencanaan: number | string;
    skorDplKontribusi: number | string;
    skorDplLogbook: number | string;
    skorDplAnalisis: number | string;
    skorDplOutput: number | string;
    skorDplLaporanAkhir: number | string;
    catatanDpl: string;
    skorMitraKehadiran: number | string;
    skorMitraWargaBinaan: number | string;
    skorMitraProker: number | string;
    skorMitraKomunikasi: number | string;
    skorMitraTanggungJawab: number | string;
    skorMitraBuktiKegiatan: number | string;
    skorMitraDampak: number | string;
    skorMitraInisiatif: number | string;
    catatanMitra: string;
  }>({
    skorDplPerencanaan: "",
    skorDplKontribusi: "",
    skorDplLogbook: "",
    skorDplAnalisis: "",
    skorDplOutput: "",
    skorDplLaporanAkhir: "",
    catatanDpl: "",
    skorMitraKehadiran: "",
    skorMitraWargaBinaan: "",
    skorMitraProker: "",
    skorMitraKomunikasi: "",
    skorMitraTanggungJawab: "",
    skorMitraBuktiKegiatan: "",
    skorMitraDampak: "",
    skorMitraInisiatif: "",
    catatanMitra: "",
  });

  // Fetch Student List from Database
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await penilaianKknApiService.getRekapPenilaian();
      const rawList: StudentRekapItem[] = Array.isArray(data) ? data : [];
      if (rawList.length > 0) {
        setBobotDpl(50);
        setBobotMpl(50);
      }
      const list = rawList.filter(
        (s) => !isTestStudent(s) && !isTestKelompok({ name: s.kelompok })
      );
      setStudents(list);
    } catch (err: any) {
      console.error("Error fetching students:", err);
      toast.error("Gagal memuat data mahasiswa dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Modal Open Handler
  const handleOpenModal = (student: StudentRekapItem) => {
    setBobotDpl(50);
    setBobotMpl(50);
    setActiveStudent(student);
    setFormScores({
      skorDplPerencanaan: student.skorDplPerencanaan || "",
      skorDplKontribusi: student.skorDplKontribusi || "",
      skorDplLogbook: student.skorDplLogbook || "",
      skorDplAnalisis: student.skorDplAnalisis || "",
      skorDplOutput: student.skorDplOutput || "",
      skorDplLaporanAkhir: student.skorDplLaporanAkhir || "",
      catatanDpl: student.catatanDpl || "",
      skorMitraKehadiran: student.skorMitraKehadiran || "",
      skorMitraWargaBinaan: student.skorMitraWargaBinaan || "",
      skorMitraProker: student.skorMitraProker || "",
      skorMitraKomunikasi: student.skorMitraKomunikasi || "",
      skorMitraTanggungJawab: student.skorMitraTanggungJawab || "",
      skorMitraBuktiKegiatan: student.skorMitraBuktiKegiatan || "",
      skorMitraDampak: student.skorMitraDampak || "",
      skorMitraInisiatif: student.skorMitraInisiatif || "",
      catatanMitra: student.catatanMitra || "",
    });
    setEvaluatorTab(isMplUser ? "MPL" : "DPL");
    setIsModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveStudent(null);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Unique Kelompok options
  const uniqueKelompokList = useMemo(() => {
    const setK = new Set<string>();
    students.forEach((s) => {
      if (s.kelompok && s.kelompok !== "-") setK.add(s.kelompok);
    });
    return sortKelompokList(Array.from(setK), (k) => k);
  }, [students]);

  // Statistics KPI Summary
  const stats = useMemo(() => {
    const total = students.length;
    const finalCount = students.filter(
      (s) => s.isFinalized || s.status === "FINAL"
    ).length;
    const lengkap = students.filter(
      (s) =>
        !s.isFinalized &&
        s.status !== "FINAL" &&
        (s.statusPenilaian === "LENGKAP" || (s.subtotalDpl > 0 && s.subtotalMitra > 0))
    ).length;
    const menungguMpl = students.filter(
      (s) =>
        !s.isFinalized &&
        s.status !== "FINAL" &&
        (s.statusPenilaian === "MENUNGGU_MPL" || (s.subtotalDpl > 0 && s.subtotalMitra === 0))
    ).length;
    const menungguDpl = students.filter(
      (s) =>
        !s.isFinalized &&
        s.status !== "FINAL" &&
        (s.statusPenilaian === "MENUNGGU_DPL" || (s.subtotalDpl === 0 && s.subtotalMitra > 0))
    ).length;
    const belum = students.filter(
      (s) =>
        !s.isFinalized &&
        s.status !== "FINAL" &&
        s.subtotalDpl === 0 &&
        s.subtotalMitra === 0
    ).length;

    const assessedStudents = students.filter((s) => (s.isFinalized ? s.nilaiAkhir > 0 : s.subtotalDpl > 0 || s.nilaiAkhir > 0));
    const avgScore =
      assessedStudents.length > 0
        ? assessedStudents.reduce(
            (acc, curr) => acc + (curr.isFinalized ? curr.nilaiAkhir : curr.subtotalDpl > 0 ? curr.subtotalDpl : curr.nilaiAkhir),
            0
          ) / assessedStudents.length
        : 0;

    return {
      total,
      finalCount,
      lengkap,
      menungguMpl,
      menungguDpl,
      belum,
      avgScore,
    };
  }, [students]);

  // Filtered Students with Intelligent Ranked Search (Prefix & Word-Boundary Priority)
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    // 1. Filter candidates by kelompok & status, and score them
    const scoredStudents: { student: StudentRekapItem; score: number }[] = [];

    for (const s of students) {
      const matchesKelompok = filterKelompok === "ALL" || s.kelompok === filterKelompok;

      let matchesStatus = true;
      if (filterStatus !== "ALL") {
        if (filterStatus === "FINAL") {
          matchesStatus = Boolean(s.isFinalized || s.status === "FINAL");
        } else if (filterStatus === "LENGKAP") {
          matchesStatus =
            !s.isFinalized &&
            (s.statusPenilaian === "LENGKAP" || (s.subtotalDpl > 0 && s.subtotalMitra > 0));
        } else if (filterStatus === "MENUNGGU_MPL") {
          matchesStatus =
            !s.isFinalized &&
            (s.statusPenilaian === "MENUNGGU_MPL" || (s.subtotalDpl > 0 && s.subtotalMitra === 0));
        } else if (filterStatus === "MENUNGGU_DPL") {
          matchesStatus =
            !s.isFinalized &&
            (s.statusPenilaian === "MENUNGGU_DPL" || (s.subtotalDpl === 0 && s.subtotalMitra > 0));
        } else if (filterStatus === "BELUM_DINILAI") {
          matchesStatus = !s.isFinalized && s.subtotalDpl === 0 && s.subtotalMitra === 0;
        }
      }

      if (!matchesKelompok || !matchesStatus) continue;

      if (!q) {
        scoredStudents.push({ student: s, score: 0 });
        continue;
      }

      const namaLower = (s.nama || "").toLowerCase();
      const nimClean = (s.nim || "").trim().toLowerCase();
      const prodiLower = (s.programStudi || s.jurusan || "").toLowerCase();
      const kelompokLower = (s.kelompok || "").toLowerCase();
      const kelurahanLower = (s.kelurahan || "").toLowerCase();

      let score = 0;

      // Tier 1: Exact match
      if (namaLower === q || nimClean === q) {
        score = 1000;
      }
      // Tier 2: Nama depan diawali query (Prefix Nama Lengkap)
      else if (namaLower.startsWith(q)) {
        score = 500;
      }
      // Tier 3: NIM diawali query
      else if (nimClean.startsWith(q)) {
        score = 400;
      }
      // Tier 4: Kata dalam nama diawali query (Word-boundary prefix)
      else if (namaLower.split(/\s+/).some((word) => word.startsWith(q))) {
        score = 300;
      }
      // Tier 5: Prodi / Kelompok / Kelurahan diawali query
      else if (
        prodiLower.startsWith(q) ||
        prodiLower.split(/\s+/).some((w) => w.startsWith(q)) ||
        kelompokLower.startsWith(q) ||
        kelurahanLower.startsWith(q)
      ) {
        score = 150;
      }
      // Tier 6: Substring di tengah nama
      else if (namaLower.includes(q)) {
        score = 50;
      }
      // Tier 7: Substring di field lainnya
      else if (
        nimClean.includes(q) ||
        prodiLower.includes(q) ||
        kelompokLower.includes(q) ||
        kelurahanLower.includes(q)
      ) {
        score = 25;
      }

      if (score > 0) {
        scoredStudents.push({ student: s, score });
      }
    }

    // 2. Sorting: jika ada query, urutkan berdasarkan skor relevansi tertinggi
    if (q) {
      scoredStudents.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.student.nama.localeCompare(b.student.nama, "id", { sensitivity: "base" });
      });
      return scoredStudents.map((item) => item.student);
    }

    // Jika tanpa query, gunakan natural roster sorting standar
    const plainList = scoredStudents.map((item) => item.student);
    return sortStudentsRoster(plainList, {
      getKelompok: (s) => s.kelompok,
      getName: (s) => s.nama,
      getNim: (s) => s.nim,
    });
  }, [students, searchQuery, filterKelompok, filterStatus]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterKelompok, filterStatus]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Calculate live score in Modal
  const computedScores = useMemo(() => {
    const parseNum = (v: number | string) => {
      const n = Number(v);
      return isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
    };

    // DPL (6 Aspek)
    const d1 = parseNum(formScores.skorDplPerencanaan);
    const d2 = parseNum(formScores.skorDplKontribusi);
    const d3 = parseNum(formScores.skorDplLogbook);
    const d4 = parseNum(formScores.skorDplAnalisis);
    const d5 = parseNum(formScores.skorDplOutput);
    const d6 = parseNum(formScores.skorDplLaporanAkhir);

    const dpl1 = Number(((d1 * 20) / 100).toFixed(2));
    const dpl2 = Number(((d2 * 10) / 100).toFixed(2));
    const dpl3 = Number(((d3 * 20) / 100).toFixed(2));
    const dpl4 = Number(((d4 * 20) / 100).toFixed(2));
    const dpl5 = Number(((d5 * 20) / 100).toFixed(2));
    const dpl6 = Number(((d6 * 10) / 100).toFixed(2));
    const subtotalDpl = Number((dpl1 + dpl2 + dpl3 + dpl4 + dpl5 + dpl6).toFixed(2));

    // MPL (4 Aspek Utama Lapangan: @25% = 100%)
    const m1 = parseNum(formScores.skorMitraKehadiran);
    const m2 = parseNum(formScores.skorMitraTanggungJawab);
    const m3 = parseNum(formScores.skorMitraWargaBinaan);
    const m4 = parseNum(formScores.skorMitraProker);

    const mpl1 = Number(((m1 * 25) / 100).toFixed(2));
    const mpl2 = Number(((m2 * 25) / 100).toFixed(2));
    const mpl3 = Number(((m3 * 25) / 100).toFixed(2));
    const mpl4 = Number(((m4 * 25) / 100).toFixed(2));
    const subtotalMitra = Number((mpl1 + mpl2 + mpl3 + mpl4).toFixed(2));

    // Kontribusi Murni DPL 50% & MPL 50% (Sesuai Arahan Pak Agus Mulyana)
    const wDpl = 0.5;
    const wMpl = 0.5;
    const kontribusiDpl = Number((subtotalDpl * 0.5).toFixed(2));
    const kontribusiMitra = Number((subtotalMitra * 0.5).toFixed(2));

    let composite = 0;
    if (activeStudent && (activeStudent.isFinalized || activeStudent.status === "FINAL") && activeStudent.nilaiAkhir > 0) {
      // Jika kedua evaluator telah memiliki skor atau sedang dihitung ulang, tampilkan akumulasi riil
      if (subtotalDpl > 0 && subtotalMitra > 0) {
        composite = Number((kontribusiDpl + kontribusiMitra).toFixed(2));
      } else {
        composite = activeStudent.nilaiAkhir;
      }
    } else if (subtotalDpl > 0 && subtotalMitra > 0) {
      composite = Number((kontribusiDpl + kontribusiMitra).toFixed(2));
    } else if (subtotalDpl > 0) {
      composite = kontribusiDpl;
    } else if (subtotalMitra > 0) {
      composite = kontribusiMitra;
    }

    return {
      dplScores: [dpl1, dpl2, dpl3, dpl4, dpl5, dpl6],
      subtotalDpl,
      kontribusiDpl,
      mplScores: [mpl1, mpl2, mpl3, mpl4],
      subtotalMitra,
      kontribusiMitra,
      composite,
    };
  }, [formScores, bobotDpl, bobotMpl, activeStudent]);

  // Handle Input Change for Scores
  const handleScoreChange = (key: keyof typeof formScores, val: string) => {
    if (val === "") {
      setFormScores((prev) => ({ ...prev, [key]: "" }));
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      const clamped = Math.max(0, Math.min(100, num));
      setFormScores((prev) => ({ ...prev, [key]: clamped }));
    }
  };

  // Save or Finalize Penilaian to Database
  const handleSave = async (isFinalize: boolean = false) => {
    if (isPimpinan) {
      toast.error(
        "Role Pimpinan hanya memiliki akses View-Only dan tidak dapat menyimpan penilaian"
      );
      return;
    }

    if (!activeStudent) {
      toast.error("Pilih mahasiswa terlebih dahulu");
      return;
    }

    if (isFinalize) {
      let confirmText =
        "Apakah Anda yakin ingin memfinalisasi penilaian mahasiswa ini secara resmi? Nilai yudisium akan dikunci untuk penerbitan E-Sertifikat.";
      if (computedScores.subtotalMitra === 0) {
        confirmText =
          "Mitra Lapangan (MPL) belum mengisi penilaian. Finalisasi mandiri oleh DPL akan menetapkan 100% evaluasi akademik DPL sebagai nilai akhir yudisium mahasiswa.\n\nLanjutkan finalisasi?";
      }
      if (!window.confirm(confirmText)) return;
    }

    setSaving(true);
    setIsFinalizing(isFinalize);
    try {
      const parseNum = (v: number | string) => (v === "" ? 0 : Number(v));

      const payload: any = {
        studentId: activeStudent.studentId,
        isFinalizeAction: isFinalize,
      };

      if (isMplUser || isAdminTeknis || evaluatorTab === "MPL") {
        payload.skorMitraKehadiran = parseNum(formScores.skorMitraKehadiran);
        payload.skorMitraWargaBinaan = parseNum(formScores.skorMitraWargaBinaan);
        payload.skorMitraProker = parseNum(formScores.skorMitraProker);
        payload.skorMitraKomunikasi = parseNum(formScores.skorMitraKomunikasi);
        payload.skorMitraTanggungJawab = parseNum(formScores.skorMitraTanggungJawab);
        payload.skorMitraBuktiKegiatan = parseNum(formScores.skorMitraBuktiKegiatan);
        payload.skorMitraDampak = parseNum(formScores.skorMitraDampak);
        payload.skorMitraInisiatif = parseNum(formScores.skorMitraInisiatif);
        payload.catatanMitra = formScores.catatanMitra;
      }

      if (isDplUser || isAdminTeknis || evaluatorTab === "DPL") {
        payload.skorDplPerencanaan = parseNum(formScores.skorDplPerencanaan);
        payload.skorDplKontribusi = parseNum(formScores.skorDplKontribusi);
        payload.skorDplLogbook = parseNum(formScores.skorDplLogbook);
        payload.skorDplAnalisis = parseNum(formScores.skorDplAnalisis);
        payload.skorDplOutput = parseNum(formScores.skorDplOutput);
        payload.skorDplLaporanAkhir = parseNum(formScores.skorDplLaporanAkhir);
        payload.catatanDpl = formScores.catatanDpl;
      }

      if (isFinalize) {
        await penilaianKknApiService.finalizePenilaian(payload);
        toast.success("Penilaian berhasil difinalisasi dan dikunci resmi!");
      } else {
        await penilaianKknApiService.savePenilaian(payload);
        toast.success("Draf penilaian berhasil disimpan ke database!");
      }
      await fetchStudents();
      handleCloseModal();
    } catch (err: any) {
      console.error("Save/Finalize error:", err);
      toast.error(err.response?.data?.message || err.message || "Gagal menyimpan penilaian");
    } finally {
      setSaving(false);
      setIsFinalizing(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-800 dark:text-slate-100 max-w-[1600px] mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <Award className="text-[#009966] w-6 h-6 shrink-0" />
              <span>Penilaian Individu Mahasiswa KKN</span>
            </h1>
            {isPimpinan && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                Mode Pemantauan: View-Only
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Komposisi terintegrasi:{" "}
            <strong className="text-emerald-700 dark:text-emerald-400">
              {bobotDpl}% Dosen Pembimbing (DPL)
            </strong>{" "}
            +{" "}
            <strong className="text-sky-700 dark:text-sky-400">
              {bobotMpl}% Mitra Lapangan (MPL)
            </strong>
          </p>
        </div>

        {isMplUser && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs font-bold">
            <Building2 size={16} />
            <span>Portal Penilai: Mitra Pembimbing Lapangan (MPL Kelurahan)</span>
          </div>
        )}

        {isPimpinan && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <AlertCircle size={16} />
            <span>Portal Pemantauan Eksekutif</span>
          </div>
        )}
      </div>

      {isPimpinan && (
        <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <strong className="block font-bold text-[13px]">
                Mode Akses Pemantauan Eksekutif (View-Only)
              </strong>
              <span>
                Sebagai Pimpinan, Anda memiliki hak akses pemantauan terhadap seluruh data penilaian
                mahasiswa KKN tanpa hak mengubah maupun menyimpan nilai.
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-200/60 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 border border-amber-300 shrink-0">
            VIEW-ONLY
          </span>
        </div>
      )}

      {/* Metric Cards KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
            Total Mahasiswa
          </span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {stats.total}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
            Yudisium Final
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.finalCount}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold block">
            Lengkap (DPL &amp; MPL)
          </span>
          <p className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
            {stats.lengkap}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold block">
            Menunggu MPL
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats.menungguMpl}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] text-[#009966] dark:text-emerald-400 font-semibold block">
            Rerata Nilai Mahasiswa
          </span>
          <p className="text-xl sm:text-2xl font-black text-[#009966] dark:text-emerald-400 mt-1">
            {stats.avgScore > 0 ? stats.avgScore.toFixed(2) : "—"}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3.5">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari NIM, nama, prodi, kelurahan..."
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          {/* Filter Kelompok */}
          <div className="w-full sm:w-48">
            <select
              value={filterKelompok}
              onChange={(e) => setFilterKelompok(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition cursor-pointer"
            >
              <option value="ALL">Semua Kelompok</option>
              {uniqueKelompokList.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="w-full sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] transition cursor-pointer"
            >
              <option value="ALL">Semua Status Penilaian</option>
              <option value="FINAL">Yudisium Final / Terkunci</option>
              <option value="LENGKAP">Lengkap (DPL &amp; MPL)</option>
              <option value="MENUNGGU_MPL">Menunggu Nilai MPL</option>
              <option value="MENUNGGU_DPL">Menunggu Nilai DPL</option>
              <option value="BELUM_DINILAI">Belum Dinilai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Full-Width Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-[#009966]" size={32} />
            <span className="text-xs font-semibold">
              Memuat data rekapitulasi penilaian mahasiswa...
            </span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <EmptyTableState
            entityName="Mahasiswa"
            isSearch={!!(searchQuery || filterKelompok !== "ALL" || filterStatus !== "ALL")}
            searchQuery={searchQuery}
            onResetSearch={() => {
              setSearchQuery("");
              setFilterKelompok("ALL");
              setFilterStatus("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/90 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Mahasiswa</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Kelompok &amp; Wilayah</th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">
                    <div>Nilai DPL (50%)</div>
                    <span className="text-[9.5px] font-normal text-slate-400 normal-case">
                      Skala 0–100
                    </span>
                  </th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">
                    <div>Nilai MPL (50%)</div>
                    <span className="text-[9.5px] font-normal text-slate-400 normal-case">
                      Skala 0–100
                    </span>
                  </th>
                  <th className="py-3.5 px-4 text-center min-w-[120px]">
                    <div>Nilai Akhir</div>
                    <span className="text-[9.5px] font-normal text-slate-400 normal-case">
                      Komposit 50:50
                    </span>
                  </th>
                  <th className="py-3.5 px-4 text-center min-w-[150px]">Status Penilaian</th>
                  <th className="py-3.5 px-4 text-center min-w-[120px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedStudents.map((s, idx) => {
                  const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;

                  const isFinalized = Boolean(s.isFinalized || s.status === "FINAL");
                  const hasDpl = s.subtotalDpl > 0;
                  const hasMitra = s.subtotalMitra > 0;
                  const dplWeight = 50;
                  const mplWeight = 50;
                  const dplKontribusi = Number((s.subtotalDpl * 0.5).toFixed(2));
                  const mitraKontribusi = Number((s.subtotalMitra * 0.5).toFixed(2));

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Belum Dinilai
                    </span>
                  );

                  if (isFinalized) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60">
                        <CheckCircle2 size={11} />
                        <span>Yudisium Final</span>
                      </span>
                    );
                  } else if (hasDpl && hasMitra) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                        <CheckCircle2 size={11} />
                        <span>Lengkap (DPL &amp; MPL)</span>
                      </span>
                    );
                  } else if (hasDpl && !hasMitra) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60">
                        <Clock size={11} />
                        <span>Menunggu MPL</span>
                      </span>
                    );
                  } else if (!hasDpl && hasMitra) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/60">
                        <Clock size={11} />
                        <span>Menunggu DPL</span>
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={s.studentId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors duration-150"
                    >
                      {/* 1. No */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-xs">
                        {rowNumber}
                      </td>

                      {/* 2. Mahasiswa Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {s.nama}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-slate-600 dark:text-slate-400">
                            {s.nim || "-"}
                          </span>
                          <span>&bull;</span>
                          <span>{s.jurusan || s.programStudi || "-"}</span>
                        </div>
                      </td>

                      {/* 3. Kelompok & Wilayah */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-semibold text-xs">
                          {s.kelompok || "-"}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {s.kelurahan ? `${s.kelurahan}` : ""}
                          {s.rw ? ` - RW ${s.rw}` : ""}
                        </div>
                      </td>

                      {/* 4. Nilai DPL (50%) */}
                      <td className="py-3.5 px-4 text-center">
                        {hasDpl ? (
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                            {s.subtotalDpl.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* 5. Nilai MPL (50%) */}
                      <td className="py-3.5 px-4 text-center">
                        {hasMitra ? (
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                            {s.subtotalMitra.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* 6. Nilai Akhir Komposit */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-mono font-black text-sm text-[#009966] dark:text-emerald-400">
                          {isFinalized && s.nilaiAkhir > 0
                            ? s.nilaiAkhir.toFixed(2)
                            : hasDpl && hasMitra
                              ? (dplKontribusi + mitraKontribusi).toFixed(2)
                              : hasDpl
                                ? dplKontribusi.toFixed(2)
                                : hasMitra
                                  ? mitraKontribusi.toFixed(2)
                                  : "0.00"}
                        </div>
                        {isFinalized ? (
                          <span className="text-[9.5px] text-purple-600 dark:text-purple-400 font-bold block">
                            (Mutu {s.kategoriNilai || "A"})
                          </span>
                        ) : (!hasDpl || !hasMitra) && (hasDpl || hasMitra) ? (
                          <span className="text-[9.5px] text-amber-600 dark:text-amber-400 font-medium block">
                            (Sementara {hasDpl ? "0.5×DPL" : "0.5×MPL"})
                          </span>
                        ) : null}
                      </td>

                      {/* 7. Status Penilaian */}
                      <td className="py-3.5 px-4 text-center">{statusBadge}</td>

                      {/* 9. Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(s)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isPimpinan
                              ? "border border-purple-600 text-purple-700 dark:text-purple-300 bg-white hover:bg-purple-50 dark:bg-slate-900 dark:hover:bg-purple-950/40 shadow-2xs"
                              : isFinalized
                                ? "border border-emerald-600 text-[#009966] dark:text-emerald-300 bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/40 shadow-2xs"
                                : "bg-[#009966] hover:bg-[#008055] text-white shadow-2xs"
                          }`}
                        >
                          {isPimpinan ? (
                            <Eye size={12} />
                          ) : isFinalized ? (
                            <Edit3 size={12} />
                          ) : (
                            <Edit3 size={12} />
                          )}
                          <span>
                            {isPimpinan
                              ? "Lihat Rincian"
                              : isFinalized
                                ? "Edit / Lihat Nilai"
                                : isMplUser
                                  ? "Nilai Lapangan"
                                  : "Beri Nilai"}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredStudents.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredStudents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
      </div>

      {/* POP-UP MODAL: FORM PENILAIAN INDIVIDU (50% DPL + 50% MPL) */}
      {isModalOpen && activeStudent && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[#009966] flex items-center justify-center shrink-0">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {isPimpinan
                      ? "Rincian Penilaian Individu Mahasiswa"
                      : "Form Penilaian Individu Mahasiswa"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Komposisi Transparan 50% Dosen Pembimbing Lapangan + 50% Mitra Kelurahan
                  </p>
                </div>
              </div>

              {/* Evaluator Tabs (Bidirectional View) */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEvaluatorTab("DPL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    evaluatorTab === "DPL"
                      ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <GraduationCap size={13} />
                  <span>Form DPL (50%)</span>
                  {computedScores.subtotalDpl > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEvaluatorTab("MPL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    evaluatorTab === "MPL"
                      ? "bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Building2 size={13} />
                  <span>Form MPL (50%)</span>
                  {computedScores.subtotalMitra > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
              {isStudentFinalized && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-300">
                  <CheckCircle2 size={16} className="shrink-0 text-[#009966] dark:text-emerald-400" />
                  <div>
                    <strong className="block font-bold">Penilaian Sudah Lengkap (FINAL)</strong>
                    <span>
                      {isPimpinan
                        ? "Seluruh komponen nilai mahasiswa telah terisi lengkap. Anda melihat rincian nilai ini dalam mode pemantauan."
                        : "Seluruh komponen nilai mahasiswa telah terisi lengkap. Sebagai penilai berwenang, Anda tetap dapat melakukan penyesuaian jika terdapat revisi nilai."}
                    </span>
                  </div>
                </div>
              )}

              {isPimpinan && !isStudentFinalized && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <AlertCircle
                    size={16}
                    className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400"
                  />
                  <div>
                    <strong className="block font-bold">Mode Akses View-Only</strong>
                    <span>
                      Sebagai Pimpinan, Anda melihat rincian penilaian dalam mode pemantauan murni.
                      Seluruh formulir penilaian dikunci.
                    </span>
                  </div>
                </div>
              )}

              {!isPimpinan && !isCurrentTabEditable && (
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <Eye size={15} className="shrink-0 text-slate-500" />
                  <span>
                    {evaluatorTab === "MPL"
                      ? "Mode Pratinjau Baca: Kolom penilaian lapangan ini khusus diisi oleh Mitra Lapangan (MPL / RW)."
                      : "Mode Pratinjau Baca: Kolom evaluasi akademik ini khusus diisi oleh Dosen Pembimbing (DPL)."}
                  </span>
                </div>
              )}

              {/* Student Detail Banner */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#009966]/10 border border-[#009966]/20 text-[#009966] flex items-center justify-center shrink-0">
                    <User size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                      {activeStudent.nama}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      NIM:{" "}
                      <strong className="text-slate-700 dark:text-slate-300 font-mono">
                        {activeStudent.nim || "-"}
                      </strong>{" "}
                      • {activeStudent.jurusan || activeStudent.programStudi || "S1 Teknik"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {activeStudent.kelompok || "Kelompok KKN"}
                  </div>
                  {activeStudent.kelurahan && (
                    <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Kel. {activeStudent.kelurahan}
                    </div>
                  )}
                </div>
              </div>

              {/* Real-Time Composite Contribution Preview Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-3.5">
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-200/60">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    Subtotal DPL ({bobotDpl}%)
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                      {computedScores.subtotalDpl.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-sky-200/60">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    Subtotal MPL ({bobotMpl}%)
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                      {computedScores.subtotalMitra.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/40 border border-emerald-300/60">
                  <span className="text-[10px] font-bold uppercase text-emerald-900 dark:text-emerald-200 tracking-wider">
                    Nilai Akhir Komposit
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-[#009966] dark:text-emerald-400 font-mono">
                      {computedScores.composite.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rubric Section based on Active Tab */}
              {evaluatorTab === "MPL" ? (
                /* === ASPEK PENILAIAN MITRA / MPL (4 ASPEK) === */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 size={14} className="text-sky-600" />
                        <span>4 Aspek Penilaian Mitra Pembimbing Lapangan (MPL)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Bobot akumulasi 100% (Kontribusi 50% terhadap nilai akhir mahasiswa)
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Rentang Nilai: 0 – 100
                    </span>
                  </div>

                  <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-sky-50/70 dark:bg-slate-800/90 text-slate-600 border-b border-slate-200 dark:border-slate-800 text-[10.5px] uppercase tracking-wider font-bold">
                          <th className="py-2.5 px-3 w-8 text-center">No</th>
                          <th className="py-2.5 px-3">Aspek Penilaian Lapangan</th>
                          <th className="py-2.5 px-3 text-center w-16">Bobot</th>
                          <th className="py-2.5 px-3 text-center w-28">Nilai (0-100)</th>
                          <th className="py-2.5 px-3 text-right w-20">Skor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {ASPEK_MITRA_CONFIG.map((aspek, idx) => {
                          const val = formScores[aspek.key];
                          const computedSkor = computedScores.mplScores[idx];

                          return (
                            <tr
                              key={aspek.key}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                            >
                              <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                                {aspek.no}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  {aspek.title}
                                </div>
                                <div className="text-[10.5px] text-slate-400 mt-0.5">
                                  {aspek.deskripsi}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-500 font-bold">
                                {aspek.bobot}%
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="inline-flex items-center gap-1 border rounded-xl px-2 py-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 transition">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    disabled={!isMplTabEditable}
                                    value={val}
                                    onChange={(e) => handleScoreChange(aspek.key, e.target.value)}
                                    placeholder="0"
                                    className="w-10 text-center text-xs font-black text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                  />
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    / 100
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-800 dark:text-slate-200">
                                {computedSkor.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Total Row */}
                        <tr className="bg-sky-50/50 dark:bg-slate-800/70 font-bold border-t border-slate-200 dark:border-slate-700">
                          <td
                            colSpan={2}
                            className="py-2.5 px-3 text-slate-700 dark:text-slate-300"
                          >
                            Total Bobot Penilaian MPL
                          </td>
                          <td className="py-2.5 px-3 text-center text-sky-600 dark:text-sky-400 font-black">
                            100%
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500 font-semibold text-[11px]">
                            Subtotal MPL:
                          </td>
                          <td className="py-2.5 px-3 text-right text-base font-black text-sky-600 dark:text-sky-400 font-mono">
                            {computedScores.subtotalMitra.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Catatan Evaluasi MPL */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText size={13} className="text-sky-600" />
                      <span>Catatan Evaluasi / Rekomendasi Mitra Pembimbing Lapangan (MPL)</span>
                    </label>
                    <textarea
                      rows={3}
                      disabled={!isMplTabEditable}
                      value={formScores.catatanMitra}
                      onChange={(e) =>
                        setFormScores((prev) => ({ ...prev, catatanMitra: e.target.value }))
                      }
                      placeholder="Tuliskan apresiasi, catatan keaktifan, atau masukan dari kelurahan untuk mahasiswa..."
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none transition resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              ) : (
                /* === ASPEK PENILAIAN AKADEMIK DPL (6 ASPEK) === */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap size={14} className="text-[#009966]" />
                        <span>6 Aspek Penilaian Akademik Dosen Pembimbing Lapangan (DPL)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Bobot akumulasi 100% (Kontribusi 50% terhadap nilai akhir mahasiswa)
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Rentang Nilai: 0 – 100
                    </span>
                  </div>

                  <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 dark:bg-slate-800/90 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[10.5px] uppercase tracking-wider font-bold">
                          <th className="py-2.5 px-3 w-8 text-center">No</th>
                          <th className="py-2.5 px-3">Aspek Penilaian Akademik</th>
                          <th className="py-2.5 px-3 text-center w-16">Bobot</th>
                          <th className="py-2.5 px-3 text-center w-28">Nilai (0-100)</th>
                          <th className="py-2.5 px-3 text-right w-20">Skor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {ASPEK_DPL_CONFIG.map((aspek, idx) => {
                          const val = formScores[aspek.key];
                          const computedSkor = computedScores.dplScores[idx];

                          return (
                            <tr
                              key={aspek.key}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                            >
                              <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                                {aspek.no}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  {aspek.title}
                                </div>
                                <div className="text-[10.5px] text-slate-400 mt-0.5">
                                  {aspek.deskripsi}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-500 font-bold">
                                {aspek.bobot}%
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="inline-flex items-center gap-1 border rounded-xl px-2 py-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs focus-within:ring-2 focus-within:ring-[#009966]/20 focus-within:border-[#009966] transition">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    disabled={!isDplTabEditable}
                                    value={val}
                                    onChange={(e) => handleScoreChange(aspek.key, e.target.value)}
                                    placeholder="0"
                                    className="w-10 text-center text-xs font-black text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                  />
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    / 100
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-800 dark:text-slate-200">
                                {computedSkor.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Total Row */}
                        <tr className="bg-slate-50/70 dark:bg-slate-800/70 font-bold border-t border-slate-200 dark:border-slate-700">
                          <td
                            colSpan={2}
                            className="py-2.5 px-3 text-slate-700 dark:text-slate-300"
                          >
                            Total Bobot Penilaian DPL
                          </td>
                          <td className="py-2.5 px-3 text-center text-[#009966] dark:text-emerald-400 font-black">
                            100%
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500 font-semibold text-[11px]">
                            Subtotal DPL:
                          </td>
                          <td className="py-2.5 px-3 text-right text-base font-black text-[#009966] dark:text-emerald-400 font-mono">
                            {computedScores.subtotalDpl.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Catatan Evaluasi DPL */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText size={13} className="text-[#009966]" />
                      <span>Catatan Evaluasi / Umpan Balik DPL</span>
                    </label>
                    <textarea
                      rows={3}
                      disabled={!isDplTabEditable}
                      value={formScores.catatanDpl}
                      onChange={(e) =>
                        setFormScores((prev) => ({ ...prev, catatanDpl: e.target.value }))
                      }
                      placeholder="Tuliskan catatan apresiasi, evaluasi akademik, atau rekomendasi untuk mahasiswa..."
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#009966]/20 focus:border-[#009966] rounded-2xl p-3.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none transition resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                {isStudentFinalized ? (
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                    <CheckCircle2 size={13} />
                    <span>Status: Lengkap &amp; Terfinalisasi (Dapat Diperbarui)</span>
                  </span>
                ) : isPimpinan ? (
                  <span>
                    Akses Pemantauan:{" "}
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">
                      Pimpinan / Eksekutif
                    </strong>
                  </span>
                ) : (
                  <span>
                    Sedang aktif:{" "}
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">
                      {evaluatorTab === "MPL" ? "Penilaian Lapangan MPL" : "Evaluasi Akademik DPL"}
                    </strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {isPimpinan ? (
                  <>
                    <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                      Mode Pemantauan (View-Only)
                    </span>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      Tutup
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Batal
                    </button>

                    {/* Tombol Simpan (jika tab aktif boleh diedit oleh user) */}
                    {isCurrentTabEditable && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSave(false)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold border border-emerald-600 text-[#009966] dark:text-emerald-400 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {saving && !isFinalizing ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Save size={14} />
                        )}
                        <span>{isStudentFinalized ? "Perbarui Nilai" : "Simpan Draf"}</span>
                      </button>
                    )}

                    {/* Tombol Finalisasi Nilai (khusus DPL & Admin) */}
                    {(isDplUser || isAdminTeknis) && (
                      <button
                        type="button"
                        disabled={saving || computedScores.subtotalDpl === 0}
                        onClick={() => handleSave(true)}
                        title={
                          computedScores.subtotalDpl === 0
                            ? "Isi evaluasi DPL terlebih dahulu sebelum finalisasi"
                            : "Kunci / sahkan nilai akhir mahasiswa untuk penerbitan sertifikat"
                        }
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#009966] hover:bg-[#008055] text-white shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {saving && isFinalizing ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            <span>{isStudentFinalized ? "Perbarui & Sahkan" : "Finalisasi Nilai"}</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenilaianKknMahasiswaPage;
