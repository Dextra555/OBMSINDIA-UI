import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PFConfiguration } from 'src/app/model/indian-compliance.model';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { IndianStatutoryService } from 'src/app/service/indian-statutory.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-pf-slab',
  templateUrl: './new-pf-slab.component.html',
  styleUrls: ['./new-pf-slab.component.css']
})
export class NewPfSlabComponent implements OnInit {

  pfForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  titleStatus: string = 'new';
  currentUser: string = '';
  userAccessModel!: UserAccessModel;

  constructor(
    private fb: FormBuilder,
    private _statutoryService: IndianStatutoryService,
    private _masterService: MastermoduleService,
    private _dataService: DatasharingService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute
  ) {
    this.pfForm = this.fb.group({
      id: [0],
      basicSalaryLimit: ['', Validators.required],
      employeeContributionRate: ['', Validators.required],
      employerContributionRate: ['', Validators.required],
      employerEPSRate: [''],
      financialYear: ['', Validators.required],
      effectiveDate: ['', Validators.required],
      isActive: [true],
      createdBy: [''],
      lastUpdatedBy: ['']
    });

    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    };
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }

    if (this.currentUser !== 'admin' && this.currentUser !== 'superadmin') {
      this.getUserAccessRights(this.currentUser, 'PF Slab');
    }

    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.loadPFConfiguration(params['id']);
      }
    });
  }

  getUserAccessRights(userName: string, screenName: string): void {
    this._masterService.getUserAccessRights(userName, screenName).subscribe(
      (data) => {
        if (data != null) {
          this.userAccessModel.readAccess = data.Read;
          this.userAccessModel.createAccess = data.Create;
          this.userAccessModel.updateAccess = data.Update;
          this.userAccessModel.deleteAccess = data.Delete;
        }
      },
      (error) => {
        console.error('Error getting user access rights:', error);
      }
    );
  }

  loadPFConfiguration(id: number): void {
    this.showLoadingSpinner = true;
    this._statutoryService.getPFConfiguration().subscribe(
      (data: any[]) => {
        // API returns Pascal Case (Id, BasicSalaryLimit) - handle both cases
        const record = data.find((r: any) =>
          (r.Id ?? r.id) == id
        );
        if (record) {
          this.titleStatus = 'edit';
          this.pfForm.patchValue({
            id: record.Id ?? record.id,
            basicSalaryLimit: record.BasicSalaryLimit ?? record.basicSalaryLimit,
            employeeContributionRate: record.EmployeeContributionRate ?? record.employeeContributionRate,
            employerContributionRate: record.EmployerContributionRate ?? record.employerContributionRate,
            employerEPSRate: record.EmployerEPSRate ?? record.employerEPSRate,
            financialYear: record.FinancialYear ?? record.financialYear,
            effectiveDate: (record.EffectiveDate ?? record.effectiveDate)
              ? (record.EffectiveDate ?? record.effectiveDate).substring(0, 10)
              : '',
            isActive: record.IsActive ?? record.isActive,
            createdBy: record.CreatedBy ?? record.createdBy ?? '',
            lastUpdatedBy: record.LastUpdatedBy ?? record.lastUpdatedBy ?? ''
          });
        } else {
          console.error('PF record not found for id:', id);
        }
        this.showLoadingSpinner = false;
      },
      (error) => {
        console.error('Error loading PF configuration:', error);
        this.showLoadingSpinner = false;
      }
    );
  }

  savePFConfiguration(): void {
    if (this.pfForm.invalid) {
      this.pfForm.markAllAsTouched();
      return;
    }

    this.showLoadingSpinner = true;
    const formValue = this.pfForm.value;

    const pfConfig: PFConfiguration = {
      id: formValue.id,
      basicSalaryLimit: formValue.basicSalaryLimit,
      employeeContributionRate: formValue.employeeContributionRate,
      employerContributionRate: formValue.employerContributionRate,
      employerEPSRate: formValue.employerEPSRate || 0,
      financialYear: formValue.financialYear,
      effectiveDate: formValue.effectiveDate,
      isActive: formValue.isActive,
      createdDate: new Date().toISOString(),
      createdBy: this.currentUser,
      lastUpdatedDate: new Date().toISOString(),
      lastUpdatedBy: this.currentUser
    };

    const saveCall = formValue.id > 0
      ? this._statutoryService.updatePFConfiguration(formValue.id, pfConfig)
      : this._statutoryService.savePFConfiguration(pfConfig);

    saveCall.subscribe(
      () => {
        this.showLoadingSpinner = false;
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: formValue.id > 0
            ? 'PF Configuration updated successfully'
            : 'PF Configuration saved successfully',
          icon: 'success',
          showCloseButton: false,
          timer: 3000,
        });
        this._router.navigate(['/master/pf-slab']);
      },
      (error) => {
        this.showLoadingSpinner = false;
        console.error('Error saving PF configuration:', error);
        Swal.fire('Error', 'Failed to save PF configuration. Please try again.', 'error');
      }
    );
  }

  cancelClick(): void {
    this._router.navigate(['/master/pf-slab']);
  }
}
