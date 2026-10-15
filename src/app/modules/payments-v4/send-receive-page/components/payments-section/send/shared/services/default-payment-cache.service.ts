import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { IDefaultPayment } from 'src/app/modules/payments/model/payments';

interface IEntry {
  companyId: string;
  value: IDefaultPayment | null;
  fetchedAt: number;
}

/**
 * App-root cache for the default payment. Kept off the page-scoped services so the
 * `get-default-payment` call is not repeated on every visit to the send page.
 */
@Injectable({ providedIn: 'root' })
export class DefaultPaymentCacheService {
  private readonly payments = inject(PaymentsService);
  private readonly companies = inject(CompanyManagementService);
  private readonly entry = signal<IEntry | null>(null);
  private readonly ttlMs = 5 * 60 * 1000;

  /** A fresh entry for the active company, or null when cold, stale, or company-switched. */
  private validEntry(): IEntry | null {
    const e = this.entry();
    if (!e || e.companyId !== this.companies.getActiveCompanyId()) {
      return null;
    }
    return Date.now() - e.fetchedAt > this.ttlMs ? null : e;
  }

  /** True when a warm entry exists — used to decide whether to show a skeleton. */
  hasFresh(): boolean {
    return !!this.validEntry();
  }

  /** Warm entry → no API call; otherwise fetch once and cache the result (including null). */
  get(): Observable<IDefaultPayment | null> {
    const entry = this.validEntry();
    if (entry) {
      return of(entry.value);
    }

    const companyId = this.companies.getActiveCompanyId();
    return this.payments.getDefaultPayment().pipe(
      map((res) => (res?.success ? (res.data?.default_payment_method ?? null) : null)),
      tap((value) => this.entry.set({ companyId, value, fetchedAt: Date.now() })),
      catchError(() => of(null))
    );
  }

  /** Overwrite the cached default for the active company (used for optimistic set). */
  set(value: IDefaultPayment | null): void {
    this.entry.set({
      companyId: this.companies.getActiveCompanyId(),
      value,
      fetchedAt: Date.now()
    });
  }

  invalidate(): void {
    this.entry.set(null);
  }
}
