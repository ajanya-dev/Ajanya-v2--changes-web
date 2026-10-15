import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { DatePipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  signal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { IBankDropdown } from 'src/app/models/bank';
import { DateRangeSelectorV35Component } from 'src/app/shared/components/date-range-selector-v35/date-range-selector-v35.component';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { CardsDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/cards-dropdown-v3/cards-dropdown-v3.component';
import { WalletDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IWalletData } from 'src/app/models/wallet';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { finalize, Subject, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';

interface IFormData {
  bank: FormControl<IBankDropdown | string | null>;
  wallet: FormControl<IWalletData | string | null>;
  card: FormControl<IExistingCreditCards | string | null>;
  sourceType: FormControl<string | null>;
  fromDate: FormControl<string | null>;
  toDate: FormControl<string | null>;
}

@Component({
  selector: 'app-payment-report-modal',
  standalone: true,
  imports: [
    NgClass,
    CommonButtonV35Component,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    MatRadioModule,
    BankAcDropdownV3Component,
    CardsDropdownV3Component,
    WalletDropdownV3Component,
    DateRangeSelectorV35Component
  ],
  templateUrl: './payment-report-modal.component.html',
  styleUrl: './payment-report-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentReportModalComponent implements OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private datePipe = inject(DatePipe);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<PaymentReportModalComponent>);

  faXmark = faXmark;
  isDownload = signal(false);
  selectedPaymentSource = 'all';
  selectedFormate: 'xlsx' | 'csv' = 'xlsx';
  destroy$ = new Subject();
  source = [
    { id: 'all', name: 'All' },
    { id: 'BANK', name: 'Bank Account' },
    { id: 'CARD', name: 'Card' },
    { id: 'WALLET', name: 'Wallet' }
  ];

  fileFormat: { id: 'xlsx' | 'csv'; name: string }[] = [
    { id: 'xlsx', name: 'EXCEL' },
    { id: 'csv', name: 'CSV' }
  ];

  reportForm = new FormGroup<IFormData>({
    bank: new FormControl('all'),
    wallet: new FormControl('all'),
    card: new FormControl('all'),
    sourceType: new FormControl('all'),
    fromDate: new FormControl('01/01/1970'),
    toDate: new FormControl('')
  });

  changePaymentSource(type: string) {
    this.selectedPaymentSource = type;
    switch (type) {
      case 'all':
        this.reportForm.controls.bank.setValue('all');
        this.reportForm.controls.wallet.setValue('all');
        this.reportForm.controls.card.setValue('all');
        break;
      case 'BANK':
        this.reportForm.controls.wallet.setValue('all');
        this.reportForm.controls.card.setValue('all');
        break;
      case 'CARD':
        this.reportForm.controls.bank.setValue('all');
        this.reportForm.controls.wallet.setValue('all');
        break;
      case 'WALLET':
        this.reportForm.controls.bank.setValue('all');
        this.reportForm.controls.card.setValue('all');
        break;

      default:
        break;
    }
  }

  selectedRange(dateEvent: { end: string | null; start: string | null }): void {
    this.reportForm?.controls?.fromDate?.setValue(dateEvent?.start);
    this.reportForm?.controls?.toDate?.setValue(dateEvent?.end);
  }

  selectFileFormate(fileFormate: 'xlsx' | 'csv'): void {
    this.selectedFormate = fileFormate;
  }

  generateReport() {
    const formValue = this.reportForm.value;
    const payload = {
      bankAccountId: (formValue.bank as IBankDropdown)?.id
        ? (formValue.bank as IBankDropdown)?.id
        : ('all' as string),
      walletId: (formValue.wallet as IWalletData)?.id
        ? (formValue.wallet as IWalletData)?.id
        : ('all' as string),
      cardId: (formValue.card as IExistingCreditCards)?.cardId
        ? (formValue.card as IExistingCreditCards)?.cardId
        : ('all' as string),
      sourceType: formValue.sourceType as string,
      fromDate: this.datePipe.transform(
        formValue.fromDate,
        'MM/dd/yyyy'
      ) as string,
      toDate: this.datePipe.transform(formValue.toDate, 'MM/dd/yyyy') as string,
      type: this.selectedFormate
    };
    this.isDownload.set(true);
    this.v3DataTableService
      .filterAndExport(payload)
      .pipe(
        finalize(() => this.isDownload.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          window.location.href = res.data.url;
          const data = {
            content: 'Successfully Downloaded.',
            close: true,
            timeout: 1500
          };
          this.alertService.successAlert(data);
          this.dialogRef.close();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
