import express from "express";
import { deregisterDeviceController } from "../deregister/deregister.controller.js";

const router = express.Router();

router.patch("/deregister", deregisterDeviceController);

export default router;