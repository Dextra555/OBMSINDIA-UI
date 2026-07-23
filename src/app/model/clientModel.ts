export class ClientModel {
    Id: number;
    Code: string;
    Name: string;
    Address1: string;
    Address2: string;
    PostCode: string; 
    City: string;
    State: string; // Keep for backend compatibility
    IndianState: string | null = null; // Add for frontend
    Phone: string; 
    Fax: string; 
    Email: string;
    PersonIncharge: string;
    Branch: string;
    CreatedDate: Date | null = null;
    LastUpdatedBy: string;
    Shortname: string;
    Status: string;
    SuperClientCode: string;
    IsClientHeadQuarters: boolean;   
    LastUpdatedDate: Date | null = null;
    AgreementStart: Date | null = null;
    AgreementEnd: Date | null = null;
    
    // Indian Compliance Fields
    GSTIN: string | null = null;
    PANNumber: string | null = null;
    TANNumber: string | null = null;
    CINNumber: string | null = null;
    GSTRegistrationStatus: string | null = null;
    PINCode: string | null = null; // Keep for backend compatibility
    
    // Shipping Address Fields
    ShippingAddress1: string | null = null;
    ShippingAddress2: string | null = null;
    ShippingCity: string | null = null;
    ShippingState: string | null = null;
    ShippingPINCode: string | null = null;
    
    // Billing Address Fields
    BillingAddress1: string | null = null;
    BillingAddress2: string | null = null;
    BillingCity: string | null = null;
    BillingState: string | null = null;
    BillingPINCode: string | null = null;
    
    // Simplified Compliance Field
    ClientComplianceStatus: string | null = null;
    
    constructor(data: Partial<ClientModel> = {}) {
        this.Id = data.Id || 0;
        this.Code = data.Code || '';
        this.Name = data.Name || '';
        this.Address1 = data.Address1 || '';
        this.Address2 = data.Address2 || '';
        this.PostCode = data.PostCode || '';
        this.City = data.City || '';
        this.State = data.State || '';
        this.IndianState = data.IndianState || null;
        this.Phone = data.Phone || '';
        this.Fax = data.Fax || '';
        this.Email = data.Email || '';
        this.PersonIncharge = data.PersonIncharge || '';
        this.Branch = data.Branch || '';
        this.CreatedDate = data.CreatedDate || null;
        this.LastUpdatedBy = data.LastUpdatedBy || '';
        this.Shortname = data.Shortname || '';
        this.Status = data.Status || '';
        this.SuperClientCode = data.SuperClientCode || '';
        this.IsClientHeadQuarters = data.IsClientHeadQuarters || false;
        this.LastUpdatedDate = data.LastUpdatedDate || null;
        this.AgreementStart = data.AgreementStart || null;
        this.AgreementEnd = data.AgreementEnd || null;
        
        // Indian Compliance Fields
        this.GSTIN = data.GSTIN || null;
        this.PANNumber = data.PANNumber || null;
        this.TANNumber = data.TANNumber || null;
        this.CINNumber = data.CINNumber || null;
        this.GSTRegistrationStatus = data.GSTRegistrationStatus || 'unregistered';
        this.PINCode = data.PINCode || null;
        
        // Shipping Address Fields
        this.ShippingAddress1 = data.ShippingAddress1 || null;
        this.ShippingAddress2 = data.ShippingAddress2 || null;
        this.ShippingCity = data.ShippingCity || null;
        this.ShippingState = data.ShippingState || null;
        this.ShippingPINCode = data.ShippingPINCode || null;
        
        // Billing Address Fields
        this.BillingAddress1 = data.BillingAddress1 || null;
        this.BillingAddress2 = data.BillingAddress2 || null;
        this.BillingCity = data.BillingCity || null;
        this.BillingState = data.BillingState || null;
        this.BillingPINCode = data.BillingPINCode || null;
        
        // Simplified Compliance Field
        this.ClientComplianceStatus = data.ClientComplianceStatus || 'non_compliance_client';
    }
}
