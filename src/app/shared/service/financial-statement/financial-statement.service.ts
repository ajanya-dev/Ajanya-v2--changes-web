import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FinancialStatementService {
  ROOT_URL = environment.rootUrl;
  constructor(private http: HttpClient) {}
  getSummaryDetailsForFinancialStatement(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/ag-grid/21`);
  }
}
