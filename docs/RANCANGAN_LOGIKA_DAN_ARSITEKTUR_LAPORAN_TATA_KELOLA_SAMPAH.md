# DOKUMEN RANCANGAN LOGIKA & ARSITEKTUR
# LAPORAN EKSEKUTIF TATA KELOLA PERSAMPAHAN BERKELANJUTAN
### Platform Cerdas BERSEKA — Kecamatan Coblong, Kota Bandung

---

## 1. PENDAHULUAN & LATAR BELAKANG

### 1.1. Masalah pada Implementasi Sebelumnya
Berdasarkan hasil audit mendalam terhadap halaman `/laporan/tata-kelola-sampah` dan berkas servis pendukung (`wasteExecutiveReportService.ts`, `LaporanTataKelolaSampahPage.tsx`), ditemukan beberapa kelemahan mendasar:
1. **Pencampuran Peran (Role Confusion)**: Laporan menyajikan data operasional teknis lapangan (misal: wadah kritis >90%, status ritase truk) bercampur aduk dengan indikator strategis, sehingga mengaburkan pesan utama kepada pengambil kebijakan.
2. **Adanya Angka Hardcoded**: Terdapat hardcode jumlah Tempat Sampah aktif (`765/769 unit`) pada servis backend yang bertentangan dengan kebijakan *Anti-Dummy Policy*.
3. **Inkonsistensi Filter Waktu**: Saat pengguna memilih filter bulanan atau kustom, data tabel 6 kelurahan di backend masih dipaksa mengambil data harian "kemarin" (`dashDaily`), menimbulkan selisih angka antara kartu ringkasan atas dan tabel bawah.
4. **Perbedaan Rumus & Teks UI**: Formula reduksi emisi gas rumah kaca di tooltip UI ($0,858\text{ kg CO}_2\text{e/kg}$) berbeda dengan formula kalkulasi backend ($0,58\text{ organik} + 1,45\text{ anorganik}$).
5. **Ketidaksinkronan Ekspor Excel**: Format kolom tabel pada berkas Excel yang diunduh pimpinan berbeda dengan format tabel evaluasi komparatif yang tampil di layar web.

### 1.2. Tujuan Perancangan Ulang
Dokumen ini merumuskan perancangan ulang sistem laporan tata kelola sampah agar menjadi **Laporan Akuntabilitas & Rekomendasi Kebijakan Resmi** yang kredibel, seragam, dan siap disajikan kepada Pimpinan Eksekutif (Rektorat UNIKOM, Dinas Lingkungan Hidup Kota Bandung, Camat Coblong, dan Lurah setempat).

### 1.3. Dua Pilar Utama Laporan (*Dual Core Focus*)
Laporan ini didesain secara khusus untuk membuktikan dua hal utama secara seimbang:
1. **Penurunan Beban TPA (Waste Diversion & Landfill Reduction)**:
   Membuktikan secara kuantitatif berapa berat sampah yang berhasil dicegah agar tidak terbuang ke TPA Sarimukti melalui sistem pengolahan mandiri di hulu (kompos, rumah maggot BSF, dan bank sampah).
2. **Peningkatan Kepatuhan & Perubahan Perilaku Warga (Behavioral Shift)**:
   Membuktikan adanya dampak edukasi sosial dan intervensi program terhadap kenaikan indeks kepatuhan pemilahan rumah tangga dibandingkan dengan *Baseline* Survei Lapangan KKN Juli 2026.

---

## 2. HAK AKSES & OTORISASI PENGGUNA (RBAC)

Laporan ini memiliki status **Dokumen Kedinasan & Kebijakan Strategis**. Matriks otorisasi pengguna diatur sebagai berikut:

| Peran (Role) | Akses Web View | Cetak Naskah Dinas (PDF) | Ekspor Spreadsheet (XLSX) | Ubah Konfigurasi Naskah (SK / Penandatangan) |
| :--- | :---: | :---: | :---: | :---: |
| **PIMPINAN / PEMIMPIN** | Ya | Ya | Ya | Ya |
| **SUPER_USER** | Ya | Ya | Ya | Ya |
| **DEVELOPER** | Ya | Ya | Ya | Ya |
| **ADMIN_DLH** | Ya | Ya | Ya | Hanya Lihat |
| **CAMAT** | Ya | Ya | Ya | Hanya Lihat |
| **LURAH** | Ya (Tersaring wilayahnya) | Ya (Wilayahnya) | Ya | Tidak |
| **RW / RT** | Tidak | Tidak | Tidak | Tidak |
| **WARGA / PETUGAS** | Tidak | Tidak | Tidak | Tidak |

---

## 3. ATURAN STANDARISASI SATUAN & PRESET DEFAULT SISTEM

### 3.1. Kebijakan Satuan Baku: Kilogram (kg) Presisi 2 Desimal
Berdasarkan hasil kesepakatan diskusi, seluruh metrik berat sampah pada laporan ini (baik kartu ringkasan eksekutif, tabel komparatif 6 kelurahan, dokumen dinas cetak, maupun ekspor spreadsheet) **distandarisasi secara konsisten menggunakan satuan Kilogram (kg) dengan maksimal 2 angka di belakang koma**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ KEBIJAKAN STANDARISASI SATUAN BERAT:                                   │
│ • Satuan Baku : Kilogram ("kg") untuk seluruh tingkatan data           │
│ • Format Desimal : Maksimal 2 angka di belakang koma                   │
│ • Format Angka Indonesia : Pemisah ribuan titik (.), desimal koma (,) │
│   Contoh:                                                              │
│   - Baseline Cipaganti  : 96,00 kg                                     │
│   - Baseline Siliwangi  : 96,50 kg                                     │
│   - Total Timbulan Wil. : 1.670,50 kg                                  │
│   - Akumulasi Bulanan   : 14.850,25 kg                                 │
└────────────────────────────────────────────────────────────────────────┘
```
**Alasan Keunggulan Satuan Baku Kg**:
* **Integritas Verifikasi Matematika**: Auditor dan pimpinan kedinasan dapat langsung menjumlahkan angka baris 1 sampai 6 ke baris total tanpa ada distorsi atau perbedaan pembulatan konversi antar satuan (kg vs ton).
* **Konsistensi Visual**: Menghilangkan kebingungan akibat perubahan satuan dinamis di kolom tabel yang sama.

### 3.2. Satuan Non-Berat:
* **Persentase Kepatuhan & Reduksi**: Selalu menggunakan simbol `%` dengan 1 angka di belakang koma (misal: `74,5%`).
* **Deviasi Kepatuhan**: Menggunakan satuan *percentage points* (`pp`) dengan tanda plus/minus (misal: `+57,4 pp`).
* **Emisi Gas Rumah Kaca (GRK)**: Menggunakan satuan `kg CO₂e` dengan 1 angka di belakang koma (misal: `1.432,8 kg CO₂e`).

### 3.3. Nilai Baku Pengaturan Awal (Default Presets):
* **Default Sumber Data**: **`ALL` (Semua Sumber: Aktivitas Warga App + Penimbangan Petugas Lapangan)**  
  *Alasan:* Merefleksikan 100% kerja nyata tata kelola persampahan di wilayah tanpa memotong salah satu kanal.
* **Default Periode Waktu**: **`Semua Waktu / Akumulasi Penuh Periode Program`**  
  *Alasan:* Ketika pimpinan membuka halaman laporan, sistem langsung menyajikan status Laporan Akhir Lengkap (*Final Report State*). Toolbar filter harian/bulanan tetap disediakan untuk keperluan evaluasi khusus.

---

## 4. STRUKTUR NASKAH LAPORAN (DUAL-LAYER ARCHITECTURE)

Laporan dibagi menjadi 2 lapisan arsitektur untuk memisahkan kebutuhan strategis pimpinan dengan kebutuhan verifikasi data teknis:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                     STRUKTUR DUAL-LAYER LAPORAN                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  [LAYER 1: NASKAH EKSEKUTIF INTI (EXECUTIVE CORE)]                        │
│  ├─ 1. Kop Surat Kedinasan Bersama (UNIKOM, DLH Kota Bandung, Coblong)    │
│  ├─ 2. Metadata Surat Dinas (Nomor SK, Sifat, Tanggal, Perihal)           │
│  ├─ 3. Pernyataan Ringkasan Eksekutif & Capaian Program                   │
│  ├─ 4. Ringkasan 4 Kartu KPI Utama (Sampah, Kepatuhan, Emisi, Fasilitas)  │
│  ├─ 5. Neraca Massa Dua Fraksi (Organik vs Anorganik)                     │
│  ├─ 6. Matriks Evaluasi Komparatif 6 Kelurahan (Baseline B0 vs B1 kg)     │
│  ├─ 7. Peringatan Dini & Rekomendasi Kebijakan Lingkungan                 │
│  └─ 8. Blok Pengesahan & Tanda Tangan Tiga Pihak (Camat, DLH, Pimpinan)   │
│                                                                           │
│  [LAYER 2: LAMPIRAN RINCIAN OPERASIONAL (DETAILED APPENDICES)]            │
│  ├─ Lampiran A: Buku Induk Fasilitas Pengolahan (TPS3R, Bank Sampah, dll) │
│  ├─ Lampiran B: Sebaran Tempat Sampah Cerdas & Status GPS Spasial         │
│  └─ Lampiran C: Rekapitulasi Ritase Pengangkutan & Pembuangan Residu      │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 5. DIAGRAM ALUR DATA & ARSITEKTUR SISTEM

### 5.1. Alur Pengolahan Data dari Sumber ke Laporan

```
   [ WARGA APP ]           [ PETUGAS RESIDU ]          [ PENGELOLA FASILITAS ]
  (Setoran Otomatis       (Setoran Manual /           (Pencatatan Produksi Kompos,
   Klasifikasi AI)          Penimbangan TPS)            Maggot BSF, Bank Sampah)
          │                        │                               │
          ▼                        ▼                               ▼
 [ setoran_otomatis ]     [ setoran_manual ]         [ catatan_produksi_fasilitas ]
          │                        │                 [ pemanfaatan_sampah ]
          └────────────────────────┼───────────────────────────────┘
                                   │
                                   ▼
          ┌─────────────────────────────────────────────────┐
          │      wasteExecutiveReportService (Backend)      │
          │  1. Single Source of Truth (SSOT) via           │
          │     dashboardService.getKpi & complianceService │
          │  2. Filter Akun Testing (Anti-Dummy Guard)      │
          │  3. Normalisasi Waktu WIB (Start & End Date)    │
          │  4. Default Mode: ALL Sources, Periode Semua    │
          │  5. Agregasi Baseline KKN (B0) dlm satuan kg    │
          │  6. Valorisasi Emisi GRK (IPCC Tier 1: 0,858)   │
          └─────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
       [ API REST JSON RESPONSE ]    [ EXCEL SPREADSHEET BUILDER ]
    /api/v1/dashboard/waste-report    /api/v1/dashboard/waste-report/export
                    │                             │
                    ▼                             ▼
       ┌────────────────────────┐      ┌─────────────────────────┐
       │   Frontend React Web   │      │ File .xlsx Multi-Sheet  │
       │  LaporanTataKelola.tsx │      │ 1. Ringkasan Eksekutif  │
       │ ├─ Mode Web Dasbor     │      │ 2. Matriks 6 Kelurahan  │
       │ └─ Mode Dokumen Cetak  │      │ 3. Inventaris Fasilitas │
       └────────────────────────┘      └─────────────────────────┘
```

---

## 6. FORMULASI MATEMATIS & METRIK BAKU

### 6.1. Metrik Penurunan Sampah ke TPA (Pilar 1)
1. **Baseline Timbulan Harian KKN ($B_0$)**:
   Konstanta hasil survei komprehensif KKN Tematik 2026:
   * Cipaganti: $96,00\text{ kg/hari}$
   * Dago: $122,00\text{ kg/hari}$
   * Lebak Gede: $100,00\text{ kg/hari}$
   * Lebak Siliwangi: $96,50\text{ kg/hari}$
   * Sadang Serang: $835,00\text{ kg/hari}$
   * Sekeloa: $421,00\text{ kg/hari}$
   * **Total Baseline Coblong**: $\mathbf{1.670,50\text{ kg/hari}}$.
2. **Realisasi Aktual Timbulan ($B_1$)**:
   $$\text{Aktual (kg)} = \sum \text{Setoran Warga (Organik + Anorganik)} + \sum \text{Setoran Petugas (Residu)}$$
3. **Penurunan Berat Sampah ($\Delta B$)**:
   $$\Delta B\text{ (kg)} = B_0 - B_1$$
4. **Persentase Reduksi Beban Sampah**:
   $$\% \text{ Reduksi} = \left( \frac{\Delta B}{B_0} \right) \times 100\%$$

### 6.2. Metrik Kepatuhan Pemilahan Warga (Pilar 2)
1. **Baseline Kepatuhan Survei Awal**:
   Rata-rata tertimbang wilayah: $\mathbf{17,1\%}$ (Cipaganti 13,7%, Dago 10,0%, Lebak Gede 21,6%, Lebak Siliwangi 15,0%, Sadang Serang 24,8%, Sekeloa 17,8%).
2. **Indeks Kepatuhan Aktual**:
   Menyeimbangkan ketepatan kamera AI dan partisipasi aktif rumah tangga (anti-bias):
   $$\text{Indeks Kepatuhan} = (50\% \times \text{Rasio Partisipasi Warga}) + (50\% \times \text{Ketepatan Wadah Tempat Sampah})$$
3. **Pertumbuhan Kepatuhan ($\Delta \text{ pp}$)**:
   $$\Delta \text{ pp} = \text{Kepatuhan Aktual (\%)} - \text{Baseline KKN (\%)}$$

### 6.3. Metrik Valorisasi Emisi Karbon (GRK)
Mengacu pada protokol resmi **IPCC Tier 1 / DLH Kota Bandung**:
$$\text{Reduksi CO}_2\text{e (kg)} = \text{Tonase Sampah Organik Terolah (kg)} \times 0,858\text{ kg CO}_2\text{e/kg}$$

---

## 7. RENCANA DETAIL TABEL MATRIKS 6 KELURAHAN (PADA DOKUMEN CETAK & WEB)

Tabel disederhanakan dengan satuan baku **kg** agar mudah dibaca dan dapat diverifikasi langsung secara matematis:

| No | Kelurahan Binaan | Baseline KKN ($B_0$) | Realisasi Aktual ($B_1$) | Penurunan Berat ($\Delta B$) | % Penurunan | Baseline Kepatuhan | Kepatuhan Aktual | Deviasi ($\Delta \text{ pp}$) | Status Kinerja |
|:--:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Cipaganti | 96,00 kg | *Dinamis* | *Dinamis* | *Dinamis* | 13,7% | *Dinamis* | *Dinamis* | Terverifikasi |
| 2 | Dago | 122,00 kg | *Dinamis* | *Dinamis* | *Dinamis* | 10,0% | *Dinamis* | *Dinamis* | Terverifikasi |
| 3 | Lebak Gede | 100,00 kg | *Dinamis* | *Dinamis* | *Dinamis* | 21,6% | *Dinamis* | *Dinamis* | Terverifikasi |
| 4 | Lebak Siliwangi | 96,50 kg | *Dinamis* | *Dinamis* | *Dinamis* | 15,0% | *Dinamis* | *Dinamis* | Terverifikasi |
| 5 | Sadang Serang | 835,00 kg | *Dinamis* | *Dinamis* | *Dinamis* | 24,8% | *Dinamis* | *Dinamis* | Terverifikasi |
| 6 | Sekeloa | 421,00 kg | *Dinamis* | *Dinamis* | *Dinamis* | 17,8% | *Dinamis* | *Dinamis* | Terverifikasi |
| **TOTAL** | **KECAMATAN COBLONG** | **1.670,50 kg** | *Dinamis* | *Dinamis* | *Dinamis* | **17,1%** | *Dinamis* | *Dinamis* | **Sirkular Mandiri** |

---

## 8. TAHAPAN PENGERJAAN & IMPLEMENTASI (ROADMAP)

Pengerjaan akan dieksekusi secara bertahap satu per satu (*strictly iterative*) dengan siklus **Pengerjaan ➡️ QC TypeCheck ➡️ Lanjut**:

* **Tahap 1 (Backend Core & Anti-Dummy SSOT)**:
  * Menghapus hardcode Tempat Sampah (`765/769`) di `wasteExecutiveReportService.ts` dan menghubungkannya langsung ke database riil.
  * Menyelaraskan pengambilan data kelurahan dengan `dashboardService.getKpi` agar angka di Laporan 100% identik dengan Dasbor.
* **Tahap 2 (Filter Waktu & Normalisasi Default Presets)**:
  * Menetapkan default: `sourceType: "ALL"` dan `periode: "semua"`.
  * Memperbaiki kueri dinamis agar data matriks kelurahan menghormati filter toolbar (tidak dikunci ke data "kemarin").
  * Memformat seluruh angka berat ke format standar `kg` dengan 2 desimal.
* **Tahap 3 (Frontend Web View Refinement)**:
  * Merapikan 4 Kartu KPI Utama dan tabel matriks 6 kelurahan di `LaporanTataKelolaSampahPage.tsx`.
  * Memisahkan data monitoring operasional ke tab/bagian Lampiran.
  * Menyelaraskan teks tooltip formula dengan backend ($0,858\text{ kg CO}_2\text{e}$).
* **Tahap 4 (Naskah Cetak PDF & Ekspor Excel)**:
  * Menyesuaikan tampilan naskah cetak dinas (`viewMode === "document"`) agar bersih, formal, dan rapi dalam batas margin kertas standar F4/A4 dengan tabel format kg.
  * Memperbarui template generator Excel di backend (`exportWasteExecutiveReport`) agar menghasilkan tabel komparatif yang identik dengan layar web.
* **Tahap 5 (Verifikasi QC Akhir)**:
  * Typecheck backend (`apps/api: tsc --noEmit`).
  * Typecheck frontend web (`apps/web: tsc --noEmit`).
  * Uji coba lintas peran (Pimpinan, Super User, Developer).
