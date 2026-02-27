import type { Request, Response } from "express";
import { loginService } from "./login.service.js";
import type { LoginRequestBody } from "./login.interface.js";

export class LoginController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as LoginRequestBody;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const result = await loginService(email, password);

      return res.status(200).json({
        success: true,
        payload: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Login failed",
      });
    }
  }
}