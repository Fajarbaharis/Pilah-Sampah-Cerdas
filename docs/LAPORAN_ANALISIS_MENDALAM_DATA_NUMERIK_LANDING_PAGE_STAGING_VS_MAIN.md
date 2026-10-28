# 📑 LAPORAN RESMI AUDIT & ANALISIS TEKNIS MENDALAM
## Evaluasi Ketergantungan Data Numerik Hardcode pada Landing Page: Staging (`staging.berseka.id`) vs Main (`berseka.id`)

- **Nomor Dokumen:** REP-DEV-LANDING-20261023-01
- **Tanggal Audit:** 23 Oktober 2026
- **Penyusun:** Antigravity AI & Web Platform Engineer
- **Target Pembaca:** Tim Frontend Web, Tim Backend API, Project Manager, & Technical Lead
- **Status Audit:** 🔍 **ANALISIS KRITIS SELESAI — BUTUH PENYELARASAN DATA DINAMIS**
- **Referensi Berkas:**
  - `apps/web/src/pages/LandingPage/LandingPage.tsx` (Staging & Main)
  - `apps/web/src/utils/cmsStorage.ts`
  - `apps/web/src/pages/SuperUser/KurasiLandingPage.tsx`
  - `apps/api/src/services/systemService.ts`
  - `apps/api/src/routes/systemRoutes.ts`

---

## 1. 📌 Ringkasan Eksekutif (Executive Summary)

Audit teknis ini disusun untuk menganalisis temuan ketergantungan **data numerik statis (hardcoded)** pada halaman utama publik (Landing Page) BERSEKA di lingkungan **Staging (`staging.berseka.id`)**, serta mengomparasikannya secara mendalam dengan implementasi pada branch **Main (`berseka.id`)**.

### Ringkasan Temuan Utama:
1. **Regresi Integrasi Data di Staging:**  
   Pada commit terbaru `7a5cc076b` (*"revamp UI landing page & login sesuai desain resmi"*), seluruh antarmuka Landing Page diperbarui dengan tata letak (*layout*) prototipe resmi modern. Namun, dalam proses pembaruan tersebut, **seluruh panggilan API backend (`api.get('/system/landing-stats')`), sinkronisasi CMS (`loadCmsContent()`), dan pembacaan live telemetri AI AISAh (`aisah.berseka.id/api/stats`) terputus total**.
2. **Kondisi Kontras Antar Branch:**  
   - Branch **`main`**: Menggunakan **data 100% dinamis** dari database PostgreSQL, CMS SuperUser, dan microservice AI, namun masih memakai desain tata letak lama (*carousel multi-slide*).
   - Branch **`staging`**: Menggunakan **tampilan desain baru yang sangat modern dan rapi**, namun datanya **100% statis/hardcoded** di dalam komponen frontend.
3. **Pelanggaran Standar `AGENTS.md`:**  
   Kondisi di Staging saat ini melanggar poin wajib pada pedoman tim:  
   > *"DILARANG menanamkan data statis / hardcode yang berpura-pura menjadi data asli backend. Komponen frontend web wajib mengonsumsi data dari REST endpoint (`/api/v1/...`)."*
4. **Kesiapan Backend:**  
   Backend API telah memiliki endpoint agregasi data riil yang lengkap dan efisien di `/api/v1/system/landing-stats` dan `/api/v1/system/landing-content`. Tim frontend hanya perlu menghubungkan kembali data dinamis ini ke komponen UI baru di Staging.

---

## 2. ⚖️ Matriks Komparasi Menyeluruh: Branch Main vs Branch Staging

Berikut perbandingan matriks teknis antara halaman landing page di branch `main` (produksi) dan `staging`:

| Aspek / Fitur | Branch `main` (Production - `berseka.id`) | Branch `staging` (Staging - `staging.berseka.id`) | Status Evaluasi |
|---|---|---|---|
| **Status Data Numerik** | 🟢 **100% Dinamis** (Database & Live Microservice) | 🔴 **100% Hardcode** (Nilai angka statis dalam kode) | Regresi pada Staging |
| **Koneksi REST API Backend** | 🟢 Terhubung ke `/api/v1/system/landing-stats` | 🔴 **Tidak ada import `api` atau pemanggilan REST API** | Terputus total |
| **Integrasi CMS SuperUser** | 🟢 Terhubung ke `/api/v1/system/landing-content` & IndexedDB | 🔴 **Terputus**, data produk & berita disimpan di array statis | Perubahan admin tidak muncul |
| **BroadcastChannel Real-Time** | 🟢 Ada (`CMS_BROADCAST_CHANNEL_NAME`), sync antar-tab | 🔴 **Dihapus**, tidak ada listener live update | Hilang di Staging |
| **Live Vision AI AISAh** | 🟢 Fetch live ke `https://aisah.berseka.id/api/stats` | 🔴 Angka statis: scan `7.738` dan akurasi `100.0%` | Hilang di Staging |
| **Desain Antarmuka (UI/UX)** | 🟡 Desain Lama (Carousel slide lebar, Lucide icons) | 🟢 **Desain Baru / Revamp** (Layout grid resmi, WebP, SVG) | Visual Staging lebih unggul |
| **Formula Kalkulator Sampah** | 🟡 Koefisien statis (10, 25, 50 poin/kg) | 🔴 Koefisien statis yang sama tanpa integrasi konfigurasi | Perlu sentralisasi |
| **Dukungan Offline / Fallback** | 🟢 Ada fallback berjenjang (Server ➔ IndexedDB ➔ Defaults) | 🔴 Tidak ada pembedaan status online/offline | Rentan data usang |

---

## 3. 🔍 Rincian Audit Data Numerik Hardcode di `LandingPage.tsx` Staging

Berikut adalah hasil bedah kode baris per baris (*line-by-line audit*) pada berkas [`apps/web/src/pages/LandingPage/LandingPage.tsx`](file:///home/fajar/Documents/Project%20Aplikasi/Pilah-Sampah-Cerdas-Staging/apps/web/src/pages/LandingPage/LandingPage.tsx) di branch Staging:

```
apps/web/src/pages/LandingPage/LandingPage.tsx
├── 1. Hero & Header Stats (Baris 316, 672, 736, 740)
├── 2. AISAh Vision AI Metrics (Baris 317, 1050, 1059)
├── 3. Direktori Berita Lapangan (Baris 1174, 169-187, 1653)
├── 4. Program Unggulan KKN (Baris 53, 54, 857)
├── 5. Pasar BERSEKA (Baris 108-163, 965, 1602)
└── 6. Formula Kalkulator Sampah (Baris 240-242, 413-424)
```

---

### 3.1. Hero Section: Counter Pengguna & Kelurahan

* **Lokasi Kode:**
  - Baris 316: `const targetHero = 1266;` (Target angka animasi counter di `useEffect`)
  - Baris 672: `<span data-count="1266">{heroCount.toLocaleString("id-ID")}</span>+ pengguna`
  - Baris 736: `<b><span data-count="1266">{heroCount.toLocaleString("id-ID")}</span>+</b><span>Pengguna</span>`
  - Baris 740: `<b data-count="6">6</b><span>Kelurahan</span>`
  - Baris 744–745: `<b>Data</b><span>Tercatat</span>` *(Angka numerik dihilangkan, hanya label statis)*
* **Masalah Teknis:**
  - Angka **1.266** ditanam secara permanen ke dalam logika animasi React.
  - Angka kelurahan **6** ditulis mati sebagai tag HTML `<b>6</b>`.
  - Kartu "Data Tercatat" kehilangan nilai numeriknya (sebelumnya menampilkan akumulasi bobot sampah riil atau total kegiatan).
* **Solusi Dinamis:**
  - `heroCount` harus menggunakan target dari `landingStats.totalPengguna` atau `landingStats.totalUsers` (dihitung riil via `prisma.user.count()` dari tabel database).
  - Kelurahan harus menggunakan target dari `landingStats.kelurahanCount` (dihitung via `prisma.kelurahan.count()`).

---

### 3.2. AISAh Vision AI: Total Sampah Terpindai & Akurasi

* **Lokasi Kode:**
  - Baris 317: `const targetAisah = 7738;` (Target angka animasi counter AISAh)
  - Baris 1050: `<span className="acc">AKURASI 100.0%</span>`
  - Baris 1059: `<b><span data-count="7738">{aisahCount.toLocaleString("id-ID")}</span> Sampah Terpindai</b>`
* **Masalah Teknis:**
  - Jumlah pindaian sampah **7.738** dan tingkat akurasi **100.0%** adalah string statis mentah.
  - Layanan AISAh memiliki REST API telemetri mandiri di domain `https://aisah.berseka.id/api/stats` yang menyediakan field riil `total_scans` dan `accuracy_percent`.
* **Solusi Dinamis:**
  - Di branch `main`, kedua nilai ini diambil secara live menggunakan `Promise.allSettled` ke endpoint AISAh dan disimpan di state `aisahRealtimeStats`. Logika ini harus dikembalikan ke `staging`.

---

### 3.3. Berita & Cerita Lapangan: Counter Total Berita & Tanggal

* **Lokasi Kode:**
  - Baris 1174: `<button className="btn btn-line rv d2" onClick={() => setShowAllNewsModal(true)}>Lihat Semua Berita (68) <svg ...>`
  - Baris 169, 178, 187: `date: "16 Okt 2026"` pada array `NEWS_LIST`
  - Baris 1653: `"...ditekan hingga lebih dari 40% di tingkat RW percontohan."`
* **Masalah Teknis:**
  - **Inkonsistensi Kritis:** Tombol menyatakan **"Lihat Semua Berita (68)"**, tetapi saat modal diklik, data yang tersedia di array `NEWS_LIST` hanya ada **3 artikel**.
  - Tanggal artikel di-hardcode `"16 Okt 2026"`.
* **Solusi Dinamis:**
  - Ganti teks tombol menjadi dinamis: `Lihat Semua Berita (${newsList.length})`.
  - Konsumsi data berita dari endpoint `/api/v1/berita` atau CMS `newsItems`, di mana tanggal dibuat dinamis dari `createdAt` database.

---

### 3.4. Program Unggulan KKN: Angka Program & Tim

* **Lokasi Kode:**
  - Baris 857: `<h2 className="h2 rv d1">6 Program <span>KKN BERSEKA</span></h2>`
  - Baris 53: `rw: "Coblong (75 RW)"`
  - Baris 54: `team: "Kelompok KKN 1–6 UNIKOM 2026"`
  - Baris 63, 73, 83, 103: Penamaan RW statis (`RW 11 Dago`, `RW 03 Lebak Siliwangi`, dll.)
* **Masalah Teknis:**
  - Jumlah program terkunci pada angka `6`.
  - Tim pelaksana dan RW percontohan di-hardcode di dalam array lokal `PROGRAMS`.
* **Solusi Dinamis:**
  - Backend memiliki endpoint `/api/v1/system/landing-proker` yang memuat Program Kerja tervalidasi dari database (`prisma.programKerjaKkn.findMany({ where: { statusUsulan: "DISETUJUI" } })`).
  - Judul section dapat menggunakan `${programs.length} Program KKN BERSEKA`.

---

### 3.5. Pasar BERSEKA: Tarif Poin Produk Daur Ulang

* **Lokasi Kode:**
  - Baris 108–163: Objek array `PRODUCTS`:
    ```typescript
    { id: "prod-1", title: "Telur Ayam BERSEKA", points: 200 },
    { id: "prod-2", title: "Sayuran Segar Buruan SAE", points: 150 },
    { id: "prod-3", title: "POC BERSEKA", points: 180 },
    { id: "prod-4", title: "Ikan Bioflok BERSEKA", points: 350 },
    { id: "prod-5", title: "Kerajinan Daur Ulang BERSEKA", points: 300 },
    { id: "prod-6", title: "Maggot Kering BERSEKA", points: 220 }
    ```
  - Baris 965: `{prod.points} Poin`
  - Baris 1602: `{exchangeModalProduct.points} Poin`
* **Masalah Teknis:**
  - Seluruh tarif penukaran poin bernilai statis di frontend.
  - Jika Super User / Admin mengubah harga poin produk di halaman kurasi (`/admin/kurasi-landing-page`), perubahan tersebut **tidak akan pernah berefek** pada pengunjung Landing Page karena Landing Page membaca konstanta array lokal.
* **Solusi Dinamis:**
  - Hubungkan array produk ke `cmsContent.marketProducts` via `loadCmsContent()` dan `/api/v1/system/landing-content`.

---

### 3.6. Kalkulator Potensi Sampah: Formula & Koefisien

* **Lokasi Kode:**
  - Baris 240–242: Default nilai input: `5 kg` organik, `2 kg` botol plastik, `1 liter` minyak jelantah.
  - Baris 413–415: Formula estimasi saldo poin:
    ```typescript
    calcTotalPoints = calcOrganicKg * 10 + calcPlasticKg * 25 + calcOilLiters * 50;
    ```
  - Baris 417–419: Konversi nilai rupiah:
    ```typescript
    calcEstimatedRupiah = calcTotalPoints * 100; // 1 Poin = Rp 100
    ```
  - Baris 421–424: Estimasi reduksi emisi CO₂:
    ```typescript
    const co2 = calcOrganicKg * 0.5 + calcPlasticKg * 1.5 + calcOilLiters * 2.0;
    ```
* **Masalah Teknis:**
  - Koefisien reward (`10`, `25`, `50` poin) dan nilai konversi Rupiah (`Rp 100/poin`) di-hardcode dalam komponen tampilan.
  - Koefisien reduksi emisi (`0.5`, `1.5`, `2.0` kg CO₂e) tertanam statis.
* **Solusi Dinamis:**
  - Koefisien reward sebaiknya mengacu pada konstanta global atau endpoint konfigurasi sistem (`poinRewardIde` atau master tarif reward), dengan nilai saat ini sebagai fallback yang terdokumentasi.

---

## 4. 🗄️ Ketersediaan Endpoint Riil di Backend API (The Untapped Data)

Backend BERSEKA di [`apps/api/src/services/systemService.ts#L813-L1112`](file:///home/fajar/Documents/Project%20Aplikasi/Pilah-Sampah-Cerdas-Staging/apps/api/src/services/systemService.ts#L813-L1112) **sudah menyediakan seluruh data riil berikut secara otomatis** melalui endpoint `GET /api/v1/system/landing-stats`:

```json
{
  "success": true,
  "data": {
    "totalPengguna": 725,            // Jumlah user riil di PostgreSQL
    "kelurahanCount": 6,              // Jumlah kelurahan binaan aktif
    "totalSampahKg": 12.91,          // Akumulasi setoran manual + otomatis riil
    "sampahOrganikKg": 8.39,         // Bobot sampah organik riil
    "sampahAnorganikKg": 4.52,       // Bobot sampah anorganik riil
    "totalPoin": 10564,              // Saldo poin riil yang beredar
    "kegiatanCount": 28,             // Logbook KKN disetujui DPL + Jadwal
    "totalBinsCount": 120,           // Total tempat sampah terdaftar
    "assignedBinsCount": 95,         // Tempat sampah terhubung warga
    "smartIotBinsCount": 48,         // Tempat sampah ber-sensor IoT
    "wasteTrendPercentage": 12.0,    // Tren perubahan volume harian (%)
    "wasteTrendDirection": "UP",     // Arah tren ("UP" | "DOWN" | "STABLE")
    "aisahStats": {
      "totalScans": 7732,            // Terhubung langsung ke microservice AI
      "accuracyPercent": 100.0
    }
  }
}
```

> **Catatan Penting:** Semua data di atas dihitung dengan query PostgreSQL efisien (menggunakan agregasi `_sum` dan `count` ter-cache dengan TTL). Data ini **siap pakai** dan tinggal dikonsumsi oleh `LandingPage.tsx`.

---

## 5. 🛠️ Rencana Aksi Refactoring untuk Tim Developer

Untuk menyelesaikan masalah ini tanpa merusak estetika antarmuka baru di Staging, tim developer dapat menerapkan cetak biru (*blueprint*) berikut:

### Langkah 1: Pasang Ulang State & Fetcher di `LandingPage.tsx`
Tambahkan kembali import dan panggilan data di awal komponen:

```typescript
import api from "../../services/api";
import { loadCmsContent, saveCmsContent, CMS_BROADCAST_CHANNEL_NAME } from "../../utils/cmsStorage";

// 1. State data riil backend
const [landingStats, setLandingStats] = useState<any>(null);
const [aisahRealtimeStats, setAisahRealtimeStats] = useState({ totalScans: 7738, accuracyPercent: 100.0 });
const [cmsProducts, setCmsProducts] = useState<ProductItem[]>(PRODUCTS);
const [cmsNews, setCmsNews] = useState<NewsItem[]>(NEWS_LIST);

// 2. Fetcher saat komponen dimount
useEffect(() => {
  let isMounted = true;

  // A. Ambil statistik database
  api.get("/system/landing-stats")
    .then((res) => {
      if (isMounted && res.data?.data) {
        setLandingStats(res.data.data);
      }
    })
    .catch((err) => console.warn("[LandingPage] Stats API fallback aktif:", err));

  // B. Ambil telemetri live AISAh AI
  fetch("https://aisah.berseka.id/api/stats")
    .then((r) => r.json())
    .then((data) => {
      if (isMounted && typeof data.total_scans === "number") {
        setAisahRealtimeStats((prev) => ({ ...prev, totalScans: data.total_scans }));
      }
    })
    .catch(() => {});

  // C. Ambil konten CMS / Kurasi Admin
  loadCmsContent().then((stored) => {
    if (isMounted && stored?.data?.marketProducts?.length > 0) {
      // Petakan ke format ProductItem jika ada data kurasi terbaru
    }
  });

  return () => { isMounted = false; };
}, []);
```

### Langkah 2: Hubungkan Target Animasi Counter ke Nilai Riil
Modifikasi `useEffect` counter animasi (baris 313–331) agar membaca target dinamis:

```typescript
useEffect(() => {
  let startTimestamp: number | null = null;
  const duration = 1500;

  // Target dinamis dari API dengan fallback aman
  const targetHero = landingStats?.totalPengguna ?? landingStats?.totalUsers ?? 1266;
  const targetAisah = landingStats?.aisahStats?.totalScans ?? aisahRealtimeStats.totalScans ?? 7738;

  const step = (timestamp: number) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    setHeroCount(Math.round(targetHero * easeProgress));
    setAisahCount(Math.round(targetAisah * easeProgress));
    if (progress < 1) window.requestAnimationFrame(step);
  };

  window.requestAnimationFrame(step);
}, [landingStats, aisahRealtimeStats]);
```

### Langkah 3: Tampilkan Akurasi dan Jumlah Berita Dinamis
- Pada badge akurasi AISAh (baris 1050):
  ```tsx
  <span className="acc">
    AKURASI {(landingStats?.aisahStats?.accuracyPercent ?? aisahRealtimeStats.accuracyPercent).toFixed(1)}%
  </span>
  ```
- Pada tombol daftar berita (baris 1174):
  ```tsx
  <button className="btn btn-line rv d2" onClick={() => setShowAllNewsModal(true)}>
    Lihat Semua Berita ({cmsNews.length}) <svg className="go" ... />
  </button>
  ```

---

## 6. ✅ Checklist Verifikasi Quality Control (QC)

Sebelum perubahan ini di-commit dan diajukan PR ke `development` / `staging`, pastikan kriteria berikut terpenuhi:

- [ ] **Type Check Backend:** `cd apps/api && npx tsc --noEmit` lolos (0 error).
- [ ] **Type Check Frontend:** `cd apps/web && npx tsc --noEmit` lolos (0 error).
- [ ] **Data Counter Hero:** Angka counter bergerak menuju jumlah user riil di database.
- [ ] **Data Counter AISAh:** Angka scan bergerak menuju data live `aisah.berseka.id`.
- [ ] **Kurasi Admin:** Perubahan produk/berita di `KurasiLandingPage` tercermin di Landing Page.
- [ ] **Fallback Offline:** Jika server API dimatikan, Landing Page tetap tampil normal dengan fallback data tanpa layar putih / crash.
- [ ] **Larangan Kata Terlarang:** Tidak ada penggunaan kata `'tong'` atau `'tong sampah'` di kode baru (wajib `'Tempat Sampah'`).

---

*Laporan ini disimpan pada direktori repositori: [`docs/LAPORAN_ANALISIS_MENDALAM_DATA_NUMERIK_LANDING_PAGE_STAGING_VS_MAIN.md`](file:///home/fajar/Documents/Project%20Aplikasi/Pilah-Sampah-Cerdas-Staging/docs/LAPORAN_ANALISIS_MENDALAM_DATA_NUMERIK_LANDING_PAGE_STAGING_VS_MAIN.md).*
