import { Router } from "express";
import { OrganizationController } from "./organizations.controller.js";
import { authenticate } from "../../../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, OrganizationController.getAll);

export default router;