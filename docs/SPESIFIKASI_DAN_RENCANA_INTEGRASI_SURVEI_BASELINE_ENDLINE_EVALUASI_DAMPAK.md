# 📑 SPESIFIKASI ARSITEKTUR & RENCANA PENYELARASAN RELASI DATA SURVEI KKN
## Form Publik (`/survey/`) ➡️ Baseline ➡️ Endline ➡️ Evaluasi & Dampak

---

| Dokumen | Spesifikasi Teknis & Rencana Implementasi Relasi Data Survei |
|---|---|
| **Status** | Draf Disetujui untuk Implementasi (*Ready for Implementation*) |
| **Versi** | 1.0.0 |
| **Monorepo Scope** | `apps/web` (Dashboard & Form Publik), `apps/api` (Backend Express & Prisma) |
| **Kebijakan Utama** | **Data Governance**: Data historis lama di database VPS Staging/Prod **TIDAK BOLEH HILANG/RUSAK** (*Zero Data Loss*). |

---

## 📌 1. LATAR BELAKANG & TUJUAN

Formulir survei lapangan publik (`/survey/`) telah disempurnakan untuk digunakan langsung oleh mahasiswa KKN dan kader di lapangan (dengan validasi NIM mahasiswa, auto-save draf, dan sinkronisasi RW binaan).

Tujuan dari dokumen ini adalah:
1. **Menyelaraskan Relasi Data:** Menghubungkan secara akurat aliran data dari form publik `/survey/` ke:
   - `/hasil-survei/baseline` (Survei Awal Kondisi Wilayah)
   - `/hasil-survei/endline` (Survei Akhir Capaian KKN)
   - `/hasil-survei/evaluasi-dan-dampak` (Komparasi Delta Perubahan)
   - Halaman detail kelurahan (`/superUser/data-survei-kkn/:id`)
2. **Standardisasi Format Tanpa Merusak Data Lama:**
   - Menyelaraskan format persentase pemilahan sampah (`0..1` pecahan desimal lama vs `0..100` persen baru) menggunakan **Smart Normalizer**.
3. **Pemisahan vs Penggabungan Data:**
   - Menegaskan prinsip: **Data isian lapangan dipisah secara jujur (Baseline vs Endline)**, dan **hanya digabung berdampingan pada kartu/tab Analisis Perbandingan Dampak**.

---

## 🗺️ 2. ARSITEKTUR ALIRAN DATA (*DATA FLOW ARCHITECTURE*)

```text
               ┌─────────────────────────────────────────┐
               │         Form Publik: /survey/           │
               │   (Mahasiswa KKN / Surveyor Lapangan)   │
               └────────────────────┬────────────────────┘
                                    │
                                    │ HTTP POST /api/v1/survey/submit
                                    ▼
               ┌─────────────────────────────────────────┐
               │           Tabel: survei_rw              │
               │       (Data Mikro Lapangan RW)          │
               │   - RW & RT, Surveyor, NIM              │
               │   - Persen Pilah, Volume Total          │
               │   - Tahap: 'Baseline' / 'Endline'       │
               └────────────────────┬────────────────────┘
                                    │
                                    │ Backend Trigger: aggregateKelurahan()
                                    ▼
      ┌───────────────────────────────────────────────────────────┐
      │ Apakah Tahap = 'Baseline' atau 'Endline'?                 │
      └─────────────┬───────────────────────────────┬─────────────┘
                    │                               │
        Jika 'Baseline'                 Jika 'Endline'
                    ▼                               ▼
      ┌───────────────────────────┐   ┌───────────────────────────┐
      │ Tabel: survei_kelurahan   │   │ Tabel:                    │
      │   (Makro Agregat Baseline)│   │   endline_survei_kelurahan│
      │ Child Tables:             │   │   (Makro Agregat Endline) │
      │ - survei_pemilahan_sampah │   │ Child Tables:             │
      │ - survei_volume_sampah    │   │ - endline_pemilahan_sampah│
      │ - survei_bank_sampah      │   │ - endline_volume_sampah   │
      │ - survei_catatan_kesimp   │   │ - endline_bank_sampah     │
      └─────────────┬─────────────┘   └─────────────┬─────────────┘
                    │                               │
                    ├───────────────────────────────┤
                    │                               │
                    ▼                               ▼
       [ /hasil-survei/baseline ]      [ /hasil-survei/endline ]
       - Tab 1: Ringkasan Kelurahan    - Tab 1: Ringkasan Kelurahan
       - Tab 2: Data Lapangan RW       - Tab 2: Data Lapangan RW
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
                 [ /hasil-survei/evaluasi-dan-dampak ]
                 - Tab 1: Data Baseline Kelurahan
                 - Tab 2: Data Endline Kelurahan
                 - Tab 3: Komparasi Delta (Baseline vs Endline)
```

---

## 🛡️ 3. KEBIJAKAN INTEGRITAS DATA: SMART NORMALIZER & DATA PROVENANCE

### 3.1. Masalah Inkonsistensi Angka (0..1 vs 0..100)
- **Data Historis Awal VPS:** Tersimpan dalam bentuk pecahan desimal `0..1` (misalnya: `0.248` = 24.8%).
- **Data Form Survei Baru:** Dikirim dan dihitung dalam bentuk persen `0..100` (misalnya: `42.5` = 42.5%).

### 3.2. Solusi: Smart Normalizer (Zero Mutation to Legacy Data)
Dilarang mengubah atau me-replace isi data lama di database VPS secara paksa. Penyeragaman dilakukan secara aman di lapisan transformasi data (Backend DTO / Frontend Helper):

```typescript
/**
 * Normalizer cerdas untuk memastikan persentase selalu dalam format 0..100 (%)
 * Aman untuk data lama (0.248 -> 24.8) maupun data baru (42.5 -> 42.5)
 */
export function normalizePercentage(val: number | string | null | undefined): number {
  if (val === null || val === undefined || val === "") return 0;
  const num = typeof val === "string" ? parseFloat(val) : Number(val);
  if (isNaN(num)) return 0;
  
  // Format legacy (<= 1.0 dan > 0): kalikan 100
  if (num > 0 && num <= 1.0) {
    return Number((num * 100).toFixed(2));
  }
  
  return Number(num.toFixed(2));
}
```

### 3.3. Graceful Override & Data Provenance (Asal-Usul Data)
- **Jika Suatu Kelurahan Belum Punya Survei RW Mahasiswa:**
  Dashboard otomatis tetap menampilkan **Data Baseline Awal** (sehingga dashboard tidak kosong/rusak).
- **Jika Mahasiswa Menginput Survei RW Baru:**
  Sistem memperbarui agregasi kelurahan dan mencatat sumber datanya pada kolom keterangan:
  > *"Diperbarui otomatis dari akumulasi X RW resmi (Mahasiswa KKN)"*
- Di tabel dapat ditambahkan indikator visual:
  - Badge Biru: `Estimasi Data Awal`
  - Badge Hijau: `Terverifikasi Lapangan RW (KKN)`

---

## 🧩 4. RESTRUKTURISASI HALAMAN DETAIL KELURAHAN

Contoh Kasus: Halaman `/superUser/data-survei-kkn/:id` (misal Kelurahan Cipaganti / Dago / Sadang Serang).

### 4.1. Filosofi: Pemisahan Data Lapangan vs Penggabungan Komparasi
- **Data Mentah / Isian Lapangan:** **DIPISAH**. Baseline dan Endline memiliki konteks waktu, surveyor, dan kondisi yang berbeda.
- **Komparasi / Perbandingan:** **DIGABUNG BERSANDING** (Side-by-Side). Hanya pada bagian analisis dampak (delta).

### 4.2. Struktur Tampilan 3 Tab pada Detail Kelurahan:
```text
┌────────────────────────────────────────────────────────────────────────┐
│ Detail Survei Wilayah: Kelurahan Sadang Serang                         │
│ Kecamatan: Coblong | Status Validasi: Terverifikasi                     │
│                                                                        │
│ [ 📌 Tab 1: Baseline (Awal) ] [ 🎯 Tab 2: Endline (Akhir) ] [ 📊 Tab 3: Perbandingan Dampak ] │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Tab 1: Baseline (Survei Awal KKN)**
   - Header: Tanggal survei awal, nama enumerator/mahasiswa, jumlah KK & RT awal.
   - Ringkasan Sampah Awal: Tingkat Pemilahan (%) awal, Volume Organik, Anorganik, Residu (kg/hari).
   - Sarana Pengolahan Awal: Jumlah Bank Sampah Aktif, Komposter, Biopori awal.
   - Tabel RW Terdaftar Baseline: Menampilkan daftar RW yang berkontribusi pada data baseline kelurahan ini beserta tombol "Lihat Detail RW".

2. **Tab 2: Endline (Survei Akhir KKN)**
   - Header: Tanggal survei akhir, nama enumerator/mahasiswa akhir.
   - Ringkasan Sampah Akhir: Tingkat Pemilahan (%) akhir, Volume Sampah akhir.
   - Sarana Pengolahan Akhir: Bank sampah baru, komposter aktif baru.
   - Tabel RW Terdaftar Endline: Menampilkan daftar RW yang telah mengisi survei endline.
   - *Empty State:* Jika belum ada data endline, tampilkan pesan informatif:
     > *"Survei Endline untuk kelurahan ini belum dilaksanakan atau belum diinput."*

3. **Tab 3: Perbandingan Dampak (Komparasi Delta)**
   - Kartu Metrik Delta:
     - $\Delta$ **Tingkat Pemilahan:** Misal $+28.5\%$ (Grafik tren naik 🟢)
     - $\Delta$ **Volume Residu ke TPA:** Misal $-45.2 \text{ kg/hari}$ (Grafik tren penurunan sampah 🟢)
     - $\Delta$ **Aktivitas Pengolahan:** Penambahan unit komposter/bank sampah.
   - Tabel Komparasi Berdampingan (*Baseline vs Endline vs Selisih*).

---

## 📋 5. DAFTAR INVENTARIS KOMPONEN & FILE YANG DISESUAIKAN

| No | Modul / Halaman | File Path | Rencana Penyesuaian |
|---|---|---|---|
| 1 | **Form Publik** | `apps/web/public/survey/index.html` | Sinkronisasi RW binaan, readonly `#rumah_total`, perbaikan `restore()` draf & `resetForm()`. *(Selesai)* |
| 2 | **Dashboard Baseline** | `apps/web/src/pages/SuperUser/DataSurveiKkn.tsx` | Terapkan `normalizePercentage` pada kartu KPI dan tabel kelurahan; integrasi modal detail RW. |
| 3 | **Dashboard Endline** | `apps/web/src/pages/SuperUser/DataSurveiKkn.tsx` | Terapkan `normalizePercentage`; konsistensi endpoint `/evaluasi-dampak/endline`. |
| 4 | **Evaluasi Dampak** | `apps/web/src/pages/EvaluasiDampak/EvaluasiDampakKkn.tsx` | Perbaiki formula delta komparasi agar membaca persentase normal; perbaiki grafik batang Recharts. |
| 5 | **API Evaluasi Dampak** | `apps/api/src/services/evaluasiDampakService.ts` | Ganti Left Join menjadi Full Outer Join kelurahan agar kelurahan yang baru memiliki salah satu data (baseline/endline) tetap tampil; berikan delta persentase yang dinormalisasi. |
| 6 | **Detail Survei Kelurahan** | `apps/web/src/pages/SuperUser/DetailSurveiKkn.tsx` | Terapkan 3 Mode/Tab Utama: Tab Baseline, Tab Endline, Tab Perbandingan Dampak. |
| 7 | **Modal Edit Kelurahan** | `apps/web/src/pages/SuperUser/EditSurveiModal.tsx` | Pastikan form edit menerima input persentase standar `0..100` tanpa desimal membingungkan. |
| 8 | **Dashboard Tata Kelola Sampah** | `/dasbor?tab=tata-kelola-sampah`, `/laporan/tata-kelola-sampah` | **CATATAN KHUSUS**: Format UI dan tata letak **TIDAK DIUBAH** saat ini. Tetap mempertahankan format yang ada sekarang. |

---

## 🚀 6. TAHAPAN EKSEKUSI (DETAILED BACKLOG & QC LOOP)

Sesuai aturan `AGENTS.md` (Iterative Backlog ➡️ QC Loop: 1 item backlog ➡️ QC Backend & Web 0 error ➡️ lanjut):

### 📌 FASE 1: Fondasi Normalisasi Cerdas (Smart Normalizer)
- [x] **BACKLOG-1: Pembuatan Helper Normalisasi Persentase Terpusat**
  - **1.1. Frontend Utility (`apps/web/src/utils/surveyNormalizer.ts`):**
    - Buat fungsi `normalizePercentage(val)` (mengubah desimal `0.248` menjadi `24.8`, dan mempertahankan `42.5` tetap `42.5`).
    - Buat fungsi `formatPercentString(val)` untuk visualisasi rapi bertanda `%`.
    - Buat fungsi `determineDataProvenance(catatan, totalRw)` untuk mendeteksi apakah data berasal dari estimasi awal atau agregasi RW resmi.
  - **1.2. Backend API Service (`apps/api/src/services/evaluasiDampakService.ts`):**
    - Sinkronkan fungsi normalisasi angka pada response payload DTO baseline, endline, dan komparasi agar client menerima angka yang konsisten.
  - **QC Gate 1:**
    - `cd apps/api && npx tsc --noEmit` (0 error - PASS)
    - `cd apps/web && npx tsc --noEmit` (0 error - PASS)

---

### 📌 FASE 2: Penyelarasan Dashboard Baseline & Endline
- [x] **BACKLOG-2: Standardisasi Tampilan Kartu KPI & Tabel di `DataSurveiKkn.tsx`**
  - **2.1. Kartu Statistik Atas:**
    - Hilangkan perhitungan ganda `(persentase || 0) * 100` yang redundan, gunakan `normalizePercentage()`.
    - Pastikan nilai rata-rata pemilahan tidak meledak di atas 100%.
  - **2.2. Tabel Ringkasan Kelurahan (Tab 1):**
    - Tampilkan persentase pemilahan seragam `0..100%`.
    - Tambahkan badge keterangan sumber data: `[Data Awal]` atau `[Terverifikasi X RW]`.
  - **2.3. Tab Lapangan RW (Tab 2):**
    - Pastikan filter kelurahan dan pemanggilan modal detail survei RW berfungsi mulus baik untuk Baseline maupun Endline.
  - **QC Gate 2:**
    - `cd apps/web && npx tsc --noEmit` (0 error - PASS)
    - Verifikasi visual tabel & kartu KPI (PASS)

---

### 📌 FASE 3: Penyempurnaan Evaluasi Dampak (Komparasi Delta)
- [x] **BACKLOG-3: Penyelarasan Rumus Komparasi & Visualisasi Grafik Recharts**
  - **3.1. Backend Komparasi (`evaluasiDampakService.ts`):**
    - Ubah logika merge agar mengikutsertakan seluruh kelurahan (Full Outer Map), sehingga kelurahan yang baru memiliki endline atau baru memiliki baseline tidak hilang.
    - Hitung delta pemilahan berdasarkan persentase yang sudah dinormalisasi ($\Delta = \text{Endline} - \text{Baseline}$).
  - **3.2. Frontend Evaluasi Dampak (`EvaluasiDampakKkn.tsx`):**
    - Perbaiki bar chart Recharts agar skala sumbu Y konsisten 0–100%.
    - Pastikan indikator tren kenaikan/penurunan (warna hijau/merah) sesuai dengan logika:
      - Pemilahan naik = Positif (Hijau 🟢)
      - Volume sampah turun = Positif (Hijau 🟢)
  - **QC Gate 3:**
    - `cd apps/api && npx tsc --noEmit` (0 error - PASS)
    - `cd apps/web && npx tsc --noEmit` (0 error - PASS)

---

### 📌 FASE 4: Restrukturisasi Halaman Detail Kelurahan (`DetailSurveiKkn.tsx`)
- [x] **BACKLOG-4: Penerapan 3 Mode/Tab pada Detail Kelurahan**
  - **4.1. Pemisahan Tab Data Lapangan:**
    - **Tab Baseline:** Khusus data awal kondisi sebelum KKN (survei awal, volume awal, fasilitas awal, daftar RW baseline).
    - **Tab Endline:** Khusus data capaian akhir saat KKN selesai (survei akhir, capaian pemilahan akhir, fasilitas bertambah, daftar RW endline).
  - **4.2. Penggabungan Komparasi:**
    - **Tab Perbandingan Dampak:** Komparasi bersanding (Side-by-Side) khusus delta perubahan antara baseline dan endline untuk kelurahan tersebut.
  - **4.3. Data Preservation:**
    - Pastikan kelurahan dengan data awal (seperti Cipaganti/Sadang Serang) tetap tampil lengkap di Tab Baseline tanpa terhapus atau tertimpa kosong.
  - **QC Gate 4:**
    - `cd apps/web && npx tsc --noEmit` (0 error - PASS)

---

### 📌 FASE 5: Audit & Konfirmasi Akhir (Final QC)
- [x] **BACKLOG-5: Audit Kepatuhan Monorepo & Zero Regression**
  - Cek larangan kata `'tong'` di seluruh kode/UI baru (wajib `'Tempat Sampah'`). (PASS - 0 match)
  - Verifikasi bahwa halaman Dashboard Tata Kelola Sampah tidak mengalami perubahan format. (PASS - tidak ada file terdampak)
  - Ringkasan review perubahan dan persiapan commit lokal. (PASS)

---

### 📌 FASE 6: Collaborative Auto Pre-Fill & Baseline-to-Endline Inheritance
- [x] **BACKLOG-6: Penyelarasan Pengisian Kolaboratif Form `/survey/`**
  - **6.1. Backend API (`surveyService.ts` & `surveyController.ts`):**
    - Perkaya endpoint `GET /api/v1/survey/check-rw` mengembalikan objek survei lengkap, `hasBaseline`, dan `baselineSurvey`.
    - Tambahkan validasi prasyarat di `submitSurvey`: tolak survei Endline jika RW belum memiliki Baseline (`BASELINE_REQUIRED`).
  - **6.2. Frontend Form (`apps/web/public/survey/index.html`):**
    - Mode Edit / Update: pre-fill otomatis data survei RW yang sudah ada tanpa menimpa NIM & identitas pengisi saat ini.
    - Mode Gating Endline: kunci submit dan tampilkan banner peringatan merah jika Endline dipilih pada RW tanpa Baseline.
    - Mode Pewarisan (Inheritance): otomatis isi demografi & karakteristik awal dari Baseline ke form Endline.
    - Auto-update WhatsApp: nomor WhatsApp aktif selalu sinkron berganti mengikuti nomor mahasiswa baru saat ganti NIM.
  - **QC Gate 6:**
    - `cd apps/api && npx tsc --noEmit` (0 error - PASS)
    - `cd apps/web && npx tsc --noEmit` (0 error - PASS)

---

### 📌 FASE 7: Isolasi Scope & Segmented Filter Tahap Rekap pada Tab Data Masuk
- [x] **BACKLOG-7: Penyelarasan Tab Data Masuk & Card Rekap Volume**
  - **7.1. Segmented Filter Kapsul `[ Semua ] [ Baseline ] [ Endline ]`:**
    - Menambahkan tombol kapsul interaktif pada header Card Rekap Volume.
    - Mengintegrasikan styling CSS modern dengan indikator warna status Baseline (kuning) dan Endline (hijau).
  - **7.2. Dynamic Computation Engine (`computeRekapFromSurveys`):**
    - Rekap dihitung langsung dari subset data survei yang aktif sesuai scope saat ini (`scopedSurveys`).
    - Tab `Survei Saya`: Rekap khusus menghitung data milik surveyor terkait.
    - Tab `Kelompok Saya`: Rekap khusus menghitung data milik kelompok KKN terkait.
    - Tab `Semua Wilayah`: Rekap menghitung akumulasi se-Coblong (atau filter kelurahan yang dipilih).
  - **QC Gate 7:**
    - `cd apps/api && npx tsc --noEmit` (0 error - PASS)
    - `cd apps/web && npx tsc --noEmit` (0 error - PASS)

---

## ✅ 7. KRITERIA KEBERHASILAN (DEFINITION OF DONE)
1. **Tidak Ada Data Hilang:** Seluruh data baseline lama di VPS Staging/Prod tetap utuh dan terbaca dengan benar.
2. **Angka Konsisten:** Tidak ada lagi angka persentase ganda seperti `0.25%` berdampingan dengan `42.5%`. Semua tampil rapi dalam skala `0 - 100%`.
3. **Form Publik Terhubung Sempurna:** Setiap submit baru dari `/survey/` otomatis mengalir ke tabel RW dan memperbarui agregat kelurahan secara *real-time*.
4. **Detail Kelurahan Jelas & Terstruktur:** Pengguna dapat dengan mudah membedakan data awal (Baseline) dan capaian akhir (Endline) serta melihat hasil evaluasi dampaknya.
5. **Quality Check 100%:** Backend `tsc` 0 error, Frontend `tsc` 0 error, dan tidak ada larangan kata terlanggar.
