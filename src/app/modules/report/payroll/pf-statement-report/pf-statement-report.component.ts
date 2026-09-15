import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';

import { BranchModel } from 'src/app/model/branchModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { ClientModel } from 'src/app/model/clientModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';

@Component({
  selector: 'app-pf-statement-report',
  templateUrl: './pf-statement-report.component.html',
  styleUrls: ['./pf-statement-report.component.css']
})
export class PfStatementReportComponent implements OnInit {
  frm!: FormGroup;
  showLoadingSpinner: boolean = false;
  warningMessage: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  branchModel!: BranchModel[];
  clientModel!: ClientModel[];
  currentUser: string = '';
  userAccessModel!: UserAccessModel;
  selectedReportType: string = 'monthly';
  years: number[] = [];

  currentReportHtml: SafeHtml | null = null;
  currentReportHtmlRaw: string = '';
  reportTemplate: string = '';

  constructor(
    public sanitizer: DomSanitizer,
    private fb: FormBuilder,
    private http: HttpClient,
    private _dataService: DatasharingService,
    private _masterService: MastermoduleService,
    private _payrollService: PayrollModuleService,
    private router: Router
  ) {
    this.userAccessModel = {
      readAccess: false, updateAccess: false,
      deleteAccess: false, createAccess: false,
    }
  }

  ngOnInit(): void {
    this.frm = this.fb.group({
      BranchCode: ['', Validators.required],
      ClientCode: [''],
      Month: [new Date().getMonth() + 1, Validators.required],
      Year: [new Date().getFullYear(), Validators.required],
      EmployeeType: ['All'],
      ReportType: ['monthly']
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) this._dataService.scrollToTop();
    });

    this.currentUser = sessionStorage.getItem('username')!;
    if (!this.currentUser) {
      this._dataService.getUsername().subscribe((username) => { this.currentUser = username; });
    }
    this.generateYearOptions();
    this.loadTemplate();
    this.getUserAccessRights(this.currentUser, 'PF Statement Report');
  }

  loadTemplate() {
    this.http.get('assets/report-templates/statements/pf-statement.html', { responseType: 'text' }).subscribe(
      (html) => { this.reportTemplate = html; },
      (error) => { console.warn('Could not load PF template', error); }
    );
  }

  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe((data: any) => {
      if (data != null) {
        this.userAccessModel.readAccess = data.Read;
        this.userAccessModel.deleteAccess = data.Delete;
        this.userAccessModel.updateAccess = data.Update;
        this.userAccessModel.createAccess = data.Create;
        if (this.userAccessModel.readAccess || this.currentUser == 'superadmin' || this.currentUser == 'admin') {
          this.warningMessage = '';
          this.getBranchMasterListByUser(this.currentUser);
        } else {
          this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>You do not have permissions to view this page.`;
        }
      }
      this.hideSpinner();
    });
  }

  getBranchMasterListByUser(userName: string) {
    this._masterService.GetBranchListByUserName(userName).subscribe((data: BranchModel[]) => {
      this.branchModel = data;
    });
  }

  onBranchSelectionChange(event: any) {
    const branchCode = this.frm.get('BranchCode')?.value;
    if (branchCode) this.getClientListByBranch(branchCode);
    this.clearMessages();
  }

  getClientListByBranch(branchCode: string) {
    this._masterService.getClientMsterListByBranch(branchCode).subscribe((data: ClientModel[]) => {
      this.clientModel = data;
    });
  }

  generateReport(reportType: string) {
    if (this.frm.invalid) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }
    this.clearMessages();
    this.showSpinner();
    this.selectedReportType = reportType;

    const formValues = this.frm.value;
    const month = formValues.Month.toString().padStart(2, '0');
    const period = `${formValues.Year}-${month}`;
    const branchName = this.branchModel?.find(b => b.Code === formValues.BranchCode)?.Name || '';
    const clientName = this.clientModel?.find(c => c.Code === formValues.ClientCode)?.Name || '';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const metaData = {
      ReportTitle: 'PROVIDENT FUND STATEMENT - ' + months[formValues.Month - 1].toUpperCase() + ' ' + formValues.Year,
      Branch: branchName,
      Client: clientName || 'All Clients',
      Period: `${months[formValues.Month - 1]} ${formValues.Year}`,
      GeneratedDate: new Date().toLocaleString('en-IN'),
      TotalGrossWages: 0,
      TotalEPFWages: 0,
      TotalEPSWages: 0,
      TotalEPFContributionRemitted: 0,
      TotalEPSContributionRemitted: 0,
      TotalEPFDifference: 0
    };

    const payload = {
      Parameters: {
        branch: formValues.BranchCode,
        client: formValues.ClientCode || '',
        period,
        reportType
      }
    };

    // Use the dedicated GetPFStatement endpoint
    this.http.post<any>(`${this._masterService.apiUrl}ComplianceReport/GetPFStatement`, payload).subscribe(
      (data) => {
        this.hideSpinner();
        const html = this.renderHtml(this.reportTemplate, data, metaData);
        this.currentReportHtmlRaw = html;
        this.currentReportHtml = this.sanitizer.bypassSecurityTrustHtml(html);
      },
      (error) => {
        this.hideSpinner();
        this.errorMessage = `Failed to load PF data: ${error?.message || error || 'Server error'}. Please ensure the backend is running.`;
        console.error('PF Statement API error:', error);
      }
    );
  }

  private renderHtml(template: string, apiData: any, meta: any): string {
    let filled = template;

    // Combine all known data into one lookup map (meta + totals)
    const allData: { [key: string]: any } = { ...meta };
    if (apiData?.totals) {
      const t = apiData.totals;
      const fmt = (v: any) => (v != null ? Number(v).toLocaleString('en-IN') : '0');
      Object.keys(t).forEach(k => { allData[k] = typeof t[k] === 'number' ? fmt(t[k]) : (t[k] ?? ''); });
    }

    // Replace {{Key}} and {{Key || 'default'}} placeholders in one pass
    filled = filled.replace(/{\{\s*([\w]+)(?:\s*\|\|\s*['"]?([^'"\}]+)['"]?)?\s*\}}/g,
      (match, key, defaultVal) => {
        if (key === 'DataRows') return match; // handled separately
        if (allData[key] !== undefined && allData[key] !== null && allData[key] !== '') return allData[key];
        return defaultVal !== undefined ? defaultVal : '';
      });

    // Build data rows
    let rowHtml = '<tr><td colspan="11" style="text-align:center;color:#888;">No records found for the selected period.</td></tr>';
    if (apiData?.rows && apiData.rows.length > 0) {
      rowHtml = apiData.rows.map((r: any, i: number) => this.buildRow(r, i)).join('');
    }
    filled = filled.replace(/{{DataRows}}/g, rowHtml);

    // Clear any remaining unreplaced placeholders
    filled = filled.replace(/{\{[\w\s|'"]+\}}/g, '');
    return filled;
  }

  private buildRow(row: any, index: number): string {
    // Backend returns: EMP_ID, uan, memberName, grossWages, epfWages, epsWages, edliWages, epfContributionRemitted, epsContributionRemitted, epfDifference, ncpDays, refundOfAdvances, numberOfDays
    const fmt = (v: any) => (v != null ? Number(v).toLocaleString('en-IN') : '0');
    const uanVal = String(row.uan ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    return `<tr>
      <td class="text-center">${row.sno ?? index + 1}</td>
      <td>${uanVal}</td>
      <td>${row.memberName ?? row.empName ?? ''}</td>
      <td class="text-right">${fmt(row.grossWages)}</td>
      <td class="text-right">${fmt(row.epfWages)}</td>
      <td class="text-right">${fmt(row.epsWages)}</td>
      <td class="text-right">${fmt(row.edliWages)}</td>
      <td class="text-right">${fmt(row.epfContributionRemitted)}</td>
      <td class="text-right">${fmt(row.epsContributionRemitted)}</td>
      <td class="text-right">${fmt(row.epfDifference)}</td>
      <td class="text-right">${fmt(row.ncpDays)}</td>
      <td class="text-right">${fmt(row.refundOfAdvances)}</td>
      <td class="text-right">${fmt(row.numberOfDays)}</td>
    </tr>`;
  }

  generateExcelFileClick() {
    if (!this.currentReportHtmlRaw) { this.errorMessage = 'Generate a report first.'; return; }
    try {
      this.errorMessage = '';
      const doc = new DOMParser().parseFromString(this.currentReportHtmlRaw, 'text/html');
      const table = doc.querySelector('table');
      if (!table) return;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.table_to_sheet(table), 'Report');
      XLSX.writeFile(workbook, `PF_Report_${Date.now()}.xlsx`);
    } catch (err) { this.errorMessage = 'Export failed'; }
  }

  printReport() {
    if (!this.currentReportHtmlRaw) { this.errorMessage = 'Generate a report first.'; return; }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Print Preview</title></head><body>${this.currentReportHtmlRaw}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }

  clearMessages() { this.errorMessage = ''; this.warningMessage = ''; this.successMessage = ''; }
  showSpinner() { this.showLoadingSpinner = true; }
  hideSpinner() { this.showLoadingSpinner = false; }

  generateYearOptions() {
    const currentYear = new Date().getFullYear();
    this.years = [];
    for (let i = currentYear - 2; i <= currentYear + 5; i++) {
      this.years.push(i);
    }
  }
}
