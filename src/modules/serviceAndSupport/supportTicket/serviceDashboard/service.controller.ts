import type { Request, Response } from 'express';
import { ServiceSupportService } from './service.service.js';
import type {
  ServiceDashboardQuery
} from './service.interface.js';

export class ServiceSupportController {

  static async getServiceDashboard(req: Request, res: Response) {

    try {

      const query = req.query as unknown as ServiceDashboardQuery;

      if (!query.from || !query.to) {
        return res.status(400).json({
          success: false,
          message: 'from and to dates are required'
        });
      }

      const data = await ServiceSupportService.getServiceDashboard(query);

      return res.status(200).json({
        success: true,
        payload: data
      });

    } catch (error: any) {

      console.error('Service Dashboard Error:', error);

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }
  }

}