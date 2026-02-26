import type { Request, Response } from "express";
import { OrganizationService } from "./organizations.service.js";

export class OrganizationController {

  // Get All
  static async getAll(req: Request, res: Response) {
    try {
      // Safe query handling
      const searchParam = req.query.search;

      let search: string | undefined;

      if (typeof searchParam === "string") {
        search = searchParam;
      }

      const data = await OrganizationService.getAll(search);
    //   console.log(data);
      

      res.json({
        success: true,
        data,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
}