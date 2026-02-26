export interface AnalyticsQuery {
  from: string;
  to: string;

  state?: string;       // All States or specific state
  channel?: string;     // All Channels | Government | Distributor | Direct
  testType?: string;    // All Tests | NST | CTG
  product?: string;     // All Products | Plus | Main | Mini
}

export interface AnalyticsResponse {

  summary: {
    avgTestsPerDevice: number;
    avgTestDuration: number;
    avgDailyTests: number;
    needAttention: number;
  };

  monthlyGrowth: {
    month: string;
    totalTests: number;
  }[];

  organizationAnalysis: {
    top10: { organizationName: string; totalTests: number }[];
    low10: { organizationName: string; totalTests: number }[];
  };

  deviceAnalysis: {
    top10Devices: { deviceId: string; totalTests: number }[];
    deviceAgeSegregation: {
      label: string;
      count: number;
      percentage: number;
    }[];
  };

  appAnalysis: {
    usage: {
      label: string;
      percentage: number;
    }[];
    versions: {
      app: string;
      latestVersion: string;
      users: number;
    }[];
  };

  motherAnalysis: {
    zeroTests: number;
    oneTest: number;
    twoTests: number;
    threePlusTests: number;
  };

  testDurationDistribution: {
    label: string;
    count: number;
  }[];
}