import { Router } from "express";
import { NewFeedbackController } from "./newFeedback.controller.js";
import { authenticate } from "../../../../middleware/auth.middleware.js";

const router = Router();

router.post("/newFeedback", authenticate, NewFeedbackController.create);
export default router;