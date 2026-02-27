export interface AppJwtPayload {
  uid: string;
  type: "admin" | "groupUser";
  allowedOrganizations?: {
    organizationId: string;
    organizationName: string;
  }[];
}