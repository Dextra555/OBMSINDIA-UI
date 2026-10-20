import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GSTConfiguration } from 'src/app/model/indian-compliance.model';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-gst-slab',
  templateUrl: './new-gst-slab.component.html',
})
export class NewGstSlabComponent implements OnInit {

  gstForm!: FormGroup;
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
    this.gstForm = this.fb.group({
      id: [0],
      gstRate: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      hsnCode: [''],
      description: ['', Validators.required],
      StateCode: [''],
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
    this.currentUser = sessionStorage.getItem('username') || '';
    if (!this.currentUser) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }

    if (this.currentUser !== 'admin' && this.currentUser !== 'superadmin') {
      this.getUserAccessRights(this.currentUser, 'GST Slab');
    }

    // Route param (:id) — edit mode
    this._activatedRoute.params.subscribe((params) => {
      if (params['id'] != undefined) {
        this.loadGSTConfiguration(params['id']);
      }
    });

    // Query param (?id=) — edit mode alternate
    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['id'] != undefined) {
        this.loadGSTConfiguration(params['id']);
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

  loadGSTConfiguration(id: number): void {
    this.showLoadingSpinner = true;
    this._masterService.getGSTConfigurationList().subscribe(
      (data: GSTConfiguration[]) => {
        const record = data.find((r: any) =>
          (r.Id ?? r.id) == id
        );
        if (record) {
          this.titleStatus = 'edit';
          this.gstForm.patchValue({
            id: record.id,
            gstRate: record.gstRate,
            hsnCode: record.hsnCode ?? '',
            description: record.description ?? '',
            StateCode: record.StateCode ?? '',
            effectiveDate: record.effectiveDate
              ? record.effectiveDate.substring(0, 10)
              : '',
            isActive: record.isActive,
            createdBy: record.createdBy ?? '',
            lastUpdatedBy: record.lastUpdatedBy ?? ''
          });
        } else {
          console.error('GST record not found for id:', id);
        }
        this.showLoadingSpinner = false;
      },
      (error) => {
        console.error('Error loading GST configuration:', error);
        this.showLoadingSpinner = false;
      }
    );
  }

  saveGSTConfiguration(): void {
    if (this.gstForm.invalid) {
      this.gstForm.markAllAsTouched();
      return;
    }

    this.showLoadingSpinner = true;
    const formValue = this.gstForm.value;

    const gstConfig: any = {
      Id: formValue.id,
      GstRate: formValue.gstRate,
      HsnCode: formValue.hsnCode,
      Description: formValue.description,
      StateCode: formValue.StateCode,
      EffectiveDate: formValue.effectiveDate,
      IsActive: formValue.isActive,
      CreatedDate: new Date().toISOString(),
      CreatedBy: this.currentUser,
      LastUpdatedDate: new Date().toISOString(),
      LastUpdatedBy: this.currentUser
    };

    this._masterService.saveAndUpdateGSTConfiguration(gstConfig).subscribe(
      () => {
        this.showLoadingSpinner = false;
        Swal.fire({
          toast: true,
          position: 'top',
          showConfirmButton: false,
          title: 'Success',
          text: formValue.id > 0
            ? 'GST Configuration updated successfully'
            : 'GST Configuration saved successfully',
          icon: 'success',
          showCloseButton: false,
          timer: 3000,
        });
        this._router.navigate(['/master/gst-slab']);
      },
      (error) => {
        this.showLoadingSpinner = false;
        console.error('Error saving GST configuration:', error);
        Swal.fire('Error', 'Failed to save GST configuration. Please try again.', 'error');
      }
    );
  }

  cancelClick(): void {
    this._router.navigate(['/master/gst-slab']);
  }
}
