import { Router } from "express";
import { DeviceController } from "./devices.controller.js";

const router = Router();

router.get("/", DeviceController.getAll);

export default router;