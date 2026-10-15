import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgIf, NgClass, AsyncPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faWallet } from '@fortawesome/pro-solid-svg-icons';
import { IZilPyamentLists } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { V3BulkPaymentService } from '../../services/v3-bulk-payment.service';
import { isWalletCheckEmail } from '../../utils/wallet-check-email.util';

/**
 * @description Component for wallet check email in bulk payment.
 */
@Component({
  selector: 'app-wallet-check-email-bulk-v3',
  templateUrl: './wallet-check-email-bulk-v3.component.html',
  styleUrls: ['./wallet-check-email-bulk-v3.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    AsyncPipe,
    ReactiveFormsModule,
    MatTooltip,
    FaIconComponent
  ]
})
export class WalletCheckEmailBulkV3Component implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private rootFormGroup = inject(FormGroupDirective);
  private formBuilder = inject(FormBuilder);

  dynamicForm: FormGroup;
  subscription: Subscription[] = [];
  faWallet = faWallet;

  ngOnInit(): void {
    this.initForm();
    this.setFormData();
  }

  /**
   * @description Initializes the dynamicForm form group.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'walletCheckEmailFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the wallet check email form array.
   * @returns FormArray of wallet check email controls.
   */
  getFormControl(): FormArray {
    return this.dynamicForm.get('walletCheckEmailFormArray') as FormArray;
  }

  /**
   * @description Creates the form group for a single wallet check email payment.
   * @param paymentData - zil payment data.
   * @returns FormGroup for the payment row.
   */
  checkFormBody(paymentData: IZilPyamentLists): FormGroup {
    return this.formBuilder.group({
      payee: [paymentData?.payee?.name],
      email: [
        paymentData?.payee?.email || '',
        [Validators.required, ValidationService.emailValidator]
      ],
      source: [paymentData?.source],
      amount: [paymentData?.amount],
      memo: [paymentData?.description],
      uuid: [paymentData?.id],
      invoiceNo: [paymentData?.referenceNo],
      zilpaymentId: [paymentData?.zilpaymentId || '']
    });
  }

  /**
   * @description Populates the form array with the wallet check email rows.
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
    this.subscription.forEach((el) => {
      el?.unsubscribe();
    });
  }
}
