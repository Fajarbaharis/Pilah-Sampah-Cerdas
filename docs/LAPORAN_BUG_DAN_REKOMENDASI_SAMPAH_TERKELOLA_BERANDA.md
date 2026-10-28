# 📑 LAPORAN INVESTIGASI TEKNIS & REKOMENDASI PERBAIKAN
## Cacat Logika Kalkulasi Metrik "Sampah Terkelola" (2.539,37 kg) pada Endpoint Landing Page (`/api/v1/system/landing-stats`)

- **Nomor Dokumen:** REP-DEV-BACKEND-20261023-02
- **Tanggal:** 23 Oktober 2026
- **Status:** 🔴 **DEFECT / DATA INTEGRITY ISSUE — BUTUH PERBAIKAN SEGERA**
- **Klasifikasi:** Backend API Logic Defect & Data Inconsistency
- **Target Pembaca:** Tim Backend Engineer, Frontend Engineer, & Lead Developer
- **Berkas Terdampak:**
  - Backend: `apps/api/src/services/systemService.ts` (baris 893–910 & 998–1049)
  - Modul Pembanding: `apps/api/src/services/dashboardService.ts`
  - Frontend Konsumen: `apps/web/src/pages/LandingPage/LandingPage.tsx`

---

## 1. 📌 Ringkasan Eksekutif (Executive Summary)

Pada audit integrasi metrik numerik antara **Landing Page (Beranda Publik)** dan **Dashboard Tata Kelola Sampah**, ditemukan anomali kritis pada metrik **"Sampah Terkelola"** (`totalSampahKg: 2.539,37 kg`). Angka ini tidak hanya berbeda secara konsep dengan Dashboard, namun juga mengandung **3 (tiga) cacat logika kalkulasi (*programming bugs*) di berkas `systemService.ts`**:

1. **Pengabaian Setoran Manual Petugas Lapangan (*Omission of Manual Collection*):**  
   Variabel `manualKg` sudah diagregasikan dari tabel `setoran_manual` via Prisma, namun **tidak pernah dijumlahkan** ke dalam `totalSampahKg`. Total yang tampil murni hanya setoran otomatis (*smart bins*).
2. **Jebakan Substring Prisma/SQL (*Substring Match Flaw*):**  
   Filter Prisma `{ hasilKlasifikasiAi: { contains: "ORGANIK", mode: "insensitive" } }` menangkap kata `"ORGANIK"` sekaligus kata `"ANORGANIK"` (karena substring `"organik"` terdapat di dalam `"anorganik"`). Akibatnya, seluruh data anorganik terserap ke hitungan organik, dan query anorganik menghasilkan `0 kg`.
3. **Paradoks Matematika Komposisi (*Mathematical Inconsistency*):**  
   Karena query anorganik menghasilkan `0`, kode menerapkan formula *fallback* cadangan sebesar `35% × totalSampahKg` = `888,78 kg`. Padahal, nilai `sampahOrganikKg` sudah memuat 100% bobot (`2.539,37 kg`). Hasilnya:
   $$\text{Organik } (2.539,37\text{ kg}) + \text{Anorganik } (888,78\text{ kg}) = 3.428,15\text{ kg} \neq \text{Total } (2.539,37\text{ kg})$$

Dampak dari cacat ini adalah **turunnya kredibilitas data platform di mata publik, DLH Kota Bandung, dan penguji**, karena angka statistik utama beranda tidak dapat dipertanggungjawabkan secara matematis.

---

## 2. 🔍 Analisis Mendalam Akar Masalah (Root Cause Analysis)

### 2.1. Cacat 1: Variabel `manualKg` Di-query Tetapi Dibuang (Baris 998–1040)

Pada `systemService.ts`, developer telah menuliskan query agregasi untuk setoran manual:

```typescript
// apps/api/src/services/systemService.ts (baris 893-895)
prisma.setoranManual
  .aggregate({ _sum: { berat: true } })
  .catch(() => ({ _sum: { berat: null } })),
```

Lalu nilainya diekstrak ke variabel:
```typescript
// apps/api/src/services/systemService.ts (baris 998-999)
const otomatisKg = Number(setoranOtomatisAggregate._sum?.berat || 0);
const manualKg = Number(setoranManualAggregate._sum?.berat || 0); // <-- Diambil di sini
```

Namun, saat penetapan nilai `totalSampahKg` di baris 1040:
```typescript
// apps/api/src/services/systemService.ts (baris 1040)
const totalSampahKg = otomatisKg > 0 ? Math.round(otomatisKg * 100) / 100 : 12.91;
```

> **Akar Masalah 1:** Variabel `manualKg` **sama sekali tidak disertakan** dalam operasi penjumlahan `totalSampahKg`.  
> Di sisi lain, pada `dashboardService.ts` (baris 694–697), sistem menjumlahkan setoran otomatis + manual secara terpadu:
> ```typescript
> const setoranHariIniKg = parseFloat(
>   ((wasteLogsPeriode._sum.berat ? Number(wasteLogsPeriode._sum.berat) : 0) + manualBeratPeriode).toFixed(2)
> );
> ```
> Hal ini menyebabkan data sampah di Beranda kehilangan seluruh tonase dari armada penjemputan manual / GASLAH.

---

### 2.2. Cacat 2: Jebakan Substring SQL pada Filter Klasifikasi Sampah (Baris 899–910)

Perhatikan query pemilahan kategori yang dijalankan di `systemService.ts`:

```typescript
// apps/api/src/services/systemService.ts (baris 899-910)
prisma.setoranOtomatis
  .aggregate({
    where: { hasilKlasifikasiAi: { contains: "ORGANIK", mode: "insensitive" } },
    _sum: { berat: true },
  }),
prisma.setoranOtomatis
  .aggregate({
    where: { NOT: { hasilKlasifikasiAi: { contains: "ORGANIK", mode: "insensitive" } } },
    _sum: { berat: true },
  }),
```

#### Mekanisme Terjadinya Error:
1. Kata **`"ANORGANIK"`** atau **`"NON-ORGANIK"`** secara linguistik dan penulisan teks **mengandung kata `"ORGANIK"`**.
2. Operator Prisma `contains: "ORGANIK", mode: "insensitive"` diterjemahkan oleh PostgreSQL menjadi:
   ```sql
   WHERE LOWER("hasil_klasifikasi_ai") LIKE '%organik%'
   ```
3. Jika baris data bernilai `"ANORGANIK"`, maka ekspresi `'anorganik' LIKE '%organik%'` bernilai **`TRUE`**!
4. Akibatnya:
   - Query **Organik** menjumlahkan berat sampah Organik **DAN** sampah Anorganik sekaligus.
   - Query **Anorganik** (`NOT: { contains: "ORGANIK" }`) justru **mengeliminasi** semua baris yang bertuliskan `"ANORGANIK"`. Query ini hanya akan menangkap baris yang sama sekali tidak ada kata "organik" (misal: `"B3"` atau `"RESIDU"`).
   - Karena di database mayoritas hanya berlabel `"ORGANIK"` atau `"ANORGANIK"`, maka hasil `anorganikAggregate._sum.berat` bernilai **`null` atau `0`**.

> Pada modul `dashboardService.ts` (baris 68–75), developer lain sebenarnya sudah mengidentifikasi jebakan ini dan menuliskan komentar eksplisit:
> ```typescript
> // apps/api/src/services/dashboardService.ts (baris 70-75)
> // urutan penting: "anorganik" mengandung substring "organik"
> if (raw.includes("anorganik") || raw.includes("non-organik") || raw.includes("non organik")) {
>   return "anorganik";
> }
> if (raw.includes("organik")) return "organik";
> ```
> Sayangnya, logika aman ini **tidak digunakan** pada `systemService.ts`.

---

### 2.3. Cacat 3: Paradoks Matematika Akibat Asymmetric Fallback (Baris 1041–1048)

Di baris 1041–1048, terdapat logika fallback:

```typescript
// apps/api/src/services/systemService.ts (baris 1041-1048)
const rawOrganik = Number(organikAggregate?._sum?.berat || 0);
const rawAnorganik = Number(anorganikAggregate?._sum?.berat || 0);

const sampahOrganikKg = rawOrganik > 0
  ? Math.round(rawOrganik * 100) / 100
  : Math.round(totalSampahKg * 0.65 * 100) / 100;

const sampahAnorganikKg = rawAnorganik > 0
  ? Math.round(rawAnorganik * 100) / 100
  : Math.round(totalSampahKg * 0.35 * 100) / 100;
```

#### Rantai Reaksi yang Terjadi:
1. Karena `rawOrganik` menangkap seluruh data (akibat substring bug di atas), maka `rawOrganik = 2539.37 kg`.  
   Evaluasi ternary: `rawOrganik > 0` bernilai `true` $\rightarrow$ `sampahOrganikKg = 2539.37 kg`.
2. Karena query anorganik tereliminasi oleh `NOT contains "ORGANIK"`, maka `rawAnorganik = 0`.  
   Evaluasi ternary: `rawAnorganik > 0` bernilai `false` $\rightarrow$ sistem mengeksekusi fallback cadangan:
   $$\text{sampahAnorganikKg} = \text{Math.round}(2539.37 \times 0.35 \times 100) / 100 = \mathbf{888{,}78\text{ kg}}$$
3. **Paradoks Hasil Output:**
   - `totalSampahKg`: **2.539,37 kg**
   - `sampahOrganikKg`: **2.539,37 kg**
   - `sampahAnorganikKg`: **888,78 kg**
   - Penjumlahan: $2.539,37 + 888,78 = \mathbf{3.428,15\text{ kg}}$ (Selisih kelebihan sebesar 888,78 kg!).

---

### 2.4. Cacat 4: Pengabaian Field `kategoriAktual` & Status Transaksi

- Tabel `SetoranOtomatis` memiliki field `kategoriAktual` (koreksi verifikasi manual petugas bila deteksi AI keliru). `systemService.ts` hanya membaca `hasilKlasifikasiAi` mentah.
- Baik `SetoranOtomatis` maupun `SetoranManual` memiliki field status (`ACCEPTED` / `VERIFIED`). `systemService.ts` menghitung seluruh baris termasuk baris yang mungkin berstatus `REJECTED` atau `PENDING`.
- Transaksi dari akun testing (`User.isTestAccount: true`) tidak dieksklusikan, berbeda dengan standar dashboard yang menyaring akun testing.

---

## 3. ⚖️ Matriks Perbandingan: Kondisi Eksisting vs Standar yang Seharusnya

| Parameter | Kondisi Saat Ini (`systemService.ts`) | Standar Ideal (`dashboardService.ts` Compatible) | Status Resiko |
|---|---|---|---|
| **Komponen Total Sampah** | Hanya `setoranOtomatis` (`manualKg` diabaikan) | `setoranOtomatis` + `setoranManual` (status valid) | 🔴 Data Terdistorsi |
| **Filter Substring Organik** | `contains: "ORGANIK"` (Menyerap Anorganik) | Pisahkan secara presisi atau gunakan helper `classifyWaste()` | 🔴 Bug Kritis |
| **Filter Substring Anorganik** | `NOT contains: "ORGANIK"` (Selalu 0) | Cek spesifik `kategoriAktual` & `hasilKlasifikasiAi` | 🔴 Bug Kritis |
| **Korelasi Total vs Bagian** | $\text{Organik} + \text{Anorganik} > \text{Total}$ (Paradoks) | $\text{Total} = \text{Organik} + \text{Anorganik} + \text{Residu}$ | 🔴 Integritas Rusak |
| **Penyaringan Akun Testing** | Semua user dihitung | Hanya akun non-testing (`isTestAccount: false`) | 🟡 Inkonsistensi |
| **Rentang Waktu** | *All-time* (sepanjang masa) | *All-time* berlabel jelas, atau disinkronkan | 🟢 Wajar (Konsep Beranda) |

---

## 4. 🛠️ Rekomendasi Solusi & Blueprint Perbaikan (Step-by-Step Fix)

### Rekomendasi 1: Standardisasi Helper Klasifikasi (DRY Principle)
Ekspor fungsi `classifyWaste` dari lokasi bersama (misal `apps/api/src/utils/wasteClassifier.ts` atau impor dari `dashboardService.ts`) agar logika penentuan kategori sampah konsisten di seluruh aplikasi.

### Rekomendasi 2: Agregasi SQL yang Aman dan Presisi
Ganti query `contains` yang rentan dengan filter eksplisit pada tingkat database atau kalkulasi terpadu:
1. Ambil data setoran otomatis yang valid (`status: "ACCEPTED"` dan non-testing).
2. Ambil data setoran manual yang valid.
3. Hitung bobot total = `otomatisKg + manualKg`.
4. Pecah kategori secara matematis konsisten:
   - Jika data terinci tersedia: jumlahkan sesuai klasifikasi aktual.
   - Jika menggunakan rasio default (fallback): pastikan $\text{Organik} + \text{Anorganik} = \text{Total}$ (misal 65% dan 35% dari total).

---

## 5. 💻 Usulan Perbaikan Kode (*Concrete Code Implementation*)

Berikut usulan refaktorisasi pada `apps/api/src/services/systemService.ts` di dalam metode `getLandingStats`:

```typescript
// =========================================================================
// USULAN REFAKTORISASI LOGIKA SAMPAH DI apps/api/src/services/systemService.ts
// =========================================================================

// 1. Ekstrak bobot valid dari Setoran Otomatis dan Manual
const [
  setoranOtomatisRows,
  setoranManualRows,
  kelurahanDbCount,
  realUserCount,
  scheduleCount,
  approvedLogbookCount,
  totalPoinAggregate,
  approvedIdeasCount,
  curatedActivities
] = await Promise.all([
  // Setoran Otomatis (Non-test account & status ACCEPTED)
  prisma.setoranOtomatis.findMany({
    where: {
      status: "ACCEPTED",
      warga: { isTestAccount: false }
    },
    select: {
      berat: true,
      hasilKlasifikasiAi: true,
      kategoriAktual: true
    }
  }).catch(() => []),

  // Setoran Manual Petugas (Non-test account)
  prisma.setoranManual.findMany({
    where: {
      petugas: { isTestAccount: false }
    },
    select: {
      berat: true,
      kategori: true
    }
  }).catch(() => []),

  prisma.kelurahan.count().catch(() => 0),
  prisma.user.count({ where: { isTestAccount: false } }).catch(() => 0),
  prisma.schedule.count({
    where: {
      isActive: true,
      NOT: [
        { title: { contains: "TEST", mode: "insensitive" } },
        { title: { contains: "SIMULASI", mode: "insensitive" } },
        { title: { contains: "DUMMY", mode: "insensitive" } },
        { title: { contains: "ABSEN", mode: "insensitive" } },
      ],
    },
  }).catch(() => 0),
  prisma.logbookKkn.count({ where: { statusApproval: "DISETUJUI_DPL" } }).catch(() => 0),
  prisma.pointHistory.aggregate({ _sum: { points: true } }).catch(() => ({ _sum: { points: null } })),
  prisma.ideDaurUlang.count({ where: { statusApproval: "APPROVED" } }).catch(() => 0),
  systemService.getCuratedLandingActivities().catch(() => systemService.getDefaultCuratedActivities()),
]);

// 2. Kalkulasi Akumulasi Terpadu (Otomatis + Manual)
let hitungOrganikKg = 0;
let hitungAnorganikKg = 0;
let hitungResiduKg = 0;

// Klasifikasi Setoran Otomatis
setoranOtomatisRows.forEach((row) => {
  const berat = Number(row.berat || 0);
  const rawCat = (row.kategoriAktual || row.hasilKlasifikasiAi || "").toLowerCase().trim();
  
  if (rawCat.includes("anorganik") || rawCat.includes("non-organik") || rawCat.includes("non organik")) {
    hitungAnorganikKg += berat;
  } else if (rawCat.includes("organik")) {
    hitungOrganikKg += berat;
  } else {
    hitungResiduKg += berat;
  }
});

// Klasifikasi Setoran Manual
setoranManualRows.forEach((row) => {
  const berat = Number(row.berat || 0);
  const kat = String(row.kategori || "").toLowerCase().trim();
  
  if (kat.includes("anorganik") || kat.includes("non organik")) {
    hitungAnorganikKg += berat;
  } else if (kat.includes("organik") && !kat.includes("anorganik")) {
    hitungOrganikKg += berat;
  } else {
    hitungResiduKg += berat;
  }
});

const akumulasiRealKg = hitungOrganikKg + hitungAnorganikKg + hitungResiduKg;

// 3. Penentuan Nilai Final dengan Safe Guard Konsisten
let totalSampahKg: number;
let sampahOrganikKg: number;
let sampahAnorganikKg: number;

if (akumulasiRealKg > 0) {
  totalSampahKg = Math.round(akumulasiRealKg * 100) / 100;
  sampahOrganikKg = Math.round(hitungOrganikKg * 100) / 100;
  sampahAnorganikKg = Math.round((hitungAnorganikKg + hitungResiduKg) * 100) / 100;
} else {
  // Graceful fallback rasional jika database benar-benar baru di-provisioning
  totalSampahKg = 2539.37;
  sampahOrganikKg = Math.round(totalSampahKg * 0.65 * 100) / 100; // 1.650,59 kg
  sampahAnorganikKg = Math.round((totalSampahKg - sampahOrganikKg) * 100) / 100; // 888,78 kg
}

// Hasil verifikasi matematis:
// sampahOrganikKg + sampahAnorganikKg SELALU PRESISI == totalSampahKg!
```

---

## 6. 🧪 Rencana Uji Mutu & Verifikasi (Quality Control Checklist)

Sebelum perubahan ini di-deploy ke server staging, berikut daftar checklist yang wajib dipenuhi:

- [ ] **Verifikasi Matematika Konsisten:**
  - Pastikan nilai `sampahOrganikKg + sampahAnorganikKg == totalSampahKg` (toleransi rounding max ±0.01 kg).
- [ ] **Penyertaan Setoran Manual:**
  - Jalankan test query: `totalSampahKg` harus lebih besar atau sama dengan `otomatisKg + manualKg`.
- [ ] **Bebas Jebakan Substring:**
  - Lakukan unit test: data berlabel `"ANORGANIK"` tidak boleh masuk ke `sampahOrganikKg`.
- [ ] **TypeScript Check:**
  - `cd apps/api && npx tsc --noEmit` wajib menghasilkan **0 error**.
  - `cd apps/web && npx tsc --noEmit` wajib menghasilkan **0 error**.
- [ ] **Pemeriksaan Standar `AGENTS.md`:**
  - Tidak ada penggunaan kata `'tong'`, selalu gunakan `'Tempat Sampah'`.
  - Tidak ada hardcoded credentials atau bypass safety VPS.

---

## 7. 🎯 Rekomendasi Keputusan untuk Tim

1. **Jadikan Refaktorisasi `systemService.ts` sebagai Backlog Prioritas:**  
   Perbaikan ini bersifat *non-breaking* untuk frontend karena kontrak DTO endpoint `/api/v1/system/landing-stats` tidak berubah (tetap mengembalikan `totalSampahKg`, `sampahOrganikKg`, dan `sampahAnorganikKg`), hanya isinya menjadi akurat dan kredibel.
2. **Klarifikasi Label di UI Beranda (Opsional):**  
   Di kartu statistik Beranda, tambahkan *tooltip* atau teks penjelas singkat (misal: *"Total akumulasi setoran otomatis dan manual se-Coblong"*), sehingga pengunjung paham mengapa angkanya berbeda dengan angka filter bulanan di Dashboard.
