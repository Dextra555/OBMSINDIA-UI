import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { TDSMaster } from 'src/app/model/indian-compliance.model';

@Component({
  selector: 'app-new-tds-master',
  templateUrl: './new-tds-master.component.html',
  styleUrls: ['./new-tds-master.component.css']
})
export class NewTdsMasterComponent implements OnInit {

  isEdit = false;
  tdsMasterForm!: FormGroup;
  showLoadingSpinner = false;
  tdsMasterId: number = 0;

  constructor(
    private fb: FormBuilder,
    private _masterService: MastermoduleService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.tdsMasterForm = this.fb.group({
      tDSName:       ['', [Validators.required, Validators.maxLength(100)]],
      tDSPercentage: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      isActive:      [true]
    });

    this._route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.tdsMasterId = +params['id'];
        this.loadForEdit();
      }
    });
  }

  loadForEdit(): void {
    this.showLoadingSpinner = true;
    this._masterService.getTDSMasterList().subscribe(
      (list: TDSMaster[]) => {
        const record = list.find(x => x.ID === this.tdsMasterId);
        if (record) {
          this.tdsMasterForm.patchValue({
            tDSName:       record.TDSName,
            tDSPercentage: record.TDSPercentage,
            isActive:      record.IsActive
          });
        } else {
          Swal.fire('Not Found', 'TDS record not found.', 'warning');
          this._router.navigate(['/master/tds-master']);
        }
        this.showLoadingSpinner = false;
      },
      () => {
        Swal.fire('Error', 'Failed to load TDS Master data.', 'error');
        this.showLoadingSpinner = false;
      }
    );
  }

  onSubmit(): void {
    if (this.tdsMasterForm.invalid) return;

    const formVal = this.tdsMasterForm.value;
    const payload: TDSMaster = {
      ID:            this.isEdit ? this.tdsMasterId : 0,
      TDSName:       formVal.tDSName,
      TDSPercentage: parseFloat(formVal.tDSPercentage),
      IsActive:      formVal.isActive
    };

    this.showLoadingSpinner = true;
    this._masterService.saveAndUpdateTDSMaster(payload).subscribe(
      () => {
        Swal.fire({
          title: 'Success',
          text: `TDS category ${this.isEdit ? 'updated' : 'saved'} successfully.`,
          icon: 'success',
          timer: 1800,
          showConfirmButton: false
        });
        this._router.navigate(['/master/tds-master']);
      },
      (error: any) => {
        Swal.fire('Error', `Failed to ${this.isEdit ? 'update' : 'save'} TDS category. ${error}`, 'error');
        this.showLoadingSpinner = false;
      }
    );
  }

  cancel(): void {
    this._router.navigate(['/master/tds-master']);
  }
}
