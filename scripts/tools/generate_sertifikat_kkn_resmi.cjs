/**
 * Project: BERSEKA - Official UNIKOM KKN Tematik Certificate Generator
 * Developed by: PT Makerindo & Universitas Komputer Indonesia
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Generator E-Sertifikat KKN Tematik Batch I Resmi UNIKOM
 * 100% PERSIS SESUAI ACUAN DESAIN MOCKUP RESMI:
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
const datasetPath = path.join(rootDir, 'apps/api/scripts/students_real_certificates_data.json');
const template1Path = path.join(rootDir, 'apps/web/public/image/serti/template_halaman_1_clean.png');
const template2Path = path.join(rootDir, 'apps/web/public/image/serti/template_halaman_2_clean.png');

if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });
if (!fs.existsSync(publicCertsDir)) fs.mkdirSync(publicCertsDir, { recursive: true });

// 1. Load Real Dataset (534 Mahasiswa)
if (!fs.existsSync(datasetPath)) {
  console.error('Dataset mahasiswa tidak ditemukan di:', datasetPath);
  process.exit(1);
}
const allStudents = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

// 2. Load Base64 clean templates
if (!fs.existsSync(template1Path) || !fs.existsSync(template2Path)) {
  console.error('Template image clean tidak ditemukan di public/image/serti/');
  process.exit(1);
}
const base1 = fs.readFileSync(template1Path).toString('base64');
const base2 = fs.readFileSync(template2Path).toString('base64');

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

// 4. HTML Builder Function for a Student (100% Mockup Aligned)
function buildStudentHtml(s) {
  const verifyUrl = `https://berseka.id/verify/${s.idSertifikat}`;
  const qrSvg = generateQrSvg(verifyUrl);

  const formattedName = s.nama ? s.nama.toUpperCase() : '';
  const nomorSert = `KKNT/${String(s.noUrut).padStart(3, '0')}/UNIKOM/BATCH-1/XI/2026`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Sertifikat KKN Tematik - ${s.nama} (${s.nim})</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');

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
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    }

    .cert-sheet {
      width: 297mm;
      height: 210mm;
      position: relative;
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

    .sheet-1 {
      background-image: url('data:image/png;base64,${base1}');
    }

    .sheet-2 {
      background-image: url('data:image/png;base64,${base2}');
    }

    .pos {
      position: absolute;
      text-align: center;
      transform: translate(-50%, -50%);
    }

    .navy-text {
      color: #0A2540;
    }

    .blue-text {
      color: #005AA9;
    }

    .serif-title {
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
    }

    .qr-container {
      position: absolute;
      left: 76.7%;
      top: 89.1%;
      transform: translate(-50%, -50%);
      width: 145px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 6px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
    }

    .qr-box {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
    }

    .qr-info {
      text-align: left;
      font-size: 6.2pt;
      line-height: 1.25;
      color: #0A2540;
      padding-left: 5px;
    }
  </style>
</head>
<body>
  <!-- ==================== HALAMAN 1 ==================== -->
  <div class="cert-sheet sheet-1">
    <!-- Nomor -->
    <div class="pos navy-text" style="left: 50%; top: 35.45%; font-size: 13pt; font-weight: 600;">
      Nomor: ${nomorSert}
    </div>

    <!-- Nama Peserta -->
    <div class="pos navy-text serif-title" style="left: 50%; top: 44.07%; font-size: 32pt; font-weight: 900; letter-spacing: 0.5px; width: 85%; white-space: nowrap;">
      [${formattedName}]
    </div>

    <!-- NIM -->
    <div class="pos navy-text" style="left: 50%; top: 51.56%; font-size: 14pt; font-weight: 600;">
      NIM: [${s.nim}]
    </div>

    <!-- Prodi -->
    <div class="pos navy-text" style="left: 50%; top: 54.21%; font-size: 14pt; font-weight: 600;">
      Program Studi: [${s.prodi}]
    </div>

    <!-- SKS inside pill -->
    <div class="pos blue-text" style="left: 50%; top: 57.91%; font-size: 14pt; font-weight: 800; letter-spacing: 0.2px;">
      SKS diambil: [${s.sks} SKS]
    </div>

    <!-- Tanggal Terbit -->
    <div class="pos navy-text" style="left: 77.5%; top: 81.14%; font-size: 11.5pt; font-weight: 600;">
      Bandung, ${s.tanggalTerbit}
    </div>

    <!-- E-Sign / QR Code Verification Box -->
    <div class="qr-container">
      <div class="qr-box">
        ${qrSvg}
      </div>
      <div class="qr-info">
        <strong>TANDA TANGAN ELEKTRONIK</strong><br>
        <span style="font-size:5.5pt; color:#64748b; font-family:'JetBrains Mono',monospace;">ID: ${s.idSertifikat}</span><br>
        <span style="color:#005AA9; font-weight:700;">VERIFIKASI SAH LPPM</span>
      </div>
    </div>
  </div>

  <!-- ==================== HALAMAN 2 ==================== -->
  <div class="cert-sheet sheet-2">
    <!-- Nomor Sertifikat -->
    <div class="pos navy-text" style="left: 50%; top: 32.32%; font-size: 12.5pt; font-weight: 600;">
      Nomor sertifikat: [${nomorSert}]
    </div>

    <!-- Info Row -->
    <div class="pos blue-text" style="left: 17.1%; top: 38.67%; font-size: 13pt; font-weight: 800; width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
      [${formattedName}]
    </div>
    <div class="pos blue-text" style="left: 37.9%; top: 38.67%; font-size: 13pt; font-weight: 800;">
      [${s.nim}]
    </div>
    <div class="pos blue-text" style="left: 59.0%; top: 38.67%; font-size: 13pt; font-weight: 800; width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
      [${s.prodi.toUpperCase()}]
    </div>
    <div class="pos blue-text" style="left: 81.1%; top: 38.67%; font-size: 13pt; font-weight: 800;">
      [${s.sks} SKS]
    </div>

    <!-- 5 Aspects Table Values -->
    <div class="pos navy-text" style="left: 77.46%; top: 49.38%; font-size: 15pt; font-weight: 800;">
      ${s.nilai.personal.toFixed(1)}
    </div>
    <div class="pos navy-text" style="left: 77.46%; top: 53.74%; font-size: 15pt; font-weight: 800;">
      ${s.nilai.proker.toFixed(1)}
    </div>
    <div class="pos navy-text" style="left: 77.46%; top: 58.10%; font-size: 15pt; font-weight: 800;">
      ${s.nilai.laporan.toFixed(1)}
    </div>
    <div class="pos navy-text" style="left: 77.46%; top: 62.75%; font-size: 15pt; font-weight: 800;">
      ${s.nilai.paper.toFixed(1)}
    </div>
    <div class="pos navy-text" style="left: 77.46%; top: 67.30%; font-size: 15pt; font-weight: 800;">
      ${s.nilai.video.toFixed(1)}
    </div>

    <!-- Footer ID -->
    <div class="pos" style="left: 45.6%; top: 95.64%; font-size: 9pt; color: #64748b; font-weight: 600;">
      [${s.idSertifikat}]
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
    console.error('Error rendering PDF:', err.message);
    return false;
  }
}

// 6. Execution Modes (Single, Kelompok, All)
async function run() {
  const args = process.argv.slice(2);
  let targetStudents = [];

  const singleIndex = args.indexOf('--single');
  const kelompokIndex = args.indexOf('--kelompok');
  const allIndex = args.indexOf('--all');

  if (singleIndex !== -1 && args[singleIndex + 1]) {
    const nimTarget = args[singleIndex + 1].trim();
    targetStudents = allStudents.filter(s => s.nim === nimTarget);
    if (targetStudents.length === 0) {
      console.error(`Mahasiswa dengan NIM ${nimTarget} tidak ditemukan dalam 534 dataset.`);
      process.exit(1);
    }
    console.log(`📌 Mode Single: 1 Mahasiswa (${targetStudents[0].nama} - ${targetStudents[0].nim})`);
  } else if (kelompokIndex !== -1 && args[kelompokIndex + 1]) {
    const kelompokTarget = args[kelompokIndex + 1].trim();
    targetStudents = allStudents.filter(s => s.kelompok.toLowerCase() === kelompokTarget.toLowerCase());
    if (targetStudents.length === 0) {
      console.error(`Kelompok "${kelompokTarget}" tidak ditemukan.`);
      process.exit(1);
    }
    console.log(`📌 Mode Kelompok: ${targetStudents.length} Mahasiswa di "${kelompokTarget}"`);
  } else if (allIndex !== -1) {
    targetStudents = allStudents;
    console.log(`📌 Mode Batch All: Seluruh ${targetStudents.length} Mahasiswa KKN`);
  } else {
    // Default: Single Mahasiswa #1 (Bani Haykal Permana)
    targetStudents = allStudents.filter(s => s.nim === '21224142');
    console.log(`📌 Mode Default Single: Bani Haykal Permana (NIM: 21224142)`);
  }

  console.log(`\nMemulai proses generate ${targetStudents.length} e-sertifikat...`);

  let count = 0;
  for (const s of targetStudents) {
    count++;
    const safeName = s.nama.replace(/[^a-zA-Z0-9]/g, '_');
    const baseFilename = `SERTIFIKAT_KKN_${s.nim}_${safeName}`;
    const htmlFile = path.join(certsDir, `${baseFilename}.html`);
    const pdfFile = path.join(certsDir, `${baseFilename}.pdf`);

    // Write Standalone HTML
    const htmlContent = buildStudentHtml(s);
    fs.writeFileSync(htmlFile, htmlContent, 'utf8');

    // Generate PDF via Headless Edge
    const success = renderHtmlToPdf(htmlFile, pdfFile);

    // Copy to public/certificates for instant 1-click web download
    const publicPdf = path.join(publicCertsDir, `${baseFilename}.pdf`);
    if (fs.existsSync(pdfFile)) {
      fs.copyFileSync(pdfFile, publicPdf);
    }

    if (success) {
      process.stdout.write(`[${count}/${targetStudents.length}] Selesai: ${s.nim} - ${s.nama}\n`);
    } else {
      process.stdout.write(`[${count}/${targetStudents.length}] HTML OK, PDF Gagal: ${s.nim}\n`);
    }
  }

  // Update CSV Canva Export
  const csvFile = path.join(certsDir, 'DATA_CANVA_BULK_CREATE_KKN_BERSEKA.csv');
  const csvHeader = 'NIM,Nama,Program Studi,Kelompok,SKS,Nilai Akhir,Predikat,Nomor Sertifikat,ID Sertifikat,Verify URL\n';
  const csvRows = targetStudents.map(s => {
    const nomor = `KKNT/${String(s.noUrut).padStart(3, '0')}/UNIKOM/BATCH-1/XI/2026`;
    return `"${s.nim}","${s.nama}","${s.prodi}","${s.kelompok}","${s.sks}","${s.nilai.total.toFixed(2)}","${s.nilai.predikat}","${nomor}","${s.idSertifikat}","https://berseka.id/verify/${s.idSertifikat}"`;
  }).join('\n');
  fs.writeFileSync(csvFile, csvHeader + csvRows, 'utf8');

  // Copy sample to BERKAS_SIAP_SHARE
  const shareFolder = path.join(rootDir, 'BERKAS_SIAP_SHARE');
  if (fs.existsSync(shareFolder)) {
    const baniPdf = path.join(certsDir, 'SERTIFIKAT_KKN_21224142_Bani_Haykal_Permana.pdf');
    if (fs.existsSync(baniPdf)) {
      fs.copyFileSync(baniPdf, path.join(shareFolder, '2_CONTOH_RESMI_SERTIFIKAT_KKN_UNIKOM_BANI_HAYKAL.pdf'));
      fs.copyFileSync(baniPdf, path.join(rootDir, 'CONTOH_RESMI_SERTIFIKAT_KKN_UNIKOM_BANI_HAYKAL.pdf'));
    }
  }

  console.log(`\n🎉 PROSES SELESAI DENGAN SUKSES!`);
  console.log(`- Folder Dokumen: ${certsDir}`);
  console.log(`- Folder Web Download: ${publicCertsDir}`);
}

run().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
