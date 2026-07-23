import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BranchModel } from 'src/app/model/branchModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { CommonService } from 'src/app/service/common.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { RbiBankSalaryExport } from 'src/app/model/RbiBankSalaryExport';
import * as XLSX from 'xlsx';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-rbi-bank-salary-process',
  templateUrl: './rbi-bank-salary-process.component.html',
  styleUrls: ['./rbi-bank-salary-process.component.css']
})
export class RbiBankSalaryProcessComponent implements OnInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  rbiBankSalaryForm!: FormGroup;
  branchList: any = [];
  currentUser: string = "";
  errorMessage: string = '';
  warningMessage: string = '';
  showLoadingSpinner: boolean = false;
  userAccessModel!: UserAccessModel;
  dtPeriod!: string;
  exportData: RbiBankSalaryExport[] = [];
  displayedColumns: string[] = ['beneficiaryCode', 'beneficiaryAccountNumber', 'transactionAmount', 'beneficiaryName', 'ifscCode', 'beneficiaryBankName'];
  dataSource: any;

  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  constructor(private fb: FormBuilder, private _masterService: MastermoduleService,
    private _dataService: DatasharingService, private _commonService: CommonService,
    private _payrollService: PayrollModuleService, private router: Router) {
    this.currentUser = sessionStorage.getItem('username')!;

    this.rbiBankSalaryForm = fb.group({
      Branch: ["", Validators.required],
      Period: ["", Validators.required],
      EmployeeType: ["ALL", Validators.required],
      exportOption: ['0'],
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
    this.getUserAccessRights(this.currentUser, 'RBI Bank Salary Process');
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

  changePeriod(type: string, event: MatDatepickerInputEvent<Date>) {
    this.rbiBankSalaryForm.value.Period = this.formatDate(`${type}: ${event.value}`);
    let dtPeriodDate = new Date(this.rbiBankSalaryForm.value.Period);
    this.dtPeriod = this.formatDate(
      new Date(dtPeriodDate.getFullYear(), dtPeriodDate.getMonth() + 1, 0)
    );
  }

  onBranchSelectionChange(event: any) {
    let dtPeriodDate = new Date(this.rbiBankSalaryForm.value.Period);
    this.dtPeriod = this.formatDate(
      new Date(dtPeriodDate.getFullYear(), dtPeriodDate.getMonth() + 1, 0)
    );
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onSearchClick() {
    const period = new Date(this.rbiBankSalaryForm.get('Period')?.value);
    this.dtPeriod = this.formatDate(
      new Date(period.getFullYear(), period.getMonth() + 1, 0)
    );
    const branch = this.rbiBankSalaryForm.get('Branch')?.value;
    const employeeType = this.rbiBankSalaryForm.get('EmployeeType')?.value;

    if (this.dtPeriod !== '' && this.dtPeriod !== null) {
      this.getRbiBankSalaryExportData(this.dtPeriod, branch, employeeType);
    }
  }

  getRbiBankSalaryExportData(dtSalaryPeriod: string, branch: string, employeeType: string): void {
    this.showLoadingSpinner = true;
    this._payrollService.getRbiBankSalaryExport(dtSalaryPeriod, branch, employeeType).subscribe({
      next: (data: any) => {
        this.handleDataBinding(data);
      },
      error: (err: any) => {
        this.errorMessage = 'Error fetching data: ' + err.message;
        console.error(err);
        this.hideSpinner();
      }
    });
  }

  handleDataBinding(data: any) {
    this.exportData = [];
    if (data.length > 0) {
      data.forEach((item: any) => {
        const exportItem = new RbiBankSalaryExport();
        exportItem.setExportData(item);
        this.exportData.push(exportItem);
      });
      this.dataSource = new MatTableDataSource<RbiBankSalaryExport>(this.exportData);

      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      } else {
        setTimeout(() => {
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
        });
      }
      this.hideSpinner();
    } else {
      this.hideSpinner();
      this.errorMessage = `No data available for <span style="color: black;">${this.currentUser}</span>. Please try again later.`;
    }
  }

  onExportClick(): void {
    const selectedOption = this.rbiBankSalaryForm.get('exportOption')?.value;
    let exportData: RbiBankSalaryExport[] = [];

    if (selectedOption === '0') {
      exportData = this.dataSource.filteredData.slice(
        this.paginator.pageIndex * this.paginator.pageSize,
        (this.paginator.pageIndex + 1) * this.paginator.pageSize
      );
    } else if (selectedOption === '1') {
      exportData = this.dataSource.filteredData;
    }

    if (exportData.length > 0) {
      this.exportToExcel(exportData);
    } else {
      console.error('No data available for export.');
      alert('No data available for export.');
    }
  }

  onExportCsvClick(): void {
    const branch = this.rbiBankSalaryForm.get('Branch')?.value || 'ALL';
    const employeeType = this.rbiBankSalaryForm.get('EmployeeType')?.value || 'ALL';
    
    this._payrollService.getRbiBankSalaryExportCsv(this.dtPeriod, branch, employeeType).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RBI_Bank_Salary_Export_${this.dtPeriod}_${branch}_${employeeType}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        console.log('CSV exported successfully');
      },
      error: (err: any) => {
        console.error('Error exporting CSV:', err);
        alert('Error exporting CSV: ' + err.message);
      }
    });
  }

  exportToExcel(data: RbiBankSalaryExport[]): void {
    // Create header row with RBI specification field names
    const headerRow = [
      'Field Type', 'Transaction Type', 'Beneficiary Code', 'Beneficiary Account Number',
      'Transaction Amount', 'Beneficiary Name', 'Customer Reference Number', 'Payer Account No',
      'Payer Name', 'Payer Address 1', 'Payer Address 2', 'Payer Address 3', 'Payer Address 4',
      'Payer Address 5', 'Payer Address 6', 'Payer Address 7', 'Payer Address 8', 'Payer Address 9',
      'Payer Address 10', 'Charge Bearer', 'Value Date', 'IFSC Code', 'Beneficiary Bank Name',
      'Beneficiary Bank Branch Name', 'Beneficiary Email Id'
    ];

    // Create data type row
    const dataTypeRow = [
      'Character', 'Character', 'Character', 'Character',
      'Numeric', 'Character', 'Character', 'Character',
      'Character', 'Character', 'Character', 'Character', 'Character',
      'Character', 'Character', 'Character', 'Character', 'Character',
      'Character', 'Character', 'Character', 'Date', 'Character', 'Character',
      'Character', 'Character'
    ];

    // Create length row
    const lengthRow = [
      '1', '13', '20', '20',
      '19', '10', '20', '20',
      '20', '20', '20', '20', '20',
      '20', '20', '20', '20', '20',
      '20', '12', '10', '11', '200',
      '200', '200'
    ];

    // Create mandatory/optional row
    const mandatoryRow = [
      'Mandatory', 'Mandatory', 'Mandatory', 'Mandatory',
      'Mandatory', 'Mandatory', 'Optional', 'Mandatory',
      'Mandatory', 'Optional', 'Optional', 'Optional', 'Optional',
      'Optional', 'Optional', 'Optional', 'Optional', 'Optional',
      'Optional', 'Optional', 'Mandatory', 'Mandatory', 'Mandatory',
      'Optional', 'Optional'
    ];

    // Convert data to array format with new RBI specification fields
    const dataRows = data.map(item => [
      item.FieldType,
      item.TransactionType,
      item.BeneficiaryCode,
      item.BeneficiaryAccountNumber,
      item.TransactionAmount,
      item.BeneficiaryName,
      item.CustomerReferenceNumber,
      item.PayerAccountNo,
      item.PayerName,
      item.PayerAddress1,
      item.PayerAddress2,
      item.PayerAddress3,
      item.PayerAddress4,
      item.PayerAddress5,
      item.PayerAddress6,
      item.PayerAddress7,
      item.PayerAddress8,
      item.PayerAddress9,
      item.PayerAddress10,
      item.ChargeBearer,
      item.ValueDate,
      item.IFSCCode,
      item.BeneficiaryBankName,
      item.BeneficiaryBankBranchName,
      item.BeneficiaryEmailId
    ]);

    // Combine all rows
    const allRows = [headerRow, dataTypeRow, lengthRow, mandatoryRow, ...dataRows];

    // Create worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(allRows);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
      { wch: 18 }, { wch: 30 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 30 },
      { wch: 30 }, { wch: 30 }
    ];

    // Apply styling to header row (yellow background like in image)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
      worksheet[cellAddress].s = {
        fill: { fgColor: { rgb: 'FFFF00' } },
        font: { bold: true }
      };
    }

    // Apply styling to data type row (light blue background)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 1, c: C });
      if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
      worksheet[cellAddress].s = {
        fill: { fgColor: { rgb: 'ADD8E6' } },
        font: { bold: true }
      };
    }

    // Apply styling to length row (light green background)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 2, c: C });
      if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
      worksheet[cellAddress].s = {
        fill: { fgColor: { rgb: '90EE90' } },
        font: { bold: true }
      };
    }

    // Apply styling to mandatory/optional row (light gray background)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 3, c: C });
      if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
      worksheet[cellAddress].s = {
        fill: { fgColor: { rgb: 'D3D3D3' } },
        font: { bold: true }
      };
    }

    // Create workbook
    const workbook: XLSX.WorkBook = { Sheets: { 'RBI Bank Salary Export': worksheet }, SheetNames: ['RBI Bank Salary Export'] };
    
    // Generate filename with date
    const fileName = `RBI_Bank_Salary_Export_${this.dtPeriod}.xlsx`;
    
    // Download file
    XLSX.writeFile(workbook, fileName);
    
    console.log('Data exported successfully');
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
