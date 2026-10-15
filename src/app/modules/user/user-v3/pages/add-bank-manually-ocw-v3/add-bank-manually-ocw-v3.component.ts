import { Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Location, NgClass } from '@angular/common';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { Utils } from 'src/app/data/utils';
import { signatureUploadPanelComponent } from 'src/app/shared/components/upload-panel/signature-upload-panel/signature-upload-panel.component';
import { TooltipPosition, MatTooltip } from '@angular/material/tooltip';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { finalize, Subscription, take } from 'rxjs';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { BankVerifyModalComponent } from 'src/app/shared/bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import { IConfirmAlert } from 'src/app/models/alert';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PayeeOnboardingService } from 'src/app/modules/payee-onboarding/services/payee-onboarding.service';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import { Store } from '@ngrx/store';
import { IBankDropdown } from 'src/app/models/bank';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { environment } from 'src/environments/environment';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { Moengage } from 'src/app/data/data/moengage';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from '../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { StepperV35Component } from '../../../../../shared/v3/common-components/stepper-v35/stepper-v35.component';
import { CommonBackButtonV35Component } from '../../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonStateSelectComponent } from 'src/app/shared/v3/common-state-select/common-state-select.component';

@Component({
  selector: 'app-add-bank-manually-ocw-v3',
  templateUrl: './add-bank-manually-ocw-v3.component.html',
  styleUrls: ['./add-bank-manually-ocw-v3.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    StepperV35Component,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    V35ControlMessageComponent,
    CommonButtonV35Component,
    MatTooltip,
    FaIconComponent,
    CommonStateSelectComponent
  ]
})
export class AddBankManuallyOcwV3Component implements OnInit, OnDestroy {
  /**
   * dependency injection using inject method
   */
  location = inject(Location);
  dialog = inject(MatDialog);
  fb = inject(FormBuilder);
  alertService = inject(AlertService);
  googleAddressService = inject(GoogleAddressService);
  bankAccService = inject(BankAccountsService);
  private postHogService = inject(PostHogService);
  private gettingStartedService = inject(GettingStartedService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private headerService = inject(HeaderService);
  private payeeOnboardingService = inject(PayeeOnboardingService);
  private store = inject(Store);
  private localStorageService = inject(LocalStorageService);
  isOlliePay = environment.env_id === 'olliepay';

  /** variables* */
  step2 = false;
  backButton = true;
  step1Completed = false;
  nextClick = false;
  country = 'USA';

  get countryCode(): 'US' | 'CA' {
    return this.country === 'CANADA' ? 'CA' : 'US';
  }
  bankForm: FormGroup;
  signaturePadImg = '';
  signatureUrl: string;
  subscriptions: Subscription[] = [];
  bankFieldsShow = false;
  instructionUrl =
    'https://support.onlinecheckwriter.com/portal/kb/articles/how-can-i-add-canadian-bank-account?_ga=2.2609654.759006251.1643345001-229776703.1642395128';

  transNumber: string;

  positionOptions: TooltipPosition[] = [
    'after',
    'before',
    'above',
    'below',
    'left',
    'right'
  ];

  signClosePosition = new FormControl(this.positionOptions[5]);
  utils = Utils;
  queryParams: { templete_type: string };
  loading = false;
  logoUrl: string;
  returnUrl: string;
  bankHolderAddressSearch: string;

  bankManualInitiatedTime = performance.now();
  stepsCompleted = signal(0);
  selectedBankName = signal<string | null>(null);
  isBankSetupCancelled = signal<boolean>(false);
  isFirstBankAttempt = signal<boolean>(false);
  bankCountBefore = signal<number>(0);
  isBankSetupInitiated = signal<boolean>(false);
  destroy$ = inject(DestroyRef);

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams?.returnUrl;
    this.bankManualInitiatedTime = performance.now();
    this.checkFromInit();
    this.getBankData();
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }

  validationSet(value: string) {
    if (value === 'USA') {
      this.bankForm.controls.routingNumber.setValidators(Validators.required);
      this.bankForm.controls.transitNumber.clearValidators();
      this.bankForm.controls.finantialInstNumber.clearValidators();
    } else if (value === 'CANADA') {
      this.bankForm.controls.transitNumber.setValidators(Validators.required);
      this.bankForm.controls.finantialInstNumber.setValidators(
        Validators.required
      );
      this.bankForm.controls.routingNumber.clearValidators();
    }
    this.bankForm.controls.routingNumber.updateValueAndValidity();
    this.bankForm.controls.transitNumber.updateValueAndValidity();
    this.bankForm.controls.finantialInstNumber.updateValueAndValidity();
  }

  checkFromInit() {
    this.bankForm = this.fb.group({
      // company details
      businessName: new FormControl('', [
        Validators.required,
        ValidationService.personNameValidator,
        Validators.minLength(5)
      ]),
      mainAddressLineOne: new FormControl('', [Validators.required]),
      mainAddressLineTwo: new FormControl(''),
      companyCity: new FormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      companyState: new FormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      companyZip: new FormControl('', [
        Validators.required,
        ValidationService.zipValidator,
        ValidationService.noWhitespaceValidator
      ]),

      // bank details
      bankAccountName: new FormControl('', [Validators.required]),
      bankAddress: new FormControl('', [Validators.required]),
      bankCity: new FormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      bankState: new FormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      bankZip: new FormControl('', [
        Validators.required,
        ValidationService.zipValidator
      ]),
      checkNumber: new FormControl(''),
      fractionalNumber: new FormControl(''),
      bankAccountType: new FormControl(''),

      routingNumber: new FormControl('', [
        Validators.required,
        ValidationService.routingNumberValidator,
        Validators.minLength(9),
        Validators.maxLength(9)
      ]),
      accountNumber: new FormControl('', [
        Validators.required,
        Validators.minLength(5)
      ]),
      transitNumber: new FormControl(''),
      finantialInstNumber: new FormControl(''),
      nickName: new FormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ])
    });
  }

  checkFromSubmit() {
    if (this.bankForm.invalid) {
      this.bankForm.markAllAsTouched();
      return;
    }

    let customizeTemplateForCheckDesignId;

    if (this.queryParams?.templete_type === '17') {
      customizeTemplateForCheckDesignId = '3';
    }
    const checkBody = this.createCheckBody();

    this.saveAccount(checkBody, customizeTemplateForCheckDesignId);
  }

  createCheckBody() {
    const formData = new FormData();
    if (this.signatureUrl !== '' && this.signatureUrl !== undefined) {
      formData.append('signatureUrl', this.signatureUrl);
    }
    if (this.logoUrl !== '' && this.logoUrl !== undefined) {
      formData.append('logoUrl', this.logoUrl);
    }
    formData.append('bankAccountNickName', this.getCheckFormValue('nickName'));
    formData.append(
      'bankAccountAddressLine1',
      this.getCheckFormValue('mainAddressLineOne')
    );
    formData.append(
      'bankAccountAddressLine2',
      this.getCheckFormValue('mainAddressLineTwo')
    );
    formData.append('bankAccountCity', this.getCheckFormValue('companyCity'));
    formData.append('bankAccountName', this.getCheckFormValue('businessName'));
    formData.append(
      'bankAccountNumber',
      this.getCheckFormValue('accountNumber')
    );
    formData.append('bankAccountState', this.getCheckFormValue('companyState'));
    formData.append('bankAccountZip', this.getCheckFormValue('companyZip'));
    formData.append('bankAddress1', this.getCheckFormValue('bankAddress'));
    formData.append('bankCity', this.getCheckFormValue('bankCity'));
    formData.append('bankState', this.getCheckFormValue('bankState'));
    formData.append('bankName', this.getCheckFormValue('bankAccountName'));
    formData.append('checkSerialNumber', this.getCheckFormValue('checkNumber'));
    formData.append(
      'bankRoutingNumber',
      this.getCheckFormValue('routingNumber')
    );
    formData.append('bankZip', this.getCheckFormValue('bankZip'));
    formData.append(
      'bankAccountType',
      this.getCheckFormValue('bankAccountType')
    );
    formData.append('transitNumber', this.getCheckFormValue('transitNumber'));
    formData.append(
      'financialNumber',
      this.getCheckFormValue('finantialInstNumber')
    );
    formData.append('country', this.country);
    formData.append('bankIdentity', this.getCheckFormValue('fractionalNumber'));

    return formData;
  }

  saveAccount(checkBody: FormData, checkDesignId: string | undefined) {
    this.loading = true;
    this.subscriptions.push(
      this.bankAccService
        .AddBank(checkBody)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              // Mark bank as successfully added to prevent abandonment tracking
              this.isBankSetupCancelled.set(true);
              this.localStorageService.updateNestedData('gettingStartedData', 'bankAccount', 1);
              this.gettingStartedService.updatedGettingStartedData = 2;
              this.headerService.refreshDynamicHeader.next(true);
              this.headerService.setNotificationValueChanged(true);
              if (
                this.payeeOnboardingService.payeeOnboardingSignal()
                  ?.initiatedFrom === 'directDepositReceiving'
              ) {
                this.verifyBankForDirectDeposit(
                  res.data?.id,
                  this.payeeOnboardingService.payeeOnboardingSignal()
                    .externalToken ?? ''
                );
                return;
              }

              if (!res.data.is_neo_bank && this.country === 'USA') {
                const verifyData: IConfirmAlert = {
                  title: 'Verify this bank account?',
                  content:
                    'Verify the bank account through convenient method and unlock all payment methods.',
                  doneMsg: 'Verify Now',
                  cancelMsg: 'Do Later',
                  icon: 'success'
                };

                const verifyResponse =
                  this.alertService.confirmAlert(verifyData);
                verifyResponse.afterClosed().subscribe((result) => {
                  if (result) {
                    this.dialog
                      .open(BankVerifyModalComponent, {
                        maxWidth: '500px',
                        width: '95%',
                        data: {
                          encrypted_bankacc_id: res.data.id,
                          bank_account_account_number:
                            res.data.bankAccountNumber
                        },
                        disableClose: true
                      })
                      .afterClosed()
                      .subscribe((afterCloseResponse) => {
                        if (
                          afterCloseResponse?.phoneAndEmailVerified === false
                        ) {
                          return;
                        }
                        this.redirectPage();
                      });
                  } else {
                    this.redirectPage();
                  }
                });
              } else {
                this.alertService.successAlert({
                  title: 'Success',
                  content: 'The bank account has been added successfully.',
                  timeout: 3000
                });
                this.redirectPage();
              }
              const bankAccount = {
                accountNumber: `xxxx${res.data.bankAccountNumber.slice(-4)}`,
                achApplicationStatus: '',
                bankName: res.data.bankName,
                cashAccount: 0,
                id: res.data.id,
                isItZil: 0,
                mAch: 0,
                name: res.data.bankAccountName,
                nickName: res.data.bankAccountNickName,
                routingNumber: res.data.routingNumber,
                status: '',
                statusDescription: '',
                verifiedBy: '',
                verified: 0
              } as unknown as IBankDropdown;
              this.store.dispatch(
                bankAccountsActions.addCreatedBankAccountIntoBankAccounts({
                  bankAccount
                })
              );
            }
          },
          error: (err) => {
    
            if (err?.error?.errorCode === 987) {
              const data: IConfirmAlert = {
                title: 'The Bank Account already exist.',
                content: 'Would You Like To Add It Again',
                doneMsg: 'Yes',
                cancelMsg: 'No'
              };
              const response = this.alertService.confirmAlert(data);
              response.afterClosed().subscribe((result) => {
                if (result) {
                  checkBody.append('allowDuplicate', '1');
                  this.saveAccount(checkBody, checkDesignId);
                }
              });
            }
          }
        })
    );
  }

  /**
   * redirects to appropriate pages with available data.
   */
  redirectPage() {
    if (this.returnUrl) {
      this.router.navigate([this.returnUrl]);
    } else {
      this.router.navigate(['/manage/verification/index']);
    }
  }

  showFields() {
    this.nextClick = true;
  }

  onSuccessAlert() {
    const data = {
      close: true,
      timeout: 2000,
      title: 'Success!',
      content: 'Bank Account Added.'
    };
    this.alertService.successAlert(data);
  }

  onCountrySelect(country: string) {
    if (country === this.country) {
      return;
    }
    this.country = country;
    // USA and CANADA share one accountNumber control but allow different
    // characters, so a value carried across the toggle can be uneditable.
    this.bankForm.controls.accountNumber.reset('');
    this.validationSet(country);
    this.googleAddressService.updateCountryRestriction([
      country === 'CANADA' ? 'ca' : 'us'
    ]);
  }

  onNextClick() {
    this.nextClick = true;
    if (this.stepOneComplete()) {
      this.step1Completed = true;
      this.step2 = true;
      this.stepsCompleted.set(1);
    }
  }

  stepOneComplete(): boolean {
    if (
      !this.country ||
      this.bankForm.controls.businessName.invalid ||
      this.bankForm.controls.mainAddressLineOne.invalid ||
      this.bankForm.controls.companyCity.invalid ||
      this.bankForm.controls.companyState.invalid ||
      this.bankForm.controls.companyZip.invalid
    ) {
      this.bankForm.controls.businessName.markAsTouched();
      this.bankForm.controls.mainAddressLineOne.markAsTouched();
      this.bankForm.controls.companyCity.markAsTouched();
      this.bankForm.controls.companyState.markAsTouched();
      this.bankForm.controls.companyZip.markAsTouched();
      this.step1Completed = false;
      return false;
    }
    return true;
  }

  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: [this.country === 'CANADA' ? 'ca' : 'us']
    });
    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.nextClick = true;
        this.bankForm.patchValue({
          mainAddressLineOne: res.address,
          companyCity: res.city,
          companyState: res.state,
          companyZip: res.zip
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  loadBankGoogleAddress(
    address: HTMLInputElement | string,
    addressInstance: number
  ) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address as HTMLInputElement,
      allowedCountries: [this.country === 'CANADA' ? 'ca' : 'us'],
      addressInstance
    });
    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.bankForm.patchValue({
          bankAddress: res.address,
          bankCity: res.city,
          bankState: res.state,
          bankZip: res.zip
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description On every input in routing number this method checks if routing number is valid
   * and if its valid it will retrieve bank ac details of curresponding routing number and autopopulates bank details fields.
   */
  setBankDetailsUsingRoutingNumberSubscription() {
    if (this.bankForm.controls.routingNumber.value.length === 9) {
      const routingNumber = this.bankForm.controls.routingNumber.value;
      if (
        this.bankForm.controls.routingNumber.valid &&
        this.country === 'USA'
      ) {
        this.subscriptions.push(
          this.bankAccService
            .getroutingNumber(routingNumber)
            .pipe(take(1))
            .subscribe(
              (res) => {
                const bank_details = res.data;
                this.selectedBankName.set(bank_details.name);
                this.bankForm.patchValue({
                  bankAccountName: bank_details.name,
                  bankAddress: bank_details.address,
                  bankCity: bank_details.city,
                  bankState: bank_details.state,
                  bankZip: bank_details.zip
                });
                this.bankFieldsShow = true;
              },
              () => {
                this.bankFieldsShow = true;
              }
            )
        );
      }
      this.bankForm.controls.transitNumber.setValue('');
    } else {
      this.bankForm.patchValue({
        bankAccountName: '',
        bankAddress: '',
        bankCity: '',
        bankState: '',
        bankZip: ''
      });
      this.bankFieldsShow = false;
    }
  }

  getCheckFormValue(name: string) {
    return this.bankForm.get(name)?.value;
  }

  openSignModal() {
    const signature_area =
      document.querySelector<HTMLInputElement>('.signature_area')!;
    const dialogRef = this.dialog.open(signatureUploadPanelComponent, {
      maxWidth: '690px',
      width: '93%',
      panelClass: 'upload_panel_wrapper',
      minHeight: '410px',
      disableClose: true,
      data: signature_area
    });
    dialogRef.afterClosed().subscribe((signImg) => {
      //= =====> Sign tip msg
      sessionStorage.setItem('signTipVal', JSON.stringify(false));
      this.signatureUrl = signImg.signatureUrl;
      if (signImg) {
        if (signImg.signPad) {
          this.signaturePadImg = signImg.signPad;
        }
        if (signImg.existSign) {
          this.signaturePadImg = signImg.existSign;
          this.signatureUrl = signImg.existSign;
        }
        if (signImg.uploadSign) {
          this.signaturePadImg = signImg.uploadSign;
        }
        if (signImg.digitalSign) {
          this.signaturePadImg = signImg.digitalSign;
        }
      }
    });
  }

  removeSign() {
    this.signaturePadImg = '';
  }

  onBackClick(): void {
    if (this.step2) {
      this.step2 = false;
    } else {
      this.isBankSetupCancelled.set(true);
      const step = this.stepOneComplete() ? 1 : 0;
      this.stepsCompleted.set(step);
      this.triggerBankSetupAbandoned();
      this.location.back();
    }
  }

  get bankInstruction() {
    return 'https://support.onlinecheckwriter.com/portal/kb/articles/how-can-i-add-canadian-bank-account?_ga=2.2609654.759006251.1643345001-229776703.1642395128';
  }

  /**
   * @description Method to send micro deposit request to verify bank account while payee directly onboarding the application via direct payment received notification link from email.
   * @param bankAccountId - Bank account ID.
   * @param externalLink - `externalToken` received as query param in direct mail link.
   */
  verifyBankForDirectDeposit(
    bankAccountId: string,
    externalLogin: string
  ): void {
    const microDepositData = new FormData();
    microDepositData.set('bankAccountId', bankAccountId);
    microDepositData.set('externalLogin', externalLogin);
    microDepositData.set('documentOnly', '0');
    this.subscriptions.push(
      this.bankAccService.microDeposit(microDepositData).subscribe((res) => {
        if (res.success) {
          this.router.navigate([
            '/manage/payee-onboarding/manual-bank-added'
          ]);
        }
      })
    );
  }

  triggerBankSetupAbandoned(): void {
    const duration = performance.now() - this.bankManualInitiatedTime;
    this.postHogService.trackBankSetupAbandoned({
      ...this.postHogService.customerPayloadFromStorage(),
      setup_duration_seconds: Math.round(duration / 1000),
      exit_reason: 'user_exit',
      bank_selected: this.selectedBankName(),
      steps_completed: this.stepsCompleted(),
      error_code: null,
      bank_selected_type: this.getBankSelectedType(this.selectedBankName()),
      bank_add_method: 'manual'
    });
  }

  getBankSelectedType(bankName: string | null) {
    if(!bankName) {
      return null;
    }

    if(Moengage.creditUnionPatterns.some(pattern => bankName.toLowerCase().includes(pattern))) {
      return 'credit_union';
    }
    if(Moengage.majorPatterns.some(pattern => bankName.toLowerCase().includes(pattern))) {
      return 'major';
    }
    return 'regional';
  }

  trackBankInitiation(): void {
    this.isBankSetupInitiated.set(true);
    this.postHogService.trackBankSetupInitiated({
      ...this.postHogService.customerPayloadFromStorage(),
      bank_add_method: 'manual',
      is_first_bank_attempt: this.isFirstBankAttempt(),
      bank_count_before: this.bankCountBefore()
    });
  }

  getBankData(){
    this.subscriptions.push(
    this.bankAccService.getBankAccounts(1, '').pipe(takeUntilDestroyed(this.destroy$)).subscribe({
      next: (res) => {
        if(res.success){
          const isFirstBankAttempt = this.isFirstBankAttemptChecker(res?.totalCount || 0, res?.data?.[0]?.fullAccountNumber || '');
          this.isFirstBankAttempt.set(isFirstBankAttempt);
          this.bankCountBefore.set(res?.totalCount || 0);
          this.trackBankInitiation();
        }
      }
    }));
  }

  isFirstBankAttemptChecker(totalCount: number, bankAccountNumber: string | number): boolean {
    if(totalCount === 0) return true;
    if(totalCount === 1 && (bankAccountNumber).toString() === '1111111111') return true;
    return false;
  }

  ngOnDestroy(): void {
    if(this.isBankSetupInitiated() && !this.isBankSetupCancelled()) {
      this.triggerBankSetupAbandoned();
    }
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
