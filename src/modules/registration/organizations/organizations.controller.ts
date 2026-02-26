import type { Request, Response } from "express";
import { OrganizationService } from "./organizations.service.js";

export class OrganizationController {
  // Create
  static async create(req: Request, res: Response) {
    try {
      const org = await OrganizationService.create(req.body);

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