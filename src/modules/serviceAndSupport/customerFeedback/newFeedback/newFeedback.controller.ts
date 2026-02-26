import type { Request, Response } from "express";
import { NewFeedbackService } from "./newFeedback.service.js";

export class NewFeedbackController {
  // Create
  static async create(req: Request, res: Response) {
    try {
      const org = await NewFeedbackService.create(req.body);

      res.status(201).json({
        success: true,
        data: org,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

}
