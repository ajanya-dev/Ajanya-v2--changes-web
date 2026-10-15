import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IPaymyRoll } from 'src/app/modules/payroll/model/payroll';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymyrollService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  getPayrollLink(): Observable<IPaymyRoll> {
    return this.http.get<IPaymyRoll>(`${this.ROOT_URL}/payrolls`);
  }

  getPaymyRoll(): Observable<IPaymyRoll> {
    return this.http.post<IPaymyRoll>(`${this.ROOT_URL}/paymyroll/index`, {});
  }
}
