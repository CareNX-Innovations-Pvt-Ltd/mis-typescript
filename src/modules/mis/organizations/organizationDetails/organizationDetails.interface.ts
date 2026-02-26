export interface IOrganizationDetails {
  id: string;

  name: string;
  type: string;
  city: string;
  state: string;
  contactPerson: string;
  contactNumber: string;
  email?: string;
  salesChannel: string;
  registeredAt: string;

  totalDevices: number;
  totalDoctors: number;
  totalMothers: number;
  totalTests: number;

  activeDevices: number;
  underWarranty: number;
  underAmc: number;

  utilizationPercent: number;

  monthlyTrend: {
    month: string;
    count: number;
  }[];

  deviceUtilization: {
    deviceId: string;
    deviceCode: string;
    totalTests: number;
  }[];

  testDurationDistribution: {
    lessThan20: number;
    between20to40: number;
    between40to60: number;
    above60: number;
  };

  doctorActivity: {
    doctorId: string;
    name: string;
    totalTests: number;
  }[];
}