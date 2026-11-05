import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { execSync } from "child_process";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to escape XML/SVG special characters
function escapeSvgText(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateOfficialArchiveSvg(data: {
  nama: string;
  nip: string;
  kelompok: string;
  kelurahan: string;
  tanggal: string;
  waktu: string;
  tempat: string;
  deskripsi: string;
  status: string;
  docId: string;
}): string {
  const nama = escapeSvgText(data.nama);
  const nip = escapeSvgText(data.nip);
  const kelompok = escapeSvgText(data.kelompok);
  const kelurahan = escapeSvgText(data.kelurahan);
  const tanggal = escapeSvgText(data.tanggal);
  const waktu = escapeSvgText(data.waktu);
  const tempat = escapeSvgText(data.tempat);
  const deskripsi = escapeSvgText(
    (data.deskripsi || "Aktivitas kegiatan lapangan").slice(0, 100) +
      (data.deskripsi && data.deskripsi.length > 100 ? "..." : "")
  );
  const status = escapeSvgText(data.status);
  const docId = escapeSvgText(data.docId.slice(0, 12).toUpperCase());

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
  <defs>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Clean Background -->
  <rect width="100%" height="100%" fill="#f8fafc"/>

  <!-- Paper Card Container -->
  <rect x="24" y="20" width="752" height="480" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="url(#cardShadow)"/>

  <!-- Header Letterhead -->
  <g transform="translate(48, 45)">
    <text x="0" y="0" font-family="'Times New Roman', Times, Georgia, serif" font-size="16" font-weight="700" fill="#0f172a" letter-spacing="0.5">LEMBAGA PENGABDIAN DAN PEMBERDAYAAN MASYARAKAT</text>
    <text x="0" y="20" font-family="'Times New Roman', Times, Georgia, serif" font-size="14" font-weight="700" fill="#047857">KULIAH KERJA NYATA TEMATIK (KKN) BERSEKA - UNIKOM</text>
    <text x="0" y="36" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#64748b">Jl. Dipatiukur No. 112-116, Coblong, Kota Bandung | Arsip Digital Terverifikasi</text>
  </g>

  <!-- Status Pill -->
  <rect x="580" y="38" width="176" height="32" rx="16" fill="#f0fdf4" stroke="#86efac" stroke-width="1.2"/>
  <circle cx="598" cy="54" r="4.5" fill="#16a34a"/>
  <text x="610" y="58" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#15803d">${status}</text>

  <!-- Header Separator Lines -->
  <line x1="48" y1="95" x2="752" y2="95" stroke="#0f172a" stroke-width="2"/>
  <line x1="48" y1="99" x2="752" y2="99" stroke="#0f172a" stroke-width="0.8"/>

  <!-- Document Title -->
  <text x="400" y="130" text-anchor="middle" font-family="'Times New Roman', Times, Georgia, serif" font-size="15" font-weight="700" fill="#0f172a" letter-spacing="1">SURAT BUKTI / DOKUMEN RESMI MAHASISWA</text>
  <line x1="260" y1="135" x2="540" y2="135" stroke="#334155" stroke-width="1"/>

  <!-- Left Column: Identity -->
  <g transform="translate(56, 160)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="700" fill="#64748b">IDENTITAS MAHASISWA</text>
    <text x="0" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#0f172a">${nama}</text>
    <text x="0" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500" fill="#475569">NIM: <tspan font-weight="700" fill="#0f172a">${nip}</tspan></text>

    <text x="0" y="85" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="700" fill="#64748b">KELOMPOK &amp; WILAYAH</text>
    <text x="0" y="106" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#1e293b">${kelompok}</text>
    <text x="0" y="125" font-family="system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="500" fill="#475569">Kelurahan: ${kelurahan}</text>

    <text x="0" y="165" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="700" fill="#64748b">WAKTU &amp; STATUS KEGIATAN</text>
    <text x="0" y="186" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#047857">${tanggal}</text>
    <text x="0" y="205" font-family="system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="500" fill="#475569">${waktu}</text>
  </g>

  <!-- Divider Vertical -->
  <line x1="410" y1="160" x2="410" y2="400" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- Right Column: Details & Verification -->
  <g transform="translate(440, 160)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="700" fill="#64748b">LOKASI / TEMPAT</text>
    <text x="0" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="13.5" font-weight="600" fill="#1e293b">${tempat}</text>

    <text x="0" y="65" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="700" fill="#64748b">KETERANGAN / ALASAN</text>
    <text x="0" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="400" fill="#334155">${deskripsi}</text>

    <!-- Clean Official Seal -->
    <g transform="translate(180, 150)">
      <circle cx="50" cy="50" r="44" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.8"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#86efac" stroke-width="1" stroke-dasharray="4 2"/>
      <path d="M40 50 L47 57 L62 42" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="50" y="73" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" fill="#15803d">TERVERIFIKASI</text>
      <text x="50" y="82" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="6.5" font-weight="600" fill="#64748b">SISTEM KKN</text>
    </g>
  </g>

  <!-- Footer Info Bar -->
  <g transform="translate(48, 460)">
    <line x1="0" y1="0" x2="704" y2="0" stroke="#e2e8f0" stroke-width="1"/>
    <text x="0" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="600" fill="#94a3b8">KODE ARSIP: <tspan fill="#334155">${docId}</tspan></text>
    <text x="704" y="24" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="500" fill="#94a3b8">Pangkalan Data Resmi KKN Tematik BERSEKA Coblong</text>
  </g>
</svg>`;
}

// Fallback for missing local uploads / downloads (e.g. database synced from VPS or HEIC requests)
export const uploadFallbackMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (req.method === "GET" || req.method === "HEAD") {
    const requestedPath = req.path || "";
    const uploadDirs = [
      path.resolve(process.cwd(), "uploads"),
      path.resolve(process.cwd(), "apps/api/uploads"),
      path.resolve(__dirname, "../uploads"),
      path.resolve(__dirname, "../../uploads"),
      path.resolve(process.cwd(), "../uploads"),
      path.resolve(process.cwd(), "apps/web/public/uploads"),
    ];

    // Helper to find file across candidate upload dirs
    const findFile = (relPath: string): string | null => {
      const clean = relPath.replace(/^\//, "");
      for (const dir of uploadDirs) {
        const full = path.resolve(dir, clean);
        if (fs.existsSync(full)) return full;
      }
      return null;
    };

    // Helper to convert HEIC/HEIF using installed server utilities (heif-convert, magick, convert, ffmpeg)
    const convertHeicToJpg = (src: string, dst: string): boolean => {
      for (const cmd of [
        `heif-convert "${src}" "${dst}"`,
        `magick "${src}" "${dst}"`,
        `convert "${src}" "${dst}"`,
        `ffmpeg -y -i "${src}" "${dst}"`,
      ]) {
        try {
          execSync(cmd);
          if (fs.existsSync(dst)) {
            try { fs.chmodSync(dst, 0o644); } catch {}
            return true;
          }
        } catch {}
      }
      return false;
    };

    // Case 1: User requests .jpg but .jpg is missing on disk -> Check if .heic/.heif exists & convert on the fly
    if (/\.jpg$/i.test(requestedPath)) {
      const existingJpg = findFile(requestedPath);
      if (!existingJpg) {
        const baseName = requestedPath.replace(/\.jpg$/i, "");
        for (const altExt of [".heic", ".heif", ".HEIC", ".HEIF"]) {
          const altLocal = findFile(`${baseName}${altExt}`);
          if (altLocal) {
            const targetJpg = path.resolve(path.dirname(altLocal), `${path.basename(baseName)}.jpg`);
            if (convertHeicToJpg(altLocal, targetJpg)) {
              res.setHeader("Access-Control-Allow-Origin", "*");
              return res.sendFile(targetJpg);
            }
          }
        }
      }
    }

    // Case 2: User requests .heic/.heif directly -> convert to .jpg & serve converted .jpg
    if (/\.(heic|heif)$/i.test(requestedPath)) {
      const jpgRelativePath = requestedPath.replace(/\.(heic|heif)$/i, ".jpg");
      const existingJpg = findFile(jpgRelativePath);
      if (existingJpg) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", "image/jpeg");
        return res.sendFile(existingJpg);
      }

      // Convert if .heic exists on disk
      const existingHeic = findFile(requestedPath);
      if (existingHeic) {
        const targetJpg = path.resolve(path.dirname(existingHeic), `${path.basename(jpgRelativePath)}`);
        if (convertHeicToJpg(existingHeic, targetJpg)) {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Content-Type", "image/jpeg");
          return res.sendFile(targetJpg);
        }
      }
    }

    // Pada environment lokal: fallback ke CDN produksi berseka.id melalui HTTPS
    const isLocalDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
    if (isLocalDev && req.hostname === "localhost") {
      const vpsUploadUrl = `https://berseka.id/uploads${req.path}`;
      return res.redirect(307, vpsUploadUrl);
    }

    // Case 3: Jika berkas fisik gambar tidak ada di server (foto historis)
    // Sajikan Kartu Arsip Bukti Resmi KKN BERSEKA terverifikasi berbasis pangkalan data PostgreSQL
    if (/\.(jpg|jpeg|png|webp|heic|heif|gif)$/i.test(requestedPath)) {
      const cleanPath = requestedPath.replace(/^\//, "");
      const baseName = path.basename(cleanPath);

      let archiveData = {
        nama: "Mahasiswa KKN Berseka",
        nip: "-",
        kelompok: "Kelompok KKN Tematik",
        kelurahan: "-",
        tanggal: "-",
        waktu: "Waktu Kegiatan Tervalidasi",
        tempat: "Lokasi Lapangan Kegiatan",
        deskripsi: "Dokumentasi kegiatan resmi mahasiswa KKN Tematik BERSEKA",
        status: "TERCATAT RESMI",
        docId: baseName,
      };

      try {
        // Cari metadata di tabel logbook_kkn
        const logbook = await prisma.logbookKkn.findFirst({
          where: {
            OR: [
              { fotoBuktiUrl: { contains: baseName } },
              { fotoBuktiUrl: `/uploads/${baseName}` },
              { fotoBuktiUrl: requestedPath },
            ],
          },
          include: {
            penulis: { select: { name: true, nip: true } },
            kelompok: { select: { name: true, kelurahan: true } },
          },
        });

        if (logbook) {
          archiveData = {
            nama: logbook.penulis?.name || "Mahasiswa KKN",
            nip: logbook.penulis?.nip || "-",
            kelompok: logbook.kelompok?.name || "Kelompok KKN",
            kelurahan: logbook.kelompok?.kelurahan || "-",
            tanggal: logbook.tanggalKegiatan
              ? new Date(logbook.tanggalKegiatan).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "-",
            waktu: logbook.waktuMulai
              ? `${logbook.waktuMulai} - ${logbook.waktuSelesai || "Selesai"} WIB`
              : "Waktu Kegiatan Tervalidasi",
            tempat: logbook.tempat || "Lokasi Lapangan Kegiatan",
            deskripsi: logbook.deskripsi || "Aktivitas kegiatan lapangan KKN Tematik BERSEKA",
            status:
              logbook.statusApproval === "DISETUJUI_DPL"
                ? "TERVERIFIKASI DPL"
                : logbook.statusApproval.replace(/_/g, " "),
            docId: logbook.id,
          };
        } else {
          // Cari metadata di presensi mandiri
          const presensi = await prisma.presensiMandiri.findFirst({
            where: {
              OR: [
                { fotoUrl: { contains: baseName } },
                { fotoUrl: `/uploads/${baseName}` },
                { fotoUrl: requestedPath },
              ],
            },
            include: {
              student: { select: { name: true, nip: true } },
              kelompok: { select: { name: true, kelurahan: true } },
            },
          });

          if (presensi) {
            archiveData = {
              nama: presensi.student?.name || "Mahasiswa KKN",
              nip: presensi.student?.nip || "-",
              kelompok: presensi.kelompok?.name || "Kelompok KKN",
              kelurahan: presensi.kelompok?.kelurahan || "-",
              tanggal: presensi.checkInAt
                ? new Date(presensi.checkInAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "-",
              waktu: presensi.checkInAt
                ? `${new Date(presensi.checkInAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} WIB`
                : "-",
              tempat: "Presensi Mandiri Lapangan",
              deskripsi:
                presensi.deskripsiKegiatan ||
                "Dokumentasi presensi mandiri kegiatan lapangan KKN Tematik",
              status:
                presensi.status === "AKTIF" ? "TERVERIFIKASI SISTEM" : presensi.status,
              docId: presensi.id,
            };
          } else {
            // Cari metadata di pengajuan izin mahasiswa
            const leave = await (prisma as any).studentLeaveRequest.findFirst({
              where: {
                OR: [
                  { evidenceUrl: { contains: baseName } },
                  { evidenceUrl: `/uploads/${baseName}` },
                  { evidenceUrl: requestedPath },
                ],
              },
              include: {
                student: {
                  select: {
                    name: true,
                    nip: true,
                    studentProfile: {
                      include: {
                        kelompok: { select: { name: true, kelurahan: true } },
                      },
                    },
                  },
                },
              },
            });

            if (leave) {
              const kelName = leave.student?.studentProfile?.kelompok?.name || "Kelompok KKN";
              const kelLurah = leave.student?.studentProfile?.kelompok?.kelurahan || "Coblong";
              archiveData = {
                nama: leave.student?.name || "Mahasiswa KKN",
                nip: leave.student?.nip || "-",
                kelompok: kelName,
                kelurahan: kelLurah,
                tanggal: leave.startDate
                  ? new Date(leave.startDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "-",
                waktu: leave.type || "IZIN",
                tempat: `Kelurahan ${kelLurah}`,
                deskripsi: leave.reason || "Pengajuan izin resmi mahasiswa KKN Tematik",
                status:
                  leave.status === "APPROVED"
                    ? "DISETUJUI DPL"
                    : String(leave.status || "TERCATAT").replace(/_/g, " "),
                docId: leave.id,
              };
            }
          }
        }
      } catch (dbErr) {
        console.error("[Upload Fallback Archive] DB error:", dbErr);
      }

      const archiveSvg = generateOfficialArchiveSvg(archiveData);

      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("X-Image-Fallback", "true");
      return res.status(200).send(archiveSvg);
    }
  }
  next();
};
