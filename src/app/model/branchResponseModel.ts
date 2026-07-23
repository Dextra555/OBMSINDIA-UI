export class BranchResponseModel{
    id!:number;
    code!:string;
    name!:string;
    address1!:string;
    address2!:string;
    postCode!:string;  // Changed to string for PIN code support
    pinCode?:string; // New Indian PIN code field
    city!:string;
    state!:string;
    phone!:string;  // Changed to string for phone format support
    fax?:string;
    bankName!:string;
    bankBranch!:string;
    bankAccount!:string;
    ifscCode?:string; // New IFSC code field
    gstin?:string; // New GSTIN field
    personIncharge!:string;
    description?:string;
    email?:string;
    shortName!:string;
    isHeadQuarters?:boolean;
    ubsCode!:string;
    lastUpdate?:Date;
    lastUpdatedBy?:string;
    parentBranch?:string;
}
