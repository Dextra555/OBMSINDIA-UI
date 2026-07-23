import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AdminLayoutRoutingModule } from './admin-layout-routing.module';
import { AdminLayoutComponent } from './admin-layout.component';
import { ComponentsModule } from 'src/app/components/components.module';
import { SharedModule } from 'src/app/modules/shared.module';
import { CommonService } from 'src/app/service/common.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { HttpClientModule } from '@angular/common/http';
import { AttendanceDisplayModule } from 'src/app/modules/payroll/attendance/attendance-display/attendance-display.module';
import { ClientComplianceReportModule } from 'src/app/modules/report/payroll/client-compliance-report/client-compliance-report.module';
import { EsiStatementReportModule } from 'src/app/modules/report/payroll/esi-statement-report/esi-statement-report.module';
import { ProfessionalTaxStatementReportModule } from 'src/app/modules/report/payroll/professional-tax-statement-report/professional-tax-statement-report.module';
import { NonComplianceReportModule } from 'src/app/modules/report/payroll/non-compliance-report/non-compliance-report.module';
import { PfStatementReportModule } from 'src/app/modules/report/payroll/pf-statement-report/pf-statement-report.module';
import { GstStatementReportModule } from 'src/app/modules/report/payroll/gst-statement-report/gst-statement-report.module';
import { ProfessionalTaxSlabModule } from 'src/app/modules/master/professional-tax-slab/professional-tax-slab.module';
import { RbiBankSalaryProcessModule } from 'src/app/modules/payroll/rbi-bank-salary-process/rbi-bank-salary-process.module';
import { RbiBankAdvanceSalaryProcessModule } from 'src/app/modules/payroll/rbi-bank-advance-salary-process/rbi-bank-advance-salary-process.module';
import { BulkAttendanceUploadModule } from 'src/app/modules/payroll/attendance/bulk-attendance-upload/bulk-attendance-upload.module';


@NgModule({
  declarations: [
    AdminLayoutComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    AdminLayoutRoutingModule,
    ComponentsModule,
    SharedModule,
    HttpClientModule,
    AttendanceDisplayModule,
    ClientComplianceReportModule,
    EsiStatementReportModule,
    ProfessionalTaxStatementReportModule,
    NonComplianceReportModule,
    PfStatementReportModule,
    GstStatementReportModule,
    ProfessionalTaxSlabModule,
    RbiBankSalaryProcessModule,
    RbiBankAdvanceSalaryProcessModule,
    BulkAttendanceUploadModule
  ],
  providers: [CommonService, MastermoduleService],
})
export class AdminLayoutModule { }
