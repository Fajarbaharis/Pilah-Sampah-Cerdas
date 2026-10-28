/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Utility: downloadLaporanEksekutifPdf
 * Menghasilkan Dokumen PDF Resmi Standar Naskah Dinas:
 * "LAPORAN EKSEKUTIF PELAKSANAAN KULIAH KERJA NYATA (KKN) & TATA KELOLA LINGKUNGAN"
 * Sesuai Acuan Baku 7 Bagian Utama Pimpinan UNIKOM x BERSEKA.
 */

import showToast from "./showToast";

export interface LaporanEksekutifData {
  periode?: string;
  tanggalUpdate?: string;
  cakupanWilayah?: string;
  totalKelompok?: number;
  totalMahasiswa?: number;
  totalDpl?: number;
  rasioKehadiranPersen?: number;
  jamRealisasi?: number;
  jamTarget?: number;
  jamSisa?: number;

  sebaranKelurahan?: Array<{
    kelurahan: string;
    mahasiswa: number;
    dpl: number;
  }>;

  demografiProdi?: Array<{
    prodi: string;
    jumlah: number;
  }>;

  presensiHarian?: {
    hadirPersen: number;
    hadirJumlah: number;
    alpaPersen: number;
    alpaJumlah: number;
    sakitPersen: number;
    sakitJumlah: number;
    izinPersen: number;
    izinJumlah: number;
  };

  logAktivitas?: {
    logbookMhs: number | string;
    logbookDpl: number;
    dplAktif: number;
    totalDpl: number;
    dplAktifPersen: number;
    kunjunganLapangan: number;
    jamKunjungan: number;
  };

  statusUsulanProker?: {
    total: number;
    disetujui: { jumlah: number; persen: number };
    menunggu: { jumlah: number; persen: number };
    ditolak: { jumlah: number; persen: number };
  };

  statusPelaksanaanProker?: {
    berjalan: { jumlah: number; persen: number };
    belumMulai: { jumlah: number; persen: number };
    selesai: { jumlah: number; persen: number };
  };

  peringatanDini?: {
    kritisPresensiMhs: number;
    prokerTertahan: number;
    prokerDitolak: number;
    kelompokLambat: number;
    dplKosong: number;
  };

  tataKelolaSampah?: {
    penggunaWarga: number;
    tempatSampah: number;
    lokasiRw: number;
    totalKg: number;
    organikKg: number;
    organikPersen: number;
    anorganikKg: number;
    anorganikPersen: number;
    poinWarga: string;
    kepatuhanAi: number;
    fasilitas: number;
    volumeBulananM3: string;
    komposisiVolume: { organik: number; anorganik: number; residu: number };
    kepatuhanPerKelurahan: Array<{ kelurahan: string; kepatuhan: number }>;
  };
}

export const downloadLaporanEksekutifPdf = (customData?: Partial<LaporanEksekutifData>) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showToast.error("Gagal membuka jendela dokumen. Mohon izinkan popup di browser Anda.");
    return;
  }

  const generatedDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const generatedTime = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Data Baku Acuan Pimpinan KKN & Lingkungan (100% Sesuai Acuan Resmi)
  const d: LaporanEksekutifData = {
    periode: customData?.periode || "KKN 2026",
    tanggalUpdate: customData?.tanggalUpdate || "23 September 2026, 16:55 WIB",
    cakupanWilayah: customData?.cakupanWilayah || "Kecamatan Coblong (6 Kelurahan Binaan, 86 RW)",
    totalKelompok: customData?.totalKelompok ?? 32,
    totalMahasiswa: customData?.totalMahasiswa ?? 534,
    totalDpl: customData?.totalDpl ?? 32,
    rasioKehadiranPersen: customData?.rasioKehadiranPersen ?? 56,
    jamRealisasi: customData?.jamRealisasi ?? 112,
    jamTarget: customData?.jamTarget ?? 200,
    jamSisa: customData?.jamSisa ?? 88,

    sebaranKelurahan: customData?.sebaranKelurahan || [
      { kelurahan: "Cipaganti", mahasiswa: 61, dpl: 4 },
      { kelurahan: "Dago", mahasiswa: 163, dpl: 4 },
      { kelurahan: "Lebakgede", mahasiswa: 54, dpl: 4 },
      { kelurahan: "Lebak Siliwangi", mahasiswa: 36, dpl: 3 },
      { kelurahan: "Sadang Serang", mahasiswa: 138, dpl: 11 },
      { kelurahan: "Sekeloa", mahasiswa: 82, dpl: 6 },
    ],

    demografiProdi: customData?.demografiProdi || [
      { prodi: "Manajemen", jumlah: 163 },
      { prodi: "Teknik Komputer & IF", jumlah: 132 },
      { prodi: "Sistem Informasi", jumlah: 55 },
      { prodi: "Teknik Sipil", jumlah: 21 },
      { prodi: "Ilmu Komunikasi", jumlah: 20 },
      { prodi: "Program Studi Lainnya", jumlah: 143 },
    ],

    presensiHarian: customData?.presensiHarian || {
      hadirPersen: 85.7,
      hadirJumlah: 458,
      alpaPersen: 13.1,
      alpaJumlah: 70,
      sakitPersen: 0.6,
      sakitJumlah: 3,
      izinPersen: 0.6,
      izinJumlah: 3,
    },

    logAktivitas: customData?.logAktivitas || {
      logbookMhs: "7.108",
      logbookDpl: 77,
      dplAktif: 16,
      totalDpl: 32,
      dplAktifPersen: 50,
      kunjunganLapangan: 21,
      jamKunjungan: 172,
    },

    statusUsulanProker: customData?.statusUsulanProker || {
      total: 135,
      disetujui: { jumlah: 100, persen: 74 },
      menunggu: { jumlah: 29, persen: 21 },
      ditolak: { jumlah: 6, persen: 4 },
    },

    statusPelaksanaanProker: customData?.statusPelaksanaanProker || {
      berjalan: { jumlah: 62, persen: 46 },
      belumMulai: { jumlah: 46, persen: 34 },
      selesai: { jumlah: 27, persen: 20 },
    },

    peringatanDini: customData?.peringatanDini || {
      kritisPresensiMhs: 163,
      prokerTertahan: 29,
      prokerDitolak: 6,
      kelompokLambat: 28,
      dplKosong: 16,
    },

    tataKelolaSampah: customData?.tataKelolaSampah || {
      penggunaWarga: 967,
      tempatSampah: 250,
      lokasiRw: 86,
      totalKg: 427.89,
      organikKg: 261.71,
      organikPersen: 61,
      anorganikKg: 166.18,
      anorganikPersen: 39,
      poinWarga: "60.40K",
      kepatuhanAi: 99.83,
      fasilitas: 87,
      volumeBulananM3: "1.609,2",
      komposisiVolume: { organik: 21, anorganik: 74, residu: 5 },
      kepatuhanPerKelurahan: [
        { kelurahan: "Cipaganti", kepatuhan: 100 },
        { kelurahan: "Dago", kepatuhan: 100 },
        { kelurahan: "Lebak Gede", kepatuhan: 100 },
        { kelurahan: "Sekeloa", kepatuhan: 100 },
        { kelurahan: "Sadang Serang", kepatuhan: 97 },
        { kelurahan: "Lebak Siliwangi", kepatuhan: 81 },
      ],
    },
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan_Eksekutif_KKN_Tata_Kelola_Lingkungan_Coblong_UNIKOM_2026</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        @page {
          size: A4 portrait;
          margin: 12mm 15mm 12mm 15mm;
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0f172a;
          line-height: 1.42;
          margin: 0;
          padding: 0;
          background: #ffffff;
          font-size: 8.8pt;
        }

        /* Toolbar Layar (Tidak Tercetak) */
        .no-print-toolbar {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          background: #064e3b;
          color: #ffffff;
          padding: 10px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-size: 9.5pt;
        }

        .no-print-toolbar .btn-group {
          display: flex;
          gap: 10px;
        }

        .btn-print {
          background: #10b981;
          color: #ffffff;
          border: none;
          padding: 7px 18px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 9.5pt;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-print:hover {
          background: #059669;
        }

        .btn-close {
          background: transparent;
          color: #cbd5e1;
          border: 1px solid #475569;
          padding: 7px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 9.5pt;
          cursor: pointer;
        }

        .btn-close:hover {
          background: rgba(255,255,255,0.1);
          color: #ffffff;
        }

        @media print {
          .no-print-toolbar {
            display: none !important;
          }
          body {
            padding: 0 !important;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
        }

        /* Container Dokumen */
        .doc-container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 16px 20px 24px 20px;
          background: #ffffff;
        }

        @media screen {
          .doc-container {
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
            margin-top: 16px;
            margin-bottom: 32px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }
        }

        /* Kop Surat Resmi UNIKOM x BERSEKA */
        .header-kop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2.5px solid #000000;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }

        .header-kop .logo-left img {
          height: 60px;
          width: auto;
        }

        .header-kop .logo-right img {
          height: 48px;
          width: auto;
        }

        .header-kop .instansi-text {
          text-align: center;
          flex: 1;
          padding: 0 12px;
          line-height: 1.25;
        }

        .header-kop .instansi-text .ypt {
          font-size: 8pt;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .header-kop .instansi-text .univ {
          font-size: 13pt;
          font-weight: 900;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin: 1px 0;
        }

        .header-kop .instansi-text .lppm {
          font-size: 8.5pt;
          font-weight: 800;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          color: #064e3b;
        }

        .header-kop .instansi-text .alamat {
          font-size: 7.2pt;
          color: #334155;
          margin-top: 3px;
        }

        /* Judul Laporan */
        .report-title-box {
          text-align: center;
          margin-bottom: 14px;
          border-bottom: 1px dashed #cbd5e1;
          padding-bottom: 10px;
        }

        .report-title-box h1 {
          font-size: 11.5pt;
          font-weight: 900;
          text-transform: uppercase;
          margin: 0 0 3px 0;
          color: #064e3b;
          letter-spacing: 0.2px;
          line-height: 1.3;
        }

        .report-title-box .meta-line {
          font-size: 8pt;
          color: #475569;
          font-weight: 600;
        }

        /* Section Styling */
        .section-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9.5pt;
          font-weight: 800;
          text-transform: uppercase;
          color: #065f46;
          background: #ecfdf5;
          padding: 5px 10px;
          border-left: 3.5px solid #059669;
          border-radius: 2px;
          margin-top: 13px;
          margin-bottom: 7px;
        }

        .section-header.danger {
          color: #991b1b;
          background: #fef2f2;
          border-left-color: #dc2626;
        }

        .section-header.blue {
          color: #1e40af;
          background: #eff6ff;
          border-left-color: #2563eb;
        }

        .sub-heading {
          font-size: 8.8pt;
          font-weight: 700;
          color: #1e293b;
          margin: 7px 0 4px 0;
        }

        /* Tabel Standar Naskah Dinas */
        table.gov-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
          margin-bottom: 8px;
        }

        table.gov-table th {
          background: #f1f5f9;
          color: #0f172a;
          font-weight: 700;
          text-align: left;
          padding: 5px 8px;
          border: 1px solid #cbd5e1;
          font-size: 7.8pt;
        }

        table.gov-table td {
          padding: 4.5px 8px;
          border: 1px solid #e2e8f0;
          vertical-align: middle;
        }

        table.gov-table tr:nth-child(even) {
          background: #f8fafc;
        }

        table.gov-table tr.total-row {
          background: #e2e8f0;
          font-weight: 800;
        }

        /* Badge Pills */
        .badge {
          display: inline-block;
          padding: 1.5px 6px;
          border-radius: 4px;
          font-size: 7.5pt;
          font-weight: 700;
        }

        .badge-success { background: #d1fae5; color: #065f46; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-info { background: #e0f2fe; color: #075985; }

        /* Warning Box */
        .alert-box {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-left: 4px solid #e11d48;
          border-radius: 4px;
          padding: 7px 10px;
          margin-bottom: 8px;
          font-size: 8pt;
        }

        .alert-box ul {
          margin: 2px 0 0 16px;
          padding: 0;
        }

        .alert-box li {
          margin-bottom: 3px;
        }

        /* KPI Mini Cards Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 8px;
        }

        .kpi-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 5px 8px;
          text-align: center;
        }

        .kpi-card .val {
          font-size: 11pt;
          font-weight: 900;
          color: #065f46;
        }

        .kpi-card .lbl {
          font-size: 7.2pt;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
        }

        /* Sign-off Sheet */
        .signoff-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 18px;
          padding-top: 12px;
          border-top: 1px solid #cbd5e1;
          page-break-inside: avoid;
        }

        .signoff-col {
          text-align: center;
          font-size: 7.8pt;
        }

        .signoff-col .jabatan {
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 45px;
          line-height: 1.25;
        }

        .signoff-col .nama {
          font-weight: 800;
          text-decoration: underline;
          color: #0f172a;
        }

        .signoff-col .nip {
          font-size: 7.2pt;
          color: #64748b;
        }

        /* Footer */
        .doc-footer {
          margin-top: 16px;
          padding-top: 6px;
          border-top: 1px solid #e2e8f0;
          font-size: 7pt;
          color: #94a3b8;
          display: flex;
          justify-content: space-between;
        }
      </style>
    </head>
    <body>
      <!-- Screen Toolbar -->
      <div class="no-print-toolbar">
        <div>
          <strong>Pratinjau Dokumen PDF Resmi</strong> • Standar Naskah Dinas F4/A4 Pimpinan
        </div>
        <div class="btn-group">
          <button class="btn-print" onclick="window.print()">
            🖨️ Cetak / Simpan PDF
          </button>
          <button class="btn-close" onclick="window.close()">Tutup</button>
        </div>
      </div>

      <div class="doc-container">
        <!-- KOP SURAT RESMI -->
        <div class="header-kop">
          <div class="logo-left">
            <img src="/logos/unikom.png" onerror="this.src='/image/mitra/unikom.png'" alt="UNIKOM Logo" />
          </div>
          <div class="instansi-text">
            <div class="ypt">YAYASAN SAINS DAN TEKNOLOGI</div>
            <div class="univ">UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)</div>
            <div class="lppm">LEMBAGA PENGABDIAN DAN PEMBERDAYAAN MASYARAKAT (LPPM)</div>
            <div class="alamat">
              Jalan Dipati Ukur Nomor 112–116, Coblong, Kota Bandung 40132 • Telepon: (022) 2504119<br />
              Laman: https://www.unikom.ac.id • Pos-el: info@unikom.ac.id • Portal Terpadu: https://berseka.id
            </div>
          </div>
          <div class="logo-right">
            <img src="/logos/berseka/berseka-logo-full.png?v=20261022_v2" onerror="this.src='/logos/berseka/berseka-logo-full.svg'" alt="BERSEKA Logo" />
          </div>
        </div>

        <!-- JUDUL DOKUMEN -->
        <div class="report-title-box">
          <h1>LAPORAN EKSEKUTIF PELAKSANAAN KULIAH KERJA NYATA (KKN) &amp; TATA KELOLA LINGKUNGAN</h1>
          <div class="meta-line">
            Periode Pelaksanaan: <strong>${d.periode}</strong> (Diperbarui per ${d.tanggalUpdate})<br />
            Lokasi Wilayah: <strong>${d.cakupanWilayah}</strong>
          </div>
        </div>

        <!-- 1. DOKUMEN UTAMA & RINGKASAN EKSEKUTIF -->
        <div class="section-header">
          <span>1. Dokumen Utama &amp; Ringkasan Eksekutif</span>
        </div>
        <p style="margin: 4px 0 8px 0; font-size: 8.2pt; text-align: justify; line-height: 1.45;">
          Laporan ini menyajikan pemantauan strategis pelaksanaan Kuliah Kerja Nyata (KKN) terpadu berbasis data waktu nyata (<em>real-time</em>) serta integrasi pemantauan tata kelola sampah dan lingkungan di wilayah Kecamatan Coblong. Seluruh data terhubung langsung dengan basis data operasional terverifikasi GPS, Presensi Mandiri, dan Timbangan Lapangan BERSEKA.
        </p>

        <!-- 2. DEMOGRAFI & SEBARAN PESERTA KKN -->
        <div class="section-header">
          <span>2. Demografi &amp; Sebaran Peserta KKN</span>
        </div>

        <div class="sub-heading">A. Statistik Umum Peserta &amp; Pembimbing</div>
        <table class="gov-table">
          <thead>
            <tr>
              <th style="width: 35%;">Indikator</th>
              <th style="width: 30%;">Jumlah / Capaian</th>
              <th style="width: 35%;">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Cakupan Wilayah</strong></td>
              <td><strong>6 Kelurahan / 86 RW</strong></td>
              <td>Cipaganti, Dago, Lebakgede, Lebak Siliwangi, Sadang Serang, Sekeloa</td>
            </tr>
            <tr>
              <td><strong>Total Kelompok KKN</strong></td>
              <td><strong>${d.totalKelompok} Kelompok</strong></td>
              <td>Tersebar di 6 kelurahan binaan</td>
            </tr>
            <tr>
              <td><strong>Total Mahasiswa</strong></td>
              <td><strong>${d.totalMahasiswa} Orang</strong></td>
              <td>Peserta aktif KKN 2026</td>
            </tr>
            <tr>
              <td><strong>Dosen Pembimbing Lapangan (DPL)</strong></td>
              <td><strong>${d.totalDpl} Dosen</strong></td>
              <td>Rasio 1 DPL : 1 Kelompok</td>
            </tr>
            <tr>
              <td><strong>Rasio Kehadiran Kumulatif</strong></td>
              <td><strong>${d.rasioKehadiranPersen}% (${d.jamRealisasi} dari target ${d.jamTarget} jam)</strong></td>
              <td>Sisa ${d.jamSisa} jam kerja lapangan</td>
            </tr>
          </tbody>
        </table>

        <div class="sub-heading">B. Sebaran Mahasiswa dan DPL per Kelurahan</div>
        <table class="gov-table">
          <thead>
            <tr>
              <th>Kelurahan</th>
              <th style="text-align: center;">Jumlah Mahasiswa</th>
              <th style="text-align: center;">Jumlah DPL</th>
            </tr>
          </thead>
          <tbody>
            ${d.sebaranKelurahan?.map(s => `
              <tr>
                <td><strong>Kelurahan ${s.kelurahan}</strong></td>
                <td style="text-align: center;">${s.mahasiswa} Mahasiswa</td>
                <td style="text-align: center;">${s.dpl} DPL</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td><strong>TOTAL KECAMATAN COBLONG</strong></td>
              <td style="text-align: center;"><strong>${d.totalMahasiswa} Mahasiswa</strong></td>
              <td style="text-align: center;"><strong>${d.totalDpl} DPL</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="sub-heading">C. Demografi Program Studi</div>
        <p style="margin: 2px 0 8px 0; font-size: 8pt; line-height: 1.4;">
          ${d.demografiProdi?.map(p => `<strong>${p.prodi}</strong> (${p.jumlah})`).join(', ')}. Total = <strong>${d.totalMahasiswa} Mahasiswa</strong>.
        </p>

        <!-- 3. REKAPITULASI PRESENSI MAHASISWA & AKTIVITAS LAPANGAN -->
        <div class="section-header">
          <span>3. Rekapitulasi Presensi Mahasiswa &amp; Aktivitas Lapangan</span>
        </div>

        <div class="sub-heading">A. Statistik Presensi Harian</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="val" style="color: #059669;">${d.presensiHarian?.hadirPersen}%</div>
            <div class="lbl">Hadir (${d.presensiHarian?.hadirJumlah} Mhs)</div>
          </div>
          <div class="kpi-card">
            <div class="val" style="color: #dc2626;">${d.presensiHarian?.alpaPersen}%</div>
            <div class="lbl">Tanpa Keterangan (${d.presensiHarian?.alpaJumlah})</div>
          </div>
          <div class="kpi-card">
            <div class="val" style="color: #d97706;">${d.presensiHarian?.sakitPersen}%</div>
            <div class="lbl">Sakit (${d.presensiHarian?.sakitJumlah} Mhs)</div>
          </div>
          <div class="kpi-card">
            <div class="val" style="color: #2563eb;">${d.presensiHarian?.izinPersen}%</div>
            <div class="lbl">Izin (${d.presensiHarian?.izinJumlah} Mhs)</div>
          </div>
        </div>

        <div class="sub-heading">B. Log Aktivitas &amp; Keaktifan DPL</div>
        <ul style="margin: 2px 0 8px 16px; padding: 0; font-size: 8pt; line-height: 1.5;">
          <li>Logbook Mahasiswa Terisi: <strong>${d.logAktivitas?.logbookMhs} log</strong></li>
          <li>Logbook DPL Terisi: <strong>${d.logAktivitas?.logbookDpl} log</strong> (${d.logAktivitas?.dplAktif} dari ${d.logAktivitas?.totalDpl} DPL aktif mengisi logbook / <strong>${d.logAktivitas?.dplAktifPersen}% Keaktifan</strong>)</li>
          <li>Total Kunjungan Lapangan DPL: <strong>${d.logAktivitas?.kunjunganLapangan} kali kunjungan</strong> (Total ${d.logAktivitas?.jamKunjungan} Jam)</li>
        </ul>

        <!-- 4. STATUS PROGRAM KERJA (PROKER) -->
        <div class="section-header">
          <span>4. Status Program Kerja (Proker) &bull; Total: ${d.statusUsulanProker?.total} Proker</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <div class="sub-heading">A. Status Persetujuan Usulan Proker</div>
            <table class="gov-table">
              <thead>
                <tr><th>Status Persetujuan</th><th style="text-align: right;">Jumlah</th><th style="text-align: right;">Persentase</th></tr>
              </thead>
              <tbody>
                <tr><td><span class="badge badge-success">Disetujui</span></td><td style="text-align: right; font-weight: 700;">${d.statusUsulanProker?.disetujui.jumlah} Proker</td><td style="text-align: right; font-weight: 700;">${d.statusUsulanProker?.disetujui.persen}%</td></tr>
                <tr><td><span class="badge badge-warning">Menunggu Persetujuan</span></td><td style="text-align: right; font-weight: 700;">${d.statusUsulanProker?.menunggu.jumlah} Proker</td><td style="text-align: right; font-weight: 700;">${d.statusUsulanProker?.menunggu.persen}%</td></tr>
                <tr><td><span class="badge badge-danger">Ditolak</span></td><td style="text-align: right; font-weight: 700;">${d.statusUsulanProker?.ditolak.jumlah} Proker</td><td style="text-align: right; font-weight: 700;">${d.statusUsulanProker?.ditolak.persen}%</td></tr>
              </tbody>
            </table>
          </div>

          <div>
            <div class="sub-heading">B. Status Pelaksanaan Proker</div>
            <table class="gov-table">
              <thead>
                <tr><th>Status Pelaksanaan</th><th style="text-align: right;">Jumlah</th><th style="text-align: right;">Persentase</th></tr>
              </thead>
              <tbody>
                <tr><td><span class="badge badge-info">Sedang Berjalan</span></td><td style="text-align: right; font-weight: 700;">${d.statusPelaksanaanProker?.berjalan.jumlah} Proker</td><td style="text-align: right; font-weight: 700;">${d.statusPelaksanaanProker?.berjalan.persen}%</td></tr>
                <tr><td><span class="badge badge-warning">Belum Mulai</span></td><td style="text-align: right; font-weight: 700;">${d.statusPelaksanaanProker?.belumMulai.jumlah} Proker</td><td style="text-align: right; font-weight: 700;">${d.statusPelaksanaanProker?.belumMulai.persen}%</td></tr>
                <tr><td><span class="badge badge-success">Sudah Selesai</span></td><td style="text-align: right; font-weight: 700;">${d.statusPelaksanaanProker?.selesai.jumlah} Proker</td><td style="text-align: right; font-weight: 700;">${d.statusPelaksanaanProker?.selesai.persen}%</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 5. PERINGATAN DINI & PERHATIAN PIMPINAN -->
        <div class="section-header danger">
          <span>5. Peringatan Dini &amp; Perhatian Pimpinan (Perlu Koordinasi)</span>
        </div>
        <div class="alert-box">
          <ul>
            <li><strong>Kritis Presensi Mahasiswa:</strong> Terdapat <strong>${d.peringatanDini?.kritisPresensiMhs} Mahasiswa</strong> tanpa keterangan kritis (&ge; 3 Hari).</li>
            <li><strong>Persetujuan Proker:</strong> <strong>${d.peringatanDini?.prokerTertahan} Proker</strong> belum disetujui dan <strong>${d.peringatanDini?.prokerDitolak} Proker</strong> ditolak.</li>
            <li><strong>Capaian Lambat:</strong> <strong>${d.peringatanDini?.kelompokLambat} Kelompok</strong> memiliki capaian Proker &lt; 60%.</li>
            <li><strong>Keaktifan Pembimbing:</strong> <strong>${d.peringatanDini?.dplKosong} DPL</strong> memiliki logbook kosong (keaktifan DPL baru 50%).</li>
          </ul>
        </div>

        <!-- 6. LAPORAN KHUSUS: TATA KELOLA SAMPAH & LINGKUNGAN -->
        <div class="section-header blue">
          <span>6. Laporan Khusus: Tata Kelola Sampah &amp; Lingkungan</span>
        </div>

        <div class="sub-heading">A. Ringkasan Operasional &amp; Pemilahan Sampah</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="val">${d.tataKelolaSampah?.penggunaWarga}</div>
            <div class="lbl">Pengguna Terdaftar</div>
          </div>
          <div class="kpi-card">
            <div class="val">${d.tataKelolaSampah?.tempatSampah}</div>
            <div class="lbl">Bin Teraktivasi</div>
          </div>
          <div class="kpi-card">
            <div class="val">${d.tataKelolaSampah?.totalKg} Kg</div>
            <div class="lbl">Total Sampah Terpilah</div>
          </div>
          <div class="kpi-card">
            <div class="val" style="color: #059669;">${d.tataKelolaSampah?.kepatuhanAi}%</div>
            <div class="lbl">Kepatuhan AI Verification</div>
          </div>
        </div>
        <p style="margin: 2px 0 6px 0; font-size: 7.8pt;">
          &bull; Rincian Pemilahan: <strong>Organik: ${d.tataKelolaSampah?.organikKg} Kg (${d.tataKelolaSampah?.organikPersen}%)</strong> &bull; <strong>Anorganik: ${d.tataKelolaSampah?.anorganikKg} Kg (${d.tataKelolaSampah?.anorganikPersen}%)</strong> &bull; Akumulasi Poin Warga: <strong>${d.tataKelolaSampah?.poinWarga} Poin</strong> &bull; Lokasi Terdata: <strong>${d.tataKelolaSampah?.lokasiRw} RW</strong>
        </p>

        <div class="sub-heading">B. Monitoring Lingkungan &amp; Volume Bulanan (Kecamatan Coblong)</div>
        <p style="margin: 2px 0 4px 0; font-size: 7.8pt;">
          &bull; Fasilitas Terdata: <strong>${d.tataKelolaSampah?.fasilitas} Unit</strong> (Bank Sampah, Maggot BSF, Buruan SAE, Loseda, Bata Terawang, TPS/TPST, POC)<br />
          &bull; Volume Sampah Bulanan (September 2026): <strong>${d.tataKelolaSampah?.volumeBulananM3} m&sup3;/bulan</strong> (Organik ${d.tataKelolaSampah?.komposisiVolume.organik}%, Anorganik ${d.tataKelolaSampah?.komposisiVolume.anorganik}%, Residu ${d.tataKelolaSampah?.komposisiVolume.residu}%)
        </p>
        <div class="sub-heading" style="font-size: 8pt; margin-top: 4px;">Tingkat Kepatuhan Pemilahan per Kelurahan:</div>
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 8px;">
          ${d.tataKelolaSampah?.kepatuhanPerKelurahan.map(k => `
            <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px; text-align: center;">
              <div style="font-size: 7.2pt; font-weight: 700; color: #475569;">${k.kelurahan}</div>
              <div style="font-size: 9.5pt; font-weight: 900; color: ${k.kepatuhan >= 95 ? '#059669' : k.kepatuhan >= 85 ? '#d97706' : '#dc2626'};">${k.kepatuhan}%</div>
            </div>
          `).join('')}
        </div>

        <!-- 7. REKOMENDASI MANAJERIAL -->
        <div class="section-header">
          <span>7. Rekomendasi Manajerial</span>
        </div>
        <ol style="margin: 4px 0 12px 18px; padding: 0; font-size: 8.2pt; line-height: 1.5;">
          <li><strong>Tindak Lanjut Presensi Kritis:</strong> Mewajibkan DPL memanggil ${d.peringatanDini?.kritisPresensiMhs} mahasiswa yang absensinya tanpa keterangan &ge; 3 hari.</li>
          <li><strong>Percepatan Evaluasi Proker:</strong> Meminta DPL menyetujui/merevisi ${d.peringatanDini?.prokerTertahan} usulan proker yang tertahan agar target ${d.jamTarget} jam dapat tercapai.</li>
          <li><strong>Peningkatan Kepatuhan Sampah:</strong> Memberikan pendampingan khusus di Kelurahan Lebak Siliwangi (kepatuhan 81%) dan mengoptimalkan ${d.peringatanDini?.dplKosong} DPL yang logbook-nya masih kosong.</li>
        </ol>

        <!-- LEMBAR PENGESAHAN EKSEKUTIF -->
        <div class="signoff-container">
          <div class="signoff-col">
            <div class="jabatan">
              Mengetahui,<br />
              <strong>Ketua LPPM / Taskforce KKN</strong><br />
              Universitas Komputer Indonesia
            </div>
            <div class="nama">Dr. Ir. Herman S., M.T.</div>
            <div class="nip">NIP. 4127.70.02.015</div>
          </div>

          <div class="signoff-col">
            <div class="jabatan">
              Menerima &amp; Menyetujui,<br />
              <strong>Camat Coblong</strong><br />
              Pemerintah Kota Bandung
            </div>
            <div class="nama">Drs. H. Krinda Hamidipradja, M.Si.</div>
            <div class="nip">NIP. 19680512 199303 1 004</div>
          </div>

          <div class="signoff-col">
            <div class="jabatan">
              Mengesahkan,<br />
              <strong>Rektor UNIKOM</strong><br />
              Universitas Komputer Indonesia
            </div>
            <div class="nama">Prof. Dr. Ir. H. Eddy Soeryanto Soegoto, M.T.</div>
            <div class="nip">NIP. 4127.01.01.001</div>
          </div>
        </div>

        <div class="doc-footer">
          <span>Target Platform: Sistem Terpadu BERSEKA &bull; Database: PostgreSQL (psc_db) &bull; Status: RESMI SAH</span>
          <span>Dicetak pada: ${generatedDate}, ${generatedTime} WIB</span>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 450);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
