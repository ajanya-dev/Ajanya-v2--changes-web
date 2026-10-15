/* eslint-disable quote-props */
import { DOCUMENT, NgClass, NgFor, NgIf, NgOptimizedImage, SlicePipe } from '@angular/common';
import { Component, computed, ErrorHandler, inject, OnDestroy, OnInit, Renderer2, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { faArrowLeft, faXmarkCircle } from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subject, takeUntil } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { Moengage } from 'src/app/data/data/moengage';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { BankDataV35Service } from 'src/app/modules/bank/bank-v3/v35-services/bank-data-v35.service';
import { ICallBackPayload, IPlaidCallBackRes, IPlaidCallBackResAccount, PlaidService } from '../../service/plaid.service';
import { PlaidConfirmationModalComponent } from '../plaid-confirmation-modal/plaid-confirmation-modal.component';
import { PlaidConfirmationModalV4Component } from '../plaid-confirmation-modal-v4/plaid-confirmation-modal-v4.component';
import { IPlaidExitError, IPlaidMetaData } from '../../model/paid-data';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';

interface PlaidCreateOptions {
  token: string;
  onLoad?: () => void;
  onSuccess: (publicToken: string, metadata: IPlaidMetaData) => void;
  onExit?: (err: IPlaidExitError, metadata: IPlaidMetaData) => void;
  onEvent?: (eventName: "TRANSITION_VIEW" | "EXIT" | "HANDOFF", metadata: IPlaidMetaData) => void;
}

interface PlaidHandler {
  open: () => void;
  destroy: () => void;
}

declare const Plaid: {
  create: (options: PlaidCreateOptions) => PlaidHandler;
};

@Component({
  selector: 'app-plaid-modal',
  standalone: true,
  imports: [
    NgClass,
    NgOptimizedImage,
    ReactiveFormsModule,
    FaIconComponent,
    MatTooltip,
    SlicePipe,
    NgIf,
    NgFor
  ],
  templateUrl: './plaid-modal.component.html',
  styleUrl: './plaid-modal.component.scss'
})
export class PlaidModalComponent implements OnInit, OnDestroy {

  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private plaidHandler: PlaidHandler | null = null; // Store the Plaid handler
  private renderer2 = inject(Renderer2);
  private document = inject<Document>(DOCUMENT);
  private dialogRef = inject(MatDialogRef<PlaidModalComponent>);
  private plaidService = inject(PlaidService);
  private fb = inject(FormBuilder);
  private injectedData: { isVerify?: boolean,selectedBankId?:string;page?:string;sourceType?:number;isV4?:boolean } = inject(MAT_DIALOG_DATA);
  private googleAddressService = inject(GoogleAddressService);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);
  private localStorageService = inject(LocalStorageService);
  private errorHandler = inject(ErrorHandler);
  private bankDataV35Service = inject(BankDataV35Service);
  private dialog = inject(MatDialog);
  private postHogService = inject(PostHogService);
  private isBankAbandonmentTracked = false;
  bankAccService = inject(BankAccountsService);

  private plaidMetaData: IPlaidMetaData | null = null;

  accountsSignal = signal<IPlaidCallBackResAccount[]>([]);
  currentFormIndexSignal = signal<number>(0);

  destroy$ = new Subject();
  addressFormArray: FormArray;

  faXmarkCircle = faXmarkCircle;
  faArrowLeft = faArrowLeft;

  // currentFormIndex = 0;

  loading = false;
  completing = false;
  closed = false;
  isError = false;
  addressMissing = false;
  useSameAddress = false;
  formVisible = true;
  submitted = false;
  errorMessage = 'Something went wrong!';
  subErrorMsg = 'Please try again';

  modalStartTime = performance.now();
  plaidExitReason:string | null = null;
  bankSelected:string|null = null;
  plaidStepsCompleted = 0;
  plaidErrorCode:string|null = null;
  bankSelectedType = null as string | null;
  plaidModalDurationSeconds = 0;

  isPlaidSuccess = signal(false);
  isFirstBankAttempt = signal<boolean>(false);
  bankCountBefore = signal<number>(0);
  isBankSetupInitiated = signal<boolean>(false);
  isBankSetupCancelled = signal<boolean>(false);

  // Define the computed signal
  accountsVisible = computed(() => {
    const accounts = this.accountsSignal(); // Get the current accounts
    const index = this.currentFormIndexSignal(); // Current index
    const totalAccounts = accounts.length;

    if (totalAccounts <= 3) {
      return accounts; // If less than or equal to 3, show all
    }

    // Calculate the start and end indices
    const start = Math.max(0, Math.min(index - 1, totalAccounts - 3));
    const end = start + 3;

    return accounts.slice(start, end);
  });

  PLAID_CDN_LINK = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";


  constructor() {
    this.updateModalStyle();
    this.addressFormArray = this.fb.array([]);
  }

  async ngOnInit(): Promise<void> {
    this.modalStartTime = performance.now();
    this.getBankData();
    try {
      await this.loadPlaid();
      this.getLinkToken();
    this.googleAddressService.resetGoogleAutocompleteAPI();
    } catch (error) {
      /* empty */
    }
  }

  loadPlaid(): Promise<void> {
    this.loading = true;
    return new Promise((resolve, reject) => {
      if (this.isScriptLoaded(this.PLAID_CDN_LINK)) {
        resolve(); // Script already loaded
        return;
      }

      const script = this.renderer2.createElement('script');
      script.type = 'text/javascript';
      script.src = this.PLAID_CDN_LINK;
      script.onload = () => resolve(); // Resolve when script is loaded
      script.onerror = () => reject(new Error('Failed to load Plaid script'));
      this.renderer2.appendChild(this.document.body, script);
    });
  }

  getLinkToken(): void {
    let payload:{updateMode?:boolean,bankId?:string,sourceType?:number}|undefined;
    
    if(this.injectedData?.page === 'bankData'){
      payload = {
        updateMode:true,
        bankId:this.injectedData?.selectedBankId,
        sourceType:this.injectedData?.sourceType
      };
    }else{
      payload = {
        bankId:this.injectedData?.selectedBankId,
        sourceType:this.injectedData?.sourceType||1
      };
    }
    this.plaidService.getLinkToken(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res => {
          if (res.success) {
            const linkToken = res?.data?.token;
            const key = res?.data?.key;
            this.startPlaid(linkToken, key);
          }
        }),
        error: (err) => {

          if (err.error.errorCode === 451) {
            this.loading = false;
            this.isError = true;
          } else if(err.error.errorCode === 'plaid_451') {
            this.loading = false;
            this.isError = true;
            this.errorMessage = 'You have reached the maximum number of attempts.';
            this.subErrorMsg = 'Please try again after some time';
          }else if(err.error.errorCode === 'plaid_452'){
            this.loading = false;
            this.isError = true;
            this.errorMessage = 'You have reached the maximum number of allowed bank accounts. Please contact support to increase the limit.';
            this.subErrorMsg = 'Please try again after some time';
          }else{
            this.loading = false;
            this.isError = true;
            this.errorMessage = 'Something went wrong!';
            this.subErrorMsg = 'Please try again';
            this.dialogRef.close({ success: false });
          }
        }
      });
  }

  startPlaid(linkToken: string, key: string) {
    // Destroy any existing handler before creating a new one
    this.destroyPlaidHandler();
    try {
      this.plaidHandler = Plaid.create({
        token: linkToken,
        onLoad: () => {
          this.loading = false;
          this.trackBankInitiation();
        },
        onSuccess: async (publicToken: string, metadata: IPlaidMetaData) => {
          const payload = {
            public_token: publicToken,
            key,
            institutionName: metadata.institution?.name || null,
            institutionId: metadata.institution?.institution_id || null,
            metadata,
          };
          this.plaidCallBack(payload);
          this.trackError('onSuccess', payload);
        },
        onExit: (err, metadata) => {
          this.trackError('onExit', {err, metadata});
        },
        onEvent: (eventName, metadata) => {
          // Handle specific events if necessary
          switch (eventName) {
            case 'TRANSITION_VIEW':
              this.loading = false;
              break;
            case 'EXIT':
              this.plaidMetaData = metadata;
              this.closed = true;
              this.closeModal();
              break;
            case 'HANDOFF':
              break;
            default:
              break;
          }
        }
      });

      this.plaidHandler.open();
      this.loading = false;
    } catch (error) {
      /* empty */
    }
  }

  /**
   * Its for testing purpose, to track the errors in Sentry.We can remove it later.
   */
  trackError(type: 'onSuccess' | 'onExit' | 'onEvent' | 'callBack', data: unknown): void {
    const userId = this.localStorageService.getItem('userId');
    this.errorHandler.handleError(
      new Error(`PlaidModalComponent: User_Id - ${userId} - Type - ${type} - Data - ${JSON.stringify(data)}`)
    );
  }

  plaidCallBack(payload: ICallBackPayload): void {
    if(this.injectedData?.page === 'bankData') {
      this.dialogRef.close({ success: true });
      return;
    }
    this.loading = true;
    this.plaidService.callBack(payload)
      .pipe(takeUntil(this.destroy$), finalize(() => { this.loading = false; }))
      .subscribe({
        next: (res => {
          this.trackError('callBack', res);
          if (res.success) {
            const payLoad = {
              accounts: res.data.accounts
            };

            if(this.injectedData?.isVerify) {
              this.verifyBankAccount(payLoad);
              return;
            }

            // Check if all Identity_status are true
            const allIdentityStatusTrue = res.data.accounts.every(account => account.Identity_status === true);
            if (allIdentityStatusTrue) {
              this.addressMissing = false;
              this.openConfirmationModal(res.data.accounts);
            } else {
              const accountsWithIds = res.data.accounts
                .filter(item => item.Identity_status === false) // Filter items where Identity_status is false
                .map((item, index) => ({
                  ...item,
                  id: index // Assign a unique ID
                }));
              this.accountsSignal.set(accountsWithIds);

              this.completing = false;
              this.addressMissing = true;
              this.initAddressForms(res.data.accounts);
            }
          }
        }),
        error: (err) => {

          if (err.error.errorCode === 452) {
            this.completing = false;
            this.isError = true;
          }
        }
      });
  }

  createBankAccount(payLoad: { accounts: IPlaidCallBackRes['accounts'] }): void {
    this.addressMissing = false;
    this.completing = true;

    this.plaidService.createBankAccounts(payLoad)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.completing = false; })
      )
      .subscribe({
        next: (res => {
          if (res.success) {
            // Mark as successfully completed to prevent abandonment tracking
            this.isBankSetupCancelled.set(true);
            this.dialogRef.close({ success: true });
            setTimeout(() => {
              if(res.data[0].isVirtualAccount) {
                  this.bankDataV35Service.openVirtualAccountConfirmationModal(res.data[0].id, res.data[0],'plaid');
                }
              }, 1500);
          }
        }),
        error: (err) => {

          if (err.error.errorCode === 453) {
            this.completing = false;
            this.isError = true;
          }
        }
      });
  }

  verifyBankAccount(payLoad: { accounts: IPlaidCallBackRes['accounts'] }): void {
    this.addressMissing = false;
    this.completing = true;

    this.plaidService.verifyBankAccount({...payLoad,selectedBankId:this.injectedData?.selectedBankId as string})
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.completing = false; })
      )
      .subscribe({
        next: (res => {
          if (res.success) { 
            this.isPlaidSuccess.set(true);
            // Mark as successfully completed to prevent abandonment tracking
            this.isBankSetupCancelled.set(true);
            this.dialogRef.close({ success: true });
          }
        }),
        error: (err) => {

          if (err.error.errorCode === 453) {
            this.completing = false;
            this.isError = true;
          }
          if (err.error.errorCode === 450) {
            this.completing = false;
            this.isError = true;
            const alertSvc = this.injectedData?.isV4 ? this.v4AlertService : this.alertService;
            const failedAlertRef = alertSvc.failedAlert({
              content:'Unable to verify your bank details. Double-check your account and routing numbers, or reach out to our support team for assistance.',
              doneMsg: 'Contact Now',
              isCancel: true,
              cancelMsg: 'Not Now'
            });
            failedAlertRef.afterClosed().subscribe((res) => {
              if (res) {
                this.dynamicWhiteLabelService.goToLiveChat();
              }
            });
            this.dialogRef.close({ success: false });
          }
        }
      });
    
  }

  initAddressForms(accounts: IPlaidCallBackResAccount[]): void {
    accounts.forEach((account) => {
      if (!account.Identity_status) {
        const form = this.createAddressForm(account);
        this.addressFormArray.push(form);
      }
    });
  }

  createAddressForm(account: { account_id: number; bank_account_account_name: string; account_number: string; }): FormGroup {
    return this.fb.group({
      account_id: [account.account_id],
      bank_account_name: [account.bank_account_account_name],
      account_number: [account.account_number],
      indentity_status: [false],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', Validators.required],
      country: ['', Validators.required],
    });
  }


  onPrev(): void {
    if (this.currentFormIndexSignal() > 0) {
      this.formVisible = false;
      setTimeout(() => {
        this.currentFormIndexSignal.set(this.currentFormIndexSignal() - 1);
        this.currentFormIndexSignal.set(this.currentFormIndexSignal());

        this.formVisible = true;
      }, 300); // Matches CSS transition duration
    }
  }


  onNext(): void {

    this.submitted = true;
    this.addressFormArray.at(this.currentFormIndexSignal()).markAllAsTouched();

    if (this.addressFormArray.at(this.currentFormIndexSignal()).invalid) {
      return;
    }

    if (this.useSameAddress && this.currentFormIndexSignal() === 0) {
      this.addressFormArray.controls.forEach(control => {
        const currentFormValues = control.value;
        control.patchValue({
            ...currentFormValues,
            identity_status: true
        });
    });
      this.onContinue(); // Skip to the last step directly
      return;
    }

    if (this.currentFormIndexSignal() < this.addressFormArray.length - 1) {
      this.formVisible = false;
      setTimeout(() => {
        this.currentFormIndexSignal.set(this.currentFormIndexSignal() + 1);
        this.currentFormIndexSignal.set(this.currentFormIndexSignal());
        this.formVisible = true;
        this.submitted = false;
      }, 300); // Matches CSS transition duration
    } else {
      this.onContinue();
    }
  }

  onContinue(): void {
    const formData = this.addressFormArray.value;
    this.accountsSignal.set(this.accountsSignal().map((account) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedForm = formData.find((form: any) => form.account_id === account.account_id);
      if (updatedForm) {
        return {
          ...account,
          account_address: updatedForm.address,
          account_city: updatedForm.city,
          account_state: updatedForm.state,
          account_zip: updatedForm.zip,
          account_country: updatedForm.country,
          // Identity_status: true // Mark as true after updating
        };
      }
      return account;
    })
    );

    const payLoad = {
      accounts: this.accountsSignal()
    };
    this.createBankAccount(payLoad);
  }

  toggleUseSameAddress(event: Event): void {
    this.useSameAddress = (event.target as HTMLInputElement).checked;

    if (this.useSameAddress) {
      // Prefill all forms immediately with the current form's address-related values
      const currentValues = this.addressFormArray.at(this.currentFormIndexSignal()).value;
      const addressFields = {
        address: currentValues.address,
        city: currentValues.city,
        state: currentValues.state,
        zip: currentValues.zip,
        country: currentValues.country,
      };

      this.addressFormArray.controls.forEach(control => control.patchValue(addressFields));
    } else {
      // Reset only the address-related fields, leaving other fields intact
      this.addressFormArray.controls.forEach((control, index) => {
        if (index !== 0) {
          control.patchValue({
            address: '',
            city: '',
            state: '',
            zip: '',
            country: '',
          });
        }
      });
    }
  }


  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      // allowedCountries: ['us', 'ca']
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.addressFormArray.at(this.currentFormIndexSignal()).patchValue({
          address: res.address,
          city: res.city,
          state: res.state,
          zip: res.zip,
          country: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  updateModalStyle(): void {
    const backdropElement = document.querySelector(
      '.cdk-global-overlay-wrapper'
    ) as HTMLElement;
    backdropElement.style.paddingBottom = '2%';
  }

  closeModal() {
    if(!this.injectedData?.isVerify && this.plaidMetaData?.exit_status !== 'connected' && this.isBankSetupInitiated() && !this.isBankSetupCancelled()) {
      this.triggerMoengageEvents();
      }
    this.dialogRef.close();
  }

  private isScriptLoaded(src: string): boolean {
    return !!this.document.querySelector(`script[src="${src}"]`);
  }

  private destroyPlaidHandler(): void {
    if (this.plaidHandler) {
      this.plaidHandler.destroy();
      this.plaidHandler = null;
    }
  }

  isCompleted(index: number): boolean {
    // Check if the step at this index is completed
    const form = this.addressFormArray.at(index);
    return form?.valid;
  }

  getBankSelectedType(bankName: string) {
    if(Moengage.creditUnionPatterns.some(pattern => bankName.toLowerCase().includes(pattern))) {
      return 'credit_union';
    }
    if(Moengage.majorPatterns.some(pattern => bankName.toLowerCase().includes(pattern))) {
      return 'major';
    }
    return 'regional';
  }

  getStepsCompleted(status:string): number {
    switch(status) {
      case 'requires_account_selection':
      case 'requires_mfa':
      case 'requires_questions':
      case 'requires_selections':
      case 'requires_code':
        return 3; // Past bank selection, stuck on credentials/MFA
      case 'requires_credentials':
        return 2; // Reached the login screen
      case 'institution_not_found':
        return 1; // User searched for a bank
      default:
        return 0; // Opened and closed immediately
    }
  }

  triggerMoengageEvents(): void {
    if (this.isBankAbandonmentTracked) {
      return;
    }
    this.isBankAbandonmentTracked = true;
    const modalEndTime = performance.now();
    const modalDuration = modalEndTime - this.modalStartTime;
    this.plaidModalDurationSeconds = Math.round((modalDuration / 1000) * 100) / 100;
    this.plaidExitReason = this.plaidMetaData?.exit_status || 'user_exit';
    this.bankSelected = this.plaidMetaData?.institution_name || null;
    this.plaidStepsCompleted = this.getStepsCompleted(this.plaidMetaData?.exit_status as string);
    this.bankSelectedType = this.getBankSelectedType(this.plaidMetaData?.institution_name || '');
    this.plaidErrorCode = this.plaidMetaData?.error_code || null;

    this.postHogService.trackBankSetupAbandoned({
      ...this.postHogService.customerPayloadFromStorage(),
      setup_duration_seconds: Math.round(this.plaidModalDurationSeconds),
      // The spec allows only these two values; Plaid's raw exit_status is
      // kept out of the payload and reduced to whether it errored.
      exit_reason: this.plaidErrorCode ? 'error' : 'user_exit',
      bank_selected: this.bankSelected,
      steps_completed: this.plaidStepsCompleted,
      error_code: this.plaidErrorCode,
      bank_selected_type: this.bankSelectedType,
      bank_add_method: 'instant'
    });
  }

  openConfirmationModal(accountData: IPlaidCallBackResAccount[]): void {
    const dialogConfig = {
      data: {
        accounts: accountData,
      },
      disableClose: true,
      autoFocus: false,
      width: '500px',
      panelClass: this.injectedData?.isV4 ? 'paddingless-modal-rounded' : ''
    };

    const confirmationRef = this.injectedData?.isV4
      ? this.dialog.open(PlaidConfirmationModalV4Component, dialogConfig)
      : this.dialog.open(PlaidConfirmationModalComponent, dialogConfig);

    confirmationRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.createBankAccount({ accounts: result.accounts });
      }
    });
  }


  trackBankInitiation(): void {
    this.isBankSetupInitiated.set(true);
    this.postHogService.trackBankSetupInitiated({
      ...this.postHogService.customerPayloadFromStorage(),
      bank_add_method: 'instant',
      is_first_bank_attempt: this.isFirstBankAttempt(),
      bank_count_before: this.bankCountBefore()
    });
  }

  getBankData(){
    this.bankAccService.getBankAccounts(1, '').pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if(res.success){
          const isFirstBankAttempt = this.isFirstBankAttemptChecker(res?.totalCount || 0, res?.data?.[0]?.fullAccountNumber || '');
          this.isFirstBankAttempt.set(isFirstBankAttempt);
          this.bankCountBefore.set(res?.totalCount || 0);
          // this.trackBankInitiation();
        }
      }
    });
  }

  isFirstBankAttemptChecker(totalCount: number, bankAccountNumber: string | number): boolean {
    if(totalCount === 0) return true;
    if(totalCount === 1 && (bankAccountNumber).toString() === '1111111111') return true;
    return false;
  }

  ngOnDestroy(): void {
    if(this.isBankSetupInitiated() && !this.isBankSetupCancelled() && !this.injectedData?.isVerify && this.plaidMetaData?.exit_status !== 'connected') {
      this.triggerMoengageEvents();
    }
    this.destroyPlaidHandler();
    const existingScript = this.document.querySelector(`script[src="${this.PLAID_CDN_LINK}"]`);
    if (existingScript) {
      this.renderer2.removeChild(this.document.body, existingScript);
    }
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
