import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { V3BulkPaymentService } from '../../services/v3-bulk-payment.service';
import { Utils } from 'src/app/data/utils';
import {
  ValidationService,
  requiredDocumentsValidator
} from 'src/app/shared/service/validation/validation.service';
import {
  IRequiredDocsValue,
  IRequiredDocument,
  IZilPyamentLists
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgClass, NgFor, AsyncPipe } from '@angular/common';

/**
 * @description Component for virtual card in bulk payment.
 */
@Component({
  selector: 'app-virtual-card-bulk-ocw-v3',
  templateUrl: './virtual-card-bulk-ocw-v3.component.html',
  styleUrls: ['./virtual-card-bulk-ocw-v3.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgFor,
    MatTooltip,
    AsyncPipe
  ]
})
export class VirtualCardBulkOcwV3Component implements OnInit, OnDestroy {
  private rootFormGroup = inject(FormGroupDirective);
  _v3BulkPaymentService = inject(V3BulkPaymentService);
  private formBuilder = inject(FormBuilder);

  dynamicForm: FormGroup;
  subscription: Subscription[] = [];
  virtualCardForm: FormGroup;
  utils = Utils;
  readonly paymentMode = '7';
  isSourceCard = false;
  isShowMoreColumn = false;

  ngOnInit(): void {
    this.initForm();
    this.setFormData();
  }

  /**
   * @description Initializes the dynamicForm form group.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'virtualCardFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the dynamic form controls and returns it.
   * @returns dynamicForm controls.
   */
  getFormControl(): FormArray {
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
   * @description Method to create virtual card form.
   * @param paymentListDatas - zil payment data.
   * @returns form.
   */
  virtualCardFormBody(paymentListDatas: IZilPyamentLists) {
    this.virtualCardForm = this.formBuilder.group({
      from: [paymentListDatas?.sourceType],
      payee: [paymentListDatas?.payee],
      source: [paymentListDatas?.source],
      amount: [paymentListDatas?.amount],
      email: [
        paymentListDatas?.payee?.email,
        [Validators.required, ValidationService.emailValidator]
      ],
      uuid: [paymentListDatas?.id]
    });
    return this.virtualCardForm;
  }

  /**
   * @description Method to create virtual card form with invoice.
   * @param paymentListDatas - zil payment data.
   * @returns form.
   */
  virtualCardFormBodyWithInvoice(
    paymentListDatas: IZilPyamentLists,
    requiredDocumentsDetails?: IRequiredDocument
  ) {
    const reqDocs: IRequiredDocsValue = {
      addedDocs: {},
      requiredDocs: requiredDocumentsDetails
    };
    this.virtualCardForm = this.formBuilder.group({
      from: [paymentListDatas?.sourceType],
      payee: [paymentListDatas?.payee],
      source: [paymentListDatas?.source],
      amount: [paymentListDatas?.amount],
      email: [
        paymentListDatas?.payee?.email,
        [Validators.required, ValidationService.emailValidator]
      ],
      uuid: [paymentListDatas?.id],
      referenceNo: [paymentListDatas?.referenceNo, Validators.required],
      documents: [reqDocs, requiredDocumentsValidator]
    });
    return this.virtualCardForm;
  }

  /**
   * @description Method to set the data to the form.
   */
  setFormData() {
    this.subscription.push(
      this._v3BulkPaymentService.isBulkPaymentsApiReady$.subscribe({
        next: (res) => {
          if (res) {
            this._v3BulkPaymentService.paymentListData?.forEach((rowData) => {
              if (rowData?.transferTypeCode === 'virtualCard') {
                if (rowData?.sourceType === 'CARD') {
                  this.isShowMoreColumn = true;
                  const reqDocsDetails =
                    this._v3BulkPaymentService.requiredDocs.find(
                      (el) => el.uuid == rowData.id
                    );
                  this.getFormControl().push(
                    this.virtualCardFormBodyWithInvoice(rowData, reqDocsDetails)
                  );
                } else {
                  this.getFormControl().push(this.virtualCardFormBody(rowData));
                }
              }
            });
          }
        }
      })
    );
  }
  /**
   * Opens the verification card invoice modal for a payment.
   * @param paymentFormGroup - The payment form group.
   */
  openVerifyCardInvoiceModal(paymentFormGroup: FormGroup) {
    this._v3BulkPaymentService.openVerifyCardInvoiceModalFromBulkPayment(
      paymentFormGroup,
      this.paymentMode
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((el) => {
      el?.unsubscribe();
    });
  }
}
