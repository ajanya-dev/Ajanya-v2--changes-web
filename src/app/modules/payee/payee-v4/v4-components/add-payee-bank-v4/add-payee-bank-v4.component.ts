import {
  Component,
  DestroyRef,
  QueryList,
  ViewChildren,
  effect,
  inject,
  OnInit,
  signal,
  output,
  input
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Observable, of } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { IApiRes } from 'src/app/models/api';
import {
  IPayeeBankDetails,
  ICreateDetails,
  IPayeeViewInfo
} from 'src/app/modules/payee/payee-v2/model/payee';
import { IPayeeSingleBankData } from 'src/app/modules/check-draft/model/Checkdraft';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { Eye, EyeOff, LucideAngularModule } from 'lucide-angular';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { CommonCountryDropdownV4Component } from 'src/app/shared/V4/common-country-dropdown-v4/common-country-dropdown-v4.component';
import { CommonCountrySelectV4Component } from 'src/app/shared/V4/common-country-select-v4/common-country-select-v4.component';
import { CommonStateSelectV4Component } from 'src/app/shared/V4/common-state-select-v4/common-state-select-v4.component';

export interface AddPayeeBankDialogData {
  payeeId: string;
  payeeName?: string;
  edit?: boolean;
  bankId?: string;
  from?: string;
  legalNameEdit?: boolean;
}

@Component({
  selector: 'app-add-payee-bank-v4',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltip,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    LucideAngularModule,
    MatDialogModule,
    AddressAutocompleteV4Component,
    NgSelectModule,
    CommonCountryDropdownV4Component,
    CommonCountrySelectV4Component,
    CommonStateSelectV4Component
  ],
  templateUrl: './add-payee-bank-v4.component.html',
  styleUrls: ['./add-payee-bank-v4.component.scss']
})
export class AddPayeeBankV4Component implements OnInit {
  @ViewChildren(NgSelectComponent)
  private ngSelects: QueryList<NgSelectComponent>;

  private fb = inject(FormBuilder);
  private payeeService = inject(PayeeService);
  private paymentsService = inject(PaymentsService);
  private bankService = inject(BankAccountsService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  private dialogData = inject(MAT_DIALOG_DATA, {
    optional: true
  }) as AddPayeeBankDialogData | null;

  private dialogRef = inject(MatDialogRef, {
    optional: true
  }) as MatDialogRef<AddPayeeBankV4Component> | null;

  /** Whether the component is running as a standalone modal (not embedded inside another dialog) */
  get isModalMode(): boolean {
    return !!this.dialogData && 'payeeId' in this.dialogData;
  }

  /** Returns the effective payee ID (from dialog data in modal mode, input otherwise) */
  get effectivePayeeId(): string {
    const payeeId = this.dialogData?.payeeId;
    return payeeId || this.payeeId();
  }

  /** Returns the effective payee name (from dialog data in modal mode, input otherwise) */
  get effectivePayeeName(): string {
    return this.dialogData?.payeeName || this.payeeName();
  }

  get payeeLegalName(): string {
    return this.effectivePayeeName || this.payeeInformation?.payee_name || '';
  }

  /** Live payee-address fallbacks (embedded mode only) — used by autoFillBeneficiaryReceiver()
   *  when the payee hasn't been saved yet, so getPayeeDetails() has nothing to fetch. */
  get effectivePayeeAddress1(): string {
    return this.payeeAddress1();
  }

  get effectivePayeeAddress2(): string {
    return this.payeeAddress2();
  }

  get effectivePayeeCity(): string {
    return this.payeeCity();
  }

  get effectivePayeeState(): string {
    return this.payeeState();
  }

  get effectivePayeeZip(): string {
    return this.payeeZip();
  }

  get effectivePayeeCountry(): string {
    return this.payeeCountry();
  }

  get legalNameEdit(): boolean {
    return !!this.dialogData?.legalNameEdit;
  }

  readonly legalNameInfo =
    "The bank account holder name must be the payee's legal name. If it doesn't match, the payment will be held.";

  readonly bankLoading = signal(false);

  readonly skeletonRows = Array.from({ length: 5 });

  constructor() {
    // Sync parent input changes into local signal and detect initial default
    // Note: effect() must be created in constructor for injection context
    effect(
      () => {
        const details = this.payeeBankDetails();
        if (details) {
          this.payeeBankDetailsSignal.set([...details]);
          // Find the initially selected default account
          type BankItemWithDefault = (
            | IPayeeBankDetails
            | IPayeeSingleBankData
          ) & {
            default_dd_account?: number | string;
          };
          const defaultIdx = details.findIndex(
            (b: BankItemWithDefault) =>
              b.defaultDDAccount === 1 ||
              b.default_dd_account === 1 ||
              b.default_dd_account === '1'
          );
          this.defaultAccountIndex.set(defaultIdx >= 0 ? defaultIdx : 0);
        }
      },
      { allowSignalWrites: true }
    );
    effect(() => {
      this.bankCountChange.emit(this.payeeBankDetailsSignal().length);
    });
  }

  // Inputs
  showHeader = input(true);
  payeeId = input<string>('');
  payeeBankDetails = input<IPayeeBankDetails[] | IPayeeSingleBankData[]>([]);
  payeeName = input<string>('');
  payeeAddress1 = input<string>('');
  payeeAddress2 = input<string>('');
  payeeCity = input<string>('');
  payeeState = input<string>('');
  payeeZip = input<string>('');
  payeeCountry = input<string>('');

  // Outputs
  bankSetupFinished = output<void>();
  emptyBank = output<void>();
  back = output<void>();
  /** Emits the current number of domestic bank accounts whenever the list changes. */
  bankCountChange = output<number>();

  // Internal state
  payeeBankDetailsSignal = signal<(IPayeeBankDetails | IPayeeSingleBankData)[]>(
    []
  );

  defaultAccountIndex = signal<number>(0);
  payeeBankForm!: FormGroup;
  isAchChecked = true;
  isWireChecked = false;
  wireUserDetailsVisible = false;
  wireBankDetailsVisible = false;
  /** Modal step: 'ach' = ACH form, 'wireBeneficiary' = wire beneficiary details, 'wireBank' = wire bank details */
  modalStep = signal<'ach' | 'wireBeneficiary' | 'wireBank'>('ach');
  beneficiaryBankDetailsAvailable = false;
  isBankAddingOrUpdating = false;
  bankFormEditIndex: number | null = null;
  showingBankDetails: IPayeeSingleBankData | null = null;
  newBankAcc = false;
  editMode = false;

  /** Payee profile used to prefill WIRE beneficiary details (matches V3 flow) */
  payeeInformation: IPayeeViewInfo | undefined;

  private payeeInformation$?: Observable<IPayeeViewInfo | undefined>;

  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  showAccountNumber = false;
  showConfirmAccountNumber = false;
  isAccountNumberMasked = true;
  isConfirmAccountNumberMasked = true;

  bankCustomPattern: { [key: string]: { pattern: RegExp; symbol: string } } = {
    0: { pattern: /\d/, symbol: 'X' }
  };

  receiverCountries: { [code: string]: string } = {
    US: 'United States',
    CA: 'Canada'
  };
  bankAccountTypes = [
    { value: 'businessChecking', name: 'Business Checking' },
    { value: 'businessSavings', name: 'Business Savings' },
    { value: 'personalChecking', name: 'Personal Checking' },
    { value: 'personalSavings', name: 'Personal Savings' }
  ];

  achFieldsList = [
    'bankName',
    'routingNumber',
    'accountNumber',
    'accountType',
    'confirmAccountNumber'
  ];

  bankUserFields = [
    'bankAccountFirstName',
    'bankAccountAddress1',
    'bankAccountCity',
    'bankAccountState',
    'bankAccountZip',
    'bankAccountCountry'
  ];

  bankDetailsFields = [
    'bankingInstituteName',
    'bankingInstituteAddressLine1',
    'bankingInstituteCity',
    'bankingInstituteState',
    'bankingInstituteZip',
    'bankingInstituteCountry'
  ];

  ngOnInit(): void {
    // Handle edit mode from dialog first
    if (this.dialogData?.edit && this.dialogData?.bankId) {
      this.loadBankForEdit(this.dialogData.bankId);
    } else if (this.isModalMode) {
      // In modal mode (add), use dialog data instead of inputs
      this.fetchBankDataForModal();
      // Show the form directly in modal mode
      this.newBankAcc = true;
    }
    if (this.dialogData?.from === 'wire') {
      this.isWireChecked = true;
    }
    // Re-init with payeeName now available from input
    this.initBankFormGroup();

    // Load payee profile to prefill WIRE beneficiary details (matches V3 flow).
    // Works in both modal mode (dialogData) and embedded mode (input).
    this.loadPayeeInformation()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Returns the payee profile request, creating it on first use and replaying the
   * result. Sharing it lets a Next click subscribe to a call that is still in flight
   * instead of silently skipping the beneficiary prefill.
   */
  private loadPayeeInformation(): Observable<IPayeeViewInfo | undefined> {
    if (!this.payeeInformation$) {
      const payeeId = this.effectivePayeeId;
      this.payeeInformation$ = payeeId
        ? this.paymentsService.getPayeeDetails(payeeId).pipe(
            map((res) => res?.payee_information),
            tap((info) => {
              this.payeeInformation = info;
              this.revalidateHolderName();
            }),
          )
        : of(undefined);
    }
    return this.payeeInformation$;
  }

  private fetchBankDataForModal(): void {
    const data = this.dialogData;
    if (!data) return;
    this.payeeService
      .getPayeeBankData(data.payeeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.data) {
          this.payeeBankDetailsSignal.set(res.data);
          type BankItemWithDefault = IPayeeBankDetails & {
            default_dd_account?: number | string;
          };
          const defaultIdx = res.data.findIndex(
            (b: BankItemWithDefault) =>
              b.defaultDDAccount === 1 ||
              b.default_dd_account === 1 ||
              b.default_dd_account === '1'
          );
          this.defaultAccountIndex.set(defaultIdx >= 0 ? defaultIdx : 0);
        }
      });
  }

  private loadBankForEdit(bankId: string): void {
    const payeeId = this.effectivePayeeId;
    if (!payeeId || !bankId) return;

    this.editMode = true;
    this.newBankAcc = false;
    this.bankFormEditIndex = 0; // Set to indicate edit mode for button label

    this.bankLoading.set(true);
    this.payeeService
      .getPayeeSingleBankData(payeeId, bankId)
      .pipe(
        finalize(() => {
          this.bankLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.data) {
          if (this.legalNameEdit && Number(res.data.verified) === 1) {
            this.alertService.successAlert({
              title: 'Already Verified',
              content:
                'This bank account holder legal name has already been verified. No changes are needed.'
            });
            this.dialogRef?.close();
            return;
          }
          this.showingBankDetails = res.data as IPayeeSingleBankData;
          this.isWireChecked = !!this.showingBankDetails?.isAllowWire;
          if (this.dialogData?.from === 'wire') {
            this.isWireChecked = true;
          }
          this.populateBankForm();
          if (this.legalNameEdit) {
            this.applyLegalNameLock();
          }
        }
      });
  }

  private applyLegalNameLock(): void {
    Object.keys(this.payeeBankForm.controls).forEach((name) => {
      if (name === 'bankName' || name === 'id') {
        return;
      }
      this.payeeBankForm.controls[name].disable({ emitEvent: false });
    });
  }

  initBankFormGroup(): void {
    this.payeeBankForm = this.fb.group({
      id: [''],
      bankName: [
        this.effectivePayeeName || '',
        [
          Validators.required,
          ValidationService.containsHtmlTag,
          ValidationService.personNameValidator,
          ValidationService.legalNameMatchValidator(() => this.payeeLegalName)
        ]
      ],
      routingNumber: [
        '',
        [Validators.required, ValidationService.routingNumberValidator]
      ],
      routingbankName: [''],
      accountNumber: ['', [Validators.required, Validators.minLength(5), ValidationService.containsHtmlTag]],
      confirmAccountNumber: [
        '',
        [
          Validators.required,
          ValidationService.isMatchingValidator(
            'accountNumber',
            'Account number does not match'
          )
        ]
      ],
      accountType: [undefined, [Validators.required]],
      default_dd_account: 1,
      bankAccountFirstName: ['', [ValidationService.containsHtmlTag, ValidationService.personNamePartValidator]],
      bankAccountLastName: ['', [ValidationService.containsHtmlTag, ValidationService.personNamePartValidator]],
      bankAccountAddress1: ['', [ValidationService.addressValidator]],
      bankAccountAddress2: ['', [ValidationService.addressValidator]],
      bankAccountCity: ['', [ValidationService.addressValidator]],
      bankAccountState: [null],
      bankAccountZip: [''],
      bankAccountCountry: [''],
      bankingInstituteName: ['', [ValidationService.containsHtmlTag]],
      bankingInstituteAddressLine1: ['', [ValidationService.addressValidator]],
      bankingInstituteAddressLine2: ['', [ValidationService.addressValidator]],
      bankingInstituteCity: ['', [ValidationService.addressValidator]],
      bankingInstituteState: [''],
      bankingInstituteZip: ['',[ValidationService.zipValidator]],
      bankingInstituteCountry: ['US']
    });
  }

  /** Reset form values without recreating the FormGroup (avoids detached FormControl errors) */
  private resetBankForm(): void {
    this.payeeBankForm.reset({
      id: '',
      bankName: this.effectivePayeeName || '',
      routingNumber: '',
      routingbankName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      accountType: undefined,
      default_dd_account: 1,
      bankAccountFirstName: '',
      bankAccountLastName: '',
      bankAccountAddress1: '',
      bankAccountAddress2: '',
      bankAccountCity: '',
      bankAccountState: null,
      bankAccountZip: '',
      bankAccountCountry: '',
      bankingInstituteName: '',
      bankingInstituteAddressLine1: '',
      bankingInstituteAddressLine2: '',
      bankingInstituteCity: '',
      bankingInstituteState: '',
      bankingInstituteZip: '',
      bankingInstituteCountry: 'US'
    });
    this.payeeBankForm.markAsUntouched();
    this.payeeBankForm.markAsPristine();
    // Clear wire field validators
    this.bankUserFields.forEach((item) => {
      this.payeeBankForm.controls[item].clearValidators();
      this.payeeBankForm.controls[item].updateValueAndValidity();
    });
    this.bankDetailsFields.forEach((item) => {
      this.payeeBankForm.controls[item].clearValidators();
      this.payeeBankForm.controls[item].updateValueAndValidity();
    });
  }

  /**
   * Prefills the WIRE beneficiary fields when entering the beneficiary step. Only
   * fills empty fields — never overwrites a value the user already typed (matches
   * the V3 flow). Sources, in priority order: the saved bank account being edited,
   * then the payee's profile.
   */
  autoFillBeneficiaryReceiver(): void {
    this.prefillBeneficiaryFromBank(this.showingBankDetails);

    // 2. Fill the remaining blanks from the payee profile, which may still be loading.
    if (this.payeeInformation) {
      this.prefillBeneficiaryFromProfile(this.payeeInformation);
      return;
    }
    this.loadPayeeInformation()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((info) => {
        if (this.isWireChecked && this.wireUserDetailsVisible) {
          this.prefillBeneficiaryFromProfile(info);
        }
      });
  }

  private prefillBeneficiaryFromBank(d: IPayeeSingleBankData | null): void {
    if (!d) {
      return;
    }
    const form = this.payeeBankForm;
    form.patchValue({
      bankAccountFirstName:
        form.get('bankAccountFirstName')?.value || d.bankAccountFirstName || '',
      bankAccountLastName:
        form.get('bankAccountLastName')?.value || d.bankAccountLastName || '',
      bankAccountAddress1:
        form.get('bankAccountAddress1')?.value || d.bankAccountAddress1 || '',
      bankAccountAddress2:
        form.get('bankAccountAddress2')?.value || d.bankAccountAddress2 || '',
      bankAccountCity:
        form.get('bankAccountCity')?.value || d.bankAccountCity || '',
      bankAccountState:
        form.get('bankAccountState')?.value || d.bankAccountState || '',
      bankAccountZip:
        form.get('bankAccountZip')?.value || d.bankAccountZip || '',
      bankAccountCountry:
        form.get('bankAccountCountry')?.value ||
        this.normalizeReceiverCountry(d.bankAccountCountry),
      // Baseline for the beneficiary bank step — the routing number lookup in
      // submitBankForm() still overwrites these when it resolves a real bank.
      bankingInstituteName:
        form.get('bankingInstituteName')?.value || d.bankingInstituteName || '',
      bankingInstituteAddressLine1:
        form.get('bankingInstituteAddressLine1')?.value ||
        d.bankingInstituteAddressLine1 ||
        '',
      bankingInstituteAddressLine2:
        form.get('bankingInstituteAddressLine2')?.value ||
        d.bankingInstituteAddressLine2 ||
        '',
      bankingInstituteCity:
        form.get('bankingInstituteCity')?.value || d.bankingInstituteCity || '',
      bankingInstituteState:
        form.get('bankingInstituteState')?.value ||
        d.bankingInstituteState ||
        '',
      bankingInstituteZip:
        form.get('bankingInstituteZip')?.value || d.bankingInstituteZip || '',
      bankingInstituteCountry:
        form.get('bankingInstituteCountry')?.value ||
        d.bankingInstituteCountry ||
        'US'
    });
  }

  /** Fills empty beneficiary fields from the payee's saved profile. */
  private prefillBeneficiaryFromProfile(info: IPayeeViewInfo | undefined): void {
    const form = this.payeeBankForm;
    form.patchValue({
      bankAccountFirstName:
        form.get('bankAccountFirstName')?.value ||
        info?.payee_name ||
        this.effectivePayeeName,
      bankAccountAddress1:
        form.get('bankAccountAddress1')?.value ||
        info?.payee_address_line_1 ||
        this.effectivePayeeAddress1,
      bankAccountAddress2:
        form.get('bankAccountAddress2')?.value ||
        info?.payee_address_line_2 ||
        this.effectivePayeeAddress2,
      bankAccountCity:
        form.get('bankAccountCity')?.value ||
        info?.payee_city ||
        this.effectivePayeeCity,
      bankAccountState:
        form.get('bankAccountState')?.value ||
        info?.payee_state ||
        this.effectivePayeeState,
      bankAccountZip:
        form.get('bankAccountZip')?.value ||
        info?.payee_zip ||
        this.effectivePayeeZip,
      bankAccountCountry: this.normalizeReceiverCountry(
        form.get('bankAccountCountry')?.value ||
          info?.payee_country ||
          this.effectivePayeeCountry
      )
    });
  }

  /**
   * Restricts a country value to the receiver dropdown's allowed options (US/CA).
   */
  normalizeReceiverCountry(country?: string): string {
    if (!country) {
      return '';
    }
    const match = Object.keys(this.receiverCountries).find(
      (code) =>
        code.toLowerCase() === country.toLowerCase() ||
        this.receiverCountries[code].toLowerCase() === country.toLowerCase()
    );
    return match ?? '';
  }

  NewBankAcc(): void {
    this.resetBankForm();
    this.newBankAcc = true;
    this.editMode = false;
    this.isWireChecked = false;
    this.wireUserDetailsVisible = false;
    this.wireBankDetailsVisible = false;
    this.beneficiaryBankDetailsAvailable = false;
    this.bankFormEditIndex = null;
    this.showingBankDetails = null;
  }

  /** Reset form after successful add/update — hide form first to avoid flash of intermediate state */
  resetFormAfterSubmit(): void {
    this.newBankAcc = false;
    this.editMode = false;
    this.resetBankForm();
    this.bankFormEditIndex = null;
    this.showingBankDetails = null;
    this.isWireChecked = false;
    this.wireUserDetailsVisible = false;
    this.wireBankDetailsVisible = false;
    this.beneficiaryBankDetailsAvailable = false;
  }

  cancelForm(): void {
    this.newBankAcc = false;
    this.editMode = false;
    this.bankFormEditIndex = null;
    this.showingBankDetails = null;
    this.isWireChecked = false;
    this.wireUserDetailsVisible = false;
    this.wireBankDetailsVisible = false;
  }

  closeModal(): void {
    this.dialogRef?.close();
  }

  private notifyBankSetupFinished(data?: IPayeeSingleBankData): void {
    if (this.isModalMode) {
      this.dialogRef?.close({ success: true, data });
    } else {
      this.bankSetupFinished.emit();
    }
  }

  backbutton(): void {
    if (this.newBankAcc || this.editMode) {
      this.cancelForm();
    } else if (this.isModalMode) {
      this.dialogRef?.close();
    } else {
      this.back.emit();
    }
  }

  editBankAccount(
    bank: IPayeeBankDetails | IPayeeSingleBankData,
    index: number
  ): void {
    this.resetBankForm();
    this.editMode = true;
    this.newBankAcc = false;
    this.bankFormEditIndex = index;
    this.showingBankDetails = bank as IPayeeSingleBankData;

    if (this.effectivePayeeId) {
      this.payeeService
        .getPayeeSingleBankData(this.effectivePayeeId, bank.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          this.showingBankDetails = res.data as IPayeeSingleBankData;
          this.isWireChecked = !!this.showingBankDetails?.isAllowWire;
          this.populateBankForm();
        });
    } else {
      this.isWireChecked = !!(bank as IPayeeSingleBankData)?.isAllowWire;
      this.populateBankForm();
    }
  }

  populateBankForm(): void {
    const d = this.showingBankDetails;
    if (!d) return;
    this.payeeBankForm.patchValue({
      id: d.id || '',
      bankName: d.bankName || this.effectivePayeeName || '',
      routingNumber: d.routingNumber ? String(d.routingNumber) : '',
      accountNumber: d.accountNumber || '',
      confirmAccountNumber:
        this.dialogData?.from === 'wire' ? '' : d.accountNumber || '',
      accountType:
        d.accountType &&
        typeof d.accountType === 'string' &&
        !['CHECKING', 'BUSINESS', 'SAVINGS'].includes(d.accountType)
          ? d.accountType
          : null,
      bankAccountFirstName:
        d.bankAccountFirstName || this.effectivePayeeName || '',
      bankAccountLastName: d.bankAccountLastName || '',
      bankAccountAddress1: d.bankAccountAddress1 || '',
      bankAccountAddress2: d.bankAccountAddress2 || '',
      bankAccountCity: d.bankAccountCity || '',
      bankAccountState: d.bankAccountState || null,
      bankAccountZip: d.bankAccountZip || '',
      bankAccountCountry: d.bankAccountCountry || '',
      bankingInstituteName: d.bankingInstituteName || '',
      bankingInstituteAddressLine1: d.bankingInstituteAddressLine1 || '',
      bankingInstituteAddressLine2: d.bankingInstituteAddressLine2 || '',
      bankingInstituteCity: d.bankingInstituteCity || '',
      bankingInstituteState: d.bankingInstituteState || '',
      bankingInstituteZip: d.bankingInstituteZip || '',
      bankingInstituteCountry: d.bankingInstituteCountry || 'US'
    });

    this.revalidateHolderName();
    this.payeeBankForm.controls.bankName.markAsTouched();

    if (d.routingNumber && String(d.routingNumber).length > 8) {
      this.lookupRoutingNumber(String(d.routingNumber));
    }
  }

  private revalidateHolderName(): void {
    this.payeeBankForm?.controls.bankName.updateValueAndValidity();
  }

  deleteBankAccount(
    bank: IPayeeBankDetails | IPayeeSingleBankData,
    index: number
  ): void {
    const data = {
      content: 'Are you sure you want to delete this bank account?',
      cancelMsg: 'No, Cancel!',
      doneMsg: 'Yes, Delete!'
    };
    const alert = this.alertService.confirmAlert(data);
    alert
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          const removeAndUpdateDefault = () => {
            const details = [...this.payeeBankDetailsSignal()];
            details.splice(index, 1);
            this.payeeBankDetailsSignal.set(details);
            // Adjust default index after deletion
            const currentDefault = this.defaultAccountIndex();
            if (details.length === 0) {
              this.defaultAccountIndex.set(0);
              if (this.isModalMode) {
                this.dialogRef?.close({ empty: true });
              } else {
                this.emptyBank.emit();
              }
            } else if (index === currentDefault) {
              // Deleted bank was the default — fall back to first
              this.defaultAccountIndex.set(0);
            } else if (index < currentDefault) {
              // Deleted bank was before the default — shift index down
              this.defaultAccountIndex.set(currentDefault - 1);
            }
          };

          if (this.effectivePayeeId && bank.id) {
            this.payeeService
              .deletePayeeBank(this.effectivePayeeId, bank.id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((res) => {
                if (res?.success) {
                  removeAndUpdateDefault();
                }
              });
          } else {
            removeAndUpdateDefault();
          }
        }
      });
  }

  submitBankForm(): void {
    this.revalidateHolderName();
    if (this.legalNameEdit) {
      const nameControl = this.payeeBankForm.controls.bankName;
      if (nameControl.invalid) {
        nameControl.markAsTouched();
        return;
      }
      this.executeBankFormSubmit();
      return;
    }

    const isWire = this.isWireChecked;

    if (isWire) {
      // Step 1: validate ACH fields
      if (!this.wireUserDetailsVisible) {
        const hasInvalidAchField = this.achFieldsList.some(
          (item) => this.payeeBankForm.controls[item].invalid
        );
        if (hasInvalidAchField) {
          this.achFieldsList.forEach((item) => {
            if (this.payeeBankForm.controls[item].invalid) {
              this.payeeBankForm.controls[item].markAsTouched();
            }
          });
          return;
        }
        this.wireUserDetailsVisible = true;
        this.autoFillBeneficiaryReceiver();
        if (this.isModalMode) {
          this.modalStep.set('wireBeneficiary');
        }
        this.bankUserFields.forEach((item) => {
          const validators: ValidatorFn[] = [Validators.required];
          if (item === 'bankAccountFirstName') {
            validators.push(ValidationService.personNamePartValidator);
          }
          this.payeeBankForm.controls[item].setValidators(validators);
          this.payeeBankForm.controls[item].updateValueAndValidity();
        });
        this.bankService
          .getroutingNumber(this.payeeBankForm.controls.routingNumber.value)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res?.data?.name && res.data.name !== 'Bank Name') {
              this.payeeBankForm.patchValue({
                bankingInstituteName: res.data.name,
                bankingInstituteAddressLine1: res.data.address,
                bankingInstituteCity: res.data.city,
                bankingInstituteState: res.data.state,
                bankingInstituteZip: res.data.zip
              });
            }
          });
        return;
      }

      // Step 2: validate wire beneficiary fields
      if (this.wireUserDetailsVisible && !this.wireBankDetailsVisible) {
        this.payeeBankForm.markAllAsTouched();
        const invalidUserField = this.bankUserFields.find(
          (item) => this.payeeBankForm.controls[item].invalid
        );
        if (invalidUserField) {
          return;
        }

        // Skip the wire bank details step and submit directly
        this.bankDetailsFields.forEach((item) => {
          this.payeeBankForm.controls[item].clearValidators();
          this.payeeBankForm.controls[item].updateValueAndValidity();
        });
        this.executeBankFormSubmit();
        return;
      }

      // Step 3: validate wire bank details
      if (this.wireUserDetailsVisible && this.wireBankDetailsVisible) {
        const hasInvalidDetailsField = this.bankDetailsFields.some(
          (item) => this.payeeBankForm.controls[item].invalid
        );
        if (hasInvalidDetailsField) {
          this.bankDetailsFields.forEach((item) => {
            if (this.payeeBankForm.controls[item].invalid) {
              this.payeeBankForm.controls[item].markAsTouched();
            }
          });
          return;
        }
      }

      if (this.payeeBankForm.valid) {
        this.executeBankFormSubmit();
      }
    } else {
      if (this.payeeBankForm.invalid) {
        this.achFieldsList.forEach((item) => {
          if (this.payeeBankForm.controls[item].invalid) {
            this.payeeBankForm.controls[item].markAsTouched();
          }
        });
        return;
      }
      this.executeBankFormSubmit();
    }
  }

  private executeBankFormSubmit(): void {
    if (this.bankFormEditIndex !== null) {
      this.updateInlineBankAccount();
    } else {
      this.createInlineBankAccount();
    }
  }

  private getBankFormBody(allowUpdate = false) {
    const v = this.legalNameEdit
      ? this.payeeBankForm.getRawValue()
      : this.payeeBankForm.value;
    // New account becomes default if it's the first, otherwise 0
    let isDefault: number;
    if (this.bankFormEditIndex !== null) {
      isDefault = this.defaultAccountIndex() === this.bankFormEditIndex ? 1 : 0;
    } else {
      isDefault = this.payeeBankDetailsSignal().length === 0 ? 1 : 0;
    }
    return {
      id: v.id,
      payeeId: this.effectivePayeeId,
      bankName: v.bankName,
      routingNumber: v.routingNumber,
      accountNumber: v.accountNumber,
      accountType: v.accountType,
      allowReccuring: allowUpdate ? 1 : 0,
      default_dd_account: isDefault,
      isAllowWire: this.isWireChecked ? 1 : 0,
      ...(this.isWireChecked && {
        bankAccountFirstName: v.bankAccountFirstName,
        bankAccountLastName: v.bankAccountLastName,
        bankAccountAddress1: v.bankAccountAddress1,
        bankAccountAddress2: v.bankAccountAddress2,
        bankAccountCity: v.bankAccountCity,
        bankAccountState: v.bankAccountState,
        bankAccountZip: v.bankAccountZip,
        bankAccountCountry: v.bankAccountCountry,
        bankingInstituteName: v.bankingInstituteName,
        bankingInstituteAddressLine1: v.bankingInstituteAddressLine1,
        bankingInstituteAddressLine2: v.bankingInstituteAddressLine2,
        bankingInstituteCity: v.bankingInstituteCity,
        bankingInstituteState: v.bankingInstituteState,
        bankingInstituteZip: v.bankingInstituteZip,
        bankingInstituteCountry: v.bankingInstituteCountry || 'US'
      })
    };
  }

  createInlineBankAccount(): void {
    const sendingData = this.getBankFormBody();
    this.isBankAddingOrUpdating = true;

    if (this.effectivePayeeId) {
      this.payeeService
        .addPayeeBank(sendingData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res: IApiRes<ICreateDetails>) => {
            this.payeeService.bankToEdit = res.data.id;
            const newBank = {
              ...sendingData,
              id: res.data.id
            } as IPayeeSingleBankData;
            this.payeeService.setbankData(newBank);
            const currentList = this.payeeBankDetailsSignal();
            this.payeeBankDetailsSignal.update((list) => [...list, newBank]);
            // Auto-select as default if it's the first bank
            if (currentList.length === 0) {
              this.defaultAccountIndex.set(0);
            }
            this.notifyBankSetupFinished(newBank);
            this.resetFormAfterSubmit();
            this.isBankAddingOrUpdating = false;
          },
          error: () => {
            this.isBankAddingOrUpdating = false;
          }
        });
    } else {
      this.payeeService.setbankData(sendingData as IPayeeSingleBankData);
      const currentList = this.payeeBankDetailsSignal();
      this.payeeBankDetailsSignal.update((list) => [
        ...list,
        sendingData as IPayeeSingleBankData
      ]);
      if (currentList.length === 0) {
        this.defaultAccountIndex.set(0);
      }
      this.notifyBankSetupFinished(sendingData as IPayeeSingleBankData);
      this.resetFormAfterSubmit();
      this.isBankAddingOrUpdating = false;
    }
  }

  updateInlineBankAccount(allowUpdate = false): void {
    const sendingData = this.getBankFormBody(allowUpdate);
    this.isBankAddingOrUpdating = true;

    if (this.effectivePayeeId) {
      this.payeeService
        .updatePayeeBank(this.showingBankDetails?.id || '', sendingData)
        .pipe(
          finalize(() => {
            this.isBankAddingOrUpdating = false;
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: () => {
            const updatedBank = {
              ...sendingData,
              id: this.showingBankDetails?.id
            } as IPayeeSingleBankData;
            this.payeeService.setbankData(updatedBank);
            const editIndex = this.bankFormEditIndex;
            if (editIndex !== null) {
              this.payeeBankDetailsSignal.update((list) => {
                const updated = [...list];
                updated[editIndex] = updatedBank;
                return updated;
              });
            }
            this.notifyBankSetupFinished(updatedBank);
            this.resetFormAfterSubmit();
          },
          error: (err) => {
            if (err?.error?.errorCode === 987) {
              const data = {
                content: `Updating the payee's bank account won't affect existing recurring payments. To update bank details for recurring payments, cancel and recreate them with the updated information.`,
                doneMsg: 'Update',
                cancelMsg: 'Cancel'
              };
              const response = this.alertService.confirmAlert(data);
              response
                .afterClosed()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((result) => {
                  if (result) {
                    this.updateInlineBankAccount(true);
                  }
                });
            }
          }
        });
    } else {
      const updatedBank = sendingData as IPayeeSingleBankData;
      this.payeeService.setbankData(updatedBank);
      const editIndex = this.bankFormEditIndex;
      if (editIndex !== null) {
        this.payeeBankDetailsSignal.update((list) => {
          const updated = [...list];
          updated[editIndex] = updatedBank;
          return updated;
        });
      }
      this.notifyBankSetupFinished(updatedBank);
      this.resetFormAfterSubmit();
      this.isBankAddingOrUpdating = false;
    }
  }

  onWireToggle(checked: boolean): void {
    this.isWireChecked = checked;
    if (!checked) {
      this.wireUserDetailsVisible = false;
      this.wireBankDetailsVisible = false;
      this.beneficiaryBankDetailsAvailable = false;
      [...this.bankUserFields, ...this.bankDetailsFields].forEach((item) => {
        this.payeeBankForm.controls[item].clearValidators();
        this.payeeBankForm.controls[item].updateValueAndValidity();
      });
    } else {
      const country = this.payeeBankForm.controls.bankingInstituteCountry;
      if (!country.value) {
        country.setValue('US');
      }
    }
  }

  lookupRoutingNumber(routNo: string): void {
    if (routNo?.length > 8) {
      this.bankService
        .getroutingNumber(routNo)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res.success) {
            this.beneficiaryBankDetailsAvailable = true;
          }
          this.payeeBankForm.patchValue({
            bankingInstituteName: res.data.name,
            bankingInstituteAddressLine1: res.data.address,
            bankingInstituteCity: res.data.city,
            bankingInstituteState: res.data.state,
            bankingInstituteZip: res.data.zip
          });
        });
    } else {
      this.payeeBankForm.patchValue({
        bankingInstituteName: '',
        bankingInstituteAddressLine1: '',
        bankingInstituteCity: '',
        bankingInstituteState: '',
        bankingInstituteZip: ''
      });
    }
  }

  onBeneficiaryAddressSelected(address: IGoogleAddress): void {
    this.payeeBankForm.patchValue({
      bankAccountAddress1: address.address,
      bankAccountCity: (address.city ?? '').trim(),
      bankAccountState: (address.state ?? '').trim(),
      bankAccountZip: (address.zip ?? '').trim(),
      bankAccountCountry: (address.country ?? '').trim()
    });
  }

  onBeneficiaryBankAddressSelected(address: IGoogleAddress): void {
    this.payeeBankForm.patchValue({
      bankingInstituteAddressLine1: address.address,
      bankingInstituteCity: (address.city ?? '').trim(),
      bankingInstituteState: (address.state ?? '').trim(),
      bankingInstituteZip: (address.zip ?? '').trim()
    });
  }

  goBackWireStep(): void {
    if (this.wireUserDetailsVisible && !this.wireBankDetailsVisible) {
      this.wireUserDetailsVisible = false;
      if (this.isModalMode) this.modalStep.set('ach');
    } else if (this.wireUserDetailsVisible && this.wireBankDetailsVisible) {
      this.wireBankDetailsVisible = false;
      if (this.isModalMode) this.modalStep.set('wireBeneficiary');
    }
  }

  getBankSubmitLabel(): string {
    if (this.legalNameEdit) {
      return 'Update';
    }
    if (this.isWireChecked && !this.wireUserDetailsVisible) {
      return 'Next';
    }
    return this.bankFormEditIndex !== null ? 'Update' : 'Add';
  }

  setDefaultAccount(index: number): void {
    this.defaultAccountIndex.set(index);
  }

  trackByIndex(index: number) {
    return index;
  }

  closeAllDropdowns(): void {
    this.ngSelects?.forEach((select) => {
      if (select.isOpen) {
        select.close();
      }
    });
  }

  toggleAccountNumber(): void {
    this.showAccountNumber = !this.showAccountNumber;
    this.isAccountNumberMasked = !this.showAccountNumber;
  }

  onAccountNumberBlur(): void {
    if (!this.showAccountNumber) this.isAccountNumberMasked = true;
  }

  toggleConfirmAccountNumber(): void {
    this.showConfirmAccountNumber = !this.showConfirmAccountNumber;
    this.isConfirmAccountNumberMasked = !this.showConfirmAccountNumber;
  }

  onConfirmAccountNumberBlur(): void {
    if (!this.showConfirmAccountNumber) this.isConfirmAccountNumberMasked = true;
  }
}
