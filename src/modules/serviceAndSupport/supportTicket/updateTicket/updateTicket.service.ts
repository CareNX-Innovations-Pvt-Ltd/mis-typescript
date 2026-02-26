import { db } from "../../../../database/firestore.js";
import type { IUpdateSupportTicket } from "./updateTicket.interface.js";

const COLLECTION = "tickets";

export class UpdateTicketService {
  static async update(id: string, data: Partial<IUpdateSupportTicket>) {
    const now = new Date().toISOString();

    const docRef = db.collection(COLLECTION).doc(id);

    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      throw new Error("Ticket not found");
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
