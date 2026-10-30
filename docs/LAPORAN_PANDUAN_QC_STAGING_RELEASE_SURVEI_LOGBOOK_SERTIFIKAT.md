# LAPORAN & PANDUAN PENGUJIAN QC (QUALITY CONTROL) STAGING BERSEKA
**Target Rilis**: Staging Environment (`https://staging.berseka.id`)  
**Tanggal Rilis**: 30 Oktober 2026  
**Commit Referensi**: [`c03b65e1b`](https://github.com/JexyDev/Pilah-Sampah-Cerdas/commit/c03b65e1b) (Branch `staging`)  
**Penulis**: Tim Pengembang Monorepo BERSEKA  
**Ditujukan Kepada**: Tim Quality Assurance / Quality Control (QA/QC) & Tim Penguji Lapangan  

---

## 1. Ringkasan Eksekutif Pembaruan Sistem

Pembaruan yang dideploy ke lingkungan Staging mencakup tiga fitur inti yang telah melalui verifikasi static code analysis (`tsc --noEmit` 0 error) dan unit tests (`vitest` 100% pass):

1. **Perbaikan Tuntas Modul Survei KKN (Baseline & Endline)**:
   - Mengatasi permasalahan data **Baseline** yang sebelumnya tidak masuk atau hilang dari database.
   - Penambahan relasi tabel `survei_rw` di database PostgreSQL VPS Staging.
   - Implementasi kalkulasi agregasi otomatis data Baseline ke tabel `survei_kelurahan`, `survei_volume_sampah`, `survei_pemilahan_sampah`, `survei_bank_sampah_pengolahan`, dan `survei_catatan_kesimpulan`.
   - Standarisasi pengiriman data formulir (`application/json` dan parser defensif dual-mode).
   - Penyelarasan penamaan wilayah ("Lebak Gede" vs "Lebakgede") dan toleransi spasi/case.
   - Integrasi pencarian live (*live search*) dan ekspor file CSV/JSON langsung dari server database.

2. **Fitur Full CRUD Logbook Mahasiswa Web Mobile (iOS Safari & Android PWA)**:
   - Penyediaan kemampuan Buat (*Create*), Lihat (*Read*), Ubah (*Update*), dan Hapus (*Delete*) logbook harian KKN pada antarmuka web mobile.
   - Penanganan bug layout keyboard jump pada browser iOS Safari saat mengedit catatan kegiatan.
   - Dukungan upload foto bukti dokumentasi kompresi client-side.

3. **Integrasi Akumulasi Poin Berseka Riil pada E-Sertifikat KKN**:
   - Penghitungan poin riil terintegrasi langsung dari tabel Single Source of Truth (SSOT) `pointHistory`.
   - Penambahan komponen visual *Badge Poin Berseka* pada halaman ke-2 e-sertifikat mahasiswa (siap cetak PDF A4).
   - Penambahan indikator poin pada halaman publik verifikasi keaslian sertifikat (`/verifikasi-sertifikat/:id`).

---

## 2. Lingkungan & Akun Pengujian

| Lingkungan | URL Akses | API Base URL | Keterangan |
|---|---|---|---|
| **Staging Web** | `https://staging.berseka.id` | `https://staging.berseka.id/api/v1` | VPS Staging (`157.10.160.93` / `157.10.252.252`) |
| **Form Survei KKN** | `https://staging.berseka.id/survey/index.html` | Terhubung ke API Staging | Dapat diakses publik / enumerator |
| **Halaman Verifikasi Publik**| `https://staging.berseka.id/verifikasi-sertifikat/:id` | Publik tanpa login | Menguji validitas sertifikat |

### Data Mahasiswa KKN Sampel untuk Pengujian:
- **NIM**: `21224027`
- **Nama**: Amelya Rizqi Rachmadani
- **Kelompok**: Kelompok 1 Dago (Kelurahan Dago, Cakupan RW: 01, 02, 07, 08)
- **Role**: Mahasiswa KKN

---

## 3. Matriks & Lembar Kerja Pengujian QC (Test Cases)

### A. PENGUJIAN MODUL SURVEI KKN (BASELINE & ENDLINE)

#### Kasus Uji QC-SRV-01: Verifikasi Surveyor Berdasarkan NIM Resmi
- **URL**: `https://staging.berseka.id/survey/index.html`
- **Langkah Pengujian**:
  1. Buka halaman form survei.
  2. Pada bagian identitas surveyor, masukkan NIM `21224027`.
  3. Klik tombol **Cek / Verifikasi**.
- **Hasil yang Diharapkan (Expected Result)**:
  - Muncul tanda centang hijau / status terverifikasi.
  - Nama "Amelya Rizqi Rachmadani", Kelompok "Kelompok 1 Dago", Kelurahan "Dago", dan nomor WhatsApp terisi secara otomatis.
  - Dropdown RW menyesuaikan dengan wilayah dampingan (RW 01, RW 02, RW 07, RW 08).

#### Kasus Uji QC-SRV-02: Pengiriman Survei Tahap Baseline (Verifikasi Bugfix Data Masuk)
- **URL**: `https://staging.berseka.id/survey/index.html`
- **Langkah Pengujian**:
  1. Pastikan surveyor terverifikasi (NIM `21224027`).
  2. Pada pilihan **Tahap Survei**, pilih **Baseline**.
  3. Pilih RW yang belum terisi atau pilih **RW 01 / RW 02**.
  4. Isi data demografi: Jumlah RT = 5, Jumlah KK = 120.
  5. Isi data pemilahan: Rumah Pilah = 60, Rumah Total = 120 (Persentase otomatis terhitung 50%).
  6. Isi data fasilitas: Bank Sampah Aktif = 1, Komposter = 2, Maggot = 1.
  7. Isi data volume timbulan harian: Organik = 150 kg, Anorganik = 60 kg, Residu = 30 kg (Total = 240 kg).
  8. Klik tombol **Kirim Laporan Survei**.
- **Hasil yang Diharapkan (Expected Result)**:
  - Proses submit tidak mengalami hang atau timeout.
  - Muncul modal konfirmasi sukses pengiriman dengan ID unik berawalan `BRS-XXXXX`.
  - Data langsung tersimpan di server staging tanpa data loss.

#### Kasus Uji QC-SRV-03: Verifikasi Agregasi Data Baseline ke Kelurahan
- **URL**: `https://staging.berseka.id/api/v1/survey/data`
- **Langkah Pengujian**:
  1. Buka endpoint atau lihat tabel rekap data pada bagian bawah form survei.
  2. Periksa metrik `baseline` pada ringkasan KPI.
  3. Periksa baris rekap untuk Kelurahan Dago tahap Baseline.
- **Hasil yang Diharapkan (Expected Result)**:
  - Counter `baseline` bertambah secara real-time.
  - Kolom Organik, Anorganik, Residu, dan Total Volume pada tahap Baseline Kelurahan Dago terakumulasi dengan benar (bukan 0).

#### Kasus Uji QC-SRV-04: Pengujian Live Search & Ekspor CSV/JSON
- **URL**: `https://staging.berseka.id/survey/index.html`
- **Langkah Pengujian**:
  1. Gulir ke bawah ke bagian tabel riwayat pengiriman survei.
  2. Masukkan kata kunci pencarian pada kotak input (contoh: `Dago` atau `Amelya` atau `Baseline`).
  3. Klik tombol **Ekspor CSV** dan **Ekspor JSON**.
- **Hasil yang Diharapkan (Expected Result)**:
  - Tabel menyaring baris survei secara instan sesuai kata kunci.
  - File `.csv` dan `.json` terunduh dengan data riil dari database (bukan file kosong).

---

### B. PENGUJIAN FULL CRUD LOGBOOK MAHASISWA WEB MOBILE

#### Kasus Uji QC-LOG-01: Tambah Catatan Logbook Baru (Create)
- **URL**: `https://staging.berseka.id/kkn/mahasiswa/mobile?tab=logbook`
- **Langkah Pengujian**:
  1. Login sebagai akun Mahasiswa KKN.
  2. Navigasi ke tab **Logbook**.
  3. Klik tombol **+ Tambah Logbook** atau Floating Action Button (+).
  4. Pilih Program Kerja (opsional/terkait), isi Jam Mulai, Jam Selesai, dan deskripsi kegiatan lapangan.
  5. Unggah 1 foto dokumentasi kegiatan.
  6. Klik **Simpan Logbook**.
- **Hasil yang Diharapkan (Expected Result)**:
  - Modal form tertutup dengan transisi halus.
  - Notifikasi sukses muncul.
  - Kartu logbook baru langsung muncul pada daftar tanpa perlu me-refresh halaman (*optimistic update*).

#### Kasus Uji QC-LOG-02: Ubah Catatan Logbook (Update / Edit)
- **URL**: `https://staging.berseka.id/kkn/mahasiswa/mobile?tab=logbook`
- **Langkah Pengujian**:
  1. Pilih salah satu logbook yang berstatus *Draft* atau *Submitted*.
  2. Klik tombol **Edit** (ikon pensil).
  3. Perhatikan form modal: pastikan data awal (judul, jam, teks aktivitas) terisi lengkap sesuai catatan sebelumnya.
  4. Lakukan penyesuaian teks deskripsi atau jam kegiatan.
  5. Pada perangkat iOS Safari (iPhone / iPad), perhatikan saat keyboard muncul: layar tidak boleh meloncat (*no flickering/jumping*).
  6. Klik tombol **Simpan Perubahan**.
- **Hasil yang Diharapkan (Expected Result)**:
  - Perubahan tersimpan ke server backend (`PUT /kkn/logbook/:id`).
  - Teks deskripsi dan jam pada kartu logbook langsung terbarui.

#### Kasus Uji QC-LOG-03: Hapus Catatan Logbook (Delete)
- **URL**: `https://staging.berseka.id/kkn/mahasiswa/mobile?tab=logbook`
- **Langkah Pengujian**:
  1. Pada salah satu logbook pengujian yang baru dibuat, klik tombol **Hapus** (ikon tempat sampah merah).
  2. Muncul dialog konfirmasi pembatalan/penghapusan.
  3. Konfirmasi penghapusan.
- **Hasil yang Diharapkan (Expected Result)**:
  - Item terhapus dari server (`DELETE /kkn/logbook/:id`).
  - Item hilang dari daftar riwayat secara instan.

---

### C. PENGUJIAN AKUMULASI POIN BERSEKA PADA E-SERTIFIKAT KKN

#### Kasus Uji QC-CRT-01: Tampilan Poin Berseka pada Halaman ke-2 E-Sertifikat
- **URL**: `https://staging.berseka.id/superUser/sertifikat-kkn` (Login Super User / DPL)
- **Langkah Pengujian**:
  1. Akses menu **E-Sertifikat KKN**.
  2. Pilih Kelompok 1 Dago, lalu pilih mahasiswa sampel (Amelya Rizqi Rachmadani atau lainnya).
  3. Klik tab **Halaman 2 (Rincian Nilai & Jam)**.
  4. Klik tombol **Cetak / PDF Preview**.
- **Hasil yang Diharapkan (Expected Result)**:
  - Di bawah blok "TOTAL 450 JAM", terdapat badge resmi:
    `POIN BERSEKA: [X] POIN` berlatar hijau emerald dengan ikon kilau (*Sparkles*).
  - Angka poin sesuai dengan akumulasi poin riil mahasiswa dari tabel `pointHistory`.
  - Pada tampilan cetak (*print mode*), badge tidak terpotong dan posisi tata letak proporsional.

#### Kasus Uji QC-CRT-02: Verifikasi Sertifikat Publik Melalui QR / URL
- **URL**: `https://staging.berseka.id/verifikasi-sertifikat/BRSK-2026-KKN-21224027`
- **Langkah Pengujian**:
  1. Buka URL verifikasi sertifikat di atas melalui jendela *incognito* (tanpa status login).
  2. Periksa rincian data mahasiswa yang terverifikasi.
- **Hasil yang Diharapkan (Expected Result)**:
  - Status sertifikat terbit ditampilkan valid dengan stempel resmi.
  - Menampilkan NIM, Program Studi, Beban Studi (20 SKS), dan baris:
    `Poin Berseka: [X] Poin`.
  - Angka poin identik dengan angka pada lembar fisik/PDF e-sertifikat.

---

## 4. Kriteria Kelulusan QC (Acceptance Criteria)

Sebuah modul dinyatakan **PASS / LOLOS QC** apabila memenuhi seluruh parameter berikut:

| Kriteria | Parameter Keberhasilan | Status Target |
|---|---|---|
| **Data Integrity** | Tidak ada kehilangan data (*zero data loss*) pada pengisian Baseline & Endline | Wajib 100% |
| **Data Aggregation** | Nilai survei baseline RW terakumulasi otomatis ke dashboard kelurahan | Wajib 100% |
| **Cross-Platform Compatibility**| Form mobile logbook berfungsi stabil di Android Chrome & iOS Safari (tanpa keyboard jump) | Wajib 100% |
| **SSOT Data Alignment** | Angka Poin Berseka pada sertifikat selaras 100% dengan database `pointHistory` | Wajib 100% |
| **Zero Error Log** | Tidak ada error 500 pada log PM2 server staging (`pm2 logs psc-backend`) | Wajib 0 Error |

---

## 5. Kontak Dukungan Pengujian

Jika selama proses pengujian ditemukan kendala atau perilaku anomali (*unexpected behavior*):
- Harap sertakan tangkapan layar (*screenshot*) / rekaman layar (*screen recording*).
- Cantumkan NIM / ID Survei yang diuji.
- Laporkan kode status HTTP dari menu Network Inspect browser jika terjadi kegagalan transmisi data.
