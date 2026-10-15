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
import { LucideAngularModule, Wallet, ChevronDown } from 'lucide-angular';
import { NgSelectModule } from '@ng-select/ng-select';

import { IZilPyamentLists } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { isWalletCheckEmail } from 'src/app/modules/v3-bulk-payment/utils/wallet-check-email.util';

/**
 * @description V4 component for wallet check printing in bulk payment modal.
 */
@Component({
  selector: 'app-v4-wallet-check-print-bulk',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    MatTooltip,
    LucideAngularModule,
    NgSelectModule
  ],
  templateUrl: './v4-wallet-check-print-bulk.component.html',
  styleUrl: './v4-wallet-check-print-bulk.component.scss'
})
export class V4WalletCheckPrintBulkComponent implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private rootFormGroup = inject(FormGroupDirective);
  private formBuilder = inject(FormBuilder);

  /** Payments data from parent (wallet check print payments). */
  payments = input<IZilPyamentLists[]>([]);

  dynamicForm!: FormGroup;
  subscription: Subscription[] = [];
  isCollapsed = false;

  readonly WalletIcon = Wallet;
  readonly ChevronDownIcon = ChevronDown;

  /** Global paper type: '1' = Print-Check Paper, '6' = Print-White Paper */
  selectedPaperType = '1';

  ngOnInit(): void {
    this.initForm();
    this.setFormData();
    this.v3BulkPaymentService.walletCheckPrintPaperType = 1;
  }

  /**
   * @description Updates the paper type in the service when the global dropdown changes.
   */
  onPaperTypeChange(): void {
    this.v3BulkPaymentService.walletCheckPrintPaperType = parseInt(
      this.selectedPaperType,
      10
    );
  }

  /**
   * @description Initializes the dynamicForm form group from the parent form.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'walletCheckPrintFormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the FormArray for wallet check print entries.
   * @returns FormArray of wallet check print controls.
   */
  getFormControl(): FormArray {
    return this.dynamicForm.get('walletCheckPrintFormArray') as FormArray;
  }

  /**
   * @description Creates a form group for a single wallet check print payment.
   * @param payment - Zil payment data.
   * @returns FormGroup for the payment row.
   */
  checkFormBody(payment: IZilPyamentLists): FormGroup {
    return this.formBuilder.group({
      payee: [payment?.payee?.name],
      source: [payment?.source],
      amount: [payment?.amount],
      memo: [payment?.description],
      uuid: [payment?.id],
      invoiceNo: [payment?.referenceNo],
      zilpaymentId: [payment?.zilpaymentId || '']
    });
  }

  /**
   * @description Populates the FormArray with entries from the payments input.
   * Filters payments where transferType === 'CHECK' && sourceType === 'WALLET'.
   */
  setFormData(): void {
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
    this.subscription.forEach((sub) => {
      sub?.unsubscribe();
    });
  }
}
