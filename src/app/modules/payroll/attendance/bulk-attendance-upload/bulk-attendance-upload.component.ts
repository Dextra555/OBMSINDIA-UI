import { Component, OnInit, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable } from '@angular/material/table';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import { DatePipe } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface BulkUploadResult {
  success: boolean;
  message: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: BulkUploadError[];
  successRecords: BulkUploadSuccess[];
  validationWarnings?: string[];
}

export interface BulkUploadError {
  rowNumber: number;
  employeeCode: string;
  employeeName: string;
  errorMessage: string;
  fieldName?: string;
  details?: string; // Additional error details
  errorType?: string; // Error category
}

export interface BulkUploadSuccess {
  rowNumber: number;
  employeeCode: string;
  employeeName: string;
  attendanceID: number;
  message: string;
}

@Component({
  selector: 'app-bulk-attendance-upload',
  templateUrl: './bulk-attendance-upload.component.html',
  styleUrls: ['./bulk-attendance-upload.component.css'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px',
        overflow: 'hidden',
        opacity: '0'
      })),
      state('expanded', style({
        height: '*',
        overflow: 'visible',
        opacity: '1'
      })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out'))
    ])
  ]
})
export class BulkAttendanceUploadComponent implements OnInit, AfterViewInit {
  uploadForm!: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;
  uploadResult: BulkUploadResult | null = null;
  branches: any[] = [];
  errorMessage: string = '';
  generalErrors: string[] = []; // Validation errors before upload
  successMessage: string = '';
  
  errorDisplayedColumns: string[] = ['rowNumber', 'employeeCode', 'employeeName', 'fieldName', 'errorMessage', 'expandDetails'];
  successDisplayedColumns: string[] = ['rowNumber', 'employeeCode', 'employeeName', 'attendanceID', 'message'];
  expandedErrorRow: BulkUploadError | null = null;
  
  currentUser: string = 'admin'; // TODO: Get from auth service
  attendanceCodes = ['P', 'W/O', 'H', 'L', 'NH'];
  attendanceCodeDescriptions = {
    'P': 'Present - Regular working day',
    'W/O': 'Weekly Off - Non-working day',
    'H': 'Holiday - Public holiday',
    'L': 'Absent - No pay deduction',
    'NH': 'National Holiday - National festival holiday'
  };

  // Custom attendance period support
  clients: any[] = [];
  attendancePeriodLabel: string = '';
  attendancePeriodIsCustom: boolean = false;

  @ViewChild('errorTable') errorTable!: MatTable<BulkUploadError>;
  @ViewChild('successTable') successTable!: MatTable<BulkUploadSuccess>;

  constructor(
    private fb: FormBuilder,
    private payrollService: PayrollModuleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadBranches();

    // Resolve period label immediately when period changes
    this.uploadForm.get('period')?.valueChanges.subscribe(() => {
      this.resolveAttendancePeriod();
    });
  }

  ngAfterViewInit(): void {
    // Any DOM operations after view initialization
  }

  private pickValue(obj: any, keys: string[]): any {
    if (!obj) return undefined;
    for (const key of keys) {
      const value = obj[key];
      if (value !== undefined && value !== null) return value;
    }
    return undefined;
  }

  private normalizeBulkUploadResult(data: any): BulkUploadResult | null {
    if (!data) return null;

    const success = this.pickValue(data, ['success', 'Success']);
    if (typeof success !== 'boolean') return null;

    const errorsRaw = this.pickValue(data, ['errors', 'Errors']);
    const successRecordsRaw = this.pickValue(data, ['successRecords', 'SuccessRecords']);
    const validationWarningsRaw = this.pickValue(data, ['validationWarnings', 'ValidationWarnings']);
    const validationErrorsRaw = this.pickValue(data, ['validationErrors', 'ValidationErrors']);

    const errors: BulkUploadError[] = Array.isArray(errorsRaw)
      ? errorsRaw.map((e: any) => ({
          rowNumber: Number(this.pickValue(e, ['rowNumber', 'RowNumber']) ?? 0),
          employeeCode: String(this.pickValue(e, ['employeeCode', 'EmployeeCode']) ?? ''),
          employeeName: String(this.pickValue(e, ['employeeName', 'EmployeeName']) ?? ''),
          errorMessage: String(this.pickValue(e, ['errorMessage', 'ErrorMessage']) ?? ''),
          fieldName: this.pickValue(e, ['fieldName', 'FieldName']),
          details: this.pickValue(e, ['details', 'Details', 'stackTrace', 'StackTrace']),
          errorType: this.pickValue(e, ['errorType', 'ErrorType'])
        }))
      : [];

    const successRecords: BulkUploadSuccess[] = Array.isArray(successRecordsRaw)
      ? successRecordsRaw.map((r: any) => ({
          rowNumber: Number(this.pickValue(r, ['rowNumber', 'RowNumber']) ?? 0),
          employeeCode: String(this.pickValue(r, ['employeeCode', 'EmployeeCode']) ?? ''),
          employeeName: String(this.pickValue(r, ['employeeName', 'EmployeeName']) ?? ''),
          attendanceID: Number(this.pickValue(r, ['attendanceID', 'AttendanceID']) ?? 0),
          message: String(this.pickValue(r, ['message', 'Message']) ?? '')
        }))
      : [];

    const validationWarnings: string[] = [];

    if (Array.isArray(validationWarningsRaw)) {
      validationWarnings.push(...validationWarningsRaw.map((w: any) => String(w)));
    }

    if (validationErrorsRaw && typeof validationErrorsRaw === 'object') {
      Object.values(validationErrorsRaw).forEach((arr: any) => {
        if (Array.isArray(arr)) {
          arr.forEach((v: any) => validationWarnings.push(String(v)));
        }
      });
    }

    return {
      success,
      message: String(this.pickValue(data, ['message', 'Message']) ?? ''),
      totalRecords: Number(this.pickValue(data, ['totalRecords', 'TotalRecords']) ?? 0),
      successfulRecords: Number(this.pickValue(data, ['successfulRecords', 'SuccessfulRecords']) ?? 0),
      failedRecords: Number(this.pickValue(data, ['failedRecords', 'FailedRecords']) ?? 0),
      errors,
      successRecords,
      validationWarnings: validationWarnings.length > 0 ? validationWarnings : undefined
    };
  }

  private initializeForm(): void {
    this.uploadForm = this.fb.group({
      period: [new Date(), Validators.required],
      branchCode: ['', Validators.required],
      clientCode: ['']   // optional — drives custom attendance period resolution
    });
  }

  private loadBranches(): void {
    this.payrollService.getBranchList().subscribe({
      next: (branches: any[]) => {
        this.branches = branches;
      },
      error: (error: any) => {
        console.error('Error loading branches:', error);
        this.addGeneralError('Failed to load branch list. Please refresh the page.');
        this.snackBar.open('Error loading branches', 'Close', { duration: 3000 });
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.generalErrors = []; // Clear previous validation errors
      
      // Validate file type
      if (!file.name.endsWith('.xlsx')) {
        this.addGeneralError('Γ¥î File must be in Excel format (.xlsx)');
        this.snackBar.open('Invalid file type', 'Close', { duration: 3000 });
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.addGeneralError(`Γ¥î File size (${this.formatFileSize(file.size)}) exceeds 5MB limit`);
        this.snackBar.open('File too large', 'Close', { duration: 3000 });
        return;
      }

      this.selectedFile = file;
      this.uploadResult = null;
      this.successMessage = `Γ£ô File selected: ${file.name} (${this.formatFileSize(file.size)})`;
    }
  }

  /** Called when branch changes — reload client list for the branch */
  onBranchChange(event: any): void {
    const branchCode = event?.value || event;
    if (!branchCode) { this.clients = []; return; }
    this.payrollService.getClientsByBranch(branchCode).subscribe({
      next: (data: any[]) => { this.clients = data || []; },
      error: () => { this.clients = []; }
    });
    this.resolveAttendancePeriod();
  }

  /** Called when client changes — re-resolve the attendance period */
  onClientChange(_event: any): void {
    this.resolveAttendancePeriod();
  }

  /** Calls the backend to resolve the attendance period for the selected client + period month.
   *  Updates attendancePeriodLabel and attendancePeriodIsCustom for display in the template. */
  private resolveAttendancePeriod(): void {
    const period: Date = this.uploadForm.get('period')?.value;
    const clientCode: string = this.uploadForm.get('clientCode')?.value || '';
    if (!period) { this.attendancePeriodLabel = ''; return; }

    const year  = period.getFullYear();
    const month = period.getMonth() + 1;

    this.payrollService.getAttendancePeriod(clientCode, year, month).subscribe({
      next: (result) => {
        this.attendancePeriodLabel    = result.Label;
        this.attendancePeriodIsCustom = result.IsCustom;
      },
      error: () => {
        // Fallback display — calendar month
        const lastDay = new Date(year, month, 0);
        this.attendancePeriodLabel    = `01-${period.toLocaleString('en-GB', { month: 'short' })}-${year} to ${lastDay.getDate()}-${period.toLocaleString('en-GB', { month: 'short' })}-${year}`;
        this.attendancePeriodIsCustom = false;
      }
    });
  }

  downloadTemplate(): void {
    if (this.uploadForm.invalid) {
      this.addGeneralError('ΓÜá∩╕Å Please select both period and branch before downloading template');
      this.snackBar.open('Please select period and branch', 'Close', { duration: 3000 });
      return;
    }

    const period = this.uploadForm.get('period')?.value;
    const branchCode = this.uploadForm.get('branchCode')?.value;
    const formattedPeriod = this.datePipe.transform(period, 'MMM-yy');

    this.payrollService.downloadSimplifiedAttendanceTemplate(period, branchCode).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Attendance_Template_${formattedPeriod}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.generalErrors = [];
        this.successMessage = `Γ£ô Template downloaded successfully: Attendance_Template_${formattedPeriod}.xlsx`;
        this.snackBar.open('Template downloaded successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error downloading template:', error);
        this.addGeneralError(`ΓÜá∩╕Å Failed to download template: ${this.getErrorMessage(error)}`);
        this.snackBar.open('Error downloading template', 'Close', { duration: 3000 });
      }
    });
  }

  uploadFile(): void {
    this.generalErrors = [];
    this.successMessage = '';

    // Validation
    if (!this.selectedFile) {
      this.addGeneralError('Γ¥î Please select a file to upload');
      this.snackBar.open('No file selected', 'Close', { duration: 3000 });
      return;
    }

    if (this.uploadForm.invalid) {
      this.addGeneralError('Γ¥î Please select both period and branch');
      this.snackBar.open('Form incomplete', 'Close', { duration: 3000 });
      return;
    }

    // Pre-validation success
    this.generalErrors = [];
    this.successMessage = 'Γ£ô Validation passed. Uploading file...';

    this.isUploading = true;
    this.uploadResult = null;

    this.payrollService.uploadSimplifiedAttendance(this.selectedFile, this.currentUser).subscribe({
      next: (result: any) => {
        const normalized = this.normalizeBulkUploadResult(result) ?? result;
        this.uploadResult = normalized;
        this.isUploading = false;
        this.generalErrors = [];

        if (normalized.success) {
          this.successMessage = `Γ£ô Upload completed successfully: ${normalized.successfulRecords} records processed`;
          this.snackBar.open(
            `Γ£ô Upload completed: ${normalized.successfulRecords} successful`,
            'Close',
            { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar'] }
          );
        } else {
          this.successMessage = '';
          if (normalized.failedRecords > 0) {
            this.addGeneralError(
              `ΓÜá∩╕Å Upload completed with errors: ${normalized.successfulRecords} succeeded, ${normalized.failedRecords} failed`
            );
          }
          this.snackBar.open(
            `ΓÜá∩╕Å Upload completed with errors: ${normalized.failedRecords} records failed`,
            'View Errors',
            { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['warning-snackbar'] }
          );
        }

        // Show validation warnings if any
        if (normalized.validationWarnings && normalized.validationWarnings.length > 0) {
          normalized.validationWarnings.forEach((warning: string) => {
            this.addGeneralError(`ΓÜá∩╕Å ${warning}`);
          });
        }
      },
      error: (error) => {
        console.error('Error uploading file:', error);
        this.isUploading = false;
        this.uploadResult = null;

        const normalizedFromError = this.normalizeBulkUploadResult(error?.error);
        if (normalizedFromError) {
          this.uploadResult = normalizedFromError;
          this.generalErrors = [];

          if (normalizedFromError.success) {
            this.successMessage = `Γ£ô Upload completed successfully: ${normalizedFromError.successfulRecords} records processed`;
            this.snackBar.open(
              `Γ£ô Upload completed: ${normalizedFromError.successfulRecords} successful`,
              'Close',
              { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['success-snackbar'] }
            );
          } else {
            this.successMessage = '';
            if (normalizedFromError.failedRecords > 0) {
              this.addGeneralError(
                `ΓÜá∩╕Å Upload completed with errors: ${normalizedFromError.successfulRecords} succeeded, ${normalizedFromError.failedRecords} failed`
              );
            }
            this.snackBar.open(
              `ΓÜá∩╕Å Upload completed with errors: ${normalizedFromError.failedRecords} records failed`,
              'View Errors',
              { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['warning-snackbar'] }
            );
          }

          if (normalizedFromError.validationWarnings && normalizedFromError.validationWarnings.length > 0) {
            normalizedFromError.validationWarnings.forEach((warning: string) => {
              this.addGeneralError(`ΓÜá∩╕Å ${warning}`);
            });
          }

          return;
        }

        const errorDetails = this.parseErrorResponse(error);
        this.generalErrors = errorDetails.generalErrors;
        
        if (errorDetails.generalErrors.length > 0) {
          this.snackBar.open(
            errorDetails.generalErrors[0],
            'Close',
            { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar'] }
          );
        }
      }
    });
  }

  /**
   * Parse various error response formats from backend
   */
  private parseErrorResponse(error: any): { generalErrors: string[] } {
    const generalErrors: string[] = [];

    try {
      // HTTP error response
      if (error.status) {
        switch (error.status) {
          case 400:
            if (error.error?.errors || error.error?.ValidationErrors) {
              // Validation errors object
              const errObj = error.error.errors ?? error.error.ValidationErrors;
              Object.values(errObj).forEach((errArray: any) => {
                if (Array.isArray(errArray)) {
                  errArray.forEach((e: any) => generalErrors.push(`Γ¥î ${e}`));
                } else {
                  generalErrors.push(`Γ¥î ${errArray}`);
                }
              });
            } else if (Array.isArray(error.error?.Errors)) {
              error.error.Errors.forEach((e: any) => {
                const msg = e?.ErrorMessage ?? e?.errorMessage ?? JSON.stringify(e);
                generalErrors.push(`Γ¥î ${msg}`);
              });
            } else if (error.error?.message) {
              generalErrors.push(`Γ¥î ${error.error.message}`);
            } else if (error.error?.Message) {
              generalErrors.push(`Γ¥î ${error.error.Message}`);
            } else if (error.error) {
              generalErrors.push(`Γ¥î ${JSON.stringify(error.error)}`);
            }
            break;

          case 401:
            generalErrors.push('Γ¥î Authentication failed. Please login again.');
            break;

          case 403:
            generalErrors.push('Γ¥î You do not have permission to upload attendance.');
            break;

          case 413:
            generalErrors.push('Γ¥î File size too large. Maximum size is 5MB.');
            break;

          case 415:
            generalErrors.push('Γ¥î Unsupported file format. Please use .xlsx files only.');
            break;

          case 500:
            generalErrors.push('Γ¥î Server error occurred. Please try again later.');
            break;

          default:
            if (error.error?.message) {
              generalErrors.push(`Γ¥î Error: ${error.error.message}`);
            } else {
              generalErrors.push(`Γ¥î HTTP Error ${error.status}: ${error.statusText}`);
            }
        }
      }

      // Network error
      if (error.message === 'Unknown Error') {
        generalErrors.push('Γ¥î Network error. Please check your connection and try again.');
      }

      // No internet
      if (error.message && error.message.includes('failed')) {
        generalErrors.push('Γ¥î Connection failed. Please check your internet connection.');
      }

    } catch (e) {
      console.error('Error parsing error response:', e);
      generalErrors.push('Γ¥î An unexpected error occurred.');
    }

    return {
      generalErrors: generalErrors.length > 0 ? generalErrors : ['Γ¥î Unknown error occurred']
    };
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    } else if (error.message) {
      return error.message;
    }
    return 'Unknown error';
  }

  addGeneralError(message: string): void {
    if (!this.generalErrors.includes(message)) {
      this.generalErrors.push(message);
    }
  }

  clearGeneralErrors(): void {
    this.generalErrors = [];
    this.successMessage = '';
  }

  exportErrorDetails(): void {
    if (!this.uploadResult || !this.uploadResult.errors || this.uploadResult.errors.length === 0) {
      this.snackBar.open('No errors to export', 'Close', { duration: 3000 });
      return;
    }

    // Create CSV content
    let csvContent = 'Row,Employee Code,Employee Name,Field Name,Error Message,Error Type\n';
    
    this.uploadResult.errors.forEach(error => {
      const row = [
        error.rowNumber,
        `"${error.employeeCode}"`,
        `"${error.employeeName}"`,
        error.fieldName || 'General',
        `"${error.errorMessage.replace(/"/g, '""')}"`,
        error.errorType || 'unknown'
      ].join(',');
      csvContent += row + '\n';
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_errors_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Γ£ô Error details exported', 'Close', { duration: 3000 });
  }

  exportSuccessDetails(): void {
    if (!this.uploadResult || !this.uploadResult.successRecords || this.uploadResult.successRecords.length === 0) {
      this.snackBar.open('No successful records to export', 'Close', { duration: 3000 });
      return;
    }

    // Create CSV content
    let csvContent = 'Row,Employee Code,Employee Name,Attendance ID,Status\n';
    
    this.uploadResult.successRecords.forEach(record => {
      const row = [
        record.rowNumber,
        `"${record.employeeCode}"`,
        `"${record.employeeName}"`,
        record.attendanceID,
        `"${record.message}"`
      ].join(',');
      csvContent += row + '\n';
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_success_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Γ£ô Success details exported', 'Close', { duration: 3000 });
  }

  toggleErrorDetails(error: BulkUploadError): void {
    this.expandedErrorRow = this.expandedErrorRow === error ? null : error;
  }

  isErrorExpanded(error: BulkUploadError): boolean {
    return this.expandedErrorRow === error;
  }

  retryUpload(): void {
    if (this.selectedFile) {
      this.uploadFile();
    }
  }

  validateData(): void {
    this.snackBar.open('Validation feature coming soon', 'Close', { duration: 3000 });
  }

  clearForm(): void {
    this.uploadForm.reset({
      period: new Date(),
      branchCode: ''
    });
    this.selectedFile = null;
    this.uploadResult = null;
    this.generalErrors = [];
    this.successMessage = '';
    this.expandedErrorRow = null;

    // Clear file input
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getAttendanceCodeColor(code: string): string {
    const colors: { [key: string]: string } = {
      'P': 'primary',
      'W/O': 'accent',
      'H': 'warn',
      'L': 'warn',
      'NH': 'primary'
    };
    return colors[code] || 'primary';
  }

  getAttendanceCodeDescription(code: string): string {
    return this.attendanceCodeDescriptions[code as keyof typeof this.attendanceCodeDescriptions] || '';
  }

  getErrorTypeColor(errorType?: string): string {
    switch (errorType) {
      case 'validation': return 'primary';
      case 'processing': return 'warn';
      case 'system': return 'accent';
      default: return 'primary';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  showInstructions(): void {
    this.dialog.open(BulkUploadInstructionsDialogComponent, {
      width: '750px',
      maxHeight: '80vh'
    });
  }
}

@Component({
  selector: 'app-bulk-upload-instructions-dialog',
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Upload Instructions & Error Guide</h2>
      <mat-dialog-content>
        <mat-tab-group>
          <mat-tab label="Instructions">
            <div class="tab-content">
              <h4>Step 1: Download Template</h4>
              <ol>
                <li>Select the attendance period (month/year)</li>
                <li>Select the branch</li>
                <li>Click "Download Template"</li>
              </ol>

              <h4>Step 2: Fill Template</h4>
              <ul>
                <li><strong>Employee Name:</strong> Name of the employee (required)</li>
                <li><strong>Employee Code:</strong> Must exist in the system (required)</li>
                <li><strong>Branch Code:</strong> Must match the selected branch (required)</li>
                <li><strong>Period:</strong> Auto-filled, do not modify</li>
                <li><strong>Daily Columns (1-31):</strong> Enter attendance code for each day</li>
              </ul>

              <h4>Step 3: Attendance Codes</h4>
              <table class="codes-table">
                <tr><th>Code</th><th>Meaning</th><th>Working Hours</th></tr>
                <tr><td><strong>P</strong></td><td>Present</td><td>8 hours</td></tr>
                <tr><td><strong>W/O</strong></td><td>Weekly Off</td><td>0 hours</td></tr>
                <tr><td><strong>H</strong></td><td>Holiday</td><td>0 hours</td></tr>
                <tr><td><strong>L</strong></td><td>Absent</td><td>0 hours (no pay)</td></tr>
                <tr><td><strong>NH</strong></td><td>National Holiday</td><td>0 hours</td></tr>
              </table>

              <h4>Step 4: Upload File</h4>
              <ol>
                <li>Select the filled Excel file</li>
                <li>Click "Upload File"</li>
                <li>Review the results and error messages</li>
              </ol>

              <p class="important"><strong>Important:</strong> Use ONLY the codes P, W/O, H, L, NH. Invalid codes will cause the upload to fail.</p>
            </div>
          </mat-tab>

          <mat-tab label="Common Errors">
            <div class="tab-content">
              <h4>1. "Employee code not found"</h4>
              <p><strong>Cause:</strong> The employee code doesn't exist in the system</p>
              <p><strong>Solution:</strong> Check the employee master and ensure the code is correct</p>

              <h4>2. "Invalid attendance code 'X'"</h4>
              <p><strong>Cause:</strong> Used a code other than P, W/O, H, L, NH</p>
              <p><strong>Solution:</strong> Use only the valid codes from the table above</p>

              <h4>3. "Branch code not found"</h4>
              <p><strong>Cause:</strong> The branch doesn't exist in the system</p>
              <p><strong>Solution:</strong> Verify the branch code is correct</p>

              <h4>4. "Period is too far in the future/past"</h4>
              <p><strong>Cause:</strong> Attendance period is outside the valid range</p>
              <p><strong>Solution:</strong> Use periods within last 2 years or next 1 month</p>

              <h4>5. "Duplicate employee entries found"</h4>
              <p><strong>Cause:</strong> Same employee appears multiple times for the same period</p>
              <p><strong>Solution:</strong> Remove duplicates from the file</p>

              <h4>6. "File size exceeds 5MB"</h4>
              <p><strong>Cause:</strong> File is too large</p>
              <p><strong>Solution:</strong> Split the file into smaller batches</p>

              <h4>7. "Invalid file format"</h4>
              <p><strong>Cause:</strong> File is not in .xlsx format</p>
              <p><strong>Solution:</strong> Save the file as Excel format (.xlsx)</p>
            </div>
          </mat-tab>

          <mat-tab label="Tips">
            <div class="tab-content">
              <h4>Best Practices</h4>
              <ul>
                <li>Always download a fresh template for each upload</li>
                <li>Verify employee codes exist before uploading</li>
                <li>Use the dropdown in Excel to select valid codes</li>
                <li>Save your work frequently while filling the template</li>
                <li>Upload during off-peak hours for faster processing</li>
                <li>Check the error report carefully after upload</li>
                <li>Export error details for record keeping</li>
              </ul>

              <h4>Troubleshooting</h4>
              <ul>
                <li>If upload fails, check the error details table below the form</li>
                <li>Each failed row shows the specific employee and error reason</li>
                <li>You can export errors to CSV for analysis</li>
                <li>Successful records are still saved even if some records fail</li>
                <li>You can retry after fixing the issues</li>
              </ul>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 20px;
    }
    .tab-content {
      padding: 20px 0;
    }
    h4 {
      margin-top: 20px;
      margin-bottom: 10px;
      color: #333;
    }
    ol, ul {
      margin-left: 20px;
      line-height: 1.8;
    }
    li {
      margin-bottom: 8px;
    }
    .codes-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      background: #f9f9f9;
    }
    .codes-table th,
    .codes-table td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    .codes-table th {
      background: #f0f0f0;
      font-weight: bold;
    }
    .important {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 15px 0;
      border-radius: 4px;
    }
    p {
      line-height: 1.6;
      margin-bottom: 10px;
    }
  `]
})
export class BulkUploadInstructionsDialogComponent {
  constructor() { }
}
