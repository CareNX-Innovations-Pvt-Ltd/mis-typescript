export interface IDeviceRegistration {
  id?: string;

  // Relations
  organizationId: string;      // Selected organization ID
  organizationName?: string;  // Optional (for display)

  // Device Info
  deviceName: string;          // e.g. eFM000123
  kitId: string;               // e.g. KIT-2024-001
  productType: string;         // main / lite / pro etc

  // Warranty & Invoice
  warrantyDuration: number;    // in months (12, 24, 36)
  warrantyEndDate: string;     // ISO date

  invoiceDate: string;         // ISO date
  invoiceValue: number;        // Amount in INR

  // Status
  status: "Active" | "Inactive";

  // System Fields
  createdOn?: string;
  modifiedAt?: string;
}