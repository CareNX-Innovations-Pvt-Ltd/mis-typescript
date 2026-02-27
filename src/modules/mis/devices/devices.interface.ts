export interface IDeviceMis {
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  productType: string;

  organizationId: string;

  status: "Active" | "Inactive";

  warrantyEnd: Date | null;
  amcStatus: "Active" | "Inactive";

  createdOn: Date | null;
}