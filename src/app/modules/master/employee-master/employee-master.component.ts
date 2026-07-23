import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { EmployeeService } from "../../../service/employee.service";
import { EmployeeImportDialogComponent } from './employee-import-dialog/employee-import-dialog.component';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { FormGroup, FormControl } from '@angular/forms';
import { IndianEmployeeModel, SALARY_GROUPS, INDIAN_STATES, AADHAAR_PATTERN, PAN_PATTERN, IFSC_PATTERN, PHONE_PATTERN } from 'src/app/model/indian-employee.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';

export interface IEmployee {
  EMP_CODE: string;
  EMP_ROLE: string;
  EMP_NAME: string;
  EMP_SEX: string;
  DepartmentName?: string;
  DesignationName?: string;
  AadhaarNumber: string;
  PANNumber: string;
  PFAccountNumber: string;
  ESINumber: string;
  SalaryGroup: string;
  SpousePAN: string;
  BankAccountNumber: string;
  BankIFSC: string;
  BankName: string;
  UPIId: string;
  IndianState: string;
  EMP_TOWN: string;
  EMP_PHONE: string;
  EMP_MOBILEPHONE: string;
  EMP_ADDRESS1: string;
  EMP_POST_CODE: string;
  EMP_DATE_OF_BIRTH: Date;
  EMP_MARTIAL_STATUS: string;
  EMP_SPOUSE_NAME: string;
  EMPPAY_DATE_JOINED: Date;
  EMPPAY_CATEGORY: string;
  EMP_BRANCH_CODE: string;
  // Legacy Malaysian fields (kept for migration)
  EMP_IC_NEW?: string;
  EMP_PASSPORT_NO?: string;
  EMP_RACE?: string;
  EMP_NATIONAL?: string;
}

@Component({
  selector: 'app-employee-master',
  templateUrl: './employee-master.component.html',
  styleUrls: ['./employee-master.component.css']
})
export class EmployeeMasterComponent implements OnInit {


  employees: any = [];
  dataSource!: MatTableDataSource<IEmployee>;
  branchList: any = [];

  displayedColumns: string[] = [
    'EMP_CODE', 'EMP_ROLE', 'EMP_NAME', 'DepartmentName', 'DesignationName', 
    'EMP_PHONE', 'action'
  ];

  // Indian compliance data
  salaryGroups = SALARY_GROUPS;
  indianStates = INDIAN_STATES;
  
  // Search form for Indian compliance
  searchForm!: FormGroup;
  showAdvancedSearch = false;

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;
  currentUser: string = '';
  showLoadingSpinner: boolean = false;
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  
  // Form group for branch selection
  branchForm!: FormGroup;
  constructor(private _liveAnnouncer: LiveAnnouncer, 
              public dialog: MatDialog, 
              public service: EmployeeService, 
              private _dataService: DatasharingService,
              private _masterService: MastermoduleService,
              private _snackBar: MatSnackBar) {
    
    // Initialize form group for branch selection
    this.branchForm = new FormGroup({
      BRANCH_ID: new FormControl('')
    });

    // Initialize search form
    this.searchForm = new FormGroup({
      employeeCode: new FormControl(''),
      employeeName: new FormControl(''),
      aadhaarNumber: new FormControl(''),
      panNumber: new FormControl(''),
      mobileNumber: new FormControl(''),
      salaryGroup: new FormControl(''),
      state: new FormControl(''),
      branchCode: new FormControl('')
    });

    service.getEmployees(sessionStorage.getItem('username')!).subscribe((d: any) => {
      this.employees = d['employees'].map((e: any) => {
        return {
          ...e, // spread all employee fields directly since API now returns flat structure
          // Map any nested fields if needed
          EMPPAY_DATE_JOINED: e.EMPPAY_DATE_JOINED,
          EMPPAY_CATEGORY: e.EMPPAY_CATEGORY || e.EMPPAY_CATEGORY
        };
      });
      this.branchList = d['branchList'];
      this.dataSource = new MatTableDataSource(this.employees);      
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    })
    
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Employee Master');
  }

  getUserAccessRights(userName: string, screenName: string) {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create;
          if (this.currentUser == 'admin' || this.currentUser == 'superadmin') {
          } else {
            if (this.userAccessModel.readAccess === true) {
              this.warningMessage = '';
            } else {
              this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                        You do not have permissions to view this page. <br>
                        If you feel you should have access to this page, Please contact administrator. <br>
                        Thank you`;

            }
          }
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }


  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  branchChange(value: any) {
    if (!value) return;
    
    this.service.getEmployeesByBranchId(value).subscribe((d: any) => {
      this.employees = d;
      this.dataSource = new MatTableDataSource(d);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    })
  }

  // Indian compliance search methods
  searchEmployees() {
    const searchCriteria = this.searchForm.value;
    
    this.service.searchEmployees(searchCriteria).subscribe({
      next: (result: any) => {
        this.employees = result;
        this.dataSource = new MatTableDataSource(result);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this._snackBar.open('Search completed successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        this._snackBar.open('Search failed: ' + error.message, 'Close', {
          duration: 5000
        });
      }
    });
  }

  clearSearch() {
    this.searchForm.reset();
    this.loadEmployees();
  }

  loadEmployees() {
    this.service.getEmployees(sessionStorage.getItem('username')!).subscribe((d: any) => {
      this.employees = d['employees'].map((e: any) => {
        return {
          ...e,
          EMPPAY_DATE_JOINED: e.EMPPAY_DATE_JOINED,
          EMPPAY_CATEGORY: e.EMPPAY_CATEGORY
        };
      });
      this.dataSource = new MatTableDataSource(this.employees);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    });
  }

  toggleAdvancedSearch() {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

  // Field validation methods
  validateAadhaar(event: any) {
    const value = event.target.value;
    if (value && !AADHAAR_PATTERN.test(value)) {
      this._snackBar.open('Invalid Aadhaar format. Must be 12 digits starting with 2-9', 'Close', {
        duration: 3000
      });
    }
  }

  validatePAN(event: any) {
    const value = event.target.value;
    if (value && !PAN_PATTERN.test(value)) {
      this._snackBar.open('Invalid PAN format. Must be in format ABCDE1234F', 'Close', {
        duration: 3000
      });
    }
  }

  validateIFSC(event: any) {
    const value = event.target.value;
    if (value && !IFSC_PATTERN.test(value)) {
      this._snackBar.open('Invalid IFSC format. Must be in format ABCD0XXXXXX', 'Close', {
        duration: 3000
      });
    }
  }

  validatePhone(event: any) {
    const value = event.target.value;
    if (value && !PHONE_PATTERN.test(value)) {
      this._snackBar.open('Invalid phone format. Must be in +91 format followed by 10 digits', 'Close', {
        duration: 3000
      });
    }
  }

  // Export methods for Indian compliance
  exportToExcel() {
    // Implementation for Excel export with Indian fields
    this._snackBar.open('Export to Excel feature coming soon', 'Close', {
      duration: 3000
    });
  }

  exportToPDF() {
    // Implementation for PDF export with Indian format
    this._snackBar.open('Export to PDF feature coming soon', 'Close', {
      duration: 3000
    });
  }

  openImportDialog(): void {
    const dialogRef = this.dialog.open(EmployeeImportDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        // Refresh the employee list if import was successful
        this.loadEmployees();
        this._snackBar.open('Employee list refreshed', 'Close', {
          duration: 3000
        });
      }
    });
  }

  deleteEmployee(element: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete employee ${element.EMP_NAME} (${element.EMP_CODE})?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.deleteEmployee(element.EMP_ID).subscribe({
          next: (res: any) => {
            if (res.Success === 'Success') {
              Swal.fire(
                'Deleted!',
                'Employee has been deleted.',
                'success'
              );
              this.loadEmployees();
            } else {
              Swal.fire(
                'Error!',
                res.Message || 'Failed to delete employee.',
                'error'
              );
            }
          },
          error: (err) => {
            Swal.fire(
              'Error!',
              'An error occurred while deleting the employee.',
              'error'
            );
          }
        });
      }
    });
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false;
      this._snackBar.open('Error: ' + error, 'Close', {
        duration: 5000
      });
    }
  };
}
