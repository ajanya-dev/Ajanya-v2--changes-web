import { Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CurrencyPipe, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatTooltip } from '@angular/material/tooltip';
import { MatBadge } from '@angular/material/badge';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  LucideAngularModule,
  Mail,
  ChevronDown,
  Wallet,
  CreditCard,
  Paperclip,
  PenSquare,
  CircleAlert
} from 'lucide-angular';

import {
  IZilPyamentLists,
  IRequiredDocsValue,
  IRequiredDocument,
  IPayee
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import {
  requiredDocumentsValidator
} from 'src/app/shared/service/validation/validation.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { MatDialog } from '@angular/material/dialog';
import { IShippingTypes } from 'src/app/modules/business-tools/plexe/model/plexe';
import { IAttachmentItem } from 'src/app/models/common';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4BulkPaymentService } from '../../../../services/v4-bulk-payment.service';

/**
 * @description V4 component for Check Mail (Type 2 - non-BANK source) in bulk payment modal.
 */
@Component({
  selector: 'app-v4-check-mail-type2-bulk',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    NgClass,
    MatTooltip,
    MatBadge,
    NgSelectModule,
    LucideAngularModule
  ],
  templateUrl: './v4-check-mail-type2-bulk.component.html',
  styleUrl: './v4-check-mail-type2-bulk.component.scss'
})
export class V4CheckMailType2BulkComponent implements OnInit, OnDestroy {
  v3BulkPaymentService = inject(V3BulkPaymentService);
  v4BulkPaymentService = inject(V4BulkPaymentService);
  private rootFormGroup = inject(FormGroupDirective);
  private formBuilder = inject(FormBuilder);
  private paymentsService = inject(PaymentsService);
  private payeeModalService = inject(PayeeModalService);
  private dialog = inject(MatDialog);

  /** Payments data from parent (checkMail transferTypeCode, non-BANK source). */
  payments = input<IZilPyamentLists[]>([]);

  dynamicForm!: FormGroup;
  subscription: Subscription[] = [];
  isCollapsed = false;
  isShowMoreColumn = false;
  readonly paymentMode = '8'; // CheckMail

  shippingTypeList: IShippingTypes[] = [];
  updatedShippingTypeList = signal<IShippingTypes[]>([]);
  bulkShippingTypeControl = new FormControl<string | null>(null);
  attachmentsPerRow: Map<string, IAttachmentItem[]> = new Map();
  attachmentCount = 0;
  totalAttachmentFee = 0;
  isLoadingAttachmentFee = false;

  readonly MailIcon = Mail;
  readonly ChevronDownIcon = ChevronDown;
  readonly WalletIcon = Wallet;
  readonly CreditCardIcon = CreditCard;
  readonly PaperclipIcon = Paperclip;
  readonly PenSquareIcon = PenSquare;
  readonly CircleAlertIcon = CircleAlert;

  ngOnInit(): void {
    this.initForm();
    this.setFormData();
    this.subscribeToShippingTypes();
    this.initBulkShippingTypeListener();
  }

  /**
   * @description Subscribes to shipping types from the service.
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
   * @description Initializes the dynamicForm form group from the parent form.
   */
  initForm(): void {
    this.dynamicForm = this.rootFormGroup.control.get(
      'checkMailType2FormGroup'
    ) as FormGroup;
  }

  /**
   * @description Gets the FormArray for check mail type 2 entries.
   * @returns FormArray of check mail type 2 controls.
   */
  getFormControl(): FormArray {
    return this.dynamicForm.get('checkMailType2FormArray') as FormArray;
  }

  /**
   * @description Creates a form group for a standard check mail type 2 payment.
   * @param payment - Zil payment data.
   * @returns FormGroup for the payment row.
   */
  checkMailFormBody(payment: IZilPyamentLists): FormGroup {
    const isAddressMissing = this.isPayeeAddressMissing(payment?.payee);
    const form = this.formBuilder.group({
      from: [payment?.sourceType],
      payee: [payment?.payee],
      source: [payment?.source],
      amount: [payment?.amount],
      email: [payment?.payee?.email],
      memo: [payment?.description],
      invoice: [payment?.referenceNo],
      uuid: [payment?.id],
      isAddressMissing: [isAddressMissing],
      mail_type: [payment?.metadata?.shippingType ?? null],
      file_hidden: [[]],
      zilpaymentId: [payment?.zilpaymentId || '']
    });

    const mailTypeControl = form.get('mail_type');

    if (this.v3BulkPaymentService.isWalletCheckMail()) {
      mailTypeControl?.setValidators([Validators.required]);
    } else {
      mailTypeControl?.clearValidators();
    }
    mailTypeControl?.updateValueAndValidity();

    return form;
  }

  /**
   * @description Creates a form group for a CARD-source check mail payment (with invoice and docs).
   * @param payment - Zil payment data.
   * @param requiredDocumentsDetails - Required documents for card verification.
   * @returns FormGroup for the payment row.
   */
  checkMailFormBodyWithInvoice(
    payment: IZilPyamentLists,
    requiredDocumentsDetails?: IRequiredDocument
  ): FormGroup {
    const reqDocs: IRequiredDocsValue = {
      addedDocs: {},
      requiredDocs: requiredDocumentsDetails
    };
    return this.formBuilder.group({
      from: [payment?.sourceType],
      payee: [payment?.payee],
      source: [payment?.source],
      amount: [payment?.amount],
      email: [payment?.payee?.email],
      memo: [payment?.description],
      invoice: [payment?.referenceNo],
      uuid: [payment?.id],
      referenceNo: [payment?.referenceNo, Validators.required],
      documents: [reqDocs, requiredDocumentsValidator]
    });
  }

  /**
   * @description Populates the FormArray with entries from the payments input.
   */
  setFormData(): void {
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
                  const formGroup = this.checkMailFormBodyWithInvoice(
                    rowData,
                    reqDocsDetails
                  );
                  this.getFormControl().push(formGroup);
                  this.isShowMoreColumn = true;
                } else {
                  const formGroup = this.checkMailFormBody(rowData);
                  this.getFormControl().push(formGroup);
                  if (
                    this.v3BulkPaymentService.isWalletCheckMail() &&
                    formGroup.get('mail_type')
                  ) {
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
   * @description Checks if payee address is missing required fields.
   * @param payee - The payee object to check.
   * @returns true if any required address field is missing.
   */
  isPayeeAddressMissing(payee: IPayee | undefined): boolean {
    if (!payee) return true;
    return (
      !payee.addressLine1 ||
      !payee.city ||
      !payee.state ||
      !payee.zip ||
      !payee.country
    );
  }

  /**
   * @description Opens the payee edit modal to add missing address.
   * @param paymentFormGroup - The form group for the specific row.
   */
  onPayeeEditClicked(paymentFormGroup: FormGroup): void {
    const payeeId = paymentFormGroup.get('payee')?.value?.id;
    this.subscription.push(
      this.payeeModalService
        .openEditPayeeV4(payeeId as string, undefined, {
          edit: true,
          id: payeeId as string,
          page: 'addAddress'
        })
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
   * @description Opens the verification card invoice modal for a payment.
   * @param paymentFormGroup - The payment form group.
   */
  openVerifyCardInvoiceModal(paymentFormGroup: FormGroup): void {
    this.v3BulkPaymentService.openVerifyCardInvoiceModalFromBulkPayment(
      paymentFormGroup,
      this.paymentMode,
      false
    );
  }

  onShippingDropdownOpen(selectRef: any): void {
    setTimeout(() => {
      const panel = selectRef.dropdownPanel?.contentElementRef?.nativeElement
        ?.closest('ng-dropdown-panel') as HTMLElement;
      if (panel) {
        panel.style.width = 'max-content';
        panel.classList.add('shipping-type-panel');
      }
    });
  }

  /**
   * @description Opens attachment modal for a specific row.
   * @param paymentFormGroup - The payment form group for the specific row.
   */
  openAddAttachment(paymentFormGroup: FormGroup): void {
    const zilpaymentId = paymentFormGroup.get('zilpaymentId')?.value;
    const existingAttachments =
      this.attachmentsPerRow.get(zilpaymentId) || [];

    const dialogRef = this.dialog.open(V4AddAttachmentModalComponent, {
      maxWidth: '600px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: zilpaymentId || 0,
        type: 'zil-payments',
        existingData: existingAttachments,
        acceptedFormat: '.pdf'
      }
    });

    this.subscription.push(
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          const attachments: IAttachmentItem[] = res.existingData || [];
          this.attachmentsPerRow.set(zilpaymentId, attachments);
          const attachmentIds = attachments
            .map((att: IAttachmentItem) => att.encrypted_id)
            .filter(Boolean);
          paymentFormGroup.get('file_hidden')?.setValue(attachmentIds);
          this.updateTotalAttachmentCount();
          this.calculateAttachmentFee();
        }
      })
    );
  }

  /**
   * @description Updates the total attachment count across all rows.
   */
  private updateTotalAttachmentCount(): void {
    let total = 0;
    this.attachmentsPerRow.forEach((attachments) => {
      total += attachments.length;
    });
    this.attachmentCount = total;
  }

  /**
   * @description Gets attachment count for a specific row.
   * @param uuid - The payment UUID.
   * @returns The number of attachments for the row.
   */
  getAttachmentCountForRow(uuid: string): number {
    const attachments = this.attachmentsPerRow.get(uuid);
    return attachments ? attachments.length : 0;
  }

  /**
   * @description Initializes listener for bulk shipping type selection.
   */
  private initBulkShippingTypeListener(): void {
    if (!this.v3BulkPaymentService.isWalletCheckMail()) return;

    this.subscription.push(
      this.bulkShippingTypeControl.valueChanges.subscribe((carrierCode) => {
        this.applyBulkShippingType(carrierCode);
      })
    );
  }

  /**
   * @description Subscribes to mail_type changes in a form group to calculate shipping cost.
   * @param formGroup - The form group to subscribe to.
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
   * @description Subscribes to mail_type changes for all existing forms in the FormArray.
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
   * @description Calculates total shipping cost based on selected mail types.
   */
  private calculateShippingCost(): void {
    if (
      !this.v3BulkPaymentService.isWalletCheckMail() ||
      !this.shippingTypeList.length
    ) {
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

    this.v3BulkPaymentService.walletCheckMailShippingFeeSubject.next(
      totalShippingCost.toFixed(2)
    );
    this.v3BulkPaymentService.setTotalShippingFee();
  }

  /**
   * @description Applies selected bulk shipping type to all wallet rows.
   * @param carrierCode - Shipping carrier code selected in bulk control.
   */
  private applyBulkShippingType(carrierCode: string | null): void {
    if (!this.v3BulkPaymentService.isWalletCheckMail()) return;

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
   * @description Calculates total attachment fee by calling the API with all attachment IDs.
   */
  private calculateAttachmentFee(): void {
    if (!this.v3BulkPaymentService.isWalletCheckMail()) return;

    const allAttachmentIds: string[] = [];
    this.attachmentsPerRow.forEach((attachments) => {
      const ids = attachments
        .map((att: IAttachmentItem) => att.encrypted_id)
        .filter(Boolean);
      allAttachmentIds.push(...ids);
    });

    if (allAttachmentIds.length === 0) {
      this.totalAttachmentFee = 0;
      this.isLoadingAttachmentFee = false;
      this.v3BulkPaymentService.totalAttachmentFee = '0.00';
      this.v3BulkPaymentService.isLoadingAttachmentFee = false;
      return;
    }

    this.isLoadingAttachmentFee = true;
    this.v3BulkPaymentService.isLoadingAttachmentFee = true;

    this.subscription.push(
      this.paymentsService.getAttachmentFee(allAttachmentIds).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.totalAttachmentFee = response.data.total_attachment_fee;
            this.v3BulkPaymentService.totalAttachmentFee =
              this.totalAttachmentFee.toFixed(2);
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
    this.subscription.forEach((sub) => {
      sub?.unsubscribe();
    });
  }
}
