import type { Request, Response } from "express";
import { getRevenueService } from "./revenue.service.js";

export const getRevenueController = async (
  req: Request,
  res: Response
) => {
  try {

    const data = await getRevenueService();

    return res.status(200).json({
      success: true,
      payload: data
    });

  } catch (error: any) {

    console.error("Revenue API Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch revenue data"
    });
  }
};