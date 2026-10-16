export class IndianEmployeeModel {
    EMP_ID: number;
    EMP_ROLE: string;
    EMP_CODE: string;
    EMP_NAME: string;
    EMP_ADDRESS1: string;
    EMP_ADDRESS2: string;
    EMP_POST_CODE: string; // Changed to string for PIN code
    EMP_TOWN: string;
    EMP_STATE: string; // Malaysian state
    EMP_NATIONAL: string;
    EMP_PHONE: string; // Changed to string for +91 prefix
    EMP_MOBILEPHONE: string; // Changed to string for +91 prefix
    EMP_HGH_EDU: string;
    EM_WORK_EXP: string;
    EMP_DATE_OF_BIRTH: Date | null = null;
    EMP_IC_OLD: string; // Malaysian IC (keep for migration)
    EMP_IC_NEW: string; // Malaysian IC (keep for migration)
    EMP_IC_COLOR: string; // Malaysian IC color (keep for migration)
    EMP_PASSPORT_NO: string;
    EMP_SEX: string;
    EMP_RACE: string;
    EMP_MARTIAL_STATUS: string;
    EMP_SPOUSE_NAME: string;
    EMP_SP_IC: string; // Spouse Malaysian IC
    EMP_NO_CHILD: number;
    EMP_SP_WORK: boolean;
    EMP_PER_NAME_CONTACT: string;
    EMP_CONTACT_ADDRESS1: string;
    EMP_CONTACT_ADDRESS2: string;
    EMP_CONTACT_POST_CODE: string;
    EMP_CONTACT_TOWN: string;
    EMP_CONTACT_STATE: string;
    EMP_CONTACT_TELEPHONE: string;
    EMP_BRANCH_CODE: string;
    OldBranch: string;
    TransferDate: Date | null = null;
    HasTransfered: boolean;
    LASTUPDATE: Date | null = null;
    LastUpdatedBy: string;
    EMP_CITIZEN: number;
    EMP_CHECKLIST: number;
    EMP_CLIENT: string;
    NewSalaryStructure: string;
    SalaryStructure1000_3h: string;
    KDNVetting: boolean;

    // Indian Compliance Fields
    AadhaarNumber: string | null = null;
    PANNumber: string | null = null;
    PFAccountNumber: string | null = null;
    ESINumber: string | null = null;
    SalaryGroup: string = 'None'; // 'None', '8 Hours', '10 Hours'
    SpousePAN: string | null = null;
    SpouseAadhaar: string | null = null;
    BankAccountNumber: string | null = null;
    BankIFSC: string | null = null;
    BankName: string | null = null;
    UPIId: string | null = null;

    /// Whether TDS deduction is applicable. false = No (default), true = Yes.
    TDSApplicable: boolean = false;

    constructor(data: Partial<IndianEmployeeModel> = {}) {
        this.EMP_ID = data.EMP_ID || 0;
        this.EMP_ROLE = data.EMP_ROLE || '';
        this.EMP_CODE = data.EMP_CODE || '';
        this.EMP_NAME = data.EMP_NAME || '';
        this.EMP_ADDRESS1 = data.EMP_ADDRESS1 || '';
        this.EMP_ADDRESS2 = data.EMP_ADDRESS2 || '';
        this.EMP_POST_CODE = data.EMP_POST_CODE || '';
        this.EMP_TOWN = data.EMP_TOWN || '';
        this.EMP_STATE = data.EMP_STATE || '';
        this.EMP_NATIONAL = data.EMP_NATIONAL || '';
        this.EMP_PHONE = data.EMP_PHONE || '';
        this.EMP_MOBILEPHONE = data.EMP_MOBILEPHONE || '';
        this.EMP_HGH_EDU = data.EMP_HGH_EDU || '';
        this.EM_WORK_EXP = data.EM_WORK_EXP || '';
        this.EMP_DATE_OF_BIRTH = data.EMP_DATE_OF_BIRTH || null;
        this.EMP_IC_OLD = data.EMP_IC_OLD || '';
        this.EMP_IC_NEW = data.EMP_IC_NEW || '';
        this.EMP_IC_COLOR = data.EMP_IC_COLOR || '';
        this.EMP_PASSPORT_NO = data.EMP_PASSPORT_NO || '';
        this.EMP_SEX = data.EMP_SEX || '';
        this.EMP_RACE = data.EMP_RACE || '';
        this.EMP_MARTIAL_STATUS = data.EMP_MARTIAL_STATUS || '';
        this.EMP_SPOUSE_NAME = data.EMP_SPOUSE_NAME || '';
        this.EMP_SP_IC = data.EMP_SP_IC || '';
        this.EMP_NO_CHILD = data.EMP_NO_CHILD || 0;
        this.EMP_SP_WORK = data.EMP_SP_WORK || false;
        this.EMP_PER_NAME_CONTACT = data.EMP_PER_NAME_CONTACT || '';
        this.EMP_CONTACT_ADDRESS1 = data.EMP_CONTACT_ADDRESS1 || '';
        this.EMP_CONTACT_ADDRESS2 = data.EMP_CONTACT_ADDRESS2 || '';
        this.EMP_CONTACT_POST_CODE = data.EMP_CONTACT_POST_CODE || '';
        this.EMP_CONTACT_TOWN = data.EMP_CONTACT_TOWN || '';
        this.EMP_CONTACT_STATE = data.EMP_CONTACT_STATE || '';
        this.EMP_CONTACT_TELEPHONE = data.EMP_CONTACT_TELEPHONE || '';
        this.EMP_BRANCH_CODE = data.EMP_BRANCH_CODE || '';
        this.OldBranch = data.OldBranch || '';
        this.TransferDate = data.TransferDate || null;
        this.HasTransfered = data.HasTransfered || false;
        this.LASTUPDATE = data.LASTUPDATE || null;
        this.LastUpdatedBy = data.LastUpdatedBy || '';
        this.EMP_CITIZEN = data.EMP_CITIZEN || 0;
        this.EMP_CHECKLIST = data.EMP_CHECKLIST || 0;
        this.EMP_CLIENT = data.EMP_CLIENT || '';
        this.NewSalaryStructure = data.NewSalaryStructure || '';
        this.SalaryStructure1000_3h = data.SalaryStructure1000_3h || '';
        this.KDNVetting = data.KDNVetting || false;

        // Indian Compliance Fields
        this.AadhaarNumber = data.AadhaarNumber || null;
        this.PANNumber = data.PANNumber || null;
        this.PFAccountNumber = data.PFAccountNumber || null;
        this.ESINumber = data.ESINumber || null;
        this.SalaryGroup = data.SalaryGroup || 'None';
        this.SpousePAN = data.SpousePAN || null;
        this.SpouseAadhaar = data.SpouseAadhaar || null;
        this.BankAccountNumber = data.BankAccountNumber || null;
        this.BankIFSC = data.BankIFSC || null;
        this.BankName = data.BankName || null;
        this.UPIId = data.UPIId || null;
        this.TDSApplicable = data.TDSApplicable || false;
    }
}

// Salary Groups
export const SALARY_GROUPS = [
    { value: 'None', label: 'None' },
    { value: '8 Hours', label: '8 Hours' },
    { value: '9 Hours', label: '9 Hours' },
    { value: '10 Hours', label: '10 Hours' },
    { value: '12 Hours', label: '12 Hours' }
];

// Indian Religion Categories
export const INDIAN_RELIGIONS = [
    'Hindu',
    'Muslim',
    'Christian',
    'Sikh',
    'Buddhist',
    'Jain',
    'Other'
];

// Indian Banks
export const INDIAN_BANKS = [
    { name: 'State Bank of India', code: 'SBI', ifsc: 'SBIN0000000' },
    { name: 'HDFC Bank', code: 'HDFC', ifsc: 'HDFC0000000' },
    { name: 'ICICI Bank', code: 'ICICI', ifsc: 'ICICI0000000' },
    { name: 'Axis Bank', code: 'AXIS', ifsc: 'AXIS0000000' },
    { name: 'Kotak Mahindra Bank', code: 'KOTAK', ifsc: 'KKBK0000000' },
    { name: 'Punjab National Bank', code: 'PNB', ifsc: 'PUNB0000000' },
    { name: 'Bank of Baroda', code: 'BOB', ifsc: 'BARB0VISHWA' },
    { name: 'Canara Bank', code: 'CANARA', ifsc: 'CNRB0000000' }
];

// Validation Patterns
export const AADHAAR_PATTERN = /^[2-9]{12}$/;
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const PHONE_PATTERN = /^\+91[6-9]\d{9}$/;
export const MOBILE_PATTERN = /^\+91[6-9]\d{9}$/;
export const BANK_ACCOUNT_PATTERN = /^\d{10,18}$/;
export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{7}$/;

// Indian States List (matching Professional Tax Configuration)
export const INDIAN_STATES = [
    'Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Puducherry',
    'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];
