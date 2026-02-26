// ---------------- TYPES ----------------

export type TicketPriority = "Low" | "Medium" | "High" | "Critical";

export type TicketStatus = "Open" |"Resolved";

export type IssueCategory =
  | "Hardware"
  | "Software"
  | "Calibration"
  | "Installation"
  | "Training"
  | "Other";

// ---------------- INTERFACE ----------------

export interface IUpdateSupportTicket {
  organizationId?: string;
  organizationName?: string;

  deviceId?: string;
  deviceName?: string;

  productType?: string;

  inWarranty?: boolean;
  underAmc?: boolean;

  issueCategory?: IssueCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  description?: string;

  supportConsultantName?: string;
  supportConsultantContact?: string;

  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;

  invoiceDate?: string;
  invoiceAmount?: number;
  invoicePdfUrl?: string;

  modifiedAt?: string;
}
