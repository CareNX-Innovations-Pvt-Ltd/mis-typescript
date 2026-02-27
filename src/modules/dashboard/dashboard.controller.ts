import type { Request, Response } from 'express';
import { DashboardService } from './dashboard.service.js';

export class DashboardController {

  static async getDashboard(req: Request, res: Response) {

    try {

      const data = await DashboardService.getDashboard(
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