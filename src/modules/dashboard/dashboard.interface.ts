export interface DashboardQuery {
  from: string;
  to: string;

  product?: string;
  mode?: string;

  state?: string;
  salesChannel?: string;
  testType?: string;

  trend?: 'daily' | 'weekly' | 'monthly';
}

export interface DashboardResponse {
  counts: {
    organizations: number;
    mothers: number;
    devices: number;
    tests: number;
  };

  warranty: {
    underWarranty: number;
  };

  amc: {
    underAMC: number;
  };

  distribution: {
    productType: string;
    count: number;
  }[];

  deviceStatus: {
    isActive: string;
    count: number;
  }[];

  trends: {
    mothers: { period: string; count: number }[];
    tests: { period: string; count: number }[];
  };

  stateStats: {
    state: string;
    orgCount: number;
    deviceCount: number;
  }[];

  cityDeviceCounts: {
    city: string;
    count: number;
  }[];

  distributorCities: {
    city: string;
    state: string;
  }[];
}