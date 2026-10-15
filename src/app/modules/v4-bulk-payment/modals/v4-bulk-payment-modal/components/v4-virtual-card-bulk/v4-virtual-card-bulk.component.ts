import { Component, inject, input, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CurrencyPipe, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatTooltip } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  CreditCard,
  ChevronDown,
  Landmark,
  Wallet,
  CircleAlert
} from 'lucide-angular';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

import {
  IZilPyamentLists,
  IRequiredDocsValue,
  IRequiredDocument
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import {
  ValidationService,
  requiredDocumentsValidator
} from 'src/app/shared/service/validation/validation.service';

/**
 * @description V4 component for Virtual Card payments in bulk payment modal.
 */
@Component({
  selector: 'app-v4-virtual-card-bulk',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    NgClass,
    MatTooltip,
    LucideAngularModule,
    CommonInputFieldV4Component
  ],
  templateUrl: './v4-virtual-card-bulk.component.html',
  styleUrl: './v4-virtual-card-bulk.component.scss'
})
export class V4VirtualCardBulkComponent implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private formBuilder = inject(FormBuilder);
  private rootFormGroup = inject(FormGroupDirective);

  /** Payments data from parent. */
  payments = input<IZilPyamentLists[]>([]);

  dynamicForm!: FormGroup;
  subscription: Subscription[] = [];
  isCollapsed = false;
  isSourceCard = false;
  isShowMoreColumn = false;
  readonly paymentMode = '7'; // Virtual Card

  readonly SectionIcon = CreditCard;
  readonly ChevronDownIcon = ChevronDown;
  readonly LandmarkIcon = Landmark;
  readonly WalletIcon = Wallet;
  readonly CreditCardIcon = CreditCard;
  readonly CircleAlertIcon = CircleAlert;

  ngOnInit(): void {
    this.initForm();
    this.setFormData();
  }

  /**
   * @description Initializes the dynamicForm form group from the parent form.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'virtualCardFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the FormArray for Virtual Card entries.
   * @returns FormArray of Virtual Card controls.
   */
  getFormControl(): FormArray {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of (
      this.dynamicForm.get('virtualCardFormArray') as FormArray
    ).controls) {
      if (item?.value?.from === 'CARD') {
        this.isSourceCard = true;
        break;
      }
    }
    return this.dynamicForm.get('virtualCardFormArray') as FormArray;
  }

  /**
   * @description Creates a form group for a standard Virtual Card payment.
   * @param payment - Zil payment data.
   * @returns FormGroup for the payment row.
   */
  virtualCardFormBody(payment: IZilPyamentLists): FormGroup {
    return this.formBuilder.group({
      from: [payment.sourceType],
      payee: [payment.payee],
      source: [payment.source],
      amount: [payment.amount],
      email: [
        payment.payee?.email,
        [Validators.required, ValidationService.emailValidator]
      ],
      uuid: [payment.id]
    });
  }

  /**
   * @description Creates a form group for a Virtual Card payment from CARD source (with invoice).
   * @param payment - Zil payment data.
   * @param reqDocs - Required documents for card verification.
   * @returns FormGroup for the payment row.
   */
  virtualCardFormBodyWithInvoice(
    payment: IZilPyamentLists,
    reqDocs?: IRequiredDocument
  ): FormGroup {
    const docs: IRequiredDocsValue = {
      addedDocs: {},
      requiredDocs: reqDocs
    };
    return this.formBuilder.group({
      from: [payment.sourceType],
      payee: [payment.payee],
      source: [payment.source],
      amount: [payment.amount],
      email: [
        payment.payee?.email,
        [Validators.required, ValidationService.emailValidator]
      ],
      uuid: [payment.id],
      referenceNo: [payment.referenceNo, Validators.required],
      documents: [docs, requiredDocumentsValidator]
    });
  }

  /**
   * @description Populates the FormArray with entries from the payments input.
   */
  setFormData(): void {
    const paymentsList = this.payments();
    paymentsList?.forEach((rowData) => {
      if (rowData?.sourceType === 'CARD') {
        this.isShowMoreColumn = true;
        const reqDocsDetails = this.v3BulkPaymentService.requiredDocs.find(
          (el) => el.uuid === rowData.id
        );
        this.getFormControl().push(
          this.virtualCardFormBodyWithInvoice(rowData, reqDocsDetails)
        );
      } else {
        this.getFormControl().push(this.virtualCardFormBody(rowData));
      }
    });
  }

  /**
   * Opens the verification card invoice modal for a payment.
   * @param paymentFormGroup - The payment form group.
   */
  openVerifyCardInvoiceModal(paymentFormGroup: FormGroup): void {
    this.v3BulkPaymentService.openVerifyCardInvoiceModalFromBulkPayment(
      paymentFormGroup,
      this.paymentMode,
      false
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub?.unsubscribe();
    });
  }
}
