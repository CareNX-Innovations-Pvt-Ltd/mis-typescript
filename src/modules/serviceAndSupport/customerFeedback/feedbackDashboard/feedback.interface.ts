export interface FeedbackQuery {
  from: string;
  to: string;
}

export interface FeedbackResponse {
  summary: {
    positive: number;
    needsImprovement: number;
    totalResponses: number;
    avgRating: number;
  };

  ratingDistribution: {
    star: number;
    count: number;
  }[];

  feedbackSummary: {
    csat: number;
    nps: number;
    responseRate: number;
  };

  allResponses: any[];
  positiveResponses: any[];
  negativeResponses: any[];
  pendingResponses: any[];
}