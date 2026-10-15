import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { MatRadioButton } from '@angular/material/radio';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  finalize,
  firstValueFrom,
  takeUntil
} from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCircleExclamation,
  faQuestionCircle,
  faChevronDown,
  faChevronUp,
  faPlus,
  faTrash,
  faCircleInfo,
  faBuildingColumns,
  faCreditCard,
  faImage
} from '@fortawesome/pro-solid-svg-icons';
import { faApple, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';
import { MatTooltip } from '@angular/material/tooltip';
import { Location, NgClass } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { IBankDropdown } from 'src/app/models/bank';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { NonNullableFormValue } from 'src/app/models/api';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { IGetPaidByLinkRes } from 'src/app/modules/payment-link/model/Paymentlink';
import { MatDialog } from '@angular/material/dialog';
import { SelectedPaymentLink } from 'src/app/modules/data-table/components/data-table/data-table.model';
import { PaymentSettingsModalComponent } from 'src/app/modules/payment-link/modals/payment-settingsmodal/payment-settings.component';
import { IPaymentData, PaymentLinksMethods } from '../../models/payment-links.model';
import { PaymentLinksPreviewComponent } from '../../components/payment-links-preview/payment-links-preview.component';
import { PaymentLinksService } from '../../services/payment-links.service';

@Component({
  selector: 'app-payment-links-update',
  standalone: true,
  imports: [
    PaymentLinksPreviewComponent,
    FormsModule,
    ReactiveFormsModule,
    V35ControlMessageComponent,
    MatCheckbox,
    MatRadioButton,
    FaIconComponent,
    SearchFilterPipe,
    MatTooltip,
    NgClass,
    BankAcDropdownV3Component,
    CommonUploadButtonV35Component,
    CommonButtonV35Component,
    NgSelectModule
  ],
  templateUrl: './payment-links-update.component.html',
  styleUrl: './payment-links-update.component.scss'
})
export class PaymentLinksUpdateComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  private activatedRoute = inject(ActivatedRoute);
  private paymentLinksApiService = inject(PaymentLinkService);
  private renderer = inject(Renderer2);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private paymentLinksService = inject(PaymentLinksService);
  private location = inject(Location);

  private menu = viewChild<ElementRef<HTMLUListElement>>('menu');
  private toggleButton =
    viewChild<ElementRef<HTMLInputElement>>('toggleButton');

  public staticWhiteLabelConditions = StaticWhiteLabelConditions;
  public mode: 'create' | 'update' = 'create';
  public autoComplete = false;
  public faQuestionCircle = faQuestionCircle;
  public faCircleExclamation = faCircleExclamation;
  public faArrowLeft = faArrowLeft;
  public faChevronDown = faChevronDown;
  public faChevronUp = faChevronUp;
  public faPlus = faPlus;
  public faTrash = faTrash;
  public faCircleInfo = faCircleInfo;
  public faBuildingColumns = faBuildingColumns;
  public faCreditCard = faCreditCard;
  public faImage = faImage;
  public faApple = faApple;
  public faGoogle = faGoogle;
  public redirectUrls: string[] = [];
  private destroy$ = new Subject<boolean>();
  private id?: string;
  private initialShortUrl = '';
  public showMultipleDocumentTypes = false;
  public showMorePaymentOptions = false;
  public showBrandingCustomization = false;
  public showExpiryRules = false;
  public paymentOptions: IPaymentData;
  public isDuplicateMode: boolean = false;

  // Credit card enabled from service
  public creditCardEnabled = signal(false);

  public backgroundImagePreview = signal<string | null>(null);

  public brandColors = [
    { value: '#4A90D9', name: 'Blue' },
    { value: '#34C759', name: 'Green' },
    { value: '#FFD60A', name: 'Yellow' },
    { value: '#FF6B6B', name: 'Red' },
    { value: '#A8E6CF', name: 'Light Green' }
  ];

  public selectedBrandColor = signal('#4A90D9');

  // Minimum expiry date (today)
  public minExpiryDate = new Date().toISOString().split('T')[0];

  public stripe = signal(false);
  public paypal = signal(false);
  public bitpay = signal(false);
  public stripeCheckout = signal(false);
  public isClick = signal(false);
  public paymentOptionsLoading = signal(false);
  public selectedPaymentOptions: { [k: number]: { id: string, status: number } } = {};
  public selectedPayment: { id: string, nickName: string, uuid: string, credentialType: string } | null = null;
  selectedPaypalId: number | null = null;
  selectedStripeId: number | null = null;
  selectedBitpayId: number | null = null;
  selectedStripeCheckoutId: number | null = null;

  public dialog = inject(MatDialog);

  form = new FormGroup({
    name: new FormControl<string | null>(null, [Validators.required]),
    formTempleteId: new FormControl<number | null>(1, [Validators.required]),
    bankAccount: new FormControl<IBankDropdown | null>(null, [
      Validators.required
    ]),
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
    custom_fields: new FormArray([]),
    expiryDate: new FormControl<string | null>(null),
    maxTransactionCount: new FormControl<number | null>(null),
    maxTotalAmount: new FormControl<number | null>(null),
    backgroundImage: new FormControl<File | null>(null),
    brandColor: new FormControl<string | null>('#4A90D9')
  });


  loading = signal(false);
  previewConfig = signal({
    amount: 0,
    companyName: 'Company Name',
    paymentMethods: [] as PaymentLinksMethods[],
    logo: undefined as File | undefined | string,
    companyNameNeeded: false,
    backgroundImage: undefined as File | undefined | string,
    brandColor: '#4A90D9' as string | undefined
  });

  shortUrlValidation = signal({
    valid: true,
    message: '',
    loading: false
  });


  ngOnInit(): void {
    this.id = this.activatedRoute.snapshot.params.id ?? undefined;

    const { isDuplicate } = this.activatedRoute.snapshot.queryParams;
    if (isDuplicate === 'true' || isDuplicate === true) {
      this.isDuplicateMode = true;
    }

    if (this.id) {
      this.mode = this.isDuplicateMode ? 'create' : 'update';
      this.getPaymentData(this.id);
    }

    const hasCreditCard = !!this.paymentLinksService.creditCardEnabled();
    this.creditCardEnabled.set(hasCreditCard);

    if (hasCreditCard) {
      this.previewConfig.update((val) => ({
        ...val,
        paymentMethods: [...val.paymentMethods, 'CREDIT_CARD']
      }));
    }

    this.initForms();
    this.getRedirectUrl();
    this.getPaymentOptionsData();
  }


  get documentTypesArray(): FormArray {
    return this.form.get('custom_fields') as FormArray;
  }

  addDocumentTypeField(): void {
    if (this.documentTypesArray.length >= 3) {
      return;
    }
    const documentTypeControl = new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z\s]*$/),
      Validators.maxLength(30)
    ]);
    this.documentTypesArray.push(documentTypeControl);
  }

  removeDocumentTypeField(index: number): void {
    this.documentTypesArray.removeAt(index);
    if (this.documentTypesArray.length === 0) {
      this.showMultipleDocumentTypes = false;
    }
  }

  toggleMultipleDocumentTypes(): void {
    if (!this.showMultipleDocumentTypes) {
      // Clear all fields when unchecking
      while (this.documentTypesArray.length > 0) {
        this.documentTypesArray.removeAt(0);
      }
    } else {
      // Add first field when checking
      this.addDocumentTypeField();
    }
  }

  private setDocumentTypes(values: string[] | null) {
    this.documentTypesArray.clear();
    if (values && values.length > 0) {
      this.showMultipleDocumentTypes = true;
      values.forEach((value) => {
        this.documentTypesArray.push(new FormControl(value ?? '', [
          Validators.required,
          Validators.pattern(/^[a-zA-Z\s]*$/),
          Validators.maxLength(30)
        ]));
      });
    }
  }

  getSelectedDocumentTypes(): string[] {
    return this.documentTypesArray.controls
      .map(control => control.value)
      .filter(value => value && value.trim());
  }

  ngAfterViewInit(): void {
    const inputElm = this.toggleButton()?.nativeElement;
    const ulElm = this.menu()?.nativeElement;

    if (!inputElm || !ulElm) return;

    this.listenClicks(inputElm, ulElm);
  }

  initForms() {
    this.form.controls.autoRedirect.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (val) {
          this.form.controls.redirectUrl.setValidators([Validators.required]);
        } else {
          this.form.controls.redirectUrl.clearValidators();
        }
        this.form.controls.redirectUrl.updateValueAndValidity();
      });

    this.form.controls.company_name.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((name) => {
        this.previewConfig.update((val) => ({
          ...val,
          companyName: name || 'Company Name'
        }));
      });

    this.form.controls.is_payee_company_required.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((required) => {
        this.previewConfig.update((val) => ({
          ...val,
          companyNameNeeded: Boolean(required)
        }));
      });

    if (this.mode === 'create') {
      this.form.controls.name.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((val) => {
          const value = val?.replace(/ /g, '-');
          this.form.controls.shortUrl.setValue(value ?? null);
        });
    }

    this.form.controls.shortUrl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(this.checkAvailabilityUrl);
  }

  checkAvailabilityUrl = (name: string | null) => {
    if (!name || (this.initialShortUrl === name && this.mode === 'update' && !this.isDuplicateMode)) {
      this.shortUrlValidation.update((val) => ({
        ...val,
        valid: true,
        message: ''
      }));
      return;
    }

    this.shortUrlValidation.update((val) => ({ ...val, loading: true }));
    this.paymentLinksApiService
      .shortUrlCheck(name)
      .pipe(
        finalize(() => {
          this.shortUrlValidation.update((val) => ({ ...val, loading: false }));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.shortUrlValidation.update((val) => ({
            ...val,
            valid: true,
            message: ''
          }));
        },
        error: (err) => {
          this.shortUrlValidation.update((val) => ({
            ...val,
            valid: false,
            message: err.error.errorMsg
          }));
        }
      });
  };

  onBankVerifyRequiredChange(checked: boolean) {
    if (checked) {
      this.form.get('is_bank_verify_disabled')?.setValue(false);
    }
  }
  
  onBankVerifyDisabledChange(checked: boolean) {
    if (checked) {
      this.form.get('isBankVerifyRequired')?.setValue(false);
    }
  }

  listenClicks(inputElm: HTMLInputElement, ulElm: HTMLUListElement) {
    this.renderer.listen('window', 'click', (e: Event) => {
      if (e.target !== inputElm && e.target !== ulElm) {
        this.autoComplete = false;
      }
    });
  }

  getRedirectUrl() {
    this.paymentLinksApiService
      .getRedirectUrl()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.redirectUrls = res.data;
        }
      });
  }

  getPaymentData(id: string) {
    this.paymentLinksApiService
      .getPaymentLinkData(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          const response = res.data;

          const checkIsOne = (param: string | number) =>
            param === 1 || param === '1';

          this.form.patchValue({
            name: response.name,
            formTempleteId: response.formTemplateId,
            bottomText: response.bottomText != null ? response.bottomText : '',
            autoRedirect: checkIsOne(response.autoRedirect),
            isBankVerifyRequired: checkIsOne(response.bankVerificationRequired),
            is_bank_verify_disabled: checkIsOne(response.isBankVerifyDisabled),
            address_needed: checkIsOne(response.addressNeeded),
            allow_check_number: checkIsOne(response.allowCheckNumber),
            redirectUrl: response.redirectUrl ?? '',
            deduct_service_fee_from_main_amount: checkIsOne(
              response.deductServiceFeeFromMainAmount
            ),
            is_payee_company_required: checkIsOne(
              response.isPayeeCompanyRequired
            ),
            company_name: response.companyName
          });

          // Set custom field from response
          // Note: Backend sends 'customFields' (camelCase) not 'custom_fields' (snake_case)
          const customFieldsData = (response as IGetPaidByLinkRes).customFields || response.custom_fields;
          
          let customFieldsArray: string[] = [];
          
          // Handle different possible formats from backend
          if (customFieldsData) {
            // If it's already an array
            if (Array.isArray(customFieldsData)) {
              customFieldsArray = customFieldsData;
            } else if (typeof customFieldsData === 'string') {
              try {
                 // If it's a string, try to parse it as JSON
                customFieldsArray = JSON.parse(customFieldsData);
              } catch (e) {
                // If parsing fails, treat it as a single value
                customFieldsArray = [customFieldsData];
              }
            } else {
              customFieldsArray = [customFieldsData];
            }
          }
          
          // Set all document type values
          this.setDocumentTypes(customFieldsArray.length > 0 ? customFieldsArray : null);
          this.initialShortUrl = response.shortUrl;

          const shortUrlValue = this.isDuplicateMode
            ? `${response.shortUrl}-copy`
            : response.shortUrl;

          this.form.patchValue(
            {
              shortUrl: shortUrlValue
            },
            { emitEvent: this.isDuplicateMode }
          );

          this.selectedPaymentOptions = response.paymentOption as { [k: number]: { id: string, status: number } };
          if (this.selectedPaymentOptions) {
            if (this.selectedPaymentOptions[1]) {
              const selectedId = this.selectedPaymentOptions[1]?.id;
              this.selectedStripeId =
                selectedId !== undefined && selectedId !== null ? Number(selectedId) : null;
              this.stripe.set(true);
            }
            if (this.selectedPaymentOptions[2]) {
              const selectedId = this.selectedPaymentOptions[2]?.id;
              this.selectedPaypalId =
                selectedId !== undefined && selectedId !== null ? Number(selectedId) : null;
              this.paypal.set(true);
            }
            if (this.selectedPaymentOptions[3]) {
              const selectedId = this.selectedPaymentOptions[3]?.id;
              this.selectedBitpayId =
                selectedId !== undefined && selectedId !== null ? Number(selectedId) : null;
              this.bitpay.set(true);
            }
            if (this.selectedPaymentOptions[4]) {
              const selectedId = this.selectedPaymentOptions[4]?.id;
              this.selectedStripeCheckoutId =
                selectedId !== undefined && selectedId !== null ? Number(selectedId) : null;
              this.stripeCheckout.set(true);
            }
          }

          if (this.setItemWithId) {
            this.setItemWithId(response.bankAccountId);
          }

          if (response.logoUrl) {
            this.previewConfig.update((val) => ({
              ...val,
              logo: response.logoUrl
            }));
          }

          const expiryRules = response.expiry_rules;
          if (expiryRules) {
            this.showExpiryRules = true;

            let formattedDate: string | null = null;
            if (expiryRules.expiryDate) {
              const date = new Date(expiryRules.expiryDate);
              formattedDate = date.toISOString().split('T')[0];
            }

            this.form.patchValue({
              expiryDate: formattedDate,
              maxTransactionCount: expiryRules.maxTransactionCount ?? null,
              maxTotalAmount: expiryRules.maxTotalAmount ? parseFloat(expiryRules.maxTotalAmount) : null
            });
          }
        }
      });
  }

  setItemWithId: ((id: string) => void) | undefined;

  onBankDropDownReady(ev: IV3DropDownOnReady) {
    this.setItemWithId = ev.setItemWithId;
  }

  toggleComplete(value: boolean = false) {
    this.autoComplete = value;
  }

  filePicked(file: File) {
    const mimeType = file.type;
    const { size } = file;

    if (!mimeType || !size) {
      this.previewConfig.update((val) => ({
        ...val,
        logo: undefined
      }));
      return;
    }

    if (mimeType.match(/image\/*/) == null) {
      this.errorMsg('Sorry, could not upload this file');
      return;
    }

    this.form.controls.photo.setValue(file ?? null);
    this.previewConfig.update((val) => ({
      ...val,
      logo: file
    }));
  }

  errorMsg(msg: string) {
    const data = {
      title: 'Upload failed',
      content: msg,
      isCancel: false,
      okMsg: 'Ok'
    };

    this.alertService.warningAlert(data);
  }

  getSelected(item: string) {
    const control = this.form.controls.redirectUrl;
    control.patchValue(item);
    this.autoComplete = false;
  }

  createFormData() {
    const formData = new FormData();
    const body = <NonNullableFormValue<typeof this.form.value>>this.form.value;
    const excludedKeys = [
      'company_name',
      'is_payee_company_required',
      'is_bank_verify_disabled',
      'address_needed',
      'allow_check_number',
      'deduct_service_fee_from_main_amount',
      'bankAccount',
      'photo',
      'custom_fields',
      // 'customDomain',
      'expiryDate',
      'maxTransactionCount',
      'maxTotalAmount',
      'backgroundImage',
      'brandColor'
    ];

    Object.entries({ ...body, bankAccountId: body.bankAccount.id }).forEach(
      ([key, value]) => {
        if (!excludedKeys.includes(key)) {
          formData.append(key, `${value ?? ''}`);
        }
      }
    );

    formData.append('autoRedirect', body.autoRedirect ? '1' : '0');
    formData.append('bank', body.autoRedirect ? '1' : '0');
    formData.append(
      'isBankVerifyRequired',
      body.isBankVerifyRequired ? '1' : '0'
    );

    if (body.photo) {
      formData.append('photo', body.photo);
    }

    const setting = {
      company_name: body.company_name,
      is_payee_company_required:
      body.is_payee_company_required === true ? '1' : '0',
      address_needed: body.address_needed === true ? '1' : '0',
      allow_check_number: body.allow_check_number === true ? '1' : '0',
      is_bank_verify_disabled: body.is_bank_verify_disabled === true ? '1' : '0',
      deduct_service_fee_from_main_amount:
      body.deduct_service_fee_from_main_amount === true ? '1' : '0'
    };

    Object.entries(setting).forEach(([key, value]) => {
      formData.append(`settings[${key}]`, value ?? '');
    });

    // Get selected custom fields and send as array
    const customFields = this.getSelectedDocumentTypes();
    
    // Always send custom_fields as array (even if empty)
    formData.append('custom_fields', JSON.stringify(customFields));

    if (this.selectedPaymentOptions) {
      Object.entries(this.selectedPaymentOptions).forEach(([groupKey, value]) => {
        if (value) {
          Object.entries(value).forEach(([key, itemValue]) => {
            formData.append(`paymentOption[${groupKey}][${key}]`, itemValue as string ?? '');
          });
        }
      });
    }

    // Add expiry rules if enabled
    if (this.showExpiryRules) {
      if (body.expiryDate) {
        formData.append('expiry_date', body.expiryDate);
      }
      if (body.maxTransactionCount) {
        formData.append('max_transaction_count', String(body.maxTransactionCount));
      }
      if (body.maxTotalAmount) {
        formData.append('max_total_amount', String(body.maxTotalAmount));
      }
    }

    // Add branding customization if enabled
    if (this.showBrandingCustomization) {
      if (body.backgroundImage) {
        formData.append('background_image', body.backgroundImage);
      }
      if (body.brandColor) {
        formData.append('brand_color', body.brandColor);
      }
    }

    if (this.isDuplicateMode) {
      formData.append('cloned_parent_id', this.id ?? '');
    }


    return formData;
  }

  submit() {
    this.form.markAllAsTouched();
    this.isClick.set(true);
    const shortUrl = this.shortUrlValidation();
    if (this.form.invalid || !shortUrl.valid || shortUrl.loading) return;

    if (
      (this.stripe() && this.selectedPaymentOptions?.[1] === undefined) ||
      (this.paypal() && this.selectedPaymentOptions?.[2] === undefined) ||
      (this.bitpay() && this.selectedPaymentOptions?.[3] === undefined) ||
      (this.stripeCheckout() && this.selectedPaymentOptions?.[4] === undefined)
    ) {
      this.alertService.warningAlert({ content: 'Please select at least one payment option' });
      return;
    }

    if (this.form.value.redirectUrl) {
      if (
        !this.form.value.redirectUrl?.startsWith('http://') &&
        !this.form.value.redirectUrl?.startsWith('https://')
      ) {
        this.form.controls.redirectUrl.setValue(
          `https://${this.form.value.redirectUrl}`
        );
      }
    }

    if (this.mode === 'create' || this.isDuplicateMode) {
      this.loading.set(true);
      this.paymentLinksApiService
        .createLink(this.createFormData())
        .pipe(
          finalize(() => {
            this.loading.set(false);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((val) => {
          if (val.success) {
            this.alertService.successAlert({ content: 'Payment link created' });
            this.router.navigate(['manage', 'payment-links', 'index']);
          }
        });
      return;
    }

    const { id } = this;
    if (!id) return;

    this.loading.set(true);
    this.paymentLinksApiService
      .updateLink(this.createFormData(), id)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(async (val) => {
        if (val.success) {
          const res = await firstValueFrom(
            this.paymentLinksApiService.getPaymentLinkData(id)
          );

          this.paymentLinksService.selectedLink.update(() =>
            this.createSelectedLink(
              res.data,
              this.paymentLinksService.selectedLink()
            )
          );
          this.alertService.successAlert({
            content: 'Payment link successfully updated'
          });
          this.router.navigate(['manage', 'payment-links', 'index']);
        }
      });
  }

  createSelectedLink(
    obj: IGetPaidByLinkRes,
    curr?: SelectedPaymentLink
  ): SelectedPaymentLink {
    return {
      id: obj.id,
      enid: curr?.enid ?? '',
      name: obj.name,
      link: `${this.staticWhiteLabelConditions.paymentShortLink}/${obj.shortUrl}`,
      shortUrl: obj.shortUrl,
      logoUrl: obj.logoUrl,
      isActive: curr?.isActive ?? 1,
      isArchived: curr?.isArchived ?? false,
      bankAccount: {
        bankAccount: '',
        bankName: obj.bankAccount.bankAccountName,
        bankAccountId: obj.bankAccountId,
        bankAccountNickName: obj.bankAccount.bankAccountNickName,
        bankAccountAccountName: obj.bankAccount.bankAccountNickName
      },
      companyName: obj.companyName,
      redirectUrl: obj.redirectUrl,
      bitpayCredentials: obj.bitpayCredentials,
      paypalCredentials: obj.paypalCredentials,
      stripeCredentials: obj.stripeCredentials,
      creditCardFormToken: curr?.creditCardFormToken ?? null,
      paymentOptionAsArray: obj.paymentOption,
      stripeCheckoutCredentials: obj.stripeCheckoutCredentials,
      isPaused: curr?.isPaused ?? null, 
      expiryStatus: curr?.expiryStatus ?? null
    };
  }

  goBack() {
    this.location.back();
  }

  getPaymentOptionsData(type?:string, paymentType?:number, nickName?:string) {
    this.paymentOptionsLoading.set(true);
    this.paymentLinksApiService.paymentOptions()
    .pipe(
    takeUntil(this.destroy$), 
    finalize(() => {
      this.paymentOptionsLoading.set(false);
    }))
    .subscribe({
      next: (res) => {
        if (res.success) {
          this.paymentOptions = res.data;
          if(type && paymentType && nickName) {
            this.setSelectedPaymentOption(type, paymentType, nickName);
          }
        }
      },
      error: (err) => {
        if(err.error.errorCode === 119) {
          this.paymentOptions = {
            stripe_payments: [],
            paypal_payments: [],
            stripe_checkout_payments: [],
            bitpay_payments: []
          };
        }
        this.paymentOptionsLoading.set(false);
      }
    });
  }

  setSelectedPaymentOption(type: string, paymentType: number, nickName: string) {
    switch(paymentType) {
      case 1:
        {
          const stripe = this.paymentOptions.stripe_payments?.find(payment => 
            (payment.nickName === nickName) && (payment.credentialType === type));
          this.selectedStripeId = stripe?.id ?? null;
          this.selectedPaymentOption(String(stripe?.id ?? ''), 1);
          break;
        }
      case 2:
        {
          const paypal = this.paymentOptions.paypal_payments?.find(payment => 
            (payment.nickName === nickName) && (payment.credentialType === type));
          this.selectedPaypalId = paypal?.id ?? null;
          this.selectedPaymentOption(String(paypal?.id ?? ''), 2);
          break;
        }
      case 3:
        {
          const bitpay = this.paymentOptions.bitpay_payments?.find(payment => 
            (payment.nickName === nickName) && (payment.credentialType === type));
          this.selectedBitpayId = bitpay?.id ?? null;
          this.selectedPaymentOption(String(bitpay?.id ?? ''), 3);
          break;
        }
      case 4:
        {
          const stripeCheckout = this.paymentOptions.stripe_checkout_payments?.find(payment => 
            (payment.nickName === nickName) && (payment.credentialType === type));
          this.selectedStripeCheckoutId = stripeCheckout?.id ?? null;
          this.selectedPaymentOption(String(stripeCheckout?.id ?? ''), 4);
          break;
        }
      default:
        break;
    }
  }

  paymentOptionsChange(event: MatCheckboxChange, number: number) {
    if (number === 1) {
      this.stripe.set(!this.stripe());
      if (!this.stripe()) {
        delete this.selectedPaymentOptions[number];
      }
      if(!this.paymentOptions.stripe_payments.length && this.stripe()) {
        this.openEPaymentSettings(1);
      }
    } else if (number === 2) {
      this.paypal.set(!this.paypal());
      if (!this.paypal()) {
        delete this.selectedPaymentOptions[number];
      }
      if(!this.paymentOptions.paypal_payments.length && this.paypal()) {
        this.openEPaymentSettings(2);
      }
    } else if (number === 4) {
      this.stripeCheckout.set(!this.stripeCheckout());
      if (!this.stripeCheckout()) {
        delete this.selectedPaymentOptions[number];
      }
      if(!this.paymentOptions.stripe_checkout_payments.length && this.stripeCheckout()) {
        this.openEPaymentSettings(4);
      }
    } else if (number === 3) {
      this.bitpay.set(!this.bitpay());
      if (!this.bitpay()) {
        delete this.selectedPaymentOptions[number];
      }
      if(!this.paymentOptions.bitpay_payments.length && this.bitpay()) {
        this.openEPaymentSettings(3);
      }
    }
  }

  selectedPaymentOption(value: string, type: number) {
    this.isClick.set(false);
    const values = {
      status: 1,
      id: value
    };

    this.selectedPaymentOptions ??= {};
    
    this.selectedPaymentOptions[type] = values;
  }

  openEPaymentSettings(type: number, source: 'ng-select' | 'checkbox'='checkbox') {
    const modal = this.dialog.open(PaymentSettingsModalComponent, {
      width: '500px',
      disableClose:true,
      data: {
        id: this.id,
        typeId: type
      }
    });

    modal.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res?.success) {
        this.getPaymentOptionsData(res.type, res.paymentType, res.nickName);
      } else {
        this.handleModalClose(type, source);
      }
    });
  }

  handleModalClose(type: number, source: 'ng-select' | 'checkbox'='checkbox') {
      if(type === 1) {
        if(source!=='ng-select') this.stripe.set(false);
      }else if(type === 2) {
        if(source!=='ng-select') this.paypal.set(false);
      }else if(type === 4) {
        if(source!=='ng-select') this.stripeCheckout.set(false);
      }else if(type === 3) {
        if(source!=='ng-select') this.bitpay.set(false);
      }
  }

  // Toggle payment option by clicking on the card
  togglePaymentOption(type: number) {
    const event = { checked: false } as MatCheckboxChange;
    if (type === 1) {
      event.checked = !this.stripe();
    } else if (type === 2) {
      event.checked = !this.paypal();
    } else if (type === 4) {
      event.checked = !this.stripeCheckout();
    } else if (type === 3) {
      event.checked = !this.bitpay();
    }
    this.paymentOptionsChange(event, type);
  }

  // Brand color selection
  selectBrandColor(color: string) {
    this.selectedBrandColor.set(color);
    this.form.get('brandColor')?.setValue(color);
    this.previewConfig.update((val) => ({
      ...val,
      brandColor: color
    }));
  }

  // Background image selection
  onBackgroundImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        this.alertService.warningAlert({
          title: 'Invalid file type',
          content: 'Please select a JPG or PNG image',
          isCancel: false,
          doneMsg: 'OK'
        });
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.alertService.warningAlert({
          title: 'File too large',
          content: 'Please select an image under 2MB',
          isCancel: false,
          doneMsg: 'OK'
        });
        return;
      }

      // Set form control
      this.form.get('backgroundImage')?.setValue(file);

      // Update preview config with the file
      this.previewConfig.update((val) => ({
        ...val,
        backgroundImage: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.backgroundImagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
