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
  availableBranches: any[] = [];
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
    { id: 10, name: 'Jammu and Kashmir' },
    { id: 11, name: 'Jharkhand' },
    { id: 12, name: 'Karnataka' },
    { id: 13, name: 'Kerala' },
    { id: 14, name: 'Madhya Pradesh' },
    { id: 15, name: 'Maharashtra' },
    { id: 16, name: 'Manipur' },
    { id: 17, name: 'Meghalaya' },
    { id: 18, name: 'Mizoram' },
    { id: 19, name: 'Nagaland' },
    { id: 20, name: 'Odisha' },
    { id: 21, name: 'Punjab' },
    { id: 22, name: 'Rajasthan' },
    { id: 23, name: 'Sikkim' },
    { id: 24, name: 'Tamil Nadu' },
    { id: 25, name: 'Telangana' },
    { id: 26, name: 'Tripura' },
    { id: 27, name: 'Uttar Pradesh' },
    { id: 28, name: 'Uttarakhand' },
    { id: 29, name: 'West Bengal' },
    { id: 30, name: 'Andaman and Nicobar Islands' },
    { id: 31, name: 'Chandigarh' },
    { id: 32, name: 'Dadra and Nagar Haveli' },
    { id: 33, name: 'Daman and Diu' },
    { id: 34, name: 'Delhi' },
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
      ShortName: this.fb.control('', [Validators.maxLength(10)]),
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
    this.loadAvailableBranches();
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['code'] != undefined) {
        this.getBranchCode();
        this.getBranchMasterList(params['code']);
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
      (result: any) => {        
        if (result && result.Success === 'Success' && result.ClientCode) {
          this.branchForm.patchValue({
            Code: result.ClientCode
          });
        } else {
          this.errorMessage = 'Failed to generate branch code';
        }
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

  onBranchNameChange(event: any): void {
    // Only auto-generate ShortName in new mode, not in edit mode
    if (this.branchCodeStatus === 'new') {
      const branchName = event.target.value;
      if (branchName && branchName.length >= 3) {
        const shortName = branchName.substring(0, 3).toUpperCase();
        this.branchForm.patchValue({
          ShortName: shortName
        });
      }
    }
  }

  loadAvailableBranches(): void {
    this._masterService.getBranchMasterList().subscribe(
      (data: any[]) => {
        // Filter to show only HQ branches in parent dropdown, but exclude current branch if editing
        if (this.branchCodeStatus === 'edit') {
          const currentBranchCode = this.branchForm.get('Code')?.value;
          this.availableBranches = data.filter((branch: BranchModel) => 
            branch.IsHeadQuarters === true && branch.Code !== currentBranchCode
          );
        } else {
          this.availableBranches = data.filter((branch: BranchModel) => branch.IsHeadQuarters === true);
        }
      },
      (error) => {
        console.error('Error loading branches:', error);
        this.errorMessage = 'Failed to load available branches';
      }
    );
  }

  savebuttonClick(): void {
    if (this.branchForm.invalid) {
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    this.showLoadingSpinner = true;
    
    const formValues = this.branchForm.value;
    this.branchModel = {
      ID: formValues.ID || 0,
      Code: formValues.Code || '',
      Name: formValues.Name || '',
      UbsCode: formValues.UbsCode || '',
      ShortName: formValues.ShortName || '',
      Address1: formValues.Address1 || '',
      Address2: formValues.Address2 || '',
      PostCode: formValues.PostCode || '',
      City: formValues.City || '',
      State: formValues.State || '',
      Phone: formValues.Phone || '',
      Fax: formValues.Fax || '',
      Email: formValues.UserEmail || '',
      BankName: formValues.BankName || '',
      BankBranch: formValues.BankBranch || '',
      BankAccount: formValues.BankAccount || '',
      PersonIncharge: formValues.PersonIncharge || '',
      IsHeadQuarters: formValues.IsHeadQuarters || false,
      Description: formValues.Description || '',
      LastUpdate: new Date(),
      LastUpdatedBy: this.currentUser || '',
      ParentBranch: formValues.ParentBranch || '',
    };

    this._masterService.saveAndUpdateBranchMaster(this.branchModel).subscribe((response: any) => {
      if (response && response.Success === 'Success') {
        this._dataService.setUsername(this.currentUser);
        this._router.navigate(['/master/branch-master']);
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: 'Successfully saved & updated branch details',
          icon: 'success',
          showCloseButton: false,
          timer: 3000,
        });
      } else {
        this.errorMessage = response?.Message || 'Failed to save branch details';
      }
      this.showLoadingSpinner = false;
    },
      (error) => this.handleErrors(error)
    );
  }
  clearBranchDetails(): void {
    this.branchForm.reset();
  }
  handleErrors(error: any) {
    console.error('Error occurred:', error);
    if (error) {
      if (typeof error === 'string') {
        this.errorMessage = error;
      } else if (error?.message) {
        this.errorMessage = error.message;
      } else if (error?.error?.message) {
        this.errorMessage = error.error.message;
      } else {
        this.errorMessage = 'An unexpected error occurred. Please try again.';
      }
    }
    this.showLoadingSpinner = false;
  };
}
