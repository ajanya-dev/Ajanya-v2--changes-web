import { DatePipe } from '@angular/common';
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
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { V4RadioGroupComponent } from 'src/app/shared/V4/v4-radio-button/v4-radio-button.component';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';

import { IBankDropdown } from 'src/app/models/bank';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { IWalletData } from 'src/app/models/wallet';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { CardsDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/cards-dropdown-v4/cards-dropdown-v4.component';
import { WalletDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/wallet-dropdown-v4/wallet-dropdown-v4.component';
import { V4DateRangeSelectorComponent } from 'src/app/shared/V4/v4-date-range-selector/v4-date-range-selector.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

interface IFormData {
  bank: FormControl<IBankDropdown | string | null>;
  wallet: FormControl<IWalletData | string | null>;
  card: FormControl<IExistingCreditCards | string | null>;
  sourceType: FormControl<string | null>;
  fromDate: FormControl<string | null>;
  toDate: FormControl<string | null>;
}

@Component({
  selector: 'app-payment-report-modal-v4',
  standalone: true,
  imports: [
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
    V4RadioGroupComponent,
    BankAcDropdownV4Component,
    CardsDropdownV4Component,
    WalletDropdownV4Component,
    V4DateRangeSelectorComponent,
    CommonButtonV4Component
  ],
  template: `
    <div>
      <!-- Header -->
      <div
        class="flex justify-between items-start px-6 py-4 bg-v4-secondary-background-color border-b border-v4-border-color"
      >
        <div class="flex flex-col">
          <h1
            class="text-lg font-semibold text-v4-main-text-color font-peridot"
          >
            Download Report
          </h1>
          <span class="text-xs text-v4-secondary-text-color font-peridot">
            Configure and export your report
          </span>
        </div>
        <div
          role="button"
          tabindex="0"
          (click)="dialogRef.close(false)"
          (keydown.enter)="dialogRef.close(false)"
          (keydown.space)="dialogRef.close(false); $event.preventDefault()"
          class="w-8 h-8 rounded-lg hover:bg-v4-tertiary-background-color cursor-pointer flex justify-center items-center"
        >
          <lucide-icon name="x" [size]="18" class="text-v4-subtle-text-color" />
        </div>
      </div>

      <!-- Body -->
      <div
        class="px-6 py-5 bg-v4-tertiary-background-color flex flex-col gap-5"
        [formGroup]="reportForm"
      >
        <!-- Payment Source -->
        <div class="flex flex-col gap-2">
          <span
            class="text-xs font-medium text-v4-secondary-text-color font-peridot tracking-wide"
          >
            Payment Source
          </span>
          <app-v4-radio-group
            [options]="source"
            [ariaLabel]="'Payment Source'"
            [(ngModel)]="selectedPaymentSource"
            [ngModelOptions]="{ standalone: true }"
            (selectionChange)="changePaymentSource($event)"
          />
        </div>

        <!-- Conditional Dropdown -->
        @if (
          selectedPaymentSource === 'BANK' ||
          selectedPaymentSource === 'CARD' ||
          selectedPaymentSource === 'WALLET'
        ) {
          @if (selectedPaymentSource === 'BANK') {
            <app-bank-ac-dropdown-v4
              [enableAddNew]="false"
              [labelIconNeeded]="false"
              [placeholder]="'All Bank Accounts'"
              formControlName="bank"
            />
          } @else if (selectedPaymentSource === 'CARD') {
            <app-cards-dropdown-v4
              [dropdownIconNeeded]="false"
              placeholder="All Cards"
              [enableAddNew]="false"
              [labelIconNeeded]="false"
              formControlName="card"
            />
          } @else if (selectedPaymentSource === 'WALLET') {
            <app-wallet-dropdown-v4
              [dropdownIconNeeded]="false"
              placeholder="All Wallets"
              [enableAddNew]="false"
              [labelIconNeeded]="false"
              formControlName="wallet"
              [showLogoUpdateModal]="false"
            />
          }
        }

        <!-- Date Range -->
        <div class="flex flex-col gap-1.5">
          <span
            class="text-xs font-medium text-v4-secondary-text-color font-peridot tracking-wide"
          >
            Date Range
          </span>
          <app-v4-date-range-selector
            (dateEmiter)="selectedRange($event)"
            selectDate="all-time"
          />
        </div>

        <!-- File Format -->
        <div class="flex flex-col gap-2">
          <span
            class="text-xs font-medium text-v4-secondary-text-color font-peridot tracking-wide"
          >
            File Format
          </span>
          <app-v4-radio-group
            [options]="fileFormat"
            [ariaLabel]="'File Format'"
            [(ngModel)]="selectedFormate"
            [ngModelOptions]="{ standalone: true }"
            (selectionChange)="selectFileFormate($event)"
          />
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex justify-end gap-3 px-6 pb-5 pt-2 bg-v4-tertiary-background-color"
      >
        <app-common-button-v4
          width="100%"
          [type]="{ style: 'primary', name: 'main' }"
          text="Download"
          lucideIcon="download"
          [lucideIconSize]="16"
          [customClasses]="'!py-2.5 !px-5'"
          [textClasses]="'!text-sm'"
          [disabled]="isDownload()"
          [loading]="isDownload()"
          (clickEvent)="generateReport()"
        />
      </div>
    </div>
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentReportModalV4Component {
  private v3DataTableService = inject(V3DataTableService);
  private datePipe = inject(DatePipe);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  public dialogRef = inject(MatDialogRef<PaymentReportModalV4Component>);

  isDownload = signal(false);
  selectedPaymentSource = 'all';
  selectedFormate: 'xlsx' | 'csv' = 'xlsx';

  source = [
    { id: 'all', name: 'All' },
    { id: 'BANK', name: 'Bank' },
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

  changePaymentSource(type: string): void {
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

  generateReport(): void {
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
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          window.location.href = res.data.url;
          this.alertService.successAlert({
            content: 'Successfully Downloaded.',
            close: true,
            timeout: 1500
          });
          this.dialogRef.close();
        }
      });
  }
}
