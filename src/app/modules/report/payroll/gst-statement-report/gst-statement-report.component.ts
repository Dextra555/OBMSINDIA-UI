import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import * as XLSX from 'xlsx';

export type GSTMode = 'in' | 'out' | 'payroll';

@Component({
  selector: 'app-gst-statement-report',
  templateUrl: './gst-statement-report.component.html',
  styleUrls: ['./gst-statement-report.component.css']
})
export class GstStatementReportComponent implements OnInit {

  frm!: FormGroup;
  currentUser: string = '';
  branchList: any[] = [];
  clientList: any[] = [];
  dataSource: any[] = [];
  rateSummary: any[] = [];

  mode: GSTMode = 'in';

  // ── Column sets per mode ──────────────────────────────────────────────────
  columnsIn: string[] = [
    'SNo', 'InvoiceDate', 'InvoiceNo', 'ClientName', 'ClientGSTIN',
    'ClientState', 'TaxableAmount', 'GSTRate', 'SupplyType',
    'CGST', 'SGST', 'IGST', 'TotalGST', 'TotalAmount'
  ];
  columnsOut: string[] = [
    'SNo', 'InvoiceDate', 'InvoiceNo', 'SupplierName', 'GSTNo', 'PanNo', 'Branch',
    'InvoiceTotal', 'GSTRate', 'SupplyType',
    'CGST', 'SGST', 'IGST', 'TotalGST', 'TDSAmount', 'NetPayable'
  ];
  columnsPayroll: string[] = [
    'SNo', 'Period', 'EmpCode', 'EmpName', 'Branch', 'GrossPay', 'PTax'
  ];

  get displayedColumns(): string[] {
    if (this.mode === 'out')     return this.columnsOut;
    if (this.mode === 'payroll') return this.columnsPayroll;
    return this.columnsIn;
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  // IN
  totalTaxable:  number = 0;
  totalCGST:     number = 0;
  totalSGST:     number = 0;
  totalIGST:     number = 0;
  totalGST:      number = 0;
  grandTotal:    number = 0;
  // OUT
  totalInvoiceTotal: number = 0;
  totalOutGST:       number = 0;
  totalOutCGST:      number = 0;
  totalOutSGST:      number = 0;
  totalOutIGST:      number = 0;
  totalOutTDS:       number = 0;
  totalOutNetPayable:number = 0;
  // PAYROLL
  totalGrossPay:  number = 0;
  totalPTax:      number = 0;

  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage:   string = '';
  showLoadingSpinner: boolean = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private _masterService: MastermoduleService,
    private _dataService: DatasharingService,
    private router: Router
  ) {
    this.frm = this.fb.group({
      Branch:    [''],
      Client:    [''],
      StartDate: ['', Validators.required],
      EndDate:   ['', Validators.required],
    });

    this.userAccessModel = {
      readAccess:   false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    };
  }

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this._dataService.scrollToTop();
      }
    });

    this.currentUser = sessionStorage.getItem('username')!;
    if (!this.currentUser) {
      this._dataService.getUsername().subscribe(u => { this.currentUser = u; });
    }
    this.getUserAccessRights(this.currentUser, 'GST Statement Report');
  }

  // ── Access rights ─────────────────────────────────────────────────────────
  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      data => {
        if (data) {
          this.userAccessModel.readAccess   = data.Read;
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess || this.currentUser === 'superadmin' || this.currentUser === 'admin') {
            this.warningMessage = '';
            this._masterService.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
              this.branchList = d;
            });
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
              You do not have permissions to view this page. <br>
              If you feel you should have access, please contact your administrator.`;
          }
        }
        this.hideSpinner();
      },
      error => { this.handleErrors(error); }
    );
  }

  // ── Mode change ───────────────────────────────────────────────────────────
  onModeChange(newMode: GSTMode) {
    this.mode = newMode;
    this.dataSource  = [];
    this.rateSummary = [];
    this.errorMessage = '';
    this.resetTotals();
    if (newMode !== 'in') {
      this.clientList = [];
      this.frm.patchValue({ Client: '' });
    }
  }

  // ── Branch change ─────────────────────────────────────────────────────────
  branchChange(branchCode: string) {
    this.clientList = [];
    this.frm.patchValue({ Client: '' });
    if (branchCode && this.mode === 'in') {
      this._masterService.getClientMsterListByBranch(branchCode).subscribe((d: any) => {
        this.clientList = d;
      });
    }
  }

  // ── Search ────────────────────────────────────────────────────────────────
  onSearch() {
    if (this.frm.invalid) { return; }

    this.showLoadingSpinner = true;
    this.errorMessage  = '';
    this.dataSource    = [];
    this.rateSummary   = [];
    this.resetTotals();

    const startDate = this.returnDate(this.frm.get('StartDate')?.value);
    const endDate   = this.returnDate(this.frm.get('EndDate')?.value);
    const branch    = this.frm.get('Branch')?.value || '';
    const client    = this.frm.get('Client')?.value || '';

    const params = { Parameters: { fromDate: startDate, toDate: endDate, branch, client } };

    if (this.mode === 'in') {
      this.http.post<any>(`${this._masterService.apiUrl}ComplianceReport/GetGSTStatement`, params).subscribe({
        next: data => {
          this.dataSource  = data?.rows    || [];
          this.rateSummary = data?.totals?.RateSummary || [];
          this.calcTotalsIn();
          this.hideSpinner();
        },
        error: err => { this.handleErrors(err); }
      });
    } else if (this.mode === 'out') {
      this.http.post<any>(`${this._masterService.apiUrl}ComplianceReport/GetOutGSTReport`, params).subscribe({
        next: data => {
          this.dataSource = data?.rows || [];
          this.calcTotalsOut();
          this.hideSpinner();
        },
        error: err => { this.handleErrors(err); }
      });
    } else {
      this.http.post<any>(`${this._masterService.apiUrl}ComplianceReport/GetPayrollGSTReport`, params).subscribe({
        next: data => {
          this.dataSource = data?.rows || [];
          this.calcTotalsPayroll();
          this.hideSpinner();
        },
        error: err => { this.handleErrors(err); }
      });
    }
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  resetTotals() {
    this.totalTaxable     = 0; this.totalCGST    = 0; this.totalSGST  = 0;
    this.totalIGST        = 0; this.totalGST     = 0; this.grandTotal = 0;
    this.totalInvoiceTotal = 0; this.totalOutGST = 0;
    this.totalOutCGST = 0; this.totalOutSGST = 0; this.totalOutIGST = 0;
    this.totalOutTDS = 0; this.totalOutNetPayable = 0;
    this.totalGrossPay    = 0; this.totalPTax    = 0;
  }

  calcTotalsIn() {
    this.totalTaxable = this.dataSource.reduce((s, r) => s + (Number(r.taxableAmount) || 0), 0);
    this.totalCGST    = this.dataSource.reduce((s, r) => s + (Number(r.cgst)          || 0), 0);
    this.totalSGST    = this.dataSource.reduce((s, r) => s + (Number(r.sgst)          || 0), 0);
    this.totalIGST    = this.dataSource.reduce((s, r) => s + (Number(r.igst)          || 0), 0);
    this.totalGST     = this.dataSource.reduce((s, r) => s + (Number(r.totalGST)      || 0), 0);
    this.grandTotal   = this.dataSource.reduce((s, r) => s + (Number(r.totalAmount)   || 0), 0);
  }

  calcTotalsOut() {
    this.totalInvoiceTotal  = this.dataSource.reduce((s, r) => s + (Number(r.invoiceTotal)  || 0), 0);
    this.totalOutCGST       = this.dataSource.reduce((s, r) => s + (Number(r.cgstAmount)    || 0), 0);
    this.totalOutSGST       = this.dataSource.reduce((s, r) => s + (Number(r.sgstAmount)    || 0), 0);
    this.totalOutIGST       = this.dataSource.reduce((s, r) => s + (Number(r.igstAmount)    || 0), 0);
    this.totalOutGST        = this.dataSource.reduce((s, r) => s + (Number(r.totalGST)      || 0), 0);
    this.totalOutTDS        = this.dataSource.reduce((s, r) => s + (Number(r.tdsAmount)     || 0), 0);
    this.totalOutNetPayable = this.dataSource.reduce((s, r) => s + (Number(r.netPayable)    || 0), 0);
  }

  calcTotalsPayroll() {
    this.totalGrossPay = this.dataSource.reduce((s, r) => s + (Number(r.grossPay) || 0), 0);
    this.totalPTax     = this.dataSource.reduce((s, r) => s + (Number(r.ptax)     || 0), 0);
  }

  // ── Export ────────────────────────────────────────────────────────────────
  exportToExcel() {
    if (!this.dataSource?.length) { return; }

    let exportData: any[];
    let sheetName: string;
    let fileName: string;

    if (this.mode === 'in') {
      sheetName  = 'GST In Report';
      fileName   = 'GST_In_Report.xlsx';
      exportData = this.dataSource.map((r: any, i: number) => ({
        'S.No':           i + 1,
        'Invoice No':     r.invoiceNo,
        'Invoice Date':   r.invoiceDate,
        'Client Name':    r.clientName,
        'Client GSTIN':   r.clientGSTIN,
        'Client State':   r.clientState,
        'Taxable Amount': Number(r.taxableAmount) || 0,
        'GST Rate (%)':   r.gstRateDisplay || (r.gstRate + '%'),
        'CGST':           Number(r.cgst)        || 0,
        'SGST':           Number(r.sgst)        || 0,
        'IGST':           Number(r.igst)        || 0,
        'Total GST':      Number(r.totalGST)    || 0,
        'Total Amount':   Number(r.totalAmount) || 0,
        'Supply Type':    r.isIntraState ? 'Intra-State' : 'Inter-State',
      }));
      exportData.push({
        'S.No': '', 'Invoice No': '', 'Invoice Date': '', 'Client Name': 'TOTAL',
        'Client GSTIN': '', 'Client State': '',
        'Taxable Amount': this.totalTaxable,
        'GST Rate (%)': '', 'CGST': this.totalCGST, 'SGST': this.totalSGST,
        'IGST': this.totalIGST, 'Total GST': this.totalGST,
        'Total Amount': this.grandTotal, 'Supply Type': ''
      });
    } else if (this.mode === 'out') {
      sheetName  = 'GST Out Report';
      fileName   = 'GST_Out_Report.xlsx';
      exportData = this.dataSource.map((r: any, i: number) => ({
        'S.No':           i + 1,
        'Invoice Date':   r.invoiceDate,
        'Invoice No':     r.invoiceNo,
        'Branch':         r.branch,
        'Supplier':       r.supplierName,
        'Invoice Total':  Number(r.invoiceTotal)   || 0,
        'Type':           r.transactionType,
        'CGST %':         Number(r.cgstPercentage) || 0,
        'CGST Amount':    Number(r.cgstAmount)     || 0,
        'SGST %':         Number(r.sgstPercentage) || 0,
        'SGST Amount':    Number(r.sgstAmount)     || 0,
        'IGST %':         Number(r.igstPercentage) || 0,
        'IGST Amount':    Number(r.igstAmount)     || 0,
        'Total GST':      Number(r.totalGST)       || 0,
        'TDS Amount':     Number(r.tdsAmount)      || 0,
        'Net Payable':    Number(r.netPayable)     || 0,
      }));
      exportData.push({
        'S.No': '', 'Invoice Date': '', 'Invoice No': '', 'Branch': '', 'Supplier': 'TOTAL',
        'Invoice Total': this.totalInvoiceTotal,
        'Type': '',
        'CGST %': '', 'CGST Amount': this.totalOutCGST,
        'SGST %': '', 'SGST Amount': this.totalOutSGST,
        'IGST %': '', 'IGST Amount': this.totalOutIGST,
        'Total GST': this.totalOutGST,
        'TDS Amount': this.totalOutTDS,
        'Net Payable': this.totalOutNetPayable
      });
    } else {
      sheetName  = 'Professional Tax Report';
      fileName   = 'GST_PTax_Report.xlsx';
      exportData = this.dataSource.map((r: any, i: number) => ({
        'S.No':       i + 1,
        'Period':     r.period,
        'Emp Code':   r.empCode,
        'Emp Name':   r.empName,
        'Branch':     r.branch,
        'Gross Pay':  Number(r.grossPay) || 0,
        'P.Tax':      Number(r.ptax)     || 0,
      }));
      exportData.push({
        'S.No': '', 'Period': '', 'Emp Code': '', 'Emp Name': 'TOTAL', 'Branch': '',
        'Gross Pay': this.totalGrossPay, 'P.Tax': this.totalPTax
      });
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  }

  onPrint() { window.print(); }

  // ── Utilities ─────────────────────────────────────────────────────────────
  returnDate(date?: any): string {
    const d = date ? new Date(date) : new Date();
    const y  = d.getFullYear();
    const m  = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dy}`;
  }

  handleErrors(_error: any) {
    this.errorMessage = 'Error loading data. Please try again.';
    this.hideSpinner();
  }

  hideSpinner() { this.showLoadingSpinner = false; }
}
