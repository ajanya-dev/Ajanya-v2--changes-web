import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  IRequiredDocsValue,
  IRequiredDocument,
  IZilPyamentLists
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import {
  ValidationService,
  requiredDocumentsValidator
} from 'src/app/shared/service/validation/validation.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgClass, NgFor, AsyncPipe } from '@angular/common';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { V3BulkPaymentService } from '../../services/v3-bulk-payment.service';

/**
 * @description Component for ach in bulk payment.
 */
@Component({
  selector: 'app-ach-bulk-ocw-v3',
  templateUrl: './ach-bulk-ocw-v3.component.html',
  styleUrls: ['./ach-bulk-ocw-v3.component.scss'],
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
export class AchBulkOcwV3Component implements OnInit, OnDestroy {
  _v3BulkPaymentService = inject(V3BulkPaymentService);
  private _payeeService = inject(PayeeService);
  private formBuilder = inject(FormBuilder);
  private rootFormGroup = inject(FormGroupDirective);
  private bankModalService = inject(BankModalService);

  dynamicForm: FormGroup;
  subscription: Subscription[] = [];
  form: FormGroup;
  utils = Utils;
  isSourceCard = false;
  readonly paymentMode = '1'; // ACH
  isShowMoreColumn: boolean;

  ngOnInit(): void {
    this.initForm();
    this.setFormData();
  }

  /**
   * @description Initializes the dynamicForm form group.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'achFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the dynamic form controls and returns it.
   * @returns dynamicForm controls.
   */
  getFormControl(): FormArray {
    for (const item of (this.dynamicForm.get('achFormArray') as FormArray)
      .controls) {
      if (item?.value?.from === 'CARD') {
        this.isSourceCard = true;
        break;
      }
    }
    return this.dynamicForm.get('achFormArray') as FormArray;
  }

  /**
   * @description Method to create ach form.
   * @param paymentListDatas - zil payment data.
   * @returns form.
   */
  achFormBody(paymentListDatas: IZilPyamentLists) {
    this.form = this.formBuilder.group({
      from: [paymentListDatas?.sourceType],
      payee: [paymentListDatas?.payee],
      source: [paymentListDatas?.source],
      amount: [paymentListDatas?.amount],
      uuid: [paymentListDatas?.id],
      email: [
        paymentListDatas?.payee?.email,
        [Validators.required, ValidationService.emailValidator]
      ],
      payeeAcc: [paymentListDatas?.payeeBankAccount],
      payeeBanks: []
    });
    return this.form;
  }

  /**
   * @description Method to create ach form with invoice.
   * @param paymentListDatas - zil payment data.
   * @returns form.
   */
  achFormBodyWithInvoice(
    paymentListDatas: IZilPyamentLists,
    requiredDocumentsDetails?: IRequiredDocument
  ) {
    const reqDocs: IRequiredDocsValue = {
      addedDocs: {},
      requiredDocs: requiredDocumentsDetails
    };
    this.form = this.formBuilder.group({
      from: [paymentListDatas?.sourceType],
      payee: [paymentListDatas?.payee],
      source: [paymentListDatas?.source],
      amount: [paymentListDatas?.amount],
      email: [
        paymentListDatas?.payee?.email,
        [Validators.required, ValidationService.emailValidator]
      ],
      uuid: [paymentListDatas?.id],
      payeeAcc: [paymentListDatas?.payeeBankAccount],
      payeeBanks: [],
      referenceNo: [paymentListDatas?.referenceNo, Validators.required],
      documents: [reqDocs, requiredDocumentsValidator]
    });
    return this.form;
  }

  /**
   * @description Method to set the payee banks data.
   * @param id - payee id.
   * @param data - formGroup.
   */
  getPayeeBankAccounts(id: string, data: FormGroup): void {
    this.subscription.push(
      this._payeeService.getPayeeBankData(id).subscribe((res) => {
        data.controls.payeeBanks.setValue(res?.data);
      })
    );
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
              if (rowData?.transferTypeCode === 'ach') {
                if (rowData?.sourceType === 'CARD') {
                  const reqDocsDetails =
                    this._v3BulkPaymentService.requiredDocs.find(
                      (el) => el.uuid == rowData.id
                    );
                  this.getFormControl().push(
                    this.achFormBodyWithInvoice(rowData, reqDocsDetails)
                  );
                  this.isShowMoreColumn = true;
                } else {
                  this.getFormControl().push(this.achFormBody(rowData));
                }
              }
            });
          }

          this.getFormControl().controls?.forEach((el) => {
            this.getPayeeBankAccounts(el?.value?.payee?.id, el as FormGroup);
          });
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

  /**
   * @description Opens modal for adding payee bank account.
   * @param payeeId - id of payee.
   * @param index - index
   */
  addPayeeBankAc(payeeId: string, index: number) {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscription.push(
      this.bankModalService
        .openAddBankNormalModal({ editMode: false, id: payeeId })
        .subscribe((bankModal) => {
          if (bankModal) {
            this.subscription.push(
              bankModal.afterClosed().subscribe((response) => {
                if (response?.success) {
                  const achForm = this.dynamicForm.controls
                    ?.achFormArray as FormArray;
                  const achFormArray = achForm.controls[index] as FormGroup;
                  achFormArray.controls.payeeBanks.setValue(response);

                  this.getFormControl().controls?.forEach((el) => {
                    if (payeeId === el?.value?.payee?.id) {
                      this.getPayeeBankAccounts(
                        el?.value?.payee?.id,
                        el as FormGroup
                      );
                    }
                  });
                  achFormArray.controls.payeeAcc.setValue(response?.data?.id);
                }
              })
            );
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
