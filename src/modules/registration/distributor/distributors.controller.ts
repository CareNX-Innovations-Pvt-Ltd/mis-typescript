import type { Request, Response } from "express";
import { DistributorService } from "./distributors.service.js";

export class DistributorController {
  // Create
  static async create(req: Request, res: Response) {
    try {
      const org = await DistributorService.create(req.body);

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