import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {SearchEmployeeComponent} from '../employee-master/search-employee/search-employee.component';
import {EmployeeTransferService} from "../../../service/employee-transfer.service";
import Swal from "sweetalert2";
import {Router} from "@angular/router";
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-employee-transfer',
  templateUrl: './employee-transfer.component.html',
  styleUrls: ['./employee-transfer.component.css']
})
export class EmployeeTransferComponent implements OnInit {

  frm!: FormGroup;
  branchList: any;
  branchTOList: any;
  clientTOList: any[] = [];
  EMP_ID: any;
  currentUser: string = '';
  showLoadingSpinner:boolean = false;
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;

  constructor(private fb: FormBuilder, public dialog: MatDialog, public service: EmployeeTransferService, private route: Router
    , private _dataService: DatasharingService, private _masterService: MastermoduleService
  ) {

    this.frm = this.fb.group({
      FROM_BRANCH_ID: ['', Validators.required],
      emp_no: ['', Validators.required],
      type: [''],
      emp_name: [''],
      TRANSFER_DATE: ['', Validators.required],
      TO_BRANCH_ID: ['', Validators.required],
      TO_EMP_CODE: [''],
      TO_CLIENT_ID: ['', Validators.required],
      EMP_ID: [],

    });

    this.frm.get('emp_no')?.disable({onlySelf: true});
    this.frm.get('TO_EMP_CODE')?.disable({onlySelf: true});

    service.getEmployees().subscribe((d: any) => {
      this.branchList = d;
      this.branchTOList = d;
    })
    this.userAccessModel = {
      readAccess: false,
      updateAccess:false,
      deleteAccess:false,
      createAccess:false,
    }
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }  
    this.getUserAccessRights(this.currentUser, 'Employee Transfer');
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
  searchEmployee() {

    const dialogRef = this.dialog.open(SearchEmployeeComponent, {
      disableClose: true,
      data: this.frm.get("FROM_BRANCH_ID")?.value ?? "",
      panelClass: ['wlt-c-lg-admin-dialog', 'animate__animated', 'animate__slideInDown'],
      width: '900px',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.frm.get('emp_name')?.setValue(result['EMP_NAME']);
        // Don't update FROM_BRANCH_ID - keep the originally selected branch
        // this.frm.get('FROM_BRANCH_ID')?.setValue(result['EMP_BRANCH_CODE']);
        this.frm.get('emp_no')?.setValue(result['EMP_CODE']);
        this.frm.get('TO_EMP_CODE')?.setValue(result['EMP_CODE']);
        let roleHint = (result['EMP_ROLE'] || result['EMPPAY_CATEGORY'] || '').toString().toUpperCase();
        let role = '';
        if (roleHint.includes('GUARD')) {
          role = 'Guard';
        } else if (roleHint.includes('STAFF')) {
          role = 'Staff';
        }
        this.frm.get('type')?.setValue(role);
        if (role) {
          this.frm.get('type')?.disable({onlySelf: true});
        } else {
          this.frm.get('type')?.enable({onlySelf: true});
        }
        // this.frm.get('FROM_BRANCH_ID')?.disable({onlySelf: true});
        this.EMP_ID = result['EMP_ID'];
        let BCode = result['EMP_BRANCH_CODE'];
        this.branchTOList = this.branchList.filter((d: any) => {
          return d.Code != BCode;
        })
      }
    })

  }

  onBranchChange(event: any) {
    let branchId = event.value;
    this.service.getClientsFromBranchId(branchId).subscribe((data: any) => {
      this.clientTOList = data;
    });
  }

  onClientChange(event: any) {
    let clientId = event.value;
    this.service.getNextEmployeeCode(clientId).subscribe((data: any) => {
      console.log('Next Employee Code Data:', data);
      if (data && data.Code) {
        this.frm.get('TO_EMP_CODE')?.setValue(data.ShortName + data.Code);
      } else {
        console.warn('Could not generate next employee code, fallback to manual entry or keep existing.');
      }
    }, error => {
      console.error('Error fetching next employee code:', error);
    });
  }

  protected readonly onsubmit = onsubmit;

  onSubmit() {

    let data = this.frm.getRawValue();
    if (this.frm.invalid) {
      return;
    }

    data['TRANSFER_DATE'] = this.returnDate(this.frm.get('TRANSFER_DATE')?.value);
    data['EMP_ID'] = this.EMP_ID;

    if (this.EMP_ID != undefined) {
      console.log('data:',data)
      this.service.setEmployeeTransfer(data).subscribe((d: any) => {
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: "Employee Transfer Successfully ",
          icon: 'success',
          showCloseButton: false,
          timer: 3000,
        });
        this.route.navigate(['/master/employee-master']);
      })
    }


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
      this.showLoadingSpinner = false;
    }
  }
}
