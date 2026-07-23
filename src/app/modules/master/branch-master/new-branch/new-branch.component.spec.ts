import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { BranchModel } from 'src/app/model/branchModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-branch',
  templateUrl: './new-branch.component.html',
  styleUrls: ['./new-branch.component.css']
})
export class NewBranchComponent implements OnInit {

  branchForm!: FormGroup;
  branchModel!: BranchModel;
  branchCodeStatus: string = 'new';
  showLoadingSpinner: boolean = false;
  errorMessage: string = '';
  currentUser: string = '';
  userAccessModel!: UserAccessModel;
  statesList: any[] = [
    { id: 1, name: 'Andhra Pradesh' },
    { id: 2, name: 'Arunachal Pradesh' },
    { id: 3, name: 'Assam' },
    { id: 4, name: 'Bihar' },
    { id: 5, name: 'Chhattisgarh' },
    { id: 6, name: 'Goa' },
    { id: 7, name: 'Gujarat' },
    { id: 8, name: 'Haryana' },
    { id: 9, name: 'Himachal Pradesh' },
    { id: 10, name: 'Jharkhand' },
    { id: 11, name: 'Karnataka' },
    { id: 12, name: 'Kerala' },
    { id: 13, name: 'Madhya Pradesh' },
    { id: 14, name: 'Maharashtra' },
    { id: 15, name: 'Manipur' },
    { id: 16, name: 'Meghalaya' },
    { id: 17, name: 'Mizoram' },
    { id: 18, name: 'Nagaland' },
    { id: 19, name: 'Odisha' },
    { id: 20, name: 'Punjab' },
    { id: 21, name: 'Rajasthan' },
    { id: 22, name: 'Sikkim' },
    { id: 23, name: 'Tamil Nadu' },
    { id: 24, name: 'Telangana' },
    { id: 25, name: 'Tripura' },
    { id: 26, name: 'Uttar Pradesh' },
    { id: 27, name: 'Uttarakhand' },
    { id: 28, name: 'West Bengal' },
    { id: 29, name: 'Andaman and Nicobar Islands' },
    { id: 30, name: 'Chandigarh' },
    { id: 31, name: 'Dadra and Nagar Haveli and Daman and Diu' },
    { id: 32, name: 'Delhi' },
    { id: 33, name: 'Jammu and Kashmir' },
    { id: 34, name: 'Ladakh' },
    { id: 35, name: 'Lakshadweep' },
    { id: 36, name: 'Puducherry' }
  ]

  constructor(private fb: FormBuilder, public dialog: MatDialog,
    private _masterService: MastermoduleService, private _router: Router,
    private _activatedRoute: ActivatedRoute, private _dataService: DatasharingService) {
    this.branchForm = this.fb.group({
      ID: this.fb.control(0),
      Code: this.fb.control('', [Validators.required]),
      Name: this.fb.control(''),
      Address1: this.fb.control('', [Validators.required]),
      Address2: this.fb.control('', [Validators.required]),
      PostCode: this.fb.control('', [Validators.required, Validators.pattern('^[0-9]{6}$')]),
      City: this.fb.control('', [Validators.required]),
      State: this.fb.control('', [Validators.required]),
      BankName: this.fb.control(''),
      BankBranch: this.fb.control(''),
      BankAccount: this.fb.control(''),
      PersonIncharge: this.fb.control('', [Validators.required]),
      ShortName: this.fb.control('', [Validators.required, Validators.maxLength(10)]),
      UbsCode: this.fb.control(''),
      Phone: this.fb.control('', [Validators.required]),
      Fax: this.fb.control(''),
      UserEmail: this.fb.control(''),
      IsHeadQuarters: this.fb.control(false),
      Description: this.fb.control(''),
      ParentBranch: this.fb.control(''),
      LastUpdate: this.fb.control(new Date),
      LastUpdatedBy: this.fb.control(this.currentUser),
    });
    this.userAccessModel = {
      readAccess: false,
      updateAccess:false,
      deleteAccess:false,
      createAccess:false,
    }
  }
  ngOnInit(): void {   
    this.currentUser = sessionStorage.getItem('username')!;    
    if (this.currentUser == null || this.currentUser == undefined) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
        this.branchForm.patchValue({
          LastUpdatedBy: this.currentUser
        })
      });
    } else {
      this.branchForm.patchValue({
        LastUpdatedBy: this.currentUser
      });
    }
    this.getUserAccessRights(this.currentUser, 'Branch Master');
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['code'] != undefined) {
        this.getBranchMasterList(params['code']);
      }else{
        this.getBranchCode();       
      }      
    });
  }
  getUserAccessRights(userName: string, screenName: string) {   
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read
          this.userAccessModel.deleteAccess = data.Delete;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.createAccess = data.Create; 
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  getBranchCode(): void {
    this._masterService.getBranchMasterCode().subscribe(
      result => {        
        this.branchForm.patchValue({
          Code: result.ClientCode
        });
      },
      (error) => this.handleErrors(error)
    );
  }
  getBranchMasterList(branchCode: string) {
    this.showLoadingSpinner = true;
    this._masterService.getBranchMaster(branchCode).subscribe((responseData) => {
      if (responseData != null) {
        this.branchCodeStatus = 'edit';
        this.branchForm.patchValue({
          ID: responseData[0].ID,
          Code: responseData[0].Code,
          UbsCode: responseData[0].UbsCode,
          Name: responseData[0].Name,
          ShortName: responseData[0].ShortName,
          Address1: responseData[0].Address1,
          Address2: responseData[0].Address2,
          PostCode: responseData[0].PostCode,
          City: responseData[0].City,
          State: responseData[0].State,
          BankName: responseData[0].BankName,
          BankBranch: responseData[0].BankBranch,
          BankAccount: responseData[0].BankAccount,
          PersonIncharge: responseData[0].PersonIncharge,
          Phone: responseData[0].Phone,
          Fax: responseData[0].Fax,
          UserEmail: (responseData[0].Email && responseData[0].Email != 'null' ? responseData[0].Email : ''),
          IsHeadQuarters: responseData[0].IsHeadQuarters,
          Description: responseData[0].Description,
          LastUpdate: responseData[0].LastUpdate,
          LastUpdatedBy: responseData[0].LastUpdatedBy,
          ParentBranch: responseData[0].ParentBranch,
        });
      }
      this.showLoadingSpinner = false;
    },

      (error) => this.handleErrors(error)
    );
  }

  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    this.branchModel = {
      ID: 0,
      Code: '',
      Name: '',
      UbsCode: '',
      ShortName: '',
      Address1: '',
      Address2: '',
      PostCode: '',
      City: '',
      State: '',
      Phone: '',
      Fax: '',
      Email: '',
      BankName: '',
      BankBranch: '',
      BankAccount: '',
      PersonIncharge: '',
      IsHeadQuarters: false,
      Description: '',
      LastUpdate: new Date(),
      LastUpdatedBy: '',
      ParentBranch: '',
    }

    this.branchModel = this.branchForm.value;
    if (this.branchForm.value.UserEmail != undefined && this.branchForm.value.UserEmail != "") {
      this.branchModel.Email = this.branchForm.value.UserEmail;
    } else {
      this.branchModel.Email = '';
    }
    this.branchModel.ParentBranch = this.branchForm.value.Code;
    this.branchModel.LastUpdatedBy = this.currentUser;
    this._masterService.saveAndUpdateBranchMaster(this.branchModel).subscribe((response) => {
      if (response.Success == 'Success') {
        this.branchModel = response.Branch;
        this._dataService.setUsername(this.currentUser);
        this._router.navigate(['/master/branch-master']);
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: 'Successfully save & update brnach deatials',
          icon: 'success',
          showCloseButton: false,
          timer: 3000,
        });
      }
      this.showLoadingSpinner = false;
    },
      (error) => this.handleErrors(error)
    );
  }
  clearBranchDetails(): void {
    this.branchForm.reset();
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.showLoadingSpinner = false;
    }
  };
}
