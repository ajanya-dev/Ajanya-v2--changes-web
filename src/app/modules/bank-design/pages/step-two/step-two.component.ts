import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
  inject
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { signatureUploadPanelComponent } from 'src/app/shared/components/upload-panel/signature-upload-panel/signature-upload-panel.component';
import { TooltipPosition, MatTooltip } from '@angular/material/tooltip';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { Subscription } from 'rxjs';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { finalize } from 'rxjs/operators';
import { LogoUploadPanelComponent } from 'src/app/shared/components/upload-panel/logo-upload-panel/logo-upload-panel.component';
import { NewBankNickNameModalComponent } from '../../modals/new-bank-nick-name-modal/new-bank-nick-name-modal.component';
import { ActivatedRoute, Params } from '@angular/router';
import { Utils } from 'src/app/data/utils';
import { NgxMaskDirective } from 'ngx-mask';
import { NgClass, NgIf } from '@angular/common';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { Moengage } from 'src/app/data/data/moengage';

@Component({
  selector: 'app-step-two',
  templateUrl: './step-two.component.html',
  styleUrls: ['./step-two.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgIf,
    MatTooltip,
    NgxMaskDirective
  ]
})
export class StepTwoComponent implements OnInit, OnDestroy {
  @ViewChild('bankHolderAddressSearch')
  public bankSearchElementRef!: ElementRef;

  @ViewChild('BankAddressSearch')
  public HolderSearchElementRef2!: ElementRef;

  //===> common variables
  placeHolder: boolean;
  changeCountry = true;
  checkNumber: number;
  accountNumber: number;
  routingNumber: number | string;
  transNumber: number | string;
  finNumber: number | '';
  signaturePadImg = '';
  logoPadImg = '';
  showLine = false;
  checkForm!: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  loading = false;
  first: string;

  utils = Utils;

  logoImage: string;
  country = 'USA'; //default
  signatureUrl: string;
  logoUrl: string;
  allowHyphen = false;

  // Bank setup tracking
  bankSetupInitiatedTime = performance.now();
  stepsCompleted = signal(0);
  selectedBankName = signal<string | null>(null);
  isBankSetupCancelled = signal<boolean>(false);
  isFirstBankAttempt = signal<boolean>(false);
  bankCountBefore = signal<number>(0);
  isBankSetupInitiated = signal<boolean>(false);

  //===> tooltip position and init
  positionOptions: TooltipPosition[] = [
    'after',
    'before',
    'above',
    'below',
    'left',
    'right'
  ];
  signClosePosition = new UntypedFormControl(this.positionOptions[5]);

  queryParams: Params;
  private postHogService = inject(PostHogService);

  constructor(
    public breakpointObserver: BreakpointObserver,
    public dialog: MatDialog,
    private fb: UntypedFormBuilder,
    private _alertService: AlertService,
    private _bankAccService: BankAccountsService,
    private _googleAddressService: GoogleAddressService,
    private _route: ActivatedRoute
  ) {}

  checkFromInit() {
    this.checkForm = this.fb.group({
      // company details
      companyName: new UntypedFormControl('', [Validators.required, ValidationService.personNameValidator]),
      mainAddressLineOne: new UntypedFormControl('', [Validators.required]),
      mainAddressLineTwo: new UntypedFormControl('', Validators.minLength(3)),
      companyCity: new UntypedFormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      companyState: new UntypedFormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      companyZip: new UntypedFormControl('', [
        Validators.required,
        ValidationService.zipValidator,
        ValidationService.noWhitespaceValidator
      ]),
      phoneNumber: new UntypedFormControl('', [
        ValidationService.phoneNumberValidator
      ]),
      emailAddress: new UntypedFormControl(
        '',
        ValidationService.emailValidator
      ),

      // bank details
      bankAccountName: new UntypedFormControl('', [Validators.required]),
      bankAddress: new UntypedFormControl(''),
      bankCity: new UntypedFormControl('', [
        ValidationService.noWhitespaceValidator
      ]),
      bankState: new UntypedFormControl('', [
        ValidationService.noWhitespaceValidator
      ]),
      bankZip: new UntypedFormControl('', [ValidationService.zipValidator]),
      checkNumber: new UntypedFormControl(''),
      fractionalNumber: new UntypedFormControl(''),
      bankAccountType: new UntypedFormControl(''),

      // bottom fields
      routingNumber: new UntypedFormControl('', [
        ValidationService.routingNumberValidator
      ]),
      accountNumber: new UntypedFormControl('', [
        Validators.required,
        Validators.minLength(5)
      ]),
      transitNumber: new UntypedFormControl(''),
      finantialInstNumber: new UntypedFormControl(''),

      nickName: new UntypedFormControl('', [Validators.required]),
      checkType: new UntypedFormControl('')
    });
  }

  add() {
    const checkBody = this.createCheckBody();
    this.dialog.open(NewBankNickNameModalComponent, {
      maxWidth: '400px',
      width: '95%',
      disableClose: true,
      autoFocus: false,
      data: {
        checkBody: checkBody
        // customizeTemplateForCheckDesignId
      }
    });
  }

  /**
   * @description  submit the checkform.
   *
   */
  checkFromSubmit() {
    if (this.checkForm.controls.companyName.invalid) {
      // personNameValidator reports a separate key per rule (bad characters, too short,
      // too long, no letters); any of them means the name is present but malformed.
      const hasNameFormatError = [
        'invalidNameChars',
        'invalidNameLength',
        'invalidNameLetter',
        'maxLength'
      ].some((error) => this.checkForm.controls.companyName.hasError(error));

      this.openValidationAlert(
        hasNameFormatError
          ? 'Please enter a valid Company Name/ Your Name. It cannot contain only numbers or invalid characters.'
          : 'Please enter your Company Name/ Your Name'
      );
      return;
    }
    if (this.checkForm.controls.mainAddressLineOne.invalid) {
      this.openValidationAlert('Please Enter Your Address');
      return;
    }

    if (this.checkForm.controls.mainAddressLineTwo.invalid) {
      this.openValidationAlert('Invalid Addressline 2');
      return;
    }

    if (this.checkForm.controls.companyCity.invalid) {
      this.openValidationAlert('Please Enter Your City');
      return;
    }
    if (this.checkForm.controls.companyState.invalid) {
      this.openValidationAlert('Please Enter Your State');
      return;
    }

    if (this.checkForm.controls.companyZip.invalid) {
      if (this.checkForm.controls.companyZip.errors?.required) {
        this.openValidationAlert('Please Enter Your Zip');
        return;
      }
      if (!this.checkForm.controls.companyZip.errors?.zipValidator) {
        this.openValidationAlert('Invalid zip');
        return;
      }
    }
    if (this.checkForm.controls.phoneNumber.invalid) {
      this.openValidationAlert('Invalid Phone Number');
      return;
    }
    if (this.checkForm.controls.emailAddress.invalid) {
      this.openValidationAlert('Invalid Email Address');
      return;
    }

    // bank detail validation
    if (this.checkForm.controls.bankAccountName.invalid) {
      this.openValidationAlert('Please Enter Your Bank Name');
      return;
    }
    if (this.checkForm.controls.bankZip.invalid) {
      this.openValidationAlert('Invalid Bank Zip');
      return;
    }
    if (this.checkForm.controls.checkNumber.invalid) {
      if (this.checkForm.controls.checkNumber.errors?.required) {
        this.openValidationAlert('Please Enter Your Check Number');
        return;
      }
      if (this.checkForm.controls.checkNumber.errors?.minlength) {
        this.openValidationAlert('Invalid Check Number');
        return;
      }
    }

    // bottom fields validation
    if (this.checkForm.controls.routingNumber.invalid) {
      if (this.checkForm.controls.routingNumber.errors?.required) {
        this.openValidationAlert('Please Enter Routing Number');
        return;
      }
      if (
        !this.checkForm.controls.routingNumber.errors?.routingNumberValidator
      ) {
        this.openValidationAlert('Invalid Routing NUmber');
        return;
      }
    }
    if (this.checkForm.controls.accountNumber.invalid) {
      if (this.checkForm.controls.accountNumber.errors?.required) {
        this.openValidationAlert('Please Enter Account Number');
        return;
      }
      if (this.checkForm.controls.accountNumber.errors?.minlength) {
        this.openValidationAlert('Invalid Account Number');
        return;
      }
    }

    if (
      String(this.checkForm.controls.accountNumber.value).substring(0, 1) ===
      '-'
    ) {
      this.openValidationAlert('Invalid Account Number');
      return;
    }

    if (this.checkForm.controls.transitNumber.invalid) {
      this.openValidationAlert('Please Enter Transit Number');
      return;
    }

    if (this.checkForm.controls.finantialInstNumber.invalid) {
      this.openValidationAlert('Please Enter finantial  Number');
      return;
    }

    if (this.checkForm.controls.nickName.invalid) {
      let customizeTemplateForCheckDesignId;
      if (this.queryParams?.templete_type === '17') {
        // Pre printed check
        customizeTemplateForCheckDesignId = '3';
      }

      const checkBody = this.createCheckBody();
      this.dialog.open(NewBankNickNameModalComponent, {
        maxWidth: '400px',
        width: '95%',
        disableClose: true,
        autoFocus: false,
        data: {
          checkBody: checkBody,
          customizeTemplateForCheckDesignId
        }
      });

      return;
    }

    if (this.checkForm.valid) {
      this.loading = true;

      this.subscriptions.push(
        this._bankAccService
          .AddBank(this.createCheckBody())
          .pipe(finalize(() => (this.loading = false)))
          .subscribe((res) => {
            if (res.success) {
              // Mark as successfully completed to prevent abandonment tracking
              this.isBankSetupCancelled.set(true);
              this.loading = false;
              this.onSuccessAlert();
            }
          })
      );
    }
  }

  onSuccessAlert() {
    const data = {
      close: true,
      timeout: 2000,
      title: 'Success!',
      content: 'Bank Account Added.'
    };
    this._alertService.successAlert(data);
  }

  /**
   * @description  To create data.
   *
   */
  createCheckBody() {
    return {
      // company details
      // companyName: this.getCheckFormValue('companyName'),

      bankAccountName: this.getCheckFormValue('companyName'), ///
      bankRoutingNumber: this.getCheckFormValue('routingNumber'),
      bankAccountNumber: this.getCheckFormValue('accountNumber'), ///
      bankAccountAddressLine1: this.getCheckFormValue('mainAddressLineOne'), ///
      bankAccountAddressLine2: this.getCheckFormValue('mainAddressLineTwo'), ///
      bankAccountCity: this.getCheckFormValue('companyCity'), ///
      bankAccountState: this.getCheckFormValue('companyState'), ///
      bankAccountZip: this.getCheckFormValue('companyZip'), ///
      bankAccountPhone: this.maskPhoneNo(), ///
      bankAccountEmail: this.getCheckFormValue('emailAddress'), ///

      bankName: this.getCheckFormValue('bankAccountName'), ///
      bankAddress: this.getCheckFormValue('bankAddress'), ///
      bankCity: this.getCheckFormValue('bankCity'), ///
      bankZip: this.getCheckFormValue('bankZip'), ///
      checkSerialNumber: this.getCheckFormValue('checkNumber') ?? '', ///
      bankAccountType: this.getCheckFormValue('bankAccountType'),

      transitNumber: this.getCheckFormValue('transitNumber'), ///
      financialNumber: this.getCheckFormValue('finantialInstNumber'), ///

      signatureImage: this.signatureUrl,
      logoImage: this.logoUrl,
      country: this.country,
      bankIdentity: this.getCheckFormValue('fractionalNumber'),
      checkType: this.queryParams.check_type

      // // bank details
      // bankAddress: this.getCheckFormValue('bankAddress'),
      // bankState: this.getCheckFormValue('bankState'),

      // // bottom fields
      // transitNumber: this.getCheckFormValue('transitNumber'),
      // finantialInstNumber: this.getCheckFormValue('finantialInstNumber')
    };
  }

  getCheckFormValue(name: string) {
    return this.checkForm.get(name)?.value;
  }

  /**
   *
   * @description Masks the phone number by formatting it in the pattern "(XXX) XXX-XXXX".
   * @returns The masked phone number.
   */
  maskPhoneNo() {
    const phoneNo = this.getCheckFormValue('phoneNumber');
    if (phoneNo !== '') {
      const formattedNumber = phoneNo.slice(-10);
      const num = String(formattedNumber);
      const num1 = num.substring(0, 3);
      const num2 = num.substring(3, 6);
      const num3 = num.substring(6, 10);
      const maskedPhoneNumber = '(' + num1 + ') ' + num2 + '-' + num3;
      return maskedPhoneNumber;
    } else {
      return '';
    }
  }

  //==> validation fields
  openValidationAlert(content: string) {
    const data = {
      title: 'Oops',
      content: content,
      doneMsg: 'OK',
      isCancel: false,
      close: false
    };
    return this._alertService.warningAlert(data);
  }

  /**
   * @description  To open signature modal.
   *
   */
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
      //======> Sign tip msg
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

  ngOnInit(): void {
    this.bankSetupInitiatedTime = performance.now();
    this.queryParams = this._route.snapshot.queryParams;
    //===> upload logo area start
    this.checkFromInit();
    // this.initForm();
    this.getBankData();

    const values = document.querySelector<HTMLSelectElement>('#country')!.value;

    this.validationSet(values);

    setTimeout(() => {
      //====> AUTO SIZE CHECK WITH IMG
      const check_form_wrapper = document.querySelector(
        '.check_form_wrapper'
      ) as HTMLElement;
      check_form_wrapper?.classList.add('done');
      const check_bg_img = document.querySelector('.check_bg_img')!;

      let currHeight: number;
      if (check_bg_img) {
        currHeight = check_bg_img.clientHeight;
      }
      check_form_wrapper.style.height = `${currHeight!}px`;
      // module_top_section.style.height = `${currHeight + 175}px`;

      //====> ADD INPUT ELEMENT IN MOBILE DEVICE
      const inputsInsideCheck: NodeListOf<HTMLInputElement> =
        document.querySelectorAll('.check_contents_wrapper input')!;
      this.breakpointObserver
        .observe(['(max-width: 767.8px)'])
        .subscribe((state: BreakpointState) => {
          inputsInsideCheck.forEach(() => {
            if (state.matches) {
              this.placeHolder = false;
            } else {
              this.placeHolder = true;
            }
          });
        });
    }, 2000);
    this._googleAddressService.resetGoogleAutocompleteAPI();
  }

  //==== Check img height equal inside inputs
  @HostListener('window:resize', ['$event'])
  onResize() {
    const check_form_wrapper = document.querySelector(
      '.check_form_wrapper'
    ) as HTMLElement;
    const check_bg_img = document.querySelector('.check_bg_img')!;

    const currHeight = check_bg_img.clientHeight;
    check_form_wrapper.style.height = `${currHeight}px`;
  }

  //==== Change country with input
  countryChange(small: HTMLElement, country: { value: string }) {
    this.country = country.value;

    small.classList.add('active');
    this.checkForm.controls.accountNumber.setValue('');
    if (country.value == 'CANADA') {
      this.changeCountry = false;
      this.allowHyphen = true;
    } else {
      this.changeCountry = true;
      this.allowHyphen = false;
    }
    this.validationSet(country.value);
  }

  /**
   * @description  To set validation.
   *
   */
  validationSet(value: string) {
    const usaPortal = document.querySelector('.bottom_section')!;
    if (value == 'USA') {
      usaPortal.classList.add('changeIt');

      this.checkForm.controls.routingNumber.setValidators(Validators.required);
      this.checkForm.controls.transitNumber.clearValidators();
      this.checkForm.controls.finantialInstNumber.clearValidators();
    } else if (value == 'CANADA') {
      usaPortal.classList.remove('changeIt');

      this.checkForm.controls.transitNumber.setValidators(Validators.required);
      this.checkForm.controls.finantialInstNumber.setValidators(
        Validators.required
      );
      this.checkForm.controls.routingNumber.clearValidators();
    }

    this.checkForm.controls.routingNumber.updateValueAndValidity();
    this.checkForm.controls.transitNumber.updateValueAndValidity();
    this.checkForm.controls.finantialInstNumber.updateValueAndValidity();
  }

  //Load Google Address API
  loadGoogleAddress(address: HTMLInputElement) {
    this._googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us', 'ca']
    });

    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
        this.checkForm.patchValue({
          mainAddressLineOne: res.address,
          companyCity: res.city,
          companyState: res.state,
          companyZip: res.zip
        });

        googleAddressSubscription.unsubscribe();
      });
  }

  loadBankGoogleAddress(address: HTMLInputElement, addressInstance: number) {
    this._googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us', 'ca'],
      addressInstance: addressInstance
    });

    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
        this.checkForm.patchValue({
          bankAddress: res.address,
          bankCity: res.city,
          bankState: res.state,
          bankZip: res.zip
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  //==== Text field work only number
  isNumberKey(evt: { which: number; keyCode: number }): boolean {
    const charCode = evt.which ? evt.which : evt.keyCode;
    if (charCode != 45 && charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  backtickDesble(evt: { which: number; keyCode: number }): boolean {
    const charCode = evt.which ? evt.which : evt.keyCode;
    if (charCode == 96) {
      return false;
    }
    return true;
  }

  //==================== MICR value updating
  setRoutingNumber(number: string) {
    this.routingNumber = number;
    this.transNumber = '';

    const rout_no = number;

    if (rout_no?.length >= 9) {
      this.subscriptions.push(
        this._bankAccService.getroutingNumber(rout_no).subscribe((res) => {
          const bank_details = res.data;
          
          // Track bank name for abandonment
          this.selectedBankName.set(bank_details.name);

          this.checkForm.patchValue({
            bankAccountName: bank_details.name,
            bankAddress: bank_details.address,
            bankCity: bank_details.city,
            bankState: bank_details.state,
            bankZip: bank_details.zip
          });
        })
      );
    } else {
      this.checkForm.patchValue({
        bankAccountName: '',
        bankAddress: '',
        bankCity: '',
        bankState: '',
        bankZip: ''
      });
    }
  }

  setTransNumber(number: {
    value: string;
    attributes: { maxlength: { value: string } };
  }) {
    //==== Auto focus transNo to FinNo
    const Fins = document.querySelector(
      '[name=finantialInstNumber]'
    ) as HTMLInputElement;
    if (number.value?.length === parseInt(number.attributes.maxlength.value)) {
      Fins.focus(), (this.showLine = true);
      this.showLine = false;
    }

    this.routingNumber = '';
    this.transNumber = number.value;
  }

  setFinNumber(number: number | '') {
    this.finNumber = number;
    this.routingNumber = '';
  }

  //==========> UPLOAD LOGO AREA SECTION START

  removeLogo() {
    this.logoPadImg = '';
  }

  /**
   * @description  To open logo modal.
   *
   */
  openLogoModal() {
    const dialogRef = this.dialog.open(LogoUploadPanelComponent, {
      maxWidth: '850px',
      width: '95%',
      panelClass: 'upload_panel_wrapper',
      minHeight: '550px',
      disableClose: true
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (logoImg: {
          logoUrl: string;
          uploadLogo?: string;
          existImg?: string;
        }) => {
          //======> Sign tip msg
          // sessionStorage.setItem("signTipVal", JSON.stringify(this.showSignTip = !this.showSignTip));
          // JSON.parse(sessionStorage.getItem("signTipVal")!)

          this.logoUrl = logoImg?.logoUrl;

          this.logoPadImg = logoImg.logoUrl;

          if (logoImg?.uploadLogo) {
            this.logoPadImg = logoImg?.uploadLogo;
          }
          if (logoImg?.existImg) {
            this.logoPadImg = logoImg.existImg;
            this.logoUrl = logoImg.existImg;
          }
        }
      );
  }

  get bankInstruction() {
    return 'https://support.onlinecheckwriter.com/portal/kb/articles/how-can-i-add-canadian-bank-account?_ga=2.2609654.759006251.1643345001-229776703.1642395128';
  }

  setCompanyName(event: Event) {
    const target = event?.target as HTMLInputElement;
    if (target?.value) {
      this._bankAccService.companyName = target.value;
    }
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

  triggerBankSetupAbandoned(): void {
    const duration = performance.now() - this.bankSetupInitiatedTime;
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

  getBankSelectedType(bankName: string | null): string | null {
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

  getBankData(){
    this.subscriptions.push(
    this._bankAccService.getBankAccounts(1, '').subscribe({
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
    // Track abandonment only if setup was initiated but not successfully completed
    if (this.isBankSetupInitiated() && !this.isBankSetupCancelled()) {
      this.triggerBankSetupAbandoned();
    }
    
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
