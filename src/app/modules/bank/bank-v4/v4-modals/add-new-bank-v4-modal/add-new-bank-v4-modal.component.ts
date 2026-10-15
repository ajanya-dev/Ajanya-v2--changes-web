import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { NgClass } from '@angular/common';
import { LucideAngularModule, X, Info } from 'lucide-angular';

import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { Moengage } from 'src/app/data/data/moengage';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { V4WireRoutingnumberAddComponent } from 'src/app/shared/bank-modal/modals/v4-wire-routingnumber-add/v4-wire-routingnumber-add.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { IBankCreateRes } from 'src/app/models/bank';
import { IConfirmAlert } from 'src/app/models/alert';
import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';

interface IAddNewBankDialogData {
  wireRoutingNumberRequired?: number;
}

@Component({
  selector: 'app-add-new-bank-v4-modal',
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonInputFieldV4Component,
    CommonButtonV4Component,
    AddressAutocompleteV4Component
  ],
  templateUrl: './add-new-bank-v4-modal.component.html',
  styleUrl: './add-new-bank-v4-modal.component.scss'
})
export class AddNewBankV4ModalComponent implements OnInit {
  private bankAccService = inject(BankAccountsService);
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

  private matDialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private dialogData = inject(MAT_DIALOG_DATA, {
    optional: true
  }) as IAddNewBankDialogData | null;

  public dialogRef = inject(MatDialogRef<AddNewBankV4ModalComponent>, {
    optional: true
  });

  readonly XIcon = X;
  readonly InfoIcon = Info;

  loading = signal(false);
  isShowAddressSections = signal(false);
  private formStarted = signal(false);
  private bankAddedSuccessfully = signal(false);
  isComponent = input(false);
  skipVerification = false;
  searchBank = input('');
  success = output<{
    success: boolean;
    id: string;
    check_no: string;
    bankAcData: IBankCreateRes;
  }>();

  private wireRoutingNumber: string | number | undefined;
  private allowDuplicate: string | undefined;
  customPattern = { 0: { pattern: /\d/, symbol: 'X' } };

  bankForm = new FormGroup({
    bankRoutingNumber: new FormControl('', [
      Validators.required,
      ValidationService.routingNumberValidator
    ]),
    bankAccountNumber: new FormControl('', [
      Validators.required,
      Validators.minLength(5)
    ]),
    confirmAccountNumber: new FormControl('', [
      Validators.required,
      ValidationService.isMatchingValidator(
        'bankAccountNumber',
        'Account number does not match'
      )
    ]),
    bankAccountName: new FormControl('', [
      Validators.required,
      ValidationService.personNameValidator,
      Validators.minLength(5)
    ]),
    bankAccountNickName: new FormControl('', [
      Validators.required,
      ValidationService.noWhitespaceValidator
    ]),
    bankAccountAddressLine1: new FormControl('', [Validators.required]),
    bankAccountAddressLine2: new FormControl(''),
    bankAccountCity: new FormControl('', [Validators.required]),
    bankAccountState: new FormControl('', [Validators.required]),
    bankAccountZip: new FormControl('', [
      Validators.required,
      ValidationService.zipValidator
    ]),
    bankAccountType: new FormControl(''),
    bankName: new FormControl('', [
      Validators.required,
      ValidationService.noWhitespaceValidator
    ]),
    bankAddress1: new FormControl('', [
      Validators.required,
      ValidationService.noWhitespaceValidator
    ]),
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
      ValidationService.zipValidator,
      ValidationService.noWhitespaceValidator
    ]),
    bankStartingCheckNumber: new FormControl(''),
    bankFractionalNumber: new FormControl(''),
    country: new FormControl('USA')
  });

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
          steps_completed: 1,
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

    if (this.searchBank()) {
      this.bankForm.patchValue({
        bankAccountName: this.searchBank()
      });
    }

    // Show address sections when user types in the address field
    this.bankForm.controls.bankAccountAddressLine1.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (val && !this.isShowAddressSections()) {
          this.isShowAddressSections.set(true);
        }
      });
  }

  lookupRoutingNumber(routingNumberInput: HTMLInputElement): void {
    const routNo = routingNumberInput.value;
    if (routNo.length >= 9) {
      this.bankAccService
        .getroutingNumber(routNo)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          const details = res.data;
          this.bankForm.patchValue({
            bankName: details.name?.trim(),
            bankAddress1: details.address?.trim(),
            bankCity: details.city?.trim(),
            bankState: details.state?.trim(),
            bankZip: details.zip?.toString()
          });
        });
    } else {
      this.bankForm.patchValue({
        bankName: '',
        bankAddress1: '',
        bankCity: '',
        bankState: '',
        bankZip: ''
      });
    }
  }

  onHolderAddressSelected(address: IGoogleAddress): void {
    this.isShowAddressSections.set(true);
    this.bankForm.patchValue({
      bankAccountAddressLine1: address.address,
      bankAccountCity: address.city,
      bankAccountState: address.state,
      bankAccountZip: address.zip
    });
  }

  onBankAddressSelected(address: IGoogleAddress): void {
    this.bankForm.patchValue({
      bankAddress1: address.address,
      bankCity: address.city,
      bankState: address.state,
      bankZip: address.zip
    });
  }

  submit(): void {
    this.bankForm.markAllAsTouched();
    if (this.bankForm.invalid) return;

    this.loading.set(true);
    this.bankAccService
      .AddBank(this.createBankAccountBody())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res?.success) {
            this.bankAddedSuccessfully.set(true);
            const result = {
              success: true,
              id: res.data.id,
              check_no: this.bankForm.value.bankStartingCheckNumber ?? '',
              bankAcData: res.data
            };
            if (this.isComponent()) {
              this.success.emit(result);
            }
            const country = this.bankForm.value.country;
            if (!this.skipVerification && !res.data.is_neo_bank && country === 'USA') {
              this.promptBankVerification(result);
            } else {
              this.dialogRef?.close(result);
              this.onSuccessAlert();
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
            this.handleDuplicateBankError();
          }
          if (err.error?.errorCode === 55) {
            this.handleWireRoutingError();
          }
        }
      });
  }

  private handleDuplicateBankError(): void {
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

  private promptBankVerification(result: {
    success: boolean;
    id: string;
    check_no: string;
    bankAcData: IBankCreateRes;
  }): void {
    const verifyData: IConfirmAlert = {
      title: 'Verify this bank account?',
      content:
        'Verify the bank account through convenient method and unlock all payment methods.',
      doneMsg: 'Verify Now',
      cancelMsg: 'Do Later',
      icon: 'success'
    };
    const v4AlertService = this.v4AlertService;
    const matDialog = this.matDialog;
    const onSuccessAlert = () => this.onSuccessAlert();
    this.dialogRef?.close(result);
    v4AlertService
      .confirmAlert(verifyData)
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          matDialog.open(BankVerificationModalV4Component, {
            width: '100%',
            maxWidth: '480px',
            panelClass: 'paddingless-modal-rounded',
            disableClose: true,
            data: { bankId: result.bankAcData.id }
          });
        } else {
          onSuccessAlert();
        }
      });
  }

  private onSuccessAlert(): void {
    this.v4AlertService.successAlert({
      content: 'Bank Account Added.'
    });
  }

  onInputEvent(): void {
    this.customPattern = { 0: { pattern: /\d/, symbol: '' } };
  }

  onAccountFocus(): void {
    this.customPattern = { 0: { pattern: /\d/, symbol: '' } };
  }

  onAccountBlur(): void {
    this.customPattern = { 0: { pattern: /\d/, symbol: 'X' } };
  }

  private createBankAccountBody(): Record<string, unknown> {
    const v = this.bankForm.value;
    return {
      bankRoutingNumber: v.bankRoutingNumber,
      bankAccountNumber: v.bankAccountNumber,
      bankAccountName: v.bankAccountName,
      bankAccountNickName: v.bankAccountNickName,
      bankAccountAddressLine1: v.bankAccountAddressLine1,
      bankAccountAddressLine2: v.bankAccountAddressLine2,
      bankAccountCity: v.bankAccountCity,
      bankAccountState: v.bankAccountState,
      bankAccountZip: v.bankAccountZip,
      bankAccountType: v.bankAccountType,
      bankName: v.bankName,
      bankAddress1: v.bankAddress1,
      bankCity: v.bankCity,
      bankState: v.bankState,
      bankZip: v.bankZip,
      checkSerialNumber: v.bankStartingCheckNumber,
      bankIdentity: v.bankFractionalNumber,
      allowDuplicate: this.allowDuplicate,
      wireRoutingNumberRequired: this.dialogData?.wireRoutingNumberRequired,
      wireRoutingNumber: this.wireRoutingNumber
    };
  }
}
