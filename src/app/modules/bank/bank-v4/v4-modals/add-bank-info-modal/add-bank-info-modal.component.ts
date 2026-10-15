import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { LucideAngularModule, X, ArrowLeft, Info, Plus } from 'lucide-angular';

import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { Moengage } from 'src/app/data/data/moengage';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import { IBankDropdown } from 'src/app/models/bank';
import { environment } from 'src/environments/environment';
import { V4SignatureUploadPanelComponent } from 'src/app/modules/payments-v4/send-payment/components/modals/signature-upload-panel/v4-signature-upload-panel.component';
import { V4WireRoutingnumberAddComponent } from 'src/app/shared/bank-modal/modals/v4-wire-routingnumber-add/v4-wire-routingnumber-add.component';
import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { IConfirmAlert } from 'src/app/models/alert';
import {
  DOUBLE_SIDE_MODAL_DATA,
  DOUBLE_SIDE_MODAL_REF
} from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';
import { DoubleSideModalRef } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal-ref';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { StepperV35Component } from 'src/app/shared/v3/common-components/stepper-v35/stepper-v35.component';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { CommonTabV4Component } from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { CommonStateSelectV4Component } from 'src/app/shared/V4/common-state-select-v4/common-state-select-v4.component';
import { AddBankInstructionsPanelComponent } from '../add-bank-instructions-panel/add-bank-instructions-panel.component';

interface IAddBankInfoModalData {
  onBack?: () => void;
}

@Component({
  selector: 'app-add-bank-info-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonInputFieldV4Component,
    CommonButtonV4Component,
    StepperV35Component,
    AddressAutocompleteV4Component,
    CommonTabV4Component,
    V4CommonDropDownSelectorComponent,
    CommonStateSelectV4Component
  ],
  templateUrl: './add-bank-info-modal.component.html',
  styleUrl: './add-bank-info-modal.component.scss'
})
export class AddBankInfoModalComponent implements OnInit {
  private bankAccService = inject(BankAccountsService);
  private http = inject(HttpClient);
  private googleAddressService = inject(GoogleAddressService);
  private v4AlertService = inject(V4AlertService);
  private postHogService = inject(PostHogService);

  /** Set when the modal opens, so abandonment can report how long they spent. */
  private bankSetupInitiatedTime = performance.now();

  /**
   * Same categorisation the v3 bank screens use, from the shared pattern lists.
   * @param bankName - The bank name, when one has been resolved.
   * @returns {string | null} 'credit_union', 'major', 'regional', or null.
   */
  private getBankSelectedType(bankName: string | null): string | null {
    if (!bankName) {
      return null;
    }
    const name = bankName.toLowerCase();
    if (Moengage.creditUnionPatterns.some((p) => name.includes(p))) {
      return 'credit_union';
    }
    if (Moengage.majorPatterns.some((p) => name.includes(p))) {
      return 'major';
    }
    return 'regional';
  }

  private headerService = inject(HeaderService);
  private store = inject(Store);
  private matDialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private modalRef = inject<DoubleSideModalRef>(DOUBLE_SIDE_MODAL_REF);
  private modalData = inject<IAddBankInfoModalData | null>(
    DOUBLE_SIDE_MODAL_DATA
  );

  readonly XIcon = X;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly InfoIcon = Info;
  readonly PlusIcon = Plus;

  loading = signal(false);
  step2 = signal(false);
  step1Completed = signal(false);
  country = signal<'USA' | 'CANADA'>('USA');
  countryCode = computed<'US' | 'CA'>(() =>
    this.country() === 'CANADA' ? 'CA' : 'US'
  );

  bankFieldsShow = signal(false);
  showAddressFields = signal(false);
  signaturePadImg = signal('');

  private formStarted = signal(false);
  private bankAddedSuccessfully = signal(false);
  private signatureUrl = '';
  private logoUrl = '';
  private allowDuplicate: string | undefined;
  private wireRoutingNumber: string | number | undefined;

  bankForm = new FormGroup({
    // Step 1 - Business Details
    businessName: new FormControl('', [
      Validators.required,
      ValidationService.personNameValidator,
      Validators.minLength(5)
    ]),
    mainAddressLineOne: new FormControl('', [Validators.required]),
    mainAddressLineTwo: new FormControl(''),
    companyCity: new FormControl('', [Validators.required]),
    companyState: new FormControl('', [Validators.required]),
    companyZip: new FormControl('', [
      Validators.required,
      ValidationService.zipValidator
    ]),

    // Step 2 - Account Details
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

    // Bank Detail section
    nickName: new FormControl('', [
      Validators.required,
      ValidationService.noWhitespaceValidator
    ]),
    bankAccountType: new FormControl(''),
    bankAccountName: new FormControl('', [Validators.required]),
    bankAddress: new FormControl('', [Validators.required]),
    bankCity: new FormControl('', [Validators.required]),
    bankState: new FormControl('', [Validators.required]),
    bankZip: new FormControl('', [
      Validators.required,
      ValidationService.zipValidator
    ]),
    checkNumber: new FormControl(''),
    fractionalNumber: new FormControl('')
  });

  readonly accountTypes = [
    { value: '5', label: 'Personal Checking' },
    { value: '6', label: 'Business Checking' },
    { value: '7', label: 'Personal Savings' },
    { value: '8', label: 'Business Savings' }
  ];

  accountTypeDropdownConfig = {
    placeholder: 'Select Account Type',
    displayField: 'label',
    outputField: 'value'
  };

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.formStarted() && !this.bankAddedSuccessfully()) {
        this.postHogService.trackBankSetupAbandoned({
          ...this.postHogService.customerPayloadFromStorage(),
          setup_duration_seconds: Math.round(
            (performance.now() - this.bankSetupInitiatedTime) / 1000
          ),
          exit_reason: 'user_exit',
          bank_selected: this.bankForm.value.bankAccountName || null,
          steps_completed: this.step2() ? 2 : 1,
          error_code: null,
          bank_selected_type: this.getBankSelectedType(this.bankForm.value.bankAccountName || null),
          bank_add_method: 'manual'
        });
      }
      this.googleAddressService.resetGoogleAutocompleteAPI();
    });
  }

  /**
   * Reads the bank count first so the event can report whether this is the
   * customer's first attempt, matching how the v3 screens derive it. A single
   * placeholder account still counts as the first attempt.
   */
  private trackBankSetupInitiated(): void {
    this.bankAccService
      .getBankAccounts(1, '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const totalCount = res?.totalCount || 0;
          const firstAccountNumber = String(
            res?.data?.[0]?.fullAccountNumber ?? ''
          );

          this.postHogService.trackBankSetupInitiated({
            ...this.postHogService.customerPayloadFromStorage(),
            bank_add_method: 'manual',
            is_first_bank_attempt:
              totalCount === 0 ||
              (totalCount === 1 && firstAccountNumber === '1111111111'),
            bank_count_before: totalCount
    });
        }
      });
  }

  ngOnInit(): void {
    this.trackBankSetupInitiated();

    this.googleAddressService.resetGoogleAutocompleteAPI();

    this.bankForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.formStarted()) {
          this.formStarted.set(true);
        }
      });

    this.validationSet('USA');

    // Add right instructions panel
    this.modalRef.addRightPanel(AddBankInstructionsPanelComponent, {
      width: '280px',
      data: { country: this.country }
    });
  }

  onCountrySelect(value: 'USA' | 'CANADA'): void {
    if (value === this.country()) {
      return;
    }
    this.country.set(value);
    this.bankFieldsShow.set(false);
    this.showAddressFields.set(false);
    // USA and CANADA share one accountNumber control but allow different
    // characters, so a value carried across the toggle can be uneditable.
    this.bankForm.controls.accountNumber.reset('');
    this.googleAddressService.updateCountryRestriction([
      value === 'CANADA' ? 'ca' : 'us'
    ]);

    this.validationSet(value);

    // Defer reset so it runs after the blur event (from auto-focused input losing
    // focus when the tab button is clicked) has already fired and marked controls touched.
    setTimeout(() => {
      this.bankForm.markAsUntouched();
      this.bankForm.markAsPristine();
    }, 0);
  }

  private restoreStep1Validators(): void {
    const { controls } = this.bankForm;
    controls.businessName.setValidators([Validators.required, ValidationService.personNameValidator, Validators.minLength(5)]);
    controls.mainAddressLineOne.setValidators([Validators.required]);
    controls.companyCity.setValidators([Validators.required]);
    controls.companyState.setValidators([Validators.required]);
    controls.companyZip.setValidators([Validators.required, ValidationService.zipValidator]);
  }

  private validationSet(value: string): void {
    if (value === 'USA') {
      this.bankForm.controls.routingNumber.setValidators([
        Validators.required,
        ValidationService.routingNumberValidator,
        Validators.minLength(9),
        Validators.maxLength(9)
      ]);
      this.bankForm.controls.transitNumber.clearValidators();
      this.bankForm.controls.finantialInstNumber.clearValidators();
    } else if (value === 'CANADA') {
      this.bankForm.controls.transitNumber.setValidators(Validators.required);
      this.bankForm.controls.finantialInstNumber.setValidators(
        Validators.required
      );
      this.bankForm.controls.routingNumber.clearValidators();
    }
    this.bankForm.controls.routingNumber.updateValueAndValidity({ emitEvent: false });
    this.bankForm.controls.transitNumber.updateValueAndValidity({ emitEvent: false });
    this.bankForm.controls.finantialInstNumber.updateValueAndValidity({ emitEvent: false });
  }

  onNextClick(): void {
    if (this.stepOneComplete()) {
      this.googleAddressService.resetGoogleAutocompleteAPI();
      this.step1Completed.set(true);

      // Reset the entire form's touched state before showing step 2
      // so no validation messages appear until user interacts or clicks Save
      this.bankForm.markAsUntouched();
      this.bankForm.markAsPristine();

      this.step2.set(true);
    }
  }

  private stepOneComplete(): boolean {
    const {controls} = this.bankForm;

    // Re-add validators (they may have been cleared during country switch)
    this.restoreStep1Validators();

    controls.businessName.updateValueAndValidity({ emitEvent: false });
    controls.mainAddressLineOne.updateValueAndValidity({ emitEvent: false });
    controls.companyCity.updateValueAndValidity({ emitEvent: false });
    controls.companyState.updateValueAndValidity({ emitEvent: false });
    controls.companyZip.updateValueAndValidity({ emitEvent: false });

    if (
      !this.country() ||
      controls.businessName.invalid ||
      controls.mainAddressLineOne.invalid ||
      controls.companyCity.invalid ||
      controls.companyState.invalid ||
      controls.companyZip.invalid
    ) {
      controls.businessName.markAsTouched();
      controls.mainAddressLineOne.markAsTouched();
      controls.companyCity.markAsTouched();
      controls.companyState.markAsTouched();
      controls.companyZip.markAsTouched();
      this.step1Completed.set(false);
      return false;
    }
    return true;
  }

  onBackToStep1(): void {
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.step2.set(false);
  }

  onCompanyAddressSelected(address: IGoogleAddress): void {
    const city = (address.city ?? '').trim();
    const state = (address.state ?? '').trim();
    const zip = (address.zip ?? '').trim();
    this.bankForm.patchValue({
      mainAddressLineOne: address.address,
      companyCity: city,
      companyState: state,
      companyZip: zip
    });
    this.bankForm.controls.companyCity.updateValueAndValidity();
    this.bankForm.controls.companyState.updateValueAndValidity();
    this.bankForm.controls.companyZip.updateValueAndValidity();
    this.showAddressFields.set(true);
  }

  onBankAddressSelected(address: IGoogleAddress): void {
    const city = (address.city ?? '').trim();
    const state = (address.state ?? '').trim();
    const zip = (address.zip ?? '').trim();
    this.bankForm.patchValue({
      bankAddress: address.address,
      bankCity: city,
      bankState: state,
      bankZip: zip
    });
    this.bankForm.controls.bankCity.updateValueAndValidity();
    this.bankForm.controls.bankState.updateValueAndValidity();
    this.bankForm.controls.bankZip.updateValueAndValidity();
  }

  lookupRoutingNumber(routingNumberInput: HTMLInputElement): void {
    const routNo = routingNumberInput.value;
    if (routNo.length >= 9 && this.country() === 'USA') {
      const headers = new HttpHeaders().set('isDisable422', 'true');
      this.http
        .get<{ data: { name: string; address: string; city: string; state: string; zip: string } }>(
          `${environment.rootUrl}/routing-number/${routNo}`,
          { headers }
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            const details = res.data;
            this.bankForm.patchValue({
              bankAccountName: details.name?.trim(),
              bankAddress: details.address?.trim(),
              bankCity: details.city?.trim(),
              bankState: details.state?.trim(),
              bankZip: details.zip?.toString()
            });
            this.bankFieldsShow.set(true);
          },
          error: (err: HttpErrorResponse) => {
            this.bankFieldsShow.set(true);
            this.v4AlertService.warningAlert({
              content:
                err.error?.errorMsg ||
                'Bank not found in our system. Please enter a valid routing number or enter bank details manually'
            });
          }
        });
    } else {
      this.bankForm.patchValue({
        bankAccountName: '',
        bankAddress: '',
        bankCity: '',
        bankState: '',
        bankZip: ''
      });
      this.bankFieldsShow.set(false);
    }
  }

  openSignModal(): void {
    const dialogRef = this.matDialog.open(V4SignatureUploadPanelComponent, {
      maxWidth: '690px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      minHeight: '410px',
      disableClose: true
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((signImg) => {
        if (signImg) {
          this.signatureUrl = signImg.signatureUrl || '';
          if (signImg.signPad) {
            this.signaturePadImg.set(signImg.signPad);
          }
          if (signImg.existSign) {
            this.signaturePadImg.set(signImg.existSign);
            this.signatureUrl = signImg.existSign;
          }
          if (signImg.uploadSign) {
            this.signaturePadImg.set(signImg.uploadSign);
          }
          if (signImg.digitalSign) {
            this.signaturePadImg.set(signImg.digitalSign);
          }
        }
      });
  }

  removeSign(): void {
    this.signaturePadImg.set('');
    this.signatureUrl = '';
  }

  submit(): void {
    this.bankForm.markAllAsTouched();
    if (this.bankForm.invalid) return;

    this.loading.set(true);
    const checkBody = this.createCheckBody();

    this.bankAccService
      .AddBank(checkBody)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res?.success) {
            this.bankAddedSuccessfully.set(true);
            this.headerService.refreshDynamicHeader.next(true);
            this.headerService.setNotificationValueChanged(true);

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

            if (!res.data.is_neo_bank && this.country() === 'USA') {
              this.promptBankVerification(res.data);
            } else {
              this.v4AlertService.successAlert({
                content: 'The bank account has been added successfully.'
              });
              this.modalRef.close({ success: true, bankData: res.data });
            }
          }
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.postHogService.trackBankLinkedFailed({
            ...this.postHogService.customerPayloadFromStorage(),
            bank_add_method: 'manual',
            failure_reason_code:
              err?.error?.errorCode || 'manual_add_bank_error'
          });
          if (err.error?.errorCode === 987) {
            this.handleDuplicateBankError(checkBody);
          }
          if (err.error?.errorCode === 55) {
            this.handleWireRoutingError();
          }
        }
      });
  }

  private promptBankVerification(bankData: {
    id: string;
    bankAccountNumber: string;
  }): void {
    const verifyData: IConfirmAlert = {
      title: 'Verify this bank account?',
      content:
        'Verify the bank account through convenient method and unlock all payment methods.',
      doneMsg: 'Verify Now',
      cancelMsg: 'Do Later',
      icon: 'success'
    };

    const verifyResponse = this.v4AlertService.confirmAlert(verifyData);
    verifyResponse
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.matDialog
            .open(BankVerificationModalV4Component, {
              width: '100%',
              maxWidth: '480px',
              panelClass: 'paddingless-modal-rounded',
              disableClose: true,
              data: { bankId: bankData.id }
            })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.modalRef.close({ success: true, bankData });
            });
        } else {
          this.modalRef.close({ success: true, bankData });
        }
      });
  }

  private handleDuplicateBankError(_checkBody: FormData): void {
    const response = this.v4AlertService.confirmAlert({
      title: 'The Bank Account already exist.',
      content: 'Would You Like To Add It Again',
      width: '370px',
      doneMsg: 'Yes',
      cancelMsg: 'No'
    });
    response
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.allowDuplicate = '1';
          this.submit();
        }
      });
  }

  private handleWireRoutingError(): void {
    this.matDialog
      .open(V4WireRoutingnumberAddComponent, {
        maxWidth: '510px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.wireRoutingNumber) {
          this.wireRoutingNumber = res.wireRoutingNumber;
          this.submit();
        } else {
          this.wireRoutingNumber = undefined;
        }
      });
  }

  private createCheckBody(): FormData {
    const formData = new FormData();
    const v = this.bankForm.value;

    if (this.signatureUrl) {
      formData.append('signatureUrl', this.signatureUrl);
    }
    if (this.logoUrl) {
      formData.append('logoUrl', this.logoUrl);
    }

    formData.append('bankAccountNickName', v.nickName ?? '');
    formData.append(
      'bankAccountAddressLine1',
      (v.mainAddressLineOne ?? '').toString().trim()
    );
    formData.append(
      'bankAccountAddressLine2',
      (v.mainAddressLineTwo ?? '').toString().trim()
    );
    formData.append('bankAccountCity', (v.companyCity ?? '').toString().trim());
    formData.append('bankAccountName', v.businessName ?? '');
    formData.append('bankAccountNumber', v.accountNumber ?? '');
    formData.append(
      'bankAccountState',
      (v.companyState ?? '').toString().trim()
    );
    formData.append('bankAccountZip', (v.companyZip ?? '').toString().trim());
    formData.append('bankAddress1', (v.bankAddress ?? '').toString().trim());
    formData.append('bankCity', (v.bankCity ?? '').toString().trim());
    formData.append('bankState', (v.bankState ?? '').toString().trim());
    formData.append('bankName', v.bankAccountName ?? '');
    formData.append('checkSerialNumber', v.checkNumber ?? '');
    formData.append('bankRoutingNumber', v.routingNumber ?? '');
    formData.append('bankZip', (v.bankZip ?? '').toString().trim());
    formData.append('bankAccountType', v.bankAccountType ?? '');
    formData.append('transitNumber', v.transitNumber ?? '');
    formData.append('financialNumber', v.finantialInstNumber ?? '');
    formData.append('country', this.country());
    formData.append('bankIdentity', v.fractionalNumber ?? '');

    if (this.allowDuplicate) {
      formData.append('allowDuplicate', this.allowDuplicate);
    }
    if (this.wireRoutingNumber !== undefined) {
      formData.append('wireRoutingNumber', String(this.wireRoutingNumber));
    }

    return formData;
  }

  onClose(): void {
    this.modalRef.close(undefined);
  }

  onBack(): void {
    if (this.modalData?.onBack) {
      this.modalRef.close(undefined);
      this.modalData.onBack();
    } else {
      this.modalRef.close(undefined);
    }
  }
}
