import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-gst-statement-report',
  templateUrl: './gst-statement-report.component.html',
  styleUrls: ['./gst-statement-report.component.css']
})
export class GstStatementReportComponent implements OnInit {
  frm!: FormGroup;
  currentUser: string = '';
  branchList: any = [];
  clientList: any = [];
  dataSource: any[] = [];
  rateSummary: any[] = [];
  displayedColumns: string[] = [
    'SNo', 'InvoiceNo', 'InvoiceDate', 'ClientName', 'ClientGSTIN',
    'ClientState', 'TaxableAmount', 'GSTRate', 'CGST', 'SGST', 'IGST',
    'TotalGST', 'TotalAmount', 'SupplyType'
  ];
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;

  totalTaxable: number = 0;
  totalCGST: number = 0;
  totalSGST: number = 0;
  totalIGST: number = 0;
  totalGST: number = 0;
  grandTotal: number = 0;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private _masterService: MastermoduleService,
    private _dataService: DatasharingService,
    private router: Router
  ) {
    this.frm = this.fb.group({
      Branch: [''],
      Client: [''],
      StartDate: ['', Validators.required],
      EndDate: ['', Validators.required],
    });

    this.userAccessModel = {
      readAccess: false,
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
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'GST Statement Report');
  }

  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read;
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin' || this.currentUser == 'admin') {
            this.warningMessage = '';
            this._masterService.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
              this.branchList = d;
            });
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
              You do not have permissions to view this page. <br>
              If you feel you should have access to this page, Please contact administrator. <br>
              Thank you`;
          }
        }
        this.hideSpinner();
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  returnDate(date?: any): string {
    let currentDate = new Date();
    if (date) {
      currentDate = new Date(date);
    }
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  branchChange(branchCode: string) {
    this.clientList = [];
    this.frm.patchValue({ Client: '' });

    if (branchCode) {
      this._masterService.getClientMsterListByBranch(branchCode).subscribe((d: any) => {
        this.clientList = d;
      });
    }
  }

  onSearch() {
    if (this.frm.invalid) {
      return;
    }
    this.showLoadingSpinner = true;
    this.errorMessage = '';
    const startDate = this.returnDate(this.frm.get('StartDate')?.value);
    const endDate = this.returnDate(this.frm.get('EndDate')?.value);
    const branch = this.frm.get('Branch')?.value || '';
    const client = this.frm.get('Client')?.value || '';

    const payload = {
      Parameters: {
        fromDate: startDate,
        toDate: endDate,
        branch: branch,
        client: client
      }
    };

    this.http.post<any>(`${this._masterService.apiUrl}ComplianceReport/GetGSTStatement`, payload).subscribe({
      next: (data: any) => {
        this.dataSource = data?.rows || [];
        this.rateSummary = data?.totals?.RateSummary || [];
        this.calculateTotals();
        this.hideSpinner();
      },
      error: (err) => {
        this.handleErrors(err);
      }
    });
  }

  calculateTotals() {
    this.totalTaxable = this.dataSource.reduce((sum, r) => sum + (Number(r.taxableAmount) || 0), 0);
    this.totalCGST = this.dataSource.reduce((sum, r) => sum + (Number(r.cgst) || 0), 0);
    this.totalSGST = this.dataSource.reduce((sum, r) => sum + (Number(r.sgst) || 0), 0);
    this.totalIGST = this.dataSource.reduce((sum, r) => sum + (Number(r.igst) || 0), 0);
    this.totalGST = this.dataSource.reduce((sum, r) => sum + (Number(r.totalGST) || 0), 0);
    this.grandTotal = this.dataSource.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  }

  exportToExcel() {
    if (!this.dataSource || this.dataSource.length === 0) return;

    // Use actual numbers (not strings) so Excel treats them as numeric cells
    const exportData = this.dataSource.map((r: any, i: number) => ({
      'S.No': i + 1,
      'Invoice No': r.invoiceNo,
      'Invoice Date': r.invoiceDate,
      'Client Name': r.clientName,
      'Client GSTIN': r.clientGSTIN,
      'Client State': r.clientState,
      'Taxable Amount': Number(r.taxableAmount) || 0,
      'GST Rate (%)': r.gstRateDisplay || (r.gstRate + '%'),
      'CGST': Number(r.cgst) || 0,
      'SGST': Number(r.sgst) || 0,
      'IGST': Number(r.igst) || 0,
      'Total GST': Number(r.totalGST) || 0,
      'Total Amount': Number(r.totalAmount) || 0,
      'Supply Type': r.isIntraState ? 'Intra-State' : 'Inter-State'
    }));

    // Totals row — all numeric columns are real numbers so Excel SUM works
    const totalsRow: any = {
      'S.No': '',
      'Invoice No': '',
      'Invoice Date': '',
      'Client Name': 'TOTAL',
      'Client GSTIN': '',
      'Client State': '',
      'Taxable Amount': this.totalTaxable,
      'GST Rate (%)': '',
      'CGST': this.totalCGST,
      'SGST': this.totalSGST,
      'IGST': this.totalIGST,
      'Total GST': this.totalGST,
      'Total Amount': this.grandTotal,
      'Supply Type': ''
    };
    exportData.push(totalsRow);

    const ws = XLSX.utils.json_to_sheet(exportData);

    // Number format for all numeric columns in data + totals rows
    const numericCols = ['G', 'I', 'J', 'K', 'L', 'M']; // Taxable, CGST, SGST, IGST, TotalGST, TotalAmount
    const dataRowCount = exportData.length; // includes totals row
    numericCols.forEach(col => {
      for (let row = 2; row <= dataRowCount + 1; row++) {
        const cellRef = `${col}${row}`;
        if (ws[cellRef]) {
          ws[cellRef].t = 'n'; // force numeric type
          ws[cellRef].z = '#,##0.00'; // 2 decimal places with comma
        }
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GST Report');
    XLSX.writeFile(wb, 'GST_Report.xlsx');
  }

  onPrint() {
    window.print();
  }

  handleErrors(error: any) {
    this.errorMessage = 'Error loading data. Please try again.';
    this.hideSpinner();
  }

  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
