import { Subscription } from 'dexie';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule
} from '@angular/material/dialog';
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Inject,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import {
  Validators,
  AbstractControl,
  FormControl,
  FormBuilder,
  ValidatorFn,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import {
  IBusinessOwners,
  IBusinessOwnershipForm
} from 'src/app/modules/common-verification/model/common-verification';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { LucideAngularModule, X } from 'lucide-angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

@Component({
  selector: 'app-v4-add-ownership-details-modal',
  templateUrl: './v4-add-ownership-details-modal.component.html',
  styleUrls: ['./v4-add-ownership-details-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    NgxMaskPipe,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent,
    CommonButtonV4Component,
    PhoneInputV4Component,
    LucideAngularModule,
    FontAwesomeModule,
    V4ControlMessageComponent
  ]
})
export class V4AddOwnershipDetailsModalComponent implements OnInit, OnDestroy {
  @ViewChild('searchGoogleAddess')
  public searchElementRef!: ElementRef;

  readonly XIcon = X;

  subscriptions: Subscription[] = [];
  businessForm: FormGroup<IBusinessOwnershipForm>;
  editMode = false;
  allowedcountries: Record<string, string>;
  countryList: { key: string; value: string }[] = [];
  countries: string[] = [];
  phonenumber: string | undefined;
  customPattern = {
    1: { pattern: /\d/, symbol: '*' },
    0: { pattern: /\d/ },
    symbol: '',
    2: { pattern: /\d/, symbol: '*' }
  };

  mask = '111110000';

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: IBusinessOwners | undefined,
    private formBulder: FormBuilder,
    private googleAddressService: GoogleAddressService,
    private matDialogRef: MatDialogRef<V4AddOwnershipDetailsModalComponent>,
    private cloudService: CloudBankService
  ) {}

  ngOnInit(): void {
    this.initFormGroup();
    this.getAllowedCountries();
    if (this.data) {
      this.editMode = true;
      this.phonenumber = this.data?.phoneNumber;
      this.setFormData();
    }
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }

  initFormGroup(): void {
    this.businessForm = this.formBulder.group<IBusinessOwnershipForm>({
      firstName: new FormControl('', [
        Validators.required,
        ValidationService.whitespaceValidator
      ]),
      lastName: new FormControl('', [
        Validators.required,
        ValidationService.whitespaceValidator
      ]),
      title: new FormControl('', [
        Validators.required,
        ValidationService.whitespaceValidator
      ]),
      fullSsn: new FormControl('', [
        Validators.required,
        ValidationService.whitespaceValidator
      ]),
      birthDate: new FormControl('', [
        Validators.required,
        ValidationService.whitespaceValidator
      ]),
      phoneNumber: new FormControl('', [
        Validators.required,
        ValidationService.phoneMinLength as ValidatorFn
      ]),
      ownershipPercentage: new FormControl('', [
        Validators.required,
        this.validatePercentage
      ]),
      address: new FormControl('', [
        Validators.required,
        ValidationService.whitespaceValidator
      ]),
      city: new FormControl('', [
        Validators.required,
        ValidationService.whitespaceValidator
      ]),
      state: new FormControl('', [
        Validators.required,
        ValidationService.whitespaceValidator
      ]),
      zip: new FormControl('', [
        Validators.required,
        ValidationService.zipValidator
      ]),
      country: new FormControl('', [
        Validators.required,
        ValidationService.whitespaceValidator
      ]),
      email: new FormControl('', [
        Validators.required,
        ValidationService.emailValidator
      ])
    });
  }

  setFormData(): void {
    this.businessForm.setValue({ ...this.data } as IBusinessOwners);
  }

  submit(): void {
    this.businessForm.markAllAsTouched();
    if (this.businessForm.valid) {
      this.matDialogRef.close({
        editMode: this.editMode,
        data: this.businessForm.value
      });
    }
  }

  validatePercentage(control: AbstractControl): { isInvalid: boolean } | null {
    if (control.value < 25 || control.value > 100) {
      return { isInvalid: true };
    }
    return null;
  }

  private googleAddressInitialized = false;

  loadGoogleAddress(address: HTMLInputElement) {
    if (this.googleAddressInitialized) return;
    this.googleAddressInitialized = true;

    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: this.countries,
      displayShortName: true
    });

    this.subscriptions.push(
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.businessForm.patchValue({
          address: res.address,
          city: res.city,
          state: res.state,
          zip: res.zip,
          country: res.country
        });
      })
    );
  }

  onFocus() {
    this.mask = '111-11-0000';
    this.customPattern = {
      1: { pattern: /\d/, symbol: '' },
      0: { pattern: /\d/ },
      symbol: '',
      2: { pattern: /\d/, symbol: '' }
    };
  }

  onBlur() {
    this.mask = '111110000';
    this.customPattern = {
      1: { pattern: /\d/, symbol: '*' },
      0: { pattern: /\d/ },
      symbol: '',
      2: { pattern: /\d/, symbol: '*' }
    };
  }

  getAllowedCountries() {
    this.subscriptions.push(
      this.cloudService.allowedCountries.subscribe((res) => {
        if (res && Object.keys(res).length > 0) {
          this.allowedcountries = res;
          this.countries = Object.keys(this.allowedcountries);
          this.countryList = Object.entries(res).map(([key, value]) => ({
            key,
            value
          }));
        }
      })
    );
    // Fetch from API if not already loaded (v4 header doesn't populate this)
    if (
      !this.cloudService.allowedCountries.value ||
      Object.keys(this.cloudService.allowedCountries.value).length === 0
    ) {
      this.subscriptions.push(
        this.cloudService.getAllowedCountries().subscribe((res) => {
          if (res?.data) {
            this.cloudService.allowedCountries.next(res.data);
          }
        })
      );
    }
  }

  selectBenfCountry(type: HTMLElement) {
    type.classList.add('active');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
