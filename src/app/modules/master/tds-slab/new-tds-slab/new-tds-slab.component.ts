import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { TDSSlabConfiguration } from 'src/app/model/indian-compliance.model';

@Component({
  selector: 'app-new-tds-slab',
  templateUrl: './new-tds-slab.component.html',
  styleUrls: ['./new-tds-slab.component.css']
})
export class NewTdsSlabComponent implements OnInit {
  isEdit = false;
  tdsSlabForm!: FormGroup;
  showLoadingSpinner = false;
  tdsSlabId = 0;

  constructor(
    private fb: FormBuilder,
    private _masterService: MastermoduleService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.tdsSlabForm = this.fb.group({
      financialYear: ['', [Validators.required, Validators.maxLength(9)]],
      regime: ['New', Validators.required],
      minIncome: [0, [Validators.required, Validators.min(0)]],
      maxIncome: [null],
      taxRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      surchargeRate: [0],
      educationCessRate: [4],
      standardDeduction: [75000],
      rebateThreshold: [0],
      rebateAmount: [0],
      effectiveDate: [''],
      isActive: [true]
    });

    this._route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.tdsSlabId = +params['id'];
        this.loadForEdit();
      }
    });
  }

  loadForEdit(): void {
    this.showLoadingSpinner = true;
    this._masterService.getTDSConfigurationList().subscribe(
      (list: any[]) => {
        // API may return PascalCase (Id, FinancialYear …) or camelCase — handle both
        const rec = list.find((x: any) =>
          (x.id ?? x.Id) === this.tdsSlabId
        );
        if (rec) {
          // Normalise: prefer camelCase, fall back to PascalCase
          const get = (camel: string, pascal: string) =>
            rec[camel] !== undefined ? rec[camel] : rec[pascal];

          this.tdsSlabForm.patchValue({
            financialYear:    get('financialYear',    'FinancialYear'),
            regime:           get('regime',           'Regime') ?? 'New',
            minIncome:        get('minIncome',        'MinIncome'),
            maxIncome:        get('maxIncome',        'MaxIncome'),
            taxRate:          get('taxRate',          'TaxRate'),
            surchargeRate:    get('surchargeRate',    'SurchargeRate')    ?? 0,
            educationCessRate:get('educationCessRate','EducationCessRate') ?? 4,
            standardDeduction:get('standardDeduction','StandardDeduction'),
            rebateThreshold:  get('rebateThreshold',  'RebateThreshold'),
            rebateAmount:     get('rebateAmount',      'RebateAmount'),
            effectiveDate:    get('effectiveDate',     'EffectiveDate'),
            isActive:         get('isActive',          'IsActive'),
          });
        } else {
          Swal.fire('Not Found', 'TDS slab not found.', 'warning');
          this._router.navigate(['/master/tds-slab']);
        }
        this.showLoadingSpinner = false;
      },
      () => {
        Swal.fire('Error', 'Failed to load TDS slab.', 'error');
        this.showLoadingSpinner = false;
      }
    );
  }

  onSubmit(): void {
    if (this.tdsSlabForm.invalid) return;
    const v = this.tdsSlabForm.value;
    const payload: any = {
      id: this.isEdit ? this.tdsSlabId : 0,
      financialYear: v.financialYear,
      regime: v.regime || 'New',
      minIncome: parseFloat(v.minIncome),
      maxIncome: v.maxIncome ? parseFloat(v.maxIncome) : null,
      taxRate: parseFloat(v.taxRate),
      surchargeRate: parseFloat(v.surchargeRate) || 0,
      educationCessRate: parseFloat(v.educationCessRate) || 4,
      higherEducationCessRate: 0,
      standardDeduction: v.standardDeduction !== null ? parseFloat(v.standardDeduction) : null,
      rebateThreshold: v.rebateThreshold !== null ? parseFloat(v.rebateThreshold) : null,
      rebateAmount: v.rebateAmount !== null ? parseFloat(v.rebateAmount) : null,
      effectiveDate: v.effectiveDate || null,
      isActive: !!v.isActive
    };

    this.showLoadingSpinner = true;
    this._masterService.saveAndUpdateTDSSConfiguration(payload).subscribe(
      () => {
        Swal.fire({
          title: 'Success',
          text: `TDS slab ${this.isEdit ? 'updated' : 'saved'} successfully.`,
          icon: 'success', timer: 1800, showConfirmButton: false
        });
        this._router.navigate(['/master/tds-slab']);
      },
      (error: any) => {
        Swal.fire('Error', `Failed to ${this.isEdit ? 'update' : 'save'} TDS slab. ${error?.message ?? error}`, 'error');
        this.showLoadingSpinner = false;
      }
    );
  }

  cancel(): void {
    this._router.navigate(['/master/tds-slab']);
  }
}
