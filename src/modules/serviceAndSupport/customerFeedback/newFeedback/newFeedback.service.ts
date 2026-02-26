import { db } from "../../../../database/firestore.js";
import type { INewFeedback } from "./newFeedback.interface.js";

const COLLECTION = "customerFeedbacks";

export class NewFeedbackService {
  // Create
  static async create(data: INewFeedback) {
    const now = new Date().toISOString();

    const payload = {
      ...data,
      createdOn: now,
      modifiedAt: now,
    };

    // console.log("FIRESTORE WRITE CALLED", payload);


    const docRef = await db.collection(COLLECTION).add(payload);

    return {
      id: docRef.id,
      ...payload,
    };
  }
}