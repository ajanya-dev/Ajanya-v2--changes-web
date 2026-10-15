import {
  Component,
  computed,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Location, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, Subject } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';

import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { IGetPaidByLinkRes } from 'src/app/modules/payment-link/model/Paymentlink';
import { IPaymentData, PaymentLinksMethods } from 'src/app/modules/payment-links/models/payment-links.model';
import { IBankDropdown } from 'src/app/models/bank';
import { IV3DropDownOnReady } from 'src/app/models/common';

import { PaymentLinksPreviewComponent } from 'src/app/modules/payment-links/components/payment-links-preview/payment-links-preview.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { V4PaymentLinksService } from '../../services/v4-payment-links.service';

@Component({
  selector: 'app-v4-payment-links-create',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatCheckboxModule,
    MatTooltip,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    BankAcDropdownV4Component,
    V4CommonDropDownSelectorComponent,
    PaymentLinksPreviewComponent,
    CommonBackButtonV35Component,
    MatDialogClose,
    NgTemplateOutlet,
    V4DatePickerComponent
  ],
  templateUrl: './v4-payment-links-create.component.html',
  styleUrls: ['./v4-payment-links-create.component.scss'],
  host: { class: 'v4-mat-check-box' }
})
export class V4PaymentLinksCreateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private paymentLinkService = inject(PaymentLinkService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private v4PaymentLinksService = inject(V4PaymentLinksService);
  private dialogRef = inject(MatDialogRef<V4PaymentLinksCreateComponent>, { optional: true });
  private modalData = inject<{ selectedBankId: string }>(MAT_DIALOG_DATA, { optional: true });

  /** When true, component is shown inside a v4 custom modal (no MatDialog). */
  @Input() isModalMode = false;
  /** Emitted when modal is closed (cancel or success). Used when isModalMode is true and no MatDialog. */
  @Output() closed = new EventEmitter<{ success?: boolean }>();
  /** Emitted when submit loading state changes (for modal footer button). */
  @Output() submitLoadingChange = new EventEmitter<boolean>();

  readonly isModal = () => this.isModalMode || !!this.dialogRef;

  // ── Mode ──
  mode: 'create' | 'update' = 'create';
  isDuplicateMode = false;
  editId = '';
  readonly XIcon = X;

  // ── Loading ──
  loading = signal(false);
  paymentOptionsLoading = signal(false);
  isClick = signal(false);

  // ── Redirect URLs ──
  redirectUrls: string[] = [];
  /**
   * Custom add-tag handler for the redirect URL dropdown — returns the typed
   * term as a plain string so the form control receives a string instead of
   * ng-select's default `{ label }` object (which previously rendered as
   * "[object Object]" in the input).
   */
  redirectUrlAddTag = (term: string): string => term;

  // ── Payment options ──
  paymentOptions: IPaymentData = {
    stripe_payments: [],
    paypal_payments: [],
    bitpay_payments: [],
    stripe_checkout_payments: []
  };

  stripe = signal(false);
  paypal = signal(false);
  bitpay = signal(false);
  stripeCheckout = signal(false);
  creditCardEnabled = this.v4PaymentLinksService.creditCardEnabled;

  selectedPaymentOptions: { [k: number]: { id: string; status: number } } = {};
  selectedStripeId: string | null = null;
  selectedPaypalId: string | null = null;
  selectedBitpayId: string | null = null;
  selectedStripeCheckoutId: string | null = null;

  // ── UI toggles ──
  showMultipleDocumentTypes = false;
  showExpiryRules = false;
  selectedLogoFile = signal<File | null>(null);

  // ── Short URL validation ──
  shortUrlValidation = signal({ valid: true, message: '', loading: false });
  private shortUrlCheck$ = new Subject<string>();

  // ── Short URL border class (computed) ──
  shortUrlBorderClass = computed(() => {
    const v = this.shortUrlValidation();
    const base = 'flex items-center rounded-xl overflow-hidden border transition-colors';
    if (v.loading) return `${base} border-v4-common-yellow-color`;
    if (!v.valid && v.message) return `${base} border-v4-common-red-color`;
    if (v.valid && v.message) return `${base} border-v4-common-green-color`;
    return `${base} border-v4-border-color`;
  });

  // ── Live Preview ── (preview always shows only Pay by Bank + Credit Card; selected channels do not add methods here)
  readonly PREVIEW_PAYMENT_METHODS: PaymentLinksMethods[] = ['CHECK', 'CREDIT_CARD'];
  previewConfig = signal({
    amount: 0,
    companyName: 'Company Name',
    paymentMethods: ['CHECK', 'CREDIT_CARD'] as PaymentLinksMethods[],
    logo: undefined as File | undefined | string
  });

  previewLinkConfig = computed(() => ({
    companyName: this.previewConfig().companyName,
    paymentMethods: this.previewConfig().paymentMethods,
    companyNameNeeded: false,
    logo: this.previewConfig().logo
  }));

  // ── Expiry ──
  minExpiryDate = new Date().toISOString().split('T')[0];

  // ── Bank dropdown ref ──
  private bankDropdownApi: IV3DropDownOnReady | null = null;

  // ── Payment short link base ──
  paymentShortLink = StaticWhiteLabelConditions.paymentShortLink;

  // ── Existing link data (for edit / duplicate) ──
  private existingLinkData: IGetPaidByLinkRes | null = null;

  // ── Form ──
  form = new FormGroup({
    name: new FormControl<string | null>(null, [Validators.required]),
    formTempleteId: new FormControl<number | null>(1, [Validators.required]),
    bankAccount: new FormControl<IBankDropdown | null>(null, [Validators.required]),
    company_name: new FormControl<string | null>(null),
    bottomText: new FormControl<string | null>(null),
    shortUrl: new FormControl<string | null>(null, [
      Validators.pattern(/^[a-zA-Z0-9-]+$/),
      Validators.required
    ]),
    redirectUrl: new FormControl<string | null>(null),
    autoRedirect: new FormControl<boolean>(false),
    isBankVerifyRequired: new FormControl<boolean>(false),
    is_bank_verify_disabled: new FormControl<boolean>(false),
    is_payee_company_required: new FormControl<boolean>(false),
    deduct_service_fee_from_main_amount: new FormControl<boolean>(false),
    address_needed: new FormControl<boolean>(false),
    photo: new FormControl<string | File | null>(null),
    allow_check_number: new FormControl<boolean>(false),
    custom_fields: new FormArray<FormControl<string | null>>([]),
    expiryDate: new FormControl<string | null>(null),
    maxTransactionCount: new FormControl<number | null>(null),
    maxTotalAmount: new FormControl<number | null>(null)
  });

  // ──────────────────────────────────────────────
  // Lifecycle
  // ──────────────────────────────────────────────

  ngOnInit(): void {
    this.initForms();
    this.getRedirectUrl();
    this.getPaymentOptionsData();

    // Determine mode from route
    const routeSnapshot = this.route.snapshot;
    const idParam = routeSnapshot.paramMap.get('id');
    const duplicateParam = routeSnapshot.queryParamMap.get('duplicate');

    if (idParam) {
      // Edit mode
      this.mode = 'update';
      this.editId = idParam;
      this.getPaymentData(idParam);
    } else if (duplicateParam) {
      // Duplicate mode
      this.mode = 'create';
      this.isDuplicateMode = true;
      this.editId = duplicateParam;
      this.getPaymentData(duplicateParam);
    }
  }

  // ──────────────────────────────────────────────
  // Form init & subscriptions
  // ──────────────────────────────────────────────

  initForms(): void {
    // Auto-generate shortUrl from name
    this.form.controls.name.valueChanges
      .pipe(
        debounceTime(400),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((name) => {
        if (name && this.mode === 'create') {
          const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
          this.form.controls.shortUrl.setValue(slug);
        }

        // Update preview
        this.previewConfig.update((cfg) => ({
          ...cfg,
          companyName: this.form.controls.company_name.value || name || 'Company Name'
        }));
      });

    // Debounced shortUrl availability check
    this.shortUrlCheck$
      .pipe(
        debounceTime(600),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((url) => {
        if (url) {
          this.checkAvailabilityUrl(url);
        }
      });

    this.form.controls.shortUrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (this.mode === 'update') {
          this.shortUrlValidation.set({ valid: true, message: '', loading: false });
          return;
        }
        if (val && this.form.controls.shortUrl.valid) {
          this.shortUrlValidation.set({ valid: true, message: '', loading: true });
          this.shortUrlCheck$.next(val);
        } else {
          this.shortUrlValidation.set({ valid: true, message: '', loading: false });
        }
      });

    // autoRedirect toggle: clear redirectUrl when off
    this.form.controls.autoRedirect.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((auto) => {
        if (!auto) {
          this.form.controls.redirectUrl.setValue(null);
        }
      });

    // Company name -> preview
    this.form.controls.company_name.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.previewConfig.update((cfg) => ({
          ...cfg,
          companyName: val || this.form.controls.name.value || 'Company Name'
        }));
      });
  }

  // ──────────────────────────────────────────────
  // Data loading
  // ──────────────────────────────────────────────

  getPaymentData(id: string): void {
    this.loading.set(true);
    this.paymentLinkService
      .getPaymentLinkData(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          this.existingLinkData = res.data;
          this.patchFormWithData(res.data);
        }
      });
  }

  private patchFormWithData(data: IGetPaidByLinkRes): void {
    const checkIsOne = (param: string | number) => param === 1 || param === '1';

    this.form.patchValue({
      name: data.name,
      formTempleteId: data.formTemplateId,
      company_name: data.companyName || null,
      bottomText: data.bottomText != null ? data.bottomText : '',
      redirectUrl: data.redirectUrl ?? '',
      autoRedirect: checkIsOne(data.autoRedirect),
      isBankVerifyRequired: checkIsOne(data.bankVerificationRequired),
      is_bank_verify_disabled: checkIsOne(data.isBankVerifyDisabled),
      is_payee_company_required: checkIsOne(data.isPayeeCompanyRequired),
      deduct_service_fee_from_main_amount: checkIsOne(data.deductServiceFeeFromMainAmount),
      address_needed: checkIsOne(data.addressNeeded),
      allow_check_number: checkIsOne(data.allowCheckNumber),
      photo: data.logoUrl || null
    });

    // Patch shortUrl separately - suppress emitEvent in update mode to avoid unnecessary availability check
    const shortUrl = this.isDuplicateMode ? (`${data.shortUrl  }-copy`) : data.shortUrl;
    this.form.patchValue(
      { shortUrl },
      { emitEvent: this.isDuplicateMode }
    );

    // Set bank account via dropdown API
    if (data.bankAccountId && this.bankDropdownApi?.setItemWithId) {
      this.bankDropdownApi.setItemWithId(data.bankAccountId);
    }

    // Custom fields
    const customFieldsData = data.customFields || data.custom_fields;
    if (customFieldsData) {
      let fields: string[] = [];
      if (Array.isArray(customFieldsData)) {
        fields = customFieldsData;
      } else if (typeof customFieldsData === 'string') {
        try {
          fields = JSON.parse(customFieldsData);
        } catch {
          fields = [customFieldsData];
        }
      }

      if (fields.length > 0) {
        this.showMultipleDocumentTypes = true;
        this.form.controls.custom_fields.clear();
        fields.forEach((f) => {
          this.form.controls.custom_fields.push(
            new FormControl<string | null>(f)
          );
        });
      }
    }

    // Payment options
    if (data.paymentOption) {
      this.selectedPaymentOptions = data.paymentOption as { [k: number]: { id: string; status: number } };

      if (this.selectedPaymentOptions[1]) {
        this.selectedStripeId = String(this.selectedPaymentOptions[1].id);
        this.stripe.set(true);
      }
      if (this.selectedPaymentOptions[2]) {
        this.selectedPaypalId = String(this.selectedPaymentOptions[2].id);
        this.paypal.set(true);
      }
      if (this.selectedPaymentOptions[3]) {
        this.selectedBitpayId = String(this.selectedPaymentOptions[3].id);
        this.bitpay.set(true);
      }
      if (this.selectedPaymentOptions[4]) {
        this.selectedStripeCheckoutId = String(this.selectedPaymentOptions[4].id);
        this.stripeCheckout.set(true);
      }

      this.updatePreviewPaymentMethods();
    }

    // Expiry rules
    if (data.expiry_rules) {
      this.showExpiryRules = true;

      let formattedDate: string | null = null;
      if (data.expiry_rules.expiryDate) {
        const date = new Date(data.expiry_rules.expiryDate);
        formattedDate = date.toISOString().split('T')[0];
      }

      this.form.patchValue({
        expiryDate: formattedDate,
        maxTransactionCount: data.expiry_rules.maxTransactionCount ?? null,
        maxTotalAmount: data.expiry_rules.maxTotalAmount
          ? parseFloat(data.expiry_rules.maxTotalAmount)
          : null
      });
    }

    // Update preview
    if (data.logoUrl) {
      this.previewConfig.update((cfg) => ({
        ...cfg,
        logo: data.logoUrl
      }));
    }
    this.previewConfig.update((cfg) => ({
      ...cfg,
      companyName: data.companyName || data.name || 'Company Name'
    }));
  }

  getRedirectUrl(): void {
    this.paymentLinkService
      .getRedirectUrl()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success && res.data) {
          this.redirectUrls = res.data;
        }
      });
  }

  getPaymentOptionsData(): void {
    this.paymentOptionsLoading.set(true);
    this.paymentLinkService
      .paymentOptions()
      .pipe(
        finalize(() => this.paymentOptionsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          this.paymentOptions = res.data;
        }
      });
  }

  // ──────────────────────────────────────────────
  // Short URL availability
  // ──────────────────────────────────────────────

  checkAvailabilityUrl(name: string): void {
    this.paymentLinkService
      .shortUrlCheck(name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.shortUrlValidation.set({ valid: true, message: 'Available', loading: false });
          } else {
            this.shortUrlValidation.set({
              valid: false,
              message: res.message || 'This URL is already taken',
              loading: false
            });
          }
        },
        error: () => {
          this.shortUrlValidation.set({
            valid: false,
            message: 'This URL is already taken',
            loading: false
          });
        }
      });
  }

  // ──────────────────────────────────────────────
  // Custom fields (document types)
  // ──────────────────────────────────────────────

  onDocumentTypesToggle(checked: boolean): void {
    this.showMultipleDocumentTypes = checked;
    if (checked) {
      if (this.form.controls.custom_fields.length === 0) {
        this.form.controls.custom_fields.push(new FormControl<string | null>(null));
      }
    } else {
      this.form.controls.custom_fields.clear();
    }
  }

  addDocumentTypeField(): void {
    if (this.form.controls.custom_fields.length >= 3) return;
    this.form.controls.custom_fields.push(
      new FormControl<string | null>(null)
    );
  }

  removeDocumentTypeField(index: number): void {
    this.form.controls.custom_fields.removeAt(index);
    if (this.form.controls.custom_fields.length === 0) {
      this.showMultipleDocumentTypes = false;
    }
  }

  // ──────────────────────────────────────────────
  // File upload
  // ──────────────────────────────────────────────

  onLogoFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.filePicked(input.files[0]);
    }
  }

  filePicked(file: File): void {
    if (file && file.size > 2 * 1024 * 1024) {
      this.alertService.failedAlert({ content: 'Logo file must be under 2MB.' });
      return;
    }
    this.selectedLogoFile.set(file);
    this.form.controls.photo.setValue(file);
    this.previewConfig.update((cfg) => ({ ...cfg, logo: file }));
  }

  removeLogo(inputEl: HTMLInputElement): void {
    this.selectedLogoFile.set(null);
    this.form.controls.photo.setValue(null);
    this.previewConfig.update((cfg) => ({ ...cfg, logo: undefined }));
    inputEl.value = '';
  }

  // ──────────────────────────────────────────────
  // Bank dropdown
  // ──────────────────────────────────────────────

  onBankDropDownReady(ev: IV3DropDownOnReady): void {
    this.bankDropdownApi = ev;

    // If we already have data to set
    const bankId = this.modalData?.selectedBankId ?? this.existingLinkData?.bankAccountId;
    if (bankId && ev.setItemWithId) {
      ev.setItemWithId(bankId);
    }
  }

  onBankChange(bank: IBankDropdown | null | undefined): void {
    this.form.controls.bankAccount.setValue(bank || null);
    this.form.controls.bankAccount.markAsTouched();
  }

  // ──────────────────────────────────────────────
  // Payment options toggles
  // ──────────────────────────────────────────────

  onStripeToggle(checked: boolean): void {
    this.stripe.set(checked);
    if (!checked) {
      delete this.selectedPaymentOptions[1];
      this.selectedStripeId = null;
    }
    this.updatePreviewPaymentMethods();
  }

  onPaypalToggle(checked: boolean): void {
    this.paypal.set(checked);
    if (!checked) {
      delete this.selectedPaymentOptions[2];
      this.selectedPaypalId = null;
    }
    this.updatePreviewPaymentMethods();
  }

  onBitpayToggle(checked: boolean): void {
    this.bitpay.set(checked);
    if (!checked) {
      delete this.selectedPaymentOptions[3];
      this.selectedBitpayId = null;
    }
    this.updatePreviewPaymentMethods();
  }

  onStripeCheckoutToggle(checked: boolean): void {
    // Immediately reflect checkbox state
    this.stripeCheckout.set(checked);

    if (checked) {
      // If there are no credentials yet, open the modal to add one.
      if (this.paymentOptions.stripe_checkout_payments.length === 0) {
        this.openAddCredentialModal(4);
      }
    } else {
      // When unchecked, clear any selection and update preview.
      delete this.selectedPaymentOptions[4];
      this.selectedStripeCheckoutId = null;
      this.updatePreviewPaymentMethods();
    }
  }

  onPaymentOptionSelect(type: number, id: string): void {
    this.selectedPaymentOptions[type] = { id, status: 1 };
  }

  // ──────────────────────────────────────────────
  // Add Payment Credential Modal
  // ──────────────────────────────────────────────

  openAddCredentialModal(typeId: number): void {
    this.v4PaymentLinksService.openAddCredentialModal(typeId).then((dialogRef) => {
      dialogRef.afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          if (result && result.success) {
            this.getPaymentOptionsData();

            const {paymentType} = result;
            if (paymentType === 1 || paymentType === '1') {
              this.stripe.set(true);
            } else if (paymentType === 2 || paymentType === '2') {
              this.paypal.set(true);
            } else if (paymentType === 3 || paymentType === '3') {
              this.bitpay.set(true);
            } else if (paymentType === 4 || paymentType === '4') {
              this.stripeCheckout.set(true);
            }
            this.updatePreviewPaymentMethods();
          } else if (typeId === 4) {
            // User cancelled Stripe Checkout credential flow or closed without saving for Stripe Checkout;
            // ensure toggle is reverted and no stray selection is kept, regardless of how modal was opened.
            this.stripeCheckout.set(false);
            delete this.selectedPaymentOptions[4];
            this.selectedStripeCheckoutId = null;
            this.updatePreviewPaymentMethods();
          }
        });
    });
  }

  private updatePreviewPaymentMethods(): void {
    // Link preview always shows only Pay by Bank and Credit Card; do not add other methods from selected channels
    this.previewConfig.update((cfg) => ({ ...cfg, paymentMethods: this.PREVIEW_PAYMENT_METHODS }));
  }

  // ──────────────────────────────────────────────
  // Form submission
  // ──────────────────────────────────────────────

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.alertService.failedAlert({ content: 'Please fill all required fields.' });
      return;
    }

    if (this.mode !== 'update' && !this.shortUrlValidation().valid) {
      this.alertService.failedAlert({ content: 'Please choose a different payment link URL.' });
      return;
    }

    this.isClick.set(true);
    this.submitLoadingChange.emit(true);
    const formData = this.createFormData();

    if (this.mode === 'update') {
      this.paymentLinkService
        .updateLink(formData, this.editId)
        .pipe(
          finalize(() => {
            this.isClick.set(false);
            this.submitLoadingChange.emit(false);
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.alertService.successAlert({ content: 'Payment link updated successfully.' });
              if (this.isModal()) {
                if (this.dialogRef) this.dialogRef.close({ success: true });
                else this.closed.emit({ success: true });
              } else {
                this.router.navigate(['v4', 'manage', 'payment-links', 'index']);
              }
            } else {
              this.alertService.failedAlert({ content: res.message || 'Failed to update payment link.' });
            }
          },
        });
    } else {
      this.paymentLinkService
        .createLink(formData)
        .pipe(
          finalize(() => {
            this.isClick.set(false);
            this.submitLoadingChange.emit(false);
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.alertService.successAlert({ content: 'Payment link created successfully.' });
              if (this.isModal()) {
                if (this.dialogRef) this.dialogRef.close({ success: true });
                else this.closed.emit({ success: true });
              } else {
                this.router.navigate(['v4', 'manage', 'payment-links', 'index']);
              }
            } else {
              this.alertService.failedAlert({ content: 'Failed to create payment link.' });
            }
          }
        });
    }
  }

  private createFormData(): FormData {
    const fd = new FormData();
    const v = this.form.value;

    fd.append('name', v.name || '');
    fd.append('formTempleteId', String(v.formTempleteId || 1));
    fd.append('shortUrl', v.shortUrl || '');
    fd.append('redirectUrl', v.redirectUrl || '');
    fd.append('autoRedirect', v.autoRedirect ? '1' : '0');
    fd.append('bankAccountId', v.bankAccount?.id || '');
    fd.append('isBankVerifyRequired', v.isBankVerifyRequired ? '1' : '0');
    fd.append('bottomText', v.bottomText || '');

    // Photo
    const {photo} = v;
    if (photo instanceof File) {
      fd.append('photo', photo);
    }

    // Settings
    fd.append('settings[company_name]', v.company_name || '');
    fd.append('settings[is_payee_company_required]', v.is_payee_company_required ? '1' : '0');
    fd.append('settings[address_needed]', v.address_needed ? '1' : '0');
    fd.append('settings[allow_check_number]', v.allow_check_number ? '1' : '0');
    fd.append('settings[is_bank_verify_disabled]', v.is_bank_verify_disabled ? '1' : '0');
    fd.append('settings[deduct_service_fee_from_main_amount]', v.deduct_service_fee_from_main_amount ? '1' : '0');

    // Custom fields
    const customFieldValues = (v.custom_fields || []).filter((f: string | null) => f);
    fd.append('custom_fields', JSON.stringify(customFieldValues));

    // Payment options
    Object.entries(this.selectedPaymentOptions).forEach(([groupKey, val]) => {
      fd.append(`paymentOption[${groupKey}][id]`, String(val.id));
      fd.append(`paymentOption[${groupKey}][status]`, String(val.status));
    });

    // Expiry rules
    if (this.showExpiryRules) {
      if (v.expiryDate) fd.append('expiry_date', v.expiryDate);
      if (v.maxTransactionCount != null) fd.append('max_transaction_count', String(v.maxTransactionCount));
      if (v.maxTotalAmount != null) fd.append('max_total_amount', String(v.maxTotalAmount));
    }

    // Duplicate
    if (this.isDuplicateMode && this.editId) {
      fd.append('cloned_parent_id', this.editId);
    }

    return fd;
  }

  // ──────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────

  goBack(): void {
    if (this.isModal()) {
      if (this.dialogRef) {
        this.dialogRef.close();
      } else {
        this.closed.emit();
      }
      return;
    }
    this.location.back();
  }
}
