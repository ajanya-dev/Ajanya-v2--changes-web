/* eslint-disable no-restricted-globals */
import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
  input,
  output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Params } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule, CircleAlert, Table, Info } from 'lucide-angular';
import { IConfirmAlert } from 'src/app/models/alert';
import { IMultiCheckImport } from 'src/app/modules/check/model/check';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';

interface IErrorMsg {
  payee_name: string;
  payee_address_line_1: string;
  payee_address_line_2: string;
  payee_city: string;
  payee_state: string;
  payee_zip: string;
  payee_country: string;
  cheque_memo: string;
  cheque_notes: string;
  check_account_number: string;
  check_invoice_number: string;
  check_issue_date: string;
  cheque_amount: number;
  payee_phone: string;
  payee_email: number;
  payee_company_name: string;
  cheque_serial_number: string;
  category_name: string;
  payee_nick_name: string;
  account_number: string;
  routing_number: string;
  account_type: string;
  payee_first_name: string;
  payee_last_name: string;
  payment_method: string;
  customMailType: string;
  customSpFileNumber: string;
  customHours: string;
  validationError: { [key: string]: string };
  row_number: number;
  [key: string]: unknown;
}

@Component({
  selector: 'app-v4-excel-import-step2',
  templateUrl: './v4-excel-import-step2.component.html',
  styleUrls: ['./v4-excel-import-step2.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block h-full' },
  providers: [DatePipe],
  imports: [
    FormsModule,
    NgClass,
    MatTooltip,
    LucideAngularModule,
    CommonButtonV4Component,
    V4CommonDropDownSelectorComponent
  ]
})
export class V4ExcelImportStep2Component implements OnInit {
  // Signal inputs
  importData = input.required<IMultiCheckImport>();
  templateNameInput = input<string>('');
  source = input<string>('');

  // Signal outputs
  stepBack = output<void>();
  submitSuccess = output<{ source: string }>();

  // Lucide icons
  readonly CircleAlertIcon = CircleAlert;
  readonly TableIcon = Table;
  readonly InfoIcon = Info;

  /**
   * `headerOptions` prefixed with the "no mapping" row, so a column can be
   * unmapped by picking "-- Match --" (which sets `selectedIndex` back to '').
   */
  dropdownOptions: { key: string; value: string; isRequired?: boolean }[] = [];

  /**
   * Per-column option lists for `<app-v4-common-dropdown>`, in the shape its
   * `displayField`/`outputField` config expects.
   *
   * One array per column rather than one shared list because `disabled` is
   * column-specific: an option already mapped elsewhere is disabled here, but
   * stays selectable on the column that owns it. Rebuilt only in
   * `mappingChange()` so the array identity is stable between selections -
   * the dropdown re-structures its data whenever `listData` changes identity.
   */
  columnOptions: { label: string; value: string; disabled: boolean }[][] = [];

  // Services
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private datePipe = inject(DatePipe);
  private destroyRef = inject(DestroyRef);

  // State
  submitting = false;
  savingTemplate = false;

  data: Params;
  headerOptions: { key: string; value: string; isRequired?: boolean }[] = [];
  headerColumns: { selectedIndex: string }[] = [];
  templateName = '';
  showSaveTemplate = false;
  disableMapping: Params = {};
  checkData: { [key: string]: string }[] = [];
  showErrorPage = false;
  validationData: IErrorMsg[] = [];
  templateInputName = '';

  // checkData is capped at 5 rows, so the hint is only relevant when the file has more.
  get showPreviewHint(): boolean {
    return (this.data?.chequeData?.length ?? 0) > 5;
  }

  requiredHeaderKeys: string[] = ['0', '1', '3', '5', '6', '7', '8', '14'];

  tableHeaders = [
    'Row No',
    'DATE',
    'PAYEE',
    'PAYEE NICKNAME',
    'PAYEE EMAIL',
    'PAYEE PHONE',
    'AMOUNT',
    'MEMO',
    'NOTE',
    'AC#',
    'ROUTING NO',
    'INV#',
    'CHECK NO',
    'COMPANY NAME',
    'ADDRESS LINE 1',
    'ADDRESS LINE 2',
    'CITY',
    'STATE',
    'COUNTRY',
    'ZIP',
    'PAYMENT METHOD'
  ] as const;

  tableFields = [
    'row_number',
    'check_issue_date',
    'payee_name',
    'payee_nick_name',
    'payee_email',
    'payee_phone',
    'cheque_amount',
    'cheque_memo',
    'cheque_notes',
    'check_account_number',
    'routing_number',
    'check_invoice_number',
    'cheque_serial_number',
    'payee_company_name',
    'payee_address_line_1',
    'payee_address_line_2',
    'payee_city',
    'payee_state',
    'payee_country',
    'payee_zip',
    'payment_method'
  ] as const;

  ngOnInit(): void {
    this.data = this.importData() as unknown as Params;
    this.templateName = this.templateNameInput();
    this.formatCheckData();
    this.headerOptions = this.makeHeader(
      this.data.header[0],
      this.source() === 'wallet'
    );
    this.dropdownOptions = [
      { key: '', value: '-- Match --' },
      ...this.headerOptions
    ];

    if (this.data?.template?.length) {
      this.data.template.forEach((item: string) => {
        this.headerColumns.push({ selectedIndex: item });
      });
    } else {
      for (let i = 0; i < 21; i += 1) {
        this.headerColumns.push({ selectedIndex: '' });
      }
    }

    // Both paths need this: it derives `disableMapping` and builds the
    // per-column option lists the dropdowns bind to.
    this.mappingChange();
  }

  formatCheckData() {
    for (let i = 0; i <= 4; i += 1) {
      if (this.data?.chequeData?.length <= i) {
        return;
      }

      const row = this.data?.chequeData[i];
      const obj: Params = {};

      Object.keys(row).forEach((key) => {
        if (typeof row[key] === 'object' && row[key]?.date) {
          obj[key] = this.datePipe.transform(row[key].date, 'shortDate');
        } else {
          obj[key] = row[key];
        }
      });
      this.checkData.push(obj);
    }
  }

  makeHeader(
    data: { [key: string]: string },
    isWallet: boolean = false
  ): { key: string; value: string; isRequired?: boolean }[] {
    const headers: { key: string; value: string; isRequired?: boolean }[] = [];
    Object.entries(data).forEach(([key, value]) => {
      const isRequired = isWallet && this.requiredHeaderKeys.includes(key);
      headers.push({
        key,
        value: isRequired ? `${value} *` : value,
        isRequired
      });
    });
    return headers;
  }

  isOptionDisabled(item: { selectedIndex: string }, key: string): boolean {
    return !!key && !!this.disableMapping[key] && item.selectedIndex !== key;
  }

  onMappingChange(key: string | null, item: { selectedIndex: string }) {
    item.selectedIndex = key ?? '';
    this.mappingChange();
  }

  mappingChange() {
    this.disableMapping = {};
    this.headerColumns.forEach((item: { selectedIndex: string | number }) => {
      if (item.selectedIndex) {
        this.disableMapping[item.selectedIndex] = !isNaN(
          item.selectedIndex as number
        );
      }
    });
    this.buildColumnOptions();
  }

  /**
   * Recompute each column's option list against the freshly derived
   * `disableMapping`. Runs only on mapping changes, not per change-detection
   * cycle, so each column keeps a stable array reference in between.
   */
  private buildColumnOptions(): void {
    this.columnOptions = this.headerColumns.map((item) =>
      this.dropdownOptions.map((option) => ({
        label: option.value,
        value: option.key,
        disabled: this.isOptionDisabled(item, option.key)
      }))
    );
  }

  submit(isProceedAnyWay?: boolean) {
    const requiredAny1 = ['0', '23', '24'];
    let payeeNameSelected = false;
    let payeeSelectedIdx = 0;

    const mapping = this.headerColumns.map(
      (row: { selectedIndex: string }, index: number) => {
        if (requiredAny1.includes(row.selectedIndex)) {
          payeeNameSelected = true;
        }
        if (row.selectedIndex === '0') {
          payeeSelectedIdx = index;
        }
        return row.selectedIndex;
      }
    );

    let isPayeeNameSelected = 1;
    if (this.templateName === 'Default template') {
      isPayeeNameSelected = 0;
      this.checkData.forEach((row) => {
        if (Object.values(row)[payeeSelectedIdx] !== '') {
          isPayeeNameSelected = 1;
        }
      });
    }

    if (this.source() === 'wallet') {
      const mappedHeaderKeys = new Set(
        this.headerColumns
          .map((row: { selectedIndex: string }) => row.selectedIndex)
          .filter((key: string) => key !== '')
      );

      const missingRequiredFields: string[] = [];
      const headerData = this.data.header[0];

      this.requiredHeaderKeys.forEach((requiredKey) => {
        if (!mappedHeaderKeys.has(requiredKey)) {
          const fieldName = headerData?.[requiredKey] || requiredKey;
          missingRequiredFields.push(fieldName);
        }
      });

      if (missingRequiredFields.length > 0) {
        this.alertService.failedAlert({
          content: `Please map the following required fields: ${missingRequiredFields.join(', ')}`
        });
        return;
      }
    }

    if (!payeeNameSelected || isPayeeNameSelected === 0) {
      this.alertService.failedAlert({ content: 'Please select payee name' });
      return;
    }

    const body = {
      mapping,
      uploadFromImport: 'yes',
      proceedForCheckNumber: isProceedAnyWay ? 1 : 0
    };
    this.submitting = true;
    this.checkService
      .multiImportStep3(
        body,
        this.source() === 'wallet' ? 'wallet-checks' : 'checks-import'
      )
      .pipe(
        finalize(() => {
          this.submitting = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          if (data?.success) {
            this.showErrorPage = false;
            this.submitSuccess.emit({ source: this.source() });
          }
        },
        error: (err) => {
          if (err.error.errorCode === 190) {
            this.proceedModal(err.error.errorMsg);
          }
          if (err.error.errorCode === 191) {
            this.showErrorPage = true;
            this.validationData = err.error.errorMsg;
          }
        }
      });
  }

  proceedModal(err: string) {
    // The API returns the row list as "3,4,5,..." with no spaces, i.e. one
    // unbreakable token. Spacing the commas gives the browser somewhere to wrap
    // so it breaks between row numbers rather than through the middle of one.
    const message = err?.replace(/,(?=\S)/g, ', ') ?? err;
    // Message as the body, not the title: the body is width-capped and wraps,
    // whereas a long title renders as an oversized heading.
    const warn = this.openConfirmAlert('Do you want to proceed anyway?',message);
    warn.afterClosed().subscribe((res) => {
      if (res) {
        this.submit(true);
      }
    });
  }

  openConfirmAlert(content: string, title?: string) {
    const data: IConfirmAlert = {
      title: title || 'Confirm',
      content,
      doneMsg: 'OK',
      cancelMsg: 'Cancel'
    };
    return this.alertService.confirmAlert(data);
  }

  toggleShowTemp() {
    this.showSaveTemplate = !this.showSaveTemplate;
  }

  saveTemplate() {
    if (!this.templateInputName) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please enter template name'
      });
      return;
    }

    const template = this.headerColumns.map((row: { selectedIndex: string }) =>
      row.selectedIndex ? row.selectedIndex : ''
    );

    const body = { template, nick_name: this.templateInputName };

    this.savingTemplate = true;
    this.checkService
      .saveNewTemplate(body)
      .pipe(
        finalize(() => {
          this.savingTemplate = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        if (data?.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Template saved !',
            close: true,
            timeout: 2500
          });
        }
      });
  }

  backFromError() {
    this.showErrorPage = false;
  }

}
