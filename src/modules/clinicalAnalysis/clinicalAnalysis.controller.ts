import type { Request, Response } from "express";
import { ClinicalService } from "./clinicalAnalysis.service.js";

export class ClinicalController {

  static async getDashboard(req: Request, res: Response) {

    try {

      const summary = await ClinicalService.getSummary();
      const ageDistribution = await ClinicalService.getAgeDistribution();
      const transitions = await ClinicalService.getTransitions();

      res.json({
        success: true,
        payload: {
          summary,
          ageDistribution,
          transitions
        }
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch clinical analytics"
      });

    }

  }

}