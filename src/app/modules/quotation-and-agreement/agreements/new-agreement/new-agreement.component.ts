import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';

import { forkJoin, Observable, of } from 'rxjs';

import { catchError, map } from 'rxjs/operators';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatDialog } from '@angular/material/dialog';

import { MatPaginator } from '@angular/material/paginator';

import { MatTableDataSource } from '@angular/material/table';

import { MatSort, Sort } from '@angular/material/sort';

import { LiveAnnouncer } from '@angular/cdk/a11y';

import { AgreementService } from "../../agreement.service";

import { ServiceTypeService } from "../../../../service/service-type.service";

import { ServiceType } from "../../../../model/service-type.model";

import Swal from "sweetalert2";

import { ActivatedRoute, Router } from "@angular/router";

import { DatasharingService } from "../../../../service/datasharing.service";

import { UserAccessModel } from 'src/app/model/userAccesModel';

import { MastermoduleService } from 'src/app/service/mastermodule.service';

import { GSTConfiguration } from 'src/app/model/indian-compliance.model';

import { QuotationService } from "../../quotation.service";

import { PdfExportService } from "../../../../service/pdf-export.service";

import { CommercialBreakdownDialogComponent } from "../../quotations/new-quotation/commercial-breakdown-dialog/commercial-breakdown-dialog.component";

import { IQuotationDetail } from "../../../../model/quotation-detail.model";



export interface IItemDetails {

  ID: number,

  AgreementID: number,

  Description: string,

  ClientInvoiceID?: string,

  NoOfGuards: number,

  PerDay: number,

  PerMonth: number,

  Rate: number,

  NoOfHours: number,

  NoOfDays: number,

  FollowCalender: boolean,

  MonthDays?: number,
  AgreementType?: string,

  HasDiscount: boolean,

  DiscountAmount: any,

  IsTaxable: any,

  TaxAmount: any,

  MonthTotal: any,

  DiscountHour: number,

  Category: string,

  Reason: string,

  total?: any,

  index?: any;

  // Enhanced fields for service type integration

  ServiceTypeID?: number,

  ServiceType?: ServiceType,

  WorkOrderNumber?: string,

  ServicePeriodFrom?: Date,

  ServicePeriodTo?: Date,

  DutyCount?: number,

  UnitCount?: number,

  HourCount?: number,

  ServiceRate?: number,

  CommercialBreakdown?: any; // For storing commercial breakdown data separately

}



export interface IAgreement {

  ID: number,

  BranchName: string;

  ClientName: string;

  AgreementDate: string;

}



@Component({

  selector: 'app-new-agreement',

  templateUrl: './new-agreement.component.html',

  styleUrls: ['./new-agreement.component.css']

})

export class NewAgreementComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['ServiceType', 'Description', 'NoOfGuards', 'PerMonth', 'PerDay', 'Rate', 'NoOfDays', 'FollowCalender', 'MonthTotal', 'YearTotal', 'HasDiscount', 'DiscountAmount', 'DiscountHour', 'IsTaxable', 'TaxAmount', 'total', 'Category', 'Reason', 'action'];

  dataSource!: MatTableDataSource<IItemDetails>;



  agreementDisplayedColumns: string[] = ['BranchName', 'ClientName', 'WorkPlace', 'AgreementDate', 'action'];

  agreementDataSource!: MatTableDataSource<IAgreement>;



  frm!: FormGroup

  details: IItemDetails[] = [];

  data: any;

  branchList: any;

  clientList: any;

  serviceTypes: ServiceType[] = [];

  gstConfigList: GSTConfiguration[] = [];

  isEdit: boolean = false;

  isFollowCalendarManuallyChanged: boolean = false;
  isDiscountManuallyEdited: boolean = false;
  /** True while editRow() is patching saved values into the form.
   *  DetailRowChange() must NOT overwrite MonthTotal during this window. */
  isPopulatingEditRow: boolean = false;

  detailEdit: boolean = false;

  ID: any;

  today: any;

  sixMonthsAgo: any;

  errorDescription: string = "";

  type: string = "";

  currentUser: string = '';

  errorMessage: string = '';

  showLoadingSpinner: boolean = false;

  userAccessModel!: UserAccessModel;



  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, public service: AgreementService,

    private serviceTypeService: ServiceTypeService, private activatedRoute: ActivatedRoute, private route: Router,

    private _dataService: DatasharingService, private _masterService: MastermoduleService,

    private _quotationService: QuotationService, private _pdfService: PdfExportService) {

  }



  ngOnInit() {

    this.userAccessModel = {

      readAccess: false,

      updateAccess: false,

      deleteAccess: false,

      createAccess: false,

    }

    this.currentUser = sessionStorage.getItem('username')!;

    if (this.currentUser == 'null' || this.currentUser == undefined) {

      this._dataService.getUsername().subscribe((username) => {

        this.currentUser = username;

      });

    }

    this.getUserAccessRights(this.currentUser, 'Agreement');

    this.today = new Date();

    this.sixMonthsAgo = new Date();

    this.sixMonthsAgo.setMonth(this.today.getMonth() - 6);



    // Capture route ID synchronously via snapshot — no async subscribe needed
    this.ID = this.activatedRoute.snapshot.params['ID'];

    this.frm = this.fb.group({

      ID: [0],

      AgreementDate: [new Date(), Validators.required],

      AgreementEndDate: [new Date()],

      Branch: ['', Validators.required],

      Client: ['', Validators.required],

      WorkPlace: [''],

      IsValid: [true],

      QuotationID: [0],

      details: this.fb.group({

        ID: [0],

        AgreementID: [0],

        ServiceTypeID: [null],

        Description: [''],

        NoOfGuards: [0],

        PerDay: [0],

        PerMonth: [0],

        Rate: [0],

        NoOfHours: [8],

        NoOfDays: [0],

        FollowCalender: [false],

        MonthDays: [0],
        AgreementType: ['N'],

        MonthTotal: [0],

        YearTotal: [0],

        HasDiscount: [false],

        DiscountAmount: [0],

        DiscountHour: [0],

        IsTaxable: [true],

        TaxAmount: [0],

        total: [0],

        Category: [''],

        Reason: [''],

        index: [-1],

        Basic: [0],

        DA: [0],

        Leaves: [0],

        LeavesPercentage: [0],

        Allowance: [0],

        Bonus: [0],

        BonusPercentage: [0],

        NFH: [0],

        PF: [0],

        PFPercentage: [0],

        ESI: [0],

        ESIPercentage: [0],

        Uniform: [0],

        ServiceFee: [0],

        HRA: [0],

        HRAPercentage: [0],

        ProfessionalTax: [0],

        RelieverCharges: [0],

        RelieverChargesPercentage: [0],

        Others: [0],

        OthersPercentage: [0],

        AdministrationCharges: [0],

        AdministrationChargesPercentage: [0],

        ManagementFee: [0],

        ManagementFeePercentage: [0],

        SubTotal: [0],

        TotalPlusStatutory: [0],

        TotalDirectCost: [0],

        MonthlyChargedCost: [0],

        CommercialBreakdown: [null]

      }),

      Note: ['-'],

    });



    // 1. Load all master data first, then decide what to load
    this.showLoadingSpinner = true;
    forkJoin({
      master: this.service.getAgreementMaster(this.currentUser),
      serviceTypes: this.serviceTypeService.getAllServiceTypes(),
      gstConfig: this._masterService.getGSTConfigurationList()
    }).pipe(
      catchError(err => {
        this.handleErrors(err);
        return of({ master: {}, serviceTypes: [], gstConfig: [] });
      })
    ).subscribe((results: any) => {

      // Set Master Data
      this.data = results.master;
      this.branchList = results.master['branchList'];
      this.clientList = results.master['clientList'];
      this.serviceTypes = results.serviceTypes || [];
      this.gstConfigList = results.gstConfig || [];

      // 2. Handle Quotation Forwarding or Edit Mode
      const qId = this.activatedRoute.snapshot.queryParams['quotationID'];
      if (qId) {
        this.loadQuotationData(qId);
      } else if (this.ID != 0 && this.ID != undefined) {
        // Edit mode — form + master data both ready now
        this.loadAgreementForEdit(this.ID);
      } else {
        this.hideLoadingSpinner();
      }
    });

  }



  ngAfterViewInit() {

    if (this.dataSource) {

      this.dataSource.paginator = this.paginator;

      this.dataSource.sort = this.sort;

    }

  }



  getUserAccessRights(userName: string, screenName: string) {

    this._masterService.getUserAccessRights(userName, screenName).subscribe(

      (data) => {

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

  applyFilter(event: Event) {

    const filterValue = (event.target as HTMLInputElement).value;

    this.dataSource.filter = filterValue.trim().toLowerCase();

  }



  // Load service types for selection

  loadServiceTypes(): Observable<ServiceType[]> {

    return this.serviceTypeService.getAllServiceTypes().pipe(

      map((data: ServiceType[]) => {

        this.serviceTypes = data;

        return data;

      }),

      catchError(() => {

        this.serviceTypes = [];

        return of([]);

      })

    );

  }



  // Method to handle service type selection

  onServiceTypeChange(serviceTypeId: number, detailIndex: number) {

    if (!this.frm.get('Branch')?.value || !this.frm.get('Client')?.value) {

      Swal.fire({

        toast: true, position: 'top', showConfirmButton: false, title: 'Warning',

        text: 'Please select Branch and Client first!', icon: 'warning', showCloseButton: false, timer: 4000

      });

      setTimeout(() => this.frm.get('details.ServiceTypeID')?.setValue(null));

      return;

    }



    const selectedService = this.serviceTypes.find(st => st.Id === serviceTypeId);

    if (!selectedService) return;



    this.frm.get('details.ServiceTypeID')?.setValue(serviceTypeId);

    this.frm.get('details.Description')?.setValue(selectedService.ServiceName);

    this.frm.get('details.Rate')?.setValue(0);



    this.DetailRowChange();

  }



  @ViewChild(MatPaginator)

  paginator!: MatPaginator;

  @ViewChild(MatSort)

  sort!: MatSort;





  announceSortChange(sortState: Sort) {

    if (sortState.direction) {

      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);

    } else {

      this._liveAnnouncer.announce('Sorting cleared');

    }

  }



  onSubmit() {

    let data = this.frm.getRawValue();



    // Extract commercial breakdown data from each detail and merge into main detail object for database storage

    this.details.forEach((detail: any) => {

      if (detail.CommercialBreakdown) {

        const cb = detail.CommercialBreakdown;

        detail.Basic = cb.Basic || 0;

        detail.DA = cb.DA || 0;

        detail.HRA = cb.HRA || 0;

        detail.HRAPercentage = cb.HRAPercentage || 0;

        detail.Leaves = cb.Leaves || 0;

        detail.LeavesPercentage = cb.LeavesPercentage || 0;

        detail.ProfessionalTax = cb.ProfessionalTax || 0;

        detail.Bonus = cb.Bonus || 0;

        detail.BonusPercentage = cb.BonusPercentage || 0;

        detail.RelieverCharges = cb.RelieverCharges || 0;

        detail.RelieverChargesPercentage = cb.RelieverChargesPercentage || 0;

        detail.PF = cb.PF || 0;

        detail.PFPercentage = cb.PFPercentage || 0;

        detail.ESI = cb.ESI || 0;

        detail.ESIPercentage = cb.ESIPercentage || 0;

        detail.Uniform = cb.UniformCost || cb.Uniform || 0;

        detail.Others = cb.Others || 0;

        detail.OthersPercentage = cb.OthersPercentage || 0;

        detail.AdministrationCharges = cb.AdministrationCharges || 0;

        detail.AdministrationChargesPercentage = cb.AdministrationChargesPercentage || 0;

        detail.ManagementFee = cb.ManagementFee || 0;

        detail.ManagementFeePercentage = cb.ManagementFeePercentage || 0;

        detail.SubTotal = cb.SubTotal || 0;

        detail.TotalPlusStatutory = cb.TotalPlusStatutory || 0;

        detail.TotalDirectCost = cb.TotalDirectCost || 0;

        detail.MonthlyChargedCost = cb.MonthlyChargedCost || 0;

      }

    });



    // Sync PerDay and PerMonth values from form to details array
    this.details.forEach((detail: any) => {
      detail.PerDay = parseFloat(detail.PerDay) || 0;
      detail.PerMonth = parseFloat(detail.PerMonth) || 0;
    });

    // Rename nested form group 'details' to 'agreementDetails' as expected by backend

    data['agreementDetails'] = this.details;

    delete data['details'];



    if (this.frm.invalid) {

      return

    }

    data['AgreementDate'] = this.returnDate(this.frm.get('AgreementDate')?.value);

    console.log('isEdit:', this.isEdit, 'ID:', this.ID, 'AgreementDate:', data['AgreementDate']);

    // Validation: Check if agreement has invoices and prevent editing in the same month
    if (this.isEdit && this.ID > 0) {
      this.service.getFinalInvoiceDate(this.ID).subscribe((finalInvoiceDate: any) => {
        
        let hasInvoiceInNewMonth = false;
        let newAgreementDate = new Date(data['AgreementDate']);
        
        if (Array.isArray(finalInvoiceDate) && finalInvoiceDate.length > 0) {
          const newMonth = newAgreementDate.getMonth();
          const newYear = newAgreementDate.getFullYear();
          
          for (let invoice of finalInvoiceDate) {
            let invoiceDate: Date | null = null;
            if (invoice && invoice.InvoiceDate) {
              invoiceDate = new Date(invoice.InvoiceDate);
            } else if (invoice && invoice.InvoicePeriod) {
              invoiceDate = new Date(invoice.InvoicePeriod);
            } else if (invoice && typeof invoice === 'string') {
              invoiceDate = new Date(invoice);
            } else if (invoice && invoice.Date) {
              invoiceDate = new Date(invoice.Date);
            }
            
            if (invoiceDate) {
              const invoiceMonth = invoiceDate.getMonth();
              const invoiceYear = invoiceDate.getFullYear();
              
              if (invoiceYear === newYear && invoiceMonth === newMonth) {
                hasInvoiceInNewMonth = true;
                break;
              }
            }
          }
        }
        
        if (hasInvoiceInNewMonth) {
          Swal.fire({
            title: 'Warning Message',
            text: `New Agreement Period can not be less than ${newAgreementDate.toISOString().substring(0, 7)}`,
            icon: 'warning',
            width: '600px',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
          });
          return;
        }
        
        // Invoice check passed - now check duplicate then save
        this.checkDuplicateAndSave(data);
      });
      return;
    }

    // New agreement - check duplicate then save
    this.checkDuplicateAndSave(data);

  }

  checkDuplicateAndSave(data: any) {
    const branch = data['Branch'];
    const client = data['Client'];
    const agreementDate = data['AgreementDate'];
    const excludeId = this.isEdit ? (this.ID || 0) : 0;

    this.service.checkDuplicateAgreement(branch, client, agreementDate, excludeId, data['WorkPlace']).subscribe({
      next: (result: any) => {
        if (result && result.IsDuplicate) {
          const dateObj = new Date(agreementDate);
          const monthYear = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
          Swal.fire({
            title: 'Duplicate Agreement',
            text: `An agreement already exists for this Branch and Client in ${monthYear}. Please check and try again.`,
            icon: 'warning',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
          });
          return;
        }
        this.saveAgreement(data);
      },
      error: () => {
        this.saveAgreement(data);
      }
    });
  }

  saveAgreement(data: any) {
    let msg = this.isEdit ? 'Successfully Updated Agreement Details' : 'Successfully Saved Agreement Details';

    this.service.save(data).subscribe({
      next: (d: any) => {
        if (d && d.Success === 'Duplicate') {
          Swal.fire({
            title: 'Duplicate Agreement',
            text: d.Message || 'An agreement already exists for this Branch and Client in the same period.',
            icon: 'warning',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
          });
          return;
        }
        Swal.fire({
          title: 'Success',
          text: msg,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        }).then(() => {
          this.route.navigate(['/quotation-and-agreement/agreements']);
        });
      },
      error: (err: any) => {
        if (err.error && err.error.Success === 'Duplicate') {
          Swal.fire({
            title: 'Duplicate Agreement',
            text: err.error.Message || 'An agreement already exists for this Branch and Client in the same period.',
            icon: 'warning',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
          });
          return;
        }
        this.handleErrors(err);
        const errMsg = err?.error?.Message || err?.error?.message || err?.message || 'Failed to save agreement details';
        Swal.fire('Error', errMsg, 'error');
      }
    });
  }



  returnDate(date?: any) {

    let currentDate = new Date();

    if (date) {

      currentDate = new Date(date);

    }



    const year = currentDate.getFullYear();

    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based

    // const day = String(currentDate.getDate()).padStart(2, '0');



    return `${year}-${month}-01`;

  }



  addItemDetails(action: string) {

    this.DetailRowChange();

    let frmData = this.frm.getRawValue();

    let details = frmData['details'];



    if (details['Description'] == "") {

      this.errorDescription = "Enter the type";

      return;

    }

    if (details['NoOfGuards'] == 0 && this.type !== 'LS') {

      this.errorDescription = "Number of Guards cannot be 0";

      return;

    }




    if (details['Category'] == "") {

      details['Category'] = "-";

    }



    if (details['ServiceTypeID']) {

      details['ServiceType'] = this.serviceTypes.find(st => st.Id === details['ServiceTypeID']);

    }



    // if (details['index'] == -1 && action == 'add') {

    if (action == 'add') {

      details['ID'] = 0;
      details['PerDay'] = details['PerDay'] || 0;
      details['PerMonth'] = details['PerMonth'] || 0;

      this.details.push(details);

    } else if (details['index'] >= 0 && action == 'update') {

      details['PerDay'] = details['PerDay'] || 0;
      details['PerMonth'] = details['PerMonth'] || 0;
      this.details[details['index']] = details;

    }

    this.detailDataSource();

    this.chkNormal("N");

    this.detailEdit = false;

  }



  detailDataSource() {

    this.dataSource = new MatTableDataSource(this.details);

    setTimeout(() => {

      this.dataSource.sort = this.sort;

      this.dataSource.paginator = this.paginator;

    });

  }



  loadAgreementForEdit(agreementID: any) {
    this.isEdit = true;
    this.service.getAgreementById(agreementID).subscribe((d: any) => {
      console.log('Full backend response for agreement ID', agreementID, ':', d);
      let res = d['Result'] || d;
      console.log('Res object:', res);

      let agreement = res['agreement'] || res['Agreement'];
      let agreementDetails = res['agreementDetails'] || res['AgreementDetails'] || res['details'] || [];

      // Load clients for the branch FIRST, then patch form values
      // so the Client dropdown is populated before we set the value
      if (agreement.Branch) {
        this.getClientsByBranchID(agreement.Branch, () => {
          this.frm.patchValue(agreement);
        });
      } else {
        this.frm.patchValue(agreement);
      }

      this.details = agreementDetails.map((row: any) => this.mapItemDetails(row));
      this.detailDataSource();
      this.hideLoadingSpinner();

      // Check for warning message from backend response
      if (res['WarningMessage'] || res['warningMessage'] || res['Message'] || res['message']) {
        const warningMsg = res['WarningMessage'] || res['warningMessage'] || res['Message'] || res['message'];
        Swal.fire({
          title: 'Warning Message',
          text: warningMsg,
          icon: 'warning',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
      } else {
        // Check if invoices are posted for this agreement
        this.service.getFinalInvoiceDate(agreementID).subscribe((finalInvoiceDate: any) => {
          console.log('Final Invoice Date response:', finalInvoiceDate);
          console.log('Agreement start date:', agreement.AgreementDate);
          
          if (Array.isArray(finalInvoiceDate) && finalInvoiceDate.length > 0) {
            const agreementStartDate = new Date(agreement.AgreementDate);
            const agreementMonth = agreementStartDate.getMonth();
            const agreementYear = agreementStartDate.getFullYear();

            // Check if any invoice is posted for the exact same month as the agreement start date
            let hasConflictingInvoice = false;
            let conflictingMonth = '';

            for (let invoice of finalInvoiceDate) {
              let invoiceDate = null;
              if (invoice.InvoiceDate) {
                invoiceDate = new Date(invoice.InvoiceDate);
              } else if (invoice.InvoicePeriod) {
                invoiceDate = new Date(invoice.InvoicePeriod);
              } else if (typeof invoice === 'string') {
                invoiceDate = new Date(invoice);
              } else if (invoice.Date) {
                invoiceDate = new Date(invoice.Date);
              }

              if (invoiceDate) {
                const invoiceMonth = invoiceDate.getMonth();
                const invoiceYear = invoiceDate.getFullYear();

                // Check if invoice is in the exact same month as the agreement start date
                if (invoiceYear === agreementYear && invoiceMonth === agreementMonth) {
                  hasConflictingInvoice = true;
                  conflictingMonth = invoiceDate.toISOString().substring(0, 7);
                  console.log('Found conflicting invoice for same month:', invoiceDate, 'Agreement:', agreementStartDate);
                  break;
                }
              }
            }

            if (hasConflictingInvoice) {
              Swal.fire({
                title: 'Warning Message',
                text: `Invoice already posted for period ${conflictingMonth}`,
                icon: 'warning',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
              });
            }
          }
        });
      }
    });
  }

  private mapItemDetails(d: any): IItemDetails {

    let detail: IItemDetails = {

      ...d,

      IsTaxable: !!d.IsTaxable,

      YearTotal: Math.round(d.MonthTotal * 12)

    };

    // If MonthDays not saved (old Normal records), don't show 0 — leave as 0,
    // but if District button is clicked later chkDistrict() will auto-fill from AgreementDate.
    // For display: keep as-is from DB (0 for Normal, actual value for District).



    let vDiscount = parseFloat(d.DiscountAmount || d.Discount || 0);

    if (!detail.HasDiscount) {

      vDiscount = 0;

    }



    let t = (parseFloat(d.MonthTotal) - vDiscount);

    if (detail.IsTaxable) {

      detail.total = this.formatCurrency((t * (1 + 18 / 100))); // Default 18% for tax calc if config missing

    } else {

      detail.total = this.formatCurrency(t);

    }



    // Recover ServiceType by matching Description if possible

    const matchedService = this.serviceTypes?.find(st => st.ServiceName === detail.Description);

    if (matchedService) {

      detail.ServiceTypeID = matchedService.Id;

      detail.ServiceType = matchedService;

      

      // Re-calculate with correct GST rate if service type is matched

      if (detail.IsTaxable) {

        const config = this.gstConfigList.find(c => c.hsnCode === matchedService.HSNCode);

        const gstRate = config?.gstRate ?? 18;

        detail.total = this.formatCurrency((t * (1 + gstRate / 100)));

      }

    } else if (d.ServiceTypeID) {

      const matchedById = this.serviceTypes?.find(st => st.Id === d.ServiceTypeID);

      if (matchedById) {

        detail.ServiceTypeID = matchedById.Id;

        detail.ServiceType = matchedById;

      }

    }



    // Reconstruct commercial breakdown data from individual columns

    if (!detail.CommercialBreakdown) {

      detail.CommercialBreakdown = {

        Basic: d.Basic || 0,

        DA: d.DA || 0,

        MinimumWages: (d.Basic || 0) + (d.DA || 0),

        HRA: d.HRA || 0,

        HRAPercentage: d.HRAPercentage || 0,

        Leaves: d.Leaves || 0,

        LeavesPercentage: d.LeavesPercentage || 0,

        ProfessionalTax: d.ProfessionalTax || 0,

        Bonus: d.Bonus || 0,

        BonusPercentage: d.BonusPercentage || 0,

        RelieverCharges: d.RelieverCharges || 0,

        RelieverChargesPercentage: d.RelieverChargesPercentage || 0,

        PF: d.PF || 0,

        PFPercentage: d.PFPercentage || 0,

        ESI: d.ESI || 0,

        ESIPercentage: d.ESIPercentage || 0,

        UniformCost: d.Uniform || d.UniformCost || 0,

        Uniform: d.Uniform || d.UniformCost || 0,

        Others: d.Others || 0,

        OthersPercentage: d.OthersPercentage || 0,

        AdministrationCharges: d.AdministrationCharges || 0,

        AdministrationChargesPercentage: d.AdministrationChargesPercentage || 0,

        ManagementFee: d.ManagementFee || 0,

        ManagementFeePercentage: d.ManagementFeePercentage || 0,

        ServiceFee: d.ServiceFee || 0,

        NFH: d.NFH || 0,

        Allowance: d.Allowance || 0,

        SubTotal: d.SubTotal || 0,

        TotalPlusStatutory: d.TotalPlusStatutory || 0,

        TotalDirectCost: d.TotalDirectCost || 0,

        MonthlyChargedCost: d.MonthlyChargedCost || 0

      };

    }



    return detail;

  }



  emptyDetailData() {

    this.isFollowCalendarManuallyChanged = false;
    this.isDiscountManuallyEdited = false;

    let emptyData = {

      ID: 0,

      AgreementID: 0,

      ServiceTypeID: null,

      Description: '',

      NoOfGuards: 0,

      PerDay: 0,

      PerMonth: 0,

      Rate: 0,

      NoOfHours: 8,

      NoOfDays: 0,

      FollowCalender: false,

      MonthDays: 0,
      AgreementType: 'N',

      MonthTotal: 0,

      YearTotal: 0,

      HasDiscount: false,

      DiscountAmount: 0,

      DiscountHour: 0,

      IsTaxable: true,

      TaxAmount: 0,

      total: 0,

      Category: '',

      Reason: '',

      index: -1,

      Basic: 0,

      DA: 0,

      Leaves: 0,

      LeavesPercentage: 0,

      Allowance: 0,

      Bonus: 0,

      BonusPercentage: 0,

      NFH: 0,

      PF: 0,

      PFPercentage: 0,

      ESI: 0,

      ESIPercentage: 0,

      Uniform: 0,

      ServiceFee: 0,

      HRA: 0,

      HRAPercentage: 0,

      ProfessionalTax: 0,

      RelieverCharges: 0,

      RelieverChargesPercentage: 0,

      Others: 0,

      OthersPercentage: 0,

      AdministrationCharges: 0,

      AdministrationChargesPercentage: 0,

      ManagementFee: 0,

      ManagementFeePercentage: 0,

      SubTotal: 0,

      TotalPlusStatutory: 0,

      TotalDirectCost: 0,

      MonthlyChargedCost: 0,

      CommercialBreakdown: null

    }



    this.frm.get('details')?.setValue(emptyData);

  }



  editRow(row: IItemDetails, index: any) {

    this.detailEdit = true;

    this.isFollowCalendarManuallyChanged = true;

    console.log(row);

    row['index'] = index;

    // Restore button type from stored AgreementType field
    if (row.AgreementType === 'D') {
      this.type = 'D';
    } else if (row.AgreementType === 'LS') {
      this.type = 'LS';
    } else {
      this.type = 'N';
    }

    // Apply mode-specific field states BEFORE patchValue so patchValue doesn't re-enable disabled controls
    if (this.type === 'D') {
      // District mode: disable Rate/NoOfHours
      this.frm.get('details.Rate')?.disable({ onlySelf: true });
      this.frm.get('details.NoOfHours')?.disable({ onlySelf: true });
      this.frm.get('details.FollowCalender')?.disable({ onlySelf: true });
      this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });
      this.frm.get('details.NoOfDays')?.enable({ onlySelf: true });
      this.frm.get('details.PerMonth')?.enable({ onlySelf: true });
    } else if (this.type === 'LS') {
      // Lump Sum mode: disable all inputs, only MonthTotal editable
      this.frm.get('details.PerMonth')?.disable({ onlySelf: true });
      this.frm.get('details.NoOfGuards')?.disable({ onlySelf: true });
      this.frm.get('details.Rate')?.disable({ onlySelf: true });
      this.frm.get('details.NoOfHours')?.disable({ onlySelf: true });
      this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });
      this.frm.get('details.MonthDays')?.disable({ onlySelf: true });
      this.frm.get('details.FollowCalender')?.disable({ onlySelf: true });
      this.frm.get('details.MonthTotal')?.enable({ onlySelf: true });
    } else {
      // Normal mode: enable all relevant fields
      this.frm.get('details.PerMonth')?.enable({ onlySelf: true });
      this.frm.get('details.Rate')?.enable({ onlySelf: true });
      this.frm.get('details.NoOfHours')?.enable({ onlySelf: true });
      this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });
      this.frm.get('details.NoOfDays')?.enable({ onlySelf: true });
    }

    // Patch all form values AFTER disabling — patchValue does NOT re-enable disabled controls
    // Guard: while we populate the form from saved data, DetailRowChange() must not
    // overwrite the existing MonthTotal with a freshly recalculated value.
    this.isPopulatingEditRow = true;
    this.frm.get('details')?.patchValue(row);

    // Post-patch adjustments per type
    if (this.type === 'D') {
      // Force FollowCalendar off — District does not use calendar logic
      this.frm.get('details.FollowCalender')?.setValue(false);
      this.isFollowCalendarManuallyChanged = true;
      // Auto-fill MonthDays if not set
      const existingMonthDays = parseFloat(this.frm.get('details.MonthDays')?.value) || 0;
      if (existingMonthDays === 0) {
        let dt = this.frm.get('AgreementDate')?.value;
        if (dt) {
          const d = new Date(dt);
          const autoMonthDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
          this.frm.get('details.MonthDays')?.setValue(autoMonthDays);
        }
      }
    } else if (this.type === 'LS') {
      this.frm.get('details.FollowCalender')?.setValue(false);
      this.isFollowCalendarManuallyChanged = true;
    }

    // Restore DiscountHour enable/disable state for ALL types based on saved HasDiscount value.
    // chkNormal() always disables DiscountHour on form reset, so we must re-enable it here
    // if the row being edited had HasDiscount = true — otherwise the Days field stays locked.
    if (row.HasDiscount) {
      this.frm.get('details.DiscountHour')?.enable({ onlySelf: true });
    } else {
      this.frm.get('details.DiscountHour')?.disable({ onlySelf: true });
    }

    // Mark as manually edited so DetailRowChange() does not overwrite the loaded DiscountAmount
    // with an auto-recalculated value while the user hasn't touched anything yet.
    this.isDiscountManuallyEdited = row.HasDiscount && (parseFloat(row.DiscountAmount as any) || 0) > 0;

    // Re-enable normal recalculation — the form is now fully populated with saved values.
    this.isPopulatingEditRow = false;

  }



  openCommercialDetails(row?: IItemDetails, index: number = -1) {

    // Get commercial breakdown data separately from PER HEAD data

    const commercialBreakdownData = row ? row.CommercialBreakdown || {} : {};



    // Pass existing rate/guards/days if available to the dialog

    if (row) {

      commercialBreakdownData.NoOfGuards = row.NoOfGuards;

      commercialBreakdownData.NoOfDays = row.NoOfDays;

    } else {

      commercialBreakdownData.NoOfGuards = this.frm.get('details.NoOfGuards')?.value || 1;

      commercialBreakdownData.NoOfDays = this.frm.get('details.NoOfDays')?.value || 30;

    }



    const dialogRef = this.dialog.open(CommercialBreakdownDialogComponent, {

      width: '600px',

      data: commercialBreakdownData

    });



    dialogRef.afterClosed().subscribe(result => {

      if (result) {

        if (row) {

          // Find correct index in case of sorting/filtering

          const actualIndex = this.details.indexOf(row);

          if (actualIndex >= 0) {

            // ONLY update the CommercialBreakdown field - do NOT touch Rate, MonthTotal, or any main row fields

            this.details[actualIndex] = {

              ...this.details[actualIndex],

              CommercialBreakdown: result

            };

            this.detailDataSource();

          }

        } else {

          // Only store the CommercialBreakdown in the form - do NOT change Rate or MonthTotal

          this.frm.get('details.CommercialBreakdown')?.setValue(result);

        }

      }

    });

  }



  private calculateTotal(monthTotal: number, rate: number, row: any): any {

    let vDiscount = parseFloat(row.DiscountAmount || 0);

    if (!row.HasDiscount) vDiscount = 0;

    

    let t = monthTotal - vDiscount;

    

    // Get dynamic GST rate

    let gstRate = 8; // Default fallback for loading

    const serviceTypeId = row.ServiceTypeID;

    if (serviceTypeId) {

      const selectedService = this.serviceTypes.find(st => st.Id === serviceTypeId);

      if (selectedService && selectedService.HSNCode) {

        const config = this.gstConfigList.find(c => c.hsnCode === selectedService.HSNCode);

        if (config && config.gstRate) {

          gstRate = config.gstRate;

        }

      }

    }



    if (row.IsTaxable) {

       return this.formatCurrency((t * (1 + gstRate / 100)));

    }

    return this.formatCurrency(t);

  }



  deleteRow(row: IItemDetails, index: any) {

    Swal.fire({

      title: 'Are you sure?',

      text: `Do you want to delete this service?`,

      icon: 'warning',

      showCancelButton: true,

      confirmButtonColor: '#3085d6',

      cancelButtonColor: '#d33',

      confirmButtonText: 'Yes, delete it!'

    }).then((result) => {

      if (result.isConfirmed) {

        if (row.ID != 0) {

          this.service.DeleteAgreementDetailById(row.ID + "").subscribe((d: any) => {

            console.log(d);

          });

        }

        this.details.splice(index, 1);

        this.detailDataSource();

        Swal.fire({

          toast: true,

          position: 'top',

          showConfirmButton: false,

          title: 'Deleted!',

          text: 'Service has been deleted successfully.',

          icon: 'success',

          showCloseButton: false,

          timer: 3000,

        });

      }

    });

  }



  getClientsByBranchID(value: any, onComplete?: () => void) {

    this.service.getClientsByBranchID(value).subscribe((d: any) => {

      console.log('getClientsByBranchID response:', d);

      let data = d['agreements'];

      this.clientList = d['clients'];

      // Check if data has Result property or use data directly
      let agreementsData = data['Result'] || data || [];

      console.log('Agreements data:', agreementsData);

      this.agreementDataSource = new MatTableDataSource(agreementsData);

      this.agreementDataSource.sort = this.sort;

      this.agreementDataSource.paginator = this.paginator;

      // Call callback after clientList is ready (used by loadAgreementForEdit)
      if (onComplete) onComplete();

    });

  }



  checkClientStatus() {

    if (this.frm.get("Branch")?.value != null && this.frm.get("Client")?.value != null) {



      this.service.checkClientStatus(this.frm.get("Branch")?.value, this.frm.get("Client")?.value).subscribe((d: any) => {

        if (d['Result'] == 1) {

          Swal.fire({

            toast: true,

            position: 'top',

            showConfirmButton: false,

            title: 'Error',

            text: "Client Already Inactive!!!",

            icon: 'error',

            showCloseButton: false,

            timer: 3000,

          });

          this.frm.get("Branch")?.setValue("");

          this.frm.get("Client")?.setValue("");

        }

      })

    }

  }



  chkNormal(type: string) {

    this.type = type;

    this.emptyDetailData();



    this.frm.get('details.PerMonth')?.setValue(0);

    this.frm.get('details.PerMonth')?.enable({ onlySelf: true });



    this.frm.get('details.NoOfGuards')?.setValue(0);

    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });



    this.frm.get('details.Rate')?.setValue(0);

    this.frm.get('details.Rate')?.enable({ onlySelf: true });



    this.frm.get('details.NoOfHours')?.setValue(8);

    this.frm.get('details.NoOfHours')?.enable({ onlySelf: true });



    this.frm.get('details.NoOfDays')?.setValue(0);

    this.frm.get('details.NoOfDays')?.enable({ onlySelf: true });

    // Clear MonthDays for Normal type — not used
    this.frm.get('details.MonthDays')?.setValue(0);
    this.frm.get('details.AgreementType')?.setValue('N');
    // Discount Hours disabled until checkbox is checked
    this.frm.get('details.DiscountHour')?.setValue(0);
    this.frm.get('details.DiscountHour')?.disable({ onlySelf: true });
    this.frm.get('details.DiscountAmount')?.setValue(0);
    this.frm.get('details.HasDiscount')?.setValue(false);

  }

  // District type: MonthTotal = ROUND(PerMonth / MonthDays * WorkingDays, 0)
  chkDistrict(type: string) {

    this.type = type;

    // Only reset form data if NOT currently editing an existing row
    if (!this.detailEdit) {
      this.emptyDetailData();
      this.frm.get('details.NoOfGuards')?.setValue(0);
      this.frm.get('details.PerMonth')?.setValue(0);
      this.frm.get('details.NoOfDays')?.setValue(0);
    }

    this.isFollowCalendarManuallyChanged = true;

    this.frm.get('details.PerMonth')?.enable({ onlySelf: true });

    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });

    // Auto-fill MonthDays from Agreement Date only if not already set
    const existingMonthDays = parseFloat(this.frm.get('details.MonthDays')?.value) || 0;
    if (existingMonthDays === 0) {
      let dt = this.frm.get('AgreementDate')?.value;
      if (dt) {
        const d = new Date(dt);
        const autoMonthDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        this.frm.get('details.MonthDays')?.setValue(autoMonthDays);
      }
    }

    // Disable Rate / PerDay / NoOfHours — not used for District
    this.frm.get('details.Rate')?.setValue(0);
    this.frm.get('details.Rate')?.disable({ onlySelf: true });

    this.frm.get('details.NoOfHours')?.setValue(0);
    this.frm.get('details.NoOfHours')?.disable({ onlySelf: true });

    this.frm.get('details.NoOfDays')?.enable({ onlySelf: true });
    this.frm.get('details.FollowCalender')?.setValue(false);
    this.frm.get('details.FollowCalender')?.disable({ onlySelf: true });
    this.frm.get('details.AgreementType')?.setValue('D');

    // Recalculate with existing values
    this.DetailRowChange();
  }



  // Lump Sum type: user enters MonthTotal directly; all other input columns are disabled
  chkLumpSum(type: string) {
    this.type = type;
    this.isFollowCalendarManuallyChanged = true;
    this.detailEdit = false;

    // First disable all fields, then reset values
    // Use disable() BEFORE setValue/patchValue so Angular doesn't re-enable them
    this.frm.get('details.PerMonth')?.disable({ onlySelf: true });
    this.frm.get('details.NoOfGuards')?.disable({ onlySelf: true });
    this.frm.get('details.Rate')?.disable({ onlySelf: true });
    this.frm.get('details.NoOfHours')?.disable({ onlySelf: true });
    this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });
    this.frm.get('details.MonthDays')?.disable({ onlySelf: true });
    this.frm.get('details.FollowCalender')?.disable({ onlySelf: true });
    this.frm.get('details.DiscountHour')?.disable({ onlySelf: true });

    // MonthTotal is enabled — user enters the lump sum amount directly
    this.frm.get('details.MonthTotal')?.enable({ onlySelf: true });

    // Now reset values using patchValue (does NOT re-enable disabled controls)
    this.frm.get('details')?.patchValue({
      ID: 0,
      AgreementID: 0,
      ServiceTypeID: null,
      Description: '',
      NoOfGuards: 0,
      PerDay: 0,
      PerMonth: 0,
      Rate: 0,
      NoOfHours: 0,
      NoOfDays: 0,
      FollowCalender: false,
      MonthDays: 0,
      AgreementType: 'LS',
      MonthTotal: 0,
      YearTotal: 0,
      HasDiscount: false,
      DiscountAmount: 0,
      DiscountHour: 0,
      IsTaxable: true,
      TaxAmount: 0,
      total: 0,
      Category: '',
      Reason: '',
      index: -1
    });
  }

  set8Hours() {
    this.frm.get('details.NoOfHours')?.setValue(8);
    this.DetailRowChange();
  }

  set12Hours() {
    this.frm.get('details.NoOfHours')?.setValue(12);
    this.DetailRowChange();
  }

  chkDogService(type: string) {

    this.type = type;

    this.emptyDetailData();

    // NoOfGuards



    this.frm.get('details.NoOfGuards')?.setValue(0);

    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });



    this.frm.get('details.Rate')?.setValue(0);

    this.frm.get('details.Rate')?.enable({ onlySelf: true });



    this.frm.get('details.NoOfHours')?.setValue(0);

    this.frm.get('details.NoOfHours')?.disable({ onlySelf: true });



    this.frm.get('details.NoOfDays')?.setValue(0);

    this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });



    this.frm.get('details.Description')?.setValue("DOG::");

  }



  chkTrip(type: string) {

    this.type = type;

    this.emptyDetailData();



    this.frm.get('details.NoOfGuards')?.setValue(0);

    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });



    this.frm.get('details.Rate')?.setValue(0);

    this.frm.get('details.Rate')?.enable({ onlySelf: true });



    this.frm.get('details.NoOfHours')?.setValue(0);

    this.frm.get('details.NoOfHours')?.disable({ onlySelf: true });



    this.frm.get('details.NoOfDays')?.setValue(0);

    this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });



    this.frm.get('details.Description')?.setValue("TRIP::");

  }



  chkBag(type: string) {

    this.type = type;

    this.emptyDetailData();



    this.frm.get('details.NoOfGuards')?.setValue(0);

    this.frm.get('details.NoOfGuards')?.enable({ onlySelf: true });



    this.frm.get('details.Rate')?.setValue(0);

    this.frm.get('details.Rate')?.enable({ onlySelf: true });



    this.frm.get('details.NoOfHours')?.setValue(0);

    this.frm.get('details.NoOfHours')?.disable({ onlySelf: true });



    this.frm.get('details.NoOfDays')?.setValue(0);

    this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });



    this.frm.get('details.Description')?.setValue("BAG::");

  }



  chkHour(type: string) {

    this.type = type;

    this.emptyDetailData();

    this.frm.get('details.NoOfGuards')?.setValue(0);

    this.frm.get('details.NoOfGuards')?.disable({ onlySelf: true });



    this.frm.get('details.Rate')?.setValue(0);

    this.frm.get('details.Rate')?.enable({ onlySelf: true });



    this.frm.get('details.NoOfDays')?.setValue(0);

    this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });



    this.frm.get('details.NoOfHours')?.setValue(8);

    this.frm.get('details.NoOfHours')?.enable({ onlySelf: true });



    this.frm.get('details.Description')?.setValue("HOUR::");

  }



  changeFollowCalender(event: any) {

    this.isFollowCalendarManuallyChanged = true;

    let dt = this.frm.get('AgreementDate')?.value;



    const currentDate = new Date(dt);

    const currentMonth = currentDate.getMonth();

    const currentYear = currentDate.getFullYear();



    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();



    if (event.checked) {

      this.frm.get('details.NoOfDays')?.setValue(lastDayOfMonth);

      this.frm.get('details.NoOfDays')?.disable({ onlySelf: true });

    } else {

      this.frm.get('details.NoOfDays')?.setValue(lastDayOfMonth);

      this.frm.get('details.NoOfDays')?.enable({ onlySelf: true });

    }



    this.DetailRowChange();

  }



  onPerDayChange(): void {

    const perDay = parseFloat(this.frm.get('details.PerDay')?.value || 0);

    

    if (perDay > 0) {

      this.frm.get('details.Rate')?.setValue(this.formatCurrency(perDay));

      this.DetailRowChange();

    }

  }



  onPerMonthChange(): void {

    // District mode: PerMonth input just triggers recalculation — no PerDay/Rate derivation needed
    if (this.type === 'D') {
      // User explicitly changed PerMonth — allow MonthTotal to recalculate
      this.detailEdit = false;
      this.DetailRowChange();
      return;
    }

    // Lump Sum mode: PerMonth is disabled; ignore any stray calls
    if (this.type === 'LS') {
      return;
    }

    const perMonth = parseFloat(this.frm.get('details.PerMonth')?.value || 0);

    let noOfDays = parseFloat(this.frm.get('details.NoOfDays')?.value || 0);

    const noOfHours = parseFloat(this.frm.get('details.NoOfHours')?.value || 8);



    if (perMonth > 0) {

      // Auto-set NoOfDays from agreement date calendar if not already set
      if (noOfDays === 0) {

        let dt = this.frm.get('AgreementDate')?.value;

        const currentDate = new Date(dt);

        const currentYear = currentDate.getFullYear();

        const currentMonth = currentDate.getMonth();

        noOfDays = new Date(currentYear, currentMonth + 1, 0).getDate();

        this.frm.get('details.NoOfDays')?.setValue(noOfDays);

        this.frm.get('details.FollowCalender')?.setValue(true);

      }



      // Calculate PerDay and Rate from PerMonth
      if (noOfDays > 0) {

        const perDay = perMonth / noOfDays;

        this.frm.get('details.PerDay')?.setValue(this.formatCurrency(perDay));

        const perHour = perDay / noOfHours;

        this.frm.get('details.Rate')?.setValue(this.formatCurrency(perHour));

      }



      // DetailRowChange now uses PerMonth x NoOfGuards for MonthTotal
      this.DetailRowChange();

    }

  }



  onNoOfHoursChange(): void {

    const perDay = parseFloat(this.frm.get('details.PerDay')?.value || 0);

    const noOfHours = parseFloat(this.frm.get('details.NoOfHours')?.value || 8);



    if (perDay > 0 && noOfHours > 0) {

      // Recalculate per hour rate when working hours change
      const perHour = perDay / noOfHours;

      this.frm.get('details.Rate')?.setValue(this.formatCurrency(perHour));



      this.DetailRowChange();

    }

  }

  onDiscountAmountManualEdit(): void {
    // User manually edited Discounted amount — skip auto-calc from Days
    this.isDiscountManuallyEdited = true;
    this.DetailRowChange();
  }

  onDiscountHourChange(): void {
    // Days changed — reset manual flag so auto-calc takes over again
    this.isDiscountManuallyEdited = false;
    // Trigger DetailRowChange to recalculate discount based on Working Days - Discount Days
    this.DetailRowChange();
  }

  /** Called when NoOfGuards input changes.
   *  User explicitly changed a MonthTotal-driving field — allow recalculation. */
  onNoOfGuardsChange(): void {
    this.detailEdit = false;
    this.DetailRowChange();
  }

  /** Called when NoOfDays (Working Days) input changes.
   *  User explicitly changed a MonthTotal-driving field — allow recalculation. */
  onNoOfDaysChange(): void {
    this.detailEdit = false;
    this.DetailRowChange();
  }

  /** Called when MonthDays input changes (District type only).
   *  User explicitly changed a MonthTotal-driving field — allow recalculation. */
  onMonthDaysChange(): void {
    this.detailEdit = false;
    this.DetailRowChange();
  }

  onDiscountCheckboxChange(event: any): void {
    if (!event.checked) {
      // Clear discount values when checkbox is unchecked
      this.frm.get('details.DiscountAmount')?.setValue(0);
      this.frm.get('details.DiscountHour')?.setValue(0);
      if (this.type !== 'LS') {
        this.frm.get('details.DiscountHour')?.disable({ onlySelf: true });
      }
    } else {
      // Enable Days input when discount is checked (Normal/District only)
      if (this.type !== 'LS') {
        this.frm.get('details.DiscountHour')?.enable({ onlySelf: true });
      }
    }
    this.DetailRowChange();
  }

  get hasDiscount(): boolean {
    return this.frm.get('details.HasDiscount')?.value || false;
  }



  // Helper function to get actual days in a month
  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  DetailRowChange(): void {



    const _description = this.frm.get('details.Description')?.value;



    if (_description != "") {

      this.errorDescription = "";

    } else {

      this.errorDescription = "Enter the type";

    }



    let dt = this.frm.get('AgreementDate')?.value;



    const currentDate = new Date(dt);



    const currentYear = currentDate.getFullYear();

    const currentMonth = currentDate.getMonth();

    // Get actual days in the selected month
    const daysInMonth = this.getDaysInMonth(currentYear, currentMonth);



    let vMonthTotal = 0;

    //

    const tNoOfGuards = this.frm.get('details.NoOfGuards')?.value;

    const tPerMonth = this.frm.get('details.PerMonth')?.value;

    const tPerDay = this.frm.get('details.PerDay')?.value;

    const tNoOfHours = this.frm.get('details.NoOfHours')?.value;

    const tNoOfDays = this.frm.get('details.NoOfDays')?.value;



    // Skip auto-FollowCalendar logic for District type
    if (this.type !== 'D' && tNoOfHours > 0 && tNoOfHours <= 8 && !this.isFollowCalendarManuallyChanged) {

      if (!this.frm.get('details.FollowCalender')?.value) {

        this.frm.get('details.FollowCalender')?.setValue(true);

        this.changeFollowCalender({ checked: true });

        return;

      }

    }



    // Check Follow Calendar flag to determine calculation method
    const followCalendar = this.frm.get('details.FollowCalender')?.value;

    if (this.type === 'D') {
      // District type: MonthTotal = ROUND(PerMonth / MonthDays * WorkingDays, 0)
      const perMonth = parseFloat(tPerMonth) || 0;
      const noOfDays = parseFloat(tNoOfDays) || 0;
      const monthDays = parseFloat(this.frm.get('details.MonthDays')?.value) || daysInMonth;
      // Calculate PerDay = PerMonth / MonthDays and save it to the form field
      const perDayCalc = monthDays > 0 ? perMonth / monthDays : 0;
      this.frm.get('details.PerDay')?.setValue(this.formatCurrency(perDayCalc));
      if (this.isPopulatingEditRow || this.detailEdit) {
        // editRow() is loading a saved row, OR the user is editing an existing row
        // (e.g. clicking Discount, changing Tax) — preserve the saved MonthTotal instead of
        // recalculating it. Read the current form value so downstream
        // YearTotal / Discount / Tax calculations still use the correct base.
        vMonthTotal = parseFloat(this.frm.get('details.MonthTotal')?.value) || 0;
      } else {
        vMonthTotal = Math.round(perMonth / monthDays * noOfDays);
        this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(vMonthTotal));
      }
    } else if (parseFloat(tPerMonth) > 0 && this.type !== 'LS') {
      if (followCalendar) {
        // Follow Calendar = true: Use full month rate
        if (parseInt("0" + tNoOfGuards, 10) === 0) {
          vMonthTotal = parseFloat(tPerMonth) || 0;
        } else {
          vMonthTotal = parseFloat(tNoOfGuards) * parseFloat(tPerMonth);
        }
      } else {
        // Follow Calendar = false: Calculate based on actual working days
        const perDayRate = parseFloat(tPerMonth) / daysInMonth; // Actual days in selected month
        if (parseInt("0" + tNoOfGuards, 10) === 0) {
          vMonthTotal = perDayRate * parseFloat(tNoOfDays);
        } else {
          vMonthTotal = parseFloat(tNoOfGuards) * perDayRate * parseFloat(tNoOfDays);
        }
      }
      if (this.isPopulatingEditRow || this.detailEdit) {
        // editRow() is loading a saved row, OR the user is editing an existing row —
        // preserve the saved MonthTotal.
        vMonthTotal = parseFloat(this.frm.get('details.MonthTotal')?.value) || 0;
      } else {
        this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(Math.round(vMonthTotal)));
      }
    } else if (this.type == 'S') {

      console.log("tNoOfGuards" + tNoOfGuards);

      console.log("tPerDay" + tPerDay);

      vMonthTotal = tNoOfGuards * tPerDay;

      this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(Math.round(vMonthTotal)));

    } else if (this.type == 'H') {

      vMonthTotal = tNoOfHours * tPerDay;

      this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(Math.round(vMonthTotal)));

    } else if (this.type === 'LS') {

      // Lump Sum: MonthTotal is entered directly by user — read it as-is
      vMonthTotal = parseFloat(this.frm.get('details.MonthTotal')?.value) || 0;

    } else {

      vMonthTotal = parseFloat(this.frm.get('details.MonthTotal')?.value);

    }



    // Round vMonthTotal to avoid floating-point precision errors before calculating Year Total
    vMonthTotal = Math.round(vMonthTotal);

    this.frm.get('details.YearTotal')?.setValue(Math.round(vMonthTotal * 12));



    // Calculate DiscountAmount
    if (this.frm.get('details.HasDiscount')?.value) {
      const discountDays = parseFloat(this.frm.get('details.DiscountHour')?.value || '0');
      if (discountDays > 0 && !this.isDiscountManuallyEdited) {
        // Auto-calculate from Days: DiscountAmount = PerMonth / WorkingDays * DiscountDays
        const perMonthVal = parseFloat(tPerMonth) || 0;
        // For District type the per-day rate is PerMonth / MonthDays (calendar days),
        // which is the same divisor used for MonthTotal.  Using tNoOfDays (working days)
        // here would inflate the per-day rate and produce an incorrect discount amount.
        const workingDays = this.type === 'D'
          ? (parseFloat(this.frm.get('details.MonthDays')?.value) || daysInMonth)
          : (parseFloat(tNoOfDays) || parseFloat(this.frm.get('details.MonthDays')?.value) || daysInMonth);
        if (perMonthVal > 0 && workingDays > 0) {
          const autoDiscount = (perMonthVal / workingDays) * discountDays;
          this.frm.get('details.DiscountAmount')?.setValue(this.formatCurrency(autoDiscount));
        }
      }
      // If Days = 0, keep whatever is in DiscountAmount (manual entry)
    } else {
      this.frm.get('details.DiscountAmount')?.setValue(0);
    }

    let vDiscount = parseFloat(this.frm.get('details.DiscountAmount')?.value || '0');



    let gstRate = 18; // Default fallback

    const serviceTypeId = this.frm.get('details.ServiceTypeID')?.value;

    if (serviceTypeId) {

      const selectedService = this.serviceTypes.find(st => st.Id === serviceTypeId);

      if (selectedService && selectedService.HSNCode) {

        const config = this.gstConfigList.find(c => c.hsnCode === selectedService.HSNCode);

        if (config && config.gstRate) {

          gstRate = config.gstRate;

        }

      }

    }



    let branchState = '';

    let clientState = '';

    if (this.branchList && this.clientList) {

      const branchObj = this.branchList.find((x: any) => x.Code === this.frm.get('Branch')?.value);

      const clientObj = this.clientList.find((x: any) => x.Code === this.frm.get('Client')?.value);

      branchState = branchObj?.State || branchObj?.state || '';

      clientState = clientObj?.State || clientObj?.state || '';

    }



    if (this.frm.get('details.IsTaxable')?.value) {

      const taxAmt = (vMonthTotal - vDiscount) * (gstRate / 100);

      this.frm.get('details.TaxAmount')?.setValue(

        this.formatCurrency(taxAmt)

      );

    } else {

      this.frm.get('details.TaxAmount')?.setValue(0);

    }



    const tTaxAmount = parseFloat(this.frm.get('details.TaxAmount')?.value || '0');

    this.frm.get('details.total')?.setValue(this.formatCurrency(vMonthTotal - vDiscount + tTaxAmount));

  }



  SetNoOfDays(): void {

    let i = 31;



    for (i = 31; i >= 1; i--) {

      const vNewDate = new Date(this.frm.get('AgreementDate')?.value);

      vNewDate.setDate(i);



      if (vNewDate.getDate() === i) {

        break;

      }

    }



    this.frm.get('details.NoOfDays')?.setValue(i.toString());

    this.DetailRowChange();

  }

  handleErrors(error: string) {

    if (error != null && error != '') {

      this.errorMessage = error;

      this.hideLoadingSpinner();

    }

  }

  hideLoadingSpinner() {

    this.showLoadingSpinner = false

  }

  private formatCurrency(value: number): string {

    // Implement your currency formatting logic here

    return value.toFixed(2);

  }



  cancel() {

    this.route.navigate(['/quotation-and-agreement/agreements']);

  }



  loadQuotationData(quotationID: any) {

    this.showLoadingSpinner = true;

    this._quotationService.getQuotationByID(quotationID).subscribe({

      next: (res: any) => {

        let result = res['Result'] || res;

        let quotation = result.quotation || result.Agreement || result;

        let quotationDetails = result.details || result.quotationDetails || result.agreementDetails || [];



        // Pre-fill form (Branch, Client, WorkPlace)

        this.frm.patchValue({

          Branch: quotation.Branch,

          Client: quotation.Client,

          WorkPlace: quotation.WorkPlace

        });



        // Ensure client list is loaded for the selected branch

        if (quotation.Branch) {

          this.getClientsByBranchID(quotation.Branch);

        }



        // Map Quotation Details to Agreement Details

        this.details = quotationDetails.map((qd: any) => {

          const detail = this.mapItemDetails(qd);

          detail.ID = 0; // New Agreement

          detail.AgreementID = 0;

          return detail;

        });



        this.detailDataSource();

        this.hideLoadingSpinner();

      },

      error: (err: any) => {

        this.handleErrors(err);

        Swal.fire('Error', 'Failed to load quotation data', 'error');

      }

    });

  }



  exportToPDF(save: boolean = true) {

    const branchCode = this.frm.get('Branch')?.value;

    const clientCode = this.frm.get('Client')?.value;

    const branchObj = this.branchList?.find((b: any) => b.Code == branchCode);

    const clientObj = this.clientList?.find((c: any) => c.Code == clientCode);



    const date = this.frm.get('AgreementDate')?.value || new Date();

    this._pdfService.exportAgreementPDF(this.details, branchObj, clientObj, this.serviceTypes, 'N/A', date, save);

  }

}





