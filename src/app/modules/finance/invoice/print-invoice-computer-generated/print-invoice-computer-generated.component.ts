import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-print-invoice-computer-generated',
  templateUrl: './print-invoice-computer-generated.component.html',
  styleUrls: ['./print-invoice-computer-generated.component.css']
})
export class PrintInvoiceComputerGeneratedComponent implements OnInit {
  currentUser: string = '';
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  showLoadingSpinner: boolean = false;
  invoiceHtml: SafeHtml | null = null;
  invoiceHtmlRaw: string = '';
  errorMessage: string = '';
  invoiceTemplate: string = '';

  constructor(public sanitizer: DomSanitizer, private _activatedRoute: ActivatedRoute, private router: Router,
    private _dataService: DatasharingService, private http: HttpClient) {
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
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['invoiceId'] != undefined) {
        this.loadInvoiceTemplate();
        this.generateInvoiceHtml(params['invoiceId']);
      }
    });
  }

  ngOnInit(): void {
  }

  loadInvoiceTemplate() {
    const templatePath = 'assets/invoice-templates/invoice.html';
    this.http.get(templatePath, { responseType: 'text' }).subscribe(
      (htmlTemplate: string) => {
        // Load logo and convert to base64
        this.loadLogoBase64().then(logoBase64 => {
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

    this.http.get(environment.baseUrl + 'Finance/GetTaxInvoiceReportData?invoiceId=' + invoiceId).subscribe(
      (data: any) => {
        this.showLoadingSpinner = false;
        if (data.error) {
          this.errorMessage = data.error;
          return;
        }

        const html = this.renderInvoiceHtml(data);
        this.invoiceHtmlRaw = html;
        this.invoiceHtml = this.sanitizer.bypassSecurityTrustHtml(html);
      },
      (error: any) => {
        this.showLoadingSpinner = false;
        this.errorMessage = error?.error?.error || error?.error?.details || error?.error?.message || 'Failed to load invoice data. Please check the server is running and try again.';
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
    const isIntraState = totals.isIntraState || false; // NEW: Check if intra-state

    let html = this.invoiceTemplate
      // Document Type
      .replace(/{{DocumentType}}/g, this.escapeHtml(data.documentType || 'TAX INVOICE (Original for Recipient)'))
      // Company Information
      .replace(/{{CompanyName}}/g, this.escapeHtml(company.name || 'Company Name'))
      .replace(/{{CompanyTagline}}/g, this.escapeHtml(company.tagline || ''))
      .replace(/{{CompanyAddress}}/g, this.escapeHtml(company.address || 'Address'))
      .replace(/{{CompanyGSTIN}}/g, this.escapeHtml(company.gstin || ''))
      .replace(/{{CompanyPAN}}/g, this.escapeHtml(company.pan || ''))
      .replace(/{{CompanyPhone}}/g, this.escapeHtml(company.phone || ''))
      .replace(/{{CompanyEmail}}/g, this.escapeHtml(company.email || ''))
      .replace(/{{CompanyWebsite}}/g, this.escapeHtml(company.website || 'www.fwgsecurity.com'))
      .replace(/{{CINNo}}/g, this.escapeHtml(company.cinNo || company.tan || 'U74920TN2015PTC100425'))
      // Invoice Details
      .replace(/{{InvoiceNo}}/g, this.escapeHtml(invoice.invoiceNoFormatted || 'N/A'))
      .replace(/{{InvoiceDate}}/g, this.escapeHtml(invoice.invoiceDate || 'N/A'))
      .replace(/{{ServicePeriod}}/g, this.escapeHtml(invoice.servicePeriod || ''))
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

    // NEW: Handle GST based on intra-state or inter-state
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
      .replace(/{{InterestRate}}/g, this.escapeHtml(termsAndConditions.interestRate || 'Interest @12% p.a. on delayed payments'))
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


  viewAsPdf() {
    if (!this.invoiceHtmlRaw) {
      this.errorMessage = 'Please generate an invoice first.';
      return;
    }

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #000; background: white; padding: 16px; }
  </style>
</head>
<body>${this.invoiceHtmlRaw}</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  // Fallback to old RPT method if needed
  printReportClick(invoiceID: number) {
    this.url = environment.baseReportUrl;
    this.url += 'Finance/TaxInvoiceReportComputerGenerated.aspx?';
    this.url += "LoginID=" + this.currentUser;
    this.url += "&ID=" + invoiceID;
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

}
