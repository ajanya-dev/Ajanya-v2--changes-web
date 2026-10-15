import { Component, inject, input, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule, Printer, ChevronDown, Landmark } from 'lucide-angular';
import { NgSelectModule } from '@ng-select/ng-select';

import { IZilPyamentLists } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';

/**
 * @description V4 component for check printing in bulk payment modal.
 */
@Component({
  selector: 'app-v4-check-print-bulk',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    MatTooltip,
    LucideAngularModule,
    NgSelectModule
  ],
  templateUrl: './v4-check-print-bulk.component.html',
  styleUrl: './v4-check-print-bulk.component.scss'
})
export class V4CheckPrintBulkComponent implements OnInit, OnDestroy {
  private rootFormGroup = inject(FormGroupDirective);
  private formBuilder = inject(FormBuilder);

  /** Payments data from parent (check-mode-select grouping). */
  payments = input<IZilPyamentLists[]>([]);

  dynamicForm!: FormGroup;
  subscription: Subscription[] = [];
  isCollapsed = false;

  readonly PrinterIcon = Printer;
  readonly ChevronDownIcon = ChevronDown;
  readonly LandmarkIcon = Landmark;

  ngOnInit(): void {
    this.initForm();
    this.setFormData();
  }

  /**
   * @description Initializes the dynamicForm form group from the parent form.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'checkPrintFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the FormArray for check print entries.
   * @returns FormArray of check print controls.
   */
  getFormControl(): FormArray {
    return this.dynamicForm.get('checkPrintFormArray') as FormArray;
  }

  /**
   * @description Creates a form group for a single check print payment.
   * @param payment - Zil payment data.
   * @returns FormGroup for the payment row.
   */
  checkFormBody(payment: IZilPyamentLists): FormGroup {
    return this.formBuilder.group({
      payee: [payment?.payee?.name],
      source: [payment?.source],
      amount: [payment?.amount],
      memo: [payment?.description],
      checkId: [payment?.transfer?.id],
      paperType: ['4'],
      invoiceNo: [payment?.transfer?.chequeInvoiceNumber]
    });
  }

  /**
   * @description Populates the FormArray with entries from the payments input.
   */
  setFormData(): void {
    const checkPrintPayments = this.payments() || [];
    const formArray = this.getFormControl();

    checkPrintPayments.forEach((rowData) => {
      formArray.push(this.checkFormBody(rowData));
    });
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub?.unsubscribe();
    });
  }
}
