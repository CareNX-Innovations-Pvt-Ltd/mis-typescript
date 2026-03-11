export interface DeregisterDevicePayload {
  documentId: string;
  reason: string;
  loginUserId: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  payload?: T;
  message?: string;
  status_code: number;
}

export interface DeregisterDeviceResponse {
  message: string;
}