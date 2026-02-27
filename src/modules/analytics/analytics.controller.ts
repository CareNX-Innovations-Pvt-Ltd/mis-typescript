import type { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service.js';

export class AnalyticsController {

  static async getDashboard(req: Request, res: Response) {

    try {

      const data = await AnalyticsService.getDashboard(
        req.query as any,
                req.user

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