import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  IBankAuditTrial,
  IBankDropdown,
  IRemittanceDetails,
  IRemittanceModalData,
  IUpdateRemitance,
  IUploadFromPhoneData,
  IUploadFromPhoneResponse
} from 'src/app/models/bank';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';
import { ComponentType } from '@angular/cdk/portal';
import { IApiRes, IApiResMesssage, IApiResWithMsg } from 'src/app/models/api';

import {
  ICardPaymentReqDocRes,
  IEnablePaymentsMethods,
  IPaymentDetails,
  IPaymentFeeDetails,
  IUpdatePaymentBody,
  IDefaultPayment,
  IPaymentsProofPayload,
  IPodDetails,
  IQBOExportsData,
  ICardTransactionDocsPayload,
  ITransactionLimits,
  IBusinessDataList,
  IRecurringDetails,
  IBusinessBanksResponse,
  IAttachmentFee,
  IMaintenance
} from 'src/app/modules/payments/model/payments';
import { environment } from 'src/environments/environment';
import { ISubSideBarItem } from 'src/app/data/data/v3-home-page-shortcuts';
import { IPaymentShortCutsDetails } from 'src/app/modules/home/model/home-page-shortcuts';
import { IPayeeView } from 'src/app/modules/payee/payee-v2/model/payee';
import { BehaviorSubject, Observable, Subject, Subscription, of } from 'rxjs';
import { CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-comment-modal/check-add-comment-modal.component';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { IAttachmentItem } from 'src/app/models/common';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { AddRemitanceV3Component } from 'src/app/modules/payments/shared/components/modals/add-remitance-v3/add-remitance-v3.component';
import { CardsDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/cards-dropdown-v3/cards-dropdown-v3.component';
import { catchError, finalize, map } from 'rxjs/operators';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  ICheckDetailsData,
  INewCheck
} from 'src/app/modules/check/model/check';
import { IConfirmAlert } from 'src/app/models/alert';
import { FormGroup, FormControl } from '@angular/forms';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { PendingCheckApprovalsComponent } from 'src/app/modules/user-management/modals/pending-check-approvals/pending-check-approvals.component';
import { PendingCheckApprovalsV4Component } from 'src/app/modules/user-management-v4/v4-modals/pending-check-approvals-v4/pending-check-approvals-v4.component';
import { PayeeService } from '../payee/payee.service';
import { CheckService } from '../check/check.service';
import { BankService } from '../bank/bank.service';
import { SharedService } from '../common/shared/shared.service';
import { AlertService } from '../alert/alert.service';
import { IDefaultPaymentRes } from '../bank/bank.model';
import { BankVerifyModalComponent } from '../../bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import { WarningAlertComponent } from '../../alert/components/warning-alert/warning-alert.component';
import { INetSuiteExportsData } from 'src/app/modules/integration/netsuite/model/netsuite';
import { PaymentConfirmationModalComponent } from 'src/app/modules/payments/shared/modal/payment-confirmation-modal/payment-confirmation-modal.component';
import { CroppedLogoResult } from '../../components/logo-cropper/logo-cropper.component';
import { IInternationalPayeeBankResponse } from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { IFreshBookExpenseDetails } from 'src/app/modules/integration/model/integration';
import { V4CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-attachment-common-modal/v4-check-add-attachment-common-modal.component';
import { V4AlertService } from '../alert/v4-alert.service';
import { V4WarningAlertComponent } from '../../alert/v4-components/v4-warning-alert/v4-warning-alert.component';
import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { ComplianceService } from 'src/app/modules/compliance-freeze/compliance.service';
import { LocalStorageService } from '../storage/local-storage.service';
import { HeaderService } from '../header/header.service';
import { UserManagementService } from '../user/user-management.service';

interface PermissionDeniedData {
  noPermission: boolean;
  payMethode: string;
}

interface IMapingFail {
  isFail: boolean;
}

export type PaymentMethods =
  | undefined
  | 'BANK_CHECK'
  | 'BANK_ACH'
  | 'BANK_WIRE'
  | 'BANK_VIRTUALCARD'
  | 'CC_CHECK'
  | 'CC_ACH'
  | 'CC_WIRE'
  | 'CC_VIRTUALCARD'
  | 'WALLET_ACH'
  | 'WALLET_WIRE'
  | 'WALLET_VIRTUALCARD'
  | 'WALLET_CHECKMAIL'
  | 'WALLET_CHECKPRINT'
  | 'CLOUD_ACH'
  | 'CLOUD_WIREDOM'
  | 'CLOUD_WIREINTL'
  | 'CLOUD_INSTANT';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService implements OnDestroy {
  private payeeService = inject(PayeeService);
  private dialog = inject(MatDialog);
  private checkService = inject(CheckService);
  private v3DataTableService = inject(V3DataTableService);
  private bankService = inject(BankService);
  private sharedService = inject(SharedService);
  private complianceService = inject(ComplianceService);
  private localStorageService = inject(LocalStorageService);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private headerService = inject(HeaderService);
  private userManagementService = inject(UserManagementService);

  ROOT_URL = environment.rootUrl;
  initiatePaymentForm: any = {};
  subscriptions: Subscription[] = [];
  payeeDetails: IPayeeView | undefined;
  idempotencyKeySubject = new BehaviorSubject<string>('');
  payeeDefaultDDAccount = new Subject<string>();
  isPermissionDenied = new BehaviorSubject<PermissionDeniedData>({
    noPermission: false,
    payMethode: ''
  });

  selectedCheckData: ICheckDetailsData;
  selectedBankId: string;
  selectedCheckId: string;
  selectedItem: string;
  mapFail$ = new Subject<IMapingFail>();
  isMapLoad = false;
  checkSerialNo: number;
  isInternationalEnabled: number;
  remittanceData: IRemittanceModalData | undefined;
  paymentLimit: IEnablePaymentsMethods['paymentLimit'];
  editingPayeeId: string;
  isVerifyPopupCalled = false;
  isFromViewPage = false;
  private isSubmitWithAlreadyExistedcheckfields = false;
  isPaymentProcessingSubject = new BehaviorSubject<boolean>(false);
  isDialogOpen = {
    checkRejectDialog: false,
    checkApproveDialog: false,
    approvalPolicyDialog: false
  };

  /**
   * @description Error code returned when the selected payments are governed by
   * an approval policy and therefore cannot be approved from the list actions.
   */
  private readonly APPROVAL_POLICY_ERROR_CODE = '640';

  hasPermission: {
    payee: boolean;
    bank: boolean;
    card: boolean;
    wallet: boolean;
  } = {
      payee: true,
      bank: true,
      card: true,
      wallet: true
    };

  modalRef: {
    canBankNoVerify?: MatDialogRef<WarningAlertComponent, boolean>;
  } = {};

  modalRefV4: {
    canBankNoVerify?: MatDialogRef<V4WarningAlertComponent, boolean>;
  } = {};

  isCheckNumberExist = false;

  hasAmount = signal(false);
  isSameDayAch = signal(false);
  currentPaymentMehtod = signal<PaymentMethods>(undefined);
  onSaveQboDetails = signal<IQBOExportsData|undefined>(undefined);
  onClickSaveButton = signal<boolean>(false);
  autoSaveNetSuiteDetails = signal(false);
  autoSaveFreshBooksDetails = signal(false);
  onSaveNetSuiteDetails = signal<INetSuiteExportsData|undefined>(undefined);
  onSaveFreshBooksDetails = signal<IFreshBookExpenseDetails|undefined>(undefined);
  proccessed = false;
  loading = false;
  isGatewayTypeLoading = signal(false);
  private gatewaySkipCardIds = new Set<string>();
  creditCardGatewaySwitchingStatus = computed(() => this.headerService.creditCardGatewaySwitchingStatus());

  cardPaymentPurposeOfPaymentOptions: string[] = [];
  /**
   * Read live rather than cached at construction. The layout is switched at runtime by
   * the v3 and v4 headers, and this service is created long before that write, so a
   * snapshot leaves v4 users seeing v3 alerts for the rest of the session. Every other
   * consumer of this flag reads it the same way.
   */
  get isV4LayoutEnabled(): boolean {
    return this.localStorageService.getItem('isV4LayoutEnabled') === 1;
  }

  private get alert() {
    return this.isV4LayoutEnabled ? this.v4AlertService : this.alertService;
  }

  /**
   * @description Whether the selected payor (originating) bank account requires
   * the payee bank to be verified before an ACH/Wire can complete. Resolved when
   * the payor bank/wallet is selected and read synchronously by the confirmation modal.
   */
  isPayeeBankVerificationRequired = false;

  /**
   * @description Create Idempotency key using randomUUID method. Even if multiple transactions are initiated only one transaction with same idempotency key will become successful.
   */
  createIdempotencyKey() {
    if (this.idempotencyKeySubject.value === '') {
      this.idempotencyKeySubject.next(crypto.randomUUID());
    }
  }

  /**
   * @description Change current idempotency key.
   */
  replaceIdempotencyKey() {
    this.idempotencyKeySubject.next(crypto.randomUUID());
  }

  /**
   * @description - setting payee's default DD Account id to subject
   * @param id -payee default DD account Id
   */
  setDefaultDDAccount(id: string) {
    this.payeeDefaultDDAccount.next(id);
  }

  /**
   * @description Method for getting payee default DD account Id
   */
  getDefaultDDAccount() {
    return this.payeeDefaultDDAccount.asObservable();
  }

  afterGetingError(errorCode: number, errorMsg: string): void {
    if (errorCode == 351 || errorCode == 101) {
      const action = this.alert.warningAlert({ content: errorMsg });
      action.afterClosed().subscribe((res) => {
        if (res) {
          this.router.navigate(['manage/common-verification'], {
            queryParams: { type: CVSourceType.other }
          });
        }
      });
    }
  }

  /**
   * @description Handles the "payments are under an approval policy" restriction
   * (errorCode 640). Both interceptors intentionally ignore business error codes,
   * so the approve actions have to surface this one themselves.
   * Shows a warning carrying the API message with a "Manage Approval" action that
   * opens the pending check approvals modal.
   * @param source - The failed `HttpErrorResponse` (422) or an API body that came
   * back with `success: false`.
   * @returns true when the 640 restriction was handled, false otherwise.
   */
  handleApprovalPolicyRestriction(source: unknown): boolean {
    const body = ((source as HttpErrorResponse)?.error ?? source) as
      | { errorCode?: string | number; errorMsg?: string }
      | undefined;
    if (String(body?.errorCode ?? '') !== this.APPROVAL_POLICY_ERROR_CODE) {
      return false;
    }
    if (this.isDialogOpen.approvalPolicyDialog) {
      return true;
    }
    this.isDialogOpen.approvalPolicyDialog = true;
    const alert = this.alert.warningAlert({
      content:
        body?.errorMsg ||
        'Payments under an approval policy cannot be managed from this action',
      doneMsg: 'Manage Approval',
      cancelMsg: 'Cancel',
      isCancel: true
    });
    alert.afterClosed().subscribe((result) => {
      this.isDialogOpen.approvalPolicyDialog = false;
      if (result) {
        this.openPendingCheckApprovalsModal();
      }
    });
    return true;
  }

  /**
   * @description Opens the pending check approvals modal. The modal renders its
   * pagination eagerly, so the list has to be fetched before it is opened.
   */
  private openPendingCheckApprovalsModal(): void {
    const isV4 = this.isV4LayoutEnabled;
    this.subscriptions.push(
      this.userManagementService
        .getPendingApprovalList({ page: 1, perPage: isV4 ? 50 : 25 })
        .subscribe((res) => {
          if (!res.success) {
            return;
          }
          const component: ComponentType<unknown> = isV4
            ? PendingCheckApprovalsV4Component
            : PendingCheckApprovalsComponent;
          this.dialog
            .open(component, {
              width: '1000px',
              data: res.data,
              ...(isV4 ? { panelClass: 'paddingless-modal-rounded' } : {})
            })
            .afterClosed()
            .subscribe(() => {
              this.v3DataTableService.refreshV3DataTable();
            });
        })
    );
  }

  /**
   * @description Processes the approval of checks.
   * @param paymentidList - An array of payment IDs to approve.
   * @param setLoader - Optional callback to set loading state
   * @param resetLoader - Optional callback to reset loading state
   */
  processCheckApproval(paymentidList: string[], setLoader?: () => void, resetLoader?: () => void) {
    if (this.isDialogOpen.checkApproveDialog) {
      return;
    }
    this.isDialogOpen.checkApproveDialog = true;
    const alert = this.alert.confirmAlert({
      content: 'Are you sure you want to approve these checks?'
    });
    alert.afterClosed().subscribe((result) => {
      this.isDialogOpen.checkApproveDialog = false;
      if (result) {
        setLoader?.(); // Set loader AFTER user confirms
        this.subscriptions.push(
          this.checkService
            .approveCheck({ ids: paymentidList })
            .pipe(
              finalize(() => {
                resetLoader?.(); // Reset loader after API call completes
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  this.v3DataTableService.refreshV3DataTable();
                  this.alert.successAlert({
                    content: 'Check approved successfully'
                  });
                  this.v3DataTableService.v3RowSelectionData = [];
                  this.v3DataTableService.gridApi.deselectAll();
                }
              },
              error: (err) => {
                this.handleApprovalPolicyRestriction(err);
              }
            })
        );
      }
      // No need to reset loader if user cancels - it was never set
    });
  }

    /**
   * @description Processes the approval of checks.
   * @param paymentidList - An array of payment IDs to approve.
   */
    processPaymentApproval(checkIds: string[],paymentidList: string[],status:'approve' | 'reject',setLoader?: () => void, resetLoader?: () => void) {
      if (this.isDialogOpen.checkApproveDialog) return;
      this.isDialogOpen.checkApproveDialog = true;
      const alert = this.alert.confirmAlert({
        content: status === 'approve' ? 'Are you sure you want to approve these payments?' : 'Are you sure you want to reject these payments?'
      });
      alert.afterClosed().subscribe((result) => {
        this.isDialogOpen.checkApproveDialog = false;
        if (result) {
          setLoader?.();
          this.subscriptions.push(
            this.approvePayment(checkIds,paymentidList,status)
              .pipe(
                finalize(() => {
                  resetLoader?.(); // Reset loader after API call completes
                })
              )
              .subscribe({
                next: (res) => {
                  if (res.success) {
                    this.v3DataTableService.refreshV3DataTable();
                    this.alert.successAlert({
                      content: status === 'approve' ? 'Payments approved successfully' : 'Payments rejected successfully'
                    });
                    this.v3DataTableService.v3RowSelectionData = [];
                    this.v3DataTableService.gridApi.deselectAll();
                  }
                },
                error: (err) => {
                  this.handleApprovalPolicyRestriction(err);
                }
              })
          );
        }
      });
    }

  /**
   * @description Processes the approval of checks.
   * @param paymentidList - An array of payment IDs to approve.
   */
  checkForceEmail(selectedId: string) {
    const alert = this.alert.confirmAlert({
      content: 'Are you sure you want to set mark as printed?'
    });
    alert.afterClosed().subscribe((result) => {
      if (result) {
        const data = {
          checkId: selectedId
        };
        this.subscriptions.push(
          this.checkService.forcePrinted(data).subscribe((res) => {
            if (res.success === true) {
              this.v3DataTableService.refreshV3DataTable();
              this.alert.successAlert({
                content: 'Successfully marked as printed'
              });
            }
          })
        );
      }
    });
  }

  /**
   * @description Processes the reject of checks.
   * @param paymentidList - An array of payment IDs to reject.
   * @param setLoader - Optional callback to set loading state
   * @param resetLoader - Optional callback to reset loading state
   */
  processCheckReject(paymentidList: string[], setLoader?: () => void, resetLoader?: () => void) {
    if (this.isDialogOpen.checkRejectDialog) {
      return;
    }
    this.isDialogOpen.checkRejectDialog = true;
    const alert = this.alert.confirmAlert({
      content: 'Are you sure you want to reject these checks?'
    });
    alert.afterClosed().subscribe((result) => {
      this.isDialogOpen.checkRejectDialog = false;
      if (result) {
        setLoader?.(); // Set loader AFTER user confirms
        this.subscriptions.push(
          this.checkService
            .rejectCheck({ ids: paymentidList })
            .pipe(
              finalize(() => {
                resetLoader?.(); // Reset loader after API call completes
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  this.v3DataTableService.refreshV3DataTable();
                  this.alert.successAlert({
                    content: 'Check rejected successfully'
                  });
                  this.v3DataTableService.v3RowSelectionData = [];
                  this.v3DataTableService.gridApi.deselectAll();
                }
              },
              error: (err) => {
                this.handleApprovalPolicyRestriction(err);
              }
            })
        );
      }
      // No need to reset loader if user cancels - it was never set
    });
  }

  /**
   * @description -Method for handling remitance value
   * @param res -Response from remitance modal
   * @param form -Payment form
   */
  getRemitanceValue(res: IRemittanceModalData, form: FormGroup) {
    this.remittanceData = res;
    const insertFromRemittance = !!res.insert;
    if (res.format) {
      const total = insertFromRemittance ? res.paymentTotal : '';
      if (total) {
        form.controls.amount.setValue(total);
      }
    } else {
      const total = insertFromRemittance ? res.grandTotal : '';
      if (total) {
        form.controls.amount.setValue(total);
      }
    }
  }

  /**
   * @description Audit trial data of selected bank account
   * @param id  bank id
   * @returns
   */
  bankAccountsAuditTrial(id: string): Observable<IApiRes<IBankAuditTrial[]>> {
    return this.http.get<IApiRes<IBankAuditTrial[]>>(
      `${this.ROOT_URL}/bank-accounts/${id}/activities`
    );
  }

  checkBankCanACH(bankAc: IBankDropdown | string): boolean {
    if (this.isVerifyPopupCalled) {
      return false;
    }
    
    if (!bankAc || (typeof bankAc === 'object' && !(bankAc as IBankDropdown).id)) {
      return false;
    }
    if ((bankAc as string) === 'add-new') {
      return false;
    }
    if ((bankAc as IBankDropdown)?.country === 'Canada') {
      if (this.modalRef.canBankNoVerify) {
        this.modalRef.canBankNoVerify.close();
      }
      this.modalRef.canBankNoVerify = this.alertService.warningAlert({
        content:
          'Sending virtual cards from Canadian bank accounts is not allowed.'
      });
      return false;
    }
    if ((bankAc as IBankDropdown)?.verified !== 1) {
      this.isVerifyPopupCalled = true;
      this.verifyBankAccount((bankAc as IBankDropdown)?.id);
      return false;
    }
    if (
      (bankAc as IBankDropdown).achApplicationStatus !== 1 &&
      (bankAc as IBankDropdown).isItZil === 0
    ) {
      this.isVerifyPopupCalled = true;
      this.openWarningToRedirectBankPageModal(
        'This bank account is not approved for ACH. Please check your bank list to see the status.'
      );
      return false;
    }
    return true;
  }

  checkBankCanACHV4(bankAc: IBankDropdown | string): boolean {
    if (this.isVerifyPopupCalled) {
      return false;
    }
    if ((bankAc as string) === 'add-new') {
      return false;
    }
    if ((bankAc as IBankDropdown).country === 'Canada') {
      if (this.modalRefV4.canBankNoVerify) {
        this.modalRefV4.canBankNoVerify.close();
      }
      this.modalRefV4.canBankNoVerify = this.v4AlertService.warningAlert({
        content:
          'Sending virtual cards from Canadian bank accounts is not allowed.'
      });
      return false;
    }
    if ((bankAc as IBankDropdown).verified !== 1) {
      this.isVerifyPopupCalled = true;
      this.verifyBankAccountV4((bankAc as IBankDropdown).id);
      return false;
    }
    if (
      (bankAc as IBankDropdown).achApplicationStatus !== 1 &&
      (bankAc as IBankDropdown).isItZil === 0
    ) {
      this.isVerifyPopupCalled = true;
      const data = {
        title: 'Error',
        content: 'This bank account is not approved for ACH. Please check your bank list to see the status.',
        doneMsg: 'View bank list',
        cancelMsg: 'Cancel',
        isCancel: true
      };
      const res = this.v4AlertService.warningAlert(data);
      res.afterClosed().subscribe((modalRes) => {
        this.isVerifyPopupCalled = false;
        if (modalRes) {
          this.dialog.closeAll();
          this.router.navigateByUrl('/v4/manage/bank-accounts/index');
        }
      });
      return false;
    }
    return true;
  }

  openWarningToRedirectBankPageModal(contentMsg: string): void {
    const data = {
      title: 'Error',
      content: contentMsg,
      doneMsg: 'View bank list',
      cancelMsg: 'Cancel',
      isCancel: true
    };
    const res = this.alert.warningAlert(data);
    res.afterClosed().subscribe((modalRes) => {
      this.isVerifyPopupCalled = false;
      if (modalRes) {
        this.router.navigateByUrl('/manage/bank-accounts/index');
      }
    });
  }

  getPayeeDetails(payeeId: string, fromApi?: boolean, type?: string): Observable<IPayeeView> {
    return new Observable((observer) => {
      if (this.payeeDetails?.payeeEncryptedId === payeeId && !fromApi) {
        observer.next(this.payeeDetails);
        observer.complete();
      } else {
        this.subscriptions.push(
          this.payeeService
            .viewPayee(payeeId, type)
            .pipe(
              catchError((error) => {
                observer.error(error);
                return [];
              })
            )
            .subscribe((payee) => {
              observer.next(payee?.data);
              this.payeeDetails = payee.data;
              observer.complete();
            })
        );
      }
    });
  }

  getInternationalBanksByRecipientType(
    payeeId: string,
    recipientType: 'business' | 'personal'
  ): Observable<IInternationalPayeeBankResponse[]> {
    return this.payeeService
      .getInternationalPayeeBanksByType(payeeId, recipientType)
      .pipe(
        map((res) => res.success ? res.data : []),
        catchError(() => of([]))
      );
  }

  getPurposeOfPayment(callback?: (options: string[]) => void): string[] {
    if (this.cardPaymentPurposeOfPaymentOptions.length > 0) {
      callback?.(this.cardPaymentPurposeOfPaymentOptions);
      return this.cardPaymentPurposeOfPaymentOptions;
    }
    this.subscriptions.push(
      this.getCardPaymentPurposeOfPaymentOptions()
      .subscribe((res) => {
        const options = res.success ? res.data : [];
        this.cardPaymentPurposeOfPaymentOptions = [...options, 'Other'];
        callback?.(this.cardPaymentPurposeOfPaymentOptions);
      })
    );
    return this.cardPaymentPurposeOfPaymentOptions;
  }

  /**
   * Inverse of the purpose -> memo write done by the card payment screens: given a
   * stored memo, works out which purpose option produced it. Comparison is done on the
   * sanitized form because the forward write strips non-alphabetic characters.
   * Returns '' for an empty memo and 'Other' when no option matches.
   */
  matchPurposeFromMemo(memo: string | null | undefined): string {
    if (!memo || !this.cardPaymentPurposeOfPaymentOptions.length) return '';
    const norm = (value: string) =>
      value.replace(/[^a-zA-Z ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const target = norm(memo);
    return (
      this.cardPaymentPurposeOfPaymentOptions.find(
        (option) => option !== 'Other' && norm(option) === target
      ) ?? 'Other'
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  setDefaultPayment(data: { defaultPayment: IDefaultPayment }) {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/payment-settings/set-default-payment`,
      data
    );
  }

  getDefaultPayment(): Observable<IApiRes<IDefaultPaymentRes>> {
    return this.http.get<IApiRes<IDefaultPaymentRes>>(
      `${this.ROOT_URL}/payment-settings/get-default-payment`
    );
  }

  verifyBankAccount(bankAcId: string): void {
    const data = {
      title: 'Error',
      content: 'Please verify your bank account',
      doneMsg: 'Verify Now',
      cancelMsg: 'Cancel',
      isCancel: true
    };
    const res = this.alert.warningAlert(data);
    res.afterClosed().subscribe((res) => {
      this.isVerifyPopupCalled = false;
      if (res) {
        this.openBankVerifyModal(bankAcId);
      }
    });
  }

  verifyBankAccountV4(bankAcId: string): void {
    const data = {
      title: 'Error',
      content: 'Please verify your bank account',
      doneMsg: 'Verify Now',
      cancelMsg: 'Cancel',
      isCancel: true
    };
    const res = this.v4AlertService.warningAlert(data);
    res.afterClosed().subscribe((res) => {
      this.isVerifyPopupCalled = false;
      if (res) {
        this.openBankVerifyModalV4(bankAcId);
      }
    });
  }

  openBankVerifyModal(encrypted_bankacc_id: string) {
    this.dialog.open(BankVerifyModalComponent, {
      maxWidth: '500px',
      width: '95%',
      data: { encrypted_bankacc_id },
      disableClose: true
    });
  }

  openBankVerifyModalV4(encrypted_bankacc_id: string) {
    return this.dialog.open(BankVerificationModalV4Component, {
      width: '100%',
      maxWidth: '480px',
      panelClass: 'paddingless-modal-rounded',
      data: { bankId: encrypted_bankacc_id },
      disableClose: true
    });
  }

  /**
   * @description -Opens the dialog for adding comments and returns an Observable that emits the updated comments array.
   * @param comments - The array of existing comments.
   * @param encId - The optional encrypted ID for the comment.
   * @returns -An Observable that emits the updated comments array after the dialog is closed.
   */
  openAddComment(comments: IComments[], encId?: string) {
    const dialogRef = this.dialog.open(CheckAddCommentModalComponent, {
      maxWidth: '800px',
      width: '93%',
      disableClose: true,
      data: {
        id: encId ? encId : 0,
        mode: 'zil_payments',
        existingData: comments
      }
    });

    return dialogRef.afterClosed().pipe(map((res) => res.existingData));
  }

  /**
   * @description -Opens the dialog for adding attachments and returns an Observable that emits the updated attachments array.
   * @param comments - The array of existing attachments.
   * @param encId - The optional encrypted ID for the attachment.
   * @returns -An Observable that emits the updated attachments array after the dialog is closed.
   */
  openAddAttachment(attachments: IAttachmentItem[], encId?: string,showNote?:boolean,paymentType?:string) {
    const dialogRef = this.dialog.open(CheckAddAttachmentCommonModalComponent, {
      maxWidth: '600px',
      width: '93%',
      data: {
        id: encId ? encId : 0,
        mode: 'zil_payments',
        existingData: attachments,
        showNote,
        paymentType
      }
    });

    return dialogRef.afterClosed().pipe(map((res) => res.existingData));
  }

  /**
   * @description -Opens the dialog for adding attachments and returns an Observable that emits the updated attachments array.
   * @param comments - The array of existing attachments.
   * @param encId - The optional encrypted ID for the attachment.
   * @returns -An Observable that emits the updated attachments array after the dialog is closed.
   */
  openV4AddAttachment(attachments: IAttachmentItem[], encId?: string,showNote?:boolean,paymentType?:string) {
    const dialogRef = this.dialog.open(V4CheckAddAttachmentCommonModalComponent, {
      maxWidth: '600px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: encId ? encId : 0,
        mode: 'zil_payments',
        existingData: attachments,
        showNote,
        paymentType
      }
    });

    return dialogRef.afterClosed().pipe(map((res) => res.existingData));
  }

  /**
   * @description -Opens the dialog for adding remittance data and returns an Observable that emits the dialog result.
   * @param data  - The remittance data to be passed to the dialog.
   * @returns -An Observable that emits the dialog result after the dialog is closed.
   */
  openAddRemitanceModal(data: IRemittanceModalData) {
    const dialogRef = this.dialog.open(AddRemitanceV3Component, {
      width: '1100px',
      data
    });
    return dialogRef.afterClosed().pipe(map((res) => res));
  }

  /**
   * @description -Creates a remittance data object with specified properties.
   * @param amount - The amount value to include in the remittance data.
   * @param insertFrom - Indicates whether the data is being inserted.
   * @returns -The remittance data object with optional properties.
   */
  createRemitanceData(
    amount: number,
    insertFrom: boolean,
    isPaymentEdit = false
  ): IRemittanceModalData {
    return {
      remitance: this.remittanceData?.remitance || undefined,
      remittanceType:
        this.remittanceData?.remittanceType !== undefined
          ? this.remittanceData.remittanceType
          : undefined,
      paymentTotal: this.remittanceData?.paymentTotal || undefined,
      grandTotal: this.remittanceData?.grandTotal || undefined,
      format:
        this.remittanceData?.format !== undefined
          ? this.remittanceData.format
          : undefined,
      insert: insertFrom,
      amount: amount,
      isNotCheck: true,
      isPaymentEdit
    };
  }

  /**
   * @description -Checks and processes a list of remittance details.
   * @param remitance - The list of remittance details to check.
   * @returns -An object containing the modified remittance list and a flag indicating if there are remittances.
   */
  checkRemittanceCount(remitance: IRemittanceDetails[]): {
    remittanceList: IRemittanceDetails[];
    hasRemittance: boolean;
  } {
    let hasRemitance = false;
    const modifiedRemittanceList = remitance.map((obj: IRemittanceDetails) => {
      if (
        Object.values(obj).some(
          (value) => value !== null && value !== '' && value !== undefined
        )
      ) {
        hasRemitance = true;
      }
      return obj;
    });

    return {
      remittanceList: modifiedRemittanceList,
      hasRemittance: hasRemitance
    };
  }

  /** Payment amount validation error */
  amountLimitWarning(msg: string): void {
    const data = {
      content: msg,
      isOk: true,
      isCancel: true,
      doneMsg: 'Contact Now',
      cancelMsg: 'Not Now'
    };
    const dialog = this.alert.infoAlert(data);
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        const zohoSupportChat = StaticWhiteLabelConditions?.zohoSupportChat;
        if (zohoSupportChat) {
          window.open(zohoSupportChat, '_blank');
        }
      }
    });
  }

  /**
   * @description -Updates the remittance data and, if applicable, sends an update request to the server
   * @param remittanceList - The list of remittances to update.
   */
  updateRemittanceData(
    remittanceList: IRemittanceDetails[],
    hasRemitance: boolean,
    paymentMode: string | undefined,
    encId: string,
    type?: number | undefined
  ) {
    if (this.remittanceData) {
      this.remittanceData.remitance = remittanceList;
      if (hasRemitance && paymentMode === 'EDIT') {
        const remittanceBody: IUpdateRemitance = {
          amount: this.remittanceData?.paymentTotal,
          items: this.remittanceData?.remitance || [],
          remittanceType: type
        };
        this.subscriptions.push(
          this.sharedService
            .updateZilRemitance(remittanceBody, encId)
            .subscribe()
        );
      }
    }
  }

  /**
   * @description Creates the request body for updating the check.
   * @returns {INewCheck} The request body containing the necessary data for the update.
   */
  createCheckBody(data?: Partial<INewCheck>): INewCheck {
    const checkData = this.selectedCheckData;
    return {
      bankAccount: this.selectedBankId,
      payee: checkData.payee.payeeId,
      amount: checkData.amount,
      checkIssueDate: checkData.date,
      category: checkData.category.categoryId,
      checkSerialNo: this.checkSerialNo,
      accountNo: checkData.accountNumber,
      invoiceNo: checkData.invoiceNumber,
      note: '',
      memo: checkData.memo,
      no_amount: checkData.isNoAmount,
      no_sign: checkData.isNoSign,
      no_payee: checkData.isNoPayee,
      no_date: checkData.isNoDate,
      isVendorCreditApplied: checkData.isVendorCreditApplied,
      vendorCredit: 0,
      commentIds: [],
      attachmentIds: [],
      attachRemittanceToCheck: '',
      attachCategoryToCheck: '',
      attachExpenseToCheck: '',
      attachNetsuiteExpenseToCheck: '',
      remittance_type: 0,
      remittance: '',
      categoryDetails: checkData.categoryDetails,
      expenseDetails: checkData.expenseDetails,
      netsuiteExpenseDetails: checkData.netsuiteDetails,
      realmId: checkData.qboCompany.realmId,
      locationId: checkData.locationId,
      mappingId: checkData.qboBankAccount.id,
      qbBankId: checkData.qbdBankAccount.id,
      companyId: checkData.qbdCompany.companyId,
      netsuiteBankId: checkData.netsuiteBankAccount.id,
      warning: 0,
      checkNumberWarning: this.isCheckNumberExist ? 1 : 0,
      bills: [],
      isMapping: 1,
      quickbook: checkData.isImportedFromQb === 1 ? 1 : 0,
      permission_action: 0,
      customElements: checkData.customElements,
      isCloned: 0,
      freshbookCompanyId: checkData.freshbookCompany.companyId,
      attachFreshbooksExpenseToCheck: checkData.attachFreshbooksExpenseToCheck,
      freshbookExpenseDetails: checkData.freshbookExpenseDetails,
      ...(data ? data : {})
    };
  }

  /**
   * @description Used get selected check details.
   * Using this information set the update check body.
   * Call `getCheckSerialNumber` function when selected check serial number is null or zero.
   */
  getCheckDetails(checkId: string | undefined, bankId: string | undefined) {
    this.isMapLoad = true;
    this.selectedBankId = bankId as string;
    this.selectedCheckId = checkId as string;
    this.subscriptions.push(
      this.checkService.getChecksById(this.selectedCheckId).subscribe((res) => {
        this.selectedCheckData = res.data;
        if (
          this.selectedCheckData.serialNumber !== '' &&
          this.selectedCheckData.serialNumber !== '0'
        ) {
          this.checkSerialNo = Number(this.selectedCheckData.serialNumber);
          this.mapBank(this.selectedCheckId);
        } else {
          this.getCheckSerialNumber(this.selectedBankId);
        }
      })
    );
  }

  /**
   * @description Used to get Check serial number using selected bank id.
   * @param {string}bankId Selected bank id.
   */
  getCheckSerialNumber(bankId: string) {
    this.subscriptions.push(
      this.bankService.getCheckSerialNo(bankId).subscribe((res) => {
        if (res.success) {
          this.checkSerialNo = res.data[0].serialNo;
          this.mapBank(this.selectedCheckId);
        }
      })
    );
  }

  /**
   * @description Used to map the unmapped banks in thirdparty apps.
   * @param {string}checkId - Selected check id.
   */
  mapBank(checkId: string) {
    const checkBody = this.createCheckBody(
      this.isSubmitWithAlreadyExistedcheckfields ? { warning: 1 } : undefined
    );
    this.subscriptions.push(
      this.checkService
        .updateCheck(checkId, checkBody)
        .pipe(
          finalize(() => {
            this.isMapLoad = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.isCheckNumberExist = false;
              this.v3DataTableService.refreshV3DataTable();
              this.mapFail$.next({
                isFail: false
              });
            }
          },
          // error: (err) => {
          //   if (err.error) {
          //     this.mapFail$.next({
          //       isFail: true
          //     });
          //   }

          // }
          error: (err) => {
            const data: IConfirmAlert = {
              title: 'Confirm',
              content: 'Do you want to proceed anyway?',
              doneMsg: 'OK',
              cancelMsg: 'Cancel'
            };
            if (err?.error.errorCode === 190) {
              data.title = 'Memo already exist';
              const warn = this.alert.confirmAlert(data);
              warn.afterClosed().subscribe((r) => {
                if (r) {
                  checkBody.warning = 1;
                  this.isSubmitWithAlreadyExistedcheckfields = true;
                  this.mapBank(checkId);
                }
              });
            }
            if (err?.error.errorCode === 213) {
              data.title = err?.error.errorMsg;
              const warn = this.alert.confirmAlert(data);
              warn.afterClosed().subscribe((resppnse) => {
                if (resppnse) {
                  this.isCheckNumberExist = true;
                  checkBody.warning = 1;
                  this.isSubmitWithAlreadyExistedcheckfields = true;
                  this.mapBank(checkId);
                }
              });
            }
            return of(false);
          } //
        })
    );
  }

  getPaymentDetails(
    paymentId: string,
    headerOption?: HttpHeaders
  ): Observable<IApiRes<IPaymentDetails>> {
    return this.http.get<IApiRes<IPaymentDetails>>(
      `${this.ROOT_URL}/zil-payments/${paymentId}`,
      { headers: headerOption }
    );
  }

  updatePayment(
    paymentId: string,
    paymentBody: IUpdatePaymentBody,
    headerOptions?: HttpHeaders
  ): Observable<IApiRes<IPaymentDetails>> {
    return this.http.patch<IApiRes<IPaymentDetails>>(
      `${this.ROOT_URL}/zil-payments/${paymentId}`,
      paymentBody,
      { headers: headerOptions }
    );
  }

  savePayment(paymentBody: IUpdatePaymentBody) {
    return this.http.post<IApiRes<IPaymentDetails>>(
      `${this.ROOT_URL}/zil-payments`,
      paymentBody
    );
  }

  processPayment(
    paymentId: string,
    moreData: { payee_bank_account_id?: string; payee_email?: string },
    headerOptions?: HttpHeaders
  ) {
    const headers = (headerOptions || new HttpHeaders()).set('X-Track-Payment-Timeout', 'true');
    return this.http.post<IApiResWithMsg<{check_id: string}>>(
      `${this.ROOT_URL}/zil-payments/${paymentId}/process-payment`,
      moreData,
      { headers }
    );
  }

  cancelPayment(paymentId: string): Observable<IApiRes<IPaymentDetails>> {
    return this.http.post<IApiRes<IPaymentDetails>>(
      `${this.ROOT_URL}/zil-payments/${paymentId}/cancel`,
      {}
    );
  }

  deletePayment(paymentId: string): Observable<IApiRes<IPaymentDetails>> {
    return this.http.delete<IApiRes<IPaymentDetails>>(
      `${this.ROOT_URL}/zil-payments/${paymentId}`
    );
  }

  processCardPayment(
    paymentId: string,
    moreData: {
      payee_bank_account_id?: string;
      payee_email?: string;
      documents?: ICardPaymentReqDocRes;
      email_otp_session_key?:string,
      phone_otp_session_key?:string,
      category?: string;
      send_sms?: boolean;
      payee_phone?: string;
    }
  ) {
    this.createIdempotencyKey();
    return this.http.post<IApiRes<any>>(
      `${this.ROOT_URL}/zil-payments/${paymentId}/card`,
      moreData,
      { headers: { 'idempotency-key': this.idempotencyKeySubject.value, 'X-Track-Payment-Timeout': 'true' } }
    );
  }

  getDisablePayments(): Observable<IApiRes<IEnablePaymentsMethods>> {
    return this.http.get<IApiRes<IEnablePaymentsMethods>>(
      `${this.ROOT_URL}/payment-settings/get-available-payment-methods`
    );
  }

  getPaymentShortCuts(): Observable<IApiRes<IPaymentShortCutsDetails>> {
    return this.http.get<IApiRes<IPaymentShortCutsDetails>>(
      `${this.ROOT_URL}/payment-settings/get-payment-shortcuts`
    );
  }

  multiApproveChecks(data: { ids: string[] }) {
    return this.http.post(
      `${this.ROOT_URL}/approval-policy/multi-approve`,
      data
    );
  }

  multiRejectChecks(data: { ids: string[] }) {
    return this.http.post(
      `${this.ROOT_URL}/approval-policy/multi-reject`,
      data
    );
  }

  /**
   * @description Getting Transaction limit with cards for user.
   * @returns - an observable containing transaction limit.
   */
  getCardTransactionLimit(): Observable<IApiRes<{ preauth_limit: number }>> {
    return this.http.get<IApiRes<{ preauth_limit: number }>>(
      `${this.ROOT_URL}/payment-methods/transaction-limit`
    );
  }

  /**
   * @description - this api gets called prior to all card payments.
   * @param body - should contain cardId and payment amount.
   * @returns - an observable containing required documents details.
   */
  getRequiredDocumentsDetails(body: {
    cardId: string;
    amount: string;
    paymentType: string;
  }): Observable<
    IApiRes<{ required_docs: ['invoice', 'card', 'authDoc'],isApprovalRequired?: boolean }>
  > {
    return this.http.post<
      IApiRes<{ required_docs: ['invoice', 'card', 'authDoc'],isApprovalRequired?: boolean }>
    >(`${this.ROOT_URL}/payment-methods/required-documents`, body);
  }

  /**
   * @description We should call this api prior to a card payment if the payment required any documents to be submitted.
   * @param body - should contain amount, cardId and required documents binary files.
   * @returns - an observable containing id of submitted documents.
   */
  submitRequiredDocuments(body: FormData) {
    return this.http.post<IApiRes<ICardPaymentReqDocRes>>(
      `${this.ROOT_URL}/payment-methods/submit-required-documents`,
      body
    );
  }

  /**
   * Getting upload from phone link to create qr code. if user choose sms api-v4 also sends a link to their mobile number.
   * @param body - body for request including documentType(to know which item are we going to upload from phone), requestType(Either sms or qr,
   * if its qr, api-v4 will give us a link and we can generate a qr with that, else api-v4 will send us a link and also send the link to the registered phone number), cardId, and amount.
   */
  getUploadFromPhoneLink(body: {
    documentType: 'invoice' | 'card' | 'cardReverse';
    requestType: 'sms' | 'qr';
    cardId: string;
    amount: string;
  }) {
    return this.http.post<
      IApiRes<{ id: string; link: string; phoneNumber: string }>
    >(`${this.ROOT_URL}/payment-methods/upload-file-from-phone`, body);
  }

  /**
   * Getting upload from phone link to create qr code. if user choose sms api-v4 also sends a link to their mobile number.
   * @param body - body for request including documentType(to know which item are we going to upload from phone), requestType(Either sms or qr,
   * if its qr, api-v4 will give us a link and we can generate a qr with that, else api-v4 will send us a link and also send the link to the registered phone number).
   */
  depositSlipUploadFromPhoneLink(body: {
    documentType: 'deposit-slips';
    requestType: 'sms' | 'qr';
    id: string | number;
    phoneNumber?: number;
  }): Observable<{
    data: IUploadFromPhoneResponse;
    errorMsg: number;
    success: boolean;
  }> {
    return this.http.post<{
      data: IUploadFromPhoneResponse;
      errorMsg: number;
      success: boolean;
    }>(
      `${this.ROOT_URL}/deposit-slips/attachments/upload-file-from-phone`,
      body
    );
  }

  updateCheckPayments(
    id: string,
    data: { amount?: string; memo?: string }
  ): Observable<IApiResMesssage> {
    return this.http.patch<IApiResMesssage>(
      `${this.ROOT_URL}/checks/update/${id}`,
      data
    );
  }

  /**
   * Getting Authentication document form data link username, cardNumber, etc...
   * @param cardId - Id of the selected card for payment.
   */
  getAuthDocumentData(cardId: string): Observable<
    IApiRes<{
      firstName: string;
      lastName: string;
      cardDigits: string;
      userName: string;
    }>
  > {
    return this.http.get<
      IApiRes<{
        firstName: string;
        lastName: string;
        cardDigits: string;
        userName: string;
      }>
    >(`${this.ROOT_URL}/payment-methods/auth-document-data?cardId=${cardId}`);
  }

  /**
   * @description - this api gets calculates payment fee.
   * @param sendingData - with mode and amount. payment mode number eg 1 for ach payment, 6 for wire payment.
   * @returns - an observable containing payment fee details.
   */
  calculatePaymentFee(sendingData: {
    mode: number;
    amount: number;
    shippingType?: string;
    isSameDay?: boolean;
    /** the payee is being texted — the SMS is priced with the payment */
    sendSms?: boolean;
  }): Observable<IApiRes<IPaymentFeeDetails>> {
    let params = new HttpParams();
    params = params.append('mode', sendingData.mode);
    params = params.append('amount', sendingData.amount);
    if (sendingData?.shippingType) {
      params = params.append('shipping_type', sendingData?.shippingType);
    }

    if (sendingData?.isSameDay) {
      params = params.append('isSameDay', 1);
    }

    if (sendingData?.sendSms) {
      params = params.append('send_sms', 1);
    }

    return this.http.get<IApiRes<IPaymentFeeDetails>>(
      `${this.ROOT_URL}/payment-methods/card/service-fee`,
      { params }
    );
  }

  /**
   * @description Method for sending payment proof
   * @param uuId -Transaction uuid
   * @returns
   */
  sendPaymentProof(uuId: string, postData: IPaymentsProofPayload) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/zil-payments/${uuId}/send-payment-proof`,
      postData
    );
  }

  /**
   * @description Share one detail-panel section (audit log / comments /
   * attachments / remittance). One endpoint for all four — `share_type` in the
   * body is what switches between them.
   * @param uuId - Zil payment id
   */
  sendSharedSection(uuId: string, postData: IPaymentsProofPayload) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/zil-payments/${uuId}/send-audit-log`,
      postData
    );
  }

    /**
   * @description Method for sending mail payment proof
   * @param uuId -Transaction uuid
   * @returns
   */
    sendMailPaymentProof(uuId:string,postData:IPaymentsProofPayload) {
      return this.http.post<IApiRes<string>>(
        `${this.ROOT_URL}/zil-payments/${uuId}/send-mailed-payment-proof`,
        postData
      );
    }

    sendPaymentReceipt(uuId: string, postData: IPaymentsProofPayload) {
      return this.http.post<IApiRes<string>>(
        `${this.ROOT_URL}/zil-payments/${uuId}/send-payment-receipt`,
        postData
      );
    }

  patchPaymentShortCuts(payloadItems: {
    [key: ISubSideBarItem['id']]: boolean;
  }): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/payment-settings/payment-shortcuts`,
      { paymentShortCuts: payloadItems }
    );
  }

  getTransactionFeatureCode(
    paymentSource: string,
    paymentMethod: string
  ): string {
    /** Bank account transaction feature code */
    if (paymentSource === 'bank') {
      switch (paymentMethod) {
        case 'ach':
          return 'txn-zilpayment-ach-from-bankaccount';
        case 'mail':
          return 'txn-zilpayment-mail-from-bankaccount';
        case 'email':
          return 'txn-check-email';
        case 'print':
          return 'txn-check-print';
        case 'wire':
          return 'txn-zilpayment-wire-from-bankaccount';
        case 'card':
          return 'txn-zilpayment-virtualcard-from-bankaccount';
        default:
          return '';
      }
    }
    if (paymentSource === 'wallet') {
      switch (paymentMethod) {
        case 'ach':
          return 'txn-zilpayment-ach-from-wallet';
        case 'mail':
          return 'txn-zilpayment-mail-from-wallet';
        case 'email':
          return 'txn-check-email';
        case 'print':
          return 'txn-check-print';
        case 'wire':
          return 'txn-zilpayment-wire-from-wallet';
        case 'card':
          return 'txn-zilpayment-virtualcard-from-wallet';
        case 'rtp':
          return 'txn-zilpayment-rtp-from-wallet';
        case 'international':
          return 'txn-zilpayment-international-from-wallet';
        default:
          return '';
      }
    } else if (paymentSource === 'card') {
      switch (paymentMethod) {
        case 'ach':
          return 'txn-zilpayment-ach-from-card';
        case 'mail':
          return 'txn-zilpayment-mail-from-card';
        case 'wire':
          return 'txn-zilpayment-wire-from-card';
        case 'card':
          return 'txn-zilpayment-virtualcard-from-card';
        default:
          return '';
      }
    }
    return '';
  }

  getPodFile(paymentType:string,id: string) {
    return this.http.get<IApiRes<IPodDetails[]>>(
      `${this.ROOT_URL}/${paymentType}/${id}/pod-attachments`,
      { headers: new HttpHeaders({ isDisable422: 'true' }) }
    );
  }

  sendDeliveryOfProof(uuId: string, postData: IPaymentsProofPayload) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/zil-payments/${uuId}/request-delivery-proof`,
      postData
    );
  }

  downloadPodFile(paymentType:string,uuId: string, documentId: string) {
    return this.http.get<IApiRes<string>>(
      `${this.ROOT_URL}/${paymentType}/${uuId}/pod-attachments/${documentId}`
    );
  }

  /**
   * Upload a POD attachment for a payment proof
   */
  uploadPodAttachment(uuId: string, payload: FormData) {
    return this.http.post<{success:boolean}>(
      `${this.ROOT_URL}/zil-payments/${uuId}/send-delivery-proof`,
      payload
    );
  }

  /**
   * Delete a POD attachment for a payment proof
   */
  deletePodAttachment(uuId: string, attachmentId: string) {
    return this.http.delete<IApiRes<{data:string}>>(
      `${this.ROOT_URL}/zil-payments/${uuId}/pod-attachments/${attachmentId}`
    );
  }


  redraftSigedRecieptDescription(payload: string) {
    return this.http.get<IApiRes<{original:string,corrected:string}>>(
      `${this.ROOT_URL}/spell-checker`,
      {params: {text: payload}}
    );
  }


  checkAndHandleMissingAddress(payyeAddressData: any): boolean | void {
    // if (this.proccessed) {
    //   return;
    // }
    if(payyeAddressData?.name === 'Payee Name') return;
    
    this.proccessed = true;

    const payeeData = payyeAddressData;
    const keysToCheck = ['addressLine1', 'city', 'state', 'country', 'zip'];
    const isAnyKeyMissing = keysToCheck.some(key => !payeeData[key]);

    if (isAnyKeyMissing) {
      const currentAlert = this.isV4LayoutEnabled ? this.v4AlertService : this.alertService;
      // For cases where further action is required
      currentAlert
        .warningAlert({
          content: `Address details are missing for the selected payee.`,
          cancelMsg: 'Cancel',
          doneMsg: 'Update Address',
          isCancel: true,
          isOk: true,
        }).afterClosed().subscribe(res => {
          this.proccessed = false;

          if (res) {
            this.payeeService.openPayeeEditModal.next({ page: 'addAddress' });
            this.payeeService.openPayeeEditModal.next(false);
          }
        });
    }
    return isAnyKeyMissing;
  }

  checkAndHandleMissingPayeeInfo(payyeAddressData: any): boolean | void {
    // if (this.proccessed) {
    //   return;
    // }
    if(payyeAddressData?.name === 'Payee Name') return;
    this.proccessed = true;

    const payeeData = payyeAddressData;
    const keysToCheck = ['addressLine1', 'city', 'state', 'country', 'zip', 'company'];
    const isAnyKeyMissing = keysToCheck.some(key => !payeeData[key]);

    if (isAnyKeyMissing) {

      // For cases where further action is required
      this.alert
        .warningAlert({
          content: `More payee details are required to process payment from your card.`,
          cancelMsg: 'Cancel',
          doneMsg: 'Update Payee',
          isCancel: true,
          isOk: true,
        }).afterClosed().subscribe(res => {
          this.proccessed = false;

          if (res) {
            this.payeeService.openPayeeEditModal.next({ page: 'addCompany' });
            this.payeeService.openPayeeEditModal.next(false);
          }
        });
    }
    return isAnyKeyMissing;
  }

  rtpStatusCheck(routingNumber:string){
    return this.http.get<IApiRes<{is_rtp_allowed:boolean}>>(`${this.ROOT_URL}/routing-number/${routingNumber}/rtp-lookup`);
  }


  checkIfsc(ifsc:string,headerOptions?:HttpHeaders){
    return this.http.get<{success:boolean,errorMsg?:string}>(`${this.ROOT_URL}/zil-payments/international-payments/${ifsc}/ifsc`,{ headers: headerOptions });
  }

  checkIban(iban:string,countryCode:string,headerOptions?:HttpHeaders){
    return this.http.get<{success:boolean,errorMsg?:string}>(`${this.ROOT_URL}/zil-payments/international-payments/${iban}/iban/${countryCode}`,{ headers: headerOptions });
  }

  // API for business countries
  enabledInternationalPaymentCountries(){
    return this.http.get<IApiRes<{[key:string]:{countryCode:string,currency:string,iban:number,is_enabled:number,flag:string}}>>(`${this.ROOT_URL}/zil-payments/international-payments/enabled-countries/business`);
  }

  // API for personal countries
  enabledInternationalPaymentCountriesPersonal(){
    return this.http.get<IApiRes<{[key:string]:{countryCode:string,currency:string,iban:number,is_enabled:number}}>>(`${this.ROOT_URL}/zil-payments/international-payments/enabled-countries/personal`);
  }

  internationalBusinessBanksList(payload:{countryCode:string,payoutCurrencyCode:string}){
    return this.http.post<IBusinessBanksResponse>(`${this.ROOT_URL}/zil-payments/international-payments/business-banks-list`, payload);
  }

  getTransactionLimits(): Observable<IApiRes<ITransactionLimits>> {
    return this.http.get<IApiRes<ITransactionLimits>>(`${this.ROOT_URL}/zil-payments/international-payments/personal/transaction-settings`);
  }

  getInternationalPaymentDataList(type: 'business' | 'personal',payload:{countryCode:string,payoutCurrencyCode:string}): Observable<IApiRes<IBusinessDataList>> {
    return this.http.post<IApiRes<IBusinessDataList>>(`${this.ROOT_URL}/zil-payments/international-payments/data-list/${type}`,payload);
  }

  getInternationalBankAddress(ifsc:string){
    return this.http.get<{success:boolean,address:string,city:string,state:string,zip:string,country:string,bank_name:string}>(`${this.ROOT_URL}/zil-payments/international-payments/${ifsc}/bank-details`);
  }

  cardTransactionDocsReview(payload:ICardTransactionDocsPayload){
    return this.http.post(`${this.ROOT_URL}/payment-methods/card/show-documents-preview`, payload, {
      responseType: 'blob'
    });
  }

  openPaymentConfirmationModal(
    data: {
      accNumber: string | number;
      bankName: string;
      payeeName: string;
      paymentMethod: string;
      amount: number | string;
      type?: string;
      shippingType?: string;
      recurringDetails?: IRecurringDetails;
      isPayeeBankVerified?: boolean;
    }
  ) {
    return this.dialog.open<
      PaymentConfirmationModalComponent,
      {
        accNumber: string | number;
        bankName: string;
        payeeName: string;
        paymentMethod: string;
        amount: number | string;
        type?: string;
        shippingType?: string;
        recurringDetails?: IRecurringDetails;
        isPayeeBankVerified?: boolean;
      },
      boolean
    >(PaymentConfirmationModalComponent, {
      width: '435px',
      data: {
        accNumber: data.accNumber,
        bankName: data.bankName,
        payeeName: data.payeeName,
        paymentMethod: data.paymentMethod,
        amount: data.amount,
        type: data.type,
        shippingType: data.shippingType,
        recurringDetails: data.recurringDetails,
        isPayeeBankVerified: data.isPayeeBankVerified,
      },
      disableClose: true
    });
  }


  bannedPayeeCheck(payeeId: string, category: string){
    return this.http.get<{success:boolean,is_banned_visa_bpsp:boolean}>(`${this.ROOT_URL}/payees/${payeeId}/check-payee-mcc-banned?category=${category}`);
  }


  bannedPayeeCheckForGroup(payee_ids: string[]){
    return this.http.post<{success:boolean,is_banned_visa_bpsp_ids:string[]}>(`${this.ROOT_URL}/payees/check-bulk-payee-mcc-banned`,{payee_ids});
  }


  uploadReceiptLogo(logoData: CroppedLogoResult, transactionId: string) {
    return this.http.post<IApiRes<{logoUrl:string}>>(`${this.ROOT_URL}/zil-payments/${transactionId}/upload-receipt-logo`, logoData);
  }

  getAttachmentFee(attachmentIds: string[]){
    return this.http.post<IApiRes<IAttachmentFee>>(`${this.ROOT_URL}/zil-payments/check-mail/attachment-fee`,{attachment_ids: attachmentIds});
  }

  approvePayment(checkIds:string[],paymentId: string[],status:'approve' | 'reject'){
    return this.http.post<IApiRes<string>>(`${this.ROOT_URL}/zil-payments/user-permission-request`, {
      check_ids:checkIds,
      ids: paymentId,
      status
    });
  }

  /**
   * @description Fetches the gateway type based on the payment amount.
   * This method calls the decide-gateway API and returns the gateway type.
   * @param amount - The payment amount
   * @param callback - Optional callback function to handle the gateway type
   */
  fetchGatewayType(amount: number, callback?: (gatewayType: number | undefined) => void): void {
    if (this.creditCardGatewaySwitchingStatus() === 3) return;
    this.isGatewayTypeLoading.set(true);
    if (amount > 0) {
      this.http.post<IApiRes<{ gateway_type: number }>>(
        `${this.ROOT_URL}/payment-methods/card/decide-gateway`,
        { amount }
      )
      .pipe(finalize(() => this.isGatewayTypeLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res?.success && callback) {
            callback(res.data.gateway_type);
          }
        }
      });
    }else{
      this.isGatewayTypeLoading.set(false);
    }
  }

  /**
   * @description Calls the decide-gateway-by-trans-limit API to verify the selected
   * card's gateway type is valid for the entered amount. Only runs when credit card
   * gateway switching status is 3 (the status in which fetchGatewayType is bypassed).
   * Emits `null` when the status guard short-circuits, so callers don't re-check.
   * @param amount - the amount entered by the user
   * @param gatewayType - the gateway type of the selected card
   */
  /**
   * @description Transient registry of card ids the user chose to "skip gateway
   * addition" for (via the verify modal's Skip option). While a card id is marked,
   * the re-tokenise/verify prompt and the pre-payment gateway check are bypassed so
   * the user can pay on the existing gateway. Cleared when the user interacts with
   * the card dropdown again (re-arming the normal verify flow).
   */
  markGatewaySkip(cardId: string | undefined): void {
    if (!cardId) return;
    this.gatewaySkipCardIds.add(cardId);
  }

  isGatewaySkip(cardId: string | undefined): boolean {
    return !!cardId && this.gatewaySkipCardIds.has(cardId);
  }

  clearGatewaySkip(): void {
    this.gatewaySkipCardIds.clear();
  }

  decideGatewayByTransLimit(
    amount: number,
    gatewayType: number,
    cardId?: string
  ): Observable<IApiResMesssage | null | string> {
    if (this.creditCardGatewaySwitchingStatus() !== 3) return of('process_payment');
    if (!amount || !gatewayType) return of(null);
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/payment-methods/card/decide-gateway-by-trans-limit`,
      { amount, gateway_type: gatewayType, card_id: cardId },{ headers: { isDisable422: 'true' } }
    );
  }

  /**
   * @description Orchestrates the full trans-limit check for card-based payment
   * flows with a dropdown: calls decideGatewayByTransLimit and, on a 422 fail
   * response with errorCode 824, branches on the response payload.
   *  - If `duplicate_card` (full IExistingCreditCards object) is present, the
   *    card is added to the dropdown's list (when missing) and selected
   *    silently — no alert.
   *  - Otherwise, clears the card and shows an Add/Cancel alert; on Add it
   *    triggers the dropdown's add-card flow pre-constrained to the returned
   *    gateway_type.
   * The subscription is pushed into the caller's array for lifecycle teardown.
   * @param params.amount - the amount entered by the user
   * @param params.card - the currently selected card (may be null during reset)
   * @param params.cardControl - the form control to reset on failure
   * @param params.dropdown - the cards dropdown component reference for UI actions
   * @param params.subscriptions - the caller's subscription array for teardown
   */
  checkTransLimitForCard(params: {
    amount: number;
    card: IExistingCreditCards | null | undefined;
    cardControl: FormControl<IExistingCreditCards | null>;
    dropdown: CardsDropdownV3Component | undefined;
    subscriptions: Subscription[];
  }): void {
    const { amount, card, cardControl, dropdown, subscriptions } = params;
    if (!amount || !card?.gatewayType) return;
    if (this.isGatewaySkip(card.cardId)) return;
    subscriptions.push(
      this.decideGatewayByTransLimit(amount, Number(card.gatewayType), card.cardId).subscribe({
        next: () => {},
        error: (err) => {
          if (err.error.errorMsg.errorCode === 824) {
            const duplicateCard: IExistingCreditCards | undefined =
              err.error.errorMsg.duplicate_card;
            if (duplicateCard?.cardId) {
              // Auto-populate silently — no alert, no reset/clearSelection.
              // The dropdown handles add-if-missing internally and propagates
              // the new selection to cardControl via its registered valueChanges.
              dropdown?.populateDuplicateCard(duplicateCard);
            } else {
              cardControl.reset();
              dropdown?.clearSelection();
              const failGatewayType = err.error.errorMsg.gateway_type;
              const failMessage = err.error.errorMsg.errorMsg;
              this.alertService
                .warningAlert({
                  title: 'Card Verification Required',
                  content: failMessage,
                  doneMsg: 'Verify Now',
                  cancelMsg: 'Cancel',
                  isCancel: true
                })
                .afterClosed()
                .subscribe((confirmed) => {
                  if (!confirmed) return;
                  if (card?.cardId) {
                    dropdown?.addCardWithPrefill(card, failGatewayType);
                  } else {
                    dropdown?.addNewCard(failGatewayType, true);
                  }
                });
            }
          }
        }
      })
    );
  }

  getMaitanceMode(){
    return this.http.get<IApiRes<{maintenances: IMaintenance[]}>>(`${this.ROOT_URL}/app-maintenances/web`);
  }

  uploadPodFromPhone(payload: {
    documentType: string[];
    encryptedId: string;
    uu_id: string;
    requestType: string;
    phone?: string;
  }) {
    return this.http.post<IApiRes<IUploadFromPhoneData >>(
      `${this.ROOT_URL}/zil-payments/payment-proof-of-delivery/upload-file-from-phone`,
      payload
    );
  }

  reprintApprove(checkIds: string[]) {
    return this.http.post<IApiRes<{ success: boolean; message: string }>>(
      `${this.ROOT_URL}/checks/parent/reprint-approve`,
      { checkId: checkIds }
    );
  }

  reprintReject(checkIds: string[]) {
    return this.http.post<IApiRes<{ success: boolean; message: string }>>(
      `${this.ROOT_URL}/checks/parent/reprint-reject`,
      { checkId: checkIds }
    );
  }

  getCardPaymentPurposeOfPaymentOptions(){
    return this.http.get<IApiRes<string[]>>(`${this.ROOT_URL}/payment-methods/card/purpose-of-payment`);
  }

  checkForComplianceFreeze(){
    return this.localStorageService.getItem('hasComplianceFreeze');
  }

  openComplianceFreezeModal(){
    this.complianceService.openComplianceFreezeModal();
  }


  checkPayeeBankVerificationRequired(bankAccountId?: string): Observable<boolean> {
    const url = bankAccountId
      ? `${this.ROOT_URL}/banking-ach-application/payee-bank-verification-required?bankAccountId=${bankAccountId}`
      : `${this.ROOT_URL}/banking-ach-application/payee-bank-verification-required`;
    return this.http.get<IApiRes<{ isPayeeBankVerificationRequired: boolean }>>(url).pipe(
      map((res) => res.success ? res.data.isPayeeBankVerificationRequired : false)
    );
  }

  /**
   * @description Resolves and caches `isPayeeBankVerificationRequired` for the
   * given payor (originating) bank account. Call on payor bank/wallet selection.
   * Resets to `false` immediately, then updates from the API when a bank id is present.
   * @param payorBankAccountId - Originating bank account id (null/empty skips the call).
   */
  resolvePayeeBankVerificationRequired(
    payorBankAccountId: string | null | undefined
  ): void {
    this.isPayeeBankVerificationRequired = false;
    if (!payorBankAccountId) return;
    this.checkPayeeBankVerificationRequired(payorBankAccountId).subscribe(
      (required) => {
        this.isPayeeBankVerificationRequired = required;
      }
    );
  }

  /**
   * @description Resolves and caches `isPayeeBankVerificationRequired` for
   * card-funded flows, which have no payor bank account. Queries the
   * account-level requirement by calling the endpoint without a bankAccountId.
   */
  resolveCardPayeeBankVerificationRequired(): void {
    this.isPayeeBankVerificationRequired = false;
    this.checkPayeeBankVerificationRequired().subscribe((required) => {
      this.isPayeeBankVerificationRequired = required;
    });
  }
}
