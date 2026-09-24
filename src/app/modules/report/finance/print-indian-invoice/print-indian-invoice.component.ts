import { LiveAnnouncer } from '@angular/cdk/a11y';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { FinanceService } from 'src/app/service/finance.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

export interface PeriodicElement {
  s_no: number,
  client_name: string,
}

@Component({
  selector: 'app-print-indian-invoice',
  templateUrl: './print-indian-invoice.component.html',
  styleUrls: ['./print-indian-invoice.component.css']
})
export class PrintIndianInvoiceComponent implements AfterViewInit {
  rowCheckedState: boolean[] = [];
  displayedColumns: string[] = ['s_no', 'Name', 'WorkPlace'];
  dataSource = new MatTableDataSource();
  frm!: FormGroup
  currentUser: string = '';
  branchList: any;
  userAccessModel!: UserAccessModel;
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  batchInvoice: any = [];
  selectedBatchInvoiceIds: string[] = [];
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  invoiceHtml: SafeHtml | null = null;
  invoiceHtmlRaw: string = '';
  invoiceTemplate: string = '';
  client: any;
  InvoiceDate: any;
  Subject: any;
  Note: any;
  currentInvoiceIndex: number = 0;
  totalInvoices: number = 0;

  constructor(public sanitizer: DomSanitizer, private fb: FormBuilder, public dialog: MatDialog,
    private _liveAnnouncer: LiveAnnouncer, private service: FinanceService, private router: Router,
    private _dataService: DatasharingService, private _masterService: MastermoduleService, private http: HttpClient) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.frm = this.fb.group({
      invoice_period: ['', [Validators.required]],
      branch: ['', [Validators.required]],
      client: [''],
      checkAll: [false]
    });
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

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this._dataService.scrollToTop(); // Scroll to top on route change
      }
    });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Invoice Report');
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
            this.service.GetBranchListByUserName(this.currentUser).subscribe((d: any) => {
              this.branchList = d;
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

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
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
  changeAdvanceDate() {
    this.getClients();
  }
  getClients() {
    const branchValue = this.frm.get("branch")?.value;
    const invoicePeriodValue = this.frm.get("invoice_period")?.value;

    if (branchValue && branchValue !== "" && invoicePeriodValue) {
      let branch = branchValue;
      this.InvoiceDate = this.returnDate(invoicePeriodValue);

      let dateStr = this.returnMonthAndYear(invoicePeriodValue);
      this.Subject = "Being Charges for Security Services for the month of " + dateStr;
      this.Note = "Being Charges for Security Services for the month of " + dateStr;

      this.rowCheckedState = [];
      this.service.getBatchInvoiceClients(branch, this.InvoiceDate).subscribe((d: any) => {

        this.batchInvoice = d['batchInvoice'];
        this.setDatasource(this.batchInvoice);

        for (let i = 0; i < this.batchInvoice.length; i++) {
          this.rowCheckedState.push(false);
        }
      }, () => {
      },
        () => {
          this.toggleRowCheckboxAll();
        });
    }
  }

  toggleRowCheckbox(index: number, id: string) {
    // Toggle the checkbox state
    this.rowCheckedState[index] = !this.rowCheckedState[index];

    // Add or remove ID from selectedBatchInvoiceIds
    if (this.rowCheckedState[index]) {
      this.selectedBatchInvoiceIds.push(id);
    } else {
      this.selectedBatchInvoiceIds = this.selectedBatchInvoiceIds.filter(invoiceId => invoiceId !== id);
    }
    // Check if all rows are selected
    let allChecked = this.rowCheckedState.every(checked => checked);
    this.frm.get('checkAll')?.setValue(allChecked);
  }

  toggleRowCheckboxAll() {
    let state = this.frm.get('checkAll')?.value; // Get the current state of the "checkAll" checkbox

    this.rowCheckedState = this.rowCheckedState.map(() => state); // Set all rows to the same state

    if (state) {
      // If "checkAll" is checked, add all IDs to the selectedBatchInvoiceIds
      this.selectedBatchInvoiceIds = (this.batchInvoice || []).map((invoice: { ID: any; }) => invoice.ID);
    } else {
      // If "checkAll" is unchecked, clear the selectedBatchInvoiceIds
      this.selectedBatchInvoiceIds = [];
    }
  }

  setDatasource(d: any) {
    this.dataSource = new MatTableDataSource(d);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
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

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideLoadingSpinner()
    }
  }

  printIndianInvoiceClick() {
    if (this.selectedBatchInvoiceIds.length === 0) {
      this.errorMessage = 'Please select at least one invoice to print.';
      return;
    }

    // Initialize pagination
    this.currentInvoiceIndex = 0;
    this.totalInvoices = this.selectedBatchInvoiceIds.length;

    // Load the HTML template and populate with invoice data from API
    this.generateInvoiceHtml(this.selectedBatchInvoiceIds[0]);
  }

  loadInvoiceTemplate(): Promise<void> {
    const templatePath = 'assets/invoice-templates/invoice.html';
    return firstValueFrom(this.http.get(templatePath, { responseType: 'text' })).then(
      (htmlTemplate: string) => {
        // Load logo and convert to base64
        return this.loadLogoBase64().then(logoBase64 => {
          this.invoiceTemplate = htmlTemplate.replace(
            'src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="',
            `src="${logoBase64}"`
          );
        }).catch(error => {
          console.warn('Could not load logo, using placeholder');
          this.invoiceTemplate = htmlTemplate;
        });
      },
      (error) => {
        console.error('Could not load invoice template', error);
        this.errorMessage = 'Could not load invoice template. Please try again.';
      }
    );
  }

  async loadLogoBase64(): Promise<string> {
    try {
      const response = await fetch('assets/img/logo-white.png');
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      throw error;
    }
  }

  generateInvoiceHtml(invoiceId: string) {
    this.showLoadingSpinner = true;
    this.errorMessage = '';

    this.http.get(environment.baseUrl + 'Finance/GetIndianInvoiceReportData?invoiceId=' + invoiceId).subscribe(
      async (data: any) => {
        this.showLoadingSpinner = false;
        if (data.error) {
          this.errorMessage = data.error;
          return;
        }

        // Wait for the template to be ready before rendering
        if (!this.invoiceTemplate) {
          await this.loadInvoiceTemplate();
        }

        const html = this.renderInvoiceHtml(data);
        this.invoiceHtmlRaw = html;
        this.invoiceHtml = this.sanitizer.bypassSecurityTrustHtml(html);
      },
      (error: any) => {
        this.showLoadingSpinner = false;
        this.errorMessage = 'Failed to load invoice data. Please check the server is running and try again.';
        console.error('API error loading invoice:', error);
      }
    );
  }

  private renderInvoiceHtml(data: any): string {
    if (!this.invoiceTemplate) {
      return '<div class="error-message">Template not loaded</div>';
    }

    // Generate data rows HTML with complete formatting
    let dataRowsHtml = '';
    // Format currency as Indian format ()
    const formatCurrency = (value: any) => {
      const num = parseFloat(value) || 0;
      return Math.round(num).toLocaleString('en-IN');
    };

    if (data.dataRows && data.dataRows.length > 0) {
      data.dataRows.forEach((row: any, index: number) => {
        const sno = (index + 1).toString();
        const hsnCode = this.escapeHtml(row.hsnSacCode || row.hsn_code || '');
        const description = this.escapeHtml(row.description || 'Security Services');
        const duties = this.escapeHtml(row.dutiesTaxes || row.duties || '');
        const qty = parseFloat(row.units || row.qty || 0).toFixed(0);

        // Use Indian formatting for rate and amount
        const rateFormatted = formatCurrency(row.rate || 0);
        const amountFormatted = formatCurrency(row.amount || 0);

        dataRowsHtml += `
        <tr>
            <td class="text-center">${sno}</td>
            <td class="col-particulars">${description}</td>
            <td class="text-center">${hsnCode}</td>
            <td class="text-center">${duties}</td>
            <td class="text-center">${qty}</td>
            <td class="text-right">₹ ${rateFormatted}</td>
            <td class="text-right">₹ ${amountFormatted}</td>
        </tr>`;
      });
    } else {
      dataRowsHtml = '<tr><td colspan="7" class="text-center">No items found</td></tr>';
    }

    // Safely extract data with fallback values
    const company = data.company || {};
    const invoice = data.invoice || {};
    const client = data.client || {};
    const totals = data.totals || {};
    const statutory = data.statutory || {};
    const declaration = data.declaration || {};
    const termsAndConditions = data.termsAndConditions || {};
    const isIntraState = totals.isIntraState || false; // Check if intra-state

    let html = this.invoiceTemplate
      // Document Type
      .replace(/{{DocumentType}}/g, this.escapeHtml(data.documentType || 'INDIAN TAX INVOICE (Original for Recipient)'))
      // Company Information
      .replace(/{{CompanyName}}/g, this.escapeHtml(company.name || 'Company Name'))
      .replace(/{{CompanyTagline}}/g, this.escapeHtml(company.tagline || ''))
      .replace(/{{CompanyAddress}}/g, this.escapeHtml(company.address || 'Address'))
      .replace(/{{CompanyGSTIN}}/g, this.escapeHtml(company.gstin || ''))
      .replace(/{{CompanyPAN}}/g, this.escapeHtml(company.pan || ''))
      .replace(/{{CompanyPhone}}/g, this.escapeHtml(company.phone || ''))
      .replace(/{{CompanyEmail}}/g, this.escapeHtml(company.email || ''))
      .replace(/{{CompanyWebsite}}/g, this.escapeHtml(company.website || 'www.fwgindia.com'))
      .replace(/{{CINNo}}/g, this.escapeHtml(company.cinNo || company.tan || 'U74920TN2005PTC057775'))
      // Invoice Details
      .replace(/{{InvoiceNo}}/g, this.escapeHtml(invoice.invoiceNoFormatted || 'N/A'))
      .replace(/{{InvoiceDate}}/g, this.escapeHtml(invoice.invoiceDate || 'N/A'))
      .replace(/{{ServicePeriod}}/g, this.escapeHtml(invoice.servicePeriod || ''))
      .replace(/{{PlaceOfSupply}}/g, this.escapeHtml(invoice.placeOfSupply || client.billingState || ''))
      // Work Order Bar - only show if work order number exists
      .replace(/{{WorkOrderBar}}/g, (invoice.workOrderNoFormatted && invoice.workOrderNoFormatted.trim() !== '')
        ? `<div class="work-order-full-bar">WORK ORDER NO: ${this.escapeHtml(invoice.workOrderNoFormatted)} &nbsp;|&nbsp; WORK ORDER DATE: ${this.escapeHtml(invoice.workOrderDate || '')}</div>`
        : '')
      .replace(/{{SACCode}}/g, this.escapeHtml(invoice.sacCode || ''))
      // Statutory Details
      .replace(/{{PAN}}/g, this.escapeHtml(statutory.pan || company.pan || 'AACCF8611P'))
      .replace(/{{GSTIN}}/g, this.escapeHtml(statutory.gstin || company.gstin || ''))
      .replace(/{{ESIC}}/g, this.escapeHtml(statutory.esic || '51001204250000999'))
      .replace(/{{EPFNo}}/g, this.escapeHtml(statutory.epf || 'TNMAS1598210000'))
      // Billing Information
      .replace(/{{BillingName}}/g, this.escapeHtml(client.billingName || client.name || 'Billing Name'))
      .replace(/{{BillingAddress}}/g, this.escapeHtml(client.billingAddress || client.address || 'Billing Address'))
      .replace(/{{BillingGSTIN}}/g, this.escapeHtml(client.billingGSTIN || client.gstin || ''))
      .replace(/{{BillingState}}/g, this.escapeHtml(client.billingState || client.state || ''))
      // Shipping Information
      .replace(/{{ShippingName}}/g, this.escapeHtml(client.shippingName || client.billingName || client.name || 'Shipping Name'))
      .replace(/{{ShippingAddress}}/g, this.escapeHtml(client.shippingAddress || client.billingAddress || client.address || 'Shipping Address'))
      .replace(/{{ShippingGSTIN}}/g, this.escapeHtml(client.shippingGSTIN || client.billingGSTIN || client.gstin || ''))
      .replace(/{{ShippingState}}/g, this.escapeHtml(client.shippingState || client.billingState || client.state || ''))
      // Line Items and Subtotal
      .replace(/{{DataRows}}/g, dataRowsHtml)
      .replace(/{{Subtotal}}/g, formatCurrency(totals.subtotal || 0))
      .replace(/{{DiscountDuties}}/g, (totals.discountDuties || 0).toString())
      .replace(/{{DiscountAmount}}/g, formatCurrency(totals.discountAmount || 0))
      .replace(/{{TaxableValue}}/g, formatCurrency(totals.taxableValue || 0));

    // Handle GST based on intra-state or inter-state
    if (isIntraState) {
      // Intra-state: Show CGST (9%) + SGST (9%), hide IGST row
      html = html
        .replace(/{{CGSTPct}}/g, (totals.cgstPct || 9).toString())
        .replace(/{{SGSTPct}}/g, (totals.sgstPct || 9).toString())
        .replace(/{{CGSTAmount}}/g, formatCurrency(totals.cgstAmount || 0))
        .replace(/{{SGSTAmount}}/g, formatCurrency(totals.sgstAmount || 0))
        .replace(/{{IGSTPct}}/g, '0')
        .replace(/{{IGSTAmount}}/g, '₹ 0.00');
      // Hide IGST row for intra-state using class selector
      html = html.replace(/<tr[^>]*class="igst-row"[^>]*>[\s\S]*?<\/tr>/gi, '');
    } else {
      // Inter-state: Show IGST (18%) only, hide CGST/SGST rows
      html = html
        .replace(/{{CGSTPct}}/g, '0')
        .replace(/{{SGSTPct}}/g, '0')
        .replace(/{{CGSTAmount}}/g, '₹ 0.00')
        .replace(/{{SGSTAmount}}/g, '₹ 0.00')
        .replace(/{{IGSTPct}}/g, (totals.igstPct || 18).toString())
        .replace(/{{IGSTAmount}}/g, formatCurrency(totals.igstAmount || 0));
      // Hide CGST and SGST rows for inter-state using class selectors
      html = html.replace(/<tr[^>]*class="cgst-row"[^>]*>[\s\S]*?<\/tr>/gi, '');
      html = html.replace(/<tr[^>]*class="sgst-row"[^>]*>[\s\S]*?<\/tr>/gi, '');
    }

    // Continue with remaining placeholders
    html = html
      .replace(/{{GrandTotal}}/g, formatCurrency(totals.grandTotal || 0))
      .replace(/{{AmountInWords}}/g, this.escapeHtml(totals.amountInWords || 'Amount in words'))
      // Bank Details
      .replace(/{{BankName}}/g, this.escapeHtml(company.bankName || ''))
      .replace(/{{AccountNo}}/g, this.escapeHtml(company.bankAccount || ''))
      .replace(/{{IFSCCode}}/g, this.escapeHtml(company.ifscCode || ''))
      .replace(/{{BankBranch}}/g, this.escapeHtml(company.bankBranch || ''))
      .replace(/{{AccountType}}/g, this.escapeHtml(company.accountType || 'Current Account'))
      // Notes & Declaration
      .replace(/{{ThankYouMessage}}/g, this.escapeHtml(declaration.thankYou || 'Thank you for your business'))
      .replace(/{{ServiceValueMessage}}/g, this.escapeHtml(declaration.serviceValue || 'Invoice confirms actual service value'))
      .replace(/{{TruthStatement}}/g, this.escapeHtml(declaration.truthStatement || 'All details are true and correct'))
      // Terms & Conditions
      .replace(/{{PaymentMethod}}/g, this.escapeHtml(termsAndConditions.paymentMethod || 'Payment via NEFT / Account Payee Cheque'))
      .replace(/{{PayableTo}}/g, this.escapeHtml(termsAndConditions.payableTo || 'FreightWatch G Security Services India Pvt. Ltd.'))
      .replace(/{{InterestRate}}/g, this.escapeHtml(termsAndConditions.interestRate || 'Interest @18% p.a. on delayed payments'))
      .replace(/{{Discrepancies}}/g, this.escapeHtml(termsAndConditions.discrepancies || 'Discrepancies must be reported within receipt'))
      .replace(/{{Authorization}}/g, this.escapeHtml(termsAndConditions.authorization || 'Contains official stamp and authorized signature'))
      // Global Office
      .replace(/{{GlobalOfficeAddress}}/g, this.escapeHtml(company.globalOfficeAddress || 'No. 23 & 24, Taman Bukit Emas, Jalan Tampin, 70450 Seremban, Negeri Sembilan, Malaysia'))
      .replace(/{{GlobalOfficePhone}}/g, this.escapeHtml(company.globalOfficePhone || '+60 6 677 2000'))
      .replace(/{{GlobalOfficeFax}}/g, this.escapeHtml(company.globalOfficeFax || '+60 6 677 9866'));

    return html;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  printInvoice() {
    if (!this.invoiceHtmlRaw) {
      this.errorMessage = 'Please generate an invoice first before printing.';
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tax Invoice</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              color: #000; 
              background: white;
              padding: 0;
              margin: 0;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 0; 
                background: white; 
              }
              .invoice-container {
                box-shadow: none;
                margin: 0;
                padding: 0;
                width: 100%;
                page-break-after: avoid;
              }
              .invoice-header, .invoice-title, .invoice-meta, 
              .billing-section, .table-container, 
              .totals-section, .amount-words, .footer-section, .signature {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>${this.invoiceHtmlRaw}</body>
      </html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  hideLoadingSpinner() {
    this.showLoadingSpinner = false
  }

  previousInvoice() {
    if (this.currentInvoiceIndex > 0) {
      this.currentInvoiceIndex--;
      this.generateInvoiceHtml(this.selectedBatchInvoiceIds[this.currentInvoiceIndex]);
    }
  }

  nextInvoice() {
    if (this.currentInvoiceIndex < this.totalInvoices - 1) {
      this.currentInvoiceIndex++;
      this.generateInvoiceHtml(this.selectedBatchInvoiceIds[this.currentInvoiceIndex]);
    }
  }

  goToInvoice(index: number) {
    if (index >= 0 && index < this.totalInvoices) {
      this.currentInvoiceIndex = index;
      this.generateInvoiceHtml(this.selectedBatchInvoiceIds[index]);
    }
  }

  get canGoPrevious(): boolean {
    return this.currentInvoiceIndex > 0;
  }

  get canGoNext(): boolean {
    return this.currentInvoiceIndex < this.totalInvoices - 1;
  }

  get currentPageNumber(): number {
    return this.currentInvoiceIndex + 1;
  }
}
