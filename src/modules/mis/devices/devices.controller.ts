import type { Request, Response } from "express";
import { DeviceService } from "./devices.service.js";

export class DeviceController {
  static async getAll(req: Request, res: Response) {
    try {

      const search =
        typeof req.query.search === "string"
          ? req.query.search
          : undefined;

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 25;

      const data = await DeviceService.getAll(
        search,
        req.user,
        page,
        limit
      );

      return res.status(200).json({
        success: true,
        payload: data,
        status_code: 200,
      });

    } catch (err: any) {

      const message = err.message || "Internal Server Error";

      if (message === "Unauthorized") {
        return res.status(401).json({
          success: false,
          payload: null,
          status_code: 401,
          message,
        });
      }

      if (message === "Forbidden") {
        return res.status(403).json({
          success: false,
          payload: null,
          status_code: 403,
          message,
        });
      }

      return res.status(500).json({
        success: false,
        payload: null,
        status_code: 500,
        message,
      });
    }
  }
}