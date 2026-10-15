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
import {
  IRequiredDocsValue,
  IRequiredDocument,
  IZilPyamentLists
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { Utils } from 'src/app/data/utils';
import {
  ValidationService,
  requiredDocumentsValidator
} from 'src/app/shared/service/validation/validation.service';
import { IPayeeViewBank } from 'src/app/modules/payee/payee-v2/model/payee';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgClass, NgFor, AsyncPipe } from '@angular/common';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { V3BulkPaymentService } from '../../services/v3-bulk-payment.service';

/**
 * @description Component for wire in bulk payment.
 */
@Component({
  selector: 'app-wire-bulk-ocw-v3',
  templateUrl: './wire-bulk-ocw-v3.component.html',
  styleUrls: ['./wire-bulk-ocw-v3.component.scss'],
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
export class WireBulkOcwV3Component implements OnInit, OnDestroy {
  _v3BulkPaymentService = inject(V3BulkPaymentService);
  private _payeeService = inject(PayeeService);
  private formBuilder = inject(FormBuilder);
  private rootFormGroup = inject(FormGroupDirective);
  private bankModalService = inject(BankModalService);

  dynamicForm: FormGroup;
  subscription: Subscription[] = [];
  wireForm: FormGroup;
  utils = Utils;
  isSourceCard = false;
  readonly paymentMode = '6';
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
      'wireFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the dynamic form controls and returns it.
   * @returns dynamicForm controls.
   */
  getFormControl(): FormArray {
    for (const item of (this.dynamicForm.get('wireFormArray') as FormArray)
      .controls) {
      if (item?.value?.from === 'CARD') {
        this.isSourceCard = true;
        break;
      }
    }
    return this.dynamicForm.get('wireFormArray') as FormArray;
  }

  /**
   * @description Method to create wire form.
   * @param paymentListDatas - zil payment data.
   * @returns form.
   */
  wireFormBody(paymentListDatas: IZilPyamentLists) {
    this.wireForm = this.formBuilder.group({
      from: [paymentListDatas?.sourceType],
      amount: [paymentListDatas?.amount],
      payee: [paymentListDatas?.payee],
      source: [paymentListDatas?.source],
      email: [
        paymentListDatas?.payee?.email,
        [Validators.required, ValidationService.emailValidator]
      ],
      uuid: [paymentListDatas?.id],
      payeeAcc: [paymentListDatas?.payeeBankAccount, Validators.required],
      payeeBanks: [],
      isWireEnabled: []
    });

    return this.wireForm;
  }

  /**
   * @description Method to create wire form with invoice.
   * @param paymentListDatas - zil payment data.
   * @returns form.
   */
  wireFormBodyWithInvoice(
    paymentListDatas: IZilPyamentLists,
    requiredDocumentsDetails?: IRequiredDocument
  ) {
    const reqDocs: IRequiredDocsValue = {
      addedDocs: {},
      requiredDocs: requiredDocumentsDetails
    };
    this.wireForm = this.formBuilder.group({
      from: [paymentListDatas?.sourceType],
      amount: [paymentListDatas?.amount],
      payee: [paymentListDatas?.payee],
      source: [paymentListDatas?.source],
      email: [
        paymentListDatas?.payee?.email,
        [Validators.required, ValidationService.emailValidator]
      ],
      uuid: [paymentListDatas?.id],
      payeeAcc: [paymentListDatas?.payeeBankAccount, Validators.required],
      payeeBanks: [],
      isWireEnabled: [],
      referenceNo: [paymentListDatas?.referenceNo, Validators.required],
      documents: [reqDocs, requiredDocumentsValidator]
    });
    return this.wireForm;
  }

  /**
   * @description Method to set the payee banks data.
   * @param id - payee id.
   * @param data - formGroup.
   */
  getPayeeBankAccounts(id: string, data: FormGroup): void {
    this.subscription.push(
      this._payeeService.viewPayee(id).subscribe((res) => {
        data.controls.payeeBanks.setValue(res?.data?.bank_accounts);
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
              if (rowData?.transferTypeCode === 'wire') {
                if (rowData?.sourceType === 'CARD') {
                  const reqDocsDetails =
                    this._v3BulkPaymentService.requiredDocs.find(
                      (el) => el.uuid == rowData.id
                    );
                  this.getFormControl().push(
                    this.wireFormBodyWithInvoice(rowData, reqDocsDetails)
                  );
                  this.isShowMoreColumn = true;
                } else {
                  this.getFormControl().push(this.wireFormBody(rowData));
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

  onChange(item: IPayeeViewBank, index: number): void {
    const formItem = this.getFormControl().controls[index] as FormGroup;
    formItem.controls.isWireEnabled.setValue(item?.is_allow_wire);
  }

  /**
   * @description Opens modal for adding or editing payee bank account.
   * @param payeeId - id of payee.
   * @param index - index
   * @param editMode - boolean stating edit mode is selected or not.
   */
  addEditPayeeBankAc(payeeId: string, index: number, editMode: boolean): void {
    let selectedAcc: IPayeeViewBank | null = null;
    this.getFormControl().controls[index].value?.payeeBanks?.forEach(
      (el: IPayeeViewBank) => {
        if (
          el?.encrypted_id ===
          this.getFormControl().controls[index].value?.payeeAcc
        ) {
          selectedAcc = { ...el, id: el?.encrypted_id };
        }
      }
    );

    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscription.push(
      this.bankModalService
        .openAddBankNormalModal({
          editMode,
          id: payeeId,
          from: 'wire',
          account: selectedAcc
        })
        .subscribe((bankModal) => {
          if (bankModal) {
            this.subscription.push(
              bankModal.afterClosed().subscribe((response) => {
                if (response?.success && editMode) {
                  const formItem = this.getFormControl().controls[
                    index
                  ] as FormGroup;
                  formItem.controls.isWireEnabled.setValue(1);
                }
                if (response?.success && !editMode) {
                  const wireForm = this.dynamicForm.controls
                    .wireFormArray as FormArray;
                  const wireFormArray = wireForm.controls[index] as FormGroup;
                  wireFormArray.controls.payeeBanks.setValue(response);

                  this.getFormControl().controls?.forEach((el) => {
                    if (payeeId === el?.value?.payee?.id) {
                      this.getPayeeBankAccounts(
                        el?.value?.payee?.id,
                        el as FormGroup
                      );
                    }
                  });
                  wireFormArray.controls.payeeAcc.setValue(response?.data?.id);
                }
              })
            );
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
