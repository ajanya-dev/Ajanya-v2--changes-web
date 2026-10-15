import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProcessCardService {
  updatedProcessCardStatus$ = new BehaviorSubject<any>([]);

  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  //=========================================================

  getProcessCardStatus(): Observable<any> {
    return this.updatedProcessCardStatus$;
  }

  setProcessCardStratus(data: any): void {
    this.updatedProcessCardStatus$.next(data);
  }

  //=========================================================

  sendCloverForm(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/fiserve`, data);
  }

  processCardStstus(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/fiserve/settings`);
  }
}
