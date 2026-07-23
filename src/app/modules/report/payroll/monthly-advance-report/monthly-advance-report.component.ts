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
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-monthly-advance-report',
  templateUrl: './monthly-advance-report.component.html',
  styleUrls: ['./monthly-advance-report.component.css']
})
export class MonthlyAdvanceReportComponent implements OnInit {
  monthlyAdvanceForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  branchModel!: BranchModel[];
  currentUser: string = '';
  errorMessage: string = '';
  advanceType: string = '';
  paymentType: string = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  dtAdvanceDate!: string;
  bankList!: BankListModel[];

  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  constructor(public sanitizer: DomSanitizer, private fb: FormBuilder, private _dataService: DatasharingService,
    private _masterService: MastermoduleService, private router: Router, private _commonService: CommonService) {
    this.monthlyAdvanceForm = this.fb.group({
      AdvanceDate: [this.formatDate(new Date)],
      BranchCode: [''],
      EmployeeType: ['Guard'],
      AdvanceType: ['Daily'],
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
    this.getUserAccessRights(this.currentUser, 'Monthly Salary Advance');
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
        }
        this.hideSpinner();
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  changeAdvanceDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.monthlyAdvanceForm.value.AdvanceDate = this.formatDate(`${type}: ${event.value}`);
  }
  radioButtonTypeSelectionChange(event: any) {   
      if (event.value === 'Daily') {
        this.monthlyAdvanceForm.get('PaymentType')?.setValue('Bank');
        this.monthlyAdvanceForm.get('PaymentType')?.disable();
        this.monthlyAdvanceForm?.patchValue({
          BankCode: ''
        })
      } else if (event.value === 'Monthly') {
        this.monthlyAdvanceForm.get('PaymentType')?.enable();
        this.monthlyAdvanceForm.get('PaymentType')?.setValue('All'); // Automatically select "All"
        this.getBankList();
      }
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
  savebuttonClick(): void {
    let dtAdvanceDate = new Date(this.monthlyAdvanceForm.value.AdvanceDate);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
    this.url = environment.baseReportUrl;
    this.advanceType = this.monthlyAdvanceForm.get("AdvanceType")?.value;
    if (this.advanceType === 'Monthly') {
      this.paymentType = this.monthlyAdvanceForm.get("PaymentType")?.value;
      if (this.paymentType == 'Bank') {
        this.url += 'Payroll/BankMonthlyAdvanceReport.aspx?';
        this.url += "LoginID=" + this.currentUser;
        this.url += "&Branch=" + this.monthlyAdvanceForm.get("BranchCode")?.value
        this.url += "&AdvancePeriod=" + this.dtAdvanceDate
        this.url += "&EmployeeType=" + this.monthlyAdvanceForm.get("EmployeeType")?.value
        this.url += "&Bank=" + this.monthlyAdvanceForm.get("BankCode")?.value == undefined ? '': this.monthlyAdvanceForm.get("BankCode")?.value
      } else if (this.paymentType == 'Cash') {
        this.url += 'Payroll/CashMonthlyAdvanceReport.aspx?';
        this.url += "LoginID=" + this.currentUser;
        this.url += "&Branch=" + this.monthlyAdvanceForm.get("BranchCode")?.value
        this.url += "&AdvancePeriod=" + this.dtAdvanceDate
        this.url += "&EmployeeType=" + this.monthlyAdvanceForm.get("EmployeeType")?.value
      } else if (this.paymentType == 'Cheque') {
        this.url += 'Payroll/ChequeMonthlyAdvanceReport.aspx?';
        this.url += "LoginID=" + this.currentUser;
        this.url += "&Branch=" + this.monthlyAdvanceForm.get("BranchCode")?.value
        this.url += "&AdvancePeriod=" + this.dtAdvanceDate
        this.url += "&EmployeeType=" + this.monthlyAdvanceForm.get("EmployeeType")?.value
      } else if (this.paymentType == 'All') {
        this.url += 'Payroll/MonthlyAdvanceReport.aspx?';
        this.url += "LoginID=" + this.currentUser;
        this.url += "&Branch=" + this.monthlyAdvanceForm.get("BranchCode")?.value
        this.url += "&AdvancePeriod=" + this.dtAdvanceDate
        this.url += "&EmployeeType=" + this.monthlyAdvanceForm.get("EmployeeType")?.value
      }
    } else {
      this.url += 'Payroll/DailyAdvanceReport.aspx?';
      this.url += "LoginID=" + this.currentUser;
      this.url += "&Branch=" + this.monthlyAdvanceForm.get("BranchCode")?.value
      this.url += "&AdvancePeriod=" + this.dtAdvanceDate
      this.url += "&EmployeeType=" + this.monthlyAdvanceForm.get("EmployeeType")?.value
    }
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
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
