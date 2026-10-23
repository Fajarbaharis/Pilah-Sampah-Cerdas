/**
 * Project: BERSEKA.ID
 * Public Landing Page Component
 * 100% matched to official BERSEKA prototype with exact semantic classes,
 * fluid responsiveness, animated counters, interactive modals, and dynamic state.
 */

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";
import api from "../../services/api";
import {
  loadCmsContent,
  saveCmsContent,
  CMS_BROADCAST_CHANNEL_NAME,
  type LandingContentPayload,
  type MarketProductItem,
  type NewsArticleItem,
  type ActionCampaignItem,
} from "../../utils/cmsStorage";
import "./LandingPage.css";

interface ProgramItem {
  id: string;
  tag: string;
  title: string;
  desc: string;
  img: string;
  details: string;
  rw: string;
  team: string;
}

interface ProductItem {
  id: string;
  title: string;
  category: string;
  meta: string;
  img: string;
  desc: string;
  points: number;
}

interface NewsItem {
  id: string;
  title: string;
  date: string;
  category: string;
  img: string;
  desc: string;
  author: string;
  content?: string;
}

interface LandingStatsData {
  totalPengguna?: number;
  totalUsers?: number;
  kelurahanCount?: number;
  totalSampahKg?: number;
  sampahOrganikKg?: number;
  sampahAnorganikKg?: number;
  totalPoin?: number;
  kegiatanCount?: number;
  totalBinsCount?: number;
  assignedBinsCount?: number;
  smartIotBinsCount?: number;
  wasteTrendPercentage?: number;
  wasteTrendDirection?: "UP" | "DOWN" | "STABLE";
  poinRewardIde?: number;
  aisahStats?: {
    totalScans?: number;
    accuracyPercent?: number;
  };
}

// Konfigurasi koefisien kalkulator potensi reward sampah
const CALC_COEFFICIENTS = {
  organicPointsPerKg: 10,
  plasticPointsPerKg: 25,
  oilPointsPerLiter: 50,
  rupiahPerPoint: 100,
  co2ReductionFactors: {
    organic: 0.5,
    plastic: 1.5,
    oil: 2.0,
  },
};

const PRODUCT_IMAGE_FALLBACKS: Record<string, string> = {
  "prod-01": "/image/landingpage/prod-telur-ayam.webp",
  "prod-1": "/image/landingpage/prod-telur-ayam.webp",
  "prod-02": "/image/landingpage/prod-sayuran-segar.webp",
  "prod-2": "/image/landingpage/prod-sayuran-segar.webp",
  "prod-03": "/image/landingpage/prod-poc-500ml.webp",
  "prod-3": "/image/landingpage/prod-poc-500ml.webp",
  "prod-04": "/image/landingpage/prod-ikan-bioflok.webp",
  "prod-4": "/image/landingpage/prod-ikan-bioflok.webp",
  "prod-05": "/image/landingpage/prod-tas-anyaman.webp",
  "prod-5": "/image/landingpage/prod-tas-anyaman.webp",
  "prod-06": "/image/landingpage/prod-maggot-kering.webp",
  "prod-6": "/image/landingpage/prod-maggot-kering.webp",
};

const PROGRAM_IMAGE_FALLBACKS: Record<string, string> = {
  "camp-01": "/image/landingpage/prog-kodifikasi-qr.webp",
  "kodifikasi-qr": "/image/landingpage/prog-kodifikasi-qr.webp",
  "camp-02": "/image/landingpage/prog-gas-metana.webp",
  "gas-metana": "/image/landingpage/prog-gas-metana.webp",
  "camp-03": "/image/landingpage/prog-buruan-sae.webp",
  "buruan-sae": "/image/landingpage/prog-buruan-sae.webp",
  "camp-04": "/image/landingpage/prog-komposter-poc.webp",
  "komposter-poc": "/image/landingpage/prog-komposter-poc.webp",
  "camp-05": "/image/landingpage/prog-timbangan-digital.webp",
  "timbangan-digital": "/image/landingpage/prog-timbangan-digital.webp",
  "camp-06": "/image/landingpage/prog-produk-kreatif.webp",
  "produk-kreatif": "/image/landingpage/prog-produk-kreatif.webp",
};

const resolveProductImage = (item: MarketProductItem): string => {
  if (PRODUCT_IMAGE_FALLBACKS[item.id]) return PRODUCT_IMAGE_FALLBACKS[item.id];
  const titleLower = (item.title || "").toLowerCase();
  if (titleLower.includes("telur")) return "/image/landingpage/prod-telur-ayam.webp";
  if (titleLower.includes("sayur")) return "/image/landingpage/prod-sayuran-segar.webp";
  if (titleLower.includes("poc") || titleLower.includes("pupuk organik")) return "/image/landingpage/prod-poc-500ml.webp";
  if (titleLower.includes("bioflok") || titleLower.includes("ikan")) return "/image/landingpage/prod-ikan-bioflok.webp";
  if (titleLower.includes("kerajinan") || titleLower.includes("anyaman") || titleLower.includes("tas")) return "/image/landingpage/prod-tas-anyaman.webp";
  if (titleLower.includes("maggot")) return "/image/landingpage/prod-maggot-kering.webp";
  return item.imageUrl || "/image/landingpage/prod-telur-ayam.webp";
};

const resolveProductCategory = (item: MarketProductItem): string => {
  const cat = (item.category || "").toLowerCase();
  const label = (item.categoryLabel || "").toLowerCase();
  const title = (item.title || "").toLowerCase();

  if (cat.includes("pupuk") || cat.includes("kompos") || label.includes("pupuk") || label.includes("kompos") || title.includes("poc")) {
    return "Pupuk & Kompos";
  }
  if (cat.includes("eco") || cat.includes("enzyme") || label.includes("eco")) {
    return "Eco-Enzyme";
  }
  if (cat.includes("bibit") || cat.includes("tanaman") || cat.includes("sayur") || cat.includes("buah") || cat.includes("buruan") || label.includes("buruan")) {
    return "Bibit & Tanaman";
  }
  if (cat.includes("kerajinan") || cat.includes("daur") || cat.includes("kreatif") || label.includes("daur") || label.includes("kreatif")) {
    return "Daur Ulang Kreatif";
  }
  if (cat.includes("pakan") || cat.includes("maggot") || cat.includes("ikan") || cat.includes("telur") || cat.includes("daging") || cat.includes("pangan")) {
    return "Pakan Organik";
  }
  return item.categoryLabel || "Daur Ulang Kreatif";
};

const mapCmsProductToItem = (item: MarketProductItem): ProductItem => ({
  id: item.id,
  title: item.title,
  category: resolveProductCategory(item),
  meta: item.unit || `${item.stock || 0} Stok Tersedia`,
  img: resolveProductImage(item),
  desc: item.description || (item.benefits && item.benefits.length > 0 ? item.benefits.join(". ") : ""),
  points: typeof item.pricePoints === "number" ? item.pricePoints : 0,
});

const resolveProgramImage = (c: ActionCampaignItem): string => {
  if (PROGRAM_IMAGE_FALLBACKS[c.id]) return PROGRAM_IMAGE_FALLBACKS[c.id];
  const titleLower = (c.title || "").toLowerCase();
  if (titleLower.includes("qr") || titleLower.includes("kodifikasi")) return "/image/landingpage/prog-kodifikasi-qr.webp";
  if (titleLower.includes("gas") || titleLower.includes("metana")) return "/image/landingpage/prog-gas-metana.webp";
  if (titleLower.includes("buruan") || titleLower.includes("sae")) return "/image/landingpage/prog-buruan-sae.webp";
  if (titleLower.includes("komposter") || titleLower.includes("poc")) return "/image/landingpage/prog-komposter-poc.webp";
  if (titleLower.includes("timbangan") || titleLower.includes("digital")) return "/image/landingpage/prog-timbangan-digital.webp";
  if (titleLower.includes("kreatif") || titleLower.includes("produk") || titleLower.includes("pemanfaatan")) return "/image/landingpage/prog-produk-kreatif.webp";
  return c.imageUrl || "/image/landingpage/prog-kodifikasi-qr.webp";
};

const mapCmsCampaignToProgram = (c: ActionCampaignItem): ProgramItem => ({
  id: c.id,
  tag: c.categoryLabel || "Program KKN",
  title: c.title,
  desc: c.description,
  img: resolveProgramImage(c),
  details: c.impactHighlight || c.description,
  rw: c.location || "Kecamatan Coblong",
  team: c.initiator || "KKN UNIKOM 2026",
});

const mapCmsNewsToItem = (n: NewsArticleItem): NewsItem => ({
  id: n.id,
  title: n.title,
  date: n.date || "Terbaru",
  category: n.category || "Kabar Lingkungan",
  img: n.imageUrl || "/image/landingpage/news-rw11-dago.webp",
  desc: n.summary || (n.content ? n.content.slice(0, 140) + "..." : ""),
  content: n.content,
  author: n.author || "Tim BERSEKA",
});

const PROGRAMS: ProgramItem[] = [
  {
    id: "kodifikasi-qr",
    tag: "Identitas Digital",
    title: "Kodifikasi Tempat Sampah Berbasis QR",
    desc: "Setiap tempat sampah diberi kode QR sebagai identitas digital untuk mencatat pemilik, lokasi, jenis sampah, aktivitas pemilahan, dan riwayat pengangkutan.",
    img: "/image/landingpage/prog-kodifikasi-qr.webp",
    details: "Program ini membekali setiap tempat sampah warga dan fasilitas publik di RW se-Coblong dengan stiker QR tahan cuaca. Petugas pemilah memindai QR saat pengangkutan untuk memvalidasi pemilahan dan mencatat bobot setoran ke sistem poin.",
    rw: "Coblong (75 RW)",
    team: "Kelompok KKN 1–6 UNIKOM 2026"
  },
  {
    id: "gas-metana",
    tag: "IoT & Lingkungan",
    title: "Pemantauan Gas Metana di TPS Organik",
    desc: "Pemasangan sensor gas dan suhu pada komposter/TPS untuk mendeteksi pembentukan gas metana secara dini dan mencegah risiko ledakan atau bau berlebih.",
    img: "/image/landingpage/prog-gas-metana.webp",
    details: "Sistem sensor cerdas berbasis mikroprosesor memantau tingkat gas CH4 dan temperatur di pusat komposting RW, mengirimkan sinyal telemetri otomatis ke dashboard pengelola.",
    rw: "RW 11 Dago & RW 08 Sekeloa",
    team: "Tim IoT & Sensorik UNIKOM"
  },
  {
    id: "buruan-sae",
    tag: "Smart Farming",
    title: "IoT untuk Buruan SAE",
    desc: "Penyiraman otomatis dan sensor kelembapan tanah untuk kebun pangan warga yang memanfaatkan kompos dari hasil olahan sampah organik rumah tangga.",
    img: "/image/landingpage/prog-buruan-sae.webp",
    details: "Integrasi sistem irigasi otomatis dengan pupuk organik cair BERSEKA di kebun Buruan SAE binaan, memastikan hasil panen sayuran sehat untuk warga.",
    rw: "RW 03 Lebak Siliwangi & RW 05 Sekeloa",
    team: "Tim Buruan SAE KKN"
  },
  {
    id: "komposter-poc",
    tag: "Bioteknologi",
    title: "Komposter IoT untuk Pupuk Organik Cair",
    desc: "Komposter drum pintar dengan aerasi terjadwal yang memproses sisa makanan menjadi pupuk cair berkualitas dan siap dimanfaatkan kebun warga.",
    img: "/image/landingpage/prog-komposter-poc.webp",
    details: "Pengomposan anaerobik terkontrol yang mengalirkan lindi matang ke penampung mikro-filtrasi, menghasilkan Pupuk Organik Cair (POC) kaya nutrisi.",
    rw: "RW 08 Dago & RW 14 Sadang Serang",
    team: "Tim Bioteknologi Lingkungan"
  },
  {
    id: "timbangan-digital",
    tag: "Perangkat Keras",
    title: "Timbangan Digital untuk Petugas Sampah",
    desc: "Timbangan gantung terhubung Bluetooth/Wi-Fi yang otomatis mengirim berat sampah ke aplikasi BERSEKA tanpa perlu input manual oleh petugas.",
    img: "/image/landingpage/prog-timbangan-digital.webp",
    details: "Petugas menimbang sampah di depan rumah warga, data berat terkirim seketika via BLE ke ponsel petugas dan tercatat di riwayat setoran nasabah.",
    rw: "Armada GASLAH se-Coblong",
    team: "Tim Instrumentasi Digital"
  },
  {
    id: "produk-kreatif",
    tag: "Ekonomi Sirkular",
    title: "Pemanfaatan Sampah Menjadi Produk Kreatif",
    desc: "Pelatihan pengolahan kantong plastik kresek menjadi tas anyaman, ecobrick bernilai ekonomis, dan pakan maggot untuk peternakan ayam lokal.",
    img: "/image/landingpage/prog-produk-kreatif.webp",
    details: "Pemberdayaan kelompok ibu-ibu PKK dan pemuda karang taruna dalam kerajinan daur ulang bernilai tinggi yang langsung dipasarkan di Pasar BERSEKA.",
    rw: "RW 06 & RW 11 Coblong",
    team: "Tim Pemberdayaan Warga"
  }
];

const PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    title: "Telur Ayam BERSEKA",
    category: "Pupuk & Kompos",
    meta: "Kemasan 10 butir",
    img: "/image/landingpage/prod-telur-ayam.webp",
    desc: "Telur segar dari ayam yang diberi pakan maggot hasil biokonversi sampah organik warga.",
    points: 200
  },
  {
    id: "prod-2",
    title: "Sayuran Segar Buruan SAE",
    category: "Eco-Enzyme",
    meta: "1 Paket Sayuran",
    img: "/image/landingpage/prod-sayuran-segar.webp",
    desc: "Bayam, kangkung, dan pakcoy segar hasil pemupukan kompos dan pupuk organik BERSEKA.",
    points: 150
  },
  {
    id: "prod-3",
    title: "POC BERSEKA",
    category: "Bibit & Tanaman",
    meta: "Botol 500 ml",
    img: "/image/landingpage/prod-poc-500ml.webp",
    desc: "Pupuk Organik Cair murni dari komposter drum pintar IoT, mempercepat pertumbuhan tanaman.",
    points: 180
  },
  {
    id: "prod-4",
    title: "Ikan Bioflok BERSEKA",
    category: "Daur Ulang Kreatif",
    meta: "Kemasan 500 gram",
    img: "/image/landingpage/prod-ikan-bioflok.webp",
    desc: "Ikan konsumsi segar dari kolam bioflok ramah lingkungan berpakan pelet maggot mandiri.",
    points: 350
  },
  {
    id: "prod-5",
    title: "Kerajinan Daur Ulang BERSEKA",
    category: "Daur Ulang Kreatif",
    meta: "1 Produk",
    img: "/image/landingpage/prod-tas-anyaman.webp",
    desc: "Tas belanja modis dan pernak-pernik estetik hasil kreasi anyaman sampah plastik kresek.",
    points: 300
  },
  {
    id: "prod-6",
    title: "Maggot Kering BERSEKA",
    category: "Pakan Organik",
    meta: "Botol 500 gram",
    img: "/image/landingpage/prod-maggot-kering.webp",
    desc: "Pakan burung dan ikan berprotein tinggi dari larva BSF pengurai sampah sisa makanan.",
    points: 220
  }
];

const NEWS_LIST: NewsItem[] = [
  {
    id: "news-1",
    title: "Aktivitas KKN: RW 11/Kelurahan Dago/Kecamatan Coblong – Pemanfaatan",
    date: "16 Okt 2026",
    category: "Aktivitas KKN",
    img: "/image/landingpage/news-rw11-dago.webp",
    desc: "Uraian Aktivitas: Melaksanakan kegiatan Jumsih untuk menjaga kebersihan lingkungan RW 11, kemudian mengikuti diskusi bersama kelompok RW 13 ...",
    author: "Tim KKN Kelompok 4 Dago"
  },
  {
    id: "news-2",
    title: "Aktivitas KKN: RW 02 Kelurahan Sekeloa – Aksi Lingkungan",
    date: "16 Okt 2026",
    category: "Aksi Lingkungan",
    img: "/image/landingpage/news-buruan-sae.webp",
    desc: "Melaksanakan pembersihan area serta perawatan rutin tanaman di lahan Buruan Sae, meliputi penyiraman, pemangkasan, dan penataan pot guna men...",
    author: "Tim Pendampingan Lingkungan"
  },
  {
    id: "news-3",
    title: "Aktivitas KKN: RW 08 – Edukasi & Sosialisasi",
    date: "16 Okt 2026",
    category: "Edukasi & Sosialisasi",
    img: "/image/landingpage/news-petugas-gaslah.webp",
    desc: "Pada Jumat, 16 Oktober 2026, Kelompok 3 KKN Kelurahan Lebak Siliwangi membantu petugas GASLAH di RW 08 dalam proses pemilahan sampah berdasa...",
    author: "Satgas GASLAH Coblong"
  }
];

const FAQS = [
  {
    q: "Apa itu platform BERSEKA?",
    a: "BERSEKA (Bersih, Sehat, Kampung Asri) adalah platform terpadu pengelolaan sampah berbasis partisipasi warga, mahasiswa KKN, petugas armada GASLAH, pengolah sirkular, dan pemerintah di Kecamatan Coblong, Kota Bandung."
  },
  {
    q: "Bagaimana cara warga mendapatkan saldo poin BERSEKA?",
    a: "Setiap warga memilah sampah dari rumah dan menyerahkannya ke petugas saat jadwal penjemputan. Petugas memindai kode QR tempat sampah warga dan menimbang bobotnya dengan timbangan digital terhubung BLE. Poin akan otomatis tercatat di akun mobile warga."
  },
  {
    q: "Apa saja produk yang bisa ditukarkan dengan poin?",
    a: "Poin dapat ditukarkan di Pasar BERSEKA dengan produk ramah lingkungan seperti pupuk organik cair (POC), sayuran segar Buruan SAE, telur ayam berprotein maggot, ikan bioflok, hingga aneka kerajinan tas daur ulang bernilai ekonomis."
  },
  {
    q: "Bagaimana cara menggunakan fitur AISAh AI?",
    a: "Cukup buka menu AISAh di web atau aplikasi, izinkan akses kamera gawai Anda, dan arahkan kamera ke objek sampah. Teknologi Vision AI BERSEKA akan mendeteksi material objek dan memberi rekomendasi tempat sampah pemilahan yang sesuai secara seketika."
  },
  {
    q: "Di mana lokasi penukaran produk Pasar BERSEKA?",
    a: "Penukaran produk dapat dilakukan langsung di Posko KKN BERSEKA di kantor sekretariat RW setempat (Kecamatan Coblong, Kota Bandung) dengan menunjukkan kode unik penukaran dari aplikasi kepada petugas piket posko."
  }
];

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  // Scroll & Nav state
  const [isScrolled, setIsScrolled] = useState(false);
  const [isBantuanOpen, setIsBantuanOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("beranda");
  const [showTopBtn, setShowTopBtn] = useState(false);

  // Pasar filter state
  const [pasarFilter, setPasarFilter] = useState<string>("all");

  // Real backend & CMS data states
  const [landingStats, setLandingStats] = useState<LandingStatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [aisahRealtimeStats, setAisahRealtimeStats] = useState<{
    totalScans: number;
    accuracyPercent: number;
  }>({
    totalScans: 7738,
    accuracyPercent: 100.0,
  });

  // Dynamic content collections (with robust initial fallbacks)
  const [programsList, setProgramsList] = useState<ProgramItem[]>(PROGRAMS);
  const [productsList, setProductsList] = useState<ProductItem[]>(PRODUCTS);
  const [newsList, setNewsList] = useState<NewsItem[]>(NEWS_LIST);

  // Dynamic targets with graceful fallbacks
  const targetHero = useMemo(() => {
    const count = landingStats?.totalPengguna ?? landingStats?.totalUsers;
    return typeof count === "number" && count > 0 ? count : 1266;
  }, [landingStats]);

  const targetAisah = useMemo(() => {
    const count = landingStats?.aisahStats?.totalScans ?? aisahRealtimeStats.totalScans;
    return typeof count === "number" && count > 0 ? count : 7738;
  }, [landingStats, aisahRealtimeStats]);

  const aisahAccuracyPercent = useMemo(() => {
    const acc = landingStats?.aisahStats?.accuracyPercent ?? aisahRealtimeStats.accuracyPercent;
    return typeof acc === "number" && acc > 0 ? acc : 100.0;
  }, [landingStats, aisahRealtimeStats]);

  const kelurahanCount = useMemo(() => {
    const k = landingStats?.kelurahanCount;
    return typeof k === "number" && k > 0 ? k : 6;
  }, [landingStats]);

  // Animated counters
  const [heroCount, setHeroCount] = useState(0);
  const [aisahCount, setAisahCount] = useState(0);

  // Modals state
  const [showCalculatorModal, setShowCalculatorModal] = useState(
    typeof window !== "undefined" &&
      (window.location.pathname === "/kalkulator" || window.location.hash === "#kalkulator")
  );
  const [calcOrganicKg, setCalcOrganicKg] = useState<number>(5);
  const [calcPlasticKg, setCalcPlasticKg] = useState<number>(2);
  const [calcOilLiters, setCalcOilLiters] = useState<number>(1);

  const [showFaqModal, setShowFaqModal] = useState(
    typeof window !== "undefined" &&
      (window.location.pathname === "/faq" || window.location.hash === "#faq")
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const [selectedProgram, setSelectedProgram] = useState<ProgramItem | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [showAllNewsModal, setShowAllNewsModal] = useState(false);
  const [newsSearchTerm, setNewsSearchTerm] = useState("");

  const [exchangeModalProduct, setExchangeModalProduct] = useState<ProductItem | null>(null);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);
      setShowTopBtn(scrollY > 600);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver for scrollspy & reveal animations
  useEffect(() => {
    const sectionIds = ["beranda", "ekosistem", "program", "pasar", "aisah", "berita"];
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );

    sectionElements.forEach((el) => observer.observe(el));

    // Reveal elements observer
    const revealElements = document.querySelectorAll(".rv");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px" }
    );

    revealElements.forEach((el) => revealObserver.observe(el));

    return () => {
      observer.disconnect();
      revealObserver.disconnect();
    };
  }, []);

  // ── Load Dynamic Data (Backend Stats, AISAh AI Telemetry, CMS Content) ──
  useEffect(() => {
    let isMounted = true;
    let broadcastChannel: BroadcastChannel | null = null;

    const applyCmsContent = (content: LandingContentPayload) => {
      if (Array.isArray(content.marketProducts) && content.marketProducts.length > 0) {
        const published = content.marketProducts.filter((p) => p.isPublished !== false);
        if (published.length > 0) {
          setProductsList(published.map(mapCmsProductToItem));
        }
      }
      if (Array.isArray(content.newsItems) && content.newsItems.length > 0) {
        const published = content.newsItems.filter((n) => n.isPublished !== false);
        if (published.length > 0) {
          setNewsList(published.map(mapCmsNewsToItem));
        }
      }
      if (Array.isArray(content.actionCampaigns) && content.actionCampaigns.length > 0) {
        const published = content.actionCampaigns.filter((c) => c.isPublished !== false);
        if (published.length > 0) {
          setProgramsList(published.map(mapCmsCampaignToProgram));
        }
      }
    };

    // 1. Fetch live telemetry from microservice AISAh Vision AI
    const fetchAisahLive = async () => {
      try {
        const [scansRes, feedbackRes] = await Promise.allSettled([
          fetch("https://aisah.berseka.id/api/stats", { signal: AbortSignal.timeout(4000) }).then((r) => r.json()),
          fetch("https://aisah.berseka.id/api/stats/feedback", { signal: AbortSignal.timeout(4000) }).then((r) => r.json()),
        ]);

        let scans = 0;
        let accuracy = 0;

        if (scansRes.status === "fulfilled" && typeof scansRes.value?.total_scans === "number") {
          scans = scansRes.value.total_scans;
        }
        if (feedbackRes.status === "fulfilled" && typeof feedbackRes.value?.accuracy_percent === "number") {
          accuracy = feedbackRes.value.accuracy_percent;
        }

        if (isMounted && (scans > 0 || accuracy > 0)) {
          setAisahRealtimeStats((prev) => ({
            totalScans: scans > 0 ? scans : prev.totalScans,
            accuracyPercent: accuracy > 0 ? accuracy : prev.accuracyPercent,
          }));
        }
      } catch (err) {
        console.warn("[LandingPage] Live AISAh telemetry unavailable, fallback active:", err);
      }
    };

    // 2. Fetch aggregated statistics from Backend API
    const fetchStats = async () => {
      try {
        const res = await api.get("/system/landing-stats");
        if (isMounted && res.data?.success && res.data?.data) {
          const statsData = res.data.data;
          setLandingStats(statsData);
          if (statsData.aisahStats) {
            setAisahRealtimeStats((prev) => ({
              totalScans: statsData.aisahStats.totalScans || prev.totalScans,
              accuracyPercent: statsData.aisahStats.accuracyPercent ?? prev.accuracyPercent,
            }));
          }
        }
      } catch (err) {
        console.warn("[LandingPage] Backend landing stats API error, fallback active:", err);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    };

    // 3. Load CMS content (IndexedDB first, then backend /system/landing-content)
    const fetchContent = async () => {
      let localTimestamp = 0;
      try {
        const localStored = await loadCmsContent();
        if (isMounted && localStored?.data) {
          applyCmsContent(localStored.data);
          localTimestamp = localStored.lastModified || 0;
        }
      } catch (err) {
        console.warn("[LandingPage] Local CMS storage read error:", err);
      }

      try {
        const res = await api.get("/system/landing-content");
        if (isMounted && res.data?.success && res.data?.data) {
          const serverData = res.data.data;
          const serverTimestamp = serverData.lastModified || 0;
          if (serverTimestamp >= localTimestamp) {
            applyCmsContent(serverData);
            await saveCmsContent(serverData);
          }
        }
      } catch {
        // Offline / cached CMS is fine
      }
    };

    fetchStats();
    fetchAisahLive();
    fetchContent();

    // 4. Listen to real-time BroadcastChannel from SuperUser Kurasi tab
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        broadcastChannel = new BroadcastChannel(CMS_BROADCAST_CHANNEL_NAME);
        broadcastChannel.onmessage = (event) => {
          const detail = event?.data?.data || event?.data;
          if (isMounted && detail && typeof detail === "object") {
            applyCmsContent(detail);
          }
        };
      }
    } catch (e) {
      console.warn("[LandingPage] BroadcastChannel init error:", e);
    }

    return () => {
      isMounted = false;
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, []);

  // Counter animation smoothly interpolating to targetHero and targetAisah
  useEffect(() => {
    let startTimestamp: number | null = null;
    let animId: number;
    const duration = 1500;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setHeroCount(Math.round(targetHero * easeProgress));
      setAisahCount(Math.round(targetAisah * easeProgress));
      if (progress < 1) {
        animId = window.requestAnimationFrame(step);
      }
    };

    animId = window.requestAnimationFrame(step);
    return () => {
      if (animId) window.cancelAnimationFrame(animId);
    };
  }, [targetHero, targetAisah]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dd = document.getElementById("dd");
      if (dd && !dd.contains(e.target as Node)) {
        setIsBantuanOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Lock body scroll when drawer or modal is open
  useEffect(() => {
    const hasModal =
      isDrawerOpen ||
      showCalculatorModal ||
      showFaqModal ||
      selectedProgram !== null ||
      selectedNews !== null ||
      showAllNewsModal ||
      exchangeModalProduct !== null;

    document.body.style.overflow = hasModal ? "hidden" : "";
  }, [
    isDrawerOpen,
    showCalculatorModal,
    showFaqModal,
    selectedProgram,
    selectedNews,
    showAllNewsModal,
    exchangeModalProduct
  ]);

  // User display name from useAuthStore
  const userDisplayName = useMemo(() => {
    const name = user?.name || (user as any)?.nama || "";
    return name ? name.split(" ")[0] : "";
  }, [user]);

  // Modal close helpers with history URL cleanup
  const closeCalculator = () => {
    setShowCalculatorModal(false);
    if (typeof window !== "undefined" && (window.location.pathname === "/kalkulator" || window.location.hash === "#kalkulator")) {
      window.history.replaceState(null, "", "/");
    }
  };

  const closeFaq = () => {
    setShowFaqModal(false);
    if (typeof window !== "undefined" && (window.location.pathname === "/faq" || window.location.hash === "#faq")) {
      window.history.replaceState(null, "", "/");
    }
  };

  // Close modals & drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsBantuanOpen(false);
        setIsDrawerOpen(false);
        closeCalculator();
        closeFaq();
        setSelectedProgram(null);
        setSelectedNews(null);
        setShowAllNewsModal(false);
        setExchangeModalProduct(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Calculator calculations (menggunakan koefisien sentral)
  const calcTotalPoints = useMemo(() => {
    return (
      calcOrganicKg * CALC_COEFFICIENTS.organicPointsPerKg +
      calcPlasticKg * CALC_COEFFICIENTS.plasticPointsPerKg +
      calcOilLiters * CALC_COEFFICIENTS.oilPointsPerLiter
    );
  }, [calcOrganicKg, calcPlasticKg, calcOilLiters]);

  const calcEstimatedRupiah = useMemo(() => {
    return calcTotalPoints * CALC_COEFFICIENTS.rupiahPerPoint;
  }, [calcTotalPoints]);

  const calcCarbonReductionKg = useMemo(() => {
    const co2 =
      calcOrganicKg * CALC_COEFFICIENTS.co2ReductionFactors.organic +
      calcPlasticKg * CALC_COEFFICIENTS.co2ReductionFactors.plastic +
      calcOilLiters * CALC_COEFFICIENTS.co2ReductionFactors.oil;
    return co2.toFixed(1);
  }, [calcOrganicKg, calcPlasticKg, calcOilLiters]);

  return (
    <>
      {/* ===================== HEADER ===================== */}
      <header className={`hdr ${isScrolled ? "solid" : ""}`} id="hdr">
        <div className="wrap">
          <a className="brand" href="#beranda" aria-label="BERSEKA.ID — Beranda">
            <img src="/image/landingpage/berseka-icon-1.webp" alt="" width="38" height="38" />
            <b>
              BERSEKA<i>.ID</i>
            </b>
          </a>
          <nav className="nav" aria-label="Menu utama">
            <ul>
              <li>
                <a href="#beranda" className={activeSection === "beranda" ? "active" : ""}>
                  Beranda
                </a>
              </li>
              <li>
                <a href="#ekosistem" className={activeSection === "ekosistem" ? "active" : ""}>
                  Ekosistem
                </a>
              </li>
              <li>
                <a href="#program" className={activeSection === "program" ? "active" : ""}>
                  Program
                </a>
              </li>
              <li>
                <a href="#pasar" className={activeSection === "pasar" ? "active" : ""}>
                  Pasar BERSEKA
                </a>
              </li>
              <li>
                <a href="#aisah" className={activeSection === "aisah" ? "active" : ""}>
                  AISAh AI
                </a>
              </li>
              <li>
                <a href="#berita" className={activeSection === "berita" ? "active" : ""}>
                  Berita
                </a>
              </li>
              <li className={`dd ${isBantuanOpen ? "open" : ""}`} id="dd">
                <button
                  className="dd-btn"
                  aria-expanded={isBantuanOpen}
                  aria-controls="ddMenu"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBantuanOpen(!isBantuanOpen);
                  }}
                  onMouseEnter={() => setIsBantuanOpen(true)}
                >
                  Bantuan{" "}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <div className="dd-menu" id="ddMenu" onMouseLeave={() => setIsBantuanOpen(false)}>
                  <a
                    href="#faq"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsBantuanOpen(false);
                      setShowFaqModal(true);
                    }}
                  >
                    <span className="i">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01" />
                      </svg>
                    </span>
                    <span>
                      <b>FAQ</b>
                      <small>Pertanyaan yang sering diajukan</small>
                    </span>
                  </a>
                  <a
                    href="#kalkulator"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsBantuanOpen(false);
                      setShowCalculatorModal(true);
                    }}
                  >
                    <span className="i">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="5" y="2" width="14" height="20" rx="3" />
                        <path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8" />
                      </svg>
                    </span>
                    <span>
                      <b>Kalkulator BERSEKA</b>
                      <small>Hitung nilai &amp; dampak sampahmu</small>
                    </span>
                  </a>
                </div>
              </li>
            </ul>
          </nav>
          {isAuthenticated ? (
            <Link className="btn btn-lime hdr-login" to="/dasbor">
              Dasbor {userDisplayName ? `(${userDisplayName})` : ""}
            </Link>
          ) : (
            <Link className="btn btn-lime hdr-login" to="/login">
              Masuk
            </Link>
          )}
          <button
            className="burger"
            id="burger"
            aria-label="Buka menu"
            aria-expanded={isDrawerOpen}
            aria-controls="drawer"
            onClick={() => setIsDrawerOpen(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </button>
        </div>
      </header>

      {/* ===================== MOBILE DRAWER ===================== */}
      <div className={`drawer ${isDrawerOpen ? "open" : ""}`} id="drawer" aria-hidden={!isDrawerOpen}>
        <div className="drawer__bg" onClick={() => setIsDrawerOpen(false)} />
        <div className="drawer__p" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="drawer__top">
            <span className="brand">
              <img src="/image/landingpage/berseka-icon-2.webp" alt="" width="34" height="34" />
              <b>
                BERSEKA<i>.ID</i>
              </b>
            </span>
            <button
              className="burger"
              style={{ display: "inline-flex" }}
              aria-label="Tutup menu"
              onClick={() => setIsDrawerOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <a href="#beranda" className={activeSection === "beranda" ? "active" : ""} onClick={() => setIsDrawerOpen(false)}>
            Beranda
          </a>
          <a href="#ekosistem" className={activeSection === "ekosistem" ? "active" : ""} onClick={() => setIsDrawerOpen(false)}>
            Ekosistem
          </a>
          <a href="#program" className={activeSection === "program" ? "active" : ""} onClick={() => setIsDrawerOpen(false)}>
            Program
          </a>
          <a href="#pasar" className={activeSection === "pasar" ? "active" : ""} onClick={() => setIsDrawerOpen(false)}>
            Pasar BERSEKA
          </a>
          <a href="#aisah" className={activeSection === "aisah" ? "active" : ""} onClick={() => setIsDrawerOpen(false)}>
            AISAh AI
          </a>
          <a href="#berita" className={activeSection === "berita" ? "active" : ""} onClick={() => setIsDrawerOpen(false)}>
            Berita
          </a>
          <details>
            <summary>
              Bantuan{" "}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <a
              href="#faq"
              onClick={(e) => {
                e.preventDefault();
                setIsDrawerOpen(false);
                setShowFaqModal(true);
              }}
            >
              FAQ
            </a>
            <a
              href="#kalkulator"
              onClick={(e) => {
                e.preventDefault();
                setIsDrawerOpen(false);
                setShowCalculatorModal(true);
              }}
            >
              Kalkulator BERSEKA
            </a>
          </details>
          {isAuthenticated ? (
            <Link className="btn btn-lime" to="/dasbor" style={{ marginTop: "auto", justifyContent: "center" }} onClick={() => setIsDrawerOpen(false)}>
              Buka Dasbor {userDisplayName ? `(${userDisplayName})` : ""}
            </Link>
          ) : (
            <Link className="btn btn-lime" to="/login" style={{ marginTop: "auto", justifyContent: "center" }} onClick={() => setIsDrawerOpen(false)}>
              Masuk
            </Link>
          )}
        </div>
      </div>

      <main>
        {/* ===================== HERO ===================== */}
        <section className="hero" id="beranda">
          <div className="wrap">
            <div className="hero__grid">
              <div className="hero__copy">
                <span className="badge rv">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" />
                    <path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12" />
                  </svg>
                  <span>Platform KKN Tematik untuk Pengelolaan Sampah Terpadu</span>
                </span>
                <h1 className="rv d1">
                  Sampah <span>Terkelola,</span> Kampung Lebih Berdaya.
                </h1>
                <p className="hero__lead rv d2">
                  BERSEKA menghubungkan warga, petugas, armada, fasilitas pengolahan, pemerintah, akademisi, dan pasar sirkular dalam satu ekosistem berbasis Web, Mobile, IoT, AI, GIS, QR Code, dan gamifikasi untuk mewujudkan ekonomi sirkular.
                </p>
                <div className="cta-pill rv d3">
                  <Link className="btn btn-line" to="/download">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
                    </svg>
                    Unduh Aplikasi
                  </Link>
                  <a className="btn btn-leaf" href="#program">
                    Jelajahi Program{" "}
                    <svg className="go" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                </div>
                <div className="people rv d4">
                  <div className="avs" aria-hidden="true">
                    <img src="/image/landingpage/mitra-dlh.webp" alt="" />
                    <img src="/image/landingpage/mitra-pemkot.webp" alt="" />
                    <img src="/image/landingpage/mitra-unikom.webp" alt="" />
                  </div>
                  <p>
                    Bergabung bersama <b><span data-count={targetHero}>{heroCount.toLocaleString("id-ID")}</span>+ pengguna</b>
                    <br />
                    dari {kelurahanCount} kelurahan di Coblong
                  </p>
                </div>
              </div>

              {/* Hero Visual Column */}
              <div className="hero__visual rv d2">
                <div className="hero__img-frame">
                  <img src="/image/landingpage/hero-sorting.webp" alt="Mahasiswa KKN tersenyum sambil memilah sampah organik, plastik, dan logam ke tempat sampah hijau, biru, dan kuning" />
                </div>

                <a className="play" href="#berita">
                  <span>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5Z" />
                    </svg>
                  </span>
                  Lihat cerita kami
                </a>

                <div className="floats" aria-label="Sorotan program">
                  <a
                    className="fcard"
                    href="#program"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedProgram(programsList[0] || PROGRAMS[0]);
                    }}
                  >
                    <img src="/image/landingpage/hero-qr-badge.webp" alt="" />
                    <span>
                      <b>Kodifikasi QR</b>
                      <small>Identitas digital tiap tempat sampah</small>
                    </span>
                  </a>
                  <a
                    className="fcard"
                    href="#program"
                    onClick={(e) => {
                      e.preventDefault();
                      const kompost = programsList.find((p) => p.id.includes("kompost") || p.id.includes("camp-04")) || programsList[3] || PROGRAMS[3];
                      setSelectedProgram(kompost);
                    }}
                  >
                    <img src="/image/landingpage/hero-compost-badge.webp" alt="" />
                    <span>
                      <b>Komposter IoT</b>
                      <small>Sampah organik jadi pupuk cair</small>
                    </span>
                  </a>
                  <a className="fcard" href="#pasar">
                    <img src="/image/landingpage/hero-circular-badge.webp" alt="" />
                    <span>
                      <b>Pasar Sirkular</b>
                      <small>Tukar poin dengan produk warga</small>
                    </span>
                  </a>
                </div>
              </div>
            </div>

            <div className="stats rv d4" aria-label="BERSEKA dalam angka">
              <div className="stat">
                <b><span data-count={targetHero}>{heroCount.toLocaleString("id-ID")}</span>+</b>
                <span>Pengguna</span>
              </div>
              <div className="stat">
                <b data-count={kelurahanCount}>{kelurahanCount}</b>
                <span>Kelurahan</span>
              </div>
              <div className="stat">
                <b>
                  {landingStats?.totalSampahKg
                    ? `${landingStats.totalSampahKg.toLocaleString("id-ID")} kg`
                    : landingStats?.kegiatanCount
                    ? `${landingStats.kegiatanCount} Kegiatan`
                    : "Data"}
                </b>
                <span>
                  {landingStats?.totalSampahKg
                    ? "Sampah Terkelola"
                    : landingStats?.kegiatanCount
                    ? "Aksi Terlaksana"
                    : "Tercatat"}
                </span>
              </div>
              <div className="stat hl">
                <b>Kolaborasi</b>
                <span>Multipihak</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== EKOSISTEM ===================== */}
        <section className="sec" id="ekosistem">
          <div className="wrap">
            <div className="head">
              <div>
                <span className="badge rv">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                  Dari rumah hingga pasar
                </span>
                <h2 className="h2 rv d1">
                  Ekosistem <span>BERSEKA</span>
                </h2>
                <p className="sub rv d2">Enam pihak saling terhubung, supaya setiap kantong sampah punya jalan pulang yang jelas.</p>
              </div>
            </div>
            <ol className="eco">
              <li className="rv">
                <span className="n">01</span>
                <div className="ic">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" />
                  </svg>
                </div>
                <h3>Rumah Tangga</h3>
                <p>Pilah sampah dari sumber</p>
              </li>
              <li className="rv d1">
                <span className="n">02</span>
                <div className="ic">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="9" cy="7" r="4" />
                    <path d="M2 21v-2a4 4 0 0 1 4-4h6" />
                    <path d="m16 19 2 2 4-4" />
                  </svg>
                </div>
                <h3>Petugas</h3>
                <p>Pengumpulan &amp; pendataan</p>
              </li>
              <li className="rv d2">
                <span className="n">03</span>
                <div className="ic">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
                    <circle cx="7" cy="18" r="2" />
                    <circle cx="17" cy="18" r="2" />
                  </svg>
                </div>
                <h3>Armada</h3>
                <p>Pengangkutan terjadwal</p>
              </li>
              <li className="rv d3">
                <span className="n">04</span>
                <div className="ic">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 21V9l5 3V9l5 3V5l8 4v12Z" />
                    <path d="M8 17h1M12 17h1M16 17h1" />
                  </svg>
                </div>
                <h3>Pengolahan</h3>
                <p>Pemrosesan &amp; valorisasi</p>
              </li>
              <li className="rv d4">
                <span className="n">05</span>
                <div className="ic">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 21h18M4 10h16M12 3 3 8h18Z" />
                    <path d="M6 10v8M10 10v8M14 10v8M18 10v8" />
                  </svg>
                </div>
                <h3>Pemerintah</h3>
                <p>Kebijakan &amp; pengawasan</p>
              </li>
              <li className="rv d5">
                <span className="n">06</span>
                <div className="ic">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 7h14l-1.5 13h-11Z" />
                    <path d="M9 10V6a3 3 0 0 1 6 0v4" />
                  </svg>
                </div>
                <h3>Pasar Sirkular</h3>
                <p>Produk &amp; material bernilai</p>
              </li>
            </ol>
          </div>
        </section>

        {/* ===================== PROGRAM ===================== */}
        <section className="sec" id="program" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="head">
              <div>
                <span className="badge rv">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2 15 8.5l7 1-5 4.8 1.2 6.9L12 18l-6.2 3.2L7 14.3 2 9.5l7-1Z" />
                  </svg>
                  Program unggulan
                </span>
                <h2 className="h2 rv d1">
                  {programsList.length} Program <span>KKN BERSEKA</span>
                </h2>
                <p className="sub rv d2">
                  Inovasi mahasiswa dan warga untuk memperkuat tata kelola sampah berbasis teknologi, lingkungan, dan ekonomi sirkular di Kecamatan Coblong.
                </p>
              </div>
              <div className="kkn rv d2">
                <img src="/image/landingpage/berseka-icon-10.webp" alt="" width="36" height="36" />
                <span>
                  <small>KKN Berdampak</small>
                  <b>UNIKOM 2026</b>
                </span>
              </div>
            </div>
            <div className="grid3">
              {programsList.map((prog, idx) => (
                <article key={prog.id} className={`card rv ${idx > 0 ? `d${idx % 3}` : ""}`}>
                  <div className="card__img">
                    <img src={prog.img} alt={prog.title} />
                  </div>
                  <div className="card__b">
                    <span className="tag">{prog.tag}</span>
                    <h3>{prog.title}</h3>
                    <p>{prog.desc}</p>
                    <button
                      className="more"
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                      onClick={() => setSelectedProgram(prog)}
                    >
                      Lihat Program{" "}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== PASAR BERSEKA ===================== */}
        <section className="pasar" id="pasar">
          <div className="wrap">
            <div className="head">
              <div>
                <span className="badge rv">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 7h14l-1.5 13h-11Z" />
                    <path d="M9 10V6a3 3 0 0 1 6 0v4" />
                  </svg>
                  Tukar poin, bawa pulang manfaat
                </span>
                <h2 className="h2 rv d1">
                  Pasar <span>BERSEKA</span>
                </h2>
                <p className="sub rv d2">Tukar poin partisipasi menjadi produk ramah lingkungan dan karya kreatif warga.</p>
              </div>
            </div>
            <div className="loc rv">
              <span className="i">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <div>
                <b>Lokasi penukaran: Posko KKN BERSEKA di setiap RW, Kecamatan Coblong, Kota Bandung.</b>
                <span>Tunjukkan kode penukaran kepada petugas saat mengambil produk.</span>
              </div>
            </div>
            <div className="chips rv" role="group" aria-label="Filter kategori produk">
              <button className="chip" aria-pressed={pasarFilter === "all"} onClick={() => setPasarFilter("all")}>
                Semua
              </button>
              <button className="chip" aria-pressed={pasarFilter === "Pupuk & Kompos"} onClick={() => setPasarFilter("Pupuk & Kompos")}>
                Pupuk &amp; Kompos
              </button>
              <button className="chip" aria-pressed={pasarFilter === "Eco-Enzyme"} onClick={() => setPasarFilter("Eco-Enzyme")}>
                Eco-Enzyme
              </button>
              <button className="chip" aria-pressed={pasarFilter === "Bibit & Tanaman"} onClick={() => setPasarFilter("Bibit & Tanaman")}>
                Bibit &amp; Tanaman
              </button>
              <button className="chip" aria-pressed={pasarFilter === "Daur Ulang Kreatif"} onClick={() => setPasarFilter("Daur Ulang Kreatif")}>
                Daur Ulang Kreatif
              </button>
              <button className="chip" aria-pressed={pasarFilter === "Pakan Organik"} onClick={() => setPasarFilter("Pakan Organik")}>
                Pakan Organik
              </button>
            </div>
            <div className="grid3" id="prods">
              {productsList.map((prod, idx) => (
                <article
                  key={prod.id}
                  className={`card prod rv ${idx > 0 ? `d${idx % 3}` : ""} ${pasarFilter !== "all" && prod.category !== pasarFilter ? "hide" : ""}`}
                  data-cat={prod.category}
                >
                  <div className="card__img">
                    <img src={prod.img} alt={prod.title} />
                  </div>
                  <div className="card__b">
                    <span className="tag">{prod.category}</span>
                    <h3>{prod.title}</h3>
                    <p className="meta">{prod.meta}</p>
                    <div className="foot">
                      <span className="poin">
                        <span className="coin" aria-hidden="true" />
                        {prod.points} Poin
                      </span>
                      <button
                        className="btn btn-line btn-sm"
                        onClick={() => setExchangeModalProduct(prod)}
                      >
                        Tukar Poin
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== AISAh AI ===================== */}
        <section className="sec" id="aisah">
          <div className="wrap">
            <div className="ai rv">
              <div>
                <span className="badge" style={{ background: "#fff" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4Z" />
                    <path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z" />
                  </svg>
                  Kecerdasan Artifisial Pemilah Sampah
                </span>
                <h2 className="h2">
                  AISAh — <span>Asisten Identifikasi Sampah</span>
                </h2>
                <p className="sub">
                  Pindai dan kenali jenis sampah secara otomatis melalui kamera gawai Anda. Teknologi AI Vision BERSEKA mendeteksi material objek, mengarahkan penempatan ke tempat sampah pemilahan yang tepat, dan menyajikan estimasi komposisi secara presisi.
                </p>
                <ul className="feats">
                  <li>
                    <span className="i">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 8h3l2-3h6l2 3h3v11H4Z" />
                        <circle cx="12" cy="13" r="3.5" />
                      </svg>
                    </span>
                    <div>
                      <b>Pindai Cepat Tanpa Instalasi</b>
                      <span>Cukup ambil foto atau unggah gambar langsung dari peramban ponsel maupun desktop.</span>
                    </div>
                  </li>
                  <li>
                    <span className="i">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="m8 12 3 3 5-6" />
                      </svg>
                    </span>
                    <div>
                      <b>Panduan Tiga Wadah Pemilahan</b>
                      <span>Rekomendasi langsung penempatan tempat sampah Organik (Hijau), Anorganik (Kuning), atau Residu (Merah).</span>
                    </div>
                  </li>
                  <li>
                    <span className="i">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 12a9 9 0 1 1-9-9v9Z" />
                        <path d="M15 3.5A9 9 0 0 1 20.5 9H15Z" />
                      </svg>
                    </span>
                    <div>
                      <b>Kalkulasi Komposisi Fisik</b>
                      <span>Menyajikan persentase material untuk mendukung pencatatan sirkularitas dan daur ulang.</span>
                    </div>
                  </li>
                </ul>
                <div className="ai__cta">
                  <a className="btn btn-leaf" href="https://aisah.berseka.id" target="_blank" rel="noopener">
                    Buka aisah.berseka.id{" "}
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M7 17 17 7M8 7h9v9" />
                    </svg>
                  </a>
                  <small>Tersedia gratis untuk seluruh warga &amp; komunitas</small>
                </div>
              </div>
              <div className="scan" aria-label="Pratinjau AISAh Vision">
                <div className="scan__t">
                  <span className="live">AISAh Vision AI Online</span>
                  <span className="acc">AKURASI {aisahAccuracyPercent.toFixed(1)}%</span>
                </div>
                <div className="scan__box">
                  <div className="cam">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 8h3l2-3h6l2 3h3v11H4Z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                  </div>
                  <b><span data-count={targetAisah}>{aisahCount.toLocaleString("id-ID")}</span> Sampah Terpindai</b>
                  <p>Deteksi instan jenis material &amp; wadah tempat sampah yang sesuai secara real-time</p>
                </div>
                <div className="bins">
                  <div className="bin g">
                    <b>Hijau</b>Organik
                  </div>
                  <div className="bin y">
                    <b>Kuning</b>Anorganik
                  </div>
                  <div className="bin r">
                    <b>Merah</b>Residu
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== SDGS ===================== */}
        <section className="sec" style={{ paddingTop: 0 }} aria-labelledby="sdgT">
          <div className="wrap">
            <div className="head">
              <div>
                <span className="badge rv">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20M2 12a14.5 14.5 0 0 0 20 0" />
                  </svg>
                  Dampak global, aksi lokal
                </span>
                <h2 className="h2 rv d1" id="sdgT">
                  Kontribusi terhadap <span>SDGs</span>
                </h2>
              </div>
            </div>
            <div className="sdgs">
              <article className="sdg rv">
                <div className="sdg__t" style={{ background: "#A21942" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
                  </svg>
                  <b>8</b>
                  <span>Decent Work and Economic Growth</span>
                </div>
                <p>Mendorong pekerjaan layak dan ekonomi lokal melalui pengelolaan sampah dan pasar sirkular.</p>
              </article>
              <article className="sdg rv d1">
                <div className="sdg__t" style={{ background: "#E8891F" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 21h18M5 21V7l6-3v17M11 9h8v12" />
                  </svg>
                  <b>11</b>
                  <span>Sustainable Cities and Communities</span>
                </div>
                <p>Mewujudkan kampung yang inklusif, aman, tangguh, dan berkelanjutan.</p>
              </article>
              <article className="sdg rv d2">
                <div className="sdg__t" style={{ background: "#B07D1E" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4Zm0 0c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4Z" />
                  </svg>
                  <b>12</b>
                  <span>Responsible Consumption and Production</span>
                </div>
                <p>Mengurangi sampah, meningkatkan daur ulang, dan konsumsi berkelanjutan.</p>
              </article>
              <article className="sdg rv d3">
                <div className="sdg__t" style={{ background: "#3F7E44" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <b>13</b>
                  <span>Climate Action</span>
                </div>
                <p>Mengurangi emisi dan dampak perubahan iklim melalui pengelolaan sampah berkelanjutan.</p>
              </article>
              <article className="sdg rv d4">
                <div className="sdg__t" style={{ background: "#19486A" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="9" cy="9" r="4" />
                    <circle cx="15" cy="9" r="4" />
                    <circle cx="9" cy="15" r="4" />
                    <circle cx="15" cy="15" r="4" />
                  </svg>
                  <b>17</b>
                  <span>Partnerships for the Goals</span>
                </div>
                <p>Menguatkan kolaborasi multipihak untuk mencapai tujuan pembangunan berkelanjutan.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ===================== BERITA ===================== */}
        <section className="sec" id="berita" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="head">
              <div>
                <span className="badge rv">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3Z" />
                    <path d="M8 9h8M8 13h8M8 17h5" />
                  </svg>
                  Kabar dari kampung
                </span>
                <h2 className="h2 rv d1">
                  Berita &amp; <span>Cerita Lapangan</span>
                </h2>
              </div>
              <button
                className="btn btn-line rv d2"
                onClick={() => setShowAllNewsModal(true)}
              >
                Lihat Semua Berita ({newsList.length}){" "}
                <svg className="go" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
            <div className="news">
              {newsList.slice(0, 3).map((item, idx) => (
                <article
                  key={item.id}
                  className={`card rv ${idx > 0 ? `d${idx}` : ""}`}
                  onClick={() => setSelectedNews(item)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card__img">
                    <img src={item.img} alt={item.title} />
                  </div>
                  <div className="card__b">
                    <span className="date">{item.date}</span>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                    <span className="more">
                      Baca cerita{" "}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== KONTAK ===================== */}
        <section aria-labelledby="kT">
          <div className="wrap">
            <div className="contact rv">
              <div>
                <span className="badge">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
                  </svg>
                  Pusat Informasi &amp; Kolaborasi
                </span>
                <h2 id="kT">
                  Butuh informasi tentang <span>BERSEKA?</span>
                </h2>
                <p>Hubungi CDC UNIKOM untuk informasi pemilahan sampah, pesanan produk Pasar BERSEKA, dan kemitraan wilayah.</p>
              </div>
              <div className="cinfo">
                <div className="ci">
                  <span className="i">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
                    </svg>
                  </span>
                  <div>
                    <small>Saluran WhatsApp</small>
                    <a href="https://wa.me/6285715516065" target="_blank" rel="noopener">
                      +62 857-1551-6065
                    </a>
                  </div>
                </div>
                <div className="ci">
                  <span className="i">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="4" width="20" height="16" rx="3" />
                      <path d="m22 7-10 6L2 7" />
                    </svg>
                  </span>
                  <div>
                    <small>Pos-el / Email Resmi</small>
                    <a href="mailto:cdc@unikom.ac.id">cdc@unikom.ac.id</a>
                  </div>
                </div>
                <div className="ci wide">
                  <span className="i">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <div>
                    <small>Alamat</small>
                    <span>Jl. Dipati Ukur No. 112–116, Lebakgede, Kec. Coblong, Kota Bandung, Jawa Barat 40132</span>
                  </div>
                </div>
              </div>
              <a className="btn btn-lime" href="https://wa.me/6285715516065" target="_blank" rel="noopener">
                Hubungi CDC UNIKOM{" "}
                <svg className="go" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ===================== FOOTER ===================== */}
      <footer className="ftr" id="unduh">
        <div className="wrap">
          <div className="ftr__g">
            <div className="ftr__brand">
              <a className="brand" href="#beranda">
                <img src="/image/landingpage/berseka-icon-26.webp" alt="" width="38" height="38" />
                <b>
                  BERSEKA<i>.ID</i>
                </b>
              </a>
              <p>
                Platform KKN Tematik untuk pengelolaan sampah terpadu berbasis teknologi dan kolaborasi multipihak untuk mewujudkan kampung lebih bersih, sehat, dan asri.
              </p>
              <div className="soc">
                <a href="https://instagram.com/" target="_blank" rel="noopener" aria-label="Instagram BERSEKA">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <path d="M17.5 6.5h.01" />
                  </svg>
                </a>
                <a href="https://youtube.com/" target="_blank" rel="noopener" aria-label="YouTube BERSEKA">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="5" width="20" height="14" rx="4" />
                    <path d="m10 9 5 3-5 3Z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4>Tautan Cepat</h4>
              <ul>
                <li>
                  <a href="#beranda">Beranda</a>
                </li>
                <li>
                  <a href="#ekosistem">Ekosistem</a>
                </li>
                <li>
                  <a href="#program">Program</a>
                </li>
                <li>
                  <a href="#pasar">Pasar BERSEKA</a>
                </li>
                <li>
                  <a href="#aisah">AISAh AI</a>
                </li>
                <li>
                  <a href="#berita">Berita</a>
                </li>
              </ul>
            </div>
            <div>
              <h4>Program</h4>
              <ul>
                <li>
                  <a href="#program" onClick={(e) => { e.preventDefault(); setSelectedProgram(PROGRAMS[0]); }}>
                    Kodifikasi QR
                  </a>
                </li>
                <li>
                  <a href="#program" onClick={(e) => { e.preventDefault(); setSelectedProgram(PROGRAMS[1]); }}>
                    Gas Metana TPS
                  </a>
                </li>
                <li>
                  <a href="#program" onClick={(e) => { e.preventDefault(); setSelectedProgram(PROGRAMS[2]); }}>
                    IoT Buruan SAE
                  </a>
                </li>
                <li>
                  <a href="#program" onClick={(e) => { e.preventDefault(); setSelectedProgram(PROGRAMS[3]); }}>
                    Komposter Pintar
                  </a>
                </li>
                <li>
                  <a href="#program" onClick={(e) => { e.preventDefault(); setSelectedProgram(PROGRAMS[4]); }}>
                    Timbangan Digital
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4>Bantuan</h4>
              <ul>
                <li>
                  <a
                    href="#faq"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowFaqModal(true);
                    }}
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#kalkulator"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowCalculatorModal(true);
                    }}
                  >
                    Kalkulator BERSEKA
                  </a>
                </li>
                <li>
                  <Link to="/download">Unduh Aplikasi</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4>CDC UNIKOM</h4>
              <ul>
                <li className="ci">
                  <span className="i">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
                    </svg>
                  </span>
                  <a href="https://wa.me/6285715516065">+62 857-1551-6065</a>
                </li>
                <li className="ci">
                  <span className="i">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="4" width="20" height="16" rx="3" />
                      <path d="m22 7-10 6L2 7" />
                    </svg>
                  </span>
                  <a href="mailto:cdc@unikom.ac.id">cdc@unikom.ac.id</a>
                </li>
                <li className="ci">
                  <span className="i">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <span>Jl. Dipati Ukur No. 112–116, Lebakgede, Kec. Coblong, Kota Bandung</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="ftr__b">
            <span>© 2026 Universitas Komputer Indonesia. Hak cipta dilindungi.</span>
            <span>Bersih · Sehat · Kampung Asri</span>
          </div>
        </div>
      </footer>

      {/* Back to Top */}
      <button
        className={`top ${showTopBtn ? "show" : ""}`}
        id="top"
        aria-label="Kembali ke atas"
        onClick={scrollToTop}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>

      {/* ===================== MODALS ===================== */}

      {/* 1. Modal Kalkulator BERSEKA */}
      {showCalculatorModal && (
        <div className="landing-modal-backdrop" onClick={closeCalculator}>
          <div className="landing-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="landing-modal-close" onClick={() => setShowCalculatorModal(false)} aria-label="Tutup">
              ✕
            </button>
            <h3 className="modal-title">Kalkulator Potensi Sampah BERSEKA</h3>
            <p className="modal-desc">
              Masukkan estimasi timbulan sampah dari rumah tangga Anda untuk menghitung potensi saldo poin, nilai rupiah, dan kontribusi reduksi emisi karbon.
            </p>
            <div className="calc-grid">
              <div className="calc-field">
                <label><span>🥬</span> Sampah Organik (kg)</label>
                <input
                  type="number"
                  min="0"
                  value={calcOrganicKg}
                  onChange={(e) => setCalcOrganicKg(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>
              <div className="calc-field">
                <label><span>🍾</span> Botol Plastik / Logam (kg)</label>
                <input
                  type="number"
                  min="0"
                  value={calcPlasticKg}
                  onChange={(e) => setCalcPlasticKg(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>
              <div className="calc-field">
                <label><span>🍳</span> Minyak Jelantah (Liter)</label>
                <input
                  type="number"
                  min="0"
                  value={calcOilLiters}
                  onChange={(e) => setCalcOilLiters(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>
            </div>
            <div className="calc-res-grid">
              <div className="calc-res-card hl">
                <small>Estimasi Saldo Poin</small>
                <b>+{calcTotalPoints} Poin</b>
              </div>
              <div className="calc-res-card">
                <small>Nilai Rupiah Poin</small>
                <b>Rp {calcEstimatedRupiah.toLocaleString("id-ID")}</b>
              </div>
              <div className="calc-res-card">
                <small>Reduksi Emisi CO₂</small>
                <b>{calcCarbonReductionKg} kg CO₂e</b>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button
                className="btn btn-leaf"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => {
                  closeCalculator();
                  toast.success("Bagus sekali! Mulai pilah sampah dari rumah dan setor ke petugas.");
                }}
              >
                Mulai Pilah Sampah Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal FAQ */}
      {showFaqModal && (
        <div className="landing-modal-backdrop" onClick={closeFaq}>
          <div className="landing-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="landing-modal-close" onClick={() => setShowFaqModal(false)} aria-label="Tutup">
              ✕
            </button>
            <h3 className="modal-title">Pertanyaan yang Sering Diajukan (FAQ)</h3>
            <p className="modal-desc">
              Pelajari tata cara pemilahan, sistem poin, penjemputan armada, dan program KKN Tematik BERSEKA.
            </p>
            <div style={{ marginTop: "16px" }}>
              {FAQS.map((faq, index) => (
                <div key={index} className="faq-item">
                  <button className="faq-question" onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}>
                    <span>{faq.q}</span>
                    <span>{openFaqIndex === index ? "−" : "+"}</span>
                  </button>
                  {openFaqIndex === index && <p className="faq-answer">{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Detail 6 Program KKN */}
      {selectedProgram && (
        <div className="landing-modal-backdrop" onClick={() => setSelectedProgram(null)}>
          <div className="landing-modal-card max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button className="landing-modal-close" onClick={() => setSelectedProgram(null)} aria-label="Tutup">
              ✕
            </button>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ flex: "1 1 320px", borderRadius: "18px", overflow: "hidden" }}>
                <img src={selectedProgram.img} alt={selectedProgram.title} style={{ width: "100%", height: "240px", objectFit: "cover" }} />
              </div>
              <div style={{ flex: "1 1 360px" }}>
                <span className="tag" style={{ display: "inline-block", marginBottom: "8px" }}>
                  {selectedProgram.tag}
                </span>
                <h3 className="modal-title" style={{ fontSize: "22px" }}>
                  {selectedProgram.title}
                </h3>
                <p style={{ color: "var(--ink-2)", fontSize: "14.5px", lineHeight: "1.6", margin: "12px 0" }}>
                  {selectedProgram.details}
                </p>
                <div style={{ background: "var(--sage-2)", padding: "12px 16px", borderRadius: "12px", fontSize: "13.5px", display: "grid", gap: "6px" }}>
                  <div>
                    <b>Wilayah Percontohan:</b> {selectedProgram.rw}
                  </div>
                  <div>
                    <b>Pelaksana:</b> {selectedProgram.team}
                  </div>
                </div>
                <div style={{ marginTop: "20px" }}>
                  <button className="btn btn-leaf" onClick={() => setSelectedProgram(null)}>
                    Tutup Dokumentasi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Penukaran Poin Pasar BERSEKA */}
      {exchangeModalProduct && (
        <div className="landing-modal-backdrop" onClick={() => setExchangeModalProduct(null)}>
          <div className="landing-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="landing-modal-close" onClick={() => setExchangeModalProduct(null)} aria-label="Tutup">
              ✕
            </button>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <img
                src={exchangeModalProduct.img}
                alt={exchangeModalProduct.title}
                style={{ width: "120px", height: "120px", borderRadius: "18px", objectFit: "cover", margin: "0 auto 12px" }}
              />
              <span className="tag">{exchangeModalProduct.category.toUpperCase()}</span>
              <h3 className="modal-title" style={{ marginTop: "8px" }}>
                {exchangeModalProduct.title}
              </h3>
              <p className="modal-desc" style={{ marginBottom: "12px" }}>
                {exchangeModalProduct.desc}
              </p>
            </div>
            <div style={{ background: "var(--sage-2)", padding: "16px", borderRadius: "16px", marginBottom: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                Biaya Penukaran Poin
              </div>
              <div style={{ fontSize: "28px", fontWeight: "700", fontFamily: "var(--head)", color: "var(--leaf)", marginTop: "4px" }}>
                {exchangeModalProduct.points} Poin
              </div>
              <div style={{ fontSize: "14px", color: "var(--ink-2)", marginTop: "2px" }}>
                Paket: <b>{exchangeModalProduct.meta}</b>
              </div>
            </div>
            <div style={{ fontSize: "13.5px", color: "var(--muted)", lineHeight: "1.5", marginBottom: "20px", background: "#fff", border: "1px solid var(--line)", padding: "12px 16px", borderRadius: "12px" }}>
              📍 <b>Lokasi Pengambilan:</b> Posko KKN BERSEKA di sekretariat RW terdekat wilayah Coblong. Tunjukkan kode bukti pemesanan WhatsApp ke petugas piket.
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <a
                className="btn btn-lime"
                style={{ flex: 1, justifyContent: "center" }}
                href={`https://wa.me/6285715516065?text=Halo%20CDC%20UNIKOM,%20saya%20ingin%20menukar%20poin%20atau%20memesan%20produk%20Pasar%20BERSEKA:%20${encodeURIComponent(exchangeModalProduct.title)}`}
                target="_blank"
                rel="noopener"
                onClick={() => setExchangeModalProduct(null)}
              >
                Pesan via WhatsApp
              </a>
              <button className="btn btn-line" onClick={() => setExchangeModalProduct(null)}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Baca Berita Lengkap */}
      {selectedNews && (
        <div className="landing-modal-backdrop" onClick={() => setSelectedNews(null)}>
          <div className="landing-modal-card max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button className="landing-modal-close" onClick={() => setSelectedNews(null)} aria-label="Tutup">
              ✕
            </button>
            <div style={{ marginBottom: "16px" }}>
              <span className="tag" style={{ marginRight: "10px" }}>{selectedNews.category}</span>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>{selectedNews.date}</span>
            </div>
            <h2 className="modal-title" style={{ fontSize: "26px", lineHeight: "1.2" }}>
              {selectedNews.title}
            </h2>
            <div style={{ fontSize: "13px", color: "var(--leaf)", fontWeight: "600", margin: "8px 0 16px" }}>
              {selectedNews.author}
            </div>
            <div style={{ borderRadius: "20px", overflow: "hidden", marginBottom: "20px" }}>
              <img src={selectedNews.img} alt={selectedNews.title} style={{ width: "100%", maxHeight: "360px", objectFit: "cover" }} />
            </div>
            <div style={{ fontSize: "15.5px", color: "var(--ink-2)", lineHeight: "1.7" }}>
              <p>{selectedNews.content || selectedNews.desc}</p>
              {!selectedNews.content && (
                <p style={{ marginTop: "12px" }}>
                  Kegiatan ini melibatkan partisipasi aktif seluruh warga serta pendampingan teknis dari mahasiswa KKN UNIKOM 2026. Melalui pendekatan kolaboratif ini, volume sampah yang dibuang ke TPA Sarimukti berhasil ditekan hingga lebih dari 40% di tingkat RW percontohan.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Directory Semua Berita */}
      {showAllNewsModal && (
        <div className="landing-modal-backdrop" onClick={() => setShowAllNewsModal(false)}>
          <div className="landing-modal-card max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button className="landing-modal-close" onClick={() => setShowAllNewsModal(false)} aria-label="Tutup">
              ✕
            </button>
            <h3 className="modal-title">Direktori Berita &amp; Cerita Lapangan</h3>
            <p className="modal-desc">
              Kumpulan dokumentasi, artikel inovasi, dan publikasi kegiatan KKN Tematik BERSEKA di Kecamatan Coblong.
            </p>
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Cari judul atau topik berita..."
                value={newsSearchTerm}
                onChange={(e) => setNewsSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "14px",
                  border: "1px solid var(--line)",
                  fontSize: "14.5px",
                  outline: "none"
                }}
              />
            </div>
            <div style={{ display: "grid", gap: "16px", maxHeight: "400px", overflowY: "auto" }}>
              {newsList.filter(
                (n) =>
                  n.title.toLowerCase().includes(newsSearchTerm.toLowerCase()) ||
                  n.category.toLowerCase().includes(newsSearchTerm.toLowerCase())
              ).map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: "flex",
                    gap: "16px",
                    padding: "12px",
                    borderRadius: "14px",
                    background: "var(--sage-2)",
                    border: "1px solid var(--line)",
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    setShowAllNewsModal(false);
                    setSelectedNews(n);
                  }}
                >
                  <img
                    src={n.img}
                    alt={n.title}
                    style={{ width: "90px", height: "70px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                      {n.date} • {n.category}
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--ink)", marginTop: "2px" }}>
                      {n.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LandingPage;
