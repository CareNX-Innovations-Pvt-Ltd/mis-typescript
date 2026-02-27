import { Router } from "express";
import { LoginController } from "./login.controller.js";

const router = Router();

router.post("/login", LoginController.login);

export default router;