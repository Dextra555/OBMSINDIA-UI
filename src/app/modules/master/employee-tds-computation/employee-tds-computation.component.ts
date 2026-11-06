import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { TDSComputationResult, EmployeeTDSConfiguration } from 'src/app/model/indian-compliance.model';

@Component({
  selector: 'app-employee-tds-computation',
  templateUrl: './employee-tds-computation.component.html',
  styleUrls: ['./employee-tds-computation.component.css']
})
export class EmployeeTdsComputationComponent implements OnInit {
  form!: FormGroup;
  configForm!: FormGroup;
  showLoadingSpinner = false;
  result: TDSComputationResult | null = null;
  financialYear = '';

  displayedColumns = ['minIncome', 'maxIncome', 'taxRate', 'taxableAmount', 'taxAmount'];

  constructor(
    private fb: FormBuilder,
    private _payrollService: PayrollModuleService,
    private _masterService: MastermoduleService
  ) {}

  ngOnInit(): void {
    // Default period = first of current month
    const today = new Date();
    const period = new Date(today.getFullYear(), today.getMonth(), 1);

    this.form = this.fb.group({
      employeeId: [null, [Validators.required, Validators.min(1)]],
      monthlyGross: [null, [Validators.required, Validators.min(0)]],
      period: [period, Validators.required]
    });

    this.configForm = this.fb.group({
      taxRegime: ['New', Validators.required],
      previousEmployerIncome: [0, [Validators.min(0)]],
      previousEmployerTDS: [0, [Validators.min(0)]]
    });

    this.updateFinancialYear(period);
    this.form.get('period')!.valueChanges.subscribe((d: Date) => this.updateFinancialYear(d));
  }

  private updateFinancialYear(d: Date): void {
    if (!d) return;
    const fyStart = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; // JS months 0-11; Apr = index 3
    this.financialYear = `${fyStart}-${fyStart + 1}`;
  }

  private toApiPeriod(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}-01`;
  }

  loadConfig(): void {
    const empId = +this.form.value.employeeId;
    if (!empId) return;
    this._masterService.getEmployeeTDSConfiguration(empId, this.financialYear).subscribe(
      (list: EmployeeTDSConfiguration[]) => {
        const rec = list && list.length ? list[0] : null;
        if (rec) {
          this.configForm.patchValue({
            taxRegime: rec.taxRegime || 'New',
            previousEmployerIncome: rec.previousEmployerIncome || 0,
            previousEmployerTDS: rec.previousEmployerTDS || 0
          });
        }
      },
      () => { /* no config yet is fine */ }
    );
  }

  saveConfig(): void {
    const empId = +this.form.value.employeeId;
    if (!empId) { Swal.fire('Info', 'Enter an Employee ID first.', 'info'); return; }
    const model: EmployeeTDSConfiguration = {
      employeeID: empId,
      financialYear: this.financialYear,
      taxRegime: this.configForm.value.taxRegime || 'New',
      previousEmployerIncome: +this.configForm.value.previousEmployerIncome || 0,
      previousEmployerTDS: +this.configForm.value.previousEmployerTDS || 0
    };
    this._masterService.saveEmployeeTDSConfiguration(model).subscribe(
      () => Swal.fire({ title: 'Saved', text: 'Employee TDS configuration saved.', icon: 'success', timer: 1500, showConfirmButton: false }),
      (e: any) => Swal.fire('Error', `Failed to save configuration. ${e?.message ?? e}`, 'error')
    );
  }

  compute(): void {
    if (this.form.invalid) { Swal.fire('Info', 'Enter Employee ID, Monthly Gross and Period.', 'info'); return; }
    const empId = +this.form.value.employeeId;
    const gross = +this.form.value.monthlyGross;
    const period = this.toApiPeriod(this.form.value.period);
    this.showLoadingSpinner = true;
    this.result = null;
    this._payrollService.getEmployeeTDSComputation(empId, gross, period).subscribe(
      (data: any) => {
        // API returns PascalCase (PropertyNamingPolicy = null); store as-is
        this.result = data as TDSComputationResult;
        this.showLoadingSpinner = false;
      },
      (e: any) => {
        this.showLoadingSpinner = false;
        Swal.fire('Error', `TDS computation failed. ${e?.message ?? e}`, 'error');
      }
    );
  }
}
