import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ISupportTicketCounts {
  success: boolean;
  total_ticket_count: number;
  pending_ticket_count: number;
  resolved_ticket_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserSupportService {
  ROOT_URL = environment.rootUrl;
  constructor(private http: HttpClient) {}

  getTicketCounts(): Observable<ISupportTicketCounts> {
    return this.http.get<ISupportTicketCounts>(
      `${this.ROOT_URL}/support-questions/ticket-details`
    );
  }

  askQuestion(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/support-questions`, data);
  }

  supportQuestion(id: string, data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/support-questions/${id}/messages`,
      data
    );
  }

  addAttachments(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/support-questions/attachments`,
      data
    );
  }

  markAsResolve(id: string, data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/support-questions/${id}/resolved`,
      data
    );
  }

  reOpen(id: string, data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/support-questions/${id}/re-open`,
      data
    );
  }

  getmessages(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/support-questions/${id}/messages`
    );
  }

  deleteAttachment(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.ROOT_URL}/support-questions/attachments/${id}`
    );
  }

  openAttachment(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/support-questions/attachments/${id}`
    );
  }

  // feature request for user
  featureRequest(data: FormData): Observable<IApiRes<{ data: string }>> {
    return this.http.post<IApiRes<{ data: string }>>(
      `${this.ROOT_URL}/feature-request`,
      data
    );
  }

  onBlockDemo(): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(`${this.ROOT_URL}/block-demo`);
  }

  addFeedback(feedbackData: FormData): Observable<IApiRes<{id: string}>>{
    return this.http.post<IApiRes<{id: string}>>(`${this.ROOT_URL}/feedback/add`,
      feedbackData
    );
  }
}
