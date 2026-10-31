/**
 * Project: BERSEKA
 * Routes untuk Form Survey KKN (survey.berseka.id)
 */

import express, { Router } from "express";
import { surveyController } from "../controllers/surveyController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// Middleware parser ganda untuk route public survey
const surveyBodyParser = [
  express.json({ limit: "10mb" }),
  express.text({ type: ["text/plain", "text/*"], limit: "10mb" }),
];

// Public routes untuk enumerator lapangan (mahasiswa KKN dengan validasi NIM)
router.get("/verify-student", surveyController.verifyStudent);
router.get("/kelompok-list", surveyController.getKelompokList); // daftar kelompok KKN dari DB
router.get("/check-rw", surveyController.checkRw); // Cek status survei RW real-time
router.post("/submit", surveyBodyParser, surveyController.submitSurvey);
router.get("/data", surveyController.getSurveyData);
router.get("/:id/riwayat", surveyController.getSurveyRiwayat); // Linimasa riwayat revisi RW

// Protected routes (khusus Super Admin / Developer untuk hard delete)
router.delete("/:id", authMiddleware, surveyController.deleteSurvey);

export default router;
