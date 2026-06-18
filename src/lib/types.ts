// types/school.ts (or lib/types.ts)

export interface School {
  // Basic Info
  id: number;
  school_id: string;
  name: string;
  ownership: string;
  address: string;
  state: string;
  lga: string;
  country: string;
  email: string;
  phone: string;
  website: string | null;

  // Tax & License
  tin: string;
  last_tax_filing: string | null;
  license_number: string;
  license_status: string;
  license_expiry_date: string | null;
  last_license_renewal: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Additional Info
  year_established: number | null;
  cac_number: string | null;
  proprietor_name: string | null;
  proprietor_nin: string | null;
  property_type: string | null;
  chairman_name: string | null;

  // Academic Info
  faculties: string | null;
  mode_of_operation: string[];
  student_population: number | null;
  intl_students: number | null;
  population_by_level: {
    "100": string;
    "200": string;
    "300": string;
    "400": string;
    "500": string;
    PG: string;
  };
  avg_fee: string | null;
  total_revenue: string | null;
  avg_fee_by_level: {
    "100": string;
    "200": string;
    "300": string;
    "400": string;
    "500": string;
    PG: string;
  };
  academic_session: string | null;
  weeks_per_semester: number | null;
  session_start: string | null;
  session_end: string | null;
  programmes: string[];
  courses: string[];

  // Payment Info
  method_of_collection: string[];
  payment_gateway: string | null;
  current_gateway: string | null;
  partner_banks: string | null;
  payment_reports: string | null;

  // License & Compliance
  licence_status: string | null;
  prev_licence: string | null;
  prev_amount: string | null;
  prev_licence_date: string | null;
  outstanding_penalties: string | null;
  penalty: string | null;

  // Admin Info
  enumerator_name: string | null;
  enumerator_comments: string | null;
  form_status: "pending" | "complete" | "rejected";
  approval_status: "pending" | "approved" | "rejected";
  registered_for_tax: boolean | null;
  category: string | null;

  // Portal Info
  school_portal: string | null;
  school_portal_vendor: string | null;
  ready_for_api: boolean | null;

  // Contact Person
  contact_person: string | null;
  contact_person_designation: string | null;
  contact_person_phone: string | null;
}

// For the profile view component (mapped fields)
export interface SchoolProfileData {
  proprietorName: string;
  chairmanName: string;
  ownershipType: string;
  tin: string;
  lastTaxFiling: string | null;
  modeOfOperation: string[];
  avgFee: string;
  totalRevenue: string;
  academicSession: string;
  weeksPerSemester: string;
  sessionStart: string | null;
  sessionEnd: string | null;
  programmes: string[];
  licenceStatus: string;
  prevAmount: string;
  prevDate: string | null;
  profileCompleted: boolean;
  lastUpdated: string;
}

// for transactions

export interface TransactionType {
  id: number;
  school_id: string;
  lga: string | null;
  reference: string;
  amount: string;
  status: string;
  payment_item: string;
  invoice_number: string;
  updated_at: string;
  created_at: string;
}
