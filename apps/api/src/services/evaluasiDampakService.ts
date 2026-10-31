import { prisma } from "../lib/prisma.js";

/**
 * Service layer untuk fitur Evaluasi Dampak KKN.
 * Mengelola data Baseline (dari SurveiKelurahan), Endline (EndlineSurveiKelurahan),
 * dan kalkulasi Komparasi Dampak.
 */
function normalizePercentage(val: any): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  if (isNaN(num)) return null;
  if (num > 0 && num <= 1.0) {
    return Number((num * 100).toFixed(2));
  }
  return Number(num.toFixed(2));
}

export const evaluasiDampakService = {
  /**
   * Mengambil data baseline (SurveiKelurahan) beserta relasi child.
   * Untuk DPL, data di-scope ke kelurahan kelompok dampingannya.
   */
  getBaselineData: async (userId: string, userRole: string) => {
    const whereClause = await buildKelurahanScope(userId, userRole);

    const data = await prisma.surveiKelurahan.findMany({
      where: whereClause,
      include: {
        pemilahanSampah: true,
        volumeSampah: true,
        bankSampahPengolahan: true,
        karakteristikWilayah: true,
        keyPlayers: true,
        catatanKesimpulan: true,
        validasiDpl: { select: { id: true, name: true } },
      },
      orderBy: { kelurahanId: "asc" },
    });

    return data;
  },

  /**
   * DPL memvalidasi atau merevisi data baseline kelurahan tertentu.
   */
  validateBaseline: async (
    dplUserId: string,
    kelurahanId: number,
    status: "VALID" | "REVISI",
    catatan?: string
  ) => {
    const survey = await prisma.surveiKelurahan.findUnique({
      where: { kelurahanId },
      select: { namaKelurahan: true },
    });
    if (!survey) throw new Error("SURVEI_NOT_FOUND");

    const kelompokDpl = await prisma.kelompokKkn.findMany({
      where: { dplId: dplUserId },
      select: { kelurahan: true },
    });
    const kelurahanNames = kelompokDpl.map((k) => k.kelurahan?.toLowerCase()).filter(Boolean);
    if (kelurahanNames.length > 0 && !kelurahanNames.includes(survey.namaKelurahan.toLowerCase())) {
      throw new Error("FORBIDDEN_SCOPE");
    }

    const updated = await prisma.surveiKelurahan.update({
      where: { kelurahanId },
      data: {
        statusValidasi: status,
        validasiDplId: dplUserId,
        catatanValidasi: catatan || null,
      },
    });

    return updated;
  },

  getEndlineById: async (kelurahanId: number) => {
    const endline = await prisma.endlineSurveiKelurahan.findUnique({
      where: { kelurahanId },
      include: {
        pemilahanSampah: true,
        volumeSampah: true,
        bankSampahPengolahan: true,
        catatanKesimpulan: true,
        validasiDpl: { select: { id: true, name: true } },
      },
    });

    if (!endline) {
      return null;
    }

    // Ambil data baseline kelurahan untuk mewarisi identitas wilayah resmi & karakteristik dasar
    const baseline = await prisma.surveiKelurahan.findUnique({
      where: { kelurahanId },
      include: {
        karakteristikWilayah: true,
        keyPlayers: true,
      },
    });

    // Ambil survei RW Endline untuk menghitung ringkasan cakupan lapangan riil
    const rwSurveys = await prisma.surveiRw.findMany({
      where: {
        kelurahan: { equals: endline.namaKelurahan, mode: "insensitive" },
        tahap: "Endline",
      },
      orderBy: { createdAt: "desc" },
    });

    // Deduplikasi RW (ambil survei terbaru per RW)
    const rwMap = new Map<string, (typeof rwSurveys)[0]>();
    rwSurveys.forEach((s) => {
      if (!rwMap.has(s.rw)) rwMap.set(s.rw, s);
    });
    const latestRw = Array.from(rwMap.values());

    let sumRt = 0;
    let sumKk = 0;
    let sumRumah = 0;
    latestRw.forEach((s) => {
      sumRt += s.jumlahRt || 0;
      sumKk += s.jumlahKk || 0;
      sumRumah += s.rumahTotal || 0;
    });

    // Kumpulkan key players jika ada dari survei RW Endline
    const rwKeyPlayers: any[] = [];
    latestRw.forEach((s) => {
      if (Array.isArray(s.keyPlayer)) {
        (s.keyPlayer as any[]).forEach((kp: any) => {
          if (kp && kp.nama && !rwKeyPlayers.some((existing) => existing.nama === kp.nama)) {
            rwKeyPlayers.push({
              id: `${s.id}-${kp.aktor || "aktor"}`,
              kelurahanId,
              jenisAktor: kp.aktor || null,
              nama: kp.nama,
              kontak: kp.kontak || null,
              peran: kp.peran || null,
            });
          }
        });
      }
    });

    // Susun karakteristik wilayah gabungan (jika ada input di RW, atau fallback ke baseline)
    let sumKos = 0;
    let sumUmkm = 0;
    const rwKarakterLain: string[] = [];

    latestRw.forEach((s) => {
      if (s.jumlahKos && s.jumlahKos > 0) sumKos += s.jumlahKos;
      if (s.jumlahUmkm && s.jumlahUmkm > 0) sumUmkm += s.jumlahUmkm;
      if (s.karakterLain && String(s.karakterLain).trim()) {
        rwKarakterLain.push(String(s.karakterLain).trim());
      }
    });

    const hasRwPadat = latestRw.some(
      (s) => Array.isArray(s.karakter) && (s.karakter as any[]).some((k) => /padat/i.test(String(k)))
    );
    const hasRwKos = latestRw.some(
      (s) => Array.isArray(s.karakter) && (s.karakter as any[]).some((k) => /kos/i.test(String(k))) || (s.jumlahKos && s.jumlahKos > 0)
    );
    const hasRwUmkm = latestRw.some(
      (s) =>
        Array.isArray(s.karakter) && (s.karakter as any[]).some((k) => /umkm|warung/i.test(String(k))) || (s.jumlahUmkm && s.jumlahUmkm > 0)
    );
    const hasRwKampus = latestRw.some(
      (s) => Array.isArray(s.karakter) && (s.karakter as any[]).some((k) => /kampus|sekolah/i.test(String(k)))
    );
    const hasRwPasar = latestRw.some(
      (s) => Array.isArray(s.karakter) && (s.karakter as any[]).some((k) => /pasar/i.test(String(k)))
    );
    const hasRwSungai = latestRw.some(
      (s) =>
        Array.isArray(s.karakter) && (s.karakter as any[]).some((k) => /sungai|bantaran/i.test(String(k)))
    );

    const baseKos = baseline?.karakteristikWilayah?.perkiraanJumlahKosKontrakan || "";
    const baseUmkm = baseline?.karakteristikWilayah?.perkiraanJumlahUmkmWarungKafe || "";
    const finalKos = sumKos > 0 ? String(sumKos) : baseKos;
    const finalUmkm = sumUmkm > 0 ? String(sumUmkm) : baseUmkm;

    const combinedKarakterLain = Array.from(
      new Set(
        [baseline?.karakteristikWilayah?.karakterLainnyaKeterangan, ...rwKarakterLain]
          .filter((item): item is string => Boolean(item && item.trim()))
      )
    ).join("; ");

    const karakteristikWilayah = baseline?.karakteristikWilayah
      ? {
          ...baseline.karakteristikWilayah,
          padatPenduduk:
            latestRw.length > 0
              ? hasRwPadat || baseline.karakteristikWilayah.padatPenduduk
              : baseline.karakteristikWilayah.padatPenduduk,
          banyakKosKontrakan:
            latestRw.length > 0
              ? hasRwKos || baseline.karakteristikWilayah.banyakKosKontrakan
              : baseline.karakteristikWilayah.banyakKosKontrakan,
          banyakUmkmWarungKafe:
            latestRw.length > 0
              ? hasRwUmkm || baseline.karakteristikWilayah.banyakUmkmWarungKafe
              : baseline.karakteristikWilayah.banyakUmkmWarungKafe,
          dekatKampusSekolah:
            latestRw.length > 0
              ? hasRwKampus || baseline.karakteristikWilayah.dekatKampusSekolah
              : baseline.karakteristikWilayah.dekatKampusSekolah,
          pasar:
            latestRw.length > 0
              ? hasRwPasar || baseline.karakteristikWilayah.pasar
              : baseline.karakteristikWilayah.pasar,
          bantaranSungai:
            latestRw.length > 0
              ? hasRwSungai || baseline.karakteristikWilayah.bantaranSungai
              : baseline.karakteristikWilayah.bantaranSungai,
          karakterLainnyaFlag: Boolean(combinedKarakterLain) || baseline.karakteristikWilayah.karakterLainnyaFlag,
          karakterLainnyaKeterangan: combinedKarakterLain || baseline.karakteristikWilayah.karakterLainnyaKeterangan || null,
          perkiraanJumlahKosKontrakan: finalKos || null,
          perkiraanJumlahUmkmWarungKafe: finalUmkm || null,
        }
      : latestRw.length > 0
        ? {
            id: kelurahanId,
            kelurahanId,
            padatPenduduk: hasRwPadat,
            banyakKosKontrakan: hasRwKos,
            banyakUmkmWarungKafe: hasRwUmkm,
            dekatKampusSekolah: hasRwKampus,
            pasar: hasRwPasar,
            bantaranSungai: hasRwSungai,
            karakterLainnyaFlag: Boolean(combinedKarakterLain),
            karakterLainnyaKeterangan: combinedKarakterLain || null,
            perkiraanJumlahKosKontrakan: finalKos || null,
            perkiraanJumlahUmkmWarungKafe: finalUmkm || null,
          }
        : null;

    const keyPlayers = rwKeyPlayers.length > 0 ? rwKeyPlayers : (baseline?.keyPlayers || []);

    return {
      ...endline,
      jumlahRw: latestRw.length > 0 ? latestRw.length : (baseline?.jumlahRw ?? null),
      jumlahRt: sumRt > 0 ? sumRt : (baseline?.jumlahRt ?? null),
      jumlahKk: sumKk > 0 ? sumKk : (baseline?.jumlahKk ?? null),
      jumlahRumahTotal: sumRumah > 0 ? sumRumah : (baseline?.jumlahRumahTotal ?? null),
      titikKumpulMahasiswa: baseline?.titikKumpulMahasiswa ?? null,
      karakteristikWilayah,
      keyPlayers,
    };
  },

  /**
   * Mengambil data endline (EndlineSurveiKelurahan) beserta relasi child.
   */
  getEndlineData: async (
    userId: string,
    userRole: string,
    page: number = 1,
    limit: number = 10,
    search: string = ""
  ) => {
    const baseWhereClause = await buildKelurahanScope(userId, userRole);

    // Add search condition
    const whereClause = {
      ...baseWhereClause,
      ...(search ? { namaKelurahan: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.endlineSurveiKelurahan.findMany({
        where: whereClause,
        include: {
          pemilahanSampah: true,
          volumeSampah: true,
          bankSampahPengolahan: true,
          catatanKesimpulan: true,
          validasiDpl: { select: { id: true, name: true } },
        },
        orderBy: { kelurahanId: "asc" },
        skip,
        take: limit,
      }),
      prisma.endlineSurveiKelurahan.count({ where: whereClause }),
    ]);

    // Enrich dengan metrik RW & RT real-time dari survei_rw
    const enrichedData = await Promise.all(
      data.map(async (item) => {
        try {
          const rwSurveys = await prisma.surveiRw.findMany({
            where: {
              kelurahan: { equals: item.namaKelurahan, mode: "insensitive" },
              tahap: "Endline",
            },
            select: { rw: true, jumlahRt: true, createdAt: true },
            orderBy: { createdAt: "desc" },
          });

          const uniqueRw = new Map<string, number>();
          rwSurveys.forEach((s) => {
            if (!uniqueRw.has(s.rw)) {
              uniqueRw.set(s.rw, s.jumlahRt || 0);
            }
          });

          const jumlahRw = uniqueRw.size;
          let jumlahRt = 0;
          uniqueRw.forEach((rtCount) => {
            jumlahRt += rtCount;
          });

          return {
            ...item,
            jumlahRw,
            jumlahRt,
          };
        } catch {
          return {
            ...item,
            jumlahRw: 0,
            jumlahRt: 0,
          };
        }
      })
    );

    return {
      data: enrichedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * DPL memvalidasi atau merevisi data endline kelurahan tertentu.
   */
  validateEndline: async (
    dplUserId: string,
    kelurahanId: number,
    status: "VALID" | "REVISI",
    catatan?: string
  ) => {
    const endline = await prisma.endlineSurveiKelurahan.findUnique({
      where: { kelurahanId },
      select: { namaKelurahan: true },
    });
    if (!endline) throw new Error("SURVEI_NOT_FOUND");

    const kelompokDpl = await prisma.kelompokKkn.findMany({
      where: { dplId: dplUserId },
      select: { kelurahan: true },
    });
    const kelurahanNames = kelompokDpl.map((k) => k.kelurahan?.toLowerCase()).filter(Boolean);
    if (
      kelurahanNames.length > 0 &&
      !kelurahanNames.includes(endline.namaKelurahan.toLowerCase())
    ) {
      throw new Error("FORBIDDEN_SCOPE");
    }

    const updated = await prisma.endlineSurveiKelurahan.update({
      where: { kelurahanId },
      data: {
        statusValidasi: status,
        validasiDplId: dplUserId,
        catatanValidasi: catatan || null,
      },
    });

    return updated;
  },

  /**
   * Mengambil data komparasi dampak (Baseline vs Endline) per kelurahan.
   * Menghitung delta persentase pemilahan, volume sampah, dan bank sampah aktif.
   */
  getKomparasiDampak: async (userId: string, userRole: string) => {
    const whereClause = await buildKelurahanScope(userId, userRole);

    const [baselineData, endlineData] = await Promise.all([
      prisma.surveiKelurahan.findMany({
        where: whereClause,
        include: {
          pemilahanSampah: true,
          volumeSampah: true,
          bankSampahPengolahan: true,
          catatanKesimpulan: true,
        },
        orderBy: { kelurahanId: "asc" },
      }),
      prisma.endlineSurveiKelurahan.findMany({
        where: whereClause,
        include: {
          pemilahanSampah: true,
          volumeSampah: true,
          bankSampahPengolahan: true,
          catatanKesimpulan: true,
        },
        orderBy: { kelurahanId: "asc" },
      }),
    ]);

    // Merge baseline dan endline per kelurahanId (Full Outer Map)
    const baselineMap = new Map(baselineData.map((b) => [b.kelurahanId, b]));
    const endlineMap = new Map(endlineData.map((e) => [e.kelurahanId, e]));

    // Himpun seluruh kelurahanId yang ada di Baseline maupun Endline
    const allKelurahanIds = Array.from(
      new Set([...baselineMap.keys(), ...endlineMap.keys()])
    ).sort((a, b) => a - b);

    // Helper untuk menghitung jumlah kegiatan pemanfaatan sampah aktif
    const countKegiatan = (bs: any) => {
      if (!bs) return null;
      let count = 0;
      if (bs.bioporiLoseda) count++;
      if (bs.ecobrickKerajinanDaurUlang) count++;
      if (bs.buruanSae) count++;
      if (bs.pengepulMitraDaurUlang) count++;
      if (bs.digitalisasiData) count++;
      if (
        bs.jumlahUnitKomposter &&
        bs.jumlahUnitKomposter !== "0" &&
        bs.jumlahUnitKomposter !== "-"
      )
        count++;
      if (
        bs.jumlahTitikMaggotBsf &&
        bs.jumlahTitikMaggotBsf !== "0" &&
        bs.jumlahTitikMaggotBsf !== "-"
      )
        count++;
      if (bs.bankSampahAktif && Number(bs.bankSampahAktif) > 0) count++;
      return count;
    };

    const komparasi = allKelurahanIds.map((kelurahanId) => {
      const baseline: any = baselineMap.get(kelurahanId) || null;
      const endline: any = endlineMap.get(kelurahanId) || null;

      const namaKelurahan =
        baseline?.namaKelurahan || endline?.namaKelurahan || `Kelurahan ${kelurahanId}`;
      const kecamatan = baseline?.kecamatan || endline?.kecamatan || "Coblong";

      const baselinePemilahan = normalizePercentage(baseline?.pemilahanSampah?.persentasePemilahan);
      const endlinePemilahan = normalizePercentage(endline?.pemilahanSampah?.persentasePemilahan);

      const baselineVolume = baseline?.volumeSampah?.totalVolumeKgPerHari
        ? Number(baseline.volumeSampah.totalVolumeKgPerHari)
        : null;
      const endlineVolume = endline?.volumeSampah?.totalVolumeKgPerHari
        ? Number(endline.volumeSampah.totalVolumeKgPerHari)
        : null;

      const baselineKegiatan = countKegiatan(baseline?.bankSampahPengolahan);
      const endlineKegiatan = endline ? countKegiatan(endline.bankSampahPengolahan) : null;

      // Target standar DLH/KKN: Pemilahan minimal 50% atau kenaikan +20% dari baseline
      const targetPemilahan =
        baselinePemilahan !== null ? Math.max(50, baselinePemilahan + 20) : 50;
      const deltaPemilahan =
        baselinePemilahan !== null && endlinePemilahan !== null
          ? Number((endlinePemilahan - baselinePemilahan).toFixed(2))
          : null;
      const isTargetPemilahanTercapai =
        endlinePemilahan !== null
          ? endlinePemilahan >= targetPemilahan || (deltaPemilahan !== null && deltaPemilahan > 0)
          : false;

      const deltaVolume =
        baselineVolume !== null && endlineVolume !== null
          ? Number((endlineVolume - baselineVolume).toFixed(2))
          : null;

      const deltaKegiatan =
        baselineKegiatan !== null && endlineKegiatan !== null
          ? endlineKegiatan - baselineKegiatan
          : null;

      const evaluasiText =
        endline?.catatanKesimpulan?.prioritasIntervensi ||
        baseline?.catatanKesimpulan?.prioritasIntervensi ||
        "Evaluasi efektivitas intervensi pemilahan sampah organik dan anorganik di wilayah kelurahan.";

      const rekomendasiText =
        endline?.catatanKesimpulan?.catatanTambahanRisikoSosial ||
        baseline?.catatanKesimpulan?.catatanTambahanRisikoSosial ||
        "Rekomendasi penguatan bank sampah unit dan konsistensi edukasi pemilahan level RT/RW.";

      return {
        kelurahanId,
        namaKelurahan,
        kecamatan,
        hasBaseline: baseline !== null,
        hasEndline: endline !== null,
        evaluasi: evaluasiText,
        rekomendasi: rekomendasiText,
        target: {
          persentasePemilahan: targetPemilahan,
          reduksiVolumeKg: baselineVolume ? Number((baselineVolume * 0.2).toFixed(2)) : 0,
        },
        hasilAktual: {
          pemilahan: endlinePemilahan ?? baselinePemilahan,
          volumeSampah: endlineVolume ?? baselineVolume,
          kegiatanPemanfaatan: endlineKegiatan ?? baselineKegiatan,
        },
        pemilahan: {
          baseline: baselinePemilahan,
          endline: endlinePemilahan,
          target: targetPemilahan,
          delta: deltaPemilahan,
          tercapai: isTargetPemilahanTercapai,
        },
        volumeSampah: {
          baseline: baselineVolume,
          endline: endlineVolume,
          delta: deltaVolume,
          tercapai: deltaVolume !== null ? deltaVolume <= 0 : false, // Reduksi berhasil jika delta <= 0
        },
        kegiatanPemanfaatan: {
          baseline: baselineKegiatan,
          endline: endlineKegiatan,
          delta: deltaKegiatan,
          tercapai: deltaKegiatan !== null ? deltaKegiatan >= 0 : false,
        },
        statusCapaian: isTargetPemilahanTercapai
          ? "TERCAPAI"
          : endline !== null
            ? "BELUM_TERCAPAI"
            : "PROSES_EVALUASI",
      };
    });

    return komparasi;
  },
};

/**
 * Membangun scope filter kelurahan berdasarkan role pengguna.
 * DPL hanya bisa melihat kelurahan yang menjadi area kelompok dampingannya.
 * SUPER_USER, PANITIA_TASKFORCE, PEMIMPIN bisa melihat semua.
 */
async function buildKelurahanScope(userId: string, userRole: string) {
  if (
    [
      "SUPER_USER",
      "DEVELOPER",
      "PANITIA_TASKFORCE",
      "PEMIMPIN",
      "PIMPINAN",
      "ADMIN_DLH",
      "CAMAT",
    ].includes(userRole)
  ) {
    return {}; // Semua kelurahan di wilayah Coblong
  }

  // LURAH: scope ke kelurahan tempatnya bertugas jika ada
  if (userRole === "LURAH") {
    const lurah = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        rw: {
          select: {
            kelurahan: { select: { name: true } },
          },
        },
      },
    });
    const kelName = lurah?.rw?.kelurahan?.name;
    if (kelName) {
      return {
        namaKelurahan: { equals: kelName, mode: "insensitive" as const },
      };
    }
    return {};
  }

  // DPL: scope ke kelurahan dari kelompok dampingan
  const kelompokDpl = await prisma.kelompokKkn.findMany({
    where: { dplId: userId },
    select: { kelurahan: true },
  });

  const kelurahanNames = kelompokDpl.map((k) => k.kelurahan).filter(Boolean) as string[];

  if (kelurahanNames.length === 0) {
    return { namaKelurahan: { in: [] } }; // Kosong — DPL belum punya kelompok
  }

  return {
    namaKelurahan: { in: kelurahanNames },
  };
}
