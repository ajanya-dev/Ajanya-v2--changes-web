import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  GroupPaymentExcelMapping,
  IGroupPaymentsCreate,
  IGroupPaymentsDetails,
  IMultiPaymentsSave,
  GroupPaymentExcelMappedData
} from '../models/group-payments.models';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';

@Injectable({
  providedIn: 'root'
})
export class GroupPaymentsService {
  private http = inject(HttpClient);

  ROOT_URL = environment.rootUrl;

  /**
   * Creates a new payments group.
   * @param sendingData The data for creating the payments group.
   * @returns An Observable of IApiRes containing the groupId of the created group.
   */
  createPaymentsGroup(
    sendingData: IGroupPaymentsCreate
  ): Observable<IApiRes<{ groupId: string }>> {
    return this.http.post<IApiRes<{ groupId: string }>>(
      `${this.ROOT_URL}/zil-payments/group`,
      sendingData
    );
  }

  /**
   * Updates an existing payments group.
   * @param sendingData The data for updating the payments group.
   * @param groupId The ID of the group to update.
   * @returns An Observable of IApiResMesssage indicating the result of the update operation.
   */
  updatePaymentsGroup(
    sendingData: IGroupPaymentsCreate,
    groupId: string
  ): Observable<IApiResMesssage> {
    return this.http.patch<IApiResMesssage>(
      `${this.ROOT_URL}/zil-payments/group/${groupId}`,
      sendingData
    );
  }

  /**
   * Saves the payment details for a group.
   * @param groupId The ID of the group for which to save payment details.
   * @returns An Observable of type IApiRes<string[]> representing the response with saved payment details.
   */
  saveGroupPayments(groupId: string): Observable<IApiRes<string[]>> {
    return this.http.post<IApiRes<string[]>>(
      `${this.ROOT_URL}/zil-payments/group/${groupId}/process`,
      {}
    );
  }

  /**
   * Saves multiple payments.
   * @param sendingData The data containing multiple payments to save.
   * @returns An Observable of type IApiRes<{ ids: string[] }> representing the response with the IDs of saved payments.
   */
  saveMultiplepayments(
    sendingData: IMultiPaymentsSave
  ): Observable<IApiRes<{ ids: string[] }>> {
    return this.http.post<IApiRes<{ ids: string[] }>>(
      `${this.ROOT_URL}/zil-payments/group/save`,
      sendingData
    );
  }

  /**
   * Retrieves payment group data by ID.
   * @param groupId The ID of the payment group to retrieve data for.
   * @returns An Observable of type IApiRes<IGroupPaymentsDetails> representing the response with payment group details.
   */
  getGroupPaymentData(
    groupId: string
  ): Observable<IApiRes<IGroupPaymentsDetails>> {
    return this.http.get<IApiRes<IGroupPaymentsDetails>>(
      `${this.ROOT_URL}/zil-payments/group/${groupId}`
    );
  }

  /**
   * Deletes payment groups by their IDs.
   * @param groupIds An array of payment group IDs to be deleted.
   * @returns An Observable of type IApiResMesssage representing the response message.
   */
  deletePaymentsGroup(groupIds: string[]): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/zil-payments/group/delete`,
      { ids: groupIds }
    );
  }

  getSampleExcel() {
    return this.http.get<IApiRes<{ sampleFileUrl: string }>>(
      `${this.ROOT_URL}/imports/bulk-payments/step1`
    );
  }

  getExcelExtractedData(payload: FormData) {
    return this.http.post<IApiRes<GroupPaymentExcelMapping>>(
      `${this.ROOT_URL}/imports/bulk-payments/step2`,
      payload
    );
  }

  submitExcelMappedData(payload: { [key: string]: unknown }) {
    return this.http.post<
      IApiRes<{ message: string; paymentData: GroupPaymentExcelMappedData[] }>
    >(`${this.ROOT_URL}/imports/bulk-payments/step3`, payload);
  }
}
