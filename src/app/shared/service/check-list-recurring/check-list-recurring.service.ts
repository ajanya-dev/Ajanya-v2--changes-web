import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IApiRes } from 'src/app/models/api';
import {
  ICheckMailingRecurringDetails,
  ICheckRecurringAch,
  ICheckRecurringAuditTrialTable,
  ICheckAchRecurringComments,
  ICheckRecurringEventDetails,
  ICheckRecurringPayeeDetails,
  IGiftCardRecurringComment,
  IGiftCardRecurringDetails
} from 'src/app/models/check-recurring';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CheckListRecurringService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  changeRecurringStatus(ids: string[], status: string) {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/check-mailing/recurring/change-status`,
      { ids, status }
    );
  }

  retryCheckMailingRecurringEvent(id: string) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/check-mailing/recurring/${id}/retry`,
      {}
    );
  }

  changeAchRecurringStatus(id: string, status: string) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/ach-recurring/${id}/${status}`,
      {}
    );
  }

  retryRecurringEvent(id: string) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/ach-recurring/${id}/retry`,
      {}
    );
  }

  changeBulkRecurringStatus(ids: string[], status: string) {
    return this.http.post<IApiRes<string>>(`${this.ROOT_URL}/ach-recurring/`, {
      ids,
      status
    });
  }

  viewRecurringDetails(id: string) {
    return this.http.get<IApiRes<ICheckMailingRecurringDetails>>(
      `${this.ROOT_URL}/check-mailing/recurring/${id}/show/`
    );
  }

  viewAchRecurringDetails(id: string) {
    return this.http.get<IApiRes<ICheckRecurringAch>>(
      `${this.ROOT_URL}/ach-recurring/${id}`
    );
  }

  getPayeeDetails(id: string) {
    return this.http.get<IApiRes<ICheckRecurringPayeeDetails>>(
      `${this.ROOT_URL}/ach-recurring/${id}/payee-details`
    );
  }

  getAchAuditTrail(type: string, id: string) {
    return this.http.get<IApiRes<ICheckRecurringAuditTrialTable[]>>(
      `${this.ROOT_URL}/${type}/${id}/audit-trail`
    );
  }

  getComments(id: string) {
    return this.http.get<IApiRes<ICheckAchRecurringComments[]>>(
      `${this.ROOT_URL}/ach-recurring/${id}/comments`
    );
  }

  getRecurringComment(id: string) {
    return this.http.get<IApiRes<ICheckAchRecurringComments[]>>(
      `${this.ROOT_URL}/check-mailing/recurring/${id}/comments`,
      {}
    );
  }

  getRecurringEventDetails(id: string) {
    return this.http.get<IApiRes<ICheckRecurringEventDetails[]>>(
      `${this.ROOT_URL}/ach-recurring/${id}/recurring-events`
    );
  }

  changeGiftCardRecurringStatus(id: string, status: string) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/gift-card-recurring/${id}/${status}`,
      {}
    );
  }

  retryGiftCardRecurringEvent(id: string) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/gift-card-recurring/${id}/retry`,
      {}
    );
  }

  viewGiftCardRecurringDetails(id: string) {
    return this.http.get<IApiRes<IGiftCardRecurringDetails>>(
      `${this.ROOT_URL}/gift-card-recurring/${id}`
    );
  }

  getGiftCardRecurringEventDetails(id: string) {
    return this.http.get<IApiRes<ICheckRecurringEventDetails[]>>(
      `${this.ROOT_URL}/gift-card-recurring/${id}/recurring-events`
    );
  }

  getGiftCardComments(id: string) {
    return this.http.get<IApiRes<IGiftCardRecurringComment[]>>(
      `${this.ROOT_URL}/gift-card-recurring/${id}/comments`
    );
  }

  addGiftCardComment(id: string, comment: string) {
    return this.http.post<IApiRes<IGiftCardRecurringComment>>(
      `${this.ROOT_URL}/gift-card-recurring/${id}/comments`,
      { comment, id }
    );
  }

  deleteGiftCardComment(id: string, commentId: number) {
    return this.http.delete<IApiRes<boolean>>(
      `${this.ROOT_URL}/gift-card-recurring/${id}/comments/${commentId}`
    );
  }
}
