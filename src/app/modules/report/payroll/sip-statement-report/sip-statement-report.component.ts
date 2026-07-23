import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { EmployeeSip } from 'src/app/model/EmployeeSip';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { environment } from 'src/environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-sip-statement-report',
  templateUrl: './sip-statement-report.component.html',
  styleUrls: ['./sip-statement-report.component.css']
})
export class SipStatementReportComponent implements OnInit {
  url: string = environment.baseReportUrl;
  urlSafe: SafeResourceUrl | undefined;
  currentUrl: string = "PayRoll/"
  reportPageName: string = "";
  frm!: FormGroup;
  branchList: any = [];
  currentUser: string = "";
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  dtAdvanceDate!: string;
  employeeSipArray: EmployeeSip[] = [];
  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  constructor(public sanitizer: DomSanitizer, private _masterService: MastermoduleService, private fb: FormBuilder,
    private _dataService: DatasharingService, private router: Router, private _payrollService: PayrollModuleService
  ) {
    this.currentUser = sessionStorage.getItem('username')!;
    this.url += this.currentUrl;

    this.frm = fb.group({
      Branch: ["", Validators.required],
      Period: ["", Validators.required],
      EmployeeType: ["Guard", Validators.required]
    })
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
    this.getUserAccessRights(this.currentUser, 'Pay Slip Report');
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
  changeAdvanceDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.frm.value.Period = this.formatDate(`${type}: ${event.value}`);
    let dtAdvanceDate = new Date(this.frm.value.Period);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
  }
  onBranchSelectionChange(event: any) {
    let dtAdvanceDate = new Date(this.frm.value.Period);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
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
  generateFileClick() {
    let dtAdvanceDate = new Date(this.frm.value.Period);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
    const branchCode = this.frm.get('Branch')?.value;
    const employeeType = this.frm.get('EmployeeType')?.value;
    if (this.dtAdvanceDate != null && this.dtAdvanceDate != 'NaN-NaN-NaN' && branchCode != '') {
      this.generateSIPToTextFile(branchCode, this.dtAdvanceDate, employeeType)
    }
  }
  // Generate SIP to Text File
  generateSIPToTextFile(branch: string, period: string, employeeType: string): void {
    const dtPeriod = new Date(period);
    if (dtPeriod.getFullYear() >= 2018) {
      this.errorMessage = '';
    const companyRegNumber = environment.CompanyRegNumber; // Replace with actual value

    // Dynamically fetch SIPCompanyCode from getConfig
    this._payrollService.getConfig('SOCSO', branch).subscribe(
      (configResponse) => {
        const sipCompanyCode = Array.isArray(configResponse) && configResponse.length 
        ? configResponse[0].Value 
        : environment.SocsoCompanyCode;
        this._payrollService.getSIPToCIMBList(companyRegNumber, sipCompanyCode, branch, period, employeeType)
          .subscribe(
            (data) => {
              const fileName = `${sipCompanyCode}_${environment.PayTypeSIP}_${period.replace(/-/g, '')}_${Date.now()}.txt`;
              this.downloadFile(data, fileName);
            },
            (error) => {
              console.error('Error generating SIP text file:', error);
            }
          );
      },
      (error) => {
        console.error('Error fetching config for SIP:', error);
      }
    );
  }else{
    this.errorMessage = 'SIP is not available before 2018!';
  }
  }
  generateExcelFileClick() {
    let dtAdvanceDate = new Date(this.frm.value.Period);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
    const branchCode = this.frm.get('Branch')?.value;
    const companyRegNumber ='184439-X';
    const socsoCompanyCode = 'A3700000870Y';
    if (this.dtAdvanceDate != null && this.dtAdvanceDate != 'NaN-NaN-NaN' && branchCode != '') {
      this.getSIPToExcelGeneration(companyRegNumber,socsoCompanyCode, this.dtAdvanceDate, branchCode)
    }
  }
  // Method for the third endpoint
  getSIPToExcelGeneration(companyRegNumber: string,socsoCompanyCode: string, dtSalaryPeriod: string, branchCode: string): void {
    this._payrollService
      .getSIPToExcel(companyRegNumber,socsoCompanyCode, dtSalaryPeriod, branchCode)
      .subscribe({
        next: (data: any[]) => {
          data.forEach((item: any) => {
            const employee: any = {};
            employee.CompanyCode = item.CompanyCode || '';
            employee.SSM = item.SSM || '';
            employee.EMPICNO = item.EMPICNO || '';
            employee.EmployeeName = item.EmployeeName || '';           
            employee.Period = new Date(item.Period) || new Date();
            employee.SIPTotal = item.SIPTotal || '';           
            employee.EMPJoinDate = new Date(item.EMPJoinDate) || new Date();
            employee.EmpStatus = item.EmpStatus || '';
            this.employeeSipArray.push(employee);
          });
        
          console.log(data);
        
          // Define custom headers
          const headers = [
            ['Kod Majikan', 'My CoID/SSM', 'No. Kad Pengenalan', 'Name Pekerja', 'Bulan Carum', 'Bulan Caruman', 'Tarikh Mula Kerja', 'Status Pekerjaan']
          ];
        
          // Convert employee data to array format for XLSX
          const employeeData = this.employeeSipArray.map((employee) => [
            employee.CompanyCode,
            employee.SSM,
            employee.EMPICNO,
            employee.EmployeeName,
            employee.Period.toISOString().split('T')[0], // Format date as YYYY-MM-DD
            employee.SIPTotal,
            employee.EMPJoinDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD
            employee.EmpStatus,
          ]);
        
          // Combine headers and employee data
          const combinedData = [...headers, ...employeeData];
        
          // Create worksheet and workbook
          const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(combinedData);
          const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
        
          // Write Excel file
          const formattedDate = new Date(this.dtAdvanceDate).toISOString().split('T')[0];
          const fileName = `SIP_${formattedDate}.xls`;
          XLSX.writeFile(workbook, fileName);
        },
        error: (err) => {
          this.errorMessage = 'Error fetching data: ' + err.message;
        }
      });
  }

// Utility method to download a text file
private downloadFile(data: string[], fileName: string): void {
  const blob = new Blob([data.join('\n')], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
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
