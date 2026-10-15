import { Component, inject, input, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CurrencyPipe, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule, Wallet, Mail, ChevronDown } from 'lucide-angular';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

import { IZilPyamentLists } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { isWalletCheckEmail } from 'src/app/modules/v3-bulk-payment/utils/wallet-check-email.util';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';

/**
 * @description V4 component for wallet check email in bulk payment modal.
 */
@Component({
  selector: 'app-v4-wallet-check-email-bulk',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    NgClass,
    MatTooltip,
    LucideAngularModule,
    CommonInputFieldV4Component
  ],
  templateUrl: './v4-wallet-check-email-bulk.component.html',
  styleUrl: './v4-wallet-check-email-bulk.component.scss'
})
export class V4WalletCheckEmailBulkComponent implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private rootFormGroup = inject(FormGroupDirective);
  private formBuilder = inject(FormBuilder);

  /** Payments data from parent (wallet check email payments). */
  payments = input<IZilPyamentLists[]>([]);

  dynamicForm!: FormGroup;
  subscription: Subscription[] = [];
  isCollapsed = false;

  readonly WalletIcon = Wallet;
  readonly MailIcon = Mail;
  readonly ChevronDownIcon = ChevronDown;

  ngOnInit(): void {
    this.initForm();
    this.setFormData();
  }

  /**
   * @description Initializes the dynamicForm form group from the parent form.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'walletCheckEmailFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the FormArray for wallet check email entries.
   * @returns FormArray of wallet check email controls.
   */
  getFormControl(): FormArray {
    return this.dynamicForm.get('walletCheckEmailFormArray') as FormArray;
  }

  /**
   * @description Creates a form group for a single wallet check email payment.
   * @param payment - Zil payment data.
   * @returns FormGroup for the payment row.
   */
  checkFormBody(payment: IZilPyamentLists): FormGroup {
    return this.formBuilder.group({
      payee: [payment?.payee?.name],
      email: [
        payment?.payee?.email || '',
        [Validators.required, ValidationService.emailValidator]
      ],
      source: [payment?.source],
      amount: [payment?.amount],
      memo: [payment?.description],
      uuid: [payment?.id],
      invoiceNo: [payment?.referenceNo],
      zilpaymentId: [payment?.zilpaymentId || '']
    });
  }

  /**
   * @description Populates the FormArray with the wallet check email rows.
   */
  setFormData(): void {
    this.subscription.push(
      this.v3BulkPaymentService.isBulkPaymentsApiReady$.subscribe({
        next: (res) => {
          if (!res) return;
          const walletEmailData =
            this.v3BulkPaymentService.paymentListData?.filter(isWalletCheckEmail) || [];
          if (walletEmailData.length === 0) return;

          const formArray = this.getFormControl();
          formArray.clear();
          walletEmailData.forEach((rowData) => {
            formArray.push(this.checkFormBody(rowData));
          });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub?.unsubscribe();
    });
  }
}
