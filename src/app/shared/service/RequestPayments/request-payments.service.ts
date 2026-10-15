import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IApiRes } from 'src/app/models/api';
import { IUploadFromPhoneData } from 'src/app/models/bank';
import { IReceiveCheckActivityLog, IReceiveCheckDetails } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { LocalStorageService } from '../storage/local-storage.service';

interface IReceivedTypes {
  type: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RequestPaymentsService {
  private http = inject(HttpClient);
  private _localStorageService = inject(LocalStorageService);

  ROOT_URL = environment.rootUrl;
  statusArr = new BehaviorSubject([]);
  frequency = new BehaviorSubject('');
  status = new BehaviorSubject('');
  receivedTypes = new BehaviorSubject<IReceivedTypes | undefined>(undefined);

  setStatusArray(arr: any) {
    this.statusArr.next(arr);
  }

  getStatusArray() {
    return this.statusArr;
  }

  setFrequency(fr: any) {
    this.frequency.next(fr);
  }

  setStatus(st: string) {
    this.status.next(st);
  }

  /**
   * @description Set Filtered received payments status.
   * @param {IReceivedTypes}data
   */
  setReceivedTypes(data: IReceivedTypes | number|undefined) {
    this.receivedTypes.next(data as IReceivedTypes);
  }

  /**
   * @description Get Filtered received payments status.
   */
  getReceivedTypes(): Observable<IReceivedTypes | undefined> {
    return this.receivedTypes;
  }

  public $frequency = this.frequency.asObservable();
  public $status = this.status.asObservable();

  // ---------------API s----------------//

  getStatus() {
    return this.http.get<any>(`${this.ROOT_URL}/status/recieved-payments/`);
  }

  getCheckView(id: string) {
    return this.http.get<IApiRes<IReceiveCheckDetails>>(`${this.ROOT_URL}/request-payments/${id}`);
  }

  // GET PAID BY FORM RECURRING

  acceptRequest(id: string) {
    return this.http.post<any>(
      `${this.ROOT_URL}/request-payments/${id}/accept-request`,
      ''
    );
  }

  bulkAcceptRequest(data: any) {
    return this.http.post<any>(
      `${this.ROOT_URL}/request-payments/bulk-accept`,
      data
    );
  }

  rejectRequest(id: string) {
    return this.http.post<any>(
      `${this.ROOT_URL}/request-payments/${id}/reject-request`,
      ''
    );
  }

  bulkRejectRequest(data: any) {
    return this.http.post<any>(
      `${this.ROOT_URL}/request-payments/bulk-reject`,
      data
    );
  }

  printRequest(id: string) {
    return this.http.post<any>(
      `${this.ROOT_URL}/request-payments/${id}/print`,
      ''
    );
  }

  markAsPrintRequest(id: string) {
    return this.http.post<any>(
      `${this.ROOT_URL}/request-payments/${id}/mark-as-printed`,
      ''
    );
  }

  markAsPrintBulkRequest(data: any) {
    return this.http.post<any>(
      `${this.ROOT_URL}/request-payments/bulk-mark-as-printed/`,
      data
    );
  }

  cancelRequest(id: string) {
    return this.http.put<any>(`${this.ROOT_URL}/request-payments/${id}`, '');
  }

  resendRequest(id: string) {
    return this.http.post<any>(
      `${this.ROOT_URL}/request-payments/${id}/resend`,
      ''
    );
  }

  printSelected(data: any) {
    return this.http.post<any>(
      `${this.ROOT_URL}/request-payments/bulk-print`,
      data
    );
  }

  directDeposit(data: any) {
    return this.http.post<any>(
      `${this.ROOT_URL}/request-payments/direct-deposit`,
      data
    );
  }
  achDebit() {
    return this.http.post<any>(
      `${this.ROOT_URL}/manual-ach/permission-check`,
      ''
    );
  }
  // Recurring Payments
  cancelSubscription(id: string) {
    return this.http.post<any>(
      `${this.ROOT_URL}/request-payments/${id}/cancel-subscription`,
      ''
    );
  }

  // get active log
  recieveCheckActiveLog(id: string) {
    return this.http.get<IApiRes<IReceiveCheckActivityLog[]>>(
      `${this.ROOT_URL}/request-payments/${id}/activity-logs`
    );
  }

  // manual ach create
  createManualAch(data: any) {
    return this.http.post<any>(`${this.ROOT_URL}/manual-ach/`, data);
  }
  // SET REQUEST PAYMENT DATA
  setRequestPaymentDatA(data: any) {
    this._localStorageService.setItem('r_pmt_cTnd_tA', data);
  }
  // GET REQUEST PAYMENT DATA
  getRequestPaymentDatA() {
    return this._localStorageService.getItem('r_pmt_cTnd_tA');
  }
  // get count of payment Link
  getCountOfpaymentLink() {
    return this.http.get<any>(
      `${this.ROOT_URL}/request-payments/pending/count`
    );
  }

  sendPod(payload: FormData) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/request-payments/send-delivery-proof`,
      payload
    );
  }

  uploadPodFromPhone(payload: {
    documentType: string[];
    encryptedId: string;
    uu_id: string;
    requestType: string;
    phone?: string;
  }) {
    return this.http.post<IApiRes<{ data: IUploadFromPhoneData }>>(
      `${this.ROOT_URL}/request-payments/payment-proof-of-delivery/upload-file-from-phone`,
      payload
    );
  }
}
