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
  UserCheck,
  ChevronDown,
  Landmark,
  Wallet,
  CreditCard,
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
 * @description V4 component for "Let vendor decide" payments in the bulk payment
 * modal. The rail is chosen by the payee, so the only thing collected here is the
 * email the payment invitation goes to (plus the invoice/documents a card source
 * always needs).
 */
@Component({
  selector: 'app-v4-let-vendor-decide-bulk',
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
  templateUrl: './v4-let-vendor-decide-bulk.component.html',
  styleUrl: './v4-let-vendor-decide-bulk.component.scss'
})
export class V4LetVendorDecideBulkComponent implements OnInit, OnDestroy {
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
  readonly paymentMode = '11'; // Let Vendor Decide

  readonly SectionIcon = UserCheck;
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
      'letVendorDecideFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the FormArray for Let vendor decide entries.
   * @returns FormArray of Let vendor decide controls.
   */
  getFormControl(): FormArray {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of (
      this.dynamicForm.get('letVendorDecideFormArray') as FormArray
    ).controls) {
      if (item?.value?.from === 'CARD') {
        this.isSourceCard = true;
        break;
      }
    }
    return this.dynamicForm.get('letVendorDecideFormArray') as FormArray;
  }

  /**
   * @description Creates a form group for a standard Let vendor decide payment.
   * @param payment - Zil payment data.
   * @returns FormGroup for the payment row.
   */
  letVendorDecideFormBody(payment: IZilPyamentLists): FormGroup {
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
   * @description Creates a form group for a Let vendor decide payment from CARD
   * source (with invoice).
   * @param payment - Zil payment data.
   * @param reqDocs - Required documents for card verification.
   * @returns FormGroup for the payment row.
   */
  letVendorDecideFormBodyWithInvoice(
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
          this.letVendorDecideFormBodyWithInvoice(rowData, reqDocsDetails)
        );
      } else {
        this.getFormControl().push(this.letVendorDecideFormBody(rowData));
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
