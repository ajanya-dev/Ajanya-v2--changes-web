import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';

interface PaymentSettingsModalData {
  mode: 'C' | 'E';
  id: string;
  isExcistData?: boolean;
  typeId?: number;
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
  3: [{ name: 'BitPay API Token', field: 'bitpay_api_token' }],
  4: [
    { name: 'Stripe Publishable Key', field: 'stripe_publishable_key' },
    { name: 'Stripe Secret Key', field: 'stripe_secret_key' }
  ]
};

const PAYMENT_TYPE_OPTIONS = [
  { id: 1, name: 'Stripe' },
  { id: 2, name: 'PayPal' },
  { id: 4, name: 'Stripe Checkout' }
];

@Component({
  selector: 'app-v4-payment-settings-modal',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    V4CommonDropDownSelectorComponent
  ],
  templateUrl: './v4-payment-settings-modal.component.html'
})
export class V4PaymentSettingsModalComponent implements OnInit {
  private paymentLinkService = inject(PaymentLinkService);
  private v4AlertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<V4PaymentSettingsModalComponent>);
  private destroyRef = inject(DestroyRef);
  public data = inject<PaymentSettingsModalData>(MAT_DIALOG_DATA);

  isSubmit = signal(false);
  isLoading = signal(false);
  paymentType: 'live' | 'sandbox' = 'live';
  selectedTypeId = 1;
  credentialFields: CredentialFieldDef[] = [];
  paymentTypeOptions = PAYMENT_TYPE_OPTIONS;
  paymentTypeNames = PAYMENT_TYPE_OPTIONS.map(o => o.name);

  form = new FormGroup({
    nickName: new FormControl<string | null>(null, Validators.required),
    credentials: new FormArray<FormControl<string | null>>([])
  });

  get isEditMode(): boolean {
    return this.data.mode === 'E';
  }

  get title(): string {
    return this.isEditMode ? 'Edit Payment Setting' : 'New Payment Setting';
  }

  get showPaymentTypeDropdown(): boolean {
    return !this.isEditMode && !this.data.typeId;
  }

  ngOnInit(): void {
    if (this.data.typeId) {
      this.selectedTypeId = this.data.typeId;
    }

    this.buildCredentialFields();

    if (this.isEditMode) {
      this.loadExistingData();
    }
  }

  get selectedPaymentTypeName(): string {
    return this.paymentTypeOptions.find(o => o.id === this.selectedTypeId)?.name ?? 'Stripe';
  }

  onPaymentTypeDropdownChange(name: string): void {
    const option = this.paymentTypeOptions.find(o => o.name === name);
    if (option) {
      this.selectedTypeId = option.id;
      this.rebuildCredentialControls();
    }
  }

  private buildCredentialFields(): void {
    this.credentialFields = CREDENTIAL_FIELDS[this.selectedTypeId] ?? [];
    this.form.controls.credentials.clear();
    this.credentialFields.forEach(() => {
      this.form.controls.credentials.push(
        new FormControl<string | null>(null, Validators.required)
      );
    });
  }

  private rebuildCredentialControls(): void {
    this.credentialFields = CREDENTIAL_FIELDS[this.selectedTypeId] ?? [];
    this.form.controls.credentials.clear();
    this.credentialFields.forEach(() => {
      this.form.controls.credentials.push(
        new FormControl<string | null>(null, Validators.required)
      );
    });
  }

  private loadExistingData(): void {
    this.isLoading.set(true);
    this.paymentLinkService
      .getLinkData(this.data.id)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: any) => {
        if (res.success) {
          this.paymentType = res.data.credential_types;
          this.selectedTypeId = res.data.payment_type;
          this.form.controls.nickName.setValue(res.data.nick_name);

          this.rebuildCredentialControls();
          this.credentialFields.forEach((field, i) => {
            this.form.controls.credentials
              .at(i)
              .setValue(res.data.credentials[field.field]);
          });
        }
      });
  }

  getCredentialControl(index: number): FormControl<string | null> {
    return this.form.controls.credentials.at(
      index
    ) as FormControl<string | null>;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const credentials: Record<string, string> = {};
    this.credentialFields.forEach((field, i) => {
      credentials[field.field] =
        this.form.controls.credentials.at(i).value ?? '';
    });

    const payload: any = {
      type: this.paymentType,
      paymentType: this.selectedTypeId,
      nickName: this.form.controls.nickName.value ?? '',
      credentials
    };

    this.isSubmit.set(true);

    const request$ = this.isEditMode
      ? this.paymentLinkService.updateCurrentLink(payload, this.data.id)
      : this.paymentLinkService.addNewLink(payload);

    request$
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: any) => {
        if (res.success) {
          this.dialogRef.close({ success: true });
        } else {
          this.v4AlertService.failedAlert({
            content: res.message || 'Operation failed.'
          });
        }
      });
  }
}
