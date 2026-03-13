import { Router } from "express";
import { ClinicalController } from "./clinicalAnalysis.controller.js";

const router = Router();

router.get("/clinicalAnalysis", ClinicalController.getDashboard);

export default router;