import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { IContactRowData } from '../../model/sms-panel';
import { NgIf } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-add-contact-modal',
  templateUrl: './add-contact-modal.component.html',
  styleUrls: ['./add-contact-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgxMaskDirective,
    NgIf
  ]
})
export class AddContactModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  contactForm: UntypedFormGroup;
  mode: string;
  phone: boolean;
  selectedCountryFlag: string;
  code: string;
  @ViewChild('AddressSearch')
  public businessAddressSearchRef: ElementRef;
  constructor(
    private dialogRef: MatDialogRef<AddContactModalComponent>,
    private _googleAddressService: GoogleAddressService,
    @Inject(MAT_DIALOG_DATA)
    private dialogueData: {
      mode: string;
      details: IContactRowData;
      groupId?: string;
    },
    private businessToolsService: BusinessToolsService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.mode = this.dialogueData?.mode;
    this.contactForm = new UntypedFormGroup({
      id: new UntypedFormControl(''),
      name: new UntypedFormControl('', Validators.required),
      email: new UntypedFormControl('', [ValidationService.emailValidator]),
      phone: new UntypedFormControl('', [
        Validators.required,
        ValidationService.phoneNumberValidator
      ]),
      company: new UntypedFormControl(''),
      nickname: new UntypedFormControl('-'),
      address1: new UntypedFormControl(''),
      address2: new UntypedFormControl(''),
      city: new UntypedFormControl(''),
      state: new UntypedFormControl(''),
      zip: new UntypedFormControl(''),
      other: new UntypedFormControl('')
    });

    if (this.mode == 'edit') {
      //if not 'edit' then create
      this.contactForm.setValue({
        id: this.dialogueData?.details.id,
        name: this.dialogueData?.details.name,
        email: this.dialogueData?.details.email,
        phone: this.dialogueData?.details.phone,
        company: this.dialogueData?.details.company,
        nickname: this.dialogueData?.details.nickname,
        address1: this.dialogueData?.details.address1,
        address2: this.dialogueData?.details.address2,
        city: this.dialogueData?.details.city,
        state: this.dialogueData?.details.state,
        zip: this.dialogueData?.details.zip,
        other: this.dialogueData?.details.other
      });
    }
    this._googleAddressService.resetGoogleAutocompleteAPI();
  }

  /**
   * @description Save the datas.
   */
  save() {
    if (this.contactForm.valid) {
      this.createContact();
    } else {
      this.contactForm.markAllAsTouched();
    }
  }

  /**
   * @description Updates the data.
   */
  update() {
    if (this.contactForm.valid) {
      this.editContact();
    } else {
      this.contactForm.markAllAsTouched();
    }
  }

  /**
   * @description Load address details.
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this._googleAddressService.googleAutocomplete({ addressElement: address });

    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
        this.contactForm.patchValue({
          address1: res.address,
          city: res.city,
          state: res.state,
          zip: res.zip
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description Creates contact body.
   */
  createContact() {
    const sendingData = {
      name: this.contactForm.value.name,
      email: this.contactForm.value.email,
      phone: this.contactForm.value.phone,
      company: this.contactForm.value.company,
      nickname: this.contactForm.value.nickname,
      other: this.contactForm.value.other,
      address1: this.contactForm.value.address1,
      address2: this.contactForm.value.address2,
      city: this.contactForm.value.city,
      state: this.contactForm.value.state,
      zip: this.contactForm.value.zip,
      groupId: this.dialogueData?.groupId
    };
    this.subscriptions.push(
      this.businessToolsService.addContact(sendingData).subscribe((res) => {
        if (res.success) {
          const data = {
            close: true,
            timeout: 2000,
            title: 'Success!',
            content: 'Contact Added Successfully'
          };
          this.alertService.successAlert(data);
          this.dialogRef.close(true);
        }
      })
    );
  }

  /**
   * @description Edits contacts data.
   */
  editContact() {
    const sendingData = {
      name: this.contactForm.value.name,
      email: this.contactForm.value.email,
      phone: this.contactForm.value.phone,
      company: this.contactForm.value.company,
      nickname: this.contactForm.value.nickname,
      other: this.contactForm.value.other,
      address1: this.contactForm.value.address1,
      address2: this.contactForm.value.address2,
      city: this.contactForm.value.city,
      state: this.contactForm.value.state,
      zip: this.contactForm.value.zip
    };
    this.subscriptions.push(
      this.businessToolsService
        .updateContact(this.contactForm.value.id, sendingData)
        .subscribe((res) => {
          if (res.success) {
            const data = {
              close: true,
              timeout: 2000,
              title: 'Success!',
              content: 'Contact Updated Successfully'
            };
            this.alertService.successAlert(data);
            this.dialogRef.close(true);
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
