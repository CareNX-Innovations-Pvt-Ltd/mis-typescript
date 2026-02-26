import type { Request, Response } from "express";
import { UpdateFeedbackService } from "./updateFeedback.service.js";

export class UpdateFeedbackController {
  static async update(req: Request, res: Response) {
    try {
      // Force id to string
      const id = req.params.id as string;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Feedback ID is required",
        });
      }

      const ticket = await UpdateFeedbackService.update(id, req.body);

      return res.status(200).json({
        success: true,
        message: "Feedback updated successfully",
        data: ticket,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }
}
