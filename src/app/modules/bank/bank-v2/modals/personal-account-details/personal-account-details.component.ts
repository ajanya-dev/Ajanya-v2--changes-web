import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
//import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { IActionLoaderData } from 'src/app/modules/common-verification/model/common-verification';
import { IPersonalInfo } from 'src/app/layout/model/header';
import { LoaderModalComponent } from 'src/app/shared/modal/loader-modal/loader-modal.component';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { NgIf, NgFor } from '@angular/common';
// import { HeaderService } from 'src/app/shared/service/header/header.service';
// import { ValidationService } from 'src/app/shared/service/validation/validation.service';

export interface IPersonalCloudAccount {
  personalAccountExists: boolean;
}

@Component({
  selector: 'app-personal-account-details',
  templateUrl: './personal-account-details.component.html',
  styleUrls: ['./personal-account-details.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    ControlMessageComponent
  ]
})
export class PersonalAccountDetailsComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  addressForm: FormGroup;
  loading = false;
  returnAddressId: string | undefined;
  fromAddressId: string | undefined;
  personalInfo: IPersonalInfo;
  accountDetailsStep1 = true;
  personalAccountExists = false;
  file1Input: File;
  file2Input: File;
  occupation: { key: string; value: string }[];

  /**
   * commented part is for shipping address details. For future use.
   */

  constructor(
    @Inject(MAT_DIALOG_DATA) public _data: IPersonalCloudAccount,
    private dialogRef: MatDialogRef<PersonalAccountDetailsComponent>,
    private dialog: MatDialog,
    private _fb: FormBuilder
    //private _googleAddressService: GoogleAddressService,
    // private headerService: HeaderService,
  ) {}

  ngOnInit(): void {
    if (this._data.personalAccountExists) {
      //this.accountDetailsStep1 = false;
      this.personalAccountExists = true;
    }
    // this.headerService.headerData().subscribe((res) => {
    // this.personalInfo = res.data.personalInfo;
    this.initForm();
    this.getTypes();
    // });
    // this._googleAddressService.resetGoogleAutocompleteAPI();
  }

  getTypes() {}

  /**
   * commented part is for shipping address details. For future use.
   */
  initForm() {
    this.addressForm = this._fb.group({
      // name: [this.personalInfo.name, [Validators.required, Validators.pattern('[a-zA-Z0-9 ]+')]],
      occupation: ['', [Validators.required]],
      // phone: [this.personalInfo.phone, [Validators.required, ValidationService.phoneMinLength]],
      // address1: [this.personalInfo.AddressLine1, [Validators.required]],
      // address2: [this.personalInfo.AddressLine2],
      // city: [this.personalInfo.city, [Validators.required]],
      // state: [this.personalInfo.state, [Validators.required]],
      // country: [this.personalInfo.country, [Validators.required]],
      // zip: [this.personalInfo.zip, [Validators.required]],
      document1: ['', [Validators.required]],
      document2: ['', [Validators.required]]
    });
  }

  /**
   * commented part is for shipping address details. For future use.
   */
  createAddressBody() {
    const body = this.addressForm.value;
    const formData = new FormData();
    // formData.append(`cardName`, body.name);
    formData.append(`personal[occupation]`, body.occupation);
    // formData.append(`personal[localPhone]`, body.phone);
    // formData.append(`cardInfo[address][line1]`, body.address1);
    // formData.append(`cardInfo[address][line2]`, body.address2);
    // formData.append(`cardInfo[address][city]`, body.city);
    // formData.append(`cardInfo[address][state]`, body.state);
    // formData.append(`cardInfo[address][country]`, body.country === 'United States' ? 'US' : 'CA');
    // formData.append(`cardInfo[address][postalCode]`, body.zip);
    formData.append(
      `personal[document][localNationalDocument]`,
      this.file1Input
    );
    formData.append(`personal[document][supportingDocument]`, this.file2Input);
    formData.append(`accountType`, 'personalChecking');
    return formData;
  }

  /**
   * @description Adds an address by submitting the addressForm.
   * If the personal account already exists, certain form controls are removed.
   *
   */
  addAddress() {
    const body = this.createAddressBody();
    if (this.personalAccountExists) {
      this.addressForm.removeControl('occupation');
      this.addressForm.removeControl('document1');
      this.addressForm.removeControl('document2');
    }
    this.addressForm.markAllAsTouched();
    if (this.addressForm.invalid) {
      return;
    }
    this.loading = true;

    this.dialog
      .open<LoaderModalComponent, IActionLoaderData>(LoaderModalComponent, {
        maxWidth: '400px',
        width: '80%',
        minHeight: '200px',
        height: 'unset',
        disableClose: true,
        data: { type: { cloudBankPersonalAccount: body } }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res.success) {
          window.location.reload();
          this.dialogRef.close(res);
        }
      });
  }

  /**
   * @description Handles the selection of file 1 from the file input.
   * @param event - The event object containing the selected files.
   */
  onFile1Selected(event: { target: { files: File[] } }) {
    this.file1Input = <File>event.target.files[0];
  }

  /**
   * @description Handles the selection of file 1 from the file input.
   * @param event - The event object containing the selected files.
   */
  onFile2Selected(event: { target: { files: File[] } }) {
    this.file2Input = <File>event.target.files[0];
  }

  /**
   * Incase shipping address is required in the future. This code can be used to enable that part of the html.
   */
  // accountDetailsStepChange() {
  //   if (this.addressForm.controls.occupation.hasError('required')) { this.addressForm.controls.occupation.markAsTouched(); }
  //   if (this.addressForm.controls.document1.hasError('required')) { this.addressForm.controls.document1.markAsTouched(); }
  //   if (this.addressForm.controls.document2.hasError('required')) { this.addressForm.controls.document2.markAsTouched(); }
  //   if (this.addressForm.controls.occupation.hasError('required') || this.addressForm.controls.document1.hasError('required') || this.addressForm.controls.document2.hasError('required')) { return; }
  //   this.accountDetailsStep1 = this.accountDetailsStep1 ? false : true;
  // }

  /**
   * Load Google Address API
   */
  // loadGoogleAddress(address: HTMLInputElement) {
  //   this._googleAddressService.googleAutocomplete({ addressElement: address, allowedCountries: ["us"] });
  //   const googleAddressSubscription = this._googleAddressService.googleAddress$.subscribe((res) => {
  //     this.addressForm.patchValue({
  //       address1: res.address,
  //       city: res.city,
  //       state: res.state,
  //       country: res.country,
  //       zip: res.zip,
  //     });
  //     googleAddressSubscription.unsubscribe();
  //   });
  // }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
