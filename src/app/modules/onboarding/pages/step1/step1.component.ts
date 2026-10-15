import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { DatePipe, LocationStrategy, NgClass } from '@angular/common';
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
import { Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { IonBoardingDetails } from 'src/app/modules/onboarding/model/onBoarding';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { IBusinessIndustryTypes } from 'src/app/modules/user/model/user';
import { NgSelectModule } from '@ng-select/ng-select';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
@Component({
  selector: 'app-step1',
  templateUrl: './step1.component.html',
  styleUrls: ['./step1.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    ControlMessageComponent,
    NgSelectModule
  ]
})
export class Step1Component implements OnInit, OnDestroy {
  slide = 1;
  isyesOnHover = false;
  isNoOnHover = false;
  bussinessDetailsForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  showValidationMessage: boolean;
  imageUrl: string | ArrayBuffer | null;
  todayDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
  lastTriggeredButton: string; //for activity indicators

  helpList: IBusinessIndustryTypes[] = [];

  rolesList: IBusinessIndustryTypes[] = [];

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

  secondaryIndustryType: IBusinessIndustryTypes[] = [];

  industryType = [
    { value: 'retail', name: 'Retail' },
    { value: 'wholesale', name: 'Wholesale' },
    { value: 'restaurants', name: 'Restaurants' },
    { value: 'hospitals', name: 'Hospitals' },
    { value: 'construction', name: 'Construction' },
    { value: 'insurance', name: 'Insurance' },
    { value: 'unions', name: 'Unions' },
    { value: 'realEstate', name: 'RealEstate' },
    { value: 'freelanceProfessional', name: 'Freelance Professional' },
    { value: 'otherProfessionalServices', name: 'Other Professional Services' },
    { value: 'onlineRetailer', name: 'Online Retailer' },
    { value: 'otherEducationServices', name: 'Other Education Services' }
  ];

  transactionalVolume = [
    { value: '<$50k', name: 'Below $50k' },
    { value: '$50k-$100k', name: '$50k - $100k' },
    { value: '$100k-$500k', name: '$100k - $500k' },
    { value: '$500k-$1M', name: '$500k - $1M' },
    { value: '$1M-$10M', name: '$1M - $10M' },
    { value: '>$10M', name: 'Above $10M' }
  ];

  @ViewChild('AddressSearch')
  public businessAddressSearchRef: ElementRef;
  loading: boolean;

  constructor(
    private _alert: AlertService,
    private userService: UserProfileService,
    private datePipe: DatePipe,
    private router: Router,
    private headerService: HeaderService,
    private localStorageService: LocalStorageService,
    private formbuilder: UntypedFormBuilder,
    private gettingStartedService: GettingStartedService,
    private location: LocationStrategy
  ) {
    // Disabling Back Button For Onboarding Step 1
    history.pushState('', '', window.location.href);
    this.location.onPopState(() => {
      history.pushState('', '', window.location.href);
    });
  }

  ngOnInit(): void {
    this.initializeForms();
    this.getOnBoardingStatus();
    this.getHelpList();
    this.getIndustryTypes();
    this.getRoles();
  }
  initializeForms() {
    this.bussinessDetailsForm = this.formbuilder.group({
      companyName: new UntypedFormControl('', [
        Validators.required,
        Validators.maxLength(30),
        ValidationService.whitespaceValidator
      ]),
      role: new UntypedFormControl('', []),
      revenue: new UntypedFormControl('', []),
      industryType: new UntypedFormControl(''),
      secondaryIndustryType: new UntypedFormControl(''),
      logo: new UntypedFormControl('')
    });
  }
  getOnBoardingStatus() {
    const onboardingDetails = this.localStorageService.getOnboardingData();
    if (onboardingDetails) {
      if (onboardingDetails.bussinessDetailsFormData) {
        this.bussinessDetailsForm.setValue(
          onboardingDetails.bussinessDetailsFormData
        );
      }
      this.slide = onboardingDetails.slide
        ? onboardingDetails.slide
        : this.slide;
      this.helpList = onboardingDetails.helpList
        ? onboardingDetails.helpList
        : this.helpList;
    }
  }
  onSlide2NextClicked() {
    if (this.bussinessDetailsForm.controls.companyName.valid) {
      this.onNextClicked();
    } else {
      this.bussinessDetailsForm.controls.companyName.markAsTouched();
      this.showValidationMessage = true;
    }
  }
  onNextClicked() {
    this.isyesOnHover = false; //flickeringBugFix for yes image
    this.showValidationMessage = false;
    this.slide += 1;
    const onboardingData: IonBoardingDetails = {
      onBoardStatus: 'not_onboarded',
      slide: this.slide,
      bussinessDetailsFormData: this.bussinessDetailsForm.value,
      helpList: this.helpList
    };
    this.localStorageService.setOnboardingData(onboardingData);
  }
  onYesMouseout() {
    this.isyesOnHover = false;
  }
  onYesMouseover() {
    this.isyesOnHover = true;
  }
  onNoMouseout() {
    this.isNoOnHover = false;
  }
  onNoClicked() {
    this.saveBusinessInfo('step1_no_clicked');
  }
  onNoMouseover() {
    this.isNoOnHover = true;
  }
  onSkipClicked() {
    this.lastTriggeredButton = 'skip';
    this.saveBusinessInfo('step1_skip_clicked');
  }
  onSaveClicked() {
    this.lastTriggeredButton = 'finish';
    this.saveBusinessInfo('step1_completed');
  }
  saveBusinessInfo(status: string) {
    let processedData: any;
    if (status) {
      //comes from no button- true if no clicked
      processedData = this.createUserBusinessBody(status);
    } else {
      if (this.bussinessDetailsForm.invalid) {
        return;
      }
      processedData = this.createUserBusinessBody();
    }
    this.localStorageService.setOnboardingData({
      onBoardStatus: processedData.status
    });
    this.loading = true;
    this.subscriptions.push(
      this.userService
        .postOnboardingDataStep1(processedData)
        .pipe(
          catchError(() => {
            this.loading = false;
            return of(false);
          })
        )
        .subscribe((res) => {
          this.loading = false;
          if (res.success && status == 'step1_no_clicked') {
            this.gettingStartedService.resetGettingStartedData();

            this.router.navigate(['/manage/verification/index']);
          } else if (res.success) {
            const data = {
              title: 'Success',
              content: 'Business Info Saved',
              close: true,
              timeout: 1500
            };
            this.headerService.setHeaderValueChanged(true);
            const dialogRef = this._alert.successAlert(data);
            dialogRef.afterClosed().subscribe(() => {
              this.gettingStartedService.resetGettingStartedData();

              this.router.navigate(['/manage/verification/index']);
            });
          }
        })
    );
  }

  getHelpList() {
    this.loading = true;
    const sendingData = {
      type: 'helpText'
    };
    this.subscriptions.push(
      this.userService.getOnboardingListData(sendingData).subscribe(
        (res) => {
          this.loading = false;
          if (res.success) {
            this.helpList = res.data;
            this.helpList.forEach((ele: IBusinessIndustryTypes) => {
              ele.isChecked = false;
            });
          }
        },
        () => {
          this.loading = false;
        }
      )
    );
  }
  getIndustryTypes() {
    this.loading = true;
    const sendingData = {
      type: 'secondaryIndustryType'
    };
    this.subscriptions.push(
      this.userService.getOnboardingListData(sendingData).subscribe(
        (res: any) => {
          this.loading = false;
          if (res.success) {
            this.secondaryIndustryType = res.data;
          }
        },
        () => {
          this.loading = false;
        }
      )
    );
  }
  getRoles() {
    this.loading = true;
    const sendingData = {
      type: 'role'
    };
    this.subscriptions.push(
      this.userService.getOnboardingListData(sendingData).subscribe(
        (res: any) => {
          this.loading = false;
          if (res.success) {
            this.rolesList = res.data;
          }
        },
        () => {
          this.loading = false;
        }
      )
    );
  }
  createUserBusinessBody(status?: string) {
    if (status == 'step1_no_clicked') {
      const temp = {
        businessName: '',
        status: status
      };
      return temp;
    }
    let featuresneeded = this.helpList.map((element: any) => {
      if (element.isChecked) {
        return element.id;
      }
    });
    featuresneeded = featuresneeded.filter((element) =>
      element ? true : false
    );
    const temp = {
      businessName: this.bussinessDetailsForm.value.companyName,
      secondaryIndustryType: this.bussinessDetailsForm.value
        .secondaryIndustryType
        ? this.bussinessDetailsForm.value.secondaryIndustryType
        : '',
      industryType: this.bussinessDetailsForm.value.industryType
        ? this.bussinessDetailsForm.value.industryType
        : '',
      txnVolume: this.bussinessDetailsForm.value.revenue,
      featuresNeeded: JSON.stringify(featuresneeded),
      companyRole: this.bussinessDetailsForm.value.role,
      status: status
    };
    return temp;
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  check(item: any, event: any) {
    item.isChecked = event.target.checked;
  }

  toggleCheckbox(item: any) {
    item.isChecked = !item.isChecked;
  }
}
