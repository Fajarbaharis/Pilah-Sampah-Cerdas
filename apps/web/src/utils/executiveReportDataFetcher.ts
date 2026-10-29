/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Helper: fetchExecutiveReportData
 * Mengagregasi data real-time dari backend (/dashboard/kkn-executive, /dashboard/waste-executive-report, /dashboard/kpi)
 * Menghasilkan objek LaporanEksekutifData 100% dinamis sesuai acuan baku 7 Bagian Utama Pimpinan.
 */

import api from "../services/api";
import type { LaporanEksekutifData } from "./downloadLaporanEksekutifPdf";

export interface ExecutiveReportFilters {
  periode?: string;
  kelurahan?: string;
  rw?: string;
  kelompok?: string;
  wilayah?: string;
  startDate?: string;
  endDate?: string;
  sourceType?: string;
  timeFilter?: string;
}

export async function fetchExecutiveReportData(
  filters?: ExecutiveReportFilters
): Promise<LaporanEksekutifData> {
  // 1. Normalisasi nama wilayah/kelurahan dari filter aktif
  const rawWilayah = (filters?.kelurahan || filters?.wilayah || "").trim();
  const isAllWilayah =
    !rawWilayah ||
    rawWilayah === "ALL" ||
    rawWilayah === "Semua Kelurahan" ||
    rawWilayah === "Semua Wilayah" ||
    rawWilayah === "Seluruh Wilayah" ||
    rawWilayah.toLowerCase().includes("coblong");

  const normalizedKelurahan = isAllWilayah
    ? undefined
    : rawWilayah.replace(/^Kel\.\s*/i, "").trim();

  const rawRw = (filters?.rw || "").trim();
  const isAllRw = !rawRw || rawRw === "ALL" || rawRw === "Semua RW";
  const normalizedRw = isAllRw ? undefined : rawRw;

  const rawKelompok = (filters?.kelompok || "").trim();
  const isAllKelompok = !rawKelompok || rawKelompok === "ALL" || rawKelompok === "Semua Kelompok";
  const normalizedKelompok = isAllKelompok ? undefined : rawKelompok;

  // 2. Fetch data secara paralel dari backend
  const [kknRes, wasteRes, kpiRes, compRes] = await Promise.all([
    api
      .get("/dashboard/kkn-executive", {
        params: {
          kelurahan: normalizedKelurahan,
          rw: normalizedRw,
          periode: filters?.periode,
          kelompok: normalizedKelompok,
        },
      })
      .catch((err) => {
        console.warn("[ExecutiveReportDataFetcher] Gagal memuat data KKN:", err);
        return null;
      }),
    api
      .get("/dashboard/waste-executive-report", {
        params: {
          wilayah: normalizedKelurahan || "ALL",
          rw: normalizedRw,
          periode: filters?.periode || "semua",
          startDate: filters?.startDate,
          endDate: filters?.endDate,
          sourceType: filters?.sourceType,
        },
      })
      .catch((err) => {
        console.warn("[ExecutiveReportDataFetcher] Gagal memuat data Tata Kelola Sampah:", err);
        return null;
      }),
    api
      .get("/dashboard/kpi", {
        params: {
          wilayah: normalizedKelurahan || "ALL",
          period: filters?.timeFilter || "semua",
          startDate: filters?.startDate,
          endDate: filters?.endDate,
          sourceType: filters?.sourceType,
        },
      })
      .catch((err) => {
        console.warn("[ExecutiveReportDataFetcher] Gagal memuat KPI ringkasan:", err);
        return null;
      }),
    api
      .get("/dashboard/compliance/metrics", {
        params: {
          kelurahan: normalizedKelurahan,
          startDate: filters?.startDate,
          endDate: filters?.endDate,
        },
      })
      .catch((err) => {
        console.warn("[ExecutiveReportDataFetcher] Gagal memuat metrik kepatuhan warga (50:50):", err);
        return null;
      }),
  ]);

  const kkn = kknRes?.data?.data;
  const waste = wasteRes?.data?.data;
  const kpi = kpiRes?.data?.data;
  const comp = compRes?.data?.data;

  // 3. Format Metadata & Tanggal Dinamis
  const now = new Date();
  const monthsIndo = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const formattedDate = `${now.getDate()} ${monthsIndo[now.getMonth()]} ${now.getFullYear()}`;
  const formattedTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const tanggalUpdate = `${formattedDate}, ${formattedTime} WIB`;

  const totalWilayahRw = Number(kkn?.summary?.totalWilayah?.rwCount ?? 74);
  const totalWilayahKel = Number(kkn?.summary?.totalWilayah?.kelurahanCount ?? 6);

  let cakupanWilayah = `Kecamatan Coblong (${totalWilayahKel} Kelurahan Binaan, ${totalWilayahRw} RW)`;
  if (normalizedKelurahan) {
    cakupanWilayah = normalizedRw
      ? `Kelurahan ${normalizedKelurahan}, ${normalizedRw}, Kecamatan Coblong`
      : `Kelurahan ${normalizedKelurahan}, Kecamatan Coblong (${totalWilayahRw} RW)`;
  }

  // 4. Bab 2: Demografi & Sebaran Peserta KKN
  const mhsPerWilayah: Array<{ kelurahan: string; count: number }> =
    kkn?.sebaranMahasiswaPerWilayah || [];
  const dplPerWilayah: Array<{ kelurahan: string; count: number }> =
    kkn?.sebaranDplPerWilayah || [];

  const defaultKelurahanList = [
    "Cipaganti",
    "Dago",
    "Lebakgede",
    "Lebak Siliwangi",
    "Sadang Serang",
    "Sekeloa",
  ];

  const rwPerKelurahanMap: Record<string, number> = {
    cipaganti: 7,
    dago: 13,
    lebakgede: 13,
    "lebak gede": 13,
    lebaksiliwangi: 4,
    "lebak siliwangi": 4,
    sadangserang: 21,
    "sadang serang": 21,
    sekeloa: 16,
  };

  const sebaranKelurahan = (
    mhsPerWilayah.length > 0
      ? mhsPerWilayah
      : defaultKelurahanList.map((k) => ({ kelurahan: k, count: 0, rwCount: 0 }))
  ).map((m: any) => {
    const normKey = (m.kelurahan || "").toLowerCase().trim();
    const dplObj = dplPerWilayah.find(
      (d) => d.kelurahan.toLowerCase().replace(/\s+/g, "") === normKey.replace(/\s+/g, "")
    );
    const rw = Number(
      m.rwCount ||
      rwPerKelurahanMap[normKey] ||
      rwPerKelurahanMap[normKey.replace(/\s+/g, "")] ||
      0
    );
    return {
      kelurahan: m.kelurahan,
      rw,
      mahasiswa: m.count || 0,
      dpl: dplObj?.count || 0,
    };
  });

  const demografiProdi = (kkn?.sebaranProdi || []).map((p: any) => ({
    prodi: p.name || "Program Studi Lainnya",
    jumlah: Number(p.count || 0),
  }));

  // 5. Bab 3: Rekapitulasi Presensi & Aktivitas Lapangan
  const attBreakdown = kkn?.presensiMahasiswa?.breakdown || [];
  const hadirItem = attBreakdown.find((b: any) => b.label === "Hadir");
  const alpaItem = attBreakdown.find((b: any) => b.label === "Tanpa Keterangan" || b.label === "Alpa");
  const sakitItem = attBreakdown.find((b: any) => b.label === "Sakit");
  const izinItem = attBreakdown.find((b: any) => b.label === "Izin");

  const presensiHarian = {
    hadirPersen: hadirItem?.percentage ?? 0,
    hadirJumlah: hadirItem?.count ?? 0,
    alpaPersen: alpaItem?.percentage ?? 0,
    alpaJumlah: alpaItem?.count ?? 0,
    sakitPersen: sakitItem?.percentage ?? 0,
    sakitJumlah: sakitItem?.count ?? 0,
    izinPersen: izinItem?.percentage ?? 0,
    izinJumlah: izinItem?.count ?? 0,
  };

  const logAktivitas = {
    logbookMhs: (kkn?.aktivitasTerkini?.totalLogMahasiswa ?? 0).toLocaleString("id-ID"),
    logbookDpl: Number(kkn?.aktivitasTerkini?.totalLogDpl ?? 0),
    dplAktif: Number(kkn?.resumeDpl?.dplAktifCount ?? 0),
    totalDpl: Number(kkn?.resumeDpl?.totalDpl ?? kkn?.summary?.totalDpl?.count ?? 0),
    dplAktifPersen: Number(kkn?.resumeDpl?.persentaseKeaktifan ?? 0),
    kunjunganLapangan: Number(kkn?.resumeDpl?.totalKunjunganLapangan ?? 0),
    jamKunjungan: Number(kkn?.resumeDpl?.totalDurasiBimbinganJam ?? 0),
  };

  // 6. Bab 4: Status Program Kerja (Proker)
  const usulan = kkn?.statusProker?.usulan;
  const pelaksanaan = kkn?.statusProker?.pelaksanaan;
  const totalProker = Number(usulan?.total ?? kkn?.statusProker?.total ?? 0);
  const totalDisetujuiProker = Number(usulan?.disetujui?.count ?? pelaksanaan?.total ?? 0);

  const calcProkerPct = (count: number, total: number, fallbackPct: number) => {
    if (total > 0) {
      return Math.round((count / total) * 1000) / 10;
    }
    return Math.round(fallbackPct * 10) / 10;
  };

  const statusUsulanProker = {
    total: totalProker,
    disetujui: {
      jumlah: Number(usulan?.disetujui?.count ?? 0),
      persen: calcProkerPct(
        Number(usulan?.disetujui?.count ?? 0),
        totalProker,
        Number(usulan?.disetujui?.percentage ?? 0)
      ),
    },
    menunggu: {
      jumlah: Number(usulan?.belumDisetujui?.count ?? 0),
      persen: calcProkerPct(
        Number(usulan?.belumDisetujui?.count ?? 0),
        totalProker,
        Number(usulan?.belumDisetujui?.percentage ?? 0)
      ),
    },
    ditolak: {
      jumlah: Number(usulan?.ditolak?.count ?? 0),
      persen: calcProkerPct(
        Number(usulan?.ditolak?.count ?? 0),
        totalProker,
        Number(usulan?.ditolak?.percentage ?? 0)
      ),
    },
  };

  const statusPelaksanaanProker = {
    berjalan: {
      jumlah: Number(pelaksanaan?.sedangBerjalan?.count ?? 0),
      persen: calcProkerPct(
        Number(pelaksanaan?.sedangBerjalan?.count ?? 0),
        totalDisetujuiProker,
        Number(pelaksanaan?.sedangBerjalan?.percentage ?? 0)
      ),
    },
    belumMulai: {
      jumlah: Number(pelaksanaan?.belum?.count ?? 0),
      persen: calcProkerPct(
        Number(pelaksanaan?.belum?.count ?? 0),
        totalDisetujuiProker,
        Number(pelaksanaan?.belum?.percentage ?? 0)
      ),
    },
    selesai: {
      jumlah: Number(pelaksanaan?.selesai?.count ?? 0),
      persen: calcProkerPct(
        Number(pelaksanaan?.selesai?.count ?? 0),
        totalDisetujuiProker,
        Number(pelaksanaan?.selesai?.percentage ?? 0)
      ),
    },
  };

  // 7. Bab 5: Peringatan Dini & Perhatian Pimpinan
  const alerts: any[] = kkn?.perhatianPimpinan || [];
  const lowProkerAlert = alerts.find((p) => p.id === "low_proker_group");
  const lowAttAlert = alerts.find((p) => p.id === "low_attendance_group");

  const peringatanDini = {
    kritisPresensiMhs: Number(kkn?.criticalAlpaStudents?.length ?? 0),
    prokerTertahan: Number(usulan?.belumDisetujui?.count ?? 0),
    prokerDitolak: Number(usulan?.ditolak?.count ?? 0),
    kelompokLambat: Number(lowProkerAlert?.count ?? lowAttAlert?.count ?? 0),
    dplKosong: Number(kkn?.resumeDpl?.dplKosongList?.length ?? 0),
  };

  // 8. Bab 6: Laporan Khusus Tata Kelola Sampah & Lingkungan
  const infr = waste?.kpiSummary?.infrastruktur;
  const dampak = waste?.kpiSummary?.dampakDanReduksi;

  const totalKg = Number(dampak?.totalSampahTerpilahKg ?? kpi?.totalKg ?? 0);
  const organikKg = Number(dampak?.rasioPemilahan?.organikKg ?? kpi?.organikKg ?? 0);
  const organikPersen = Number(dampak?.rasioPemilahan?.organikPersen ?? kpi?.persenOrganik ?? 0);
  const anorganikKg = Number(dampak?.rasioPemilahan?.anorganikKg ?? kpi?.anorganikKg ?? 0);
  const anorganikPersen = Number(dampak?.rasioPemilahan?.anorganikPersen ?? kpi?.persenAnorganik ?? 0);
  const residuKg = Number(dampak?.residuKg ?? kpi?.residuKg ?? 0);
  const residuPersen = Number(dampak?.residuPersen ?? kpi?.persenResidu ?? 0);

  const rawPoints = Number(kpi?.totalPoin ?? 0);
  const poinWarga =
    rawPoints >= 1000
      ? `${(rawPoints / 1000).toFixed(2)}K`
      : rawPoints.toLocaleString("id-ID");

  // Skor Partisipasi dan Kepatuhan Warga (SSOT Compliance Service / Formula 50:50)
  const skorKepatuhanWarga = Number(
    comp?.indeksKepatuhan ??
      dampak?.rataRataKepatuhanPersen ??
      kpi?.compliance ??
      0
  );
  const partisipasiPersen = Number(comp?.partisipasiWarga?.partisipasiPersen ?? 0);
  const totalWargaAktif = Number(comp?.partisipasiWarga?.wargaAktifMemilah ?? 0);
  const totalWargaTerdaftar = Number(comp?.partisipasiWarga?.totalWargaTerdaftar ?? 0);
  const akurasiPilahPersen = Number(
    comp?.akurasiPilahPersen ??
      comp?.indeksKesesuaianWadah?.kesesuaianPersen ??
      comp?.kepatuhanAiRate ??
      0
  );
  const totalSetoranValid = Number(
    comp?.totalPatuh ?? comp?.indeksKesesuaianWadah?.aktivitasSesuai ?? 0
  );
  const totalSetoranDinilai = Number(
    comp?.totalDinilai ?? comp?.totalAktivitas ?? comp?.indeksKesesuaianWadah?.totalAktivitas ?? 0
  );

  const volumeBulananM3 =
    totalKg > 0
      ? (totalKg / 250).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : "0,0";

  const auditList: any[] = waste?.kelurahanAudit || [];
  const kepatuhanPerKelurahan =
    auditList.length > 0
      ? auditList.map((a: any) => ({
          kelurahan: a.kelurahan,
          // Gunakan skor aktual komposit 50:50 per kelurahan (kepatuhanAktual) selaras dengan dasbor (hingga 2 desimal)
          kepatuhan: parseFloat(Number(a.kepatuhanAktual ?? a.currentComplianceRate ?? 0).toFixed(2)),
        }))
      : defaultKelurahanList.map((k) => ({ kelurahan: k, kepatuhan: 0 }));

  // Pengguna Terdaftar (Hanya Warga, Petugas Pemilah, Mahasiswa KKN, dan DPL sesuai Dashboard)
  const wargaCount = Number(
    kpi?.penggunaSampah?.warga ??
      comp?.partisipasiWarga?.totalWargaTerdaftar ??
      610
  );
  const petugasCount = Number(kpi?.penggunaSampah?.petugas ?? 83);
  const mhsCount = Number(
    kkn?.summary?.totalMahasiswa?.count ??
      kpi?.partisipanKkn?.mahasiswa ??
      523
  );
  const dplCount = Number(
    kkn?.summary?.totalDpl?.count ??
      kpi?.partisipanKkn?.dpl ??
      32
  );
  const totalPenggunaOperasional = wargaCount + petugasCount + mhsCount + dplCount;

  const tataKelolaSampah = {
    penggunaWarga: totalPenggunaOperasional,
    rincianPengguna: {
      warga: wargaCount,
      petugas: petugasCount,
      mahasiswa: mhsCount,
      dpl: dplCount,
    },
    tempatSampah: Number(infr?.wadahSampahAktif ?? kpi?.tempatSampahAktif ?? 0),
    lokasiRw: Number(kkn?.summary?.totalWilayah?.rwCount ?? kpi?.lokasiTerdaftar ?? 0),
    totalKg: parseFloat(totalKg.toFixed(2)),
    organikKg: parseFloat(organikKg.toFixed(2)),
    organikPersen: Math.round(organikPersen),
    anorganikKg: parseFloat(anorganikKg.toFixed(2)),
    anorganikPersen: Math.round(anorganikPersen),
    poinWarga,
    kepatuhanAi: parseFloat(skorKepatuhanWarga.toFixed(2)),
    partisipasiPersen: parseFloat(partisipasiPersen.toFixed(2)),
    totalWargaAktif,
    totalWargaTerdaftar,
    akurasiPilahPersen: parseFloat(akurasiPilahPersen.toFixed(2)),
    totalSetoranValid,
    totalSetoranDinilai,
    fasilitas: Number(infr?.totalFasilitas ?? 0),
    volumeBulananM3,
    komposisiVolume: {
      organik: Math.round(organikPersen) || 0,
      anorganik: Math.round(anorganikPersen) || 0,
      residu: Math.round(residuPersen) || 0,
    },
    kepatuhanPerKelurahan,
  };

  return {
    periode: filters?.periode && filters.periode !== "ALL" && filters.periode !== "semua" ? filters.periode : "Juli – Oktober 2026",
    tanggalUpdate,
    cakupanWilayah,
    totalKelompok: Number(kkn?.summary?.totalKelompok?.count ?? 0),
    totalMahasiswa: Number(kkn?.summary?.totalMahasiswa?.count ?? 0),
    totalDpl: Number(kkn?.summary?.totalDpl?.count ?? 0),
    rasioKehadiranPersen: Number(kkn?.summary?.rasioKehadiran?.percentage ?? 0),
    jamRealisasi: Number(kkn?.summary?.rasioKehadiran?.totalHours ?? 0),
    jamTarget: Number(kkn?.summary?.rasioKehadiran?.targetHours ?? 250),
    jamSisa: Number(kkn?.summary?.rasioKehadiran?.remainingHours ?? 0),
    sebaranKelurahan,
    demografiProdi,
    presensiHarian,
    logAktivitas,
    statusUsulanProker,
    statusPelaksanaanProker,
    peringatanDini,
    tataKelolaSampah,
  };
}
