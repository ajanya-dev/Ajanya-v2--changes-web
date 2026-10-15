import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes, IApiResMesssage, IApiResWithMsg } from 'src/app/models/api';
import { IEmailBillsResponse, IValidateCreditBillData } from 'src/app/modules/bill/model/Bill';
import {
  IBillAttachement,
  IBillBulkPaymentData,
  IBillComment,
  INewBill,
  IUplaodExtractionResult
} from 'src/app/modules/bill/model/Bill';
import {
  ICreateBill,
  ICredits,
  IUpdateBill,
  IViewBill
} from 'src/app/modules/invoices/model/invoice';
import { environment } from 'src/environments/environment';

export interface IBillQuickCard {
  type: 'to_pay_this_month' | 'paid_this_month' | 'due_this_month' | 'overdue' | 'total_this_month' | 'average_time_to_pay';
  total_amount?: number;
  count?: number;
  average_days?: number;
}

export interface IBillTimelineEntry {
  count: number;
  amount: number;
}

export interface IBillTimelineData {
  timeline: Record<string, IBillTimelineEntry>;
  monthly_summary: {
    early: { amount: number; percentage: number };
    on_time: { amount: number; percentage: number };
    late: { amount: number; percentage: number };
  };
}

export interface IBillVendor {
  vendor_id: number;
  vendor_name: string;
  paid: { amount: number; count: number };
  pending: { amount: number; count: number };
  overdue: { amount: number; count: number };
}

export interface IBillRiskIndicator {
  type: 'overdue_bills' | 'bills_due_this_week' | 'upcoming_bills' | 'duplicate_bills' | 'high_amount_bills';
  count: number;
  amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class BillService {
  ROOT_URL = environment.rootUrl;

  private http = inject(HttpClient);

  /**
   * @description This bill id is passed along with the paylod when doing a bill payment.
   */
  billId = signal<string[] | undefined>(undefined);

  deleteBills(billId: string) {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/bills/${billId}`
    );
  }

  voidBill(billId: string) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/bills/${billId}/void`,
      {}
    );
  }

  markAsPaid(Id: string[] | string, data = {}) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/bills/${Id}/mark-as-paid`,
      data
    );
  }

  UnvoidBill(billId: string[] | string, data = {}) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/bills/${billId}/un-void`,
      data
    );
  }

  multiDelete(data: { ids: string[] }) {
    return this.http.delete<IApiResMesssage>(`${this.ROOT_URL}/bills/`, {
      body: data
    });
  }

  multiVoid(bills: { ids: string[] }) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/bills/multi-void`,
      bills
    );
  }

  createBill(data: INewBill): Observable<IApiRes<ICreateBill>> {
    return this.http.post<IApiRes<ICreateBill>>(`${this.ROOT_URL}/bills`, data);
  }

  updateBill(
    id: string | number,
    data: INewBill
  ): Observable<IApiRes<IUpdateBill>> {
    return this.http.put<IApiRes<IUpdateBill>>(
      `${this.ROOT_URL}/bills/${id}`,
      data
    );
  }

  auditTrial(billId: string) {
    return this.http.get(`${this.ROOT_URL}/bills/${billId}/audit-trail`);
  }

  viewBill(billId: string): Observable<IApiRes<IViewBill>> {
    return this.http.get<IApiRes<IViewBill>>(
      `${this.ROOT_URL}/bills/${billId}`
    );
  }

  getComments(billId: string): Observable<IApiRes<IBillComment[]>> {
    return this.http.get<IApiRes<IBillComment[]>>(
      `${this.ROOT_URL}/bills/${billId}/comments`
    );
  }

  getAttachments(billId: string): Observable<IApiRes<IBillAttachement[]>> {
    return this.http.get<IApiRes<IBillAttachement[]>>(
      `${this.ROOT_URL}/bills/${billId}/attachments`
    );
  }

  openAttachment(
    billId: string,
    attachmentId: string
  ): Observable<IApiRes<string>> {
    return this.http.get<IApiRes<string>>(
      `${this.ROOT_URL}/bills/${billId}/attachments/${attachmentId}`
    );
  }

  deleteAttachment(
    billId: string,
    attachmentId: string
  ): Observable<{ success: true }> {
    return this.http.delete<{ success: true }>(
      `${this.ROOT_URL}/bills/${billId}/attachments/${attachmentId}`
    );
  }

  extractInvoice(
    body: FormData
  ): Observable<IApiResWithMsg<IUplaodExtractionResult>> {
    return this.http.post<IApiResWithMsg<IUplaodExtractionResult>>(
      `${this.ROOT_URL}/bills/extract/doc`,
      body
    );
  }

  approve(billId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/bills/${billId}/approve`,
      {}
    );
  }

  reject(billId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/bills/${billId}/reject`,
      {}
    );
  }

  // for status = Approval Required (13)
  multiApprove(billIds: string[]): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/bills/multi-approve`,
      {
        ids: billIds
      }
    );
  }

  multiReject(billIds: string[]): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/bills/multi-reject`,
      {
        ids: billIds
      }
    );
  }

  printBill(billId: string): Observable<IApiRes<{ printData: string }>> {
    return this.http.get<IApiRes<{ printData: string }>>(
      `${this.ROOT_URL}/bills/${billId}/print`
    );
  }

  bulkPrint(ids: string[]): Observable<IApiRes<{ printData: string }>> {
    return this.http.post<IApiRes<{ printData: string }>>(
      `${this.ROOT_URL}/bills/bulk-print`,
      { ids }
    );
  }

  getBillBulkPaymentData(
    bill_ids: string[]
  ): Observable<IApiRes<IBillBulkPaymentData>> {
    return this.http.post<IApiRes<IBillBulkPaymentData>>(
      `${this.ROOT_URL}/bills/payment/record-bulk-payments`,
      { bill_ids }
    );
  }

  getCredits(billId: string, payeeId: string): Observable<IApiRes<ICredits[]>> {
    return this.http.post<IApiRes<ICredits[]>>(
      `${this.ROOT_URL}/bills/${billId}/vendor-credits`,
      { payeeId }
    );
  }

  deleteCredit(billId: string, creditId: string): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/bills/${billId}/vendor-credits/${creditId}`
    );
  }

  isPending(): Observable<
    IApiRes<{
      isPending: number;
      isApprovalPendingBill: number;
      billApprovalPermission: boolean;
      isEmailMapped: boolean;
      mappedEmail: string;
    }>
  > {
    return this.http.get<
      IApiRes<{
        isPending: number;
        isApprovalPendingBill: number;
        billApprovalPermission: boolean;
        isEmailMapped: boolean;
        mappedEmail: string;
      }>
    >(`${this.ROOT_URL}/bills/bill-list-data`);
  }

  /**
   * @description - API function for map ocw email to bill mail.
   * @param data - Payload for the API.
   */
  connectAndAutomateCall(data: { email_address: string }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/billing-emails`,
      data
    );
  }

  /**
   * @description - API function for getting email bills list from email ingestion.
   * @param payload - Filter payload with viewBy and filter options.
   */
  getEmailBills(payload: { viewBy: string; filter: string; page?: number }): Observable<IEmailBillsResponse> {
    const params = new URLSearchParams();
    params.set('viewBy', payload.viewBy);
    params.set('filter', payload.filter);
    if (payload.page) {
      params.set('page', payload.page.toString());
    }
    
    return this.http.get<IEmailBillsResponse>(
      `${this.ROOT_URL}/email-ingestion?${params.toString()}`
    );
  }

  /**
   * @description Delete an email bill by ID
   * @param id - The ID of the email bill to delete
   */
  deleteEmailBill(id: number): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(`${this.ROOT_URL}/email-ingestion/${id}`);
  }

 
  bulkInsertItems(billData: {item: string, quantity: string, price: string, description: string}[]): Observable<IApiRes<{id: string, encript_id: string, item: string, quantity: string, price: string, description: string}[]>> {
    return this.http.post<IApiRes<{id: string, encript_id: string, item: string, quantity: string, price: string, description: string}[]>>(
      `${this.ROOT_URL}/invoice-items/bulk-insert`,
      billData
    );
  }

  /**
   * @description Delete an email bill by ID
   * @param id - The ID of the email bill to delete
   */
  deleteEmailBillBulk(ids: number[]): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(`${this.ROOT_URL}/email-ingestion/bulk-delete`, { body: { ids } });
  }

  validateCreditApplied(billId: string, creditAmount: number): Observable<IApiResWithMsg<IValidateCreditBillData>> {
    return this.http.post<IApiResWithMsg<IValidateCreditBillData>>(`${this.ROOT_URL}/bills/${billId}/validate-credit`, { creditAmount });
  }

  getOverviewQuickCards(): Observable<IApiRes<IBillQuickCard[]>> {
    return this.http.get<IApiRes<IBillQuickCard[]>>(
      `${this.ROOT_URL}/bills/bills-overview/quick-cards`
    );
  }

  getOverviewPaymentTimeline(): Observable<IApiRes<IBillTimelineData[]>> {
    return this.http.get<IApiRes<IBillTimelineData[]>>(
      `${this.ROOT_URL}/bills/bills-overview/payment-timeline`
    );
  }

  getOverviewTopVendors(): Observable<IApiRes<IBillVendor[]>> {
    return this.http.get<IApiRes<IBillVendor[]>>(
      `${this.ROOT_URL}/bills/bills-overview/vendors`
    );
  }

  getOverviewRiskIndicators(): Observable<IApiRes<IBillRiskIndicator[]>> {
    return this.http.get<IApiRes<IBillRiskIndicator[]>>(
      `${this.ROOT_URL}/bills/bills-overview/risk-indicators`
    );
  }
}
