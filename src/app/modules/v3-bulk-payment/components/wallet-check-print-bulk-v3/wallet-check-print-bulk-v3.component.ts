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
import { NgSelectModule } from '@ng-select/ng-select';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgClass, NgFor, AsyncPipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faWallet } from '@fortawesome/pro-solid-svg-icons';
import { V3BulkPaymentService } from '../../services/v3-bulk-payment.service';
import { isWalletCheckEmail } from '../../utils/wallet-check-email.util';

/**
 * @description Component for wallet check printing in bulk payment.
 */
@Component({
  selector: 'app-wallet-check-print-bulk-v3',
  templateUrl: './wallet-check-print-bulk-v3.component.html',
  styleUrls: ['./wallet-check-print-bulk-v3.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgFor,
    MatTooltip,
    NgSelectModule,
    AsyncPipe,
    FaIconComponent
  ]
})
export class WalletCheckPrintBulkV3Component implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private rootFormGroup = inject(FormGroupDirective);
  private formBuilder = inject(FormBuilder);

  dynamicForm: FormGroup;
  subscription: Subscription[] = [];
  form: FormGroup;
  faWallet = faWallet;

  // Paper type: '1' = Print-Check Paper, '6' = Print-White Paper
  selectedPaperType = '1';

  ngOnInit(): void {
    this.initForm();
    this.setFormData();
    this.v3BulkPaymentService.walletCheckPrintPaperType = 1;
  }

  /**
   * @description Updates the paper type in the service when dropdown changes.
   */
  onPaperTypeChange(): void {
    this.v3BulkPaymentService.walletCheckPrintPaperType = parseInt(
      this.selectedPaperType,
      10
    );
  }

  /**
   * @description Initializes the dynamicForm form group.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'walletCheckPrintFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the dynamic form controls and returns it.
   * @returns dynamicForm controls.
   */
  getFormControl(): FormArray {
    return this.dynamicForm.get('walletCheckPrintFormArray') as FormArray;
  }

  /**
   * @description Method to create check form for wallet print.
   * @param paymentData - zil payment data.
   * @returns form.
   */
  checkFormBody(paymentData: IZilPyamentLists) {
    this.form = this.formBuilder.group({
      payee: [paymentData?.payee?.name],
      source: [paymentData?.source],
      amount: [paymentData?.amount],
      memo: [paymentData?.description],
      uuid: [paymentData?.id],
      invoiceNo: [paymentData?.referenceNo],
      zilpaymentId: [paymentData?.zilpaymentId || '']
    });
    return this.form;
  }

  /**
   * @description Method to set the data to the form.
   * Filters payments where transferType === 'CHECK' && sourceType === 'WALLET'
   */
  setFormData() {
    this.subscription.push(
      this.v3BulkPaymentService.isBulkPaymentsApiReady$.subscribe({
        next: (res) => {
          if (res) {
            const walletChecksData =
              this.v3BulkPaymentService.paymentListData?.filter(
                (obj) =>
                  obj.transferType === 'CHECK' &&
                  obj.sourceType === 'WALLET' &&
                  !isWalletCheckEmail(obj)
              ) || [];

            if (walletChecksData.length !== 0) {
              const formArray = this.getFormControl();

              // Clear existing form controls
              while (formArray.length > 0) {
                formArray.removeAt(0);
              }

              // Add new form controls for each wallet check
              walletChecksData.forEach((rowData) => {
                formArray.push(this.checkFormBody(rowData));
              });
            }
          }
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
