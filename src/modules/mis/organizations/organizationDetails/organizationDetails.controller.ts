import type { Request, Response } from "express";
import { OrganizationDetailsService } from "./organizationDetails.service.js";

export class OrganizationDetailsController {

  static getOrgId(req: Request) {
    return Array.isArray(req.params.orgId)
      ? req.params.orgId[0]
      : req.params.orgId;
  }

  static async getOrganizationDetails(req: Request, res: Response) {
    try {
const orgId = OrganizationDetailsController.getOrgId(req);
      const data = await OrganizationDetailsService.getOrganizationDetails(orgId, req.user);
      res.json({ success: true, payload: data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getAnalytics(req: Request, res: Response) {
    try {
      const orgId = OrganizationDetailsController.getOrgId(req);
      const data = await OrganizationDetailsService.getAnalytics(orgId, req.user);
      res.json({ success: true, payload: data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getDevices(req: Request, res: Response) {
    try {
      const orgId = OrganizationDetailsController.getOrgId(req);
      const data = await OrganizationDetailsService.getDevices(orgId, req.user);
      res.json({ success: true, payload: data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getDoctors(req: Request, res: Response) {
    try {
      const orgId = OrganizationDetailsController.getOrgId(req);
      const data = await OrganizationDetailsService.getDoctors(orgId, req.user);
      res.json({ success: true, payload: data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

 static async getMothers(req: Request, res: Response) {
  try {
    const orgId = OrganizationDetailsController.getOrgId(req);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    const data = await OrganizationDetailsService.getMothers(
      orgId,
      req.user,
      page,
      limit
    );

    res.json({ success: true, payload: data });

  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

  static async getTests(req: Request, res: Response) {
  try {
    const orgId = OrganizationDetailsController.getOrgId(req);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;

    const data = await OrganizationDetailsService.getTests(
      orgId,
      req.user,
      page,
      limit
    );

    res.json({ success: true, payload: data });

  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
}