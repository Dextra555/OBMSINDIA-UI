import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, finalize, forkJoin, Observable, of, shareReplay, switchMap, take, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DialogConfirmationComponent } from 'src/app/components/dialog-confirmation/dialog-confirmation.component';
import { AttendanceModel } from 'src/app/model/attendanceModel';
import { BranchModel } from 'src/app/model/branchModel';
import { ClientModel } from 'src/app/model/clientModel';
import { EmployeeMonthlyAdvance } from 'src/app/model/employeeMonthlyAdvance';
import { EmployeeAdvanceListModel } from 'src/app/model/empolyeeAdvanceListModel';
import { UserAccessModel } from 'src/app/model/userAccesModel';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { MastermoduleService } from 'src/app/service/mastermodule.service';
import { PayrollModuleService } from 'src/app/service/payrollmodule.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-attendance',
  templateUrl: './new-attendance.component.html',
  styleUrls: ['./new-attendance.component.css']
})
export class NewAttendanceComponent implements OnInit {
  attendanceForm!: FormGroup;
  showLoadingSpinner: boolean = false;
  attendanceModel: AttendanceModel = new AttendanceModel();
  apiUrl: string = environment.baseUrl;
  employeeModel!: ClientModel[];
  employeeListModel!: EmployeeAdvanceListModel[];
  normalValues1: (string | number)[] = ['', ...Array.from({ length: 24 }, (_, i) => i + 1)];
  normalValues2: (string | number)[] = ['', ...Array.from({ length: 24 }, (_, i) => i + 1)];
  shift2Values1: (string | number)[] = ['', ...Array.from({ length: 24 }, (_, i) => i + 1)];
  shift2Values2: (string | number)[] = ['', ...Array.from({ length: 24 }, (_, i) => i + 1)];

  dynamicForm!: FormGroup;
  minDate = new Date();
  advanceDateError!: string;
  dynamicEditable: string = '';
  selectedWorkType: string = '1';
  finalHours: number = 0;
  finalHoursshift2: number = 0;
  branchModel!: BranchModel[];
  attendanceID: number = 0;
  workType: string = '';
  workTypeId: number = 1;
  errorMessage: string = '';
  currentUser: string | null = '';
  warningMessage: string = '';
  userAccessModel!: UserAccessModel;
  shift2StartTime: number = 0;
  shift2EndTime: number = 0;
  startTime: number = 0;
  endTime: number = 0;
  dtAdvanceDate!: string;
  nameList: string[] = [];
  employeeSelectedType: string = '';
  StartPeriod!: string;
  EndPeriod!: string;
  attendancePeriod!: string;
  branchCode!: string;
  normalValue1Change!: string;
  normalValue2Change!: string;
  shiftValues1Change!: string;
  shiftValues2Change!: string;
  ClientName!: string;
  Shift2Client!: string;
  shift2StartTimeValidation!: number | null;;
  shift2EndTimeValidation!: number | null;;
  shift2HoursValidation!: number | null;;
  salaryProcessStatus: boolean = false; // Tracks if salary processing is done.
  temporaryEmployeeStatus$: BehaviorSubject<Map<string, boolean>> = new BehaviorSubject(new Map()); // Caches temporary employee statuses.
  dtAttendanceDate = new Date();
  userRole!: string;
  iAbsent: number = 0;
  iAnnualLeave: number = 0;
  iMedicalLeave: number = 0;
  iMaternityLeave: number = 0;
  iPaternityLeave: number = 0;
  iHospitalizationLeave: number = 0;
  leaveBalances: any = {};
  attendanceDetails: any[] = [];

  employeeSearchCtrl = new FormControl();
  employeeSearchText: string = '';
  filteredEmployeeList: any[] = [];

  private formatDate(date: any) {
    const d = new Date(date);
    const year = d.getFullYear();
    let month = ('0' + (d.getMonth() + 1)).slice(-2);
    let day = ('0' + d.getDate()).slice(-2);
    let hours = ('0' + d.getHours()).slice(-2);
    let minutes = ('0' + d.getMinutes()).slice(-2);
    let seconds = ('0' + d.getSeconds()).slice(-2);
    //let milliseconds = ('00' + d.getMilliseconds()).slice(-3);

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  private formatDisplayDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  getClientShortname(clientName: string): string {
    if (!clientName) return '';
    const client = this.employeeModel.find(c => c.Name === clientName);
    return client ? client.Shortname : clientName;
  }

  workTypeList: any[] = [
    { id: 1, name: 'General Working' },
    { id: 2, name: 'Off Day' },
    { id: 3, name: 'Off Day Working' },
    { id: 4, name: 'Holiday' },
    { id: 5, name: 'Holiday Working' },
    { id: 6, name: 'Unpaid Leave' },
    { id: 7, name: 'Absent' },
    { id: 8, name: 'Annual Leave' },
    { id: 9, name: 'Medical Leave' },
    { id: 10, name: 'Maternity Leave' },
    { id: 11, name: 'Paternity Leave' },
    { id: 12, name: 'Hospitalization Leave' },
    { id: 13, name: 'ESI' },
    { id: 14, name: 'Non Schedule Off' },
    { id: 15, name: 'Replacement Leave' },
    { id: 16, name: 'Compensanate Leave' },
    { id: 17, name: 'Marriage Leave' },

  ]

  constructor(private fb: FormBuilder, private _payrollService: PayrollModuleService, public dialog: MatDialog,
    private _masterService: MastermoduleService, private _dataService: DatasharingService,
    private _router: Router, private httpClient: HttpClient) {
    this.attendanceForm = this.fb.group({
      ID: [0],
      EmployeeID: [''],
      AdvanceDate: [new Date, [Validators.required]],
      ClientName: [''],
      BranchCode: ['', [Validators.required]],
      EmployeeNo: ['', [Validators.required]],
      EmployeeType: ['Guard'],
      StartTime: [''],
      EndTime: [''],
      Hours: [''],
      Shif2Client: [''],
      Shift2StartTime: [''],
      Shift2EndTime: [''],
      Shift2Hours: [''],
      AadhaarPAN: '',
      Age: '',
      JoinDate: '',
      ResignedDate: '',
      IncomeTax: '',
      PF: '',
      PFAccountNo: '',
      ESI: '',
      UAN: '',
      PaymentMode: '',
      SalaryStructure: '',
      SalarySlab: '',
      BasicPay: '',
      Annual: '',
      Medical: '',
      Maternity: '',
      Paternity: '',
      Hospitalization: '',
      BonusAmount: 0.00,
      Shift2Type: ['3'],
      Shift2Rate: 0.00,
      Allowance: '',
      SpecialAllowance: '',
      AllowanceDeduction: 0.00,
      SpecialAllowanceDeduction: 0.00,
      AllowanceDeductionStaff: 0.00,
      SpecialAllowanceDeductionStaff: 0.00,
      LastUpdate: [this.formatDate(new Date)],
      LastUpdatedBy: [''],
      // Working Days and Allowance Configuration
      AttendanceAllowanceFollowCalendar: '',
      AttendanceAllowanceWorkingDays: '',
      WorkingDays: '',
      WorkingDaysAllowed: '',
      DaysWorked: '',
      CalculatedAllowance: '',
      ExtraDays: 0,
    });
    this.userAccessModel = {
      readAccess: false,
      updateAccess: false,
      deleteAccess: false,
      createAccess: false,
    }
    this.userRole = sessionStorage.getItem('userrole')!
    if (this.userRole == 'true') {
      this.userRole = 'admin' 
    } else {
      this.userRole = 'user'
    }
  }

  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;

    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.getUserAccessRights(this.currentUser, 'Employee Attendance');
    this.createForm();
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

          if (this.userAccessModel.readAccess === true || this.currentUser == 'superadmin') {
            this.warningMessage = '';
            this.hideloadingSpinner();
            this.getBranchMasterListByUser(this.currentUser!);
          } else {
            this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>
                      You do not have permissions to view this page. <br>
                      If you feel you should have access to this page, Please contact administrator. <br>
                      Thank you`;
            this.hideloadingSpinner();
          }
        }

      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }

  changeAdvanceDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.clearFormFields();
    this.employeeSelectedType = this.attendanceForm.value.EmployeeType;
    this.attendancePeriod = this.attendanceForm.value.AdvanceDate;
    this.branchCode = this.attendanceForm.value.BranchCode;

    const dtAdvanceDate = new Date(this.attendanceForm.value.AdvanceDate);

    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );
    this.StartPeriod = this.formatDate(this.firstOfMonth(new Date(this.attendancePeriod)));
    this.EndPeriod = this.formatDate(this.lastOfMonth(new Date(this.attendancePeriod)));


    if (this.branchCode != '' && this.branchCode != undefined) {
      this.getEmployeeListByEmployeeType(this.branchCode, this.attendanceForm.value.EmployeeType, this.StartPeriod, this.EndPeriod, 'Active');
      this.getClients(this.dtAdvanceDate, this.branchCode);
    } else {
      this.getEmployeeListByEmployeeType("0", this.attendanceForm.value.EmployeeType, this.StartPeriod, this.EndPeriod, 'Active');
    }
  }
  onBranchSelectionChange(event: any) {
    this.showLoadingSpinner = true;
    this.clearFormFields();
    this.employeeSelectedType = this.attendanceForm.value.EmployeeType;

    let dtAdvanceDate = new Date(this.attendanceForm.value.AdvanceDate);
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );

    this.attendancePeriod = this.formatDate(this.attendanceForm.get('AdvanceDate')?.value);
    this.branchCode = event.value;

    this.StartPeriod = this.formatDate(this.firstOfMonth(new Date(this.attendancePeriod)));
    this.EndPeriod = this.formatDate(this.lastOfMonth(new Date(this.attendancePeriod)));

    if (this.attendancePeriod != null && this.attendancePeriod != 'NaN-NaN-NaN' && this.branchCode != '') {
      this.errorMessage = '';
      // this.getEmployeeListByEmployeeType(advanceDate, branchCode, event.value, 1, 0, 'All');
      this.getEmployeeListByEmployeeType(this.branchCode, this.attendanceForm.value.EmployeeType, this.StartPeriod, this.EndPeriod, 'Active');
      this.getClients(this.attendancePeriod, this.branchCode);
      setTimeout(() => {
        this.hideloadingSpinner();
      }, 200);
    } else {
      this.errorMessage = 'Please select advance date selection.';
      this.attendanceForm.patchValue({
        EmployeeType: 'None',
      })
      setTimeout(() => {
        this.hideloadingSpinner();
      }, 200);
    }
  }
  radioButtonTypeSelectionChange(event: any) {
    //this.dynamicEditable = 'emptype';
    this.clearFormFields();
    this.employeeSelectedType = event.value;
    this.attendancePeriod = this.formatDate(this.attendanceForm.get('AdvanceDate')?.value);
    this.branchCode = this.attendanceForm.get('BranchCode')?.value;
    this.StartPeriod = this.formatDate(this.firstOfMonth(new Date(this.attendancePeriod)));
    this.EndPeriod = this.formatDate(this.lastOfMonth(new Date(this.attendancePeriod)));
    if (this.branchCode != null && this.branchCode != 'NaN-NaN-NaN' && this.branchCode != '') {
      this.errorMessage = '';
      // this.getEmployeeListByEmployeeType(branchCode, event.value, dtStartPeriod,dtEndPeriod, 'All');
      this.getEmployeeListByEmployeeType(this.branchCode, this.attendanceForm.value.EmployeeType, this.StartPeriod, this.EndPeriod, 'Active');
    } else {
      this.errorMessage = 'Please select advance date and branch selection.';
      this.attendanceForm.patchValue({
        EmployeeType: 'None',
      })
    }
  }
  onEmployeeChange() {
    this.showLoadingSpinner = true;
    this.errorMessage = '';
    this.dynamicEditable = 'set';
    this.employeeSelectedType = this.attendanceForm.value.EmployeeType;
    // Reset attendanceID immediately so the Edit-mode button shows 'Create'
    // for a new employee, even before the async API call completes.
    this.attendanceID = 0;
    this.attendanceForm.patchValue({ ID: 0 });

    // Always recalculate dtAdvanceDate: if the user navigates back or reloads,
    // dtAdvanceDate may be stale or unset, so attendanceByEmployeeID must use the correct Period.
    const advDate = new Date(this.attendanceForm.value.AdvanceDate);
    this.dtAdvanceDate = this.formatDate(
      new Date(advDate.getFullYear(), advDate.getMonth() + 1, 0)
    );

    if (this.attendancePeriod != null && this.attendancePeriod != '') {
      this._payrollService.getEmployeeDetails(this.attendanceForm.value.BranchCode, this.attendanceForm.value.EmployeeNo).subscribe(
        (data) => {
          const employeeDetails = data[0];
          // Patch employee details
          this.attendanceForm.patchValue({
            EmployeeID: employeeDetails.EMP_ID,
            AadhaarPAN: (employeeDetails.AadhaarNumber || '') + (employeeDetails.PANNumber ? ' / ' + employeeDetails.PANNumber : ''),
            JoinDate: this.formatDisplayDate(employeeDetails.EMPPAY_DATE_JOINED) === '1970-01-01' ? '' : this.formatDisplayDate(employeeDetails.EMPPAY_DATE_JOINED),
            ResignedDate: this.formatDisplayDate(employeeDetails.EMPPAY_DATE_RESIGNED) === '1970-01-01' ? '' : this.formatDisplayDate(employeeDetails.EMPPAY_DATE_RESIGNED),
            IncomeTax: employeeDetails.INCOMETAXDETECT ? 'YES' : 'NO',
            PF: employeeDetails.PFDETECT ? 'YES' : 'NO',
            PFAccountNo: employeeDetails.PFAccountNumber,
            ESI: employeeDetails.ESIDETECT ? 'YES' : 'NO',
            UAN: employeeDetails.UANNumber,
            PaymentMode: employeeDetails.PAYMODE,
            BankName: employeeDetails.BankName,
            AccountNo: employeeDetails.AccountNumber,
            BasicPay: employeeDetails.EMPPAY_BASIC_RATE,
            Allowance: employeeDetails.ATTENDANCEALLOWANCE,
            SpecialAllowance: employeeDetails.SpecialAllowance,
            // Working Days Configuration
            AttendanceAllowanceFollowCalendar: employeeDetails.AttendanceAllowanceFollowCalendar,
            AttendanceAllowanceWorkingDays: employeeDetails.AttendanceAllowanceWorkingDays,
            WorkingDays: employeeDetails.WorkingDays,
            WorkingDaysAllowed: employeeDetails.AttendanceAllowanceWorkingDays || 0,
            Age: employeeDetails.EMP_DATE_OF_BIRTH ? this.calculateAge(employeeDetails.EMP_DATE_OF_BIRTH) : null,
          });

          // Fetch leave details and attendance details in parallel
          forkJoin({
            annualLeave: this._payrollService.getAnnualLeave(this.attendanceForm.value.EmployeeID, this.attendanceForm.value.AdvanceDate),
            medicalLeave: this._payrollService.getMedicalLeave(this.attendanceForm.value.EmployeeID, this.attendanceForm.value.AdvanceDate),
            maternityLeave: this._payrollService.getMaternityLeave(this.attendanceForm.value.EmployeeID, this.attendanceForm.value.AdvanceDate),
            paternityLeave: this._payrollService.getPaternityLeave(this.attendanceForm.value.EmployeeID, this.attendanceForm.value.AdvanceDate),
            hospitalizationLeave: this._payrollService.getHospitalizationLeave(this.attendanceForm.value.EmployeeID, this.attendanceForm.value.AdvanceDate),
            attendanceData: this._payrollService.attendanceByEmployeeID(this.dtAdvanceDate, this.attendanceForm.value.EmployeeID),
          }).subscribe(
            ({ annualLeave, medicalLeave, maternityLeave, paternityLeave, hospitalizationLeave, attendanceData }) => {
              // Patch leave details: display clamps negatives to 0 (so no "-1" is ever shown),
              // raw values are kept in leaveBalances for exact validation math below.
              this.leaveBalances = {
                Annual: annualLeave.LeaveRemaining,
                Medical: medicalLeave.LeaveRemaining,
                Maternity: maternityLeave.LeaveRemaining,
                Paternity: paternityLeave.LeaveRemaining,
                Hospitalization: hospitalizationLeave.LeaveRemaining,
              };
              this.attendanceForm.patchValue({
                Annual: Math.max(0, annualLeave.LeaveRemaining ?? 0),
                Medical: Math.max(0, medicalLeave.LeaveRemaining ?? 0),
                Maternity: Math.max(0, maternityLeave.LeaveRemaining ?? 0),
                Paternity: Math.max(0, paternityLeave.LeaveRemaining ?? 0),
                Hospitalization: Math.max(0, hospitalizationLeave.LeaveRemaining ?? 0),
              });

              // Calculate working days allowance dynamically
              this.calculateDynamicAllowance();

              let iNoOfDays = 0;
              let iStartDay = 1;

              const advanceDate = new Date(this.attendanceForm.value.AdvanceDate);
              this.dtAttendanceDate = new Date(this.attendanceForm.value.AdvanceDate);

              const today = new Date();
              const joinDate = new Date(this.attendanceForm.value.JoinDate);
              const resignDate = this.attendanceForm.value.ResignedDate
                ? new Date(this.attendanceForm.value.ResignedDate)
                : null;

              // Validate: Attendance period cannot be before employee's join date
              if (joinDate) {
                const attendanceMonthStart = new Date(advanceDate.getFullYear(), advanceDate.getMonth(), 1);
                const joinMonthStart = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);

                if (attendanceMonthStart < joinMonthStart) {
                  this.showMessage(
                    `Attendance not allowed before join date. Employee joined on ${joinDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
                    'warning',
                    'Warning Message'
                  );
                  this.getEmployeeListByEmployeeType(this.branchCode, this.attendanceForm.value.EmployeeType, this.StartPeriod, this.EndPeriod, 'Active');
                  this.clearFormFields();
                  this.hideloadingSpinner();
                  return;
                }
              }

              // Check if the AdvanceDate is in the current month and year
              if (advanceDate.getMonth() === today.getMonth() && advanceDate.getFullYear() === today.getFullYear()) {
                iNoOfDays = advanceDate.getDate();
              } else {
                iNoOfDays = this.getDaysInMonth(advanceDate.toString()); // Use utility function to get days in month
              }
              const attendanceDate = new Date(advanceDate.getFullYear(), advanceDate.getMonth(), 1);

              // Check if the employee has a resignation date
              if (resignDate) {
                const resignMonthStart = new Date(resignDate.getFullYear(), resignDate.getMonth(), 1);

                // Validate: Attendance period cannot be after employee's resignation month
                if (attendanceDate > resignMonthStart) {
                  this.showMessage(
                    `Attendance not allowed after resignation date. Employee resigned on ${resignDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
                    'warning',
                    'Warning Message'
                  );
                  this.getEmployeeListByEmployeeType(this.branchCode, this.attendanceForm.value.EmployeeType, this.StartPeriod, this.EndPeriod, 'Active');
                  this.clearFormFields();
                  this.hideloadingSpinner();
                  return;
                } else if (this.dtAttendanceDate.getMonth() === resignDate.getMonth() && this.dtAttendanceDate.getFullYear() === resignDate.getFullYear()) {
                  // Same month as resignation - limit days to resignation date
                  iNoOfDays = resignDate.getDate();
                }
              }

              // Check if the AdvanceDate is in the employee's joining month and year
              if (this.dtAttendanceDate.getMonth() === joinDate.getMonth() && this.dtAttendanceDate.getFullYear() === joinDate.getFullYear()) {
                iStartDay = joinDate.getDate();
              }

              // Handle attendance data
              if (attendanceData) {
                this.attendanceForm.patchValue({
                  ID: attendanceData.ID,
                  EmployeeID: attendanceData.EmployeeID,
                  BonusAmount: attendanceData.Bonus,
                  Shift2Type: attendanceData.Shift2Type === 1 ? '1' : attendanceData.Shift2Type === 2 ? '2' : '3',
                  Shift2Rate: attendanceData.Shift2Rate,
                  LastUpdatedBy: attendanceData.LastUpdatedBy,
                });
                if (this.employeeSelectedType === 'Guard') {
                  this.attendanceForm.patchValue({
                    AllowanceDeduction: attendanceData.AllowanceDeduction,
                    SpecialAllowanceDeduction: attendanceData.SpecialAllowanceDeduction
                  });
                } else {
                  this.attendanceForm.patchValue({
                    AllowanceDeductionStaff: attendanceData.AllowanceDeduction,
                    SpecialAllowanceDeductionStaff: attendanceData.SpecialAllowanceDeduction
                  });
                }
                this.attendanceID = attendanceData.ID;

                if (this.attendanceID > 0) {
                  forkJoin({
                    attendanceDetails: this._payrollService.attendanceDetailsByID(this.attendanceID),
                  }).subscribe(({ attendanceDetails }) => {
                    if (attendanceDetails) {
                      this.attendanceDetails = attendanceDetails;
                      attendanceDetails.forEach((oAttendanceDetails: any) => {
                        switch (oAttendanceDetails.Type) {
                          case 7:
                            this.iAbsent++;
                            break;
                          case 8:
                            this.iAnnualLeave++;
                            break;
                          case 9:
                            this.iMedicalLeave++;
                            break;
                          case 10:
                            this.iMaternityLeave++;
                            break;
                          case 11:
                            this.iPaternityLeave++;
                            break;
                          case 12:
                            this.iHospitalizationLeave++;
                            break;
                          default:
                            // Handle other types if needed
                            break;
                        }
                      });
                      this.updateFormFields(attendanceDetails, iNoOfDays, iStartDay);
                      this.hideloadingSpinner();

                    } else {
                      this.advanceDateError = '';
                      this.addFormFields(iNoOfDays, iStartDay);
                      this.hideloadingSpinner();
                    }
                  })
                }
              } else {
                this.advanceDateError = '';
                this.addFormFields(iNoOfDays, iStartDay);
                this.hideloadingSpinner();
              }
            },
            (error) => this.handleErrors(error)
          );
        },
        (error) => this.handleErrors(error)
      );

    } else {
      this.advanceDateError = 'AdvanceDate';
      this.attendanceForm.patchValue({
        EmployeeNo: ''
      });
      this.hideloadingSpinner();
    }

  }
  addFormFields(count: number, startDay: number = 1): void {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    formArray.clear();
    for (let i = startDay - 1; i < count; i++) {
      const currentDate = new Date();
      currentDate.setDate(startDay + i);

      formArray.push(this.fb.group({
        weekDay: this.getWeekday(currentDate.getDay()),
        dayField: [i + 1],
        ID: [0],
        AttendanceID: [0],
        AttendanceDate: [
          this.formatDate(
            new Date(
              this.attendanceForm.value.AdvanceDate.getFullYear(),
              this.attendanceForm.value.AdvanceDate.getMonth(),
              startDay + i
            )
          ),
        ],
        Client: [''],
        Type: ['General Working'],
        TimeStart: [null],
        TimeEnd: [null],
        StartTime: [''],
        EndTime: [''],
        Hours: [''],
        OTClient: [''],
        OTTimeStart: [null],
        OTTimeEnd: [null],
        StartTimeOT: [''],
        EndTimeOT: [''],
        Shift2Hours: [''],
        LastUpdate: [this.formatDate(new Date())],
        LastUpdatedBy: [this.currentUser],
      }));
    }
  }
  updateFormFields(data: any, iNoOfDays: number, iStartDay: number): void {
    this.showLoadingSpinner = true;
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    formArray.clear();

    for (let i = iStartDay - 1; i < iNoOfDays; i++) {
      const currentDate = new Date(
        this.attendanceForm.value.AdvanceDate.getFullYear(),
        this.attendanceForm.value.AdvanceDate.getMonth(),
        i + 1
      );

      const matchingRecord = data.find((record: any) => {
        const recordDate = new Date(record.AttendanceDate);
        return recordDate.getDate() === currentDate.getDate() &&
          recordDate.getMonth() === currentDate.getMonth() &&
          recordDate.getFullYear() === currentDate.getFullYear();
      });

      formArray.push(this.fb.group({
        weekDay: this.getWeekday(currentDate.getDay()),
        dayField: [i + 1],
        ID: [matchingRecord?.ID || 0],
        AttendanceID: [matchingRecord?.AttendanceID || 0],
        AttendanceDate: [this.formatDate(currentDate)],
        Client: [matchingRecord?.Client || ''],
        Type: [this.getWorkType(matchingRecord?.Type || '')],
        TimeStart: [matchingRecord?.TimeStart || null],
        TimeEnd: [matchingRecord?.TimeEnd || null],
        StartTime: [
          this.getDayOfWeek(matchingRecord?.TimeStart) === 0 ? '' : this.getDayOfWeek(matchingRecord?.TimeStart),
        ],
        EndTime: [
          this.getDayOfWeek(matchingRecord?.TimeEnd) === 0 ? '' : this.getDayOfWeek(matchingRecord?.TimeEnd),
        ],
        Hours: [
          this.getDayOfHoursEdited(matchingRecord?.TimeStart, matchingRecord?.TimeEnd) === 0
            ? ''
            : this.getDayOfHoursEdited(matchingRecord?.TimeStart, matchingRecord?.TimeEnd),
        ],
        OTClient: [matchingRecord?.OTClient || ''],
        OTTimeStart: [matchingRecord?.OTTimeStart || null],
        OTTimeEnd: [matchingRecord?.OTTimeEnd || null],
        StartTimeOT: [
          this.getDayOfWeek(matchingRecord?.OTTimeStart) === 0
            ? ''
            : this.getDayOfWeek(matchingRecord?.OTTimeStart),
        ],
        EndTimeOT: [
          this.getDayOfWeek(matchingRecord?.OTTimeEnd) === 0 ? '' : this.getDayOfWeek(matchingRecord?.OTTimeEnd),
        ],
        Shift2Hours: [
          this.getDayOfHoursEdited(matchingRecord?.OTTimeStart, matchingRecord?.OTTimeEnd) === 0
            ? ''
            : this.getDayOfHoursEdited(matchingRecord?.OTTimeStart, matchingRecord?.OTTimeEnd),
        ],
        LastUpdate: [this.formatDate(new Date(matchingRecord?.LastUpdate)) || ''],
        LastUpdatedBy: [matchingRecord?.LastUpdatedBy || this.currentUser],
      }));
    }

    this.hideloadingSpinner();
  }

  addStaffFormFields(count: number, startDay: number = 1): void {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    formArray.clear();

    for (let i = startDay - 1; i < count; i++) {
      const currentDate = new Date();
      currentDate.setDate(startDay + i);

      const weekDayIndex = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const weekDayName = this.getWeekday(weekDayIndex);

      let type = 'General Working';
      let hours = '8'; // default for MondayΓÇôFriday

      if (weekDayIndex === 0) { // Sunday
        type = 'Off Day';
        hours = '0';
      } else if (weekDayIndex === 6) { // Saturday
        type = 'General Working';
        hours = '4';
      }

      formArray.push(this.fb.group({
        weekDay: weekDayName,
        dayField: [i + 1],
        ID: [0],
        AttendanceID: [0],
        AttendanceDate: [
          this.formatDate(
            new Date(
              this.attendanceForm.value.AdvanceDate.getFullYear(),
              this.attendanceForm.value.AdvanceDate.getMonth(),
              startDay + i
            )
          ),
        ],
        Client: [''],
        Type: [type],
        TimeStart: [null],
        TimeEnd: [null],
        StartTime: [''],
        EndTime: [''],
        Hours: [hours],
        OTClient: [''],
        OTTimeStart: [null],
        OTTimeEnd: [null],
        StartTimeOT: [''],
        EndTimeOT: [''],
        Shift2Hours: [''],
        LastUpdate: [this.formatDate(new Date())],
        LastUpdatedBy: [this.currentUser],
      }));
      this.hoursTimeChange(i, hours)
    }
  }

  updateStaffFormFields(data: any, iNoOfDays: number, iStartDay: number): void {
    this.showLoadingSpinner = true;
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    formArray.clear();

    for (let i = iStartDay - 1; i < iNoOfDays; i++) {
      const currentDate = new Date(
        this.attendanceForm.value.AdvanceDate.getFullYear(),
        this.attendanceForm.value.AdvanceDate.getMonth(),
        i + 1
      );

      const weekDayIndex = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const weekDayName = this.getWeekday(weekDayIndex);

      let type = 'General Working';
      let hours = '8'; // default for MondayΓÇôFriday

      if (weekDayIndex === 0) { // Sunday
        type = 'Off Day';
        hours = '0';
      } else if (weekDayIndex === 6) { // Saturday
        type = 'General Working';
        hours = '4';
      }

      const matchingRecord = data.find((record: any) => {
        const recordDate = new Date(record.AttendanceDate);
        return recordDate.getDate() === currentDate.getDate() &&
          recordDate.getMonth() === currentDate.getMonth() &&
          recordDate.getFullYear() === currentDate.getFullYear();
      });

      formArray.push(this.fb.group({
        weekDay: this.getWeekday(currentDate.getDay()),
        dayField: [i + 1],
        ID: [matchingRecord?.ID || 0],
        AttendanceID: [matchingRecord?.AttendanceID || 0],
        AttendanceDate: [this.formatDate(currentDate)],
        Client: [matchingRecord?.Client || ''],
        Type: [type],
        TimeStart: [matchingRecord?.TimeStart || null],
        TimeEnd: [matchingRecord?.TimeEnd || null],
        StartTime: [
          this.getDayOfWeek(matchingRecord?.TimeStart) === 0 ? '' : this.getDayOfWeek(matchingRecord?.TimeStart),
        ],
        EndTime: [
          this.getDayOfWeek(matchingRecord?.TimeEnd) === 0 ? '' : this.getDayOfWeek(matchingRecord?.TimeEnd),
        ],
        Hours: [hours],
        OTClient: [''],
        OTTimeStart: [null],
        OTTimeEnd: [null],
        StartTimeOT: [''],
        EndTimeOT: [''],
        Shift2Hours: [''],
        LastUpdate: [this.formatDate(new Date(matchingRecord?.LastUpdate)) || ''],
        LastUpdatedBy: [matchingRecord?.LastUpdatedBy || this.currentUser],
      }));
      this.hoursTimeChange(i, hours)
    }
    this.hideloadingSpinner();
  }
  normalValues1Change(event: any) {
    this.normalValue1Change = event.value == '' ? '0' : event.value;
  }
  normalValues2Change(event: any) {
    this.normalValue2Change = event.value == '' ? '0' : event.value;
  }
  shift2Values1Change(event: any) {
    this.shiftValues1Change = event.value == '' ? '0' : event.value;
  }
  shift2Values2Change(event: any) {
    this.shiftValues2Change = event.value == '' ? '0' : event.value;
  }
  clientNameChange(event: any) {
    this.ClientName = event.value == '' ? '0' : event.value;
  }
  Shift2ClientChange(event: any) {
    this.Shift2Client = event.value == '' ? '0' : event.value;
  }

  getClients(advanceDate: string, branchCode: string): void {
    console.log('getClients called with:', { advanceDate, branchCode });
    // TEMPORARY: Using GetClientsByBranchOnly to get clients by barcode (branch) without agreement filter
    this.httpClient.get<any>(this.apiUrl + 'payroll/GetClientsByBranchOnly', {
      params: { branchCode: branchCode }
    }).subscribe(
      (data: any) => {
        console.log('getClients API response:', data);
        // Handle both wrapped (data.Value) and direct array responses
        const clients = data?.Value || data || [];
        console.log('Processed clients:', clients);
        // Prepend an empty option to the list
        this.employeeModel = [{ Name: '' }, ...clients] as any;
        console.log('employeeModel after update:', this.employeeModel);
        this.hideloadingSpinner();
      },
      (error: any) => {
        console.error('getClients API error:', error);
        // Set empty array on error to prevent undefined errors in template
        this.employeeModel = [{ Name: '' }] as any;
        this.handleErrors(error?.message || error?.error || 'Failed to load clients');
      }
    );
  }
  onEmployeeSearchInput(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.employeeSearchText = value;
    if (!value) {
      this.filteredEmployeeList = [...this.employeeListModel];
    } else {
      this.filteredEmployeeList = this.employeeListModel.filter(e =>
        e.EMP_NAME?.toLowerCase().includes(value) ||
        e.EMP_CODE?.toLowerCase().includes(value)
      );
    }
  }

  onEmployeeSearchFocus() {
    if (!this.employeeSearchText) {
      this.filteredEmployeeList = [...this.employeeListModel];
    }
  }

  onEmployeeSelected(event: any) {
    const emp = event.option.value;
    this.attendanceForm.patchValue({ EmployeeNo: emp.EMP_CODE, EmployeeID: emp.EMP_ID || emp.ID });
    this.employeeSearchCtrl.setValue(emp.EMP_NAME);
    this.employeeSearchText = '';
    this.onEmployeeChange();
  }

  displayEmployeeName(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.EMP_NAME || '';
  }

  clearEmployeeSelection() {
    this.attendanceForm.patchValue({ EmployeeNo: '', EmployeeID: '' });
    this.employeeSearchCtrl.setValue('');
    this.employeeSearchText = '';
    this.filteredEmployeeList = [...this.employeeListModel];
  }

  getEmployeeListByEmployeeType(branchCode: string, employeeType: string, startPeriod: string, endPeriod: string, status: string): void {
    this.showLoadingSpinner = true;
    forkJoin({
      employeeList: this._payrollService.getListByEmployee(branchCode, employeeType, startPeriod, endPeriod, status),
      salaryProcessStatus: this._payrollService.getIsSalaryProcessDoneForCurrentPeriod(branchCode, employeeType, this.dtAdvanceDate),
      nameList: this._payrollService.getEmployeeAttendanceList(this.dtAdvanceDate, branchCode)
    }).subscribe(
      ({ employeeList, salaryProcessStatus, nameList }) => {
        // Handle successful response
        this.employeeListModel = employeeList;
        this.filteredEmployeeList = [...employeeList];
        this.salaryProcessStatus = salaryProcessStatus;
        this.nameList = nameList;
        this.hideloadingSpinner();
      },
      (error) => this.handleErrors(error) // Handle errors
    );
  }

  // Function to check if EMP_CODE is in nameList
  isEmployeeInNameList(empCode: string): boolean {
    return this.nameList && this.nameList.includes(empCode);
  }

  isEmployeeProcessList(empCode: string): boolean {
    if (!this.salaryProcessStatus) {
      return false; // Return false if salary process isn't done.
    }

    let status = false;

    this.temporaryEmployeeStatus$.pipe(take(1)).subscribe((cache) => {
      if (cache.has(empCode)) {
        // If empCode is in cache, return the cached value.
        status = cache.get(empCode)!;
      } else if (this.inProgressRequests.has(empCode)) {
        // If a request is already in progress for this empCode, subscribe to it.
        this.inProgressRequests.get(empCode)!.subscribe((isTemporary) => {
          status = isTemporary;
        });
      } else {
        // Otherwise, make a new API call.
        const request$ = this._payrollService.getIsTemporaryEmployee(empCode).pipe(
          tap((isTemporary) => {
            // Update the cache with the API response.
            const updatedCache = new Map(cache);
            updatedCache.set(empCode, isTemporary);
            this.temporaryEmployeeStatus$.next(updatedCache);

            // Remove the completed request from the in-progress map.
            this.inProgressRequests.delete(empCode);
          }),
          finalize(() => {
            // Ensure cleanup in case of errors or completion.
            this.inProgressRequests.delete(empCode);
          }),
          shareReplay(1) // Ensure the same Observable is shared among all subscribers.
        );

        // Add the new request to the in-progress map.
        this.inProgressRequests.set(empCode, request$);

        // Subscribe to the API call to trigger it.
        request$.subscribe((isTemporary) => {
          status = isTemporary;
        });
      }
    });

    return status;
  }

  getEmployeeMasterList(): void {
    this._payrollService.getEmployeeList().subscribe(
      (data) => {
        this.employeeModel = data;
      },
      (error) => this.handleErrors(error)
    );
  }
  createForm() {
    this.dynamicForm = this.fb.group({
      formArray: this.fb.array([])
    });
    this.attendanceForm.patchValue({
      AadhaarPAN: '',
      PF: '',
      PFAccountNo: '',
      ESI: '',
      UAN: '',
      BasicPay: '',
      Allowance: '',
      SpecialAllowance: '',
      Annual: '',
      Medical: '',
      Maternity: '',
      Paternity: '',
      Hospitalization: '',
    });
  }
  get formArray() {
    return (this.dynamicForm.get('formArray') as FormArray).controls;
  }
  clearFormFields() {
    this.attendanceForm.patchValue({
      ID: 0,
      EmployeeID: '',
      ClientName: '',
      EmployeeNo: '',
      StartTime: '',
      EndTime: '',
      Hours: '',
      Shif2Client: '',
      Shift2StartTime: '',
      Shift2EndTime: '',
      Shift2Hours: '',
      AadhaarPAN: '',
      Age: '',
      JoinDate: '',
      ResignedDate: '',
      IncomeTax: '',
      PF: '',
      PFAccountNo: '',
      ESI: '',
      UAN: '',
      PaymentMode: '',
      SalaryStructure: '',
      SalarySlab: '',
      BasicPay: '',
      Annual: '',
      Medical: '',
      Maternity: '',
      Paternity: '',
      Hospitalization: '',
      BonusAmount: 0.00,
      Shift2Type: '3',  // Default value
      Shift2Rate: 0.00,
      Allowance: '',
      SpecialAllowance: '',
      AllowanceDeduction: 0.00,
      SpecialAllowanceDeduction: 0.00,
      LastUpdate: this.formatDate(new Date),
      LastUpdatedBy: '',
    });

    //this.employeeListModel = [];
    this.employeeSearchCtrl.setValue('');

    const formArray = this.dynamicForm.get('formArray') as FormArray;
    formArray.clear();

    this.shift2StartTimeValidation = null
    this.shift2EndTimeValidation = null
    this.shift2HoursValidation = null

  }
  getBranchMasterList() {
    this._masterService.getBranchMaster('null').subscribe((responseData) => {
      if (responseData != null) {
        this.branchModel = responseData
      }
    },
      (error) => this.handleErrors(error)
    );
  }
  getBranchMasterListByUser(userName: string) {
    forkJoin({
      branchList: this._masterService.GetBranchListByUserName(userName)
    }).subscribe(
      ({ branchList }) => {
        this.branchModel = branchList;
      },
      (error) => {
        this.handleErrors(error);
      }
    );
  }
  getDayOfWeek(dateTime: any): any {
    if (dateTime != null) {
      const dateTime1 = new Date(dateTime);
      // Check if the conversion was successful
      if (!isNaN(dateTime1.getTime())) {
        return dateTime1.getHours();
      }
    }
    return '';
  }
  getWorkType(type: number): string {

    if (type == 1) {
      this.workType = 'General Working';
    }
    if (type == 2) {
      this.workType = 'Off Day';
    }
    if (type == 3) {
      this.workType = 'Off Day Working Working';
    }
    if (type == 4) {
      this.workType = 'Holiday';
    }
    if (type == 5) {
      this.workType = 'Holiday Working';
    }
    if (type == 6) {
      this.workType = 'Unpaid Leave';
    }
    if (type == 7) {
      this.workType = 'Absent';
    }
    if (type == 8) {
      this.workType = 'Annual Leave';
      const type = 'Annual Leave';
    }
    if (type == 9) {
      this.workType = 'Medical Leave';
    }
    if (type == 10) {
      this.workType = 'Maternity Leave';
    }
    if (type == 11) {
      this.workType = 'Paternity Leave';
    }
    if (type == 12) {
      this.workType = 'Hospitalization Leave';
    }
    if (type == 13) {
      this.workType = 'Socso';
    }
    if (type == 14) {
      this.workType = 'Non Schedule Off';
    }
    if (type == 15) {
      this.workType = 'Replacement Leave';
    }
    if (type == 16) {
      this.workType = 'Compensanate Leave';
    }
    if (type == 17) {
      this.workType = 'Marriage Leave';
    }
    return this.workType;
  }
  getWorkTypeByName(typeName: string): number {
    if (typeName == 'General Working') {
      this.workTypeId = 1;
    }
    if (typeName == 'Off Day') {
      this.workTypeId = 2;
    }
    if (typeName == 'Off Day Working Working') {
      this.workTypeId = 3;
    }
    if (typeName == 'Holiday') {
      this.workTypeId = 4;
    }
    if (typeName == 'Holiday Working') {
      this.workTypeId = 5;
    }
    if (typeName == 'Unpaid Leave') {
      this.workTypeId = 6;
    }
    if (typeName == 'Absent') {
      this.workTypeId = 7;
    }
    if (typeName == 'Annual Leave') {
      this.workTypeId = 8;
    }
    if (typeName == 'Medical Leave') {
      this.workTypeId = 9;
    }
    if (typeName == 'Maternity Leave') {
      this.workTypeId = 10;
    }
    if (typeName == 'Paternity Leave') {
      this.workTypeId = 11;
    }
    if (typeName == 'Hospitalization Leave') {
      this.workTypeId = 12;
    }
    if (typeName == 'Socso') {
      this.workTypeId = 13;
    }
    if (typeName == 'Non Schedule Off') {
      this.workTypeId = 14;
    }
    if (typeName == 'Replacement Leave') {
      this.workTypeId = 15;
    }
    if (typeName == 'Compensanate Leave') {
      this.workTypeId = 16;
    }
    if (typeName == 'Marriage Leave') {
      this.workTypeId = 17;
    }
    return this.workTypeId;
  }
  applyIncrementByType(type: number): void {
    switch (type) {
      case 7:
        this.iAbsent++;
        break;
      case 8:
        this.iAnnualLeave++;
        break;
      case 9:
        this.iMedicalLeave++;
        break;
      case 10:
        this.iMaternityLeave++;
        break;
      case 11:
        this.iPaternityLeave++;
        break;
      case 12:
        this.iHospitalizationLeave++;
        break;
      default:
        // No action needed
        break;
    }
  }
  getWeekday(dayIndex: number): string {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[dayIndex];
  }
  calculateAge(birthdate: Date) {
    this._payrollService.calculateAge(birthdate).subscribe(
      (age) => {
        this.attendanceForm.patchValue({
          Age: age,
        });
      },
      (error) => this.handleErrors(error)
    );
  }
  setButtonClick(): void {
    this.dynamicEditable = 'set';
    this.assignSetButtonValues();
  }
  setStaffButtonClick(): void {
    this.dynamicEditable = 'set';
    let iNoOfDays = 0;
    let iStartDay = 1;

    const advanceDate = new Date(this.attendanceForm.value.AdvanceDate);
    const today = new Date();
    const joinDate = this.attendanceForm.value.JoinDate ? new Date(this.attendanceForm.value.JoinDate) : null;
    const resignDate = this.attendanceForm.value.ResignedDate ? new Date(this.attendanceForm.value.ResignedDate) : null;

    // Check if the AdvanceDate is in the current month and year
    if (advanceDate.getMonth() === today.getMonth() && advanceDate.getFullYear() === today.getFullYear()) {
      iNoOfDays = advanceDate.getDate();
    } else {
      iNoOfDays = this.getDaysInMonth(advanceDate.toString()); // Use utility function to get days in month
    }

    // Check if the employee has a resignation date
    if (resignDate) {
      const attendanceDate = new Date(advanceDate.getFullYear(), advanceDate.getMonth(), 1);
      if (attendanceDate > resignDate) {
        this.showMessage(`Employee has resigned on ${resignDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 'warning', 'Warning Message');
        this.getEmployeeListByEmployeeType(this.branchCode, this.attendanceForm.value.EmployeeType, this.StartPeriod, this.EndPeriod, 'Active');
        this.clearFormFields();
        this.hideloadingSpinner();
        return;
      } else if (advanceDate.getMonth() === resignDate.getMonth() && advanceDate.getFullYear() === resignDate.getFullYear()) {
        iNoOfDays = resignDate.getDate();
      }
    }

    // Check if the AdvanceDate is in the employee's joining month and year
    if (joinDate && advanceDate.getMonth() === joinDate.getMonth() && advanceDate.getFullYear() === joinDate.getFullYear()) {
      iStartDay = joinDate.getDate();
    }

    if (this.attendanceDetails.length > 0) {
      this.updateStaffFormFields(this.attendanceDetails, iNoOfDays, iStartDay);
    } else {
      this.addStaffFormFields(iNoOfDays, iStartDay);
    }
  }
  editButtonClick(): void {
    this.dynamicEditable = 'edit';
    this.selectedWorkType = '1';
    if (this.employeeSelectedType == 'Guard') {
      this.assignEditedButtonValues();
    } else {
      this.assignEditedStaffButtonValues()
    }

  }
  updateButtonClick(): void {
    this.dynamicEditable = 'set';
    this.assignUpdatedButtonValues();
  }
  updateStaffButtonClick(): void {
    this.dynamicEditable = 'set';
    this.assignStaffUpdatedButtonValues();
  }
  clearButtonClick(): void {
    this.dynamicEditable = 'set';
    this.clearFormFields();
  }
  clearEditButtonClick(): void {
    this.dynamicEditable = 'set';

    const formArray = this.dynamicForm.get('formArray') as FormArray;
    formArray.clear();

    this.shift2StartTimeValidation = null
    this.shift2EndTimeValidation = null
    this.shift2HoursValidation = null

    this.onEmployeeChange();
  }
  assignSetButtonValues() {
    let formArray = this.dynamicForm.get('formArray') as FormArray;

    for (let i = 0; i < formArray.length; i++) {
      const control = formArray.at(i) as FormGroup;
      const formArrayItem = this.dynamicForm.value.formArray[i];
      const attendanceForm = this.attendanceForm.value;

      // Extract common values
      const { StartTime, EndTime, Shift2StartTime, Shift2EndTime, Shif2Client, ClientName } = attendanceForm;

      // Compute dynamic values
      const dynamicStartTime = this.normalValue1Change === '0' ? '' : formArrayItem.StartTime;
      const dynamicEndTime = this.normalValue2Change === '0' ? '' : formArrayItem.EndTime;
      const dynamicShift2StartTime = this.shiftValues1Change === '0' ? '' : formArrayItem.Shift2StartTime;
      const dynamicShift2EndTime = this.shiftValues2Change === '0' ? '' : formArrayItem.Shift2EndTime;
      // Patch common values
      control.get('Type')?.patchValue(formArrayItem.Type, { emitEvent: false });
      control.get('Client')?.patchValue(ClientName, { emitEvent: false });
      control.get('StartTime')?.patchValue(this.getEffectiveValue(StartTime, dynamicStartTime), { emitEvent: false });
      control.get('EndTime')?.patchValue(this.getEffectiveValue(EndTime, dynamicEndTime), { emitEvent: false });
      control.get('Hours')?.patchValue(this.getComputedHours(StartTime, EndTime, dynamicStartTime, dynamicEndTime), { emitEvent: false });
      control.get('OTClient')?.patchValue(Shif2Client, { emitEvent: false });
      control.get('StartTimeOT')?.patchValue(this.getEffectiveValue(Shift2StartTime, dynamicShift2StartTime), { emitEvent: false });
      control.get('EndTimeOT')?.patchValue(this.getEffectiveValue(Shift2EndTime, dynamicShift2EndTime), { emitEvent: false });
      control.get('Shift2Hours')?.patchValue(this.getComputedHours(Shift2StartTime, Shift2EndTime, dynamicShift2StartTime, dynamicShift2EndTime), { emitEvent: false });

      // Patch formatted time values
      control.get('TimeStart')?.patchValue(this.formatDate(this.assignTimeStartValue(StartTime, i + 1)), { emitEvent: false });
      control.get('TimeEnd')?.patchValue(this.formatDate(this.assignTimeEndValue(EndTime, i + 1)), { emitEvent: false });
      control.get('OTTimeStart')?.patchValue(this.formatDate(this.assignOTTimeStartValue(Shift2StartTime, i + 1)), { emitEvent: false });
      control.get('OTTimeEnd')?.patchValue(this.formatDate(this.assignOTTimeEndValue(Shift2EndTime, i + 1)), { emitEvent: false });
    }
  }
  assignEditedButtonValues() {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    for (let i = 0; i < formArray.length; i++) {
      const control = formArray.at(i) as FormGroup
      control.get('Type')?.patchValue(this.getWorkTypeByName(this.dynamicForm.value.formArray[i].Type), { emitEvent: false });
      control.get('Client')?.patchValue(this.dynamicForm.value.formArray[i].Client, { emitEvent: false });
      control.get('StartTime')?.patchValue(this.dynamicForm.value.formArray[i].StartTime == 0 ? '' : this.dynamicForm.value.formArray[i].StartTime, { emitEvent: false });
      control.get('EndTime')?.patchValue(this.dynamicForm.value.formArray[i].EndTime == 0 ? '' : this.dynamicForm.value.formArray[i].EndTime, { emitEvent: false });
      control.get('Hours')?.patchValue(this.getDayOfHours(this.dynamicForm.value.formArray[i].StartTime, this.dynamicForm.value.formArray[i].EndTime), { emitEvent: false });
      control.get('OTClient')?.patchValue(this.dynamicForm.value.formArray[i].OTClient, { emitEvent: false });
      control.get('StartTimeOT')?.patchValue(this.dynamicForm.value.formArray[i].StartTimeOT == 0 ? '' : this.dynamicForm.value.formArray[i].StartTimeOT, { emitEvent: false });
      control.get('EndTimeOT')?.patchValue(this.dynamicForm.value.formArray[i].EndTimeOT == 0 ? '' : this.dynamicForm.value.formArray[i].EndTimeOT, { emitEvent: false });
      control.get('Shift2Hours')?.patchValue(this.getDayOfHours(this.dynamicForm.value.formArray[i].StartTimeOT, this.dynamicForm.value.formArray[i].EndTimeOT), { emitEvent: false });
      control.get('TimeStart')?.patchValue(this.formatDate(this.assignTimeStartValue(this.dynamicForm.value.formArray[i].StartTime, i + 1)), { emitEvent: false });
      control.get('TimeEnd')?.patchValue(this.formatDate(this.assignTimeEndValue(this.dynamicForm.value.formArray[i].EndTime, i + 1)), { emitEvent: false });
      control.get('OTTimeStart')?.patchValue(this.formatDate(this.assignOTTimeStartValue(this.dynamicForm.value.formArray[i].StartTimeOT, i + 1)), { emitEvent: false });
      control.get('OTTimeEnd')?.patchValue(this.formatDate(this.assignOTTimeEndValue(this.dynamicForm.value.formArray[i].EndTimeOT, i + 1)), { emitEvent: false });
    }
  }
  assignEditedStaffButtonValues() {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    for (let i = 0; i < formArray.length; i++) {
      const control = formArray.at(i) as FormGroup
      control.get('Type')?.patchValue(this.getWorkTypeByName(this.dynamicForm.value.formArray[i].Type), { emitEvent: false });
      control.get('Client')?.patchValue(this.dynamicForm.value.formArray[i].Client, { emitEvent: false });
      control.get('StartTime')?.patchValue(this.dynamicForm.value.formArray[i].StartTime == 0 ? '' : this.dynamicForm.value.formArray[i].StartTime, { emitEvent: false });
      control.get('EndTime')?.patchValue(this.dynamicForm.value.formArray[i].EndTime == 0 ? '' : this.dynamicForm.value.formArray[i].EndTime, { emitEvent: false });
      control.get('Hours')?.patchValue(this.getDayOfHours(this.dynamicForm.value.formArray[i].StartTime, this.dynamicForm.value.formArray[i].EndTime), { emitEvent: false });
      control.get('OTClient')?.patchValue('', { emitEvent: false });
      control.get('StartTimeOT')?.patchValue('', { emitEvent: false });
      control.get('EndTimeOT')?.patchValue('', { emitEvent: false });
      control.get('Shift2Hours')?.patchValue('', { emitEvent: false });
      control.get('TimeStart')?.patchValue(this.formatDate(this.assignTimeStartValue(this.dynamicForm.value.formArray[i].StartTime, i + 1)), { emitEvent: false });
      control.get('TimeEnd')?.patchValue(this.formatDate(this.assignTimeEndValue(this.dynamicForm.value.formArray[i].EndTime, i + 1)), { emitEvent: false });
      control.get('OTTimeStart')?.patchValue(null, { emitEvent: false });
      control.get('OTTimeEnd')?.patchValue(null, { emitEvent: false });
      control.get('LastUpdate')?.patchValue(this.formatDate(new Date()), { emitEvent: false });
    }
  }
  assignStaffUpdatedButtonValues() {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    for (let i = 0; i < formArray.length; i++) {
      const control = formArray.at(i) as FormGroup
      control.get('Type')?.patchValue(this.getWorkType(this.dynamicForm.value.formArray[i].Type), { emitEvent: false });
      control.get('Client')?.patchValue(this.dynamicForm.value.formArray[i].Client, { emitEvent: false });
      control.get('StartTime')?.patchValue(this.dynamicForm.value.formArray[i].StartTime == 0 ? '' : this.dynamicForm.value.formArray[i].StartTime, { emitEvent: false });
      control.get('EndTime')?.patchValue(this.dynamicForm.value.formArray[i].EndTime == 0 ? '' : this.dynamicForm.value.formArray[i].EndTime, { emitEvent: false });
      control.get('Hours')?.patchValue(this.dynamicForm.value.formArray[i].Hours, { emitEvent: false });
      control.get('OTClient')?.patchValue('', { emitEvent: false });
      control.get('StartTimeOT')?.patchValue('', { emitEvent: false });
      control.get('EndTimeOT')?.patchValue('', { emitEvent: false });
      control.get('Shift2Hours')?.patchValue('', { emitEvent: false });
      control.get('TimeStart')?.patchValue(this.formatDate(this.dynamicForm.value.formArray[i].TimeStart), { emitEvent: false });
      control.get('TimeEnd')?.patchValue(this.formatDate(this.dynamicForm.value.formArray[i].TimeEnd), { emitEvent: false });
      control.get('OTTimeStart')?.patchValue(null, { emitEvent: false });
      control.get('OTTimeEnd')?.patchValue(null, { emitEvent: false });
    }
  }

  assignUpdatedButtonValues() {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    for (let i = 0; i < formArray.length; i++) {
      const control = formArray.at(i) as FormGroup
      control.get('Type')?.patchValue(this.getWorkType(this.dynamicForm.value.formArray[i].Type), { emitEvent: false });
      control.get('Client')?.patchValue(this.dynamicForm.value.formArray[i].Client || '', { emitEvent: false });
      control.get('StartTime')?.patchValue(this.dynamicForm.value.formArray[i].StartTime == 0 ? '' : this.dynamicForm.value.formArray[i].StartTime, { emitEvent: false });
      control.get('EndTime')?.patchValue(this.dynamicForm.value.formArray[i].EndTime == 0 ? '' : this.dynamicForm.value.formArray[i].EndTime, { emitEvent: false });
      control.get('Hours')?.patchValue(this.getDayOfHours(this.dynamicForm.value.formArray[i].StartTime, this.dynamicForm.value.formArray[i].EndTime,), { emitEvent: false });
      control.get('OTClient')?.patchValue(this.dynamicForm.value.formArray[i].OTClient || '', { emitEvent: false });
      control.get('StartTimeOT')?.patchValue(this.dynamicForm.value.formArray[i].StartTimeOT == 0 ? '' : this.dynamicForm.value.formArray[i].StartTimeOT, { emitEvent: false });
      control.get('EndTimeOT')?.patchValue(this.dynamicForm.value.formArray[i].EndTimeOT == 0 ? '' : this.dynamicForm.value.formArray[i].EndTimeOT, { emitEvent: false });
      control.get('Shift2Hours')?.patchValue(this.getDayOfHours(this.dynamicForm.value.formArray[i].StartTimeOT, this.dynamicForm.value.formArray[i].EndTimeOT), { emitEvent: false });
      control.get('TimeStart')?.patchValue(this.formatDate(this.assignTimeStartValue(this.dynamicForm.value.formArray[i].StartTime, i + 1)), { emitEvent: false });
      control.get('TimeEnd')?.patchValue(this.formatDate(this.assignTimeEndValue(this.dynamicForm.value.formArray[i].EndTime, i + 1)), { emitEvent: false });
      control.get('OTTimeStart')?.patchValue(this.formatDate(this.assignOTTimeStartValue(this.dynamicForm.value.formArray[i].StartTimeOT, i + 1)), { emitEvent: false });
      control.get('OTTimeEnd')?.patchValue(this.formatDate(this.assignOTTimeEndValue(this.dynamicForm.value.formArray[i].EndTimeOT, i + 1)), { emitEvent: false });
    }
  }
  normalTimeChange(indexValue: number) {
    this.subscribeToStartEndTimeChanges(indexValue);
  }
  shift2STimeChange(indexValue: number) {
    this.subscribeToShift2StartEndTimeChanges(indexValue);
  }
  hoursTimeChange(indexValue: number, eventOrValue: Event | string | number) {
    let numericValue: number;

    if (eventOrValue instanceof Event) {
      const inputElement = eventOrValue.target as HTMLInputElement;
      numericValue = parseFloat(inputElement.value);
    } else if (typeof eventOrValue === 'string') {
      numericValue = parseFloat(eventOrValue);
    } else {
      numericValue = eventOrValue;
    }
    this.subscribeToStartEndTimeHoursChanges(indexValue, numericValue);
  }
  subscribeToStartEndTimeChanges(indexValue: number) {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    const subscription = formArray.valueChanges.subscribe((values) => {
      values.forEach((value: any, index: any) => {
        if (indexValue == index) {
          if (value.StartTime != undefined && value.StartTime != '' && value.StartTime != null &&
            value.EndTime != undefined && value.EndTime != '' && value.EndTime != null
          ) {
            this.startTime = this.addLeadingZero(value.StartTime);
            this.endTime = this.addLeadingZero(value.EndTime);
            if (this.startTime != null) {
              const newDate = new Date(
                this.attendanceForm.value.AdvanceDate.getFullYear(),
                this.attendanceForm.value.AdvanceDate.getMonth(),
                value.dayField
              );
              newDate.setHours(newDate.getHours() + this.startTime);
              const formattedDate = newDate;
              formArray.at(index).get('TimeStart')?.patchValue(formattedDate, { emitEvent: false });
            }
            if (this.endTime != null) {
              const newDate = new Date(
                this.attendanceForm.value.AdvanceDate.getFullYear(),
                this.attendanceForm.value.AdvanceDate.getMonth(),
                value.dayField
              );
              newDate.setHours(newDate.getHours() + this.endTime);
              const formattedDate = newDate;
              formArray.at(index).get('TimeEnd')?.patchValue(formattedDate, { emitEvent: false });
            }
            if (this.startTime != null && this.endTime != null &&
              this.startTime != 0 && this.endTime != 0) {
              if (this.startTime < this.endTime) {
                this.finalHours = this.endTime - this.startTime;
              } else if (this.startTime == this.endTime && this.startTime != 0 && this.endTime != 0) {
                this.finalHours = 24;
              } else if (this.startTime > this.endTime) {
                const hour = this.startTime - this.endTime;
                this.finalHours = 24 - hour;
              }
              formArray.at(index).get('Hours')?.patchValue(this.finalHours, { emitEvent: false });
            } else {
              formArray.at(index).get('Hours')?.patchValue('', { emitEvent: false });
            }
          } else {
            this.startTime = value.StartTime;
            this.endTime = value.EndTime;
            formArray.at(index).get('Hours')?.patchValue('', { emitEvent: false });
          }
        }

      });

      // Unsubscribe to avoid recursive calls
      subscription.unsubscribe();
    });
  }
  subscribeToShift2StartEndTimeChanges(indexValue: number) {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    const subscription = formArray.valueChanges.subscribe((values) => {
      values.forEach((value: any, index: any) => {
        if (indexValue == index) {
          if (value.StartTimeOT != undefined && value.StartTimeOT != '' && value.StartTimeOT != null &&
            value.EndTimeOT != undefined && value.EndTimeOT != '' && value.EndTimeOT != null
          ) {
            this.shift2StartTime = this.addLeadingZero(value.StartTimeOT);
            this.shift2EndTime = this.addLeadingZero(value.EndTimeOT);
            if (this.shift2StartTime != null) {
              const newDate = new Date(
                this.attendanceForm.value.AdvanceDate.getFullYear(),
                this.attendanceForm.value.AdvanceDate.getMonth(),
                value.dayField
              );
              newDate.setHours(newDate.getHours() + this.shift2StartTime);
              const formattedDate = this.formatDate(newDate);
              formArray.at(index).get('OTTimeStart')?.patchValue(formattedDate, { emitEvent: false });
            }
            if (this.shift2EndTime != null) {
              const newDate = new Date(
                this.attendanceForm.value.AdvanceDate.getFullYear(),
                this.attendanceForm.value.AdvanceDate.getMonth(),
                value.dayField
              );
              newDate.setHours(newDate.getHours() + this.shift2EndTime);
              const formattedDate = this.formatDate(newDate);
              formArray.at(index).get('OTTimeEnd')?.patchValue(formattedDate, { emitEvent: false });
            }
            if (this.shift2StartTime != null && this.shift2EndTime != null &&
              this.shift2StartTime != 0 && this.shift2EndTime != 0) {
              if (this.shift2StartTime < this.shift2EndTime) {
                this.finalHoursshift2 = this.shift2EndTime - this.shift2StartTime;
              } else if (this.shift2StartTime == this.shift2EndTime && this.shift2StartTime != 0 && this.shift2EndTime != 0) {
                this.finalHoursshift2 = 24;
              } else if (this.shift2StartTime > this.shift2EndTime) {
                const hour = this.shift2StartTime - this.shift2EndTime;
                this.finalHoursshift2 = 24 - hour;
              }
              formArray.at(index).get('Shift2Hours')?.patchValue(this.finalHoursshift2, { emitEvent: false });

            } else {
              formArray.at(index).get('Shift2Hours')?.patchValue('', { emitEvent: false });
            }
          } else {
            this.shift2StartTime = value.StartTimeOT;
            this.shift2EndTime = value.EndTimeOT;
            formArray.at(index).get('Shift2Hours')?.patchValue('', { emitEvent: false });
          }
        }
      });

      // Unsubscribe to avoid recursive calls
      subscription.unsubscribe();
    });
  }
  // subscribeToStartEndTimeHoursChanges(indexValue: number, numericValue: number) {
  //   const formArray = this.dynamicForm.get('formArray') as FormArray;
  //   if (Number.isNaN(numericValue)) { 
  //     this.startTime = 1;
  //     this.endTime = 1;

  //     const newDate = new Date(
  //       this.attendanceForm.value.AdvanceDate.getFullYear(),
  //       this.attendanceForm.value.AdvanceDate.getMonth(),
  //       indexValue + 1
  //     );
  //     // Set time to 00:00:00.000
  //     newDate.setHours(newDate.getHours() + this.startTime);
  //     const formattedDate = newDate;
  //     formArray.at(indexValue).get('TimeStart')?.patchValue(this.formatDate(formattedDate), { emitEvent: false });
  //     formArray.at(indexValue).get('TimeEnd')?.patchValue(this.formatDate(formattedDate), { emitEvent: false });
  //       formArray.at(indexValue).get('Hours')?.patchValue('', { emitEvent: false });
  //   } else if (numericValue == 0) {    
  //      this.startTime = 1;
  //     this.endTime = 1;  
  //     const newDate = new Date(
  //       this.attendanceForm.value.AdvanceDate.getFullYear(),
  //       this.attendanceForm.value.AdvanceDate.getMonth(),
  //       indexValue + 1
  //     );
  //     // Set time to 00:00:00.000
  //      newDate.setHours(newDate.getHours() + this.startTime);
  //     const formattedDate = newDate;
  //     formArray.at(indexValue).get('TimeStart')?.patchValue(this.formatDate(formattedDate), { emitEvent: false });
  //     formArray.at(indexValue).get('TimeEnd')?.patchValue(this.formatDate(formattedDate), { emitEvent: false });
  //     formArray.at(indexValue).get('Hours')?.patchValue('0', { emitEvent: false });
  //   } else {
  //     const subscription = formArray.valueChanges.subscribe((values) => {
  //       values.forEach((value: any, index: any) => {
  //         if (indexValue == index) {
  //           this.startTime = 1;
  //           if (!Number.isNaN(numericValue)) {
  //             this.endTime = this.startTime + numericValue;
  //           } else {
  //             this.endTime = 24;
  //             formArray.at(index).get('Hours')?.patchValue(this.endTime, { emitEvent: false });
  //           }
  //           this.startTime = this.addLeadingZero(this.startTime);
  //           this.endTime = this.addLeadingZero(this.endTime);
  //           if (this.startTime != null) {
  //             const newDate = new Date(
  //               this.attendanceForm.value.AdvanceDate.getFullYear(),
  //               this.attendanceForm.value.AdvanceDate.getMonth(),
  //               value.dayField
  //             );
  //             newDate.setHours(newDate.getHours() + this.startTime);
  //             const formattedDate = newDate;
  //             formArray.at(index).get('TimeStart')?.patchValue(this.formatDate(formattedDate), { emitEvent: false });
  //           }
  //           if (this.endTime != null) {
  //             if (this.endTime > 24) {
  //               this.endTime = 24;
  //             }
  //             const newDate = new Date(
  //               this.attendanceForm.value.AdvanceDate.getFullYear(),
  //               this.attendanceForm.value.AdvanceDate.getMonth(),
  //               value.dayField
  //             );
  //             newDate.setHours(newDate.getHours() + this.endTime);
  //             const formattedDate = newDate;
  //             formArray.at(index).get('TimeEnd')?.patchValue(this.formatDate(formattedDate), { emitEvent: false });
  //           }
  //         }

  //       });
  //       // Unsubscribe to avoid recursive calls
  //       subscription.unsubscribe();
  //     });
  //   }
  // }

  subscribeToStartEndTimeHoursChanges(indexValue: number, numericValue: number) {
    const formArray = this.dynamicForm.get('formArray') as FormArray;

    let startHour = 1; // base hour is 0 (00:00)
    let endHour = 0;

    if (!Number.isNaN(numericValue) && numericValue > 0) {
      endHour = startHour + numericValue;
      if (endHour > 24) {
        endHour = 24; // cap at 24
      }
    } else {
      endHour = startHour
    }

    // Update component-level startTime and endTime (as string with leading zero)
    this.startTime = this.addLeadingZero(startHour);
    this.endTime = this.addLeadingZero(endHour);

    const newDateStart = new Date(
      this.attendanceForm.value.AdvanceDate.getFullYear(),
      this.attendanceForm.value.AdvanceDate.getMonth(),
      indexValue + 1
    );
    newDateStart.setHours(startHour, 0, 0, 0);

    const newDateEnd = new Date(
      this.attendanceForm.value.AdvanceDate.getFullYear(),
      this.attendanceForm.value.AdvanceDate.getMonth(),
      indexValue + 1
    );
    newDateEnd.setHours(endHour, 0, 0, 0);

    formArray.at(indexValue).get('StartTime')?.patchValue(this.startTime)
    formArray.at(indexValue).get('EndTime')?.patchValue(this.endTime)
    formArray.at(indexValue).get('TimeStart')?.patchValue(this.formatDate(newDateStart), { emitEvent: false });
    formArray.at(indexValue).get('TimeEnd')?.patchValue(this.formatDate(newDateEnd), { emitEvent: false });

    if (Number.isNaN(numericValue) || numericValue === 0) {
      formArray.at(indexValue).get('Hours')?.patchValue('0', { emitEvent: false });
    } else {
      formArray.at(indexValue).get('Hours')?.patchValue(numericValue, { emitEvent: false });
    }
  }

  addLeadingZero(value: any) {
    return value < 10 ? '0' + value : value;
  }
  getDayOfHours(startTime: any, endTime: any): any {

    this.startTime = this.addLeadingZero(startTime);
    this.endTime = this.addLeadingZero(endTime);

    // if (startTime != null && startTime != '' && endTime != '' && endTime != null) {      
    //   if (startTime < endTime) {
    //     return endTime - startTime
    //   }
    //   else if (startTime == endTime && startTime != 0 && endTime != 0) {
    //     return 24
    //   }
    //   else if (startTime > endTime) {
    //     const hour = startTime - endTime
    //     return 24 - hour
    //   }
    // }

    if (this.startTime != null && this.endTime != null &&
      this.startTime != 0 && this.endTime != 0) {
      if (this.startTime < this.endTime) {
        return this.endTime - this.startTime;
      } else if (this.startTime == this.endTime && this.startTime != 0 && this.endTime != 0) {
        return 24;
      } else if (this.startTime > this.endTime) {
        const hour = this.startTime - this.endTime;
        return 24 - hour;
      }
    }

    return '';
  }
  getDayOfHoursEdited(startTime: any, endTime: any): any {
    if (startTime != null && startTime != '' && endTime != '' && endTime != null) {
      const startTime1 = new Date(startTime);
      const endTime1 = new Date(endTime);

      const time1 = startTime1.getHours();
      const time2 = endTime1.getHours();

      // Check if the conversion was successful
      if (!isNaN(startTime1.getTime())) {
        const time1 = startTime1.getHours();
      }
      if (!isNaN(endTime1.getTime())) {
        const time2 = endTime1.getHours();
      }

      if (time1 < time2) {
        return time2 - time1
      }
      else if (time1 == time2 && time1 != 0 && time2 != 0) {
        return 24
      }
      else if (time1 > time2) {
        const hour = time1 - time2
        return 24 - hour
      }
    }
    return '';
  }

  assignTimeStartValue(startTime: number, dayField: number): any {
    if (startTime != null && startTime != undefined) {
      this.startTime = this.addLeadingZero(startTime);
      if (this.startTime != null) {
        const newDate = new Date(
          this.attendanceForm.value.AdvanceDate.getFullYear(),
          this.attendanceForm.value.AdvanceDate.getMonth(),
          dayField
        );
        newDate.setHours(newDate.getHours() + this.startTime);
        const formattedDate = newDate;
        return formattedDate
      }
    } else {
      const newDate = new Date(
        this.attendanceForm.value.AdvanceDate.getFullYear(),
        this.attendanceForm.value.AdvanceDate.getMonth(),
        dayField
      );
      return newDate;
    }
    return '';
  }
  assignTimeEndValue(endTime: number, dayField: number): any {
    if (endTime != null && endTime != undefined) {
      this.endTime = this.addLeadingZero(endTime);
      if (this.endTime != null) {
        const newDate = new Date(
          this.attendanceForm.value.AdvanceDate.getFullYear(),
          this.attendanceForm.value.AdvanceDate.getMonth(),
          dayField
        );
        newDate.setHours(newDate.getHours() + this.endTime);
        const formattedDate = newDate;
        return formattedDate;
      }
    } else {
      const newDate = new Date(
        this.attendanceForm.value.AdvanceDate.getFullYear(),
        this.attendanceForm.value.AdvanceDate.getMonth(),
        dayField
      );
      return newDate;
    }
    return '';
  }

  assignOTTimeStartValue(startTimeOT: number, dayField: number): any {
    if (startTimeOT != null && startTimeOT != undefined) {
      this.shift2StartTime = this.addLeadingZero(startTimeOT);
      if (this.shift2StartTime != null) {
        const newDate = new Date(
          this.attendanceForm.value.AdvanceDate.getFullYear(),
          this.attendanceForm.value.AdvanceDate.getMonth(),
          dayField
        );
        newDate.setHours(newDate.getHours() + this.shift2StartTime);
        const formattedDate = newDate;
        return formattedDate
      }
    } else {
      const newDate = new Date(
        this.attendanceForm.value.AdvanceDate.getFullYear(),
        this.attendanceForm.value.AdvanceDate.getMonth(),
        dayField
      );
      return newDate;
    }
    return '';
  }
  assignOTTimeEndValue(endTimeOT: number, dayField: number): any {
    if (endTimeOT != null && endTimeOT != undefined) {
      this.shift2EndTime = this.addLeadingZero(endTimeOT);
      if (this.shift2EndTime != null) {
        const newDate = new Date(
          this.attendanceForm.value.AdvanceDate.getFullYear(),
          this.attendanceForm.value.AdvanceDate.getMonth(),
          dayField
        );
        newDate.setHours(newDate.getHours() + this.shift2EndTime);
        const formattedDate = newDate;
        return formattedDate;
      }
    } else {
      const newDate = new Date(
        this.attendanceForm.value.AdvanceDate.getFullYear(),
        this.attendanceForm.value.AdvanceDate.getMonth(),
        dayField
      );
      return newDate;
    }
    return '';
  }
  addingHours(value: any): any {
    if (value != '' && value != null) {
      return value + ':00:00.000';
    }
    return;
  }
  onWorkTypeChange(event: MatSelectChange, index: number) {
    const formArray = this.dynamicForm.get('formArray') as FormArray;
    const group = formArray.at(index) as FormGroup;

    if (this.employeeSelectedType == 'Guard') {
      // Get the selected work type value from the event
      const selectedWorkType = event.value;
      if (event.value != '1' && event.value != '3' && event.value != '5') {
        // Perform any necessary actions like resetting related fields
        group.get('Client')?.setValue('');
        group.get('StartTime')?.setValue('');
        group.get('EndTime')?.setValue('');
        group.get('Hours')?.setValue('');
      }
    }
  }
  getDaysInMonth(date: string): number {
    const currentDate = new Date(date);
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  }
  async saveAttendance(): Promise<void> {
    const allowProceed = await this.checkAllowance();
    if (!allowProceed) {
      return; // stop if user cancels the confirm dialog
    }

    // Recalculate dynamic allowance before checking leaves
    this.calculateDynamicAllowance();

    // Underworked days check removed - functionality disabled

    // Check if applied leave days match configured value
    const appliedLeaveDays = this.calculateAppliedLeaveDays();
    const configuredLeavesAllowed = parseFloat(this.attendanceForm.value.WorkingDaysAllowed) || 0;

    // Calculate effective working days for mid-month joiners
    const effectiveWorkingDaysAllowed = this.calculateEffectiveWorkingDaysAllowed(configuredLeavesAllowed);

    // Only check if applied leave days are below effective configured value
    if (appliedLeaveDays < effectiveWorkingDaysAllowed) {
      const result = await Swal.fire({
        title: 'Insufficient Leave Days',
        html: `Employee has applied <b>${appliedLeaveDays} day(s) leave</b> but effective working days for this period is <b>${effectiveWorkingDaysAllowed} day(s)</b>.<br><br>
               Please apply at least ${effectiveWorkingDaysAllowed} leave days to submit attendance.`,
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6'
      });

      // Stop submission - user must fix leave days
      return;
    }

    // Leave days confirmation removed - proceed directly to submission

    // Validate client selection for Guard employees
    if (this.employeeSelectedType === 'Guard') {
      const formArray = this.dynamicForm.get('formArray') as FormArray;
      let hasShift1Client = false;
      let hasShift2Client = false;
      let hasShift2Hours = false;

      // Check dynamic form for client selections and shift 2 hours
      for (let i = 0; i < formArray.length; i++) {
        const group = formArray.at(i);
        const type = group.get('Type')?.value;
        const hours = parseFloat(group.get('Hours')?.value) || 0;
        const shift2Hours = parseFloat(group.get('Shift2Hours')?.value) || 0;
        const client = group.get('Client')?.value;
        const shift2Client = group.get('OTClient')?.value;

        // Check if it's a working day with hours
        if (hours > 0 && (type === 'General Working' || type === '1' ||
          type === 'Off Day Working' || type === '3' ||
          type === 'Holiday Working' || type === '5')) {
          if (client && client.trim() !== '') {
            hasShift1Client = true;
          }
        }

        // Check for shift 2 hours and client
        if (shift2Hours > 0) {
          hasShift2Hours = true;
          if (shift2Client && shift2Client.trim() !== '') {
            hasShift2Client = true;
          }
        }
      }

      // At least one Shift 1 client must be selected for working days
      if (!hasShift1Client) {
        this.showMessage('Please select at least one client.', 'warning', 'Warning Message');
        return;
      }

      // Shift 2 Client is required only if Shift 2 has hours
      if (hasShift2Hours && !hasShift2Client) {
        this.showMessage('Please select a Shift II Client. Shift 2 hours are present.', 'warning', 'Warning Message');
        return;
      }
    }

    // Get allowed leave values from form.
    // When editing an existing record, the "remaining" value already has the current record's
    // leaves deducted. Add them back so the comparison reflects the true available quota.
    const annualAllowed = (this.leaveBalances['Annual'] ?? 0) + (this.attendanceID > 0 ? this.iAnnualLeave : 0);
    const medicalAllowed = (this.leaveBalances['Medical'] ?? 0) + (this.attendanceID > 0 ? this.iMedicalLeave : 0);
    const maternityAllowed = (this.leaveBalances['Maternity'] ?? 0) + (this.attendanceID > 0 ? this.iMaternityLeave : 0);
    const paternityAllowed = (this.leaveBalances['Paternity'] ?? 0) + (this.attendanceID > 0 ? this.iPaternityLeave : 0);
    const hospitalizationAllowed = (this.leaveBalances['Hospitalization'] ?? 0) + (this.attendanceID > 0 ? this.iHospitalizationLeave : 0);
    let dtAdvanceDate = this.attendanceForm.value.AdvanceDate;
    this.dtAdvanceDate = this.formatDate(
      new Date(dtAdvanceDate.getFullYear(), dtAdvanceDate.getMonth() + 1, 0)
    );

    this.showLoadingSpinner = true;
    this.attendanceModel.ID = this.attendanceForm.value.ID;
    this.attendanceModel.EmployeeID = this.attendanceForm.value.EmployeeID;
    this.attendanceModel.Branch = this.attendanceForm.value.BranchCode;
    this.attendanceModel.Period = this.dtAdvanceDate;
    this.attendanceModel.Shift2Type = this.attendanceForm.value.Shift2Type;
    this.attendanceModel.Shift2Rate = (this.attendanceForm.value.Shift2Rate == undefined || this.attendanceForm.value.Shift2Rate == '') ? 0 : this.attendanceForm.value.Shift2Rate;
    this.attendanceModel.Bonus = this.attendanceForm.value.BonusAmount != '' || this.attendanceForm.value.BonusAmount != null ? this.attendanceForm.value.BonusAmount : 0.00;
    this.attendanceModel.AllowanceDeduction = this.employeeSelectedType == 'Guard' ? this.attendanceForm.value.AllowanceDeduction : this.attendanceForm.value.AllowanceDeductionStaff;
    this.attendanceModel.SpecialAllowanceDeduction = this.employeeSelectedType == 'Guard' ? this.attendanceForm.value.SpecialAllowanceDeduction : this.attendanceForm.value.SpecialAllowanceDeductionStaff;
    this.attendanceModel.LastUpdatedBy = this.currentUser!;
    this.attendanceModel.LastUpdate = new Date;

    const formArray = this.dynamicForm.get('formArray') as FormArray;

    // Iterate over the formArray and get the values
    const attendanceData = formArray.value.map((formGroupValue: any) => {
      // Exclude dayField, dayField, Hours, Shift2Hours from the formGroupValue
      const { weekDay, dayField, Hours, Shift2Hours, StartTime, EndTime, StartTimeOT, EndTimeOT, ...dataWithoutUnwantedFields } = formGroupValue;
      // Modify individual values as needed
      dataWithoutUnwantedFields.Type = this.getWorkTypeByName(dataWithoutUnwantedFields.Type);
      return dataWithoutUnwantedFields;
    });

    // 1️⃣ Reset counters first
    this.iAbsent = 0;
    this.iAnnualLeave = 0;
    this.iMedicalLeave = 0;
    this.iMaternityLeave = 0;
    this.iPaternityLeave = 0;
    this.iHospitalizationLeave = 0;

    // 2️⃣ Loop through the attendanceData array
    attendanceData.forEach((row: any) => {
      // row.Type is already a number
      this.applyIncrementByType(row.Type);
    });

    // Check if taken leaves exceed allowed limits
    if (this.iAnnualLeave > annualAllowed) {
      this.showMessage('Annual Leave exceeds allowed limit.', 'warning', 'Warning Message');
      return;
    }
    if (this.iMedicalLeave > medicalAllowed) {
      this.showMessage('Medical Leave exceeds allowed limit.', 'warning', 'Warning Message');
      return;
    }
    if (this.iMaternityLeave > maternityAllowed) {
      this.showMessage('Maternity Leave exceeds allowed limit.', 'warning', 'Warning Message');
      return;
    }
    if (this.iPaternityLeave > paternityAllowed) {
      this.showMessage('Paternity Leave exceeds allowed limit.', 'warning', 'Warning Message');
      return;
    }
    if (this.iHospitalizationLeave > hospitalizationAllowed) {
      this.showMessage('Hospitalization Leave exceeds allowed limit.', 'warning', 'Warning Message');
      return;
    }

    formArray.controls.forEach((group) => {
      const startTime = group.get('StartTimeOT')?.value ?? '';
      const endTime = group.get('EndTimeOT')?.value ?? '';
      const shift2Hours = group.get('Shift2Hours')?.value ?? '';

      if (startTime && endTime && shift2Hours) {
        this.shift2StartTimeValidation = startTime
        this.shift2EndTimeValidation = endTime
        this.shift2HoursValidation = shift2Hours
      }
    });

    if (this.shift2StartTimeValidation && this.shift2EndTimeValidation && this.shift2HoursValidation
      && this.attendanceModel.Shift2Type == 3) {
      this.showMessage(`Please select Shift II type from radio button.`, 'warning', 'Warning Message');
    }
    else if (this.shift2StartTimeValidation && this.shift2EndTimeValidation && this.shift2HoursValidation
      && (this.attendanceForm.value.Shift2Rate === '' || this.attendanceForm.value.Shift2Rate == 0)) {
      this.showMessage(`Please enter Shift II rate details.`, 'warning', 'Warning Message');
    } else {
      this._payrollService.saveAndUpdateAttendance(this.attendanceModel, attendanceData)
        .subscribe(response => {
          if (response.Success == 'Success') {
            this.hideloadingSpinner();
            this.getEmployeeListByEmployeeType(this.branchCode, this.attendanceForm.value.EmployeeType, this.StartPeriod, this.EndPeriod, 'Active');
            this.clearFormFields();
            this._router.navigate(['/payroll/new-attendance']);
            this.showMessage(`${response.Message}`, 'success', 'Success Message');
          }
        });
    }
  }
  // onDeleteClick(): void {
  //   this.showLoadingSpinner = true;

  //   this.dialog
  //     .open(DialogConfirmationComponent, {
  //       data: `Are you sure want to delete this attendance details?`
  //     })
  //     .afterClosed()
  //     .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
  //       if (result.confirmDialog) {
  //         this._payrollService.deleteAttendance(this.attendanceID).subscribe((response) => {
  //           if (response.Success == 'Success') {
  //             this.showMessage(`${response.Message}`, 'success', 'Success Message');
  //             this.getEmployeeListByEmployeeType(this.branchCode, this.attendanceForm.value.EmployeeType, this.StartPeriod, this.EndPeriod, 'Active');
  //             this.clearFormFields();
  //             this.hideloadingSpinner();
  //           }
  //         },
  //           (error) => this.handleErrors(error)
  //         );
  //       } else {
  //         this.hideloadingSpinner();
  //       }
  //     });

  // }
  // fetchLatestPeriod() {
  //   const year = new Date(this.attendancePeriod).getFullYear();
  //   const month = new Date(this.attendancePeriod).getMonth() + 1; // +1 because getMonth() is zero-based

  //   this._payrollService.getLatestAttendancePeriod(this.attendanceForm.value.EmployeeID, year, month)
  //     .subscribe({
  //       next: (period) => {
  //         console.log('Latest Period:', period);
  //         // handle the returned period here
  //       },
  //       error: (err) => {
  //         console.error('Error fetching period:', err);
  //       }
  //     });
  // }

  onDeleteClick(): void {
    this.showLoadingSpinner = true;

    const year = new Date(this.attendancePeriod).getFullYear();
    const month = new Date(this.attendancePeriod).getMonth() + 1; // JS months are zero-based

    this._payrollService.getLatestAttendancePeriod(this.attendanceForm.value.EmployeeID, year, month)
      .subscribe({
        next: (period: string) => {
          if (period === null || period === '') {
            this.confirmAndDelete();
          } else {
            const formattedPeriod = this.formatDisplayDate(period);
            Swal.fire({
              title: 'Warning Message',
              html: `You cannot delete this attendance, please first delete the next month <b style="font-size: 1.2em;">(${formattedPeriod})</b> attendance.`,
              icon: 'warning',
              confirmButtonText: 'Ok'
            });
            this.hideloadingSpinner();
          }
        },
        error: (err: any) => {
          this.handleErrors(err);
          this.hideloadingSpinner();
        }
      });
  }

  confirmAndDelete(): void {
    this.dialog
      .open(DialogConfirmationComponent, {
        data: `Are you sure want to delete this attendance details?`
      })
      .afterClosed()
      .subscribe((result: { confirmDialog: boolean; remarks: any }) => {
        if (result.confirmDialog) {
          this._payrollService.deleteAttendance(this.attendanceID).subscribe(
            (response) => {
              if (response.Success == 'Success') {
                this.showMessage(`${response.Message}`, 'success', 'Success Message');
                this.getEmployeeListByEmployeeType(
                  this.branchCode,
                  this.attendanceForm.value.EmployeeType,
                  this.StartPeriod,
                  this.EndPeriod,
                  'Active'
                );
                this.clearFormFields();
              }
              this.hideloadingSpinner();
            },
            (error) => {
              this.handleErrors(error);
              this.hideloadingSpinner();
            }
          );
        } else {
          this.hideloadingSpinner();
        }
      });
  }

  // async checkAllowance(): Promise<boolean> {
  //   const form = this.attendanceForm;

  //   const allowance = parseFloat(form.get('Allowance')?.value) || 0;
  //   const specialAllowance = parseFloat(form.get('SpecialAllowance')?.value) || 0;
  //   const allowanceDeduction = parseFloat(form.get('AllowanceDeduction')?.value) || 0;
  //   const specialAllowanceDeduction = parseFloat(form.get('SpecialAllowanceDeduction')?.value) || 0;
  //   const allowanceDeductionStaff = parseFloat(form.get('AllowanceDeductionStaff')?.value) || 0;
  //   const specialAllowanceDeductionStaff = parseFloat(form.get('SpecialAllowanceDeductionStaff')?.value) || 0;

  //   const hasPositiveAllowance = allowance > 0 || specialAllowance > 0;
  //   const hasAllowanceDeduction = allowanceDeduction > 0;
  //   const hasSpecialAllowanceDeduction = specialAllowanceDeduction > 0;
  //   const hasAllowanceDeductionStaff = allowanceDeductionStaff > 0;
  //   const hasSpecialAllowanceDeductionStaff = specialAllowanceDeductionStaff > 0;

  //   // If we have any allowance but not both deductions filled, prompt user to fill them
  //   if (hasPositiveAllowance && (!hasAllowanceDeduction || !hasSpecialAllowanceDeduction)) {
  //     const result = await Swal.fire({
  //       title: 'Warning Message',
  //       text: 'Do you want to deduct from Allowance/Special Allowance?',
  //       icon: 'warning',
  //       showCancelButton: true,
  //       confirmButtonText: 'Yes',
  //       cancelButtonText: 'No'
  //     });
  //     return false; // cancel action
  //   }

  //   // If both deductions are filled, confirm the final save
  //   if (hasAllowanceDeduction && hasSpecialAllowanceDeduction) {
  //     const result = await Swal.fire({
  //       title: 'Warning Message',
  //       text:
  //         `RM ${allowanceDeduction.toFixed(2)} will be deducted from Allowance.\n` +
  //         `RM ${specialAllowanceDeduction.toFixed(2)} will be deducted from Special Allowance.\n` +
  //         `Do you want to save?`,
  //       icon: 'warning',
  //       showCancelButton: true,
  //       confirmButtonText: 'Yes',
  //       cancelButtonText: 'No'
  //     });

  //     return result.isConfirmed; // proceed only if confirmed
  //   }

  //   // If no allowance and no deductions, just proceed
  //   return true;
  // }

  async checkAllowance(): Promise<boolean> {
    const form = this.attendanceForm;

    const allowance = parseFloat(form.get('Allowance')?.value) || 0;
    const specialAllowance = parseFloat(form.get('SpecialAllowance')?.value) || 0;

    const isGuard = this.employeeSelectedType === 'Guard';
    const hasPositiveAllowance = allowance > 0 || specialAllowance > 0;

    if (isGuard) {
      const allowanceDeduction = parseFloat(form.get('AllowanceDeduction')?.value) || 0;
      const specialAllowanceDeduction = parseFloat(form.get('SpecialAllowanceDeduction')?.value) || 0;

      const hasBothDeductions = allowanceDeduction > 0 && specialAllowanceDeduction > 0;
      const hasAnyDeduction = allowanceDeduction > 0 || specialAllowanceDeduction > 0;

      // Show first warning if allowance exists but any deduction is missing
      if (hasPositiveAllowance && !hasBothDeductions) {
        const result = await Swal.fire({
          title: 'Warning Message',
          text: 'Do you want to deduct from Allowance/Special Allowance?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes',  // Stay
          cancelButtonText: 'No'     // Continue
        });
        return result.dismiss === Swal.DismissReason.cancel; // Continue if "No" clicked
      }

      // Show confirmation if both deductions > 0
      if (hasBothDeductions) {
        const result = await Swal.fire({
          title: 'Confirmation',
          text:
            `RM ${allowanceDeduction.toFixed(2)} will be deducted from Allowance.\n` +
            `RM ${specialAllowanceDeduction.toFixed(2)} will be deducted from Special Allowance.\n` +
            `Do you want to stay?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes',  // Stay
          cancelButtonText: 'No'     // Continue
        });
        //return result.isConfirmed; // Stay if "Yes", Continue if "No"
        return result.dismiss === Swal.DismissReason.cancel;
      }

    } else {
      // Staff
      const allowanceDeductionStaff = parseFloat(form.get('AllowanceDeductionStaff')?.value) || 0;
      const specialAllowanceDeductionStaff = parseFloat(form.get('SpecialAllowanceDeductionStaff')?.value) || 0;

      const hasBothDeductions = allowanceDeductionStaff > 0 && specialAllowanceDeductionStaff > 0;
      const hasAnyDeduction = allowanceDeductionStaff > 0 || specialAllowanceDeductionStaff > 0;

      // Show first warning if allowance exists but any deduction is missing
      if (hasPositiveAllowance && !hasBothDeductions) {
        const result = await Swal.fire({
          title: 'Warning Message',
          text: 'Do you want to deduct from Allowance/Special Allowance?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes',  // Stay
          cancelButtonText: 'No'     // Continue
        });
        return result.dismiss === Swal.DismissReason.cancel; // Continue if "No" clicked
      }

      // Show confirmation if both deductions > 0
      if (hasBothDeductions) {
        const result = await Swal.fire({
          title: 'Confirmation',
          text:
            `RM ${allowanceDeductionStaff.toFixed(2)} will be deducted from Allowance.\n` +
            `RM ${specialAllowanceDeductionStaff.toFixed(2)} will be deducted from Special Allowance.\n` +
            `Do you want to stay?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes',  // Stay
          cancelButtonText: 'No'     // Continue
        });
        //return result.isConfirmed; // Stay if "Yes", Continue if "No"
        return result.dismiss === Swal.DismissReason.cancel;
      }
    }

    // Default: no deduction or no allowance involved ΓÇö allow proceed
    return true;
  }

  public firstOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  public lastOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  // Dynamic Allowance Calculation based on Working Days
  calculateDynamicAllowance() {
    const workingDaysAllowed = parseFloat(this.attendanceForm.value.WorkingDaysAllowed) || 26;
    const allowance = parseFloat(this.attendanceForm.value.Allowance) || 0;
    const followCalendar = this.attendanceForm.value.AttendanceAllowanceFollowCalendar;

    // Calculate days worked from attendance details
    const daysWorked = this.calculateDaysWorked();

    // Calculate total days accounted for (worked + leave + holidays + off days)
    const totalAccountedDays = this.calculateTotalAccountedDays();

    let calculatedAllowance = allowance;
    let extraDays = 0;

    if (followCalendar === 'true' || followCalendar === 'Y') {
      // When following calendar, check if total accounted days exceed calendar days
      const daysInMonth = this.getDaysInMonth(this.attendanceForm.value.AdvanceDate);
      if (totalAccountedDays > daysInMonth) {
        extraDays = totalAccountedDays - daysInMonth;
      }
    } else {
      // When not following calendar, use original logic
      if (daysWorked > workingDaysAllowed) {
        extraDays = daysWorked - workingDaysAllowed;
      }
    }

    if (daysWorked < workingDaysAllowed && extraDays === 0) {
      // Prorate allowance based on actual days worked (only if no extra days)
      calculatedAllowance = (daysWorked / workingDaysAllowed) * allowance;
    }

    this.attendanceForm.patchValue({
      DaysWorked: daysWorked,
      CalculatedAllowance: calculatedAllowance.toFixed(2),
      ExtraDays: extraDays
    });
  }

  // Calculate total days worked from dynamic form array
  calculateDaysWorked(): number {
    let totalDays = 0;
    const formArray = this.dynamicForm.get('formArray') as FormArray;

    if (formArray && formArray.length > 0) {
      for (let i = 0; i < formArray.length; i++) {
        const group = formArray.at(i);
        const type = group.get('Type')?.value;
        const hours = parseFloat(group.get('Hours')?.value) || 0;
        const shift2Hours = parseFloat(group.get('Shift2Hours')?.value) || 0;

        // Count as a worked day if it's a working type with hours > 0
        // General Working (1), Off Day Working (3), Holiday Working (5)
        if (hours > 0 || shift2Hours > 0) {
          if (type === 'General Working' || type === '1' ||
            type === 'Off Day Working' || type === '3' ||
            type === 'Holiday Working' || type === '5') {
            totalDays += 1;
          }
        }
      }
    }
    return totalDays;
  }

  // Calculate applied leave days from attendance details
  calculateAppliedLeaveDays(): number {
    let totalLeaveDays = 0;
    const formArray = this.dynamicForm.get('formArray') as FormArray;

    if (formArray && formArray.length > 0) {
      for (let i = 0; i < formArray.length; i++) {
        const group = formArray.at(i);
        const type = group.get('Type')?.value;

        // Normalize type to number for consistent comparison
        // Type can be: numeric (2, 6, 8, 9, 10, 11, 12, 14, 15, 16, 17), numeric string ('2', '6', '8'), or string names
        let typeId: number | string = type;

        // Convert to number if it's a string
        if (typeof type === 'string') {
          switch (type) {
            case 'Off Day': typeId = 2; break;
            case 'Unpaid Leave': typeId = 6; break;
            case 'Absent': typeId = 7; break;
            case 'Annual Leave': typeId = 8; break;
            case 'Medical Leave': typeId = 9; break;
            case 'Maternity Leave': typeId = 10; break;
            case 'Paternity Leave': typeId = 11; break;
            case 'Hospitalization Leave': typeId = 12; break;
            case 'Socso': typeId = 13; break;
            case 'Non Schedule Off': typeId = 14; break;
            case 'Replacement Leave': typeId = 15; break;
            case 'Compensanate Leave': typeId = 16; break;
            case 'Marriage Leave': typeId = 17; break;
            default: typeId = parseInt(type) || type; // Try to parse as number
          }
        }

        // Convert to number if it's a numeric string
        if (typeof typeId === 'string' && !isNaN(parseInt(typeId))) {
          typeId = parseInt(typeId);
        }

        // Count leave types and off days:
        // 2 = Off Day
        // 6 = Unpaid Leave
        // 8 = Annual Leave
        // 9 = Medical Leave
        // 10 = Maternity Leave
        // 11 = Paternity Leave
        // 12 = Hospitalization Leave
        // 14 = Non Schedule Off
        // 15 = Replacement Leave
        // 16 = Compensate Leave
        // 17 = Marriage Leave
        if (typeId === 2 || typeId === 6 || typeId === 8 || typeId === 9 || typeId === 10 || typeId === 11 || typeId === 12 || typeId === 14 || typeId === 15 || typeId === 16 || typeId === 17) {
          totalLeaveDays += 1;
        }
      }
    }
    return totalLeaveDays;
  }

  // Calculate total days accounted for (worked + leave + holidays + off days)
  calculateTotalAccountedDays(): number {
    let totalDays = 0;
    const formArray = this.dynamicForm.get('formArray') as FormArray;

    if (formArray && formArray.length > 0) {
      for (let i = 0; i < formArray.length; i++) {
        const group = formArray.at(i);
        const type = group.get('Type')?.value;
        const hours = parseFloat(group.get('Hours')?.value) || 0;
        const shift2Hours = parseFloat(group.get('Shift2Hours')?.value) || 0;

        // Count all days that have any activity (work, leave, holiday, off day)
        // Working types with hours
        if ((hours > 0 || shift2Hours > 0) &&
          (type === 'General Working' || type === '1' ||
            type === 'Off Day Working' || type === '3' ||
            type === 'Holiday Working' || type === '5')) {
          totalDays += 1;
        }
        // Leave types (6-13)
        else if (type === 'Annual Leave' || type === '6' ||
          type === 'Medical Leave' || type === '7' ||
          type === 'Maternity Leave' || type === '8' ||
          type === 'Paternity Leave' || type === '9' ||
          type === 'Hospitalization Leave' || type === '10' ||
          type === 'Unpaid Leave' || type === '11' ||
          type === 'Abscond' || type === '12' ||
          type === 'Suspended' || type === '13') {
          totalDays += 1;
        }
        // Off Day (2) and Holiday (4) without work
        else if (type === 'Off Day' || type === '2' ||
          type === 'Holiday' || type === '4') {
          totalDays += 1;
        }
      }
    }
    return totalDays;
  }

  // Calculate actual off days in the month
  calculateOffDaysInMonth(attendanceDateStr: string): number {
    const date = new Date(attendanceDateStr);
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let offDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();

      // Count Sundays as off days (day 0 = Sunday)
      if (dayOfWeek === 0) {
        offDays++;
      }
    }

    return offDays;
  }

  // Calculate Effective Working Days Allowed for mid-month joiners
  calculateEffectiveWorkingDaysAllowed(configuredLeavesAllowed: number): number {
    // Get employee joining date from form
    const joiningDateStr = this.attendanceForm.value.DateOfJoining;
    const attendanceDateStr = this.attendanceForm.value.AdvanceDate;

    if (!joiningDateStr || !attendanceDateStr) {
      return configuredLeavesAllowed; // Fallback to configured value
    }

    const joiningDate = new Date(joiningDateStr);
    const attendanceDate = new Date(attendanceDateStr);

    // If employee joined in the same month as attendance period
    if (joiningDate.getMonth() === attendanceDate.getMonth() &&
      joiningDate.getFullYear() === attendanceDate.getFullYear()) {

      // Calculate days from joining date to end of month
      const daysInMonth = this.getDaysInMonth(attendanceDateStr);
      const effectiveDaysInMonth = daysInMonth - joiningDate.getDate() + 1;

      // Calculate proportionate leave days based on actual days in month
      const proportion = effectiveDaysInMonth / daysInMonth;
      const effectiveLeaveDays = Math.round(configuredLeavesAllowed * proportion);

      // Ensure at least 1 leave day if employee worked any days
      return Math.max(1, effectiveLeaveDays);
    }

    // For full-month employees, return configured value
    return configuredLeavesAllowed;
  }

  // Calculate Working Days Allowed based on Follow Calendar flag
  calculateWorkingDaysAllowed(followCalendar: string | null | undefined, attendanceAllowanceWorkingDays: number | null | undefined, workingDays: number | null | undefined): number {
    // If Follow Calendar is true, use actual calendar days in the month minus off days (total leaves month)
    if (followCalendar === 'true' || followCalendar === 'Y') {
      // Calculate days in the attendance period month
      const attendanceDateStr = this.attendanceForm.value.AdvanceDate;
      const daysInMonth = this.getDaysInMonth(attendanceDateStr);
      // Calculate actual off days in the month (total leaves month)
      const offDays = this.calculateOffDaysInMonth(attendanceDateStr);
      return daysInMonth - offDays;
    }
    // Otherwise use the configured AttendanceAllowanceWorkingDays, fallback to SalaryStructure WorkingDays, 
    // but calculate based on total leaves month (calendar days - 4 Sundays)
    if (attendanceAllowanceWorkingDays && attendanceAllowanceWorkingDays > 0) {
      return attendanceAllowanceWorkingDays;
    }
    if (workingDays && workingDays > 0) {
      return workingDays;
    }
    // Default: Calculate current month days minus actual off days
    const attendanceDateStr = this.attendanceForm.value.AdvanceDate;
    const daysInMonth = this.getDaysInMonth(attendanceDateStr);
    const offDays = this.calculateOffDaysInMonth(attendanceDateStr);
    return daysInMonth - offDays;
  }

  // Auto-set Sundays as Off Day leave functionality removed
  // Cache to store ongoing requests for de-duplication
  private inProgressRequests: Map<string, Observable<boolean>> = new Map();
  // Helper function to get effective value (dynamic or default)
  private getEffectiveValue(value: string, dynamicValue: string): string {
    return (!value || value === '') ? dynamicValue : value;
  }
  // Helper function to compute hours
  private getComputedHours(startTime: string, endTime: string, dynamicStartTime: string, dynamicEndTime: string): number {
    return (!startTime || startTime === '') && (!endTime || endTime === '')
      ? this.getDayOfHours(dynamicStartTime, dynamicEndTime)
      : this.getDayOfHours(startTime, endTime);
  }
  private showMessage(message: string, icon: 'success' | 'warning' | 'info' | 'error' = 'info',
    title: 'Success Message' | 'Warning Message' | 'Error Message'): void {
    Swal.fire({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      title: title,
      text: message,
      icon: icon, // Dynamically set the icon based on the parameter
      showCloseButton: false,
      timer: 5000,
      width: '600px'
    });
    this.hideloadingSpinner();
    return;
  }
  hideloadingSpinner() {
    this.showLoadingSpinner = false;
  }
  handleErrors(error: string) {
    if (error != null && error != '') {
      this.errorMessage = error;
      this.hideloadingSpinner();
    }
  };

  openBulkUploadDialog(): void {
    // Import the bulk upload component dynamically
    import('../bulk-attendance-upload/bulk-attendance-upload.component').then(({ BulkAttendanceUploadComponent }) => {
      // For now, we'll use Swal to open a simple dialog
      // In a full implementation, you would use MatDialog or a routing approach
      Swal.fire({
        title: 'Bulk Attendance Upload',
        html: `
          <div style="text-align: left;">
            <p><strong>Features:</strong></p>
            <ul>
              <li>Upload attendance for multiple employees at once</li>
              <li>Download pre-formatted Excel templates</li>
              <li>Validate data before processing</li>
              <li>Export existing attendance data</li>
            </ul>
            <p><strong>To access bulk upload:</strong></p>
            <ol>
              <li>Navigate to the Attendance module</li>
              <li>Click on "Bulk Upload Attendance" in the menu</li>
              <li>Or access directly via: <code>/payroll/bulk-attendance-upload</code></li>
            </ol>
          </div>
        `,
        icon: 'info',
        width: '600px',
        confirmButtonText: 'Go to Bulk Upload',
        showCancelButton: true,
        cancelButtonText: 'Close'
      }).then((result) => {
        if (result.isConfirmed) {
          // Navigate to bulk upload page
          this._router.navigate(['/payroll/bulk-attendance-upload']);
        }
      });
    });
  }
}
