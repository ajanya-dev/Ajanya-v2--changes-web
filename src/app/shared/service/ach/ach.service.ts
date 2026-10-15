import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ISendAchData } from 'src/app/modules/ach/model/ach';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { IPersonaVerificationStatus } from 'src/app/models/user';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AchService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  sendAchForm(data: ISendAchData): Observable<IApiRes<{ form_id: string }>> {
    return this.http.post<IApiRes<{ form_id: string }>>(
      `${this.ROOT_URL}/ach-authorization-form`,
      data
    );
  }

  previewAchForm(id: string): Observable<IApiRes<{ url: string }>> {
    return this.http.get<IApiRes<{ url: string }>>(
      `${this.ROOT_URL}/ach-authorization-form/${id}`
    );
  }

  emailAchForm(data: {
    email: string;
    id: string;
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/ach-authorization-form/email`,
      data
    );
  }

  personaVerification(
    id: string
  ): Observable<{ status: string; success: boolean }> {
    return this.http.get<{ status: string; success: boolean }>(
      `${this.ROOT_URL}/persona-verifications/${id}`
    );
  }

  checkPersonaVerificationStatus(): Observable<
    IApiRes<IPersonaVerificationStatus>
  > {
    return this.http.get<IApiRes<IPersonaVerificationStatus>>(
      `${this.ROOT_URL}/persona-verifications`
    );
  }
}
