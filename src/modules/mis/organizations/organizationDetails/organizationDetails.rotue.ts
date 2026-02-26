import { Router } from "express";
import { OrganizationDetailsController } from "./organizationDetails.controller.js";

const router = Router();

/* ================= MAIN ================= */

router.get("/:orgId", OrganizationDetailsController.getOrganizationDetails);
router.get("/:orgId/analytics", OrganizationDetailsController.getAnalytics);

/* ================= TABS ================= */

router.get("/:orgId/devices", OrganizationDetailsController.getDevices);
router.get("/:orgId/doctors", OrganizationDetailsController.getDoctors);
router.get("/:orgId/mothers", OrganizationDetailsController.getMothers);
router.get("/:orgId/tests", OrganizationDetailsController.getTests);

export default router;