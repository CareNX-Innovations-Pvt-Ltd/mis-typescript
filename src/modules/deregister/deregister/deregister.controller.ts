import type { Request, Response } from "express";
import { deregisterDeviceService } from "../deregister/deregister.service.js";

export const deregisterDeviceController = async (
  req: Request,
  res: Response
) => {
  try {
    const { documentId, reason } = req.body;
    const loginUserId = req.headers["x-user-id"] as string;

    const response = await deregisterDeviceService({
      documentId,
      reason,
      loginUserId
    });

    return res.status(response.status_code).json(response);

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};