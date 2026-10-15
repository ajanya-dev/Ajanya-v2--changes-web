import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable, from, of, firstValueFrom } from 'rxjs';
import {
  catchError,
  concatMap,
  finalize,
  map,
  tap,
  take
} from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IApiRes } from 'src/app/models/api';
import {
  IZilPyamentLists,
  IPaymentSummaryData,
  IRequiredDocument,
  IRequiredDocumentRes
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4CheckModeSelectModalComponent } from '../modals/v4-check-mode-select-modal/v4-check-mode-select-modal.component';
import { V4BulkPaymentModalComponent } from '../modals/v4-bulk-payment-modal/v4-bulk-payment-modal.component';
import { V3DataTableService } from '../../v3-data-table/services/v3-data-table.service';

interface IZilPaymentListsExtended extends IZilPyamentLists {
  PaymentMethode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class V4BulkPaymentService {
  private http = inject(HttpClient);
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);

  private ROOT_URL = environment.rootUrl;

  // State signals
  paymentListData = signal<IZilPyamentLists[]>([]);
  totalPaymentAmount = signal<number>(0);
  totalPaymentCount = signal<number>(0);
  isApiReady = signal<boolean>(false);
  isBulkPaymentProcessing = signal<boolean>(false);
  completedPaymentCount = signal<number>(0);
  totalCost = signal<number>(0);
  totalShippingFee = signal<number>(0);
  totalAttachmentFee = signal<number>(0);
  isLoadingAttachmentFee = signal<boolean>(false);
  isWalletCheckMail = signal<boolean>(false);
  isWalletCheck = signal<boolean>(false);

  // Child component initialization tracking — children call registerChildLoading()
  // on init and markChildReady() when their initial data load completes.
  // Modal shows a global loader while any child is still initializing.
  private initializingChildren = signal<Set<string>>(new Set());
  isAnyChildInitializing = computed(() => this.initializingChildren().size > 0);

  registerChildLoading(key: string): void {
    this.initializingChildren.update((set) => {
      const next = new Set(set);
      next.add(key);
      return next;
    });
  }

  markChildReady(key: string): void {
    this.initializingChildren.update((set) => {
      if (!set.has(key)) return set;
      const next = new Set(set);
      next.delete(key);
      return next;
    });
  }

  // Required docs for card payments
  requiredDocs: IRequiredDocument[] = [];

  // IDs
  bulkPaymentsUuidList: string[] = [];
  bulkPaymentsCheckIdList: string[] = [];

  // Summary data
  bulkPaymentSummary: (IPaymentSummaryData | IPaymentSummaryData[])[] = [];
  bulkPaymentCount = signal<number>(0);

  // Stored check grouping data (captured from check-mode-select modal)
  storedCheckMailPayments: IZilPaymentListsExtended[] = [];
  storedCheckEmailPayments: IZilPaymentListsExtended[] = [];
  storedCheckPrintPayments: IZilPaymentListsExtended[] = [];
  storedCheckDDPayments: IZilPaymentListsExtended[] = [];

  // Computed
  hasBankCheckPayments = computed(() =>
    this.paymentListData().some(
      (p) => p.sourceType === 'BANK' && p.transferType === 'CHECK'
    )
  );

  getBankCheckPayments(): IZilPyamentLists[] {
    return this.paymentListData().filter(
      (p) => p.sourceType === 'BANK' && p.transferType === 'CHECK'
    );
  }

  /**
   * Removes all BANK+CHECK payments from paymentListData and updates totals.
   * Used when the check-mode-select modal is cancelled/closed.
   */
  private removeBankCheckPayments(): void {
    const currentPayments = this.paymentListData();
    const remaining = currentPayments.filter(
      (p) => !(p.sourceType === 'BANK' && p.transferType === 'CHECK')
    );

    if (remaining.length === currentPayments.length) return;

    const removedAmount = currentPayments
      .filter((p) => p.sourceType === 'BANK' && p.transferType === 'CHECK')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    this.paymentListData.set(remaining);
    this.totalPaymentAmount.update((a) => a - removedAmount);
    this.totalPaymentCount.set(remaining.length);

    this.v3BulkPaymentService.paymentListData = remaining;
    this.v3BulkPaymentService.totalPaymentAmount.update(
      (a) => a - removedAmount
    );
    this.v3BulkPaymentService.totalPaymentCount.set(remaining.length);
  }

  initBulkPayment(uuids: string[], checkIds: string[]): void {
    this.reset();
    this.bulkPaymentsUuidList = uuids;
    this.bulkPaymentsCheckIdList = checkIds;

    // Also init v3 service (for check-mode-select modal compatibility)
    this.v3BulkPaymentService.bulkPaymentsUuidList = uuids;
    if (checkIds?.length) {
      this.v3BulkPaymentService.bulkPaymentsCheckIdList = checkIds;
    }
    this.v3BulkPaymentService.paymentListData = [];
  }

  getZilPaymentDetails(): Observable<IZilPyamentLists[]> {
    const body: Record<string, unknown> & { checkIds?: string[] } = {
      ids: this.bulkPaymentsUuidList
    };
    if (this.bulkPaymentsCheckIdList?.length) {
      body.checkIds = this.bulkPaymentsCheckIdList;
    }

    return this.http
      .post<
        IApiRes<IZilPyamentLists[]>
      >(`${this.ROOT_URL}/zil-payments/get-list`, body)
      .pipe(
        map((res) => {
          const data = res?.data || [];
          this.paymentListData.set(data);

          // Sync to v3 service
          this.v3BulkPaymentService.paymentListData = data;

          // Calculate totals
          let totalAmount = 0;
          data.forEach((item) => {
            totalAmount += Number(item.amount);
          });
          this.totalPaymentAmount.set(totalAmount);
          this.totalPaymentCount.set(data.length);
          this.v3BulkPaymentService.totalPaymentAmount.set(totalAmount);
          this.v3BulkPaymentService.totalPaymentCount.set(data.length);

          // Check wallet payments
          const hasWalletCheck = data.some(
            (item) =>
              item.sourceType === 'WALLET' &&
              (item.transferType === 'MAIL' || item.transferType === 'CHECK')
          );
          const hasWalletCheckMail = data.some(
            (item) =>
              item.sourceType === 'WALLET' &&
              item.transferTypeCode === 'checkMail'
          );
          this.isWalletCheck.set(hasWalletCheck);
          this.isWalletCheckMail.set(hasWalletCheckMail);
          this.v3BulkPaymentService.isWalletCheck.set(hasWalletCheck);
          this.v3BulkPaymentService.isWalletCheckMail.set(hasWalletCheckMail);

          // Load shipping types if wallet check mail
          if (hasWalletCheckMail) {
            this.v3BulkPaymentService.loadShippingTypes();
          }

          // Signal ready on v3 service (for check-mode-select and child components)
          this.isApiReady.set(true);
          this.v3BulkPaymentService.isBulkPaymentsApiReady = true;

          return data;
        })
      );
  }

  checkForRequiredDocuments(): Observable<IRequiredDocument[]> {
    const data = this.paymentListData();
    const cardPayments = data.filter((item) => item.sourceType === 'CARD');
    if (cardPayments.length > 0) {
      const payments = cardPayments.map((item) => ({ uuid: item.id }));
      return this.http
        .post<IRequiredDocumentRes>(
          `${this.ROOT_URL}/payment-methods/multiple-required-documents`,
          { payments }
        )
        .pipe(
          map((res) => {
            if (res?.documents) {
              this.requiredDocs = res.documents;
              this.v3BulkPaymentService.requiredDocs = res.documents;
            }
            return this.requiredDocs;
          })
        );
    }
    return of([]);
  }

  async openBulkPaymentModals(
    paymentIds: string[],
    checkIds: string[] = [],
    options?: { paymentType?: string; onReady?: () => void; skipBankPrefill?: boolean }
  ): Promise<void> {
    if (!paymentIds.length && !checkIds.length) {
      options?.onReady?.();
      return;
    }

    if (this.isBulkPaymentProcessing()) {
      options?.onReady?.();
      this.alertService.infoAlert({
        content: 'A bulk payment is already processing. Please wait until it completes.'
      });
      return;
    }

    const paymentType = options?.paymentType ?? null;

    // Initialize IDs for v4 + v3 services
    this.initBulkPayment(paymentIds, checkIds);
    this.v3BulkPaymentService.checkOption = '';

    // 1. Load Zil payment details
    try {
      await firstValueFrom(this.getZilPaymentDetails());
    } catch {
      options?.onReady?.();
      this.alertService.failedAlert({
        content: 'Failed to load payment details'
      });
      return;
    }

    // 2. Check for required documents (card payments)
    await firstValueFrom(this.checkForRequiredDocuments());

    // 3. Capture check grouping Subject emissions before opening check-mode-select
    let capturedCheckMail: IZilPyamentLists[] = [];
    let capturedCheckEmail: IZilPyamentLists[] = [];
    let capturedCheckPrint: IZilPyamentLists[] = [];
    let capturedCheckDD: IZilPyamentLists[] = [];

    const subMail = this.v3BulkPaymentService.checkMailPayments
      .pipe(take(1))
      .subscribe((data) => {
        capturedCheckMail = data;
      });
    const subEmail = this.v3BulkPaymentService.checkEmailPayments
      .pipe(take(1))
      .subscribe((data) => {
        capturedCheckEmail = data;
      });
    const subPrint = this.v3BulkPaymentService.checkPrintPayments
      .pipe(take(1))
      .subscribe((data) => {
        capturedCheckPrint = data;
      });
    const subDD = this.v3BulkPaymentService.checkDDPayments
      .pipe(take(1))
      .subscribe((data) => {
        capturedCheckDD = data;
      });

    options?.onReady?.();

    try {
      // 4. If BANK+CHECK payments exist → open check-mode-select modal
      const bankCheckPayments = this.getBankCheckPayments();
      if (bankCheckPayments.length > 0) {
        const paymentMode =
          (paymentType === 'check' || paymentType === 'group-mail') ? 'group-mail' : 'all-payments';

        const checkModeResult = await firstValueFrom(
          this.dialog
            .open(V4CheckModeSelectModalComponent, {
              maxWidth: '900px',
              width: '95%',
              disableClose: true,
              panelClass: 'paddingless-modal-rounded',
              data: {
                tab: paymentType === 'check' ? 'check' : '',
                paymentMode
              }
            })
            .afterClosed()
        );

        if (!checkModeResult) {
          this.removeBankCheckPayments();
          if (this.paymentListData().length === 0) {
            return;
          }
        }
      }
    } finally {
      // Clean up subscriptions regardless of modal outcome
      subMail.unsubscribe();
      subEmail.unsubscribe();
      subPrint.unsubscribe();
      subDD.unsubscribe();
    }

    // 5. Open bulk payment modal with captured check grouping data
    this.dialog
      .open(V4BulkPaymentModalComponent, {
        maxWidth: '1300px',
        width: '95%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          checkMailPayments: capturedCheckMail,
          checkEmailPayments: capturedCheckEmail,
          checkPrintPayments: capturedCheckPrint,
          checkDDPayments: capturedCheckDD,
          skipBankPrefill: options?.skipBankPrefill ?? false
        }
      })
      .afterClosed()
      .subscribe((dialogResult) => {
        if (dialogResult) {
          this.v3DataTableService.refreshV3DataTable();
          this.v3DataTableService.v3RowSelectionData = [];
          this.v3DataTableService.gridApi?.deselectAll();
        }
      });
  }

  processAllPaymentsSequentially(
    observables: (() => Observable<unknown>)[]
  ): Observable<unknown[]> {
    const results: unknown[] = [];
    return from(observables).pipe(
      concatMap((obsFn) =>
        obsFn().pipe(
          tap((res) => results.push(res)),
          catchError((err) => {
            results.push(err);
            return of(err);
          }),
          finalize(() => {
            this.completedPaymentCount.update((c) => c + 1);
          })
        )
      ),
      map(() => results)
    );
  }

  reset(): void {
    this.paymentListData.set([]);
    this.totalPaymentAmount.set(0);
    this.totalPaymentCount.set(0);
    this.isApiReady.set(false);
    this.isBulkPaymentProcessing.set(false);
    this.completedPaymentCount.set(0);
    this.totalCost.set(0);
    this.totalShippingFee.set(0);
    this.totalAttachmentFee.set(0);
    this.isLoadingAttachmentFee.set(false);
    this.isWalletCheck.set(false);
    this.isWalletCheckMail.set(false);
    this.requiredDocs = [];
    this.bulkPaymentsUuidList = [];
    this.bulkPaymentsCheckIdList = [];
    this.bulkPaymentSummary = [];
    this.bulkPaymentCount.set(0);
    this.storedCheckMailPayments = [];
    this.storedCheckEmailPayments = [];
    this.storedCheckPrintPayments = [];
    this.storedCheckDDPayments = [];
    this.initializingChildren.set(new Set());
  }
}
