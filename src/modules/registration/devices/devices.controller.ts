import type { Request, Response } from "express";
import { DeviceService } from "./devices.service.js";

export class DeviceController {
  // Create
  static async create(req: Request, res: Response) {
    try {
      const org = await DeviceService.create(req.body);
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