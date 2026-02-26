export interface INewFeedback {
  feedbackId: string;
  ticketId: string;
  organizationId: string;
  organizationName: string;

  customerEmail: string;

  rating: number | null;
  comment: string | null;

  feedbackReceived: boolean;

  sentAt: Date;
  receivedAt: Date | null;

  channel: string;

  createdAt: Date;
  updatedAt: Date;
}
