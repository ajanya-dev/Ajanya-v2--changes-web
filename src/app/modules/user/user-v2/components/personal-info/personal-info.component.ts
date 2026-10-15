import { DatePipe, NgClass, NgOptimizedImage } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
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
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { IAppState } from 'src/app/store/app-state.model';
import { NgxMaskDirective } from 'ngx-mask';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCamera,
  faSpinner,
  faEye,
  faEyeSlash
} from '@fortawesome/pro-solid-svg-icons';
import { UploadImageModalComponent } from 'src/app/shared/modal/upload-image-modal/upload-image-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Utils } from 'src/app/data/utils';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { V3DatePickerComponent } from 'src/app/shared/v3/v3-date-picker/v3-date-picker.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { UserManagementActions } from '../../../../store/userManagement/userManagement.actions';
import { GoogleAddressService } from '../../../../../core/services/google-address.service';
import { CommonCountryDropDownComponent } from '../../../../../shared/v3/common-country-drop-down/common-country-drop-down.component';
import { NewPhoneInputComponent } from '../../../../../shared/components/new-phone-input/new-phone-input.component';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

/**
 * @description Component for personal info in profile section.
 */
@Component({
  selector: 'app-personal-info',
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NewPhoneInputComponent,
    NgxMaskDirective,
    CommonCountryDropDownComponent,
    NgOptimizedImage,
    FaIconComponent,
    CommonInputFieldComponent,
    V3DatePickerComponent,
    V35ControlMessageComponent,
    CommonButtonV35Component,
    NgClass
  ]
})
export class PersonalInfoComponent implements OnDestroy, OnInit {
  private googleAddressService = inject(GoogleAddressService);
  public userService = inject(UserProfileService);
  private alert = inject(AlertService);
  private datePipe = inject(DatePipe);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);
  private store = inject(Store<IAppState>);
  private dialog = inject(MatDialog);

  currenCountryPhoneLength = {} as { min: number; max: number };
  currentCountryCode: string;

  customPattern = {
    1: { pattern: /\d/, symbol: '*' },
    0: { pattern: /\d/ },
    symbol: '',
    2: { pattern: /\d/, symbol: '*' }
  };

  subscriptions: Subscription[] = [];
  btnDesable = false;
  mask = '111110000';
  isEmailVerified = true;
  isPhoneVerified = true;
  nowDate: string;
  maxDobDate: string;
  minDobDate: string;
  userName: string;
  email: string;
  corppedImg: FormData;
  profilePic: string;
  loading = signal(false);
  isNameExpanded = false;
  faCamera = faCamera;
  faSpinner = faSpinner;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  ssnRevealed = false;

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

  ngOnInit() {
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
  }

  /**
   * @description sets users's data initially by emitting the username as an event, to be received by the parent.
   */
  setUserData() {
    this.subscriptions.push(
      this.userDetails$.subscribe((res) => {
        if (res) {
          if (this.localStorageService.getItem('username') === '') {
            this.localStorageService.setItem('username', res.name);
          }
          this.userName = res.name;
          this.profilePic = res.profilePicLink;
          this.email = res.email;
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
            country: res.country,
            date: res.dateOfBirth,
            zip: res.zip,
            ssn: res.ssn
          });
        }
      })
    );
  }

  /**
   * @description Used to get user phone and email verifiaction status.
   * Based on this status add readonly proprty into input field.
   */
  getUserVerification() {
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

  /**
   * @description Method to create user data payload
   * @returns an object containing user's details
   */
  createUserProfileBody() {
    const data = this.userForm.value;
    const newDate = this.datePipe.transform(data.date, 'MM/dd/yyyy');

    return {
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
  }

  /**
   * @description Method to update personal info
   */
  onSubmit(): void {
    this.userForm.markAllAsTouched();
    if (this.userForm.invalid || this.btnDesable) {
      return;
    }
    this.localStorageService.setItem(
      'selected_dial_code',
      this.currentCountryCode
    );
    this.btnDesable = true;
    const processedData = this.createUserProfileBody();
    this.localStorageService.setItem('username', processedData.name);
    this.subscriptions.push(
      this.userService
        .updatePersonalInfo(processedData)
        .pipe(catchError(() => of(false)))
        .subscribe((res) => {
          this.btnDesable = false;
          if (res.success === true) {
            this.headerService.setHeaderValueChanged(true);
            this.getUserData();
            const data = {
              title: 'Success',
              content: 'Personal Info Updated',
              doneMsg: 'OK',
              cancelMsg: 'cancel',
              close: true,
              timeout: 2000
            };
            this.alert.successAlert(data);
            this.store.dispatch(UserManagementActions.clearUserVerification());
            this.store.dispatch(UserManagementActions.loadUserVerification());
          }
        })
    );
  }

  /**
   * @description Method to load the google address API
   * @param address - Address for autocomplete
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({ addressElement: address });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.userForm.patchValue({
          address1: res.address,
          city: res.city,
          state: res.state,
          zip: res.zip,
          country: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  countryChange(event: { length: { min: number; max: number }; code: string }) {
    this.currenCountryPhoneLength = event.length;
    this.userForm.controls.phone.setValidators([
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.userForm.controls.phone.updateValueAndValidity();
  }

  countryCodeChange(event: { code: string; updateLocalStorage: boolean }) {
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

  openDialog(event: Event & { target: HTMLInputElement }) {
    if (!event.target.files || !event.target.files.length) {
      return;
    }

    const file = event.target.files[0];

    // Validate file extension (whitelist)
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop() || '';
    if (!this.ALLOWED_EXTENSIONS.includes(fileExtension)) {
      this.alert.warningAlert({
        content: 'Only JPG, PNG, GIF, and WEBP images are allowed.'
      });
      return;
    }

    // Validate MIME type
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.alert.warningAlert({
        content: 'Invalid image format. Please upload a valid image file.'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (Utils.maxSizeValidator(file.size)) {
      this.alert.warningAlert({ content: 'Maximum size is 5MB.' });
      return;
    }

    // Block SVG files
    if (!Utils.fileTypeValidator(file, ['svg'])) {
      this.alert.warningAlert({ content: 'SVG files are not supported!!' });
      return;
    }

    const dialogRef = this.dialog.open(UploadImageModalComponent, {
      maxWidth: '500px',
      width: '93%',
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

        this.corppedImg = formData;

        this.addProfilepic(this.corppedImg);
      }
    });
  }

  /**
   * @description To upload profile photo
   * @param corppedImg - cropped image for uploading
   */
  addProfilepic(corppedImg: FormData) {
    this.subscriptions.push(
      this.userService.uploadPhoto(corppedImg).subscribe((res) => {
        this.btnDesable = false;
        if (res.success) {
          this.getUserData(true);
          this.headerService.setHeaderValueChanged(true);
        } else {
          this.loading.set(false);
        }
      })
    );
  }

  /**
   * @description Method to be invoked after uploading image. Sets profilePic property and shows success alert.
   */
  getUserData(isUpdateProfile?: boolean) {
    this.subscriptions.push(
      this.userService.getPersonalInfo().subscribe((res) => {
        if (res.success) {
          this.userService.userDetailsSignal.set(res.data);
          if (isUpdateProfile) {
            const data = {
              title: 'Success',
              content: 'Profile Picture Updated',
              close: true,
              timeout: 2000
            };
            this.alert.successAlert(data);
            this.loading.set(false);
          }
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
