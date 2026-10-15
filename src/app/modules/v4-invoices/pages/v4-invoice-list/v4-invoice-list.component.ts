import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Params, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, filter, finalize } from 'rxjs/operators';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { V4DocumentMailModalComponent } from 'src/app/modules/business-tools/document-mail/components/v4-document-mail-modal/v4-document-mail-modal.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V4ThirdpartyImportMainModalComponent } from 'src/app/shared/modal/v4-thirdparty-imports/v4-thirdparty-import-main-modal/v4-thirdparty-import-main-modal.component';
import { V4BankMapModalComponent } from 'src/app/shared/modal/common-modal/v4-bank-map-modal/v4-bank-map-modal.component';
import {
  IDtColumnFields,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import {
  IInvoiceEventData,
  IInvoiceRowData,
  IMailData,
  IPrintData
} from 'src/app/modules/invoices/model/invoice';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import {
  IV3CommonButton,
  IV3DtHeaderElements
} from 'src/app/modules/v3-data-table/models/v3-data-table';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { ICellRendererParams } from '@ag-grid-community/core';
import { CurrencyPipe } from '@angular/common';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4EmailSmsComponent } from 'src/app/modules/v4-invoices/modals/v4-email-sms/v4-email-sms.component';
import { V4AddInvoiceComponent } from 'src/app/modules/v4-invoices/modals/v4-add-invoice/v4-add-invoice.component';
import { V4EntAddInvoiceComponent } from 'src/app/modules/v4-invoices/modals/v4-ent-add-invoice/v4-ent-add-invoice.component';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import {
  IOverviewSummaryCard,
  OverviewCardsV4Component
} from 'src/app/shared/V4/overview-cards-v4/overview-cards-v4.component';
import { V4InvoiceStatusComponent } from './cell-renderers/v4-invoice-status/v4-invoice-status.component';
import { V4InvoiceActionComponent } from './cell-renderers/v4-invoice-action/v4-invoice-action.component';
import {
  V4InvoiceDetailPanelComponent,
  InvoiceDetailTab
} from './v4-invoice-detail-panel/v4-invoice-detail-panel.component';
import { InvoiceActionsService } from '../../services/invoice-actions.service';

@Component({
  selector: 'app-v4-invoice-list',
  templateUrl: './v4-invoice-list.component.html',
  styleUrls: ['./v4-invoice-list.component.scss'],
  standalone: true,
  imports: [
    V4DataTableComponent,
    V4InvoiceDetailPanelComponent,
    OverviewCardsV4Component
  ],
  providers: [CurrencyPipe]
})
export class V4InvoiceListComponent implements OnInit {
  public frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    SelectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    attachmentCommentStatus: V4InvoiceStatusComponent,
    payeeListDropDownFilterComponent: V4PayeeMultiSelectFloatingFilterComponent,
    v4InvoiceActionComponent: V4InvoiceActionComponent
  };

  public tableId = DTTableId.invoice;

  HeaderButtonLoadingProp = { isLoading: false, btn_id: '', btn_name: '' };

  selectionBoxValues!: string;
  selectionBoxValues2!: string;
  selectedRows: string;
  selectedpanel = 'idinvoices';
  fieldsShownByDefault: string[] = ['payee_name', 'grand_total'];
  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: 'Invoice list',
    ignoreColumns: ['id', 'action']
  };

  isVoidInvoiceDisabled = signal(false);
  selectedInvoiceRow = signal<IInvoiceRowData | null>(null);
  isPanelOpen = signal(false);
  panelInitialTab = signal<InvoiceDetailTab>('summary');

  err_msg: string;
  maildata: IMailData;
  invoicestatus: string;
  isEnablePricingRule: boolean;
  columnDefs: ICoulmnDefFields[] = [];

  public matDialog = inject(MatDialog);
  readonly alertService = inject(V4AlertService);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);
  private headerservice = inject(HeaderService);
  private currencyPipe = inject(CurrencyPipe);
  private destroyRef = inject(DestroyRef);
  private invoiceActions = inject(InvoiceActionsService);

  // Invoice summary state lives in InvoiceService; re-exposed for the template.
  readonly summary = this.invoiceService.invoiceSummary;
  readonly summaryLoading = this.invoiceService.invoiceSummaryLoading;
  readonly summaryError = this.invoiceService.invoiceSummaryError;

  cards = computed<IOverviewSummaryCard[]>(() => {
    const data = this.summary();
    const errored = this.summaryError() && !data;
    const fmt = (value?: number): string =>
      errored ? '—' : this.currencyPipe.transform(value ?? 0) ?? '';
    return [
      {
        title: 'TOTAL AMOUNT',
        primaryValue: fmt(data?.grand_total),
        valueColor: 'neutral'
      },
      {
        title: 'TOTAL PAID',
        primaryValue: fmt(data?.paid),
        valueColor: 'green'
      },
      {
        title: 'TOTAL UNPAID',
        primaryValue: fmt(data?.balance),
        valueColor: 'orange'
      }
    ];
  });

  public headerElements = signal<IV3DtHeaderElements>({
    buttons: [
      {
        text: ' New',
        id: 'idnew',
        icon: ['fas', 'plus'],
        type: 'list',
        backGroundInput: 'var(--common-green-color)',
        isAddIcon: true,
        toolTip: 'Create new invoice.',
        toolTipClass: '!ml-4'
      },
      {
        text: 'Print',
        id: 'id_print',
        type: 'list',
        icon: ['fas', 'print'],
        isAddIcon: true,
        toolTip: 'Print your invoice.',
        lucideIcon: 'printer',
        floatingBarVariant: 'outline-primary'
      },
      {
        text: 'Email & SMS',
        id: 'id_email_sms',
        type: 'list',
        icon: ['fas', 'envelope'],
        isAddIcon: true,
        toolTip: 'Email & sms your invoice.',
        lucideIcon: 'mail',
        floatingBarVariant: 'filled-success'
      },
      {
        text: 'Mail',
        id: 'id_mail',
        type: 'list',
        icon: ['fas', 'envelope'],
        isAddIcon: true,
        toolTip: 'Mail your invoice.',
        lucideIcon: 'send',
        floatingBarVariant: 'outline-primary'
      },
      {
        text: 'Pay by Link',
        id: 'id_pay_by_link',
        type: 'list',
        icon: ['fas', 'link'],
        isAddIcon: true,
        toolTip: 'Send a payment link for your invoice.',
        lucideIcon: 'link',
        floatingBarVariant: 'outline-primary'
      },
      {
        text: 'Void',
        id: 'id_void',
        type: 'list',
        icon: ['fas', 'ban'],
        backGroundInput: 'var(--common-yellow-color)',
        isAddIcon: true,
        toolTip: 'Void your invoice.',
        disabled: this.isVoidInvoiceDisabled(),
        lucideIcon: 'ban',
        floatingBarVariant: 'outline-danger'
      },
      {
        id: 'id_delete',
        text: 'Delete',
        roundIcon: ['fas', 'trash'],
        customClasses: 'bg-common-secondary-red-color text-common-red-color',
        toolTip: 'Delete your invoice.',
        lucideIcon: 'trash-2',
        floatingBarVariant: 'filled-danger'
      }
    ],
    topRightButtons: [],
    videoButton: [{ slug: 'invoice' }]
  });

  floatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 1, name: 'Pay' },
          { value: 2, name: 'Paid' },
          { value: 3, name: 'Void' },
          { value: 22, name: 'Emailed' },
          { value: 23, name: 'Mailed' },
          { value: 7, name: 'Imported From QuickBooks' },
          { value: 10, name: 'Imported From Zoho' },
          { value: 11, name: 'Imported From Xero' },
          { value: 13, name: 'Imported From Sage Business' },
          { value: 12, name: 'Imported From FreshBooks' },
          { value: 14, name: 'Imported From Wave' },
          { value: 16, name: 'Imported From NetSuite' }
        ]
      }
    ],
    selectDate: [
      {
        id: 'ocw_invoices.invoice_date',
        initialRange: 'All Time',
        isPrimary: true
      }
    ]
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.floatingFilterComponent,
      { action: [] },
      { actionButton: false, eyeButton: false }
    );
    this.invoiceService
      .getStatusInvoice()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.statusArr = res.data;
      });
    this.destroyRef.onDestroy(() => {
      this.v3DataTableService.rowData = [];
      this.invoiceService.ngOnDestroy();
    });
    this.initializeV3DataTable();
    this.getRowSelectionData();
    this.checkPlugins();
    this.invoiceService.watchInvoiceSummary(this.destroyRef);
  }

  checkPlugins() {
    // eslint-disable-next-line no-underscore-dangle
    this.headerservice._headerData
      .pipe(
        filter((res) => !!res),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res) {
          this.isEnablePricingRule = res.enabledPlugins.includes(
            'invoice_pricing_rule'
          );
          const defaultTopRightButtons = [
            {
              text: 'Invoice Items',
              id: 'invoice_items',
              icon: ['fas', 'list-alt'],
              type: { name: 'list', style: 'green' },
              backGroundInput: 'transparent',
              customClasses: 'font-extralight p-0',
              disableHoverEffect: false,
              isAddIcon: true
            },
            {
              text: 'Invoice Tax',
              id: 'invoice_tax',
              icon: ['fas', 'list-alt'],
              type: { name: 'list', style: 'green' },
              backGroundInput: 'transparent',
              customClasses: 'font-light p-0',
              disableHoverEffect: false,
              isAddIcon: true
            },
            {
              text: 'Import Invoice',
              id: 'import_invoice',
              icon: ['fas', 'arrow-down-to-line'],
              type: { name: 'list', style: 'green' },
              backGroundInput: 'transparent',
              customClasses: 'font-light p-0',
              disableHoverEffect: false,
              isAddIcon: true
            }
          ] as IV3CommonButton[];
          const updatedHeaderElements = {
            ...this.headerElements(),
            topRightButtons: this.isEnablePricingRule
              ? [
                  {
                    text: 'Invoice Rules',
                    id: 'invoice_rules',
                    icon: ['fas', 'list-alt'],
                    type: { name: 'list', style: 'green' },
                    backGroundInput: 'transparent',
                    customClasses: 'font-extralight p-0',
                    disableHoverEffect: false,
                    isAddIcon: true
                  },
                  ...(defaultTopRightButtons as IV3CommonButton[])
                ]
              : (defaultTopRightButtons as IV3CommonButton[])
          } as IV3DtHeaderElements;
          this.headerElements.set(updatedHeaderElements);
        }
      });
  }

  initializeV3DataTable() {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: []
    };
  }

  handleInvoiceAction(row: IInvoiceRowData, label: string): void {
    if (label === 'Add Comment') {
      this.openPanelOnTab(row, 'comments');
      return;
    }
    if (label === 'Add Attachment') {
      this.openPanelOnTab(row, 'attachments');
      return;
    }
    if (label === 'Invoice Audit Trail') {
      this.openPanelOnTab(row, 'audit-trail');
      return;
    }
    this.invoiceActions.handleInvoiceAction(row, label, {
      onChanged: () => {
        this.refreshTable();
        if (label === 'Mark Paid / Partially') this.onInvoicePanelClosed();
      },
      onStatusPatched: (status) =>
        this.selectedInvoiceRow.update((current) =>
          current ? { ...current, status } : current
        )
    });
  }

  cellRendererViewClick(event: { selectedRow: IInvoiceRowData }) {
    if (event.selectedRow) {
      this.selectedInvoiceRow.set(event.selectedRow);
      this.isPanelOpen.set(true);
    }
  }

  openPanelOnTab(row: IInvoiceRowData, tab: InvoiceDetailTab): void {
    this.panelInitialTab.set(tab);
    this.selectedInvoiceRow.set(row);
    this.isPanelOpen.set(true);
  }

  onInvoicePanelClosed(): void {
    this.isPanelOpen.set(false);
    this.panelInitialTab.set('summary');
  }

  onInvoicePanelAction(key: string): void {
    const row = this.selectedInvoiceRow();
    if (!row) return;
    this.handleInvoiceAction(row, key);
  }

  headerButtonClick(event: {
    id: string;
    selectedRows: IInvoiceRowData[];
    tableId: number;
  }) {
    const { selectedRows } = event;

    switch (event.id) {
      case 'idprojects':
        this.openProjectsModal();
        break;
      case 'idproposals':
        this.openProjectsModal();
        break;
      case 'idquotes':
        this.openProjectsModal();
        break;
      case 'idtasks':
        this.openProjectsModal();
        break;
      case 'idnew':
        this.addNewInvoice();
        break;
      case 'idcredit_memo':
        this.openCreditMemo();
        break;
      case 'id_delete':
        this.onMultiDeleteRow(selectedRows);
        break;
      case 'id_void':
        this.onMultiVoidRow(selectedRows);
        break;
      case 'id_email_sms':
        this.openEmailSms(selectedRows);
        break;
      case 'id_pay_by_link':
        this.openEmailSms(selectedRows, true);
        break;
      case 'id_print':
        this.onMultiPrintRow(selectedRows);
        break;
      case 'invoice_tax':
        this.openinvoicetax();
        break;
      case 'import_invoice':
        this.openImport();
        break;
      case 'invoice_items':
        this.openinvoiceitem();
        break;
      case 'invoice_rules':
        this.openinvoiceRules();
        break;
      case 'id_mail':
        this.openInvoiceMail(selectedRows);
        break;
      default:
        break;
    }
  }

  openInvoiceMail(rows: IInvoiceRowData[]) {
    if (!rows || !rows.length) {
      this.alertService.warningAlert({
        content: 'Please selecte at least one invoice.'
      });
      return;
    }
    if (rows.every((val) => Boolean(val.is_mailed))) {
      const content =
        rows.length === 1 ? 'This invoice is' : 'These invoices are';
      this.alertService.warningAlert({
        content: `${content} not eligible for invoice mailing!`
      });
      return;
    }
    const validRows = rows.filter((val) => !val.is_mailed);
    const invalidIds = rows
      .filter((val) => val.is_mailed)
      .map((el) => el.invoice_no);
    this.matDialog
      .open(V4DocumentMailModalComponent, {
        disableClose: true,
        width: '1200px',
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: { type: 'invoice', documents: validRows, invalidIds }
      })
      .afterClosed()
      .subscribe((res: { status?: boolean }) => {
        if (res?.status) {
          this.refreshTable();
        }
      });
  }

  addNewInvoice() {
    if (this.isEnablePricingRule) {
      this.openEntInvoiceModal();
    } else {
      this.openAddInvoiceModal();
    }
  }

  openEntInvoiceModal() {
    this.matDialog
      .open(V4EntAddInvoiceComponent, {
        disableClose: true,
        maxWidth: '900px',
        width: '99%',
        maxHeight: '83%',
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded'
      })
      .afterClosed()
      .subscribe((res: string) => {
        if (res) {
          this.refreshTable();
        }
      });
  }

  openAddInvoiceModal() {
    this.matDialog
      .open(V4AddInvoiceComponent, {
        disableClose: true,
        maxWidth: '1100px',
        width: '99%',
        height: '96vh',
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded'
      })
      .afterClosed()
      .subscribe((res: string) => {
        if (res) {
          this.refreshTable();
        }
      });
  }

  openEmailSms(selectedRows: IInvoiceRowData[], isPayByLink = false) {
    const ids: string[] = [];
    selectedRows.forEach((el: IInvoiceRowData) => {
      ids.push(el.action);
    });
    const itemIds = { ids };
    if (selectedRows.length === 0) {
      this.alertService.infoAlert({
        content: 'Please select at least one row'
      });
    } else {
      let flag = false;
      selectedRows.forEach((val) => {
        if (val.is_mailed) {
          flag = true;
        }
      });
      if (flag) {
        this.alertService.warningAlert({
          content: `You can't email invoices already  mailed`
        });
        return;
      }
      this.HeaderButtonLoadingProp.isLoading = true;
      this.HeaderButtonLoadingProp.btn_id = isPayByLink
        ? 'id_pay_by_link'
        : 'id_email_sms';
      this.updateButtonLoading();
      this.invoiceService
        .getMaildetails(itemIds)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.HeaderButtonLoadingProp.isLoading = false;
            this.updateButtonLoading();
            this.HeaderButtonLoadingProp.btn_id = '';
            catchError(() => of(false));
          })
        )
        .subscribe((res: { data: IMailData }) => {
          if (res.data) {
            this.maildata = res.data;
            const dialogRef = this.matDialog.open(V4EmailSmsComponent, {
              maxWidth: '1280px',
              width: '95%',
              maxHeight: '90vh',
              data: isPayByLink
                ? { ...this.maildata, isPayByLink: true }
                : this.maildata,
              panelClass: 'paddingless-modal-rounded'
            });
            dialogRef
              .afterClosed()
              .subscribe((dialogRes: { status?: boolean }) => {
                if (dialogRes?.status) {
                  this.refreshTable();
                }
               this.headerservice.setHeaderValueChanged(true);

              });
          }
        });
    }
  }

  openCreditMemo() {
    this.router.navigate(['/v4/manage/invoice/memo']);
  }

  openinvoiceitem() {
    this.router.navigate(['/v4/manage/invoice/items']);
  }

  openinvoicetax() {
    this.router.navigate(['/v4/manage/invoice/taxes']);
  }

  openinvoiceRules() {
    this.router.navigate(['/manage/invoice/rules']);
  }

  openImport() {
    const dialogRef = this.matDialog.open(
      V4ThirdpartyImportMainModalComponent,
      {
        maxWidth: '700px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { type: 'invoices' }
      }
    );
    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.refreshTable();
      }
    });
  }

  openProjectsModal() {
    this.selectedpanel = 'idinvoices';
    this.alertService.infoAlert({
      title: 'Coming Soon',
      doneMsg: 'OK',
      cancelMsg: 'cancel',
      timeout: 1000,
      close: true
    });
  }

  onMultiPrintRow(selectedRow: IInvoiceRowData[]) {
    const ids: string[] = [];
    if (!this.unmapedInvoices(selectedRow)) {
      return;
    }
    selectedRow.forEach((el: IInvoiceRowData) => {
      ids.push(el.action);
    });
    const itemIds = { ids };
    if (selectedRow.length === 0) {
      this.alertService.infoAlert({
        content: 'Please select at least one row'
      });
    } else {
      this.HeaderButtonLoadingProp.isLoading = true;
      this.HeaderButtonLoadingProp.btn_id = 'id_print';
      this.updateButtonLoading();
      this.invoiceService
        .multiprint(itemIds)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.HeaderButtonLoadingProp.isLoading = false;
            this.updateButtonLoading();
            this.HeaderButtonLoadingProp.btn_id = '';
          }),
          catchError(() => of(false))
        )
        .subscribe((res) => {
          if ((res as { success: boolean; data: IPrintData }).success) {
            const iframe = document.createElement('iframe');
            iframe.srcdoc = (
              res as { success: boolean; data: IPrintData }
            ).data.printData;
            iframe.style.visibility = 'hidden';
            document.body.appendChild(iframe);
          }
        });
    }
  }

  onMultiDeleteRow(selectedRow: IInvoiceRowData[]) {
    const ids: string[] = [];
    selectedRow.forEach((el: IInvoiceRowData) => {
      ids.push(el.action);
    });
    const itemId = { ids };
    if (selectedRow.length === 0) {
      this.alertService.infoAlert({
        content: 'Please select at least one row'
      });
    } else {
      this.alertService
        .confirmAlert({ content: 'Are you sure you want to delete?' })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            this.HeaderButtonLoadingProp.isLoading = true;
            this.HeaderButtonLoadingProp.btn_id = 'id_delete';
            this.updateButtonLoading();
            this.invoiceService
              .MultiDeleteInvoice(itemId)
              .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => {
                  this.HeaderButtonLoadingProp.isLoading = false;
                  this.updateButtonLoading();
                  this.HeaderButtonLoadingProp.btn_id = '';
                })
              )
              .subscribe((res) => {
                if (res.success) {
                  this.refreshTable();
                  this.alertService.successAlert({
                    title: 'Success',
                    content: 'Invoice Deleted ',
                    timeout: 2000,
                    close: true
                  });
                }
              });
          }
        });
    }
  }

  onMultiVoidRow(selectedRow: IInvoiceRowData[]) {
    const ids: string[] = [];
    if (!this.unmapedInvoices(selectedRow)) {
      return;
    }
    selectedRow.forEach((el: IInvoiceRowData) => {
      ids.push(el.action);
    });
    const itemIds = { ids };
    if (selectedRow.length === 0) {
      this.alertService.infoAlert({
        content: 'Please select at least one row'
      });
    } else {
      this.alertService
        .confirmAlert({ content: 'Are you sure you want to void?' })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            this.HeaderButtonLoadingProp.isLoading = true;
            this.HeaderButtonLoadingProp.btn_id = 'id_void';
            this.updateButtonLoading();
            this.invoiceService
              .multiVoidInvoice(itemIds)
              .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => {
                  this.HeaderButtonLoadingProp.isLoading = false;
                  this.updateButtonLoading();
                  this.HeaderButtonLoadingProp.btn_id = '';
                })
              )
              .subscribe((res) => {
                if (res.success) {
                  this.refreshTable();
                  this.alertService.successAlert({
                    title: 'Success',
                    content: 'Invoice Voided ',
                    timeout: 2000,
                    close: true
                  });
                }
              });
          }
        });
    }
  }

  onRowSelected(event: { api: { getSelectedRows(): IInvoiceRowData[] } }) {
    const gridApi = event.api;
    const selectedRows = gridApi.getSelectedRows();
    this.disableVoidButton(selectedRows);
  }

  getRowSelectionData() {
    this.v3DataTableService.v3RowSelectionData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const selectedRowData = res.map((item) => item.data);
          this.disableVoidButton(selectedRowData);
        }
      });
  }

  disableVoidButton(selectedRows: IInvoiceRowData[]) {
    this.isVoidInvoiceDisabled.set(false);
    selectedRows.forEach((rowData) => {
      const validStatusValues = [1, 2, 7, 10, 11, 12, 13, 14];
      if (
        (validStatusValues.includes(rowData.status) &&
          rowData.is_mailed === 1) ||
        (rowData.is_emailed === 1 && rowData.status === 1) ||
        rowData.status === 2 ||
        (rowData.status === 11 && rowData.isApprovedXero === 0) ||
        ((validStatusValues.includes(rowData.status) || rowData.paid > 0) &&
          rowData.is_mailed === 0)
      ) {
        this.isVoidInvoiceDisabled.set(true);
      }
    });
    this.headerElements.update((el) => ({
      ...el,
      buttons: el.buttons?.map((btn) =>
        btn.id === 'id_void'
          ? { ...btn, disabled: this.isVoidInvoiceDisabled() }
          : btn
      )
    }));
  }

  cellRendererDangerClick(eventData: IInvoiceEventData) {
    if (eventData.id === 'id_bank_not_verified') {
      this.openBankSelectModal(eventData);
    }
  }

  openBankSelectModal(eventData: IInvoiceEventData) {
    const dRef = this.matDialog.open(V4BankMapModalComponent, {
      width: '400px',
      maxWidth: '400px',
      data: eventData,
      panelClass: 'paddingless-modal-rounded'
    });
    dRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshTable();
      }
    });
  }

  unmapedInvoices(selectedItems: IInvoiceRowData[]): boolean {
    let unmaped = true;
    selectedItems.forEach((e) => {
      if (
        e.bank_account_id === 0 ||
        e.bank_account_id === undefined ||
        e.bank_account_id === null
      ) {
        unmaped = false;
      }
    });
    if (!unmaped) {
      if (selectedItems.length === 1) {
        const warn = this.alertService.warningAlert({
          title: 'Error',
          content: `Please map the bank account to process the invoice.`,
          doneMsg: 'Map now',
          cancelMsg: 'Cancel',
          isCancel: true
        });
        warn.afterClosed().subscribe((r) => {
          if (r) {
            this.openBankSelectModal({
              selectedRow: selectedItems[0],
              id: 'id_bank_not_verified',
              tableId: undefined
            });
          }
        });
      } else {
        this.openWarningAlert(
          'Bank account of some invoices are not mapped. Please map the bank account for further processing.'
        );
      }
      return false;
    }
    return true;
  }

  openWarningAlert(content: string, doneMsg?: string) {
    return this.alertService.warningAlert({
      title: 'Error',
      content,
      doneMsg: doneMsg || 'OK'
    });
  }

  onExportData(filterModel: {
    items: string[];
    fromDate: string | Date;
    toDate: string | Date;
    type: 'csv' | 'pdf';
  }) {
    this.v3DataTableService
      .exportTable(filterModel, 'invoices')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (val.message) {
          this.alertService.successAlert({
            title: 'Success!',
            content: val.message,
            close: false
          });
        } else {
          window.open(val.data.url);
        }
      });
  }

  colDefId: ICoulmnDefFields = {
    headerName: '',
    field: 'id',
    suppressFloatingFilterButton: true,
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    sortable: false,
    checkboxSelection: true,
    floatingFilterComponent: 'headerCheckBoxComponent',
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    pinned: 'left' as const,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    resizable: false,
    headerClass: 'pl-3.5',
    headerCheckboxSelection: true,
    showDisabledCheckboxes: true,
    cellClass: 'flex justify-center',
    cellRenderer: () => ''
  };

  colDefDate = {
    headerName: 'Date',
    field: 'ocw_invoices.invoice_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    minWidth: 130,
    maxWidth: 160,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) =>
      params?.data?.invoice_date ?? '',
    cellRendererForExport: (params: ICellRendererParams) =>
      params?.data?.invoice_date
  };

  colDefFrom = {
    headerName: 'From',
    field: 'bank_accounts.bank_account_nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
    maxWidth: 220,
    cellRenderer: (params: ICellRendererParams) =>
      params?.data?.bank_account_nick_name ?? '',
    cellRendererForExport: (params: ICellRendererParams) =>
      params?.data?.bank_account_nick_name
  };

  colDefCreditNo = {
    headerName: 'Invoice No',
    field: 'invoice_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
    maxWidth: 150
  };

  colDefCreatedBy = {
    headerName: 'Created By',
    field: 'client_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 120,
    maxWidth: 180
  };

  colDefpayeeName = {
    headerName: 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'payeeListDropDownFilterComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 175,
    maxWidth: 300,
    cellRenderer: (params: ICellRendererParams) =>
      params?.data?.payee_name ?? ''
  };

  colDefPaid = {
    headerName: 'Paid',
    field: 'paid',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 150,
    maxWidth: 200,
    cellClass:
      'flex justify-end pr-3 text-end v4-amount-col !text-[color:var(--v4-badge-success-text-color)]',
    headerClass: 'v4-amount-col',
    cellRenderer: (params: Params) =>
      this.currencyPipe.transform(params.value as string)
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'grand_total',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 150,
    maxWidth: 200,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: (params: ICellRendererParams) =>
      this.currencyPipe.transform(params?.data?.grand_total) ?? ''
  };

  colDefBalance = {
    headerName: 'Balance',
    field: 'ocw_invoices.balance',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 150,
    maxWidth: 200,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellStyle: (params: Params) => ({
      color: params.data?.balance > 0 ? 'red' : 'var(--v4-subtle-text-color)'
    }),
    cellRenderer: (params: Params) =>
      this.currencyPipe.transform(params.data.balance)
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: window.innerWidth <= 1500 ? 100 : 150
  };

  statusArr: string[] = [];
  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    cellRenderer: 'attachmentCommentStatus',
    cellRendererParams: {
      onCommentClick: (row: IInvoiceRowData, tab: InvoiceDetailTab) =>
        this.openPanelOnTab(row, tab),
      onAttachmentClick: (row: IInvoiceRowData, tab: InvoiceDetailTab) =>
        this.openPanelOnTab(row, tab)
    },
    cellRendererForExport: (params: Params) => {
      const value = params?.data?.status;
      if (params.data.paid > 0 && value === 1) return 'partially paid';
      if (value === 1 && params.data.is_emailed === 1) return 'Emailed';
      if (value === 1 && params.data.is_mailed === 1) return 'Mailed';
      if (value === 1 && params.data.balance > 0) return 'New';
      if (value === 2) return 'paid';
      if (value === 3) return 'Voided';
      if (value === 6) return 'Rejected';
      if (value === 7 && params.data.is_mailed === 0) return 'imported from QB';
      if (value === 10 && params.data.is_mailed === 0)
        return 'imported from Zoho';
      if (value === 11 && params.data.is_mailed === 0)
        return 'imported from Xero';
      if (value === 13 && params.data.is_mailed === 0)
        return 'imported from Sage Business';
      if (value === 12 && params.data.is_mailed === 0)
        return 'imported from FreshBooks';
      if (value === 14) return 'imported from Wave';
      if (value === 16) return 'imported from NetSuite';
      if (params.data.balance <= 0) return 'Pay';
      return '';
    }
  };

  colDefAction = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 90,
    maxWidth: 110,
    sortable: false,
    pinned: 'left' as const,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    resizable: false,
    cellClass: 'flex items-center',
    cellRenderer: 'v4InvoiceActionComponent',
    cellRendererParams: () => ({
      onViewClick: (row: IInvoiceRowData) =>
        this.cellRendererViewClick({ selectedRow: row }),
      onActionClick: (row: IInvoiceRowData, label: string) =>
        this.handleInvoiceAction(row, label),
      onMapClick: (row: IInvoiceRowData) =>
        this.openBankSelectModal({
          selectedRow: row,
          id: 'id_bank_not_verified',
          tableId: this.tableId.toString()
        })
    }),
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: { tableName: 'invoice_table' }
  };

  columnFields: IDtColumnFields[] = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      isChecked: true,
      colDef: this.colDefId
    },
    {
      id: 'id_action',
      name: 'Action',
      isDisabled: false,
      isChecked: true,
      colDef: this.colDefAction
    },
    {
      id: 'id_date',
      name: 'Date',
      colDef: this.colDefDate,
      isChecked: true,
      isDisabled: false
    },
    {
      id: 'id_invoice_no',
      name: 'Invoice No',
      isDisabled: false,
      isChecked: true,
      colDef: this.colDefCreditNo
    },
    {
      id: 'id_client_name',
      name: 'Created By',
      isDisabled: false,
      isChecked: true,
      colDef: this.colDefCreatedBy
    },
    {
      id: 'id_from',
      name: 'From',
      isDisabled: false,
      isChecked: true,
      colDef: this.colDefFrom
    },
    {
      id: 'id_payeeName',
      name: 'Payee',
      colDef: this.colDefpayeeName,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_amount',
      name: 'Amount',
      colDef: this.colDefAmount,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_Paid',
      name: 'Paid',
      colDef: this.colDefPaid,
      isChecked: true,
      isDisabled: false
    },
    {
      id: 'id_balance',
      name: 'Balance',
      colDef: this.colDefBalance,
      isChecked: true,
      isDisabled: false
    },
    {
      id: 'id_memo',
      name: 'Memo',
      colDef: this.colDefMemo,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_status',
      name: 'Status',
      colDef: this.colDefStatus,
      isChecked: true,
      isDisabled: false
    }
  ];

  updateButtonLoading() {
    const headerElements = this.headerElements();
    if (headerElements && headerElements.buttons) {
      const button = headerElements.buttons.find(
        (b) => b.id === this.HeaderButtonLoadingProp.btn_id
      );
      if (button) {
        button.loading = this.HeaderButtonLoadingProp.isLoading;
      }
    }
  }

  refreshTable() {
    this.dataTableService.setRefreshStatus(true);
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }
}
