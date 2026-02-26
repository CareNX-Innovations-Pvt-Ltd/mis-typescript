import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
const router = Router();

router.get('/', authenticate, DashboardController.getDashboard);

export default router;