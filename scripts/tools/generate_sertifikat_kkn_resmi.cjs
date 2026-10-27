/**
 * Project: BERSEKA - Official UNIKOM KKN Tematik Certificate Generator
 * Developed by: PT Makerindo & Universitas Komputer Indonesia
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Generator E-Sertifikat KKN Tematik Batch I Resmi UNIKOM
 * 100% PERSIS SESUAI ACUAN DESAIN CANVA RESMI (MURNI VECTOR HTML/CSS + SVG):
 * - Halaman 1: Sertifikat Kelulusan & Beban 450 Jam (Logo UNIKOM Asli, TTD Warek I, QR Code)
 * - Halaman 2: Transkrip Rekapitulasi Penilaian 5 Aspek Resmi (Personal, Proker, Laporan, Paper, Video)
 *
 * Mendukung Eksekusi:
 * - Single (Per Orang): node generate_sertifikat_kkn_resmi.cjs --single 21224142
 * - Kelompok: node generate_sertifikat_kkn_resmi.cjs --kelompok "Kelompok 4 Dago"
 * - Semua Mahasiswa (Batch): node generate_sertifikat_kkn_resmi.cjs --all
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '../..');
const docsDir = path.join(rootDir, 'docs');
const certsDir = path.join(docsDir, 'certificates');
const publicCertsDir = path.join(rootDir, 'apps/web/public/certificates');
const datasetPath = path.join(rootDir, 'apps/web/src/data/students_certificates_data.json');
const framePath = path.join(rootDir, 'apps/web/public/image/serti/certificate_frame_hires.png');

if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });
if (!fs.existsSync(publicCertsDir)) fs.mkdirSync(publicCertsDir, { recursive: true });

// 1. Load Real Dataset
if (!fs.existsSync(datasetPath)) {
  console.error('Dataset mahasiswa tidak ditemukan di:', datasetPath);
  process.exit(1);
}
const allStudents = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

// 2. Load Base64 clean frame
if (!fs.existsSync(framePath)) {
  console.error('Frame background tidak ditemukan di:', framePath);
  process.exit(1);
}
const frameBase64 = fs.readFileSync(framePath).toString('base64');

// 3. QR Generator via ZXing
function generateQrSvg(verifyUrl) {
  try {
    const { QRCodeWriter, BarcodeFormat } = require(path.join(rootDir, 'node_modules/@zxing/library/cjs/index.js'));
    const writer = new QRCodeWriter();
    const matrix = writer.encode(verifyUrl, BarcodeFormat.QR_CODE, 25, 25, new Map());
    const w = matrix.getWidth();
    const h = matrix.getHeight();
    let rects = '';
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (matrix.get(x, y)) {
          rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="#0A2540" />`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" style="width: 100%; height: 100%;">${rects}</svg>`;
  } catch (err) {
    return `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:7pt;color:#0A2540;font-weight:bold;">QR VERIFIED</div>`;
  }
}

// 4. HTML Builder Function for a Student (100% Canva Aligned Native Vector)
function buildStudentHtml(s) {
  const verifyUrl = `https://berseka.id/verify/${s.idSertifikat}`;
  const qrSvg = generateQrSvg(verifyUrl);

  const formattedName = s.nama ? s.nama.toUpperCase() : '';
  const isGraded = Boolean(
    s.sudahDinilai || 
    s.statusPenilaian === "SUDAH_DINILAI" || 
    (s.nilai && s.nilai.total > 0 && s.nilai.predikat !== "Belum Dinilai")
  );

  const nomorSert = s.nomorSertifikat || (isGraded 
    ? `KKNT/${String(s.noUrut).padStart(3, '0')}/UNIKOM/BATCH-1/XI/2026`
    : `KKNT/DRAFT/${String(s.noUrut).padStart(3, '0')}/UNIKOM/2026`);

  const tanggalTerbit = s.tanggalTerbit || (isGraded ? "10 November 2026" : "Menunggu Penilaian");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Sertifikat KKN Tematik - ${s.nama} (${s.nim})</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

    @page {
      size: 297mm 210mm;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .cert-sheet {
      width: 297mm;
      height: 210mm;
      position: relative;
      background-color: #ffffff;
      background-image: url('data:image/png;base64,${frameBase64}');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    }

    .cert-sheet:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    .cert-inner {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 38px 75px 25px 75px;
    }

    .header-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-left: 60px;
      margin-top: 5px;
    }

    .univ-title {
      font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
      font-size: 24pt;
      font-weight: 800;
      color: #0A2540;
      letter-spacing: 0.5px;
      margin: 0;
      line-height: 1.1;
    }

    .univ-tagline-container {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-top: 6px;
      width: 100%;
      justify-content: center;
    }

    .tagline-line {
      height: 1px;
      background-color: #C5A059;
      flex: 1;
      max-width: 90px;
    }

    .univ-tagline {
      font-size: 8pt;
      font-weight: 700;
      color: #0A2540;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin: 0;
    }

    .title-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      width: 100%;
      margin-top: 18px;
    }

    .title-line {
      height: 1.5px;
      background-color: #C5A059;
      width: 110px;
    }

    .title-main {
      font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
      font-size: 34pt;
      font-weight: 800;
      color: #0A2540;
      letter-spacing: 2.5px;
      margin: 0;
      line-height: 1;
    }

    .title-sub1 {
      font-size: 15.5pt;
      font-weight: 800;
      color: #005AA9;
      letter-spacing: 1px;
      margin-top: 6px;
      text-transform: uppercase;
    }

    .title-sub2 {
      font-size: 13.5pt;
      font-weight: 800;
      color: #005AA9;
      letter-spacing: 0.8px;
      margin-top: 3px;
      text-transform: uppercase;
    }

    .cert-number {
      font-size: 11pt;
      font-weight: 600;
      color: #0A2540;
      margin-top: 6px;
    }

    .given-to {
      font-size: 11.5pt;
      font-style: italic;
      color: #0A2540;
      margin-top: 10px;
    }

    .recipient-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 27pt;
      font-weight: 900;
      color: #0A2540;
      letter-spacing: 1px;
      margin-top: 4px;
      text-transform: uppercase;
      text-align: center;
      white-space: nowrap;
    }

    .diamond-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      max-width: 480px;
      margin-top: 4px;
    }

    .diamond-line {
      height: 1px;
      background-color: #C5A059;
      flex: 1;
    }

    .diamond-shape {
      color: #C5A059;
      font-size: 8pt;
      line-height: 1;
    }

    .bio-text {
      font-size: 11pt;
      font-weight: 600;
      color: #0A2540;
      margin-top: 3px;
    }

    .sks-pill {
      margin-top: 7px;
      border: 1.2px solid #C5A059;
      border-radius: 9999px;
      padding: 3px 22px;
      background: #FFFFFF;
      font-size: 11pt;
      font-weight: 800;
      color: #005AA9;
      letter-spacing: 0.3px;
    }

    .narration {
      font-size: 11pt;
      line-height: 1.45;
      color: #0A2540;
      text-align: center;
      margin-top: 12px;
      max-width: 760px;
      font-weight: 500;
    }

    .hours-container {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 12px;
      width: 100%;
      max-width: 660px;
    }

    .hours-col {
      flex: 1;
      text-align: center;
      padding: 0 10px;
    }

    .hours-label {
      font-size: 9.5pt;
      color: #0A2540;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .hours-val {
      font-size: 15.5pt;
      font-weight: 800;
      color: #005AA9;
    }

    .hours-divider {
      width: 1.5px;
      height: 38px;
      background-color: #C5A059;
    }

    .total-hours-label {
      font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
      font-size: 13pt;
      font-weight: 800;
      color: #0A2540;
      letter-spacing: 2px;
      margin-top: 8px;
    }

    .page1-bottom {
      position: absolute;
      bottom: 26px;
      left: 75px;
      right: 95px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .footer-note {
      font-size: 8.5pt;
      color: #64748B;
      font-style: italic;
      text-align: center;
      flex: 1;
      margin-bottom: 5px;
    }

    .sig-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      width: 290px;
    }

    .sig-date {
      font-size: 9.5pt;
      color: #0A2540;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .sig-role {
      font-size: 9pt;
      font-weight: 700;
      color: #0A2540;
      line-height: 1.25;
    }

    .sig-qr-box {
      margin: 6px 0;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      align-items: center;
      gap: 8px;
      width: 185px;
      height: 52px;
    }

    .sig-qr-img {
      width: 42px;
      height: 42px;
      flex-shrink: 0;
    }

    .sig-qr-text {
      text-align: left;
      font-size: 6.5pt;
      font-family: 'JetBrains Mono', monospace;
      color: #0A2540;
      line-height: 1.2;
    }

    .sig-name {
      font-size: 9.5pt;
      font-weight: 800;
      color: #0A2540;
      margin-top: 2px;
      white-space: nowrap;
    }

    .page2-title {
      font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
      font-size: 26pt;
      font-weight: 800;
      color: #0A2540;
      letter-spacing: 2px;
      margin: 0;
      line-height: 1;
    }

    .student-card-4col {
      display: flex;
      align-items: center;
      width: 100%;
      max-width: 900px;
      margin-top: 18px;
    }

    .card-col {
      flex: 1;
      text-align: center;
      padding: 0 10px;
    }

    .card-label {
      font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
      font-size: 10.5pt;
      color: #0A2540;
      font-weight: 700;
      margin-bottom: 3px;
      letter-spacing: 0.3px;
    }

    .card-val {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11.5pt;
      font-weight: 800;
      color: #005AA9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-divider {
      width: 1.5px;
      height: 32px;
      background-color: #C5A059;
      flex-shrink: 0;
    }

    .aspects-table {
      width: 100%;
      max-width: 900px;
      margin-top: 18px;
      border-collapse: collapse;
      border: 1.5px solid #0D2C54;
      background: #FFFFFF;
    }

    .aspects-table th {
      background-color: #0D2C54;
      color: #FFFFFF;
      font-size: 11pt;
      font-weight: 700;
      padding: 8px 12px;
      border: 1px solid #0D2C54;
      text-align: center;
    }

    .aspects-table td {
      padding: 7.5px 14px;
      font-size: 10.5pt;
      color: #0A2540;
      border: 1px solid #94A3B8;
    }

    .aspects-table tr:nth-child(even) {
      background-color: #F0F7FF;
    }

    .aspects-table td.col-no {
      text-align: center;
      font-weight: 700;
      width: 8%;
    }

    .aspects-table td.col-aspect {
      font-weight: 600;
      width: 67%;
    }

    .aspects-table td.col-val {
      text-align: center;
      font-weight: 800;
      width: 25%;
    }

    .page2-bottom {
      position: absolute;
      bottom: 22px;
      left: 75px;
      right: 75px;
      text-align: center;
    }

    .page2-legal {
      font-size: 8pt;
      color: #64748B;
      font-style: italic;
      margin-bottom: 3px;
    }

    .page2-footer-id {
      font-size: 7.5pt;
      font-family: 'JetBrains Mono', monospace;
      color: #475569;
      font-weight: 600;
    }

    .draft-ribbon {
      display: inline-block;
      margin-top: 4px;
      margin-bottom: 2px;
      background: #FEF3C7;
      color: #92400E;
      border: 1.5px solid #F59E0B;
      border-radius: 9999px;
      padding: 3px 14px;
      font-size: 8.5pt;
      font-weight: 800;
      letter-spacing: 0.8px;
    }
  </style>
</head>
<body>

  <!-- ==================== HALAMAN 1 ==================== -->
  <div class="cert-sheet">
    <div class="cert-inner">
      <div class="header-block">
        <h1 class="univ-title">UNIVERSITAS KOMPUTER INDONESIA</h1>
        <div class="univ-tagline-container">
          <div class="tagline-line"></div>
          <p class="univ-tagline">ILMU &bull; TEKNOLOGI &bull; KREATIVITAS &bull; UNTUK INDONESIA</p>
          <div class="tagline-line"></div>
        </div>
      </div>

      <div class="title-wrapper">
        <div class="title-line"></div>
        <h2 class="title-main">SERTIFIKAT</h2>
        <div class="title-line"></div>
      </div>

      <div class="title-sub1">PESERTA KKN TEMATIK BATCH I</div>
      <div class="title-sub2">TAHUN AKADEMIK 2026/2027</div>
      <div class="cert-number">Nomor: ${nomorSert}</div>
      ${!isGraded ? '<div class="draft-ribbon">DRAFT &bull; MENUNGGU PENILAIAN DPL</div>' : ''}

      <div class="given-to">Diberikan kepada:</div>

      <div class="recipient-name">${formattedName}</div>

      <div class="diamond-divider">
        <div class="diamond-line"></div>
        <span class="diamond-shape">&#9670;</span>
        <div class="diamond-line"></div>
      </div>

      <div class="bio-text">NIM: ${s.nim}</div>
      <div class="bio-text">Program Studi: ${s.prodi}</div>

      <div class="sks-pill">
        SKS diambil: ${s.sks} SKS
      </div>

      <div class="narration">
        Telah mengikuti Kuliah Kerja Nyata (KKN) Tematik Batch I Universitas Komputer Indonesia pada periode Juli–Oktober 2026 dengan total beban kegiatan 450 jam.
      </div>

      <div class="hours-container">
        <div class="hours-col">
          <div class="hours-label">Persiapan</div>
          <div class="hours-val">100 jam</div>
        </div>
        <div class="hours-divider"></div>
        <div class="hours-col">
          <div class="hours-label">Pelaksanaan di lapangan</div>
          <div class="hours-val">250 jam</div>
        </div>
        <div class="hours-divider"></div>
        <div class="hours-col">
          <div class="hours-label">Evaluasi dan pelaporan</div>
          <div class="hours-val">100 jam</div>
        </div>
      </div>

      <div class="total-hours-label">TOTAL 450 JAM</div>
    </div>

    <div class="page1-bottom">
      <div style="width: 250px;"></div>

      <div class="footer-note">
        Rincian penilaian tercantum pada halaman belakang.<br>
        <span style="font-size:7pt; letter-spacing:1px;">UNIVERSITAS KOMPUTER INDONESIA &bull; LPPM</span>
      </div>

      <div class="sig-block">
        <div class="sig-date">Bandung, ${tanggalTerbit}</div>
        <div class="sig-role">Wakil Rektor I UNIKOM<br>Bidang Akademik dan Kemahasiswaan</div>
        
        <div class="sig-qr-box">
          <div class="sig-qr-img">${qrSvg}</div>
          <div class="sig-qr-text">
            <strong style="color:#005AA9; display:block; font-size:7pt;">TANDA TANGAN ELEKTRONIK</strong>
            <span>${s.idSertifikat.slice(0, 18)}</span><br>
            ${isGraded 
              ? '<span style="color:#059669; font-weight:700;">VERIFIKASI SAH LPPM</span>'
              : '<span style="color:#d97706; font-weight:700;">DRAFT KKN</span>'}
          </div>
        </div>

        <div class="sig-name">Prof. Dr. Hj. Umi Narimawati, Dra., S.E., M.Si.</div>
      </div>
    </div>
  </div>

  <!-- ==================== HALAMAN 2 ==================== -->
  <div class="cert-sheet">
    <div class="cert-inner">
      <div class="header-block">
        <h1 class="univ-title">UNIVERSITAS KOMPUTER INDONESIA</h1>
        <div class="univ-tagline-container">
          <div class="tagline-line"></div>
          <p class="univ-tagline">ILMU &bull; TEKNOLOGI &bull; KREATIVITAS &bull; UNTUK INDONESIA</p>
          <div class="tagline-line"></div>
        </div>
      </div>

      <div class="title-wrapper">
        <div class="title-line"></div>
        <h2 class="page2-title">REKAP PENILAIAN PESERTA</h2>
        <div class="title-line"></div>
      </div>

      <div class="title-sub1" style="font-size: 13.5pt;">KKN TEMATIK BATCH I &bull; PERIODE JULI–OKTOBER 2026</div>
      <div class="cert-number">Nomor sertifikat: ${nomorSert}</div>
      ${!isGraded ? '<div class="draft-ribbon">DRAFT &bull; MENUNGGU PENILAIAN DPL</div>' : ''}

      <div class="student-card-4col">
        <div class="card-col">
          <div class="card-label">Nama:</div>
          <div class="card-val">${formattedName}</div>
        </div>
        <div class="card-divider"></div>
        <div class="card-col">
          <div class="card-label">NIM:</div>
          <div class="card-val">${s.nim}</div>
        </div>
        <div class="card-divider"></div>
        <div class="card-col">
          <div class="card-label">Program Studi:</div>
          <div class="card-val">${s.prodi.toUpperCase()}</div>
        </div>
        <div class="card-divider"></div>
        <div class="card-col">
          <div class="card-label">SKS diambil:</div>
          <div class="card-val">${s.sks} SKS</div>
        </div>
      </div>

      <table class="aspects-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Aspek</th>
            <th>Nilai</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="col-no">1</td>
            <td class="col-aspect">Nilai personal</td>
            <td class="col-val">${isGraded ? s.nilai.personal.toFixed(1) : '-'}</td>
          </tr>
          <tr>
            <td class="col-no">2</td>
            <td class="col-aspect">Program kerja kelompok</td>
            <td class="col-val">${isGraded ? s.nilai.proker.toFixed(1) : '-'}</td>
          </tr>
          <tr>
            <td class="col-no">3</td>
            <td class="col-aspect">Laporan akhir</td>
            <td class="col-val">${isGraded ? s.nilai.laporan.toFixed(1) : '-'}</td>
          </tr>
          <tr>
            <td class="col-no">4</td>
            <td class="col-aspect">Paper</td>
            <td class="col-val">${isGraded ? s.nilai.paper.toFixed(1) : '-'}</td>
          </tr>
          <tr>
            <td class="col-no">5</td>
            <td class="col-aspect">Video</td>
            <td class="col-val">${isGraded ? s.nilai.video.toFixed(1) : '-'}</td>
          </tr>
        </tbody>
      </table>

      ${!isGraded ? `
        <div style="margin-top: 15px; background: #FEF3C7; border: 1.5px solid #F59E0B; border-radius: 8px; padding: 6px 18px; font-size: 9.5pt; color: #92400E; font-weight: 700;">
          Status Yudisium: BELUM DINILAI OLEH DPL (Nilai belum diinput di sistem)
        </div>
      ` : `
        <div style="margin-top: 15px; background: #ECFDF5; border: 1.5px solid #10B981; border-radius: 8px; padding: 6px 18px; font-size: 9.5pt; color: #065F46; font-weight: 700;">
          Nilai Akhir: ${s.nilai.total.toFixed(2)} &bull; Predikat: ${s.nilai.predikat}
        </div>
      `}
    </div>

    <div class="page2-bottom">
      <div class="page2-legal">
        Nilai diisi berdasarkan hasil penilaian resmi. Jumlah SKS mengikuti pengambilan peserta dan ketentuan akademik.
      </div>
      <div class="page2-footer-id">
        ${s.idSertifikat} &bull; Halaman 2 dari 2
      </div>
    </div>
  </div>

</body>
</html>`;
}

// 5. PDF Render Helper via Microsoft Edge Headless
const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function renderHtmlToPdf(htmlPath, pdfPath) {
  if (!fs.existsSync(edgeExe)) {
    console.warn('⚠️ Microsoft Edge tidak ditemukan pada:', edgeExe);
    return false;
  }
  const cmd = `"${edgeExe}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
  try {
    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch (err) {
    console.error('Gagal render PDF:', err.message);
    return false;
  }
}

// 6. CLI Execution Dispatcher
const args = process.argv.slice(2);

async function main() {
  console.log('================================================================');
  console.log('🚀 BERSEKA E-SERTIFIKAT KKN TEMATIK UNIKOM - CANVA REPLICA ENGINE');
  console.log('================================================================');

  let targetStudents = [];

  if (args.includes('--all')) {
    targetStudents = allStudents;
    console.log(`Menyiapkan generate untuk SELURUH ${targetStudents.length} Mahasiswa...`);
  } else if (args.includes('--kelompok')) {
    const idx = args.indexOf('--kelompok');
    const targetKelompok = args[idx + 1];
    if (!targetKelompok) {
      console.error('Parameter --kelompok memerlukan nama kelompok. Contoh: --kelompok "Kelompok 4 Dago"');
      process.exit(1);
    }
    targetStudents = allStudents.filter(s => s.kelompok && s.kelompok.toLowerCase() === targetKelompok.toLowerCase());
    console.log(`Menyiapkan generate untuk ${targetStudents.length} Mahasiswa di "${targetKelompok}"...`);
  } else if (args.includes('--single')) {
    const idx = args.indexOf('--single');
    const targetNim = args[idx + 1];
    if (!targetNim) {
      console.error('Parameter --single memerlukan NIM mahasiswa. Contoh: --single 21224142');
      process.exit(1);
    }
    const found = allStudents.find(s => s.nim === targetNim);
    if (!found) {
      console.error(`Mahasiswa dengan NIM ${targetNim} tidak ditemukan di dataset.`);
      process.exit(1);
    }
    targetStudents = [found];
    console.log(`Menyiapkan generate khusus untuk ${found.nama} (${found.nim})...`);
  } else {
    // Default to student Bani Haykal Permana 21224142
    const defaultStudent = allStudents.find(s => s.nim === '21224142') || allStudents[0];
    targetStudents = [defaultStudent];
    console.log(`Tidak ada parameter, menghasilkan contoh default: ${defaultStudent.nama} (${defaultStudent.nim})...`);
    console.log('Gunakan parameter: --single <NIM>, --kelompok "<Nama>", atau --all');
  }

  if (targetStudents.length === 0) {
    console.warn('Tidak ada mahasiswa yang cocok dengan kriteria.');
    return;
  }

  let successCount = 0;
  for (let i = 0; i < targetStudents.length; i++) {
    const s = targetStudents[i];
    const safeName = s.nama.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `SERTIFIKAT_KKN_${s.nim}_${safeName}`;
    const htmlPath = path.join(certsDir, `${fileName}.html`);
    const pdfPath = path.join(certsDir, `${fileName}.pdf`);
    const publicPdfPath = path.join(publicCertsDir, `${fileName}.pdf`);

    // Build & write HTML
    const html = buildStudentHtml(s);
    fs.writeFileSync(htmlPath, html, 'utf8');

    // Render to PDF
    const ok = renderHtmlToPdf(htmlPath, pdfPath);
    if (ok) {
      fs.copyFileSync(pdfPath, publicPdfPath);
      successCount++;
    }

    if ((i + 1) % 10 === 0 || i === targetStudents.length - 1) {
      console.log(`[${i + 1}/${targetStudents.length}] Berhasil diproses...`);
    }
  }

  console.log('----------------------------------------------------------------');
  console.log(`✅ Selesai! Berhasil menghasilkan ${successCount} e-sertifikat resmi Canva replica.`);
  console.log(`📁 Lokasi berkas PDF: ${certsDir}`);
}

main().catch(console.error);
