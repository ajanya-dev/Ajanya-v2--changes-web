import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Subscription, catchError, finalize, map, of, switchMap, tap } from 'rxjs';

import { LucideAngularModule, X, ChevronDown, Loader2, Send } from 'lucide-angular';

import { V4BulkPaymentService } from '../../services/v4-bulk-payment.service';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  CheckPrintFormBody,
  IAchSentData,
  IEmailFormBody,
  IPaymentSummaryData,
  IResponse,
  IZilPyamentLists,
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { LET_VENDOR_DECIDE_ID } from 'src/app/modules/payments/model/pay-as-options';

// Child components
import { V4CheckPrintBulkComponent } from './components/v4-check-print-bulk/v4-check-print-bulk.component';
import { V4CheckEmailBulkComponent } from './components/v4-check-email-bulk/v4-check-email-bulk.component';
import { V4CheckMailBulkComponent } from './components/v4-check-mail-bulk/v4-check-mail-bulk.component';
import { V4CheckDdBulkComponent } from './components/v4-check-dd-bulk/v4-check-dd-bulk.component';
import { V4AchBulkComponent } from './components/v4-ach-bulk/v4-ach-bulk.component';
import { V4WireBulkComponent } from './components/v4-wire-bulk/v4-wire-bulk.component';
import { V4VirtualCardBulkComponent } from './components/v4-virtual-card-bulk/v4-virtual-card-bulk.component';
import { V4WalletCheckPrintBulkComponent } from './components/v4-wallet-check-print-bulk/v4-wallet-check-print-bulk.component';
import { V4WalletCheckEmailBulkComponent } from './components/v4-wallet-check-email-bulk/v4-wallet-check-email-bulk.component';
import { isWalletCheckEmail } from 'src/app/modules/v3-bulk-payment/utils/wallet-check-email.util';
import { V4CheckMailType2BulkComponent } from './components/v4-check-mail-type2-bulk/v4-check-mail-type2-bulk.component';
import { V4LetVendorDecideBulkComponent } from './components/v4-let-vendor-decide-bulk/v4-let-vendor-decide-bulk.component';
import { V4PaymentSummaryModalComponent } from '../v4-payment-summary-modal/v4-payment-summary-modal.component';

interface IZilPaymentListsExtended extends IZilPyamentLists {
  PaymentMethode?: string;
}

interface IDialogData {
  checkMailPayments: IZilPaymentListsExtended[];
  checkEmailPayments: IZilPaymentListsExtended[];
  checkPrintPayments: IZilPaymentListsExtended[];
  checkDDPayments: IZilPaymentListsExtended[];
  skipBankPrefill?: boolean;
}

@Component({
  selector: 'app-v4-bulk-payment-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    MatDialogClose,
    CurrencyPipe,
    V4CheckPrintBulkComponent,
    V4CheckEmailBulkComponent,
    V4CheckMailBulkComponent,
    V4CheckDdBulkComponent,
    V4AchBulkComponent,
    V4WireBulkComponent,
    V4VirtualCardBulkComponent,
    V4WalletCheckPrintBulkComponent,
    V4WalletCheckEmailBulkComponent,
    V4CheckMailType2BulkComponent,
    V4LetVendorDecideBulkComponent
  ],
  templateUrl: './v4-bulk-payment-modal.component.html',
  styleUrl: './v4-bulk-payment-modal.component.scss'
})
export class V4BulkPaymentModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<V4BulkPaymentModalComponent>);
  private data: IDialogData = inject(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  v4Service = inject(V4BulkPaymentService);
  v3Service = inject(V3BulkPaymentService);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private layoutService = inject(LayoutService);
  private router = inject(Router);
  private v3DataTableService = inject(V3DataTableService);

  readonly XIcon = X;
  readonly ChevronDownIcon = ChevronDown;
  readonly Loader2Icon = Loader2;
  readonly SendIcon = Send;

  // Payment data grouped by type
  checkMailPayments: IZilPaymentListsExtended[] = [];
  checkEmailPayments: IZilPaymentListsExtended[] = [];
  checkPrintPayments: IZilPaymentListsExtended[] = [];
  checkDDPayments: IZilPaymentListsExtended[] = [];
  achPayments: IZilPyamentLists[] = [];
  wirePayments: IZilPyamentLists[] = [];
  virtualCardPayments: IZilPyamentLists[] = [];
  walletCheckPrintPayments: IZilPyamentLists[] = [];
  walletCheckEmailPayments: IZilPyamentLists[] = [];
  checkMailType2Payments: IZilPyamentLists[] = [];
  letVendorDecidePayments: IZilPyamentLists[] = [];

  // Form
  bulkPaymentForm: FormGroup;

  // State
  skipBankPrefill = false;
  isProcessing = signal(false);
  totalAmount = signal<number>(0);
  totalCost = signal<number>(0);
  totalPayments = signal<number>(0);

  // Payment summary tracking
  private paymentSummary: IPaymentSummaryData[] = [];
  private bulkSummary: (IPaymentSummaryData | IPaymentSummaryData[])[] = [];
  private paymentResultMap = new Map<string, { success: boolean; errorMsg?: string }>();

  private isCustomAddress = false;
  private subscriptions: Subscription[] = [];
  // True once the modal is gone (e.g. user navigated away) while payments keep processing.
  private isDestroyed = false;

  ngOnInit(): void {
    this.skipBankPrefill = this.data?.skipBankPrefill ?? false;
    this.categorizePayments();
    this.initForm();
    this.v3Service.bulkPaymentForm = this.bulkPaymentForm;
    this.subscribeToFormChanges();
    this.subscriptions.push(
      this.v3Service.isCustomAddress.subscribe((val) => {
        this.isCustomAddress = val;
      })
    );

    if (this.checkMailPayments.length > 0) {
      this.v4Service.registerChildLoading('check-mail-bulk');
    }
    if (this.checkEmailPayments.length > 0) {
      this.v4Service.registerChildLoading('check-email-bulk');
    }
    if (this.checkDDPayments.length > 0) {
      this.v4Service.registerChildLoading('check-dd-bulk');
    }
  }

  private categorizePayments(): void {
    // Check payments from check-mode-select modal
    this.checkMailPayments = this.data?.checkMailPayments || [];
    this.checkEmailPayments = this.data?.checkEmailPayments || [];
    this.checkPrintPayments = this.data?.checkPrintPayments || [];
    this.checkDDPayments = this.data?.checkDDPayments || [];

    // Non-check payments from payment list data
    const allPayments = this.v4Service.paymentListData();
    this.achPayments = allPayments.filter((p) => p.transferTypeCode === 'ach');
    this.wirePayments = allPayments.filter((p) => p.transferTypeCode === 'wire');
    this.virtualCardPayments = allPayments.filter(
      (p) => p.transferTypeCode === 'virtualCard'
    );
    this.walletCheckPrintPayments = allPayments.filter(
      (p) =>
        p.transferType === 'CHECK' &&
        p.sourceType === 'WALLET' &&
        !isWalletCheckEmail(p)
    );
    this.walletCheckEmailPayments = allPayments.filter(isWalletCheckEmail);
    this.checkMailType2Payments = allPayments.filter(
      (p) => p.transferTypeCode === 'checkMail'
    );
    this.letVendorDecidePayments = allPayments.filter(
      (p) => p.transferTypeCode === LET_VENDOR_DECIDE_ID
    );

    // Calculate total payments count
    const total =
      this.checkMailPayments.length +
      this.checkEmailPayments.length +
      this.checkPrintPayments.length +
      this.checkDDPayments.length +
      this.achPayments.length +
      this.wirePayments.length +
      this.virtualCardPayments.length +
      this.walletCheckPrintPayments.length +
      this.walletCheckEmailPayments.length +
      this.checkMailType2Payments.length +
      this.letVendorDecidePayments.length;
    this.totalPayments.set(total);
  }

  private initForm(): void {
    this.bulkPaymentForm = new FormGroup({
      checkMailFormGroup: new FormGroup({
        checkMailFormArray: new FormArray([])
      }),
      checkEmailFormGroup: new FormGroup({
        checkEmailFormArray: new FormArray([])
      }),
      checkPrintFormGroup: new FormGroup({
        checkPrintFormArray: new FormArray([])
      }),
      checkDDFormGroup: new FormGroup({
        checkDDFormArray: new FormArray([])
      }),
      checkMailType2FormGroup: new FormGroup({
        checkMailType2FormArray: new FormArray([])
      }),
      achFormGroup: new FormGroup({
        achFormArray: new FormArray([])
      }),
      wireFormGroup: new FormGroup({
        wireFormArray: new FormArray([])
      }),
      virtualCardFormGroup: new FormGroup({
        virtualCardFormArray: new FormArray([])
      }),
      walletCheckPrintFormGroup: new FormGroup({
        walletCheckPrintFormArray: new FormArray([])
      }),
      walletCheckEmailFormGroup: new FormGroup({
        walletCheckEmailFormArray: new FormArray([])
      }),
      letVendorDecideFormGroup: new FormGroup({
        letVendorDecideFormArray: new FormArray([])
      })
    });
  }

  private subscribeToFormChanges(): void {
    this.subscriptions.push(
      this.bulkPaymentForm.valueChanges.subscribe(() => {
        this.calculateTotals();
      })
    );

    // Subscribe to shipping fee changes
    this.subscriptions.push(
      this.v3Service.totalShippingFee$.subscribe((fee) => {
        this.v4Service.totalShippingFee.set(parseFloat(fee) || 0);
      })
    );

    this.subscriptions.push(
      this.v3Service.totalAttachmentFee$.subscribe((fee) => {
        this.v4Service.totalAttachmentFee.set(parseFloat(fee) || 0);
      })
    );
  }

  private calculateTotals(): void {
    let totalAmount = 0;
    let totalCost = 0;
    let totalCount = 0;
    const formArrayNames = [
      'checkMailFormGroup.checkMailFormArray',
      'checkEmailFormGroup.checkEmailFormArray',
      'checkPrintFormGroup.checkPrintFormArray',
      'checkDDFormGroup.checkDDFormArray',
      'checkMailType2FormGroup.checkMailType2FormArray',
      'achFormGroup.achFormArray',
      'wireFormGroup.wireFormArray',
      'virtualCardFormGroup.virtualCardFormArray',
      'walletCheckPrintFormGroup.walletCheckPrintFormArray',
      'walletCheckEmailFormGroup.walletCheckEmailFormArray',
      'letVendorDecideFormGroup.letVendorDecideFormArray'
    ];

    formArrayNames.forEach((path) => {
      const formArray = this.bulkPaymentForm.get(path) as FormArray;
      if (formArray) {
        totalCount += formArray.length;
        formArray.controls.forEach((control) => {
          const val = control.value;
          const amount = Number(val?.amount || val?.cheque_amount || 0);
          totalAmount += amount;
          totalCost += Number(val?.cost || 0);
        });
      }
    });

    this.totalAmount.set(totalAmount);
    this.totalCost.set(totalCost);
    this.v4Service.totalPaymentCount.set(totalCount);
  }

  closeAllDropdowns(): void {
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  }

  onSubmit(): void {
    if (this.bulkPaymentForm?.invalid) {
      this.bulkPaymentForm.markAllAsTouched();
      this.alertService.infoAlert({
        content: 'Please fill all required fields'
      });
      return;
    }

    if (
      this.v3Service.isSendToOneAddress &&
      this.v3Service.sendToOneAddressEmail.invalid
    ) {
      this.v3Service.sendToOneAddressEmail.markAllAsTouched();
      this.alertService.infoAlert({
        content: 'Please enter a valid email address'
      });
      return;
    }

    if (!this.isCustomAddress && this.hasInvalidCheckMailAddresses()) {
      this.alertService.infoAlert({
        content: 'Please fix invalid From/To addresses before processing'
      });
      return;
    }

    this.processPayments();
  }

  private hasInvalidCheckMailAddresses(): boolean {
    const checkMailFormArray = this.bulkPaymentForm
      ?.get('checkMailFormGroup')
      ?.get('checkMailFormArray') as FormArray;
    if (!checkMailFormArray?.length) return false;
    return checkMailFormArray.controls.some((ctrl) => {
      const v = ctrl.value || {};
      return (
        v.toAddressValidity?.success === false ||
        v.fromAddressValidity?.success === false
      );
    });
  }

  private processPayments(): void {
    const achFormArray = this.bulkPaymentForm
      .get('achFormGroup')
      ?.get('achFormArray') as FormArray;
    const wireFormArray = this.bulkPaymentForm
      .get('wireFormGroup')
      ?.get('wireFormArray') as FormArray;
    const cardFormArray = this.bulkPaymentForm
      .get('virtualCardFormGroup')
      ?.get('virtualCardFormArray') as FormArray;
    const checkMailType2Array = this.bulkPaymentForm
      .get('checkMailType2FormGroup')
      ?.get('checkMailType2FormArray') as FormArray;
    const walletCheckPrintFormArray = this.bulkPaymentForm
      .get('walletCheckPrintFormGroup')
      ?.get('walletCheckPrintFormArray') as FormArray;
    const walletCheckEmailFormArray = this.bulkPaymentForm
      .get('walletCheckEmailFormGroup')
      ?.get('walletCheckEmailFormArray') as FormArray;
    const letVendorDecideFormArray = this.bulkPaymentForm
      .get('letVendorDecideFormGroup')
      ?.get('letVendorDecideFormArray') as FormArray;

    // Snapshot all form values BEFORE isProcessing destroys the DOM.
    const achValues = this.enrichZilPaymentFormValues(
      JSON.parse(JSON.stringify(achFormArray?.value || []))
    );
    const wireValues = this.enrichZilPaymentFormValues(
      JSON.parse(JSON.stringify(wireFormArray?.value || []))
    );
    const cardValues = this.enrichZilPaymentFormValues(
      JSON.parse(JSON.stringify(cardFormArray?.value || []))
    );
    const checkMailType2Values = JSON.parse(
      JSON.stringify(checkMailType2Array?.value || [])
    );
    const walletCheckPrintValues = JSON.parse(
      JSON.stringify(walletCheckPrintFormArray?.value || [])
    );
    const walletCheckEmailValues = JSON.parse(
      JSON.stringify(walletCheckEmailFormArray?.value || [])
    );
    const letVendorDecideValues = this.enrichZilPaymentFormValues(
      JSON.parse(JSON.stringify(letVendorDecideFormArray?.value || []))
    );

    // Snapshot shared service state so a later bulk flow can't change it mid-run.
    const bulkPaymentsUuidList = [...this.v4Service.bulkPaymentsUuidList];
    const walletCheckPrintPaperType = this.v3Service.walletCheckPrintPaperType || 4;

    // Build payment summary BEFORE isProcessing destroys child components
    this.getBulkPaymentInfo();

    // Clear result map for fresh processing
    this.paymentResultMap.clear();

    this.isProcessing.set(true);
    this.dialogRef.updateSize('380px');    this.v4Service.isBulkPaymentProcessing.set(true);
    this.v4Service.completedPaymentCount.set(0);

    // Header progress bar: reset, then show with the total payment count.
    this.layoutService.isProgressBarInvoked.next(false);
    this.v3Service.abcEntCheckPrintCountSignal.set(undefined);
    this.v3Service.setBulkPaymentData([]);
    this.v3Service.completedPaymentCount = 0;
    this.v3Service.setBulkPaymentCount(this.paymentSummary.length);

    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });

    // Build observables array
    const observables = [];

    // 1. Process Check Mail
    observables.push(() => {
      const checkMailFormArray = this.bulkPaymentForm
        ?.get('checkMailFormGroup')
        ?.get('checkMailFormArray') as FormArray;
      if (checkMailFormArray?.value?.[0]?.mailNowPayLoad) {
        return this.v3Service
          .sendCheckMail(checkMailFormArray.value[0].mailNowPayLoad, '', headerOptions)
          .pipe(
            tap((res) => this.recordBatchResult(res, 'Check Mail from Bank')),
            finalize(() => {
              this.v3Service.completedPaymentCount = checkMailFormArray.length;
            }),
            catchError((error) => {
              this.recordBatchResult(error, 'Check Mail from Bank');
              return of(error);
            })
          );
      }
      return of(null);
    });

    // 2. Process Check Email
    observables.push(() => {
      const checkEmailFormArray = this.bulkPaymentForm
        .get('checkEmailFormGroup')
        ?.get('checkEmailFormArray') as FormArray;
      if (checkEmailFormArray?.length > 0) {
        const mailCheckIds: string[] = [];
        const payeeEmail: Record<string, string> = {};
        const smsCheckbox: Record<string, boolean> = {};
        const phone: Record<string, string> = {};
        const fileHidden: { [key: string]: string[] | string } = {};

        checkEmailFormArray.value.forEach((e: IEmailFormBody) => {
          mailCheckIds.push(e.checkId);
          payeeEmail[e.checkId] = e.payee_email;
          smsCheckbox[e.checkId] = e.checked;
          phone[e.checkId] = e.payee_phone;
          fileHidden[e.checkId] = e.attachments || [];
        });

        const body = {
          mail_check_ids: mailCheckIds,
          payee_email: payeeEmail,
          sms_checkbox: smsCheckbox,
          phone,
          file_hidden: fileHidden,
          is_group_echeck: false,
          group_echeck_email: ''
        };
        return this.checkService.sendEmail(body, headerOptions).pipe(
          tap((res) => this.recordBatchResult(res, 'Check Email')),
          finalize(() => {
            this.v3Service.completedPaymentCount = checkEmailFormArray.length;
          }),
          catchError((error) => {
            this.recordBatchResult(error, 'Check Email');
            return of(error);
          })
        );
      }
      return of(null);
    });

    // 3. Process Check DD
    observables.push(() => {
      const checkDDFormArray = this.bulkPaymentForm
        ?.get('checkDDFormGroup')
        ?.get('checkDDFormArray') as FormArray;
      const achSentData: IAchSentData[] = [];
      checkDDFormArray?.value?.forEach((e: { [key: string]: string }) => {
        achSentData.push({
          mail_check_id: e.mail_check_id || e.checkId,
          payee_email: e.payee_email || e.email,
          wallet_bypassing: e.wallet_bypassing ? '1' : '0',
          payee_account: e.payee_account || e.payeeAcc,
          send_sms: e.send_sms ? 1 : 0,
          payee_phone: e.payee_phone || e.phone
        });
      });
      if (achSentData.length) {
        const checkDD = {
          data: achSentData,
          recurring: {},
          isRecurringValue: 0,
          isSameDay: 0
        };
        return this.checkService
          .postDirectDepostModalData(checkDD, headerOptions)
          .pipe(
            tap((res) => this.recordBatchResult(res, 'Check DD')),
            finalize(() => {
              this.v3Service.completedPaymentCount = achSentData.length;
            }),
            catchError((error) => {
              this.recordBatchResult(error, 'Check DD');
              return of(error);
            })
          );
      }
      return of(null);
    });

    // 4. Process Check Print (Check Paper - paperType 4)
    observables.push(() => {
      const checkPrintFormArray = this.bulkPaymentForm
        .get('checkPrintFormGroup')
        ?.get('checkPrintFormArray') as FormArray;
      const checkPaperPayments = checkPrintFormArray?.value?.filter(
        (data: CheckPrintFormBody) => data.paperType === '4'
      );
      if (checkPaperPayments?.length > 0) {
        const checkIdArray = checkPaperPayments.map((obj: CheckPrintFormBody) => obj.checkId);
        return this.v3Service
          .checkPrintPayment({ checkId: checkIdArray, paperType: 4 }, headerOptions)
          .pipe(
            tap((res) => {
              if (res?.data?.url) {
                window.open(res.data.url);
              }
              this.recordBatchResult(res, 'Check Print');
            }),
            finalize(() => {
              this.v3Service.completedPaymentCount = checkPaperPayments.length;
            }),
            catchError((error) => {
              this.recordBatchResult(error, 'Check Print');
              return of(error);
            })
          );
      }
      return of(null);
    });

    // 5. Process Check Print (White Paper - paperType 6)
    observables.push(() => {
      const checkPrintFormArray = this.bulkPaymentForm
        .get('checkPrintFormGroup')
        ?.get('checkPrintFormArray') as FormArray;
      const whitePaperPayments = checkPrintFormArray?.value?.filter(
        (data: CheckPrintFormBody) => data.paperType === '6'
      );
      if (whitePaperPayments?.length > 0) {
        const checkIdArray = whitePaperPayments.map((obj: CheckPrintFormBody) => obj.checkId);
        return this.v3Service
          .checkPrintPayment({ checkId: checkIdArray, paperType: 6 }, headerOptions)
          .pipe(
            tap((res) => {
              if (res?.data?.url) {
                window.open(res.data.url);
              }
              this.recordBatchResult(res, 'Check Print');
            }),
            finalize(() => {
              this.v3Service.completedPaymentCount = whitePaperPayments.length;
            }),
            catchError((error) => {
              this.recordBatchResult(error, 'Check Print');
              return of(error);
            })
          );
      }
      return of(null);
    });

    // 6. Process Wallet Mail Payments (checkMailType2 with WALLET source)
    observables.push(() => {
      const walletPayments = checkMailType2Values?.filter(
        (p: { from?: string; sourceType?: string }) => p?.from === 'WALLET' || p?.sourceType === 'WALLET'
      );
      if (walletPayments?.length > 0) {
        const payload: {
          payment_ids: string[];
          [key: string]: string[] | { mail_type: string; file_hidden: string[] };
        } = {
          payment_ids: bulkPaymentsUuidList
        };
        walletPayments.forEach((p: { uuid?: string; mail_type?: string; file_hidden?: string[] }) => {
          if (p?.uuid) {
            payload[p.uuid] = {
              mail_type: p.mail_type || '',
              file_hidden: Array.isArray(p.file_hidden) ? p.file_hidden : []
            };
          }
        });
        return this.v3Service
          .processWalletPaymentsMulti(payload as { payment_ids: string[]; [key: string]: string[] | { mail_type: string; file_hidden: string[] } }, headerOptions)
          .pipe(
            tap((res) => this.recordPaymentResult(null, res)),
            finalize(() => {
              this.v3Service.completedPaymentCount = walletPayments.length;
            }),
            catchError((error) => {
              walletPayments.forEach((p: { uuid?: string }) => {
                if (p?.uuid) {
                  this.paymentResultMap.set(p.uuid, {
                    success: false,
                    errorMsg: error?.error?.errorMsg || 'Processing failed'
                  });
                }
              });
              return of(error);
            })
          );
      }
      return of(null);
    });

    // 7. Process Wallet Print Payments
    observables.push(() => {
      const walletPrintPayments = walletCheckPrintValues || [];
      if (walletPrintPayments.length > 0) {
        const paymentIds = walletPrintPayments
          .map((p: { uuid?: string }) => p?.uuid)
          .filter(Boolean);
        const payload = { payment_ids: paymentIds };
        return this.v3Service
          .processWalletPaymentsMulti(payload, headerOptions)
          .pipe(
            switchMap((res) => {
              this.recordPaymentResult(null, res);
              const response = res as IResponse;
              if (response?.success && response?.response_code === 210 && response?.data) {
                const successfulCheckIds: string[] = [];
                const responseData = response.data as Record<string, { success: boolean; errorMsg?: string; data?: { check_id: string } }>;
                Object.keys(responseData).forEach((uuid) => {
                  const item = responseData[uuid];
                  if (item?.success && item?.data?.check_id) {
                    successfulCheckIds.push(item.data.check_id);
                  }
                });
                if (successfulCheckIds.length > 0) {
                  return this.v3Service
                    .checkPrintPayment(
                      { checkId: successfulCheckIds, paperType: walletCheckPrintPaperType },
                      headerOptions
                    )
                    .pipe(
                      tap((printRes) => {
                        if (printRes?.data?.url) {
                          window.open(printRes.data.url);
                        }
                      }),
                      map(() => res),
                      catchError(() => of(res))
                    );
                }
              }
              return of(res);
            }),
            finalize(() => {
              this.v3Service.completedPaymentCount = walletPrintPayments.length;
            }),
            catchError((error) => of(error))
          );
      }
      return of(null);
    });

    // 7b. Process Wallet Email Payments. These go through the zil-payments rail
    // rather than the wallet import rail (multi-process): only the former takes a
    // payee_email, and the import rail rejects these with "Payee email is
    // required". This matches the single-payment wallet check email flow.
    const walletEmailValues = this.enrichZilPaymentFormValues(
      walletCheckEmailValues || []
    );
    observables.push(() => {
      if (walletEmailValues.length === 0) return of(null);
      let idx7b = 0;
      return this.v3Service
        .processZilPaymentsSequentially(walletEmailValues, 'walletCheckEmail')
        .pipe(
          tap((response) => {
            const uuid = walletEmailValues[idx7b]?.uuid;
            idx7b += 1;
            if (uuid) this.recordPaymentResult(uuid, response);
          })
        );
    });

    // 8. Process Zil Payments - CheckMailType2 (non-WALLET)
    const checkMail2NonWallet = this.enrichZilPaymentFormValues(
      checkMailType2Values?.filter(
        (p: { from?: string; sourceType?: string }) => p?.from !== 'WALLET' && p?.sourceType !== 'WALLET'
      ) || []
    );
    observables.push(() => {
      if (checkMail2NonWallet.length === 0) return of(null);
      let idx8 = 0;
      return this.v3Service.processZilPaymentsSequentially(checkMail2NonWallet, 'checkMail2').pipe(
        tap((response) => {
          const uuid = checkMail2NonWallet[idx8]?.uuid;
          idx8++;
          if (uuid) this.recordPaymentResult(uuid, response);
        })
      );
    });

    // 9. Process Zil Payments - ACH
    observables.push(() => {
      if (achValues.length === 0) return of(null);
      let idx9 = 0;
      return this.v3Service.processZilPaymentsSequentially(achValues, 'ach').pipe(
        tap((response) => {
          const uuid = achValues[idx9]?.uuid;
          idx9++;
          if (uuid) this.recordPaymentResult(uuid, response);
        })
      );
    });

    // 10. Process Zil Payments - Wire
    observables.push(() => {
      if (wireValues.length === 0) return of(null);
      let idx10 = 0;
      return this.v3Service.processZilPaymentsSequentially(wireValues, 'wire').pipe(
        tap((response) => {
          const uuid = wireValues[idx10]?.uuid;
          idx10++;
          if (uuid) this.recordPaymentResult(uuid, response);
        })
      );
    });

    // 11. Process Zil Payments - Virtual Card
    observables.push(() => {
      if (cardValues.length === 0) return of(null);
      let idx11 = 0;
      return this.v3Service.processZilPaymentsSequentially(cardValues, 'card').pipe(
        tap((response) => {
          const uuid = cardValues[idx11]?.uuid;
          idx11++;
          if (uuid) this.recordPaymentResult(uuid, response);
        })
      );
    });

    // 12. Process Zil Payments - Let vendor decide
    observables.push(() => {
      if (letVendorDecideValues.length === 0) return of(null);
      let idx12 = 0;
      return this.v3Service
        .processZilPaymentsSequentially(letVendorDecideValues, 'letVendorDecide')
        .pipe(
          tap((response) => {
            const uuid = letVendorDecideValues[idx12]?.uuid;
            idx12++;
            if (uuid) this.recordPaymentResult(uuid, response);
          })
        );
    });

    // Execute all sequentially. Not tied to this.subscriptions so it survives the modal being destroyed on navigation.
    this.v3Service.setIsBulkPaymentProcessing(true);
    this.v4Service
      .processAllPaymentsSequentially(observables)
      .subscribe({ complete: () => this.finishBulkProcessing(), error: () => this.finishBulkProcessing() });
  }

  /** Teardown for the bulk run — must run on both the success and the failure path. */
  private finishBulkProcessing(): void {
    this.v4Service.isBulkPaymentProcessing.set(false);

    // Build final summary using UUID-based result map
    const summaryData = this.buildFinalSummary();
    this.v3Service.setBulkPaymentData(summaryData);
    this.v3Service.setIsBulkPaymentProcessing(false);

    // User left the modal: header shows "Payments Completed" with View Summary. Refresh
    // here too — the afterClosed handler that normally does it never ran.
    if (this.isDestroyed) {
      this.v3DataTableService.refreshV3DataTable();
      return;
    }

    this.isProcessing.set(false);
    this.v3Service.setBulkPaymentCount(0);
    this.dialogRef.close(true);

    this.dialog.open(V4PaymentSummaryModalComponent, {
      maxWidth: '800px',
      width: '95%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { summary: summaryData }
    });
  }

  /**
   * @description Builds payment summary data from form arrays before processing.
   * Groups payments by type in the same order as observables for correct response mapping.
   */
  private getBulkPaymentInfo(): void {
    this.paymentSummary = [];
    this.bulkSummary = [];

    const checkMailFormArray = this.bulkPaymentForm
      ?.get('checkMailFormGroup')?.get('checkMailFormArray') as FormArray;
    const checkEmailFormArray = this.bulkPaymentForm
      .get('checkEmailFormGroup')?.get('checkEmailFormArray') as FormArray;
    const checkDDFormArray = this.bulkPaymentForm
      ?.get('checkDDFormGroup')?.get('checkDDFormArray') as FormArray;
    const checkPrintFormArray = this.bulkPaymentForm
      .get('checkPrintFormGroup')?.get('checkPrintFormArray') as FormArray;
    const checkMailType2Array = this.bulkPaymentForm
      .get('checkMailType2FormGroup')?.get('checkMailType2FormArray') as FormArray;
    const achFormArray = this.bulkPaymentForm
      .get('achFormGroup')?.get('achFormArray') as FormArray;
    const wireFormArray = this.bulkPaymentForm
      .get('wireFormGroup')?.get('wireFormArray') as FormArray;
    const cardFormArray = this.bulkPaymentForm
      .get('virtualCardFormGroup')?.get('virtualCardFormArray') as FormArray;
    const walletCheckPrintFormArray = this.bulkPaymentForm
      .get('walletCheckPrintFormGroup')?.get('walletCheckPrintFormArray') as FormArray;
    const walletCheckEmailFormArray = this.bulkPaymentForm
      .get('walletCheckEmailFormGroup')?.get('walletCheckEmailFormArray') as FormArray;
    const letVendorDecideFormArray = this.bulkPaymentForm
      .get('letVendorDecideFormGroup')?.get('letVendorDecideFormArray') as FormArray;

    // 1. Check Mail from Bank (observable 1)
    const mailItems: IPaymentSummaryData[] = [];
    checkMailFormArray?.value?.forEach((item: Record<string, any>) => {
      mailItems.push({
        payee: item.payee || '',
        amount: String(item.amount || ''),
        type: 'Check Mail from Bank'
      });
    });
    if (mailItems.length) {
      this.bulkSummary.push(mailItems);
      this.paymentSummary.push(...mailItems);
    }

    // 2. Check Email (observable 2)
    const emailItems: IPaymentSummaryData[] = [];
    checkEmailFormArray?.value?.forEach((item: Record<string, any>) => {
      emailItems.push({
        payee: item.payee_name || '',
        amount: String(item.cheque_amount || ''),
        type: 'Check Email'
      });
    });
    if (emailItems.length) {
      this.bulkSummary.push(emailItems);
      this.paymentSummary.push(...emailItems);
    }

    // 3. Check DD (observable 3)
    const ddItems: IPaymentSummaryData[] = [];
    checkDDFormArray?.value?.forEach((item: Record<string, any>) => {
      ddItems.push({
        payee: item.payee?.name || '',
        amount: String(item.amount || ''),
        type: 'Check DD'
      });
    });
    if (ddItems.length) {
      this.bulkSummary.push(ddItems);
      this.paymentSummary.push(...ddItems);
    }

    // 4. Check Print - Check Paper (observable 4)
    const checkPaperItems: IPaymentSummaryData[] = [];
    checkPrintFormArray?.value
      ?.filter((d: Record<string, string>) => d.paperType === '4')
      ?.forEach((item: Record<string, any>) => {
        checkPaperItems.push({
          payee: item.payee || '',
          amount: String(item.amount || ''),
          type: 'Check Print'
        });
      });
    if (checkPaperItems.length) {
      this.bulkSummary.push(checkPaperItems);
      this.paymentSummary.push(...checkPaperItems);
    }

    // 5. Check Print - White Paper (observable 5)
    const whitePaperItems: IPaymentSummaryData[] = [];
    checkPrintFormArray?.value
      ?.filter((d: Record<string, string>) => d.paperType === '6')
      ?.forEach((item: Record<string, any>) => {
        whitePaperItems.push({
          payee: item.payee || '',
          amount: String(item.amount || ''),
          type: 'Check Print'
        });
      });
    if (whitePaperItems.length) {
      this.bulkSummary.push(whitePaperItems);
      this.paymentSummary.push(...whitePaperItems);
    }

    // 6. Wallet Mail - checkMailType2 with WALLET source (observable 6)
    const walletMailItems: IPaymentSummaryData[] = [];
    checkMailType2Array?.value
      ?.filter((p: Record<string, string>) => p?.from === 'WALLET' || p?.sourceType === 'WALLET')
      ?.forEach((item: Record<string, any>) => {
        const summaryItem: IPaymentSummaryData = {
          payee: item.payee?.name || '',
          amount: String(item.amount || ''),
          type: 'Check Mail',
          uuid: item.uuid
        };
        walletMailItems.push(summaryItem);
      });
    if (walletMailItems.length) {
      this.bulkSummary.push(walletMailItems);
      this.paymentSummary.push(...walletMailItems);
    }

    // 7. Wallet Print (observable 7)
    walletCheckPrintFormArray?.value?.forEach((item: Record<string, any>) => {
      const summaryItem: IPaymentSummaryData = {
        payee: item.payee || '',
        amount: String(item.amount || ''),
        type: 'Wallet Print',
        uuid: item.uuid
      };
      this.bulkSummary.push(summaryItem);
      this.paymentSummary.push(summaryItem);
    });

    // 7b. Wallet Email (observable 7b)
    walletCheckEmailFormArray?.value?.forEach((item: { payee?: string; amount?: string; uuid?: string }) => {
      const summaryItem: IPaymentSummaryData = {
        payee: item.payee || '',
        amount: String(item.amount || ''),
        type: 'Wallet Email',
        uuid: item.uuid
      };
      this.bulkSummary.push(summaryItem);
      this.paymentSummary.push(summaryItem);
    });

    // 8. Zil checkMail2 non-WALLET (observable 8)
    checkMailType2Array?.value
      ?.filter((p: Record<string, string>) => p?.from !== 'WALLET' && p?.sourceType !== 'WALLET')
      ?.forEach((item: Record<string, any>) => {
        const summaryItem: IPaymentSummaryData = {
          payee: item.payee?.name || '',
          amount: String(item.amount || ''),
          type: 'Check Mail',
          uuid: item.uuid
        };
        this.bulkSummary.push(summaryItem);
        this.paymentSummary.push(summaryItem);
      });

    // 9. ACH (observable 9)
    achFormArray?.value?.forEach((item: Record<string, any>) => {
      const summaryItem: IPaymentSummaryData = {
        payee: item.payee?.name || '',
        amount: String(item.amount || ''),
        type: 'ACH',
        uuid: item.uuid
      };
      this.bulkSummary.push(summaryItem);
      this.paymentSummary.push(summaryItem);
    });

    // 10. Wire (observable 10)
    wireFormArray?.value?.forEach((item: Record<string, any>) => {
      const summaryItem: IPaymentSummaryData = {
        payee: item.payee?.name || '',
        amount: String(item.amount || ''),
        type: 'Wire',
        uuid: item.uuid
      };
      this.bulkSummary.push(summaryItem);
      this.paymentSummary.push(summaryItem);
    });

    // 11. Virtual Card (observable 11)
    cardFormArray?.value?.forEach((item: Record<string, any>) => {
      const summaryItem: IPaymentSummaryData = {
        payee: item.payee?.name || '',
        amount: String(item.amount || ''),
        type: 'Card',
        uuid: item.uuid
      };
      this.bulkSummary.push(summaryItem);
      this.paymentSummary.push(summaryItem);
    });

    // 12. Let vendor decide (observable 12)
    letVendorDecideFormArray?.value?.forEach((item: Record<string, any>) => {
      const summaryItem: IPaymentSummaryData = {
        payee: item.payee?.name || '',
        amount: String(item.amount || ''),
        type: 'Let vendor decide',
        uuid: item.uuid
      };
      this.bulkSummary.push(summaryItem);
      this.paymentSummary.push(summaryItem);
    });
  }

  /**
   * @description Records a payment result by UUID from any API response format.
   * Handles: response_code 210 (per-UUID data), standard success, HttpErrorResponse.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recordPaymentResult(callingUuid: string | null, response: any): void {
    if (!response) return;

    // HttpErrorResponse (422, etc.)
    if (response instanceof HttpErrorResponse || response?.error?.errorMsg) {
      const errorMsg = response?.error?.errorMsg || response?.error?.message || 'Processing failed';
      if (callingUuid) {
        this.paymentResultMap.set(callingUuid, { success: false, errorMsg });
      }
      return;
    }

    // Response code 210: per-UUID data in response.data
    if (response?.response_code === 210 && response?.data && typeof response.data === 'object') {
      Object.entries(response.data as Record<string, unknown>).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'success' in (value as Record<string, unknown>)) {
          const item = value as { success: boolean; errorMsg?: string; message?: string };
          this.paymentResultMap.set(key, {
            success: item.success,
            errorMsg: item.errorMsg || (item.success ? undefined : item.message)
          });
        }
      });
      // If the calling UUID wasn't found in per-UUID data but response itself is successful
      if (callingUuid && !this.paymentResultMap.has(callingUuid) && response.success) {
        this.paymentResultMap.set(callingUuid, { success: true });
      }
      return;
    }

    // Standard success/failure response
    if (callingUuid && response?.success !== undefined) {
      this.paymentResultMap.set(callingUuid, {
        success: response.success,
        errorMsg: response.success ? undefined : (response.errorMsg || response.message || 'Processing failed')
      });
      return;
    }

    // Fallback: treat truthy response as success
    if (callingUuid) {
      this.paymentResultMap.set(callingUuid, { success: !!response });
    }
  }

  /**
   * @description Records a batch result for all summary items matching a payment type.
   * Used for batch APIs (check mail, check email, check DD, check print) that return
   * a single response for all items of that type.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recordBatchResult(response: any, type: string): void {
    if (!response) return;
    const isError = response instanceof HttpErrorResponse || response?.error?.errorMsg;
    const isSuccess = !isError && response?.success !== false;
    const errorMsg = isError
      ? (response?.error?.errorMsg || response?.error?.message || 'Processing failed')
      : (!isSuccess ? (response?.errorMsg || response?.message || 'Processing failed') : undefined);

    // Find all summary items of this type and record result
    this.bulkSummary.forEach((summaryItem) => {
      const items = Array.isArray(summaryItem) ? summaryItem : [summaryItem];
      items.forEach((item) => {
        if (item.type === type) {
          // Use a generated key for non-UUID items
          const key = item.uuid || `batch-${type}-${item.payee}-${item.amount}`;
          item.uuid = item.uuid || key;
          this.paymentResultMap.set(key, { success: isSuccess, errorMsg });
        }
      });
    });
  }

  /**
   * @description Builds the final payment summary by looking up each item's UUID
   * in the paymentResultMap. Replaces the old index-based mapping.
   */
  private buildFinalSummary(): IPaymentSummaryData[] {
    const result: IPaymentSummaryData[] = [];

    this.bulkSummary.forEach((summaryItem) => {
      const items = Array.isArray(summaryItem) ? summaryItem : [summaryItem];
      items.forEach((item) => {
        if (item.uuid && this.paymentResultMap.has(item.uuid)) {
          const status = this.paymentResultMap.get(item.uuid)!;
          item.success = status.success
            ? { success: true }
            : { success: false, error: { errorMsg: status.errorMsg } };
        }
        result.push(item);
      });
    });

    return result;
  }

  /**
   * @description Ensures each form value has email and payeeAcc populated,
   * falling back to the payee object data when the form fields are empty.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private enrichZilPaymentFormValues(formValues: any[]): any[] {
    return formValues.map((fv: any) => ({
      ...fv,
      email: fv.email || fv.payee?.email || '',
      payeeAcc: fv.payeeAcc || ''
    }));
  }

  /** Closes the modal and opens Payments Out while payments keep processing in the background. */
  continueInBackground(): void {
    this.dialogRef.close();
    this.router.navigate(['/v4/manage/payments-out/detailed/all']);
  }

  hasAnyPayments(): boolean {
    return (
      this.checkMailPayments.length > 0 ||
      this.checkEmailPayments.length > 0 ||
      this.checkPrintPayments.length > 0 ||
      this.checkDDPayments.length > 0 ||
      this.achPayments.length > 0 ||
      this.wirePayments.length > 0 ||
      this.virtualCardPayments.length > 0 ||
      this.walletCheckPrintPayments.length > 0 ||
      this.walletCheckEmailPayments.length > 0 ||
      this.checkMailType2Payments.length > 0 ||
      this.letVendorDecidePayments.length > 0
    );
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.subscriptions.forEach((s) => s?.unsubscribe());
    // Reset shipping/attachment fee subjects so stale values don't persist on reopen
    this.v3Service.walletCheckMailShippingFeeSubject.next('0.00');
    this.v3Service.bankCheckMailShippingFeeSubject.next('0.00');
    this.v3Service.totalShippingFeeSubject.next('0.00');
    this.v3Service.totalAttachmentFeeSubject.next('0.00');
    this.v4Service.totalShippingFee.set(0);
    this.v4Service.totalAttachmentFee.set(0);
  }
}
