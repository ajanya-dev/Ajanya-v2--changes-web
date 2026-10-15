import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { finalize } from 'rxjs/operators';
import { ContactService } from 'src/app/shared/service/contact/contact.service';
import {
  IContactBody,
  IGetContact,
  IData
} from 'src/app/shared/modal/add-contact/model/contact';
import { NgFor, NgClass } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';

/**
 * @description Modal component for adding contact.
 */
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
    NgFor,
    MatDialogActions,
    NgClass
  ]
})
export class AddContactModalComponent implements OnInit, OnDestroy {
  contactType = [
    { name: 'Additional Contact', value: '1' },
    { name: 'Primary Contact', value: '2' },
    { name: 'Secondary Contact', value: '3' }
  ];

  subscriptions: Subscription[] = [];
  typeId: string;
  type: string;
  isRefreesh = false;
  details: IGetContact;
  contactForm!: UntypedFormGroup;
  submitting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IData, //Get Data From Modal
    private fb: UntypedFormBuilder,
    public __dialog: MatDialog,
    public dialogRef: MatDialogRef<AddContactModalComponent>,
    private _alertService: AlertService,
    private contactService: ContactService
  ) {}

  ngOnInit(): void {
    this.typeId = this.data.id;
    this.type = this.data.type;
    this.details = this.data.data;

    this.initForm();
    if (this.data.editMode) {
      this.setContactBody();
    }
  }

  /**
   * @description Initializes the contact form.
   */
  initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: [
        '',
        [
          Validators.required,
          ValidationService.emailValidator,
          Validators.email
        ]
      ],
      phoneNumber: [
        '',
        [Validators.required, ValidationService.phoneNumberValidator]
      ],
      contactType: ['', [Validators.required]]
    });
  }

  /**
   * @description Method for adding new contact.
   * @param body - contact details.
   */
  onAddContact(body: IContactBody): void {
    this.submitting = true;
    this.subscriptions.push(
      this.contactService
        .addContact(this.type, this.typeId, body)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe((res) => {
          this.isRefreesh = true;
          this.dialogRef.close(true);
          const data = {
            title: 'Success!',
            content: res.data,
            close: true
          };
          this._alertService.successAlert(data);
        })
    );
  }

  /**
   * @description Method for updating existing contact.
   * @param body - updated contact details
   */
  updateContact(body: IContactBody): void {
    this.submitting = true;
    this.subscriptions.push(
      this.contactService
        .updateContact(this.type, this.typeId, this.details.encrypted_id, body)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe((res) => {
          this.isRefreesh = true;
          this.dialogRef.close(true);
          const data = {
            title: 'Success!',
            content: res.data,
            close: true
          };
          this._alertService.successAlert(data);
        })
    );
  }

  /**
   * @description Creates the contact details object for creating and updating contacts.
   * @returns contact details object.
   */
  createContactBody(): IContactBody {
    const data = this.contactForm.value;
    const body: IContactBody = {
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      contactType: data.contactType
    };
    return body;
  }

  /**
   * @description Sets contact details to the form.
   */
  setContactBody(): void {
    const details = this.data.data;

    this.contactForm.patchValue({
      name: details.name,
      email: details.email,
      phoneNumber: details.phone_number,
      contactType: details.contact_type
    });
  }

  /**
   * @description Method to submit contact form.
   */
  submit(): void {
    this.contactForm.markAllAsTouched();
    if (this.contactForm.invalid) {
      return;
    }

    const processedData = this.createContactBody();

    if (this.data.editMode) {
      this.updateContact(processedData);
    } else {
      this.onAddContact(processedData);
    }
  }

  /**
   * @description Method to open success alert dialog.
   */
  successAlert(): void {
    const data = {
      title: 'Success!',
      content: 'Contact added.',
      close: true
    };
    this._alertService.successAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
