import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { Observable, Subject, Subscription, finalize, take } from 'rxjs';
import {
  IPayeeAuditTrialItem,
  IPayeeDropdown,
  IPayeeView
} from 'src/app/modules/payee/payee-v2/model/payee';
import {
  IApiRes,
  IApiResMesssage,
  IApiResSuccessOnly
} from 'src/app/models/api';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IGetContact } from 'src/app/shared/modal/add-contact/model/contact';
import { IGetTodo } from 'src/app/shared/modal/todo/model/todo';
import { IGetAttachment, IGetComment } from 'src/app/models/common';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { TransactionHistoryModalComponent } from 'src/app/modules/payments/shared/components/modals/transaction-history-modal/transaction-history-modal/transaction-history-modal.component';
import { ICashExpenseSummary } from 'src/app/modules/check/model/check';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V3DataTableService } from '../../../v3-data-table/services/v3-data-table.service';
import {
  IPayeeListsConnectedApps,
  IPayeeSummary
} from '../../model/payee.interface';
import { AchInviteEmailModalComponent } from '../../payee-v2/modals/ach-invite-email-modal/ach-invite-email-modal.component';

interface MergeLinkConfig {
  linkToken: string;
  onSuccess: (publicToken: string) => void;
  shouldSendTokenOnSuccessfulLink: boolean;
}
// Define an interface for the MergeLink module or class
interface MergeLinkModule {
  linkToken: string;
  initialize(config: MergeLinkConfig): void;
  openLink(): void;
}

declare let MergeLink: MergeLinkModule;

/** How often the NetSuite import estimate advances. */
const IMPORT_PROGRESS_TICK_MS = 250;

/**
 * The estimate climbs to here and waits. Only a success response takes it to
 * 100 — a failed import closes at this value, so the bar never reads as
 * complete for work that did not complete.
 */
const IMPORT_PROGRESS_CEILING = 80;

/** How long the filled bar stays up before the overlay closes. */
const IMPORT_PROGRESS_SETTLE_MS = 500;

@Injectable({
  providedIn: 'root'
})
export class PayeeDataV35Service implements OnDestroy {
  /** dependancy injection using inject method */
  private dataTableService = inject(V3DataTableService);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private netsuiteIntegrationService = inject(NetsuiteIntegrationService);
  private alertService = inject(AlertService);
  private integrationService = inject(IntegrationService);

  ROOT_URL = environment.rootUrl;

  /**
   * @description declaration of behavior subjects and variables
   */
  public payeeDataSignal = signal<IPayeeDropdown | undefined>(undefined);
  public editedPayeeSignal = signal<IPayeeDropdown | undefined>(undefined);
  public isGridViewSignal = signal<boolean>(true);
  public loadingSigal = signal<boolean>(true);
  public actionSignal = signal<string>('');
  public payeeSummarySignal = signal<{
    data: IPayeeSummary | undefined;
    loading: boolean;
    cashexpense: ICashExpenseSummary | undefined;
  }>({ data: undefined, loading: false, cashexpense: undefined });

  public payeeListSignal = signal<{
    allPayees: IPayeeDropdown[];
    filteredPayees: IPayeeDropdown[];
    searchedPayees: IPayeeDropdown[];
    loading: boolean;
  }>({
    loading: false,
    allPayees: [],
    filteredPayees: [],
    searchedPayees: []
  });

  public payeeViewSignal = signal<{
    data: IPayeeView | undefined;
    loading: boolean;
    auditTrial: IPayeeAuditTrialItem[];
    contactData?: { payee: string; data: IGetContact[] };
    todos?: { payee: string; data: IGetTodo[] };
    comments?: { payee: string; data: IGetComment[] };
    attachments?: { payee: string; data: IGetAttachment[] };
  }>({
    loading: false,
    data: undefined,
    auditTrial: []
  });

  updatingFromNetSuit = signal(false);
  updateSinglePayee = signal(false);

  private isPayeeSearchResult = new Subject<boolean>();
  refreshPayee = new Subject<boolean>();
  isConnectedSuccess = new Subject<boolean>();
  isConnectionLoading = new Subject<boolean>();
  subscriptions: Subscription[] = [];
  isSyncBank = signal(false);
  isImportPayee = signal(false);

  /**
   * Percentage for the NetSuite import overlay, or null when no import is
   * reporting progress. The backend returns nothing until it is finished, so
   * this is a paced estimate rather than real progress: it climbs while the
   * request is in flight, holds below completion however long that takes, and
   * only reaches 100 once the response is actually in. Imports that do not set
   * it keep the plain spinner.
   */
  importProgress = signal<number | null>(null);

  /** Ticks the estimate along; cleared as soon as the response settles. */
  private importProgressTimer: ReturnType<typeof setInterval> | undefined;
  isFromPayeeSummary = signal(false);
  public payeeBankTableActions = signal<{
    onClickNewBank: string | undefined;
    refreshBank: boolean;
    refreshInterBank: boolean;
  }>({
    onClickNewBank: undefined,
    refreshBank: false,
    refreshInterBank: false
  });

  /**
   * @description - Integrates a 3rd party application through the MergeLink using the provided token and app name.
   * @param token -The token for integrating the 3rd party application.
   * @param app - The name of the 3rd party application.
   */
  mergeLink(token: string): void {
    if (token) {
      MergeLink.linkToken = '';
      MergeLink.initialize({
        linkToken: token,
        onSuccess: (public_token: string) => this.onSuccesss(public_token),
        shouldSendTokenOnSuccessfulLink: false
      });
      MergeLink.openLink();
      const iframe = document.getElementById(
        'merge-link-iframe'
      ) as HTMLIFrameElement;
      if (iframe && iframe.style.display === 'none') {
        iframe.style.display = 'block';
      }
    }
  }

  resetPayeeSignal() {
    this.payeeDataSignal.set(undefined);
    this.editedPayeeSignal.set(undefined);
    this.payeeListSignal.set({
      loading: false,
      allPayees: [],
      filteredPayees: [],
      searchedPayees: []
    });
  }

  /**
   * @description Handles the success callback after obtaining a token from MergeLink.
   * Updates the previous token with the current token.
   * Sets the public token and performs further actions if a token is available.
   * Sends the account token, notifies the successful connection, and unsubscribes from the accountToken subscription.
   *
   * @param  token - The public token obtained from MergeLink.
   */
  onSuccesss(token: string): void {
    this.isConnectionLoading.next(true);
    if (token) {
      this.subscriptions.push(
        this.sendCRMAccountToken(token).subscribe(() => {
          this.isConnectionLoading.next(false);
          this.isConnectedSuccess.next(true);
        })
      );
    }
  }

  /**
   * @description Import Payee from netsuite.
   * This method is specially created for Compass Enterprise customers.
   * @param {booleam} refreshDataTable - Its optional,Used to refresh data table when value is true otherwise refresh payee list.
   */
  importFromNetSuite(refreshDataTable?: boolean): void {
    this.isImportPayee.set(true);
    this.startImportProgress();

    // Only a success response fills the bar. Read in finalize() so the failed
    // path is whatever did not set it — an error, or a response that came back
    // without success — rather than something each branch has to remember.
    let succeeded = false;

    this.subscriptions.push(
      this.netsuiteIntegrationService
        .importNetsuiteSettings('import-payees', 2)
        .pipe(
          finalize(() => {
            this.finishImportProgress(succeeded);
          })
        )
        .subscribe((res) => {
          succeeded = !!res?.success;
          if (res?.success) {
            if (refreshDataTable) {
              this.dataTableService.refreshV3DataTable();
            } else {
              this.refreshPayee.next(true);
            }
            this.alertService.successAlert({
              content: 'Successfully Imported.'
            });
          }
        })
    );
  }

  /**
   * Starts the paced estimate at zero and lets it climb. It slows as it goes
   * and stops short of the end, so a long import never sits at 100% waiting —
   * the bar only fills once the response has actually arrived.
   * @returns {void}
   */
  private startImportProgress(): void {
    this.clearImportProgressTimer();
    this.importProgress.set(0);

    this.importProgressTimer = setInterval(() => {
      const current = this.importProgress() ?? 0;
      if (current >= IMPORT_PROGRESS_CEILING) {
        return;
      }

      // Bigger steps early, smaller later: the slowdown is what reads as
      // "still working" rather than "stuck".
      const step = current < 60 ? 4 : 1;
      this.importProgress.set(
        Math.min(current + step, IMPORT_PROGRESS_CEILING)
      );
    }, IMPORT_PROGRESS_TICK_MS);
  }

  /**
   * Settles the bar and takes the overlay down. 100% is reserved for a success
   * response — a failed import must never look like it finished, so it closes
   * at the ceiling the estimate was already climbing towards. Held briefly
   * either way so the final state is actually seen.
   * @param {boolean} succeeded - Whether the import reported success.
   * @returns {void}
   */
  private finishImportProgress(succeeded: boolean): void {
    this.clearImportProgressTimer();
    this.importProgress.set(succeeded ? 100 : IMPORT_PROGRESS_CEILING);

    setTimeout(() => {
      this.isImportPayee.set(false);
      this.importProgress.set(null);
    }, IMPORT_PROGRESS_SETTLE_MS);
  }

  /** @returns {void} */
  private clearImportProgressTimer(): void {
    if (this.importProgressTimer) {
      clearInterval(this.importProgressTimer);
      this.importProgressTimer = undefined;
    }
  }

  /**
   * @description Import payees from HubSpot.
   * @param companyId - The IDs of the companies to import payees from.
   */
  importFromHubSpot(companyId?: string[]) {
    this.isImportPayee.set(true);
    this.subscriptions.push(
      this.integrationService
        .importHubSpotTransactions('1', companyId)
        .pipe(
          finalize(() => {
            this.isImportPayee.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Successfully imported payees.'
            });
            this.refreshPayee.next(true);
          }
        })
    );
  }

  importFromJobber(companyId?: string[]) {
    this.isImportPayee.set(true);
    this.subscriptions.push(
      this.integrationService
        .importJobberTransactions('1', companyId)
        .pipe(
          finalize(() => {
            this.isImportPayee.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Successfully imported payees.'
            });
            this.refreshPayee.next(true);
          }
        })
    );
  }

  importFromDayForce() {
    this.isImportPayee.set(true);
    this.subscriptions.push(
      this.integrationService
        .importDayforcePayees()
        .pipe(
          finalize(() => {
            this.isImportPayee.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Successfully imported payees.'
            });
            this.refreshPayee.next(true);
          }
        })
    );
  }

  importFromClio(companyId?: string[]) {
    this.isImportPayee.set(true);
    this.subscriptions.push(
      this.integrationService
        .importClioTransactions('1', companyId)
        .pipe(
          finalize(() => {
            this.isImportPayee.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: 'Successfully imported payees.'
            });
            this.refreshPayee.next(true);
          }
        })
    );
  }

  updatePayeesFromNetSuit() {
    this.updatingFromNetSuit.set(true);
    this.netsuiteIntegrationService
      .updatePayees()
      .pipe(
        finalize(() => {
          this.updatingFromNetSuit.set(false);
        }),
        take(1)
      )
      .subscribe((val) => {
        if (!val.success) return;
        this.alertService.successAlert({ content: 'Successfully Updated' });
        this.refreshPayee.next(true);
      });
  }

  updateSignlePayeeFromNetSuit(payeeId: string) {
    this.updateSinglePayee.set(true);
    this.netsuiteIntegrationService
      .updateSignlePayee({ id: payeeId })
      .pipe(
        finalize(() => {
          this.updateSinglePayee.set(false);
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: 'Successfully Updated' });
          this.dataTableService.refreshV3DataTable();
        }
      });
  }

  /**
   * @description clear subscriptions after component destroyed.
   */
  clearSubscriptions() {
    if (this.subscriptions)
      this.subscriptions.forEach((subs) => subs.unsubscribe());
  }

  /**
   * @description setting the subject isGridView$
   * @param status = boolean
   */
  setPayeeView(status: boolean) {
    if (!status && this.dataTableService.defaultPayload) {
      this.dataTableService.defaultPayload.filterModel = {};
    }
    this.isGridViewSignal.set(status);
  }

  /**
   * @description setting the subject isPayeeSearchResult if there is payee Search result
   * @param value
   */
  setPayeeSearchResult(value: boolean) {
    this.isPayeeSearchResult.next(value);
  }

  /**
   * @description getting payee search result subject.
   * @param value
   */
  getPayeeSearchResult() {
    return this.isPayeeSearchResult.asObservable();
  }

  /**
   * @description Open ACH invite emial modal.
   * This modal specially cretad for Compass enterprise customer.
   */
  openAchInviteModal(
    id = [this.payeeDataSignal()?.encryptedId],
    email = this.payeeDataSignal()?.email,
    status = this.payeeDataSignal()?.netsuitePayee?.status
  ): void {
    if (status === 0) {
      this.alertService.infoAlert({
        content:
          'ACH Invite cannot be sent to an inactive vendor record. If the vendor is now active in Netsuite, please refresh the vendor in OCW'
      });
      return;
    }
    const dialog = this.dialog.open(AchInviteEmailModalComponent, {
      maxWidth: '370px',
      minWidth: '370px',
      width: '95%',
      disableClose: true,
      data: {
        id,
        email
      }
    });
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.dataTableService.v3RowSelectionData = [];
        this.dataTableService.gridApi?.deselectAll();
      }
    });
  }

  createCRMToken(): Observable<
    IApiRes<{ linkToken: string; userOriginId: string }>
  > {
    return this.http.get<IApiRes<{ linkToken: string; userOriginId: string }>>(
      `${this.ROOT_URL}/integrations/merge/create-crm-token`
    );
  }

  sendCRMAccountToken(token: string): Observable<IApiResSuccessOnly> {
    return this.http.get<IApiResSuccessOnly>(
      `${this.ROOT_URL}/integrations/merge/get-crm-token/${token}`
    );
  }

  getCRMConnectedApps(): Observable<IApiRes<IPayeeListsConnectedApps[]>> {
    return this.http.get<IApiRes<IPayeeListsConnectedApps[]>>(
      `${this.ROOT_URL}/integrations/merge/get-crm-apps`
    );
  }

  importPayeeFromCRMApps(appId: string): Observable<IApiResSuccessOnly> {
    return this.http.post<IApiResSuccessOnly>(
      `${this.ROOT_URL}/integrations/merge/import-crm-payees/${appId}`,
      {}
    );
  }

  disconnectPayeeFromCRMApps(appId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/merge/disconnect-crm-app/${appId}`,
      {}
    );
  }

  /**
   * @description Opens the Transaction history of the selected payee
   */
  openTransactionHistoryModal() {
    return this.dialog.open(TransactionHistoryModalComponent, {
      maxWidth: '1200px',
      width: '93%',
      maxHeight: '850px'
    });
  }

  ngOnDestroy(): void {
    this.clearImportProgressTimer();
    this.resetPayeeSignal();
  }
}
