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
  OnDestroy
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
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { CloudBankService } from '../../../../shared/service/cloud-bank/cloud-bank.service';
import {
  IBusinessOwners,
  IBusinessOwnershipForm
} from '../../model/common-verification';

@Component({
  selector: 'app-add-ownership-details-modal',
  templateUrl: './add-ownership-details-modal.component.html',
  styleUrls: ['./add-ownership-details-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule,
    NewPhoneInputComponent,
    NgxMaskDirective,
    NgxMaskPipe
  ]
})
export class AddOwnershipDetailsModalComponent implements OnInit, OnDestroy {
  @ViewChild('searchGoogleAddess')
  public searchElementRef!: ElementRef;

  subscriptions: Subscription[] = [];
  businessForm: FormGroup<IBusinessOwnershipForm>;
  editMode = false;
  allowedcountries: Record<string, string>;
  countries: string[] = [];
  phonenumber: string | undefined;
  customPattern = {
    1: { pattern: new RegExp('\\d'), symbol: '*' },
    0: { pattern: new RegExp('\\d') },
    symbol: '',
    2: { pattern: new RegExp('\\d'), symbol: '*' }
  };
  mask = '111110000';

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: IBusinessOwners | undefined,
    private formBulder: FormBuilder,
    private _googleAddressService: GoogleAddressService,
    private _matDialogRef: MatDialogRef<AddOwnershipDetailsModalComponent>,
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
    this._googleAddressService.resetGoogleAutocompleteAPI();
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
      this._matDialogRef.close({
        editMode: this.editMode,
        data: this.businessForm.value
      });
    }
  }

  validatePercentage(control: AbstractControl): { isInvalid: boolean } | null {
    if (control.value < 25 || control.value > 100) {
      return { isInvalid: true };
    } else {
      return null;
    }
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
          address: res.address,
          city: res.city,
          state: res.state,
          zip: res.zip,
          country: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  onFocus() {
    this.mask = '111-11-0000';
    this.customPattern = {
      1: { pattern: new RegExp('\\d'), symbol: '' },
      0: { pattern: new RegExp('\\d') },
      symbol: '',
      2: { pattern: new RegExp('\\d'), symbol: '' }
    };
  }

  onBlur() {
    this.mask = '111110000';
    this.customPattern = {
      1: { pattern: new RegExp('\\d'), symbol: '*' },
      0: { pattern: new RegExp('\\d') },
      symbol: '',
      2: { pattern: new RegExp('\\d'), symbol: '*' }
    };
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
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
