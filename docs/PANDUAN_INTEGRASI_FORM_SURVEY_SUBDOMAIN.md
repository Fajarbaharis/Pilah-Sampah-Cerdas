# PANDUAN INTEGRASI & DOKUMENTASI FORM SURVEY KKN (SUBDOMAIN survey.berseka.id)

## 1. Ringkasan Eksekutif & Latar Belakang
Berdasarkan arahan Bapak Fajar Bahari Supriatna pada 29 Oktober 2026:
- Telah disediakan prototype form survei berbasis web mandiri (`form-survey-berseka.html`).
- Form ini difungsikan untuk pengisian data survei lapangan **Endline** (kondisi akhir pasca-kegiatan) dan **Baseline** (kondisi awal), dengan **default tahap terpilih pada Endline**.
- Form diakses secara mandiri melalui subdomain: **`survey.berseka.id`** (dan `survey-staging.berseka.id` / path `/survey` untuk lingkungan staging).
- **Verifikasi Keaslian Surveyor**: Sistem secara ketat memverifikasi bahwa pengisi survei adalah mahasiswa KKN UNIKOM yang terdaftar aktif di database Berseka (`mahasiswa_kkn`), melakukan auto-fill profil mahasiswa (Nama, Prodi, Kelompok KKN, Kelurahan dampingan), dan mencatat relasi relasional ke database.

---

## 2. Arsitektur Relasi Database & Sinkronisasi Agregasi

### A. Tabel Primer: `survei_rw`
Menyimpan data mentah setiap kali enumerator (mahasiswa KKN) mengirim survei per RW:
- **Identitas Surveyor**: `nim`, `nama_surveyor`, `prodi`, `kelompok`, `no_wa`, `id_student_kkn` (FK ke `mahasiswa_kkn`).
- **Wilayah**: `kota` ("Kota Bandung"), `kecamatan` ("Coblong"), `kelurahan` (Dago, Sekeloa, Lebak Gede, Lebak Siliwangi, Sadang Serang, Cipaganti), `rw` (RW 01..15), `jumlah_rt`, `jumlah_kk`.
- **Karakteristik Wilayah**: `karakter` (JSON array), `karakter_lain`, `jumlah_kos`, `jumlah_umkm`.
- **Pemilahan Sampah**: `rumah_pilah`, `rumah_total`, `persen_pilah` (desimal), `tingkat_pilah`.
- **Bank Sampah & Fasilitas**: `bank_sampah_aktif`, `bank_sampah_tidak_aktif`, `unit_komposter`, `titik_maggot`, `teknologi` (JSON array).
- **Key Player (Pemangku Kepentingan)**: `key_player` (JSON array: Ketua RW, RT, petugas sampah, kader PKK, pengelola bank sampah, dll.).
- **Timbulan Sampah**: `volume_organik`, `volume_anorganik`, `volume_residu`, `volume_total` (kg/hari).
- **Kesimpulan**: `prioritas`, `risiko`, `catatan_validasi` (peringatan anomali/outlier yang dikonfirmasi).

### B. Auto-Agregasi ke Model Induk Evaluasi Dampak (`endline_survei_kelurahan`)
Setiap ada pengisian survei RW tahap `Endline`:
1. Sistem mengambil seluruh entri survei RW terbaru untuk kelurahan tersebut.
2. Menghitung akumulasi total volume kelurahan: $\sum(\text{Organik}), \sum(\text{Anorganik}), \sum(\text{Residu}), \sum(\text{Total})$.
3. Menghitung rata-rata pemilahan kelurahan: $\frac{\sum \text{Rumah Memilah}}{\sum \text{Total Rumah}} \times 100\%$.
4. Menghitung total unit bank sampah aktif, komposter, dan titik maggot.
5. Melakukan **upsert otomatis** ke:
   - `endline_survei_kelurahan`
   - `endline_volume_sampah`
   - `endline_pemilahan_sampah`
   - `endline_bank_sampah_pengolahan`
   - `endline_catatan_kesimpulan`
6. Hasilnya **langsung tampil secara real-time** pada menu **Evaluasi Dampak KKN** di Web Dashboard Berseka (`/evaluasi-dampak`).

---

## 3. Spesifikasi API Endpoint Backend (`apps/api`)

| Method | Endpoint | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/survey/verify-student?nim={nim}` | Memverifikasi NIM ke database mahasiswa KKN dan mengembalikan data profil resmi | Publik |
| `POST` | `/api/v1/survey/submit` | Menyimpan survei RW, memvalidasi mahasiswa, dan memicu auto-agregasi kelurahan | Publik |
| `GET` | `/api/v1/survey/data?search={query}` | Mengambil rekap kelurahan dan riwayat survei tersimpan dari server | Publik |
| `DELETE`| `/api/v1/survey/:id` | Menghapus data survei RW (opsional) | Publik / Admin |

---

## 4. Konfigurasi Nginx untuk Subdomain `survey.berseka.id`

Pada server VPS, tambahkan konfigurasi Nginx berikut:

```nginx
# /etc/nginx/sites-available/survey.berseka.id
server {
    listen 80;
    server_name survey.berseka.id survey-staging.berseka.id;

    # Root langsung ke folder build survey di apps/web
    root /var/www/staging-web/dist/survey;
    index index.html;

    client_max_body_size 25M;

    # API Reverse Proxy ke backend Express
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA Fallback
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

*Catatan*: Selain subdomain mandiri, form ini juga dapat langsung diakses melalui path:
- Staging: `https://staging.berseka.id/survey`
- Production: `https://berseka.id/survey`

---

## 5. Prosedur Pengujian (Testing & QC Checklist)

1. **Uji Validasi NIM Mahasiswa**:
   - Ketikkan NIM yang terdaftar (misal: `10122001` / NIM mahasiswa KKN aktif).
   - Pastikan muncul badge hijau `✓ Terverifikasi: [Nama Mahasiswa]` dan field Nama, Prodi, Kelompok, serta Kelurahan terisi otomatis.
   - Ketikkan NIM acak (misal: `10199999`). Pastikan muncul peringatan merah `NIM tidak terdaftar dalam database Mahasiswa KKN Berseka`.
2. **Uji Pilihan Default Endline**:
   - Pastikan saat form dibuka, pilihan tahap berada pada posisi **Endline**.
   - Coba ubah ke **Baseline**, pastikan sistem mengizinkan peralihan.
3. **Uji Auto-Kalkulasi Pemilahan & Volume**:
   - Masukkan rumah memilah dan total rumah $\rightarrow$ cek persentase pada donut SVG.
   - Masukkan volume organik, anorganik, dan residu $\rightarrow$ cek total kg/hari dan estimasi per rumah.
4. **Uji Kirim Survei**:
   - Klik **Kirim Survey** $\rightarrow$ pastikan muncul modal dialog berhasil dengan ID survei (`BRS-XXXX`).
   - Buka tab **Data Masuk** $\rightarrow$ pastikan data survei RW yang baru dikirim langsung muncul dengan badge hijau `Tersimpan DB` dan terhitung pada tabel Rekapitulasi Kelurahan.
5. **Uji Modul Evaluasi Dampak di Dashboard Berseka**:
   - Buka `/evaluasi-dampak` dengan akun admin/DPL.
   - Pastikan data Endline kelurahan tersebut sudah terisi otomatis dari agregasi data survei RW yang baru masuk.
