import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BranchModel } from '../model/branchModel';
import { ClientModel } from '../model/clientModel';
import { ShiftModel } from '../model/shiftModel';
import { SIPModel } from '../model/SIPModel';
import { EPFModel } from '../model/epfModel';
import { SalaryStructure } from '../model/salaryStructure';
import { LeaveSystem } from '../model/leaveSystemModel';
import { SOCSO } from '../model/socsoModel';
import { IncomeTaxModel } from '../model/incomeTaxModel';
import { PFConfiguration } from '../model/indian-compliance.model';
import { ESIConfiguration } from '../model/indian-compliance.model';
import { ProfessionalTaxConfiguration } from '../model/indian-compliance.model';
import { TDSSlabConfiguration } from '../model/indian-compliance.model';
import { GSTConfiguration } from '../model/indian-compliance.model';
import { ServiceCategory } from '../model/indian-compliance.model';
import { ContractorTDSSlab } from '../model/indian-compliance.model';
import { StateMaster } from '../model/indian-compliance.model';
import { BillingCycle } from '../model/indian-compliance.model';
import { InvoiceFormat } from '../model/indian-compliance.model';

@Injectable({
  providedIn: 'root'
})
export class MastermoduleService {
  apiUrl: string = environment.baseUrl;
  constructor(private httpClient: HttpClient) { }

  getBranchMaster(branchCode: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?branchCode=" + branchCode }) };
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetBranchMaster', params
    ).pipe(catchError(this.errorHandle));
  }
  getBranchMasterList(): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetBranchMasterAll'
    ).pipe(catchError(this.errorHandle));
  }
  GetBranchListByUserName(userName: string): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetBranchListByUserName', {
      params: { userName: userName }
    }
    ).pipe(catchError(this.errorHandle));
  }

  GetBankListByUserName(userName: string): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'Register/GetBankListByUserId', {
      params: { name: userName }
    }
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateBranchMaster(branchDetails: BranchModel): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/saveAndUpdateBranchMaster',
      JSON.stringify(branchDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  //Delete branch master by ID
  deleteBranchMasterByCode(code: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?code=" + code }) };
    return this.httpClient.delete(this.apiUrl + 'master/DeleteBranchMasterByCode', params
    ).pipe(catchError(this.errorHandle));
  }

  getBranchMasterCode(): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'master/GetBranchMasterCode')
      .pipe(catchError(this.errorHandle));
  }

  // State filtering methods
  getBranchesByState(filter: any): Observable<any> {
    return this.httpClient.post<any>(this.apiUrl + 'master/branches-by-state', filter)
      .pipe(catchError(this.errorHandle));
  }

  getAllBranchStates(): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'master/all-branch-states')
      .pipe(catchError(this.errorHandle));
  }

  getBranchStateStatistics(): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'master/branch-state-statistics')
      .pipe(catchError(this.errorHandle));
  }
  getClienthMaster(clientCode: string, status: string): Observable<any> {
    return this.httpClient.get<ClientModel[]>(this.apiUrl + 'master/GetClientMsterList', {
      params: { clientCode: clientCode.toString(), status: status.toString() }
    }
    ).pipe(catchError(this.errorHandle));
  }

  getClientMsterListByStatus(status: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?status=" + status }) };
    return this.httpClient.get<any[]>(this.apiUrl + 'master/GetClientMsterListByStatus', params
    ).pipe(catchError(this.errorHandle));
  }

  getClientMsterListForAttendance(): Observable<any> {
    return this.httpClient.get<any[]>(this.apiUrl + 'master/GetClientMsterListForAttendance'
    ).pipe(catchError(this.errorHandle));
  }

  getClientMsterListByBranch(branchCode: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?branchCode=" + branchCode }) };
    return this.httpClient.get<any[]>(this.apiUrl + 'master/GetClientMsterListByBranch', params
    ).pipe(catchError(this.errorHandle));
  }

  getClientMasterListByComplianceStatus(branchCode: string, status: string): Observable<any> {
    const params = { 
      params: new HttpParams({ 
        fromString: "?branchCode=" + branchCode + "&status=" + status 
      }) 
    };
    return this.httpClient.get<any[]>(this.apiUrl + 'master/GetClientMasterListByComplianceStatus', params
    ).pipe(catchError(this.errorHandle));
  }

  saveAndUpdateClientMaster(clientDetails: ClientModel): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/SaveAndUpdateClientMaster',
      JSON.stringify(clientDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  //Delete client master by ID
  deleteClientMasterByCode(code: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?code=" + code }) };
    return this.httpClient.delete(this.apiUrl + 'master/DeleteClientMasterByCode', params
    ).pipe(catchError(this.errorHandle));
  }
  getNClientMasterCode(): Observable<any> {
    return this.httpClient.get<any>(this.apiUrl + 'master/GetNClientMasterCode')
      .pipe(catchError(this.errorHandle));
  }
  getShifthMasterList(): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetShiftMsterList'
    ).pipe(catchError(this.errorHandle));
  }

  saveAndUpdateShiftMaster(shiftDetails: ShiftModel): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/SaveAndUpdateShiftMaster',
      JSON.stringify(shiftDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteShiftMasterById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(this.apiUrl + 'master/DeleteShiftMasterById', params
    ).pipe(catchError(this.errorHandle));
  }


  getSIPhMaster(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetSIPMaster', params
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateSIPMaster(sipDetails: SIPModel): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/SaveAndUpdateSIPMaster',
      JSON.stringify(sipDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteSIPMasterById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(this.apiUrl + 'master/DeleteSIPMasterById', params
    ).pipe(catchError(this.errorHandle));
  }


  getEPFMaster(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.get<EPFModel[]>(this.apiUrl + 'master/GetEPFMaster', params
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateEPFMaster(epfDetails: EPFModel): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/SaveAndUpdateEPFMaster',
      JSON.stringify(epfDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteEPFMasterById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(this.apiUrl + 'master/DeleteEPFMasterById', params
    ).pipe(catchError(this.errorHandle));
  }

  getIncomeTaxMaster(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.get<IncomeTaxModel[]>(this.apiUrl + 'master/GetIncomeTaxMaster', params
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateIncomeTaxMaster(incomeTacDetails: IncomeTaxModel): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/saveAndUpdateIncomeTaxMaster',
      JSON.stringify(incomeTacDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteIncomeTaxMasterById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(this.apiUrl + 'master/DeleteIncomeTaxMasterById', params
    ).pipe(catchError(this.errorHandle));
  }


  getLeaveMaster(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.get<EPFModel[]>(this.apiUrl + 'master/GetLeaveMaster', params
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateLeaveMaster(epfDetails: LeaveSystem): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/saveAndUpdateLeaveMaster',
      JSON.stringify(epfDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteLeaveMasterById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(this.apiUrl + 'master/DeleteLeaveMasterById', params
    ).pipe(catchError(this.errorHandle));
  }


  getSOCSOMaster(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.get<SOCSO[]>(this.apiUrl + 'master/GetSOCSOMaster', params
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateSOCSOMaster(socsoDetails: SOCSO): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/SaveAndUpdateSOCSOMaster',
      JSON.stringify(socsoDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  deleteSOCSOMasterById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(this.apiUrl + 'master/DeleteSOCSOMasterById', params
    ).pipe(catchError(this.errorHandle));
  }

  getSalaryMaster(id: number, status: string): Observable<any> {
    return this.httpClient.get<SalaryStructure[]>(this.apiUrl + 'master/GetSalaryMaster', {
      params: { salaryId: id, status: status.toString() }
    }
    ).pipe(catchError(this.errorHandle));
  }
  getSalaryListByStatus(status: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?activeStatus=" + status }) };
    return this.httpClient.get<SalaryStructure[]>(this.apiUrl + 'master/GetSalaryListByStatus', params
    ).pipe(catchError(this.errorHandle));
  }
  saveAndUpdateSalaryMaster(salaryDetails: SalaryStructure): Observable<any> {
    return this.httpClient.post<any[]>(this.apiUrl + 'master/saveAndUpdateSalaryMaster',
      JSON.stringify(salaryDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }
  deleteSalaryMasterById(salaryId: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?salaryId=" + salaryId }) };
    return this.httpClient.delete(this.apiUrl + 'master/DeleteSalaryMasterById', params
    ).pipe(catchError(this.errorHandle));
  }

  getComplianceReportData(reportName: string, parameters: any): Observable<any> {
    const requestBody = {
      ReportName: reportName,
      Parameters: parameters
    };
    return this.httpClient.post(`${this.apiUrl}ComplianceReport/GetComplianceReportData`, requestBody)
      .pipe(catchError(this.errorHandle));
  }

  getUserAccessRights(userName: string, screenName: string): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'register/GetUserAccessRights', {
      params: { userName: userName, screenName: screenName }
    }
    ).pipe(catchError(this.errorHandle));
  }
  getKKDNListView(branch: string, kdnVetting: string): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetKKDNListView', {
      params: { branch: branch.toString(), kdnVetting: kdnVetting.toString() }
    }
    ).pipe(catchError(this.errorHandle));
  }
  getKKDNList(branch: string, Employeetype: string, dtDateJoinFrom: string, dtDateJoinTo: string, kdnVetting: string): Observable<any> {
    return this.httpClient.get<BranchModel[]>(this.apiUrl + 'master/GetKKDNList', {
      params: { branch: branch.toString(), Employeetype, dtDateJoinFrom: dtDateJoinFrom.toString(), dtDateJoinTo: dtDateJoinTo.toString(), kdnVetting: kdnVetting.toString() }
    }
    ).pipe(catchError(this.errorHandle));
  }
  getSuppliers(category?: string): Observable<any[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }

    return this.httpClient.get<any[]>(`${this.apiUrl}Finance/GetSuppliers`, { params });
  }
  getInventoryCategories(cat?: string): Observable<any[]> {
    let params = new HttpParams();
    if (cat) {
      params = params.set('cat', cat);
    }

    return this.httpClient.get<any[]>(`${this.apiUrl}Finance/GetInventoryCategories`, { params });
  }

  getMonthlyInvoices(invoiceStartPeriod: string, invoiceEndPeriod: string): Observable<any> {
    const params = new HttpParams()
      .set('invoiceStartPeriod', invoiceStartPeriod)
      .set('invoiceEndPeriod', invoiceEndPeriod);

    return this.httpClient.get(`${this.apiUrl}Finance/monthly-invoices`, { params });
  }

  getMonthlyInvoiceList(start: Date, end: Date): Observable<any> {
    const normalizeDate = (d: Date) => {
      const onlyDate = new Date(d);
      onlyDate.setHours(0, 0, 0, 0);
      return onlyDate.toISOString();
    };

    let params = new HttpParams()
      .set('Start', normalizeDate(start))
      .set('End', normalizeDate(end));

    return this.httpClient.get<any>(`${this.apiUrl}Finance/GetMonthlyInvoiseList`, { params });
  }

  getList(
    dtSalaryPeriod: string,
    dtEndPeriod: string
  ): Observable<any[]> {
    const params = new HttpParams()
      .set('dtSalaryPeriod', dtSalaryPeriod)
      .set('dtEndPeriod', dtEndPeriod);
    return this.httpClient.get<any[]>(`${this.apiUrl}Finance/GetList`, { params });
  }
  getListWithBranch(
    dtSalaryPeriod: string,
    dtEndPeriod: string,
    branch: string
  ): Observable<any[]> {
    const params = new HttpParams()
      .set('dtSalaryPeriod', dtSalaryPeriod)
      .set('dtEndPeriod', dtEndPeriod)
      .set('Branch', branch);
    return this.httpClient.get<any[]>(`${this.apiUrl}Finance/GetListWithBranch`, { params });
  }

  // Indian Statutory Compliance Methods

  // PF Configuration
  getPFConfigurationList(): Observable<PFConfiguration[]> {
    return this.httpClient.get<PFConfiguration[]>(`${this.apiUrl}statutory/pf-configuration`).pipe(catchError(this.errorHandle));
  }

  saveAndUpdatePFConfiguration(pfDetails: PFConfiguration): Observable<any> {
    return this.httpClient.post<any[]>(`${this.apiUrl}statutory/saveAndUpdatePFConfiguration`,
      JSON.stringify(pfDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deletePFConfigurationById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(`${this.apiUrl}statutory/DeletePFConfigurationById`, params).pipe(catchError(this.errorHandle));
  }

  // ESI Configuration
  getESIConfigurationList(): Observable<ESIConfiguration[]> {
    return this.httpClient.get<ESIConfiguration[]>(`${this.apiUrl}statutory/esi-configuration`).pipe(catchError(this.errorHandle));
  }

  saveAndUpdateESIConfiguration(esiDetails: ESIConfiguration): Observable<any> {
    return this.httpClient.post<any[]>(`${this.apiUrl}statutory/saveAndUpdateESIConfiguration`,
      JSON.stringify(esiDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteESIConfigurationById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(`${this.apiUrl}statutory/DeleteESIConfigurationById`, params).pipe(catchError(this.errorHandle));
  }

  // Professional Tax Configuration
  getPTConfigurationList(): Observable<ProfessionalTaxConfiguration[]> {
    return this.httpClient.get<ProfessionalTaxConfiguration[]>(`${this.apiUrl}statutory/pt-configuration`).pipe(catchError(this.errorHandle));
  }

  saveAndUpdatePTConfiguration(ptDetails: ProfessionalTaxConfiguration): Observable<any> {
    return this.httpClient.post<any[]>(`${this.apiUrl}statutory/saveAndUpdatePTConfiguration`,
      JSON.stringify(ptDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deletePTConfigurationById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(`${this.apiUrl}statutory/DeletePTConfigurationById`, params).pipe(catchError(this.errorHandle));
  }

  // TDS Configuration
  getTDSConfigurationList(): Observable<TDSSlabConfiguration[]> {
    return this.httpClient.get<TDSSlabConfiguration[]>(`${this.apiUrl}statutory/tds-configuration`).pipe(catchError(this.errorHandle));
  }

  saveAndUpdateTDSSConfiguration(tdsDetails: TDSSlabConfiguration): Observable<any> {
    return this.httpClient.post<any[]>(`${this.apiUrl}statutory/saveAndUpdateTDSSConfiguration`,
      JSON.stringify(tdsDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteTDSSlabById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(`${this.apiUrl}statutory/DeleteTDSSlabById`, params).pipe(catchError(this.errorHandle));
  }

  // GST Configuration
  getGSTConfigurationList(): Observable<GSTConfiguration[]> {
    return this.httpClient.get<GSTConfiguration[]>(`${this.apiUrl}statutory/gst-configuration`).pipe(catchError(this.errorHandle));
  }

  getGSTConfigurationWithServices(): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}statutory/gst-configuration-with-services`).pipe(catchError(this.errorHandle));
  }

  saveAndUpdateGSTConfiguration(gstDetails: GSTConfiguration): Observable<any> {
    return this.httpClient.post<any[]>(`${this.apiUrl}statutory/saveAndUpdateGSTConfiguration`,
      JSON.stringify(gstDetails),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteGSTConfigurationById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(`${this.apiUrl}statutory/DeleteGSTConfigurationById`, params).pipe(catchError(this.errorHandle));
  }

  // GST Calculation
  calculateGST(request: any): Observable<any> {
    return this.httpClient.post<any>(`${this.apiUrl}statutory/calculate-gst`, request, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(catchError(this.errorHandle));
  }

  // Service Category Configuration
  getServiceCategoryList(): Observable<ServiceCategory[]> {
    return this.httpClient.get<ServiceCategory[]>(`${this.apiUrl}master/service-categories`).pipe(catchError(this.errorHandle));
  }

  saveAndUpdateServiceCategory(serviceCategory: ServiceCategory): Observable<any> {
    return this.httpClient.post<any[]>(`${this.apiUrl}master/saveAndUpdateServiceCategory`,
      JSON.stringify(serviceCategory),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteServiceCategoryById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(`${this.apiUrl}master/deleteServiceCategoryById`, params).pipe(catchError(this.errorHandle));
  }

  // Contractor TDS Configuration
  getContractorTDSList(): Observable<ContractorTDSSlab[]> {
    return this.httpClient.get<ContractorTDSSlab[]>(`${this.apiUrl}statutory/contractor-tds-configuration`).pipe(catchError(this.errorHandle));
  }

  saveAndUpdateContractorTDS(contractorTDS: ContractorTDSSlab): Observable<any> {
    return this.httpClient.post<any[]>(`${this.apiUrl}statutory/saveAndUpdateContractorTDS`,
      JSON.stringify(contractorTDS),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteContractorTDSById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(`${this.apiUrl}statutory/deleteContractorTDSById`, params).pipe(catchError(this.errorHandle));
  }

  // State Master Configuration
  getStateMasterList(): Observable<StateMaster[]> {
    return this.httpClient.get<StateMaster[]>(`${this.apiUrl}master/state-master`).pipe(catchError(this.errorHandle));
  }

  saveAndUpdateStateMaster(state: StateMaster): Observable<any> {
    return this.httpClient.post<any[]>(`${this.apiUrl}master/saveAndUpdateStateMaster`,
      JSON.stringify(state),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteStateMasterById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(`${this.apiUrl}master/deleteStateMasterById`, params).pipe(catchError(this.errorHandle));
  }

  // Billing Cycle Configuration
  getBillingCycleList(): Observable<BillingCycle[]> {
    return this.httpClient.get<BillingCycle[]>(`${this.apiUrl}master/billing-cycles`).pipe(catchError(this.errorHandle));
  }

  saveAndUpdateBillingCycle(billingCycle: BillingCycle): Observable<any> {
    return this.httpClient.post<any[]>(`${this.apiUrl}master/saveAndUpdateBillingCycle`,
      JSON.stringify(billingCycle),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteBillingCycleById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(`${this.apiUrl}master/deleteBillingCycleById`, params).pipe(catchError(this.errorHandle));
  }

  // Invoice Format Configuration
  getInvoiceFormatList(): Observable<InvoiceFormat[]> {
    return this.httpClient.get<InvoiceFormat[]>(`${this.apiUrl}master/invoice-formats`).pipe(catchError(this.errorHandle));
  }

  saveAndUpdateInvoiceFormat(invoiceFormat: InvoiceFormat): Observable<any> {
    return this.httpClient.post<any[]>(`${this.apiUrl}master/saveAndUpdateInvoiceFormat`,
      JSON.stringify(invoiceFormat),
      {
        headers: new HttpHeaders({
          'Content-type': 'application/json; charset=UTF-8'
        })
      }).pipe(catchError(this.errorHandle));
  }

  deleteInvoiceFormatById(id: number): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?Id=" + id }) };
    return this.httpClient.delete(`${this.apiUrl}master/deleteInvoiceFormatById`, params).pipe(catchError(this.errorHandle));
  }

  // Server Status and Dashboard Methods
  getServerStatus(): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}dashboard/server-status`).pipe(catchError(this.errorHandle));
  }

  getSystemMetrics(): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}dashboard/system-metrics`).pipe(catchError(this.errorHandle));
  }

  getLiveDashboardData(): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}dashboard/live-data`).pipe(catchError(this.errorHandle));
  }

  getDatabaseStatus(): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}dashboard/database-status`).pipe(catchError(this.errorHandle));
  }

  getActiveUsersCount(): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}dashboard/active-users`).pipe(catchError(this.errorHandle));
  }

  // Employee count methods for Dashboard
  getAllEmployees(): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}Employee/Employees`, {
      params: { name: 'none' }
    }).pipe(catchError(this.errorHandle));
  }

  getEmployeeCountByBranch(branchId: string): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}Employee/EmployeeNoByBranchID`, {
      params: { branchId }
    }).pipe(catchError(this.errorHandle));
  }

  // Agreement methods for Dashboard
  getAgreementsPostedThisMonth(): Observable<number> {
    return this.httpClient.get<number>(`${this.apiUrl}Agreement/GetAgreementsPostedThisMonth`)
      .pipe(catchError(this.errorHandle));
  }

  //to handle got any error from server response
  private errorHandle(error: HttpErrorResponse) {
    let errorMessage: string = '';
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred Client side: ${error.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // Check for validation errors from our API
      if (error.status === 400 && error.error) {
        if (error.error.Errors && Array.isArray(error.error.Errors)) {
          // Return validation errors from API
          errorMessage = error.error.Errors.join(', ');
        } else if (error.error.Error) {
          // Return single error message
          errorMessage = error.error.Error;
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else {
          errorMessage = `Validation error: ${JSON.stringify(error.error)}`;
        }
      } else {
        // Generic server error
        errorMessage = `Server error: ${error.status} - ${error.message}`;
        if (error.error) {
          errorMessage += `\nDetails: ${JSON.stringify(error.error)}`;
        }
      }
    }
    // Return an observable with a user-facing error message.
    return throwError(errorMessage);
  }
}
