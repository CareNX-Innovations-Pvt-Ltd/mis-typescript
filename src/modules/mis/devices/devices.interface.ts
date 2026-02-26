export interface IDeviceMis {
  id?: string;

  name: string;
  type: string;

  city: string;
  state: string;

  contactPerson: string;
  contactNumber: string;

  devices: number;
  totalTests: number;
  utilization: number;

  amcStatus: "Active" | "Due" | "Expired";

  salesChannel: "Direct" | "Distributor";

  registeredAt: string;

  createdAt?: string;
  updatedAt?: string;
}