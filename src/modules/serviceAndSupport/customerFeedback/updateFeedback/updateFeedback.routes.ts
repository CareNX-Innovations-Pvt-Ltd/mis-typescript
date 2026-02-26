import { Router } from "express";
import { UpdateFeedbackController } from "./updateFeedback.controller.js";
import { authenticate } from "../../../../middleware/auth.middleware.js";

const router = Router();

router.put("/updateFeedback/:id", authenticate, UpdateFeedbackController.update);

export default router;
