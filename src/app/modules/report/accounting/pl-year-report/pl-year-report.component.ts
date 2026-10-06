import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-pl-year-report',
  templateUrl: './pl-year-report.component.html',
  styleUrls: ['./pl-year-report.component.css']
})
export class PlYearReportComponent implements OnInit {

  yearForm!: FormGroup;
  yearList: number[] = [];
  yearErrorMessage: string = '';
  yearLoadingSpinner: boolean = false;
  excelLoadingSpinner: boolean = false;
  warningMessage: string = '';
  currentUser: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;

  // ── Excel-defined display order for the OTHERS section ──────────────────
  // Any category from the DB that fuzzy-matches one of these keys is placed
  // in this position; remaining categories fall through to alphabetical order.
  private readonly othersDisplayOrder: string[] = [
    'SST',
    'ACCRUAL2',
    'ACCRUAL',
    'LOAN REPAYMENT',
    'FWG GLOBAL - LOAN',
    'FWG GLOBAL',
    'LOAN - DATUK A. CHANDRAKUMANAN',
    'LOAN - DATUK',
    'REIMBURSEMENT',
    'LOAN - AURA',
    'FD PLACEMENT',
    'CONTRA',
    'TRANSFER',
    'INTERNAL',
    'ADJUSTMENT'
  ];

  constructor(
    private _masterService: MastermoduleService,
    private fb: FormBuilder,
    private router: Router,
    private _dataService: DatasharingService
  ) {
    const currentYear = new Date().getFullYear();

    this.yearForm = this.fb.group({
      FromYear: [currentYear - 5, Validators.required],
      ToYear:   [currentYear,     Validators.required]
    });

    // Year dropdown: 2015 → current year + 1
    for (let y = 2015; y <= currentYear + 1; y++) {
      this.yearList.push(y);
    }

    this.userAccessModel = {
      readAccess:   false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false
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
      this._dataService.getUsername().subscribe((username: string) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Profit And Lost');
  }

  // ── Access rights ─────────────────────────────────────────────────────────

  getUserAccessRights(userName: string, screenName: string): void {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data: any) => {
        if (data != null) {
          this.userAccessModel.readAccess   = data.Read;
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess !== true && this.currentUser !== 'superadmin') {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
              You do not have permissions to view this page. <br>
              If you feel you should have access to this page, please contact administrator. <br>
              Thank you`;
          }
        }
        this.hideSpinner();
      },
      (error: any) => { this.handleErrors(error); }
    );
  }

  // ── PDF generation ────────────────────────────────────────────────────────

  generateYearPdf(): void {
    this.yearErrorMessage = '';

    if (this.yearForm.invalid) {
      this.yearErrorMessage = 'Please select both From Year and To Year.';
      return;
    }

    const fromYear: number = +this.yearForm.get('FromYear')!.value;
    const toYear:   number = +this.yearForm.get('ToYear')!.value;

    if (fromYear > toYear) {
      this.yearErrorMessage = 'From Year cannot be greater than To Year.';
      return;
    }

    this.yearLoadingSpinner = true;

    this._masterService.getYearlyProfitLoss(fromYear, toYear).subscribe({
      next: (data: any) => {
        this.yearLoadingSpinner = false;
        this.openYearPdfWindow(data, fromYear, toYear);
      },
      error: (err: any) => {
        this.yearLoadingSpinner = false;
        this.yearErrorMessage = 'Error generating report: ' + (err?.message ?? err);
      }
    });
  }

  // ── HTML PDF window ───────────────────────────────────────────────────────

  private openYearPdfWindow(data: any, fromYear: number, toYear: number): void {
    // API returns PascalCase (PropertyNamingPolicy = null in Program.cs)
    const years: number[] = data.Years          ?? [];
    const summary: any[]  = data.Summary        ?? [];
    const expenses: any[] = data.ExpenseDetails ?? [];
    const others: any[]   = data.OthersDetails  ?? [];

    if (years.length === 0) {
      this.yearErrorMessage = 'No data returned from the server. Please check the selected year range.';
      return;
    }

    const companyName = 'M/S FREIGHTWATCH G SECURITY SERVICES (INDIA) PRIVATE LIMITED';
    const titleRange  = fromYear === toYear ? `${fromYear}` : `${fromYear} - ${toYear}`;

    // Number of table columns: Particulars + one per year + TOTAL
    const colCount = years.length + 2;

    // ── Formatters ─────────────────────────────────────────────────────────
    const fmt = (v: number | null | undefined): string =>
      (v ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const fmtPct = (v: number | null | undefined): string =>
      (v ?? 0).toFixed(2) + '%';

    // ── Column header row ──────────────────────────────────────────────────
    // Dynamically built from the `years` array returned by the API.
    // No hard-coded year values here.
    const yearHeaders =
      years.map(y => `<th>${y}</th>`).join('') + '<th>TOTAL</th>';

    // ── Summary row lookup ─────────────────────────────────────────────────
    // Helper: find a summary row by its YearLabel ("2022" or "Total")
    const getRow = (label: string): any =>
      summary.find((s: any) =>
        String(s.YearLabel).toLowerCase() === String(label).toLowerCase()
      );

    // ── Row builder: amount cells from Summary ─────────────────────────────
    const amountRow = (
      label: string,
      field: string,
      rowClass: string = '',
      indent: boolean  = false
    ): string => {
      const cells = years.map(y => {
        const row = getRow(String(y));
        return `<td>${fmt(row ? row[field] : 0)}</td>`;
      }).join('');
      const totalRow  = getRow('Total');
      const labelHtml = indent ? `&nbsp;&nbsp;&nbsp;${label}` : label;
      return `<tr class="${rowClass}">
        <td class="particulars">${labelHtml}</td>
        ${cells}
        <td class="total-cell">${fmt(totalRow ? totalRow[field] : 0)}</td>
      </tr>`;
    };

    // ── Row builder: NET PROFIT row — green if positive, red if negative ───
    const netProfitRow = (label: string): string => {
      const totalRow   = getRow('Total');
      const totalValue = totalRow ? (totalRow['NetProfit'] ?? 0) : 0;
      const isLoss     = totalValue < 0;
      const rowClass   = isLoss ? 'net-loss-row' : 'net-profit-row';
      const cells = years.map(y => {
        const row = getRow(String(y));
        const val = row ? (row['NetProfit'] ?? 0) : 0;
        return `<td>${fmt(val)}</td>`;
      }).join('');
      return `<tr class="${rowClass}">
        <td class="particulars">${label}</td>
        ${cells}
        <td class="total-cell">${fmt(totalValue)}</td>
      </tr>`;
    };

    // ── Row builder: percentage cells from Summary ─────────────────────────
    const pctRow = (
      label: string,
      field: string,
      rowClass: string = ''
    ): string => {
      const cells = years.map(y => {
        const row = getRow(String(y));
        return `<td>${fmtPct(row ? row[field] : 0)}</td>`;
      }).join('');
      const totalRow = getRow('Total');
      return `<tr class="${rowClass}">
        <td class="particulars">${label}</td>
        ${cells}
        <td class="total-cell">${fmtPct(totalRow ? totalRow[field] : 0)}</td>
      </tr>`;
    };

    // ── Section header spanning full width ─────────────────────────────────
    const sectionHeader = (title: string): string =>
      `<tr class="section-header">
        <td colspan="${colCount}">${title}</td>
      </tr>`;

    // ── PIVOT helper ───────────────────────────────────────────────────────
    // Converts a flat [{Category, Year, Amount}] list into
    // Map<categoryName, Map<year, totalAmount>>
    const pivotRows = (rows: any[]): Map<string, Map<number, number>> => {
      const map = new Map<string, Map<number, number>>();
      for (const r of rows) {
        if (!map.has(r.Category)) map.set(r.Category, new Map<number, number>());
        map.get(r.Category)!.set(
          r.Year,
          (map.get(r.Category)!.get(r.Year) ?? 0) + (r.Amount ?? 0)
        );
      }
      return map;
    };

    // ── Build data rows from pivot map — generic (alphabetical) sort ────────
    const pivotTableRows = (
      map: Map<string, Map<number, number>>,
      rowClass: string = '',
      indent: boolean  = true,
      sortKeys?: string[]         // optional custom key order
    ): string => {
      if (map.size === 0) return '';

      // Build sorted category list
      let categories = Array.from(map.keys());
      if (sortKeys && sortKeys.length > 0) {
        // Place known keys first (case-insensitive fuzzy match), rest alphabetically
        const ranked: { cat: string; rank: number }[] = categories.map(cat => {
          const catUpper = cat.toUpperCase();
          const idx = sortKeys.findIndex(k => catUpper.includes(k.toUpperCase()) || k.toUpperCase().includes(catUpper));
          return { cat, rank: idx === -1 ? sortKeys.length + 1 : idx };
        });
        ranked.sort((a, b) =>
          a.rank !== b.rank
            ? a.rank - b.rank
            : a.cat.localeCompare(b.cat)
        );
        categories = ranked.map(r => r.cat);
      } else {
        categories.sort();
      }

      return categories.map(cat => {
        const yearData = map.get(cat)!;
        let rowTotal = 0;
        const cells = years.map(y => {
          const amt = yearData.get(y) ?? 0;
          rowTotal += amt;
          return `<td>${fmt(amt)}</td>`;
        }).join('');
        const labelHtml = indent ? `&nbsp;&nbsp;&nbsp;${cat}` : cat;
        return `<tr class="${rowClass}">
          <td class="particulars">${labelHtml}</td>
          ${cells}
          <td class="total-cell">${fmt(rowTotal)}</td>
        </tr>`;
      }).join('');
    };

    // ── Compute total row for any pivot map ────────────────────────────────
    const pivotTotalRow = (
      map: Map<string, Map<number, number>>,
      label: string
    ): string => {
      const cells = years.map(y => {
        let sum = 0;
        map.forEach(yearMap => { sum += yearMap.get(y) ?? 0; });
        return `<td>${fmt(sum)}</td>`;
      }).join('');
      let grandTotal = 0;
      map.forEach(yearMap => yearMap.forEach(v => { grandTotal += v; }));
      return `<tr class="total-row">
        <td class="particulars">${label}</td>
        ${cells}
        <td class="total-cell">${fmt(grandTotal)}</td>
      </tr>`;
    };

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 1: SALES
    //   Values: Sales, OtherReceipts, DebitNote, CreditNote, TotalSales
    //   Source: Summary rows from API
    //   Formula: TOTAL SALES = InvoiceSales + OtherReceipts + DebitNote − CreditNote
    // ══════════════════════════════════════════════════════════════════════════

    const salesRows =
      sectionHeader('1. SALES') +
      amountRow('INVOICE SALES',  'Sales',        '', true) +
      amountRow('OTHER RECEIPTS', 'OtherReceipts', '', true) +
      amountRow('DEBIT NOTE',     'DebitNote',    '', true) +
      amountRow('CREDIT NOTE',    'CreditNote',   '', true) +
      amountRow('TOTAL SALES',    'TotalSales',   'total-row');

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 2: EXPENSES
    //   All operational expense categories fetched dynamically from DB.
    //   No categories are hard-coded or omitted — whatever is in ExpenseDetails
    //   is displayed.  TOTAL EXPENSES is re-computed from the pivot map so it
    //   always matches the sum of displayed rows.
    // ══════════════════════════════════════════════════════════════════════════
    const expMap        = pivotRows(expenses);
    const expDetailRows = pivotTableRows(expMap, '', true);

    const expensesRows =
      sectionHeader('2. EXPENSES') +
      (expDetailRows
        ? expDetailRows
        : `<tr><td colspan="${colCount}" style="text-align:center;padding:8px;font-style:italic;color:#666;">No expense records found.</td></tr>`) +
      pivotTotalRow(expMap, 'TOTAL EXPENSES');

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 3: PROFIT CALCULATION
    //   NET PROFIT / (LOSS)  = TOTAL SALES − TOTAL EXPENSES
    //   EXPENSES %           = (TOTAL EXPENSES / TOTAL SALES) × 100
    //   NET PROFIT %         = (NET PROFIT / TOTAL SALES) × 100
    //   All values read from the Summary row (computed by backend, same formula).
    // ══════════════════════════════════════════════════════════════════════════
    const profitRows =
      sectionHeader('3. PROFIT CALCULATION') +
      netProfitRow('NET PROFIT / (LOSS)') +
      pctRow   ('EXPENSES %',          'ExpensesPercent',  'expenses-pct-row') +
      pctRow   ('NET PROFIT %',        'NetProfitPercent', 'netprofit-pct-row');

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 4: OTHERS
    //   Non-operational / financing transactions fetched dynamically from DB.
    //   Categories are sorted in the Excel-defined order (othersDisplayOrder),
    //   with any extra/new DB categories appended alphabetically at the end.
    //   TOTAL OTHERS = sum of all OTHERS categories for the selected years.
    // ══════════════════════════════════════════════════════════════════════════
    const othersMap        = pivotRows(others);
    const othersDetailRows = pivotTableRows(
      othersMap, '', true, this.othersDisplayOrder
    );

    const othersRows =
      sectionHeader('4. OTHERS') +
      (othersDetailRows
        ? othersDetailRows
        : `<tr><td colspan="${colCount}" style="text-align:center;padding:8px;font-style:italic;color:#666;">No others records found.</td></tr>`) +
      pivotTotalRow(othersMap, 'TOTAL OTHERS');

    // ══════════════════════════════════════════════════════════════════════════
    // Full self-contained HTML document
    // ══════════════════════════════════════════════════════════════════════════
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>P&amp;L Year Report ${titleRange}</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #000;
      background: #fff;
      padding: 16px;
    }

    /* ── Report header ── */
    .report-header {
      margin-bottom: 16px;
      padding-bottom: 10px;
    }
    .report-header-top {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 6px;
    }
    .report-header-top img.fwg-logo {
      width: 72px;
      height: 72px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .report-header-company {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .report-header-company .company {
      font-size: 13px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1a252f;
    }
    .report-header-company .address {
      font-size: 9px;
      color: #444;
      margin-top: 3px;
      line-height: 1.5;
    }
    .report-header-divider {
      border: none;
      border-top: 3px solid #c8962a;
      margin: 6px 0 8px 0;
    }
    .report-header-title {
      text-align: center;
      margin-top: 4px;
    }
    .report-header-title .title {
      font-size: 13px;
      font-weight: bold;
      color: #1a252f;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .report-header-title .period {
      font-size: 10px;
      color: #555;
      margin-top: 3px;
    }

    /* ── Print / Save as PDF button ── */
    .print-btn {
      display: block;
      margin: 0 0 12px auto;
      padding: 6px 18px;
      background: #2c3e50;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      font-family: Arial, Helvetica, sans-serif;
    }
    .print-btn:hover { background: #1a252f; }

    /* ── Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
    }

    /* ── Column headers ── */
    thead th {
      background: #2c3e50;
      color: #fff;
      text-align: center;
      padding: 7px 6px;
      font-size: 10px;
      font-weight: bold;
      white-space: nowrap;
      border: 1px solid #1a252f;
    }
    thead th:first-child { text-align: left; min-width: 220px; }

    /* ── Data cells ── */
    td {
      border: 1px solid #ccc;
      padding: 4px 7px;
      text-align: right;
      font-size: 10px;
      white-space: nowrap;
      vertical-align: middle;
    }
    td.particulars {
      text-align: left;
      background: #fafafa;
      min-width: 220px;
      max-width: 300px;
    }
    td.total-cell {
      font-weight: bold;
      background: #e8f0fe;
    }

    /* ── Alternating row shading ── */
    tbody tr:nth-child(even) td             { background: #f5f5f5; }
    tbody tr:nth-child(even) td.particulars { background: #eeeeee; }
    tbody tr:nth-child(even) td.total-cell  { background: #dce8fb; }

    /* ── Section header row (dark navy) ── */
    tr.section-header td {
      background: #2c3e50 !important;
      color: #fff !important;
      text-align: center;
      font-weight: bold;
      font-size: 11px;
      padding: 7px 8px;
      border: 1px solid #1a252f;
      letter-spacing: 0.5px;
    }

    /* ── Total row (dark) ── */
    tr.total-row td {
      background: #34495e !important;
      color: #fff !important;
      font-weight: bold;
      border: 1px solid #2c3e50;
    }
    tr.total-row td.particulars {
      background: #34495e !important;
      color: #fff !important;
      text-align: left;
    }
    tr.total-row td.total-cell {
      background: #1a252f !important;
      color: #fff !important;
    }

    /* ── Net profit row (green) ── */
    tr.net-profit-row td {
      background: #1e8449 !important;
      color: #fff !important;
      font-weight: bold;
      border: 1px solid #196f3d;
    }
    tr.net-profit-row td.particulars {
      background: #1e8449 !important;
      color: #fff !important;
      text-align: left;
    }
    tr.net-profit-row td.total-cell {
      background: #196f3d !important;
      color: #fff !important;
    }

    /* ── Net loss row (red — when total NetProfit is negative) ── */
    tr.net-loss-row td {
      background: #c0392b !important;
      color: #fff !important;
      font-weight: bold;
      border: 1px solid #96281b;
    }
    tr.net-loss-row td.particulars {
      background: #c0392b !important;
      color: #fff !important;
      text-align: left;
    }
    tr.net-loss-row td.total-cell {
      background: #96281b !important;
      color: #fff !important;
    }

    /* ── Net loss highlight (override when negative) ── */
    td.loss-value {
      color: #e74c3c !important;
    }

    /* ── Percentage rows (dark blue) ── */
    /* ── EXPENSES % row (orange) ── */
    tr.expenses-pct-row td {
      background: #d35400 !important;
      color: #fff !important;
      font-weight: bold;
      border: 1px solid #a04000;
    }
    tr.expenses-pct-row td.particulars {
      background: #d35400 !important;
      color: #fff !important;
      text-align: left;
    }
    tr.expenses-pct-row td.total-cell {
      background: #a04000 !important;
      color: #fff !important;
    }

    /* ── NET PROFIT % row (purple) ── */
    tr.netprofit-pct-row td {
      background: #6c3483 !important;
      color: #fff !important;
      font-weight: bold;
      border: 1px solid #512e5f;
    }
    tr.netprofit-pct-row td.particulars {
      background: #6c3483 !important;
      color: #fff !important;
      text-align: left;
    }
    tr.netprofit-pct-row td.total-cell {
      background: #512e5f !important;
      color: #fff !important;
    }

    /* ── Spacer between sections ── */
    tr.spacer td {
      height: 5px;
      background: #fff !important;
      border: none !important;
    }

    /* ── Print / Save as PDF ── */
    @media print {
      html, body { height: auto; }
      body { padding: 4px; font-size: 9px; }
      @page { size: landscape; margin: 8mm 6mm; }
      .print-btn { display: none !important; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>

  <div class="report-header">
    <div class="report-header-top">
      <img class="fwg-logo" src="data:image/png;base64,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" alt="FWG Logo" />
      <div class="report-header-company">
        <div class="company">${companyName}</div>
        <div class="address">
          No.397 (old no.281), Anna Salai,<br/>
          Precision Plaza, 1st Floor, Teynampet,<br/>
          600018 Chennai<br/>
          Tamil Nadu
        </div>
      </div>
    </div>
    <hr class="report-header-divider"/>
    <div class="report-header-title">
      <div class="title">PROFIT &amp; LOSS STATEMENT</div>
      <div class="period">FOR THE YEAR(S): ${titleRange}</div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">&#128424;&nbsp; Print / Save as PDF</button>

  <table>
    <thead>
      <tr>
        <th style="text-align:left; min-width:220px;">PARTICULARS</th>
        ${yearHeaders}
      </tr>
    </thead>
    <tbody>

      <!-- ══ SECTION 1: SALES ══ -->
      ${salesRows}
      <tr class="spacer"><td colspan="${colCount}"></td></tr>

      <!-- ══ SECTION 2: EXPENSES ══ -->
      ${expensesRows}
      <tr class="spacer"><td colspan="${colCount}"></td></tr>

      <!-- ══ SECTION 3: PROFIT CALCULATION ══ -->
      ${profitRows}
      <tr class="spacer"><td colspan="${colCount}"></td></tr>

      <!-- ══ SECTION 4: OTHERS ══ -->
      ${othersRows}

    </tbody>
  </table>

</body>
</html>`;

    // Open the report in a new browser tab.
    // When the user clicks "Print / Save as PDF" the browser prints the full
    // filtered data — including all year columns, all sections and calculations.
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    } else {
      this.yearErrorMessage =
        'Popup blocked. Please allow popups for this site and try again.';
    }
  }

  // ── Excel export ──────────────────────────────────────────────────────────

  exportExcelYear(): void {
    this.yearErrorMessage = '';

    if (this.yearForm.invalid) {
      this.yearErrorMessage = 'Please select both From Year and To Year.';
      return;
    }

    const fromYear: number = +this.yearForm.get('FromYear')!.value;
    const toYear:   number = +this.yearForm.get('ToYear')!.value;

    if (fromYear > toYear) {
      this.yearErrorMessage = 'From Year cannot be greater than To Year.';
      return;
    }

    this.excelLoadingSpinner = true;

    this._masterService.getYearlyProfitLoss(fromYear, toYear).subscribe({
      next: (data: any) => {
        this.excelLoadingSpinner = false;
        this.buildAndDownloadExcel(data, fromYear, toYear);
      },
      error: (err: any) => {
        this.excelLoadingSpinner = false;
        this.yearErrorMessage = 'Error generating Excel: ' + (err?.message ?? err);
      }
    });
  }

  private buildAndDownloadExcel(data: any, fromYear: number, toYear: number): void {
    const years: number[] = data.Years          ?? [];
    const summary: any[]  = data.Summary        ?? [];
    const expenses: any[] = data.ExpenseDetails ?? [];
    const others: any[]   = data.OthersDetails  ?? [];

    if (years.length === 0) {
      this.yearErrorMessage = 'No data returned from the server. Please check the selected year range.';
      return;
    }

    const titleRange  = fromYear === toYear ? `${fromYear}` : `${fromYear} - ${toYear}`;
    const companyName = 'M/S FREIGHTWATCH G SECURITY SERVICES (INDIA) PRIVATE LIMITED';

    // ── Helpers ────────────────────────────────────────────────────────────

    const fmt = (v: number | null | undefined): number =>
      parseFloat(((v ?? 0)).toFixed(2));

    const fmtPct = (v: number | null | undefined): string =>
      (v ?? 0).toFixed(2) + '%';

    const getRow = (label: string): any =>
      summary.find((s: any) =>
        String(s.YearLabel).toLowerCase() === String(label).toLowerCase()
      );

    // Pivot: flat [{Category, Year, Amount}] → Map<category, Map<year, amount>>
    const pivotRows = (rows: any[]): Map<string, Map<number, number>> => {
      const map = new Map<string, Map<number, number>>();
      for (const r of rows) {
        if (!map.has(r.Category)) map.set(r.Category, new Map<number, number>());
        map.get(r.Category)!.set(
          r.Year,
          (map.get(r.Category)!.get(r.Year) ?? 0) + (r.Amount ?? 0)
        );
      }
      return map;
    };

    // Sort pivot map categories — custom order + alphabetical fallback
    const sortedCategories = (
      map: Map<string, Map<number, number>>,
      sortKeys?: string[]
    ): string[] => {
      let cats = Array.from(map.keys());
      if (sortKeys && sortKeys.length > 0) {
        const ranked = cats.map(cat => {
          const catUpper = cat.toUpperCase();
          const idx = sortKeys.findIndex(k =>
            catUpper.includes(k.toUpperCase()) || k.toUpperCase().includes(catUpper));
          return { cat, rank: idx === -1 ? sortKeys.length + 1 : idx };
        });
        ranked.sort((a, b) =>
          a.rank !== b.rank ? a.rank - b.rank : a.cat.localeCompare(b.cat));
        cats = ranked.map(r => r.cat);
      } else {
        cats.sort();
      }
      return cats;
    };

    // ── ExcelJS workbook with logo header ──────────────────────────────────────

    const colCount = years.length + 2; // Particulars + year cols + TOTAL
    const numFmt   = '#,##0.00';       // Indian number format

    // ── Colour palette ──
    const NAVY   = '2c3e50';  // header / section header bg
    const LTNAVY = '34495e';  // total row bg
    const DKNAVY = '1a252f';  // grand total cell
    const GREEN  = '1e8449';  // net profit row (positive)
    const DKGRN  = '196f3d';  // net profit total cell (positive)
    const RED    = 'c0392b';  // net loss row (negative)
    const DKRED  = '96281b';  // net loss total cell (negative)
    const BLUE   = '154360';  // percentage row
    const DKBLUE = '0e2f44';  // pct total cell
    const WHITE  = 'FFFFFF';
    const LBLUE  = 'e8f0fe';  // data total cell bg
    const LGREY  = 'fafafa';  // particulars cell bg

    const wb  = new ExcelJS.Workbook();
    const ws  = wb.addWorksheet('P&L Year Report', { views: [{ state: 'frozen', ySplit: 7 }] });

    // ── Column widths ──
    ws.getColumn(1).width = 42;
    for (let i = 2; i <= colCount; i++) ws.getColumn(i).width = 18;

    // ── Logo image ──
    const logoId = wb.addImage({
      base64: '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',
      extension: 'png'
    });
    // Place logo in rows 1-3, col 1 using pixel-based positioning
    ws.addImage(logoId, {
      tl: { col: 0, row: 0 } as any,
      br: { col: 1, row: 3 } as any,
      editAs: 'oneCell'
    } as any);

    // ── Header rows ──
    // Row 1-3 reserved for logo; put company text to the right of logo
    const r1 = ws.getRow(1);
    r1.height = 20;
    r1.getCell(2).value = companyName;
    r1.getCell(2).font  = { bold: true, size: 13, color: { argb: 'FF1a252f' } };
    r1.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };

    const r2 = ws.getRow(2);
    r2.height = 16;
    r2.getCell(2).value = 'No.397 (old no.281), Anna Salai, Precision Plaza, 1st Floor, Teynampet, 600018 Chennai, Tamil Nadu';
    r2.getCell(2).font  = { size: 9, color: { argb: 'FF444444' } };
    r2.getCell(2).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

    // Divider row (row 4)
    ws.getRow(4).height = 4;
    for (let c = 1; c <= colCount; c++) {
      const cell = ws.getRow(4).getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFc8962a' } };
    }

    // Report title row (row 5)
    const r5 = ws.getRow(5);
    r5.height = 18;
    ws.mergeCells(5, 1, 5, colCount);
    r5.getCell(1).value = `PROFIT & LOSS STATEMENT — ${titleRange}`;
    r5.getCell(1).font  = { bold: true, size: 13, color: { argb: 'FF1a252f' } };
    r5.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Column header row (row 6)
    const r6 = ws.getRow(6);
    r6.height = 20;
    r6.getCell(1).value = 'PARTICULARS';
    years.forEach((y, i) => { r6.getCell(i + 2).value = y; });
    r6.getCell(colCount).value = 'TOTAL';
    r6.eachCell((cell: ExcelJS.Cell) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + NAVY } };
      cell.font      = { bold: true, color: { argb: 'FF' + WHITE }, size: 10 };
      cell.alignment = { horizontal: (cell.col as any) === 1 ? 'left' : 'center', vertical: 'middle' };
      cell.border    = { bottom: { style: 'thin', color: { argb: 'FF' + DKNAVY } } };
    });

    let curRow = 7; // data starts at row 7

    // ── Helpers ──

    const applyFill = (row: ExcelJS.Row, bgHex: string, fontHex: string = WHITE, bold = false): void => {
      row.eachCell({ includeEmpty: false }, (cell: ExcelJS.Cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgHex } };
        cell.font = { bold, size: 10, color: { argb: 'FF' + fontHex } };
        cell.alignment = { vertical: 'middle', horizontal: (cell.col as any) === 1 ? 'left' : 'right' };
      });
    };

    const addSectionHeader = (title: string): void => {
      const row = ws.getRow(curRow++);
      ws.mergeCells(row.number, 1, row.number, colCount);
      row.getCell(1).value = title;
      applyFill(row, NAVY, WHITE, true);
      row.height = 18;
    };

    const addAmtRow = (label: string, field: string, style?: 'total' | 'netprofit' | 'pct'): void => {
      const row = ws.getRow(curRow++);
      row.getCell(1).value = label;
      years.forEach((y, i) => {
        const v = parseFloat(((getRow(String(y))?.[field] ?? 0)).toFixed(2));
        const cell = row.getCell(i + 2);
        cell.value = style === 'pct' ? fmtPct(getRow(String(y))?.[field]) : v;
        if (style !== 'pct') cell.numFmt = numFmt;
      });
      const totCell = row.getCell(colCount);
      if (style === 'pct') {
        totCell.value = fmtPct(getRow('Total')?.[field]);
      } else {
        totCell.value = parseFloat(((getRow('Total')?.[field] ?? 0)).toFixed(2));
        totCell.numFmt = numFmt;
      }
      row.height = 16;
      if (style === 'total') {
        applyFill(row, LTNAVY, WHITE, true);
        row.getCell(colCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + DKNAVY } };
      } else if (style === 'netprofit') {
        const totalNetProfit = getRow('Total')?.[field] ?? 0;
        const isLoss = parseFloat(totalNetProfit) < 0;
        applyFill(row, isLoss ? RED : GREEN, WHITE, true);
        row.getCell(colCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + (isLoss ? DKRED : DKGRN) } };
      } else if (style === 'pct') {
        applyFill(row, BLUE, WHITE, true);
        row.getCell(colCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + DKBLUE } };
      } else {
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + LGREY } };
        row.getCell(colCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + LBLUE } };
        row.getCell(colCount).font = { bold: true, size: 10 };
        row.eachCell((cell: ExcelJS.Cell, c: number) => {
          if (c > 1) cell.alignment = { vertical: 'middle', horizontal: 'right' };
          else cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
      }
    };

    const addPivotSection = (
      sectionLabel: string,
      map: Map<string, Map<number, number>>,
      totalLabel: string,
      sortKeys?: string[]
    ): void => {
      addSectionHeader(sectionLabel);
      const cats = sortedCategories(map, sortKeys);
      cats.forEach(cat => {
        const row = ws.getRow(curRow++);
        const ym  = map.get(cat)!;
        row.getCell(1).value = '   ' + cat;
        row.getCell(1).fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + LGREY } };
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
        let rowTotal = 0;
        years.forEach((y, i) => {
          const v = parseFloat(((ym.get(y) ?? 0)).toFixed(2));
          rowTotal += ym.get(y) ?? 0;
          const cell = row.getCell(i + 2);
          cell.value  = v;
          cell.numFmt = numFmt;
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        });
        const tc = row.getCell(colCount);
        tc.value  = parseFloat(rowTotal.toFixed(2));
        tc.numFmt = numFmt;
        tc.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + LBLUE } };
        tc.font   = { bold: true, size: 10 };
        tc.alignment = { vertical: 'middle', horizontal: 'right' };
        row.height = 15;
      });
      // pivot total
      const trow = ws.getRow(curRow++);
      trow.getCell(1).value = totalLabel;
      let grandTotal = 0;
      years.forEach((y, i) => {
        let sum = 0;
        map.forEach(ym => { sum += ym.get(y) ?? 0; });
        const cell = trow.getCell(i + 2);
        cell.value  = parseFloat(sum.toFixed(2));
        cell.numFmt = numFmt;
        grandTotal += sum;
      });
      const gtc = trow.getCell(colCount);
      gtc.value  = parseFloat(grandTotal.toFixed(2));
      gtc.numFmt = numFmt;
      trow.height = 16;
      applyFill(trow, LTNAVY, WHITE, true);
      trow.getCell(colCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + DKNAVY } };
    };

    // ── SECTION 1: SALES ──
    addSectionHeader('1. SALES');
    addAmtRow('   INVOICE SALES',  'Sales');
    addAmtRow('   OTHER RECEIPTS', 'OtherReceipts');
    addAmtRow('   DEBIT NOTE',     'DebitNote');
    addAmtRow('   CREDIT NOTE',    'CreditNote');
    addAmtRow('TOTAL SALES',       'TotalSales', 'total');

    curRow++; // blank spacer

    // ── SECTION 2: EXPENSES ──
    const expMap = pivotRows(expenses);
    addPivotSection('2. EXPENSES', expMap, 'TOTAL EXPENSES');
    curRow++;

    // ── SECTION 3: PROFIT CALCULATION ──
    addSectionHeader('3. PROFIT CALCULATION');
    addAmtRow('NET PROFIT / (LOSS)', 'NetProfit',        'netprofit');
    addAmtRow('EXPENSES %',          'ExpensesPercent',  'pct');
    addAmtRow('NET PROFIT %',        'NetProfitPercent', 'pct');
    curRow++;

    // ── SECTION 4: OTHERS ──
    const othersMap = pivotRows(others);
    addPivotSection('4. OTHERS', othersMap, 'TOTAL OTHERS', this.othersDisplayOrder);

    // ── Download ──
    const fileName = `PL_Year_Report_${titleRange.replace(' - ', '_to_')}.xlsx`;
    wb.xlsx.writeBuffer().then((buffer: any) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  handleErrors(error: any): void {
    if (error != null && error !== '') {
      this.hideSpinner();
    }
  }

  hideSpinner(): void {
    this.showLoadingSpinner = false;
  }
}
