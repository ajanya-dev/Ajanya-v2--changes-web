import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { V4RadioGroupComponent } from 'src/app/shared/V4/v4-radio-button/v4-radio-button.component';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs/operators';

import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { IPayeeReport } from 'src/app/modules/more/model/all-reports';
import { IApiResWithMsg } from 'src/app/models/api';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { IWalletData } from 'src/app/models/wallet';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { IBankDropdown } from 'src/app/models/bank';

import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { SelectedDateService } from 'src/app/shared/components/date-range/selected.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';

import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { PayeeMultiSelectDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-multi-select-dropdown-v4/payee-multi-select-dropdown-v4.component';
import { BankMultiSelectDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-multi-select-dropdown-v4/bank-multi-select-dropdown-v4.component';
import { CardsMultiSelectDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/cards-multi-select-dropdown-v4/cards-multi-select-dropdown-v4.component';
import { WalletMultiSelectDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/wallet-multi-select-dropdown-v4/wallet-multi-select-dropdown-v4.component';
import { V4DateRangeSelectorComponent } from 'src/app/shared/V4/v4-date-range-selector/v4-date-range-selector.component';
import { CategoryDropdownV4Component } from 'src/app/shared/V4/dropdown/category-dropdown-v4/category-dropdown-v4.component';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';

@Component({
  selector: 'app-payee-report-modal-v4',
  standalone: true,
  imports: [
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
    V4RadioGroupComponent,
    PayeeMultiSelectDropdownV4Component,
    BankMultiSelectDropdownV4Component,
    CardsMultiSelectDropdownV4Component,
    WalletMultiSelectDropdownV4Component,
    V4DateRangeSelectorComponent,
    CategoryDropdownV4Component,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    WhiteLabelPipe
  ],
  template: `
    <div>
      <!-- Header -->
      <div
        class="flex justify-between px-6 py-4 bg-v4-secondary-background-color border-b border-v4-border-color"
      >
        <div class="flex flex-col">
          <h1 class="text-xl font-semibold text-v4-main-text-color font-funnel">
            Download/Send Report
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
          class="w-9 h-9 rounded-lg hover:bg-v4-tertiary-background-color cursor-pointer flex justify-center items-center"
        >
          <lucide-icon name="x" [size]="20" class="text-v4-subtle-text-color" />
        </div>
      </div>

      <!-- Body -->
      <div
        class="p-6 bg-v4-tertiary-background-color flex flex-col gap-5"
        [formGroup]="reportForm"
      >
        @if (!isNextStep) {
          <!-- Payee -->
          <div class="flex flex-col gap-1.5">
            <span
              class="text-xs font-medium text-v4-secondary-text-color font-peridot tracking-wide"
            >
              {{ 'Payee' | whiteLabel: 'payeeName' }}
            </span>
            <app-payee-multi-select-dropdown-v4
              [placeholder]="'All ' + ('Payee' | whiteLabel: 'payeeName') + 's'"
              (selectionEvent)="payeeSelectionEvent($event)"
            />
          </div>

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

          <!-- Conditional Source Dropdown -->
          @if (selectedPaymentSource === 1) {
            <app-bank-multi-select-dropdown-v4
              [placeholder]="'All Bank Accounts'"
              (selectionEvent)="bankSelectionEvent($event)"
            />
          } @else if (selectedPaymentSource === 2) {
            <app-cards-multi-select-dropdown-v4
              [placeholder]="'All Cards'"
              (selectionEvent)="cardSelectionEvent($event)"
            />
          } @else if (selectedPaymentSource === 3) {
            <app-wallet-multi-select-dropdown-v4
              [placeholder]="'All Wallets'"
              (selectionEvent)="walletSelectionEvent($event)"
            />
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
              selectDate="this-year"
            />
          </div>

          <!-- Category -->
          <div class="flex flex-col gap-1.5">
            <span
              class="text-xs font-medium text-v4-secondary-text-color font-peridot tracking-wide"
            >
              Category
            </span>
            <app-category-dropdown-v4 formControlName="category" placeholder="All Categories" [showInfoIcon]="false" />
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
        }

        @if (isNextStep) {
          <div class="text-center py-8">
            <p class="text-sm text-v4-main-text-color mb-4">
              Confirm to send report to email id below
            </p>
            <div class="max-w-[70%] mx-auto">
              <app-common-input-v4
                [placeholder]="'Email'"
                [control]="reportForm.controls.email"
                formControlName="email"
              />
            </div>
          </div>
        }
      </div>

      <!-- Footer -->
      <div class="flex gap-3 px-6 pb-6 pt-2 bg-v4-tertiary-background-color">
        @if (!isNextStep) {
          <app-common-button-v4
            class="flex-1"
            width="100%"
            [type]="{ style: 'outline', name: 'main' }"
            text="Send to Email"
            lucideIcon="mail"
            [lucideIconSize]="16"
            [customClasses]="'!py-2.5 !px-5'"
            [textClasses]="'!text-sm'"
            [disabled]="loadingEmail"
            [loading]="loadingEmail"
            (clickEvent)="generateReport('email')"
          />
          <app-common-button-v4
            class="flex-1"
            width="100%"
            [type]="{ style: 'primary', name: 'main' }"
            text="Download"
            lucideIcon="download"
            [lucideIconSize]="16"
            [customClasses]="'!py-2.5 !px-5'"
            [textClasses]="'!text-sm'"
            [disabled]="loadingDownLoad"
            [loading]="loadingDownLoad"
            (clickEvent)="generateReport('download')"
          />
        }
        @if (isNextStep) {
          <app-common-button-v4
            class="flex-1"
            width="100%"
            [type]="{ style: 'primary', name: 'main' }"
            text="Continue to Email"
            lucideIcon="mail"
            [lucideIconSize]="16"
            [disabled]="loadingEmailSubmit"
            [loading]="loadingEmailSubmit"
            (clickEvent)="emailSublit()"
          />
        }
      </div>
    </div>
  `,
  styles: [``]
})
export class PayeeReportModalV4Component implements OnInit {
  private destroyRef = inject(DestroyRef);
  private reportService = inject(ReportsService);
  private formBuilder = inject(FormBuilder);
  private alertService = inject(V4AlertService);
  private selectedService = inject(SelectedDateService);
  private localStorageService = inject(LocalStorageService);
  public dialogRef = inject(MatDialogRef<PayeeReportModalV4Component>);

  selectedFormate: 'pdf' | 'excel' | 'csv' = 'pdf';
  reportForm: FormGroup;
  payeeIds: string[] = [];
  bankAccountIds: string[] = [];
  cardIds: string[] = [];
  walletIds: string[] = [];
  categoryIds: string[] = [];
  reportType: 'download' | 'email' = 'download';
  isNextStep = false;
  loadingEmailSubmit = false;
  loadingDownLoad = false;
  loadingEmail = false;
  selectedPaymentSource = 4;
  sourceIds: string[] = [];

  source = [
    { id: 4, name: 'All' },
    { id: 1, name: 'Bank' },
    { id: 2, name: 'Card' },
    { id: 3, name: 'Wallet' }
  ];

  fileFormat: { id: 'pdf' | 'excel' | 'csv'; name: string }[] = [
    { id: 'pdf', name: 'PDF' },
    { id: 'excel', name: 'EXCEL' },
    { id: 'csv', name: 'CSV' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.selectedService.setValue('This Year');
    this.calculateThisYear();
  }

  initForm(): void {
    this.reportForm = this.formBuilder.group({
      payees: [''],
      bankAccount: [''],
      fromDate: ['', Validators.required],
      toDate: [''],
      category: [''],
      formate: [''],
      email: [''],
      wallet: [''],
      card: ['']
    });
  }

  selectedRange(dateEvent: { end: string | null; start: string | null }): void {
    this.reportForm?.controls?.fromDate?.setValue(dateEvent?.start);
    this.reportForm?.controls?.toDate?.setValue(dateEvent?.end);
  }

  payeeSelectionEvent(payeeEvent: IPayeeDropdown[]): void {
    this.payeeIds = [];
    payeeEvent?.forEach((element) => {
      if (this.payeeIds?.indexOf(element?.id) === -1) {
        this.payeeIds?.push(element?.id);
      }
    });
    this.reportForm?.controls?.payees?.setValue(this.payeeIds);
  }

  bankSelectionEvent(bankEvent: IBankDropdown[]): void {
    this.bankAccountIds = [];
    bankEvent?.forEach((element) => {
      if (this.bankAccountIds?.indexOf(element?.id) === -1) {
        this.bankAccountIds?.push(element?.id);
      }
    });
    this.reportForm?.controls?.bankAccount?.setValue(this.bankAccountIds);
  }

  cardSelectionEvent(cardEvent: IExistingCreditCards[]): void {
    this.cardIds = [];
    cardEvent?.forEach((element) => {
      if (element?.cardId && !this.cardIds.includes(element.cardId)) {
        this.cardIds.push(element.cardId);
      }
    });
    this.reportForm?.controls?.card?.setValue(this.cardIds);
  }

  walletSelectionEvent(walletEvent: IWalletData[]): void {
    this.walletIds = [];
    walletEvent?.forEach((element) => {
      if (element?.id && !this.walletIds.includes(element.id)) {
        this.walletIds.push(element.id);
      }
    });
    this.reportForm?.controls?.wallet?.setValue(this.walletIds);
  }

  categorySelectionEvent(categoryEvent: ICategoryDropdown[]): void {
    this.categoryIds = [];
    categoryEvent?.forEach((element) => {
      if (this.categoryIds?.indexOf(element?.id) === -1) {
        this.categoryIds.push(element?.id);
      }
    });
  }

  selectFileFormate(fileFormate: 'pdf' | 'excel' | 'csv'): void {
    this.selectedFormate = fileFormate;
    this.reportForm?.controls?.formate?.setValue(fileFormate);
  }

  changePaymentSource(type: number): void {
    this.selectedPaymentSource = type;
    this.sourceIds = [];
    this.bankAccountIds = [];
    this.cardIds = [];
    this.walletIds = [];
    this.reportForm.controls.wallet?.setValue('');
    this.reportForm.controls.card?.setValue('');
    this.reportForm.controls.bankAccount?.setValue('');
  }

  formBody(): IPayeeReport {
    const formValues = this.reportForm?.value;
    return {
      payeeIds: this.payeeIds,
      type: this.selectedPaymentSource,
      typeIds: this.getSelectedSourceIds(),
      categoryIds: this.categoryIds,
      fromDate: this.getFormatedDate(formValues?.fromDate),
      toDate: this.getFormatedDate(formValues?.toDate),
      fileFormat: this.selectedFormate,
      reportType: this.reportType,
      ...(this.reportType === 'email' && { email: formValues?.email })
    };
  }

  getFormatedDate(unformatedDate: Date): string {
    const fullDate = new Date(unformatedDate);
    const year = fullDate.getFullYear();
    const month = fullDate.getMonth() + 1;
    const date = fullDate?.getDate();
    return `${year}-${month}-${date}`;
  }

  getSelectedSourceIds(): string[] {
    if (this.selectedPaymentSource === 1) {
      this.sourceIds = [...this.bankAccountIds];
    } else if (this.selectedPaymentSource === 2) {
      this.sourceIds = [...this.cardIds];
    } else if (this.selectedPaymentSource === 3) {
      this.sourceIds = [...this.walletIds];
    } else {
      this.sourceIds = [];
    }
    return this.sourceIds;
  }

  generateReport(reportType: 'download' | 'email'): void {
    if (reportType === 'email') {
      this.isNextStep = true;
      this.reportForm.patchValue({
        email: this.localStorageService.getItem('email')
      });
      this.reportType = reportType;
      this.reportForm?.controls?.email?.setValidators([
        Validators?.required,
        ValidationService.emailValidator
      ]);
      this.reportForm?.controls?.email?.updateValueAndValidity();
    } else {
      this.loadingDownLoad = true;
      this.reportForm?.controls?.email?.clearValidators();
      this.reportForm?.controls?.email?.updateValueAndValidity();
      this.reportType = reportType;
      this.onSubmit();
    }
  }

  emailSublit(): void {
    if (this.reportForm?.invalid) {
      this.reportForm?.markAllAsTouched();
      return;
    }
    this.reportType = 'email';
    this.loadingEmailSubmit = true;
    this.onSubmit();
  }

  onSubmit(): void {
    this.reportService
      .payeeTransactionReports(this.formBody())
      .pipe(
        finalize(() => {
          this.loadingEmailSubmit = false;
          this.loadingDownLoad = false;
          this.loadingEmail = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: IApiResWithMsg<{ url?: string }>) => {
        if (res?.success) {
          if (res?.data?.url) {
            this.dialogRef.close();
            window.open(res?.data?.url);
            return;
          }
          if (res?.message?.length === 0) {
            this.alertService.infoAlert({ content: 'No records found!' });
            return;
          }
          if (res?.message) {
            this.alertService.successAlert({ content: `${res?.message}` });
            this.dialogRef.close();
          }
        }
      });
  }

  calculateThisYear(): void {
    const today = new Date();
    const year = today.getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    this.reportForm?.patchValue({
      fromDate: this.getFormatedDate(startDate),
      toDate: this.getFormatedDate(endDate)
    });
  }
}
