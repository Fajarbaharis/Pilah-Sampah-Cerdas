/**
 * Project: BERSEKA
 * Routes untuk Form Survey KKN (survey.berseka.id)
 */

import { Router } from "express";
import { surveyController } from "../controllers/surveyController.js";

const router = Router();

// Public routes untuk enumerator lapangan (mahasiswa KKN dengan validasi NIM)
router.get("/verify-student", surveyController.verifyStudent);
router.post("/submit", surveyController.submitSurvey);
router.get("/data", surveyController.getSurveyData);
router.delete("/:id", surveyController.deleteSurvey);

export default router;
