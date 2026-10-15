import { ActivatedRoute } from '@angular/router';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject
} from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder
} from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import {
  IBillingAddress,
  IChoosePlan,
  IPlanFeaturesAddonsListWithBill
} from 'src/app/modules/subscription/model/subscription';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { SelectedPlanCodes } from 'src/app/data/data/subscription';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { NgFor, KeyValuePipe } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { SubBiilingCalculationComponent } from '../sub_components/sub-biiling-calculation/sub-biiling-calculation.component';
import { GoogleAddressService } from '../../../../core/services/google-address.service';
import { CommonHelpButtonComponent } from '../../../../layout/v3-layout/common-help-button/common-help-button.component';

@Component({
  selector: 'app-sub-billing-address',
  templateUrl: './sub-billing-address.component.html',
  styleUrls: ['./sub-billing-address.component.scss'],
  standalone: true,
  imports: [
    CommonHelpButtonComponent,
    MatTooltip,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgxMaskDirective,
    NgFor,
    SubBiilingCalculationComponent,
    KeyValuePipe
  ]
})
export class SubBillingAddressComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private subscriptionService = inject(SubscriptionService);
  private googleAddressService = inject(GoogleAddressService);
  private route = inject(ActivatedRoute);
  private cloudAccService = inject(CloudBankService);
  private localStorageService = inject(LocalStorageService);

  @ViewChild('billingAddress') addressElementRef: ElementRef;

  @Input()
  plan_feature_addon_list$: Observable<IPlanFeaturesAddonsListWithBill>;

  @Input() selected_plan_details: IChoosePlan;

  @Output() onChoosePlan = new EventEmitter<IChoosePlan>();

  plan_feature_addon_list: IPlanFeaturesAddonsListWithBill;
  data_for_billing$ = new BehaviorSubject<IChoosePlan>({} as IChoosePlan);

  subscriptions: Subscription[] = [];
  selectedPlanCode: string;
  billingAddress: IBillingAddress;
  utils = Utils;
  currentPlanQuantity: number;
  isHideAddon = false;
  allowedcountries: Record<string, string>;
  countries: string[] = [];
  private allowedCountriesFetchAttempted = false;
  selectedCountry: string;
  selectedPlans: string[] = SelectedPlanCodes.planCodeList();

  billingForm = this.fb.group({
    billingFirstName: ['', [Validators.required]],
    billingLastName: ['', [Validators.required]],
    billingCompanyName: ['', [Validators.required]],
    billingPhoneNumber: [
      '',
      [Validators.required, ValidationService.phoneNumberValidator]
    ],
    billingAddress: ['', [Validators.required, Validators.minLength(3)]],
    billingCity: [
      '',
      [Validators.required, ValidationService.noWhitespaceValidator]
    ],
    billingState: [
      '',
      [Validators.required, ValidationService.noWhitespaceValidator]
    ],
    billingZip: [
      '',
      [
        Validators.required,
        ValidationService.zipValidator,
        ValidationService.zipValidator
      ]
    ],
    billingCountry: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadData();
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.getAllowedCountries();
  }

  loadData(): void {
    this.emitSelectedData();

    // Selected Plan
    this.subscriptions.push(
      this.plan_feature_addon_list$.subscribe((res) => {
        this.plan_feature_addon_list = res;

        if (this.plan_feature_addon_list) {
          this.setBillForm(this.plan_feature_addon_list?.billingAddress);
        }
      })
    );
  }

  setBillForm(address: IBillingAddress): void {
    let data: IBillingAddress;
    if (this.selected_plan_details?.data?.billingAddress)
      data = this.selected_plan_details?.data?.billingAddress;
    else data = address;

    this.billingAddress = address;

    if (data?.country === 'United States') {
      this.selectedCountry = 'US';
    } else {
      this.selectedCountry = data?.country;
    }

    this.billingForm.patchValue({
      billingFirstName: data?.firstName
        ? data.firstName
        : this.localStorageService.getItem('username'),
      billingLastName: data?.lastName,
      billingCompanyName: data?.companyName,
      billingPhoneNumber: data?.phone,
      billingAddress: data?.addressLine1,
      billingCity: data?.city,
      billingState: data?.state,
      billingZip: data?.zip,
      billingCountry: this.selectedCountry
    });
  }

  createBillingBody(): IBillingAddress {
    const data = this.billingForm.value;
    return {
      firstName: data.billingFirstName as string,
      lastName: data.billingLastName as string,
      companyName: data.billingCompanyName as string,
      phone: data.billingPhoneNumber as string,
      addressLine1: data.billingAddress as string,
      city: data.billingCity as string,
      state: data.billingState as string,
      zip: data.billingZip as string,
      country: data.billingCountry as string
    };
  }

  /**  EMIT SELECTED DATA */
  emitSelectedData(): void {
    this.selectedPlanCode = this.selected_plan_details?.data?.planCode;
    if (this.selectedPlans.includes(this.selectedPlanCode)) {
      this.isHideAddon = true;
    } else {
      this.isHideAddon = false;
    }

    this.data_for_billing$.next({
      success: true,
      data: {
        planCode: this.selected_plan_details?.data?.planCode,
        intervelType: this.selected_plan_details?.data?.intervelType,
        nextStep: 'addOns',
        currentStep: 'billingAddress',
        selectedAddon: this.selected_plan_details?.data?.selectedAddon,
        allData: this.selected_plan_details?.data?.allData,
        currentSlide: this.selected_plan_details?.data?.nextStep,
        grandTotal: this.selected_plan_details?.data?.grandTotal
      }
    });
  }

  //= ======== Submit the form
  onProceed() {
    this.billingForm.markAllAsTouched();

    if (this.billingForm.invalid) {
      return;
    }

    if (this.route.snapshot.routeConfig?.path === 'plan/change-addon') {
      this.onChoosePlan.emit({
        success: true,
        data: {
          planCode: this.selected_plan_details?.data?.planCode,
          intervelType: this.selected_plan_details?.data?.intervelType,
          nextStep: 'payment',
          selectedAddon: this.selected_plan_details?.data?.selectedAddon,
          allData: this.selected_plan_details?.data?.allData,
          billingAddress: this.createBillingBody(),
          grandTotal: this.selected_plan_details?.data?.grandTotal
        }
      });
    } else {
      this.onChoosePlan.emit({
        success: true,
        data: {
          planCode: this.selected_plan_details?.data?.planCode,
          intervelType: this.selected_plan_details?.data?.intervelType,
          nextStep: 'payment',
          selectedAddon: this.selected_plan_details?.data?.selectedAddon,
          allData: this.selected_plan_details?.data?.allData,
          billingAddress: this.createBillingBody(),
          grandTotal: this.selected_plan_details?.data?.grandTotal
        }
      });
    }
  }

  goBack(): void {
    this.onChoosePlan.emit({
      success: true,
      data: {
        planCode: this.selected_plan_details?.data?.planCode,
        intervelType: this.selected_plan_details?.data?.intervelType,
        nextStep: 'addOns',
        selectedAddon: this.selected_plan_details?.data?.selectedAddon,
        allData: this.selected_plan_details?.data?.allData,
        billingAddress: this.createBillingBody(),
        grandTotal: this.selected_plan_details?.data?.grandTotal,
        hideAddon: this.isHideAddon
      }
    });
  }

  isNumberKey(evt: KeyboardEvent): boolean {
    const charCode = evt.which ? evt.which : evt.keyCode;
    if (charCode !== 45 && charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  onClose(): void {
    this.subscriptionService.closeSubscriptionPage();
  }

  // Load Google Address API
  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: this.countries,
      displayShortName: true
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.billingForm.patchValue({
          billingAddress: res.address,
          billingCity: res.city,
          billingState: res.state,
          billingZip: res.zip,
          billingCountry: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  getAllowedCountries() {
    this.subscriptions.push(
      this.cloudAccService.allowedCountries.subscribe((res) => {
        if (!res || Object.keys(res).length === 0) {
          if (!this.allowedCountriesFetchAttempted) {
            this.getAllowedCountriesFromBackend();
          } else {
            this.allowedcountries = res ?? {};
            this.countries = [];
          }
          return;
        }
        this.allowedcountries = res;
        this.countries = Object.keys(this.allowedcountries);
      })
    );
  }

  getAllowedCountriesFromBackend() {
    this.allowedCountriesFetchAttempted = true;
    this.subscriptions.push(
      this.cloudAccService.getAllowedCountries().subscribe((res) => {
        if (res?.data) {
          this.cloudAccService.allowedCountries.next(res.data);
        }
      })
    );
  }
  

  selectCountry(type: HTMLElement): void {
    type.classList?.add('active');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
