import { MatDialog } from '@angular/material/dialog';
import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  output,
  signal,
  ViewChild
} from '@angular/core';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation, faCircleQuestion, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { IV3DropDownOnReady } from 'src/app/models/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  finalize,
  Subject,
  take,
  takeUntil
} from 'rxjs';
import {
  IInternationalBankAccountRequest,
  IInternationalPayeeAccount
} from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { Utils } from 'src/app/data/utils';
import { IApiRes } from 'src/app/models/api';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { IpayeeTypeDetails } from 'src/app/modules/payments/model/payments';
import { Store } from '@ngrx/store';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import { IInternationalCountry, IInternationalPaymentHistory, IWalletInternationaPaymentCreate, IWalletInternationaPaymentAcceptPayload } from 'src/app/models/wallet';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { TitleCasePipe } from '@angular/common';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { AddRecipientModalComponent } from '../../modal/add-recipient-modal/add-recipient-modal.component';
import { WalletInternationalPaymentService } from '../../services/wallet-international-payment.service';
import { InterCompleteComponent } from '../inter-complete/inter-complete.component';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { TransactionLimitCardComponent } from 'src/app/shared/components/transaction-limit-card/transaction-limit-card.component';

@Component({
  selector: 'app-inter-receipient',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FaIconComponent,
    FormsModule,
    V35CommonDropDownSelectorComponent,
    ReactiveFormsModule,
    V35ControlMessageComponent,
    InterCompleteComponent,
    TitleCasePipe,
    TransactionLimitCardComponent
  ],
  templateUrl: './inter-receipient.component.html',
  styleUrl: './inter-receipient.component.scss'
})
export class InterReceipientComponent implements OnInit, OnDestroy {
  public walletDataService = inject(WalletDataV35Service);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private walletService = inject(WalletService);
  private payeeModalService = inject(PayeeModalService);
  private store = inject(Store);
  private walletInternationalPaymentService = inject(WalletInternationalPaymentService);
  private clickTrackingService = inject(ClickTrackingService);
  private personaHelperService = inject(PersonaHelperService);

  @ViewChild('payeeBank') bankdropDown: V35CommonDropDownSelectorComponent;
  @ViewChild('purposeDropdown')
  purposeDropdown: V35CommonDropDownSelectorComponent;
  @ViewChild('limitCard') limitCard: TransactionLimitCardComponent;

  onContinueClick = signal(false);
  complete = output<string>();
  back = output<string>();
  recipient: IPayeeDropdown;
  isLoadBank = signal(false);
  isSourceLoadindg = signal(false);
  isPurposeLoading = signal(false);
  isSubmit = signal(false);
  internationalAccounts = signal<IInternationalPayeeAccount[]>([]);
  sourceList = signal<{ code: string; description: string }[]>([]);
  purposeList = signal<{ code: string; description: string, category: string }[]>([]);
  selectedRecipientBank: string | null = null;
  selectedSource: string | null = null;
  selectedPurpose: string | null = null;
  currentStep = signal('recipient');
  paymentHistory = signal<IInternationalPaymentHistory|undefined>(undefined);
  utils = Utils;
  destroy$ = new Subject();
  isMemoRequired = signal<boolean>(false);
  selectedPurposeCategory = signal<string | null>(null);
  selectedPurposeDescription = signal<string>('Maximum');

  // Source of Funds is only applicable for India and Philippines.
  private readonly sourceOfFundsCountries = ['IN', 'PH'];
  isSourceOfFundsRequired = computed(() => {
    const countryCode = (this.walletDataService.interSelectedCurrencySignal() as IInternationalCountry)?.countryCode;
    return this.sourceOfFundsCountries.includes(countryCode);
  });

  faXmark = faXmark;
  showPayeeDetails = true;
  faCircleExclamation = faCircleExclamation;
  faCircleQuestion = faCircleQuestion;

  recipientForm = new FormGroup({
    source: new FormControl('', [Validators.required]),
    purpose: new FormControl('', [Validators.required]),
    sourceOfCashName: new FormControl(''),
    memo: new FormControl('', [
      Validators.maxLength(50),
      Validators.pattern(/^[A-Za-z0-9 -]+$/)
    ]),
  });

  ngOnInit(): void {
    this.initForm();
    this.applySourceOfFundsValidation();
    if (this.isSourceOfFundsRequired()) {
      this.getSource();
    }
    this.getPurpose();
    this.walletInternationalPaymentService.businessSelected$
    .pipe(takeUntil(this.destroy$))
    .subscribe((businessId) => {
    this.continueToNext(businessId);
  });
  }

  private applySourceOfFundsValidation() {
    const sourceControl = this.recipientForm.controls.source;
    if (this.isSourceOfFundsRequired()) {
      sourceControl.setValidators([Validators.required]);
    } else {
      sourceControl.clearValidators();
      sourceControl.reset('');
      this.recipientForm.controls.sourceOfCashName.reset('');
      this.selectedSource = null;
    }
    sourceControl.updateValueAndValidity({ emitEvent: false });
  }

  getSource() {
    const recipientType = this.walletDataService.internationalPayment()?.recipientType;
    const {countryCode} = (this.walletDataService.interSelectedCurrencySignal() as IInternationalCountry);
    if (!recipientType || !countryCode) return;
    this.isSourceLoadindg.set(true);
    this.walletService
      .getSourceOfCash({countryCode, type: recipientType})
      .pipe(
        finalize(() => this.isSourceLoadindg.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          // Transform the data to a format that works with your dropdown
          const transformedData = res.data.map((item) => {
            const key = Object.keys(item)[0];
            return {
              code: key,
              description: item[key]
            };
          });
          this.sourceList.set(transformedData);
          if (
            this.walletDataService.internationalPaymentPayloadSignal()
              ?.sourceOfCash
          ) {
            this.selectedSource = transformedData.find((item) => item.code === this.walletDataService.internationalPaymentPayloadSignal()?.sourceOfCash)?.description as string;
          }
        }
      });
  }

  getPurpose() {
    const recipientType = this.walletDataService.internationalPayment()?.recipientType;
    const {countryCode} = (this.walletDataService.interSelectedCurrencySignal() as IInternationalCountry);
    if (!recipientType || !countryCode) return;
    this.isPurposeLoading.set(true);
    this.walletService
      .getPurpose({countryCode, type: recipientType})
      .pipe(
        finalize(() => this.isPurposeLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          // Transform the data to a format that works with your dropdown
          const transformedData = res.data.map((item) => {
            const key = Object.keys(item)[0];
            return {
              code: key,
              description: item[key],
              category: item.category
            };
          });
          this.purposeList.set(transformedData);
          if (
            this.walletDataService.internationalPaymentPayloadSignal()?.purpose
          ) {
            const selectedPurposeCode =
              this.walletDataService.internationalPaymentPayloadSignal()?.purpose;
            this.selectedPurpose = transformedData.find((item) => item.code === selectedPurposeCode)?.description as string;
            const selectedPurpose = transformedData.find(
              (item) => item.code === selectedPurposeCode
            );
            this.applyPurposeCategoryValidation(selectedPurpose?.category ?? null);
            this.selectedPurposeDescription.set(
              selectedPurpose?.description || 'Maximum'
            );
          }
        }
      });
  }

  initForm() {
    if(this.walletDataService.internationalPaymentPayloadSignal()?.memo) {
      this.recipientForm.controls.memo.setValue(this.walletDataService.internationalPaymentPayloadSignal()?.memo as string || '');
    }
    if(this.walletDataService.internationalPaymentPayloadSignal()?.sourceOfCash) {
      this.recipientForm.controls.source.setValue(this.walletDataService.internationalPaymentPayloadSignal()?.sourceOfCash as string || '');
    }
    if(this.walletDataService.internationalPaymentPayloadSignal()?.purpose) {
      this.recipientForm.controls.purpose.setValue(this.walletDataService.internationalPaymentPayloadSignal()?.purpose as string || '');
    }
    if(this.walletDataService.internationalPaymentPayloadSignal()?.sourceOfCashName) {
      this.recipientForm.controls.sourceOfCashName.setValue(this.walletDataService.internationalPaymentPayloadSignal()?.sourceOfCashName as string || '');
    }
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  clearRecipient() {
    this.internationalAccounts.set([]);
    this.selectedRecipientBank = null;
    this.walletDataService.internationalPayment.update((value) => ({
      ...value,
      selectedRecipient: null
    }));
    this.showPayeeDetails = false;
  }

  clearBank(){
    this.internationalAccounts.set([]);
    this.selectedRecipientBank = null;
    this.walletDataService.internationalPayment.update((value) => ({
      ...value,
      selectedRecipient: {
        ...((value.selectedRecipient || {}) as IPayeeDropdown),
        bank: null
      }
    }));
  }

  changeBank(event: string) {
    const selectedBank = JSON.parse(event) as IInternationalPayeeAccount;
    if (selectedBank !== null) {
      this.selectedRecipientBank = `${selectedBank?.bank_name} - ${Utils.getMaskedAcNo(String(selectedBank?.account_number))}`;
    } else {
      this.selectedRecipientBank = null;
    }
    this.walletDataService.internationalPayment.update((value) => ({
      ...value,
      selectedRecipient: {
        ...((value.selectedRecipient || {}) as IPayeeDropdown),
        bank: selectedBank
      }
    }));
  }

  addNewRecipientBank(isEdit = false) {
    if (!this.walletDataService?.interSelectedRecipientSignal()?.encryptedId) {
      return;
    }
    const selectedRecipient = this.walletDataService?.interSelectedRecipientSignal();
    const dialogRef = this.dialog.open(AddRecipientModalComponent, {
      maxWidth: '95%',
      width: '700px',
      disableClose: true,
      data: {
        editMode: isEdit,
        id: this.walletDataService?.interSelectedRecipientSignal()?.encryptedId,
        bankAcId: isEdit
          ? this.walletDataService?.interSelectedRecipientSignal()?.bank?.encrypted_id
          : undefined,
        payeeEmail: selectedRecipient?.email,
        payeePhone: selectedRecipient?.phone
      }
    });

    dialogRef
      .afterClosed()
      .subscribe((response: IApiRes<IInternationalBankAccountRequest>) => {
        if (response.success) {
          this.selectedRecipientBank = '';
          const newInternationalPayeeBancAc: IInternationalPayeeAccount = {
            payee_id:
              this.walletDataService?.interSelectedRecipientSignal()
                ?.encryptedId,
            bank_name: response.data.bankName,
            account_number: response.data.accountNumber,
            swift_or_bic: response.data.identifierCode,
            account_type: response.data.accountType,
            bank_identifier_type: response.data.identifierType,
            bank_identifier_code: response.data.identifierCode,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            encrypted_id: response.data.id!,
            beneficiary: response.data.beneficiary,
            beneficiaryBankDetails: response.data.beneficiaryBankDetails,
            ifsc: response.data.ifsc
          };
          this.internationalAccounts.update((currentAccounts) => [
            ...currentAccounts,
            newInternationalPayeeBancAc
          ]);
          this.setDefaultBank(newInternationalPayeeBancAc);
          this.alertService.successAlert({
            title: 'Success',
            content: `Bank account ${isEdit ? 'updated' : 'added'} successfully`,
            close: true
          });
        }
      });
  }

  setDefaultBank(selectedBank: IInternationalPayeeAccount) {
    if (!selectedBank) return;
    const currentBank =
      this.walletDataService.interSelectedRecipientSignal()?.bank;
    // Compare the selected bank with the current bank using JSON.stringify
    if (
      currentBank &&
      JSON.stringify(selectedBank) === JSON.stringify(currentBank)
    ) {
      this.selectedRecipientBank = `${currentBank?.bank_name} - ${this.utils.getMaskedAcNo(
        currentBank.account_number
      )}`;
      return;
    }

    this.selectedRecipientBank = `${selectedBank?.bank_name} - ${this.utils.getMaskedAcNo(
      selectedBank.account_number
    )}`;

    this.walletDataService.internationalPayment.update((value) => ({
      ...value,
      selectedRecipient: {
        ...((value.selectedRecipient || {}) as IPayeeDropdown),
        bank: selectedBank
      }
    }));
  }

  changeSource(event: string) {
    if (!event) {
      this.selectedSource = null;
      this.recipientForm.controls.source.setValue('');
      this.recipientForm.controls.sourceOfCashName.setValue('');
      this.recipientForm.controls.source.markAsTouched();
      return;
    }
    const selectedSource = JSON.parse(event) as {
      code: string;
      description: string;
    };
    this.recipientForm.controls.source.setValue(selectedSource.code);
    this.recipientForm.controls.sourceOfCashName.setValue(selectedSource.description);
  }

  changePurpose(event: string) {
    this.limitCard?.clearState();
    if (!event) {
      this.selectedPurpose = null;
      this.recipientForm.controls.purpose.setValue('');
      this.applyPurposeCategoryValidation(null);
      this.recipientForm.controls.purpose.markAsTouched();
      return;
    }
    const selectedPurpose = JSON.parse(event) as {
      code: string;
      description: string;
      category: string;
    };
    this.applyPurposeCategoryValidation(selectedPurpose.category);
    this.recipientForm.controls.purpose.setValue(selectedPurpose.code);
    this.selectedPurposeDescription.set(
      selectedPurpose.description || 'Maximum'
    );
    // The limit check runs on Continue (after memo & other required fields are filled), not on purpose selection.
  }

  /** Continue: validate the form, then run the transaction-limit check; proceed to accept only if it passes. */
  onContinue(): void {
    this.recipientForm.markAllAsTouched();
    if (this.recipientForm.invalid) return;
    const purposeCode = this.recipientForm.controls.purpose.value;
    if (!purposeCode) return;
    this.limitCard?.checkLimit(purposeCode, undefined, () =>
      this.continueToNext()
    );
  }

  /** The backend rejected the limit check for the chosen purpose (e.g. memo required): clear the purpose selection so the user must re-pick. */
  onPurposeLimitError(): void {
    this.selectedPurpose = null;
    this.recipientForm.controls.purpose.setValue('');
    this.applyPurposeCategoryValidation(null);
    this.purposeDropdown?.clearSelection();
    this.limitCard?.clearState();
  }

  /** Re-creates the quote on the limit card's amountUpdated event so later steps use the new quote_id and amount. */
  onLimitCardAmountUpdated(event: {
    amount: number;
    quote: IWalletInternationaPaymentCreate;
  }): void {
    this.walletDataService.internationalPayment.update((value) => ({
      ...value,
      selectedAmount: {
        amount: event.amount,
        totalAmount: Number(event.quote.receiving_amount),
        exchangeRate: Number(
          parseFloat(event.quote.customer_exchange_rate).toFixed(2)
        ),
        quoteId: event.quote.quote_id,
        isReceivingAmount: 0
      },
      version: event.quote.version || value.version
    }));
  }

  private applyPurposeCategoryValidation(category: string | null) {
    this.isMemoRequired.set(category === 'trade');
    const memoControl = this.recipientForm.get('memo');
    memoControl?.setValidators([
      ...(this.isMemoRequired() ? [Validators.required] : []),
      Validators.maxLength(50),
      Validators.pattern(/^[A-Za-z0-9 -]+$/)
    ]);
    memoControl?.updateValueAndValidity({ emitEvent: false });
    this.selectedPurposeCategory.set(category);
  }

  onMemoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^A-Za-z0-9 -]/g, '');
    this.recipientForm.controls.memo.setValue(input.value);
  }

  goBack() {
    this.back.emit('country-amount');
  }

  continueToNext(businessId?:string, isProceedPayment?: '0' | '1'): void {
    this.recipientForm.markAllAsTouched();
    if (this.recipientForm.invalid) return;
    this.limitCard?.was305Cancelled.set(false);
    const effectiveProceed: '0' | '1' =
      isProceedPayment ?? this.limitCard?.proceedPayment() ?? '0';
    const formValue = this.recipientForm.value;
    const recipientType = this.walletDataService.internationalPayment()?.recipientType;
    const payload: IWalletInternationaPaymentAcceptPayload = {
      payeeId: this.walletDataService?.interSelectedRecipientSignal()?.id as string,
      payeeInternationalBankaccountId: this.walletDataService?.interSelectedRecipientSignal()?.bank?.encrypted_id as string,
      walletId: this.walletDataService.interSelectedWalletSignal()?.uuId as string,
      quoteId: this.walletDataService.interAmountSignal()?.quoteId as string,
      amount: this.walletDataService.interAmountSignal()?.amount as number,
      purpose: formValue.purpose as string,
      purpose_category: this.selectedPurposeCategory() as string,
      country: (this.walletDataService.interSelectedCurrencySignal() as IInternationalCountry).countryCode,
      businessId,
      memo: formValue.memo as string,
      type: recipientType as string,
      version: this.walletDataService.internationalPayment()?.version as string,
      isProceedPayment: effectiveProceed
    };
    // Source of Funds is only sent for India and Philippines.
    if (this.isSourceOfFundsRequired()) {
      payload.sourceOfCash = formValue.source as string;
      payload.sourceOfCashName = formValue.sourceOfCashName as string;
    }
    this.isSubmit.set(true);
    this.walletService
      .acceptQoute(payload)
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next:(res) => {
          if(res.success){
            this.paymentHistory.set(res.data);
            this.currentStep.set('Summary');
            this.walletDataService.internationalPayment.set({
              selectedWallet: null,
              selectedCurrency: null,
              selectedAmount: null,
              selectedRecipient: null,
              recipientType: null,
              version: null
            });
            this.clickTrackingService.trackInternationalPaymentTransactionDoneClick(res.data.transaction_id).pipe(take(1)).subscribe();
          }
        },
        error:(err:HttpErrorResponse) => {
          this.clickTrackingService.trackInternationalPaymentTransactionNotDoneClick().pipe(take(1)).subscribe();
          if ( err?.error?.errorCode === 305) {
            this.limitCard?.isAwaiting305Confirmation.set(true);
            const dialog = this.alertService.confirmAlert({
              content:
                err?.error?.errorMsg ||
                'Transaction limit reached. Do you want to proceed?',
              doneMsg: 'Proceed',
              cancelMsg: 'Cancel',
              isShowAsHtml:true
            });
            dialog.afterClosed().subscribe((result) => {
              this.limitCard?.isAwaiting305Confirmation.set(false);
              if (result) {
                this.limitCard?.proceedPayment.set('1');
                this.continueToNext(businessId, '1');
              } else {
                this.limitCard?.was305Cancelled.set(true);
              }
            });
            return;
          }
          if (err?.error?.errorCode === 312) {
            this.limitCard?.transactionLimitMessage.set(
              err?.error?.errorMsg ||
                'Transaction limit exceeded for this purpose.'
            );
            return;
          }
          if(err.error.errorCode && (err.error.errorCode !== 214 && err.error.errorCode !== '112' && err.error.errorCode !== 541) ){
            const errMsg= err.error.errorCode===250 ? `Please map your wallet with business` : err.error.errorMsg;
            const alert = this.alertService.failedAlert(
              {
                content:errMsg,
                doneMsg:'Update',
                isCancel:true
              }
            );
            alert.afterClosed().subscribe((res) => {
              if(res){
                switch (err.error.errorCode) {
                  case '266':
                    this.walletInternationalPaymentService.onEditPayee();
                    break;
                  case '267':
                    this.walletInternationalPaymentService.addNewRecipientBank(true);
                    break;
                    case '268':
                    this.walletInternationalPaymentService.addNewRecipientBank(true);
                    break;
                    case '269':
                    this.walletInternationalPaymentService.addNewRecipientBank(true);
                    break;
                    case 250:
                    case '250':
                    this.walletInternationalPaymentService.addWalletToBusiness(this.walletDataService.interSelectedWalletSignal()?.uuId as string);
                    break;
                  default:
                    break;
                }
              }
            });
          }
          if(err.error.errorCode === '112'){
            this.openOtpModal(err.error,businessId);
          }
          if(err.error.errorCode === 541){
            this.onBusinessVerification(err.error.errorMsg);
          }
        }
      });
  }

  openOtpModal(error: string,businessId?:string): void {
    const dialog = this.dialog.open(OtpModalComponent, {
      maxWidth: '410px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: error
    });
    dialog.afterClosed().subscribe((result) => {
      if (result) {
        this.continueToNext(businessId);
      }
    });
  }

  onEditPayee(): void {
    this.payeeModalService
      .openEditPayee(
        this.walletDataService?.interSelectedRecipientSignal()
          ?.encryptedId as string,
        undefined,
        {
          edit: true,
          id: this.walletDataService?.interSelectedRecipientSignal()
            ?.encryptedId as string
        }
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((payeeModal) => {
        if (payeeModal) {
          payeeModal
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe((result) => {
              if (result?.id) {
                // Map the API response to the IPayeeDropdown structure
                const updatedPayee: IPayeeDropdown = {
                  id: result.id,
                  name: result.name,
                  nickName: result.nickName,
                  phone: result.phone,
                  addressLine1: result.addressLine1,
                  addressLine2: result.addressLine2,
                  city: result.city,
                  company: result.company,
                  country: result.country,
                  email: result.email,
                  encryptedId: result.id,
                  state: result.state,
                  zip: result.zip,
                  payeeIdNumber: result.payeeIdNumber,
                  payeeTypeId: result.payeeTypeId,
                  createdAt: '',
                  typeDetails: {} as IpayeeTypeDetails,
                  merchantCategory: result.merchantCategory
                };
                this.store.dispatch(
                  payeesActions.addUpdatedPayeeIntoPayees({
                    payee: updatedPayee
                  })
                );

                // Update the wallet data service with the new payee details
                // Keep the existing bank details if they exist
                this.recipient = updatedPayee;
                this.walletDataService.internationalPayment.update((value) => {
                  const currentRecipient = value.selectedRecipient;
                  return {
                    ...value,
                    selectedRecipient: {
                      ...updatedPayee,
                      bank: currentRecipient?.bank as IInternationalPayeeAccount
                    }
                  };
                });
              }
            });
        }
      });
  }

  onNextClick(step: string){
    this.complete.emit(step);
  }

  onBusinessVerification(message: string):void{
    this.alertService.warningAlert({
      title: 'Business Verification Required',
      content: message,
      doneMsg: 'Verify Now',
      cancelMsg: 'Cancel',
      isCancel: true
    }).afterClosed().subscribe((res) => {
      if(res){
        this.personaHelperService.openModal('kyc_kyb', CVSourceType.add_new_business).subscribe();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
