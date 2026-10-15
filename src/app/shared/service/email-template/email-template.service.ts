import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import {
  IAPIMailDesignTags,
  IApiGetTemplate
} from 'src/app/modules/email-template-design/models/email-template';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailTemplateService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  getTemplate(type: string): Observable<IApiRes<IApiGetTemplate>> {
    return this.http.get<IApiRes<IApiGetTemplate>>(
      `${this.ROOT_URL}/email-template/get-json/${type}`
    );
  }

  getTags(type: string): Observable<IApiRes<IAPIMailDesignTags[]>> {
    return this.http.get<IApiRes<IAPIMailDesignTags[]>>(
      `${this.ROOT_URL}/email-template/mail_design/${type}`
    );
  }

  getDefaultTemplate(type: string): Observable<any> {
    return this.http.get(
      `${this.ROOT_URL}/email-template/get-default-template/${type}`
    );
  }

  saveTemplate(
    type: string,
    body: { content: string; subject: string }
  ): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/email-template/save-template/${type}`,
      body
    );
  }

  sendTestEmail(body: {
    type: string;
    email: string;
    content: string;
  }): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/email-template/send-test-email`,
      body
    );
  }
}
