import { Router } from "express";
import { OrganizationController } from "./organizations.controller.js";
import { authenticate } from "../../../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticate, OrganizationController.create);

export default router;