import { db } from "../../../database/firestore.js";
import type { IDeviceMis } from "./devices.interface.js";

const COLLECTION = "devices";

export class DeviceService {
  // Get All (search is OPTIONAL now)
  static async getAll(search?: string) {
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy("createdOn", "desc")
      .get();
// console.log("snapshot:", snapshot);

    let data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter only if search exists
    if (search) {
      data = data.filter((org: any) =>
        org.name
          ?.toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    return data;
  }

}