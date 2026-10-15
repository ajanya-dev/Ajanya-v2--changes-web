import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  inject
} from '@angular/core';
import { Utils } from 'src/app/data/utils';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import {
  DOCUMENT,
  DatePipe,
  NgClass,
  NgOptimizedImage,
  KeyValuePipe
} from '@angular/common';
import {
  CVSourceType,
  IBusinessOwners
} from 'src/app/modules/common-verification/model/common-verification';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { AddOwnershipDetailsModalComponent } from 'src/app/modules/common-verification/components/add-ownership-details-modal/add-ownership-details-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { IBusinessInfo } from 'src/app/layout/model/header';
import { PayrollService } from 'src/app/modules/payroll-by-card/services/payroll.service';
import { IBankData } from 'src/app/models/bank';
import { BankDataV35Service } from 'src/app/modules/bank/bank-v3/v35-services/bank-data-v35.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { environment } from 'src/environments/environment';
import { AchService } from 'src/app/shared/service/ach/ach.service';
import { UserV3DataService } from '../../services/user-v3-data.service';
import { UserData } from '../user-data';
import {
  IPersonaClient,
  IPersonaClientOptions
} from '../../../user-v2/model/userV2';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonUploadButtonV35Component } from '../../../../../shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

declare let Persona: {
  Client: new (options: IPersonaClientOptions) => IPersonaClient;
};

type DocumentTypes =
  | 'formation'
  | 'ownerShip'
  | 'supportingDocument'
  | 'bankStatement'
  | 'otherDoc';
export type TBusinessVerificationSteps =
  | 'details'
  | 'doc'
  | 'businessOwnerConfirm'
  | 'businessOwnerList'
  | 'done';

type TDocError = {
  formation: boolean;
  ownerShip: boolean;
  otherDoc: boolean;
  bankStatement: boolean;
  supportingDocument?: boolean;
  'secretary-of-state-filingsreport'?: boolean;
};
type TDocuments = {
  formation: File;
  ownerShip: File;
  otherDoc: File;
  bankStatement: File;
  supportingDocument: File;
  'secretary-of-state-filingsreport'?: File;
};

@Component({
  selector: 'app-business-verification-v3',
  templateUrl: './business-verification-v3.component.html',
  styleUrls: ['./business-verification-v3.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgxMaskDirective,
    NgClass,
    MatTooltip,
    CommonUploadButtonV35Component,
    FaIconComponent,
    NgOptimizedImage,
    CommonButtonV35Component,
    KeyValuePipe
  ]
})
export class BusinessVerificationV3Component implements OnInit, OnDestroy {
  @Input() prevStepObservable: Observable<void>;
  @Input() bankAccountId: string;
  @Input() currentIndex: number;
  @Output() nextEvent = new EventEmitter();
  @Output() stepChangeEvent = new EventEmitter<{
    status: TBusinessVerificationSteps;
    id?: string;
  }>();

  @Output() loadingEvent = new EventEmitter<{ loading: boolean }>();

  private router = inject(Router);
  private alertService = inject(AlertService);
  private verificationService = inject(CommonVerificationService);
  private cloudService = inject(CloudBankService);
  private googleAddressService = inject(GoogleAddressService);
  private datePipe = inject(DatePipe);
  private matDialog = inject(MatDialog);
  private userProfileService = inject(UserProfileService);
  private route = inject(ActivatedRoute);
  private payrollService = inject(PayrollService);
  private userDataService = inject(UserV3DataService);
  private bankDataService = inject(BankDataV35Service);
  private gettingStartedService = inject(GettingStartedService);
  private document = inject<Document>(DOCUMENT);
  private renderer2 = inject(Renderer2);
  private achService = inject(AchService);

  PERSONA_TEMPLATE_ID = environment.PERSONA_TEMPLATE_ID;
  PERSONA_ENVIRONMENT = environment.PERSONA_ENVIRONMENT;

  utils = Utils;
  businessForm: FormGroup;
  types: {
    industry: { key: string; value: string }[];
    entity: { key: string; value: string }[];
  } = { industry: [], entity: [] };

  fileType = '';
  countries: string[] = [];
  allowedcountries: Record<string, string>;
  subscriptions: Subscription[] = [];
  addSupportingDoc = false;
  newDate: string;
  loading = false;
  docError: TDocError = {
    formation: false,
    ownerShip: false,
    bankStatement: false,
    otherDoc: false,
    'secretary-of-state-filingsreport': false
  };

  sourceType = CVSourceType.getting_started;
  documents: TDocuments = {
    formation: {} as File,
    ownerShip: {} as File,
    otherDoc: {} as File,
    bankStatement: {} as File,
    supportingDocument: {} as File,
    'secretary-of-state-filingsreport': {} as File
  };

  monthlyRevenue = UserData.monthlyRevenue();
  businessOwners: IBusinessOwners[] = [];
  supportDocTypes = [
    { key: 'llc_corporation_document', value: 'LLC/Corporation Document' },
    { key: 'ein_letter', value: 'EIN Letter' },
    { key: 'irs', value: 'IRS' },
    { key: 'business_proof', value: 'Any Business Proof' }
  ] as const;

  currentStep: TBusinessVerificationSteps = 'details';
  onboardingId: string;
  routedFromType: string;
  noButtonClicked = false;
  returnUrl: string;
  from: string;
  maskSSN = '000-00-0000';
  customPattern = {
    1: { pattern: /\d/, symbol: '*' },
    0: { pattern: /\d/ },
    symbol: '',
    2: { pattern: /\d/, symbol: '*' }
  };

  activeBank: IBankData;
  businessId: string;
  fromRoute: string;
  isSoleProprietor = false;
  personaVerificationCompleted = false;
  isPersonaLoading = false;
  websitePlaceholderText = '';
  isManualEntry = false;

  ngOnInit() {
    this.checkPersonaVerificationStatus();
    this.onboardingId = this.route.snapshot.queryParams.plexeId;
    this.route.queryParams.subscribe((params) => {
      this.routedFromType = params.type;
      this.from = params.from;
    });
    this.subscriptions.push(
      this.prevStepObservable.subscribe(() => {
        this.goBack();
      })
    );
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.initForm();
    this.getAllowedCountries();
    this.newDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd') as string;
    this.getTypes();
    this.setBusinessIdType();
    this.loadUserBusinessInfo();

    if (this.currentIndex === 5) {
      this.currentStep = 'done';
    }
    this.returnUrl = this.route.snapshot.queryParams?.returnUrl;
    this.isManualEntry = this.route.snapshot.queryParams?.isManualEntry;    
  }

  subscribeToActiveBank() {
    this.userDataService.getBankData().subscribe((res) => {
      this.activeBank = res;
    });
  }

  initForm() {
    this.businessForm = new FormGroup({
      businessIdType: new FormControl('', [Validators.required]),
      businessName: new FormControl('', [Validators.required]),
      website: new FormControl('', [ValidationService.isUrlValid]),
      businessDescription: new FormControl('', [Validators.required]),
      businessPhoneNumber: new FormControl('', [
        ValidationService.phoneNumberValidator
      ]),
      businessdba: new FormControl(''),
      businessAddress: new FormControl('', [Validators.required]),
      businessAddress2: new FormControl(''),
      businessCity: new FormControl('', [Validators.required]),
      businessState: new FormControl('', [Validators.required]),
      businessZip: new FormControl('', [Validators.required]),
      businessCountry: new FormControl('', [Validators.required]),
      entityType: new FormControl('', [Validators.required]),
      industryType: new FormControl('', [Validators.required]),
      monthlyRevenue: new FormControl('', [Validators.required]),
      formationDate: new FormControl('', [Validators.required]),
      ein: new FormControl('', [Validators.required, Validators.minLength(9)])
    });
  }

  loadUserBusinessInfo(): void {
    this.subscriptions.push(
      this.userProfileService.getBusinessInfo().subscribe((res) => {
        this.setBusinessInfo(res.data);
      })
    );
  }

  setBusinessInfo(business: IBusinessInfo): void {
    this.businessForm.patchValue({
      businessName: business.companyName,
      businessdba: business.dba,
      businessAddress: business.companyAddressLine1,
      businessAddress2: business.companyAddressLine2,
      businessCity: business.companyCity,
      businessState: business.companyState,
      businessZip: business.companyZip,
      businessCountry: business.companyCountry,
      entityType: business.entityType ?? '',
      industryType: business.industryType ?? '',
      formationDate: business.formationDate,
      ein: business.ein
    });
  }

  setBusinessIdType() {
    this.subscriptions.push(
      this.businessForm.controls.entityType.valueChanges.subscribe((res) => {
        if (res === 'soleProprietor') {
          this.businessForm.controls.businessIdType.setValue('ssn');
          this.isSoleProprietor = true;
        } else {
          this.businessForm.controls.businessIdType.setValue('ein');
          this.isSoleProprietor = false;
        }
      })
    );
  }

  nextStep() {
    this.googleAddressService.resetGoogleAutocompleteAPI();

    if (this.loading) {
      return;
    }

    if (!this.personaVerificationCompleted && !this.isManualEntry) {
      this.openPersonaAlert();
      return;
    }

    if (this.currentStep === 'details' && this.currentIndex !== 5) {
      this.businessForm.markAllAsTouched();
      if (this.businessForm.invalid) {
        return;
      }

      this.currentStep = 'doc';
      this.stepChangeEvent.emit({ status: 'doc' });
      this.nextEvent.emit();
    } else if (this.currentStep === 'doc') {
      if (this.businessForm.controls.entityType.value !== 'soleProprietor') {
        this.docError.ownerShip = !this.documents.ownerShip?.name;
        this.docError.formation = !this.documents.formation?.name;
        if(this.isManualEntry){
          this.docError['secretary-of-state-filingsreport'] = !this.documents['secretary-of-state-filingsreport']?.name;
        }
      } else {
        this.docError.bankStatement = !this.documents.bankStatement?.name;
        this.docError.otherDoc = !this.documents.otherDoc?.name;
      }

      if (
        this.businessForm.controls.entityType.value !== 'soleProprietor' &&
        (!this.documents.ownerShip?.name || !this.documents.formation?.name)
      ) {
        return;
      }
      if (
        this.businessForm.controls.entityType.value === 'soleProprietor' &&
        (!this.documents.bankStatement?.name || !this.documents.otherDoc?.name)
      ) {
        return;
      }

      /** Needed to add owners details except entity soleProprietor  */
      if (this.businessForm.controls.entityType.value !== 'soleProprietor') {
        this.currentStep = 'businessOwnerConfirm';
        this.stepChangeEvent.emit({ status: 'businessOwnerConfirm' });
      } else {
        this.submitDetails();
      }
    } else if (this.currentStep === 'businessOwnerConfirm') {
      if (this.businessOwners.length) {
        this.currentStep = 'businessOwnerList';
        this.stepChangeEvent.emit({ status: 'businessOwnerList' });
      } else {
        this.addOwnershipDetails();
      }
    } else if (this.currentStep === 'businessOwnerList') {
      this.submit();
    } else if (this.currentStep === 'done' || this.currentIndex === 5) {
      if (this.returnUrl) {
        this.router.navigate([this.returnUrl]);
        return;
      }
      if (this.onboardingId) {
        this.router.navigate(['/manage/working-capital/application-Setup'], {
          queryParams: { id: this.onboardingId }
        });
      } else if (
        this.routedFromType === CVSourceType.cloud_bank ||
        this.routedFromType === CVSourceType.add_new_business
      ) {
        if (this.from === 'payroll') {
          this.router.navigate(['/manage/payroll-card/index'], {
            queryParams: { newBusiness: true }
          });
        } else if (
          this.routedFromType === '7' &&
          this.fromRoute === 'bank-accounts'
        ) {
          this.bankDataService.openLoaderModal(
            this.businessId,
            this.activeBank.encrypted_bankacc_id
          );
          this.router.navigateByUrl('/manage/bank-accounts/index');
        } else {
          this.router.navigateByUrl('/manage/home');
        }
      } else {
        this.router.navigateByUrl('/manage/home');
      }
    }
  }

  submit(): void {
    if (!this.businessOwners.length) {
      this.alertService.warningAlert({
        content: "Please add at least one owner's details"
      });
      return;
    }
    this.submitDetails();
  }

  onFocus(): void {
    this.maskSSN = '111-11-0000';
    this.customPattern = {
      1: { pattern: /\d/, symbol: '' },
      0: { pattern: /\d/ },
      symbol: '',
      2: { pattern: /\d/, symbol: '' }
    };
  }

  onBlur(): void {
    this.maskSSN = '111110000';
    this.customPattern = {
      1: { pattern: /\d/, symbol: '*' },
      0: { pattern: /\d/ },
      symbol: '',
      2: { pattern: /\d/, symbol: '*' }
    };
  }

  addOwnershipDetails(item?: IBusinessOwners, index?: number): void {
    if (this.businessOwners?.length === 4) {
      this.alertService.warningAlert({
        content: 'Allowed maximum four owners. Please remove owner to add'
      });
      return;
    }

    const ref = this.matDialog.open<
      AddOwnershipDetailsModalComponent,
      IBusinessOwners
    >(AddOwnershipDetailsModalComponent, {
      maxWidth: '700px',
      width: '95%',
      data: item,
      disableClose: true
    });
    ref
      .afterClosed()
      .subscribe((res: { editMode: boolean; data: IBusinessOwners }) => {
        if (res.editMode && index) {
          this.businessOwners[index] = res.data;
        } else if (res) {
          this.businessOwners.push(res.data);
          this.currentStep = 'businessOwnerList';
          this.stepChangeEvent.emit({ status: 'businessOwnerList' });
        }
      });
  }

  deleteBusinessOwner(index: number): void {
    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to remove this owner?'
    });
    this.subscriptions.push(
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.businessOwners.splice(index, 1);
        }
      })
    );
  }

  goBack() {
    if (this.loading) {
      return;
    }

    if (this.currentStep === 'businessOwnerList') {
      this.currentStep = 'businessOwnerConfirm';
      this.stepChangeEvent.emit({ status: 'businessOwnerConfirm' });
    } else if (this.currentStep === 'businessOwnerConfirm') {
      this.currentStep = 'doc';
      this.stepChangeEvent.emit({ status: 'doc' });
    } else if (this.currentStep === 'doc') {
      this.currentStep = 'details';
      this.stepChangeEvent.emit({ status: 'details' });
    }
  }

  onNoPartner() {
    this.businessOwners = [];
    this.noButtonClicked = true;
    this.submitDetails();
  }

  submitDetails() {
    const kybData = { ...this.businessForm.value, documents: this.documents };
    const kybformData = new FormData();
    if (this.from === 'cloud') {
      this.sourceType = CVSourceType.cloud_bank;
    }
    kybformData.append('is_manually_added', (this.isManualEntry ? 1 : 0).toString());
      
    if (this.routedFromType === '11') {
      this.sourceType = CVSourceType['form-1099'];
    }

    kybformData.append('source', this.sourceType);

    for (let i = 0; i < this.businessOwners.length; i += 1) {
      kybformData.append(
        `owners[${i}][firstName]`,
        this.businessOwners[i].firstName as string
      );
      kybformData.append(
        `owners[${i}][lastName]`,
        this.businessOwners[i].lastName
      );
      kybformData.append(`owners[${i}][title]`, this.businessOwners[i].title);
      kybformData.append(
        `owners[${i}][ownershipPercentage]`,
        this.businessOwners[i].ownershipPercentage
      );
      kybformData.append(
        `owners[${i}][fullSsn]`,
        this.businessOwners[i].fullSsn
      );
      kybformData.append(
        `owners[${i}][birthDate]`,
        this.businessOwners[i].birthDate
      );
      kybformData.append(
        `owners[${i}][phoneNumber]`,
        this.businessOwners[i].phoneNumber
      );
      kybformData.append(
        `owners[${i}][address]`,
        this.businessOwners[i].address
      );
      kybformData.append(`owners[${i}][city]`, this.businessOwners[i].city);
      kybformData.append(`owners[${i}][state]`, this.businessOwners[i].state);
      kybformData.append(`owners[${i}][zip]`, this.businessOwners[i].zip);
      kybformData.append(
        `owners[${i}][country]`,
        this.businessOwners[i].country
      );
      kybformData.append(`owners[${i}][email]`, this.businessOwners[i].email);
    }

    Object.keys(kybData).forEach((key) => {
      if (key === 'ein') {
        const ein = kybData[key].split('');
        ein.splice(2, 0, '-');
        kybData[key] = ein.join('');
      }

      if (key === 'documents') {
        Object.keys(kybData[key]).forEach((doc) => {
          if (kybData[key][doc]?.name) {
            kybformData.append(`document[${doc}]`, kybData[key][doc]);
          }
        });
      }

      if (key === 'website') {
        const url = kybData[key];
        if (url !== '') {
          if (url.startsWith('https://')) {
            kybData[key] = url;
            kybformData.append(`website`, kybData[key]);
          } else {
            kybData[key] = `https://${url}`;
            kybformData.append(`website`, kybData[key]);
          }
        } else {
          kybData[key] = '';
          kybformData.append(`website`, kybData[key]);
        }
      } else {
        kybformData.append(key, kybData[key]);
      }
    });

    this.loading = true;
    this.loadingEvent.emit({ loading: true });
    this.subscriptions.push(
      this.verificationService
        .kybVerification(kybformData)
        .pipe(
          finalize(() => {
            this.loadingEvent.emit({ loading: false });
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.gettingStartedService.getGettingStartedData();
            if (this.from === 'payroll') {
              const body = { businessId: res.data.id };
              this.payrollService.addManualPayroll(body).subscribe();
            }
            this.currentStep = 'done';
            this.stepChangeEvent.emit({ status: 'done', id: res.data.id });
            this.nextEvent.emit();
          }
        })
    );
  }

  addActive(ele: HTMLElement) {
    ele.classList.add('active');
  }

  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: this.countries,
      displayShortName: true
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.businessForm.patchValue({
          businessAddress: res.address,
          businessCity: res.city,
          businessState: res.state,
          businessZip: res.zip,
          businessCountry: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  getAllowedCountries() {
    this.subscriptions.push(
      this.cloudService.allowedCountries.subscribe((res) => {
        this.allowedcountries = res;
        this.countries = Object.keys(this.allowedcountries);
      })
    );
  }

  selectBenfCountry(type: HTMLElement) {
    type.classList.add('active');
  }

  getTypes() {
    this.subscriptions.push(
      this.cloudService.getTypes().subscribe((res) => {
        this.types.industry = res.data.industries;
        this.types.entity = res.data.entityType;
      })
    );
  }

  chooseFile(input: HTMLInputElement, type: DocumentTypes) {
    if (this.documents[type]?.name) {
      return;
    }
    input.click();
  }

  filePicked(ev: File, type: DocumentTypes) {
    this.documents[type] = ev as File;
    this.docError[type] = !this.documents[type]?.name;
  }

  /**
   * @description Check persona verification completed or not.
   * @param {boolean}complted - Based on this value show success message.
   */
  checkPersonaVerificationStatus(complted?: boolean) {
    this.loading = true;
    this.subscriptions.push(
      this.verificationService
        .checkPersonaVerificationStatus()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.data.status === 'completed') {
              this.personaVerificationCompleted = true;
              if (complted) {
                this.alertService.successAlert({
                  content: 'Your persona verification is completed.'
                });
              }
            }
          },
          error: (err) => {
            this.personaVerificationCompleted = false;
            if (err.error.errorCode && this.currentIndex === 3) {
              this.openPersonaAlert();
            }
          }
        })
    );
  }

  /**
   * @description Open alert message for persona verification.
   */
  openPersonaAlert() {
    const alertContent = {
      content:
        'Your persona verification is pending completion. Kindly finalize your persona verification before submitting business details. Would you like to proceed with completing the persona verification process at this time?',
      isCancel: true,
      cancelMsg: 'Not Now',
      doneMsg: 'Verify Now'
    };

    const alert = this.alertService.infoAlert(alertContent);
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.openPersona();
      }
    });
  }

  /**
   * @description Opens the Persona verification process by calling the loadPersona and personalVerification functions.
   */
  openPersona() {
    this.loadPersona();
    this.personalVerification();
  }

  /**
   * @description Loads the Persona script.
   */
  loadPersona(): void {
    const s = this.renderer2.createElement('script');
    s.type = 'text/javascript';
    s.src = 'https://cdn.withpersona.com/dist/persona-v3.8.0.js';
    this.renderer2.appendChild(this.document.body, s);
  }

  /**
   * @description Initiates the Persona verification process by creating a new Persona.Client instance.
   */
  personalVerification() {
    this.isPersonaLoading = true;
    const client = new Persona.Client({
      templateId: `${this.PERSONA_TEMPLATE_ID}`,
      environment: `${this.PERSONA_ENVIRONMENT}`,
      onLoad: () => {
        this.isPersonaLoading = false;
        client.open();
      },
      onComplete: (inquiryId: string) => {
        this.personaVerify(inquiryId);
      },
      onError: () => {
        this.isPersonaLoading = false;
      }
    });
  }

  /**
   * @description Initiates the Persona verification process by calling the personaVerification API with the provided inquiryId.
   * @param {string} inquiryId - The unique identifier for the Persona verification inquiry.
   */
  personaVerify(inquiryId: string) {
    this.loading = true;
    this.subscriptions.push(
      this.achService
        .personaVerification(inquiryId)
        .pipe(
          finalize(() => {
            this.loading = true;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.checkPersonaVerificationStatus(true);
          } else {
            const alert = this.alertService.failedAlert({
              content: 'Verification process failed please try again.',
              isCancel: true,
              doneMsg: 'Try again'
            });
            alert.afterClosed().subscribe((response) => {
              if (response) {
                this.openPersona();
              }
            });
          }
        })
    );
  }

  /**
   * Updates the placeholder text of the website input based on focus or blur events.
   * @param {("focus" | "blur")} type - The type of event triggering the update ("focus" or "blur").
   * @returns {void}
   */
  updateWebsitePlaceholder(type: 'focus' | 'blur' | 'keyup'): void {
    if (type === 'focus' || type === 'keyup') {
      this.websitePlaceholderText =
        this.businessForm.controls.website.value.length === 0
          ? 'https://example.com'
          : '';
    } else {
      this.websitePlaceholderText = '';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
