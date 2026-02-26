export type TicketPriority = "Low" | "Medium" | "High" | "Critical";
export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type IssueCategory =
  | "Hardware"
  | "Software"
  | "Calibration"
  | "Installation"
  | "Training"
  | "Other";

export interface INewSupportTicket {
  id?: string;               // Firestore / DB id
  ticketId?: string;         // Example: TICK-1 (generated)

  // Organization & Device
  organizationId: string;
  organizationName: string;

  deviceId: string;
  deviceName: string;

  productType?: string;      // Plus / Pro / Lite etc.

  inWarranty: boolean;
  underAmc: boolean;

  // Issue Details
  issueCategory: IssueCategory;
  priority: TicketPriority;
  status?: TicketStatus;     // Only used in Edit (default: "Open")
  description: string;

  // Support Consultant Assignment
  supportConsultantName?: string;
  supportConsultantContact?: string;

  // Organization Contact Details
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;

  // Invoice Details
  invoiceDate?: string;      // ISO string
  invoiceAmount?: number;
  invoicePdfUrl?: string;    // File storage URL

  // Timestamps
  createdOn?: string;
  modifiedAt?: string;
}
