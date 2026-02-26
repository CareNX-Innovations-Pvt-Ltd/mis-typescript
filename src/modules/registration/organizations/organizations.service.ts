import { db } from "../../../database/firestore.js";
import type { IOrganizationRegistration } from "./organizations.interface.js";

const COLLECTION = "organizations";

export class OrganizationService {
  // Create
  static async create(data: IOrganizationRegistration) {
    const now = new Date().toISOString();

    const payload = {
      ...data,
      createdOn: now,
      modifiedAt: now,
    };

    const docRef = await db.collection(COLLECTION).add(payload);

    return {
      id: docRef.id,
      ...payload,
    };
  }
}