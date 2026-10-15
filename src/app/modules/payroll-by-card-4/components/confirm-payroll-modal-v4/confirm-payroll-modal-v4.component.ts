import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { Subscription, finalize, firstValueFrom } from 'rxjs';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { IPayrollApps } from 'src/app/modules/payroll/model/payroll';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { IBankDropdown } from 'src/app/models/bank';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LucideAngularModule, X } from 'lucide-angular';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { environment } from 'src/environments/environment';
import { ICardPaymentReqDocRes } from 'src/app/modules/payments/model/payments';
import { OtpModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/otp-modal-v4/otp-modal-v4.component';
import { Router } from '@angular/router';
import { V4CardTransactionDocsPreviewModalComponent } from 'src/app/modules/payments-v4/send-payment/components/modals/card-transaction-docs-preview-modal/card-transaction-docs-preview-modal.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { CardsDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/cards-dropdown-v4/cards-dropdown-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import {
  VerifyCardModalV4Component,
  IVerifyCardInvoiceDialogData
} from 'src/app/modules/payments-v4/send-payment/components/modals/verify-card-modal/verify-card-modal-v4.component';
import { ConfirmMicroDepositModalV4Component } from 'src/app/modules/user/user-v4/modals/confirm-micro-deposit-modal-v4/confirm-micro-deposit-modal-v4.component';
import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { PayrollService } from '../../../payroll-by-card/services/payroll.service';
import { PayrollStatementVerificationV4Component } from '../payroll-statement-verification-v4/payroll-statement-verification-v4.component';
import { PayrollIniatedModalV4Component } from '../../modal/payroll-iniated-modal-v4/payroll-iniated-modal-v4.component';
import { WireRoutingUpdateModalV4Component } from '../../modal/wire-routing-update-modal-v4/wire-routing-update-modal-v4.component';

interface IpaymentMethod {
  name: string;
  icon: string;
  value: number;
  id: string;
  description?: string;
  disabled?: boolean;
  tooltip?: string;
}

@Component({
  selector: 'app-confirm-payroll-modal-v4',
  templateUrl: './confirm-payroll-modal-v4.component.html',
  styleUrls: ['./confirm-payroll-modal-v4.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    LucideAngularModule,
    CommonButtonV4Component,
    MatDialogClose,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    BankAcDropdownV4Component,
    CardsDropdownV4Component,
    V4CommonDropDownSelectorComponent,
    MatTooltip
  ]
})
export class ConfirmPayrollModalV4Component implements OnInit, OnDestroy {
  private matDialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef);
  private dialogData = inject(MAT_DIALOG_DATA);
  private payrollService = inject(PayrollService);
  private alertService = inject(V4AlertService);
  private v3TableService = inject(V3DataTableService);
  private paymentsService = inject(PaymentsService);
  private personaHelperService = inject(PersonaHelperService);
  private router = inject(Router);
  private headerService = inject(HeaderService);

  readonly XIcon = X;
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
  get isViewMode(): boolean {
    return this.status !== 0 && this.status !== 3;
  }

  fee: string;
  grossPay: number | undefined;
  card: IExistingCreditCards | undefined;
  detailsLoading = true;
  bankNickName: string;
  bankAccountNumber: string;
  additionalFee: number;
  transactionFeeLoading = signal(false);
  creditCardFee: number;
  selectedPayymentMethod: number;
  sessionKey = '';
  emailSessionKey = '';
  phoneSessionKey = '';
  authSign: string;
  imadNumber: string;
  companyName: string;
  source: string;
  frequency: string;
  payDate: string;
  dueDate: string;
  gatewayType: number | undefined;

  // Bank verification state flags
  notVerified = false;
  confirmMicroDeposit = false;
  verificationPending = false;
  bankVerfied = false;
  failedVerification = false;
  rejectedVerification = false;
  rejectedVerificationWithVerifyInstantly = false;
  payrollStatus = 2;
  isPayrollNotVerified = false;
  isPayrollNotVerifiedBankId: string;
  isRtpAllowed = true;
  selectedBankId: string;

  // Bank dropdown binding
  private selectedBankItem: IBankDropdown | undefined;
  get bankAccountChange(): IBankDropdown | undefined {
    return this.selectedBankItem;
  }

  set bankAccountChange(event: IBankDropdown) {
    if (this.selectedBankItem?.id === event?.id) return;
    this.selectedBankItem = event;
    this.payrollStatus = event?.payrollVerified ?? 2;

    if (!event) {
      this.selectedBank = event;
      this.payrollService.selectedBank = event;
      return;
    }

    this.removeAlerts();

    const microDepositCondition =
      event.verifiedBy === 3 && event.achApplicationStatus !== 1;
    const approvalPendingCondition =
      event.verifiedBy === 4 && event.achApplicationStatus !== 1;
    const failedVerificationCondition =
      event.verifiedBy === 12 && event.achApplicationStatus !== 1;
    const rejectedVerificationWithVerifyInstantlyCondition =
      event.verifiedBy === 6 && event.achApplicationStatus !== 1;
    const rejectedVerificationCondition =
      event.verifiedBy === 10 && event.achApplicationStatus !== 1;

    if (rejectedVerificationCondition) {
      this.rejectedVerification = true;
    } else if (rejectedVerificationWithVerifyInstantlyCondition) {
      this.rejectedVerificationWithVerifyInstantly = true;
    } else if (failedVerificationCondition) {
      this.failedVerification = true;
    } else if (approvalPendingCondition) {
      this.verificationPending = true;
    } else if (microDepositCondition) {
      this.confirmMicroDeposit = true;
    } else if (!event.verified) {
      this.notVerified = true;
      this.openBankVerify(event);
    } else if (event.verified) {
      this.bankVerfied = true;
      this.selectedBank = event;
      this.payrollService.selectedBank = event;
      this.setPayrollSettings();

      if (event.payrollVerified === 0) {
        this.isPayrollNotVerified = true;
        this.isPayrollNotVerifiedBankId = event.id;
      } else {
        this.isPayrollNotVerified = false;
      }
    }
    this.payrollService.selectedBank = event;
  }

  // Card dropdown binding
  private selectedCardItem: IExistingCreditCards | undefined;
  get cardChange(): IExistingCreditCards | undefined {
    return this.selectedCardItem;
  }

  set cardChange(event: IExistingCreditCards) {
    if (event) {
      if (this.payrollService.selectedCardId?.cardId !== event.cardId) {
        this.selectedCardItem = event;
        this.card = event;
        this.payrollService.selectedCardId = event;
        this.setPayrollSettings();
      }
    } else {
      this.selectedCardItem = undefined;
      this.card = undefined;
      this.payrollService.selectedCardId = undefined;
    }
  }

  // Payment method dropdown config
  paymentOptions: IpaymentMethod[] = [
    {
      name: 'WIRE',
      icon: 'globe',
      value: 6,
      id: 'wire',
      description: 'Same business day'
    },
    {
      name: 'ACH',
      icon: 'bank',
      value: 1,
      id: 'ach',
      description: 'Settles in 1-3 business days.'
    },
    {
      name: 'RTP',
      icon: 'circle-dollar',
      value: 12,
      id: 'rtp',
      description: 'Real-time payments are coming soon',
      disabled: true,
      tooltip: 'Real-time payments are coming soon'
    }
  ];

  paymentMethodDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select Payment Method',
    displayField: 'name',
    outputField: 'stringValue',
    iconField: 'iconProp',
    displaySubField: 'description',
    subTextPosition: 'below',
    tooltipField: 'tooltip',
    commons: {
      iconColor: {
        background: 'v4-badge-info-bg-color' as any,
        text: 'v4-primary-brand-color' as any
      }
    },
    style: {
      size: 0
    }
  };

  paymentMethodListData = this.paymentOptions.map((opt) => ({
    ...opt,
    stringValue: String(opt.value),
    iconProp: ['fas', opt.icon] as [string, string]
  }));

  selectedPaymentMethodValue: string;

  ngOnInit(): void {
    this.payrollId = this.rowData.id;
    this.status = Number(this.rowData.status);
    this.companyName = this.payrollService.selectedApp?.name || '';
    this.source = this.rowData.source_name || '';
    this.frequency = this.dialogData.frequency || '';
    const dateStr =
      (this.rowData as any).check_date ||
      this.rowData.processed_date ||
      this.rowData.txnDate ||
      this.rowData.created_at ||
      '';
    this.payDate = this.formatDisplayDate(dateStr);
    this.dueDate = this.payDate;
    this.selectedPaymentMethodValue = String(this.selectedPayymentMethod || 1);
    this.gatewayType = this.dialogData.gatewayType;
    this.getSelectedPaymentMethod();
    this.getStatusText();
    this.getDetails();
  }

  /**
   * @description Handles bank account dropdown change - checks RTP eligibility
   */
  changeBankAccount(bank: IBankDropdown) {
    if (!bank) return;
    this.isRtpAllowed = true;
    this.payrollService.selectedBank = {
      ...this.payrollService.selectedBank,
      isRtpAllowed: true
    } as IBankDropdown;
    if (
      this.selectedBankId !== bank?.id &&
      this.selectedPayymentMethod === 12
    ) {
      this.selectedBankId = bank?.id;
      this.verifyRTPEligibility(String(bank?.routingNumber));
    }
  }

  /**
   * @description Handles payment method dropdown change
   */
  onPaymentMethodDropdownChange(value: string) {
    this.changePaymentMethod(Number(value));
    this.verifyPaymentAccess();
    if (this.payrollService.isSelectedPaymentDisabled) return;
    this.selectedPayymentMethod = Number(value);
    this.getAdditionalFee(this.selectedPayymentMethod);
    this.payrollService.selectedPaymentMethod.next(this.selectedPayymentMethod);
    this.setPayrollSettings();
  }

  /**
   * @description Changes payment method, resets RTP flag, and verifies RTP if needed
   */
  changePaymentMethod(methodId: number) {
    this.selectedPayymentMethod = methodId;
    this.isRtpAllowed = true;
    this.payrollService.selectedBank = {
      ...this.payrollService.selectedBank,
      isRtpAllowed: true
    } as IBankDropdown;
    if (methodId === 12) {
      this.verifyRTPEligibility(
        String(this.payrollService.selectedBank?.routingNumber)
      );
    }
  }

  /**
   * @description Verifies whether the selected payment method is allowed for the current user
   */
  verifyPaymentAccess() {
    const currPaymentMethod = this.paymentOptions.reduce(
      (prev, curr) =>
        String(curr.value) === String(this.selectedPayymentMethod)
          ? curr
          : prev,
      this.paymentOptions[0]
    );
    this.payrollService.isSelectedPaymentDisabled = false;
    if (this.payrollService.disableMethods.includes(currPaymentMethod.id)) {
      this.selectedPaymentMethodValue = '';
      setTimeout(() => {
        this.selectedPaymentMethodValue = '1'; // fallback to ACH
        this.selectedPayymentMethod = 1;
        this.payrollService.selectedPaymentMethod.next(1);
        this.getAdditionalFee(1);
      }, 600);
      const paymentMethod =
        currPaymentMethod.id === 'rtp' ? 'RTP' : currPaymentMethod.id;
      this.alertService.infoAlert({
        content: `The ${paymentMethod} transfer is disabled for this account. Please contact support team to activate it.`,
        isOk: true,
        isCancel: true,
        doneMsg: 'Contact Now',
        cancelMsg: 'Not Now'
      });
      this.payrollService.isSelectedPaymentDisabled = true;
    }
  }

  /**
   * @description Resets all bank verification alert flags
   */
  removeAlerts() {
    this.payrollStatus = 2;
    this.notVerified = false;
    this.confirmMicroDeposit = false;
    this.verificationPending = false;
    this.failedVerification = false;
    this.rejectedVerificationWithVerifyInstantly = false;
    this.rejectedVerification = false;
  }

  /**
   * @description Opens bank verify flow - shows warning then opens modal
   */
  openBankVerify(event?: IBankDropdown) {
    if (event) {
      this.verifyBankAccount(event.id, event);
    } else {
      this.openBankVerifyModal(
        this.selectedBankItem?.id as string,
        this.selectedBankItem
      );
    }
  }

  /**
   * @description Shows warning alert to verify bank, then opens verify modal
   */
  verifyBankAccount(bankAcId: string, bank?: IBankDropdown): void {
    const data = {
      title: 'Error',
      content: 'Please verify your bank account',
      doneMsg: 'Verify Now',
      cancelMsg: 'Cancel',
      isCancel: true
    };
    const res = this.alertService.warningAlert(data);
    res.afterClosed().subscribe((alertRes) => {
      if (alertRes) {
        this.openBankVerifyModal(bankAcId, bank);
      }
    });
  }

  /**
   * @description Opens the bank verification modal dialog
   */
  openBankVerifyModal(bankId: string, bank?: IBankDropdown) {
    const selectedBank =
      bank ??
      (this.selectedBankItem?.id === bankId ? this.selectedBankItem : undefined);

    this.matDialog.open(BankVerificationModalV4Component, {
      panelClass: 'paddingless-modal',
      width: '448px',
      maxWidth: '95vw',
      data: {
        bankId,
        bankDetails: selectedBank
          ? { verifiedBy: selectedBank.verifiedBy, country: selectedBank.country }
          : undefined
      },
      disableClose: true
    });
  }

  /**
   * @description Opens micro deposit confirmation modal
   */
  microDeposit() {
    const dialog = this.matDialog.open(ConfirmMicroDepositModalV4Component, {
      maxWidth: '750px',
      width: '500px',
      data: { bankAccountId: this.selectedBankItem?.id }
    });

    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.confirmMicroDeposit = false;
        this.bankVerfied = true;
      }
    });
  }

  /**
   * @description Recalculates fees based on current payment method
   */
  private recalculateFees() {
    this.getTotalAmount(this.selectedPayymentMethod);
  }

  /**
   * @description Saves payroll settings (bank, card, payment method) via API.
   * Handles wire routing update and payroll statement verification on success.
   */
  setPayrollSettings() {
    if (this.selectedPayymentMethod) {
      this.payrollService.selectedPaymentMethod.next(
        this.selectedPayymentMethod
      );
    }

    if (this.confirmMicroDeposit || this.verificationPending) {
      this.alertService.warningAlert({
        content: 'Bank account is not verified'
      });
      return;
    }

    const { selectedApp } = this.payrollService;
    const payrollSettingsBody = {
      bankAccountId: this.selectedBankItem?.id || '',
      creditCardId: this.selectedCardItem?.cardId || '',
      processMethod: 2,
      manual: selectedApp?.manual ? 1 : 0,
      amount: this.paymentAmount || 0,
      syncStatus: 0,
      transferMode: Number(this.selectedPayymentMethod) || 0
    };

    this.subscriptions.push(
      this.payrollService
        .savePayrollSetttings(payrollSettingsBody, selectedApp?.id)
        .subscribe({
          next: (res) => {
            if (res.success) {
              if (
                res.update_wire_routing_number === 1 &&
                !this.payrollService.isWireRoutingSkipped()
              ) {
                const dialogRef = this.matDialog.open(
                  WireRoutingUpdateModalV4Component,
                  {
                    maxWidth: '550px',
                    width: '93%',
                    data: { bankAc: this.selectedBankItem },
                    disableClose: true,
                    panelClass: 'paddingless-modal-rounded'
                  }
                );
                dialogRef.afterClosed().subscribe((wireRoutingAdded) => {
                  if (!wireRoutingAdded) {
                    this.payrollService.isWireRoutingSkipped.set(true);
                    this.payrollService.selectedPayrollBank.set(
                      this.selectedBankItem
                    );
                  }
                  if (this.isPayrollNotVerified) {
                    this.openStatementVerification(
                      this.isPayrollNotVerifiedBankId,
                      selectedApp?.id ?? '',
                      selectedApp?.manual
                    );
                    this.isPayrollNotVerified = false;
                  }
                  this.recalculateFees();
                });
              } else {
                this.payrollService.isWireRoutingSkipped.set(false);
                if (this.isPayrollNotVerified) {
                  this.openStatementVerification(
                    this.isPayrollNotVerifiedBankId,
                    selectedApp?.id ?? '',
                    selectedApp?.manual
                  );
                  this.isPayrollNotVerified = false;
                }
                this.recalculateFees();
              }
            }
          },
          error: (err) => {
            if (err.error?.errorCode === 555) {
              this.alertService.warningAlert({
                content: err.error.errorMsg
              });
            }
          }
        })
    );
  }

  /**
   * @description Opens the payroll statement verification modal for unverified payroll banks
   */
  async openStatementVerification(
    bankAccountId: string,
    companyId: string,
    companyType: number
  ): Promise<void> {
    if (this.payrollStatus === 1) return;
    const data = {
      title: 'Error',
      content: 'The selected bank account is not payroll verified.',
      doneMsg: 'Verify Now',
      cancelMsg: 'Cancel',
      isCancel: true
    };
    const res = await firstValueFrom(
      this.alertService.warningAlert(data).afterClosed()
    );
    if (res) {
      const dialgoRef = this.matDialog.open(
        PayrollStatementVerificationV4Component,
        {
          width: '500px',
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: {
            bankAccountId,
            companyId,
            companyType
          }
        }
      );

      dialgoRef.afterClosed().subscribe((val: { success: boolean }) => {
        if (val.success) {
          this.payrollStatus = 1;
          this.payrollService.payrollStatementApplicationSuccess.next(true);
        }
      });
    }
  }

  /**
   * @description Verifies RTP eligibility for a bank routing number
   */
  private verifyRTPEligibility(routingNumber: string) {
    this.subscriptions.push(
      this.paymentsService.rtpStatusCheck(routingNumber).subscribe((res) => {
        if (res.success) {
          this.isRtpAllowed = res.data.is_rtp_allowed;
          this.payrollService.selectedBank = {
            ...this.payrollService.selectedBank,
            isRtpAllowed: res.data.is_rtp_allowed
          } as IBankDropdown;
          this.selectedBank = this.payrollService.selectedBank;
        }
      })
    );
  }

  private formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * @description -The function determines the payment method being used and updates the payroll service fee accordingly.
   */
  getSelectedPaymentMethod() {
    this.creditCardFee = this.payrollService.creditCardFee;
    this.subscriptions.push(
      this.payrollService.selectedPaymentMethod.subscribe((res) => {
        this.selectedPayymentMethod = res;
        this.selectedPaymentMethodValue = String(res);
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
              this.card = this.payrollService.selectedCardId ?? {
                nickName: res.data.metaData.cardName,
                bgColor: '',
                cardId: '',
                card: '',
                cardMasked: res.data.metaData.cardNumber
              };
              this.selectedCardItem = this.card;
              if (this.selectedBank) {
                this.selectedBank.bankAccountNickName =
                  res.data.metaData.bankAccountName;
                this.selectedBank.bankAccountNumber =
                  res.data.metaData.bankAccountNumber;
                this.selectedBankItem = this.selectedBank as IBankDropdown;
              } else {
                this.bankNickName = res.data.metaData.bankAccountName;
                this.bankAccountNumber = res.data.metaData.bankAccountNumber;
              }
            }
          })
      );
    } else {
      this.card = this.payrollService.selectedCardId;
      this.selectedCardItem = this.card;
      this.selectedBankItem = this.selectedBank as IBankDropdown;
      this.detailsLoading = false;
    }
    this.grossPay = this.rowData.gross_pay;
  }

  /**
   * @description Fetches additional fee from API based on payment method
   */
  getAdditionalFee(paymentMethod: number) {
    this.transactionFeeLoading.set(true);
    const transferType = this.getTransferType(paymentMethod);
    this.subscriptions.push(
      this.payrollService
        .getAdditionalFee({
          transfer_type: transferType,
          transaction_type: 4,
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

  getTransferType(paymentMethod: number): string {
    switch (paymentMethod) {
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

  /**
   * @description Calculates the total amount and fee based on payment details.
   */
  getTotalAmount(paymentMethod: number) {
    if (this.status === 1 || this.status === 2 || this.status === 6) {
      this.totalAmount = (
        Number(this.paymentAmount) + Number(this.rowData.service_fee)
      ).toFixed(2);
      this.fee = Number(this.rowData.service_fee || '0').toFixed(2);
    } else if (paymentMethod === 12) {
      this.fee = String(
        this.calculateRtpFee(Number(this.paymentAmount)).toFixed(2)
      );
      this.totalAmount = (
        Number(this.paymentAmount) + Number(this.fee)
      ).toFixed(2);
    } else {
      this.totalAmount = (
        Number(this.paymentAmount) +
        Number(
          (this.paymentAmount * this.creditCardFee) / 100 + this.additionalFee
        )
      ).toFixed(2);
      this.fee = String(
        (
          (this.paymentAmount * this.creditCardFee) / 100 +
          this.additionalFee
        ).toFixed(2)
      );
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
      case 3:
        this.statusText = 'Draft';
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

  async process(mode: string) {
    if (mode === 'Pay') {
      const isValid = await this.validateBeforeProcess();
      if (!isValid) return;
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
   * @description Validates bank account and card before processing payment.
   * Checks bank verification status, RTP eligibility, and payroll verification.
   */
  private async validateBeforeProcess(): Promise<boolean> {
    const bank = this.selectedBankItem;

    if (!bank) {
      this.alertService.warningAlert({
        content: 'Please select a bank account'
      });
      return false;
    }

    if (!this.card) {
      this.alertService.warningAlert({
        content: 'Please select a credit card'
      });
      return false;
    }

    // Check RTP eligibility
    if (!this.isRtpAllowed && this.selectedPayymentMethod === 12) {
      this.alertService.warningAlert({
        content:
          'RTP is not allowed for this bank account. Please select another bank account.'
      });
      return false;
    }

    // Check bank verification flags set by bankAccountChange setter
    if (
      this.rejectedVerificationWithVerifyInstantly ||
      this.failedVerification
    ) {
      this.alertService.warningAlert({
        content: 'Please verify your bank account'
      });
      return false;
    }

    if (this.rejectedVerification || this.notVerified) {
      this.openBankVerify(bank);
      return false;
    }

    if (this.confirmMicroDeposit || this.verificationPending) {
      this.alertService.warningAlert({
        content: 'Bank account is not verified'
      });
      return false;
    }

    // Re-check bank verified status from actual bank data
    const verifyInstantlyOnly =
      (bank.verifiedBy === 12 || bank.verifiedBy === 6) &&
      bank.achApplicationStatus !== 1;
    const microDepositCondition =
      bank.verifiedBy === 3 && bank.achApplicationStatus !== 1;
    const approvalPendingCondition =
      bank.verifiedBy === 4 && bank.achApplicationStatus !== 1;

    if (verifyInstantlyOnly) {
      const data = {
        title: 'Error',
        content: 'Please verify your bank account',
        doneMsg: 'Verify Now',
        cancelMsg: 'Cancel',
        isCancel: true
      };
      const res = await firstValueFrom(
        this.alertService.warningAlert(data).afterClosed()
      );
      if (res) {
        this.openBankVerifyModal(bank.id);
      }
      return false;
    }

    if (microDepositCondition || approvalPendingCondition) {
      this.alertService.warningAlert({
        content: 'Bank account is not verified'
      });
      return false;
    }

    if (bank.verified === 0) {
      this.openBankVerify(bank);
      return false;
    }

    // Check payroll verified
    if (bank.payrollVerified === 0 && this.payrollStatus !== 1) {
      await this.openStatementVerification(
        bank.id,
        this.payrollService.selectedApp?.id ?? '',
        this.payrollService.selectedApp?.manual
      );
      return false;
    }

    return true;
  }

  /**
   * @description Initiates the payment process for a payroll transaction.
   * First verifies the card's gateway type is valid for the amount via the
   * decide-gateway-by-trans-limit API (service internally gates on
   * creditCardGatewaySwitchingStatus === 3). On success: proceeds with the
   * existing payment flow. On 824 fail: auto-selects the returned duplicate
   * card when present, otherwise shows the Card Verification Required alert.
   */
  processPayment() {
    this.loading = true;
    const { card } = this;
    const amount = Number(this.totalAmount);
    if (
      !amount ||
      !card?.gatewayType ||
      this.paymentsService.isGatewaySkip(card?.cardId)
    ) {
      this.proceedWithPayment();
      return;
    }
    this.subscriptions.push(
      this.paymentsService
        .decideGatewayByTransLimit(amount, Number(card.gatewayType), card.cardId)
        .subscribe({
          next: (res) => {
            if (
              res === 'process_payment' ||
              (typeof res !== 'string' && res?.success)
            ) {
              this.proceedWithPayment();
            }
          },
          error: (err) => {
            if (err.error.errorMsg.errorCode === 824) {
              if (err.error.errorMsg.duplicate_card) {
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
   * Shows the Card Verification Required alert with Verify Now/Cancel. Either way
   * the payroll state is reset and this modal closes; Verify Now additionally
   * triggers the add-card flow on the previous screen, constrained to the gateway
   * type returned by the API.
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
        })
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
                const dialogRef = this.matDialog.open<
                  VerifyCardModalV4Component,
                  IVerifyCardInvoiceDialogData,
                  {
                    success: boolean;
                    data: ICardPaymentReqDocRes;
                    authSign?: string;
                  }
                >(VerifyCardModalV4Component, {
                  width: '480px',
                  disableClose: true,
                  panelClass: 'paddingless-modal-rounded',
                  data: {
                    card,
                    requiredDocuments: res.data.required_docs,
                    amount: this.paymentAmount,
                    invoiceNumber: '',
                    mode,
                    paymentType: 'payroll',
                    payrollId: companyId,
                    companyType
                  }
                });
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

  onSubmit(docs: ICardPaymentReqDocRes, isAgree = 0) {
    const { card } = this;
    const companyType = this.payrollAppDetails.manual ? 'manual' : 'merge';
    const paymentBody = {
      payrollId: this.payrollId,
      companyType,
      processingAmount: this.paymentAmount,
      documents: docs,
      session_key: this.sessionKey ?? '',
      otp_type: this.emailSessionKey ? 'phone' : 'email',
      email_otp_session_key: this.emailSessionKey ?? '',
      phone_otp_session_key: this.phoneSessionKey ?? '',
      document_preview_agree: isAgree
    };
    this.loading = true;
    this.subscriptions.push(
      this.payrollService
        .payrollTransaction(paymentBody, this.payrollAppDetails.id)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (val) => {
            if (val.success) {
              this.paymentsService.clearGatewaySkip();
              this.payrollService.selectedCardId = undefined;
              this.payrollService.resetPayrollDetails.next(true);
              this.dialogRef.close();
              const bankAccountNumber = this.selectedBank
                ? this.selectedBank?.bankAccountNumber ||
                  this.selectedBank?.accountNumber
                : '';
              const bankName = this.selectedBank
                ? this.selectedBank.bankAccountNickName ||
                  this.selectedBank.nickName
                : this.bankNickName;
              this.matDialog.open(PayrollIniatedModalV4Component, {
                width: '95%',
                maxWidth: '515px',
                panelClass: 'paddingless-modal-rounded',
                data: {
                  amount: this.paymentAmount,
                  cardName: card ? card?.nickName : '',
                  cardNumber: card?.cardMasked
                    ? card?.cardMasked.slice(-4)
                    : '',
                  bankAccount: this.selectedBank
                    ? bankAccountNumber.slice(-4)
                    : '',
                  bankName,
                  fee: this.fee,
                  total: this.totalAmount
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
                this.alertService.warningAlert(dialogData).afterClosed()
              );

              if (result) {
                const statementDialgoRef = this.matDialog.open(
                  PayrollStatementVerificationV4Component,
                  {
                    width: '500px',
                    disableClose: true,
                    panelClass: 'paddingless-modal-rounded',
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
              const dialog = this.matDialog.open(OtpModalV4Component, {
                maxWidth: '410px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
                panelClass: 'paddingless-modal-rounded',
                data: {
                  session_key: err.error.session_key,
                  errorMsg: err.error.errorMsg,
                  mode: this.emailSessionKey ? 'phone' : 'email'
                }
              });
              dialog.afterClosed().subscribe((result) => {
                if (result) {
                  if (this.emailSessionKey) {
                    this.phoneSessionKey = err.error.session_key;
                  } else {
                    this.emailSessionKey = err.error.session_key;
                  }
                  this.onSubmit(docs);
                }
              });
            }
            if (err.error.errorCode === '808') {
              const companyId = this.payrollAppDetails.id;
              const selectedCompanyType = this.payrollAppDetails.manual
                ? 'manual'
                : 'merge';
              const sendingData = {
                amount: this.paymentAmount,
                invoiceNumber: null,
                memo: null,
                paymentType: 'payroll',
                authSign: this.authSign,
                cardId: this.card?.cardId ?? '',
                payee_phone: null,
                payees: null,
                mode: 1,
                isSameDay: 0,
                phone_otp_session_key: this.phoneSessionKey ?? '',
                email_otp_session_key: this.emailSessionKey ?? '',
                companyId,
                companyType: selectedCompanyType,
                payrollId: this.payrollId
              };
              const dialog = this.matDialog.open(
                V4CardTransactionDocsPreviewModalComponent,
                {
                  maxWidth: '750px',
                  width: '100%',
                  disableClose: true,
                  autoFocus: false,
                  panelClass: 'paddingless-modal-rounded',
                  data: sendingData
                }
              );
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
