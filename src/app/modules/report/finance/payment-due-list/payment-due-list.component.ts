import { Component, OnInit } from '@angular/core';
import { environment } from "../../../../../environments/environment";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, NavigationEnd } from '@angular/router';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-payment-due-list',
  templateUrl: './payment-due-list.component.html',
  styleUrls: ['./payment-due-list.component.css']
})
export class PaymentDueListComponent implements OnInit {

  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  currentUser: string = '';
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  frm!: FormGroup;
  branchList: any = [];
  supplierList: any = [];

  constructor(
    public sanitizer: DomSanitizer,
    private router: Router,
    private fb: FormBuilder,
    private _dataService: DatasharingService,
    private _masterService: MastermoduleService
  ) {
    this.frm = this.fb.group({
      Branch: ['0'],
      Supplier: ['0'],
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
    this.getUserAccessRights(this.currentUser, 'Payment Due List');
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
          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            forkJoin({
              branchList: this._masterService.GetBranchListByUserName(this.currentUser),
              supplierList: this._masterService.getSuppliers('')
            }).subscribe({
              next: (result) => {
                this.branchList = result.branchList;
                this.supplierList = result.supplierList?.filter((s: any) => s.Id > 0);
              },
              error: (err) => {
                console.error('Error fetching dropdowns', err);
              }
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

  onSubmit(): void {
    if (this.frm.invalid) return;

    const startDate = this.returnDate(this.frm.get('StartDate')?.value);
    const endDate   = this.returnDate(this.frm.get('EndDate')?.value);
    const branch    = this.frm.get('Branch')?.value ?? '0';
    const supplier  = this.frm.get('Supplier')?.value ?? '0';

    let reportUrl = environment.baseReportUrl;
    reportUrl += 'Finance/PaymentDueList.aspx?';
    reportUrl += 'LoginID=' + this.currentUser;
    reportUrl += '&StartDate=' + startDate;
    reportUrl += '&EndDate=' + endDate;
    reportUrl += '&Branch=' + branch;
    reportUrl += '&Supplier=' + supplier;

    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(reportUrl);
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.hideSpinner();
    }
  }

  hideSpinner() {
    this.showLoadingSpinner = false;
  }
}
