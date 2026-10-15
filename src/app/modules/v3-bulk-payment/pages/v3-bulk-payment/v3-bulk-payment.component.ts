import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { RowNode } from '@ag-grid-community/core';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import {
  CheckPrintFormBody,
  IAchSentData,
  IBulkPaymentFormArrayValue,
  IEmailFormBody,
  IPaymentSummaryData,
  IResponse,
  IBankSource
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { Subscription, of } from 'rxjs';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { catchError, tap, finalize, switchMap, map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import {
  Location,
  NgIf,
  NgClass,
  NgFor,
  AsyncPipe,
  CurrencyPipe
} from '@angular/common';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { IAchBody } from 'src/app/modules/check/model/check';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { VirtualAccountConfirmationModalComponent } from 'src/app/modules/bank/bank-v2/modals/virtual-account-confirmation-modal/virtual-account-confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { V3BulkPaymentService } from '../../services/v3-bulk-payment.service';
import { VirtualCardBulkOcwV3Component } from '../../components/virtual-card-bulk-ocw-v3/virtual-card-bulk-ocw-v3.component';
import { WireBulkOcwV3Component } from '../../components/wire-bulk-ocw-v3/wire-bulk-ocw-v3.component';
import { AchBulkOcwV3Component } from '../../components/ach-bulk-ocw-v3/ach-bulk-ocw-v3.component';
import { CheckDdBulkOcwV3Component } from '../../components/check-dd-bulk-ocw-v3/check-dd-bulk-ocw-v3.component';
import { CheckMailType2BulkOcwV3Component } from '../../components/check-mail-type2-bulk-ocw-v3/check-mail-type2-bulk-ocw-v3.component';
import { CheckPrintBulkV3Component } from '../../components/check-print-bulk-v3/check-print-bulk-v3.component';
import { CheckEmailBulkOcwV3Component } from '../../components/check-email-bulk-ocw-v3/check-email-bulk-ocw-v3.component';
import { CheckMailBulkOcwV3Component } from '../../components/check-mail-bulk-ocw-v3/check-mail-bulk-ocw-v3.component';
import { CheckModeSelectBulkV3Component } from '../../components/check-mode-select-bulk-v3/check-mode-select-bulk-v3.component';
import { WalletCheckPrintBulkV3Component } from '../../components/wallet-check-print-bulk-v3/wallet-check-print-bulk-v3.component';
import { WalletCheckEmailBulkV3Component } from '../../components/wallet-check-email-bulk-v3/wallet-check-email-bulk-v3.component';
/**
 * @description Parent component for bulk payment.
 */
@Component({
  selector: 'app-v3-bulk-payment',
  templateUrl: './v3-bulk-payment.component.html',
  styleUrls: ['./v3-bulk-payment.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    CheckModeSelectBulkV3Component,
    NgFor,
    CheckMailBulkOcwV3Component,
    CheckEmailBulkOcwV3Component,
    CheckPrintBulkV3Component,
    CheckMailType2BulkOcwV3Component,
    CheckDdBulkOcwV3Component,
    AchBulkOcwV3Component,
    WireBulkOcwV3Component,
    VirtualCardBulkOcwV3Component,
    WalletCheckPrintBulkV3Component,
    WalletCheckEmailBulkV3Component,
    AsyncPipe,
    CommonBackButtonV35Component,
    CurrencyPipe
  ]
})
export class V3BulkPaymentComponent implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private checkService = inject(CheckService);
  private scriptService = inject(ScriptService);
  private headerservice = inject(HeaderService);
  private formBuilder = inject(FormBuilder);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private location = inject(Location);
  private layoutService = inject(LayoutService);
  private activatedRoute = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  totalAmount = 0;
  totalCost = 0;
  totalShippingFee = 0;
  totalAttachmentFee = 0;
  isLoadingAttachmentFee = false;
  isCustomAddress = false;
  selectedRowData: RowNode<ICommonTransactionTableData>[];
  achFormArray: FormArray;
  wireFormArray: FormArray;
  virtualCardFormArray: FormArray;
  subscription: Subscription[] = [];
  isBulkPaymentProcessing = false;
  paymentFormValue: IBulkPaymentFormArrayValue[] = [];
  paymentSummary: IPaymentSummaryData[] = [];
  bulkPaymentResponse: IResponse[] | HttpErrorResponse[] = [];
  mailCount = 0;
  emailCount = 0;
  printCount = 0;
  checkDDCount = 0;
  bulkSummary: (IPaymentSummaryData | IPaymentSummaryData[])[] = [];
  paymentMode:'all-payments' | 'group-mail' = 'all-payments';
  isLoading: boolean | undefined = true;
  displayCost = false;
  hideBackButton: boolean = false;
  isChaseAccountPending: boolean = false;
  isCheckPayments: boolean = false;
  totalPaymentAmount = computed(() => this.v3BulkPaymentService.totalPaymentAmount());
  totalPaymentCount = computed(() => this.v3BulkPaymentService.totalPaymentCount());

  bulkPaymentForm: FormGroup = this.formBuilder.group({
    achFormGroup: this.formBuilder.group({
      achFormArray: this.formBuilder.array([])
    }),
    wireFormGroup: this.formBuilder.group({
      wireFormArray: this.formBuilder.array([])
    }),
    virtualCardFormGroup: this.formBuilder.group({
      virtualCardFormArray: this.formBuilder.array([])
    }),
    checkMailFormGroup: this.formBuilder.group({
      checkMailFormArray: this.formBuilder.array([])
    }),
    checkEmailFormGroup: this.formBuilder.group({
      checkEmailFormArray: this.formBuilder.array([])
    }),
    checkDDFormGroup: this.formBuilder.group({
      checkDDFormArray: this.formBuilder.array([])
    }),
    checkMailType2FormGroup: this.formBuilder.group({
      checkMailType2FormArray: this.formBuilder.array([])
    }),
    checkPrintFormGroup: this.formBuilder.group({
      checkPrintFormArray: this.formBuilder.array([])
    }),
    walletCheckPrintFormGroup: this.formBuilder.group({
      walletCheckPrintFormArray: this.formBuilder.array([])
    }),
    walletCheckEmailFormGroup: this.formBuilder.group({
      walletCheckEmailFormArray: this.formBuilder.array([])
    })
  });

  ngOnInit() {
    this.observeIsBulkPaymentProcessing();
    this.v3BulkPaymentService.getAllDetails();
    this.subscription.push(
      this.v3BulkPaymentService.isBulkPaymentsApiReady$.subscribe((res) => {
        this.isLoading = res;
      }),
      this.bulkPaymentForm.valueChanges.subscribe(() => {
        this.amountCalulation();
        this.subscription.push(
          this.v3BulkPaymentService.totalShippingFee$.subscribe((value) => {
            this.totalShippingFee = Number(value);
          }),
          this.v3BulkPaymentService.totalAttachmentFee$.subscribe((value) => {
            this.totalAttachmentFee = Number(value);
          }),
          this.v3BulkPaymentService.isLoadingAttachmentFee$.subscribe((isLoading) => {
            this.isLoadingAttachmentFee = isLoading;
          })
        );
      }),
      this.v3BulkPaymentService.isCustomAddress.subscribe((value) => {
        this.isCustomAddress = value;
      })
    );

    this.v3BulkPaymentService.bulkPaymentForm = this.bulkPaymentForm;
    this.paymentMode = this.activatedRoute.snapshot.queryParams.page;
    
    // Hide back button if coming from multi-import-step3
    this.hideBackButton = window.history?.state?.data?.hideButton;
  }

  /**
   * @description set the Bulk payment data for payment summary.
   *
   * `this.paymentFormValue`, which contains the FormArray values of the selected payments.
   *
   * `this.paymentSummary`, which includes only the required data for the payment summary.
   *
   * Additionally, it groups the payment types based on the mode (mail, email, and print), and stores them in the `this.bulkSummary` array
   * for easy assignment to the corresponding API response for each payment type.
   */
  getBulkPaymentInfo(): void {
    this.paymentSummary = [];
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
    const checkMailFormArray = this.bulkPaymentForm
      ?.get('checkMailFormGroup')
      ?.get('checkMailFormArray') as FormArray;
    const checkEmailFormArray = this.bulkPaymentForm
      .get('checkEmailFormGroup')
      ?.get('checkEmailFormArray') as FormArray;
    const checkPrintFormArray = this.bulkPaymentForm
      .get('checkPrintFormGroup')
      ?.get('checkPrintFormArray') as FormArray;
    const checkDDFormArray = this.bulkPaymentForm
      ?.get('checkDDFormGroup')
      ?.get('checkDDFormArray') as FormArray;
    const walletCheckPrintFormArray = this.bulkPaymentForm
      .get('walletCheckPrintFormGroup')
      ?.get('walletCheckPrintFormArray') as FormArray;

    if (checkDDFormArray.value[0]) {
      this.paymentFormValue.push({ dd: checkDDFormArray.value });
    }

    if (checkMailFormArray.value[0]) {
      this.paymentFormValue.push({ mail: checkMailFormArray.value });
    }

    if (checkEmailFormArray.value[0]) {
      this.paymentFormValue.push({ email: checkEmailFormArray.value });
    }

    if (checkPrintFormArray.value[0]) {
      this.paymentFormValue.push({ print: checkPrintFormArray.value });
    }

    if (checkMailType2Array.value[0]) {
      this.paymentFormValue.push({ mail2: checkMailType2Array.value });
    }

    if (achFormArray.value[0]) {
      this.paymentFormValue.push({ ach: achFormArray.value });
    }

    if (wireFormArray.value[0]) {
      this.paymentFormValue.push({ wire: wireFormArray.value });
    }

    if (cardFormArray.value[0]) {
      this.paymentFormValue.push({ card: cardFormArray.value });
    }

    if (walletCheckPrintFormArray.value[0]) {
      this.paymentFormValue.push({ walletPrint: walletCheckPrintFormArray.value });
    }

    const walletCheckEmailFormArray = this.bulkPaymentForm
      .get('walletCheckEmailFormGroup')
      ?.get('walletCheckEmailFormArray') as FormArray;
    if (walletCheckEmailFormArray?.value[0]) {
      this.paymentFormValue.push({ walletEmail: walletCheckEmailFormArray.value });
    }

    this.paymentFormValue.forEach((item) => {
      if (item?.mail) {
        item?.mail?.forEach((mailItem) => {
          this.paymentSummary.push({
            payee: mailItem?.payee,
            amount: mailItem?.amount,
            type: 'Check Mail from Bank'
          });
        });
      }
      if (item?.email) {
        item?.email?.forEach((emailItem) => {
          this.paymentSummary.push({
            payee: emailItem?.payee_name,
            amount: emailItem?.cheque_amount,
            type: 'Check Email'
          });
        });
      }
      if (item?.dd) {
        item?.dd?.forEach((ddItem) => {
          this.paymentSummary.push({
            payee: ddItem.payee.name,
            amount: ddItem.amount,
            type: 'Check DD'
          });
        });
      }
      if (item?.print) {
        item?.print?.forEach((printItem) => {
          this.paymentSummary.push({
            payee: printItem?.payee,
            amount: printItem?.amount,
            type: 'Check Print'
          });
        });
      }
      if (item?.mail2) {
        item?.mail2?.forEach((mail2Item) => {
          this.paymentSummary.push({
            payee: mail2Item?.payee?.name || '',
            amount: mail2Item?.amount,
            type: 'Check Mail',
            uuid: mail2Item?.uuid
          });
        });
      }
      if (item?.ach) {
        item?.ach?.forEach((achItem) => {
          this.paymentSummary.push({
            payee: achItem.payee?.name || '',
            amount: achItem?.amount,
            type: 'ACH'
          });
        });
      }
      if (item?.wire) {
        item?.wire?.forEach((wireItem) => {
          this.paymentSummary.push({
            payee: wireItem.payee?.name || '',
            amount: wireItem?.amount,
            type: 'Wire'
          });
        });
      }
      if (item?.card) {
        item?.card?.forEach((cardItem) => {
          this.paymentSummary.push({
            payee: cardItem.payee?.name || '',
            amount: cardItem?.amount,
            type: 'Card'
          });
        });
      }
      if (item?.walletPrint) {
        item?.walletPrint?.forEach((walletPrintItem: { payee?: string; amount?: string; uuid?: string }) => {
          this.paymentSummary.push({
            payee: walletPrintItem?.payee || '',
            amount: walletPrintItem?.amount || '',
            type: 'Wallet Print',
            uuid: walletPrintItem?.uuid
          });
        });
      }
      if (item?.walletEmail) {
        item?.walletEmail?.forEach((walletEmailItem: { payee?: string; amount?: string; uuid?: string }) => {
          this.paymentSummary.push({
            payee: walletEmailItem?.payee || '',
            amount: walletEmailItem?.amount || '',
            type: 'Wallet Email',
            uuid: walletEmailItem?.uuid
          });
        });
      }
    });
    this.paymentSummary.forEach((item) => {
      if (item.type === 'Check Mail from Bank') {
        this.mailCount += 1;
      } else if (item.type === 'Check Email') {
        this.emailCount += 1;
      } else if (item.type === 'Check Print') {
        this.printCount += 1;
      } else if (item.type === 'Check DD') {
        this.checkDDCount += 1;
      }
    });

    const BulkCount = this.paymentSummary?.length;

    this.v3BulkPaymentService.setBulkPaymentCount(BulkCount);
    const groupedItems: {
      mail: IPaymentSummaryData[];
      email: IPaymentSummaryData[];
      print: IPaymentSummaryData[];
      pending: IPaymentSummaryData[];
      dd: IPaymentSummaryData[];
    } = {
      mail: [],
      email: [],
      print: [],
      pending: [],
      dd: []
    };

    this.paymentSummary.forEach((item) => {
      const { type } = item;
      if (type === 'Check Mail from Bank') {
        groupedItems.mail.push(item);
      } else if (type === 'Check Email') {
        groupedItems.email.push(item);
      } else if (type === 'Check Print') {
        groupedItems.print.push(item);
      } else if (type === 'Check DD') {
        groupedItems.dd.push(item);
      } else {
        groupedItems.pending.push(item);
      }
    });

    if (groupedItems.mail?.length > 0) {
      this.bulkSummary.push(groupedItems.mail);
    }

    if (groupedItems.email?.length > 0) {
      this.bulkSummary.push(groupedItems.email);
    }

    if (groupedItems.dd?.length > 0) {
      this.bulkSummary.push(groupedItems.dd);
    }

    if (groupedItems.print?.length > 0) {
      this.bulkSummary.push(groupedItems.print);
    }

    if (groupedItems.pending?.length > 0) {
      this.bulkSummary.push(...groupedItems.pending);
    }
  }

  observeIsBulkPaymentProcessing() {
    this.subscription.push(
      this.v3BulkPaymentService
        .getIsBulkPaymentProcessing()
        .subscribe((val) => {
          this.isBulkPaymentProcessing = val;
        })
    );
  }

  /**
   *
   * @description Performs API calls sequentially, one after another.
   *
   * The API call order is as follows: Check Mail, Check Email, Check Print, ACH, Wire, and Card.
   * The Check DD and Mail2 APIs are included for future use and are not currently used in this context.
   *
   * To use this functionality, create an array called `observables` and push each API call into it.
   *
   * @example
   * ```
   * const observables = [];
    observables.push(
      processCheckMail,
      processCheckEmail)
      //Add other API calls in the desired order
   *```
   * Pass this array as the body of the `processAllPaymentsSequentially` method in `this._v3BulkPaymentService`.
   * ```
    * this._v3BulkPaymentService.processAllPaymentsSequentially(observables).subscribe({
    *   next: (res) => {
    *     // Handle the response from each API call
    *   },
    *   error: () => {
    *     // Handle errors
    *   },
    *   complete: () => {
    *     // All API calls have been completed
    *     // Write logic for handling actions after bulk payment processing
    *   }
    * });
   *```
  * `headerOptions`: This parameter is used to handle the 422 error in the `error-handling.interceptor` file.
  * Pass the `headerOptions` as a header to the API call.
  *
  * In the `error-handling.interceptor` file, check the value of `isDisable422`.
  * If `isDisable422` is set to `'true'`, the interceptor will not enter the 422 error case.
   */
  onSubmit(): void {
    // Check for virtual accounts in payment list data
    const virtualAccountIds: string[] = [];
    this.v3BulkPaymentService.paymentListData?.forEach((payment) => {
      if (payment.sourceType === 'BANK' && (payment.source as IBankSource)?.isVirtualAccount === 1) {
        // Only push if the source_id is not already in the array (ensuring uniqueness)
        if (!virtualAccountIds.includes(payment.sourceId)) {
          virtualAccountIds.push(payment.sourceId);
          this.isChaseAccountPending = true;
        }
      }
      else if(payment.sourceType === 'BANK' && (payment.source as IBankSource)?.isVirtualAccount === 0 && (payment.source as IBankSource)?.verifiedBy === 88 && (payment.source as IBankSource)?.verified === 0){
        if (!virtualAccountIds.includes(payment.sourceId)) {
          virtualAccountIds.push(payment.sourceId);
        }
      }
    });

    if (virtualAccountIds.length > 0) {
      let notification;
      if(this.isChaseAccountPending){
        notification = this.alertService.infoAlert({
          content: "Since you added your Bank account using instant verification, we received a virtual account number. This works for ACH and wire transfers, but won't work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.",
          doneMsg: 'Update',
          isCancel: true
        });
      }
      else{
        notification = this.alertService.failedAlert({
          content: "Your Bank account verification was rejected. You won’t be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.",
          doneMsg: 'Update',
          isCancel: true
        });
      }
      notification.afterClosed().subscribe((res) => {
        this.isChaseAccountPending = false;
        if (res) {
          const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
            maxWidth: '1200px',
            width: '100%',
            disableClose: true,
            data: { bankAccountIds: virtualAccountIds }
          });
          
          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.processBulkPayment();
            }
          });
        }
      });
      return;
    }

    this.processBulkPayment();
  }

  processBulkPayment(): void {
    if (
      this.v3BulkPaymentService.isSendToOneAddress &&
      this.v3BulkPaymentService.sendToOneAddressEmail.invalid
    ) {
      this.v3BulkPaymentService.sendToOneAddressEmail.markAllAsTouched();
      return;
    }
    this.layoutService.isProgressBarInvoked.next(false);
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

    if (this.bulkPaymentForm?.invalid) {
      this.bulkPaymentForm.controls.checkDDFormGroup?.markAllAsTouched();
      this.alertService.infoAlert({
        content: 'Please fill the required fields'
      });
      return;
    }

    if (!this.isCustomAddress) {
      const checkMailFormArray = this.bulkPaymentForm
        ?.get('checkMailFormGroup')
        ?.get('checkMailFormArray') as FormArray;
      const error = (checkMailFormArray.value || []).some(
        (val: Record<string, Record<string, unknown>>) =>
          !val.toAddressValidity?.success || !val.fromAddressValidity?.success
      );

      if (error) {
        this.alertService.infoAlert({
          content: 'Please fill the required fields'
        });
        return;
      }
    }

    this.getBulkPaymentInfo();
    this.v3BulkPaymentService.completedPaymentCount = 0;

    const processCheckMail = () => {
      const checkMailFormArray = this.bulkPaymentForm
        ?.get('checkMailFormGroup')
        ?.get('checkMailFormArray') as FormArray;
      const checkAmount = checkMailFormArray?.value[0]?.cheque_amount;
      const mailCount = checkMailFormArray?.length;
      const headerOptions = new HttpHeaders({
        'Content-Type': 'application/json',
        isDisable422: 'true'
      });
      if (checkMailFormArray.value[0]?.mailNowPayLoad) {
        return this.v3BulkPaymentService
          .sendCheckMail(
            checkMailFormArray.value[0]?.mailNowPayLoad,
            '',
            headerOptions
          )
          .pipe(
            finalize(() => {
              this.v3BulkPaymentService.completedPaymentCount = this.mailCount;
            }),
            tap((res) => {
              if (res?.success) {
                if (mailCount === 1) {
                  this.scriptService.gtagEventScript('check-mailed', {
                    amount: checkAmount
                  });
                } else {
                  this.scriptService.gtagEventScript('check-mailed');
                }
              }
            }),
            catchError((error) => {
              // Handle error 731 - No bank account
              if (error.error?.errorCode === 731) {
                this.alertService.warningAlert({
                  title: 'No Bank Account Found',
                  content: error.error.errorMsg,
                  doneMsg: 'Add Bank Account',
                  cancelMsg: 'Cancel',
                  isCancel: true
                }).afterClosed().subscribe((result) => {
                  if (result) {
                    this.router.navigate(['/manage/users/add-bank-account']);
                  }
                });
              }
              return of(error);
            })
          );
      }
      return of(null);
    };

    const processCheckEmail = () => {
      const checkEmailFormArray = this.bulkPaymentForm
        .get('checkEmailFormGroup')
        ?.get('checkEmailFormArray') as FormArray;
      const checkAmount = checkEmailFormArray?.value[0]?.cheque_amount;
      const emailCount = checkEmailFormArray?.length;
      const mailCheckIds: string[] = [];
      const payeeEmail: { [key: string]: string[] | string } = {};
      const smsCheckbox: { [key: string]: boolean[] | boolean } = {};
      const phone: { [key: string]: string[] | string } = {};
      const fileHidden: { [key: string]: string[] | string } = {};

      checkEmailFormArray?.value?.forEach((e: IEmailFormBody) => {
        mailCheckIds.push(e.checkId);
        payeeEmail[e.checkId] = e.payee_email;
        smsCheckbox[e.checkId] = e.checked;
        phone[e.checkId] = e.payee_phone;
        fileHidden[e.checkId] = e.attachments;
      });

      const body = {
        mail_check_ids: mailCheckIds,
        payee_email: payeeEmail,
        sms_checkbox: smsCheckbox,
        phone,
        file_hidden: fileHidden,
        is_group_echeck: this.v3BulkPaymentService.isSendToOneAddress,
        group_echeck_email:
          this.v3BulkPaymentService.sendToOneAddressEmail?.value
      };
      const headerOptions = new HttpHeaders({
        'Content-Type': 'application/json',
        isDisable422: 'true'
      });
      if (checkEmailFormArray.length) {
        return this.checkService.sendEmail(body, headerOptions).pipe(
          finalize(() => {
            this.v3BulkPaymentService.completedPaymentCount = this.emailCount;
          }),
          tap((data) => {
            if (data?.success) {
              if (emailCount === 1) {
                this.scriptService.gtagEventScript('check-emailed', {
                  amount: checkAmount
                });
              } else {
                this.scriptService.gtagEventScript('check-emailed');
              }
            }
            this.headerservice.setHeaderValueChanged(true);
          }),
          catchError((error) => {
            if (error.error.errorCode === "plaid_virtual_account"){
              const notification = this.alertService.infoAlert({
                content: error.error.errorMsg,
                doneMsg: 'Update',
                isCancel: true
              });
              notification.afterClosed().subscribe((res) => {
                if(res){
                  const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
                    maxWidth: '1200px',
                    width: '100%',
                    disableClose: true,
                    data: error.error
                  });
                  confirmationDialog.afterClosed().subscribe((res) => {
                    if (res.success) {
                    this.onSubmit();
                    }
                  });
                }
              });
            }
            return of(error)})
        );
      }
      return of(null);
    };

    const processCheckDD = () => {
      const checkDDFormArray = this.bulkPaymentForm
        ?.get('checkDDFormGroup')
        ?.get('checkDDFormArray') as FormArray;
      const achSentData: IAchSentData[] = [];
      checkDDFormArray?.value?.forEach((e: { [key: string]: string }) => {
        const data: IAchSentData = {
          mail_check_id: '',
          payee_email: '',
          wallet_bypassing: '0',
          payee_account: '',
          payee_phone: '',
          send_sms: 0
        };
        data.mail_check_id = e.checkId;
        data.payee_email = e.email;
        data.wallet_bypassing = !e.walletBypassing ? '0' : '1';
        data.payee_account = e.payeeAcc;
        data.send_sms = e.sms ? 1 : 0;
        data.payee_phone = e.phone;
        achSentData.push(data);
      });

      if (achSentData.length) {
        const checkDD: IAchBody = {
          data: achSentData,
          recurring: {},
          isRecurringValue: 0,
          isSameDay: 0
        };
        const headerOptions = new HttpHeaders({
          'Content-Type': 'application/json',
          isDisable422: 'true'
        });
        return this.checkService
          .postDirectDepostModalData(checkDD, headerOptions)
          .pipe(
            finalize(() => {
              this.v3BulkPaymentService.completedPaymentCount =
                achSentData.length;
            }),
            tap((_) => {}),
            catchError((error) => of(error))
          );
      }
      return of(false);
    };

    const processCheckPaperPrint = () => {
      const checkPrintFormArray = this.bulkPaymentForm
        .get('checkPrintFormGroup')
        ?.get('checkPrintFormArray') as FormArray;
      const checkAmount = checkPrintFormArray?.value[0]?.cheque_amount;
      const printCount = checkPrintFormArray?.length;
      const checkPaperPayments = checkPrintFormArray?.value?.filter(
        (data: CheckPrintFormBody) => data.paperType === '4'
      );
      if (checkPaperPayments?.length > 0) {
        const checkIdArray = checkPaperPayments.map(
          (obj: CheckPrintFormBody) => obj.checkId
        );
        const headerOptions = new HttpHeaders({
          'Content-Type': 'application/json',
          isDisable422: 'true'
        });
        const payloadData = { checkId: checkIdArray, paperType: 4 };
        return this.v3BulkPaymentService
          .checkPrintPayment(payloadData, headerOptions)
          .pipe(
            finalize(() => {
              this.v3BulkPaymentService.completedPaymentCount = this.printCount;
            }),
            tap((res) => {
              if (res?.success) {
                if (printCount === 1) {
                  this.scriptService.gtagEventScript('check-printed', {
                    amount: checkAmount
                  });
                } else {
                  this.scriptService.gtagEventScript('check-printed');
                }
              }
              const urlLoaded = window.open(res?.data?.url);
              if (!urlLoaded) {
                window.open(res.data.url);
              }
            }),
            catchError((error) => {
              if (error.error.errorCode === "plaid_virtual_account"){
                const notification = this.alertService.infoAlert({
                  content: error.error.errorMsg,
                  doneMsg: 'Update',
                  isCancel: true
                });
                notification.afterClosed().subscribe((res) => {
                  if(res){
                    const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
                      maxWidth: '1200px',
                      width: '100%',
                      disableClose: true,
                      data: error.error
                    });
                    confirmationDialog.afterClosed().subscribe((res) => {
                      if (res.success) {
                      this.onSubmit();
                      }
                    });
                  }
                });
              }
              return of(error);
            })
          );
      }
      return of(null);
    };

    const processCheckWhitePaperPrint = () => {
      const checkPrintFormArray = this.bulkPaymentForm
        .get('checkPrintFormGroup')
        ?.get('checkPrintFormArray') as FormArray;
      const whitePaperPayments = checkPrintFormArray?.value?.filter(
        (data: CheckPrintFormBody) => data.paperType === '6'
      );
      if (whitePaperPayments?.length > 0) {
        const checkIdArray = whitePaperPayments.map(
          (obj: CheckPrintFormBody) => obj.checkId
        );
        const headerOptions = new HttpHeaders({
          'Content-Type': 'application/json',
          isDisable422: 'true'
        });
        const payloadData = { checkId: checkIdArray, paperType: 6 };
        return this.v3BulkPaymentService
          .checkPrintPayment(payloadData, headerOptions)
          .pipe(
            finalize(() => {
              this.v3BulkPaymentService.completedPaymentCount = checkIdArray
                ? checkIdArray.length
                : 0;
            }),
            tap((res) => {
              const urlLoaded = window.open(res?.data?.url);
              if (!urlLoaded) {
                window.open(res.data.url);
              }
            }),
            catchError((error) => {
              if (error.error.errorCode === "plaid_virtual_account"){
                const notification = this.alertService.infoAlert({
                  content: error.error.errorMsg,
                  doneMsg: 'Update',
                  isCancel: true
                });
                notification.afterClosed().subscribe((res) => {
                  if(res){
                    const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
                      maxWidth: '1200px',
                      width: '100%',
                      disableClose: true,
                      data: error.error
                    });
                    confirmationDialog.afterClosed().subscribe((res) => {
                      if (res.success) {
                      this.onSubmit();
                      }
                    });
                  }
                });
              }
              return of(error);
            })
          );
      }
      return of(null);
    };

    const processWalletPrintPayments = () => {
      // Check if there are any wallet print payments
      const walletPrintPayments = walletCheckPrintFormArray?.value || [];

      if (walletPrintPayments.length > 0) {
        // Build payload for wallet multi-process API - only payment_ids needed
        const paymentIds: string[] = walletPrintPayments.map(
          (payment: { uuid?: string }) => payment?.uuid
        ).filter(Boolean);

        const payload = {
          payment_ids: paymentIds
        };

        const headerOptions = new HttpHeaders({
          'Content-Type': 'application/json',
          isDisable422: 'true'
        });

        return this.v3BulkPaymentService
          .processWalletPaymentsMulti(payload, headerOptions)
          .pipe(
            switchMap((res) => {
              const response = res as IResponse;
              if (response?.success && response?.response_code === 210 && response?.data) {
                // Extract check_ids from successful responses and track UUID mappings
                const successfulCheckIds: string[] = [];
                const successfulUuids: string[] = [];
                const responseData = response.data as Record<string, { success: boolean; errorMsg?: string; data?: { check_id: string } }>;

                // Build final result object with per-item status
                const finalResult: Record<string, { success: boolean; errorMsg?: string }> = {};

                Object.keys(responseData).forEach((uuid) => {
                  const item = responseData[uuid];
                  if (item?.success && item?.data?.check_id) {
                    successfulCheckIds.push(item.data.check_id);
                    successfulUuids.push(uuid);
                  } else {
                    // Keep original error for failed items
                    finalResult[uuid] = {
                      success: false,
                      errorMsg: item?.errorMsg || 'Payment processing failed'
                    };
                  }
                });

                // If there are successful check_ids, call checkPrintPayment
                if (successfulCheckIds.length > 0) {
                  const paperType = this.v3BulkPaymentService.walletCheckPrintPaperType || 4;
                  const printPayload = { checkId: successfulCheckIds, paperType };
                  return this.v3BulkPaymentService
                    .checkPrintPayment(printPayload, headerOptions)
                    .pipe(
                      tap((printRes) => {
                        if (printRes?.data?.url) {
                          const urlLoaded = window.open(printRes.data.url);
                          if (!urlLoaded) {
                            window.open(printRes.data.url);
                          }
                        }
                      }),
                      map(() => {
                        // Print succeeded - mark all successful UUIDs as printed
                        successfulUuids.forEach((uuid) => {
                          finalResult[uuid] = { success: true };
                        });
                        return {
                          success: true,
                          response_code: 210,
                          data: finalResult
                        } as IResponse;
                      }),
                      catchError((printError) => {
                        // Print failed - mark all successful UUIDs with the print error
                        const errorMsg = printError?.error?.errorMsg || printError?.error?.message || 'Check printing failed';
                        successfulUuids.forEach((uuid) => {
                          finalResult[uuid] = {
                            success: false,
                            errorMsg
                          };
                        });
                        return of({
                          success: true,
                          response_code: 210,
                          data: finalResult
                        } as IResponse);
                      })
                    );
                }

                // No successful check_ids to print, return results with failures only
                return of({
                  success: true,
                  response_code: 210,
                  data: finalResult
                } as IResponse);
              }
              return of(res);
            }),
            finalize(() => {
              this.v3BulkPaymentService.completedPaymentCount =
                walletPrintPayments.length;
            }),
            catchError((error) => of(error))
          );
      }
      return of(null);
    };

    const processWalletEmailPayments = () => {
      const walletEmailFormArray = this.bulkPaymentForm
        .get('walletCheckEmailFormGroup')
        ?.get('walletCheckEmailFormArray') as FormArray;
      const walletEmailPayments = walletEmailFormArray?.value || [];
      if (walletEmailPayments.length === 0) {
        return of(null);
      }

      // These go through the zil-payments rail rather than the wallet import rail
      // (multi-process): only the former takes a payee_email, and the import rail
      // rejects them with "Payee email is required". This matches the
      // single-payment wallet check email flow.
      const walletEmailValues = walletEmailPayments.map(
        (payment: { email?: string; payee?: { email?: string } }) => ({
          ...payment,
          email: payment?.email || payment?.payee?.email || ''
        })
      );

      return this.v3BulkPaymentService.processZilPaymentsSequentially(
        walletEmailValues,
        'walletCheckEmail'
      );
    };

    const processWalletPayments = () => {
      // Check if there are any wallet payments in checkMailType2Array
      const walletPayments = checkMailType2Array?.value?.filter(
        (payment: { from?: string; sourceType?: string }) =>
          payment?.from === 'WALLET' || payment?.sourceType === 'WALLET'
      );      
      if (walletPayments && walletPayments.length > 0) {
        // Build payload for wallet multi-process API
        const payload: {
          payment_ids: string[];
          [key: string]: string[] | { mail_type: string; file_hidden: string[] };
        } = {
          payment_ids: this.v3BulkPaymentService.bulkPaymentsUuidList
        };

        walletPayments.forEach((payment: {
          uuid?: string;
          mail_type?: string;
          file_hidden?: string[];
        }) => {
          if (payment?.uuid) {
            // Build individual payment object
            // file_hidden is an array of attachment file IDs
            payload[payment.uuid] = {
              mail_type: payment.mail_type || '',
              file_hidden: Array.isArray(payment.file_hidden) ? payment.file_hidden : []
            };
          }
        });

        const headerOptions = new HttpHeaders({
          'Content-Type': 'application/json',
          isDisable422: 'true'
        });

        return this.v3BulkPaymentService
          .processWalletPaymentsMulti(payload, headerOptions)
          .pipe(
            finalize(() => {
              this.v3BulkPaymentService.completedPaymentCount =
                walletPayments.length;
            }),
            tap((res) => {
              if (res?.success) {
                // Handle success if needed
              }
            }),
            catchError((error) => of(error))
          );
      }
      return of(null);
    };

    const observables = [];
    observables.push(
      processCheckMail,
      processCheckEmail,
      processCheckDD,
      processCheckPaperPrint,
      processCheckWhitePaperPrint,
      processWalletPayments,
      processWalletPrintPayments,
      processWalletEmailPayments,
      () =>
        this.v3BulkPaymentService.processZilPaymentsSequentially(
          checkMailType2Array?.value?.filter(
            (payment: { from?: string; sourceType?: string }) =>
              payment?.from !== 'WALLET' && payment?.sourceType !== 'WALLET'
          ) || [],
          'checkMail2'
        ),
      () =>
        this.v3BulkPaymentService.processZilPaymentsSequentially(
          achFormArray.value,
          'ach'
        ),
      () =>
        this.v3BulkPaymentService.processZilPaymentsSequentially(
          wireFormArray.value,
          'wire'
        ),
      () =>
        this.v3BulkPaymentService.processZilPaymentsSequentially(
          cardFormArray.value,
          'card'
        )
    );

    this.v3BulkPaymentService.setIsBulkPaymentProcessing(true);
    this.subscription.push(
      this.v3BulkPaymentService
        .processAllPaymentsSequentially(observables)
        .subscribe({
          next: (res) => {
            const response = res as IResponse & HttpErrorResponse;
            if (response) {
              this.bulkPaymentResponse.push(response);
            }
            // to be handled all the emissions when working on summary page
          },
          error: () => {
            // to be handled all the errors when working on summary page
          },
          complete: () => {
            this.v3BulkPaymentService.setIsBulkPaymentProcessing(false);
            this.alertService.successAlert({ content: 'Payment Completed' });
            this.router.navigate(['/manage/payments-table/index']);
            this.setPaymentSummary(this.bulkPaymentResponse);
          }
        })
    );
  }

  /**
   * @description Handles responses with response_code 210 where response is an object with UUID keys.
   * Each UUID maps to an item with success and errorMsg properties.
   * Supports multiple response_code 210 responses in the summary array.
   * @param summary - Array of responses that may contain response_code 210
   */
  setPaymentSummaryForResponseCode210(
    summary: IResponse[] | HttpErrorResponse[],
  ): void {
    // Check if the first response is an HttpErrorResponse with errorCode 210
    const firstResponse = summary[0] as HttpErrorResponse;
    if (firstResponse?.error?.errorCode === 210) {
      // If it's an HTTP error, apply the error to all items
      const errorMsg = firstResponse.error?.errorMsg || 'Something went wrong';
      this.bulkSummary.forEach((summaryItem) => {
        if (Array.isArray(summaryItem)) {
          summaryItem.forEach((item) => {
            // eslint-disable-next-line no-param-reassign
            item.success = {
              success: false,
              error: { errorMsg }
            };
          });
        } else {
          // eslint-disable-next-line no-param-reassign
          summaryItem.success = {
            success: false,
            error: { errorMsg }
          };
        }
      });
      this.bulkSummary = this.bulkSummary.flat();
      this.v3BulkPaymentService.setBulkPaymentData(this.bulkSummary);
      return;
    }

    // Filter all responses with response_code 210
    const response210List = summary.filter(
      (res) => (res as IResponse)?.response_code === 210
    ) as IResponse[];

    // Merge all response_code 210 data into a single map
    const mergedResponseData: Record<string, { success: boolean; errorMsg?: string }> = {};
    response210List.forEach((res) => {
      if (res?.data && typeof res.data === 'object') {
        Object.assign(mergedResponseData, res.data);
      }
    });

    // Process bulkSummary items - map by UUID if available in mergedResponseData
    this.bulkSummary.forEach((summaryItem, index) => {
      if (Array.isArray(summaryItem)) {
        summaryItem.forEach((item) => {
          if (item.uuid && mergedResponseData[item.uuid]) {
            const dataItem = mergedResponseData[item.uuid];
            // eslint-disable-next-line no-param-reassign
            item.success = dataItem.success
              ? { success: true }
              : { success: false, error: { errorMsg: dataItem.errorMsg } };
          } else {
            // eslint-disable-next-line no-param-reassign
            item.success = summary[index];
          }
        });
      } else if (summaryItem.uuid && mergedResponseData[summaryItem.uuid]) {
        const dataItem = mergedResponseData[summaryItem.uuid];
        // eslint-disable-next-line no-param-reassign
        summaryItem.success = dataItem.success
          ? { success: true }
          : { success: false, error: { errorMsg: dataItem.errorMsg } };
      } else {
        // eslint-disable-next-line no-param-reassign
        summaryItem.success = summary[index];
      }
    });

    // Flatten the bulkSummary array and set the data
    this.bulkSummary = this.bulkSummary.flat();
    this.v3BulkPaymentService.setBulkPaymentData(this.bulkSummary);
  }

  /**
   * @description set payment summary for payment summary modal
   * `this.bulkSummary` contain required data for summary modal.
   * @param summary - contain all api response.
   */
  setPaymentSummary(summary: IResponse[] | HttpErrorResponse[]): void {
    if (summary) {
      // Check if first response has response_code 210 or if any response has response_code 210
      const hasResponse210 = summary.some(
        (res) => (res as IResponse)?.response_code === 210 ||
                 (res as HttpErrorResponse)?.error?.errorCode === 210
      );

      if (hasResponse210) {
        this.setPaymentSummaryForResponseCode210(summary);
        return;
      }

      // Standard processing for non-210 responses
      this.bulkSummary.forEach((arr, index) => {
        if (Array.isArray(arr)) {
          arr.forEach((item) => {
            // eslint-disable-next-line no-param-reassign
            item.success = summary[index];
          });
        } else {
          // eslint-disable-next-line no-param-reassign
          arr.success = summary[index];
        }
      });

      this.bulkSummary = this.bulkSummary.flat();
      this.v3BulkPaymentService.setBulkPaymentData(this.bulkSummary);
    }
  }

  /**
   * @description Routes to the payments table after payments are complete.
   */
  afterPayment(): void {
    this.router.navigateByUrl('/manage/payments-table/index');
  }

  /**
   * @description Method to calculate the total amount from all payment types.
   */
  amountCalulation(): void {
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
    const checkMailFormArray = this.bulkPaymentForm
      ?.get('checkMailFormGroup')
      ?.get('checkMailFormArray') as FormArray;
    const checkEmailFormArray = this.bulkPaymentForm
      ?.get('checkEmailFormGroup')
      ?.get('checkEmailFormArray') as FormArray;
    const checkDDFormArray = this.bulkPaymentForm
      ?.get('checkDDFormGroup')
      ?.get('checkDDFormArray') as FormArray;
    const checkPrintFormArray = this.bulkPaymentForm
      ?.get('checkPrintFormGroup')
      ?.get('checkPrintFormArray') as FormArray;
    const walletCheckPrintFormArray = this.bulkPaymentForm
      ?.get('walletCheckPrintFormGroup')
      ?.get('walletCheckPrintFormArray') as FormArray;
    const walletCheckEmailFormArray = this.bulkPaymentForm
      ?.get('walletCheckEmailFormGroup')
      ?.get('walletCheckEmailFormArray') as FormArray;

    if (checkMailFormArray.value.length !== 0) {
      this.displayCost = true;
    }

    const combinedArray = achFormArray?.value.concat(
      wireFormArray.value,
      cardFormArray.value,
      checkMailFormArray.value,
      checkEmailFormArray.value,
      checkDDFormArray.value,
      checkPrintFormArray.value,
      checkMailType2Array.value,
      walletCheckPrintFormArray.value,
      walletCheckEmailFormArray?.value || []
    );

    this.totalCost = combinedArray.reduce(
      (sum: number, item: { [key: string]: string }) =>
        sum + parseFloat('cost' in item ? item?.cost || '0.00' : '0.00'),
      0
    );

    this.totalAmount = combinedArray.reduce(
      (sum: number, item: { [key: string]: string }) =>
        sum + parseFloat('amount' in item ? item?.amount : item?.cheque_amount),
      0
    );
    this.v3BulkPaymentService.totalPaymentAmount.set(this.totalAmount);
    this.v3BulkPaymentService.totalPaymentCount.set(combinedArray.length);
  }

  goBack() {    
    this.v3BulkPaymentService.totalShippingFeeSubject.next('0.00');
    this.v3BulkPaymentService.totalAttachmentFeeSubject.next('0.00');

    if (
      this.v3BulkPaymentService.isBulkPayProcessing &&
      this.v3BulkPaymentService.isBulkCheckProcessing
    ) {
      this.v3BulkPaymentService.setIsCheckModeSelected(false);
      this.v3BulkPaymentService.checkOption = '';
      this.v3BulkPaymentService.setBackButtonClicked();
      this.v3BulkPaymentService.isBulkPayProcessing = false;
      this.v3BulkPaymentService.isBulkCheckProcessing = false;
      this.clearFormData();
      this.subscription.push(
        this.v3BulkPaymentService.bulkPayChanges$.subscribe((_) => {
          this.clearFormData();
        })
      );
    } else {
      this.location.back();
    }
  }

  /**
   * Method for clearing form Data
   * Calculates all amounts and counts first, then updates signals once for better performance.
   */
  clearFormData() {
    this.v3BulkPaymentService.isCheckPrintProcessing = false;
    this.v3BulkPaymentService.isCheckDDProcessing = false;
    
    // Calculate totals from all form arrays before clearing
    let totalAmountToSubtract = 0;
    let totalCountToSubtract = 0;

    // Process each form array and accumulate totals
    const formArraysToReset = [
      { form: 'checkMailFormGroup', formArray: 'checkMailFormArray' },
      { form: 'checkEmailFormGroup', formArray: 'checkEmailFormArray' },
      { form: 'checkMailType2FormGroup', formArray: 'checkMailType2FormArray' }
    ];

    formArraysToReset.forEach(({ form, formArray }) => {
      const { amount, count } = this.calculateFormArrayTotals(form, formArray);
      totalAmountToSubtract += amount;
      totalCountToSubtract += count;
    });

    // Update signals once with the combined totals
    if (totalAmountToSubtract > 0) {
      this.v3BulkPaymentService.totalPaymentAmount.update(
        (currentTotal) => Math.max(0, currentTotal - totalAmountToSubtract)
      );
    }

    if (totalCountToSubtract > 0) {
      this.v3BulkPaymentService.totalPaymentCount.update(
        (currentCount) => Math.max(0, currentCount - totalCountToSubtract)
      );
    }

    // Now clear all form arrays
    formArraysToReset.forEach(({ form, formArray }) => {
      this.resetFormValues(form, formArray);
    });
  }

  /**
   * Calculates the total amount and count from a form array without modifying it.
   * @param form - Form group name
   * @param formArray - Form array name
   * @returns Object with amount and count totals
   */
  private calculateFormArrayTotals(form: string, formArray: string): { amount: number; count: number } {
    const formGroup = this.bulkPaymentForm.get(form) as FormGroup;
    let totalAmount = 0;
    let count = 0;

    if (formGroup) {
      const formArrayToCalculate = formGroup.get(formArray) as FormArray;

      if (formArrayToCalculate && formArrayToCalculate.length > 0) {
        formArrayToCalculate.controls.forEach((control) => {
          const controlValue = control.value;
          if (controlValue) {
            // Check for 'amount' first, then fallback to 'cheque_amount'
            const amountValue = controlValue.amount || controlValue.cheque_amount;
            if (amountValue) {
              const parsedAmount = parseFloat(String(amountValue));
              if (!Number.isNaN(parsedAmount)) {
                totalAmount += parsedAmount;
              }
            }
          }
        });
        count = formArrayToCalculate.length;
      }
    }

    return { amount: totalAmount, count };
  }

  /**
   * Method to reset form values.
   * Clears the form array and resets the form group.
   * Note: Amount and count calculations should be done before calling this method.
   */
  resetFormValues(form: string, formArray: string) {
    const formGroupToDelete = this.bulkPaymentForm.get(form) as FormGroup;

    if (formGroupToDelete) {
      const formArrayToDelete = formGroupToDelete.get(formArray) as FormArray;

      if (formArrayToDelete) {
        formArrayToDelete.clear();
      }

      formGroupToDelete.reset();
    }
  }

  onProcessingCheckData(event: boolean): void {
    if (event) {
      this.isCheckPayments = false;
    }
  }

  isCheckPaymentsAvailable(): void {
    this.isCheckPayments = true;
  }

  ngOnDestroy(): void {
    this.v3BulkPaymentService.selectedCheckTypes.length = 0;
    this.v3BulkPaymentService.setIsBulkPaymentProcessing(false);
    this.subscription.forEach((el) => {
      el?.unsubscribe();
    });
  }
}
