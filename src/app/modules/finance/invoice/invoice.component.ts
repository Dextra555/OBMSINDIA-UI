import { Component, AfterViewInit, ViewChild } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatDialog } from '@angular/material/dialog';

import { MatPaginator } from '@angular/material/paginator';

import { MatTableDataSource } from '@angular/material/table';

import { MatSort, Sort } from '@angular/material/sort';

import { LiveAnnouncer } from '@angular/cdk/a11y';

import { EditInvoiceComponent } from './edit-invoice/edit-invoice.component';

import { FinanceService } from "../../../service/finance.service";

import { from } from "rxjs";

// import {environment, TAX} from "src/environments/environment";

import Swal from "sweetalert2";

import { Router } from "@angular/router";

import { TAX } from 'src/app/model/TAXModel';

import { DatasharingService } from "../../../service/datasharing.service";

import { UserAccessModel } from 'src/app/model/userAccesModel';

import { MastermoduleService } from 'src/app/service/mastermodule.service';



export interface PeriodicElement {

  Name: string,

}





@Component({

  selector: 'app-invoice',

  templateUrl: './invoice.component.html',

  styleUrls: ['./invoice.component.css']

})

export class InvoiceComponent implements AfterViewInit {

  displayedColumns: string[] = ['actions', 'Name',];

  dataSource = new MatTableDataSource<PeriodicElement>();



  frm!: FormGroup

  client: any;

  branchList: any;

  agreement: any;

  agreementDetails: any;

  DiscountAmount: any = 0;

  TaxAmount: any = 0;

  ServiceCharges: any = 0;

  NoOfHours: any = 0;

  Total: any = 0;

  currentUser: string = '';

  details: any = [];

  userAccessModel!: UserAccessModel;

  warningMessage: string = '';

  errorMessage: string = '';

  showLoadingSpinner: boolean = false;



  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, private service: FinanceService, private route: Router, private _dataService: DatasharingService, private _masterService: MastermoduleService) {

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

    this.getUserAccessRights(this.currentUser, 'Invoice');



    this.frm = this.fb.group({

      ID: [0],

      invoice_period: [Validators.required],

      branch: ['', Validators.required],

      invoice_no: [''],

      info: [''],

      service_charge: [''],

      discount: [''],

      tax: [''],

      total: [''],

      note: [''],



    });

  }



  getUserAccessRights(userName: string, screenName: string) {

    this._masterService.getUserAccessRights(userName, screenName).subscribe(

      (data) => {

        if (data != null) {

          this.showLoadingSpinner = true;

          this.userAccessModel.readAccess = data.Read

          this.userAccessModel.deleteAccess = data.Delete;

          this.userAccessModel.updateAccess = data.Update;

          this.userAccessModel.createAccess = data.Create;



          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {

            this.warningMessage = '';

            this.service.getInvoiceMaster(this.currentUser).subscribe((d: any) => {

              this.branchList = d['branchList'];

            })

            this.hideLoadingSpinner()

          } else {

            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>

                      You do not have permissions to view this page. <br>

                      If you feel you should have access to this page, Please contact administrator. <br>

                      Thank you`;

            this.hideLoadingSpinner()

          }

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



  @ViewChild(MatPaginator)

  paginator!: MatPaginator;

  @ViewChild(MatSort)

  sort!: MatSort;



  ngAfterViewInit() {

    this.dataSource.paginator = this.paginator;

    this.dataSource.sort = this.sort;

  }



  announceSortChange(sortState: Sort) {

    if (sortState.direction) {

      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);

    } else {

      this._liveAnnouncer.announce('Sorting cleared');

    }

  }



  editInvoice() {

    if (!this.client || this.client?.ID == 0) {

      Swal.fire({

        toast: true,

        position: 'top',

        showConfirmButton: false,

        title: 'Error',

        text: "Select Saved Client Invoice",

        icon: 'error',

        showCloseButton: false,

        timer: 3000,

      });

      return

    }

    const dialogRef = this.dialog.open(EditInvoiceComponent, {

      disableClose: true,

      data: {

        client: this.client,

        agreementDetails: this.agreementDetails,

        agreement: this.agreement,

      },

      panelClass: ['wlt-c-lg-admin-dialog', 'animate__animated', 'animate__slideInDown'],

      width: '900px',

      //  position: { right: '0'}

    });



    dialogRef.afterClosed().subscribe(client => {

      this.getClientInvoiceById(client);

    });

  }



  setDatasource(d: any) {

    this.dataSource = new MatTableDataSource(d);

    this.dataSource.sort = this.sort;

    this.dataSource.paginator = this.paginator;

  }



  getClients() {



    // Being Charges for Security Services for the month of October 2023



    if (this.frm.get("invoice_period")?.value != "") {

      let dateStr = this.returnMonthAndYear(this.frm.get("invoice_period")?.value)

      this.frm.get('info')?.setValue("Being Charges for Security Services for the month of " + dateStr);

      this.frm.get('note')?.setValue("Being Charges for Security Services for the month of " + dateStr);

    }





    if (this.frm.get("branch")?.value != "" && this.frm.get("invoice_period")?.value != "") {

      let branch = this.frm.get("branch")?.value;

      let invoicePeriod = this.returnDate(this.frm.get("invoice_period")?.value);



      this.service.getClients(branch, invoicePeriod).subscribe((d: any) => {

        this.setDatasource(d);

      });



      this.frm.get('service_charge')?.setValue("");

      this.frm.get('discount')?.setValue("");

      this.frm.get('tax')?.setValue("");

      this.frm.get('total')?.setValue("");



      this.DiscountAmount = 0;

      this.TaxAmount = 0;

      this.ServiceCharges = 0;

      this.NoOfHours = 0;

      this.Total = 0;

    }



  }



  getAgreement(client: any) {

    let branch = this.frm.get("branch")?.value;

    this.client = client;

    let invoicePeriod = this.returnDate(this.frm.get("invoice_period")?.value);

    this.service.getAgreement(branch, invoicePeriod, client?.Code).subscribe((d: any) => {

      console.log('Received Agreement Data:', d);

      console.log('Agreement ID:', d?.agreement?.ID, 'Date:', d?.agreement?.AgreementDate);

      this.frm.get("invoice_no")?.setValue(d?.invoiceNo);

      this.agreementDetails = d['agreementDetails'];

      this.agreement = d['agreement'];

      this.calculation();

    }, (error: any) => {
      Swal.fire({
        title: 'Error',
        text: error,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    })

  }



  getClientInvoiceById(client: any) {

    this.client = client;

    this.service.getClientInvoiceById(client.ID).subscribe((d: any) => {

      console.log(d);

      this.agreementDetails = d['details'];

      this.agreement = d['invoice'];

      this.frm.patchValue(this.agreement);

      this.frm.get("invoice_no")?.setValue(this.agreement?.InvoiceNo);

      this.calculation();

    })

  }



  calculation() {



    this.ServiceCharges = 0;

    this.DiscountAmount = 0;

    this.TaxAmount = 0;

    this.Total = 0;



    let invoice_period = this.frm.get('invoice_period')?.value

    let daysInMonth = 0;

    let agreementPeriod = new Date(invoice_period);

    let forDaysInMonth = new Date(invoice_period);

    forDaysInMonth.setMonth(forDaysInMonth.getMonth() + 1);

    forDaysInMonth.setDate(0);



    daysInMonth = forDaysInMonth.getDate();

    this.agreementDetails.forEach((d: any) => {

      let agreementPeriodDate = new Date(d.AgreementDate);

      if (d.FollowCalendar) {

        d.NoOfDays = daysInMonth;

      } else {

        if ((agreementPeriodDate.getMonth() == agreementPeriod.getMonth()) && (agreementPeriodDate.getFullYear() == agreementPeriod.getFullYear())) {

          if (!((agreementPeriod.getDay() == daysInMonth) && (agreementPeriodDate.getDay() == 1))) {

            if ((d.NoOfDays > (agreementPeriod.getDay() - agreementPeriodDate.getDay() + 1))) {

              d.NoOfDays = d.NoOfDays;

            } else {

              d.NoOfDays = (agreementPeriod.getDay() - agreementPeriodDate.getDay() + 1);

            }

          }

        }

      }



      // Use MonthTotal from agreement to match agreement calculation exactly
      this.ServiceCharges += d.MonthTotal;



      this.NoOfHours += d.NoOfHours * d.NoOfGuards * d.NoOfDays;

      if (d.HasDiscount) {

        this.DiscountAmount += d.DiscountAmount;

      }



      if (d.IsTaxable) {

        const taxRate = 0.18; // 18% GST

        this.TaxAmount += (d.MonthTotal - d.DiscountAmount) * taxRate;

      }



    });



    this.ServiceCharges = Math.round(this.ServiceCharges);
    this.DiscountAmount = Math.round(this.DiscountAmount);
    this.TaxAmount = Math.round(this.TaxAmount);
    this.Total = Math.round(this.ServiceCharges - this.DiscountAmount + this.TaxAmount);



    this.frm.get('service_charge')?.setValue(this.ServiceCharges);

    this.frm.get('discount')?.setValue(this.DiscountAmount);

    this.frm.get('tax')?.setValue(this.TaxAmount);

    this.frm.get('total')?.setValue(this.Total);

  }



  returnDate(date?: any) {

    let currentDate = new Date();

    if (date) {

      currentDate = new Date(date);

    }



    const year = currentDate.getFullYear();

    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based

    const day = String(currentDate.getDate()).padStart(2, '0');



    return `${year}-${month}-${day}`;

  }



  returnMonthAndYear(date?: any) {

    let currentDate = new Date();

    if (date) {

      currentDate = new Date(date);

    }



    const year = currentDate.getFullYear();

    const month = currentDate.getMonth() + 1;





    const monthString = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1, 1));

    return `${monthString} ${year}`;

  }



  setAgreementDetail(d: any) {

    let obj = {

      ID: 0,

      AgreementDetailID: d.ID,

      AgreementID: d.AgreementID,

      AgreementDate: d.AgreementDate,

      NoOfGuards: d.NoOfGuards,

      Rate: d.Rate,

      NoOfHours: d.NoOfHours,

      NoOfDays: d.NoOfDays,

      FollowCalender: d.FollowCalender,

      HasDiscount: d.HasDiscount,

      DiscountAmount: d.DiscountAmount,

      IsTaxable: d.IsTaxable,

      TaxAmount: d.TaxAmount,

      Description: d.Description,

      MonthTotal: d.MonthTotal,

    }



    this.details.push(obj);

  }



  setAgreementDetailFromSavedInvoice(d: any) {



    let obj = {

      ID: d.ID,

      AgreementDetailID: d.AgreementDetailID,

      AgreementID: d.AgreementID,

      AgreementDate: d.AgreementDate,

      NoOfGuards: d.NoOfGuards,

      Rate: d.Rate,

      NoOfHours: d.NoOfHours,

      NoOfDays: d.NoOfDays,

      FollowCalender: d.FollowCalender,

      HasDiscount: d.HasDiscount,

      DiscountAmount: d.DiscountAmount,

      IsTaxable: d.IsTaxable,

      TaxAmount: d.TaxAmount,

      Description: d.Description,

      MonthTotal: d.MonthTotal,

    }



    this.details.push(obj);

  }



  onSubmit() {

    if (this.frm.invalid) {

      return;



    }



    this.details = [];

    this.agreementDetails.forEach((d: any) => {

      if (this.client.ID != 0) {

        this.setAgreementDetailFromSavedInvoice(d);

      } else {

        this.setAgreementDetail(d);

      }

    });



    let data = this.frm.getRawValue();



    data['InvoiceNo'] = (this.frm.get("invoice_no")?.value || "").toString();

    data['InvoiceDate'] = this.returnDate(this.frm.get("invoice_period")?.value);

    data['Subject'] = this.frm.get("info")?.value ?? "-";

    data['ServiceCharges'] = this.ServiceCharges;

    data['Discount'] = this.DiscountAmount;

    data['TaxAmount'] = this.TaxAmount;

    data['Note'] = this.frm.get("note")?.value ?? "-";

    data['Branch'] = this.frm.get("branch")?.value;

    data['Client'] = this.client?.Code;

    data['AgreementID'] = this.agreement.ID;

    data['details'] = this.details;



    console.log(data);



    this.service.saveInvoice(data).subscribe((d: any) => {

      console.log(d);





      Swal.fire({

        toast: true,

        position: 'top',

        showConfirmButton: false,

        title: 'Success',

        text: "Invoice Saved successfully",

        icon: 'success',

        showCloseButton: false,

        timer: 3000,

      });

      this.route.navigate(['/finance/invoice']);

      this.frm.reset();

      this.details = [];

      this.setDatasource([]);

      this.printView(d['agreement']['ID']);

    })

  }



  printView(invoiceId: number) {

    this.route.navigate(['/report/finance/print-invoice-computer-generated'], { queryParams: { invoiceId: invoiceId }, queryParamsHandling: 'merge' });

  }



  deleteInvoice() {

    let data = this.frm.getRawValue();

    if (!data['ID'] || data['ID'] === 0) {

      Swal.fire({

        toast: true,

        position: 'top',

        showConfirmButton: false,

        title: 'Warning',

        text: 'No invoice selected to delete.',

        icon: 'warning',

        showCloseButton: false,

        timer: 3000,

      });

      return;

    }

    this.service.deleteInvoice(data['ID']).subscribe((d: any) => {

      console.log(d);



      Swal.fire({

        toast: true,

        position: 'top',

        showConfirmButton: false,

        title: 'Success',

        text: "Invoice Deleted successfully",

        icon: 'success',

        showCloseButton: false,

        timer: 3000,

      });

      this.route.navigate(['/finance/invoice']);

      this.frm.reset();

      this.details = [];

      this.setDatasource([]);

    })

  }



  handleErrors(error: string) {

    if (error != null && error != '') {

      this.errorMessage = error;

      this.hideLoadingSpinner()

    }

  }

  hideLoadingSpinner() {

    this.showLoadingSpinner = false

  }

}

