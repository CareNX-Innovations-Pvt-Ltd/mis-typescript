export interface RevenueBreakdown {
  name: string;
  amount: number;
}

export interface RevenueChannel {
  name: string;
  amount: number;
}

export interface RevenueSummary {
  totalRevenue: number;
  deviceSales: number;
  amcRevenue: number;
  serviceRevenue: number;
}

export interface RevenueResponse {
  summary: RevenueSummary;
  breakdown: RevenueBreakdown[];
  byChannel: RevenueChannel[];
}

export interface ServiceResponse<T> {
  success: boolean;
  payload?: T;
  message?: string;
}