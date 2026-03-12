import { Router } from 'express';
import { FeedbackController } from './feedback.controller.js';
import { authenticate } from '../../../../middleware/auth.middleware.js';

const router = Router();

router.get('/', FeedbackController.getDashboard);

export default router;