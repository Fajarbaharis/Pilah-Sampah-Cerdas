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
    rw?: number;
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
    rincianPengguna?: {
      warga: number;
      petugas: number;
      mahasiswa: number;
      dpl: number;
    };
    tempatSampah: number;
    lokasiRw: number;
    totalKg: number;
    organikKg: number;
    organikPersen: number;
    anorganikKg: number;
    anorganikPersen: number;
    poinWarga: string;
    kepatuhanAi: number;
    partisipasiPersen?: number;
    totalWargaAktif?: number;
    totalWargaTerdaftar?: number;
    akurasiPilahPersen?: number;
    totalSetoranValid?: number;
    totalSetoranDinilai?: number;
    fasilitas: number;
    volumeBulananM3: string;
    komposisiVolume: { organik: number; anorganik: number; residu: number };
    kepatuhanPerKelurahan: Array<{ kelurahan: string; kepatuhan: number }>;
  };
}

export const downloadLaporanEksekutifPdf = (
  customData?: Partial<LaporanEksekutifData>,
  existingWindow?: Window | null
) => {
  const printWindow =
    existingWindow && !existingWindow.closed
      ? existingWindow
      : window.open("", "_blank");
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

  // Data Baku Acuan Pimpinan KKN & Lingkungan (100% Dinamis dari Parameter / Basis Data)
  const d: LaporanEksekutifData = {
    periode: customData?.periode || "Juli – Oktober 2026",
    tanggalUpdate:
      customData?.tanggalUpdate ||
      `${generatedDate}, ${generatedTime} WIB`,
    cakupanWilayah:
      customData?.cakupanWilayah ||
      "Kecamatan Coblong (6 Kelurahan Binaan, 74 RW)",
    totalKelompok: customData?.totalKelompok ?? 0,
    totalMahasiswa: customData?.totalMahasiswa ?? 0,
    totalDpl: customData?.totalDpl ?? 0,
    rasioKehadiranPersen: customData?.rasioKehadiranPersen ?? 0,
    jamRealisasi: customData?.jamRealisasi ?? 0,
    jamTarget: customData?.jamTarget ?? 200,
    jamSisa: customData?.jamSisa ?? 0,

    sebaranKelurahan: customData?.sebaranKelurahan || [],

    demografiProdi: customData?.demografiProdi || [],

    presensiHarian: customData?.presensiHarian || {
      hadirPersen: 0,
      hadirJumlah: 0,
      alpaPersen: 0,
      alpaJumlah: 0,
      sakitPersen: 0,
      sakitJumlah: 0,
      izinPersen: 0,
      izinJumlah: 0,
    },

    logAktivitas: customData?.logAktivitas || {
      logbookMhs: 0,
      logbookDpl: 0,
      dplAktif: 0,
      totalDpl: 0,
      dplAktifPersen: 0,
      kunjunganLapangan: 0,
      jamKunjungan: 0,
    },

    statusUsulanProker: customData?.statusUsulanProker || {
      total: 0,
      disetujui: { jumlah: 0, persen: 0 },
      menunggu: { jumlah: 0, persen: 0 },
      ditolak: { jumlah: 0, persen: 0 },
    },

    statusPelaksanaanProker: customData?.statusPelaksanaanProker || {
      berjalan: { jumlah: 0, persen: 0 },
      belumMulai: { jumlah: 0, persen: 0 },
      selesai: { jumlah: 0, persen: 0 },
    },

    peringatanDini: customData?.peringatanDini || {
      kritisPresensiMhs: 0,
      prokerTertahan: 0,
      prokerDitolak: 0,
      kelompokLambat: 0,
      dplKosong: 0,
    },

    tataKelolaSampah: customData?.tataKelolaSampah || {
      penggunaWarga: 0,
      rincianPengguna: {
        warga: 0,
        petugas: 0,
        mahasiswa: 0,
        dpl: 0,
      },
      tempatSampah: 0,
      lokasiRw: 0,
      totalKg: 0,
      organikKg: 0,
      organikPersen: 0,
      anorganikKg: 0,
      anorganikPersen: 0,
      poinWarga: "0",
      kepatuhanAi: 0,
      partisipasiPersen: 0,
      totalWargaAktif: 0,
      totalWargaTerdaftar: 0,
      akurasiPilahPersen: 0,
      totalSetoranValid: 0,
      totalSetoranDinilai: 0,
      fasilitas: 0,
      volumeBulananM3: "0,0",
      komposisiVolume: { organik: 0, anorganik: 0, residu: 0 },
      kepatuhanPerKelurahan: [],
    },
  };

  const totalRwSebaran =
    (d.sebaranKelurahan || []).reduce((acc, curr) => acc + (curr.rw || 0), 0) || 74;

  const kepatuhanList = d.tataKelolaSampah?.kepatuhanPerKelurahan || [];
  const terendah =
    kepatuhanList.length > 0
      ? [...kepatuhanList].sort((a, b) => a.kepatuhan - b.kepatuhan)[0]
      : null;
  const narasiKepatuhanSampah =
    terendah && terendah.kepatuhan < 100
      ? `Memberikan pendampingan khusus di Kelurahan ${terendah.kelurahan} (kepatuhan ${Number(terendah.kepatuhan).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)`
      : `Mempertahankan standar kepatuhan pemilahan sampah prima di seluruh kelurahan binaan`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan_Eksekutif_KKN_Tata_Kelola_Lingkungan_Coblong_UNIKOM_2026</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

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
          font-family: 'Plus Jakarta Sans', Arial, -apple-system, BlinkMacSystemFont, sans-serif;
          color: #0f172a;
          line-height: 1.45;
          margin: 0;
          padding: 0;
          background: #ffffff;
          font-size: 9pt;
        }

        /* Toolbar Layar (Tidak Tercetak) */
        .no-print-toolbar {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          background: #0f172a;
          color: #ffffff;
          padding: 10px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 9999;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          font-size: 9.5pt;
        }

        .no-print-toolbar .btn-group {
          display: flex;
          gap: 10px;
        }

        .btn-print {
          background: #1e3a8a;
          color: #ffffff;
          border: 1px solid #3b82f6;
          padding: 7px 18px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 9.5pt;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s ease;
        }

        .btn-print:hover {
          background: #1d4ed8;
        }

        .btn-close {
          background: transparent;
          color: #cbd5e1;
          border: 1px solid #475569;
          padding: 7px 16px;
          border-radius: 4px;
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
            box-shadow: 0 4px 20px rgba(15,23,42,0.08);
            margin-top: 16px;
            margin-bottom: 32px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }
        }

        /* Kop Surat Resmi UNIKOM x BERSEKA Standar Naskah Dinas */
        .header-kop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 3px double #1e293b;
          padding: 0 14px 8px 14px;
          margin-bottom: 14px;
        }

        .header-kop .logo-left {
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 6px;
        }

        .header-kop .logo-left img {
          height: 60px;
          width: auto;
          object-fit: contain;
        }

        .header-kop .logo-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding-right: 6px;
        }

        .header-kop .logo-right img {
          height: 58px;
          width: auto;
          object-fit: contain;
        }

        .header-kop .instansi-text {
          text-align: center;
          flex: 1;
          padding: 0 12px;
          line-height: 1.25;
        }

        .header-kop .instansi-text .ypt {
          font-size: 8.5pt;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #1e293b;
        }

        .header-kop .instansi-text .univ {
          font-size: 13pt;
          font-weight: 900;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin: 1px 0;
          color: #0f172a;
        }

        .header-kop .instansi-text .lppm {
          font-size: 9pt;
          font-weight: 800;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          color: #1e3a8a;
        }

        .header-kop .instansi-text .alamat {
          font-size: 7.8pt;
          color: #475569;
          margin-top: 3px;
        }

        /* Judul Laporan Formal Eksekutif */
        .report-title-box {
          text-align: center;
          margin-bottom: 14px;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 8px;
        }

        .report-title-box h1 {
          font-size: 11.8pt;
          font-weight: 800;
          text-transform: uppercase;
          margin: 0 0 3px 0;
          color: #1e3a8a;
          letter-spacing: 0.3px;
          line-height: 1.35;
        }

        .report-title-box .meta-line {
          font-size: 8.6pt;
          color: #475569;
          font-weight: 500;
        }

        /* Section Styling Executive Formal */
        .section-header {
          display: flex;
          align-items: center;
          font-size: 9.6pt;
          font-weight: 800;
          text-transform: uppercase;
          color: #1e293b;
          background: #f1f5f9;
          padding: 5px 10px;
          border-left: 3.5px solid #1e3a8a;
          border-radius: 2px;
          margin-top: 14px;
          margin-bottom: 6px;
          letter-spacing: 0.2px;
        }

        .sub-heading {
          font-size: 9pt;
          font-weight: 700;
          color: #1e293b;
          margin: 6px 0 4px 0;
        }

        /* Tabel Standar Naskah Dinas Elegan */
        table.gov-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.6pt;
          margin-bottom: 8px;
          color: #0f172a;
        }

        table.gov-table th {
          background: #f1f5f9;
          color: #1e293b;
          font-weight: 700;
          text-align: left;
          padding: 5.5px 8px;
          border: 1px solid #cbd5e1;
          font-size: 8.4pt;
        }

        table.gov-table td {
          padding: 5px 8px;
          border: 1px solid #e2e8f0;
          vertical-align: middle;
          color: #0f172a;
        }

        table.gov-table tr:nth-child(even) {
          background: #f8fafc;
        }

        table.gov-table tr.total-row {
          background: #f1f5f9;
          font-weight: 800;
          border-top: 1.5px solid #94a3b8;
          border-bottom: 1.5px solid #94a3b8;
          color: #0f172a;
        }

        /* Peringatan Dini Formal Eksekutif */
        .alert-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 3.5px solid #475569;
          border-radius: 2px;
          padding: 6px 12px;
          margin-bottom: 8px;
          font-size: 8.6pt;
          color: #0f172a;
          line-height: 1.5;
        }

        .alert-box ul {
          margin: 2px 0 0 16px;
          padding: 0;
        }

        .alert-box li {
          margin-bottom: 3px;
        }

        /* KPI Mini Cards Grid Eksekutif */
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
          padding: 6px 8px;
          text-align: center;
        }

        .kpi-card .val {
          font-size: 12pt;
          font-weight: 800;
          color: #0f172a;
        }

        .kpi-card .lbl {
          font-size: 7.8pt;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          margin-top: 1px;
        }

        /* Sign-off Sheet Standar Kedinasan */
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
          font-size: 8.5pt;
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
          font-size: 8pt;
          color: #64748b;
        }

        /* Footer Formal */
        .doc-footer {
          margin-top: 16px;
          padding-top: 6px;
          border-top: 1px solid #e2e8f0;
          font-size: 7.8pt;
          color: #64748b;
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
            <div class="univ">UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)</div>
            <div class="alamat">
              Jalan Dipati Ukur Nomor 112–116, Coblong, Kota Bandung 40132 • Telepon: (022) 2504119<br />
              Laman: https://www.unikom.ac.id • Pos-el: info@unikom.ac.id • Portal Terpadu: https://berseka.id
            </div>
          </div>
          <div class="logo-right">
            <img src="/logos/berseka/logo-berseka-laporan.png?v=20261029" onerror="this.src='/logos/berseka/berseka-logo-bg-transparent.png'" alt="BERSEKA Logo" />
          </div>
        </div>

        <!-- JUDUL DOKUMEN -->
        <div class="report-title-box">
          <h1>LAPORAN EKSEKUTIF PELAKSANAAN KULIAH KERJA NYATA (KKN) &amp; TATA KELOLA LINGKUNGAN</h1>
          <div class="meta-line">
            Periode Pelaksanaan: <strong>${d.periode}</strong><br />
            Lokasi Wilayah: <strong>${d.cakupanWilayah}</strong>
          </div>
        </div>

        <!-- 1. DOKUMEN UTAMA & RINGKASAN EKSEKUTIF -->
        <div class="section-header">
          <span>1. Dokumen Utama &amp; Ringkasan Eksekutif</span>
        </div>
        <p style="margin: 4px 0 8px 0; font-size: 9pt; text-align: justify; line-height: 1.5;">
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
              <td><strong>${d.cakupanWilayah || 'Kecamatan Coblong (6 Kelurahan Binaan, 74 RW)'}</strong></td>
              <td>Wilayah Binaan Terpilih</td>
            </tr>
            <tr>
              <td><strong>Total Kelompok KKN</strong></td>
              <td><strong>${d.totalKelompok} Kelompok</strong></td>
              <td>Tersebar di wilayah binaan</td>
            </tr>
            <tr>
              <td><strong>Total Mahasiswa</strong></td>
              <td><strong>${d.totalMahasiswa} Orang</strong></td>
              <td>Peserta aktif KKN</td>
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
              <th style="text-align: center;">Jumlah RW</th>
              <th style="text-align: center;">Jumlah Mahasiswa</th>
              <th style="text-align: center;">Jumlah DPL</th>
            </tr>
          </thead>
          <tbody>
            ${(d.sebaranKelurahan && d.sebaranKelurahan.length > 0) ? d.sebaranKelurahan.map(s => {
              const cleanKel = (s.kelurahan || '').replace(/^Kelurahan\s+/i, '');
              return `
              <tr>
                <td><strong>${cleanKel}</strong></td>
                <td style="text-align: center;">${s.rw ?? 0}</td>
                <td style="text-align: center;">${s.mahasiswa}</td>
                <td style="text-align: center;">${s.dpl}</td>
              </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="4" style="text-align: center; color: #64748b;">Tidak ada data sebaran kelurahan</td>
              </tr>
            `}
            <tr class="total-row">
              <td><strong>TOTAL ${d.cakupanWilayah && !d.cakupanWilayah.toLowerCase().includes('kecamatan') ? d.cakupanWilayah.toUpperCase() : 'KECAMATAN COBLONG (6 KELURAHAN BINAAN)'}</strong></td>
              <td style="text-align: center;"><strong>${totalRwSebaran} RW</strong></td>
              <td style="text-align: center;"><strong>${d.totalMahasiswa} Mahasiswa</strong></td>
              <td style="text-align: center;"><strong>${d.totalDpl} DPL</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="sub-heading">C. Demografi Program Studi</div>
        <p style="margin: 2px 0 8px 0; font-size: 8.6pt; line-height: 1.45;">
          ${(d.demografiProdi && d.demografiProdi.length > 0)
            ? `${d.demografiProdi.map(p => `<strong>${p.prodi}</strong> (${p.jumlah})`).join(', ')}. Total = <strong>${d.totalMahasiswa} Mahasiswa</strong>.`
            : 'Belum ada data demografi program studi yang tercatat.'}
        </p>

        <!-- 3. REKAPITULASI PRESENSI MAHASISWA & AKTIVITAS LAPANGAN -->
        <div class="section-header">
          <span>3. Rekapitulasi Presensi Mahasiswa &amp; Aktivitas Lapangan</span>
        </div>

        <div class="sub-heading">A. Statistik Presensi Harian</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="val">${d.presensiHarian?.hadirPersen}%</div>
            <div class="lbl">Kehadiran</div>
          </div>
          <div class="kpi-card">
            <div class="val">${d.presensiHarian?.alpaPersen}%</div>
            <div class="lbl">Tanpa Keterangan</div>
          </div>
          <div class="kpi-card">
            <div class="val">${d.presensiHarian?.sakitPersen}%</div>
            <div class="lbl">Sakit</div>
          </div>
          <div class="kpi-card">
            <div class="val">${d.presensiHarian?.izinPersen}%</div>
            <div class="lbl">Izin</div>
          </div>
        </div>

        <div class="sub-heading">B. Log Aktivitas &amp; Keaktifan DPL</div>
        <ul style="margin: 2px 0 8px 16px; padding: 0; font-size: 8.6pt; line-height: 1.5;">
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
                <tr><td>Disetujui</td><td style="text-align: right; font-weight: 700;">${d.statusUsulanProker?.disetujui.jumlah} Proker</td><td style="text-align: right; font-weight: 700;">${Number(d.statusUsulanProker?.disetujui.persen ?? 0).toFixed(1)}%</td></tr>
                <tr><td>Menunggu Persetujuan</td><td style="text-align: right; font-weight: 700;">${d.statusUsulanProker?.menunggu.jumlah} Proker</td><td style="text-align: right; font-weight: 700;">${Number(d.statusUsulanProker?.menunggu.persen ?? 0).toFixed(1)}%</td></tr>
                <tr><td>Ditolak</td><td style="text-align: right; font-weight: 700;">${d.statusUsulanProker?.ditolak.jumlah} Proker</td><td style="text-align: right; font-weight: 700;">${Number(d.statusUsulanProker?.ditolak.persen ?? 0).toFixed(1)}%</td></tr>
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
                <tr><td>Sedang Berjalan</td><td style="text-align: right; font-weight: 700;">${d.statusPelaksanaanProker?.berjalan.jumlah} Proker</td><td style="text-align: right; font-weight: 700;">${Number(d.statusPelaksanaanProker?.berjalan.persen ?? 0).toFixed(1)}%</td></tr>
                <tr><td>Belum Mulai</td><td style="text-align: right; font-weight: 700;">${d.statusPelaksanaanProker?.belumMulai.jumlah} Proker</td><td style="text-align: right; font-weight: 700;">${Number(d.statusPelaksanaanProker?.belumMulai.persen ?? 0).toFixed(1)}%</td></tr>
                <tr><td>Sudah Selesai</td><td style="text-align: right; font-weight: 700;">${d.statusPelaksanaanProker?.selesai.jumlah} Proker</td><td style="text-align: right; font-weight: 700;">${Number(d.statusPelaksanaanProker?.selesai.persen ?? 0).toFixed(1)}%</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 5. PERINGATAN DINI & PERHATIAN PIMPINAN -->
        <div class="section-header">
          <span>5. Peringatan Dini &amp; Perhatian Pimpinan (Perlu Koordinasi)</span>
        </div>
        <div class="alert-box">
          <ul>
            <li><strong>Kritis Presensi Mahasiswa:</strong> Terdapat <strong>${d.peringatanDini?.kritisPresensiMhs ?? 0} Mahasiswa</strong> tanpa keterangan kritis (&ge; 3 Hari).</li>
            <li><strong>Persetujuan Proker:</strong> <strong>${d.peringatanDini?.prokerTertahan ?? 0} Proker</strong> belum disetujui dan <strong>${d.peringatanDini?.prokerDitolak ?? 0} Proker</strong> ditolak.</li>
            <li><strong>Capaian Lambat:</strong> <strong>${d.peringatanDini?.kelompokLambat ?? 0} Kelompok</strong> memiliki capaian Proker &lt; 60%.</li>
            <li><strong>Keaktifan Pembimbing:</strong> <strong>${d.peringatanDini?.dplKosong ?? 0} DPL</strong> memiliki logbook kosong (keaktifan DPL ${d.logAktivitas?.dplAktifPersen ?? 0}%).</li>
          </ul>
        </div>

        <!-- 6. LAPORAN KHUSUS: TATA KELOLA SAMPAH & LINGKUNGAN -->
        <div class="section-header">
          <span>6. Laporan Khusus: Tata Kelola Sampah &amp; Lingkungan</span>
        </div>

        <div class="sub-heading">A. Ringkasan Operasional &amp; Pemilahan Sampah</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="val">${(d.tataKelolaSampah?.penggunaWarga ?? 0).toLocaleString('id-ID')}</div>
            <div class="lbl">Pengguna Terdaftar</div>
          </div>
          <div class="kpi-card">
            <div class="val">${(d.tataKelolaSampah?.tempatSampah ?? 0).toLocaleString('id-ID')}</div>
            <div class="lbl">Tempat Sampah Teraktivasi</div>
          </div>
          <div class="kpi-card">
            <div class="val">${d.tataKelolaSampah?.totalKg ?? 0} Kg</div>
            <div class="lbl">Total Sampah Terpilah</div>
          </div>
          <div class="kpi-card">
            <div class="val">${d.tataKelolaSampah?.kepatuhanAi ?? 0}%</div>
            <div class="lbl">Kepatuhan &amp; Partisipasi Warga</div>
          </div>
        </div>
        <p style="margin: 2px 0 4px 0; font-size: 8.5pt;">
          &bull; Komposisi Pengguna: <strong>${(d.tataKelolaSampah?.rincianPengguna?.warga ?? 0).toLocaleString('id-ID')} Warga</strong> &bull; <strong>${(d.tataKelolaSampah?.rincianPengguna?.petugas ?? 0).toLocaleString('id-ID')} Petugas Pemilah</strong> &bull; <strong>${(d.tataKelolaSampah?.rincianPengguna?.mahasiswa ?? 0).toLocaleString('id-ID')} Mahasiswa KKN</strong> &bull; <strong>${(d.tataKelolaSampah?.rincianPengguna?.dpl ?? 0).toLocaleString('id-ID')} DPL</strong>
        </p>
        <p style="margin: 0 0 4px 0; font-size: 8.5pt;">
          &bull; Rincian Pemilahan: <strong>Organik: ${(d.tataKelolaSampah?.organikKg ?? 0).toLocaleString('id-ID')} Kg (${d.tataKelolaSampah?.organikPersen ?? 0}%)</strong> &bull; <strong>Anorganik: ${(d.tataKelolaSampah?.anorganikKg ?? 0).toLocaleString('id-ID')} Kg (${d.tataKelolaSampah?.anorganikPersen ?? 0}%)</strong> &bull; Akumulasi Poin Warga: <strong>${d.tataKelolaSampah?.poinWarga ?? 0} Poin</strong> &bull; Lokasi Terdata: <strong>${d.tataKelolaSampah?.lokasiRw ?? 0} RW</strong>
        </p>
        <p style="margin: 0 0 6px 0; font-size: 8.2pt; color: #475569;">
          &bull; <strong>Formula Akumulasi Kepatuhan (50 : 50)</strong>: Partisipasi Warga <strong>${d.tataKelolaSampah?.partisipasiPersen ?? 0}%</strong> (${(d.tataKelolaSampah?.totalWargaAktif ?? 0).toLocaleString('id-ID')}/${(d.tataKelolaSampah?.totalWargaTerdaftar ?? 0).toLocaleString('id-ID')} warga aktif) + Akurasi Pemilahan Wadah <strong>${d.tataKelolaSampah?.akurasiPilahPersen ?? 0}%</strong> (${(d.tataKelolaSampah?.totalSetoranValid ?? 0).toLocaleString('id-ID')}/${(d.tataKelolaSampah?.totalSetoranDinilai ?? 0).toLocaleString('id-ID')} setoran sesuai).
        </p>

        <div class="sub-heading">B. Monitoring Lingkungan &amp; Volume Bulanan (${d.cakupanWilayah?.includes('Kelurahan') ? d.cakupanWilayah : 'Kecamatan Coblong'})</div>
        <p style="margin: 2px 0 4px 0; font-size: 8.5pt;">
          &bull; Fasilitas Terdata: <strong>${d.tataKelolaSampah?.fasilitas ?? 0} Unit</strong> (Bank Sampah, Maggot BSF, Buruan SAE, Loseda, Bata Terawang, TPS/TPST, POC)<br />
          &bull; Volume Sampah Terpilah Terhitung: <strong>${d.tataKelolaSampah?.volumeBulananM3 ?? '0,0'} m&sup3;</strong> (Organik ${d.tataKelolaSampah?.komposisiVolume?.organik ?? 0}%, Anorganik ${d.tataKelolaSampah?.komposisiVolume?.anorganik ?? 0}%, Residu ${d.tataKelolaSampah?.komposisiVolume?.residu ?? 0}%)
        </p>
        <div class="sub-heading" style="font-size: 8.8pt; margin-top: 4px;">Tingkat Kepatuhan Pemilahan per Kelurahan:</div>
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 8px;">
          ${(d.tataKelolaSampah?.kepatuhanPerKelurahan && d.tataKelolaSampah.kepatuhanPerKelurahan.length > 0) ? d.tataKelolaSampah.kepatuhanPerKelurahan.map(k => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 5px 4px; text-align: center;">
              <div style="font-size: 7.8pt; font-weight: 600; color: #64748b;">${k.kelurahan}</div>
              <div style="font-size: 10pt; font-weight: 800; color: #0f172a;">${Number(k.kepatuhan).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</div>
            </div>
          `).join('') : '<div style="grid-column: 1 / -1; text-align: center; color: #64748b; font-size: 8.2pt;">Data kepatuhan kelurahan belum tersedia</div>'}
        </div>

        <!-- 7. REKOMENDASI MANAJERIAL -->
        <div class="section-header">
          <span>7. Rekomendasi Manajerial</span>
        </div>
        <ol style="margin: 4px 0 12px 18px; padding: 0; font-size: 8.8pt; line-height: 1.5;">
          <li><strong>Tindak Lanjut Presensi Kritis:</strong> Mewajibkan DPL memanggil ${d.peringatanDini?.kritisPresensiMhs ?? 0} mahasiswa yang absensinya tanpa keterangan &ge; 3 hari.</li>
          <li><strong>Percepatan Evaluasi Proker:</strong> Meminta DPL menyetujui/merevisi ${d.peringatanDini?.prokerTertahan ?? 0} usulan proker yang tertahan agar target ${d.jamTarget ?? 200} jam dapat tercapai.</li>
          <li><strong>Peningkatan Kepatuhan Sampah:</strong> ${narasiKepatuhanSampah} dan mengoptimalkan ${d.peringatanDini?.dplKosong ?? 0} DPL yang logbook-nya masih kosong.</li>
        </ol>

        <div class="doc-footer" style="display: flex; justify-content: space-between; align-items: center;">
          <span>Sistem Informasi Terpadu BERSEKA &bull; Universitas Komputer Indonesia</span>
          <span>Dicetak pada: ${generatedDate}, ${generatedTime} WIB</span>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
};
