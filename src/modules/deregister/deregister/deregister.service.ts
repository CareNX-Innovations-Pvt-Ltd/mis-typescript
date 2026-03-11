import { db } from "../../../database/firestore.js";
import type {
  DeregisterDevicePayload,
  ServiceResponse,
  DeregisterDeviceResponse
} from "./deregister.interface.js";

export const deregisterDeviceService = async (
  payload: DeregisterDevicePayload
): Promise<ServiceResponse<DeregisterDeviceResponse>> => {
  try {
    const { documentId, reason, loginUserId } = payload;

    const deviceRef = db.collection("users").doc(documentId);
    const snapshot = await deviceRef.get();

    if (!snapshot.exists) {
      return {
        success: false,
        status_code: 404,
        message: "Device not found"
      };
    }

    const data: any = snapshot.data();

    if (!data.isActive) {
      return {
        success: false,
        status_code: 400,
        message: "Device already inactive"
      };
    }

    const updatedEmail = data.email
      ? data.email.split("@")[0] + "_old@" + data.email.split("@")[1]
      : "";

    const updatedUid = data.uid ? `${data.uid}_old` : "";

    await deviceRef.update({
      email: updatedEmail,
      uid: updatedUid,
      isActive: false,
      deregisterReason: reason,
      deregisteredAt: new Date(),
      modifiedBy: loginUserId,
      autoModifiedTimeStamp: new Date()
    });

    return {
      success: true,
      status_code: 200,
      payload: {
        message: "Device deregistered successfully"
      }
    };

  } catch (error: any) {
    return {
      success: false,
      status_code: 500,
      message: error.message
    };
  }
};