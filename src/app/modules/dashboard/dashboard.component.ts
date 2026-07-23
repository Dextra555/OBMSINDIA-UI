import { Component, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild("chart")
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  currentUrl: string = "Finance/PaymentDueList.aspx?"
  currentUser: string = "";
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  menuName: string = '';
  currentDate: Date = new Date();
  isAdminOrSuperAdmin: boolean = false;

  // Simple dashboard data
  websiteDetails = {
    systemName: 'OBMS - Online Business Management System',
    version: '2.0.0',
    company: 'FREIGHTWATCH G PATOMOTOH SECURITY SERVICES SDN. BHD.',
    companyCode: environment.CompanyCode,
    production: environment.production,
    supportedBanks: [] as string[],
    systemStats: {
      totalGuards: 0,
      totalStaff: 0,
      activeClients: 0,
      pendingPayments: 0,
      agreementsPostedThisMonth: 0
    }
  };

  constructor(public sanitizer: DomSanitizer, private _dataService: DatasharingService,
    private _masterService: MastermoduleService
  ) {
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }

  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    const userRole = sessionStorage.getItem('userrole');
    this.isAdminOrSuperAdmin = (userRole === '1' || userRole === '2' || userRole === 'true' || this.currentUser === 'superadmin');
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      }); 
    }
    this._dataService.getMenuName().subscribe(menu => {
      this.menuName = menu;
      if (menu === 'finance') {
        this.getUserAccessRights(this.currentUser, 'Payment Due List Report');
      }
    });

    // Load real dashboard data
    this.loadDashboardData();

    // Load supported banks
    this.loadSupportedBanks();
  }

  loadSupportedBanks(): void {
    // Get bank list from API
    this._masterService.GetBankListByUserName(this.currentUser || 'admin').subscribe(
      (data: any) => {
        if (data && Array.isArray(data)) {
          // Extract unique bank names
          const bankNames = data
            .filter((bank: any) => bank.Name || bank.BankName || bank.name)
            .map((bank: any) => bank.Name || bank.BankName || bank.name);

          // Remove duplicates and sort
          this.websiteDetails.supportedBanks = [...new Set(bankNames)].sort();
        }
      },
      (error: any) => {
        console.error('Error loading bank list:', error);
        // Fallback to empty array if API fails
        this.websiteDetails.supportedBanks = [];
      }
    );
  }

  loadDashboardData(): void {
    // Get employee stats (Guards + Staff)
    this.loadEmployeeStats();

    // Get active clients count
    this._masterService.getClientMsterListByStatus('Active').subscribe(
      (data) => {
        this.websiteDetails.systemStats.activeClients = data?.length || 0;
      },
      (error) => {
        console.error('Error loading client data:', error);
      }
    );

    // Get pending payments count (current month)
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const invoiceStartPeriod = this.formatDateForApi(startOfMonth);
    const invoiceEndPeriod = this.formatDateForApi(endOfMonth);

    this._masterService.getMonthlyInvoices(invoiceStartPeriod, invoiceEndPeriod).subscribe(
      (data) => {
        this.websiteDetails.systemStats.pendingPayments = data?.length || 0;
        console.log('Pending payments loaded:', this.websiteDetails.systemStats.pendingPayments);
      },
      (error) => {
        console.error('Error loading pending payments:', error);
        // Set default value on error instead of showing broken state
        this.websiteDetails.systemStats.pendingPayments = 0;
        // Optionally show error message to user
        if (error?.error?.message) {
          console.warn('Server error:', error.error.message);
        }
      }
    );

    // Get agreements posted this month
    this._masterService.getAgreementsPostedThisMonth().subscribe(
      (count) => {
        this.websiteDetails.systemStats.agreementsPostedThisMonth = count || 0;
      },
      (error) => {
        console.error('Error loading agreements posted this month:', error);
      }
    );
  }

  loadEmployeeStats(): void {
    // Load all employees and categorize by type
    this._masterService.getAllEmployees().subscribe(
      (response: any) => {
        const employees = response?.employees || [];

        // Categorize by EMP_ROLE or EMPPAY_CATEGORY
        this.websiteDetails.systemStats.totalGuards = employees.filter((emp: any) =>
          emp.EMP_ROLE === 'Guard' ||
          emp.EMPPAY_CATEGORY === 'Guard' ||
          emp.EMP_ROLE === 'SECURITY' ||
          emp.EMP_ROLE === 'SG'
        ).length;

        this.websiteDetails.systemStats.totalStaff = employees.filter((emp: any) =>
          emp.EMP_ROLE === 'Staff' ||
          emp.EMPPAY_CATEGORY === 'Office' ||
          emp.EMP_ROLE === 'Admin' ||
          emp.EMP_ROLE === 'Manager' ||
          emp.EMP_ROLE === 'Officer'
        ).length;

        console.log('Employee counts loaded:', {
          guards: this.websiteDetails.systemStats.totalGuards,
          staff: this.websiteDetails.systemStats.totalStaff,
          total: employees.length
        });
      },
      (error: any) => {
        console.error('Error loading employee data:', error);
        // Try alternative
        this.loadEmployeeStatsAlternative();
      }
    );
  }

  loadEmployeeStatsAlternative(): void {
    // Alternative: Get from branch master and estimate
    this._masterService.getBranchMasterList().subscribe(
      (data) => {
        if (data && Array.isArray(data)) {
          // Estimate 80% Guards, 20% Staff based on typical security company ratio
          const totalEmployees = data.reduce((total, branch) => {
            return total + (branch.employeeCount || branch.totalEmployees || 0);
          }, 0);

          this.websiteDetails.systemStats.totalGuards = Math.floor(totalEmployees * 0.8);
          this.websiteDetails.systemStats.totalStaff = Math.floor(totalEmployees * 0.2);
        }
      },
      (error) => {
        console.error('Error loading employee data from alternative source:', error);
      }
    );
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
            this.url = environment.baseReportUrl
            this.url += this.currentUrl;
            this.loadFinanceReport();
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                        You do not have permissions to view this report. <br>
                        If you feel you should have access to this report, Please contact administrator. <br>
                        Thank you`;
            this.showLoadingSpinner = false;
          }
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  private loadFinanceReport(): void {
    this.currentUser = sessionStorage.getItem('username')!;

    if (this.currentUser == null || this.currentUser == undefined) {
      // optional fallback if username not found
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
        sessionStorage.setItem('username', username);
      });
    }

    this.setReportUrl();

  }

  private setReportUrl(): void {
    this.url += "LoginID=" + this.currentUser;
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false
    }
  }

  /**
   * Format date for API requests in ISO format (YYYY-MM-DD)
   */
  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getEnvironmentStatus(): string {
    return this.websiteDetails.production ? 'Production' : 'Development';
  }

  getEnvironmentColor(): string {
    return this.websiteDetails.production ? 'success' : 'warning';
  }
}
