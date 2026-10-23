/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Routes: Branding & Dynamic Application Settings
 * Hak Akses: DEVELOPER & SUPER_USER (kecuali endpoint /public)
 */

import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { safeUploadSingleImage } from "../middlewares/uploadMiddleware.js";
import { brandingController } from "../controllers/brandingController.js";

const router = Router();

const ALLOWED_ADMIN_ROLES = ["DEVELOPER", "SUPER_USER"];

/**
 * Public Endpoint: Mendapatkan konfigurasi branding aktif (No Auth)
 */
router.get("/public", (req, res) => brandingController.getPublicBranding(req, res));

/**
 * Admin & Developer Endpoints: Mengelola konfigurasi identitas aplikasi
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ALLOWED_ADMIN_ROLES),
  (req, res) => brandingController.getDeveloperBranding(req, res)
);

router.put(
  "/",
  authMiddleware,
  roleMiddleware(ALLOWED_ADMIN_ROLES),
  (req, res) => brandingController.updateBranding(req, res)
);

router.post(
  "/upload-asset",
  authMiddleware,
  roleMiddleware(ALLOWED_ADMIN_ROLES),
  safeUploadSingleImage("asset"),
  (req, res) => brandingController.uploadAsset(req, res)
);

router.post(
  "/restore-previous",
  authMiddleware,
  roleMiddleware(ALLOWED_ADMIN_ROLES),
  (req, res) => brandingController.restorePrevious(req, res)
);

router.post(
  "/reset-factory",
  authMiddleware,
  roleMiddleware(ALLOWED_ADMIN_ROLES),
  (req, res) => brandingController.resetFactory(req, res)
);

export default router;
