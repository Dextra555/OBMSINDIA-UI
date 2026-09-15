import { Component, OnInit } from '@angular/core';



import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';



import { MatDialog } from '@angular/material/dialog';



import { EmployeeService } from "../../../../service/employee.service";



import { ActivatedRoute, Router } from "@angular/router";



import Swal from "sweetalert2";



import { DatasharingService } from "../../../../service/datasharing.service";



import { UserAccessModel } from 'src/app/model/userAccesModel';



import { MastermoduleService } from 'src/app/service/mastermodule.service';



import { IndianComplianceService } from 'src/app/service/indian-compliance.service';



import { CommercialBreakdownEnhancedDialogComponent } from './commercial-breakdown-enhanced-dialog.component';



import { INDIAN_STATES, SALARY_GROUPS, INDIAN_BANKS, INDIAN_RELIGIONS } from 'src/app/model/indian-employee.model';



import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';







@Component({



  selector: 'app-new-employee',



  templateUrl: './new-employee.component.html',



  styleUrls: ['./new-employee.component.css']



})



export class NewEmployeeComponent implements OnInit {







  frm!: FormGroup;



  isForeigner: boolean = false;



  isIndianCitizen: boolean = false;



  isBank: boolean = true;



  data: any;



  branchList: any;



  bankList: any;



  stateList: any;



  icColorList: any;



  nationalityList: any;



  raceList: any;



  clientList: any;



  employeeCheckInfoValidation: boolean = true;



  currentUser: string = '';



  empId: any;



  isEdit: boolean = false;
  /** Branch code that was loaded on page init (edit mode only). */
  originalBranchCode: string = '';
  /** True when the user has changed EMP_BRANCH_CODE in edit mode. */
  isBranchChanged: boolean = false;



  empCodeData: any | undefined;



  check: any = 1;







  // Indian Compliance Data



  indianStates: string[] = INDIAN_STATES;



  salaryGroups: any[] = SALARY_GROUPS;



  indianBanks: any[] = INDIAN_BANKS;



  indianReligions: string[] = INDIAN_RELIGIONS;







  // Department and Designation Data



  departmentList: any[] = [];



  designationList: any[] = [];







  checkList: any = [



    {



      id: 0,



      display: ""



    }



  ];







  empChkError: any = [];



  showLoadingSpinner: boolean = false;



  warningMessage: string = '';



  userAccessModel!: UserAccessModel;







  checklistItems = [



    { value: 0, label: 'Application Form' },



    { value: 1, label: 'Copy of Aadhaar' },



    { value: 3, label: 'Passport Size Photos' },



    { value: 4, label: 'Copy of Passport' },



    { value: 5, label: 'Copy of Visa' },



    { value: 6, label: 'Appointment Letter' },



    { value: 7, label: 'Confirmation Letter' },



    { value: 8, label: 'Police Verification' },



    { value: 9, label: 'CSG/TNG' },



  ];



  submitted = false;



  payMode: string = '';











  constructor(private _employeeService: EmployeeService, private fb: FormBuilder, private router: Router, private activatedRoute: ActivatedRoute, private _dataService: DatasharingService, public dialog: MatDialog,



    private _masterService: MastermoduleService, private _indianComplianceService: IndianComplianceService, private http: HttpClient) {







    // Set default nationality to Indian Citizen



    this.isIndianCitizen = true;







    this.empId = this.activatedRoute.snapshot.params['EMP_ID'];



    this.currentUser = sessionStorage.getItem('username')!;



    if (this.currentUser == 'null' || this.currentUser == undefined) {



      this._dataService.getUsername().subscribe((username) => {



        this.currentUser = username;



      });



    }







    // Remove data loading from constructor - will be called in ngOnInit after proper initialization



    this.frm = this.fb.group({



      EMP_ID: [0],



      EMP_CODE: [''],



      EMP_BRANCH_CODE: ['', Validators.required],



      EMP_CLIENT: ['', Validators.required],



      EMP_ROLE: ['None', Validators.required],



      EMP_NAME: ['', Validators.required],



      EMP_SEX: ['Male'],



      EMP_DATE_OF_BIRTH: [''],



      age: [''],



      EMP_CITIZEN: ['0'],



      EMP_NATIONAL: [''],



      EMP_PASSPORT_NO: [''],



      EMP_RACE: [''],



      EMP_ADDRESS1: ['', Validators.required],



      EMP_ADDRESS2: [''],



      EMP_PHONE: ['', Validators.required],



      EMP_MOBILEPHONE: [''],



      EMP_MARTIAL_STATUS: ['', Validators.required],



      EM_WORK_EXP: [''],



      EMP_HGH_EDU: [''],



      EMP_SPOUSE_NAME: [''],



      EMP_FATHER_NAME: [''],



      EMP_SP_WORK: ['0'],



      EMP_SP_TEL_NO: [''],



      EMP_NO_CHILD: [0],



      EMP_PER_NAME_CONTACT: [''],



      EMP_CONTACT_ADDRESS1: [''],



      EMP_CONTACT_ADDRESS2: [''],



      EMP_CONTACT_TELEPHONE: [''],







      // Malaysian fields (keeping for backward compatibility)



      EMP_POST_CODE: ['', [Validators.pattern('^[0-9]{6}$')]],



      EMP_TOWN: [''],



      EMP_STATE: [''],



      EMP_CONTACT_POST_CODE: ['', [Validators.pattern('^[0-9]{6}$')]],



      EMP_CONTACT_TOWN: [''],



      EMP_CONTACT_STATE: [''],



      TMPGUARD: [''],



      EPFDETECT: [''],



      EMPFL_EPFNO: [''],



      SOCSODETECT: [''],



      EMPFL_SOSCO_NO: [''],



      DETECTBYND55: [''],







      // Indian Compliance Fields



      AadhaarNumber: ['', [Validators.pattern('^[2-9]\\d{11}$')]],



      PANNumber: ['', [Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],



      PFAccountNumber: [''],



      



      



      ESINumber: [''],



      SalaryGroup: ['None'],



      SpousePAN: ['', [Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],



      SpouseAadhaar: ['', [Validators.pattern('^[2-9]\\d{11}$')]],



      IndianState: [''],



      BankAccountNumber: ['', [Validators.pattern('^[A-Za-z0-9]{9,18}$')]],



      BankIFSC: ['', [Validators.pattern('^[A-Z]{4}0[A-Z0-9]{6}$')]],



      BankName: [''],



      UPIId: [''],



      EMPPAY_JOB_TITLE: ['', Validators.required],



      EMPPAY_CATEGORY: ['', Validators.required],



      EMPPAY_DATE_JOINED: ['', Validators.required],



      EMPPAY_DATE_RESIGNED: [''],



      EMPPAY_BASIC_RATE: ['', Validators.required],



      ATTENDANCEALLOWANCE: [0],



      AttendanceAllowanceWorkingDays: [0],





      SpecialAllowance: [0],



      PAYMODE: ['Bank'],



      INCOMETAXDETECT: [''],



      EMPFL_TAX_NO: [''],



      application_form: [''],



      copy_ic: [''],



      bank_ac_detail: [''],



      passport_size_photo: [''],



      copy_of_passport: [''],



      copy_of_visa: [''],



      appointment_letter: [''],



      confirm_letter: [''],



      kdn_vetting: [''],



      HasTransfered: [false],



      TransferDate: [''],



      KDNVetting: [],



      EMP_CHECKLIST: [],



      EMPPAY_ID: [0],



      EMPFL_ID: [0],



      // ── Branch Transfer fields ──────────────────────────────────────
      IsBranchChanged: [false],
      BranchStartDate: [null],



      // Commercial Breakdown Fields



      CB_Basic: [0],



      CB_DA: [0],



      CB_HRA: [0],



      CB_HRAPercentage: [0],



      CB_Leaves: [0],



      CB_LeavesPercentage: [0],



      CB_OtherAllowances: [0],



      CB_NH: [0],



      CB_NHPercentage: [0],



      CB_AdvanceStatutoryBonus: [0],



      CB_AdvanceStatutoryBonusPercentage: [0],



      CB_SubTotal: [0],







      // Department and Designation Fields



      DepartmentId: [null],



      DesignationId: [null],







      // Salary Structure Flag (for migration from salary slab to commercial breakdown)

      NewSalaryStructure: ['N'],



      // OT (Overtime) Field

      OT: ['None']

    });







    this.checklistItems.forEach((item) => {



      this.frm.addControl(`checklistItem_${item.value}`, new FormControl(false));



    });







    if (this.empId != 0 && this.empId != undefined) {



      this.isEdit = true;







      this._employeeService.getEmployeeById(this.empId).subscribe((d: any) => {



        let result = d['Result'];



        let employee = result['employee'];



        let employment = result['employment'];



        let salaryDetail = result['salaryDetail'];







        // Handle null salaryDetail case



        if (salaryDetail != null) {



          this.payMode = salaryDetail['PAYMODE'];



          this.changePaymentMode(salaryDetail['PAYMODE']);



        } else {



          this.payMode = 'Bank'; // Default payment mode



          this.changePaymentMode('Bank');



        }







        this.nationalityChange(employee['EMP_CITIZEN']);



        this.frm.patchValue(employee);



        this.frm.patchValue(employment);



        if (salaryDetail != null) {



          this.frm.patchValue(salaryDetail);

          // Explicitly set EMPFL_ID to ensure proper update
          if (salaryDetail.EMPFL_ID && salaryDetail.EMPFL_ID > 0) {
            this.frm.get('EMPFL_ID')?.setValue(salaryDetail.EMPFL_ID);
          }

          // Explicitly set EPFDETECT to match radio button string values
          this.frm.get('EPFDETECT')?.setValue(salaryDetail?.EPFDETECT === true ? "Yes" : (salaryDetail?.EPFDETECT === false ? "No" : ""));



        }







        // Load Commercial Breakdown data from salaryDetail record



        this.frm.get('CB_Basic')?.setValue(salaryDetail?.CB_Basic || 0);



        this.frm.get('CB_DA')?.setValue(salaryDetail?.CB_DA || 0);



        this.frm.get('CB_HRA')?.setValue(salaryDetail?.CB_HRA || 0);



        this.frm.get('CB_HRAPercentage')?.setValue(salaryDetail?.CB_HRAPercentage || 0);



        this.frm.get('CB_Leaves')?.setValue(salaryDetail?.CB_Leaves || 0);



        this.frm.get('CB_LeavesPercentage')?.setValue(salaryDetail?.CB_LeavesPercentage || 0);



        this.frm.get('CB_OtherAllowances')?.setValue(salaryDetail?.CB_OtherAllowances || 0);



        this.frm.get('CB_NH')?.setValue(salaryDetail?.CB_NH || 0);



        this.frm.get('CB_NHPercentage')?.setValue(salaryDetail?.CB_NHPercentage || 0);



        this.frm.get('CB_AdvanceStatutoryBonus')?.setValue(salaryDetail?.CB_AdvanceStatutoryBonus || 0);



        this.frm.get('CB_AdvanceStatutoryBonusPercentage')?.setValue(salaryDetail?.CB_AdvanceStatutoryBonusPercentage || 0);



        this.frm.get('CB_SubTotal')?.setValue(salaryDetail?.CB_SubTotal || 0);



        // Update salary field to show CB_Basic value instead of slab data when using Commercial Breakdown



        if (employment?.NewSalaryStructure == 'N' || salaryDetail?.CB_Basic > 0) {



          this.frm.get('EMPPAY_BASIC_RATE')?.setValue(salaryDetail?.CB_Basic || 0);



        }







        this.frm.get('EMP_CITIZEN')?.setValue(employee['EMP_CITIZEN'].toString());



        this.frm.get('EMP_SP_WORK')?.setValue(employee['EMP_SP_WORK'] == true ? "1" : "0");







        this.frm.get('TMPGUARD')?.setValue(salaryDetail?.TMPGUARD == false ? "0" : "1");



        this.frm.get('INCOMETAXDETECT')?.setValue(salaryDetail?.INCOMETAXDETECT == true ? "Yes" : "No");



        this.frm.get('SOCSODETECT')?.setValue(salaryDetail?.SOCSODETECT == true ? "Yes" : "No");



        this.frm.get('EPFDETECT')?.setValue(salaryDetail?.EPFDETECT === true ? "Yes" : (salaryDetail?.EPFDETECT === false ? "No" : ""));



        this.frm.get('DETECTBYND55')?.setValue(salaryDetail?.DETECTBYND55 == true ? "Yes" : "No");

        this.frm.get('OT')?.setValue(salaryDetail?.OT || 'No');



        // Initialize field states based on loaded values
        // Only call isTemporaryEmployeeChange for new employees, not when editing
        // if (!this.isEdit) {
        //   this.isTemporaryEmployeeChange(this.frm.get('TMPGUARD')?.value);
        // }

        this.onIncomeTaxDeductionChange(this.frm.get('INCOMETAXDETECT')?.value);

        this.onPFDeductionChange(this.frm.get('EPFDETECT')?.value);

        this.onESIDeductionChange(this.frm.get('SOCSODETECT')?.value);







        // Reverse mapping: Set DepartmentId based on EMPPAY_JOB_TITLE



        if (employment['EMPPAY_JOB_TITLE']) {



          const department = this.departmentList.find(dept => dept.DepartmentName === employment['EMPPAY_JOB_TITLE']);



          if (department) {



            this.frm.get('DepartmentId')?.setValue(department.DepartmentId);



          }



        }







        // Reverse mapping: Set DesignationId based on EMPPAY_CATEGORY



        if (employment['EMPPAY_CATEGORY']) {



          const designation = this.designationList.find(desig => desig.DesignationName === employment['EMPPAY_CATEGORY']);



          if (designation) {



            this.frm.get('DesignationId')?.setValue(designation.DesignationId);



          }



        }







        const oEmployeeCheckList = employee['EMP_CHECKLIST']; //256+128+64+32+16+8+4+2+1;



        this.checklistItems.forEach((item) => {



          const formControl = this.frm.get(`checklistItem_${item.value}`);



          if (formControl) {



            formControl.setValue(!!(oEmployeeCheckList & (1 << item.value)));



          }



        });

        // ── Store original branch so we can detect a change later ──────
        this.originalBranchCode = employee['EMP_BRANCH_CODE']?.toString() ?? '';
        this.isBranchChanged = false;
        this.frm.get('IsBranchChanged')?.setValue(false);
        this.frm.get('BranchStartDate')?.setValue(null);
        this.frm.get('BranchStartDate')?.clearValidators();
        this.frm.get('BranchStartDate')?.updateValueAndValidity();

        // ── Reload branch clients so EMP_CLIENT dropdown shows the saved client ──
        if (this.originalBranchCode) {
          this._employeeService.getClientsFromBranchId(this.originalBranchCode, this.frm.get('EMP_ROLE')?.value).subscribe((cd: any) => {
            if (cd && cd['clientList']) {
              this.clientList = cd['clientList'];
            }
          });
        }

        // ── Re-apply reverse mapping in case lists loaded after the record ──
        this.applyEditReverseMappings();

      }, () => {
      }, () => {



        this.calculateAge();



        this.typeChange();



      });



    }



    // Employee code data is now handled in loadInitialData method



    this.frm.get('EMP_CODE')?.disable({ onlySelf: true });



    this.frm.get("EMP_NO_CHILD")?.disable({ onlySelf: true });



    this.frm.get("EMPPAY_BASIC_RATE")?.disable({ onlySelf: true });



    // Initialize deduction-related fields to disabled state (will be enabled based on selections)
    // PANNumber is now always required and enabled
    this.frm.get("PANNumber")?.enable({ onlySelf: true });

    this.frm.get("PFAccountNumber")?.disable({ onlySelf: true });

    this.frm.get("ESINumber")?.disable({ onlySelf: true });







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



        this.getUserAccessRights(this.currentUser, 'Employee Master');



        this.loadInitialData();



      });



    } else {



      this.getUserAccessRights(this.currentUser, 'Employee Master');



      this.loadInitialData();



    }







    this.frm.get('EMPPAY_DATE_RESIGNED')?.valueChanges.subscribe(value => {



      const currentPayMode = this.frm.get('PAYMODE')?.value;



      if (value && currentPayMode !== 'Cheque') {



        this.frm.get('PAYMODE')?.setValue('Cheque');



      } else {



        this.frm.get('PAYMODE')?.setValue(this.payMode);



      }



    });



  }







  loadInitialData(): void {



    this._employeeService.getEmployeeMaster(this.currentUser).subscribe((data: any) => {



      this.data = data;



      this.branchList = data['branchList'];



      this.bankList = data['bankList'];



      this.stateList = data['stateList'];



      this.icColorList = data['icColorList'];







      // Load Department and Designation data



      this.loadDepartments();



      this.loadDesignations();



      this.nationalityList = data['nationalityList'];



      this.raceList = data['raceList'];



      this.clientList = data['clientList'];







      // Handle edit scenario - load employee code data after initial data is loaded



      if (this.empId != 0 && this.empId != undefined) {



        // Edit mode - employee data will be loaded separately



      } else {



        // Create mode - load employee code data



        this.empCodeData = data['emp']['Result'];



        if (!this.isEdit) {



          this.setEmpCode();



        }



      }



    });



  }







  getUserAccessRights(userName: string, screenName: string) {



    this._masterService.getUserAccessRights(userName, screenName).subscribe(



      (data) => {



        if (data != null) {



          this.userAccessModel.readAccess = data.Read



          this.userAccessModel.deleteAccess = data.Delete;



          this.userAccessModel.updateAccess = data.Update;



          this.userAccessModel.createAccess = data.Create;



          if (this.currentUser == 'admin' || this.currentUser == 'superadmin') {



          } else {



            if (this.userAccessModel.readAccess === true) {



              this.warningMessage = '';



            } else {



              this.warningMessage = `Dear <B>${this.currentUser}</B>, <br>



                        You do not have permissions to view this page. <br>



                        If you feel you should have access to this page, Please contact administrator. <br>



                        Thank you`;







            }



          }



        }



      },



      (error) => {



        this.handleErrors(error);



      }



    );



  }







  nationalityChange(value: any) {



    this.isForeigner = value == 1;



    this.isIndianCitizen = value == 0 || value == 3; // Include Migrate People as Indian citizen type







    if (this.isForeigner) {



      // For foreigners, passport is required



      this.frm.get('EMP_PASSPORT_NO')?.setValidators([Validators.required]);



    } else {



      // For Indian citizens and Migrate People, remove passport requirement



      this.frm.get('EMP_PASSPORT_NO')?.clearValidators();



      this.frm.get('EMP_PASSPORT_NO')?.setValue('');



    }







    this.frm.get('EMP_PASSPORT_NO')?.updateValueAndValidity();



  }







  clientChange(value: any) {

    this._employeeService.getClientsFromBranchId(value, this.frm.get('EMP_ROLE')?.value).subscribe((data: any) => {

      // this.empCodeData = data.emp

      console.log(data);

      this.clientList = data['clientList'];

      this.setEmpCode();

    })

    // ── Detect branch change in edit mode ──────────────────────────────
    if (this.isEdit && this.originalBranchCode && value !== this.originalBranchCode) {
      this.isBranchChanged = true;
      this.frm.get('IsBranchChanged')?.setValue(true);
      this.frm.get('BranchStartDate')?.setValidators([Validators.required]);
      this.frm.get('BranchStartDate')?.updateValueAndValidity();
    } else {
      this.isBranchChanged = false;
      this.frm.get('IsBranchChanged')?.setValue(false);
      this.frm.get('BranchStartDate')?.clearValidators();
      this.frm.get('BranchStartDate')?.setValue(null);
      this.frm.get('BranchStartDate')?.updateValueAndValidity();
    }

  }







  typeChange() {



    if (this.empCodeData != undefined) {



      this.setEmpCode();



    }







    if (this.frm.get('EMP_ROLE')?.value === 'Staff') {



      this.frm.get("EMP_CLIENT")?.setValue("");



      this.frm.get("EMP_CLIENT")?.disable({ onlySelf: true });



    } else {



      this.frm.get("EMP_CLIENT")?.enable({ onlySelf: true });



    }







  }







  setEmpCode() {



    if (this.empCodeData) {



      const empRole = this.frm.get('EMP_ROLE')?.value || 'Guard';



      const roleChar = empRole.charAt(0).toUpperCase();



      let empCode = this.empCodeData["ShortName"] + roleChar + this.empCodeData["Code"];



      this.frm.get('EMP_CODE')?.setValue(empCode);



    }



  }







  calculateAge() {



    let dob = this.frm.get('EMP_DATE_OF_BIRTH')?.value



    if (dob) {



      const birthDate = new Date(dob);



      const currentDate = new Date();



      this.frm.get('age')?.setValue(currentDate.getFullYear() - birthDate.getFullYear());



    }



  }







  // Department and Designation methods



  loadDepartments(): void {



    this.http.get(`${environment.baseUrl}Department`).subscribe({



      next: (response: any) => {



        this.departmentList = response;
        if (this.isEdit) {
          this.applyEditReverseMappings();
        }



      },



      error: (error) => {



        console.error('Error loading departments:', error);



        this.showMessage('Error loading departments', 'error', 'Error Message');



      }



    });



  }







  loadDesignations(departmentId?: number): void {



    let url = `${environment.baseUrl}Designation`;



    if (departmentId && departmentId > 0) {



      url += `?departmentId=${departmentId}`;



    }



    this.http.get(url).subscribe({



      next: (response: any) => {



        this.designationList = response;

        if (this.isEdit) {
          this.applyEditReverseMappings();
        }



      },



      error: (error) => {



        console.error('Error loading designations:', error);



        this.showMessage('Error loading designations', 'error', 'Error Message');



      }



    });



  }







  applyEditReverseMappings(): void {
    if (!this.isEdit) return;

    const jobTitle = this.frm.get('EMPPAY_JOB_TITLE')?.value;

    if (jobTitle) {
      const department = this.departmentList.find(dept => dept.DepartmentName === jobTitle);
      if (department) {
        this.frm.get('DepartmentId')?.setValue(department.DepartmentId);
      }
    }

    const category = this.frm.get('EMPPAY_CATEGORY')?.value;

    if (category) {
      const designation = this.designationList.find(desig => desig.DesignationName === category);
      if (designation) {
        this.frm.get('DesignationId')?.setValue(designation.DesignationId);
      }
    }
  }



  onDepartmentChange(departmentId: any): void {



    // Clear designation when department changes



    this.frm.get('DesignationId')?.setValue(null);



    // Load designations filtered by selected department



    this.loadDesignations(departmentId);







    // Set EMPPAY_JOB_TITLE with department name



    const selectedDepartment = this.departmentList.find(dept => dept.DepartmentId === departmentId);



    if (selectedDepartment) {



      this.frm.get('EMPPAY_JOB_TITLE')?.setValue(selectedDepartment.DepartmentName);



    }



  }







  onDesignationChange(designationId: any): void {



    // Set EMPPAY_CATEGORY with designation name



    const selectedDesignation = this.designationList.find(desig => desig.DesignationId === designationId);



    if (selectedDesignation) {



      this.frm.get('EMPPAY_CATEGORY')?.setValue(selectedDesignation.DesignationName);



    }



  }



  otChange(value: any): void {

    // OT change handler - Salary Details visibility is controlled by *ngIf in HTML

    // This method can be used for additional logic if needed in the future

  }



  calculateCommercialBreakdownTotal(): void {



    const basic = parseFloat(this.frm.get('CB_Basic')?.value) || 0;



    const da = parseFloat(this.frm.get('CB_DA')?.value) || 0;



    const hra = parseFloat(this.frm.get('CB_HRA')?.value) || 0;



    const leaves = parseFloat(this.frm.get('CB_Leaves')?.value) || 0;



    const nh = parseFloat(this.frm.get('CB_NH')?.value) || 0;



    const advanceStatutoryBonus = parseFloat(this.frm.get('CB_AdvanceStatutoryBonus')?.value) || 0;



    const otherAllowances = parseFloat(this.frm.get('CB_OtherAllowances')?.value) || 0;







    const total = basic + da + hra + leaves + nh + advanceStatutoryBonus + otherAllowances;



    this.frm.get('CB_SubTotal')?.setValue(total);



  }







  formatDateInput(event: any, formControlName: string): void {



    let value = event.target.value.replace(/\D/g, ''); // Remove non-numeric characters







    if (value.length >= 8) {



      // Format as DD-MM-YYYY



      const day = value.substring(0, 2);



      const month = value.substring(2, 4);



      const year = value.substring(4, 8);







      // Create a valid date string for the datepicker



      const formattedDate = `${day}-${month}-${year}`;



      event.target.value = formattedDate;







      // Parse and set the date value



      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));



      if (!isNaN(dateObj.getTime())) {



        this.frm.get(formControlName)?.setValue(dateObj);







        // Calculate age if it's the date of birth field



        if (formControlName === 'EMP_DATE_OF_BIRTH') {



          this.calculateAge();



        }



      }



    }



  }











  changePaymentMode(value: any) {



    this.isBank = value === "Bank";



    // Bank field validation removed as bank details section is removed from form



  }







  onSubmit() {



    this.submitted = true;







    // Custom validation: Prevent submission if EMP_ROLE is 'None'



    if (this.frm.get('EMP_ROLE')?.value === 'None') {



      this.showMessage('Please select a valid employee type (Guard or Staff) before creating employee.', 'warning', 'Warning Message');



      return;



    }







    if (this.frm.invalid) {



      this.showMessage('Please correct the validation errors in the form before submitting.', 'warning', 'Warning Message');



      console.log('Form invalid:', this.frm.errors);







      // Log individual control errors for debugging



      Object.keys(this.frm.controls).forEach(key => {



        const controlErrors = this.frm.get(key)?.errors;



        if (controlErrors != null) {



          console.log('Key control error:', key, controlErrors);



        }



      });



      return;



    }







    if (!this.employeeCheckInfoValidation && this.isForeigner) {



      this.showMessage('Employee already has this IC number. Please choose a different IC number.', 'warning', 'Warning Message');



      return;



    }







    this.showSpinner();



    let data = this.frm.getRawValue();







    // Convert numeric fields from string to number



    data['EMPPAY_BASIC_RATE'] = parseFloat(data['EMPPAY_BASIC_RATE']) || 0;



    data['ATTENDANCEALLOWANCE'] = parseFloat(data['ATTENDANCEALLOWANCE']) || 0;



    data['NewStructureATTENDANCEALLOWANCE'] = parseFloat(data['NewStructureATTENDANCEALLOWANCE']) || 0;



    data['SpecialAllowance'] = parseFloat(data['SpecialAllowance']) || 0;



    // Handle Attendance Working Days - always use manual value since calendar option is removed

    data['AttendanceAllowanceWorkingDays'] = parseFloat(data['AttendanceAllowanceWorkingDays']) || 0;







    // Convert Commercial Breakdown fields to numbers



    data['CB_Basic'] = parseFloat(data['CB_Basic']) || 0;



    data['CB_DA'] = parseFloat(data['CB_DA']) || 0;



    data['CB_HRA'] = parseFloat(data['CB_HRA']) || 0;



    data['CB_HRAPercentage'] = parseFloat(data['CB_HRAPercentage']) || 0;



    data['CB_Leaves'] = parseFloat(data['CB_Leaves']) || 0;



    data['CB_LeavesPercentage'] = parseFloat(data['CB_LeavesPercentage']) || 0;



    data['CB_OtherAllowances'] = parseFloat(data['CB_OtherAllowances']) || 0;



    data['CB_NH'] = parseFloat(data['CB_NH']) || 0;



    data['CB_NHPercentage'] = parseFloat(data['CB_NHPercentage']) || 0;



    data['CB_AdvanceStatutoryBonus'] = parseFloat(data['CB_AdvanceStatutoryBonus']) || 0;



    data['CB_AdvanceStatutoryBonusPercentage'] = parseFloat(data['CB_AdvanceStatutoryBonusPercentage']) || 0;



    data['CB_SubTotal'] = parseFloat(data['CB_SubTotal']) || 0;







    // MIGRATION: Automatically set NewSalaryStructure based on CB usage



    // If CB_Basic > 0, use Commercial Breakdown (NewSalaryStructure = 'Y')



    // If CB_Basic = 0, use Salary Slab (NewSalaryStructure = 'N') for backward compatibility



    data['NewSalaryStructure'] = data['CB_Basic'] > 0 ? 'Y' : 'N';







    // When using Commercial Breakdown, set SALARYLAB to 0 to clear salary slab reference



    if (data['NewSalaryStructure'] === 'Y') {



      data['SALARYLAB'] = 0;



    }







    // DEBUG: Log CB_Leaves values



    console.log('=== DEBUG: CB_Leaves Values ===');



    console.log('Form CB_Leaves value:', this.frm.get('CB_Leaves')?.value);



    console.log('Form CB_LeavesPercentage value:', this.frm.get('CB_LeavesPercentage')?.value);



    console.log('Data CB_Leaves after conversion:', data['CB_Leaves']);



    console.log('Data CB_LeavesPercentage after conversion:', data['CB_LeavesPercentage']);



    console.log('============================');







    if (data['EMP_NO_CHILD'] !== undefined) {



      data['EMP_NO_CHILD'] = parseInt(data['EMP_NO_CHILD'], 10) || 0;



    }







    if (data['EMP_CITIZEN'] !== undefined) {



      data['EMP_CITIZEN'] = parseInt(data['EMP_CITIZEN'], 10) || 0;



    }







    data['EMP_SP_WORK'] = this.frm.get('EMP_SP_WORK')?.value == '1';







    data['OldBranch'] = '';



    data['EMP_IC_COLOR'] = 'test';



    data['LastUpdatedBy'] = 'admin';



    data['TMPGUARD'] = this.frm.get('TMPGUARD')?.value == '0' ? false : true;



    data['DETECTBYND55'] = this.frm.get('DETECTBYND55')?.value == 'Yes';



    data['INCOMETAXDETECT'] = this.frm.get('INCOMETAXDETECT')?.value == 'Yes';



    data['SOCSODETECT'] = this.frm.get('SOCSODETECT')?.value == 'Yes';



    data['EPFDETECT'] = this.frm.get('EPFDETECT')?.value === 'Yes';



    data['KDNVetting'] = false;













    data['LASTUPDATE'] = new Date().toISOString();







    // Process Employment details dates securely avoiding auto-filling today's date



    data['EMP_DATE_OF_BIRTH'] = this.frm.get('EMP_DATE_OF_BIRTH')?.value ? this.returnDate(this.frm.get('EMP_DATE_OF_BIRTH')?.value) : null;



    data['TransferDate'] = null;

    // ── Branch Transfer: inject change flag and effective start date ───
    data['IsBranchChanged'] = this.isBranchChanged;
    data['BranchStartDate'] = this.isBranchChanged && this.frm.get('BranchStartDate')?.value
      ? this.returnDate(this.frm.get('BranchStartDate')?.value)
      : null;



    data['EMPPAY_DATE_JOINED'] = this.frm.get('EMPPAY_DATE_JOINED')?.value ? this.returnDate(this.frm.get('EMPPAY_DATE_JOINED')?.value) : null;



    data['EMPPAY_DATE_RESIGNED'] = this.frm.get('EMPPAY_DATE_RESIGNED')?.value ? this.returnDate(this.frm.get('EMPPAY_DATE_RESIGNED')?.value) : null;



    let total = 0;



    this.checklistItems.forEach((item) => {



      const formControl = this.frm.get(`checklistItem_${item.value}`);







      if (formControl && formControl.value) {



        total += Math.pow(2, item.value);



        if (Math.pow(2, item.value) == 256) {



          data['KDNVetting'] = true;



        }



      }



    });







    data['EMP_CHECKLIST'] = total;



    data['EMP_POST_CODE'] = this.frm.get('EMP_POST_CODE')?.value ?? "";



    data['EMP_STATE'] = this.frm.get('EMP_STATE')?.value ?? "";



    data['EMP_CONTACT_POST_CODE'] = this.frm.get('EMP_CONTACT_POST_CODE')?.value ?? "";



    data['EMP_CONTACT_STATE'] = this.frm.get('EMP_CONTACT_STATE')?.value ?? "";











    this._employeeService.saveEmployee(data).subscribe({



      next: (d: any) => {



        if (d.Success == 'Success') {



          if (this.isEdit) {



            this.showMessage('Successfully Updated Employee Details', 'success', 'Success Message')



          } else {



            this.showMessage('Successfully Saved Employee Details', 'success', 'Success Message')



          }



          this.router.navigate(['/master/employee-master']);



        } else {



          if (d.Success == 'Warning') {



            this.showMessage(d.Message || 'Form contains some errors', 'warning', 'Warning Message');



          } else if (d.Success == 'Error') {



            this.showMessage(d.Message || 'Failed to save employee details', 'error', 'Error Message');



          }



        }



        this.hideSpinner();



      },



      error: (err: any) => {



        this.hideSpinner();



        console.error('Save error:', err);



        const errorMsg = typeof err === 'string' ? err : (err.error?.Message || err.message || 'Server error occurred');



        this.showMessage('Network/Server error: ' + errorMsg, 'error', 'Error Message');



      }



    });



  }







  returnDate(date?: any) {



    if (!date) {



      return null;



    }



    let currentDate = new Date(date);



    const year = currentDate.getFullYear();



    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based



    const day = String(currentDate.getDate()).padStart(2, '0');







    return `${year}-${month}-${day}`;



  }







  isTemporaryEmployeeChange(value: any) {

    if (value == '0') {

      // Temporary Employee - set all to 'No' and disable fields

      this.frm.get("INCOMETAXDETECT")?.setValue("No");

      this.frm.get("SOCSODETECT")?.setValue("No");

      this.frm.get("EPFDETECT")?.setValue("No");

      this.frm.get("DETECTBYND55")?.setValue("No");



      // Disable related fields
      // PANNumber is now always required and enabled
      this.frm.get("PFAccountNumber")?.disable({ onlySelf: true });

      this.frm.get("ESINumber")?.disable({ onlySelf: true });

      this.frm.get("EMPFL_TAX_NO")?.disable({ onlySelf: true });

      this.frm.get("EMPFL_EPFNO")?.disable({ onlySelf: true });

      this.frm.get("EMPFL_SOSCO_NO")?.disable({ onlySelf: true });



    } else if (value == '1') {

      // Permanent Employee - set all to 'Yes' and enable fields

      this.frm.get("INCOMETAXDETECT")?.setValue("Yes");

      this.frm.get("SOCSODETECT")?.setValue("Yes");

      this.frm.get("EPFDETECT")?.setValue("Yes");

      this.frm.get("DETECTBYND55")?.setValue("Yes");



      // Enable related fields
      // PANNumber is now always required and enabled
      this.frm.get("PFAccountNumber")?.enable({ onlySelf: true });

      this.frm.get("ESINumber")?.enable({ onlySelf: true });

      this.frm.get("EMPFL_TAX_NO")?.enable({ onlySelf: true });

      this.frm.get("EMPFL_EPFNO")?.enable({ onlySelf: true });

      this.frm.get("EMPFL_SOSCO_NO")?.enable({ onlySelf: true });

    } else {

      // None - reset to default and disable fields

      this.frm.get("INCOMETAXDETECT")?.setValue("");

      this.frm.get("SOCSODETECT")?.setValue("");

      this.frm.get("EPFDETECT")?.setValue("");

      this.frm.get("DETECTBYND55")?.setValue("");



      // Disable related fields
      // PANNumber is now always required and enabled
      this.frm.get("PFAccountNumber")?.disable({ onlySelf: true });

      this.frm.get("ESINumber")?.disable({ onlySelf: true });

      this.frm.get("EMPFL_TAX_NO")?.disable({ onlySelf: true });

      this.frm.get("EMPFL_EPFNO")?.disable({ onlySelf: true });

      this.frm.get("EMPFL_SOSCO_NO")?.disable({ onlySelf: true });

    }

  }



  // Individual field change handlers

  onIncomeTaxDeductionChange(value: any) {
    // PANNumber is now always required and enabled - no conditional logic needed
  }



  onPFDeductionChange(value: any) {

    if (value === 'Yes') {

      this.frm.get("PFAccountNumber")?.enable({ onlySelf: true });

    } else {

      this.frm.get("PFAccountNumber")?.disable({ onlySelf: true });

      this.frm.get("PFAccountNumber")?.setValue('');

    }

  }



  onESIDeductionChange(value: any) {

    if (value === 'Yes') {

      this.frm.get("ESINumber")?.enable({ onlySelf: true });

    } else {

      this.frm.get("ESINumber")?.disable({ onlySelf: true });

      this.frm.get("ESINumber")?.setValue('');

    }

  }



  checkEmployeeInfo(from: any) {

    // ... (rest of the code remains the same)



    let _trigger = true;



    let data;



    if (from == "NewIC") {



      data = this.frm.get("EMP_IC_NEW")?.value;



    } else if (from == "OldIC") {



      data = this.frm.get("EMP_IC_OLD")?.value;



    } else if (from == "Passport") {



      data = this.frm.get("EMP_PASSPORT_NO")?.value;



    } else if (from == "SOCSONo") {



      data = this.frm.get("ESINumber")?.value;



    } else if (from == "EPFNo") {



      data = this.frm.get("PFAccountNumber")?.value;



    } else if (from == "BankAccount") {



      if (this.frm.get("BankName")?.value != "" && this.frm.get("BankAccountNumber")?.value != "") {



        data = this.frm.get("BankName")?.value + "//" + this.frm.get("BankAccountNumber")?.value;



        _trigger = true;



      } else {



        _trigger = false;



      }



    }







    if (_trigger) {



      this._employeeService.checkEmployeeInfo(from, data).subscribe((d: any) => {



        var result = d['Result'];



        result.EMP_ID = result?.EMP_ID == 0 ? -1 : result?.EMP_ID;



        if (result?.EMP_ID != this.empId) {



          this.empChkError[from] = result?.MESSAGE;



          this.employeeCheckInfoValidation = result?.MESSAGE == "success";



        }



      })



    }



  }







  maritalStatusChange(event: any) {



    if (event.value == "Married") {



      this.frm.get("EMP_NO_CHILD")?.enable({ onlySelf: true });



    } else {



      this.frm.get("EMP_NO_CHILD")?.disable({ onlySelf: true });



    }



  }







  // Bank selection handler



  onBankChange(bankCode: string) {



    const selectedBank = this.indianBanks.find(bank => bank.code === bankCode);



    if (selectedBank) {



      this.frm.get('BankName')?.setValue(selectedBank.name);



      this.frm.get('BankIFSC')?.setValue(selectedBank.ifsc);



      this.checkEmployeeInfo('BankAccount');



    }



  }







  // Salary group change handler



  onSalaryGroupChange(group: string) {



    this.frm.get('SalaryGroup')?.setValue(group);



    // Add logic for salary group specific validations or calculations



  }







  showSpinner() {



    this.showLoadingSpinner = true;



  }







  hideSpinner() {



    this.showLoadingSpinner = false;



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



    this.hideSpinner();



    return;



  }



  handleErrors(error: string) {



    if (error != null && error != '') {



      this.hideSpinner();



    }



  };







  openCommercialDetails() {



    const dialogRef = this.dialog.open(CommercialBreakdownEnhancedDialogComponent, {



      width: '1200px',



      data: {



        Basic: this.frm.get('CB_Basic')?.value || 0,



        DA: this.frm.get('CB_DA')?.value || 0,



        HRA: this.frm.get('CB_HRA')?.value || 0,



        HRAPercentage: this.frm.get('CB_HRAPercentage')?.value || 0,



        Leaves: this.frm.get('CB_Leaves')?.value || 0,



        LeavesPercentage: this.frm.get('CB_LeavesPercentage')?.value || 0,



        OtherAllowances: this.frm.get('CB_OtherAllowances')?.value || 0,



        CB_NH: this.frm.get('CB_NH')?.value || 0,



        CB_NHPercentage: this.frm.get('CB_NHPercentage')?.value || 0,



        CB_AdvanceStatutoryBonus: this.frm.get('CB_AdvanceStatutoryBonus')?.value || 0,



        CB_AdvanceStatutoryBonusPercentage: this.frm.get('CB_AdvanceStatutoryBonusPercentage')?.value || 0



      }



    });







    dialogRef.afterClosed().subscribe(result => {



      if (result) {



        // Update the form with the new values



        this.frm.patchValue({



          CB_Basic: result.Basic || 0,



          CB_DA: result.DA || 0,



          CB_HRA: result.HRA || 0,



          CB_HRAPercentage: result.HRAPercentage || 0,



          CB_Leaves: result.Leaves || 0,



          CB_LeavesPercentage: result.LeavesPercentage || 0,



          CB_OtherAllowances: result.OtherAllowances || 0,



          CB_NH: result.CB_NH || 0,



          CB_NHPercentage: result.CB_NHPercentage || 0,



          CB_AdvanceStatutoryBonus: result.CB_AdvanceStatutoryBonus || 0,



          CB_AdvanceStatutoryBonusPercentage: result.CB_AdvanceStatutoryBonusPercentage || 0,



          CB_SubTotal: result.SubTotal || 0,



          // Update salary field to show CB_Basic value instead of slab data



          EMPPAY_BASIC_RATE: result.Basic || 0



        });



      }



    });



  }



}



