export const DEFAULT_CONSTRUCTION_CATEGORIES = [
  { name: "General Conditions", defaultAmount: 0, sortOrder: 1 },
  { name: "Site Work", defaultAmount: 0, sortOrder: 2 },
  { name: "Foundation", defaultAmount: 0, sortOrder: 3 },
  { name: "Framing", defaultAmount: 0, sortOrder: 4 },
  { name: "Roofing", defaultAmount: 0, sortOrder: 5 },
  { name: "Exterior Finishes", defaultAmount: 0, sortOrder: 6 },
  { name: "Windows & Doors", defaultAmount: 0, sortOrder: 7 },
  { name: "Insulation", defaultAmount: 0, sortOrder: 8 },
  { name: "Drywall", defaultAmount: 0, sortOrder: 9 },
  { name: "Interior Finishes", defaultAmount: 0, sortOrder: 10 },
  { name: "Flooring", defaultAmount: 0, sortOrder: 11 },
  { name: "Plumbing", defaultAmount: 0, sortOrder: 12 },
  { name: "Electrical", defaultAmount: 0, sortOrder: 13 },
  { name: "HVAC", defaultAmount: 0, sortOrder: 14 },
  { name: "Painting", defaultAmount: 0, sortOrder: 15 },
  { name: "Cabinets & Countertops", defaultAmount: 0, sortOrder: 16 },
  { name: "Appliances", defaultAmount: 0, sortOrder: 17 },
  { name: "Permits & Fees", defaultAmount: 0, sortOrder: 18 },
  { name: "Contingency", defaultAmount: 0, sortOrder: 19 },
];

export const PROJECT_STATUSES = [
  { value: "active", label: "Active", color: "bg-success-100 text-success-700" },
  { value: "completed", label: "Completed", color: "bg-brand-100 text-brand-700" },
  { value: "archived", label: "Archived", color: "bg-charcoal-100 text-charcoal-600" },
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];

// Invoice status configuration
export const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bg: "bg-warning-100",
    text: "text-warning-700",
    border: "border-warning-200",
  },
  reviewed: {
    label: "Reviewed",
    bg: "bg-brand-100",
    text: "text-brand-700",
    border: "border-brand-200",
  },
  approved: {
    label: "Approved",
    bg: "bg-success-100",
    text: "text-success-700",
    border: "border-success-200",
  },
  paid: {
    label: "Paid",
    bg: "bg-success-200",
    text: "text-success-700",
    border: "border-success-300",
  },
} as const;

export type InvoiceStatus = keyof typeof STATUS_CONFIG;
export const INVOICE_STATUSES = Object.keys(STATUS_CONFIG) as InvoiceStatus[];
