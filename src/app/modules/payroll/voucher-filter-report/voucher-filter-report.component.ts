import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { BankListModel } from 'src/app/model/bankListModel';
import { BranchModel } from 'src/app/model/branchModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { CommonService } from 'src/app/service/common.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-voucher-filter-report',
  templateUrl: './voucher-filter-report.component.html',
  styleUrls: ['./voucher-filter-report.component.css']
})
export class VoucherFilterReportComponent implements OnInit {
  voucherFilterForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  branchModel!: BranchModel[];
  currentUser: string = '';
  errorMessage: string = '';
  voucherType: string = '';
  paymentType: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  voucherPeriod!: string;
  bankList!: BankListModel[];
  showVoucherList: boolean = false;
  showVoucherReport: boolean = false;
  voucherList: any[] = [];
  filteredVoucherList: any[] = [];
  searchText: string = '';
  selectedVoucherId: number = 0;

  formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  formatPeriod(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    return [year, month].join('-');
  }

  constructor(public sanitizer: DomSanitizer, private fb: FormBuilder, private _dataService: DatasharingService,
    private _masterService: MastermoduleService, private router: Router, private _commonService: CommonService,
    private _payrollService: PayrollModuleService) {
    this.voucherFilterForm = this.fb.group({
      VoucherPeriod: [new Date()],
      BranchCode: [''],
      EmployeeType: ['Guard'],
      VoucherType: ['DailyAdvance'],
      PaymentType: ['Bank'],
      BankCode: ['']
    });
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }

  }

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this._dataService.scrollToTop(); // Scroll to top on route change
      }
    });
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Voucher Filter Report');
    this.getBankList();
  }
  getUserAccessRights(userName: string, screenName: string) {
    this.showLoadingSpinner = true;
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            this.getBranchMasterListByUser(this.currentUser);
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
          }
        } else {
          // If no access rights data found, allow access for superadmin
          if (this.currentUser == 'superadmin') {
            this.warningMessage = '';
            this.getBranchMasterListByUser(this.currentUser);
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
        // On error, allow access for superadmin
        if (this.currentUser == 'superadmin') {
          this.warningMessage = '';
          this.getBranchMasterListByUser(this.currentUser);
        }
        this.handleErrors(error);
      }
    );
  }
  chosenMonthHandler(normalizedMonth: Date, datepicker: any) {
    this.voucherFilterForm.patchValue({ VoucherPeriod: normalizedMonth });
    datepicker.close();
  }

  myMonthYearFilter = (d: Date | null): boolean => {
    const date = d || new Date();
    // Only allow first day of each month to be selected
    return date.getDate() === 1;
  }
  voucherTypeSelectionChange(event: any) {
    // Handle voucher type specific logic if needed
    this.voucherType = event.value;
  }
  getBranchMasterListByUser(userName: string) {
    this.showLoadingSpinner = true;
    this._masterService.GetBranchListByUserName(userName).subscribe(
      (data) => {
        this.branchModel = data
        this.showLoadingSpinner = false;
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  getBankList(): void {
    this._commonService.getBankList().subscribe(bankList => {
      this.bankList = bankList;
    });
  }

  searchVouchers(): void {
    this.showLoadingSpinner = true;
    const selectedDate = this.voucherFilterForm.value.VoucherPeriod;
    this.voucherPeriod = this.formatPeriod(selectedDate);
    this.voucherType = this.voucherFilterForm.get("VoucherType")?.value;
    this.paymentType = this.voucherFilterForm.get("PaymentType")?.value;
    const branchCode = this.voucherFilterForm.get("BranchCode")?.value || '';
    const employeeType = this.voucherFilterForm.get("EmployeeType")?.value;
    const bankCode = this.voucherFilterForm.get("BankCode")?.value || '';

    // Use new API that returns full voucher details
    this._payrollService.getVoucherDetailsByFilter(
      branchCode,
      this.voucherPeriod,
      employeeType,
      bankCode,
      this.paymentType,
      this.voucherType
    ).subscribe(
      (data: any) => {
        this.voucherList = data || [];
        this.filteredVoucherList = [...this.voucherList];
        this.showVoucherList = true;
        this.showLoadingSpinner = false;
      },
      (error: any) => {
        this.handleErrors(error);
        this.voucherList = [];
        this.showVoucherList = true;
        this.showLoadingSpinner = false;
      }
    );
  }

  viewVoucher(voucherId: number): void {
    this.selectedVoucherId = voucherId;
    this.url = environment.baseReportUrl;
    this.voucherType = this.voucherFilterForm.get("VoucherType")?.value;

    if (this.voucherType === 'DailyAdvance') {
      this.url += 'Payroll/AdvanceVoucherReport.aspx?';
    } else if (this.voucherType === 'Loan') {
      this.url += 'Payroll/LoanVoucherReport.aspx?';
    } else if (this.voucherType === 'UniformLoan') {
      this.url += 'Payroll/MaterialVoucherReport.aspx?';
    }

    this.url += "LoginID=" + this.currentUser;
    this.url += "&ID=" + voucherId;

    this.showVoucherList = false;
    this.showVoucherReport = true;
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

  backToList(): void {
    this.showVoucherReport = false;
    this.showVoucherList = true;
    this.urlSafe = undefined;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.searchText = filterValue;
    if (!filterValue) {
      this.filteredVoucherList = [...this.voucherList];
    } else {
      this.filteredVoucherList = this.voucherList.filter(v =>
        (v.EmployeeName && v.EmployeeName.toLowerCase().includes(filterValue)) ||
        (v.VoucherNo && v.VoucherNo.toLowerCase().includes(filterValue))
      );
    }
  }

  backToFilter(): void {
    this.showVoucherList = false;
    this.showVoucherReport = false;
    this.voucherList = [];
    this.urlSafe = undefined;
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.hideSpinner();
    }
  };
  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
