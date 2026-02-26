import type { Request, Response } from "express";
import { UpdateTicketService } from "./updateTicket.service.js";

export class UpdateTicketController {
  static async update(req: Request, res: Response) {
    try {
      // Force id to string
      const id = req.params.id as string;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Ticket ID is required",
        });
      }

      const ticket = await UpdateTicketService.update(id, req.body);

      return res.status(200).json({
        success: true,
        message: "Ticket updated successfully",
        data: ticket,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }
}
