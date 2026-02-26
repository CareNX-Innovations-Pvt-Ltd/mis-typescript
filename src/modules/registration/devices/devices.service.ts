import { db } from "../../../database/firestore.js";
import type { IDeviceRegistration } from "./devices.interface.js";

const COLLECTION = "devices";

export class DeviceService {
  // Create
  static async create(data: IDeviceRegistration) {
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