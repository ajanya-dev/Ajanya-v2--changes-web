import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import {
  ArrowLeft,
  Copy,
  Download,
  LucideAngularModule,
  Mail,
  Phone,
  X
} from 'lucide-angular';
import { finalize } from 'rxjs';

import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';

export interface ICashExpenseSendPaymentProofModalData {
  id: string;
  /** 'proof' for Send Payment Proof, 'receipt' for sending a signed receipt */
  type?: 'proof' | 'receipt';
  payee?: { email: string; phone: string };
}

interface IProofItem {
  icon: any;
  name: string;
  action: string;
}

@Component({
  selector: 'app-cash-expense-send-payment-proof-modal-v4',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    PhoneInputV4Component
  ],
  templateUrl: './cash-expense-send-payment-proof-modal-v4.component.html',
  styleUrl: './cash-expense-send-payment-proof-modal-v4.component.scss'
})
export class CashExpenseSendPaymentProofModalV4Component {
  private dialogRef = inject(MatDialogRef<CashExpenseSendPaymentProofModalV4Component>);
  data: ICashExpenseSendPaymentProofModalData = inject(MAT_DIALOG_DATA);
  private cashExpenseService = inject(CashExpenseService);
  private alertService = inject(V4AlertService);
  private clipBoard = inject(Clipboard);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly CopyIcon = Copy;
  readonly MailIcon = Mail;
  readonly DownloadIcon = Download;
  readonly PhoneIcon = Phone;

  proofType = signal('');
  isCountryDropdownOpened = signal(false);
  isEmailProofLoading = signal(false);
  isSMSProofLoading = signal(false);
  isCopyProofLoading = signal(false);
  isDownloadLoading = signal(false);

  proofsList: IProofItem[] = [
    { icon: Copy, name: 'Copy Link', action: 'copy' },
    { icon: Mail, name: 'Email', action: 'email' },
    { icon: Download, name: 'Download', action: 'download' },
    { icon: Phone, name: 'SMS', action: 'sms' }
  ];

  sendEmail = new FormControl(this.data?.payee?.email ?? '', [
    Validators.required,
    ValidationService.emailValidator
  ]);

  sendPhoneNumber = new FormControl(this.data?.payee?.phone ?? '', [
    Validators.required,
    Validators.minLength(10)
  ]);

  onClickAction(action: string): void {
    this.proofType.set(action);
    if (action === 'copy') {
      this.copyProof();
    } else if (action === 'download') {
      this.downloadProof();
    }
  }

  back(): void {
    this.proofType.set('');
    this.isCountryDropdownOpened.set(false);
  }

  countryChange(event: { isOpen: boolean }): void {
    this.isCountryDropdownOpened.set(event.isOpen);
  }

  get modalTitle(): string {
    return this.data.type === 'receipt' ? 'Send Receipt' : 'Send Payment Proof';
  }

  private get isReceipt(): boolean {
    return this.data.type === 'receipt';
  }

  copyProof(): void {
    if (this.isCopyProofLoading()) return;
    this.isCopyProofLoading.set(true);
    this.cashExpenseService
      .sendPaymentProof(this.data.id, { type: 'link', ...(this.isReceipt && { is_signed_receipt: true }) })
      .pipe(
        finalize(() => {
          this.isCopyProofLoading.set(false);
          this.proofType.set('');
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.clipBoard.copy(res.data);
          this.alertService.successAlert({ content: 'Link copied successfully', close: true, timeout: 1500 });
          this.dialogRef.close();
        }
      });
  }

  downloadProof(): void {
    if (this.isDownloadLoading()) return;
    this.isDownloadLoading.set(true);
    this.cashExpenseService
      .sendPaymentProof(this.data.id, { type: 'download', ...(this.isReceipt && { is_signed_receipt: true }) })
      .pipe(
        finalize(() => {
          this.isDownloadLoading.set(false);
          this.proofType.set('');
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          window.open(res.data, '_blank');
          this.alertService.successAlert({ content: 'Downloaded successfully', close: true, timeout: 1500 });
          this.dialogRef.close();
        }
      });
  }

  emailProof(): void {
    this.sendEmail.markAllAsTouched();
    if (this.sendEmail.invalid) return;
    this.isEmailProofLoading.set(true);
    this.cashExpenseService
      .sendPaymentProof(this.data.id, { type: 'email', email: this.sendEmail.value as string, ...(this.isReceipt && { is_signed_receipt: true }) })
      .pipe(
        finalize(() => this.isEmailProofLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: 'Email sent successfully', close: true, timeout: 1500 });
          this.dialogRef.close();
        }
      });
  }

  smsProof(): void {
    this.sendPhoneNumber.markAllAsTouched();
    if (this.sendPhoneNumber.invalid) return;
    this.isSMSProofLoading.set(true);
    this.cashExpenseService
      .sendPaymentProof(this.data.id, { type: 'sms', phone: this.sendPhoneNumber.value as string, ...(this.isReceipt && { is_signed_receipt: true }) })
      .pipe(
        finalize(() => this.isSMSProofLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: 'SMS sent successfully', close: true, timeout: 1500 });
          this.dialogRef.close();
        }
      });
  }
}
