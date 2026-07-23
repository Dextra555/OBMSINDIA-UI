import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Designation {
  DesignationId: number;
  DesignationCode: string;
  DesignationName: string;
  Description?: string;
  IsActive: boolean;
  CreatedDate: string;
  CreatedBy?: string;
  UpdatedDate?: string;
  UpdatedBy?: string;
  DepartmentId?: number;
  DepartmentName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DesignationService {
  private baseUrl = environment.baseUrl + 'Designation';

  constructor(private http: HttpClient) { }

  getAll(departmentId?: number): Observable<Designation[]> {
    const params = departmentId ? `?departmentId=${departmentId}` : '';
    return this.http.get<Designation[]>(`${this.baseUrl}${params}`);
  }

  getById(id: number): Observable<Designation> {
    return this.http.get<Designation>(`${this.baseUrl}/${id}`);
  }

  getByCode(code: string): Observable<Designation> {
    return this.http.get<Designation>(`${this.baseUrl}/code/${code}`);
  }

  create(designation: Designation): Observable<Designation> {
    return this.http.post<Designation>(this.baseUrl, designation);
  }

  update(id: number, designation: Designation): Observable<Designation> {
    return this.http.put<Designation>(`${this.baseUrl}/${id}`, designation);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
