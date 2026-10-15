import { GoogleAddressService } from '../../../../../core/services/google-address.service';
import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { IBusinessIndustryTypes } from '../../../model/user';
import { NgxMaskDirective } from 'ngx-mask';
import { CommonCountryDropDownComponent } from '../../../../../shared/v3/common-country-drop-down/common-country-drop-down.component';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

/**
 * @description Component for business info in profile section
 */
@Component({
  selector: 'app-business-info',
  templateUrl: './business-info.component.html',
  styleUrls: ['./business-info.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    CommonCountryDropDownComponent,
    NgxMaskDirective
  ]
})
export class BusinessInfoComponent implements OnInit, OnDestroy {
  Out = true;

  @Input() businessForm!: UntypedFormGroup;

  companyId: string;
  nowDate: string;

  subscriptions: Subscription[] = [];
  btnDesable = false;
  constructor(
    private googleAddressService: GoogleAddressService,
    private userService: UserProfileService,
    private alert: AlertService,
    private datePipe: DatePipe,
    private headerService: HeaderService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.getIndustryTypes();
    this.companyId = this.localStorageService.getItem('userId')!;
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.nowDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd') as string;
  }

  /**
   * @description Method to load the google address API
   * @param address - Address for autocomplete
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({ addressElement: address });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.businessForm.patchValue({
          businessAddress1: res.address,
          city: res.city,
          state: res.state,
          zip: res.zip,
          country: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description Method to update the business info.
   */
  submit() {
    this.businessForm.markAllAsTouched();
    if (this.businessForm.invalid) {
      return;
    }

    this.btnDesable = true;

    const processedData = this.createUserBusinessBody();

    this.subscriptions.push(
      this.userService
        .updateBusinessInfo(processedData)
        .pipe(
          catchError(() => {
            return of(false);
          })
        )
        .subscribe((res) => {
          this.btnDesable = false;

          if (res.success == true) {
            const data = {
              title: 'Success',
              content: 'Business Info Updated',
              close: true,
              timeout: 1500
            };
            this.alert.successAlert(data);
          }
        })
    );
    this.headerService.setHeaderValueChanged(true);
  }

  /**
   * @description Method to create business form payload
   * @returns an object containing updated business info
   */
  createUserBusinessBody() {
    const data = this.businessForm.value;
    const newDate = this.datePipe.transform(data.date, 'yyyy-MM-dd');
    return {
      companyName: data.businessLegalName,
      companyAddressLine_1: data.businessAddress1,
      companyAddressLine_2: data.businessAddress2,
      companyCity: data.city,
      companyState: data.state,
      companyZip: data.zip,
      companyCountry: data.country,
      dba: data.dba,
      formationDate: newDate,
      industryType: data.industryType,
      secondaryIndustryType: data.secondaryIndustryType,
      entityType: data.entityType,
      ein: data.ein
    };
  }

  /**
   * @description Method to get businessForm controls
   * @returns businessForm controls
   */
  get getBusinessControl() {
    return this.businessForm.controls;
  }

  /**
   * @description Method to make sure only numbers are being given as input
   */
  numberOnly(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  enityType = [
    { name: 'Sole Proprietor', value: 'soleProprietor' },
    { name: ' Single Member LLC', value: 'singleMemberLLC' },
    { name: ' Limited Liability Company', value: 'limitedLiabilityCompany' },
    { name: ' General Partnership', value: 'generalPartnership' },
    { name: ' Unlisted Corporation  ', value: 'unlistedCorporation' },
    {
      name: ' Publicly Traded Corporation',
      value: 'publiclyTradedCorporation'
    },
    { name: ' Association ', value: 'association' },
    { name: ' Non-Profit Organization', value: 'nonProfit' },
    { name: ' Government Organization', value: 'governmentOrganization' },
    { name: ' Revocable Trust', value: 'revocableTrust' },
    { name: ' Irrevocable Trust', value: 'irrevocableTrust' },
    { name: ' Estate', value: 'estate' }
  ];

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
  secondaryIndustryType: IBusinessIndustryTypes[] = [];

  /**
   * @description Method to get the industry type
   */
  getIndustryTypes() {
    const sendingData = {
      type: 'secondaryIndustryType'
    };
    this.subscriptions.push(
      this.userService.getOnboardingListData(sendingData).subscribe((res) => {
        if (res.success) {
          this.secondaryIndustryType = res.data;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
