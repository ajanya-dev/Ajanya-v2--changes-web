import { inject, OnDestroy, Injectable, signal } from '@angular/core';
import {
  Observable,
  Subject,
  Subscription,
  BehaviorSubject,
  ReplaySubject,
  forkJoin
} from 'rxjs';
import { debounceTime, filter, finalize, switchMap } from 'rxjs/operators';
import { IBankDropdown } from 'src/app/models/bank';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { IWalletData } from 'src/app/models/wallet';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { ICheckAttachmentsCount } from 'src/app/models/v3-datatable';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { Router } from '@angular/router';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';

@Injectable({
  providedIn: 'root'
})
export class V3PaymentsTableService implements OnDestroy {
  /* Injectors */
  private http = inject(HttpClient);
  private bankAccountsService = inject(BankAccountsService);
  private sharedService = inject(SharedService);
  private cyberSourceService = inject(CybersourceService);
  private v3DataTableService = inject(V3DataTableService);
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);
  private router = inject(Router);

  ROOT_URL = environment.rootUrl;
  env = environment;
  private subscriptions: Subscription[] = [];

  private get activeAlertService() {
    return this.router.url.includes('/v4/')
      ? this.v4AlertService
      : this.alertService;
  }

  private updateOnGetCountAPICompletionSubject = new ReplaySubject<boolean>(1);
  private recheckPaymentsTableValidationSubject = new Subject<boolean>();
  private dynamicSourceNameClearingSubject = new Subject<{ uuid: string }>();

  private paymentSourceChangedSubject = new Subject<{ uuid: string }>();
  private isPendingChecksSubject = new BehaviorSubject<1 | 0>(1);
  /**
   * @description Subject that connects the changes in source and type in payment table
   */
  isSourceSelected = new BehaviorSubject<{
    uuid: string;
    transferType: string;
    transferId: string;
  }>({ uuid: '', transferType: '', transferId: '' });

  bankAccounts: IBankDropdown[] = [];
  cardList: IExistingCreditCards[] = [];
  page = 1;
  pageWallet = 1;
  addTag = false;
  searchTerm = '';
  walletList: IWalletData[];
  attachmentsAndCommentsList: ICheckAttachmentsCount[];
  isOldCheckListShown = false;
  isQbTransactionsShown = false;
  isNetsuiteFailedPaymentsShown = false;

  /**
   * @description True when the default payments grid should be shown, i.e. none
   * of the alternate tabs (old check list, QuickBooks transactions, NetSuite
   * failed payments) are active.
   */
  get isDefaultPaymentsTableShown(): boolean {
    return (
      !this.isOldCheckListShown &&
      !this.isQbTransactionsShown &&
      !this.isNetsuiteFailedPaymentsShown
    );
  }
  isHamaspik: boolean;
  isMultiLevelPluginEnabled: boolean;
  cardsDataDispatched = false;
  isReprintLoading = signal(false);
  isAcceptLoading = signal(false);
  isRejectLoading = signal(false);
  refershPendingApprovalSignal = signal(false);

  /**
   * @description The main function we call when we need to load the
   * Payments Data Table.
   *
   * @usageNotes Add any functions you need to call on
   * table initialisation here.
   */
  loadV3PaymentsTableData() {
    this.getCards();
    this.listenForTableDataLoad();
  }

  listenForTableRefresh() {
    // hasV3DataTableLoaded$ already fires after every table load including
    // refreshes, so no additional wiring is needed here.
  }

  /**
   * @description Sets up a single long-lived subscription that reacts to
   * every table data load. switchMap cancels any in-flight get-count API
   * calls if a new load arrives before they complete, preventing duplicate
   * requests from accumulating across refreshes.
   */
  listenForTableDataLoad() {
    this.subscriptions.push(
      this.v3DataTableService.hasV3DataTableLoaded$.pipe(
        filter(Boolean),
        switchMap(() => {
          const allCheckIds: string[] = [];
          const allZilPaymentsIds: string[] = [];
          this.v3DataTableService.rowData?.forEach((rowItem) => {
            if (rowItem.transfer_type_code === 'check') {
              if (rowItem.transfer_id) {
                allCheckIds.push(rowItem.transfer_id);
              }
            } else if (rowItem.zilpayment_id) {
              allZilPaymentsIds.push(rowItem.zilpayment_id);
            }
          });
          return forkJoin([
            this.getAddAttachmentAndCommentsData('checks', {
              ids: allCheckIds
            }),
            this.getAddAttachmentAndCommentsData('zil-payments', {
              ids: allZilPaymentsIds
            })
          ]);
        })
      ).subscribe({
        next: ([checksResponse, zilResponse]) => {
          this.attachmentsAndCommentsList = [
            ...checksResponse.data,
            ...zilResponse.data
          ];
          this.updateOnGetCountAPICompletion = true;
        }
      })
    );
  }

  /**
   * @description This fetches the list of Cards.
   */
  getCards() {
    this.subscriptions.push(
      this.cyberSourceService.getExistingCards().subscribe((res) => {
        if (res?.success) {
          this.cardList = res?.data;
        }
      })
    );
  }

  /**
   * Get the next ten elements each time the user
   * scrolls to the end of the list.
   */
  onScrollToEnd() {
    this.subscriptions.push(
      this.bankAccountsService
        .getBankAccounts(
          this.page + 1,
          this.searchTerm,
          this.addTag ? 1 : undefined
        )
        .subscribe((res) => {
          this.page += 1;
          res.data.forEach((bankAccount: IBankDropdown) => {
            this.bankAccounts.push(bankAccount);
          });
        })
    );
  }

  /**
   * Get bank accounts based on search event.
   * @param event Contains the search term.
   */
  search(event: Event) {
    const eventTarget = event.target as HTMLInputElement;
    this.searchTerm = eventTarget.value;

    this.page = 1;
    this.subscriptions.push(
      this.bankAccountsService
        .getBankAccounts(this.page, this.searchTerm)
        .pipe(debounceTime(600))
        .subscribe((res) => {
          this.bankAccounts = res.data;
        })
    );
  }

  /**
   * @description Gets attachments and comments.
   * @param dataTable This is the name of the table
   * Eg: ```checks```
   * @param ids This is an array of strings and we can combine all
   * the ids we need to check and put it in a single array
   * @returns The data we get is in the form of ```ICheckAttachmentsCount[]```
   * format and we can check if each row has an attachment or comment from the
   * floating component.
   */
  getAddAttachmentAndCommentsData(
    dataTable: string,
    ids: { ids: string[] }
  ): Observable<IApiRes<ICheckAttachmentsCount[]>> {
    return this.http.post<IApiRes<ICheckAttachmentsCount[]>>(
      `${this.ROOT_URL}/${dataTable}/get-count`,
      ids
    );
  }

  /**
   * @description Setter of Sending True After Get
   * Count API is Completed
   */
  set updateOnGetCountAPICompletion(data: boolean) {
    this.updateOnGetCountAPICompletionSubject.next(data);
  }

  /**
   * @description Getter of Sending True After Get
   * Count API is Completed
   */
  get updateOnGetCountAPICompletion$(): Observable<boolean> {
    return this.updateOnGetCountAPICompletionSubject.asObservable();
  }

  /**
   * @description Setter of dynamically clearing the
   * source name after source type is updated
   */
  set dynamicSourceNameClearing(data: { uuid: string }) {
    this.dynamicSourceNameClearingSubject.next(data);
  }

  /**
   * @description Getter of dynamically clearing the
   * source name after source type is updated
   */
  get dynamicSourceNameClearing$(): Observable<{ uuid: string }> {
    return this.dynamicSourceNameClearingSubject.asObservable();
  }

  /**
   * @description Setter fired by the v4 unified source picker once the user has
   * confirmed a new funding source, so the Type cell can drop a payment type the
   * new source does not offer before the update payload is built.
   *
   * Separate from `dynamicSourceNameClearing`, which the source dropdown also
   * listens to in order to wipe its own selection — exactly what must NOT happen
   * here, since v4 picks the source type and the source item in one step.
   */
  set paymentSourceChanged(data: { uuid: string }) {
    this.paymentSourceChangedSubject.next(data);
  }

  /**
   * @description Getter for {@link paymentSourceChanged}.
   */
  get paymentSourceChanged$(): Observable<{ uuid: string }> {
    return this.paymentSourceChangedSubject.asObservable();
  }

  /**
   * @description Setter of dynamically clearing the
   * source name after source type is updated
   */
  set triggerPaymentsTableValidation(data: boolean) {
    this.recheckPaymentsTableValidationSubject.next(data);
  }

  /**
   * @description Getter of dynamically clearing the
   * source name after source type is updated
   */
  get triggerPaymentsTableValidation$(): Observable<boolean> {
    return this.recheckPaymentsTableValidationSubject.asObservable();
  }

  /**
   * @description Setter of ispending checks value;
   */
  set isPendingChecks(value: 1 | 0) {
    this.isPendingChecksSubject.next(value);
  }

  /**
   * @description Getter of ispending checks value;
   */
  get isPendingChecks$() {
    return this.isPendingChecksSubject.asObservable();
  }

  /**
   * @description Get the proof of payment link
   *
   * @param id <string>
   * @returns <IApiRes<string>>
   */
  getProofOfPayment(id: string): Observable<IApiRes<string>> {
    return this.http.get<IApiRes<string>>(
      `${this.ROOT_URL}/zil-payments/${id}/report`
    );
  }

  /**
   * @description Get the proof of payment link
   *
   * @param id <string>
   * @returns <IApiRes<string>>
   */
  getProofOfPaymentForMailed(id: string): Observable<IApiRes<string>> {
    return this.http.get<IApiRes<string>>(
      `${this.ROOT_URL}/zil-payments/${id}/mailed-report`
    );
  }

  /**
   * @description Bulk delete method in payment table
   *
   */

  bulkDelete(checkIds: string[], nonCheckIds: string[]): void {
    const responses = [];
    if (checkIds.length) {
      const checkDelete$ = this.checkService.deleteMulitpleCheck({
        ids: checkIds
      });
      responses.push(checkDelete$);
    }
    if (nonCheckIds.length) {
      const nonCheckDelete$ = this.deleteNonCheckTransactions(nonCheckIds);
      responses.push(nonCheckDelete$);
    }
    this.subscriptions.push(
      forkJoin([...responses]).subscribe({
        next: () => {
          const data = {
            content: 'Deleted',
            close: true,
            timeout: 1500
          };
          this.activeAlertService.successAlert(data);
          this.v3DataTableService.refreshV3DataTable();
        },
        error: (err) => {
          if (
            err.error.permissionType === 'action' &&
            err.error.permissionRequired && !this.router.url.includes('/v4/')
          ) {
            this.activeAlertService.warningAlert({
              content: "You don't have permission to do this action"
            });
          }
        }
      })
    );
  }

  deleteNonCheckTransactions(
    noncheckIds: string[]
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/zil-payments/multi-delete`,
      { uu_ids: noncheckIds }
    );
  }

  /**
   * @description Bulk void method in payment table
   *
   */
  bulkVoid(checkIds: string[], nonCheckIds: string[]): void {
    const responses = [];
    if (checkIds.length) {
      const checkVoid$ = this.checkService.voidmultipleCheck({
        ids: checkIds
      });
      responses.push(checkVoid$);
    }
    if (nonCheckIds.length) {
      const nonCheckVoid$ = this.voidNonCheckTransactions(nonCheckIds);
      responses.push(nonCheckVoid$);
    }
    this.subscriptions.push(
      forkJoin([...responses]).subscribe({
        next: () => {
          const data = {
            content: 'Voided.',
            close: true,
            timeout: 1500
          };
          this.activeAlertService.successAlert(data);
          this.v3DataTableService.refreshV3DataTable();
        },
        error: (err) => {
          if (
            err.error.permissionType === 'action' &&
            err.error.permissionRequired && !this.router.url.includes('/v4/')
          ) {
            this.activeAlertService.warningAlert({
              content: "You don't have permission to do this action"
            });
          }
        }
      })
    );
  }

    /**
   * @description Requests re-print approval for the given payment IDs.Currently, this is only used for CSNHC enterprise customers.
   * @param paymentidList - List of payment IDs.
   */
    requestRePrintApproval(paymentidList: string[],isLoading = true) {
      this.isReprintLoading.set(isLoading);
      this.subscriptions.push(
      this.checkService.requestRePrint(paymentidList).pipe(
        finalize(() => {
          this.isReprintLoading.set(false);
        })
      ).subscribe((res) => {
        if (res.success) {
            this.refreshDataTable();
            this.alertService.successAlert({ content: res.message });
          }
        })
      );
    }

    /**
   * @description Handles the re-print check request approval or rejection.It is used for CSNHC enterprise customers.
   * @param mode - The mode of the request. 'approve' for approval and 'reject' for rejection.
   */
    handleReprintCheckRequest(paymentidList: string[],mode: 'approve' | 'reject',isLoading = true) {
      this.alertService.infoAlert({
        content: `Are you sure you want to ${mode} these reprint requests?`,
        doneMsg: mode === 'approve' ? 'Approve' : 'Reject',
        isCancel: true
      }).afterClosed().subscribe((res) => {
        if(res) {
          this.refershPendingApprovalSignal.set(false);
          if(mode === 'approve') {
            this.isAcceptLoading.set(isLoading);
          } else {
            this.isRejectLoading.set(isLoading);
          }
          this.subscriptions.push(
            this.checkService.reviewReprintCheckRequest(paymentidList,mode === 'approve' ? 'reprint-approve' : 'reprint-reject').pipe(
              finalize(() => {
                if(mode === 'approve') {
                  this.isAcceptLoading.set(false);
                } else {
                  this.isRejectLoading.set(false);
                }
              })
            ).subscribe((res) => {
              if (res.success) {
                this.alertService.successAlert({ content: res.message });
                this.refreshDataTable();
                this.refershPendingApprovalSignal.set(true);
              }
            })
          );
        }
      });
    }

    refreshDataTable() {
      this.v3DataTableService.refreshV3DataTable();
      this.v3DataTableService.v3RowSelectionData = [];
      this.v3DataTableService.gridApi?.deselectAll();
    }

  /**
   * method for multi void non-check payments
   */
  voidNonCheckTransactions(noncheckIds: string[]): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/zil-payments/multi-cancel`,
      { uu_ids: noncheckIds }
    );
  }

  ngOnDestroy(): void {
    this.sharedService.setNewBankCreatedData(undefined);
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.cardsDataDispatched = false;
  }
}
