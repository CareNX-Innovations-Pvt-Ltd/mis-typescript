export interface IOrganizationMis {
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

  createdOn?: string;
  modifiedAt?: string;
}