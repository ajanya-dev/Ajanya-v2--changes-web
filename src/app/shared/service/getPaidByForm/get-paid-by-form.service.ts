import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GetPaidByFormService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  singlePause(id: string, data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/get-paid-by-form-recurring/${id}/pause`,
      data
    );
  }

  bulkPause(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/get-paid-by-form-recurring/bulk-pause`,
      data
    );
  }

  singleRestart(id: string, data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/get-paid-by-form-recurring/${id}/restart`,
      data
    );
  }

  bulkRestart(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/get-paid-by-form-recurring/bulk-restart`,
      data
    );
  }

  singleCancel(id: string, data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/get-paid-by-form-recurring/${id}/cancel`,
      data
    );
  }

  bulkCancel(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/get-paid-by-form-recurring/bulk-cancel`,
      data
    );
  }

  // ACH RECURRING

  recurringChangeSatatus(id: string, type: number): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/ach-recurring/${id}/${type}`,
      ''
    );
  }

  recurringChangeSatatusBulk(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/ach-recurring/`, data);
  }

  // view-get paid by form check

  viewgpbfCheck(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/get-paid-by-form-recurring/${id}`
    );
  }

  getgpbfActivityLog(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/get-paid-by-form-recurring/${id}/activity-log`
    );
  }

  getComment(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/get-paid-by-form-recurring/${id}/comments`
    );
  }

  addComments(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/get-paid-by-form-recurring/comment`,
      data
    );
  }

  getRecurringEventDetails(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/get-paid-by-form-recurring/${id}/event-details`
    );
  }

  // view- ach recurring

  viewRecurringDetails(id: string): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/ach-recurring/${id}`);
  }

  getPersonalDetails(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/ach-recurring/${id}/payee-details`
    );
  }

  getAuditTrail(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/ach-recurring/${id}/audit-trail`
    );
  }

  getAchRecurringEvent(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/ach-recurring/${id}/recurring-events`
    );
  }
}
