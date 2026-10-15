import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes, IApiResMesssage, IApiResWithUrl } from 'src/app/models/api';
import { IBankDropdown } from 'src/app/models/bank';
import { IExportPayload } from 'src/app/modules/positive-pay/model/postive-pay';
import { environment } from 'src/environments/environment';

export interface IPositivePayMetaData {
  routingNumber: string;
  bankId: string;
  fileName: string;
  folderPath: string;
}

export interface FtpSettings {
  ftp_driver: string;
  ftp_host: string;
  ftp_username: string;
  ftp_password: string;
  port: string;
  file_type: string;
  key_id: string;
  credential_type: string;
  schedule_time: string;
  timezone: string;
  running_times: string[];
  additional_emails: string[][]
}

@Injectable({
  providedIn: 'root'
})
export class PositivePayService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  setPositivePay(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/positive-pays`, data);
  }

  getSettingsMeataData(id: string) {
    return this.http.get<IApiRes<IPositivePayMetaData>>(
      `${this.ROOT_URL}/positive-pays/meta-data/${id}`
    );
  }

  saveSettings(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/positive-pays/meta-data`,
      data
    );
  }

  getUserSsh(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/positive-pays/ssh`);
  }

  getPositivePay(id: any): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/positive-pays/${id}`);
  }

  generateSsh(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/positive-pays/generate-ssh`,
      data
    );
  }

  export(data: IExportPayload): Observable<IApiResWithUrl> {
    return this.http.post<IApiResWithUrl>(`${this.ROOT_URL}/positive-pays/export`, data);
  }

  checkPositivePayPermission(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/positive-pays/permission`);
  }

  /**
   * @description Save the positive pay bank accounts
   * @param data
   * @returns
   */
  setPositivePayBankAccounts(sendingData: {
    routingNumber: string;
    bankAccountIds: string[];
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/positive-pays/positive-pay-bankaccounts`,
      sendingData
    );
  }

  /**
   * @description Get the positive pay bank accounts
   * @param routingNumber
   * @returns
   */
  getPositivePayBankAccounts(
    routingNumber: string
  ): Observable<
    IApiRes<{ totalAccounts: number; bankAccounts: IBankDropdown[] }>
  > {
    return this.http.get<
      IApiRes<{ totalAccounts: number; bankAccounts: IBankDropdown[] }>
    >(`${this.ROOT_URL}/positive-pays/bankaccounts/${routingNumber}`);
  }

  uploadToBank(routingNumber: string): Observable<any>{
    return this.http.post<any>(`${this.ROOT_URL}/positive-pays/${routingNumber}/upload-to-bank`, {});
  }

  getFtpSettings(routingNumber: string): Observable<IApiRes<FtpSettings>>{
    return this.http.get<IApiRes<FtpSettings>>(`${this.ROOT_URL}/positive-pays/${routingNumber}/ftp-settings`);
  }

  getMethods(routingNumber: string) {
    return this.http.get<IApiRes<{setupMethods:{[key:string]:string},fileTypes:{[key:string]:string}}>>(`${this.ROOT_URL}/positive-pays/${routingNumber}/methods-and-filetypes`);
  }
}
