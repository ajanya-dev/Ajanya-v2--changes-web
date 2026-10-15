import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal
} from '@angular/core';
import { NgClass, CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import {
  DetailSidePanelComponent,
  IDetailPanelActionButton
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import { CommonStateSelectV4Component } from 'src/app/shared/V4/common-state-select-v4/common-state-select-v4.component';
import { CommonCountrySelectV4Component } from 'src/app/shared/V4/common-country-select-v4/common-country-select-v4.component';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  IPayeeBank,
  IPayeeInterBank,
  IPayeeDropdown
} from 'src/app/modules/payee/payee-v2/model/payee';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { IGetContact } from 'src/app/shared/modal/add-contact/model/contact';
import { IGetTodo } from 'src/app/shared/modal/todo/model/todo';
import {
  ICommentEntry,
  PoCommentsListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/comments-list/comments-list.component';
import {
  IAttachmentEntry,
  PoAttachmentsListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/attachments-list/attachments-list.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { addPayeeData } from 'src/app/data/data/payee';
import { Country } from 'src/app/data/data/country-list';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { Router } from '@angular/router';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { AddContactModalV4Component } from '../../modals/add-contact-modal-v4/add-contact-modal-v4.component';
import { AddTodoModalV4Component } from '../../modals/add-todo-modal-v4/add-todo-modal-v4.component';
import { AddPayeeInternationalBankV4Component } from '../add-payee-international-bank-v4/add-payee-international-bank-v4.component';
import {
  PayeeTableModalV4Component,
  PayeeTableModalType
} from '../../modals/payee-table-modal-v4/payee-table-modal-v4.component';
import { PayeeDetailsV4Service } from '../../v4-services/payee-details-v4.service';
import { PayeeDataV35Service } from '../../../payee-v3/v35-services/payee-data-v35.service';

export type ActivityTab =
  | 'contacts'
  | 'todos'
  | 'comments'
  | 'attachments'
  | 'audit'
  | 'more';
export type TransactionTab = 'send' | 'received';

export interface ActivityTabItem {
  key: ActivityTab;
  label: string;
  icon: string;
}

interface ReceivedTransaction extends ICommonTransactionTableData {
  check_from_name?: string;
  bank_account_account_name?: string;
  sender_email?: string;
  received_type?: string;
}

@Component({
  selector: 'app-payee-details-v4',
  standalone: true,
  imports: [
    DetailSidePanelComponent,
    NgClass,
    NgTemplateOutlet,
    LucideAngularModule,
    PdSkeletonComponent,
    PdDateTimeComponent,
    PoCommentsListComponent,
    PoAttachmentsListComponent,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    PhoneInputV4Component,
    AddressAutocompleteV4Component,
    CommonStateSelectV4Component,
    CommonCountrySelectV4Component,
    ReactiveFormsModule,
    CurrencyPipe,
    MatTooltip
  ],
  templateUrl: './payee-details-v4.component.html',
  styleUrls: ['./payee-details-v4.component.scss']
})
export class PayeeDetailsV4Component {
  private payeeDataService = inject(PayeeDataV35Service);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private payeeService = inject(PayeeService);
  private sharedService = inject(SharedService);
  private destroyRef = inject(DestroyRef);
  detailsService = inject(PayeeDetailsV4Service);
  private bankModalService = inject(BankModalService);
  private paymentService = inject(PaymentsService);
  private router = inject(Router);
  private payeeModalService = inject(PayeeModalService);

  isOpen = signal(false);

  payeeData = this.payeeDataService.payeeDataSignal;

  payeeName = computed(() => this.payeeData()?.name || '');

  private static readonly TYPE_LABELS: Record<string, string> = {
    1: 'Customer',
    2: 'Vendor',
    3: 'Employee',
    4: '1099 Contractor'
  };

  payeeTypeLabel = computed(() => {
    const typeId = this.payeeData()?.payeeTypeId;
    return (typeId && PayeeDetailsV4Component.TYPE_LABELS[typeId]) || 'Payee';
  });

  payeeAdded = computed(() =>
    (this.payeeData()?.createdAt ?? '').replace(/[\s-]+\d{1,2}:\d{2}.*$/, '').trim()
  );

  payeePlace = computed(() => {
    const d = this.payeeData();
    return [d?.city, d?.state].filter(Boolean).join(', ') || 'No address';
  });

  avatarLetter = computed(() =>
    (this.payeeName() || 'P').charAt(0).toUpperCase()
  );

  readonly panelActionButtons: IDetailPanelActionButton[] = [
    { label: 'Send', lucideIcon: 'send', variant: 'primary', key: 'send' },
    { label: 'Receive', lucideIcon: 'download', variant: 'outline', key: 'receive' },
    {
      label: 'More',
      variant: 'outline',
      key: 'more',
      menuHeading: 'Actions',
      menu: [
        { label: 'Edit', key: 'edit', lucideIcon: 'edit' },
        { label: 'Delete', key: 'delete', lucideIcon: 'trash-2', danger: true }
      ]
    }
  ];

  isPanelExpanded = signal(false);

  collapsedCards = signal<Record<string, boolean>>({});
  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }
  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }

  readonly summaryLabels = ['This month', 'This year', 'Last year', 'All time'];

  /** Amounts for `summaryLabels`, in order, for the active Bank / Cash expense pill. */
  summaryTotals = computed(() => {
    const { bank, cash } = this.detailsService.payeeSummary();
    const values =
      this.activeSummaryTab() === 'bank'
        ? [
            bank?.total_paid_in_month,
            bank?.total_paid_in_year,
            bank?.total_paid_in_last_year,
            bank?.total_paid
          ]
        : [
            cash?.total_expense_this_month,
            cash?.total_expense_this_year,
            cash?.total_expense_last_year,
            cash?.total_expense_all_time
          ];
    return values.map((v) => this.parseAmount(v));
  });

  payeeEmail = computed(() => this.payeeData()?.email || '—');
  payeePhone = computed(() => this.payeeData()?.phone || '—');
  payeeAddress = computed(() => {
    const d = this.payeeData();
    if (!d) return '—';
    const parts = [
      d.addressLine1,
      d.addressLine2,
      d.city,
      d.state,
      d.zip,
      d.country
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  });

  payeeCompany = computed(() => this.payeeData()?.company || '-');

  moreFields = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mi = this.detailsService.viewMoreInfo() as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const td = (this.payeeData()?.typeDetails as any) ?? mi;
    const typeId = String(this.payeeData()?.payeeTypeId);
    if (!td) return [];

    const lookup = (
      arr: { value: string; name: string }[],
      val: string | null | undefined
    ): string | null =>
      arr.find((x) => x.value === String(val ?? ''))?.name ?? null;

    const fields: { key: string; value: string | null }[] = [];

    if (typeId === '1') {
      // Customer (payee_type_id 1 = Customer in API)
      fields.push({ key: 'First Name', value: td.customer_first_name || null });
      fields.push({
        key: 'Middle Name',
        value: td.customer_middle_name || null
      });
      fields.push({ key: 'Last Name', value: td.customer_last_name || null });
      fields.push({
        key: 'Company Name',
        value: td.customer_company_name || null
      });
      fields.push({
        key: 'Customer Type',
        value: lookup(addPayeeData.loadCustomerType(), td.customer_type)
      });
      fields.push({
        key: 'Default Pay Method',
        value: lookup(
          addPayeeData.loadDefaultPayMethod(),
          td.customer_default_pay_method
        )
      });
      fields.push({ key: 'Category', value: mi?.customer_category || null });
      fields.push({
        key: 'Default Pay From Bank Account',
        value: mi?.customer_bank_account_name || null
      });
      fields.push({ key: 'Note', value: td.customer_note || null });
    } else if (typeId === '2') {
      // Vendor (payee_type_id 2 = Vendor in API)
      fields.push({ key: 'First Name', value: td.vendor_first_name || null });
      fields.push({ key: 'Middle Name', value: td.vendor_middle_name || null });
      fields.push({ key: 'Last Name', value: td.vendor_last_name || null });
      fields.push({
        key: 'Company Name',
        value: td.vendor_company_name || null
      });
      fields.push({
        key: 'Vendor Type',
        value: lookup(addPayeeData.loadCustomerType(), td.vendor_type)
      });
      fields.push({
        key: 'Default Pay Method',
        value: lookup(
          addPayeeData.loadDefaultPayMethod(),
          td.vendor_default_pay_method
        )
      });
      fields.push({
        key: 'Payment Terms',
        value: lookup(
          addPayeeData.loadvendorPaymentTerms(),
          td.vendor_payment_terms
        )
      });
      fields.push({ key: 'Tax ID', value: td.vendor_tax_id || null });
      fields.push({
        key: '1099 Vendor',
        value: lookup(addPayeeData.loadvendor_1099(), td.vendor_1099)
      });
      fields.push({ key: 'Category', value: mi?.vendor_category || null });
      fields.push({
        key: 'Default Pay From Bank Account',
        value: mi?.vendor_bank_account_name || null
      });
      fields.push({ key: 'Note', value: td.vendor_note || null });
    } else if (typeId === '3') {
      // Employee (payee_type_id 3 = Employee in API)
      fields.push({ key: 'First Name', value: td.employee_first_name || null });
      fields.push({
        key: 'Middle Name',
        value: td.employee_middle_name || null
      });
      fields.push({ key: 'Last Name', value: td.employee_last_name || null });
      fields.push({
        key: 'Employee Type',
        value: lookup(addPayeeData.loadEmployeeType(), td.employee_type)
      });
      fields.push({
        key: 'Default Pay Method',
        value: lookup(
          addPayeeData.loadDefaultPayMethod(),
          td.employee_default_pay_method
        )
      });
      fields.push({
        key: 'Payment Schedule',
        value: lookup(
          addPayeeData.loadEmployeePaymentShedule(),
          td.employee_payment_schedule
        )
      });
      fields.push({
        key: 'Filing Status',
        value: lookup(
          addPayeeData.loadEmployeeFilingStatus(),
          td.employee_filling_status
        )
      });
      fields.push({ key: 'SSN', value: td.employee_ssn || null });
      fields.push({
        key: 'Hourly Rate',
        value: td.employee_hourly_rate || null
      });
      fields.push({
        key: 'Overtime Rate',
        value: td.employee_overtime_rate || null
      });
      fields.push({
        key: 'YTD Earning',
        value: td.employee_ytd_earning || null
      });
      fields.push({ key: 'YTD Tax', value: td.employee_ytd_tax || null });
      fields.push({ key: 'Category', value: mi?.employee_category || null });
      fields.push({
        key: 'Default Pay From Bank Account',
        value: mi?.employee_bank_account_name || null
      });
      fields.push({ key: 'Note', value: td.employee_note || null });
    }

    return fields.filter((f) => f.value);
  });

  // Edit mode
  isEditingInfo = signal(false);
  isSavingInfo = signal(false);
  editForm = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    addressLine1: new FormControl('', { nonNullable: true }),
    addressLine2: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true }),
    state: new FormControl('', { nonNullable: true }),
    zip: new FormControl('', { nonNullable: true }),
    country: new FormControl('', { nonNullable: true })
  });

  // Bank menu
  openMenuAccountId = signal<string | null>(null);
  revealedAccountIds = signal<Set<string>>(new Set());

  toggleAccountNumberVisibility(id: string) {
    this.revealedAccountIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isAccountNumberRevealed(id: string): boolean {
    return this.revealedAccountIds().has(id);
  }

  // Audit trail pagination
  auditPage = signal(1);
  auditPageSize = 5;
  auditTotalPages = computed(
    () =>
      Math.ceil(
        this.detailsService.auditTrailItems().length / this.auditPageSize
      ) || 1
  );

  auditPagedItems = computed(() => {
    const start = (this.auditPage() - 1) * this.auditPageSize;
    return this.detailsService
      .auditTrailItems()
      .slice(start, start + this.auditPageSize);
  });

  auditRangeLabel = computed(() => {
    const total = this.detailsService.auditTrailItems().length;
    if (!total) return '0';
    const start = (this.auditPage() - 1) * this.auditPageSize + 1;
    const end = Math.min(this.auditPage() * this.auditPageSize, total);
    return `${start} - ${end} of ${total}`;
  });

  // Preview limits (max 3 items shown in side panel)
  private readonly PREVIEW_LIMIT = 3;
  previewBankAccounts = computed(() =>
    this.detailsService.bankAccounts().slice(0, this.PREVIEW_LIMIT)
  );

  previewIntlAccounts = computed(() =>
    this.detailsService.internationalAccounts().slice(0, this.PREVIEW_LIMIT)
  );

  previewSendTxns = computed(() =>
    this.detailsService.sendTransactions().slice(0, this.PREVIEW_LIMIT)
  );

  previewReceivedTxns = computed(
    () =>
      this.detailsService
        .receivedTransactions()
        .slice(0, this.PREVIEW_LIMIT) as ReceivedTransaction[]
  );

  hasMoreBankAccounts = computed(
    () => this.detailsService.bankAccounts().length > this.PREVIEW_LIMIT
  );

  hasMoreIntlAccounts = computed(
    () =>
      this.detailsService.internationalAccounts().length > this.PREVIEW_LIMIT
  );

  hasMoreSendTxns = computed(
    () => this.detailsService.sendTransactions().length > this.PREVIEW_LIMIT
  );

  hasMoreReceivedTxns = computed(
    () => this.detailsService.receivedTransactions().length > this.PREVIEW_LIMIT
  );

  /** Check if bank account is last in the preview list (for menu positioning) */
  isLastBankAccount(accountId: string): boolean {
    const accounts = this.previewBankAccounts();
    return (
      accounts.length > 0 && accounts[accounts.length - 1].id === accountId
    );
  }

  /** Check if international account is last in the preview list (for menu positioning) */
  isLastIntlAccount(accountId: string): boolean {
    const accounts = this.previewIntlAccounts();
    return (
      accounts.length > 0 && accounts[accounts.length - 1].id === accountId
    );
  }

  // Tabs
  activeSummaryTab = signal<'bank' | 'cash'>('bank');
  activeBankTab = signal<'domestic' | 'international'>('domestic');
  activeTransactionTab = signal<TransactionTab>('send');
  activeActivityTab = signal<ActivityTab>('contacts');

  activityTabs: ActivityTabItem[] = [
    { key: 'contacts', label: 'Contacts', icon: 'users' },
    { key: 'todos', label: 'To-dos', icon: 'check-square' },
    { key: 'comments', label: 'Comments', icon: 'message-square' },
    { key: 'attachments', label: 'Attachments', icon: 'paperclip' },
    { key: 'audit', label: 'Audit trail', icon: 'history' },
    { key: 'more', label: 'More', icon: 'more-horizontal' }
  ];

  private lastLoadedPayeeId: string | null = null;

  constructor() {
    effect(
      () => {
        const data = this.payeeDataService.payeeDataSignal();
        const action = this.payeeDataService.actionSignal();
        if (data) {
          // Only open side panel when triggered by an explicit view action
          // (actionSignal is set to 'more' by the eye button / list action)
          if (action === 'more' && !this.isOpen()) {
            this.isOpen.set(true);
            this.payeeDataService.actionSignal.set('');
          }
          // Reset tab selection only when a different payee loads, not on an
          // in-place refresh of the same payee (e.g. after save).
          if (data.encryptedId !== this.lastLoadedPayeeId) {
            this.lastLoadedPayeeId = data.encryptedId ?? null;
            this.activeSummaryTab.set('bank');
            this.activeActivityTab.set('contacts');
          }
          this.commentError.set(null);
          this.attachmentError.set(null);
          this.detailsService.loadAllData(data);
        }
      },
      { allowSignalWrites: true }
    );
  }

  onAddressSelected(address: IGoogleAddress): void {
    this.editForm.patchValue({
      addressLine1: address.address,
      city: (address.city ?? '').trim(),
      state: (address.state ?? '').trim(),
      zip: (address.zip ?? '').trim(),
      country: (address.country ?? '').trim()
    });
  }

  onClose(): void {
    this.isOpen.set(false);
    this.payeeDataService.payeeDataSignal.set(undefined);
    this.detailsService.resetAll();
    this.auditPage.set(1);
    this.isEditingInfo.set(false);
    this.collapsedCards.set({});
  }

  toggleEditInfo(): void {
    const payeeId = this.payeeEncryptedId;
    if (!payeeId) return;
    this.openEditPayeeModal(payeeId);
    // this.editForm.patchValue({
    //   name: data.name || '',
    //   phone: data.phone || '',
    //   email: data.email || '',
    //   addressLine1: data.addressLine1 || '',
    //   addressLine2: data.addressLine2 || '',
    //   city: data.city || '',
    //   state: data.state || '',
    //   zip: data.zip || '',
    //   country: data.country || ''
    // });
    // this.isEditingInfo.set(true);
  }

  cancelEditInfo(): void {
    this.isEditingInfo.set(false);
  }

  saveInfo(): void {
    const payeeId = this.payeeEncryptedId;
    const currentData = this.payeeData();
    if (!payeeId || !currentData) return;

    const form = this.editForm.getRawValue();

    if (!form.name?.trim()) {
      this.alertService.warningAlert({ content: 'Name is required' });
      return;
    }

    this.isSavingInfo.set(true);

    const payload = {
      payeeTypeId: currentData.payeeTypeId || '1',
      name: form.name,
      payeeNickName: currentData.nickName || '',
      payeeEmail: form.email,
      payeePhone: form.phone,
      payeeCompanyName: currentData.company || '',
      payeeAddressLine1: form.addressLine1,
      payeeAddressLine2: form.addressLine2,
      payeeCity: form.city,
      payeeState: form.state,
      payeeCountry: form.country,
      payeeZip: form.zip,
      entityType: currentData.entityType || '',
      customerAccountNumber:
        currentData.typeDetails?.customerAccountNumber || '',
      vendorAccountNumber: currentData.typeDetails?.vendorAccountNumber || '',
      employeeAccountNumber:
        currentData.typeDetails?.employeeAccountNumber || '',
      isRequestedBankInfo: '0',
      bankData: [],
      internationalWirePayeeAccounts: [],
      customerBankAccountId:
        currentData.typeDetails?.customerBankAccountId || '',
      customerCategory: '',
      customerDefaultPayMethod:
        currentData.typeDetails?.customerDefaultPayMethod || '',
      customerFirstName: currentData.typeDetails?.customerFirstName || '',
      customerLastName: currentData.typeDetails?.customerLastName || '',
      customerType: currentData.typeDetails?.customerType || '',
      customerCompanyName: currentData.typeDetails?.customerCompanyName || '',
      vendorBankAccountId: currentData.typeDetails?.vendorBankAccountId || '',
      vendorCategory: '',
      vendorDefaultPayMethod:
        currentData.typeDetails?.vendorDefaultPayMethod || '',
      vendorFirstName: currentData.typeDetails?.vendorFirstName || '',
      vendorLastName: currentData.typeDetails?.vendorLastName || '',
      vendorType: currentData.typeDetails?.vendorType || '',
      vendorPaymentTerms: currentData.typeDetails?.vendorPaymentTerms || '',
      vendorTaxId: currentData.typeDetails?.vendorTaxId || '',
      vendor_1099: currentData.typeDetails?.vendor1099 || '',
      vendorCompanyName: currentData.typeDetails?.vendorCompanyName || '',
      employeeFirstName: currentData.typeDetails?.employeeFirstName || '',
      employeeLastName: currentData.typeDetails?.employeeLastName || '',
      employeeDob: currentData.typeDetails?.employeeDob || '',
      employeeSsn: currentData.typeDetails?.employeeSsn || '',
      employeeType: currentData.typeDetails?.employeeType || '',
      employeeHourlyRate: currentData.typeDetails?.employeeHourlyRate || '',
      employeePaymentSchedule:
        currentData.typeDetails?.employeePaymentSchedule || '',
      employeeFillingStatus:
        currentData.typeDetails?.employeeFillingStatus || '',
      employeeOvertimeRate: currentData.typeDetails?.employeeOvertimeRate || '',
      employeeYtdEarning: currentData.typeDetails?.employeeYtdEarning || '',
      employeeYtdTax: currentData.typeDetails?.employeeYtdTax || '',
      employeeBankAccountId:
        currentData.typeDetails?.employeeBankAccountId || '',
      employeeCategory: '',
      employeeDefaultPayMethod:
        currentData.typeDetails?.employeeDefaultPayMethod || '',
      is_requested_bank_info: 0,
      permission_email: 0,
      permission_sms: 0
    };

    this.payeeService
      .updatePayee(payeeId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isSavingInfo.set(false);
          if (res.success) {
            this.alertService.successAlert({
              content: 'Payee updated successfully'
            });
            this.isEditingInfo.set(false);

            const updatedPayeeData: IPayeeDropdown = {
              ...currentData,
              name: form.name,
              phone: form.phone,
              email: form.email,
              addressLine1: form.addressLine1,
              addressLine2: form.addressLine2,
              city: form.city,
              state: form.state,
              zip: form.zip,
              country: form.country
            };
            this.payeeDataService.payeeDataSignal.set(updatedPayeeData);
            this.v3DataTableService.refreshV3DataTable();
          }
        },
        error: () => {
          this.isSavingInfo.set(false);
        }
      });
  }

  onAction(key: string): void {
    const payeeId = this.payeeEncryptedId;
    if (!payeeId) return;
    const payee = this.payeeData();
    if (key === 'send') {
      this.paymentService.initiatePaymentForm = { payee };
      this.router.navigate(['/v4/manage/payments/pay/bankaccount/check'], {
        state: { backUrl: this.router.url }
      });
    } else if (key === 'receive') {
      this.paymentService.initiatePaymentForm = { payee };
      this.router.navigate(['/v4/manage/payments/receive'], {
        state: { backUrl: this.router.url }
      });
    } else if (key === 'edit') {
      this.openEditPayeeModal(payeeId);
    } else if (key === 'delete') {
      this.deletePayee(payeeId);
    }
  }

  private openEditPayeeModal(id: string): void {
    this.payeeModalService
      .openEditPayee(id, 'addPayeeModal', { edit: true, id, type: 'string' }, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payeeModal) => {
        payeeModal
          ?.afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (!res?.success) return;
            this.v3DataTableService.refreshV3DataTable();
            this.payeeDataService.payeeDataSignal.set({ ...res, encryptedId: res.id });
          });
      });
  }

  private deletePayee(id: string): void {
    this.alertService
      .confirmAlert({
        content: 'Are you sure to delete this payee?',
        cancelMsg: 'No, cancel!',
        doneMsg: 'Yes, Delete it!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) this.confirmDeletePayee(id);
      });
  }

  private confirmDeletePayee(id: string, warn: 1 | 0 = 0, confirmed: 1 | 0 = 0): void {
    this.payeeService
      .deleteSinglePayee(id, warn, confirmed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.alertService.successAlert({ content: 'Payee deleted.' });
            this.onClose();
          }
        },
        error: (err) => this.handleDeleteError(id, err)
      });
  }

  private handleDeleteError(
    id: string,
    err: { error: { errorCode: number; errorMsg: string } }
  ): void {
    const code = err.error?.errorCode;
    if (code === 123) {
      this.alertService.warningAlert({
        content: `Sorry, You have a recurring mail check on this payee. You need to cancel all recurring
        service before delete this payee <a href='/manage/checkmailing/recurring'>click to see</a>`
      });
    } else if (code === 124 || code === 126) {
      this.alertService
        .confirmAlert({ content: err.error.errorMsg })
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res) this.confirmDeletePayee(id, 1, code === 126 ? 1 : 0);
        });
    }
  }

  setSummaryTab(tab: 'bank' | 'cash'): void {
    this.activeSummaryTab.set(tab);
  }

  setBankTab(tab: 'domestic' | 'international'): void {
    this.activeBankTab.set(tab);
  }

  setTransactionTab(tab: TransactionTab): void {
    this.activeTransactionTab.set(tab);
  }

  setActivityTab(tab: ActivityTab): void {
    this.activeActivityTab.set(tab);
  }

  toggleAccountMenu(accountId: string, event?: Event): void {
    event?.stopPropagation();
    this.openMenuAccountId.set(
      this.openMenuAccountId() === accountId ? null : accountId
    );
  }

  closeAccountMenu(): void {
    this.openMenuAccountId.set(null);
  }

  onClickOutsideMenu(): void {
    if (this.openMenuAccountId()) {
      this.closeAccountMenu();
    }
  }

  onEditDomesticAccount(account: IPayeeBank): void {
    this.closeAccountMenu();
    if (this.bankModalService.isBankPermissionChecking()) return;
    const payeeId = this.payeeEncryptedId;
    if (!payeeId) return;

    this.bankModalService.openAddBankNormalModalV4({ payeeId, payeeName: this.payeeName(), edit: true, bankId: account.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bankModal) => {
        if(bankModal){
          bankModal.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
            if(result?.success){
              this.detailsService.loadBankAccounts(payeeId);
            }
          });
        }
      });
  }

  onEditInternationalAccount(account: IPayeeInterBank): void {
    this.closeAccountMenu();
    const payeeId = this.payeeEncryptedId;
    if (!payeeId) return;

    const dialogRef = this.dialog.open(AddPayeeInternationalBankV4Component, {
      width: '100%',
      maxWidth: '800px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        payeeId,
        edit: true,
        bankId: account.id,
        accordionMode: true,
        payeePhone: this.payeeData()?.phone || ''
      }
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.detailsService.loadBankAccounts(payeeId);
        if (result?.phone) {
          const currentData = this.payeeData();
          if (currentData) {
            this.payeeDataService.payeeDataSignal.set({
              ...currentData,
              phone: result.phone
            });
          }
        }
      });
  }

  onDeleteAccount(account: IPayeeBank): void {
    this.closeAccountMenu();
    const payeeId = this.payeeData()?.encryptedId || '';
    if (!payeeId || !account.id) return;

    const dialogRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this bank account?'
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.detailsService.deleteDomesticBank(payeeId, account.id);
        }
      });
  }

  onDeleteInternationalAccount(account: IPayeeInterBank): void {
    this.closeAccountMenu();
    const encryptedId = this.payeeData()?.encryptedId || '';
    if (!account.id) return;

    const dialogRef = this.alertService.confirmAlert({
      content:
        'Are you sure you want to delete this international bank account?'
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.detailsService.deleteInternationalBank(account.id, encryptedId);
        }
      });
  }

  onToggleDefault(account: IPayeeBank): void {
    this.closeAccountMenu();
    const payeeId = this.payeeData()?.encryptedId || '';
    if (payeeId && account.id) {
      this.detailsService.setDefaultDomesticBank(payeeId, account.id);
    }
  }

  onToggleInternationalDefault(account: IPayeeInterBank): void {
    this.closeAccountMenu();
    const payeeId = this.payeeData()?.encryptedId || '';
    if (payeeId && account.id) {
      this.detailsService.setDefaultInternationalBank(
        account.id,
        payeeId,
        account.account_type ?? ''
      );
    }
  }

  onAddBankAccount(): void {
    if (this.bankModalService.isBankPermissionChecking()) return;
    const payeeId = this.payeeEncryptedId;
    if (!payeeId) return;

    if (this.activeBankTab() === 'international') {
      const dialogRef = this.dialog.open(AddPayeeInternationalBankV4Component, {
        width: '100%',
        maxWidth: '800px',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { payeeId, accordionMode: true, payeePhone: this.payeeData()?.phone || '' }
      });
      dialogRef
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          this.detailsService.loadBankAccounts(payeeId);
          if (result?.phone) {
            const currentData = this.payeeData();
            if (currentData) {
              this.payeeDataService.payeeDataSignal.set({
                ...currentData,
                phone: result.phone
              });
            }
          }
        });
    } else {
      this.bankModalService.openAddBankNormalModalV4({ payeeId, payeeName: this.payeeName() })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((bankModal) => {
          if(bankModal){
            bankModal.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
              if(result?.success){
                this.alertService.successAlert({ close: true, timeout: 2000, title: 'Success!', content: 'Bank account added successfully.' });
                this.detailsService.loadBankAccounts(payeeId);
              }
            });
          }
        });
    }
  }

  onViewAllBankAccounts(): void {
    const type: PayeeTableModalType =
      this.activeBankTab() === 'international'
        ? 'international-bank'
        : 'domestic-bank';
    const title =
      this.activeBankTab() === 'international'
        ? 'International Bank Accounts'
        : 'Bank Accounts';
    this.openTableModal(type, title);
  }

  onViewAllTransactions(): void {
    const type: PayeeTableModalType =
      this.activeTransactionTab() === 'received'
        ? 'received-transactions'
        : 'send-transactions';
    const title =
      this.activeTransactionTab() === 'received'
        ? 'Received Transactions'
        : 'Send Transactions';
    this.openTableModal(type, title);
  }

  private openTableModal(type: PayeeTableModalType, title: string): void {
    const isBankType = type === 'domestic-bank' || type === 'international-bank';
    this.dialog.open(PayeeTableModalV4Component, {
      width: 'calc(100vw - 64px)',
      maxWidth: 'calc(100vw - 64px)',
      ...(isBankType
        ? { maxHeight: 'calc(100vh - 64px)' }
        : { height: 'calc(100vh - 64px)' }),
      disableClose: false,
      panelClass: ['paddingless-modal-rounded', 'payee-table-modal-v4'],
      data: {
        type,
        payeeId: this.payeeEncryptedId,
        payeeEmail: this.payeeData()?.email || '',
        title
      }
    });
  }

  auditPrevPage(): void {
    if (this.auditPage() > 1) this.auditPage.set(this.auditPage() - 1);
  }

  auditNextPage(): void {
    if (this.auditPage() < this.auditTotalPages())
      this.auditPage.set(this.auditPage() + 1);
  }

  getDeviceIcon(device: string): string {
    switch (device) {
      case 'Desktop':
        return 'monitor';
      case 'Mobile':
        return 'smartphone';
      case 'API':
        return 'file-text';
      default:
        return 'monitor';
    }
  }

  private static readonly PAYMENT_STATUS_STYLES: Record<
    string,
    { color: string; bg: string }
  > = {
    PENDING: {
      color: 'var(--v4-common-yellow-color)',
      bg: 'var(--v4-badge-warning-bg-color)'
    },
    PROCESSING: {
      color: 'var(--v4-common-blue-color)',
      bg: 'var(--v4-badge-info-bg-color)'
    },
    COMPLETED: {
      color: 'var(--v4-common-green-color)',
      bg: 'var(--v4-badge-success-bg-color)'
    },
    CANCELED: {
      color: 'var(--v4-common-red-color)',
      bg: 'var(--v4-badge-error-bg-color)'
    },
    FAILED: {
      color: 'var(--v4-common-red-color)',
      bg: 'var(--v4-badge-error-bg-color)'
    },
    'APPROVAL REQUIRED': {
      color: 'var(--v4-common-yellow-color)',
      bg: 'var(--v4-badge-warning-bg-color)'
    },
    APPROVED: {
      color: 'var(--v4-common-green-color)',
      bg: 'var(--v4-badge-success-bg-color)'
    },
    REJECTED: {
      color: 'var(--v4-common-red-color)',
      bg: 'var(--v4-badge-error-bg-color)'
    },
    SETTLED: {
      color: 'var(--v4-common-green-color)',
      bg: 'var(--v4-badge-success-bg-color)'
    },
    REFUND: {
      color: 'var(--v4-common-blue-color)',
      bg: 'var(--v4-badge-info-bg-color)'
    }
  };

  getTxnStatusLabel(txn: ICommonTransactionTableData): string {
    const raw = txn.status;
    if (raw == null) return 'Unknown';
    const str = String(raw);
    return (
      str.charAt(0).toUpperCase() +
      str.slice(1).toLowerCase().replace(/_/g, ' ')
    );
  }

  getTxnStatusColor(txn: ICommonTransactionTableData): string {
    const upper = String(txn.status ?? '').toUpperCase();
    return (
      PayeeDetailsV4Component.PAYMENT_STATUS_STYLES[upper]?.color ||
      'var(--v4-subtle-text-color)'
    );
  }

  getTxnStatusBg(txn: ICommonTransactionTableData): string {
    const upper = String(txn.status ?? '').toUpperCase();
    return (
      PayeeDetailsV4Component.PAYMENT_STATUS_STYLES[upper]?.bg ||
      'var(--v4-tertiary-background-color)'
    );
  }

  // Received transaction helpers
  getReceivedTxnName(txn: ReceivedTransaction): string {
    return (
      txn.check_from_name ||
      txn.bank_account_account_name ||
      txn.sender_email ||
      '-'
    );
  }

  getReceivedTxnStatusLabel(txn: ReceivedTransaction): string {
    const statusMap = this.detailsService.receivedStatusMap();
    const status = statusMap?.[txn.received_type ?? '']?.[txn.status];
    return status?.statusShortDescription || 'Unknown';
  }

  getReceivedTxnStatusColor(txn: ReceivedTransaction): string {
    const statusMap = this.detailsService.receivedStatusMap();
    const status = statusMap?.[txn.received_type ?? '']?.[txn.status];
    return status?.color || 'var(--v4-subtle-text-color)';
  }

  getReceivedTxnStatusBg(txn: ReceivedTransaction): string {
    return `color-mix(in srgb, ${this.getReceivedTxnStatusColor(txn)} 12%, transparent)`;
  }

  maskNumber(value: string): string {
    if (!value || value.length <= 4) return value || '—';
    return `••••${value.slice(-4)}`;
  }

  formatAccountType(value: string | null | undefined): string {
    if (!value) return '';
    return value
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
  }

  private countryList = Country.countryList();

  getCountryName(code: string | null | undefined): string {
    if (!code) return '-';
    const country = this.countryList.find((c) => c.code === code);
    return country?.name || code;
  }

  parseAmount(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value.replace(/,/g, ''));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private get payeeEncryptedId(): string {
    return this.payeeData()?.encryptedId || '';
  }

  // ── Contacts ──
  onAddContact(): void {
    if (this.detailsService.contacts().length >= 5) {
      this.alertService.warningAlert({
        content: 'You have reached maximum limit to add contacts'
      });
      return;
    }
    const dialogRef = this.dialog.open(AddContactModalV4Component, {
      maxWidth: '450px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: this.payeeEncryptedId,
        type: 'payees',
        editMode: false,
        data: null
      }
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) this.detailsService.loadContacts(this.payeeEncryptedId);
      });
  }

  onEditContact(contact: IGetContact): void {
    const dialogRef = this.dialog.open(AddContactModalV4Component, {
      maxWidth: '450px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: this.payeeEncryptedId,
        type: 'payees',
        editMode: true,
        data: contact
      }
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) this.detailsService.loadContacts(this.payeeEncryptedId);
      });
  }

  onDeleteContact(contact: IGetContact): void {
    const dialogRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this contact?'
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.detailsService.deleteContact(
            this.payeeEncryptedId,
            contact.encrypted_id
          );
        }
      });
  }

  // ── Todos ──
  onAddTodo(): void {
    if (this.detailsService.todos().length >= 5) {
      this.alertService.warningAlert({
        content: 'You have reached maximum limit to add to-dos'
      });
      return;
    }
    const dialogRef = this.dialog.open(AddTodoModalV4Component, {
      maxWidth: '450px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: this.payeeEncryptedId,
        type: 'payees',
        editMode: false,
        data: null
      }
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) this.detailsService.loadTodos(this.payeeEncryptedId);
      });
  }

  onEditTodo(todo: IGetTodo): void {
    const dialogRef = this.dialog.open(AddTodoModalV4Component, {
      maxWidth: '450px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: this.payeeEncryptedId,
        type: 'payees',
        editMode: true,
        data: todo
      }
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) this.detailsService.loadTodos(this.payeeEncryptedId);
      });
  }

  onDeleteTodo(todo: IGetTodo): void {
    const dialogRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this to-do?'
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.detailsService.deleteTodo(
            this.payeeEncryptedId,
            todo.encrypted_id
          );
        }
      });
  }

  onToggleTodoStatus(todo: IGetTodo): void {
    this.detailsService.completeTodo(
      this.payeeEncryptedId,
      todo.encrypted_id,
      todo.todo_status
    );
  }

  // ── Comments ──
  commentError = signal<string | null>(null);
  commentPosting = signal(false);

  commentsForList = computed<ICommentEntry[]>(() =>
    this.detailsService.comments().map((c) => ({
      id: c.id,
      encrypted_id: c.encrypted_id,
      formated_date: c.formated_date,
      comments: c.comments,
      user_name: c.user_name
    }))
  );

  onSubmitComment(text: string): void {
    const comment = text?.trim();
    if (!comment) return;
    if (this.detailsService.comments().length >= 5) {
      this.alertService.warningAlert({
        content: 'You have reached maximum limit to add comments'
      });
      return;
    }
    this.commentError.set(null);
    this.commentPosting.set(true);
    this.sharedService
      .addComment('payees', this.payeeEncryptedId, { comment })
      .pipe(
        finalize(() => this.commentPosting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.commentError.set('Couldn’t post — please try again.');
            return;
          }
          this.alertService.successAlert({
            content: 'Comment added.',
            close: true,
            timeout: 1500
          });
          this.detailsService.loadComments(this.payeeEncryptedId);
        },
        error: () => this.commentError.set('Couldn’t post — please try again.')
      });
  }

  onDeleteComment(commentId: string): void {
    if (!commentId) return;
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this comment?'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.detailsService.deleteComment(this.payeeEncryptedId, commentId);
        }
      });
  }

  // ── Attachments ──
  attachmentUploading = signal(false);
  attachmentError = signal<string | null>(null);

  attachmentsForList = computed<IAttachmentEntry[]>(() =>
    this.detailsService.attachments().map((a) => ({
      id: a.id,
      encrypted_id: a.encrypted_id,
      formated_date: a.formated_date,
      user_name: a.user_name,
      file_name: a.file_name
    }))
  );

  onAttachmentSelected(file: File): void {
    const payeeId = this.payeeEncryptedId;
    if (!payeeId || !file) return;

    // Type / size / count are validated by the picker (po-attachments-list).
    this.attachmentError.set(null);
    const formData = new FormData();
    formData.append('image', file);

    this.attachmentUploading.set(true);
    this.sharedService
      .addAttachment('payees', payeeId, formData)
      .pipe(
        finalize(() => this.attachmentUploading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.detailsService.loadAttachments(payeeId);
          } else {
            this.attachmentError.set('Couldn’t upload — please try again.');
          }
        },
        error: () => this.attachmentError.set('Couldn’t upload — please try again.')
      });
  }

  onOpenAttachment(attachment: IAttachmentEntry): void {
    const payeeId = this.payeeEncryptedId;
    if (!payeeId || !attachment.encrypted_id) return;
    this.sharedService
      .openAttachment('payees', payeeId, attachment.encrypted_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success && res.data) {
          window.open(res.data, '_blank');
        }
      });
  }

  onDeleteAttachment(attachment: IAttachmentEntry): void {
    if (!attachment.encrypted_id) return;
    const attachmentId = attachment.encrypted_id;
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this attachment?'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.detailsService.deleteAttachment(this.payeeEncryptedId, attachmentId);
        }
      });
  }
}
