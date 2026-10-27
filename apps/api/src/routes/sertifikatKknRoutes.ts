/**
 * Project: BERSEKA
 * Developed by: PT Makerindo & Universitas Komputer Indonesia
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Routes E-Sertifikat Resmi KKN Tematik UNIKOM
 */

import { Router } from "express";
import { sertifikatKknController } from "../controllers/sertifikatKknController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Seluruh role yang berhak melihat sertifikat (termasuk Mahasiswa untuk dirinya sendiri)
const SERTIFIKAT_READ_ROLES = [
  "DEVELOPER",
  "SUPER_USER",
  "ADMIN_DLH",
  "DPL",
  "DOSEN_PEMBIMBING",
  "DOSEN_PENDAMPING",
  "DOSEN_PENDAMPING_LAPANGAN",
  "MPL",
  "PANITIA_TASKFORCE",
  "PEMIMPIN",
  "PIMPINAN",
  "CAMAT",
  "LURAH",
  "RW",
  "MAHASISWA_KKN",
] as const;

// 1. Endpoint Daftar Sertifikat (Live DB Scoped by Role)
router.get(
  "/list",
  authMiddleware,
  roleMiddleware([...SERTIFIKAT_READ_ROLES]),
  sertifikatKknController.getList
);

// 2. Endpoint Detail Sertifikat per NIM
router.get(
  "/detail/:nim",
  authMiddleware,
  roleMiddleware([...SERTIFIKAT_READ_ROLES]),
  sertifikatKknController.getByNim
);

// 3. Endpoint Verifikasi Publik QR Code (Public - No Auth Required)
router.get(
  "/verify/:idSertifikat",
  sertifikatKknController.verify
);

export default router;
