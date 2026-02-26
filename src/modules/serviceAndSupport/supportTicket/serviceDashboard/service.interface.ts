export interface ServiceDashboardQuery {
  from: string;
  to: string;
}

export interface ServiceDashboardResponse {

  counts: {
    openTickets: number;
    resolvedThisMonth: number;
  };

  avgResolution: {
    avgResolutionHours: number | null;
  };

  tickets: Array<{
    ticketId: string;
    deviceId: string;
    organization: string;
    issueType: string;
    priority: string;
    status: string;
    attempts: string;
    createdOn: string;
    resolutionTime: number | null;
  }>;

  warranty: {
    expiringSoon: Array<{
      deviceId: string;
      organization: string;
      warrantyEnd: string;
    }>;

    expired: Array<{
      deviceId: string;
      organization: string;
      warrantyEnd: string;
    }>;
  };

  amc: Array<{
    deviceId: string;
    organization: string;
    amcStart: string;
    amcValidity: string;
    amcEndDate: string;
    status: 'Active' | 'Expired';
    daysRemaining: number;
  }>;
}