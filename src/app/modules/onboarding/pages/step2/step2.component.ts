import { DatePipe, NgIf, NgClass, NgFor } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import {
  IonBoardingDetails,
  onBoardStatusType
} from 'src/app/modules/onboarding/model/onBoarding';
import { UploadImageModalComponent } from 'src/app/shared/modal/upload-image-modal/upload-image-modal.component';
import { GoogleAddressService } from '../../../../core/services/google-address.service';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-step2',
  templateUrl: './step2.component.html',
  styleUrls: ['./step2.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgFor,
    ControlMessageComponent,
    NgxMaskDirective
  ]
})
export class Step2Component implements OnInit, OnDestroy {
  slide = 1;
  isyesOnHover = false;
  isNoOnHover = false;
  bussinessDetailsForm: UntypedFormGroup;
  slide3Fields: UntypedFormGroup;
  slide4Fields: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  showValidationMessage: boolean;
  imageUrl: string;
  todayDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
  profilePic: string;

  entityType = [
    { value: 'soleProprietor', name: 'Sole Proprietor' },
    { value: 'singleMemberLLC', name: 'Single Member LLC' },
    { value: 'limitedLiabilityCompany', name: 'Limited Liability Company' },
    { value: 'generalPartnership', name: 'General Partnership' },
    { value: 'unlistedCorporation', name: 'Unlisted Corporation' },
    { value: 'publiclyTradedCorporation', name: 'Publicly Traded Corporation' },
    { value: 'association', name: 'Association' },
    { value: 'nonProfit', name: 'Non Profit' },
    { value: 'governmentOrganization', name: 'Revocable Trust' },
    { value: 'irrevocableTrust', name: 'Irrevocable Trust' },
    { value: 'estate', name: 'Estate' }
  ];

  @ViewChild('AddressSearch')
  public businessAddressSearchRef: ElementRef;

  loading: boolean;
  onboardingDetails: IonBoardingDetails;
  lastTriggeredButton: string;
  corppedImg: FormData;
  constructor(
    private alert: AlertService,
    private userService: UserProfileService,
    private datePipe: DatePipe,
    private router: Router,
    private dialog: MatDialog,
    private googleAddressService: GoogleAddressService,
    private headerService: HeaderService,
    private localStorageService: LocalStorageService,
    private formbuilder: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.getOnBoardingStatus();
    if (this.onboardingDetails?.bussinessDetailsFormData) {
      // if onboarding Details exist in local storage
      this.getBussinessInfo();
    } else {
      this.getBussinessInfo(true);
    }
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }

  initializeForms() {
    this.slide3Fields = this.formbuilder.group({
      entityType: new UntypedFormControl(''),
      dba: new UntypedFormControl('', Validators.pattern('^[a-zA-Z1-9 ]+')),
      formationDate: new UntypedFormControl(
        this.datePipe.transform(new Date(), 'yyyy-MM-dd')
      ),
      ein: new UntypedFormControl('', Validators.minLength(9))
    });
    this.slide4Fields = this.formbuilder.group({
      companyAddressLine_1: new UntypedFormControl(''),
      companyAddressLine_2: new UntypedFormControl(''),
      companyCity: new UntypedFormControl(''),
      companyState: new UntypedFormControl(''),
      companyZip: new UntypedFormControl('', ValidationService.zipValidator),
      companyCountry: new UntypedFormControl('')
    });
    this.bussinessDetailsForm = this.formbuilder.group({
      slide3Fields: this.slide3Fields,
      slide4Fields: this.slide4Fields,
      logo: new UntypedFormControl('')
    });
  }

  getOnBoardingStatus() {
    this.onboardingDetails = this.localStorageService.getOnboardingData();
    if (this.onboardingDetails) {
      if (this.onboardingDetails.bussinessDetailsFormData) {
        this.bussinessDetailsForm.setValue(
          this.onboardingDetails.bussinessDetailsFormData
        );
      }
      this.slide = this.onboardingDetails.slide
        ? this.onboardingDetails.slide
        : this.slide;
    }
  }

  onSlide1NextClicked() {
    if (this.slide3Fields.valid) {
      this.onNextClicked();
    } else {
      this.slide3Fields.markAsTouched();
      this.showValidationMessage = true;
    }
  }

  onSlide4NextClicked() {
    if (this.slide4Fields.valid) {
      this.onNextClicked();
      this.getBussinessInfo();
    } else {
      this.slide4Fields.markAsTouched();
      this.showValidationMessage = true;
    }
  }

  onNextClicked() {
    this.onboardingDetails = this.onboardingDetails
      ? this.onboardingDetails
      : { onBoardStatus: 'step1_completed' };
    this.isyesOnHover = false; // flickeringBugFix for yes image
    this.showValidationMessage = false;
    this.slide += 1;
    this.onboardingDetails.onBoardStatus = 'step1_completed';
    this.onboardingDetails.slide = this.slide;
    this.onboardingDetails.bussinessDetailsFormData =
      this.bussinessDetailsForm.value;
    this.localStorageService.setOnboardingData(this.onboardingDetails);
  }

  onSkipClicked() {
    if (!this.loading) {
      this.lastTriggeredButton = 'skip';
      this.saveBusinessInfo('step2_skip_clicked');
    }
  }

  onSaveClicked() {
    if (!this.loading) {
      this.lastTriggeredButton = 'finish';
      this.saveBusinessInfo('step2_completed');
    }
  }

  saveBusinessInfo(status: onBoardStatusType) {
    if (this.lastTriggeredButton == 'skip' && this.slide == 1) {
      this.router.navigate(['/manage/verification/index']);
    } else if (this.bussinessDetailsForm.invalid) {
      return;
    }
    const processedData = this.createUserBusinessBody(status);
    const onboardingDetails: IonBoardingDetails = { onBoardStatus: status };

    this.localStorageService.setOnboardingData(onboardingDetails);
    this.loading = true;
    this.subscriptions.push(
      this.userService
        .postOnboardingDataStep2(processedData)
        .pipe(
          catchError(() => {
            this.loading = false;
            return of(false);
          })
        )
        .subscribe((res) => {
          this.loading = false;
          if (res.success) {
            const data = {
              title: 'Success',
              content: 'Business Info Saved',
              close: true,
              timeout: 1500
            };
            this.headerService.setHeaderValueChanged(true);
            const dialogRef = this.alert.successAlert(data);
            dialogRef.afterClosed().subscribe(() => {
              this.router.navigate(['/manage/verification/index']);
            });
          }
        })
    );
  }

  createUserBusinessBody(status: string) {
    const newDate = this.datePipe.transform(
      this.slide3Fields.value.formationDate,
      'yyyy-MM-dd'
    );
    const temp = {
      businessAddressLine_1: this.slide4Fields.value.companyAddressLine_1
        ? this.slide4Fields.value.companyAddressLine_1
        : '',
      businessAddressLine_2: this.slide4Fields.value.companyAddressLine_2
        ? this.slide4Fields.value.companyAddressLine_2
        : '',
      businessCity: this.slide4Fields.value.companyCity
        ? this.slide4Fields.value.companyCity
        : '',
      businessState: this.slide4Fields.value.companyState
        ? this.slide4Fields.value.companyState
        : '',
      businessZip: this.slide4Fields.value.companyZip
        ? this.slide4Fields.value.companyZip
        : '',
      businessCountry: this.slide4Fields.value.companyCountry
        ? this.slide4Fields.value.companyCountry
        : '',
      dba: this.slide3Fields.value.dba ? this.slide3Fields.value.dba : '',
      formationDate: newDate,
      entityType: this.slide3Fields.value.entityType
        ? this.slide3Fields.value.entityType
        : '',
      ein: this.slide3Fields.value.ein ? this.slide3Fields.value.ein : '',
      industryType: this.slide3Fields.value.entityType
        ? this.slide3Fields.value.entityType
        : '',
      status
    };
    return temp;
  }

  onUploadLogo(ev: any) {
    if (!(ev?.srcElement?.files?.length == 0)) {
      //! used intentionally
      const dialogRef = this.dialog.open(UploadImageModalComponent, {
        maxWidth: '500px',
        width: '93%',
        data: { event: ev }
      });

      dialogRef.afterClosed().subscribe((result) => {
        this.imageUrl = result.image.url;
        if (result.image) {
          const data = {
            title: 'Success',
            content: 'Profile Picture Updated',
            close: true,
            timeout: 2000
          };
          this.byte(result.image);
          this.alert.successAlert(data);
        }
      });
    }
  }

  byte(imageUrl: any) {
    const blob = new Blob([imageUrl.blob], { type: 'image/jpg' });
    const imageFile = new File([blob], 'profile_pic_img.jpg', {
      type: 'image/jpg'
    });

    const formData = new FormData();
    formData.append('businessLogo', imageFile, 'image.jpg');
    this.corppedImg = formData;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.subscriptions.push(
      this.userService.addBusinessLogo(this.corppedImg).subscribe(() => {})
    );
  }

  getBussinessInfo(updateForm?: boolean) {
    this.subscriptions.push(
      this.userService.getBusinessInfo().subscribe((res) => {
        if (res?.success) {
          const businessData = res?.data;
          this.imageUrl = businessData.businessLogoLink;
          if (updateForm) {
            const tempFormValue = {
              slide3Fields: {
                entityType: businessData.entityType
                  ? businessData.entityType
                  : '',
                dba: businessData.dba ? businessData.dba : '',
                formationDate: businessData.formationDate
                  ? businessData.formationDate
                  : '',
                ein: businessData.ein ? businessData.ein : ''
              },
              slide4Fields: {
                companyAddressLine_1: businessData.companyAddressLine1
                  ? businessData.companyAddressLine1
                  : '',
                companyAddressLine_2: businessData.companyAddressLine2
                  ? businessData.companyAddressLine2
                  : '',
                companyCity: businessData.companyCity
                  ? businessData.companyCity
                  : '',
                companyState: businessData.companyState
                  ? businessData.companyState
                  : '',
                companyZip: businessData.companyZip
                  ? businessData.companyZip
                  : '',
                companyCountry: businessData.companyCountry
                  ? businessData.companyCountry
                  : ''
              }
            };
            this.slide4Fields.setValue(tempFormValue.slide4Fields);
            this.slide3Fields.setValue(tempFormValue.slide3Fields);
          }
        }
      })
    );
  }

  // Load Google Address API
  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({ addressElement: address });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.slide4Fields.patchValue({
          companyAddressLine_1: res.address,
          companyCity: res.city,
          companyState: res.state,
          companyZip: res.zip,
          companyCountry: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  checkForPattern(event: any) {
    const str = this.slide3Fields.controls.dba.value;
    if (event.data && !(event.data.match('^[a-zA-Z1-9 ]+')?.length > 0)) {
      //! used intentionlly
      this.slide3Fields.controls.dba.setValue(str.substring(0, str.length - 1));
    }
  }

  checkDate() {
    try {
      if (
        this.isInTheFuture(
          new Date(this.slide3Fields.controls.formationDate.value)
        )
      ) {
        this.slide3Fields.controls.formationDate.setValue(
          this.datePipe.transform(new Date(), 'yyyy-MM-dd')
        );
      }
    } catch (error) {
      this.slide3Fields.controls.formationDate.setValue(
        this.datePipe.transform(new Date(), 'yyyy-MM-dd')
      );
    }
  }

  isInTheFuture(date: any) {
    const today = new Date();
    return date > today;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  check(item: any, event: any) {
    item.isChecked = event.target.checked;
  }
}
