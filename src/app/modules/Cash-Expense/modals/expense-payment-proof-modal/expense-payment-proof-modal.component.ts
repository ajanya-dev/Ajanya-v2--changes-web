import { Clipboard } from '@angular/cdk/clipboard';
import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  signal
} from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCopy,
  faDownload,
  faEnvelope,
  faMobile,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subject, takeUntil } from 'rxjs';
import { ControlMessageComponent } from 'src/app/shared/components/control-message/control-message/control-message.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

interface IProofPayload {
  type: 'email' | 'link' | 'download' | 'sms';
  phone?: string;
  email?: string;
  is_signed_receipt?: boolean;
}

interface IInjectData {
  id: string;
  type: 'receipt' | 'proof';
  payee?: { email: string; phone: string };
}

@Component({
  selector: 'app-expense-payment-proof-modal',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    MatDialogClose,
    FaIconComponent,
    ControlMessageComponent,
    NewPhoneInputComponent,
    NgClass,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './expense-payment-proof-modal.component.html',
  styleUrl: './expense-payment-proof-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpensePaymentProofModalComponent implements OnDestroy {
  private dialogRef = inject(MatDialogRef<ExpensePaymentProofModalComponent>);
  public cashExpenseService = inject(CashExpenseService);
  public alertService = inject(AlertService);
  private clipBoard = inject(Clipboard);
  public injectData = inject<IInjectData>(MAT_DIALOG_DATA);

  proofType: string;
  destroy$ = new Subject();
  isCountryDropdownOpened = signal(false);
  isEmailProofLoading = signal(false);
  isSMSProofLoading = signal(false);
  isCopyProofLoading = signal(false);
  isDownload = signal(false);
  faXmark = faXmark;
  faArrowLeft = faArrowLeft;

  proofsList = [
    {
      icon: faCopy,
      name: 'Copy Link',
      action: 'copy'
    },
    {
      icon: faEnvelope,
      name: 'Email',
      action: 'email'
    },
    {
      icon: faDownload,
      name: 'Download',
      action: 'download'
    },
    {
      icon: faMobile,
      name: 'SMS',
      action: 'sms'
    }
  ];

  /**
   *email formControl
   */
  sendEmail = new FormControl('', [
    Validators.required,
    ValidationService.emailValidator
  ]);

  /**
   *phone formControl
   */
  sendPhoneNumber = new FormControl('', [
    Validators.required,
    Validators.minLength(10)
  ]);

  onClickAction(action: string) {
    if (this.isDownload() || this.isCopyProofLoading()) return;
    this.proofType = action;
    switch (action) {
      case 'copy':
        this.sendProof('link');
        break;
      case 'download':
        this.sendProof('download');
        break;
      default:
        break;
    }
  }

  back() {
    this.isCountryDropdownOpened.set(false);
    this.proofType = '';
  }

  countryChange(event: { isOpen: boolean }) {
    if (event.isOpen === true) {
      this.isCountryDropdownOpened.set(true);
    } else {
      this.isCountryDropdownOpened.set(false);
    }
  }

  sendProof(
    type: 'email' | 'link' | 'download' | 'sms',
    data?: { phone?: string; email?: string }
  ) {
    // Determine loading state based on type
    const loadingState = this.getLoadingState(type);
    loadingState.set(true);

    const payload: IProofPayload = { type, ...data };

    if (this.injectData.type === 'receipt') {
      payload.is_signed_receipt = true;
    }

    this.cashExpenseService
      .sendPaymentProof(this.injectData.id, payload)
      .pipe(
        finalize(() => loadingState.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.handleSuccess(type, res.data);
        }
      });
  }

  // Helper to get the correct loading state based on the type
  private getLoadingState(type: string) {
    switch (type) {
      case 'email':
        return this.isEmailProofLoading;
      case 'link':
        return this.isCopyProofLoading;
      case 'download':
        return this.isDownload;
      case 'sms':
        return this.isSMSProofLoading;
      default:
        throw new Error('Invalid type for loading state');
    }
  }

  // Helper to handle success messages and actions
  private handleSuccess(type: string, data: string) {
    switch (type) {
      case 'email':
        this.openSuccessAlert('Email sent successfully');
        break;
      case 'link':
        this.clipBoard.copy(data);
        this.openSuccessAlert('Link copied successfully');
        break;
      case 'download':
        window.open(data, '_blank');
        this.openSuccessAlert('Downloaded successfully');
        break;
      case 'sms':
        this.openSuccessAlert('SMS sent successfully');
        break;
      default:
        throw new Error('Invalid type for success handler');
    }
  }

  // Usage Examples
  copyProof() {
    this.sendProof('link');
  }

  emailProof() {
    this.sendEmail.markAllAsTouched();
    if (this.sendEmail.invalid) {
      return;
    }
    this.sendProof('email', { email: this.sendEmail.value as string });
  }

  downloadProof() {
    this.sendProof('download');
  }

  smsProof() {
    this.sendPhoneNumber.markAllAsTouched();
    if (this.sendPhoneNumber.invalid) {
      return;
    }
    this.sendProof('sms', { phone: this.sendPhoneNumber.value as string });
  }

  openSuccessAlert(content: string) {
    const data = {
      content,
      close: true,
      timeout: 1500
    };
    this.alertService.successAlert(data);
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
