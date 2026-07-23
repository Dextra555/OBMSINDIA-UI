import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from "rxjs";
import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  apiUrl: string = environment.baseUrl;

  constructor(private httpClient: HttpClient) {
  }

  getEmployees(name: string = "none") {
    const params = { params: new HttpParams({ fromString: "?name=" + name }) };
    return this.httpClient.get<any>(this.apiUrl + 'Employee/Employees', params
    ).pipe(catchError(this.errorHandle));
  }

  getEmployeeMaster(userId: string): Observable<any> {
    const params = { params: new HttpParams({ fromString: "?userID=" + userId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Employee/GetEmployeeMaster', params
    ).pipe(catchError(this.errorHandle));
  }

  getEmployeeById(empId: any) {
    const params = { params: new HttpParams({ fromString: "?employeeId=" + empId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Employee/EmployeeById', params
    ).pipe(catchError(this.errorHandle));
  }

  getClientsFromBranchId(branchId: any, empType: any) {
    const params = { params: new HttpParams({ fromString: "?branchId=" + branchId + "&empType=" + empType }) };
    return this.httpClient.get<any>(this.apiUrl + 'Employee/GetClientsFromBranchId', params
    ).pipe(catchError(this.errorHandle));
  }

  getEmployeesByBranchId(branchId: any) {
    const params = { params: new HttpParams({ fromString: "?branchId=" + branchId }) };
    return this.httpClient.get<any>(this.apiUrl + 'Employee/EmployeesByBranchId', params
    ).pipe(catchError(this.errorHandle));
  }


  saveEmployee(body: any) {
    return this.httpClient.post(this.apiUrl + 'Employee/SaveAndUpdateEmployee', body);
  }

  updateEmployee(body: any) {
    return this.httpClient.put(this.apiUrl + 'Employee/SaveAndUpdateEmployee', body);
  }

  checkEmployeeInfo(from: any, data: any) {
    const params = { params: new HttpParams({ fromString: "?from=" + from + "&data=" + data }) };
    return this.httpClient.get<any>(this.apiUrl + 'Employee/CheckEmployeeInfo', params
    ).pipe(catchError(this.errorHandle));
  }

  // Indian Compliance Methods
  createEmployee(employeeData: any) {
    return this.httpClient.post(this.apiUrl + 'Employee/CreateEmployee', employeeData);
  }

  updateEmployeeIndian(employeeData: any) {
    return this.httpClient.put(this.apiUrl + 'Employee/UpdateEmployee/' + employeeData.EMP_ID, employeeData);
  }

  searchEmployees(searchCriteria: any) {
    return this.httpClient.post(this.apiUrl + 'Employee/SearchEmployees', searchCriteria);
  }

  validateEmployeeField(fieldType: string, fieldValue: string, excludeEmployeeId?: number) {
    const validationData = {
      FieldType: fieldType,
      FieldValue: fieldValue,
      ExcludeEmployeeId: excludeEmployeeId
    };
    return this.httpClient.post(this.apiUrl + 'Employee/ValidateEmployeeField', validationData);
  }

  getEmployeeByPAN(pan: string) {
    return this.httpClient.get(this.apiUrl + 'Employee/GetEmployeeByPAN/' + pan);
  }

  getEmployeeByAadhaar(aadhaar: string) {
    return this.httpClient.get(this.apiUrl + 'Employee/GetEmployeeByAadhaar/' + aadhaar);
  }

  deleteEmployee(id: number) {
    return this.httpClient.delete(this.apiUrl + 'Employee/DeleteEmployee/' + id);
  }

  // Excel Import Methods
  previewExcelImport(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.httpClient.post(this.apiUrl + 'Employee/PreviewExcelImport', formData);
  }

  bulkImportEmployees(request: any) {
    return this.httpClient.post(this.apiUrl + 'Employee/BulkImportEmployees', request);
  }

  downloadImportTemplate() {
    return this.httpClient.get(this.apiUrl + 'Employee/DownloadImportTemplate', {
      responseType: 'blob'
    });
  }

  private errorHandle(error: HttpErrorResponse) {
    let errorMessage: string = '';
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred Client side: ${error.error}`;
    } else {
      // The backend returned an unsuccessful response code.
      //errorMessage = `An error occurred Server side: ${error.status}, body was: ${error.error}`;
    }
    // Return an observable with a user-facing error message.
    errorMessage += '\n This is the problem with service. We are notified & working on it. Please try again later..';
    return throwError(errorMessage);
  }
}
