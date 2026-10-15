import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { Params, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IConfirmAlert } from 'src/app/models/alert';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  Validators
} from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import {
  ICheckShipingTypes,
  IMailBulkShippingAddress,
  IMailCheck,
  IPayeeEdit,
  IMailShippingCalculations,
  IShippingCostCalculation
} from 'src/app/modules/check/model/check';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
import {
  IV4SelectOption,
  V4SelectDropdownComponent
} from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';
import { V4CheckAddAttachmentModalComponent } from 'src/app/modules/check/modal/v4-check-add-attachment-modal/v4-check-add-attachment-modal.component';
import { UpdatePayeeModalV4Component } from 'src/app/modules/check/modal/mail-modals/update-payee-modal-v4/update-payee-modal-v4.component';
import { AddMailAddressModalV4Component } from 'src/app/modules/check/modal/mail-modals/add-mail-address-modal-v4/add-mail-address-modal-v4.component';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { GroupMailingService } from '../../../services/group-mailing.service';
import { IChequeData, IMailPayload } from '../../../models/group-mailing.model';
import { V4MultiCheckStepperComponent } from '../../components/v4-multi-check-stepper/v4-multi-check-stepper.component';

@Component({
  selector: 'app-v4-multi-check-mail-wizard',
  templateUrl: './v4-multi-check-mail-wizard.component.html',
  styleUrls: ['./v4-multi-check-mail-wizard.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV4Component,
    V4ControlMessageComponent,
    MatTooltip,
    LucideAngularModule,
    NgClass,
    CurrencyPipe,
    V4SelectDropdownComponent,
    DatePipe,
    V4MultiCheckStepperComponent
  ]
})
export class V4MultiCheckMailWizardComponent implements OnInit {
  private groupMailingService = inject(GroupMailingService);
  private router = inject(Router);
  public alertService = inject(V4AlertService);
  private datePipe = inject(DatePipe);
  private dialog = inject(MatDialog);
  private checkService = inject(CheckService);
  private payeeService = inject(PayeeService);
  private bankModalService = inject(BankModalService);
  private destroyRef = inject(DestroyRef);

  shippingTypeList: ICheckShipingTypes[] = [];
  customShippingTypeList: ICheckShipingTypes[] = [];

  submitting = signal<boolean>(false);
  isProcessingStep4 = signal<boolean>(false);
  batch_id: string | undefined = '';
  batch_name: string = '';
  originalBatchId: string | undefined = '';
  data: Params;
  headerOptions: { key: string; value: string }[] = [];
  headerColumns: { selectedIndex: string; required: boolean }[] = [];
  disableMapping: Params = {};
  checkData = signal<IChequeData[]>([]);
  isBankValidationError = signal<boolean>(false);
  isValidationError = signal<boolean>(false);
  showErrorPage = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  showResettingMapping = signal<boolean>(true);
  isRowDataSaved: { [key: number]: boolean } = {};
  validationData = signal<IChequeData[]>([]);
  batchIdEditing = signal<boolean>(false);
  isStep3Completed = signal<boolean>(false);
  needsConfirmation = signal<boolean>(false);
  isConfirming = signal<boolean>(false);
  isSendingMail = signal<boolean>(false);
  isFirstTimeSuccess = signal<boolean>(false);
  editDisable = signal<boolean>(false);

  checkSummaryData = signal<IMailCheck[]>([]);
  showCheckSummary = signal<boolean>(false);
  shipToAddress = signal<'payee' | 'custom'>('payee');
  shippingAddressFrom: IMailBulkShippingAddress[] = [];
  shippingAddressTo: IMailBulkShippingAddress[] = [];
  currentMailFrom = '';
  currentMailTo = '';
  isMailFromEditable = signal<boolean>(false);
  isMailToEditable = signal<boolean>(false);
  mailFromId: string;
  mailToId: string;
  isRefreshed = signal<boolean>(false);
  customShippingType = '';
  shippingFee = 0;
  isEnvelopeChecked = signal<boolean>(false);
  showSelectionShippingType = signal<boolean>(false);
  showReviewandSubmit = signal<boolean>(false);

  totalAmount = signal<number>(0);

  activeStep = computed<number>(() => {
    if (this.showReviewandSubmit()) return 5;
    if (this.showSelectionShippingType()) return 4;
    if (this.showCheckSummary()) return 3;
    return 2;
  });

  // Attachment properties
  attachments: { [key: string]: string[] | undefined } = {};
  checksWithAttachments: { chequeNo: string; encId: string }[] = [];
  shippingCalculation: IShippingCostCalculation = {
    page_cost: '0',
    single_items: {},
    total: '0',
    subTotal: '0',
    group_shipping_fee: '0',
    subtotal: '0'
  };
  autoAttachmentForMail = signal<boolean>(false);

  costCalculation: IMailShippingCalculations = {
    mail_check_ids: [],
    all_check_ids: [],
    shipping_rate_warning: 0,
    sent_to_customer_address: 0,
    Single_mail_options: 1,
    individual_envelope: 0,
    custom_address_shipping_type: 0,
    shipping_from: null,
    shipping_to: null
  };

  // Shipping type selection for each check
  selectedShippingTypes: { [key: string]: string } = {};
  subtotal = signal<number>(0);

  // Form controls for validation
  mailFromControl = new FormControl('', [Validators.required]);
  mailToControl = new FormControl('', [Validators.required]);
  shippingTypeControl = new FormControl('', [Validators.required]);

  requiredFields = ['0', '1', '2', '3', '4', '7', '9', '10', '11', '12', '15'];
  // Mail-specific table headers
  tableHeaders = [
    'Row No',
    'Bank Routing',
    'Bank Account',
    'Bank Nickname',
    'Amount',
    'Payee Name',
    'Payee Nickname',
    'Company',
    'Address Line 1',
    'Address Line 2',
    'City',
    'State',
    'Zip',
    'Phone',
    'Email',
    'Shipping Type',
    'Invoice#',
    'Memo',
    'Category',
    'Check Date',
    'Attachment',
    'Custom Field'
  ] as const;

  // Mail-specific table fields mapping (snake_case to match IChequeData)
  tableFields: string[] = [
    'bank_routing_number',
    'bank_account_number',
    'bank_account_nick_name',
    'amount',
    'payee_name',
    'payee_nickname',
    'payee_company',
    'payee_address_line_1',
    'payee_address_line_2',
    'payee_city',
    'payee_state',
    'payee_country',
    'payee_zip',
    'payee_phone',
    'payee_email',
    'mail_type',
    'invoice_number',
    'memo',
    'category',
    'check_date',
    'attachment',
    'custom_field'
  ];

  // Field mapping options for dropdown
  fieldMappingOptions = [
    { key: '0', value: 'Bank Routing Number' },
    { key: '1', value: 'Bank Account Number' },
    { key: '2', value: 'Bank Account Nick Name' },
    { key: '3', value: 'Amount' },
    { key: '4', value: 'Payee Name' },
    { key: '5', value: 'Payee Nick Name' },
    { key: '6', value: 'Payee Company' },
    { key: '7', value: 'Payee Address Line 1' },
    { key: '8', value: 'Payee Address Line 2' },
    { key: '9', value: 'Payee City' },
    { key: '10', value: 'Payee State' },
    { key: '11', value: 'Payee Country' },
    { key: '12', value: 'Payee Zip' },
    { key: '13', value: 'Payee Phone' },
    { key: '14', value: 'Payee Email' },
    { key: '15', value: 'Shipping Type' },
    { key: '16', value: 'Invoice Number' },
    { key: '17', value: 'Memo' },
    { key: '18', value: 'Category' },
    { key: '19', value: 'Check Date' },
    { key: '20', value: 'Attachment' },
    { key: '21', value: 'Custom Field' },
    { key: '22', value: 'Check Stub Items' }
  ];

  mailingTypes = [
    {
      key: 'payee' as const,
      value: 'Single Mail',
      icon: 'mail',
      accent: 'blue' as const,
      description:
        "Mail one individual check to either the payee's address or a custom address. Use for urgent or one-off payments.",
      features: [
        { key: 'individualTracking', value: 'Individual tracking' },
        { key: 'priorityHandling', value: 'Priority handling' },
        {
          key: 'idealForOneTimePayments',
          value: 'Ideal for one-time payments'
        }
      ],
      tooltip:
        'Each check is mailed separately with its own tracking number and faster delivery.'
    },
    {
      key: 'custom' as const,
      value: 'Bundle Mail',
      icon: 'package',
      accent: 'orange' as const,
      description:
        'All checks are bundled together and mailed to one single custom address. Most cost-effective for bulk delivery.',
      features: [
        { key: 'bulkDelivery', value: 'Single tracking number' },
        { key: 'costEffective', value: 'Lower cost for bulk' },
        { key: 'idealForOfficeMailings', value: 'Ideal for office mailings' }
      ],
      tooltip:
        'All checks are mailed together in one package single tracking number.Lower cost and ideal for bulk mailing.'
    }
  ];

  shippingTypesTimings = [
    { id: 1, time: '1-5 business days' },
    { id: 2, time: '1-5 business days' },
    { id: 3, time: '1-3 business days' },
    { id: 4, time: '1 business day' },
    { id: 5, time: '2 business days' },
    { id: 6, time: '1-5 business days' },
    { id: 7, time: '1-3 business days' },
    { id: 8, time: '1 business day' },
    { id: 9, time: '2 business days' },
    { id: 10, time: '1-5 business days' },
    { id: 11, time: '1-3 business days' },
    { id: 12, time: '1 business day' },
    { id: 13, time: '1-5 business days' },
    { id: 14, time: '1-3 business days' },
    { id: 15, time: '1 business day' },
    { id: 16, time: '1-5 business days' },
    { id: 17, time: '1 business day' },
    { id: 18, time: '7-21 business days' },
    { id: 19, time: '3-5 business days' }
  ];

  ngOnInit(): void {
    this.data =
      typeof history.state.res === 'string'
        ? JSON.parse(history.state.res)
        : history.state.res;

    // Get batch_name from navigation state
    this.batch_name = history.state.batchName || '';

    this.formatCheckData();
    this.getShippingTypes();
    this.headerOptions = this.makeHeader(this.data.header[0]);

    // Load shipping addresses
    this.loadShippingAddressFrom(false);
    this.loadShippingAddressTo();
    // Initialize header columns with required flag
    for (let i = 0; i < 23; i += 1) {
      this.headerColumns.push({
        selectedIndex: '',
        required: this.requiredFields.includes(String(i))
      });
    }
    // Auto-map headers based on API response
    this.autoMapHeaders(this.data.header[0]);
  }

  formatCheckData() {
    // Display only first 5 rows as preview
    for (
      let i = 0;
      i < Math.min(5, this.data?.chequeData?.length || 0);
      i += 1
    ) {
      const row = this.data.chequeData[i];
      const obj: Params = {};

      Object.keys(row).forEach((key) => {
        if (typeof row[key] === 'object' && row[key]?.date) {
          obj[key] = this.datePipe.transform(row[key].date, 'shortDate');
        } else {
          obj[key] = row[key];
        }
      });
      this.checkData.update((prev) => [...prev, obj as IChequeData]);
    }
  }

  makeHeader(data: {
    [key: string]: string;
  }): { key: string; value: string }[] {
    const headers: { key: string; value: string }[] = [];
    Object.entries(data).forEach(([key, value]) => {
      headers.push({ key, value });
    });
    return headers;
  }

  /**
   * Auto-maps API headers to predefined field options
   */
  autoMapHeaders(apiHeaders: string[]): void {
    apiHeaders.forEach((header, index) => {
      if (index < this.headerColumns.length) {
        const matchedKey = this.findBestMatch(header);
        if (matchedKey) {
          this.headerColumns[index].selectedIndex = matchedKey;
        }
      }
    });
    // Update disabled options after auto-mapping
    this.mappingChange();
  }

  /**
   * Finds the best matching field option for a given header
   */
  private findBestMatch(header: string): string | null {
    const normalizedHeader = this.normalizeString(header);

    // First try exact matches
    const exactMatch = this.fieldMappingOptions.find(
      (option) => this.normalizeString(option.value) === normalizedHeader
    );
    if (exactMatch) {
      return exactMatch.key;
    }
    return null;
  }

  /**
   * Normalizes a string for comparison (removes special chars, converts to lowercase)
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Enhanced mapping change that handles auto-selections
   */
  mappingChange(): void {
    this.disableMapping = {};
    this.headerColumns.forEach((item: { selectedIndex: string | number }) => {
      if (item.selectedIndex) {
        this.disableMapping[item.selectedIndex] = !Number.isNaN(
          item.selectedIndex as number
        );
      }
    });
  }

  /**
   * Checks if a field is auto-mapped
   */
  isAutoMapped(columnIndex: number): boolean {
    return this.headerColumns[columnIndex]?.selectedIndex !== '';
  }

  /**
   * Check if a header column is required (for display purposes)
   */
  isHeaderColumnRequired(columnIndex: number): boolean {
    return this.headerColumns[columnIndex]?.required || false;
  }

  getMappedFieldCount(): number {
    return this.headerColumns.filter((col) => col.selectedIndex !== '').length;
  }

  getColumnDropdownOptions(columnIndex: number): IV4SelectOption[] {
    const currentValue = this.headerColumns[columnIndex]?.selectedIndex;
    const placeholderOption: IV4SelectOption = {
      id: '',
      name: '-- Match Field --',
      value: ''
    };
    const options = this.headerOptions.map((opt) => ({
      id: opt.key,
      name: opt.value,
      value: opt.key,
      disabled:
        !!this.disableMapping[opt.key] && opt.key !== currentValue
    }));
    return [placeholderOption, ...options];
  }

  onColumnMappingChange(columnIndex: number, value: string): void {
    if (this.headerColumns[columnIndex]) {
      this.headerColumns[columnIndex].selectedIndex = value;
      this.mappingChange();
    }
  }

  /**
   * Resets all mappings to allow re-mapping while preserving required field flags
   */
  resetMappings(): void {
    this.headerColumns.forEach((column) => {
      column.selectedIndex = '';
    });
    this.mappingChange();
  }

  /**
   * Handles validation errors from Step 3
   */
  private handleValidationErrors(data: IChequeData[], batch_id: string): void {
    this.alertService.failedAlert({
      content: 'Please correct the highlighted fields.'
    });

    this.batch_id = batch_id;
    this.showErrorPage.set(true);
    this.isStep3Completed.set(true);
    this.needsConfirmation.set(true);
    this.isFirstTimeSuccess.set(false);
    this.isRowDataSaved = {};

    // Update data with validation errors
    this.validationData.set(data);
    this.checkData.update(() => [...data]);
    this.checkValidation(data);
  }

  /**
   * Handles successful validation from Step 3
   */
  private handleValidationSuccess(data: IChequeData[], batch_id: string): void {
    this.batch_id = batch_id;

    // Proceed directly to Step 4 without showing success alert
    const submitData = {
      checkData: data,
      batch_id: batch_id || ''
    };

    this.submitMailImportStep3Data(submitData);

    // Reset flags after successful validation
    this.needsConfirmation.set(false);
    this.isStep3Completed.set(false);
    this.isFirstTimeSuccess.set(false);
  }

  /**
   * Called when user clicks Confirm button
   * Validates data and proceeds to Step 4
   */
  confirmAndProceed(): void {
    if (!this.needsConfirmation()) {
      return;
    }

    // Check if checkData exists and has valid data
    if (!this.checkData() || this.checkData().length === 0) {
      this.alertService.failedAlert({
        content:
          'No check data available. Please submit data first to proceed.'
      });
      return;
    }

    // Cancel all editing states - convert input fields back to text
    this.checkData.update((prev) =>
      prev.map((item) => ({
        ...item,
        isEditing: false
      }))
    );

    // Reset the global editing flag
    this.isEditing.set(false);

    // If data was successfully validated on first go (no errors),
    // directly proceed to Step 4 without re-validation
    if (this.isFirstTimeSuccess()) {
      const submitData = {
        checkData: this.checkData(),
        batch_id: this.batch_id || ''
      };
      this.submitMailImportStep3Data(submitData);
      return;
    }

    // Otherwise, call submit() for re-validation (error correction scenario)
    this.submit();
  }

  /**
   * Resets validation state
   */
  private resetValidationState(): void {
    this.needsConfirmation.set(false);
    this.isStep3Completed.set(false);
    this.isConfirming.set(false);
    this.showErrorPage.set(false);
    this.isFirstTimeSuccess.set(false);
  }

  submit(isProceedAnyWay?: boolean) {
    const fieldNames: { [key: string]: string } = {
      0: 'Bank Routing Number',
      1: 'Bank Account Number',
      2: 'Bank Account Nick Name',
      3: 'Amount',
      4: 'Payee Name',
      7: 'Payee Address Line 1',
      9: 'Payee City',
      10: 'Payee State',
      11: 'Payee Country',
      12: 'Payee Zip',
      15: 'Shipping Type'
    };

    // Check which required fields are not mapped
    const missedValues: string[] = [];

    this.requiredFields.forEach((reqField: string) => {
      const isMapped = this.headerColumns.some(
        (col) => col.selectedIndex === reqField
      );
      if (!isMapped) {
        missedValues.push(fieldNames[reqField]);
      }
    });

    // Show alert if required fields are not mapped
    if (missedValues.length > 0) {
      this.alertService.failedAlert({
        content: `Please map the following required fields: ${missedValues.join(', ')}`
      });
      this.submitting.set(false);
      this.isConfirming.set(false);
      return;
    }

    const confirmAlert = this.openConfirmAlert(
      'Are you sure you want to proceed?'
    );

    confirmAlert
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.showResettingMapping.set(false);
        if (res) {
          // All required fields are mapped, proceed with API call
          const mapping = this.headerColumns.map((row) => row.selectedIndex);

          const body: {
            mapping: string[];
            uploadFromImport: string;
            proceedForCheckNumber: number;
            batch_id?: string;
            batch_name?: string;
          } = {
            mapping,
            uploadFromImport: 'yes',
            proceedForCheckNumber: isProceedAnyWay ? 1 : 0
          };

          if (this.batch_id) {
            body.batch_id = this.batch_id;
          }

          if (this.batch_name) {
            body.batch_name = this.batch_name;
          }

          // Set appropriate loading flag based on context
          if (this.needsConfirmation()) {
            this.isConfirming.set(true);
          } else {
            this.submitting.set(true);
          }

          this.groupMailingService
            .processMultiCheckMailStep2(body)
            .pipe(
              takeUntilDestroyed(this.destroyRef),
              finalize(() => {
                this.submitting.set(false);
                this.isConfirming.set(false);
              })
            )
            .subscribe({
              next: (data) => {
                if (data?.success) {
                  if (data?.errorCode === 101) {
                    this.showResettingMapping.set(true);
                    this.handleValidationErrors(
                      data.data,
                      data?.batch_id || ''
                    );
                  } else {
                    this.showResettingMapping.set(false);
                    // Success case - directly call submitMailImportStep3Data without showing alert
                    this.handleValidationSuccess(
                      data.data,
                      data?.batch_id || ''
                    );
                    this.showErrorPage.set(false);
                  }
                }
              },
              error: (err) => {
                this.submitting.set(false);
                this.isConfirming.set(false);
                this.showResettingMapping.set(true);
                if (err.error.errorCode === 190) {
                  this.proceedModal(err.error.errorMsg);
                }
              }
            });
        } else {
          this.showResettingMapping.set(true);
          this.submitting.set(false);
          this.isConfirming.set(false);
        }
      });
  }

  submitMailImportStep3Data(data: {
    checkData: IChequeData[];
    batch_id: string;
  }) {
    // Check if checkData exists and has valid data
    if (!data.checkData || data.checkData.length === 0) {
      this.alertService.failedAlert({
        content:
          'No check data available. Please submit data first to proceed.'
      });
      return;
    }

    this.isProcessingStep4.set(true);
    this.batch_id = data.batch_id;
    const entry =
      data?.checkData?.map((item: IChequeData) => item.row_id) || [];
    const submitData = {
      entry: entry as string[],
      checkData: data.checkData,
      batch_id: data.batch_id
    };

    this.groupMailingService
      .submitMailImportStep3Data(submitData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isProcessingStep4.set(false);
        })
      )
      .subscribe((res) => {
        if (res?.success && res?.check_ids) {
          // Prepare request similar to check-mail-modal
          const checkDetailsRequest: {
            ids: string[];
            is_signature?: 0 | 1 | undefined;
          } = {
            ids: res.check_ids,
            is_signature: 1
          };

          // Fetch check details
          this.checkService
            .getChequeDetails(checkDetailsRequest)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((checkDetails) => {
              if (checkDetails?.success) {
                // Store check details and calculate total
                const checks = checkDetails.data?.datas || [];
                this.checkSummaryData.set(checks);

                // Calculate total amount
                const total = checks.reduce(
                  (sum: number, check: IMailCheck) =>
                    sum + parseFloat(check.cheque_amount || '0'),
                  0
                );
                this.totalAmount.set(total);

                this.showCheckSummary.set(true);
                this.showErrorPage.set(false);

                // Initialize attachments if checks have existing attachments
                this.initializeAttachments();

                // Fetch shipping calculation data with page cost
                this.fetchShippingCalculation(checks);
              }
            });
        }
      });
  }

  proceedModal(err: string) {
    const warn = this.openConfirmAlert('Do you want to proceed anyway?', err);
    warn
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
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

  updateBankDetails(item: IChequeData) {
    this.bankModalService
      .openAddBankV4Modal()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dialogRef) => {
        if (!dialogRef) return;
        dialogRef.componentInstance.skipVerification = true;
        dialogRef.afterClosed().subscribe((res) => {
          if (res?.success && res.bankAcData) {
            const rowIndex = item.row_number ? item.row_number - 1 : 0;

            this.checkData.update((prev) => {
              const updatedArray = [...prev];
              if (updatedArray[rowIndex]) {
                updatedArray[rowIndex] = {
                  ...updatedArray[rowIndex],
                  bank_account_number: (res.bankAcData as { bankAccountNumber: string }).bankAccountNumber,
                  bank_routing_number: String((res.bankAcData as { routingNumber: string | number }).routingNumber),
                  bank_account_nick_name: (res.bankAcData as { bankAccountNickName: string }).bankAccountNickName
                };
              }
              return updatedArray;
            });
          }
        });
      });
  }

  hasError(item: IChequeData, field?: string): boolean {
    if (!item.validation_error) return false;
    if (field) {
      return !!item.validation_error[
        field as keyof typeof item.validation_error
      ];
    }
    return !!item.validation_error;
  }

  editTransaction(row: IChequeData) {
    // Set editing state for specific row, reset others
    const updatedRow = row;
    updatedRow.isEditing = true;
    this.isEditing.set(true);
    this.checkData.update((prev) =>
      prev.map((item) =>
        item === row
          ? { ...item, isEditing: true }
          : { ...item, isEditing: false }
      )
    );

    this.isEditing.set(true);
  }

  deleteTransaction(row: IChequeData) {
    // Prevent stacking confirm dialogs on rapid/double clicks
    if (row.isDeleting) return;
    row.isDeleting = true;

    const confirmDelete = this.openConfirmAlert(
      'Are you sure you want to delete this row?'
    );

    confirmDelete
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirm) => {
        if (!confirm) {
          row.isDeleting = false;
          return;
        }

        // Local-only row (no server id yet) — drop it without an API call
        if (!row.row_id) {
          this.checkData.update((prev) => prev.filter((item) => item !== row));
          row.isDeleting = false;
          this.alertService.successAlert({ content: 'Row deleted.' });
          return;
        }

        this.groupMailingService
          .deleteMailRow(row.row_id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              if (res?.success) {
                this.checkData.update((prev) =>
                  prev.filter((item) => item !== row)
                );
                this.needsConfirmation.set(true);
                this.isStep3Completed.set(true);
                this.alertService.successAlert({ content: 'Row deleted.' });
              } else {
                this.alertService.failedAlert({
                  content: res?.message || 'Failed to delete row.'
                });
              }
              row.isDeleting = false;
            },
            error: (err) => {
              row.isDeleting = false;
              this.alertService.failedAlert({
                content: err?.error?.message || err?.error?.errorMsg || 'Failed to delete row.'
              });
            }
          });
      });
  }

  saveTransaction(row: IChequeData, i: number) {
    this.isEditing.set(false);
    const updatedRowData = row;
    updatedRowData.batch_id = this.batch_id || '';

    // Build a clean payload with only IChequeData fields (matching v3 behavior)
    const payload: Record<string, unknown> = {
      bank_routing_number: updatedRowData.bank_routing_number ?? '',
      bank_account_number: updatedRowData.bank_account_number ?? '',
      bank_account_nick_name: updatedRowData.bank_account_nick_name ?? '',
      amount: updatedRowData.amount ?? '',
      payee_name: updatedRowData.payee_name ?? '',
      payee_nickname: updatedRowData.payee_nickname ?? '',
      payee_company: updatedRowData.payee_company ?? '',
      payee_address_line_1: updatedRowData.payee_address_line_1 ?? '',
      payee_address_line_2: updatedRowData.payee_address_line_2 ?? '',
      payee_city: updatedRowData.payee_city ?? '',
      payee_state: updatedRowData.payee_state ?? '',
      payee_zip: updatedRowData.payee_zip ?? '',
      payee_country: updatedRowData.payee_country ?? '',
      payee_phone: updatedRowData.payee_phone ?? '',
      payee_email: updatedRowData.payee_email ?? '',
      mail_type: updatedRowData.mail_type ?? '',
      invoice_number: updatedRowData.invoice_number ?? '',
      memo: updatedRowData.memo ?? '',
      category: updatedRowData.category ?? '',
      check_date: updatedRowData.check_date ?? '',
      attachment: updatedRowData.attachment ?? '',
      custom_field: updatedRowData.custom_field ?? '',
      row_number: updatedRowData.row_number,
      row_id: updatedRowData.row_id,
      batch_id: updatedRowData.batch_id,
      attachment_id: updatedRowData.attachment_id
    };

    this.groupMailingService
      .editMailRow(payload as unknown as IChequeData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          updatedRowData.isEditing = false;
          this.isRowDataSaved[i] = true;
          const newData = this.checkData();
          newData[i] = updatedRowData;
          this.checkData.set(newData);

          this.isEditing.set(false);

          this.needsConfirmation.set(true);
          this.isStep3Completed.set(true);

          this.alertService.successAlert({
            content: 'Row updated.'
          });
        } else {
          this.isRowDataSaved[i] = false;
          this.alertService.failedAlert({ content: 'Data update failed' });
        }
      });
  }

  isRowSaved(i: number): boolean {
    return this.isRowDataSaved[i] || false;
  }

  checkValidation(data: IChequeData[], index?: number) {
    if (index) {
      const isValidationError = data[index].validation_error;
      const error = Object.keys(isValidationError || {}).some((key: string) => {
        if (isValidationError === null || isValidationError === undefined)
          return false;
        const errorValue =
          isValidationError?.[key as keyof typeof isValidationError];
        return (
          errorValue !== null && errorValue !== undefined && errorValue !== ''
        );
      });
      this.isValidationError.set(error);
      return;
    }
    const isValidationError = data.some((item: IChequeData) => {
      if (!item.validation_error) return false;
      return Object.keys(item.validation_error || {}).some((key: string) => {
        if (
          item.validation_error === null ||
          item.validation_error === undefined
        )
          return false;
        const errorValue =
          item.validation_error?.[key as keyof typeof item.validation_error];
        return (
          errorValue !== null && errorValue !== undefined && errorValue !== ''
        );
      });
    });
    this.isValidationError.set(isValidationError);
  }

  back() {
    if (this.showReviewandSubmit()) {
      this.backToMatchDataFromReview();
    } else if (this.showSelectionShippingType()) {
      this.showSelectionShippingType.set(false);
    } else if (this.showCheckSummary()) {
      this.showCheckSummary.set(false);
      this.showResettingMapping.set(true);
    } else if (this.showErrorPage() || this.isStep3Completed()) {
      this.resetValidationState();
      // Navigate back to previous step
      this.router.navigate([
        '/v4/manage/business-tools/mail-dashboard/multi-check-mail1-step1'
      ]);
    } else {
      this.router.navigate([
        '/v4/manage/business-tools/mail-dashboard/multi-check-mail1-step1'
      ]);
    }
  }

  /**
   * Gets the shipping cost for a specific check
   */
  getCheckShippingCost(checkId: string): string {
    if (this.shippingCalculation.single_items[checkId]) {
      return this.shippingCalculation.single_items[checkId].toString();
    }

    // Get cost based on check's mail_type
    const check = this.checkSummaryData().find((c) => c.enc_id === checkId);
    if (check && check.mail_type) {
      const shippingType = this.shippingTypeList.find(
        (type) => type.id === check.mail_type
      );
      if (shippingType) {
        const baseCost = parseFloat(shippingType.amount);
        const attachmentCount = this.attachments[checkId]?.length || 0;
        const attachmentCost =
          attachmentCount * (Number(this.shippingCalculation?.page_cost) || 0);
        return (baseCost + attachmentCost).toFixed(2);
      }
    }

    return '0.00';
  }

  /**
   * Fetches shipping calculation data from API including page cost
   */
  private fetchShippingCalculation(checks: IMailCheck[]): void {
    // Build cost calculation payload similar to check-mail-modal
    const costCalculation: IMailShippingCalculations = {
      mail_check_ids: checks.map((c) => c.enc_id),
      all_check_ids: checks.map((c) => c.enc_id),
      shipping_rate_warning: 0,
      sent_to_customer_address: this.shipToAddress() === 'custom' ? 1 : 0,
      Single_mail_options: 1,
      individual_envelope: this.isEnvelopeChecked() ? 1 : 0,
      custom_address_shipping_type: this.customShippingType
        ? Number(this.customShippingType)
        : 0
    };

    // Add individual check shipping data INCLUDING ATTACHMENTS
    checks.forEach((check) => {
      if (check.mail_type) {
        costCalculation[check.enc_id] = {
          mail_type: check.mail_type,
          check_paper: 1,
          informed_payee_sms: 0,
          informed_payee_email: 0,
          file_hidden: this.attachments[check.enc_id] || [],
          payee_phone: check.payee_phone || '',
          payee_email: check.payee_email || ''
        };
      }
    });

    // Call shipping calculation API
    this.checkService
      .ShippingCostCalculationGroup(costCalculation)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success && res?.data) {
          this.shippingCalculation = res.data;
          this.calculateSubtotal();
          // Update subtotal from API response
          if (res.data.subTotal !== undefined) {
            this.subtotal.set(parseFloat(res.data.subTotal));
          }

          // Update shipping fee if custom address
          if (res.data.group_shipping_fee !== undefined) {
            this.shippingFee = parseFloat(res.data.group_shipping_fee);
          }
        }
      });
  }

  /**
   * Calculates the subtotal for all checks (shipping costs only)
   */
  private calculateSubtotal(): void {
    // Use API response subtotal if available, otherwise calculate manually
    if (
      this.shippingCalculation &&
      this.shippingCalculation.subtotal !== undefined
    ) {
      this.subtotal.set(parseFloat(this.shippingCalculation.subtotal));
    } else {
      // Fallback: calculate manually
      let total = 0;
      const checks = this.checkSummaryData();

      checks.forEach((check) => {
        const cost = this.getCheckShippingCost(check.enc_id);
        total += parseFloat(cost);
      });

      this.subtotal.set(total);
    }
  }

  /**
   * Calculates grand total (check amounts + shipping costs)
   */
  calculateGrandTotal(): number {
    const shippingTotal = this.subtotal() || 0;
    return this.shippingFee + shippingTotal;
  }

  /**
   * Opens the attachment modal for a specific check
   */
  openAttachmentModal(checkId: string): void {
    const attachmentModal = this.dialog.open(V4CheckAddAttachmentModalComponent, {
      disableClose: true,
      maxWidth: '1010px',
      width: '630px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        checkId,
        acceptFormats: '.pdf',
        attachId: this.attachments[checkId],
        type: 'mail',
        cost: this.shippingCalculation?.page_cost,
        isBulkImport: true
      }
    });

    attachmentModal
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        (data: { checkId: string; ids: string[]; fileName: string }) => {
          if (data) {
            // Remove from checksWithAttachments if exists
            if (this.checksWithAttachments?.length) {
              this.checksWithAttachments = this.checksWithAttachments.filter(
                (checkAttachment) => checkAttachment.encId !== checkId
              );
            }

            // Store attachment data
            this.attachments[data.checkId] = data.ids;

            // Re-fetch shipping calculation from API with attachment data
            const checks = this.checkSummaryData();
            this.fetchShippingCalculation(checks);
          }
        }
      );
  }

  /**
   * Open Add/Edit Mail Address Modal
   */
  openAddMailAddressModal(event: string) {
    if (event === 'mail-to' || event === 'mail-from') {
      const addMailAddress = this.dialog.open(AddMailAddressModalV4Component, {
        panelClass: 'paddingless-modal-rounded',
        maxWidth: '700px',
        width: '98%',
        autoFocus: false,
        disableClose: true,
        data: {
          dataKey: event,
          isForUpdate: this.isForUpdate(event),
          id: event === 'mail-to' ? this.mailToId : this.mailFromId
        }
      });

      addMailAddress.afterClosed().subscribe((data) => {
        if (data && data !== 'delete' && data.mode !== 'update') {
          // Handle create mode
          if (data.type === 'mail-from') {
            this.isRefreshed.set(this.loadShippingAddressFrom(true));
            this.currentMailFrom = data.id;
          } else {
            this.loadShippingAddressTo(
              data.id,
              data?.data?.name,
              data?.data?.country
            );
            this.currentMailTo = data.id;
          }
          // Set edit flags and trigger calculations
          this.setEditFlagsAndCalculate(data);
        }

        if (data && data.mode === 'update') {
          // Handle update mode
          this.handleAddressUpdate(data);
        }

        if (data.type === 'delete') {
          // Handle delete mode
          this.handleAddressDelete(data);
        }
      });
    }
  }

  /**
   * Check if address is in edit mode
   */
  isForUpdate(mailAddressTracker: string) {
    if (mailAddressTracker === 'mail-from') {
      return this.isMailFromEditable() === true;
    }
    if (mailAddressTracker === 'mail-to') {
      return this.isMailToEditable() === true;
    }
    return false;
  }

  /**
   * Load shipping addresses from API
   */
  loadShippingAddressFrom(val: boolean): boolean {
    this.checkService
      .getAddressFrom()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.shippingAddressFrom = res.data;
      });
    if (val) {
      return val;
    }
    return false;
  }

  /**
   * Load shipping addresses to API
   */
  loadShippingAddressTo(
    toId?: string,
    mailToName?: string,
    mailToCountry?: string
  ) {
    this.checkService
      .getAddressTo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.shippingAddressTo = res.data;
        if (toId) {
          this.currentMailTo = toId;
          this.setCurrentMailTo({
            result: true,
            data: {
              name: mailToName ?? '',
              country: mailToCountry ?? ''
            },
            id: toId,
            type: 'mail-to'
          });
        }
      });
  }

  /**
   * Set current mail to address
   */
  setCurrentMailTo(data: {
    result: boolean;
    data: { name: string; country: string };
    id: string;
    type: string;
  }) {
    this.shippingAddressTo.forEach((element) => {
      if (element.name === data.data.name) {
        this.mailToId = data.id;
        this.isMailToEditable.set(true);
        this.onMailToChange(this.mailToId);
      } else {
        this.isMailToEditable.set(false);
      }
    });
  }

  /**
   * Set edit flags and calculate shipping
   */
  setEditFlagsAndCalculate(data: { type: string; id: string; mode?: string }) {
    if (
      this.isRefreshed() &&
      data.type === 'mail-from' &&
      data.mode !== 'update'
    ) {
      this.mailFromId = data.id;
      this.currentMailFrom = data.id;
      this.isMailFromEditable.set(true);
      this.onMailFromChange(data.id);
    }
  }

  /**
   * Handle address update
   */
  handleAddressUpdate(data: { type: string; id: string; mode?: string }) {
    if (data.type === 'mail-from') {
      this.isRefreshed.set(this.loadShippingAddressFrom(true));
    } else {
      this.loadShippingAddressTo();
    }

    if (this.isRefreshed() === true && data.type === 'mail-from') {
      this.mailFromId = data.id;
      this.currentMailFrom = data.id;
      this.isMailFromEditable.set(true);
    } else if (data.type === 'mail-to') {
      this.mailToId = data.id;
      this.currentMailTo = data.id;
      this.isMailToEditable.set(true);
    }
  }

  /**
   * Handle address delete
   */
  handleAddressDelete(data: { type: string; id: string; mode?: string }) {
    if (data.type === 'delete' && data.mode === 'mail-from') {
      this.currentMailFrom = '';
      this.isMailFromEditable.set(false);
      this.loadShippingAddressFrom(true);
    }

    if (data.type === 'delete' && data.mode === 'mail-To') {
      this.currentMailTo = '';
      this.isMailToEditable.set(false);
    }
  }

  /**
   * Open Edit Payee Address Modal
   */
  openEditPayeeAdress(enc_payee_id: string, checkNo: string, checkid: string) {
    this.editDisable.set(true);

    this.payeeService
      .showPayee(enc_payee_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((re) => {
        const EditPayeeData: IViewPayee = re.data;

        if (EditPayeeData) {
          const dialogRef = this.dialog.open(UpdatePayeeModalV4Component, {
            disableClose: true,
            maxWidth: '95%',
            width: '1000px',
            panelClass: 'paddingless-modal-rounded',
            data: {
              checkNo,
              EditPayeeData,
              id: enc_payee_id,
              checkid,
              isCountryReadonly: true
            }
          });

          dialogRef.afterClosed().subscribe((res) => {
            this.editDisable.set(false);

            if (res && res.data) {
              // Update local check data after address update
              res.data.forEach((ele: IPayeeEdit) => {
                const currentData = this.checkSummaryData();
                const updatedData = currentData.map((check) => {
                  if (check.enc_id === checkid) {
                    return {
                      ...check,
                      payee_name: ele.name || check.payee_name,
                      zip: ele.zip || check.zip,
                      payee_email: ele.payeeEmail || check.payee_email,
                      payee_phone: ele.PayeePhone || check.payee_phone
                    };
                  }
                  return check;
                });
                this.checkSummaryData.set(updatedData);
              });

              // Show success message
              this.alertService.successAlert({
                title: 'Success',
                content: 'Payee address updated',
                close: true,
                timeout: 2000
              });
            }
          });
        }
      });
  }

  /**
   * Initialize attachments from existing check data
   */
  private initializeAttachments(): void {
    const checks = this.checkSummaryData();
    checks.forEach((check: IMailCheck) => {
      // Check for existing attachments using available properties
      if (check.is_exisiting_attach) {
        // Initialize empty array for now - will be populated when modal opens
        this.attachments[check.enc_id] = check.attachments || [];
      }
    });
  }

  proceedToMailing() {
    // Check validation for custom shipping type
    if (this.shipToAddress() === 'custom') {
      // Mark all controls as touched to show validation messages
      this.mailFromControl.markAsTouched();
      this.mailToControl.markAsTouched();
      this.shippingTypeControl.markAsTouched();

      // Check if any validation errors exist
      if (
        this.mailFromControl.invalid ||
        this.mailToControl.invalid ||
        this.shippingTypeControl.invalid
      ) {
        this.alertService.warningAlert({
          content: 'Please fill in all required fields for custom shipping',
          close: true,
          timeout: 2000
        });
        return;
      }
    }

    // Show review and submit section
    this.showSelectionShippingType.set(false);
    this.showReviewandSubmit.set(true);
  }

  sendMailNow() {
    const confirmAlert = this.openConfirmAlert(
      'Are you sure you want to proceed?'
    );

    confirmAlert
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.isSendingMail.set(true);
          const checks = this.checkSummaryData();

          const payload: IMailPayload = {
            batch_id: this.batch_id as string,
            sent_to_customer_address:
              this.shipToAddress() === 'payee' ? 0 : 1,
            mail_check_ids: checks.map((check) => check.enc_id)
          };

          // Add shipping addresses if custom - use costCalculation object values
          if (this.shipToAddress() === 'custom') {
            // Use values from costCalculation object (guaranteed to be set)
            if (this.costCalculation.shipping_from) {
              payload.shipping_from = this.costCalculation.shipping_from;
            }
            if (this.costCalculation.shipping_to) {
              payload.shipping_to = this.costCalculation.shipping_to;
            }
            if (this.costCalculation.custom_address_shipping_type) {
              payload.custom_address_shipping_type =
                this.costCalculation.custom_address_shipping_type;
            }

            // Add additional shipping calculation fields
            payload.Single_mail_options =
              this.costCalculation.Single_mail_options || 1;
            payload.individual_envelope =
              this.costCalculation.individual_envelope || 0;
            payload.shipping_rate_warning =
              this.costCalculation.shipping_rate_warning || 0;
            payload.all_check_ids =
              this.costCalculation.all_check_ids || payload.mail_check_ids;
          }

          // Add per-check details - use existing data including attachments
          checks.forEach((check) => {
            payload[check.enc_id] = {
              mail_type: check.mail_type.toString(),
              check_paper: 7,
              informed_payee_sms: check.informed_payee_sms ? 1 : 0,
              informed_payee_email: check.informed_payee_email ? 1 : 0,
              payee_phone: check.payee_phone || '',
              payee_email: check.payee_email || '',
              file_hidden: this.attachments[check.enc_id] || []
            };
          });

          this.groupMailingService
            .submitMailImport(payload)
            .pipe(
              takeUntilDestroyed(this.destroyRef),
              finalize(() => {
                this.isSendingMail.set(false);
              })
            )
            .subscribe((response) => {
              if (response.success) {
                this.router.navigate([
                  '/v4/manage/business-tools/mail-dashboard/multi-check-mail-table'
                ]);
              }
            });
        }
      });
  }

  editShippingDetails() {
    this.showReviewandSubmit.set(false);
    this.showSelectionShippingType.set(true);
  }

  backToMatchDataFromReview() {
    this.showReviewandSubmit.set(false);
    this.showSelectionShippingType.set(false);
    this.showCheckSummary.set(false);
    this.showResettingMapping.set(true);
  }

  getMailFromAddress(): string {
    if (!this.currentMailFrom) return '';
    const address = this.shippingAddressFrom.find(
      (addr) => addr.id === this.mailFromId
    );
    return address?.name || this.currentMailFrom;
  }

  getMailToAddress(): string {
    if (!this.currentMailTo) return '';
    const address = this.shippingAddressTo.find(
      (addr) => addr.id === this.mailToId
    );
    return address?.name || this.currentMailTo;
  }

  getCustomShippingTypeInfo(): { name: string; deliveryTime: string } {
    const shippingTypeId = this.customShippingType
      ? Number(this.customShippingType)
      : this.costCalculation.custom_address_shipping_type || 0;

    if (!shippingTypeId) {
      return { name: '', deliveryTime: '' };
    }

    // Get shipping type name from customShippingTypeList or shippingTypeList
    const shippingType =
      this.customShippingTypeList.find((st) => st.id === shippingTypeId) ||
      this.shippingTypeList.find((st) => st.id === shippingTypeId);

    const name = shippingType?.name || '';

    // Get delivery time from shippingTypesTimings
    const timing = this.shippingTypesTimings.find(
      (st) => st.id === shippingTypeId
    );
    const deliveryTime = timing?.time || '';

    return { name, deliveryTime };
  }

  getCustomShippingTypeName(): string {
    return this.getCustomShippingTypeInfo().name;
  }

  getEstimatedDeliveryDays(): string {
    return this.getCustomShippingTypeInfo().deliveryTime;
  }

  getTotalChecksCount(): number {
    return this.checkSummaryData().length;
  }

  toggleShipToAddress(type: 'payee' | 'custom') {
    this.shipToAddress.set(type);

    if (type === 'custom') {
      this.costCalculation.sent_to_customer_address = 0;
      this.costCalculation.custom_address_shipping_type = 0;
      this.costCalculation.shipping_from = null;
      this.costCalculation.shipping_to = null;

      // Reset shipping calculations
      this.updateShippingCalculations();
      this.onMailFromChange('');
      this.onMailToChange('');
      this.onCustomShippingTypeChange('');
      this.mailFromControl.reset();
      this.mailToControl.reset();
      this.shippingTypeControl.reset();

      // Load custom address options if not already loaded
      if (!this.shippingAddressFrom.length) {
        this.loadShippingAddressFrom(false);
      }
      if (!this.shippingAddressTo.length) {
        this.loadShippingAddressTo();
      }
    } else {
      // Reset for payee address
      this.costCalculation.sent_to_customer_address = 0;
      this.costCalculation.custom_address_shipping_type = 0;
      this.costCalculation.shipping_from = null;
      this.costCalculation.shipping_to = null;

      // Recalculate with payee address
      this.calculateShippingCost();
    }
  }

  onMailFromChange(selectedId: string) {
    this.currentMailFrom = selectedId;
    this.mailFromId = selectedId;

    // Update form control
    this.mailFromControl.setValue(selectedId);
    this.mailFromControl.markAsTouched();

    // Set edit flag
    this.isMailFromEditable.set(selectedId !== '' && selectedId !== '0');

    // Update costCalculation object
    if (selectedId && selectedId !== '') {
      // Call API to get address details
      this.checkService
        .getFromSingleId(selectedId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          this.costCalculation.shipping_from = res.data.id;
          this.calculateShippingCost();
        });
    }
  }

  onMailToChange(selectedId: string) {
    this.currentMailTo = selectedId;
    this.mailToId = selectedId;

    // Update form control
    this.mailToControl.setValue(selectedId);
    this.mailToControl.markAsTouched();

    // Set edit flag
    this.isMailToEditable.set(selectedId !== '' && selectedId !== '0');

    // Update costCalculation object
    if (selectedId && selectedId !== '') {
      // Call API to get address details and auto-select shipping type
      this.checkService
        .getToSingleId(selectedId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          this.costCalculation.shipping_to = res.data.id;
          this.costCalculation.sent_to_customer_address = 1;
          // Auto-select shipping type based on country
          if (res.data.country === 'Canada') {
            this.customShippingTypeList = this.shippingTypeList.filter(
              (type) => type.country === res.data.country && type.id === 16
            );
            if (this.customShippingTypeList.length > 0) {
              this.costCalculation.custom_address_shipping_type =
                this.customShippingTypeList[0].id;
              this.customShippingType =
                this.customShippingTypeList[0].id.toString();
              // Update shipping type form control
              this.shippingTypeControl.setValue(this.customShippingType);
              this.shippingTypeControl.markAsTouched();
            }
          } else if (res.data.country === 'United States') {
            this.customShippingTypeList = this.shippingTypeList.filter(
              (type) => type.id === 4 || type.id === 5 || type.id === 12
            );
            if (this.customShippingTypeList.length > 0) {
              this.costCalculation.custom_address_shipping_type =
                this.customShippingTypeList[0].id;
              this.customShippingType =
                this.customShippingTypeList[0].id.toString();
              // Update shipping type form control
              this.shippingTypeControl.setValue(this.customShippingType);
              this.shippingTypeControl.markAsTouched();
            }
          } else {
            this.customShippingTypeList = this.shippingTypeList.filter(
              (type) => type.country === 'International' && type.id === 18
            );
            if (this.customShippingTypeList.length > 0) {
              this.costCalculation.custom_address_shipping_type =
                this.customShippingTypeList[0].id;
              this.customShippingType =
                this.customShippingTypeList[0].id.toString();
              // Update shipping type form control
              this.shippingTypeControl.setValue(this.customShippingType);
              this.shippingTypeControl.markAsTouched();
            }
          }
          this.calculateShippingCost();
        });
    }
  }

  // Handle custom shipping type change
  onCustomShippingTypeChange(shippingTypeId: string) {
    this.customShippingType = shippingTypeId;

    // Update form control
    this.shippingTypeControl.setValue(shippingTypeId);
    this.shippingTypeControl.markAsTouched();

    // Update costCalculation object immediately
    if (shippingTypeId && shippingTypeId !== '') {
      this.costCalculation.custom_address_shipping_type = parseInt(
        shippingTypeId,
        10
      );
      this.costCalculation.sent_to_customer_address = 1;

      // Update shipping fee from the selected type
      const shippingType = this.shippingTypeList.find(
        (st) => st.id === +shippingTypeId
      );
      if (shippingType) {
        this.shippingFee = parseFloat(shippingType.amount);
      }

      // Trigger recalculation to update subtotal
      this.calculateShippingCost();
    }
  }

  // Reset shipping calculations when switching to custom address
  updateShippingCalculations(): void {
    const checks = this.checkSummaryData();
    checks.forEach((check: IMailCheck) => {
      this.shippingCalculation.single_items[check.enc_id] = 0.0;
    });
    this.subtotal.set(0.0);
    this.shippingFee = 0.0;
    this.shippingCalculation = {
      page_cost: '0',
      single_items: {},
      total: '0',
      subTotal: '0',
      group_shipping_fee: '0',
      subtotal: '0'
    };
  }

  calculateShippingCost(): void {
    // Calculate for both payee and custom addresses
    if (
      this.shipToAddress() === 'custom' &&
      this.costCalculation.shipping_from &&
      this.costCalculation.shipping_to &&
      this.costCalculation.custom_address_shipping_type
    ) {
      // Update mail_check_ids for current checks
      const checks = this.checkSummaryData();
      this.costCalculation.mail_check_ids = checks.map(
        (check) => check.enc_id
      );
      this.costCalculation.all_check_ids = checks.map(
        (check) => check.enc_id
      );

      // Add individual check details
      checks.forEach((check) => {
        this.costCalculation[check.enc_id] = {
          mail_type: check.mail_type.toString(),
          check_paper: 7,
          informed_payee_sms: check.informed_payee_sms ? 1 : 0,
          informed_payee_email: check.informed_payee_email ? 1 : 0,
          payee_phone: check.payee_phone || '',
          payee_email: check.payee_email || '',
          file_hidden: this.attachments[check.enc_id] || []
        };
      });

      // Call shipping calculation API
      this.checkService
        .ShippingCostCalculationGroup(this.costCalculation)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.success && res?.data) {
            this.shippingCalculation = res.data;
            this.subtotal.set(parseFloat(res.data.subtotal) || 0);
            this.shippingFee =
              parseFloat(res.data.group_shipping_fee) || 0;

            // Recalculate subtotal to ensure UI updates
            this.calculateSubtotal();
          }
        });
    } else if (this.shipToAddress() === 'payee') {
      // Calculate for payee address
      const checks = this.checkSummaryData();
      this.costCalculation.mail_check_ids = checks.map(
        (check) => check.enc_id
      );
      this.costCalculation.all_check_ids = checks.map(
        (check) => check.enc_id
      );
      this.costCalculation.sent_to_customer_address = 0;

      // Add individual check details
      checks.forEach((check) => {
        this.costCalculation[check.enc_id] = {
          mail_type: check.mail_type || 1,
          check_paper: 7,
          informed_payee_sms: check.informed_payee_sms ? 1 : 0,
          informed_payee_email: check.informed_payee_email ? 1 : 0,
          payee_phone: check.payee_phone || '',
          payee_email: check.payee_email || '',
          file_hidden: this.attachments[check.enc_id] || []
        };
      });

      // Call shipping calculation API for payee address
      this.checkService
        .ShippingCostCalculationGroup(this.costCalculation)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.success && res?.data) {
            this.shippingCalculation = res.data;
            this.subtotal.set(parseFloat(res.data.subtotal) || 0);
            this.shippingFee =
              parseFloat(res.data.group_shipping_fee) || 0;

            // Recalculate subtotal to ensure UI updates
            this.calculateSubtotal();
          }
        });
    }
  }

  // Calculate total with shipping and attachments
  calculateTotal(): number {
    const baseAmount = this.totalAmount();
    let shippingTotal = 0;

    if (this.shipToAddress() === 'custom') {
      const checks = this.checkSummaryData();
      checks.forEach((check) => {
        // Include individual check shipping costs with attachments
        if (this.shippingCalculation.single_items[check.enc_id]) {
          shippingTotal += parseFloat(
            this.shippingCalculation.single_items[check.enc_id].toString()
          );
        } else {
          shippingTotal += this.shippingFee;
        }
      });
    }

    return baseAmount + shippingTotal;
  }

  getShippingTypes() {
    this.checkService
      .getShippingType()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (response.success && response.data) {
          this.shippingTypeList = response.data;
        }
      });
  }

  get customShippingTypeOptions(): IV4SelectOption[] {
    return this.customShippingTypeList.map((type) => ({
      id: type.id.toString(),
      name: type.name,
      value: type.id.toString()
    }));
  }

  get shippingAddressFromOptions(): IV4SelectOption[] {
    return this.shippingAddressFrom.map((addr) => ({
      id: addr.id,
      name: addr.name,
      value: addr.id
    }));
  }

  get shippingAddressToOptions(): IV4SelectOption[] {
    return this.shippingAddressTo.map((addr) => ({
      id: addr.id,
      name: addr.name,
      value: addr.id
    }));
  }

  getShippingTypeDisplay(
    mail_type: string | number,
    displayType?: string
  ): string {
    if (!mail_type || !this.shippingTypeList.length)
      return mail_type?.toString() || '';

    const shippingType = this.shippingTypeList.find((st) => {
      // If mail_type is a number, compare with id; if string, compare with short_code
      if (
        typeof mail_type === 'number' ||
        (!Number.isNaN(Number(mail_type)) &&
          mail_type.toString().trim() !== '')
      ) {
        return st.id === Number(mail_type);
      } else {
        return st.short_code === mail_type.toString();
      }
    });
    if (shippingType) {
      return displayType === 'name'
        ? shippingType.name
        : shippingType.short_code;
    }
    return mail_type?.toString() || '';
  }

  cancelMailSubmission() {
    this.router.navigate([
      '/v4/manage/business-tools/mail-dashboard/multi-check-mail-table'
    ]);
  }

  isRequiredField(field: string): boolean {
    return this.requiredFields.includes(field);
  }

  contnueTosShipping() {
    this.showSelectionShippingType.set(true);
  }

  goBack() {
    this.showSelectionShippingType.set(false);
  }

  getHeaderTitle(): string {
    return this.showReviewandSubmit()
      ? 'Confirm Summary - Review your selections before sending '
      : this.showSelectionShippingType()
        ? 'Select Mailing Type - Choose how you want to send your checks '
        : 'Check Summary - Review Before Mailing';
  }
}
