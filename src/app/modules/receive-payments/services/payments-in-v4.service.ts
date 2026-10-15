import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { environment } from 'src/environments/environment';

export interface IRequestPaymentsSummary {
  total_count: number;
  total_amount: number;
  completed_count: number;
  completed_amount: number;
  pending_count: number;
  pending_amount: number;
  new_count: number;
  new_amount: number;
  rejected_count: number;
  rejected_amount: number;
  received_this_month_count: number;
  received_this_month_amount: number;
}

export interface IRequestPaymentsDashboardData {
  summary: IRequestPaymentsSummary;
  metrics: {
    high_value_count: number;
    high_value_threshold: number;
    recurring_count: number;
  };
}

export interface ITopPayer {
  payer_id: string;
  payer_name: string;
  payer_email: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  total_count: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  last_payment_date: string;
  first_payment_date: string;
  avg_payment_amount: number;
}

export interface ITopPayersDashboardData {
  payers: ITopPayer[];
  summary: {
    total_payers_count: number;
    displayed_payers_count: number;
    displayed_total_amount: number;
    displayed_percentage: number;
    all_payers_total_amount: number;
  };
  period_info: { period: string; start_date: string; end_date: string };
}

@Injectable({ providedIn: 'root' })
export class PaymentsInService {
  private http = inject(HttpClient);
  private ROOT_URL = environment.rootUrl;

  readonly refreshTrigger = signal(0);
  notifyPaymentReceived(): void {
    this.refreshTrigger.update((v) => v + 1);
  }

  getDashboardSummary(): Observable<IApiRes<IRequestPaymentsDashboardData>> {
    return this.http.get<IApiRes<IRequestPaymentsDashboardData>>(
      `${this.ROOT_URL}/request-payments/dashboard/summary`
    );
  }

  getTopPayers(): Observable<IApiRes<ITopPayersDashboardData>> {
    return this.http.get<IApiRes<ITopPayersDashboardData>>(
      `${this.ROOT_URL}/request-payments/dashboard/top-payers`
    );
  }

  /**
   * Get payee statistics for the dashboard (e.g. last transactions from sender).
   * @param senderForUserId - Sender user id from the check row.
   */
  getPayeeStatistics(senderForUserId: number): Observable<IApiRes<unknown>> {
    return this.http.post<IApiRes<unknown>>(
      `${this.ROOT_URL}/payees/dashboard/get-payee-statistics`,
      { sender_for_user_id: senderForUserId }
    );
  }
}
