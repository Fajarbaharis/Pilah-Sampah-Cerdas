# IMPLEMENTATION PLAN: PERBAIKAN & PENYELARASAN LAPORAN TATA KELOLA SAMPAH
### Platform Cerdas BERSEKA — Kecamatan Coblong, Kota Bandung

---

## 1. RINGKASAN TUJUAN
Mengimplementasikan perancangan ulang sistem Laporan Tata Kelola Sampah (`/laporan/tata-kelola-sampah`) agar:
1. **100% Selaras dengan Dasbor (*Single Source of Truth*)**: Menggunakan basis agregasi yang identik dengan modul Dasbor (`dashboardService.getKpi` & `complianceService`), tanpa selisih data.
2. **Bebas Angka Hardcoded (Anti-Dummy Policy)**: Menghapus angka hardcode Tempat Sampah (`765/769 unit`) dan mengambilnya secara dinamis dari database PostgreSQL.
3. **Standarisasi Satuan Baku `kg` (Maks. 2 Desimal)**: Menyeragamkan seluruh metrik berat sampah ke dalam satuan Kilogram (kg) dengan presisi 2 desimal untuk integritas verifikasi matematika.
4. **Struktur Naskah Eksekutif Dual-Layer**: Memisahkan Naskah Utama Pimpinan (Dampak TPA & Kepatuhan) dari Lampiran Rincian Teknis/Operasional (Fasilitas & Wadah Tempat Sampah).
5. **Default Presets**: Default sumber data adalah `ALL` (Gabungan Warga + Petugas) dan default periode adalah `Semua Waktu` (Laporan Akhir Lengkap).

---

## 2. DAFTAR BERKAS YANG TERPENGARUH (AFFECTED FILES)

| No | Lokasi Berkas | Layer | Tanggung Jawab Perubahan |
|:--:|:---|:---:|:---|
| 1 | `apps/api/src/services/wasteExecutiveReportService.ts` | Backend Service | Pembersihan hardcode wadah, sinkronisasi SSOT `getKpi`, perbaikan filter tanggal dinamis, penyelarasan formula emisi IPCC (0,858), dan perbaikan template ekspor Excel. |
| 2 | `apps/web/src/pages/Laporan/LaporanTataKelolaSampahPage.tsx` | Frontend Page | Perubahan default filter (`ALL` & `semua`), standarisasi format `kg` (2 desimal), penyusunan layout Dual-Layer (Inti vs Lampiran), dan penyelarasan naskah cetak dinas. |
| 3 | `apps/web/src/pages/Laporan/types.ts` | Frontend Types | Penyesuaian antarmuka data laporan jika ada penambahan struktur lampiran rincian. |

---

## 3. TAHAPAN EKSEKUSI & SIKLUS QC ITERATIF

### 🔹 TAHAP 1: Backend Core, Anti-Dummy & SSOT Dasbor
* **Deskripsi**:
  1. Hapus nilai statis `activeBinsCount = 765`, `totalActiveBinsCount = 769`, `unmappedBinsCount = 4` pada `wasteExecutiveReportService.ts`.
  2. Hitung jumlah Tempat Sampah aktif dan terverifikasi GPS langsung dari database PostgreSQL:
     ```typescript
     const activeBinsCount = await prisma.bin.count({
       where: { ...binWhere, status: "ACTIVE_BOUND", latitude: { not: null }, longitude: { not: null } }
     });
     const totalActiveBinsCount = await prisma.bin.count({
       where: { ...binWhere, status: "ACTIVE_BOUND" }
     });
     ```
  3. Perbaiki pengambilan data matriks kelurahan agar menggunakan parameter filter dinamis (`period`, `startDate`, `endDate`, `sourceType`) dari `dashKpi.baselineComparison` tanpa menimpanya dengan data harian kemarin (`dashDaily`).
  4. Selaraskan formula emisi gas rumah kaca ke standar IPCC Tier 1:
     $$\text{Reduksi CO}_2\text{e (kg)} = \text{Tonase Organik Terolah (kg)} \times 0,858\text{ kg CO}_2\text{e/kg}$$
* **Kriteria QC Tahap 1**:
  * Jalankan `cd apps/api && npx tsc --noEmit` ➡️ Wajib **0 Error**.
  * Jalankan pengujian pemanggilan servis melalui script terminal untuk memastikan data keluaran JSON valid dan Tempat Sampah dihitung dinamis.

---

### 🔹 TAHAP 2: Penyelarasan Template Ekspor Excel (.xlsx)
* **Deskripsi**:
  1. Perbarui metode `exportWasteExecutiveReport` pada `wasteExecutiveReportService.ts`.
  2. Pada Sheet "Kinerja per Kelurahan", ubah susunan kolom agar identik dengan tabel evaluasi komparatif di layar web:
     * No, Kelurahan Binaan, Baseline KKN (kg), Realisasi Aktual (kg), Penurunan Berat (kg), % Penurunan, Baseline Kepatuhan (%), Kepatuhan Aktual (%), Deviasi (Δ pp), Status Kinerja.
  3. Seluruh angka berat diformat dalam satuan `kg` dengan 2 desimal.
  4. Tambahkan Sheet Lampiran untuk Daftar Fasilitas Pengolahan & Sebaran Tempat Sampah.
* **Kriteria QC Tahap 2**:
  * Jalankan `cd apps/api && npx tsc --noEmit` ➡️ Wajib **0 Error**.
  * Validasi struktur workbook XLSX melalui unit test / script probe.

---

### 🔹 TAHAP 3: Frontend Web View Refinement & Standarisasi Satuan Kg
* **Deskripsi**:
  1. Pada `LaporanTataKelolaSampahPage.tsx`, ubah nilai default state:
     * `tableSource`: default `"ALL"`
     * `tablePeriod`: default `"ALL"`
  2. Standarisasi helper pemformatan angka berat:
     * Gunakan format `toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kg"` secara seragam di seluruh kartu KPI dan tabel.
  3. Selaraskan teks tooltip formula emisi GRK menjadi $0,858\text{ kg CO}_2\text{e/kg}$ (IPCC Tier 1).
  4. Susun tata letak Dual-Layer pada tampilan Dasbor Web:
     * **Bagian Atas (Inti)**: 4 Kartu KPI Utama, Dua Fraksi (Organik vs Anorganik), Matriks 6 Kelurahan, dan Rekomendasi Kebijakan.
     * **Bagian Bawah / Lampiran Lipatan (Rincian Operasional)**: Inventaris Fasilitas Pengolahan Sirkular & Monitoring Tempat Sampah (Wadah Normal/Waspada/Kritis).
* **Kriteria QC Tahap 3**:
  * Jalankan `cd apps/web && npx tsc --noEmit` ➡️ Wajib **0 Error**.

---

### 🔹 TAHAP 4: Penyelarasan Naskah Cetak Dinas (Mode Dokumen / Print PDF)
* **Deskripsi**:
  1. Sesuaikan tampilan tabel pada `viewMode === "document"` agar menggunakan kolom yang ringkas dan rapi (10 kolom standar naskah dinas dalam satuan `kg` 2 desimal).
  2. Pastikan tabel fit dan tidak terpotong pada batas margin cetak kertas standar A4/F4.
  3. Pastikan blok tanda tangan tiga pihak (Camat Coblong, DLH Kota Bandung, Pimpinan/Rektorat) berada pada posisi yang rapi (*avoid page break*).
* **Kriteria QC Tahap 4**:
  * Jalankan `cd apps/web && npx tsc --noEmit` ➡️ Wajib **0 Error**.
  * Verifikasi tampilan cetak CSS (`@media print`).

---

### 🔹 TAHAP 5: Quality Control Menyeluruh & Verifikasi Antar-Halaman
* **Deskripsi**:
  1. Komparasi nilai angka antara `/dasbor?tab=tata-kelola-sampah` dan `/laporan/tata-kelola-sampah` pada filter yang sama:
     * Baseline 6 kelurahan: Total harus identik $1.670,50\text{ kg/hari}$.
     * Realisasi aktual & persentase kepatuhan: Harus sinkron tanpa perbedaan.
  2. Verifikasi aksesibilitas role: Pimpinan, Super User, dan Developer dapat melihat dan mencetak dokumen.
  3. Verifikasi ketiadaan kata terlarang (`tong`) sesuai instruksi `AGENTS.md`.
* **Kriteria QC Tahap 5**:
  * `cd apps/api && npx tsc --noEmit` ➡️ **0 Error**.
  * `cd apps/web && npx tsc --noEmit` ➡️ **0 Error**.
  * Penyerahan ringkasan review perubahan kepada pengguna sebelum commit/push.

---

## 4. RENCANA ROLLBACK & MITIGASI RISIKO
* Seluruh perubahan dilakukan secara modular tanpa mengubah skema basis data PostgreSQL (`prisma/schema.prisma`).
* Jika terjadi kegagalan atau kendala pada salah satu tahap, perubahan dapat di-revert per file via git tanpa merusak modul aplikasi lainnya.
