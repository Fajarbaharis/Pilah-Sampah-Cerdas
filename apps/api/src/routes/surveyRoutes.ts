/**
 * Project: BERSEKA
 * Routes untuk Form Survey KKN (survey.berseka.id)
 */

import express, { Router } from "express";
import { surveyController } from "../controllers/surveyController.js";

const router = Router();

// Middleware parser ganda untuk route public survey
const surveyBodyParser = [
  express.json({ limit: "10mb" }),
  express.text({ type: ["text/plain", "text/*"], limit: "10mb" }),
];

// Public routes untuk enumerator lapangan (mahasiswa KKN dengan validasi NIM)
router.get("/verify-student", surveyController.verifyStudent);
router.get("/kelompok-list", surveyController.getKelompokList); // daftar kelompok KKN dari DB
router.post("/submit", surveyBodyParser, surveyController.submitSurvey);
router.get("/data", surveyController.getSurveyData);
router.delete("/:id", surveyController.deleteSurvey);

export default router;
