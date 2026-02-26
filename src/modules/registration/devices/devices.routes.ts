import { Router } from "express";
import { DeviceController } from "./devices.controller.js";
import { authenticate } from "../../../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticate, DeviceController.create);

export default router;