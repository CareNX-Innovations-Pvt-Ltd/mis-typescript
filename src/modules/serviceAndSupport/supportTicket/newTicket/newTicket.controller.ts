import type { Request, Response } from "express";
import { NewTicketService } from "./newTicket.service.js";

export class NewTicketController {
  // Create
  static async create(req: Request, res: Response) {
    try {
      const org = await NewTicketService.create(req.body);

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