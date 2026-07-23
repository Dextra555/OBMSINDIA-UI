import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { ActivatedRoute, Router } from '@angular/router';
import { BranchModel } from 'src/app/model/branchModel';
import { ClientModel } from 'src/app/model/clientModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';
import { IndianComplianceService } from 'src/app/service/indian-compliance.service';
import { INDIAN_STATES, GSTIN_PATTERN, PAN_PATTERN, PIN_CODE_PATTERN } from 'src/app/model/indian-client.model';
import { GSTConfiguration } from 'src/app/model/indian-compliance.model';

@Component({
  selector: 'app-new-client-master',
  templateUrl: './new-client-master.component.html',
  styleUrls: ['./new-client-master.component.css']
})
export class NewClientMasterComponent implements OnInit {
  clientCodeStatus: string = 'new';
  //clientModel!: ClientModel;
  clientModel: ClientModel = new ClientModel();
  clientModelDropdown!: ClientModel[];
  clientForm: FormGroup;
  disableSelect: boolean = false;
  branchModel!: BranchModel[];
  showLoadingSpinner: boolean = false;
  branchCode: string = 'null';
  clientCode: string = 'null';
  currentUser: string = '';
  userAccessModel!: UserAccessModel;
  indianStates: string[] = INDIAN_STATES;

  // Dynamic Configuration Data
  gstConfigurations!: GSTConfiguration[];
  indianStateList: any[] = [];
  billingStateCode: string = '';
  shippingStateCode: string = '';
  gstCalculationResult: any = null;

  // Address Copy Options
  copyAddressToShipping: boolean = false;
  copyAddressToBilling: boolean = false;

  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }
  private formatDateWithTime(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    let hours = '' + d.getHours();
    let minutes = '' + d.getMinutes();
    let seconds = '' + d.getSeconds();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hours.length < 2) hours = '0' + hours;
    if (minutes.length < 2) minutes = '0' + minutes;
    if (seconds.length < 2) seconds = '0' + seconds;
    return [year, month, day].join('-') + ' ' + [hours, minutes, seconds].join(':');
  }
  statesList: any[] = [
    { id: 1, name: 'Johar' },
    { id: 2, name: 'Kedah' },
    { id: 3, name: 'Kuala Lumpur' },
    { id: 4, name: 'Kelantan' },
    { id: 5, name: 'Labuan' },
    { id: 6, name: 'Melaka' },
    { id: 7, name: 'Negeri Sembilan' },
    { id: 8, name: 'Pahang' },
    { id: 9, name: 'Perak' },
    { id: 10, name: 'Perlis' },
    { id: 11, name: 'Pulau Pinang' },
    { id: 12, name: 'PutraJaya' },
    { id: 13, name: 'Sabah' },
    { id: 14, name: 'Sarawak' },
    { id: 15, name: 'Selangor' },
    { id: 16, name: 'Terengganu' },
    { id: 17, name: 'Wilayah Persekutuan' },

  ]


  constructor(private fb: FormBuilder, private _masterService: MastermoduleService,
    private _router: Router, private _activatedRoute: ActivatedRoute, private _dataService: DatasharingService,
    private _indianComplianceService: IndianComplianceService) {
    this.clientForm = this.fb.group({
      Id: this.fb.control(0),
      Code: this.fb.control('', [Validators.required]),
      Name: this.fb.control('', [Validators.required]),
      Address1: this.fb.control('', [Validators.required]),
      Address2: this.fb.control(''),
      PostCode: this.fb.control('', [Validators.required, Validators.pattern(PIN_CODE_PATTERN)]),
      City: this.fb.control('', [Validators.required]),
      IndianState: this.fb.control('', [Validators.required]),
      Branch: this.fb.control('', [Validators.required]),
      Status: this.fb.control('Active'),
      PersonIncharge: this.fb.control('', [Validators.required]),
      ShortName: this.fb.control(''),
      Phone: this.fb.control('', [Validators.required]),
      Fax: this.fb.control(''),
      UserEmail: this.fb.control('', [Validators.email]),
      IsClientHeadQuarters: this.fb.control(false),
      AgreementStart: this.fb.control(''),
      AgreementEnd: this.fb.control(''),
      CreatedDate: this.fb.control(this.formatDate(new Date)),
      LastUpdatedDate: this.fb.control(null),
      LastUpdatedBy: this.fb.control('Admin'),
      SuperClientCode: this.fb.control(''),
      // Indian Compliance Fields
      GSTIN: this.fb.control('', [Validators.pattern(GSTIN_PATTERN)]),
      PANNumber: this.fb.control('', [Validators.pattern(PAN_PATTERN)]),
      TANNumber: this.fb.control('', [Validators.pattern('^[A-Z]{4}[0-9]{5}[A-Z]{1}$')]),
      CINNumber: this.fb.control('', [Validators.pattern('^[A-Z]{3}[0-9]{4}[A-Z]{2}[0-9]{6}$')]),
      GSTRegistrationStatus: this.fb.control('unregistered'),

      // Remove duplicate PINCode - using PostCode for Indian PIN

      // Shipping Address Fields
      ShippingAddress1: this.fb.control(''),
      ShippingAddress2: this.fb.control(''),
      ShippingCity: this.fb.control(''),
      ShippingState: this.fb.control(''),
      ShippingPINCode: this.fb.control('', [Validators.pattern(PIN_CODE_PATTERN)]),

      // Billing Address Fields
      BillingAddress1: this.fb.control(''),
      BillingAddress2: this.fb.control(''),
      BillingCity: this.fb.control(''),
      BillingState: this.fb.control(''),
      BillingPINCode: this.fb.control('', [Validators.pattern(PIN_CODE_PATTERN)]),

      // Simplified Compliance Field
      ClientComplianceStatus: this.fb.control('non_compliance_client')
    });
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Client Master');

    // Load all dynamic configurations
    this.loadAllConfigurations();

    // Load Indian states for GST calculations
    this.loadIndianStates();

    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['code'] != undefined) {
        this.getClientMasterList(params['code'], params['status']);
        this.getBranchMasterListByUser(this.currentUser);
        this.getAllClientMasterList(params['code'], params['status']);
      } else {
        this.getAllClientMasterList('all', 'Active'); // Load all active clients for dropdown
        this.getBranchMasterListByUser(this.currentUser);
        this.getNewVoucherNumber();
      }
    });
  }

  loadAllConfigurations(): void {
    // Load GST Configurations
    this._masterService.getGSTConfigurationList().subscribe(
      (data) => {
        this.gstConfigurations = data;
        console.log('GST Configurations loaded:', data);
      },
      (error) => {
        console.log('Error loading GST configurations:', error);
        // Provide fallback GST configurations
        this.gstConfigurations = [
          { id: 1, gstRate: 0, hsnCode: '', description: 'Exempted Services', StateCode: '', effectiveDate: '2024-01-01', isActive: true, createdDate: '2024-01-01', createdBy: 'System', lastUpdatedDate: '2024-01-01', lastUpdatedBy: 'System' },
          { id: 2, gstRate: 5, hsnCode: '', description: 'Essential Goods', StateCode: '', effectiveDate: '2024-01-01', isActive: true, createdDate: '2024-01-01', createdBy: 'System', lastUpdatedDate: '2024-01-01', lastUpdatedBy: 'System' },
          { id: 3, gstRate: 12, hsnCode: '', description: 'Standard Services', StateCode: '', effectiveDate: '2024-01-01', isActive: true, createdDate: '2024-01-01', createdBy: 'System', lastUpdatedDate: '2024-01-01', lastUpdatedBy: 'System' },
          { id: 4, gstRate: 18, hsnCode: '', description: 'Professional Services', StateCode: '', effectiveDate: '2024-01-01', isActive: true, createdDate: '2024-01-01', createdBy: 'System', lastUpdatedDate: '2024-01-01', lastUpdatedBy: 'System' },
          { id: 5, gstRate: 28, hsnCode: '', description: 'Luxury Services', StateCode: '', effectiveDate: '2024-01-01', isActive: true, createdDate: '2024-01-01', createdBy: 'System', lastUpdatedDate: '2024-01-01', lastUpdatedBy: 'System' }
        ];
      }
    );
  }

  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        console.log(data);
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  getNewVoucherNumber(): void {
    this._masterService.getNClientMasterCode().subscribe(
      result => {
        this.clientForm.patchValue({
          Code: result.ClientCode
        });
      },
      (error) => this.handleErrors(error)
    );
  }
  changeAgreementStart(type: string, event: MatDatepickerInputEvent<Date>) {
    this.clientForm.value.AgreementStart = this.formatDate(`${type}: ${event.value}`);
  }
  changeAgreementEnd(type: string, event: MatDatepickerInputEvent<Date>) {
    this.clientForm.value.AgreementEnd = this.formatDate(`${type}: ${event.value}`);
  }
  getBranchMasterList() {
    this._masterService.getBranchMaster(this.branchCode).subscribe((responseData) => {
      if (responseData != null) {
        this.branchModel = responseData
      }
    },
      (error) => this.handleErrors(error)
    );
  }
  getBranchMasterListByUser(userName: string) {
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchModel = data
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  getAllClientMasterList(clientCode: string, status: string): void {
    console.log('Loading client dropdown data for:', clientCode, status);

    if (clientCode === 'all') {
      // For new client creation, get all active clients
      this._masterService.getClientMsterListByStatus(status).subscribe(
        (data) => {
          console.log('Client dropdown data received:', data);
          this.clientModelDropdown = data;
        },
        (error) => {
          console.log('Error loading client dropdown data:', error);
          this.handleErrors(error);
        }
      );
    } else {
      // For edit mode, use the existing method
      this._masterService.getClienthMaster(clientCode, status).subscribe(
        (data) => {
          console.log('Client dropdown data received:', data);
          this.clientModelDropdown = data;
        },
        (error) => {
          console.log('Error loading client dropdown data:', error);
          this.handleErrors(error);
        }
      );
    }
  }

  getClientMasterList(clientCode: string, status: string) {
    this.showLoadingSpinner = true;
    this._masterService.getClienthMaster(clientCode, status).subscribe((responseData) => {
      if (responseData != null) {
        console.log('responseData', responseData)
        this.clientCodeStatus = 'edit';
        this.clientForm.patchValue({
          Id: responseData[0].ID,
          Code: responseData[0].Code,
          Branch: responseData[0].Branch,
          Name: responseData[0].Name,
          ShortName: responseData[0].Shortname,
          Address1: responseData[0].Address1,
          Address2: responseData[0].Address2,
          PostCode: responseData[0].PostCode,
          City: responseData[0].City,
          IndianState: responseData[0].State, // Map State to IndianState
          SuperClientCode: responseData[0].SuperClientCode,
          Status: responseData[0].Status,
          PersonIncharge: responseData[0].PersonIncharge,
          Phone: responseData[0].Phone,
          Fax: responseData[0].Fax,
          UserEmail: (responseData[0].Email && responseData[0].Email != 'null' ? responseData[0].Email : ''),
          LastUpdatedBy: responseData[0].LastUpdatedBy,
          IsClientHeadQuarters: responseData[0].IsClientHeadQuarters,
          LastUpdatedDate: this.formatDate(responseData[0].LastUpdatedDate),
          //AgreementStart: this.formatDate(responseData[0].AgreementStart),
          //AgreementEnd: this.formatDate(responseData[0].AgreementEnd == null ? 'null' : responseData[0].AgreementEnd),
          CreatedDate: this.formatDate(responseData[0].CreatedDate),
          // Indian Compliance Fields
          GSTIN: responseData[0].GSTIN || '',
          PANNumber: responseData[0].PANNumber || '',
          TANNumber: responseData[0].TANNumber || '',
          CINNumber: responseData[0].CINNumber || '',
          GSTRegistrationStatus: responseData[0].GSTRegistrationStatus || 'unregistered',

          // Shipping Address Fields
          ShippingAddress1: responseData[0].ShippingAddress1 || '',
          ShippingAddress2: responseData[0].ShippingAddress2 || '',
          ShippingCity: responseData[0].ShippingCity || '',
          ShippingState: responseData[0].ShippingState || '',
          ShippingPINCode: responseData[0].ShippingPINCode || '',

          // Billing Address Fields
          BillingAddress1: responseData[0].BillingAddress1 || '',
          BillingAddress2: responseData[0].BillingAddress2 || '',
          BillingCity: responseData[0].BillingCity || '',
          BillingState: responseData[0].BillingState || '',
          BillingPINCode: responseData[0].BillingPINCode || '',

          // Compliance Status
          ClientComplianceStatus: responseData[0].ClientComplianceStatus || 'non_compliance_client'
        });

        // Call GST status change handler to enable/disable fields appropriately
        this.onGSTRegistrationStatusChange({ value: responseData[0].GSTRegistrationStatus || 'unregistered' });

      }
      if (responseData[0].isClientHeadQuarters == false) {
        this.clientForm.get('IsClientHeadQuarters')?.setValue(responseData[0].IsClientHeadQuarters);
        this.disableSelect = false
      } else {
        this.clientForm.get('IsClientHeadQuarters')?.setValue(responseData[0].IsClientHeadQuarters);
        this.disableSelect = false
      }
      if (responseData[0].AgreementStart == null) {
        this.clientForm.get('AgreementStart')?.setValue('');
      } else {
        this.clientForm.get('AgreementStart')?.setValue(responseData[0].AgreementStart);
      }
      if (responseData[0].AgreementEnd == null) {
        this.clientForm.get('AgreementEnd')?.setValue('');
      } else {
        this.clientForm.get('AgreementEnd')?.setValue(responseData[0].AgreementEnd);
      }
      this.showLoadingSpinner = false;
    },

      (error) => this.handleErrors(error)
    );
  }

  onCheckboxChange(e: MatCheckboxChange) {
    if (e.checked) {
      this.disableSelect = true;
      // Disable the SuperClientCode control in the form
      this.clientForm.get('SuperClientCode')?.disable();
    } else {
      this.disableSelect = false;
      // Enable the SuperClientCode control in the form
      this.clientForm.get('SuperClientCode')?.enable();
    }
  }

  onGSTRegistrationStatusChange(event: any) {
    const gstStatus = event.value;

    if (gstStatus === 'no_gst') {
      // Clear GST-related fields when "No GST" is selected
      this.clientForm.get('GSTIN')?.setValue('');
      this.clientForm.get('GSTIN')?.disable();
    } else {
      // Enable GST-related fields for other options
      this.clientForm.get('GSTIN')?.enable();
    }
  }

  onGSTINChange(event: any) {
    const gstin = event.target?.value || '';
    if (gstin.length >= 2) {
      // Extract state code from GSTIN (first 2 digits)
      const stateCode = gstin.substring(0, 2);
      console.log('GST State Code detected:', stateCode);
    }

    // GSTIN validation logic removed - using simplified compliance
  }


  onPANChange(event: any) {
    // PAN validation logic removed - using simplified compliance
  }

  onTANChange(event: any) {
    // TAN validation logic removed - using simplified compliance
  }

  onCINChange(event: any) {
    // CIN validation logic removed - using simplified compliance
  }




  loadIndianStates() {
    this._indianComplianceService.getIndianStatesFromAPI().subscribe(
      (states: any[]) => {
        this.indianStateList = states;
        console.log('Indian states loaded:', states);
      },
      (error: any) => {
        console.error('Error loading Indian states:', error);
        // Fallback to static list if API fails
        this.indianStateList = this._indianComplianceService.getIndianStates().map(state => ({
          stateName: state,
          stateCode: this.getStateCodeFromName(state)
        }));
        console.log('Using fallback Indian states:', this.indianStateList);
      }
    );
  }

  getStateCodeFromName(stateName: string): string {
    const stateCodeMap: { [key: string]: string } = {
      'Tamil Nadu': '33',
      'Karnataka': '29',
      'Kerala': '32',
      'Andhra Pradesh': '37',
      'Maharashtra': '27',
      'Uttar Pradesh': '09',
      'Delhi': '07',
      'West Bengal': '19',
      'Gujarat': '24',
      'Rajasthan': '08',
      'Madhya Pradesh': '23',
      'Punjab': '03',
      'Haryana': '06',
      'Bihar': '10',
      'Odisha': '21',
      'Assam': '18',
      'Jharkhand': '20',
      'Chhattisgarh': '22',
      'Uttarakhand': '05',
      'Himachal Pradesh': '02',
      'Jammu and Kashmir': '01',
      'Goa': '30',
      'Telangana': '36',
      'Andaman and Nicobar Islands': '35',
      'Lakshadweep': '31',
      'Puducherry': '34',
      'Chandigarh': '04',
      'Dadra and Nagar Haveli and Daman and Diu': '26',
      'Sikkim': '11',
      'Meghalaya': '17',
      'Tripura': '16',
      'Mizoram': '15',
      'Nagaland': '13',
      'Manipur': '14',
      'Arunachal Pradesh': '12',
      'Ladakh': '38'
    };
    return stateCodeMap[stateName] || '';
  }

  // Copy Main Address to Shipping Address
  onCopyAddressToShippingChange(event: MatCheckboxChange): void {
    this.copyAddressToShipping = event.checked;
    if (event.checked) {
      this.copyMainAddressToShipping();
    }
  }

  copyMainAddressToShipping(): void {
    this.clientForm.get('ShippingAddress1')?.setValue(this.clientForm.get('Address1')?.value);
    this.clientForm.get('ShippingAddress2')?.setValue(this.clientForm.get('Address2')?.value);
    this.clientForm.get('ShippingPINCode')?.setValue(this.clientForm.get('PostCode')?.value);
    this.clientForm.get('ShippingCity')?.setValue(this.clientForm.get('City')?.value);
    this.clientForm.get('ShippingState')?.setValue(this.clientForm.get('IndianState')?.value);
  }

  // Copy Main Address to Billing Address
  onCopyAddressToBillingChange(event: MatCheckboxChange): void {
    this.copyAddressToBilling = event.checked;
    if (event.checked) {
      this.copyMainAddressToBilling();
    }
  }

  copyMainAddressToBilling(): void {
    this.clientForm.get('BillingAddress1')?.setValue(this.clientForm.get('Address1')?.value);
    this.clientForm.get('BillingAddress2')?.setValue(this.clientForm.get('Address2')?.value);
    this.clientForm.get('BillingPINCode')?.setValue(this.clientForm.get('PostCode')?.value);
    this.clientForm.get('BillingCity')?.setValue(this.clientForm.get('City')?.value);
    this.clientForm.get('BillingState')?.setValue(this.clientForm.get('IndianState')?.value);
  }

  savebuttonClick(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      Swal.fire({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        title: 'Validation Error',
        text: 'Please fill in all required fields correctly.',
        icon: 'warning',
        timer: 3000,
      });
      return;
    }

    this.showLoadingSpinner = true;
    this.clientModel = this.clientForm.value;

    // Map IndianState back to State for backend compatibility
    this.clientModel.State = this.clientForm.value.IndianState;
    this.clientModel.PINCode = this.clientForm.value.PostCode; // Map PostCode to PINCode

    this.clientModel.AgreementStart = this.clientForm.value.AgreementStart == null ? null : this.clientForm.value.AgreementStart;
    this.clientModel.AgreementEnd = this.clientForm.get('AgreementEnd')?.value ? this.clientForm.get('AgreementEnd')?.value : null;
    this.clientModel.LastUpdatedDate = this.clientForm.get('LastUpdatedDate')?.value ? this.clientForm.get('LastUpdatedDate')?.value : null;
    this.clientModel.Email = (this.clientForm.value.UserEmail == '' || this.clientForm.value.UserEmail == 'null') ? '' : this.clientForm.value.UserEmail;

    // Update simplified compliance field
    this.clientModel.ClientComplianceStatus = this.clientForm.get('ClientComplianceStatus')?.value || 'non_compliance_client';

    this._masterService.saveAndUpdateClientMaster(this.clientModel).subscribe((response: any) => {
      if (response.Success == 'Success') {
        this.clientModel = response.Client;
        this._dataService.setUsername(this.currentUser);
        this._router.navigate(['/master/client-master']);
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: response.Message || `Successfully saved client details.`,
          icon: 'success',
          showCloseButton: false,
          timer: 3000,
        });
      } else if (response.Success == 'Error') {
        this.showLoadingSpinner = false;
        Swal.fire({
          title: 'Error',
          text: response.Message || 'Failed to save client details',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    },
      (error) => this.handleErrors(error)
    );
  }
  clearClientDetails(): void {
    this.clientForm.reset();
  }
  handleErrors(error: any) {
    this.showLoadingSpinner = false;
    console.error('Master operation error:', error);
    const errorMsg = typeof error === 'string' ? error : (error.error?.Message || error.message || 'An unknown error occurred');
    Swal.fire({
      title: 'Server Error',
      text: errorMsg,
      icon: 'error',
      confirmButtonText: 'OK'
    });
  };
}
