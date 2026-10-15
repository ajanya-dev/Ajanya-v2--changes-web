import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Subscription, finalize, firstValueFrom } from 'rxjs';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { IPayrollApps } from 'src/app/modules/payroll/model/payroll';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, NgClass } from '@angular/common';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { environment } from 'src/environments/environment';
import { ICardPaymentReqDocRes } from 'src/app/modules/payments/model/payments';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { Router } from '@angular/router';
import { CardTransactionDocsPreviewModalComponent } from 'src/app/modules/payments/shared/modal/card-transaction-docs-preview-modal/card-transaction-docs-preview-modal.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PayrollService } from '../../services/payroll.service';
import { PayrollStatementVerificationComponent } from '../payroll-statement-verification/payroll-statement-verification.component';
import { PayrollIniatedModalComponent } from '../../modal/payroll-iniated-modal/payroll-iniated-modal.component';

@Component({
  selector: 'app-confirm-payroll-modal',
  templateUrl: './confirm-payroll-modal.component.html',
  styleUrls: ['./confirm-payroll-modal.component.scss'],
  standalone: true,
  imports: [NgClass, FaIconComponent, CommonButtonV35Component, MatDialogClose,CurrencyPipe]
})
export class ConfirmPayrollModalComponent implements OnInit, OnDestroy {
  private matDialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef);
  private dialogData = inject(MAT_DIALOG_DATA);
  private payrollService = inject(PayrollService);
  private alertService = inject(AlertService);
  private v3TableService = inject(V3DataTableService);
  private paymentsService = inject(PaymentsService);
  private commonService = inject(CommonOnInitService);
  private personaHelperService = inject(PersonaHelperService);
  private router = inject(Router);
  private headerService = inject(HeaderService);

  subscriptions: Subscription[] = [];
  paymentAmount = this.dialogData.amount;
  selectedBank = this.dialogData.selectedBank;
  payrollId: string | undefined;
  rowData: ICommonTransactionTableData = this.dialogData.rowData;
  mode: string = this.dialogData.mode;
  maskedAccountNumber: string;
  payrollAppDetails: IPayrollApps;
  loading = false;
  totalAmount: string;
  status: number;
  statusText: string;
  fee: string;
  grossPay: number | undefined;
  card: IExistingCreditCards | undefined;
  detailsLoading = true;
  bankNickName: string;
  bankAccountNumber:string;
  additionalFee: number;
  creditCardFee: number;
  selectedPayymentMethod: number;
  sessionKey = '';
  emailSessionKey = '';
  phoneSessionKey = '';
  authSign: string;
  imadNumber: string;
  faXmark = faXmark;

  transactionFeeLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.payrollId = this.rowData.id;
    this.status = Number(this.rowData.status);
    this.getSelectedPaymentMethod();
    this.getStatusText();
    this.getDetails();
  }

  /**
   * @description -The function determines the payment method being used and updates the payroll service fee accordingly.
   */
  getSelectedPaymentMethod() {
    this.creditCardFee = this.payrollService.creditCardFee;
    this.subscriptions.push(
      this.payrollService.selectedPaymentMethod.subscribe((res) => {
        this.selectedPayymentMethod = res;
        this.getAdditionalFee(res);
      })
    );
  }

  /**
   * @description - Retrieves details related to a payroll transaction or a selected card.
   */
  getDetails() {
    if (this.status !== 0 && this.status !== 3 && this.rowData.transaction_id) {
      this.subscriptions.push(
        this.payrollService
          .getPayrollTransactionDetails(this.rowData.transaction_id)
          .pipe(
            finalize(() => {
              this.detailsLoading = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.imadNumber = res.data.metaData.imad ?? '';
              this.card = {
                nickName: res.data.metaData.cardName,
                bgColor: '',
                cardId: '',
                card: '',
                cardMasked:res.data.metaData.cardNumber
              };
              if (this.selectedBank) {
                this.selectedBank.bankAccountNickName =
                  res.data.metaData.bankAccountName;
                this.selectedBank.bankAccountNumber =
                  res.data.metaData.bankAccountNumber;
              } else {
                this.bankNickName = res.data.metaData.bankAccountName;
                this.bankAccountNumber = res.data.metaData.bankAccountNumber;
              }
            }
          })
      );
    } else {
      this.card = this.payrollService.selectedCardId;
      this.detailsLoading = false;
    }
    this.grossPay = this.rowData.gross_pay;
  }

  /**
   * @description Calculates the total amount and fee based on payment details.
   */
  getTotalAmount(paymentMethod: number) {
    if (this.status === 1 || this.status === 2 || this.status === 6) {
      this.totalAmount = (
        Number(this.paymentAmount) + Number(this.rowData.service_fee)
      ).toFixed(2);
      this.fee = Number(this.rowData.service_fee || '0').toFixed(2);
    }else if(paymentMethod === 12){
      this.fee = String(this.calculateRtpFee(Number(this.paymentAmount)).toFixed(2));
      this.totalAmount = (
        Number(this.paymentAmount) + Number(this.fee)
      ).toFixed(2);
    } else {
      this.fee = String(
        (
          (this.paymentAmount * this.creditCardFee) / 100 +
          this.additionalFee
        ).toFixed(2)
      );
      this.totalAmount = (
        Number(this.paymentAmount) +
        Number(this.fee)
      ).toFixed(2);
    }
  }

  calculateRtpFee(transactionAmount: number): number {
    const percentage = 0.01; // 1% fee
    const minFee = 5.0; // Minimum fee
    const maxFee = 30.0; // Maximum fee

    // Calculate service fee
    const serviceFee = (Number(this.creditCardFee) / 100) * transactionAmount;
    // Calculate fee based on percentage
    let calculatedFee = transactionAmount * percentage;

    // Apply minimum and maximum limits
    if (calculatedFee < minFee) {
      calculatedFee = minFee;
    } else if (calculatedFee > maxFee) {
      calculatedFee = maxFee;
    }

    // Calculate total fee
    const fee = calculatedFee + Number(serviceFee);
    // Round to 2 decimal places and return
    return Number(fee);
  }

  getStatusText() {
    switch (this.status) {
      case 0:
        this.statusText = 'Pending';
        break;
      case 1:
        this.statusText = 'Processing';
        break;
      case 2:
        this.statusText = 'Completed';
        break;
      case 4:
        this.statusText = 'Failed';
        break;
      case 5:
        this.statusText = 'Automatic Payment';
        break;
      case 6:
        this.statusText = 'Rejected';
        break;
      default:
        this.statusText = '';
    }
  }

  process(mode: string) {
    if (mode === 'Pay') {
      if (
        this.card?.notAvailableGateway &&
        !this.paymentsService.isGatewaySkip(this.card.cardId)
      ) {
        this.verifyOrSkipGateway(
          'Your card needs verification before this payment.',
          this.card.notAvailableGateway
        );
        return;
      }
      this.processPayment();
    } else {
      this.downloadPayment();
    }
  }

  /**
   * @description Initiates the payment process for a payroll transaction.
   * First verifies the card's gateway type is valid for the amount via the
   * decide-gateway-by-trans-limit API (service internally gates on
   * creditCardGatewaySwitchingStatus === 3). On success: proceeds with the
   * existing payment flow. On fail: shows a failed alert with Add/Cancel.
   * Cancel returns the user to the previous screen (reset + close modal).
   * Add opens the add-card modal constrained to the gateway type returned by
   * the API; after the card is added, closes this modal and broadcasts the
   * new gateway type so the parent screen auto-selects the new card.
   */
  processPayment() {
    this.loading = true;
    // Check gateway type before processing payment
    // this.paymentsService.fetchGatewayType(Number(this.totalAmount), (gatewayType) => {
    //   if (gatewayType !== undefined && card?.gatewayType !== undefined && Number(card.gatewayType) !== Number(gatewayType)) {
    //     this.loading = false;
    //     this.alertService.infoAlert({
    //       content: `This payment amount requires you to reselect your card. Please select your card again to continue. If your card is not listed, please add it again to proceed.`,
    //       isOk: true
    //     }).afterClosed().subscribe(() => {
    //       this.payrollService.gatewayTypeChanged.next(gatewayType);
    //       this.payrollService.resetPayrollDetails.next(true);
    //       this.dialogRef.close();
    //     });
    //     return;
    //   }
    //   this.proceedWithPayment();
    // })
    const { card } = this;
    const amount = Number(this.totalAmount);
    if (!amount || !card?.gatewayType || this.paymentsService.isGatewaySkip(card?.cardId)) {
      this.proceedWithPayment();
      return;
    }
    this.subscriptions.push(
      this.paymentsService
        .decideGatewayByTransLimit(amount, Number(card.gatewayType), card.cardId)
        .subscribe({
          next: (res) => {
            if(res==='process_payment' || (typeof res !== 'string' && res?.success)){
              this.proceedWithPayment();
            }
          },
          error: (err) => {
            if(err.error.errorMsg.errorCode === 824) {
              if(err.error.errorMsg.duplicate_card){
                this.card = err.error.errorMsg.duplicate_card;
                this.payrollService.showDuplicateCard.next(this.card);
                this.proceedWithPayment();
                return;
              }
              this.loading = false;
              const failGatewayType = err.error.errorMsg.gateway_type;
              const failMessage = err.error.errorMsg.errorMsg;
              this.handleTransLimitFailure(failMessage, failGatewayType);
            }
          }
        })
    );
  }

  /**
   * @description Handles the failure response from decide-gateway-by-trans-limit.
   * Shows a failed alert with Add/Cancel. Cancel resets payroll state and closes
   * this modal. Add opens the add-card modal pre-constrained to the provided
   * gateway type; once the card is added successfully, broadcasts the gateway
   * type via payrollService.gatewayTypeChanged so the previous screen can
   * auto-select the new card, then closes this modal.
   */
  private handleTransLimitFailure(errorMsg: string, gatewayType: number): void {
    this.subscriptions.push(
      this.alertService
        .warningAlert({
          title: 'Card Verification Required',
          content: errorMsg,
          doneMsg: 'Verify Now',
          cancelMsg: 'Cancel',
          isCancel: true
        })
        .afterClosed()
        .subscribe((confirmed) => {
          this.dialogRef.close();
          this.payrollService.gatewayTypeChanged.next(gatewayType);
          this.payrollService.resetPayrollDetails.next(true);
          if (confirmed) {
            this.payrollService.addNewCard.next(this.card ?? null);
          }
        })
    );
  }

  /**
   * @description Handles the `notAvailableGateway` card state on Pay. Shows the
   * verification alert. The second button is "Pay Now, Verify Later" whenever the card allows
   * skipping (`allowSkipGatewayAddition`), otherwise "Cancel". Verify Now routes
   * to the add-card verify flow; Skip processes this payroll immediately; Cancel
   * does nothing.
   */
  private verifyOrSkipGateway(errorMsg: string, gatewayType: number): void {
    const canSkip = !!this.card?.allowSkipGatewayAddition;
    this.subscriptions.push(
      this.alertService
        .warningAlert({
          title: 'Card Verification Required',
          content: errorMsg,
          doneMsg: 'Verify Now',
          cancelMsg: canSkip ? 'Pay Now, Verify Later' : 'Cancel',
          isCancel: true
        }, canSkip ? '420px' : undefined)
        .afterClosed()
        .subscribe((confirmed) => {
          if (confirmed) {
            this.dialogRef.close();
            this.payrollService.gatewayTypeChanged.next(gatewayType);
            this.payrollService.resetPayrollDetails.next(true);
            this.payrollService.addNewCard.next(this.card ?? null);
          } else if (canSkip) {
            this.skipGatewayAndProcess();
          }
        })
    );
  }

  /**
   * @description Tells the user the skip applies to this payment only and asks
   * them to confirm. On Pay Now it marks the transient skip so this payment
   * bypasses the gateway check and processes the payroll; Cancel backs out
   * without skipping. The card keeps `allowSkipGatewayAddition`, so Skip stays
   * on offer for as long as the backend allows it.
   */
  private skipGatewayAndProcess(): void {
    const { card } = this;
    if (!card) return;
    this.subscriptions.push(
      this.alertService
        .infoAlert({
          content:
            "This skip applies to this payment only. You'll be asked to verify this card again the next time you use it.",
          doneMsg: 'Pay Now',
          cancelMsg: 'Cancel',
          isOk: true,
          isCancel: true
        })
        .afterClosed()
        .subscribe((confirmed) => {
          if (!confirmed) return;
          this.paymentsService.markGatewaySkip(card.cardId);
          this.payrollService.selectedCardId = card;
          this.processPayment();
        })
    );
  }

  /**
   * @description -Proceeds with the payment after gateway type validation.
   */
  private proceedWithPayment() {
    this.payrollAppDetails = this.payrollService.selectedApp;
    const companyId = this.payrollAppDetails.id;
    const { card } = this;
    const amount = this.totalAmount;
    const mode = String(this.selectedPayymentMethod);
    const body = {
      cardId: card?.cardId ?? '',
      amount: amount ?? '',
      paymentType: 'payroll'
    };
    const companyType = this.payrollAppDetails.manual ? 'manual' : 'merge';
    this.subscriptions.push(
      this.paymentsService
        .getRequiredDocumentsDetails(body)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              if (card && this.payrollId) {
                const dialogRef =
                  this.commonService.openVerifyCardInvoiceModalPayroll(
                    card,
                    this.paymentAmount,
                    mode,
                    '',
                    res.data.required_docs,
                    companyId,
                    companyType,
                    'payroll'
                  );
                dialogRef.afterClosed().subscribe((response) => {
                  if (response && response.success) {
                    this.authSign = response.authSign as string;
                    this.onSubmit(response.data);
                  }
                });
              }
            }
          },
          error: (err) => {
            if (err?.error?.errorCode === 442) {
              this.alertService
                .infoAlert({
                  content:
                    'You need to verify your business before making a payment',
                  isOk: true,
                  isCancel: true,
                  cancelMsg: 'Cancel',
                  doneMsg: 'Enable Now'
                })
                .afterClosed()
                .subscribe((res) => {
                  if (res) {
                    this.openKybModal();
                  }
                });
            }
          }
        })
    );
  }

  onSubmit(docs:ICardPaymentReqDocRes,isAgree = 0){
    const { card } = this;
    const companyType = this.payrollAppDetails.manual ? 'manual' : 'merge';
    const paymentBody = {
      payrollId: this.payrollId,
      companyType,
      processingAmount: this.paymentAmount,
      documents: docs,
      session_key: this.sessionKey ?? '',
      otp_type:this.emailSessionKey ? 'phone': 'email',
      email_otp_session_key:this.emailSessionKey ?? '',
      phone_otp_session_key: this.phoneSessionKey ?? '',
      document_preview_agree:isAgree
    };
    this.loading = true;
    this.subscriptions.push(
      this.payrollService
        .payrollTransaction(
          paymentBody,
          this.payrollAppDetails.id
        )
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (val) => {
            if (val.success) {
              this.paymentsService.clearGatewaySkip();
              this.dialogRef.close();
              const bankAccountNumber =  this.selectedBank ? this.selectedBank?.bankAccountNumber || this.selectedBank?.accountNumber : '';
              const bankName = this.selectedBank
              ? this.selectedBank.bankAccountNickName || this.selectedBank.nickName
              : this.bankNickName;
              this.matDialog.open(PayrollIniatedModalComponent,{
                width:'95%',
                maxWidth:'515px',
                data: {
                  amount: this.paymentAmount,
                  cardName: card ? card?.nickName  : "",
                  cardNumber:card?.cardMasked ? card?.cardMasked.slice(-4) : '',
                  bankAccount:this.selectedBank ? bankAccountNumber.slice(-4) : '',
                  bankName,
                  fee:this.fee,
                  total:this.totalAmount,
                }
              });
              // this.scriptService.trackMatomoEvent(
              //   'Payroll',
              //   'Payroll Payment Success'
              // );
              this.v3TableService.refreshV3DataTable();
            }
          },
          error: async (err: HttpErrorResponse) => {
            if (err.error.errorCode === 356) {
              this.dialogRef.close(false);

              const dialogData = {
                title: 'Error',
                content: err.error.errorMsg,
                doneMsg: 'Verify Now',
                cancelMsg: 'Cancel',
                isCancel: true
              };

              const result = await firstValueFrom(
                this.alertService
                  .warningAlert(dialogData)
                  .afterClosed()
              );

              if (result) {
                const statementDialgoRef = this.matDialog.open(
                  PayrollStatementVerificationComponent,
                  {
                    width: '500px',
                    disableClose: true,
                    data: {
                      bankAccountId: this.selectedBank.id,
                      companyId: this.payrollAppDetails.id,
                      companyType: this.payrollAppDetails.manual
                    }
                  }
                );

                statementDialgoRef
                  .afterClosed()
                  .subscribe((val: { success: boolean }) => {
                    if (val.success) {
                      this.payrollService.payrollStatementApplicationSuccess.next(
                        true
                      );
                    }
                  });
              }
            } else if (err.error.errorCode === 630) {
              const alert = this.alertService.warningAlert({
                title: 'Transaction Declined!',
                content:
                  'Your card issuer declined your card. Call them or add a new business credit card. The selected payroll amount is not processed.',
                close: false
              });
              alert.afterClosed().subscribe((resp) => {
                if (resp) {
                  this.close();
                }
              });
            }
            if (err.error.errorCode === '112') {
              this.sessionKey = err.error.session_key;
              const dialog = this.matDialog.open(OtpModalComponent, {
                maxWidth: '410px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
                data: {...err.error,type:'card-transaction',mode:this.emailSessionKey ? 'phone': 'email'}
              });
              dialog.afterClosed().subscribe((result) => {
                if (result.success) {
                  if(this.emailSessionKey){
                    this.phoneSessionKey = result?.session_key ?? err.error.session_key;
                  }else{
                    this.emailSessionKey = result?.session_key ?? err.error.session_key;
                  }
                  this.onSubmit(docs);
                }
              });
            }
            if (err.error.errorCode === '808') { 
              const companyId = this.payrollAppDetails.id;
              const selectedCompanyType = this.payrollAppDetails.manual ? 'manual' : 'merge';
              const sendingData = {
                amount:this.paymentAmount,
                invoiceNumber:null,
                memo:null,
                paymentType:'payroll',
                authSign:this.authSign,
                cardId:this.card?.cardId?? '',
                payee_phone:null,
                payees:null,
                mode: 1,
                isSameDay:0,
                phone_otp_session_key:this.phoneSessionKey?? '',
                email_otp_session_key:this.emailSessionKey?? '',
                companyId,
                companyType:selectedCompanyType,
                payrollId:this.payrollId
              };
              const dialog = this.matDialog.open(CardTransactionDocsPreviewModalComponent, { 
                maxWidth: '750px', 
                width: '100%', 
                disableClose: true, 
                autoFocus: false, 
                data: sendingData
              }); 
              dialog.afterClosed().subscribe((result) => { 
                if (result) { 
                  this.onSubmit(docs, 1); 
                } 
              }); 
            } 
            if (err.error.errorCode === 816) {
              this.subscriptions.push(
                this.headerService.headerData().subscribe((res) => {
                  // eslint-disable-next-line no-underscore-dangle
                  this.headerService._headerData.next(res?.data);
                })
              );
              this.payrollService.resetPayrollDetails.next(true);
              const alert = this.alertService.warningAlert({
                title: 'Error',
                content: err.error.errorMsg,
                close: false
              });
              alert.afterClosed().subscribe((resp) => {
                if (resp) {
                  this.close();
                }
              });

            }
          }
        })
    );
  }

    openKybModal() {
      if (environment.isV4Persona) {
        this.personaHelperService
          .openModal('kyb', CVSourceType.credit_card)
          .subscribe((res) => {
            if (res?.data?.inquiry_id) {
              this.processPayment();
            }
          });
      } else {
        this.router.navigateByUrl('/manage/users/verify-user-id?type=5');
      }
    }

  downloadPayment() {
    this.loading = true;
    this.subscriptions.push(
      this.payrollService
        .downloadTransaction(this.rowData.transaction_id as string)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            window.open(res?.data);
            this.close();
          }
        })
    );
  }

  /**
   * @description Close the modal
   */
  close() {
    this.dialogRef.close();
  }

  getAdditionalFee(paymentMethod: number) {
    this.transactionFeeLoading.set(true);
    const transferType = this.getTransferType(paymentMethod);
    this.subscriptions.push(
      this.payrollService.getAdditionalFee({
        transfer_type: transferType,
        transaction_type: 4, // 4 is for payroll
        transaction_amount: Number(this.paymentAmount)
      })
      .pipe(
        finalize(() => {
          this.transactionFeeLoading.set(false);
        })
      )
      .subscribe((res) => {
          this.additionalFee = res.transaction_fee;
          this.getTotalAmount(paymentMethod);
      })
    );
  }

  getTransferType(paymentMethod: number) {
    switch(paymentMethod) {
      case 1:
        return 'ach';
      case 6:
        return 'wire';
      case 12:
        return 'rtp';
      default:
        return '';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
