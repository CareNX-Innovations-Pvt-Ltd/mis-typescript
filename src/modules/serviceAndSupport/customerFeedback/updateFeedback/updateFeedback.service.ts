import { db } from "../../../../database/firestore.js";
import type { IUpdateFeedback } from "./updateFeedback.interface.js";

const COLLECTION = "customerFeedbacks";

export class UpdateFeedbackService {
  static async update(id: string, data: Partial<IUpdateFeedback>) {
    const now = new Date().toISOString();

    const docRef = db.collection(COLLECTION).doc(id);

    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      throw new Error("Feedback not found");
    }

    const payload = {
      ...data,
      modifiedAt: now,
    };

    await docRef.update(payload);

    return {
      id,
      ...snapshot.data(),
      ...payload,
    };
  }
}
