import { Router } from 'express';
import { ServiceSupportController } from './service.controller.js';
import { authenticate } from '../../../../middleware/auth.middleware.js';

const router = Router();

/**
 * GET /api/service-dashboard?from=2024-01-01&to=2024-12-31
 */
router.get('/dashboard', authenticate, ServiceSupportController.getServiceDashboard);

export default router;