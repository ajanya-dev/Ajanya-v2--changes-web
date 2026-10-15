import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { IBankDropdown } from 'src/app/models/bank';
import { IPayeeReport } from 'src/app/modules/more/model/all-reports';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { SelectedDateService } from 'src/app/shared/components/date-range/selected.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IApiResWithMsg } from 'src/app/models/api';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { IWalletData } from 'src/app/models/wallet';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { NgClass } from '@angular/common';
import { DropDownCategoryMultiSelectComponent } from '../../../../shared/components/drop-downs/drop-down-category-multi-select/drop-down-category-multi-select.component';
import { DateRangeSelectorV35Component } from '../../../../shared/components/date-range-selector-v35/date-range-selector-v35.component';
import { WalletDropdownMultiSelectComponent } from '../../../../shared/components/v3/drop-downs/wallet-dropdown-multi-select/wallet-dropdown-multi-select.component';
import { CardDropdownMultiSelectComponent } from '../../../../shared/components/v3/drop-downs/card-dropdown-multi-select/card-dropdown-multi-select.component';
import { DropDownBankMultiSelectComponent } from '../../../../shared/components/drop-downs/drop-down-bank-multi-select/drop-down-bank-multi-select.component';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { DropDownPayeeMultiSelectComponent } from '../../../../shared/components/drop-downs/drop-down-payee-multi-select/drop-down-payee-multi-select.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';

/**
 * Angular component representing the Payee Report Modal.
 * @class
 */
@Component({
  selector: 'app-payee-report-modal',
  templateUrl: './payee-report-modal.component.html',
  styleUrls: ['./payee-report-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    DropDownPayeeMultiSelectComponent,
    MatRadioGroup,
    MatRadioButton,
    DropDownBankMultiSelectComponent,
    CardDropdownMultiSelectComponent,
    WalletDropdownMultiSelectComponent,
    DateRangeSelectorV35Component,
    DropDownCategoryMultiSelectComponent,
    NgClass,
    ControlMessageComponent,
    CommonButtonV35Component,
    WhiteLabelPipe
  ]
})
export class PayeeReportModalComponent implements OnInit, OnDestroy {
  /**
   * Initializes a new instance of the PayeeReportModalComponent.
   * @constructor
   * @param {ReportsService} reportService - The Reports Service for generating reports.
   * @param {UntypedFormBuilder} formBuilder - The FormBuilder service for creating form controls.
   * @param {AlertService} alertService - The Alert Service for displaying alert messages.
   * @param {MatDialogRef<PayeeReportModalComponent>} dialogRef - The MatDialogRef service for the modal dialog.
   * @param {SelectedDateService} selectedService - The SelectedDateService for managing date selection.
   * @param {LocalStorageService} localStorageService - The LocalStorageService for accessing local storage.
   */
  private reportService = inject(ReportsService);
  private formBuilder = inject(UntypedFormBuilder);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<PayeeReportModalComponent>);
  private selectedService = inject(SelectedDateService);
  private localStorageService = inject(LocalStorageService);

  /**
   * An array of subscriptions to manage subscriptions.
   * @type {Subscription[]}
   */
  subscription: Subscription[] = [];

  /**
   * The selected report format ('pdf', 'excel', or 'csv').
   * @type {string}
   */
  selectedFormate: 'pdf' | 'excel' | 'csv' = 'pdf';

  /**
   * The report form group.
   * @type {UntypedFormGroup}
   */
  reportForm: UntypedFormGroup;

  /**
   * An array of selected payee IDs.
   * @type {string[]}
   */
  payeeIds: string[] = [];

  /**
   * An array of selected bank account IDs.
   * @type {string[]}
   */
  bankAccountIds: string[] = [];

  /**
   * An array of selected category IDs.
   * @type {string[]}
   */
  categoryIds: string[] = [];

  /**
   * The report type ('download' or 'email').
   * @type {string}
   */
  reportType: 'download' | 'email' = 'download';

  /**
   * Flag indicating whether the next step is active.
   * @type {boolean}
   */
  isNextStep = false;

  /**
   * Flag indicating whether the component is in a loading state.
   * @type {boolean}
   */
  loadingEmailSubmit = false;
  loadingDownLoad = false;
  loadingEmail = false;
  source = [
    { id: 4, name: 'All' },
    { id: 1, name: 'Bank Account' },
    { id: 2, name: 'Card' },
    { id: 3, name: 'Wallet' }
  ];

  fileFormat: { id: 'pdf' | 'excel' | 'csv'; name: string }[] = [
    { id: 'pdf', name: 'PDF' },
    { id: 'excel', name: 'EXCEL' },
    { id: 'csv', name: 'CSV' }
  ];

  selectedPaymentSource = 4;
  sourceIds: string[] = [];

  /**
   * Angular lifecycle hook called when the component is initialized.
   * Performs initialization tasks such as setting up form controls and loading data.
   * @method
   */
  ngOnInit(): void {
    this.iniForm();
    this.selectedService.setValue('This Year');
    this.calculateThisYear();
  }

  /**
   * Initializes the report form with form controls.
   * @method
   */
  iniForm(): void {
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

  /**
   * Handles the selection of date range.
   * @method
   * @param {Object} dateEvent - An object containing start and end dates.
   */
  selectedRange(dateEvent: { end: string | null; start: string | null }): void {
    this.reportForm?.controls?.fromDate?.setValue(dateEvent?.start);
    this.reportForm?.controls?.toDate?.setValue(dateEvent?.end);
  }

  /**
   * Handles the selection of payees.
   * @method
   * @param {IPayeeDropdown[]} payeeEvent - An array of selected payees.
   */
  payeeSelectionEvent(payeeEvent: IPayeeDropdown[]): void {
    this.payeeIds = [];
    payeeEvent?.forEach((element) => {
      if (this.payeeIds?.indexOf(element?.id) === -1) {
        this.payeeIds?.push(element?.id);
      }
    });
    this.reportForm?.controls?.payees?.setValue(this.payeeIds);
  }

  /**
   * Handles the selection of bank accounts.
   * @method
   * @param {IBankDropdown[]} bankEvent - An array of selected bank accounts.
   */
  bankSlectionEvent(bankEvent: IBankDropdown[]): void {
    this.bankAccountIds = [];
    bankEvent?.forEach((element) => {
      if (this.bankAccountIds?.indexOf(element?.id) === -1) {
        this.bankAccountIds?.push(element?.id);
      }
    });
    this.reportForm?.controls?.bankAccount?.setValue(this.bankAccountIds);
  }

  /**
   * Handles the selection of categories.
   * @method
   * @param {ICategoryDropdown[]} categoryEvent - An array of selected categories.
   */
  categorySelectionEvent(categoryEvent: ICategoryDropdown[]) {
    this.categoryIds = [];
    categoryEvent?.forEach((element) => {
      if (this.categoryIds?.indexOf(element?.id) === -1) {
        this.categoryIds.push(element?.id);
      }
    });
  }

  /**
   * Selects the file format for the report.
   * @method
   * @param {string} fileFormate - The selected file format ('pdf', 'excel', or 'csv').
   */
  selectFileFormate(fileFormate: 'pdf' | 'excel' | 'csv'): void {
    this.selectedFormate = fileFormate;
    this.reportForm?.controls?.formate?.setValue(fileFormate);
  }

  /**
   * Constructs the body of the report form data.
   * @method
   * @returns {IPayeeReport} - The report form data.
   */
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

  /**
   * Formats a date to a string in 'YYYY-MM-DD' format.
   * @method
   * @param {Date} unformatedDate - The unformatted date to be formatted.
   * @returns {string} - The formatted date string.
   */
  getFormatedDate(unformatedDate: Date): string {
    const fullDate = new Date(unformatedDate);
    const year = fullDate.getFullYear();
    const month = fullDate.getMonth() + 1;
    const date = fullDate?.getDate();
    const formatedDate = `${year}-${month}-${date}`;
    return formatedDate;
  }

  /**
   * @description  Retrieves an array of selected payment source IDs based on the current selected payment source.
   * @returns {string[]} An array of selected payment source IDs.
   */
  getSelectedSourceIds(): string[] {
    const selectedCards: IExistingCreditCards[] =
      this.reportForm.controls.card?.value;
    const selectedWallets: IWalletData[] =
      this.reportForm.controls.wallet?.value;
    if (this.selectedPaymentSource === 1) {
      this.sourceIds = this.bankAccountIds;
    } else if (this.selectedPaymentSource === 2) {
      if (selectedCards?.length > 0) {
        selectedCards.forEach((card) => {
          if (!this.sourceIds.includes(card.cardId)) {
            this.sourceIds.push(card.cardId);
          }
        });
      } else {
        this.sourceIds = [];
      }
    } else if (this.selectedPaymentSource === 3) {
      if (selectedWallets?.length > 0) {
        selectedWallets.forEach((wallet) => {
          if (!this.sourceIds.includes(wallet.id)) {
            this.sourceIds.push(wallet.id);
          }
        });
      } else {
        this.sourceIds = [];
      }
    }
    return this.sourceIds;
  }

  /**
   * Generates the report based on the selected report type ('download' or 'email').
   * @method
   * @param {string} reportType - The report type ('download' or 'email').
   */
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

  /**
   * Handles the submission of the email form when sending the report via email.
   * @method
   */
  emailSublit(): void {
    if (this.reportForm?.invalid) {
      this.reportForm?.markAllAsTouched();
      return;
    }
    this.reportType = 'email';
    this.loadingEmailSubmit = true;
    this.onSubmit();
  }

  /**
   * Handles the final form submission to generate the report.
   * @method
   */
  onSubmit(): void {
    this.subscription.push(
      this.reportService
        .payeeTransactionReports(this.formBody())
        .pipe(
          finalize(() => {
            this.loadingEmailSubmit = false;
            this.loadingDownLoad = false;
            this.loadingEmail = false;
          })
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
        })
    );
  }

  /**
   * Calculates the date range for the current year and sets it in the form.
   * @method
   */
  calculateThisYear(): void {
    const today = new Date(); // get current date
    const year = today.getFullYear(); // get current year
    const startDate = new Date(year, 0, 1); // January 1st of current year
    const endDate = new Date(year, 11, 31); // December 31st of current year
    this.reportForm?.patchValue({
      fromDate: this.getFormatedDate(startDate),
      toDate: this.getFormatedDate(endDate)
    });
  }

  /**
   * @description Used to change payment source.
   * @param {number}type - Selected Payment source.
   */
  changePaymentSource(type: number) {
    this.selectedPaymentSource = type;
    this.sourceIds = [];
    this.bankAccountIds = [];
    this.reportForm.controls.wallet?.setValue('');
    this.reportForm.controls.card?.setValue('');
  }

  /**
   * Angular lifecycle hook called when the component is destroyed.
   * Unsubscribes from all subscriptions to prevent memory leaks.
   * @method
   */
  ngOnDestroy(): void {
    this.subscription.forEach((el) => {
      el?.unsubscribe();
    });
  }
}
