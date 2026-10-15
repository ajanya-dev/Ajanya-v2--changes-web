import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { NgxMaskDirective } from 'ngx-mask';

import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ContactService } from 'src/app/shared/service/contact/contact.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import {
  IContactBody,
  IData
} from 'src/app/shared/modal/add-contact/model/contact';

@Component({
  selector: 'app-add-contact-modal-v4',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    NgxMaskDirective,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent
  ],
  templateUrl: './add-contact-modal-v4.component.html',
  styleUrls: ['./add-contact-modal-v4.component.scss'],
  providers: []
})
export class AddContactModalV4Component implements OnInit {
  public data = inject<IData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<AddContactModalV4Component>);
  private fb = inject(FormBuilder);
  private alertService = inject(V4AlertService);
  private contactService = inject(ContactService);
  private destroyRef = inject(DestroyRef);

  contactType = [
    { name: 'Additional Contact', value: '1' },
    { name: 'Primary Contact', value: '2' },
    { name: 'Secondary Contact', value: '3' }
  ];

  contactForm!: FormGroup;
  submitting = false;

  ngOnInit(): void {
    this.initForm();
    if (this.data.editMode) {
      this.setContactBody();
    }
  }

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

  setContactBody(): void {
    const details = this.data.data;
    this.contactForm.patchValue({
      name: details.name,
      email: details.email,
      phoneNumber: details.phone_number,
      contactType: details.contact_type
    });
  }

  createContactBody(): IContactBody {
    const data = this.contactForm.value;
    return {
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      contactType: data.contactType
    };
  }

  submit(): void {
    this.contactForm.markAllAsTouched();
    if (this.contactForm.invalid) return;

    const body = this.createContactBody();
    if (this.data.editMode) {
      this.updateContact(body);
    } else {
      this.addContact(body);
    }
  }

  private addContact(body: IContactBody): void {
    this.submitting = true;
    this.contactService
      .addContact(this.data.type, this.data.id, body)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe((res) => {
        this.dialogRef.close(true);
        this.alertService.successAlert({
          title: 'Success!',
          content: res.data,
          close: true
        });
      });
  }

  private updateContact(body: IContactBody): void {
    this.submitting = true;
    this.contactService
      .updateContact(
        this.data.type,
        this.data.id,
        this.data.data.encrypted_id,
        body
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe((res) => {
        this.dialogRef.close(true);
        this.alertService.successAlert({
          title: 'Success!',
          content: res.data,
          close: true
        });
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
