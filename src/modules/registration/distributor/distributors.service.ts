import { db } from "../../../database/firestore.js";
import type { IDistributorRegistration } from "./distributors.interface.js";

const COLLECTION = "distributors";

export class DistributorService {
  // Create
  static async create(data: IDistributorRegistration) {
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