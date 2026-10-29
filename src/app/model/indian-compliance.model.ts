export interface IndianEmployee {
  empId: number;
  empCode: string;
  empName: string;
  empRole: string;
  aadhaarNumber: string;
  panNumber: string;
  pfAccountNumber: string;
  esiNumber: string;
  salaryGroup: string;
  spousePAN: string;
  empPhone: string;
  empMobilePhone: string;
  empAddress1: string;
  empAddress2: string;
  empPostCode: string;
  empTown: string;
  empState: string;
  empSex: string;
  empDateOfBirth: string;
  empMaritalStatus: string;
  empSpouseName: string;
  empNoChild: number;
  empBranchCode: string;
  empNational: string;
  empPassportNo: string;
}

export interface IndianClient {
  id: number;
  code: string;
  name: string;
  address1: string;
  address2: string;
  postCode: string;
  city: string;
  state: string;
  phone: string;
  fax: string;
  email: string;
  branch: string;
  status: string;
  superClientCode: string;
  personIncharge: string;
  agreementStart: string;
  agreementEnd: string;
  shortname: string;
  isClientHeadQuarters: boolean;
  gstin: string;
  panNumber: string;
  tanNumber: string;
  cinNumber: string;
  gstRegistrationStatus: boolean;
  pinCode: string;
  lastUpdatedDate: string;
  createdDate: string;
  lastUpdatedBy: string;
}

export interface PFConfiguration {
  id: number;
  basicSalaryLimit: number;
  employeeContributionRate: number;
  employerContributionRate: number;
  employerEPSRate: number;
  effectiveDate: string;
  isActive: boolean;
  createdDate: string;
  createdBy: string;
  financialYear: string;
  lastUpdatedDate: string;
  lastUpdatedBy: string;
}

export interface ESIConfiguration {
  id: number;
  grossSalaryLimit: number;
  employeeContributionRate: number;
  employerContributionRate: number;
  effectiveDate: string;
  isActive: boolean;
  createdDate: string;
  createdBy: string;
  lastUpdatedDate: string;
  lastUpdatedBy: string;
}

export interface ProfessionalTaxConfiguration {
  id: number;
  state: string;
  minSalary: number;
  maxSalary: number;
  taxAmount: number;
  effectiveDate: string;
  isActive: boolean;
  createdDate: string;
  createdBy: string;
  lastUpdatedDate: string;
  lastUpdatedBy: string;
}

export interface TDSSlabConfiguration {
  id: number;
  minIncome: number;
  maxIncome: number;
  taxRate: number;
  surchargeRate: number;
  educationCessRate: number;
  financialYear: string;
  isActive: boolean;
  createdDate: string;
  createdBy: string;
  lastUpdatedDate: string;
  lastUpdatedBy: string;
}

export interface GSTConfiguration {
  id: number;
  gstRate: number;
  hsnCode: string;
  description: string;
  StateCode: string;
  effectiveDate: string;
  isActive: boolean;
  createdDate: string;
  createdBy: string;
  lastUpdatedDate: string;
  lastUpdatedBy: string;
}

export interface GSTInvoice {
  invoiceId: number;
  invoiceNumber: string;
  invoiceDate: string;
  supplierGSTIN: string;
  recipientGSTIN: string;
  supplierState: string;
  recipientState: string;
  hsnCode: string;
  itemDescription: string;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGSTAmount: number;
  totalAmount: number;
  paymentMode: string;
  isReverseCharge: boolean;
  remarks: string;
}

// Missing Configuration Models for Dynamic Client Setup
export interface ServiceCategory {
  id: number;
  code: string;
  name: string;
  description: string;
  defaultRate: number;
  gstRate: number;
  tdsSection: string;
  tdsRate: number;
  isActive: boolean;
  createdDate: string;
  createdBy: string;
  lastUpdatedDate: string;
  lastUpdatedBy: string;
}

export interface ContractorTDSSlab {
  id: number;
  section: string; // 194C, 194J, 194I
  contractorType: string; // Individual, Company, Firm
  minAmount: number;
  maxAmount: number;
  tdsRate: number;
  effectiveDate: string;
  financialYear: string;
  isActive: boolean;
  createdDate: string;
  createdBy: string;
  lastUpdatedDate: string;
  lastUpdatedBy: string;
}

export interface StateMaster {
  id: number;
  code: string; // 33, 37, etc.
  name: string; // Tamil Nadu, Andhra Pradesh
  gstStateCode: string;
  isActive: boolean;
  createdDate: string;
  createdBy: string;
  lastUpdatedDate: string;
  lastUpdatedBy: string;
}

export interface BillingCycle {
  id: number;
  code: string; // Monthly, Quarterly, Yearly
  name: string;
  description: string;
  days: number;
  isActive: boolean;
  createdDate: string;
  createdBy: string;
  lastUpdatedDate: string;
  lastUpdatedBy: string;
}

export interface InvoiceFormat {
  id: number;
  code: string; // Standard, Detailed, Summary
  name: string;
  templatePath: string;
  isActive: boolean;
  createdDate: string;
  createdBy: string;
  lastUpdatedDate: string;
  lastUpdatedBy: string;
}

// TDS Master – vendor/contractor TDS rate lookup (Sec 194C, 194H, 194I, 194J, 194A, 194B)
// Distinct from TDSSlabConfiguration which covers employee payroll TDS (Sec 192).
export interface TDSMaster {
  ID: number;
  TDSName: string;
  TDSPercentage: number;
  IsActive: boolean;
}
