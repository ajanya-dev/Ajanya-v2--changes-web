import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

interface AddPaymentCredentialData {
  typeId: number;
}

interface CredentialFieldDef {
  name: string;
  field: string;
}

const CREDENTIAL_FIELDS: Record<number, CredentialFieldDef[]> = {
  1: [
    { name: 'Stripe Publishable Key', field: 'stripe_publishable_key' },
    { name: 'Stripe Secret Key', field: 'stripe_secret_key' }
  ],
  2: [
    { name: 'PayPal Client Id', field: 'pay_pal_client_id' },
    { name: 'PayPal Secret Key', field: 'pay_pal_secret_key' }
  ],
  3: [
    { name: 'BitPay API Token', field: 'bitpay_api_token' }
  ],
  4: [
    { name: 'Stripe Publishable Key', field: 'stripe_publishable_key' },
    { name: 'Stripe Secret Key', field: 'stripe_secret_key' }
  ]
};

const MODAL_TITLES: Record<number, string> = {
  1: 'Add Stripe Credential',
  2: 'Add PayPal Credential',
  3: 'Add BitPay Credential',
  4: 'Add Stripe Checkout Credential'
};

@Component({
  selector: 'app-add-payment-credential-modal',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent
  ],
  templateUrl: './add-payment-credential-modal.component.html'
})
export class AddPaymentCredentialModalComponent implements OnInit {
  private paymentLinkService = inject(PaymentLinkService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<AddPaymentCredentialModalComponent>);
  private destroyRef = inject(DestroyRef);
  public data = inject<AddPaymentCredentialData>(MAT_DIALOG_DATA);

  isSubmit = signal(false);
  paymentType: 'live' | 'sandbox' = 'live';
  title = '';
  credentialFields: CredentialFieldDef[] = [];

  form = new FormGroup({
    nickName: new FormControl<string | null>(null, Validators.required),
    credentials: new FormArray<FormControl<string | null>>([])
  });

  ngOnInit(): void {
    this.title = MODAL_TITLES[this.data.typeId] ?? 'Add Payment Credential';
    this.credentialFields = CREDENTIAL_FIELDS[this.data.typeId] ?? [];

    this.credentialFields.forEach(() => {
      this.form.controls.credentials.push(
        new FormControl<string | null>(null, Validators.required)
      );
    });
  }

  getCredentialControl(index: number): FormControl<string | null> {
    return this.form.controls.credentials.at(index) as FormControl<string | null>;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const credentials: Record<string, string> = {};
    this.credentialFields.forEach((field, i) => {
      credentials[field.field] = this.form.controls.credentials.at(i).value ?? '';
    });

    const payload = {
      type: this.paymentType,
      paymentType: this.data.typeId,
      nickName: this.form.controls.nickName.value ?? '',
      credentials
    };

    this.isSubmit.set(true);
    this.paymentLinkService
      .addNewLink(payload)
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: any) => {
        if (res.success) {
          this.dialogRef.close({ success: true, paymentType: this.data.typeId });
        } else {
          this.alertService.failedAlert({ content: res.message || 'Failed to add credential.' });
        }
      });
  }
}
