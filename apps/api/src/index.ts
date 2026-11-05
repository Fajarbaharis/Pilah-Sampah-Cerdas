import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from apps/api/.env with root .env fallback
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config();

import { prisma } from "./lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
// Release sync: AI ONNX adapter, Student NIM password reset, printed QR codes restoration, and UI rules alignment

import express from "express";
import cookieParser from "cookie-parser";
import fs from "fs";
import { execSync } from "child_process";

import authRouter from "./routes/authRoutes.js";
import householdRouter from "./routes/householdRoutes.js";
import binRouter from "./routes/binRoutes.js";
import pointRouter from "./routes/pointRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import userRouter from "./routes/userRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import transactionRouter from "./routes/transactionRoutes.js";
import scheduleRouter from "./routes/scheduleRoutes.js";
import systemRouter from "./routes/systemRoutes.js";
import configRouter from "./routes/configRoutes.js";
import gamificationRouter from "./routes/gamificationRoutes.js";
import facilityRouter from "./routes/facilityRoutes.js";
import bankSampahRouter from "./routes/bankSampahRoutes.js";
import notificationIntegrationRouter from "./routes/notificationIntegrationRoutes.js";
import kknRouter from "./routes/kknRoutes.js";
import residuRouter from "./routes/residuRoutes.js";
import superUserRouter from "./routes/superUserRoutes.js";
import rwRouter from "./routes/rwRoutes.js";
import ideDaurUlangRouter from "./routes/ideDaurUlangRoutes.js";
import universitasRouter from "./routes/universitasRoutes.js";
import poskoKknRouter from "./routes/poskoKknRoutes.js";
import areaRouter from "./routes/areaRoutes.js";
import adminMahasiswaRouter from "./routes/adminMahasiswaRoutes.js";
import kknAttendanceRouter from "./routes/kknAttendanceRoutes.js";
import pemanfaatanRouter from "./routes/pemanfaatanRoutes.js";
import pengangkutanRouter from "./routes/pengangkutanRoutes.js";
import kelompokRouter from "./routes/kelompokRoutes.js";
import dplRouter from "./routes/dplRoutes.js";
import mplRouter from "./routes/mplRoutes.js";
import permissionRouter from "./routes/permissionRoutes.js";
import surveiKknRouter from "./routes/surveiKknRoutes.js";
import surveyRouter from "./routes/surveyRoutes.js";
import evaluasiDampakRouter from "./routes/evaluasiDampakRoutes.js";
import datasetKlasifikasiRouter from "./routes/datasetKlasifikasiRoutes.js";
import panduanRouter from "./routes/panduanRoutes.js";
import masterKegiatanRouter from "./routes/masterKegiatanRoutes.js";
import masterLuaranRouter from "./routes/masterLuaranRoutes.js";
import penilaianKknRouter from "./routes/penilaianKknRoutes.js";
import sertifikatKknRouter from "./routes/sertifikatKknRoutes.js";
import systemAnalysisRouter from "./routes/systemAnalysisRoutes.js";
import timelineKknRouter from "./routes/timelineKknRoutes.js";
import logbookRouter from "./routes/logbookRoutes.js";
import beritaRouter from "./routes/beritaRoutes.js";
import presensiMandiriRouter from "./routes/presensiMandiriRoutes.js";
import gisEksekutifRouter from "./routes/gisEksekutifRoutes.js";
import laporanKknRouter from "./routes/laporanKknRoutes.js";
import iotRouter from "./routes/iotRoutes.js";
import brandingRouter from "./routes/brandingRoutes.js";
import { historyRouter } from "./routes/historyRoutes.js";
import { systemController } from "./controllers/systemController.js";
import { kknAttendanceController } from "./controllers/kknAttendanceController.js";
import { kknController } from "./controllers/kknController.js";
import { configController } from "./controllers/configController.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { roleMiddleware } from "./middlewares/roleMiddleware.js";
import { safeUploadSingleImage, safeUploadPemanfaatanImage } from "./middlewares/uploadMiddleware.js";

import { setupSwagger } from "./swagger.js";
import { readOnlyGuard } from "./middlewares/readOnlyGuard.js";
import { auditMiddleware } from "./middlewares/audit.middleware.js";
import "./workers/audit.worker.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS with Dynamic Preflight Reflection & Tunnel Header Support
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");

  // Dynamically reflect requested headers from preflight OPTIONS request
  const requestedHeaders = req.headers["access-control-request-headers"];
  if (requestedHeaders) {
    res.setHeader("Access-Control-Allow-Headers", requestedHeaders);
  } else {
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, bypass-tunnel-reminder, *"
    );
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(readOnlyGuard);
app.use(auditMiddleware("Global"));

// Disable HTTP Caching on all API routes to prevent mobile client stale data issues
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// Create uploads folder if not exists
fs.mkdirSync("uploads", { recursive: true });

const staticCacheOptions = {
  maxAge: process.env.NODE_ENV === "production" ? "7d" : "1h",
  immutable: true,
  etag: true,
  lastModified: true,
};

// Statically serve uploads and downloads folders with multi-directory fallback
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads"), staticCacheOptions));
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "apps/api/uploads"), staticCacheOptions)
);
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads"), staticCacheOptions));
app.use("/uploads", express.static(path.resolve(__dirname, "../../uploads"), staticCacheOptions));
app.use("/uploads", express.static(path.resolve(process.cwd(), "../uploads"), staticCacheOptions));
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "apps/web/public/uploads"), staticCacheOptions)
);

import { uploadFallbackMiddleware } from "./middlewares/uploadFallback.js";
app.use("/uploads", uploadFallbackMiddleware);

app.use("/downloads", express.static(path.resolve(process.cwd(), "uploads"), staticCacheOptions));
app.use(
  "/downloads",
  express.static(path.resolve(process.cwd(), "apps/api/uploads"), staticCacheOptions)
);
app.use("/downloads", express.static(path.resolve(__dirname, "../uploads"), staticCacheOptions));
app.use("/downloads", express.static(path.resolve(__dirname, "../../uploads"), staticCacheOptions));

app.use("/downloads", (req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD") {
    const isLocalDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
    if (isLocalDev && req.hostname === "localhost") {
      const vpsDownloadUrl = `https://berseka.id/downloads${req.path}`;
      return res.redirect(307, vpsDownloadUrl);
    }
  }
  next();
});


// Statically serve /certificates folder (Pre-generated official PDFs) with multi-directory fallback
app.use("/certificates", express.static(path.resolve(process.cwd(), "apps/web/public/certificates"), staticCacheOptions));
app.use("/certificates", express.static(path.resolve(process.cwd(), "apps/web/dist/certificates"), staticCacheOptions));
app.use("/certificates", express.static(path.resolve(process.cwd(), "../web/public/certificates"), staticCacheOptions));
app.use("/certificates", express.static(path.resolve(__dirname, "../../web/public/certificates"), staticCacheOptions));
app.use("/certificates", express.static(path.resolve(__dirname, "../../../apps/web/public/certificates"), staticCacheOptions));

// Statically serve /image folder (public assets like QR templates) with multi-directory fallback
app.use("/image", express.static(path.resolve(process.cwd(), "apps/web/public/image"), staticCacheOptions));
app.use("/image", express.static(path.resolve(process.cwd(), "../web/public/image"), staticCacheOptions));
app.use("/image", express.static(path.resolve(__dirname, "../../web/public/image"), staticCacheOptions));
app.use("/image", express.static(path.resolve(__dirname, "../../../apps/web/public/image"), staticCacheOptions));

// In-App Version Checking Endpoints (Direct Root & /v1 for Mobile Updater)
app.get("/api/v1/app-version", (req, res) => systemController.getAppVersion(req, res));
app.get("/api/app-version", (req, res) => systemController.getAppVersion(req, res));

// Health check publik (supports /health, /api/health, /api/v1/health) - dievaluasi sebelum router bisnis
app.get(["/health", "/api/health", "/api/v1/health"], (_req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Main APIs
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/households", householdRouter);
app.use("/api/v1/bins", binRouter);
app.use("/api/v1/points", pointRouter);
app.use("/api/v1/waste", aiRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use(["/api/v1/notifications", "/api/v1/notifikasi"], notificationRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use(["/api/v1/history", "/api/history"], historyRouter);
app.use("/api/v1/schedules", scheduleRouter);
app.use("/api/v1/system", systemRouter);
app.use("/api/v1/branding", brandingRouter);
app.use("/api/v1/system/app-settings", brandingRouter);
app.use("/api/v1/config", configRouter);
app.use("/api/v1/configs", configRouter);
app.use("/api/config", configRouter);
app.use("/api/configs", configRouter);
app.use("/api/v1/gamification", gamificationRouter);
app.use("/api/v1/facilities", facilityRouter);
app.use("/api/v1/bank-sampah", bankSampahRouter);
app.use("/api/v1/notifications/integration", notificationIntegrationRouter);
app.use("/api/v1/kkn", kknRouter);
app.use("/api/v1/residu", residuRouter);
app.use("/api/v1/petugas-residu", residuRouter);
app.use("/api/v1/petugas-pemilahan", residuRouter);
app.use("/api/v1/pemilahan", residuRouter);
app.use("/api/v1/super-user", superUserRouter);
app.use("/api/v1/rw", rwRouter);
app.use("/api/v1/rt", rwRouter);
app.use("/api/v1/ide-daur-ulang", ideDaurUlangRouter);
app.use("/api/v1/universitas", universitasRouter);
app.use("/api/v1/posko-kkn", poskoKknRouter);
app.use("/api/v1/areas", areaRouter);
app.use("/api/v1/wilayah", areaRouter);
app.use("/api/v1/admin/mahasiswa", adminMahasiswaRouter);
app.use("/api/v1/kkn-attendance", kknAttendanceRouter);
// REMOVED: app.use("/api/v1", kknAttendanceRouter) — root wildcard mount dihapus, digantikan explicit dedicated endpoints di bawah
app.use("/api/v1/pemanfaatan", pemanfaatanRouter);
app.use("/api/v1/pengangkutan", pengangkutanRouter);
app.use("/api/v1/kelompok", kelompokRouter);
app.use("/api/v1/dpl", dplRouter);
app.use("/api/v1/mpl", mplRouter);
app.use("/api/v1/permissions", permissionRouter);
app.use("/api/v1/survei-kkn", surveiKknRouter);
app.use(["/api/v1/survey", "/api/v1/survey-kkn"], surveyRouter);
app.use("/api/v1/evaluasi-dampak", evaluasiDampakRouter);
app.use("/api/v1", datasetKlasifikasiRouter);
app.use("/api/v1/panduan", panduanRouter);
app.use("/api/v1/master-kegiatan", masterKegiatanRouter);
app.use("/api/v1/master/luaran", masterLuaranRouter);
app.use("/api/v1/master-luaran", masterLuaranRouter);
app.use("/api/v1/penilaian-kkn", penilaianKknRouter);
app.use(["/api/v1/sertifikat-kkn", "/api/v1/penilaian-kkn/sertifikat"], sertifikatKknRouter);
app.use(["/api/v1/analisis-sistem", "/api/v1/system-analysis"], systemAnalysisRouter);
app.use(["/api/v1/kelompok-kkn", "/api/v1/kelompok"], kelompokRouter);
app.use("/api/v1/timeline-kkn", timelineKknRouter);
app.use("/api/v1/logbook", logbookRouter);
app.use("/api/v1/berita", beritaRouter);
app.use("/api/v1/presensi", presensiMandiriRouter);
app.use(["/api/v1/gis-eksekutif", "/api/v1/gis"], gisEksekutifRouter);
app.use(["/api/v1/laporan/kkn", "/api/v1/laporan-pimpinan/kkn", "/api/laporan/kkn"], laporanKknRouter);
app.use(["/api/v1/iot", "/api/iot"], iotRouter);

// Master API Spec Alias Mounts (Compatibility for mobile client without /v1 prefix)
app.use("/api/v1/user", userRouter);
app.use("/api/kkn", kknRouter);
app.use("/api/logbook", logbookRouter);
app.use("/api/berita", beritaRouter);
app.use("/api/kkn-attendance", kknAttendanceRouter);
app.use("/api/residu", residuRouter);
app.use("/api/petugas-residu", residuRouter);
app.use("/api/petugas-pemilahan", residuRouter);
app.use("/api/pemilahan", residuRouter);
app.use(["/api/notifications", "/api/notifikasi"], notificationRouter);
app.use("/api/auth", authRouter);
app.use("/api/rw", rwRouter);
app.use("/api/rt", rwRouter);
app.use("/api/areas", areaRouter);
app.use("/api/wilayah", areaRouter);
app.use("/api/penilaian-kkn", penilaianKknRouter);
app.use(["/api/sertifikat-kkn", "/api/penilaian-kkn/sertifikat"], sertifikatKknRouter);
app.use(["/api/analisis-sistem", "/api/system-analysis"], systemAnalysisRouter);
app.use(["/api/kelompok-kkn", "/api/kelompok"], kelompokRouter);

// Dedicated Direct Endpoints for Web Dashboard Monitoring & Mobile Background Worker
// (Explicitly mapped without root wildcards to eliminate router collision while guaranteeing 100% compatibility)
app.post(
  ["/api/v1/location-ping", "/api/location-ping"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  kknAttendanceController.pingLocation
);
app.get(
  ["/api/v1/mahasiswa/lokasi-aktif", "/api/mahasiswa/lokasi-aktif"],
  authMiddleware,
  roleMiddleware([
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "DPL",
    "DOSEN_PEMBIMBING",
    "MPL",
    "MITRA_PENDAMPING_LAPANGAN",
    "MITRA_PEMBIMBING_LAPANGAN",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  kknAttendanceController.getActiveStudentsLocations
);
app.get(
  ["/api/v1/timesheet/summary", "/api/timesheet/summary"],
  authMiddleware,
  roleMiddleware([
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "DPL",
    "DOSEN_PEMBIMBING",
    "MPL",
    "MITRA_PENDAMPING_LAPANGAN",
    "MITRA_PEMBIMBING_LAPANGAN",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
    "MAHASISWA_KKN",
    "DEVELOPER",
  ]),
  kknAttendanceController.getTimesheetSummary
);
app.get(
  ["/api/v1/kegiatan/:id/absen", "/api/kegiatan/:id/absen"],
  authMiddleware,
  roleMiddleware([
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "DPL",
    "DOSEN_PEMBIMBING",
    "MPL",
    "MITRA_PENDAMPING_LAPANGAN",
    "MITRA_PEMBIMBING_LAPANGAN",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  kknAttendanceController.getAttendanceList
);
app.get(
  ["/api/v1/kegiatan/:id/lokasi", "/api/kegiatan/:id/lokasi"],
  authMiddleware,
  roleMiddleware([
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "DPL",
    "DOSEN_PEMBIMBING",
    "MPL",
    "MITRA_PENDAMPING_LAPANGAN",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
    "PIMPINAN",
    "MAHASISWA_KKN",
  ]),
  kknAttendanceController.getActivityLocation
);
app.post(
  ["/api/v1/kegiatan/:id/absen", "/api/kegiatan/:id/absen"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknAttendanceController.recordAttendance
);
app.post(
  [
    "/api/v1/kegiatan/:id/check-out",
    "/api/v1/kegiatan/:id/checkout",
    "/api/kegiatan/:id/check-out",
    "/api/kegiatan/:id/checkout",
  ],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknAttendanceController.checkOutAttendance
);
app.get(
  [
    "/api/v1/laporan-rekap",
    "/api/laporan-rekap",
    "/api/v1/laporan-presensi",
    "/api/laporan-presensi",
  ],
  authMiddleware,
  roleMiddleware([
    "DEVELOPER",
    "DPL",
    "DOSEN_PEMBIMBING",
    "MPL",
    "MITRA_PENDAMPING_LAPANGAN",
    "MITRA_PEMBIMBING_LAPANGAN",
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  kknAttendanceController.getLaporanPresensi
);

// Direct Panen Hasil Endpoints for Mobile Client
app.post(
  ["/api/v1/panen-hasil", "/api/panen-hasil", "/api/v1/panen-hasil/:id", "/api/panen-hasil/:id"],
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  safeUploadPemanfaatanImage,
  kknController.updatePanenHasil
);
app.put(
  ["/api/v1/panen-hasil/:id", "/api/panen-hasil/:id"],
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  safeUploadPemanfaatanImage,
  kknController.updatePanenHasil
);
app.patch(
  ["/api/v1/panen-hasil/:id", "/api/panen-hasil/:id"],
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  safeUploadPemanfaatanImage,
  kknController.updatePanenHasil
);
app.delete(
  ["/api/v1/panen-hasil/:id", "/api/panen-hasil/:id"],
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  kknController.deletePanenHasil
);

// Public Mobile Force Update App Version Endpoint
app.get(
  [
    "/api/v1/config/app-version",
    "/api/v1/configs/app-version",
    "/api/config/app-version",
    "/api/configs/app-version",
    "/api/app-version",
    "/api/v1/app-version",
  ],
  configController.getAppVersion
);

// Global Error Handler Middleware
app.use((err: any, req: any, res: any, _next: any) => {
  console.error("Unhandled Global Error:", err);
  res.status(err.status || 500).json({
    success: false,
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: "Sistem sedang mengalami gangguan sementara, silakan coba beberapa saat lagi.",
  });
});

// Initialize Swagger Docs
setupSwagger(app);

// Health check (supports /health, /api/health, /api/v1/health)
app.get(["/health", "/api/health", "/api/v1/health"], (_req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`pilahsampah.id Backend running on port ${PORT}`);
  console.log(`===============================================`);
});

server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[Server Warning] Port ${PORT} is already in use. Please check running Node processes.`
    );
  } else {
    console.error("[Server Error]", err);
  }
});

// Initialize WebSocket Server
import { websocketService } from "./services/websocketService.js";
websocketService.init(server);

// Initialize Cron Scheduler Service (Only on primary instance in PM2 Cluster Mode)
import { cronService } from "./services/cronService.js";
import { archiveAuditLogsCron } from "./cron/archive.cron.js";

const isPrimaryWorker = !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === "0";
if (isPrimaryWorker) {
  console.log(
    `[CronService] Initializing cron scheduler on primary worker instance (${process.env.NODE_APP_INSTANCE || "single-process"})...`
  );
  cronService.start();
  archiveAuditLogsCron.start();
} else {
  console.log(
    `[CronService] Skipping cron initialization on secondary worker instance (${process.env.NODE_APP_INSTANCE}) to avoid duplicated tasks.`
  );
}

// Auto-migrate missing database columns on startup (ISO/IEC 12207 Modular Architecture)
import { runAutoMigrations } from "./lib/autoMigration.js";
runAutoMigrations().catch((e) => console.error("[AutoMigration Bootstrap Error]", e));
