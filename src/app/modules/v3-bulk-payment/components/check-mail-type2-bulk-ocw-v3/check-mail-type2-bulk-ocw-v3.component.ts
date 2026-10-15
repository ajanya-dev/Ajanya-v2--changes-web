import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
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
  IZilPyamentLists,
  IPayee
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { requiredDocumentsValidator } from 'src/app/shared/service/validation/validation.service';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgClass, NgFor, AsyncPipe } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPaperclip, faPenToSquare } from '@fortawesome/pro-solid-svg-icons';
import { IShippingTypes } from 'src/app/modules/business-tools/plexe/model/plexe';
import { IAttachmentItem } from 'src/app/models/common';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { MatBadge } from '@angular/material/badge';
import { V3BulkPaymentService } from '../../services/v3-bulk-payment.service';

/**
 * @description Component for check mail type 2 (when bank is not the source and mail is the payment method) in bulk payment.
 */
@Component({
  selector: 'app-check-mail-type2-bulk-ocw-v3',
  templateUrl: './check-mail-type2-bulk-ocw-v3.component.html',
  styleUrls: ['./check-mail-type2-bulk-ocw-v3.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    NgFor,
    MatTooltip,
    AsyncPipe,
    MatSelectModule,
    FaIconComponent,
    MatBadge
  ]
})
export class CheckMailType2BulkOcwV3Component implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  private formBuilder = inject(FormBuilder);
  private rootFormGroup = inject(FormGroupDirective);
  private paymentsService = inject(PaymentsService);
  private payeeModalService = inject(PayeeModalService);

  dynamicForm: FormGroup;
  subscription: Subscription[] = [];
  checkMailType2form: FormGroup;
  selectedItem: unknown;
  isShowMoreColumn: boolean;
  readonly paymentMode = '8'; // CheckMail
  faPaperclip = faPaperclip;
  faPenToSquare = faPenToSquare;
  shippingTypeList: IShippingTypes[] = [];
  updatedShippingTypeList = signal<IShippingTypes[]>([]);
  bulkShippingTypeControl = new FormControl<string | null>(null);
  createdExistingAttachments: IAttachmentItem[] = [];
  attachmentCount: number = 0;
  attachmentsPerRow: Map<string, IAttachmentItem[]> = new Map();
  shippingTypes: Record<string, string> = {
    FEDEX_NEXT_DAY_PM: 'FedEx Next Day PM',
    USPS_PRIORITY_MAIL: 'USPS Priority Mail',
    USPS_FIRST_CLASS_MAIL: 'USPS First-Class Mail',
    USPS_FIRST_CLASS_WITH_TRACKING: 'USPS First-Class Mail with Tracking',
    USPS_EXPRESS_MAIL: 'USPS Express Mail'
  };

  totalAttachmentFee = 0;
  isLoadingAttachmentFee = false;

  ngOnInit(): void {
    this.initForm();
    this.setFormData();
    this.subscribeToShippingTypes();
    this.initBulkShippingTypeListener();
  }

  /**
   * @description Subscribes to shipping types from the service
   */
  private subscribeToShippingTypes(): void {
    this.subscription.push(
      this.v3BulkPaymentService.shippingTypes$.subscribe((types) => {
        if (types?.length > 0) {
          this.shippingTypeList = types;
          this.updatedShippingTypeList.set(types);
          this.subscribeToAllMailTypeChanges();
          this.calculateShippingCost();
        }
      })
    );
  }

  /**
   * @description Initializes the dynamicForm form group.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'checkMailType2FormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the dynamic form controls and returns it.
   * @returns dynamicForm controls.
   */
  getFormControl(): FormArray {
    return this.dynamicForm.get('checkMailType2FormArray') as FormArray;
  }

  /**
   * @description Method to create check mail type2 form.
   * @param paymentListDatas - zil payment data.
   * @returns form.
   */
  checkMailFormBody(paymentListDatas: IZilPyamentLists) {
    const isAddressMissing = this.isPayeeAddressMissing(paymentListDatas?.payee);
    this.checkMailType2form = this.formBuilder.group({
      from: [paymentListDatas?.sourceType],
      payee: [paymentListDatas?.payee],
      source: [paymentListDatas?.source],
      amount: [paymentListDatas?.amount],
      email: [paymentListDatas?.payee?.email],
      memo: [paymentListDatas?.description],
      invoice: [paymentListDatas?.referenceNo],
      uuid: [paymentListDatas?.id],
      isAddressMissing: [isAddressMissing],
      mail_type: [paymentListDatas?.metadata?.shippingType ?? null],
      file_hidden: [[]],
      zilpaymentId : [paymentListDatas?.zilpaymentId || '']
    });

    const mailTypeControl = this.checkMailType2form.get('mail_type');

    if (this.v3BulkPaymentService.isWalletCheckMail()) {
      mailTypeControl?.setValidators([Validators.required]);
    } else {
      mailTypeControl?.clearValidators();
    }
    mailTypeControl?.updateValueAndValidity();

    return this.checkMailType2form;
  }

  /**
   * @description Method to create ach form with invoice.
   * @param paymentListDatas - zil payment data.
   * @returns form.
   */
  checkMailFormBodyWithInvoice(
    paymentListDatas: IZilPyamentLists,
    requiredDocumentsDetails?: IRequiredDocument
  ) {
    const reqDocs: IRequiredDocsValue = {
      addedDocs: {},
      requiredDocs: requiredDocumentsDetails
    };
    this.checkMailType2form = this.formBuilder.group({
      from: [paymentListDatas?.sourceType],
      payee: [paymentListDatas?.payee],
      source: [paymentListDatas?.source],
      amount: [paymentListDatas?.amount],
      email: [paymentListDatas?.payee?.email],
      memo: [paymentListDatas?.description],
      invoice: [paymentListDatas?.referenceNo],
      uuid: [paymentListDatas?.id],
      referenceNo: [paymentListDatas?.referenceNo, Validators.required],
      documents: [reqDocs, requiredDocumentsValidator]
    });
    return this.checkMailType2form;
  }

  /**
   * @description Method to set the data to the form.
   */
  setFormData() {
    this.subscription.push(
      this.v3BulkPaymentService.isBulkPaymentsApiReady$.subscribe({
        next: (res) => {
          if (res) {
            this.v3BulkPaymentService.paymentListData?.forEach((rowData) => {
              if (rowData?.transferTypeCode === 'checkMail') {
                if (rowData?.sourceType === 'CARD') {
                  const reqDocsDetails =
                    this.v3BulkPaymentService.requiredDocs.find(
                      (el) => el.uuid === rowData.id
                    );
                  const formGroup = this.checkMailFormBodyWithInvoice(rowData, reqDocsDetails);
                  this.getFormControl().push(formGroup);
                  this.isShowMoreColumn = true;
                } else {
                  const formGroup = this.checkMailFormBody(rowData);
                  this.getFormControl().push(formGroup);
                  // Subscribe to mail_type changes for wallet source
                  if (this.v3BulkPaymentService.isWalletCheckMail() && formGroup.get('mail_type')) {
                    this.subscribeToMailTypeChanges(formGroup);
                  }
                }
              }
            });
            // Calculate initial shipping cost after all forms are created
            if (this.v3BulkPaymentService.isWalletCheckMail()) {
              this.calculateShippingCost();
            }
          }
        }
      })
    );
  }

  /**
   * @description Initializes listener for bulk shipping type selection
   */
  private initBulkShippingTypeListener(): void {
    if (!this.v3BulkPaymentService.isWalletCheckMail()) {
      return;
    }

    this.subscription.push(
      this.bulkShippingTypeControl.valueChanges.subscribe((carrierCode) => {
        this.applyBulkShippingType(carrierCode);
      })
    );
  }

  /**
   * @description Checks if payee address is missing required fields.
   * @param payee - The payee object to check.
   * @returns true if any required address field is missing.
   */
  isPayeeAddressMissing(payee: IPayee | undefined): boolean {
    if (!payee) {
      return true;
    }
    return (
      !payee.addressLine1 ||
      !payee.city ||
      !payee.state ||
      !payee.zip ||
      !payee.country
    );
  }

  onPayeeEditClicked (paymentFormGroup: FormGroup) {
    const payeeId = paymentFormGroup.get('payee')?.value?.id;
    this.subscription.push(
      this.payeeModalService
        .openEditPayee(
          payeeId as string,
          undefined,
          {
            edit: true,
            id: payeeId as string,
            page: 'addAddress'
          }
        )
        .subscribe((payeeModal) => {
          if (payeeModal) {
            this.subscription.push(
              payeeModal.afterClosed().subscribe((result) => {
                if (result?.id) {
                  paymentFormGroup.get('isAddressMissing')?.setValue(true);
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
    this.v3BulkPaymentService.openVerifyCardInvoiceModalFromBulkPayment(
      paymentFormGroup,
      this.paymentMode
    );
  }

  /**
   * @description Open modal for adding attachment and gives the added data when its closed
   * @param paymentFormGroup - The payment form group for the specific row
   */
  openAddAttachment(paymentFormGroup: FormGroup) {
    const zilpaymentId = paymentFormGroup.get('zilpaymentId')?.value;
    const existingAttachments = this.attachmentsPerRow.get(zilpaymentId) || [];

    this.subscription.push(
      this.paymentsService
        .openAddAttachment(existingAttachments, zilpaymentId || '', false, 'wallet_check_mail')
        .subscribe((attachments: IAttachmentItem[]) => {
          this.attachmentsPerRow.set(zilpaymentId, attachments);
          // Store attachment file IDs in the form for API payload
          const attachmentIds = attachments.map((att: IAttachmentItem) => att.encrypted_id).filter(Boolean);
          paymentFormGroup.get('file_hidden')?.setValue(attachmentIds);
          // Update total count for display
          this.updateTotalAttachmentCount();
          // Calculate attachment fee
          this.calculateAttachmentFee();
        })
    );
  }

  /**
   * @description Updates the total attachment count across all rows
   */
  private updateTotalAttachmentCount(): void {
    let total = 0;
    this.attachmentsPerRow.forEach((attachments) => {
      total += attachments.length;
    });
    this.attachmentCount = total;
  }

  /**
   * @description Gets attachment count for a specific row
   * @param uuid - The payment UUID
   * @returns The number of attachments for the row
   */
  getAttachmentCountForRow(uuid: string): number {
    const attachments = this.attachmentsPerRow.get(uuid);
    return attachments ? attachments.length : 0;
  }

  /**
   * @description Subscribes to mail_type changes in a form group to calculate shipping cost
   * @param formGroup - The form group to subscribe to
   */
  private subscribeToMailTypeChanges(formGroup: FormGroup): void {
    const mailTypeControl = formGroup.get('mail_type');
    if (mailTypeControl) {
      this.subscription.push(
        mailTypeControl.valueChanges.subscribe(() => {
          this.calculateShippingCost();
        })
      );
    }
  }

  /**
   * @description Subscribes to mail_type changes for all existing forms in the FormArray
   */
  private subscribeToAllMailTypeChanges(): void {
    if (!this.v3BulkPaymentService.isWalletCheckMail()) return;
    
    const formArray = this.getFormControl();
    formArray.controls.forEach((control) => {
      const formGroup = control as FormGroup;
      if (formGroup.get('mail_type')) {
        this.subscribeToMailTypeChanges(formGroup);
      }
    });
  }

  /**
   * @description Calculates total shipping cost based on selected mail types
   */
  private calculateShippingCost(): void {
    if (!this.v3BulkPaymentService.isWalletCheckMail() || !this.shippingTypeList.length) {
      return;
    }

    const formArray = this.getFormControl();
    let totalShippingCost = 0;

    formArray.controls.forEach((control) => {
      const formGroup = control as FormGroup;
      const mailType = formGroup.get('mail_type')?.value;

      if (mailType) {
        const shippingType = this.shippingTypeList.find(
          (item) => item.carrier_code === mailType
        );

        if (shippingType && shippingType.cost) {
          totalShippingCost += parseFloat(shippingType.cost);
        }
      }
    });

    this.v3BulkPaymentService.walletCheckMailShippingFeeSubject.next(totalShippingCost.toFixed(2));
    this.v3BulkPaymentService.setTotalShippingFee();
  }

  /**
   * @description Applies selected bulk shipping type to all wallet rows
   * @param carrierCode - Shipping carrier code selected in bulk control
   */
  private applyBulkShippingType(carrierCode: string | null): void {
    if (!this.v3BulkPaymentService.isWalletCheckMail()) {
      return;
    }

    const formArray = this.getFormControl();
    formArray.controls.forEach((control) => {
      const formGroup = control as FormGroup;
      const mailTypeControl = formGroup.get('mail_type');

      if (mailTypeControl) {
        mailTypeControl.setValue(carrierCode, { emitEvent: false });
      }
    });

    this.calculateShippingCost();
  }

  /**
   * @description Calculates total attachment fee by calling the API with all attachment IDs
   */
  private calculateAttachmentFee(): void {
    if (!this.v3BulkPaymentService.isWalletCheckMail()) {
      return;
    }

    // Collect all attachment IDs from all rows
    const allAttachmentIds: string[] = [];
    this.attachmentsPerRow.forEach((attachments) => {
      const ids = attachments
        .map((att: IAttachmentItem) => att.encrypted_id)
        .filter(Boolean);
      allAttachmentIds.push(...ids);
    });

    // If there are no attachments, reset the fee to 0
    if (allAttachmentIds.length === 0) {
      this.totalAttachmentFee = 0;
      this.isLoadingAttachmentFee = false;
      this.v3BulkPaymentService.totalAttachmentFee = '0.00';
      this.v3BulkPaymentService.isLoadingAttachmentFee = false;
      return;
    }

    // Set loading state
    this.isLoadingAttachmentFee = true;
    this.v3BulkPaymentService.isLoadingAttachmentFee = true;

    // Call the API to get attachment fee
    this.subscription.push(
      this.paymentsService.getAttachmentFee(allAttachmentIds).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.totalAttachmentFee = response.data.total_attachment_fee;
            this.v3BulkPaymentService.totalAttachmentFee = this.totalAttachmentFee.toFixed(2);
          }
          this.isLoadingAttachmentFee = false;
          this.v3BulkPaymentService.isLoadingAttachmentFee = false;
        },
        error: () => {
          this.totalAttachmentFee = 0;
          this.v3BulkPaymentService.totalAttachmentFee = '0.00';
          this.isLoadingAttachmentFee = false;
          this.v3BulkPaymentService.isLoadingAttachmentFee = false;
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
