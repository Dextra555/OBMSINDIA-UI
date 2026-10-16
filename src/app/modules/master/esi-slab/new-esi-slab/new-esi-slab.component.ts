import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ESIConfiguration } from 'src/app/model/indian-compliance.model';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-esi-slab',
  templateUrl: './new-esi-slab.component.html',
  styleUrls: ['./new-esi-slab.component.css']
})
export class NewEsiSlabComponent implements OnInit {

  esiForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  titleStatus: string = 'new';
  currentUser: string = '';
  userAccessModel!: UserAccessModel;

  constructor(
    private fb: FormBuilder,
    private _masterService: MastermoduleService,
    private _dataService: DatasharingService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute
  ) {
    this.esiForm = this.fb.group({
      id: [0],
      grossSalaryLimit: ['', Validators.required],
      employeeContributionRate: ['', Validators.required],
      employerContributionRate: ['', Validators.required],
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
      this.getUserAccessRights(this.currentUser, 'ESI Slab');
    }

    // Support both query param (?id=) from onEditClick and route param (:id) from routerLink
    this._activatedRoute.params.subscribe((params) => {
      if (params['id'] != undefined) {
        this.loadESIConfiguration(params['id']);
      }
    });

    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.loadESIConfiguration(params['id']);
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

  loadESIConfiguration(id: number): void {
    this.showLoadingSpinner = true;
    this._masterService.getESIConfigurationList().subscribe(
      (data: any[]) => {
        const record = data.find((r: any) =>
          (r.Id ?? r.id) == id
        );
        if (record) {
          this.titleStatus = 'edit';
          this.esiForm.patchValue({
            id: record.Id ?? record.id,
            grossSalaryLimit: record.GrossSalaryLimit ?? record.grossSalaryLimit,
            employeeContributionRate: record.EmployeeContributionRate ?? record.employeeContributionRate,
            employerContributionRate: record.EmployerContributionRate ?? record.employerContributionRate,
            effectiveDate: (record.EffectiveDate ?? record.effectiveDate)
              ? (record.EffectiveDate ?? record.effectiveDate).substring(0, 10)
              : '',
            isActive: record.IsActive ?? record.isActive,
            createdBy: record.CreatedBy ?? record.createdBy ?? '',
            lastUpdatedBy: record.LastUpdatedBy ?? record.lastUpdatedBy ?? ''
          });
        } else {
          console.error('ESI record not found for id:', id);
        }
        this.showLoadingSpinner = false;
      },
      (error) => {
        console.error('Error loading ESI configuration:', error);
        this.showLoadingSpinner = false;
      }
    );
  }

  saveESIConfiguration(): void {
    if (this.esiForm.invalid) {
      this.esiForm.markAllAsTouched();
      return;
    }

    this.showLoadingSpinner = true;
    const formValue = this.esiForm.value;

    // Backend uses dynamic and reads Pascal Case property names
    const esiConfig = {
      Id: formValue.id,
      GrossSalaryLimit: formValue.grossSalaryLimit,
      EmployeeContributionRate: formValue.employeeContributionRate,
      EmployerContributionRate: formValue.employerContributionRate,
      EffectiveDate: formValue.effectiveDate,
      IsActive: formValue.isActive,
      CreatedDate: new Date().toISOString(),
      CreatedBy: this.currentUser,
      LastUpdatedDate: new Date().toISOString(),
      LastUpdatedBy: this.currentUser
    };

    const saveCall = formValue.id > 0
      ? this._masterService.updateESIConfiguration(formValue.id, esiConfig as any)
      : this._masterService.saveESIConfiguration(esiConfig as any);

    saveCall.subscribe(
      () => {
        this.showLoadingSpinner = false;
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: formValue.id > 0
            ? 'ESI Configuration updated successfully'
            : 'ESI Configuration saved successfully',
          icon: 'success',
          showCloseButton: false,
          timer: 3000,
        });
        this._router.navigate(['/master/esi-slab']);
      },
      (error) => {
        this.showLoadingSpinner = false;
        console.error('Error saving ESI configuration:', error);
        Swal.fire('Error', 'Failed to save ESI configuration. Please try again.', 'error');
      }
    );
  }

  cancelClick(): void {
    this._router.navigate(['/master/esi-slab']);
  }
}
