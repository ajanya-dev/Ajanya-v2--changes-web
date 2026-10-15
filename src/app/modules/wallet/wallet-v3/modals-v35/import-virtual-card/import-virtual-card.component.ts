/* eslint-disable no-restricted-globals */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-param-reassign */
import { CurrencyPipe, NgClass, TitleCasePipe } from '@angular/common';
import { Component, inject, OnDestroy, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faAngleRight,
  faArrowDownToLine,
  faArrowLeft,
  faCheck,
  faCircleInfo,
  faPenToSquare,
  faTrash,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { finalize, Subject, takeUntil } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { IGiftCardRows } from 'src/app/models/wallet';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';

@Component({
  selector: 'app-import-virtual-card',
  standalone: true,
  imports: [
    NgClass,
    FaIconComponent,
    MatDialogClose,
    CommonButtonV35Component,
    CommonUploadButtonV35Component,
    FormsModule,
    ReactiveFormsModule,
    V35ControlMessageComponent,
    CurrencyPipe,
    MatTooltip,
    NgxMaskDirective,
    TitleCasePipe,
    NewPhoneInputComponent
  ],
  providers: [provideNgxMask()],
  templateUrl: './import-virtual-card.component.html',
  styleUrl: './import-virtual-card.component.scss'
})
export class ImportVirtualCardComponent implements OnDestroy {
  private dialogRef = inject(MatDialogRef<ImportVirtualCardComponent>);
  private walletService = inject(WalletService);
  private alertService = inject(AlertService);
  private walletId = inject<string>(MAT_DIALOG_DATA);

  cardTransactions = signal<IGiftCardRows[]>([]);
  destroy$ = new Subject<boolean>();
  utils = Utils;

  selectedFile: File | null = null;
  step = signal(1);
  fileDownloading = signal(false);
  submitting = signal(false);
  isImport = signal(false);
  isEditing = signal(false);
  isDeleting = signal(false);
  batchId = signal<string>('');
  hasErrors = signal(false);
  processClicked = signal(false);

  fts = ['.xls', '.xlsx', '.xlsm', '.xlsb'];

  faArrowLeft = faArrowLeft;
  faXmark = faXmark;
  faArrowDownToLine = faArrowDownToLine;
  faAngleRight = faAngleRight;
  faEdit = faPenToSquare;
  faDelete = faTrash;
  faCircleInfo = faCircleInfo;
  faCheck = faCheck;

  form = new FormGroup({
    file: new FormControl<null | File>(null, [Validators.required])
  });

  submit() {
    /** If on step 2 and there are transactions, process them */
    if (this.step() === 2 && this.cardTransactions().length > 0) {
      if (this.cardTransactions().some((item) => item.isEditing)) {
        this.processClicked.set(true);
        return;
      }
      this.processClicked.set(false);
      this.processCard();
      return;
    }

    /** Otherwise, proceed with import */
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const payload = new FormData();
    payload.append('file', this.form.value.file as File);
    payload.append('wallet_id', this.walletId);

    this.isImport.set(true);

    this.walletService
      .importGiftCard(payload)
      .pipe(
        finalize(() => this.isImport.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          const transactions: IGiftCardRows[] = [];
          if (res.data.batch_id) {
            this.batchId.set(res.data.batch_id as string);
          }

          Object.keys(res.data).forEach((key) => {
            if (key !== 'batch_id' && !isNaN(Number(key))) {
              const transaction = res.data[key] as IGiftCardRows;
              transaction.isEditing = false;
              transaction.editData = {
                firstname: transaction.firstname,
                lastname: transaction.lastname,
                email: transaction.email,
                phone: transaction.phone as number,
                amount: transaction.amount,
                type: transaction.type
              };
              transactions.push(transaction);
            }
          });

          this.cardTransactions.set(transactions);
          this.updateErrorStatus();
          this.step.set(2);
          this.updateDialogWidth();
        }
      });
  }

  /** Check if a transaction has an error for a specific field */
  hasError(transaction: IGiftCardRows, field: string): boolean {
    return !!transaction.errors && !!transaction.errors[field];
  }

  /** Get error message for a specific field in a transaction */
  getErrorMessage(transaction: IGiftCardRows, field: string): string {
    if (this.hasError(transaction, field)) {
      return transaction.errors![field].join(', ');
    }
    return '';
  }

  /** Get all fields that have errors */
  getErrorFields(transaction: IGiftCardRows): string[] {
    if (!transaction.errors) return [];
    return Object.keys(transaction.errors);
  }

  editTransaction(transaction: IGiftCardRows): void {
    /** If already in edit mode, save changes */
    if (transaction.isEditing) {
      this.saveTransaction(transaction);
      return;
    }

    /** Otherwise, enter edit mode only for fields with errors */
    transaction.isEditing = true;
    transaction.editingFields = {};
    if (!transaction.editData) {
      transaction.editData = {
        firstname: transaction.firstname,
        lastname: transaction.lastname,
        email: transaction.email,
        phone: transaction.phone as number,
        amount: transaction.amount,
        type: transaction.type
      };
    }

    /** If there are errors, only enable editing for fields with errors */
    if (transaction.errors) {
      const errorFields = Object.keys(transaction.errors);
      errorFields.forEach((field) => {
        if (
          [
            'firstname',
            'lastname',
            'email',
            'phone',
            'amount',
            'type'
          ].includes(field)
        ) {
          transaction.editingFields![
            field as keyof typeof transaction.editingFields
          ] = true;
        }
      });
    } else {
      /** If no errors, allow editing all fields */
      transaction.editingFields = {
        firstname: true,
        lastname: true,
        email: true,
        phone: true,
        amount: true,
        type: true
      };
    }
  }

  saveTransaction(transaction: IGiftCardRows): void {
    this.processClicked.set(false);
    if (!transaction.editData) return;

    if (!transaction.errors) {
      transaction.errors = {};
    } else {
      transaction.errors = {};
    }

    let hasValidationErrors = false;

    /** Validate firstname (required) */
    if (
      !transaction.editData.firstname ||
      transaction.editData.firstname.trim() === ''
    ) {
      transaction.errors.firstname = ['First Name is required'];
      hasValidationErrors = true;
    }

    /** Validate lastname (required) */
    if (
      !transaction.editData.lastname ||
      transaction.editData.lastname.trim() === ''
    ) {
      transaction.errors.lastname = ['Last Name is required'];
      hasValidationErrors = true;
    }

    /** Validate amount (must be greater than zero) */
    const amount = parseFloat(transaction.editData.amount?.toString() || '0');
    if (isNaN(amount) || amount <= 0) {
      transaction.errors.amount = ['Amount must be greater than zero'];
      hasValidationErrors = true;
    }

    /** Email is required now */
    if (
      !transaction.editData.email ||
      transaction.editData.email.trim() === ''
    ) {
      transaction.errors.email = ['Email is required'];
      hasValidationErrors = true;
    } else {
      /** Validate email format */
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(transaction.editData.email)) {
        transaction.errors.email = ['Please enter a valid email address'];
        hasValidationErrors = true;
      }
    }

    /** Phone is optional but validate if provided */
    if (
      transaction.editData.phone &&
      transaction.editData.phone.toString().trim() !== ''
    ) {
      const phoneRegex = /^\+[1-9]\d{10,14}$/;
      if (!phoneRegex.test(transaction.editData.phone.toString())) {
        transaction.errors.phone = ['Please enter a valid phone number'];
        hasValidationErrors = true;
      }
    }

    /** Validate type (must be either "onetime" or "rechargeable") */
    if (
      !transaction.editData.type ||
      !['onetime', 'rechargeable'].includes(transaction.editData.type)
    ) {
      transaction.errors.type = [
        'Type must be either "One Time" or "Rechargeable"'
      ];
      hasValidationErrors = true;
    }

    /** If any validation errors, don't proceed with API call */
    if (hasValidationErrors) {
      transaction.firstname =
        transaction.editData.firstname || transaction.firstname;
      transaction.lastname =
        transaction.editData.lastname || transaction.lastname;
      transaction.email = transaction.editData.email || transaction.email;
      transaction.phone = transaction.editData.phone || transaction.phone;
      transaction.amount = transaction.editData.amount || transaction.amount;
      transaction.type = transaction.editData.type || transaction.type;
      this.showAlertMessage(transaction);
      return;
    }

    const payload = {
      firstname: transaction.editData.firstname || transaction.firstname,
      lastname: transaction.editData.lastname || transaction.lastname,
      email: transaction.editData.email || transaction.email,
      phone: transaction.editData.phone?.toString() || '',
      amount: (transaction.editData.amount || transaction.amount).toString(),
      type: transaction.editData.type || transaction.type
    };

    this.isEditing.set(true);
    this.walletService
      .editGiftCardRow(transaction.id, payload)
      .pipe(
        finalize(() => this.isEditing.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: res.message });
          /** Update the transaction with new values */
          transaction.firstname = payload.firstname;
          transaction.lastname = payload.lastname;
          transaction.email = payload.email;
          transaction.phone = payload.phone ? +payload.phone : null;
          transaction.amount = +payload.amount;
          transaction.type = payload.type;

          /** Clear errors since the save was successful */
          transaction.errors = null;
          transaction.isEditing = false;

          /** Update the transactions array */
          this.updateErrorStatus();
        }
      });
  }

  showAlertMessage(transaction: IGiftCardRows) {
    this.alertService
      .warningAlert({
        content: 'Please enter all required fields.',
        cancelMsg: 'Cancel',
        isCancel: true,
        title: 'Error!'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          /** Keep Transaction in edit mode */
          transaction.isEditing = true;
          this.updateErrorStatus();
        } else {
          this.cancelEdit(transaction);
        }
      });
  }

  deleteTransaction(transaction: IGiftCardRows): void {
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this row?',
        doneMsg: 'Yes'
      })
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          this.isDeleting.set(true);

          this.walletService
            .deleteGiftCardRow(transaction.id)
            .pipe(
              finalize(() => this.isDeleting.set(false)),
              takeUntil(this.destroy$)
            )
            .subscribe((res) => {
              if (res.success) {
                this.alertService.successAlert({ content: res.message });
                /** Remove from transactions array */
                const transactions = this.cardTransactions();
                const index = transactions.findIndex(
                  (t) => t.id === transaction.id
                );
                if (index !== -1) {
                  transactions.splice(index, 1);
                  this.cardTransactions.set([...transactions]);
                  this.updateErrorStatus();
                }
              }
            });
        }
      });
  }

  cancelEdit(transaction: IGiftCardRows): void {
    this.processClicked.set(false);
    transaction.isEditing = false;
    /** Reset edit data to original values */
    if (transaction.editData) {
      transaction.editData = {
        firstname: transaction.firstname,
        lastname: transaction.lastname,
        email: transaction.email,
        phone: transaction.phone as number,
        amount: transaction.amount,
        type: transaction.type
      };
    }
  }

  onFileUpload(file: File) {
    this.selectedFile = file;
    this.form.controls.file.setValue(file);
  }

  // Download sample file
  downloadSample() {
    this.fileDownloading.set(true);
    this.walletService
      .downloadGiftCardSampleFile()
      .pipe(
        finalize(() => this.fileDownloading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          window.location.href = res.data.sampleFileUrl;
        }
      });
  }

  /** Update error status */
  updateErrorStatus() {
    const transactions = this.cardTransactions();
    const hasAnyErrors = transactions.some(
      (transaction) => !!transaction.errors
    );
    this.hasErrors.set(hasAnyErrors);
  }

  processCard() {
    const payload = {
      wallet_id: this.walletId,
      batch_id: this.batchId()
    };

    this.submitting.set(true);
    this.walletService
      .createBulkGiftCard(payload)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: 'Successfully imported.' });
          this.dialogRef.close(true);
        }
      });
  }

  /** Update dialog width based on step */
  private updateDialogWidth(): void {
    const width = this.step() === 1 ? '700px' : '1060px';
    this.dialogRef.updateSize(width, 'auto');
  }

  back() {
    this.step.set(1);
    this.updateDialogWidth();
  }

  /** Check if a field should be editable */
  isFieldEditable(transaction: IGiftCardRows, field: string): boolean {
    if (transaction.isEditing === undefined) return false;
    return (
      transaction.isEditing &&
      !!transaction.editingFields?.[
        field as keyof typeof transaction.editingFields
      ]
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
