import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { OBMSPermissions } from 'src/app/model/OBMSPermissions';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { CommonService } from 'src/app/service/common.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-user-access-rights',
  templateUrl: './new-user-access-rights.component.html',
  styleUrls: ['./new-user-access-rights.component.css']
})
export class NewUserAccessRightsComponent implements OnInit {
  @Output() categorySelected = new EventEmitter<string>();

  categories: string[] = ['Accounting', 'Administration', 'Master', 'Quotation & Agreement', 'Inventory', 'Finance', 'Payroll'];
  selectedCategory: string = 'Master';
  data = ['ScreenName', 'Create', 'Read', 'Update', 'Delete'];

  userAccessForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  userAccessTitle: string = 'new';
  categoryName: string = '';
  obmsPermissions: OBMSPermissions[] = [new OBMSPermissions()];
  permissions!: OBMSPermissions[];
  dynamicForm!: FormGroup;
  userName!: string;
  currentUser: string = '';
  isReadEditable: boolean = false;
  isCreateEditable: boolean = false;
  isUpdateEditable: boolean = false;
  isDeleteEditable: boolean = false;
  userAccessModel!: UserAccessModel;

  private formatDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }


  constructor(private fb: FormBuilder, public dialog: MatDialog,
    private _router: Router, private _activatedRoute: ActivatedRoute, private _masterService: MastermoduleService,
    private _commonService: CommonService, private _dataService: DatasharingService) {
    this.userAccessForm = this.fb.group({

    });
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
    this.getUserAccessRights(this.currentUser, 'User Access Rights');
    this.createForm();
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['name'] != undefined) {
        this.userAccessTitle = 'edit';
        this.userName = params['name'];
        if (this.currentUser == 'admin' || this.currentUser == 'superadmin') {
          this.isReadEditable = false;
          this.isCreateEditable = false;
          this.isUpdateEditable = false;
          this.isDeleteEditable = false;
        } else {
          this.isReadEditable = true;
          this.isCreateEditable = true;
          this.isUpdateEditable = true;
          this.isDeleteEditable = true;
        }
        this.getScreensByCategoryandUsername('Master', params['name']);
      } else {
        // Load screens for default category when in new mode
        this.getScreensByCategory(this.selectedCategory);
      }
    });
  }
  createForm() {
    this.dynamicForm = this.fb.group({
      formArray: this.fb.array([])
    });
  }
  get formArray() {
    return (this.dynamicForm.get('formArray') as FormArray).controls;
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
        }
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  updateFormFields(data: any) {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    formArray.clear();
    for (let i = 0; i < data.length; i++) {
      formArray.push(this.fb.group({
        ID: [data[i].ID],
        Name: [this.userName],
        ScreenName: [data[i].ScreenName],
        Read: [false],
        Create: [false],
        Update: [false],
        Delete: [false],
        LastUpdatedBy: [this.userName],
      }));
    }
  }

  handleButtonClick(action: string) {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    for (let i = 0; i < formArray.length; i++) {
      if (action == 'View') {
        const control = formArray.at(i) as FormGroup;
        const isChecked = control.value;
        control.get('Read')?.patchValue(isChecked.Read === false ? true : false, { emitEvent: false });
      }
      if (action == 'new') {
        const control = formArray.at(i) as FormGroup;
        const isChecked = control.value;
        control.get('Create')?.patchValue(isChecked.Create === false ? true : false, { emitEvent: false });
      }
      if (action == 'update') {
        const control = formArray.at(i) as FormGroup;
        const isChecked = control.value;
        control.get('Update')?.patchValue(isChecked.Update === false ? true : false, { emitEvent: false });
      }
      if (action == 'delete') {
        const control = formArray.at(i) as FormGroup;
        const isChecked = control.value;
        control.get('Delete')?.patchValue(isChecked.Delete === false ? true : false, { emitEvent: false });
      }
    }
  }
  onCategoryChange() {
    // If editing (userName exists), get permissions with screens. Otherwise, just get screens by category.
    if (this.userName) {
      this.getScreensByCategoryandUsername(this.selectedCategory, this.userName);
    } else {
      this.getScreensByCategory(this.selectedCategory);
    }
  }

  getScreensByCategory(categoryName: string): void {
    this.showLoadingSpinner = true;
    this._commonService.getScreensByCategory(categoryName).subscribe(
      (data) => {
        this.updateFormFields(data);
        const formArray = this.dynamicForm.get('formArray') as FormArray;
        data.forEach((item: any, index: any) => {
          const control = formArray.at(index) as FormGroup;
          control.get('ID')?.patchValue(0, { emitEvent: false });
          control.get('Name')?.patchValue(this.userName, { emitEvent: false });
          control.get('ScreenName')?.patchValue(item.ScreenName, { emitEvent: false });
          control.get('Create')?.patchValue(false, { emitEvent: false });
          control.get('Read')?.patchValue(false, { emitEvent: false });
          control.get('Update')?.patchValue(false, { emitEvent: false });
          control.get('Delete')?.patchValue(false, { emitEvent: false });
          control.get('LastUpdatedBy')?.patchValue(this.userName, { emitEvent: false });
        });
        this.showLoadingSpinner = false;
      },
      (error) => this.handleErrors(error)
    );
  }

  getScreensByCategoryandUsername(screenName: string, userName: string): void {
    this.showLoadingSpinner = true;

    // First, get ALL screens for this category
    this._commonService.getScreensByCategory(screenName).subscribe(
      (allScreens) => {
        // Create form fields for ALL screens
        this.updateFormFields(allScreens);
        const formArray = this.dynamicForm.get('formArray') as FormArray;

        // Initialize all permissions to false
        allScreens.forEach((item: any, index: any) => {
          const control = formArray.at(index) as FormGroup;
          control.get('ID')?.patchValue(0, { emitEvent: false });
          control.get('Name')?.patchValue(userName, { emitEvent: false });
          control.get('ScreenName')?.patchValue(item.ScreenName, { emitEvent: false });
          control.get('Create')?.patchValue(false, { emitEvent: false });
          control.get('Read')?.patchValue(false, { emitEvent: false });
          control.get('Update')?.patchValue(false, { emitEvent: false });
          control.get('Delete')?.patchValue(false, { emitEvent: false });
          control.get('LastUpdatedBy')?.patchValue(userName, { emitEvent: false });
        });

        // Then, load existing permissions if any
        this._commonService.getPermissionsWithScreens(screenName, userName).subscribe(
          (permissions) => {
            if (permissions && permissions.length > 0) {
              // Map permissions to the screens
              permissions.forEach((perm: any) => {
                // Find the index of this screen in the form array
                const index = allScreens.findIndex((s: any) => s.ScreenName === perm.ScreenName);
                if (index >= 0 && index < formArray.length) {
                  const control = formArray.at(index) as FormGroup;
                  control.get('ID')?.patchValue(perm.ID || 0, { emitEvent: false });
                  control.get('Read')?.patchValue(perm.Read === true, { emitEvent: false });
                  control.get('Create')?.patchValue(perm.Create === true, { emitEvent: false });
                  control.get('Update')?.patchValue(perm.Update === true, { emitEvent: false });
                  control.get('Delete')?.patchValue(perm.Delete === true, { emitEvent: false });
                }
              });
            }
            this.showLoadingSpinner = false;
          },
          (error) => {
            // If error loading permissions, at least we have all screens shown
            this.showLoadingSpinner = false;
          }
        );
      },
      (error) => this.handleErrors(error)
    );
  }

  savebuttonClick(): void {
    this.showLoadingSpinner = true;
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    this.obmsPermissions = formArray.value;
    this._commonService.saveAndUpdateObmsPermissions(this.obmsPermissions)
      .subscribe(response => {
        if (response.Success == 'Success') {
          //this._router.navigate(['/administration/user-access-rights']);
          Swal.fire({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            title: 'Success',
            text: response.Message,
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

  clearUserAccesstDetails(): void {
    this.userAccessForm.reset();
    this.userAccessTitle = 'new';
    this._router.navigate(['/administration/new-user-access-rights']);

  }

  addTDSReportScreen(): void {
    this.showLoadingSpinner = true;
    this._commonService.addScreen('TDS Report', 'Finance').subscribe(
      (result) => {
        if (result) {
          Swal.fire({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            title: 'Success',
            text: 'TDS Report screen added successfully!',
            icon: 'success',
            showCloseButton: false,
            timer: 3000,
          });
          this.onCategoryChange();
        } else {
          Swal.fire({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            title: 'Info',
            text: 'TDS Report screen already exists.',
            icon: 'info',
            showCloseButton: false,
            timer: 3000,
          });
        }
        this.showLoadingSpinner = false;
      },
      (error) => {
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Error',
          text: 'Failed to add screen. Please try again.',
          icon: 'error',
          showCloseButton: false,
          timer: 3000,
        });
        this.showLoadingSpinner = false;
      }
    );
  }

  addRbiBankAdvanceScreen(): void {
    this.showLoadingSpinner = true;
    this._commonService.addScreen('RBI Bank Advance Salary Process', 'Payroll').subscribe(
      (result) => {
        if (result) {
          Swal.fire({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            title: 'Success',
            text: 'RBI Bank Advance Salary Process screen added successfully!',
            icon: 'success',
            showCloseButton: false,
            timer: 3000,
          });
          // Refresh the screens list
          this.onCategoryChange();
        } else {
          Swal.fire({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            title: 'Info',
            text: 'RBI Bank Advance Salary Process screen already exists.',
            icon: 'info',
            showCloseButton: false,
            timer: 3000,
          });
        }
        this.showLoadingSpinner = false;
      },
      (error) => {
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Error',
          text: 'Failed to add screen. Please try again.',
          icon: 'error',
          showCloseButton: false,
          timer: 3000,
        });
        this.showLoadingSpinner = false;
      }
    );
  }

  handleErrors(error: string) {
    if (error != null && error != '') {
      this.showLoadingSpinner = false;
    }
  };

  addGSTReportScreen(): void {
    this.showLoadingSpinner = true;
    this._commonService.addScreen('GST Statement Report', 'Finance').subscribe(
      (result) => {
        if (result) {
          Swal.fire({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            title: 'Success',
            text: 'GST Report screen added successfully!',
            icon: 'success',
            showCloseButton: false,
            timer: 3000,
          });
          this.onCategoryChange();
        } else {
          Swal.fire({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            title: 'Info',
            text: 'GST Report screen already exists.',
            icon: 'info',
            showCloseButton: false,
            timer: 3000,
          });
        }
        this.showLoadingSpinner = false;
      },
      (error) => {
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Error',
          text: 'Failed to add screen. Please try again.',
          icon: 'error',
          showCloseButton: false,
          timer: 3000,
        });
        this.showLoadingSpinner = false;
      }
    );
  }

}
