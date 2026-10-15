import {
  DOCUMENT,
  DatePipe,
  Location,
  NgIf,
  NgFor,
  NgClass,
  KeyValuePipe
} from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  Renderer2,
  inject
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { AchService } from 'src/app/shared/service/ach/ach.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { environment } from 'src/environments/environment';
import { Utils } from 'src/app/data/utils';
import { ActivatedRoute, Router } from '@angular/router';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from '../../../../../shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
declare let Persona: {
  Client: new (arg0: {
    templateId: string;
    environment: string;
    onLoad: () => void;
    onComplete: (inquiryId: string) => void;
    onError: (err: { status: number; code: string }) => void;
  }) => any;
};

export type TPersonalVerificationSteps =
  | 'details'
  | 'verify'
  | 'completed'
  | 'have-a-business'
  | 'done';

@Component({
  selector: 'app-verify-user-id-ocw-v3',
  templateUrl: './verify-user-id-ocw-v3.component.html',
  styleUrls: ['./verify-user-id-ocw-v3.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    ControlMessageComponent,
    NgFor,
    NgClass,
    NgxMaskDirective,
    CommonUploadButtonV35Component,
    CommonButtonV35Component,
    KeyValuePipe
  ]
})
export class VerifyUserIdOcwV3Component implements OnInit, OnDestroy {
  @Input() prevStepObservable: Observable<void>;
  @Input() currentIndex: number;
  @Output() nextEvent = new EventEmitter();
  @Output() stepChangeEvent = new EventEmitter<TPersonalVerificationSteps>();
  @Output() loadingEvent = new EventEmitter<{ loading: boolean }>();

  utils = Utils;
  private renderer2 = inject(Renderer2);
  private fb = inject(FormBuilder);
  private googleAddressService = inject(GoogleAddressService);
  private cloudBankService = inject(CloudBankService);
  private achService = inject(AchService);
  private alertService = inject(AlertService);
  private verificationService = inject(CommonVerificationService);
  private gettingStartedService = inject(GettingStartedService);
  private datePipe = inject(DatePipe);
  private document = inject<Document>(DOCUMENT);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  location = inject(Location);

  PERSONA_TEMPLATE_ID = environment.PERSONA_TEMPLATE_ID;
  PERSONA_ENVIRONMENT = environment.PERSONA_ENVIRONMENT;

  subscriptions: Subscription[] = [];
  currentStep: TPersonalVerificationSteps = 'details';
  localNationalDocument: File | null = null;
  personalForm: FormGroup;
  countries: string[] = [];
  allowedcountries: Record<string, string>;
  loading = false;
  statusLoading = false;
  isPersonaVerified = false;
  idMask = '000-00-0000';
  maskPassport = '00000000000000000000000';
  todayDate: string | null;
  sourceType: CVSourceType;
  customPattern = {
    1: { pattern: new RegExp('\\d'), symbol: '*' },
    0: { pattern: new RegExp('\\d') },
    symbol: '',
    2: { pattern: new RegExp('\\d'), symbol: '*' }
  };
  customPatternPassport = {
    1: { pattern: new RegExp('[a-zA-Z0-9]'), symbol: '' },
    0: { pattern: new RegExp('[a-zA-Z0-9]'), symbol: '' }
  };
  ngOnInit(): void {
    // to get the backEvent From parent Component
    this.subscriptions.push(
      this.prevStepObservable.subscribe(() => {
        this.prevStep();
      })
    );
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.todayDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    this.checkPersonaVerificationStatus();
    this.initForm();
    this.getAllowedCountries();
    this.formChange();
    this.loadPersona();

    if (this.currentIndex === 2) {
      this.currentStep = 'have-a-business';
    }
    /**
     * update the source type based on type received from queryParams.
     */
    this.route.queryParams.subscribe((params) => {
      this.sourceType = params.type
        ? params.type
        : CVSourceType.getting_started;
    });
  }

  checkPersonaVerificationStatus() {
    this.statusLoading = true;
    this.subscriptions.push(
      this.verificationService
        .checkPersonaVerificationStatus()
        .pipe(finalize(() => (this.statusLoading = false)))
        .subscribe({
          next: (res) => {
            if (res.data.status === 'completed') {
              this.isPersonaVerified = true;
            }
          }
        })
    );
  }

  initForm() {
    this.personalForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zip: ['', [Validators.required]],
      dateOfBirth: new FormControl('', Validators.required),
      country: ['', [Validators.required]],
      idType: ['ssn', [Validators.required]],
      idNumber: ['', [Validators.required, Validators.minLength(9)]],
      nationality: ['', []],
      localPhone: ['', []]
    });
  }

  formChange(): void {
    this.subscriptions.push(
      this.personalForm.controls.idType.valueChanges.subscribe((val) => {
        this.personalForm.controls.idNumber.setValue('');
        if (val === 'passport') {
          this.personalForm.controls.idNumber.clearValidators();
          this.personalForm.controls.idNumber.updateValueAndValidity();
          this.personalForm.controls.idNumber.addValidators([
            Validators.required,
            Validators.minLength(4)
          ]);
          this.personalForm.controls.nationality.addValidators([
            Validators.required
          ]);
          this.personalForm.controls.localPhone.addValidators([
            ValidationService.phoneNumberValidator,
            Validators.required
          ]);
          this.idMask = 'AAAAAAAAAAAAAAAAAAAAAAA';
        } else {
          this.personalForm.controls.idNumber.clearValidators();
          this.personalForm.controls.nationality.clearValidators();
          this.personalForm.controls.nationality.updateValueAndValidity();
          this.personalForm.controls.idNumber.updateValueAndValidity();
          this.personalForm.controls.idNumber.addValidators([
            Validators.required,
            Validators.minLength(9)
          ]);
          this.personalForm.controls.localPhone.clearValidators();
          this.idMask = '000-00-0000';
        }
        this.personalForm.controls.nationality.updateValueAndValidity();
        this.personalForm.controls.localPhone.updateValueAndValidity();
        this.personalForm.controls.idNumber.updateValueAndValidity();
      })
    );
  }

  onFocus(mask: string) {
    if (mask === 'ssn') {
      this.idMask = '111-11-0000';
    }
    this.customPattern = {
      1: { pattern: new RegExp('\\d'), symbol: '' },
      0: { pattern: new RegExp('\\d') },
      symbol: '',
      2: { pattern: new RegExp('\\d'), symbol: '' }
    };
    this.customPatternPassport = {
      1: { pattern: new RegExp('[a-zA-Z0-9]'), symbol: '' },
      0: { pattern: new RegExp('[a-zA-Z0-9]'), symbol: '' }
    };
  }

  replaceCharacters(inputString: string, replacement: '1', length: number) {
    const replacementString = replacement.repeat(length);
    return replacementString + inputString.slice(length);
  }

  onBlur(mask: string) {
    if (mask === 'ssn') {
      this.idMask = '111110000';
    } else {
      const PassportLength = this.personalForm.controls.idNumber.value.length;
      if (PassportLength <= 4) {
        this.customPatternPassport = {
          1: { pattern: new RegExp('[a-zA-Z0-9]'), symbol: '' },
          0: { pattern: new RegExp('[a-zA-Z0-9]'), symbol: '' }
        };
        return;
      } else {
        this.maskPassport = this.replaceCharacters(
          '00000000000000000000000',
          '1',
          PassportLength - 4
        );
        this.customPatternPassport = {
          1: { pattern: new RegExp('[a-zA-Z0-9]'), symbol: '*' },
          0: { pattern: new RegExp('[a-zA-Z0-9]'), symbol: '' }
        };
        return;
      }
    }
    this.customPattern = {
      1: { pattern: new RegExp('\\d'), symbol: '*' },
      0: { pattern: new RegExp('\\d') },
      symbol: '',
      2: { pattern: new RegExp('\\d'), symbol: '*' }
    };
  }

  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: this.countries,
      displayShortName: true
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.personalForm.patchValue({
          address: res.address,
          city: res.city,
          state: res.state,
          zip: res.zip,
          country: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  nextStep() {
    this.googleAddressService.resetGoogleAutocompleteAPI();

    if (this.loading) {
      return;
    }

    if (this.currentStep === 'verify') {
      this.personalVerification();
    } else if (this.currentStep === 'details' && this.currentIndex !== 2) {
      if (
        this.personalForm.invalid ||
        (this.personalForm.controls.idType.value === 'passport' &&
          !this.localNationalDocument?.name)
      ) {
        this.personalForm.markAllAsTouched();
        return;
      }
      if (this.isPersonaVerified) {
        this.verifyDateOfBirthAndSsn();
      } else {
        this.currentStep = 'verify';
        this.stepChangeEvent.emit('verify');
        this.nextEvent.emit();
      }
    } else if (this.currentIndex === 2 && this.currentStep !== 'completed') {
      this.nextEvent.emit({ hasBusiness: true });
    } else {
      /**
       * If KYC verification is required from `SubscriptionKycRequiredWarningModalComponent`,
       * navigate to prevoius page after apply KYC.
       */
      if (this.sourceType === CVSourceType.subscription) {
        this.location.back();
      } else {
        this.router.navigateByUrl('/manage/verification/index');
      }
    }
  }

  prevStep() {
    if (this.currentStep === 'have-a-business') {
      this.currentStep = 'verify';
      this.stepChangeEvent.emit('verify');
    } else if (this.currentStep === 'verify') {
      this.currentStep = 'details';
      this.stepChangeEvent.emit('details');
    }
  }

  personalVerification() {
    this.loading = true;
    this.loadingEvent.emit({ loading: true });
    const client = new Persona.Client({
      templateId: `${this.PERSONA_TEMPLATE_ID}`,
      environment: `${this.PERSONA_ENVIRONMENT}`,
      onLoad: () => {
        this.loading = false;
        this.loadingEvent.emit({ loading: false });
        client.open();
      },
      onComplete: (inquiryId: string) => {
        this.personaVerify(inquiryId);
      },
      onError: (err: { status: number; code: string }) => {
        if (err) {
          this.loading = false;
          this.loadingEvent.emit({ loading: false });
        }
      }
    });
  }

  loadPersona(): void {
    const s = this.renderer2.createElement('script');
    s.type = 'text/javascript';
    s.src = 'https://cdn.withpersona.com/dist/persona-v3.8.0.js';
    this.renderer2.appendChild(this.document.body, s);
  }

  personaVerify(inquiryId: string) {
    this.loading = true;
    this.loadingEvent.emit({ loading: true });
    this.subscriptions.push(
      this.achService
        .personaVerification(inquiryId)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.loadingEvent.emit({ loading: false });
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.verifyDateOfBirthAndSsn();
          } else {
            const alert = this.alertService.failedAlert({
              content: 'Verification process failed please try again.',
              isCancel: true,
              doneMsg: 'Try again'
            });
            alert.afterClosed().subscribe((res) => {
              if (res) {
                this.currentStep = 'verify';
                this.stepChangeEvent.emit('verify');
                this.nextStep();
              }
            });
          }
        })
    );
  }

  verifyDateOfBirthAndSsn(): void {
    this.personalForm.markAllAsTouched();
    if (this.personalForm.invalid) return;
    this.verifyData();
  }

  verifyData() {
    const kycData = this.personalForm.value;
    const kycformData = new FormData();
    kycformData.append('source', this.sourceType);
    for (const key in kycData) {
      kycformData.append(key, kycData[key]);
    }
    if (this.localNationalDocument?.name) {
      kycformData.append(
        'document[localNationalDocument]',
        this.localNationalDocument
      );
    }

    this.loading = true;
    this.loadingEvent.emit({ loading: true });
    this.subscriptions.push(
      this.verificationService
        .kycVerification(kycformData)
        .pipe(
          finalize(() => {
            this.loadingEvent.emit({ loading: false });
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.gettingStartedService.updatedGettingStartedData = 6;
            this.gettingStartedService.getGettingStartedData();
            this.nextEvent.emit({ kycVerified: true });
            /**
             *If KYC verification is required from `SubscriptionKycRequiredWarningModalComponent`,skip the business add option.
             */
            if (this.sourceType === CVSourceType.subscription) {
              this.currentStep = 'completed';
            } else {
              this.currentStep = 'have-a-business';
              this.stepChangeEvent.emit('have-a-business');
            }
          }
        })
    );
  }

  chooseFile(input: HTMLInputElement) {
    if (this.localNationalDocument?.name) {
      return;
    }
    input.click();
  }

  filePicked(event: File) {
    if (event === null) return;
    this.localNationalDocument = event;
  }

  removeFile(input: HTMLInputElement) {
    this.localNationalDocument = null;
    input.value = '';
  }

  selectCountry(type: HTMLElement): void {
    type.classList.add('active');
  }

  getAllowedCountries() {
    this.subscriptions.push(
      this.cloudBankService.allowedCountries.subscribe((res) => {
        this.allowedcountries = res;
        this.countries = Object.keys(this.allowedcountries);
      })
    );
  }

  noBusiness() {
    this.currentStep = 'completed';
    this.stepChangeEvent.emit('completed');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
