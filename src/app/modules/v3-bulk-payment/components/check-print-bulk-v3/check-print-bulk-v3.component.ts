import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { IZilPyamentLists } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { V3BulkPaymentService } from '../../services/v3-bulk-payment.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgClass, NgFor, AsyncPipe } from '@angular/common';

/**
 * @description Component for check printing in bulk payment.
 */
@Component({
  selector: 'app-check-print-bulk-v3',
  templateUrl: './check-print-bulk-v3.component.html',
  styleUrls: ['./check-print-bulk-v3.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgFor,
    MatTooltip,
    NgSelectModule,
    AsyncPipe
  ]
})
export class CheckPrintBulkV3Component implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private rootFormGroup = inject(FormGroupDirective);
  private formBuilder = inject(FormBuilder);

  dynamicForm: FormGroup;
  subscription: Subscription[] = [];
  form: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.setFormData();
    this.v3BulkPaymentService.isBulkPayProcessing = true;
  }

  /**
   * @description Initializes the dynamicForm form group.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'checkPrintFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the dynamic form controls and returns it.
   * @returns dynamicForm controls.
   */
  getFormControl(): FormArray {
    return this.dynamicForm.get('checkPrintFormArray') as FormArray;
  }

  /**
   * @description Method to create check form.
   * @param paymentListDatas - zil payment data.
   * @returns form.
   */
  checkFormBody(checkPrintPayments: IZilPyamentLists) {
    this.form = this.formBuilder.group({
      payee: [checkPrintPayments?.payee.name],
      source: [checkPrintPayments?.source],
      amount: [checkPrintPayments?.amount],
      memo: [checkPrintPayments?.description],
      checkId: [checkPrintPayments?.transfer.id],
      paperType: ['4'],
      invoiceNo: [checkPrintPayments?.transfer.chequeInvoiceNumber]
    });
    return this.form;
  }

  /**
   * @description Method to set the data to the form.
   */
  setFormData() {
    this.subscription.push(
      this.v3BulkPaymentService.checkPrintPayments.subscribe((data) => {
        const checkPrintPayments = data || [];

        const formArray = this.getFormControl();
        const newCheckIds = checkPrintPayments.map(
          (rowData) => rowData?.transfer?.id
        );
        if (checkPrintPayments.length === 0) {
          while (formArray.length > 0) {
            formArray.removeAt(0);
          }
        } else {
          for (let i = formArray.controls.length - 1; i >= 0; i--) {
            const formCheckId = formArray.controls[i].value.checkId;

            if (!newCheckIds.includes(formCheckId)) {
              formArray.removeAt(i);
            }
          }

          checkPrintPayments.forEach((rowData) => {
            const checkId = rowData?.transfer?.id;
            const formIndex = formArray.controls.findIndex(
              (control) => control.value.checkId === checkId
            );

            if (formIndex === -1) {
              formArray.push(this.checkFormBody(rowData));
            }
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
