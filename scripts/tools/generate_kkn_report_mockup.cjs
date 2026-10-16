/**
 * Project: BERSEKA
 * Script: Generate Original Dual-View UI/UX Report Mockup:
 * 1. Mode Web Dashboard: Modern, Executive-grade Interactive Analytics
 * 2. Mode Dokumen Formal: Standar Naskah Dinas & Jurnal Akademik Indonesia (EYD V, IMRaD, Format Tabel Terbuka Jurnal, Formula Matematis, QR Verifikasi)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootDir = path.resolve(__dirname, "../../");
const unikomLogoPath = path.resolve(rootDir, "apps/web/public/logos/unikom.png");
const bersekaLogoPath = path.resolve(rootDir, "apps/web/public/logos/berseka/berseka-logo-full.png");
const outputHtmlPath = path.resolve(rootDir, "docs/laporan-kkn/preview_laporan_resmi_kkn.html");
const outputPngPath = path.resolve(rootDir, "docs/laporan-kkn/LAPORAN_RESMI_KULIAH_KERJA_NYATA_BERSEKA_2026.png");

// 1. Encode Logos
const unikomBase64 = fs.existsSync(unikomLogoPath)
  ? `data:image/png;base64,${fs.readFileSync(unikomLogoPath).toString("base64")}`
  : "";
const bersekaBase64 = fs.existsSync(bersekaLogoPath)
  ? `data:image/png;base64,${fs.readFileSync(bersekaLogoPath).toString("base64")}`
  : "";

// Data Riil KKN Terverifikasi
const stats = {
  nomorDokumen: "027/UNIKOM-BERSEKA/KKN-T/X/2026",
  nomorSuratTugas: "ST/084/REKTOR-UNIKOM/VIII/2026",
  periode: "Semester Genap TA 2025/2026 (Agustus — Oktober 2026)",
  tanggalPengesahan: "15 Oktober 2026",
  wilayah: "Kecamatan Coblong, Kota Bandung (6 Kelurahan Binaan, 86 RW)",
  totalMahasiswa: 524,
  totalKelompok: 32,
  totalDpl: 32,
  kepatuhanPresensi: 96.1,
  totalJamKerja: 134834,
  rataJamPerMhs: 257.3,
  prokerSelesai: 92,
  prokerBerjalan: 64,
  prokerPersiapan: 7,
  totalProker: 163,
  sampahTerpilahKg: 7088.4,
  organikPct: 83.9,
  anorganikPct: 16.1,
  reduksiCo2Kg: 5105.7,
  wadahAktif: 769,
  wargaDampingan: 288,
  logbookMhs: 12367,
  logbookDpl: 246,
};

const sebaranKelurahan = [
  { nama: "Dago", mhs: 161, kelompok: 4, dpl: "Prof. Dra. Umi Narimawati, M.Si.", hadir: 97.2, prokerSelesai: 13, totalProker: 22 },
  { nama: "Sadang Serang", mhs: 135, kelompok: 11, dpl: "Dr. H. Tatang Supriyadi, M.M.", hadir: 98.4, prokerSelesai: 28, totalProker: 45 },
  { nama: "Sekeloa", mhs: 79, kelompok: 6, dpl: "Dr. Olih Solihin, M.I.Kom.", hadir: 96.5, prokerSelesai: 29, totalProker: 48 },
  { nama: "Cipaganti", mhs: 61, kelompok: 4, dpl: "Rangga Sidik, M.Kom., M.Eng.", hadir: 95.8, prokerSelesai: 9, totalProker: 18 },
  { nama: "Lebak Gede", mhs: 52, kelompok: 4, dpl: "Muhammad Aksan Ipaenin, M.Sc.", hadir: 94.6, prokerSelesai: 10, totalProker: 19 },
  { nama: "Lebak Siliwangi", mhs: 36, kelompok: 3, dpl: "Dr. Lilis Puspitawati, M.Si.", hadir: 92.1, prokerSelesai: 3, totalProker: 11 },
];

const topMahasiswa = [
  { rank: 1, nama: "Anugrah Rizky Agustian", nim: "21124805", prodi: "Teknik Informatika", kelompok: "Kelompok 1 Sadang Serang", nilai: 85.1, jam: 260.4, status: "A (Cumlaude)" },
  { rank: 2, nama: "Shandy Putra Pranoto", nim: "10924004", prodi: "Sistem Informasi", kelompok: "Kelompok 2 Cipaganti", nilai: 84.8, jam: 307.2, status: "A (Sangat Baik)" },
  { rank: 3, nama: "Ansyarullah Syathir Al-Zaytuni", nim: "10121045", prodi: "Manajemen", kelompok: "Kelompok 1 Sadang Serang", nilai: 83.5, jam: 301.0, status: "A (Sangat Baik)" },
];

const topDpl = [
  { rank: 1, nama: "Dr. H. Tatang Supriyadi, S.E., M.M.", nip: "4127.34.02.075", kelompok: "Kelompok 8 Sadang Serang", logbook: 24, visit: 8, kepatuhan: 100 },
  { rank: 2, nama: "Rangga Sidik, S.Kom., M.Kom., M.Eng.", nip: "4127.70.26.113", kelompok: "Kelompok 4 Cipaganti", logbook: 21, visit: 7, kepatuhan: 99 },
  { rank: 3, nama: "Dr. Olih Solihin, S.Sos., M.I.Kom.", nip: "4127.35.30.016", kelompok: "Kelompok 3 Sekeloa", logbook: 18, visit: 6, kepatuhan: 99 },
];

const iconSvg = {
  dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
  report: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
  kkn: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
  printer: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>`,
  docx: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
  chevron: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`,
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  alert: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  qr: `<svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="#064e3b" stroke-width="1.8"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>`,
};

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Laporan Eksekutif KKN Tematik 2026 — Dual-View Web & Naskah Standar Jurnal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,600&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #090d16;
      --sidebar-bg: #0f172a;
      --sidebar-border: #1e293b;
      --emerald-dark: #064e3b;
      --emerald-primary: #059669;
      --emerald-light: #ecfdf5;
      --emerald-accent: #10b981;
      --blue-accent: #2563eb;
      --amber-accent: #f59e0b;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-700: #334155;
      --slate-800: #1e293b;
      --slate-900: #0f172a;
      --font-sans: 'Plus Jakarta Sans', -apple-system, sans-serif;
      --font-serif: 'Newsreader', Georgia, serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-sans);
      background-color: var(--bg-dark);
      color: #334155;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    /* ── PRESENTATION HEADER BANNER ── */
    .hero-presentation-banner {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0f172a 100%);
      color: #ffffff;
      padding: 24px 36px;
      border-bottom: 2px solid rgba(16, 185, 129, 0.4);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .hero-banner-content {
      max-width: 1540px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    .hero-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(52, 211, 153, 0.4);
      padding: 4px 12px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6ee7b7;
      margin-bottom: 8px;
    }
    .hero-title-main {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.02em;
    }
    .hero-subtitle-desc {
      font-size: 13.5px;
      color: #cbd5e1;
      margin-top: 4px;
      max-width: 820px;
      line-height: 1.5;
    }
    .view-mode-tabs {
      display: flex;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 4px;
      gap: 4px;
    }
    .view-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 700;
      color: #94a3b8;
      text-decoration: none;
      transition: all 0.2s;
    }
    .view-tab.active {
      background: #059669;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);
    }

    /* ── APPLICATION LAYOUT ── */
    .app-viewport {
      display: flex;
      flex: 1;
      width: 100%;
    }

    /* Sidebar */
    .app-sidebar {
      width: 280px;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--sidebar-border);
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar-brand-box {
      padding-bottom: 20px;
      border-bottom: 1px solid #1e293b;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sidebar-brand-logo {
      height: 36px;
      width: auto;
    }
    .sidebar-cat-label {
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.1em;
      color: #64748b;
      text-transform: uppercase;
      padding: 12px 10px 6px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      text-decoration: none;
      margin-bottom: 4px;
    }
    .nav-item:hover { background: #1e293b; color: #f8fafc; }
    .nav-group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 800;
      color: #f8fafc;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      margin-bottom: 4px;
    }
    .nav-sub-list {
      padding-left: 20px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: 10px;
    }
    .nav-sub-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      color: #94a3b8;
      text-decoration: none;
      position: relative;
    }
    .nav-sub-item.active {
      background: #059669;
      color: #ffffff;
      font-weight: 800;
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);
    }
    .nav-sub-item.active::before {
      content: "";
      position: absolute;
      left: -8px;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 18px;
      border-radius: 4px;
      background: #34d399;
    }

    /* Main Container */
    .app-main {
      flex: 1;
      background: #0b1120;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .top-action-bar {
      height: 64px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      padding: 0 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: white;
    }
    .breadcrumb-area {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
    }
    .breadcrumb-area strong { color: #f8fafc; font-weight: 800; }
    .action-btns-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-exec {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      border: none;
      text-decoration: none;
      transition: all 0.15s;
    }
    .btn-exec.print { background: #e11d48; color: white; }
    .btn-exec.word { background: #2563eb; color: white; }
    .btn-exec.custom { background: #334155; color: #f8fafc; border: 1px solid #475569; }

    /* Work Area Grid */
    .dual-showcase-container {
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 48px;
      max-width: 1540px;
      margin: 0 auto;
      width: 100%;
    }

    .view-section-title-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #334155;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .view-section-badge {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #34d399;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 12px;
      border-radius: 99px;
    }
    .view-section-title {
      font-size: 20px;
      font-weight: 900;
      color: #f8fafc;
    }

    /* ── VIEW 1: WEB DASHBOARD CARDS ── */
    .web-kpi-deck {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .web-kpi-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s;
    }
    .web-kpi-card.hero {
      background: linear-gradient(135deg, rgba(6, 78, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
      border-color: rgba(52, 211, 153, 0.4);
    }
    .kpi-head-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
    }
    .kpi-head-row svg { color: #10b981; }
    .kpi-big-num {
      font-size: 32px;
      font-weight: 900;
      color: #f8fafc;
      margin: 10px 0 4px;
      line-height: 1;
    }
    .web-kpi-card.hero .kpi-big-num { color: #34d399; }
    .kpi-foot-meta {
      font-size: 11.5px;
      color: #94a3b8;
      font-weight: 600;
    }

    .web-analytics-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .web-panel {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 22px;
    }
    .panel-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .panel-title {
      font-size: 14px;
      font-weight: 800;
      color: #f8fafc;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .kelurahan-bars-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .k-bar-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .k-bar-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 700;
      color: #cbd5e1;
    }
    .k-bar-track {
      height: 10px;
      background: #0f172a;
      border-radius: 99px;
      overflow: hidden;
    }
    .k-bar-progress {
      height: 100%;
      border-radius: 99px;
      background: linear-gradient(90deg, #10b981, #059669);
    }

    /* ── VIEW 2: DOKUMEN SURAT STANDAR JURNAL & TATA NASKAH DINAS INDONESIA ── */
    .formal-journal-paper {
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
      padding: 64px 72px;
      color: #0f172a;
      max-width: 1240px;
      margin: 0 auto;
      width: 100%;
    }

    /* Kop Naskah Dinas */
    .journal-kop {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      border-bottom: 3.5px double #0f172a;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .kop-logo-item {
      height: 74px;
      object-fit: contain;
    }
    .journal-kop-center {
      text-align: center;
      flex: 1;
    }
    .kop-univ {
      font-size: 14px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .kop-taskforce {
      font-size: 18px;
      font-weight: 900;
      color: #064e3b;
      text-transform: uppercase;
      margin: 4px 0;
      letter-spacing: -0.01em;
    }
    .kop-address {
      font-size: 11.5px;
      color: #475569;
      line-height: 1.45;
    }

    /* Judul Jurnal / Laporan Resmi */
    .article-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .article-title-id {
      font-family: var(--font-serif);
      font-size: 23px;
      font-weight: 700;
      line-height: 1.35;
      color: #0f172a;
      max-width: 980px;
      margin: 0 auto 10px;
    }
    .article-title-en {
      font-family: var(--font-serif);
      font-size: 15px;
      font-style: italic;
      color: #475569;
      max-width: 920px;
      margin: 0 auto 14px;
    }
    .article-authors {
      font-size: 12px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .article-affil {
      font-size: 11px;
      color: #64748b;
    }

    /* Abstract Block (Standar Jurnal Indonesia) */
    .journal-abstract-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 20px 24px;
      margin-bottom: 32px;
      font-size: 12px;
      line-height: 1.65;
      text-align: justify;
    }
    .abstract-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #064e3b;
      margin-bottom: 6px;
    }
    .keywords-row {
      margin-top: 10px;
      font-size: 11.5px;
      color: #334155;
    }
    .keywords-row strong { color: #064e3b; }

    /* Naskah Dua Kolom Khas Jurnal */
    .journal-two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 36px;
      font-size: 12px;
      line-height: 1.7;
      color: #1e293b;
      text-align: justify;
    }

    .journal-section-h1 {
      font-family: var(--font-serif);
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      color: #064e3b;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 4px;
      margin: 18px 0 8px;
    }

    /* Rumus Matematis Standar Jurnal */
    .journal-formula-box {
      background: #f1f5f9;
      border-left: 3px solid #059669;
      padding: 10px 16px;
      margin: 12px 0;
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Format Tabel Terbuka Jurnal Ilmiah (Tanpa Garis Vertikal) */
    .journal-table-wrap {
      grid-column: 1 / -1;
      margin: 24px 0 16px;
    }
    .journal-table-caption {
      font-size: 11.5px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    table.open-journal-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    table.open-journal-table thead tr {
      border-top: 2px solid #0f172a;
      border-bottom: 1.5px solid #0f172a;
    }
    table.open-journal-table th {
      padding: 8px 10px;
      font-weight: 800;
      text-align: left;
      color: #0f172a;
    }
    table.open-journal-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    table.open-journal-table tbody tr:last-child td {
      border-bottom: 2px solid #0f172a;
      font-weight: 800;
    }

    /* Lembar Pengesahan Naskah Dinas Formal */
    .legal-validation-block {
      grid-column: 1 / -1;
      margin-top: 36px;
      padding-top: 24px;
      border-top: 1.5px solid #cbd5e1;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
      text-align: center;
    }
    .val-role {
      font-size: 11.5px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 60px;
      line-height: 1.4;
    }
    .val-name {
      font-size: 12.5px;
      font-weight: 800;
      color: #0f172a;
      text-decoration: underline;
    }
    .val-nip {
      font-size: 10.5px;
      color: #64748b;
      margin-top: 2px;
    }
    .digital-seal-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      background: #f8fafc;
      border: 1px dashed #059669;
      border-radius: 8px;
    }
    .digital-seal-text {
      font-size: 9.5px;
      color: #064e3b;
      font-weight: 800;
      text-transform: uppercase;
      margin-top: 4px;
    }
  </style>
</head>
<body>

  <!-- ==================== HEADER PRESENTASI RESMI ==================== -->
  <header class="hero-presentation-banner">
    <div class="hero-banner-content">
      <div>
        <div class="hero-badge-pill">
          <span>Konsep Desain Original &bull; Standard UI/UX &bull; Tata Naskah Indonesia</span>
        </div>
        <h1 class="hero-title-main">Pratinjau Sistem Laporan Kuliah Kerja Nyata (KKN) BERSEKA</h1>
        <p class="hero-subtitle-desc">
          Menyajikan arsitektur ganda terpadu: <strong>Dasbor Analitik Web Interaktif</strong> untuk pemantauan pimpinan secara real-time, dan <strong>Format Dokumen Naskah Dinas &amp; Jurnal Akademik Baku</strong> untuk kebutuhan arsip, evaluasi universitas, dan pengesahan pejabat.
        </p>
      </div>

      <div class="view-mode-tabs">
        <a href="#tampilan-web" class="view-tab active">
          ${iconSvg.dashboard}
          <span>1. Dasbor Web Interaktif</span>
        </a>
        <a href="#tampilan-surat" class="view-tab">
          ${iconSvg.docx}
          <span>2. Naskah Dinas &amp; Jurnal Baku</span>
        </a>
      </div>
    </div>
  </header>

  <!-- ==================== APLIKASI UTAMA (SHELL + KONTEN) ==================== -->
  <div class="app-viewport">
    
    <!-- SIDEBAR OPERASIONAL (SESUAI REQUEST ATASAN) -->
    <aside class="app-sidebar">
      <div class="sidebar-brand-box">
        <img src="${bersekaBase64}" alt="BERSEKA.ID" class="sidebar-brand-logo" />
      </div>

      <div class="sidebar-cat-label">OPERASIONAL</div>
      <a href="#" class="nav-item">
        ${iconSvg.dashboard}
        <span>Dasbor</span>
      </a>

      <!-- GROUP LAPORAN (BARU DI BAWAH DASBOR) -->
      <div class="nav-group-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${iconSvg.report}
          <span style="color: #34d399;">Laporan</span>
        </div>
        ${iconSvg.chevron}
      </div>

      <div class="nav-sub-list">
        <a href="#tampilan-web" class="nav-sub-item active">
          ${iconSvg.kkn}
          <span>Kuliah Kerja Nyata</span>
        </a>
        <a href="#" class="nav-sub-item">
          ${iconSvg.trash}
          <span>Tata Kelola Sampah</span>
        </a>
      </div>

      <div class="sidebar-cat-label">PROGRAM KKN</div>
      <a href="#" class="nav-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        <span>Analisis Sistem</span>
      </a>
      <a href="#" class="nav-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        <span>Pelaksanaan</span>
      </a>
      <a href="#" class="nav-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        <span>Penilaian</span>
      </a>
    </aside>

    <!-- MAIN APP CANVAS -->
    <main class="app-main">
      
      <!-- Top Action Bar -->
      <div class="top-action-bar">
        <div class="breadcrumb-area">
          <span>OPERASIONAL</span>
          <span>&bull;</span>
          <span>Laporan</span>
          <span>&bull;</span>
          <strong>Kuliah Kerja Nyata</strong>
        </div>

        <div class="action-btns-group">
          <button class="btn-exec custom">
            <span>Filter Wilayah (Coblong)</span>
            ${iconSvg.chevron}
          </button>
          <button class="btn-exec word">
            ${iconSvg.docx}
            <span>Ekspor Word (.docx)</span>
          </button>
          <button class="btn-exec print">
            ${iconSvg.printer}
            <span>Cetak A4 / PDF</span>
          </button>
        </div>
      </div>

      <div class="dual-showcase-container">

        <!-- =================================================================
             BAGIAN A: TAMPILAN DASBOR WEB INTERAKTIF (MODERN EXECUTIVE UI)
             ================================================================= -->
        <section id="tampilan-web">
          <div class="view-section-title-wrap">
            <div>
              <div class="view-section-badge">Tampilan 1: Mode Antarmuka Web</div>
              <h2 class="view-section-title">Dasbor Analitik Eksekutif Kuliah Kerja Nyata (Live Web View)</h2>
            </div>
            <div style="font-size: 12px; color: #10b981; font-weight: 800; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
              <span>100% Real-Time Agregasi PostgreSQL</span>
            </div>
          </div>

          <!-- KPI Metric Cards Deck -->
          <div class="web-kpi-deck">
            <div class="web-kpi-card hero">
              <div class="kpi-head-row">
                <span>Mahasiswa Aktif</span>
                ${iconSvg.users}
              </div>
              <div class="kpi-big-num">${stats.totalMahasiswa}</div>
              <div class="kpi-foot-meta">${stats.totalKelompok} Kelompok &bull; ${stats.totalDpl} DPL Binaan</div>
            </div>

            <div class="web-kpi-card">
              <div class="kpi-head-row">
                <span>Kepatuhan Hadir</span>
                ${iconSvg.check}
              </div>
              <div class="kpi-big-num" style="color: #10b981;">${stats.kepatuhanPresensi}%</div>
              <div class="kpi-foot-meta">Target Posko &ge; 240 Menit Bersih</div>
            </div>

            <div class="web-kpi-card">
              <div class="kpi-head-row">
                <span>Jam Kontribusi</span>
                ${iconSvg.clock}
              </div>
              <div class="kpi-big-num">${stats.totalJamKerja.toLocaleString("id-ID")}</div>
              <div class="kpi-foot-meta">Rerata ${stats.rataJamPerMhs} Jam / Mahasiswa</div>
            </div>

            <div class="web-kpi-card">
              <div class="kpi-head-row">
                <span>Capaian Proker</span>
                ${iconSvg.report}
              </div>
              <div class="kpi-big-num" style="color: #3b82f6;">${Math.round((stats.prokerSelesai / stats.totalProker) * 100)}%</div>
              <div class="kpi-foot-meta">${stats.prokerSelesai} Tuntas dari ${stats.totalProker} Disetujui</div>
            </div>

            <div class="web-kpi-card">
              <div class="kpi-head-row">
                <span>Pilah Sampah</span>
                ${iconSvg.trash}
              </div>
              <div class="kpi-big-num" style="color: #f59e0b;">${stats.sampahTerpilahKg.toLocaleString("id-ID")} <small style="font-size: 15px;">kg</small></div>
              <div class="kpi-foot-meta">Organik ${stats.organikPct}% &bull; Reduksi CO₂ 5,1 Ton</div>
            </div>
          </div>

          <!-- Web Analytics Panels Grid -->
          <div class="web-analytics-grid">
            <div class="web-panel">
              <div class="panel-header-row">
                <div class="panel-title">Sebaran Partisipasi &amp; Capaian Proker per Kelurahan</div>
                <span style="font-size: 11px; color: #94a3b8; font-weight: 700;">6 Kelurahan Binaan</span>
              </div>
              <div class="kelurahan-bars-list">
                ${sebaranKelurahan.map(k => `
                  <div class="k-bar-item">
                    <div class="k-bar-meta">
                      <span><strong>${k.nama}</strong> (${k.kelompok} Kelompok &bull; ${k.mhs} Mahasiswa)</span>
                      <span style="color: #34d399;">${k.prokerSelesai}/${k.totalProker} Proker Tuntas (${k.hadir}% Hadir)</span>
                    </div>
                    <div class="k-bar-track">
                      <div class="k-bar-progress" style="width: ${(k.prokerSelesai / k.totalProker) * 100}%;"></div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>

            <div class="web-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div class="panel-header-row">
                  <div class="panel-title">Peringkat 3 DPL Berkinerja Terbaik</div>
                  <span style="font-size: 11px; color: #3b82f6; font-weight: 800;">Logbook &amp; Visit</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${topDpl.map(d => `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: #0f172a; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px;">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="width: 22px; height: 22px; border-radius: 50%; background: #064e3b; color: #34d399; font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center;">#${d.rank}</span>
                        <div>
                          <div style="font-size: 12px; font-weight: 800; color: #f8fafc;">${d.nama}</div>
                          <div style="font-size: 10.5px; color: #94a3b8;">${d.kelompok} &bull; NIP. ${d.nip}</div>
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-size: 12px; font-weight: 900; color: #34d399;">${d.kepatuhan}% Hadir</div>
                        <div style="font-size: 10px; color: #94a3b8;">${d.logbook} Log &bull; ${d.visit} Visit</div>
                      </div>
                    </div>
                  `).join("")}
                </div>
              </div>

              <div style="margin-top: 16px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 10px 14px; font-size: 11.5px; color: #bfdbfe;">
                <strong>Catatan Sistem:</strong> Seluruh 524 mahasiswa telah disinkronkan ke 32 posko berbasis geofence 250 meter dengan validasi anti-fake GPS.
              </div>
            </div>
          </div>
        </section>

        <!-- =================================================================
             BAGIAN B: TAMPILAN SURAT & DOKUMEN RESMI (STANDAR JURNAL & DINAS)
             ================================================================= -->
        <section id="tampilan-surat">
          <div class="view-section-title-wrap">
            <div>
              <div class="view-section-badge" style="background: rgba(37, 99, 235, 0.15); border-color: rgba(37, 99, 235, 0.3); color: #60a5fa;">Tampilan 2: Mode Surat / Naskah Dinas &amp; Jurnal Akademik</div>
              <h2 class="view-section-title">Dokumen Resmi Standar Tata Naskah Dinas Indonesia &amp; Jurnal Ilmiah</h2>
            </div>
            <div style="font-size: 12px; color: #94a3b8;">
              Format Baku A4 &bull; EYD Edisi V &bull; Format Tabel Terbuka Jurnal
            </div>
          </div>

          <!-- KERTAS LAPORAN RESMI FORMAL -->
          <article class="formal-journal-paper">
            
            <!-- KOP SURAT DINAS RESMI UNIKOM x KOTA BANDUNG x BERSEKA -->
            <div class="journal-kop">
              <img src="${unikomBase64}" alt="UNIKOM" class="kop-logo-item" />
              <div class="journal-kop-center">
                <div class="kop-univ">UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)</div>
                <div class="kop-taskforce">TASK FORCE KKN TEMATIK PENGELOLAAN SAMPAH MANDIRI "BERSEKA"</div>
                <div class="kop-address">
                  Sekretariat: Kampus Smart UNIKOM, Jl. Dipati Ukur No. 112–116, Lebakgede, Coblong, Kota Bandung 40132<br>
                  Surat Keputusan Rektor No. ${stats.nomorSuratTugas} &bull; Laman Resmi: https://berseka.id
                </div>
              </div>
              <img src="${bersekaBase64}" alt="BERSEKA" class="kop-logo-item" />
            </div>

            <!-- HEADER ARTIKEL / LAPORAN RESMI (STANDAR JURNAL ILMIAH) -->
            <div class="article-header">
              <h1 class="article-title-id">
                Evaluasi Kinerja dan Dampak Pelaksanaan Kuliah Kerja Nyata Tematik Pengelolaan Sampah Mandiri di Kecamatan Coblong Kota Bandung
              </h1>
              <div class="article-title-en">
                Performance Evaluation and Impact Assessment of Thematic Community Service Program on Community-Based Waste Management in Coblong District, Bandung City
              </div>
              <div class="article-authors">
                Task Force KKN Tematik BERSEKA<sup>1</sup>, Koordinator Dosen Pembimbing Lapangan<sup>2</sup>, Dinas Lingkungan Hidup Kota Bandung<sup>3</sup>
              </div>
              <div class="article-affil">
                Universitas Komputer Indonesia, Kota Bandung, Jawa Barat, Indonesia &bull; Dokumen Registrasi: <strong>${stats.nomorDokumen}</strong>
              </div>
            </div>

            <!-- ABSTRAK BILINGUAL (STANDAR JURNAL AKADEMIK INDONESIA) -->
            <div class="journal-abstract-box">
              <div class="abstract-title">Ringkasan Eksekutif / Abstract</div>
              <p>
                <strong>Abstrak</strong> — Program Kuliah Kerja Nyata (KKN) Tematik BERSEKA Semester Genap 2025/2026 dilaksanakan sebagai intervensi strategis penanganan darurat sampah di wilayah Kecamatan Coblong Kota Bandung yang mencakup 6 kelurahan dan 86 RW. Sebanyak 524 mahasiswa dan 32 Dosen Pembimbing Lapangan (DPL) diterjunkan ke 32 posko binaan dengan integrasi teknologi pemantauan presensi berbasis geofencing GPS (durasi wajib 240 menit per sesi) serta pencatatan pemilahan sampah cerdas. Hingga ${stats.tanggalPengesahan}, akumulasi jam kontribusi mahasiswa mencapai ${stats.totalJamKerja.toLocaleString("id-ID")} jam kerja nyata dengan tingkat kepatuhan kehadiran sebesar ${stats.kepatuhanPresensi}%. Sebanyak ${stats.prokerSelesai} dari ${stats.totalProker} program kerja (56%) telah dituntaskan secara paripurna, berhasil memilah ${stats.sampahTerpilahKg.toLocaleString("id-ID")} kg sampah (organik ${stats.organikPct}% dan anorganik ${stats.anorganikPct}%), serta mereduksi estimasi emisi gas rumah kaca sebesar ${stats.reduksiCo2Kg.toLocaleString("id-ID")} kg CO₂e.
              </p>
              <div class="keywords-row">
                <strong>Kata Kunci:</strong> Kuliah Kerja Nyata, Pengelolaan Sampah Mandiri, Ekonomi Sirkular, Presensi Geofence, Kecamatan Coblong.
              </div>
            </div>

            <!-- TEKS LAPORAN DUA KOLOM FORMAT JURNAL & TATA NASKAH DINAS -->
            <div class="journal-two-column">
              <div>
                <h2 class="journal-section-h1">1.0 Pendahuluan &amp; Landasan Wilayah</h2>
                <p>
                  Kecamatan Coblong dengan kepadatan penduduk tinggi dan aktivitas komersial pendidikan menghadapi beban timbulan sampah harian yang mendesak. Melalui SK Rektor No. ${stats.nomorSuratTugas}, UNIKOM mengerahkan 524 mahasiswa program sarjana multi-disiplin untuk melakukan pendampingan warga di 6 kelurahan: Cipaganti, Dago, Lebakgede, Lebak Siliwangi, Sadang Serang, dan Sekeloa.
                </p>
                <p style="margin-top: 8px;">
                  Pendekatan yang diterapkan memadukan edukasi pemilahan sampah rumah tangga (Organik, Anorganik, Residu) dan pembentukan ekosistem pengolahan komunal berbasis Maggot BSF, komposting, dan penimbangan digital bank sampah.
                </p>

                <h2 class="journal-section-h1">2.0 Metodologi &amp; Parameter Kinerja</h2>
                <p>
                  Monitoring keaktifan peserta mengacu pada Single Source of Truth (SSOT) tata kelola akademik BERSEKA. Penilaian kelompok menggunakan pembobotan 60% capaian program kerja dan 40% rerata kontribusi saldo anggota:
                </p>

                <div class="journal-formula-box">
                  <span>Skor = (0,6 &times; Poin_Proker) + (0,4 &times; Rerata_Saldo)</span>
                  <span style="font-size: 10px; color: #64748b;">(Pers. 1)</span>
                </div>

                <p>
                  Setiap sesi presensi harian diwajibkan memenuhi durasi minimal 240 menit (4 jam efektif) di radius geofence posko binaan yang telah terdaftar secara geospasial di sistem.
                </p>
              </div>

              <div>
                <h2 class="journal-section-h1">3.0 Capaian Program Kerja &amp; Valorisasi</h2>
                <p>
                  Dari total 163 program kerja yang diajukan dan disetujui, sebanyak 92 proker telah selesai tuntas 100%, 64 proker sedang dalam tahap pengujian akhir di lapangan, dan 7 proker dalam masa persiapan teknis.
                </p>
                <p style="margin-top: 8px;">
                  Program kerja berfokus pada 4 klaster utama:
                </p>
                <ul style="margin: 6px 0 0 16px; font-size: 11.5px; line-height: 1.6;">
                  <li><strong>Klaster I:</strong> Pendampingan 288 rumah tangga warga binaan secara door-to-door.</li>
                  <li><strong>Klaster II:</strong> Penataan dan optimalisasi fasilitas pemilahan Tempat Sampah di 74 RW binaan.</li>
                  <li><strong>Klaster III:</strong> Pelatihan pengolahan limbah organik menjadi kompos dan pakan ternak.</li>
                  <li><strong>Klaster IV:</strong> Digitalisasi katalog penukaran sembako di Posko Pasar Berseka.</li>
                </ul>

                <h2 class="journal-section-h1">4.0 Peringatan Dini &amp; Mitigasi</h2>
                <p>
                  Tercatat 266 sesi ketidakhadiran tanpa keterangan (alpha kumulatif). Koordinator DPL telah menginstruksikan pemanggilan formal kepada mahasiswa dengan catatan alpa &ge; 3 hari berturut-turut guna menjamin integritas jam kerja akademik.
                </p>
              </div>

              <!-- TABEL STANDAR JURNAL ILMIAH (OPEN TABLE WITHOUT VERTICAL BORDERS) -->
              <div class="journal-table-wrap">
                <div class="journal-table-caption">
                  <strong>Tabel 1.</strong> Rekapitulasi Demografi Mahasiswa, Kepatuhan Presensi, dan Capaian Program Kerja per Kelurahan Binaan
                </div>
                <table class="open-journal-table">
                  <thead>
                    <tr>
                      <th style="width: 30px;">No</th>
                      <th>Kelurahan Binaan</th>
                      <th style="text-align: center;">Kelompok</th>
                      <th style="text-align: center;">Mahasiswa</th>
                      <th>Dosen Pembimbing Lapangan (DPL) Utama</th>
                      <th style="text-align: center;">Kehadiran (%)</th>
                      <th style="text-align: center;">Proker Tuntas</th>
                      <th style="text-align: right;">Status Evaluasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sebaranKelurahan.map((k, idx) => `
                      <tr>
                        <td>${idx + 1}</td>
                        <td><strong>${k.nama}</strong></td>
                        <td style="text-align: center;">${k.kelompok}</td>
                        <td style="text-align: center;">${k.mhs} Orang</td>
                        <td>${k.dpl}</td>
                        <td style="text-align: center; font-weight: 700; color: #047857;">${k.hadir}%</td>
                        <td style="text-align: center;">${k.prokerSelesai} / ${k.totalProker}</td>
                        <td style="text-align: right;"><span style="color: #047857; font-weight: 700;">Memenuhi Syarat</span></td>
                      </tr>
                    `).join("")}
                    <tr>
                      <td colspan="2"><strong>Akumulasi Kecamatan Coblong</strong></td>
                      <td style="text-align: center;"><strong>32 Kelompok</strong></td>
                      <td style="text-align: center;"><strong>524 Mahasiswa</strong></td>
                      <td><strong>32 Dosen Pembimbing Terdaftar</strong></td>
                      <td style="text-align: center; color: #047857;"><strong>96.1%</strong></td>
                      <td style="text-align: center;"><strong>92 / 163</strong></td>
                      <td style="text-align: right;"><strong>PARIPURNA</strong></td>
                    </tr>
                  </tbody>
                </table>
                <div style="font-size: 10px; color: #64748b; margin-top: 4px; font-style: italic;">
                  Sumber: Database Terpadu PostgreSQL BERSEKA, status per 15 Oktober 2026. Target durasi efektif &ge; 240 menit per sesi presensi posko.
                </div>
              </div>

              <!-- LEMBAR PENGESAHAN RESMI NASKAH DINAS -->
              <div class="legal-validation-block">
                <div>
                  <div class="val-role">
                    Mengetahui,<br>
                    <strong>Ketua Task Force KKN BERSEKA UNIKOM</strong>
                  </div>
                  <div class="val-name">Dr. Ir. H. Herman S. Soegoto, MBA.</div>
                  <div class="val-nip">NIP. 4127.34.01.001</div>
                </div>

                <div>
                  <div class="val-role">
                    Diverifikasi Oleh,<br>
                    <strong>Koordinator Dosen Pembimbing Lapangan</strong>
                  </div>
                  <div class="val-name">Dr. H. Tatang Supriyadi, S.E., M.M.</div>
                  <div class="val-nip">NIP. 4127.34.02.075</div>
                </div>

                <div class="digital-seal-wrap">
                  ${iconSvg.qr}
                  <div class="digital-seal-text">
                    Naskah Dinas Sah Terverifikasi<br>
                    <span style="font-family: var(--font-mono); font-size: 9px;">REG-UNIKOM-2026-X027</span>
                  </div>
                  <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Bandung, ${stats.tanggalPengesahan}</div>
                </div>
              </div>

            </div>
          </article>
        </section>

      </div>
    </main>
  </div>

</body>
</html>`;

fs.writeFileSync(outputHtmlPath, htmlContent, "utf8");
console.log(`[Success] Original Dual-View HTML generated at: ${outputHtmlPath}`);

// Render PNG using Brave Headless
try {
  const bravePath = "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe";
  console.log(`[Rendering PNG] Capturing high-resolution dual-view screenshot...`);
  const cmd = `"${bravePath}" --headless=new --screenshot="${outputPngPath}" --window-size=1640,4000 --default-background-color=00000000 --hide-scrollbars "file://${outputHtmlPath.replace(/\\\\/g, "/")}"`;
  execSync(cmd, { stdio: "inherit" });
  console.log(`[Success] Final Image created at: ${outputPngPath}`);
} catch (err) {
  console.error("[Error] Failed to render screenshot:", err);
}
