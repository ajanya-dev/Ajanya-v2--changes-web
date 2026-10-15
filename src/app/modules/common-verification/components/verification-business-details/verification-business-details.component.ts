import { GoogleAddressService } from '../../../../core/services/google-address.service';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  Input
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { finalize } from 'rxjs/operators';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import {
  CVSourceType,
  IBusinessOwners
} from 'src/app/modules/common-verification/model/common-verification';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { AddOwnershipDetailsModalComponent } from '../add-ownership-details-modal/add-ownership-details-modal.component';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { UserData } from 'src/app/modules/user/user-v3/components/user-data';
import { SharedModule } from 'src/app/shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

type DocumentTypes = 'formation' | 'ownerShip' | 'supportingDocument';
type TDocError = {
  formation: boolean;
  ownerShip: boolean;
  otherDoc: boolean;
  bankStatement: boolean;
  supportingDocument?: boolean;
};
type TDocuments = {
  formation: Record<string, unknown>;
  ownerShip: Record<string, unknown>;
  otherDoc: Record<string, unknown>;
  bankStatement: Record<string, unknown>;
  supportingDocument: Record<string, unknown>;
};

@Component({
  selector: 'app-verification-business-details',
  templateUrl: './verification-business-details.component.html',
  styleUrls: ['./verification-business-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    FontAwesomeModule
  ]
})
export class VerificationBusinessDetailsComponent implements OnInit, OnDestroy {
  @Input() isModal = false;
  @Input() sourceType: CVSourceType;
  @Input() bankAccountId: string;

  @Output() next = new EventEmitter();
  @Output() back = new EventEmitter();

  supportDocTypes = [
    { key: 'llc_corporation_document', value: 'LLC/Corporation Document' },
    { key: 'ein_letter', value: 'EIN Letter' },
    { key: 'irs', value: 'IRS' },
    { key: 'business_proof', value: 'Any Business Proof' }
  ] as const;

  subscriptions: Subscription[] = [];
  utils = Utils;
  currentStep:
    | 'details'
    | 'doc'
    | 'businessOwnerConfirm'
    | 'businessOwnerList' = 'details';

  businessOwners: IBusinessOwners[] = [];
  types: {
    industry: { key: string; value: string }[];
    entity: { key: string; value: string }[];
  } = { industry: [], entity: [] };
  businessForm: UntypedFormGroup;
  newDate: string | null;
  addSupportingDoc = false;
  documents: TDocuments = {
    formation: {},
    ownerShip: {},
    supportingDocument: {},
    otherDoc: {},
    bankStatement: {}
  };
  docError: TDocError = {
    formation: false,
    ownerShip: false,
    bankStatement: false,
    otherDoc: false
  };
  fileType = '';
  isBackBtnClickedFromOwnersList = false;
  loading = false;
  loadingSourceAction = false;
  allowedcountries: Record<string, string>;
  countries: string[] = [];
  monthlyRevenue = UserData.monthlyRevenue();
  isSoleProprietor = false;

  constructor(
    private cloudService: CloudBankService,
    private fb: UntypedFormBuilder,
    private datePipe: DatePipe,
    private _googleAddressService: GoogleAddressService,
    private verificationService: CommonVerificationService,
    private _userProfileService: UserProfileService,
    private _gettingStartedService: GettingStartedService,
    private alertService: AlertService,
    private _checkDraftService: CheckDraftService,
    private _matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this._googleAddressService.resetGoogleAutocompleteAPI();
    this.initForm();
    this.getTypes();
    this.getAllowedCountries();
    if (!this.isModal) {
      this.loadUserBusinessInfo();
    }
    this.newDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    this.businessForm.controls.entityType.valueChanges.subscribe((res) => {
      if (res === 'soleProprietor') {
        this.businessForm.controls.businessIdType.setValue('ssn');
        this.isSoleProprietor = true;
      } else {
        this.businessForm.controls.businessIdType.setValue('ein');
        this.isSoleProprietor = false;
      }
    });
    this._googleAddressService.resetGoogleAutocompleteAPI();
  }

  initForm() {
    this.businessForm = this.fb.group({
      businessIdType: ['', [Validators.required]],
      businessName: ['', [Validators.required]],
      website: ['', [ValidationService.isUrlValid]],
      businessDescription: [''],
      businessPhoneNumber: ['', [ValidationService.phoneNumberValidator]],
      businessdba: [''],
      businessAddress: ['', [Validators.required]],
      businessAddress2: [''],
      businessCity: ['', [Validators.required]],
      businessState: ['', [Validators.required]],
      businessZip: ['', [Validators.required]],
      businessCountry: ['', [Validators.required]],
      entityType: ['', [Validators.required]],
      industryType: ['', [Validators.required]],
      formationDate: ['', [Validators.required]],
      monthlyRevenue: ['', [Validators.required]],
      ein: ['', [Validators.required, Validators.minLength(9)]]
    });
  }

  /**
   * @description Used to get entity types and industry types.
   */
  getTypes() {
    this.subscriptions.push(
      this.cloudService.getTypes().subscribe((res) => {
        this.types.industry = res.data.industries;
        this.types.entity = res.data.entityType;
      })
    );
  }

  loadUserBusinessInfo(): void {
    this.subscriptions.push(
      this._userProfileService.getBusinessInfo().subscribe((res) => {
        this.setBusinessInfo(res.data);
      })
    );
  }

  setBusinessInfo(business: any): void {
    this.businessForm.patchValue({
      businessName: business.companyName,
      businessdba: business.dba,
      businessAddress: business.companyAddressLine1,
      businessAddress2: business.companyAddressLine2,
      businessCity: business.companyCity,
      businessState: business.companyState,
      businessZip: business.companyZip,
      businessCountry: business.companyCountry,
      entityType: business.entityType || '',
      industryType: business.industryType || '',
      formationDate: business.formationDate,
      ein: business.ein
    });
  }

  chooseFile(input: HTMLInputElement, type: DocumentTypes) {
    if (this.documents[type]?.name) {
      return;
    }
    input.click();
  }

  filePicked(ev: any, type: DocumentTypes) {
    this.documents[type] = ev.target.files?.length ? ev.target.files[0] : null;
    this.docError[type] = this.documents[type]?.name ? false : true;
  }

  removeFile(type: DocumentTypes, input: HTMLInputElement) {
    this.documents[type] = {};
    input.value = '';
  }

  nextStep() {
    this._googleAddressService.resetGoogleAutocompleteAPI();

    if (this.loading) {
      return;
    }

    if (this.currentStep === 'details') {
      this.businessForm.markAllAsTouched();
      if (this.businessForm.invalid) {
        return;
      }

      this.currentStep = 'doc';
      this.next.emit();
    } else if (this.currentStep === 'doc') {
      if (this.businessForm.controls.entityType.value !== 'soleProprietor') {
        this.docError.ownerShip = this.documents.ownerShip?.name ? false : true;
        this.docError.formation = this.documents.formation?.name ? false : true;
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
      } else {
        this.submitDetails();
      }
    } else if (this.currentStep === 'businessOwnerList') {
      this.submit();
    }
  }

  goBack() {
    if (this.currentStep === 'businessOwnerConfirm') {
      this.submitDetails();
      return;
    }

    if (this.loading) {
      return;
    }

    this.isBackBtnClickedFromOwnersList = true;
    this.back.emit();
    this.currentStep = 'details';
  }

  addActive(ele: HTMLElement) {
    ele.classList.add('active');
  }

  // Load Google Address API
  loadGoogleAddress(address: HTMLInputElement) {
    this._googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: this.countries,
      displayShortName: true
    });

    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
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

  submit(): void {
    if (!this.businessOwners.length) {
      this.alertService.warningAlert({
        content: "Please add at least one owner's details"
      });
      return;
    }
    this.submitDetails();
  }

  submitDetails() {
    const kybData = { ...this.businessForm.value, documents: this.documents };
    const kybformData = new FormData();

    kybformData.append('source', this.sourceType);

    for (let i = 0; i < this.businessOwners.length; i++) {
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

    for (const key in kybData) {
      if (key === 'ein') {
        const ein = kybData[key].split('');
        ein.splice(2, 0, '-');
        kybData[key] = ein.join('');
      }

      if (key === 'documents') {
        for (const doc in kybData[key]) {
          if (kybData[key][doc]?.name) {
            kybformData.append(`document[${doc}]`, kybData[key][doc]);
          }
        }
      }
      if (key === 'website') {
        const url = kybData[key];
        if (url != '') {
          if (url.startsWith('https://')) {
            kybData[key] = url;
            kybformData.append(`website`, kybData[key]);
          } else {
            kybData[key] = 'https://' + url;
            kybformData.append(`website`, kybData[key]);
          }
        } else {
          kybData[key] = '';
          kybformData.append(`website`, kybData[key]);
        }
      } else {
        kybformData.append(key, kybData[key]);
      }
    }

    this.loading = true;
    this.subscriptions.push(
      this.verificationService
        .kybVerification(kybformData)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.afterKybSuccess(res.data.id);
          }
        })
    );
  }

  afterKybSuccess(id: string): void {
    this._gettingStartedService.updatedGettingStartedData = 7;
    if (this.sourceType) {
      this.loadSourceAction(id);
    } else {
      this.next.emit({ closeModal: true });
      if (this.isModal) {
        this.alertService.successAlert({
          content:
            'Your business information are under review. We will notify you once approved',
          close: false
        });
      }
    }
  }

  loadSourceAction(businessId: string): void {
    if (this.sourceType === '1') {
      this.afterSourceActionSuccess();
    } else if (this.sourceType === '2') {
      this.applyAch(businessId, this.bankAccountId);
    } else if (this.sourceType === '3') {
      this.applyCloudBank(businessId);
    } else if (this.sourceType === '4') {
      this.applyCheckDraft(businessId, this.bankAccountId);
    } else {
      this.afterSourceActionSuccess();
    }
  }

  addOwnershipDetails(item?: IBusinessOwners, index?: number): void {
    if (this.isBackBtnClickedFromOwnersList) {
      this.currentStep = 'businessOwnerList';
      this.isBackBtnClickedFromOwnersList = false;
      return;
    }

    if (this.businessOwners?.length === 4) {
      this.alertService.warningAlert({
        content: 'Allowed maximum four owners. Please remove owner to add'
      });
      return;
    }

    const ref = this._matDialog.open<
      AddOwnershipDetailsModalComponent,
      IBusinessOwners
    >(AddOwnershipDetailsModalComponent, {
      maxWidth: '700px',
      width: '95%',
      data: item!,
      disableClose: true
    });
    ref
      .afterClosed()
      .subscribe((res: { editMode: boolean; data: IBusinessOwners }) => {
        if (res.editMode) {
          this.businessOwners[index!] = res.data;
        } else if (res) {
          this.businessOwners.push(res.data);
          this.currentStep = 'businessOwnerList';
        }
      });
  }

  deleteBusinessOwner(index: number): void {
    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to remove this owner?'
    });
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.businessOwners.splice(index, 1);
      }
    });
  }

  // ==========================  Source actions =============================
  applyAch(businessId: string, bankAccountId: string) {
    this.afterSourceActionSuccess();
    this.verificationService
      .bankAchApplication({
        businessId,
        bankAccountId
      })
      .subscribe();
  }

  applyCloudBank(businessId: string) {
    this.afterSourceActionSuccess();
    this.cloudService.applyCloudBank(businessId).subscribe();
  }

  applyCheckDraft(businessId: string, bankAccountId: string) {
    this.loadingSourceAction = true;
    this.subscriptions.push(
      this._checkDraftService
        .applayCheckDraft({
          businessId: businessId,
          bankAccountId: bankAccountId
        })
        .pipe(finalize(() => (this.loadingSourceAction = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.afterSourceActionSuccess();
          }
        })
    );
  }

  afterSourceActionSuccess(): void {
    this.next.emit({ closeModal: true, returnUrl: this.redirectUrl });
    if (this.isModal) {
      this.alertService.successAlert({
        content:
          'Your business information are under review. We will notify you once approved',
        close: false
      });
    }
  }

  get redirectUrl() {
    if (this.sourceType === '1') {
      return 'manage/verification/index';
    } else if (this.sourceType === '2') {
      return 'manage/bankaccount/index';
    } else if (this.sourceType === '3') {
      return 'manage/bankaccount/index';
    } else if (this.sourceType === '4') {
      return 'manage/checkdraft/index';
    } else {
      return null;
    }
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}
