import {Injectable} from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient, HttpErrorResponse, HttpParams} from "@angular/common/http";
import {catchError, Observable, throwError} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class QuotationService {
  apiUrl: string = environment.baseUrl;

  constructor(private httpClient: HttpClient) {
  }

  getQuotationMaster(userId: string): Observable<any> {
    // Using Agreement API since Quotation master API doesn't exist yet
    const params = {params: new HttpParams({fromString: "?userID=" + userId})};
    return this.httpClient.get<any>(this.apiUrl + 'Agreement/GetAgreementMaster', params).pipe(catchError(this.errorHandle));
  }

  getClientsByBranchID(branchID: any) {
    const params = {params: new HttpParams({fromString: "?branchID=" + branchID})};
    return this.httpClient.get<any>(this.apiUrl + 'Quotation/GetClientsQuotationByBranchID', params
    ).pipe(catchError(this.errorHandle));
  }

  getClientsOnlyByBranchID(branchID: any) {
    const params = {params: new HttpParams({fromString: "?branchID=" + branchID})};
    return this.httpClient.get<any>(this.apiUrl + 'Quotation/GetClientsOnlyByBranchID', params
    ).pipe(catchError(this.errorHandle));
  }

  GetClientsAllStatusByBranchID(branchID: any) {
    const params = {params: new HttpParams({fromString: "?branchID=" + branchID})};
    return this.httpClient.get<any>(this.apiUrl + 'Quotation/GetClientsAllStatusByBranchID', params
    ).pipe(catchError(this.errorHandle));
  }

  saveAndUpdateQuotation(body: any) {
    return this.httpClient.post(this.apiUrl + 'Quotation/SaveAndUpdateQuotation', body);
  }

  saveAndUpdateQuotationDetails(body: any) {
    return this.httpClient.post(this.apiUrl + 'Quotation/SaveAndUpdateQuotationDetails', body);
  }

  deleteQuotationDetailById(id: any) {
    const params = {params: new HttpParams({fromString: "?Id=" + id})};
    return this.httpClient.delete(this.apiUrl + 'Quotation/DeleteQuotationDetailById', params);
  }

  deleteQuotationById(id: any) {
    const params = {params: new HttpParams({fromString: "?Id=" + id})};
    return this.httpClient.delete(this.apiUrl + 'Quotation/DeleteQuotationById', params);
  }

  getQuotationByID(quotationID: any) {
    const params = {params: new HttpParams({fromString: "?quotationID=" + quotationID})};
    return this.httpClient.get<any>(this.apiUrl + 'Quotation/GetQuotationByID', params
    ).pipe(catchError(this.errorHandle));
  }

  getQuotations(userId: string, branchId: any, load: boolean = false) {
    const params = {params: new HttpParams({fromString: "?branchId=" + branchId + "&load=" + load + "&userID=" + userId})};
    return this.httpClient.get<any>(this.apiUrl + 'Quotation/GetQuotations', params
    ).pipe(catchError(this.errorHandle));
  }

  checkClientStatus(branchId: any, clientId: any) {
    const params = {params: new HttpParams({fromString: "?branchId=" + branchId + "&clientId=" + clientId + "&status=I"})};
    return this.httpClient.get<any>(this.apiUrl + 'Quotation/CheckClientStatus', params
    ).pipe(catchError(this.errorHandle));
  }

  getQuotationsDiscountReportMaster(userId: string): Observable<any> {
    const params = {params: new HttpParams({fromString: "?userID=" + userId})};
    return this.httpClient.get<any>(this.apiUrl + 'Quotation/GetQuotationsDiscountReportMaster', params
    ).pipe(catchError(this.errorHandle));
  }

  getQuotationsDiscountReport(branchId: any, clientId: any, startDate: any, endDate: any) {
    const params = {params: new HttpParams({fromString: "?branchId=" + branchId + "&clientId=" + clientId + "&startDate=" + startDate + "&endDate=" + endDate})};
    return this.httpClient.get<any>(this.apiUrl + 'Quotation/GetQuotationsDiscountReport', params
    ).pipe(catchError(this.errorHandle));
  }

  private errorHandle(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
