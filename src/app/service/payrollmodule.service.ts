import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from "@angular/common/http";

import { Injectable } from "@angular/core";

import { Observable, catchError, throwError } from "rxjs";

import { environment } from "src/environments/environment";

import { EmployeeMonthlyAdvance } from "../model/employeeMonthlyAdvance";

import { SalaryMonthlyAdvance } from "../model/salaryMonthlyAdvance";

import { InventoryCategory } from "../model/inventoryCategory";

import { ItemMasterModel } from "../model/itemMasterModel";

import { MiscTransModel } from "../model/miscTransModel";

import { AttendanceModel } from "../model/attendanceModel";

import { AttendanceDetails } from "../model/AttendanceDetails";

import { BankStatement } from "../model/BankStatement";



@Injectable({

  providedIn: 'root'

})

export class PayrollModuleService {

  apiUrl: string = environment.baseUrl;

  constructor(private httpClient: HttpClient) { }



  getEmployeeList(): Observable<any> {

    return this.httpClient.get<EmployeeMonthlyAdvance[]>(this.apiUrl + 'payroll/GetEmployeeList'

    ).pipe(catchError(this.errorHandle));

  }

  getEmployeeListBySalaryAdvance(transType: number, currentUser: string): Observable<any> {
    return this.httpClient.get<EmployeeMonthlyAdvance[]>(this.apiUrl + 'payroll/GetEmployeeListBySalaryAdvance', {
      params: { TransType: transType, currentUser: currentUser }
    }
    ).pipe(catchError(this.errorHandle));
  }

  getInventoryCategories(): Observable<any> {

    return this.httpClient.get<InventoryCategory[]>(this.apiUrl + 'payroll/GetInventoryCategories'

    ).pipe(catchError(this.errorHandle));

  }

  getEmployeeListByBranchCode(branchCode: string): Observable<any> {

    return this.httpClient.get<EmployeeMonthlyAdvance[]>(this.apiUrl + 'payroll/GetEmployeeListByBranchCode', {

      params: { branchCode: branchCode }

    }

    ).pipe(catchError(this.errorHandle));

  }

  getEmployeeListByAdvanceID(Id: number): Observable<any> {

    return this.httpClient.get<EmployeeMonthlyAdvance[]>(this.apiUrl + 'payroll/GetEmployeeListByAdvanceID', {

      params: { Id: Id }

    }

    ).pipe(catchError(this.errorHandle));

  }

  saveAndUpdateSalaryMonthlyAdvance(salaryAdvanceDetails: SalaryMonthlyAdvance): Observable<any> {
    console.log('[PayrollService] saveAndUpdateSalaryMonthlyAdvance called with:', salaryAdvanceDetails);
    console.log('[PayrollService] API URL:', this.apiUrl + 'payroll/SaveAndUpdateSalaryMonthlyAdvance');

    return this.httpClient.post<any[]>(this.apiUrl + 'payroll/SaveAndUpdateSalaryMonthlyAdvance',

      JSON.stringify(salaryAdvanceDetails),

      {

        headers: new HttpHeaders({

          'Content-type': 'application/json; charset=UTF-8'

        })

      }).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('[PayrollService] Error in saveAndUpdateSalaryMonthlyAdvance:', error);
          console.error('[PayrollService] Error status:', error.status);
          console.error('[PayrollService] Error message:', error.message);
          console.error('[PayrollService] Error body:', error.error);
          return this.errorHandle(error);
        })
      );

  }

  saveAndUpdateSalaryDailyAdvances(salaryAdvanceDetails: SalaryMonthlyAdvance[]): Observable<any> {

    return this.httpClient.post<any[]>(this.apiUrl + 'payroll/SaveAndUpdateSalaryDailyAdvances',

      JSON.stringify(salaryAdvanceDetails),

      {

        headers: new HttpHeaders({

          'Content-type': 'application/json; charset=UTF-8'

        })

      }).pipe(catchError(this.errorHandle));

  }

  getSalaryAdvanceById(employeeId: number, id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: `?employeeId=${employeeId}&id=${id}` }) };
    return this.httpClient.get<SalaryMonthlyAdvance>(this.apiUrl + 'payroll/GetSalaryAdvanceById', params
    ).pipe(catchError(this.errorHandle));
  }

  getEmployeeById(employeeId: number): Observable<any> {

    const params = { params: new HttpParams({ fromString: "?employeeId=" + employeeId }) };

    return this.httpClient.get<SalaryMonthlyAdvance>(this.apiUrl + 'payroll/GetEmployeeById', params

    ).pipe(catchError(this.errorHandle));

  }

  getListByEmplyeeType(advanceDate: string, branchCode: string, employeeType: number, transType: number, advanceAmount: number, race: string): Observable<any> {

    return this.httpClient.get<SalaryMonthlyAdvance[]>(this.apiUrl + 'payroll/GetListByEmplyeeType',

      { params: { advanceDate: advanceDate.toString(), branch: branchCode, employeeType: employeeType, transType: transType, advanceAmount: advanceAmount, race: race } }

    ).pipe(catchError(this.errorHandle));

  }

  getEmployeeAdvanceList(advanceDate: string, branchCode: string, employeeType: number, client: string, transType: number, advanceAmount: number, race: string): Observable<any> {
    return this.httpClient.get<SalaryMonthlyAdvance[]>(this.apiUrl + 'payroll/GetEmployeeAdvanceList',
      { params: { advanceDate: advanceDate.toString(), branch: branchCode, employeeType: employeeType, client: client, transType: transType, advanceAmount: advanceAmount, race: race } }
    ).pipe(catchError(this.errorHandle));
  }

  getPaySheetData(loginId: string, branch: string, period: string, employeeType: string, employee: string, lang: string): Observable<any> {
    const params = new HttpParams()
      .set('LoginID', loginId)
      .set('Branch', branch)
      .set('Period', period)
      .set('EmployeeType', employeeType)
      .set('Employee', employee)
      .set('Lang', lang);

    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetPaySheetData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getNewVoucherNumber(transType: number): Observable<any> {

    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetNewVoucherNumberAsync', {

      params: { transType: transType }

    }).pipe(catchError(this.errorHandle));

  }

  getSalaryProcessDate(employeeID: number, year: number, month: number): Observable<boolean> {

    return this.httpClient.get<boolean>(this.apiUrl + 'payroll/GetSalaryProcessDateByEmployeeID', {

      params: { employeeID: employeeID.toString(), year: year.toString(), month: month.toString() }

    }).pipe(catchError(this.errorHandle));

  }

  getResignDateByEmployeeID(employeeID: number): Observable<Date> {

    return this.httpClient.get<Date>(this.apiUrl + 'payroll/GetResignDate', {

      params: { employeeID: employeeID.toString() }

    }).pipe(catchError(this.errorHandle));

  }

  getUniformItemRows(advanceId: number, category: number): Observable<ItemMasterModel[]> {

    return this.httpClient.get<ItemMasterModel[]>(this.apiUrl + 'payroll/GetUniformItemRows', {

      params: { AdvanceID: advanceId.toString(), Category: category.toString() }

    })

      .pipe(catchError(this.errorHandle));

  }



  getMiscTransList(): Observable<MiscTransModel[]> {

    return this.httpClient.get<MiscTransModel[]>(this.apiUrl + 'payroll/GetMiscTrans');

  }



  getMiscTransById(id: number): Observable<any> {

    return this.httpClient.get<MiscTransModel>(this.apiUrl + 'payroll/GetMiscTransById', {

      params: { id: id }

    });

  }

  saveAndUpdateMiscTrans(miscTrans: MiscTransModel): Observable<any> {

    return this.httpClient.post<any[]>(this.apiUrl + 'payroll/SaveAndUpdateMiscTrans',

      JSON.stringify(miscTrans),

      {

        headers: new HttpHeaders({

          'Content-type': 'application/json; charset=UTF-8'

        })

      }).pipe(catchError(this.errorHandle));

  }

  deleteMiscTrans(id: number): Observable<void> {

    return this.httpClient.get<void>(this.apiUrl + 'payroll/DeleteMiscTransById', {

      params: { id: id }

    });

  }

  getDailyAdvanceList(advanceDate: Date, employeeID: number, advanceType: number): Observable<any[]> {

    const formattedDate = advanceDate.toISOString().split('T')[0];

    return this.httpClient.get<any[]>(this.apiUrl + 'payroll/GetDailyAdvanceList', {

      params: { advanceDate: formattedDate, employeeID: employeeID, advanceType: advanceType }

    }).pipe(catchError(this.errorHandle));

  }

  getClients(advanceDate: string, branchCode: string): Observable<any> {

    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetClients', {

      params: { period: advanceDate, branchCode: branchCode }

    }).pipe(catchError(this.errorHandle));

  }

  getClientsByBranchID(branch: string, currentUser: string): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetClientsByBranchID', {
      params: { branch: branch, currentUser: currentUser }
    }).pipe(catchError(this.errorHandle));
  }

  getEmployeeDetails(branchCode: string, employeeNo: string): Observable<any> {

    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetEmployeeDetails', {

      params: { branchCode: branchCode.toString(), employeeNo: employeeNo }

    })

      .pipe(catchError(this.errorHandle));

  }

  calculateAge(birthDate: Date): Observable<any> {
    if (!birthDate) {
      return new Observable(observer => { observer.next(null); observer.complete(); });
    }
    return this.httpClient.get<any>(this.apiUrl + 'payroll/CalculateAge', {
      params: { birthDate: birthDate.toString() }
    })
      .pipe(catchError(this.errorHandle));
  }

  attendanceByEmployeeID(dtAdvanceDate: string, id: number): Observable<any> {

    return this.httpClient.get<AttendanceModel>(this.apiUrl + 'payroll/AttendanceByEmployeeID', {

      params: { period: dtAdvanceDate, employeeID: id }

    });

  }

  attendanceDetailsByID(id: number): Observable<any> {

    return this.httpClient.get<any[]>(this.apiUrl + 'payroll/AttendanceDetailsByID', {

      params: { Id: id }

    });

  }

  getAnnualLeave(employeeID: number, advanceDate: Date): Observable<any> {

    const formattedDate = advanceDate.toISOString().split('T')[0];

    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetAnnualLeave', {

      params: { employeeID: employeeID, Period: formattedDate.toString() }

    }).pipe(catchError(this.errorHandle));

  }

  getMedicalLeave(employeeID: number, advanceDate: Date): Observable<any> {

    const formattedDate = advanceDate.toISOString().split('T')[0];

    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetMedicalLeave', {

      params: { employeeID: employeeID, Period: formattedDate }

    }).pipe(catchError(this.errorHandle));

  }

  getMaternityLeave(employeeID: number, advanceDate: Date): Observable<any> {

    const formattedDate = advanceDate.toISOString().split('T')[0];

    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetMaternityLeave', {

      params: { employeeID: employeeID, Period: formattedDate }

    }).pipe(catchError(this.errorHandle));

  }

  getPaternityLeave(employeeID: number, advanceDate: Date): Observable<any> {

    const formattedDate = advanceDate.toISOString().split('T')[0];

    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetPaternityLeave', {

      params: { employeeID: employeeID, Period: formattedDate }

    }).pipe(catchError(this.errorHandle));

  }

  getHospitalizationLeave(employeeID: number, advanceDate: Date): Observable<any> {

    const formattedDate = advanceDate.toISOString().split('T')[0];

    return this.httpClient.get<any>(this.apiUrl + 'payroll/GetHospitalizationLeave', {

      params: { employeeID: employeeID, Period: formattedDate }

    }).pipe(catchError(this.errorHandle));

  }



  saveAndUpdateAttendance(attendanceModel: AttendanceModel, attendanceDetails: any[]): Observable<any> {

    const payload = {

      attendanceModel: attendanceModel,

      attendanceDetails: attendanceDetails

    };



    return this.httpClient.post<any>(this.apiUrl + 'payroll/SaveAndUpdateAttendance',

      JSON.stringify(payload),

      {

        headers: new HttpHeaders({

          'Content-type': 'application/json; charset=UTF-8'

        })

      }).pipe(catchError(this.errorHandle));

  }

  deleteAttendance(id: number): Observable<any> {

    return this.httpClient.delete<any>(this.apiUrl + 'payroll/DeleteAttendance', {

      params: { id: id }

    });

  }

  getList(branch: string, employeeType: number, resignedDate: string, joinDate: string, attendancePeriod: string, status: string): Observable<any> {

    return this.httpClient.get<SalaryMonthlyAdvance[]>(this.apiUrl + 'payroll/GetList',

      { params: { branch: branch, employeeType: employeeType, resignedDate: resignedDate, joinDate: joinDate, attendancePeriod: attendancePeriod, status: status } }

    ).pipe(catchError(this.errorHandle));

  }

  getListByEmployee(branch: string, employeeType: string, resignedDate: string, joinDate: string, status: string): Observable<any> {

    return this.httpClient.get<SalaryMonthlyAdvance[]>(this.apiUrl + 'payroll/getListByEmployee',

      { params: { branch: branch, employeeType: employeeType, resignedDate: resignedDate, joinDate: joinDate, status: status } }

    ).pipe(catchError(this.errorHandle));

  }

  getLastprocessedDate(branchCode: string, employeeType: string): Observable<any> {

    return this.httpClient.get<any>(this.apiUrl + 'payroll/LastprocessedDate', {

      params: { branchCode: branchCode, employeeType: employeeType }

    }).pipe(catchError(this.errorHandle));

  }



  getLastSalaryProcessRemarks(period: string, branchCode: string, employeeType: string): Observable<any> {

    return this.httpClient.get<any>(this.apiUrl + 'payroll/LastSalaryProcessRemarks', {

      params: { period: period, branchCode: branchCode, employeeType: employeeType }

    }).pipe(catchError(this.errorHandle));

  }

  getAttendanceByDate(date: string, branch: string): Observable<any[]> {
    return this.httpClient.get<any[]>(this.apiUrl + 'payroll/GetAttendanceByDate', {
      params: {
        attendanceDate: date,
        branch: branch || 'ALL'
      }
    }).pipe(catchError(this.errorHandle));
  }

  getEmployeeAttendanceList(period: string, branch: string): Observable<any[]> {

    // Call .NET API for attendance data (stored in .NET database)

    // Use the period directly as YYYY-MM-DD format (no timezone conversion)

    return this.httpClient.get<any[]>(this.apiUrl + 'payroll/GetEmployeeAttendanceList', {

      params: {

        period: period,

        branch: branch || 'MAIN'

      }

    }).pipe(catchError(this.errorHandle));

  }

  // Keep the original .NET method for compatibility

  getEmployeeAttendanceListNet(period: string, branch: string): Observable<any[]> {

    return this.httpClient.get<any[]>(this.apiUrl + 'payroll/GetEmployeeAttendanceList', {

      params: { period: period, branch: branch }

    }).pipe(catchError(this.errorHandle));

  }

  getTodayAttendanceList(branch: string = 'ALL'): Observable<any[]> {

    return this.httpClient.get<any[]>(this.apiUrl + 'payroll/GetTodayAttendanceList', {

      params: { branch: branch }

    }).pipe(catchError(this.errorHandle));

  }

  getIsSalaryProcessDoneForCurrentPeriod(branchCode: string, employeeType: string, period: string): Observable<boolean> {

    return this.httpClient.get<boolean>(this.apiUrl + 'payroll/IsSalaryProcessDoneForCurrentPeriod', {

      params: { branch: branchCode, employeeType: employeeType, dtPeriod: period }

    }).pipe(catchError(this.errorHandle));

  }

  getIsTemporaryEmployee(employeeCode: string): Observable<boolean> {

    return this.httpClient.get<boolean>(this.apiUrl + 'payroll/IsTemporaryEmployee', {

      params: { employeeCode: employeeCode }

    });

  }

  salaryProcess(branch: string, employeeType: string, remarks: string, period: string, lockProcess: boolean, currentUser: string, companyCode: string): Observable<any> {

    return this.httpClient.get<any>(this.apiUrl + 'payroll/Process', {

      params: { branch: branch, employeeType: employeeType, remarks: remarks, period: period, lockProcess: lockProcess, currentUser: currentUser, companyCode: companyCode }

    }).pipe(catchError(this.errorHandle));

  }

  // Method 1: GetListWithBlankRow(dtSalaryPeriod)

  getListWithBlankRow(dtSalaryPeriod: string): Observable<BankStatement[]> {

    const params = new HttpParams().set('dtSalaryPeriod', dtSalaryPeriod);

    return this.httpClient.get<BankStatement[]>(`${this.apiUrl}payroll/WithBlankRow`, { params });

  }



  // Method 2: GetListWithBlankRow(dtSalaryPeriod, Branch)

  getListWithBlankRowWithBranch(

    dtSalaryPeriod: string,

    branch: string

  ): Observable<BankStatement[]> {

    const params = new HttpParams()

      .set('dtSalaryPeriod', dtSalaryPeriod)

      .set('Branch', branch);

    return this.httpClient.get<BankStatement[]>(`${this.apiUrl}payroll/WithBlankRowByBranch`, { params });

  }



  // Method 3: GetListWithBlankRow(dtSalaryPeriod, Branch, EmployeeType)

  getListWithBlankRowWithBranchAndEmployeeType(

    dtSalaryPeriod: string,

    branch: string,

    employeeType: string

  ): Observable<BankStatement[]> {

    const params = new HttpParams()

      .set('dtSalaryPeriod', dtSalaryPeriod)

      .set('Branch', branch)

      .set('EmployeeType', employeeType);

    return this.httpClient.get<BankStatement[]>(`${this.apiUrl}payroll/WithBlankRowByBranchAndEmployeeType`, { params });

  }



  // Method 4: GetListWithBlankRow(dtSalaryPeriod, Branch, EmployeeType, Bank)

  getListWithBlankRowWithAllParams(

    dtSalaryPeriod: string,

    branch: string,

    employeeType: string,

    bank: string

  ): Observable<BankStatement[]> {

    const params = new HttpParams()

      .set('dtSalaryPeriod', dtSalaryPeriod)

      .set('Branch', branch)

      .set('EmployeeType', employeeType)

      .set('Bank', bank);

    return this.httpClient.get<BankStatement[]>(`${this.apiUrl}payroll/WithBlankRowByBranchEmployeeTypeAndBank`, { params });

  }



  getEPFToExcel(branch: string, dtSalaryPeriod: string, employeeType: string): Observable<any[]> {

    const params = new HttpParams()

      .set('branch', encodeURIComponent(branch))

      .set('dtSalaryPeriod', encodeURIComponent(dtSalaryPeriod))

      .set('employeeType', encodeURIComponent(employeeType));



    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetEPFToExcel`, { params })

      .pipe(catchError(this.errorHandle));

  }

  getRbiBankSalaryExport(dtSalaryPeriod: string, branch: string, employeeType: string): Observable<any[]> {
    const params = new HttpParams()
      .set('dtSalaryPeriod', encodeURIComponent(dtSalaryPeriod))
      .set('branch', encodeURIComponent(branch))
      .set('employeeType', encodeURIComponent(employeeType));

    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetRbiBankSalaryExport`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getRbiBankSalaryExportCsv(dtSalaryPeriod: string, branch: string, employeeType: string): Observable<Blob> {
    const params = new HttpParams()
      .set('dtSalaryPeriod', encodeURIComponent(dtSalaryPeriod))
      .set('branch', encodeURIComponent(branch))
      .set('employeeType', encodeURIComponent(employeeType));

    return this.httpClient.get(`${this.apiUrl}payroll/GetRbiBankSalaryExportCsv`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(this.errorHandle));
  }

  getRbiBankAdvanceExport(dtSalaryPeriod: string, branch: string, employeeType: string): Observable<any[]> {
    const params = new HttpParams()
      .set('dtSalaryPeriod', encodeURIComponent(dtSalaryPeriod))
      .set('branch', encodeURIComponent(branch))
      .set('employeeType', encodeURIComponent(employeeType));

    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetRbiBankAdvanceExport`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getRbiBankAdvanceExportCsv(dtSalaryPeriod: string, branch: string, employeeType: string): Observable<Blob> {
    const params = new HttpParams()
      .set('dtSalaryPeriod', encodeURIComponent(dtSalaryPeriod))
      .set('branch', encodeURIComponent(branch))
      .set('employeeType', encodeURIComponent(employeeType));

    return this.httpClient.get(`${this.apiUrl}payroll/GetRbiBankAdvanceExportCsv`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(this.errorHandle));
  }

  getSOCSOToExcel(dtSalaryPeriod: string, branch: string): Observable<any[]> {

    const params = new HttpParams()

      .set('dtSalaryPeriod', dtSalaryPeriod)

      .set('Branch', branch)

    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetEmployeeSocsoList`, { params });

  }

  getSIPToExcel(companyCode: string, SSM: string, dtSalaryPeriod: string, branch: string): Observable<any[]> {

    const params = new HttpParams()

      .set('CompanyCode', companyCode)

      .set('SSM', SSM)

      .set('dtSalaryPeriod', dtSalaryPeriod)

      .set('Branch', branch)

    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetEmployeeSIPList`, { params });

  }



  getConfig(KeyValue: string, branch: string): Observable<any[]> {

    const params = new HttpParams()

      .set('KeyValue', KeyValue)

      .set('Branch', branch)

    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetConfig`, { params });

  }

  // Service method for GetEPFToCIMBList

  getEPFToCIMBList(branch: string, period: string, employeeType: string, companyEPF: string, companyPIC: string, companyPICContact: string): Observable<string[]> {

    const params = new HttpParams()

      .set('Branch', branch)

      .set('Period', period)

      .set('EmployeeType', employeeType)

      .set('CompanyEPF', companyEPF)

      .set('CompanyPIC', companyPIC)

      .set('CompanyPICContact', companyPICContact);



    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetEPFToCIMBList`, { params });

  }



  // Service method for GetSocsoToCIMBList

  getSocsoToCIMBList(companyRegNumber: string, socsoCompanyCode: string, branch: string, period: string, employeeType: string): Observable<string[]> {

    const params = new HttpParams()

      .set('CompanyRegNumber', companyRegNumber)

      .set('SocsoCompanyCode', socsoCompanyCode)

      .set('Branch', branch)

      .set('Period', period)

      .set('EmployeeType', employeeType);



    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetSocsoToCIMBList`, { params });

  }



  // Service method for GetSIPToCIMBList

  getSIPToCIMBList(companyRegNumber: string, sipCompanyCode: string, branch: string, period: string, employeeType: string): Observable<string[]> {

    const params = new HttpParams()

      .set('CompanyRegNumber', companyRegNumber)

      .set('SIPCompanyCode', sipCompanyCode)

      .set('Branch', branch)

      .set('Period', period)

      .set('EmployeeType', employeeType);



    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetSIPToCIMBList`, { params });

  }



  getEmployeeSalaryAdvanceList(period: string, employeeType: string, bankCode: string, type: string,

    company: string, source: string): Observable<string[]> {

    const params = new HttpParams()

      .set('period', period)

      .set('employeeType', employeeType)

      .set('bankCode', bankCode)

      .set('type', type)

      .set('company', company)

      .set('source', source);



    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetEmployeeSalarynAdvanceList`, { params });

  }



  getEmployeeSalaryAdvanceListWithBranch(branch: string, period: string, employeeType: string, bankCode: string,

    type: string, company: string, source: string): Observable<string[]> {

    const params = new HttpParams()

      .set('branch', branch)

      .set('period', period)

      .set('employeeType', employeeType)

      .set('bankCode', bankCode)

      .set('type', type)

      .set('company', company)

      .set('source', source);



    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetEmployeeSalarynAdvanceListWithBranch`, { params });

  }



  getEmployeeSalaryAdvanceTotalList(period: string, employeeType: string, bankCode: string, type: string,

    company: string, source: string): Observable<string[]> {

    const params = new HttpParams()

      .set('period', period)

      .set('employeeType', employeeType)

      .set('bankCode', bankCode)

      .set('type', type)

      .set('company', company)

      .set('source', source);



    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetEmployeeSalarynAdvanceTotalList`, { params });
  }

  getEmployeeSalaryAdvanceTotalListWithBranch(branch: string, period: string, employeeType: string, bankCode: string,
    type: string, company: string, source: string): Observable<string[]> {

    const params = new HttpParams()
      .set('branch', branch)
      .set('period', period)
      .set('employeeType', employeeType)
      .set('bankCode', bankCode)
      .set('type', type)
      .set('company', company)
      .set('source', source);

    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetEmployeeSalarynAdvanceTotalListWithBranch`, { params });
  }

  // Dynamic Payslip Data Methods
  getPayslipData(loginId: string, branch: string, period: string, employeeType: string, employee: string, lang: string): Observable<any> {
    const params = new HttpParams()
      .set('LoginID', loginId)
      .set('Branch', branch)
      .set('Period', period)
      .set('EmployeeType', employeeType)
      .set('Employee', employee)
      .set('Lang', lang);

    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetPayslipData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getPayslip2Data(loginId: string, branch: string, period: string, employeeType: string, employee: string, lang: string): Observable<any> {
    const params = new HttpParams()
      .set('LoginID', loginId)
      .set('Branch', branch)
      .set('Period', period)
      .set('EmployeeType', employeeType)
      .set('Employee', employee)
      .set('Lang', lang);

    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetPayslip2Data`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getNewPayslipData(loginId: string, branch: string, period: string, employeeType: string, employee: string, lang: string): Observable<any> {
    const params = new HttpParams()
      .set('LoginID', loginId)
      .set('Branch', branch)
      .set('Period', period)
      .set('EmployeeType', employeeType)
      .set('Employee', employee)
      .set('Lang', lang);

    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetNewPayslipData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getTimeSheetData(loginId: string, branch: string, period: string, employeeType: string, employee: string, lang: string): Observable<any> {
    const params = new HttpParams()
      .set('LoginID', loginId)
      .set('Branch', branch)
      .set('Period', period)
      .set('EmployeeType', employeeType)
      .set('Employee', employee)
      .set('Lang', lang);

    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetTimeSheetData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getGuard1PayslipData(loginId: string, branch: string, period: string, employeeType: string, employee: string, lang: string): Observable<any> {
    const params = new HttpParams()
      .set('LoginID', loginId)
      .set('Branch', branch)
      .set('Period', period)
      .set('EmployeeType', employeeType)
      .set('Employee', employee)
      .set('Lang', lang);

    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetGuard1PayslipData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getGuard2PayslipData(loginId: string, branch: string, period: string, employeeType: string, employee: string, lang: string): Observable<any> {
    const params = new HttpParams()
      .set('LoginID', loginId)
      .set('Branch', branch)
      .set('Period', period)
      .set('EmployeeType', employeeType)
      .set('Employee', employee)
      .set('Lang', lang);

    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetGuard2PayslipData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getRBAPayslipData(loginId: string, branch: string, period: string, employeeType: string, employee: string, lang: string): Observable<any> {
    const params = new HttpParams()
      .set('LoginID', loginId)
      .set('Branch', branch)
      .set('Period', period)
      .set('EmployeeType', employeeType)
      .set('Employee', employee)
      .set('Lang', lang);

    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetRBAPayslipData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getBankSalaryStatementData(loginId: string, branch: string, period: string, employeeType: string, bankCode: string): Observable<any> {
    const params = new HttpParams()
      .set('LoginID', loginId)
      .set('Branch', branch)
      .set('Period', period)
      .set('EmployeeType', employeeType)
      .set('BankCode', bankCode);

    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetBankSalaryStatementData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getAdvanceReportData(loginId: string, branch: string, period: string, employeeType: string): Observable<any> {
    const params = new HttpParams()
      .set('LoginID', loginId)
      .set('Branch', branch)
      .set('Period', period)
      .set('EmployeeType', employeeType);

    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetAdvanceReportData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getLoanLedgerData(loginId: string, branch: string, period: string, employeeType: string): Observable<any> {
    const params = new HttpParams()
      .set('LoginID', loginId)
      .set('Branch', branch)
      .set('Period', period)
      .set('EmployeeType', employeeType);

    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetLoanLedgerData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getEmployeeSalaryAdvanceHashTotalList(period: string, employeeType: string, bankCode: string, type: string,

    company: string, source: string): Observable<string[]> {

    const params = new HttpParams()

      .set('period', period)

      .set('employeeType', employeeType)

      .set('bankCode', bankCode)

      .set('type', type)

      .set('company', company)

      .set('source', source);



    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetEmployeeSalarynAdvanceHashTotalList`, { params });

  }



  getEmployeeSalaryAdvanceHashTotalListWithBranch(branch: string, period: string, employeeType: string, bankCode: string,

    type: string, company: string, source: string): Observable<string[]> {

    const params = new HttpParams()

      .set('branch', branch)

      .set('period', period)

      .set('employeeType', employeeType)

      .set('bankCode', bankCode)

      .set('type', type)

      .set('company', company)

      .set('source', source);



    return this.httpClient.get<string[]>(`${this.apiUrl}payroll/GetEmployeeSalarynAdvanceHashTotalListWithBranch`, { params });

  }



  clientInvoiceCalculation(branch: string, client: string, agreementPeriod: string): Observable<any> {

    const url = `${this.apiUrl}payroll/ClientInvoiceCalculation`;

    return this.httpClient.get<any>(url, {

      params: { branch, client, agreementPeriod },

    });

  }



  getMonthlyInvoiceStatusList(

    startDate: string,

    endDate: string,

    branch: string

  ): Observable<BankStatement[]> {

    const params = new HttpParams()

      .set('Start', startDate)

      .set('End', endDate)

      .set('Branch', branch);

    return this.httpClient.get<BankStatement[]>(`${this.apiUrl}payroll/GetMonthlyInvoiceStatusList`, { params });

  }



  // New methods for attendance display

  getAttendanceDetails(attendanceId: number): Observable<AttendanceDetails[]> {

    return this.httpClient.get<AttendanceDetails[]>(this.apiUrl + 'payroll/GetAttendanceDetails', {

      params: { attendanceId: attendanceId }

    }).pipe(catchError(this.errorHandle));

  }



  // New method for checking advance

  checkExistAdvance(employeeId: number, advanceDate: string, loanType: number): Observable<boolean> {

    const params = new HttpParams()

      .set('employeeId', employeeId.toString())

      .set('advanceDate', encodeURIComponent(advanceDate))

      .set('loanType', loanType.toString());

    return this.httpClient.get<boolean>(`${this.apiUrl}payroll/CheckExistAdvance`, { params });

  }

  getEmployeeNo(employeeId: number): Observable<any> {

    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetEmployeeNo/${employeeId}`);

  }



  getAdvanceVoucherNo(branch: string, transType: string): Observable<any> {

    const params = new HttpParams()

      .set('Branch', branch)

      .set('TransType', transType);

    return this.httpClient.get<any>(`${this.apiUrl}payroll/NewAdvanceVoucherNo`, { params });

  }



  getSalaryAdvances(advanceDate: string, employeeId: string, transType: string): Observable<any> {

    const params = new HttpParams()

      .set('advanceDate', advanceDate)

      .set('employeeId', employeeId)

      .set('transType', transType);



    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetSalaryAdvances`, { params });

  }

  deleteSalaryAdvance(id: number, currentUser: string): Observable<any> {

    return this.httpClient.delete(`${this.apiUrl}payroll/Delete/${id}`, {

      params: { currentUser },

    });

  }


  getEmployeeLoanList(period: string, branch: string, employeeType: string, transType: number): Observable<any[]> {

    let params = new HttpParams()

      .set('Period', period) // ISO format for DateTime

      .set('Branch', branch)

      .set('EmployeeType', employeeType)

      .set('TransType', transType.toString());



    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetEmployeeLoanList`, { params })

      .pipe(catchError(this.errorHandle));

  }

  getEmployeeLoanById(id: number, transType: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetEmployeeLoanById?id=${id}&transType=${transType}`);
  }

  getVoucherDetailsByFilter(branch: string, period: string, employeeType: string, bankCode: string, paymentType: string, voucherType: string): Observable<any[]> {

    let params = new HttpParams()

      .set('branch', branch)

      .set('period', period)

      .set('employeeType', employeeType)

      .set('bankCode', bankCode)

      .set('paymentType', paymentType)

      .set('voucherType', voucherType);



    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetVoucherDetailsByFilter`, { params })

      .pipe(catchError(this.errorHandle));

  }

  getLatestAttendancePeriod(employeeId: number, year: number, month: number): Observable<string> {

    return this.httpClient.get<string>(

      `${this.apiUrl}payroll/latest-period?employeeId=${employeeId}&year=${year}&month=${month}`

    ).pipe(catchError(this.errorHandle));

  }



  // Compliance Report API Methods

  getESIStatementData(branch: string, period: string, employeeType: string): Observable<any[]> {
    const params = new HttpParams()
      .set('branch', branch)
      .set('period', period)
      .set('employeeType', employeeType);
    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetESIStatementData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getProfessionalTaxStatementData(branch: string, period: string, employeeType: string, state: string): Observable<any[]> {
    const params = new HttpParams()
      .set('branch', branch)
      .set('period', period)
      .set('employeeType', employeeType)
      .set('state', state);
    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetProfessionalTaxStatementData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getPFStatementData(branch: string, period: string, employeeType: string): Observable<any[]> {
    const params = new HttpParams()
      .set('branch', branch)
      .set('period', period)
      .set('employeeType', employeeType);
    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetPFStatementData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getNonComplianceData(branch: string, period: string, reportType: string, severity?: string, status?: string): Observable<any[]> {
    let params = new HttpParams()
      .set('branch', branch)
      .set('period', period)
      .set('reportType', reportType);
    if (severity) params = params.set('severity', severity);
    if (status) params = params.set('status', status);
    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetNonComplianceData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getComplianceSummary(branch: string, period: string): Observable<any> {
    const params = new HttpParams()
      .set('branch', branch)
      .set('period', period);
    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetComplianceSummary`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getStatutoryComplianceData(branch: string, period: string, reportType: string): Observable<any[]> {
    const params = new HttpParams()
      .set('branch', branch)
      .set('period', period)
      .set('reportType', reportType);
    return this.httpClient.get<any[]>(`${this.apiUrl}payroll/GetStatutoryComplianceData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getComplianceDashboard(branch: string, period: string): Observable<any> {
    const params = new HttpParams()
      .set('branch', branch)
      .set('period', period);
    return this.httpClient.get<any>(`${this.apiUrl}payroll/GetComplianceDashboard`, { params })
      .pipe(catchError(this.errorHandle));
  }

  updateComplianceStatus(complianceId: number, status: string, remarks: string, currentUser: string): Observable<any> {
    const params = new HttpParams()
      .set('complianceId', complianceId.toString())
      .set('status', status)
      .set('remarks', remarks)
      .set('currentUser', currentUser);
    return this.httpClient.post<any>(`${this.apiUrl}payroll/UpdateComplianceStatus`, {}, { params })
      .pipe(catchError(this.errorHandle));
  }

  generateComplianceReport(branch: string, period: string, reportType: string, format: string): Observable<Blob> {
    const params = new HttpParams()
      .set('branch', branch)
      .set('period', period)
      .set('reportType', reportType)
      .set('format', format);
    return this.httpClient.get(`${this.apiUrl}payroll/GenerateComplianceReport`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(this.errorHandle));
  }

  // Bulk Attendance Upload Methods (Old detailed format - kept for backward compatibility)
  downloadAttendanceTemplate(period: Date, branchCode: string): Observable<Blob> {
    const params = new HttpParams()
      .set('period', period.toISOString())
      .set('branchCode', branchCode);
    return this.httpClient.get(`${this.apiUrl}payroll/DownloadAttendanceTemplate`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(this.errorHandle));
  }

  uploadAttendanceExcel(formData: FormData): Observable<any> {
    return this.httpClient.post(`${this.apiUrl}payroll/UploadAttendanceExcel`, formData)
      .pipe(catchError(this.errorHandle));
  }

  bulkUploadAttendance(attendanceData: any[]): Observable<any> {
    return this.httpClient.post(`${this.apiUrl}payroll/BulkUploadAttendance`, attendanceData)
      .pipe(catchError(this.errorHandle));
  }

  // Simplified Bulk Attendance Upload Methods (PDF-style format with P, W/O, H, L, NH codes)
  downloadSimplifiedAttendanceTemplate(period: Date, branchCode: string): Observable<Blob> {
    const params = new HttpParams()
      .set('period', period.toISOString())
      .set('branchCode', branchCode);
    return this.httpClient.post(`${this.apiUrl}payroll/GenerateSimplifiedAttendanceTemplate`, null, {
      params,
      responseType: 'blob'
    });
  }

  uploadSimplifiedAttendance(file: File, currentUser: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('currentUser', currentUser);
    return this.httpClient.post(`${this.apiUrl}payroll/UploadSimplifiedAttendance`, formData);
  }

  exportAttendanceData(period: Date, branchCode: string): Observable<Blob> {
    const params = new HttpParams()
      .set('period', period.toISOString())
      .set('branchCode', branchCode);
    return this.httpClient.get(`${this.apiUrl}payroll/ExportAttendanceData`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(this.errorHandle));
  }

  validateAttendanceData(period: Date, branchCode: string): Observable<any> {
    const params = new HttpParams()
      .set('period', period.toISOString())
      .set('branchCode', branchCode);
    return this.httpClient.get(`${this.apiUrl}payroll/ValidateAttendanceData`, { params })
      .pipe(catchError(this.errorHandle));
  }

  getBranchList(): Observable<any> {
    return this.httpClient.get(`${this.apiUrl}master/GetBranchMasterAll`)
      .pipe(catchError(this.errorHandle));
  }



  //to handle got any error from server response

  private errorHandle(error: HttpErrorResponse) {

    let errorMessage: string = '';

    if (error.error instanceof ErrorEvent) {

      // A client-side or network error occurred. Handle it accordingly.

      errorMessage = `An error occurred Cleint side: ${error.error}`;

    } else {

      // The backend returned an unsuccessful response code.

      //errorMessage = `An error occurred Server side: ${error.status}, body was: ${error.error}`;

    }

    // Return an observable with a user-facing error message.

    errorMessage += '\n This is the problem with service. We are notified & working on it. Please try again later..';

    return throwError(errorMessage);

  }

}
