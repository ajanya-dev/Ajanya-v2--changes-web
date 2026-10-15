import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { V4AddOwnershipDetailsModalComponent } from 'src/app/modules/v4-common-verification/components/v4-add-ownership-details-modal/v4-add-ownership-details-modal.component';
import {
  LucideAngularModule,
  Camera,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-angular';
import { NgxMaskDirective } from 'ngx-mask';

import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { IAppState } from 'src/app/store/app-state.model';
import { UserManagementActions } from 'src/app/modules/store/userManagement/userManagement.actions';
import { Utils } from 'src/app/data/utils';
import { V4UploadImageModalComponent } from 'src/app/shared/modal/v4-upload-image-modal/v4-upload-image-modal.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Country } from 'src/app/data/data/country-list';
import { ICountryModel } from 'src/app/models/common';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';

/**
 * Mirrors the v3 CommonCountryDropDownComponent default
 * (`@Input() allowedCountry = ['US', 'CA']`). Personal Info only
 * permits selecting US or CA from the dropdown by default. Any other
 * country saved on the user's profile is dynamically injected into
 * the dropdown by `normalizeCountry()` so existing users don't lose
 * their selection.
 */
const ALLOWED_COUNTRIES = ['US', 'CA'];

@Component({
  selector: 'app-v4-personal-info',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    NgxMaskDirective,
    CommonInputFieldV4Component,
    CommonButtonV4Component,
    PhoneInputV4Component,
    V4ControlMessageComponent,
    V4CommonDropDownSelectorComponent,
    V4DatePickerComponent
  ],
  providers: [DatePipe],
  templateUrl: './v4-personal-info.component.html',
  styleUrls: ['./v4-personal-info.component.scss']
})
export class V4PersonalInfoComponent implements OnInit, OnDestroy {
  private googleAddressService = inject(GoogleAddressService);
  userService = inject(UserProfileService);
  private alert = inject(V4AlertService);
  private datePipe = inject(DatePipe);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);
  private store = inject(Store<IAppState>);
  private dialog = inject(MatDialog);

  readonly CameraIcon = Camera;
  readonly LoaderIcon = Loader2;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;

  currenCountryPhoneLength = {} as { min: number; max: number };
  currentCountryCode: string;

  /** Full country master list — used by normalizeCountry() to look up
   *  countries that aren't in the allowed-by-default subset. */
  private allCountries: ICountryModel[] = Country.countryList();

  /** Countries actually rendered in the dropdown. Starts with
   *  ALLOWED_COUNTRIES and may grow when normalizeCountry() injects a
   *  user's previously-saved country (parity with v3
   *  `addOtherCountries`). Reassigned (not mutated) so the dropdown
   *  picks up the change via reference equality. */
  countryList: { code: string; name: string }[] = this.allCountries
    .filter((c) => ALLOWED_COUNTRIES.includes(c.code))
    .map((c) => ({ code: c.code, name: c.name }));

  countryDropdownConfig = {
    placeholder: 'Select Country',
    displayField: 'name',
    outputField: 'code'
  };

  customPattern = {
    1: { pattern: /\d/, symbol: '*' },
    0: { pattern: /\d/ },
    symbol: '',
    2: { pattern: /\d/, symbol: '*' }
  };

  subscriptions: Subscription[] = [];
  btnDisable = false;
  mask = '111110000';
  ssnRevealed = false;
  isEmailVerified = true;
  isPhoneVerified = true;
  nowDate: string;
  maxDobDate: string;
  minDobDate: string;
  profilePic: string;
  loading = signal(false);
  isNameExpanded = signal(false);
  corppedImg: FormData;

  userDetails$ = toObservable(this.userService.userDetailsSignal);

  userForm = new FormGroup({
    firstName: new FormControl('', [
      Validators.required,
      Validators.maxLength(100),
      ValidationService.noWhitespaceValidator
    ]),
    lastName: new FormControl('', [Validators.maxLength(50)]),
    displayName: new FormControl('', [Validators.maxLength(30)]),
    email: new FormControl(''),
    phone: new FormControl(''),
    ssn: new FormControl('', [Validators.minLength(9)]),
    date: new FormControl('', [ValidationService.dateOfBirthValidator]),
    address1: new FormControl('', [
      Validators.maxLength(50),
      ValidationService.noWhitespaceValidator
    ]),
    address2: new FormControl('', [
      Validators.maxLength(50),
      ValidationService.noWhitespaceValidator
    ]),
    city: new FormControl('', [
      Validators.maxLength(50),
      ValidationService.noWhitespaceValidator
    ]),
    state: new FormControl('', [
      Validators.maxLength(50),
      ValidationService.noWhitespaceValidator
    ]),
    zip: new FormControl('', [ValidationService.zipValidator]),
    country: new FormControl('')
  });

  ngOnInit(): void {
    this.setUserData();
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.getUserVerification();
    this.nowDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd') as string;

    // Bounds mirror ValidationService.dateOfBirthValidator (18-120 years) so
    // the picker cannot offer a date the validator would then reject.
    const maxDob = new Date();
    maxDob.setFullYear(maxDob.getFullYear() - 18);
    this.maxDobDate = this.datePipe.transform(maxDob, 'yyyy-MM-dd') as string;
    const minDob = new Date();
    minDob.setFullYear(minDob.getFullYear() - 120);
    this.minDobDate = this.datePipe.transform(minDob, 'yyyy-MM-dd') as string;

    // P2: when the user manually picks a valid country from the
    // dropdown, clear any `unknownCountry` error left by normalization.
    this.subscriptions.push(
      this.userForm.controls.country.valueChanges.subscribe((value) => {
        const errs = this.userForm.controls.country.errors;
        if (value && errs?.unknownCountry) {
          delete errs.unknownCountry;
          this.userForm.controls.country.setErrors(
            Object.keys(errs).length ? errs : null
          );
        }
      })
    );
  }

  /**
   * Ports v3 CommonCountryDropDownComponent.getCountryCode +
   * addOtherCountries: takes any backend / Google Places country value
   * (alpha-2 code OR full name, any case) and returns a code that
   * matches an entry in `countryList`. If the value is outside
   * ALLOWED_COUNTRIES but exists in the master list, the country is
   * injected into `countryList` so the dropdown can still display it
   * (parity with v3 `addOtherCountries`). Returns '' if the value is
   * unrecognised — the caller should then mark the form control with
   * an `unknownCountry` error so the user is forced to pick again.
   */
  private normalizeCountry(value: string | undefined | null): string {
    if (!value) return '';

    // Resolve to a code first.
    let code = '';
    if (value.length <= 2) {
      code = value.toUpperCase();
    } else {
      const cap = value.charAt(0).toUpperCase() + value.slice(1);
      code = this.allCountries.find((c) => c.name === cap)?.code ?? '';
    }
    if (!code) return '';

    // Already in the displayed list — nothing more to do.
    if (this.countryList.some((c) => c.code === code)) return code;

    // Outside ALLOWED_COUNTRIES but valid in the master list: inject it
    // so the dropdown can render the user's existing selection.
    const country = this.allCountries.find((c) => c.code === code);
    if (country) {
      this.countryList = [
        ...this.countryList,
        { code: country.code, name: country.name }
      ];
      return code;
    }

    return '';
  }

  setUserData(): void {
    this.subscriptions.push(
      this.userDetails$.subscribe((res) => {
        if (res) {
          if (this.localStorageService.getItem('username') === '') {
            this.localStorageService.setItem('username', res.name);
          }
          this.profilePic = res.profilePicLink;

          // P0: normalize country from API. Backend sometimes returns
          // 'US' and sometimes 'United States'; v3 was tolerant of both
          // via CommonCountryDropDownComponent.writeValue. v4's plain
          // dropdown matches by exact code, so we resolve here.
          const normalizedCountry = this.normalizeCountry(res.country);

          this.userForm.patchValue({
            firstName: res.name,
            lastName: res.lName,
            displayName: res.nickName,
            email: res.email,
            phone: res.phone,
            address1: res.AddressLine1,
            address2: res.AddressLine2,
            city: res.city,
            state: res.state,
            country: normalizedCountry,
            date: res.dateOfBirth,
            zip: res.zip,
            ssn: res.ssn
          });

          // P2: surface unresolved country so the form is invalid until
          // the user picks a valid one (instead of silently submitting
          // an empty country to the backend). markAsTouched() is
          // required because V4ControlMessageComponent only renders
          // errors when control.touched is true, and we want the
          // "Invalid Country" message visible immediately on load
          // without waiting for the user to interact with the field.
          if (res.country && !normalizedCountry) {
            this.userForm.controls.country.setErrors({ unknownCountry: true });
            this.userForm.controls.country.markAsTouched();
          }
        }
      })
    );
  }

  getUserVerification(): void {
    this.subscriptions.push(
      this.userService.UserVerification$.subscribe((res) => {
        if (res?.email_verified !== 1) {
          this.userForm.controls.email.setValidators([
            ValidationService.emailValidator,
            Validators.required
          ]);
          this.userForm.controls.email.updateValueAndValidity();
          this.isEmailVerified = false;
        } else {
          this.isEmailVerified = true;
          this.userForm.controls.email.clearValidators();
          this.userForm.controls.email.updateValueAndValidity();
        }
        if (res?.phone_verified !== 1) {
          this.userForm.controls.phone.setValidators(
            ValidationService.customMinLength(
              this.currenCountryPhoneLength?.min ?? 10
            )
          );
          this.userForm.controls.phone.updateValueAndValidity();
          this.isPhoneVerified = false;
        } else {
          this.userForm.controls.phone.clearValidators();
          this.userForm.controls.phone.updateValueAndValidity();
          this.isPhoneVerified = true;
        }
      })
    );
  }

  toggleSsnReveal(): void {
    // Swapping the mask template makes ngx-mask reparse the current value
    // against shifted dash positions, dropping digits mid-edit. Re-apply the
    // captured digits once that pass has run.
    const rawValue = (this.userForm.controls.ssn.value ?? '').replace(
      /\D/g,
      ''
    );
    this.ssnRevealed = !this.ssnRevealed;
    if (this.ssnRevealed) {
      this.mask = '111-11-0000';
      this.customPattern = {
        1: { pattern: /\d/, symbol: '' },
        0: { pattern: /\d/ },
        symbol: '',
        2: { pattern: /\d/, symbol: '' }
      };
    } else {
      this.mask = '111110000';
      this.customPattern = {
        1: { pattern: /\d/, symbol: '*' },
        0: { pattern: /\d/ },
        symbol: '',
        2: { pattern: /\d/, symbol: '*' }
      };
    }
    Promise.resolve().then(() => {
      this.userForm.controls.ssn.setValue(rawValue);
    });
  }

  onSubmit(): void {
    this.userForm.markAllAsTouched();
    if (this.userForm.invalid || this.btnDisable) return;

    this.localStorageService.setItem(
      'selected_dial_code',
      this.currentCountryCode
    );
    this.btnDisable = true;
    const data = this.userForm.value;
    const newDate = this.datePipe.transform(data.date, 'MM/dd/yyyy');
    const body = {
      name: data.firstName,
      lName: data.lastName,
      nickName: data.displayName,
      email: data.email,
      phone: data.phone,
      addressLine1: data.address1,
      addressLine2: data.address2,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country,
      dateOfBirth: newDate,
      ssn: data.ssn
    };
    this.localStorageService.setItem('username', body.name);
    this.subscriptions.push(
      this.userService
        .updatePersonalInfo(body)
        .pipe(catchError(() => of(false)))
        .subscribe((res: Record<string, boolean>) => {
          this.btnDisable = false;
          if (res.success === true) {
            this.headerService.setHeaderValueChanged(true);
            this.refreshUserData();
            this.alert.successAlert({
              title: 'Success',
              content: 'Personal Info Updated',
              doneMsg: 'OK',
              close: true,
              timeout: 2000
            });
            this.store.dispatch(UserManagementActions.clearUserVerification());
            this.store.dispatch(UserManagementActions.loadUserVerification());
          }
        })
    );
  }

  loadGoogleAddress(address: HTMLInputElement): void {
    this.googleAddressService.googleAutocomplete({ addressElement: address });
    const sub = this.googleAddressService.googleAddress$.subscribe((res) => {
      // P0: Google Places returns either the alpha-2 code or the
      // long country name depending on the result. Normalize so the
      // dropdown actually picks it up. P1: if the resolved country is
      // outside ALLOWED_COUNTRIES, normalizeCountry() injects it.
      const normalizedCountry = this.normalizeCountry(res.country);
      this.userForm.patchValue({
        address1: res.address,
        city: res.city,
        state: res.state,
        zip: res.zip,
        country: normalizedCountry
      });
      if (res.country && !normalizedCountry) {
        this.userForm.controls.country.setErrors({ unknownCountry: true });
        this.userForm.controls.country.markAsTouched();
      }
      sub.unsubscribe();
    });
  }

  countryChange(event: {
    length: { min: number; max: number };
    code: string;
  }): void {
    this.currenCountryPhoneLength = event.length;
    this.userForm.controls.phone.setValidators([
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.userForm.controls.phone.updateValueAndValidity();
  }

  countryCodeChange(event: {
    code: string;
    updateLocalStorage: boolean;
  }): void {
    this.currentCountryCode = event.code;
  }

  private readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  private readonly ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

  openDialog(event: Event & { target: HTMLInputElement }): void {
    if (!event.target.files || !event.target.files.length) return;

    const file = event.target.files[0];
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop() || '';

    if (!this.ALLOWED_EXTENSIONS.includes(fileExtension)) {
      this.alert.warningAlert({
        content: 'Only JPG, PNG, GIF, and WEBP images are allowed.'
      });
      return;
    }
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.alert.warningAlert({
        content: 'Invalid image format. Please upload a valid image file.'
      });
      return;
    }
    if (Utils.maxSizeValidator(file.size)) {
      this.alert.warningAlert({ content: 'Maximum size is 5MB.' });
      return;
    }
    if (!Utils.fileTypeValidator(file, ['svg'])) {
      this.alert.warningAlert({ content: 'SVG files are not supported!!' });
      return;
    }

    const dialogRef = this.dialog.open(V4UploadImageModalComponent, {
      maxWidth: '500px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: { event }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        this.loading.set(false);
        return;
      }
      if (result.image) {
        this.loading.set(true);
        const blob = new Blob([result.image.blob], { type: 'image/jpg' });
        const imageFile = new File([blob], 'profile_pic_img.jpg', {
          type: 'image/jpg'
        });
        const formData = new FormData();
        formData.append('profilePicImg', imageFile, 'image.jpg');
        this.addProfilePic(formData);
      }
    });
  }

  addProfilePic(formData: FormData): void {
    this.subscriptions.push(
      this.userService.uploadPhoto(formData).subscribe((res) => {
        this.btnDisable = false;
        if (res.success) {
          this.refreshUserData(true);
          this.headerService.setHeaderValueChanged(true);
        } else {
          this.loading.set(false);
        }
      })
    );
  }

  private refreshUserData(isUpdateProfile?: boolean): void {
    this.subscriptions.push(
      this.userService.getPersonalInfo().subscribe((res) => {
        if (res.success) {
          this.userService.userDetailsSignal.set(res.data);
          if (isUpdateProfile) {
            this.alert.successAlert({
              title: 'Success',
              content: 'Profile Picture Updated',
              close: true,
              timeout: 2000
            });
            this.loading.set(false);
          }
        }
      })
    );
  }

  openOwnershipModal(): void {
    this.dialog.open(V4AddOwnershipDetailsModalComponent, {
      maxWidth: '700px',
      width: '95%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
