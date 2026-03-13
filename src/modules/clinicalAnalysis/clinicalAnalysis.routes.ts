import { Router } from "express";
import { ClinicalController } from "./clinicalAnalysis.controller.js";

const router = Router();

router.get("/analytics/clinical", ClinicalController.getDashboard);

export default router;