# IMPLEMENTATION PLAN: OVERHAUL & REDESIGN LAPORAN TATA KELOLA SAMPAH
### Platform Cerdas BERSEKA — Kecamatan Coblong, Kota Bandung

---

## 1. LATAR BELAKANG & TUJUAN
Tampilan antarmuka laporan sebelumnya (`/laporan/tata-kelola-sampah`) dinilai masih membawa pola lama yang kurang mencerminkan laporan kebijakan eksekutif tata kelola sampah:
1. **Kurang Visual Analitik**: Tidak ada grafik interaktif modern (sebelumnya hanya berupa batang persentase statis CSS tanpa perbandingan visual yang jelas).
2. **Kelebihan Metrik Operasional**: Metrik tempat sampah/wadah mendominasi kartu KPI utama, padahal fokus pimpinan adalah pada **dampak pengelolaan sampah** dan **perubahan perilaku warga**.
3. **Filter Bertingkat yang Redundan**: Adanya toolbar filter bertumpuk di dalam tabel yang membingungkan.
4. **Klaim Ambigu**: Rasio reduksi 100% dinarasikan kaku tanpa konteks neraca massa yang transparan.

**Tujuan Perombakan**:
Membangun antarmuka laporan baru yang **segar, profesional, elegan, dan kaya akan visual analitik (*Visual Analytics*)** menggunakan Recharts (Donut Chart & Grouped Bar Chart), berfokus 100% pada 4 pilar tata kelola persampahan, dan bebas dari ambiguitas data.

---

## 2. DAFTAR BERKAS YANG TERPENGARUH (AFFECTED FILES)

| No | Berkas | Peran Perubahan |
|:--:|:---|:---|
| 1 | `apps/web/src/pages/Laporan/LaporanTataKelolaSampahPage.tsx` | Perombakan menyeluruh struktur layout Dasbor Web, integrasi komponen visual Recharts (Donut & Grouped Bar), pembersihan filter redundan, dan standarisasi kartu 4 pilar. |
| 2 | `docs/IMPLEMENTATION_PLAN_REDESIGN_LAPORAN_TATA_KELOLA.md` | Dokumen panduan implementasi resmi. |

---

## 3. ARSITEKTUR ANTARMUKA BARU (LAYOUT & KOMPONEN)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. HEADER EKSEKUTIF                                                         │
│    • Judul Resmi, Logo Pemkot Bandung & UNIKOM                              │
│    • Filter Wilayah Tunggal (Coblong / 6 Kelurahan)                         │
│    • Tombol Aksi: Cetak Naskah Dinas PDF, Ekspor Excel XLSX                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. EMPAT KARTU METRIK UTAMA TATA KELOLA (Grid 4 Kolom Proporsional)         │
│    [ Total Sampah Terkelola ]  ──> 10.616,13 kg (71,8% Org • 28,2% Anorg)  │
│    [ Indeks Kepatuhan Warga ]  ──> 82,4% (+65,3 pp dari Baseline KKN 17,1%)│
│    [ Valorisasi Emisi Karbon]  ──> 6.537,08 kg CO₂e (Metode IPCC Tier 1)   │
│    [ Jejaring Fasilitas Olah]  ──> 100 Titik (TPS3R, Bank Sampah, Maggot)  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. ANALISIS VISUAL TATA KELOLA (2 Kolom Grafik Recharts Interaktif)         │
│    ┌───────────────────────────────────┬──────────────────────────────────┐ │
│    │ Grafik A (Kiri):                  │ Grafik B (Kanan):                │ │
│    │ Donut Chart Komposisi Dua Fraksi  │ Grouped Bar Chart Komparatif     │ │
│    │ • Organik vs Anorganik            │ Kinerja 6 Kelurahan              │ │
│    │ • Visual interaktif Recharts Pie  │ • Bar 1: Baseline KKN B₀ (kg)    │ │
│    │ • Serapan Kompos, Maggot, Bank Smp│ • Bar 2: Realisasi Aktual B₁ (kg)│ │
│    └───────────────────────────────────┴──────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. TABEL AUDIT EVALUASI KINERJA 6 KELURAHAN (Tabel 10 Kolom Baku SSOT)      │
│    • Filter toolbar disederhanakan (pencarian instan & sort A-Z)            │
│    • Kolom: No, Kelurahan, Baseline KKN (kg), Realisasi Aktual (kg),        │
│      Penurunan (kg), Penurunan (%), Baseline Kepatuhan (%), Aktual (%),     │
│      Deviasi (Δ pp), Status Verifikasi                                      │
│    • Baris Sticky Total Kecamatan Coblong di bagian bawah                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. REKOMENDASI KEBIJAKAN LINGKUNGAN (4 Wawasan Strategis)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 6. LAMPIRAN OPERASIONAL (Fasilitas Pengolahan & Monitoring Tempat Sampah)   │
│    • Ditempatkan di bagian bawah sebagai lampiran pendukung verifikasi DLH  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. TAHAPAN PENGERJAAN RINCI (STEP-BY-STEP)

### 🔹 Langkah 1: Penataan Ulang 4 Kartu Metrik Utama
* Mengubah tata letak kartu atas dari 5 kartu menjadi **4 Kartu KPI Inti yang Berbobot** (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`):
  1. **Total Sampah Terkelola di Sumber**: Nilai `formatKgNum(totalSampahTerpilahKg) + " kg"`, subteks persentase komposisi Organik & Anorganik.
  2. **Indeks Kepatuhan Pemilahan Warga**: Nilai persentase dengan tren pertumbuhan `+pp` dari baseline survei KKN.
  3. **Valorisasi Reduksi Emisi Gas Rumah Kaca (GRK)**: Nilai `formatKgNum(reduksiEmisiCo2Kg) + " kg CO₂e"` dengan standar IPCC Tier 1 (0,858).
  4. **Jejaring Fasilitas Sirkular Aktif**: Total fasilitas terdata (TPS3R, Bank Sampah Unit, Rumah Maggot, Komposter Lingkungan).

### 🔹 Langkah 2: Pembangunan 2 Grafik Visual Interaktif (Recharts)
* **Grafik Kiri (Donut Chart Komposisi Sampah)**:
  * Menggunakan `ResponsiveContainer`, `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`.
  * Menampilkan irisan:
    - Sampah Organik (Warna Emerald `#10b981`)
    - Sampah Anorganik (Warna Biru `#3b82f6`)
  * Di tengah donut chart terdapat total tonase akumulasi terkelola.
* **Grafik Kanan (Grouped Bar Chart Komparatif 6 Kelurahan)**:
  * Menggunakan `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`.
  * Membandingkan berdampingan:
    - Batang 1: **Baseline Survei KKN ($B_0$)** (Warna Slate `#94a3b8`)
    - Batang 2: **Realisasi Aktual Lapangan ($B_1$)** (Warna Emerald `#009966`)
  * Sumbu X menampilkan 6 kelurahan: Cipaganti, Dago, Lebak Gede, Lebak Siliwangi, Sadang Serang, Sekeloa.
  * Pimpinan dapat langsung melihat kelurahan mana yang beban sampahnya berkurang secara visual.

### 🔹 Langkah 3: Penyederhanaan Toolbar & Tabel Matriks Kinerja
* Menghilangkan toolbar filter ganda (tombol preset harian/kemarin/bulanan di dalam tabel dihapus agar tidak bentrok dengan filter utama).
* Mempertahankan fitur penting: Input pencarian cepat nama kelurahan dan tombol sortir A–Z.
* Memastikan format tabel 10 kolom tetap presisi dalam satuan `kg` (2 desimal) dengan baris total Kecamatan Coblong di bagian bawah.

### 🔹 Langkah 4: Penataan Lampiran Operasional
* Menempatkan data logistik teknis (rincian 92+ fasilitas sirkular dan status wadah Tempat Sampah normal/waspada/kritis) di bagian bawah halaman dengan penanda *Lampiran Resmi*.

---

## 5. RENCANA QUALITY CONTROL (QC GATE)
1. **Frontend Web Typecheck**:
   `cd apps/web && npx tsc --noEmit` ➡️ Wajib **0 Error**.
2. **Backend API Typecheck**:
   `cd apps/api && npx tsc --noEmit` ➡️ Wajib **0 Error**.
3. **Pemeriksaan Istilah Terlarang**:
   Tidak ada kemunculan kata `'tong'` sesuai pedoman `AGENTS.md`.
4. **Verifikasi Responsivitas & Tampilan Visual**:
   * Donut chart dan bar chart merender data dengan mulus tanpa error Recharts.
   * Tooltip interaktif menampilkan angka dalam format bahasa Indonesia (`id-ID`).

---

## 6. RENCANA ROLLBACK
Seluruh modifikasi dilakukan pada berkas frontend `LaporanTataKelolaSampahPage.tsx`. Jika terjadi kendala visual, berkas dapat di-revert secara instan via `git checkout` tanpa mempengaruhi fungsionalitas backend atau modul lainnya.
