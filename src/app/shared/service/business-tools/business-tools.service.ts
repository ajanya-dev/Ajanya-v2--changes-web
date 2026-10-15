import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import {
  IBuyPhonenumberDetailsModel,
  IContactDetails2,
  IGroupDetails,
  IPhonenumberDetailsModel,
  IPhonenumberUpdateModel
} from 'src/app/modules/business-tools/model/business-tools-common';
import {
  IEntryMessage,
  IExtractedContactData,
  IImportedContactData
} from 'src/app/modules/business-tools/sms-panel/model/sms-panel';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BusinessToolsService {
  ROOT_URL = environment.rootUrl;
  httpOptionsJson = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };
  constructor(private http: HttpClient) {}
  //EMAIL-writer
  articleGenerator(content: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/article-generator`,
      content,
      this.httpOptionsJson
    );
  }
  articleGenerator2(content: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/article-generator`, content);
  }

  //SMS-panel
  getSmsGroups(): Observable<IApiRes<IGroupDetails[]>> {
    return this.http.get<IApiRes<IGroupDetails[]>>(
      `${this.ROOT_URL}/sms/group`
    );
  }
  getFromNumber(): Observable<IApiRes<IPhonenumberDetailsModel[]>> {
    return this.http.get<IApiRes<IPhonenumberDetailsModel[]>>(
      `${this.ROOT_URL}/sms/contact/get-from-number`
    );
  }
  sendSMS(sendingData: FormData): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(`${this.ROOT_URL}/sms`, sendingData);
  }
  importContactsStep1(
    sendingData: FormData
  ): Observable<IApiRes<IExtractedContactData>> {
    return this.http.post<IApiRes<IExtractedContactData>>(
      `${this.ROOT_URL}/sms/contact/import/step1`,
      sendingData
    );
  }
  importContactsStep2(sendingData: {
    mapping: (string | number)[];
    groupId: string;
  }): Observable<{ success: boolean; message: IImportedContactData }> {
    return this.http.post<{ success: boolean; message: IImportedContactData }>(
      `${this.ROOT_URL}/sms/contact/import/step2`,
      sendingData
    );
  }
  createSMSGroup(sendingData: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/sms/group`, sendingData);
  }
  deleteSMSGroup(id: any): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/sms/group/${id}`);
  }
  deleteContact(id: any): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/sms/contact/${id}`);
  }
  deleteContacts(sendingData: { ids: string[] }): Observable<any> {
    const headerOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      body: sendingData
    };
    return this.http.delete(`${this.ROOT_URL}/sms/contact`, headerOptions);
  }
  addContact(sendingData: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/sms/contact/`, sendingData);
  }
  getStatus(sendingData: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/sms/status`, sendingData);
  }

  updateContact(id: any, sendingData: any): Observable<any> {
    return this.http.put(`${this.ROOT_URL}/sms/contact/${id}`, sendingData);
  }
  updateGroup2(id: any, sendingData: any): Observable<any> {
    return this.http.put(
      `${this.ROOT_URL}/sms/group/${id}`,
      sendingData,
      this.httpOptionsJson
    );
  }
  requestSMSPanelAccess(): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/sms/request-now`, false);
  }
  getSMSPanelStatus(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/sms/status`);
  }
  getContactsByGroup(id: any): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/sms/contact/get-contacts/${id}`);
  }

  getSmsEnable(): Observable<IApiRes<{ terms: boolean; smsEnable: number }>> {
    return this.http.get<IApiRes<{ terms: boolean; smsEnable: number }>>(
      `${this.ROOT_URL}/sms/sms-enable`
    );
  }

  saveAcceptTermsResponse(sendingData: {
    accept: number;
  }): Observable<IApiRes<number>> {
    return this.http.post<IApiRes<number>>(
      `${this.ROOT_URL}/sms/terms-and-conditions`,
      sendingData
    );
  }

  getSampleFile(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/sms/sample-file`);
  }

  applyForBusinessTool(data: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/article-generator/customer_tool_request`,
      data,
      this.httpOptionsJson
    );
  }
  addDefaultMesssageService(data: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/sms/default`,
      data,
      this.httpOptionsJson
    );
  }
  getDefaultMesssageServices(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/sms/default`);
  }
  deleteDefaultMesssageService(id: string): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/sms/default/${id}`);
  }
  updateDefaultMesssageService(
    id: string,
    sendingData: { message: string }
  ): Observable<IApiResMesssage> {
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/sms/default/${id}`,
      sendingData
    );
  }
  getAvailablePhnos(sendingData: {
    countryCode: string;
    areaCode: number | string;
    PhoneNumberType: string;
  }): Observable<IApiRes<IBuyPhonenumberDetailsModel[]>> {
    return this.http.post<IApiRes<IBuyPhonenumberDetailsModel[]>>(
      `${this.ROOT_URL}/sms/buy-number/get`,
      sendingData
    );
  }
  buyPhoneNumber(sendingData: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/sms/buy-number/buy`, sendingData);
  }
  deletePhoneNumber(id: any): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/sms/buy-number/${id}`);
  }
  getInboxMessages1(sendingData: {
    fromNumber: string;
    toNumber: string;
  }): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/sms/message`, sendingData);
  }
  sendMessageSingle(sendingData: {
    fromNumber: string;
    toNumber: string;
    message: string;
  }): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/sms/send-sms`, sendingData);
  }
  addEntryMessageSettings(sendingData: {
    fromNumber: string;
    entryCode: string;
    message: string;
    groupId: string;
  }): Observable<IApiRes<{ id: string }>> {
    return this.http.post<IApiRes<{ id: string }>>(
      `${this.ROOT_URL}/sms/message/entry-setting`,
      sendingData
    );
  }

  getEntryMessages(): Observable<IApiRes<IEntryMessage[]>> {
    return this.http.get<IApiRes<IEntryMessage[]>>(
      `${this.ROOT_URL}/sms/message/entry-setting`
    );
  }
  deleteEntryMessages(id: string): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/sms/message/${id}/entry-setting`);
  }
  searchContacts(sendingData: {
    term: string;
    take: number;
  }): Observable<IApiRes<IContactDetails2[]>> {
    return this.http.post<IApiRes<IContactDetails2[]>>(
      `${this.ROOT_URL}/sms/contact/contact-list`,
      sendingData
    );
  }
  getMessageHistory(sendingData: {
    fromNumber: string;
    toNumber: string;
  }): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/sms/message`, sendingData);
  }
  getAvailablePhonenumbertypes(countryCode: string): Observable<any> {
    return this.http.get(
      `${this.ROOT_URL}/sms/phone-number-type?country=${countryCode}`
    );
  }
  updatePhoneNumberNickname(
    id: string,
    sendingData: IPhonenumberUpdateModel
  ): Observable<any> {
    return this.http.put(
      `${this.ROOT_URL}/sms/contact/${id}/name`,
      sendingData
    );
  }
  updatePhoneNumberValidity(from_number_id: string): Observable<any> {
    return this.http.put(
      `${this.ROOT_URL}/sms/buy-number/${from_number_id}`,
      {}
    );
  }
  //Businesstools panel
  getBusinessTools(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/article-generator/tools`);
  }
}
