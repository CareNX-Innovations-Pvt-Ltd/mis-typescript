import type { Request, Response } from 'express';
import { FeedbackService } from './feedback.service.js';

export class FeedbackController {

  static async getDashboard(req: Request, res: Response) {

    try {

      const data = await FeedbackService.getDashboard(
        req.query as any
      );

      return res.status(200).json({
        success: true,
        payload: data
      });

    } catch (error: any) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

}