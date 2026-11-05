import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { SearchInvoiceComponent } from '../../finance/invoice/search-invoice/search-invoice.component';
import { CommonService } from "../../../service/common.service";
import { InventoryService } from "../../../service/inventory.service";
import { SearchUtilityBillsComponent } from "./search-utility-bills/search-utility-bills.component";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import Swal from "sweetalert2";
import { UserRegistration } from "../../../model/userregistration";
import { Router } from "@angular/router";
import { DatasharingService } from "../../../service/datasharing.service";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { forkJoin } from 'rxjs';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';

export interface IItemDetails {
  ID: number,
  InvoicePeriodFrom: Date,
  InvoicePeriodTo: Date,
  Amount: number,
  Note: string,
  index: number,
  SerialNo: number,
  ItemID: number,
  NoOfUnits: number,
  CostPerUnit: number,
  ValuePeriod: number,
  ValuePercentage: number,
  ValueStatus: string,
}

@Component({
  selector: 'app-utility-bills',
  templateUrl: './utility-bills.component.html',
  styleUrls: ['./utility-bills.component.css']
})
export class UtilityBillsComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['InvoicePeriodFrom', 'InvoicePeriodTo', 'Amount', 'Note', 'action'];
  frm!: FormGroup;
  details: IItemDetails[] = [];
  branchList: any = [];
  supplierList: any = [];
  categoryList: any = [];
  payList: any = [];
  dataSource!: MatTableDataSource<IItemDetails>;
  detailEdit: boolean = false;
  errorDescription: string = "";
  isEdit: boolean = false;
  user: UserRegistration;
  returnResult: any;
  userAccessModel!: UserAccessModel;
  currentUser: string = '';
  warningMessage: string = '';
  errorMessage: string = '';
  showLoadingSpinner: boolean = false;
  invoiceID = 0;

  // ── Convenience getter ─────────────────────────────────────────────────────
  get isInterState(): boolean {
    return this.frm.get('TransactionType')?.value === 'E';
  }

  // ── Auto-detect intra/inter from branch state vs supplier state ────────────
  private detectTransactionType(): void {
    const branchCode   = this.frm.get('Branch')?.value;
    const supplierId   = this.frm.get('Supplier')?.value;

    if (!branchCode || !supplierId) return;

    const branch   = this.branchList.find((b: any) => b.Code === branchCode);
    const supplier = this.supplierList.find((s: any) => s.Id?.toString() === supplierId?.toString());

    if (!branch || !supplier) return;

    const branchState   = (branch.State   ?? '').trim().toLowerCase();
    const supplierState = (supplier.State ?? '').trim().toLowerCase();

    if (!branchState || !supplierState) return; // can't determine — leave as-is

    const txType = branchState === supplierState ? 'I' : 'E';
    this.frm.get('TransactionType')?.setValue(txType, { emitEvent: false });

    // Clear stale GST amounts when type is determined
    if (txType === 'I') {
      this.frm.patchValue({ IGSTPercentage: 0, IGSTAmount: 0 }, { emitEvent: false });
    } else {
      this.frm.patchValue({
        CGSTPercentage: 0, CGSTAmount: 0,
        SGSTPercentage: 0, SGSTAmount: 0
      }, { emitEvent: false });
    }
  }

  // ── Computed totals ────────────────────────────────────────────────────────
  get baseTotal(): number {
    return this.details.reduce((sum, d: any) => sum + (Number(d['Amount']) || 0), 0);
  }

  /** Total GST for Net Payable — IGST when inter-state, CGST+SGST when intra-state */
  get totalGSTAmount(): number {
    if (this.isInterState) {
      return Number(this.frm.get('IGSTAmount')?.value) || 0;
    }
    return (Number(this.frm.get('CGSTAmount')?.value) || 0)
         + (Number(this.frm.get('SGSTAmount')?.value) || 0);
  }

  get netPayable(): number {
    const tdsAmount = Number(this.frm.get('TDSAmount')?.value) || 0;
    return this.baseTotal + this.totalGSTAmount - tdsAmount;
  }

  // ── GST type toggle (called internally only — no longer on HTML) ──────────
  private onTransactionTypeChange(): void {
    // Clear all GST fields when switching type to avoid stale values
    this.frm.patchValue({
      CGSTPercentage: 0, CGSTAmount: 0,
      SGSTPercentage: 0, SGSTAmount: 0,
      IGSTPercentage: 0, IGSTAmount: 0,
    }, { emitEvent: false });
  }

  // ── CGST auto-calculate ────────────────────────────────────────────────────
  onCGSTPercentageChange(): void {
    const pct = Number(this.frm.get('CGSTPercentage')?.value) || 0;
    this.frm.get('CGSTAmount')?.setValue(
      pct > 0 ? parseFloat((this.baseTotal * pct / 100).toFixed(2)) : 0,
      { emitEvent: false }
    );
  }

  // ── SGST auto-calculate ────────────────────────────────────────────────────
  onSGSTPercentageChange(): void {
    const pct = Number(this.frm.get('SGSTPercentage')?.value) || 0;
    this.frm.get('SGSTAmount')?.setValue(
      pct > 0 ? parseFloat((this.baseTotal * pct / 100).toFixed(2)) : 0,
      { emitEvent: false }
    );
  }

  // ── IGST auto-calculate ────────────────────────────────────────────────────
  onIGSTPercentageChange(): void {
    const pct = Number(this.frm.get('IGSTPercentage')?.value) || 0;
    this.frm.get('IGSTAmount')?.setValue(
      pct > 0 ? parseFloat((this.baseTotal * pct / 100).toFixed(2)) : 0,
      { emitEvent: false }
    );
  }

  // ── TDS auto-calculate ─────────────────────────────────────────────────────
  onTDSPercentageChange(): void {
    const pct = Number(this.frm.get('TDSPercentage')?.value) || 0;
    this.frm.get('TDSAmount')?.setValue(
      pct > 0 ? parseFloat((this.baseTotal * pct / 100).toFixed(2)) : 0,
      { emitEvent: false }
    );
  }

  constructor(private fb: FormBuilder, public dialog: MatDialog, private _liveAnnouncer: LiveAnnouncer,
    commonService: CommonService, private service: InventoryService, private route: Router,
    private _dataService: DatasharingService, private _masterService: MastermoduleService) {

    this.userAccessModel = {
      readAccess: false, updateAccess: false,
      deleteAccess: false, createAccess: false,
    };

    this.user = commonService.getLocalUser();

    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == 'null' || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => { this.currentUser = username; });
    }
    this.getUserAccessRights(this.currentUser, 'Utility Bills');

    this.frm = this.fb.group({
      ID: [0],
      Branch: [''],
      Supplier: [''],
      ItemCategory: [''],
      RecID: [''],
      InvoiceNo: [''],
      InvoiceDate: [''],
      PaymentDate: [''],
      // 'I' = Intra-state (CGST+SGST), 'E' = Inter-state (IGST)
      TransactionType: ['I'],
      // Intra-state
      CGSTPercentage: [0],
      CGSTAmount: [0],
      SGSTPercentage: [0],
      SGSTAmount: [0],
      // Inter-state
      IGSTPercentage: [0],
      IGSTAmount: [0],
      // TDS
      TDSPercentage: [0],
      TDSAmount: [0],
      details: this.fb.group({
        ID: [0],
        InvoicePeriodFrom: [''],
        InvoicePeriodTo: [''],
        Amount: [''],
        Note: [''],
        index: [-1],
        SerialNo: [0]
      })
    });
  }

  ngAfterViewInit() { }

  ngOnInit() {
    this._dataService.getSelectedInvoice().subscribe((result: any) => {
      if (!result || result.length === 0) return;

      this.returnResult = { ...result };
      this.invoiceID = result.ID;

      this.frm.patchValue(this.returnResult);
      this.frm.get('Supplier')?.setValue(result.Supplier.toString());
      this.frm.get('ItemCategory')?.setValue(result.ItemCategory.toString());

      // ── Restore transaction type ─────────────────────────────────────────
      const txType = result.TransactionType ?? 'I';
      this.frm.get('TransactionType')?.setValue(txType);

      // ── Restore GST fields ───────────────────────────────────────────────
      const igstAmt = result.IGSTAmount ?? 0;
      const cgstAmt = result.CGSTAmount ?? 0;
      const sgstAmt = result.SGSTAmount ?? 0;

      if (txType === 'E') {
        // Inter-state record
        if (igstAmt === 0 && (result.GSTAmount ?? 0) > 0) {
          // Legacy record (no IGST columns yet) — treat full GSTAmount as IGST
          this.frm.get('IGSTPercentage')?.setValue(result.GSTPercentage ?? 0);
          this.frm.get('IGSTAmount')?.setValue(result.GSTAmount ?? 0);
        } else {
          this.frm.get('IGSTPercentage')?.setValue(result.IGSTPercentage ?? 0);
          this.frm.get('IGSTAmount')?.setValue(igstAmt);
        }
        this.frm.patchValue({ CGSTPercentage: 0, CGSTAmount: 0, SGSTPercentage: 0, SGSTAmount: 0 });
      } else {
        // Intra-state record
        if (cgstAmt === 0 && sgstAmt === 0 && (result.GSTAmount ?? 0) > 0) {
          // Legacy record — split old GSTAmount 50/50
          const half    = parseFloat(((result.GSTAmount ?? 0) / 2).toFixed(2));
          const halfPct = parseFloat(((result.GSTPercentage ?? 0) / 2).toFixed(2));
          this.frm.patchValue({ CGSTPercentage: halfPct, CGSTAmount: half,
                                 SGSTPercentage: halfPct, SGSTAmount: half });
        } else {
          this.frm.patchValue({
            CGSTPercentage: result.CGSTPercentage ?? 0, CGSTAmount: cgstAmt,
            SGSTPercentage: result.SGSTPercentage ?? 0, SGSTAmount: sgstAmt,
          });
        }
        this.frm.patchValue({ IGSTPercentage: 0, IGSTAmount: 0 });
      }

      this.frm.get('TDSPercentage')?.setValue(result.TDSPercentage ?? 0);
      this.frm.get('TDSAmount')?.setValue(result.TDSAmount ?? 0);

      this.categoryChange();
    });
  }

  onInvoiceDateSelected(event: any): void {
    const selectedDate = event.value;
    const invoicePeriodFromControl = this.frm.get('details.InvoicePeriodFrom');
    const invoicePeriodToControl   = this.frm.get('details.InvoicePeriodTo');
    if (selectedDate) {
      const paymentDate = this.frm.get('PaymentDate')?.value;
      if (invoicePeriodFromControl && this.returnDate(selectedDate) <= this.returnDate(paymentDate)) {
        invoicePeriodFromControl.setValue(this.returnDate(selectedDate));
      } else if (invoicePeriodFromControl) {
        invoicePeriodFromControl.setValue(this.returnDate(selectedDate));
        this.frm.get('PaymentDate')?.setValue(null);
        invoicePeriodToControl?.setValue('');
        this.showMessage(`Payment date cannot be earlier than the Invoice date.`, 'warning', 'Warning Message');
      }
    }
  }

  onPaymentDateSelected(event: any): void {
    const selectedDate = event.value;
    const invoicePeriodToControl = this.frm.get('details.InvoicePeriodTo');
    if (selectedDate) {
      const invoiceDate = this.frm.get('InvoiceDate')?.value;
      if (invoiceDate && this.returnDate(selectedDate) >= this.returnDate(invoiceDate)) {
        invoicePeriodToControl?.setValue(this.returnDate(selectedDate));
      } else if (invoiceDate) {
        this.frm.get('PaymentDate')?.setValue(null);
        invoicePeriodToControl?.setValue('');
        this.showMessage(`Payment date cannot be earlier than the Invoice date.`, 'warning', 'Warning Message');
      }
    }
  }

  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.showLoadingSpinner = true;
          this.userAccessModel.readAccess   = data.Read;
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;

          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            this.service.getUtilityMaster("U,O", "", this.currentUser).subscribe((d: any) => {
              this.branchList   = d['branchList'];
              this.supplierList = d['supplierList'];
              this.categoryList = d['categoryList'];
            });
            this.hideLoadingSpinner();
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            this.hideLoadingSpinner();
          }
        }
      },
      (error) => { this.handleErrors(error); }
    );
  }

  searchinvoice() {
    this.route.navigate(['/finance/utility-search']);
  }

  onBranchChange(): void {
    this.detectTransactionType();
  }

  categoryChange() {
    this.service.GetPaytoByCategory(this.frm.get('ItemCategory')?.value).subscribe((d: any) => {
      this.payList = [...d['List1'], ...d['List2']];
    }, () => { }, () => {
      const id = this.frm.get('ID')?.value;
      if (id != 0) {
        this.isEdit = true;
        this.frm.get('RecID')?.setValue(this.returnResult['RecID'].toString());
        this.service.GetUtilityDetailsByID(id).subscribe((d: any) => {
          d.map((row: any) => {
            row['InvoicePeriodFrom'] = this.returnDate(row['InvoicePeriodFrom']);
            row['InvoicePeriodTo']   = this.returnDate(row['InvoicePeriodTo']);
          });
          this.details = [...d];
          this.detailDataSource();
        });
      }
    });
  }

  detailDataSource() {
    this.dataSource = new MatTableDataSource(this.details);
    this.dataSource.sort      = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  addItemDetails(action: string) {
    this.errorDescription = '';
    const frmData = this.frm.getRawValue();
    const details = frmData['details'];

    if (!details['InvoicePeriodFrom'] || !details['InvoicePeriodTo'] || details['Amount'] === '' || details['Amount'] == null) {
      this.errorDescription = 'please fill the field';
      return;
    }

    details['InvoicePeriodFrom'] = this.returnDate(this.frm.get('details.InvoicePeriodFrom')?.value);
    details['InvoicePeriodTo']   = this.returnDate(this.frm.get('details.InvoicePeriodTo')?.value);

    if (action === 'add') {
      details['ID'] = 0;
      this.details.push(details);
    } else if (details['index'] >= 0 && action === 'update') {
      this.details[details['index']] = details;
    }

    this.detailDataSource();
    this.emptyDetailData();
    this.detailEdit = false;
  }

  emptyDetailData() {
    this.frm.get('details')?.setValue({
      ID: 0, InvoicePeriodFrom: '', InvoicePeriodTo: '',
      Amount: 0, Note: '', index: -1, SerialNo: 0
    });
  }

  editRow(row: IItemDetails, index: any) {
    this.detailEdit = true;
    row['index'] = index;
    this.frm.get('details')?.patchValue(row);
  }

  deleteRow(row: IItemDetails, index: any) {
    if (row.ID != 0) {
      this.service.DeleteUtilityDetailById(row.ID + '').subscribe(() => { });
    }
    this.details.splice(index, 1);
    this.detailDataSource();
  }

  supplierChange(event: any) {
    this.frm.get('RecID')?.setValue(event.value);
    this.detectTransactionType();
  }

  returnDate(date?: any): string {
    const d = date ? new Date(date) : new Date();
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit() {
    if (this.frm.invalid) return;

    const data = this.frm.getRawValue();

    this.details.forEach((d: any, index) => {
      d['InvoicePeriodFrom'] = this.returnDate(d['InvoicePeriodFrom']);
      d['InvoicePeriodTo']   = this.returnDate(d['InvoicePeriodTo']);
      d['SerialNo']          = index + 1;
      d['LastUpdatedBy']     = this.currentUser;
    });

    data['Total']    = this.details.reduce((s: number, d: any) => s + (Number(d['Amount']) || 0), 0);
    data['details']  = this.details;
    data['InvoiceType']   = 'U';
    data['InvoiceDate']   = this.returnDate(this.frm.get('InvoiceDate')?.value);
    data['PaymentDate']   = this.returnDate(this.frm.get('PaymentDate')?.value);
    data['LastUpdatedBy'] = this.currentUser;

    // Transaction type
    data['TransactionType'] = this.frm.get('TransactionType')?.value ?? 'I';

    // CGST / SGST (intra-state)
    data['CGSTPercentage'] = Number(this.frm.get('CGSTPercentage')?.value) || 0;
    data['CGSTAmount']     = Number(this.frm.get('CGSTAmount')?.value)     || 0;
    data['SGSTPercentage'] = Number(this.frm.get('SGSTPercentage')?.value) || 0;
    data['SGSTAmount']     = Number(this.frm.get('SGSTAmount')?.value)     || 0;

    // IGST (inter-state)
    data['IGSTPercentage'] = Number(this.frm.get('IGSTPercentage')?.value) || 0;
    data['IGSTAmount']     = Number(this.frm.get('IGSTAmount')?.value)     || 0;

    // TDS
    data['TDSPercentage'] = Number(this.frm.get('TDSPercentage')?.value) || 0;
    data['TDSAmount']     = Number(this.frm.get('TDSAmount')?.value)     || 0;

    this.service.saveUtility(data).subscribe(() => {
      this._dataService.setSelectedInvoice([]);
      const msg = this.isEdit ? 'Successfully Updated Expenses Details'
                              : 'Successfully Saved Expenses Details';
      this.showMessage(msg, 'success', 'Success Message');
      this.frm.reset();
      this.details = [];
      this.detailDataSource();
      this.route.navigate(['/inventory/utility-bills']);
    });
  }

  onCancel() {
    this._dataService.setSelectedInvoice([]);
    this.route.navigate(['/inventory/utility-bills']);
  }

  deleteButtonClick() {
    this.showLoadingSpinner = true;
    this.dialog.open(DialogConfirmationComponent, { data: `Are you sure want to delete this expense?` })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {
          if (this.invoiceID > 0) {
            this.service.isCreditorInvoice(this.invoiceID).subscribe({
              next: (isAvailable: boolean) => {
                if (isAvailable) {
                  forkJoin({ done: this.service.deleteExpensesById(this.invoiceID, this.currentUser) })
                    .subscribe({
                      next: () => {
                        this._dataService.setSelectedInvoice([]);
                        this.route.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                          this.route.navigate(['/inventory/utility-bills']);
                        });
                        this.showMessage(`Expenses Bill details are deleted successfully.`, 'success', 'Success Message');
                      },
                      error: (err: any) => { console.error('Delete error', err); }
                    });
                } else {
                  this.showMessage(`Expenses Bill Payment Exist. Please Check.`, 'warning', 'Warning Message');
                }
              },
              error: (err: any) => { console.error('Check error', err); }
            });
          } else {
            this.hideLoadingSpinner();
          }
        } else {
          this.hideLoadingSpinner();
        }
      });
  }

  private showMessage(message: string, icon: 'success' | 'warning' | 'info' | 'error' = 'info',
    title: 'Success Message' | 'Warning Message' | 'Error Message'): void {
    Swal.fire({
      toast: true, position: 'top', showConfirmButton: false,
      title, text: message, icon,
      showCloseButton: false, timer: 5000, width: '600px',
      customClass: { popup: 'swal-top-offset' }
    });
    this.hideLoadingSpinner();
  }

  handleErrors(error: string) {
    if (error) { this.errorMessage = error; this.hideLoadingSpinner(); }
  }

  hideLoadingSpinner() { this.showLoadingSpinner = false; }
}
