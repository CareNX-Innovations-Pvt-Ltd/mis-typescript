import { db } from "../../../../database/firestore.js";
import type { INewSupportTicket } from "./newTicket.interface.js";

const COLLECTION = "tickets";

export class NewTicketService {
  // Create
  static async create(data: INewSupportTicket) {
    const now = new Date().toISOString();

    const payload = {
      ...data,
      createdOn: now,
      modifiedAt: now,
    };

    console.log("FIRESTORE WRITE CALLED", payload);


    const docRef = await db.collection(COLLECTION).add(payload);

    return {
      id: docRef.id,
      ...payload,
    };
  }
}