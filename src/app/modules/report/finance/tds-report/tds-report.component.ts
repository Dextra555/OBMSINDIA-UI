import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { FinanceService } from 'src/app/service/finance.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import * as XLSX from 'xlsx';

export type TDSMode = 'in' | 'out' | 'payroll';

@Component({
  selector: 'app-tds-report',
  templateUrl: './tds-report.component.html',
  styleUrls: ['./tds-report.component.css']
})
export class TdsReportComponent implements OnInit {

  frm!: FormGroup;
  currentUser: string = '';
  branchList: any[] = [];
  clientList: any[] = [];
  dataSource: any[] = [];

  mode: TDSMode = 'in';

  // ── Column definitions per mode ────────────────────────────────────────────
  columnsIn:      string[] = ['SNo','ReceiptDate','VoucherNo','Branch','PaymentFrom','ReceiptAmount','HQPercentage','HQAmount','BranchCollection'];
  columnsOut:     string[] = ['SNo','InvoiceDate','InvoiceNo','Branch','SupplierName','Total','TDSPercentage','TDSAmount'];
  columnsPayroll: string[] = ['SNo','Period','EmpCode','EmpName','Branch','GrossPay','TDS'];

  get displayedColumns(): string[] {
    if (this.mode === 'out')     return this.columnsOut;
    if (this.mode === 'payroll') return this.columnsPayroll;
    return this.columnsIn;
  }

  // ── Totals ──────────────────────────────────────────────────────────────────
  totalReceiptAmount:   number = 0;
  totalHQAmount:        number = 0;
  totalBranchCollection:number = 0;
  totalInvoiceTotal:    number = 0;
  totalOutTDS:          number = 0;
  totalGrossPay:        number = 0;
  totalPayrollTDS:      number = 0;

  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage:   string = '';
  showLoadingSpinner: boolean = false;

  constructor(
    private fb: FormBuilder,
    private _financeService: FinanceService,
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
    this.getUserAccessRights(this.currentUser, 'TDS Report');
  }

  // ── Access rights ───────────────────────────────────────────────────────────
  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      data => {
        if (data) {
          this.userAccessModel.readAccess   = data.Read;
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess || this.currentUser === 'superadmin') {
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

  // ── Mode change — clear results ─────────────────────────────────────────────
  onModeChange(newMode: TDSMode) {
    this.mode = newMode;
    this.dataSource = [];
    this.errorMessage = '';
    this.resetTotals();
    // Client dropdown is only meaningful for IN mode
    if (newMode !== 'in') {
      this.clientList = [];
      this.frm.patchValue({ Client: '' });
    }
  }

  // ── Branch change (IN mode loads client list) ───────────────────────────────
  branchChange(branchCode: string) {
    this.clientList = [];
    this.frm.patchValue({ Client: '' });
    if (branchCode && this.mode === 'in') {
      this._financeService.GetClientByBranch(branchCode).subscribe((d: any) => {
        this.clientList = d;
      });
    }
  }

  // ── Search ──────────────────────────────────────────────────────────────────
  onSearch() {
    if (this.frm.invalid) { return; }

    this.showLoadingSpinner = true;
    this.errorMessage = '';
    this.dataSource   = [];
    this.resetTotals();

    const startDate = this.returnDate(this.frm.get('StartDate')?.value);
    const endDate   = this.returnDate(this.frm.get('EndDate')?.value);
    const branch    = this.frm.get('Branch')?.value || '';
    const client    = this.frm.get('Client')?.value || '';

    if (this.mode === 'in') {
      this._financeService.getTDSReport(startDate, endDate, branch, client).subscribe({
        next: (data: any[]) => { this.dataSource = data || []; this.calcTotalsIn(); this.hideSpinner(); },
        error: err => { this.handleErrors(err); }
      });
    } else if (this.mode === 'out') {
      this._financeService.getTDSReportOut(startDate, endDate, branch).subscribe({
        next: (data: any[]) => { this.dataSource = data || []; this.calcTotalsOut(); this.hideSpinner(); },
        error: err => { this.handleErrors(err); }
      });
    } else {
      this._financeService.getTDSReportPayroll(startDate, endDate, branch).subscribe({
        next: (data: any[]) => { this.dataSource = data || []; this.calcTotalsPayroll(); this.hideSpinner(); },
        error: err => { this.handleErrors(err); }
      });
    }
  }

  // ── Totals ──────────────────────────────────────────────────────────────────
  resetTotals() {
    this.totalReceiptAmount    = 0;
    this.totalHQAmount         = 0;
    this.totalBranchCollection = 0;
    this.totalInvoiceTotal     = 0;
    this.totalOutTDS           = 0;
    this.totalGrossPay         = 0;
    this.totalPayrollTDS       = 0;
  }

  calcTotalsIn() {
    this.totalReceiptAmount    = this.dataSource.reduce((s, r) => s + (Number(r.ReceiptAmount)    || 0), 0);
    this.totalHQAmount         = this.dataSource.reduce((s, r) => s + (Number(r.HQAmount)         || 0), 0);
    this.totalBranchCollection = this.dataSource.reduce((s, r) => s + (Number(r.BranchCollection) || 0), 0);
  }

  calcTotalsOut() {
    this.totalInvoiceTotal = this.dataSource.reduce((s, r) => s + (Number(r.Total)     || 0), 0);
    this.totalOutTDS       = this.dataSource.reduce((s, r) => s + (Number(r.TDSAmount) || 0), 0);
  }

  calcTotalsPayroll() {
    this.totalGrossPay   = this.dataSource.reduce((s, r) => s + (Number(r.GrossPay) || 0), 0);
    this.totalPayrollTDS = this.dataSource.reduce((s, r) => s + (Number(r.TDS)      || 0), 0);
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  exportToExcel() {
    if (!this.dataSource?.length) { return; }

    let exportData: any[];
    let sheetName: string;
    let fileName: string;

    if (this.mode === 'in') {
      sheetName = 'TDS In Report';
      fileName  = 'TDS_In_Report.xlsx';
      exportData = this.dataSource.map((r, i) => ({
        'S.No':              i + 1,
        'Receipt Date':      r.ReceiptDate ? this.returnDate(r.ReceiptDate) : '',
        'Voucher No':        r.VoucherNo,
        'Branch':            r.Branch,
        'Payment From':      r.PaymentFrom,
        'Receipt Amount':    Number(r.ReceiptAmount).toFixed(2),
        'TDS %':             r.HQPercentage,
        'TDS Amount':        Number(r.HQAmount).toFixed(2),
        'Branch Collection': Number(r.BranchCollection).toFixed(2),
      }));
    } else if (this.mode === 'out') {
      sheetName = 'TDS Out Report';
      fileName  = 'TDS_Out_Report.xlsx';
      exportData = this.dataSource.map((r, i) => ({
        'S.No':           i + 1,
        'Invoice Date':   r.InvoiceDate ? this.returnDate(r.InvoiceDate) : '',
        'Invoice No':     r.InvoiceNo,
        'Branch':         r.Branch,
        'Supplier':       r.SupplierName,
        'Invoice Total':  Number(r.Total).toFixed(2),
        'TDS %':          r.TDSPercentage,
        'TDS Amount':     Number(r.TDSAmount).toFixed(2),
      }));
    } else {
      sheetName = 'Payroll TDS Report';
      fileName  = 'TDS_Payroll_Report.xlsx';
      exportData = this.dataSource.map((r, i) => ({
        'S.No':       i + 1,
        'Period':     r.Period ? this.returnDate(r.Period) : '',
        'Emp Code':   r.EmpCode,
        'Emp Name':   r.EmpName,
        'Branch':     r.Branch,
        'Gross Pay':  Number(r.GrossPay).toFixed(2),
        'TDS Amount': Number(r.TDS).toFixed(2),
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  }

  onPrint() { window.print(); }

  // ── Utilities ───────────────────────────────────────────────────────────────
  returnDate(date?: any): string {
    const d = date ? new Date(date) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  handleErrors(_error: any) {
    this.errorMessage = 'Error loading data. Please try again.';
    this.hideSpinner();
  }

  hideSpinner() { this.showLoadingSpinner = false; }
}
