import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { MatPaginator } from '@angular/material/paginator';

import { MatTableDataSource } from '@angular/material/table';

import { MatSort, Sort } from '@angular/material/sort';

import { LiveAnnouncer } from '@angular/cdk/a11y';

import { TAX } from "../../../../model/TAXModel";

import Swal from "sweetalert2";

import { FinanceService } from "../../../../service/finance.service";



export interface PeriodicElement {

  ID: number,

  ClientInvoiceID: number,

  AgreementDetailID: number,

  AgreementDate: any,

  AgreementID: number,

  NoOfGuards: number,

  Rate: number,

  NoOfHours: number,

  NoOfDays: number,

  FollowCalender: boolean,

  Description: string,

  MonthTotal: number

  HasDiscount: boolean,

  DiscountAmount: number,

  IsTaxable: boolean,

  TaxAmount: number

  index: number

}





@Component({

  selector: 'app-edit-invoice',

  templateUrl: './edit-invoice.component.html',

  styleUrls: ['./edit-invoice.component.css']

})

export class EditInvoiceComponent implements AfterViewInit {

  displayedColumns: string[] = ['ID', 'ClientInvoiceID', 'Description', 'NoOfGuards', 'Rate', 'NoOfHours', 'NoOfDays', 'IsTaxable', 'action'];

  // dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);

  dataSource = new MatTableDataSource<PeriodicElement>();

  frm!: FormGroup

  errorDescription: string = "";

  details: PeriodicElement[] = [];

  detailEdit: boolean = false;

  invoice: any;

  DiscountAmount: any = 0;

  TaxAmount: any = 0;

  ServiceCharges: any = 0;

  NoOfHours: any = 0;

  Total: any = 0;

  agreementDetails: any;



  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer, @Inject(MAT_DIALOG_DATA) public info: any, public dialogRef: MatDialogRef<EditInvoiceComponent>, private service: FinanceService) {



    console.log(info);

    this.invoice = info['agreement'];

    this.agreementDetails = info['agreementDetails'];



    this.frm = this.fb.group({



      ID: [],

      InvoiceNo: [],

      InvoiceDate: [],

      Subject: [],

      ServiceCharges: [],

      Discount: [],

      TaxAmount: [],

      Note: [],

      Branch: [],

      Client: [],

      AgreementID: [],

      details: this.fb.group({

        ID: [0],

        ClientInvoiceID: [0],

        AgreementDate: [],

        AgreementDetailID: [0],

        AgreementID: [0],

        NoOfGuards: [0],

        Rate: [0],

        NoOfHours: [0],

        NoOfDays: [0],

        FollowCalender: [false],

        Description: [''],

        MonthTotal: [0],

        HasDiscount: [false],

        DiscountAmount: [0],

        IsTaxable: [false],

        TaxAmount: [0],

        index: [-1]

      }),

    });





    // this.frm = this.fb.group({

    //   ID: [0],

    //   NoOfGuards: [''],

    //   Rate: [''],

    //   NoOfHours: [''],

    //   NoOfDays: [''],

    //   IsTaxable: [''],

    //   Note: [],

    // })



    this.frm.patchValue(this.invoice);

    this.agreementDetails.forEach((d: any) => {

      this.details.push(d);

    });

    this.detailDataSource();

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



  emptyDetailData() {

    let emptyData = {

      ID: 0,

      ClientInvoiceID: this.invoice['ID'],

      AgreementDetailID: 0,

      AgreementDate: '',

      AgreementID: 0,

      NoOfGuards: 0,

      Rate: 0,

      NoOfHours: 0,

      NoOfDays: 0,

      FollowCalender: false,

      Description: '',

      MonthTotal: 0,

      HasDiscount: false,

      DiscountAmount: 0,

      IsTaxable: false,

      TaxAmount: 0,

      index: -1

    }



    this.frm.get('details')?.setValue(emptyData);

  }



  addItemDetails(action: string) {

    this.DetailRowChange();

    let frmData = this.frm.getRawValue();

    let details = frmData['details'];



    details['ClientInvoiceID'] = this.invoice['ID'];

    details['MonthTotal'] = parseFloat(details['MonthTotal']);

    details['TaxAmount'] = parseFloat(details['TaxAmount']);

    // if (details['index'] == -1 && action == 'add') {

    if (action == 'add') {

      details['ID'] = 0;

      this.details.push(details);

    } else if (details['index'] >= 0 && action == 'update') {

      this.details[details['index']] = details;

    }

    this.detailDataSource();



    this.detailEdit = false;

    this.emptyDetailData();

  }



  editRow(row: PeriodicElement, index: any) {

    this.detailEdit = true;

    console.log(row);

    row['index'] = index;

    this.frm.get('details')?.patchValue(row);

  }



  deleteRow(row: PeriodicElement, index: any) {

    let localRow = row.ID;

    this.details.splice(index, 1);

    if (row.ID != 0) {

      this.calculation();



      let data = this.frm.getRawValue();



      data['details'] = [];



      data['ServiceCharges'] = this.ServiceCharges;

      data['Discount'] = this.DiscountAmount;

      data['TaxAmount'] = this.TaxAmount;

      data['DeletedDetailID'] = localRow;



      this.service.DeleteInvoiceDetailById(data).subscribe((d: any) => {

        console.log(d);

      })

    }

    this.detailDataSource();



  }



  detailDataSource() {

    this.dataSource = new MatTableDataSource(this.details);

    this.dataSource.sort = this.sort;

    this.dataSource.paginator = this.paginator;

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



    let vMonthTotal = 0;

    //

    const tNoOfGuards = this.frm.get('details.NoOfGuards')?.value;

    const tRate = this.frm.get('details.Rate')?.value;

    const tNoOfHours = this.frm.get('details.NoOfHours')?.value;

    const tNoOfDays = this.frm.get('details.NoOfDays')?.value;



    if (parseInt("0" + tNoOfGuards, 10) === 0) {

      vMonthTotal = parseFloat(tRate) * parseFloat(tNoOfDays);

    } else {

      vMonthTotal = (

        parseFloat(tNoOfGuards) *

        parseFloat(tRate) *

        parseFloat(tNoOfHours) *

        parseFloat(tNoOfDays)

      );

    }



    if (!(parseInt("0" + tNoOfGuards, 10) === 0 ||

      parseInt("0" + tRate, 10) === 0 ||

      parseInt("0" + tNoOfHours, 10) === 0 ||

      parseInt("0" + tNoOfDays, 10) === 0)) {

      this.frm.get('details.MonthTotal')?.setValue(this.formatCurrency(vMonthTotal));

    } else {

      vMonthTotal = parseFloat(this.frm.get('details.MonthTotal')?.value);

    }



    // Round vMonthTotal to avoid floating-point precision errors before calculating Year Total
    vMonthTotal = Math.round(vMonthTotal);

    this.frm.get('details.YearTotal')?.setValue(Math.round(vMonthTotal * 12));



    if (this.frm.get('details.IsTaxable')?.value) {

      const taxRate = 18;

      this.frm.get('details.TaxAmount')?.setValue(

        this.formatCurrency((vMonthTotal - parseFloat(this.frm.get('details.DiscountAmount')?.value)) * (taxRate / 100))

      );

    } else {

      this.frm.get('details.TaxAmount')?.setValue(0);

    }



    let vDiscount = parseFloat(this.frm.get('details.DiscountAmount')?.value);

    if (!this.frm.get('details.HasDiscount')?.value) {

      vDiscount = 0;

    }



    if (this.frm.get('details.IsTaxable')?.value) {

      this.frm.get('details.total')?.setValue(this.formatCurrency((vMonthTotal - vDiscount) * (118 / 100)));

    } else {

      this.frm.get('details.total')?.setValue(this.formatCurrency(vMonthTotal - vDiscount));

    }

  }



  private formatCurrency(value: number): string {

    // Implement your currency formatting logic here

    return value.toFixed(2);

  }



  calculation() {



    this.DiscountAmount = 0;

    this.TaxAmount = 0;

    this.ServiceCharges = 0;

    this.NoOfHours = 0;

    this.Total = 0;



    let invoice_period = this.invoice['InvoiceDate'];

    let daysInMonth = 0;

    let agreementPeriod = new Date(invoice_period);

    let forDaysInMonth = new Date(invoice_period);

    forDaysInMonth.setMonth(forDaysInMonth.getMonth() + 1);

    forDaysInMonth.setDate(0);



    daysInMonth = forDaysInMonth.getDate();

    this.details.forEach((d: any) => {

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



    this.Total = this.ServiceCharges - this.DiscountAmount + this.TaxAmount;



  }



  onSubmit() {

    this.calculation();



    let data = this.frm.getRawValue();

    this.details.map((d: any) => {

      if (d.ID == 0) {

        d.AgreementDate = this.returnDate()

      }

    })



    data['details'] = this.details;



    if (this.frm.invalid) {

      return

    }

    data['ServiceCharges'] = this.ServiceCharges;

    data['Discount'] = this.DiscountAmount;

    data['TaxAmount'] = this.TaxAmount;



    console.log(data);

    let msg = "";

    this.service.SaveAndUpdateInvoiceDetail(data).subscribe((d: any) => {



      msg = 'Successfully Updated Details';



      Swal.fire({

        toast: true,

        position: 'top',

        showConfirmButton: false,

        title: 'Success',

        text: msg,

        icon: 'success',

        showCloseButton: false,

        timer: 3000,

      });



      this.closePopup();

    })



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



  closePopup() {

    this.dialogRef.close(this.invoice);

  }

}



// {

//   "ID": 12,

//   "ClientInvoiceID": 2,

//   "AgreementDetailID": 16,

//   "AgreementID": 7,

//   "AgreementDate": "2024-03-01T00:00:00",

//   "NoOfGuards": 10,

//   "Rate": 15,

//   "NoOfHours": 8,

//   "NoOfDays": 24,

//   "FollowCalender": false,

//   "HasDiscount": false,

//   "DiscountAmount": 0,

//   "IsTaxable": true,

//   "TaxAmount": 1728,

//   "LASTUPDATE": "2024-02-09T10:25:23.377",

//   "LastUpdatedBy": null,

//   "MonthTotal": 28800,

//   "index": 0

// }

