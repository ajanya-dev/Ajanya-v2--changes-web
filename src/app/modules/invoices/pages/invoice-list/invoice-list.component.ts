import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Params, Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError, filter, finalize } from 'rxjs/operators';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { DocumentMailModalComponent } from 'src/app/modules/business-tools/document-mail/components/document-mail-modal/document-mail-modal.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { ThirdpartyImportMainModalComponent } from 'src/app/shared/modal/thirdparty-imports/thirdparty-import-main-modal/thirdparty-import-main-modal.component';
import { BankMapModalComponent } from 'src/app/shared/modal/common-modal/bank-map-modal/bank-map-modal.component';
import {
  IDtCellrendererBtn,
  IDtColumnFields,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import {
  IAlertRes,
  IInvoiceData,
  IInvoiceEventData,
  IInvoiceRowData,
  IMailData,
  IPrintData
} from 'src/app/modules/invoices/model/invoice';
import { IActionComponentProp } from 'src/app/modules/more/model/all-reports';
import { IApiResMesssage } from 'src/app/models/api';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import {
  IV3CommonButton,
  IV3DtHeaderElements
} from 'src/app/modules/v3-data-table/models/v3-data-table';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ICellRendererParams } from '@ag-grid-community/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDollarSign } from '@fortawesome/pro-solid-svg-icons';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { InvoiceAddAttachmentCommentComponent } from './addAttachmentComment';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { InvoiceAuditTrailComponent } from '../../modals/invoice-audit-trail/invoice-audit-trail.component';
import { EmailSmsComponent } from '../../modals/email-sms/email-sms.component';
import { AddPaymentComponent } from '../../modals/add-payment/add-payment.component';
import { AddInvoiceComponent } from '../../modals/add-invoice/add-invoice.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { InvoiceRulesModalComponent } from '../../modals/invoice-rules-modal/invoice-rules-modal.component';
import { EntAddInvoiceModalComponent } from '../../modals/ent-add-invoice-modal/ent-add-invoice-modal.component';

@Component({
  selector: 'app-invoice-list',
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss'],
  standalone: true,
  imports: [
    V3DataTableComponent,
    CommonButtonV35Component,
    CurrencyPipe,
    FaIconComponent,
    NgClass
  ],
  providers: [CurrencyPipe]
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  /**
   * External child component
   */
  public frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    SelectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    attachmentCommentStatus: InvoiceAddAttachmentCommentComponent,
    payeeListDropDownFilterComponent: DtMultiDropdownPayeeComponent,
    V3DTCommonFilterComponent,
    V3PayeeNameComponent
  };

  public tableId = DTTableId.invoice; // Data Table Id

  HeaderButtonLoadingProp = { isLoading: false, btn_id: '', btn_name: '' };

  selectionBoxValues!: string;
  selectionBoxValues2!: string;
  cellRendererId: string;
  selectedRows: string;
  subscriptions: Subscription[] = [];
  selectedpanel = 'idinvoices';
  fieldsShownByDefault: string[] = ['payee_name', 'grand_total'];
  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: 'Invoice list',
    ignoreColumns: ['id', 'action']
  };

  isVoidInvoiceDisabled = signal(false);

  faDollarSign = faDollarSign;

  comingSoon = false;

  err_msg: string;
  maildata: IMailData;
  invoicestatus: string;
  isEnablePricingRule: boolean;
  columnDefs: ICoulmnDefFields[] = [];

  public matDialog = inject(MatDialog);
  public alertService = inject(AlertService);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);
  private headerservice = inject(HeaderService);
  private payeeModalService = inject(PayeeModalService);
  private currencyPipe = inject(CurrencyPipe);
  private destroyRef = inject(DestroyRef);

  // Invoice summary state lives in InvoiceService; re-exposed for the template.
  readonly summary = this.invoiceService.invoiceSummary;
  readonly summaryLoading = this.invoiceService.invoiceSummaryLoading;
  readonly summaryError = this.invoiceService.invoiceSummaryError;

  /**
   * Header elements properties
   */
  public headerElements = signal<IV3DtHeaderElements>({
    panelButtons: [
      {
        name: 'Projects',
        id: 'idprojects'
      },
      {
        name: 'Proposals',
        id: 'idproposals'
      },
      {
        name: 'Quotes',
        id: 'idquotes'
      },
      {
        name: 'Tasks',
        id: 'idtasks'
      },
      {
        name: 'Invoices',
        id: 'idinvoices'
      },
      {
        name: 'Credit Memo',
        id: 'idcredit_memo'
      }
    ],
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
        text: ' Print',
        id: 'id_print',
        type: 'list',
        icon: ['fas', 'print'],
        isAddIcon: true,
        toolTip: 'Print your invoice.'
      },
      {
        text: ' Email & SMS ',
        id: 'id_email_sms',
        type: 'list',
        icon: ['fas', 'envelope'],
        isAddIcon: true,
        toolTip: 'Email & sms your invoice.'
      },
      {
        text: 'Mail',
        id: 'id_mail',
        type: 'list',
        icon: ['fas', 'envelope'],
        isAddIcon: true,
        toolTip: 'Mail your invoice.'
      },
      {
        text: ' Pay by Link',
        id: 'id_pay_by_link',
        type: 'list',
        icon: ['fas', 'link'],
        isAddIcon: true,
        toolTip: 'Send a payment link for your invoice.'
      },
      {
        text: '  Void',
        id: 'id_void',
        type: 'list',
        icon: ['fas', 'ban'],
        backGroundInput: 'var(--common-yellow-color)',
        isAddIcon: true,
        toolTip: 'Void your invoice.',
        disabled: this.isVoidInvoiceDisabled()
      },
      {
        id: 'id_delete',
        roundIcon: ['fas', 'trash'],
        customClasses: 'bg-common-secondary-red-color text-common-red-color',
        toolTip: 'Delete your invoice.'
      }
    ],
    topRightButtons: [],
    videoButton: [
      {
        slug: 'invoice'
      }
    ]
  });

  /**
   * Filter custom component
   */
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
          { value: 7, name: 'Imported from QuickBooks' },
          { value: 10, name: 'Imported from Zoho' },
          { value: 11, name: 'Imported from Xero' },
          { value: 13, name: 'Imported from Sage Business' },
          { value: 12, name: 'Imported from FreshBooks' },
          { value: 14, name: 'Imported from Wave' },
          { value: 16, name: 'Imported from NetSuite' }
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

  /**
   * Cell renderer component
   */
  cellRenderer: IDtCellrendererBtn = {
    action: [
      {
        name: 'Print',
        id: 'idPrintRow',
        icon: 'fa fa-print'
      },
      {
        name: 'Mark Paid / Partailly',
        id: 'idMarkAsPaidRow',
        icon: 'fa fa-money-bill-1'
      },
      {
        name: 'Resend Email',
        id: 'idReSendRow',
        icon: 'fa fa-envelope'
      },
      {
        name: 'Resend SMS',
        id: 'idReSendSMSRow',
        icon: 'fa fa-mobile'
      },
      {
        name: 'Add Comment',
        id: 'idAddCommentRow',
        icon: 'fa fa-comments'
      },
      {
        name: 'Add Attachment',
        id: 'idAddAttachmentRow',
        icon: 'fa fa-paperclip'
      },
      {
        name: 'Invoice Audit Trail',
        id: 'idAuditTrailRow',
        icon: 'fa fa-history'
      },
      {
        name: 'Void',
        id: 'idVoidRow',
        icon: 'fa fa-ban'
      },
      {
        name: 'Edit',
        id: 'idEditRow',
        icon: 'fa fa-edit'
      },
      {
        name: 'Clone Invoice',
        id: 'idCloneRow',
        icon: 'fa fa-clone'
      },
      {
        name: 'Delete',
        id: 'idDeleteRow',
        icon: 'fa fa-trash'
      }
    ]
  };

  /**
   * Action component properties
   */
  actionComponentProp: IActionComponentProp = {
    actionButton: true,
    eyeButton: true
  };

  ngOnInit(): void {
    /**
     * Pass data to data table service
     */
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.floatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.subscriptions.push(
      this.invoiceService.getStatusInvoice().subscribe((res) => {
        this.statusArr = res.data;
      })
    );
    this.initializeV3DataTable();
    this.getRowSelectionData();
    this.checkPlugins();
    this.invoiceService.watchInvoiceSummary(this.destroyRef);
  }

  checkPlugins() {
    // eslint-disable-next-line no-underscore-dangle
    this.headerservice._headerData
      .pipe(filter((res) => !!res))
      .subscribe((res) => {
        if (res) {
          this.isEnablePricingRule = res.enabledPlugins.includes(
            'invoice_pricing_rule'
          );
          this.columnDefs = [
            this.colDefId,
            this.colDefDate,
            this.colDefCreditNo,
            ...(this.isEnablePricingRule ? [this.colDefCreatedBy] : []),
            this.colDefFrom,
            this.colDefpayeeName,
            this.colDefAmount,
            this.colDefPaid,
            this.colDefBalance,
            this.colDefMemo,
            this.colDefStatus,
            this.colDefAction
          ];
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

  /**
   * @description Setting up the payload  for loading ag grid
   */
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

  /* WHEN THE ADD COMMENTS ON ACTION BUTTON  CLICKED  */

  /**
   * @description find which cell action button is clicked (Eye button or action button)
   * @param event -Param for the method
   */
  cellRendererActionClick(event: { selectedRow: IInvoiceRowData; id: string }) {
    if (event.selectedRow) {
      const selectedItem = event.selectedRow;
      if (selectedItem.status === 3) {
        this.cellRenderer.action[7].name = 'Unvoid';
        this.cellRenderer.action[7].id = 'idUnvoidRow';
        this.cellRenderer.action[7].icon = 'fa fa-ban';
      } else {
        this.cellRenderer.action[7].name = 'Void';
        this.cellRenderer.action[7].id = 'idVoidRow';
        this.cellRenderer.action[7].icon = 'fa fa-ban';
      }

      if (selectedItem.status === 1 && selectedItem.is_mailed === 1) {
        // Disable Buttons
        this.dataTableService.setActionButtonDisable(true, [
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          'idVoidRow',
          'idEditRow',
          '',
          ''
        ]);
      } else if (selectedItem.status === 1 && selectedItem.is_emailed === 1) {
        this.dataTableService.setActionButtonDisable(true, [
          '',
          '',
          'idReSendRow',
          'idReSendSMSRow',
          '',
          '',
          '',
          'idVoidRow',
          'idEditRow',
          '',
          ''
        ]);
      } else if (selectedItem.status === 2) {
        this.dataTableService.setActionButtonDisable(true, [
          '',
          'idMarkAsPaidRow',
          'idReSendRow',
          'idReSendSMSRow',
          '',
          '',
          '',
          'idVoidRow',
          'idEditRow',
          '',
          ''
        ]);
      } else if (selectedItem.status === 3) {
        this.dataTableService.setActionButtonDisable(true, [
          '',
          'idMarkAsPaidRow',
          'idReSendRow',
          'idReSendSMSRow',
          '',
          '',
          '',
          '',
          'idEditRow',
          '',
          ''
        ]);
      } else if (
        selectedItem.status === 11 &&
        selectedItem.isApprovedXero === 0
      ) {
        this.dataTableService.setActionButtonDisable(true, [
          '',
          'idMarkAsPaidRow',
          'idReSendRow',
          'idReSendSMSRow',
          '',
          '',
          '',
          'idVoidRow',
          'idEditRow',
          'idCloneRow',
          ''
        ]);
      } else if (
        ((selectedItem.status === 7 ||
          selectedItem.status === 10 ||
          selectedItem.status === 11 ||
          selectedItem.paid > 0) &&
          selectedItem.is_mailed === 0) ||
        selectedItem.status === 14
      ) {
        this.dataTableService.setActionButtonDisable(true, [
          '',
          '',
          'idReSendRow',
          'idReSendSMSRow',
          '',
          '',
          '',
          'idVoidRow',
          'idEditRow',
          'idCloneRow',
          ''
        ]);
      } else if (selectedItem.status === 13 && selectedItem.is_mailed === 0) {
        this.dataTableService.setActionButtonDisable(true, [
          '',
          '',
          'idReSendRow',
          'idReSendSMSRow',
          '',
          '',
          '',
          '',
          'idEditRow',
          'idCloneRow',
          ''
        ]);
      } else if (selectedItem.status === 12 && selectedItem.is_mailed === 0) {
        this.dataTableService.setActionButtonDisable(true, [
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          'idVoidRow',
          'idEditRow',
          'idCloneRow',
          ''
        ]);
      } else if (
        (selectedItem.status === 7 ||
          selectedItem.status === 10 ||
          selectedItem.status === 11 ||
          selectedItem.status === 13 ||
          selectedItem.status === 12) &&
        selectedItem.is_mailed === 1
      ) {
        this.dataTableService.setActionButtonDisable(true, [
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          'idVoidRow',
          'idEditRow',
          '',
          ''
        ]);
      } else {
        this.dataTableService.setActionButtonDisable(true, [
          '',
          '',
          'idReSendRow',
          'idReSendSMSRow',
          '',
          '',
          '',
          '',
          '',
          '',
          ''
        ]);
      }

      switch (event.id) {
        case 'idDeleteRow':
          this.onDeleteRowT(selectedItem);
          break;
        case 'idVoidRow':
          this.onVoidRow(selectedItem);
          break;
        case 'idUnvoidRow':
          this.onUnvoidRow(selectedItem);
          break;
        case 'idMarkAsPaidRow':
          this.onMarkAsPaidRow(selectedItem);
          break;
        case 'idAuditTrailRow':
          this.onAuditTrailRow(selectedItem);
          break;
        case 'idEditRow':
          this.onEditRow(selectedItem);
          break;
        case 'idAddCommentRow':
          this.openAddCommentModal(selectedItem);
          break;
        case 'idAddAttachmentRow':
          this.openAddAttachmentModal(selectedItem);
          break;
        case 'idCloneRow':
          this.onCloneRow(selectedItem);
          break;
        case 'idPrintRow':
          this.onPrintRow(selectedItem);
          break;
        case 'idReSendRow':
          this.onResendEmail(selectedItem);
          break;
        case 'idReSendSMSRow':
          this.onResendSMS(selectedItem);
          break;
        case 'id_bank_not_verified':
          this.cellRendererDangerClick({
            ...event,
            tableId: this.tableId.toString()
          });
          break;
        default:
          break;
      }
    }
  }

  cellRendererViewClick(event: { selectedRow: IInvoiceRowData }) {
    if (event.selectedRow) {
      this.router.navigate(['/manage/invoice/statement'], {
        queryParams: {
          id: event.selectedRow.action,
          type: event.selectedRow.status === 3 ? 'unvoid' : 'void',
          is_mailed: event.selectedRow.is_mailed === 1 ? 1 : 0,
          is_emailed: event.selectedRow.is_emailed === 1 ? 1 : 0,
          status: event.selectedRow.status
        }
      });
    }
  }

  /**
   * @description Determines which header button is clicked.
   * @param {Object} event - The event object containing information about the click event.
   * @param {IInvoiceRowData[]} event.selectedRows - The list of the selected rows.
   * @param {string} event.id - The ID of the selected button.
   * @param {string} event.tableId - The ID of the selected table.
   */
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

  /**
   * Opening invoice mail modal after necessary validations.
   */
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
      .open(DocumentMailModalComponent, {
        disableClose: true,
        width: '1200px',
        autoFocus: false,
        data: {
          type: 'invoice',
          documents: validRows,
          invalidIds
        }
      })
      .afterClosed()
      .subscribe(() => {
        this.refreshTable();
      });
  }

  addNewInvoice() {
    if (this.isEnablePricingRule) {
      this.openEntInvoiceModal();
    } else {
      this.openAddInvoiceModal();
    }
  }

  /**
   * Opens invoice list
   */
  openEntInvoiceModal() {
    this.matDialog
      .open(EntAddInvoiceModalComponent, {
        disableClose: true,
        maxWidth: '900px',
        width: '99%',
        maxHeight: '83%',
        autoFocus: false
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
      .open(AddInvoiceComponent, {
        disableClose: true,
        maxWidth: '1010px',
        width: '99%',
        maxHeight: '83%',
        autoFocus: false
      })
      .afterClosed()
      .subscribe((res: string) => {
        if (res) {
          this.refreshTable();
        }
      });
  }

  /**
   * Opens invoice Audit trail.
   */
  onAuditTrailRow(selectedItem: IInvoiceRowData) {
    this.matDialog.open(InvoiceAuditTrailComponent, {
      maxWidth: '1010px',
      width: '93%',
      data: selectedItem.action
    });
  }

  /**
   * @description Email and sms details
   * @param selectedRows -Param for the Method
   * @param isPayByLink -Opens the modal in bulk "Pay by Link" mode
   */
  openEmailSms(selectedRows: IInvoiceRowData[], isPayByLink = false) {
    const ids: string[] = [];
    selectedRows.forEach((el: IInvoiceRowData) => {
      ids.push(el.action);
    });
    const itemIds = { ids };
    if (selectedRows.length === 0) {
      const infoData = {
        content: 'Please select at least one row'
      };
      this.alertService.infoAlert(infoData);
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

      this.subscriptions.push(
        this.invoiceService
          .getMaildetails(itemIds)
          .pipe(
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

              const dialogRef = this.matDialog.open(EmailSmsComponent, {
                maxWidth: '1010px',
                width: '90%',
                data: isPayByLink
                  ? { ...this.maildata, isPayByLink: true }
                  : this.maildata
              });
              dialogRef.afterClosed().subscribe(() => {
                this.refreshTable();
                this.headerservice.setHeaderValueChanged(true);
              });
            }
          })
      );
    }
  }

  /**
   * opens credit memo
   */
  openCreditMemo() {
    this.router.navigate(['/manage/invoice/memo']);
  }

  /**
   * Navigation to invoice items
   */
  openinvoiceitem() {
    this.router.navigate(['/manage/invoice/items']);
  }

  /**
   * Navigation to open invoice tax
   */
  openinvoicetax() {
    this.router.navigate(['/manage/invoice/taxes']);
  }

  openinvoiceRules() {
    this.router.navigate(['/manage/invoice/rules']);
  }

  /**
   * Open import modal
   */
  openImport() {
    const dialogRef = this.matDialog.open(ThirdpartyImportMainModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      data: {
        type: 'invoices'
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.refreshTable();
      }
    });
  }

  /** ************************************ Projects ********************************** */

  openProjectsModal() {
    this.selectedpanel = 'idinvoices';

    const data = {
      title: 'Coming Soon',
      doneMsg: 'OK',
      cancelMsg: 'cancel',
      timeout: 1000,
      close: true
    };

    this.alertService.infoAlert(data);
  }

  /**
   * @description -method for Resend SMS
   * @param selectedRows -Param for the method
   */
  onResendSMS(selectedRows: IInvoiceRowData) {
    const data = { id: selectedRows.action, type: 2 };
    this.subscriptions.push(
      this.invoiceService.resendEmail(data).subscribe(
        (res: IApiResMesssage) => {
          if (res) {
            this.alertService.successAlert({
              title: 'success',
              content: 'SMS resent',
              close: true,
              timeout: 2000
            });
            this.headerservice.setHeaderValueChanged(true);
          }
        },
        (err) => {
          this.ResendSmsValidation(err, selectedRows);
        }
      )
    );
  }

  /**
   * @description -If Payee has no Phone Number redirect to payee edit
   * @param err -Param for the method
   * @param selectedRows -Param for the method
   */
  ResendSmsValidation(err: IAlertRes, selectedRows: IInvoiceRowData) {
    const errMsg = 'Invalid payee Phone number, please update';
    if (err.error?.errorCode === 514) {
      this.alertService
        .warningAlert({
          content: errMsg,
          doneMsg: 'Add',
          isCancel: true,
          cancelMsg: 'Not Now'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.subscriptions.push(
              this.payeeModalService
                .openEditPayee(selectedRows.payee_id, 'addPayeeModal', {
                  edit: true,
                  id: selectedRows.payee_id,
                  type: ['payeePhone']
                })
                .subscribe((payeeModal) => {
                  if (payeeModal) {
                    this.subscriptions.push(
                      payeeModal.afterClosed().subscribe((resData) => {
                        if (resData?.success) {
                          this.onResendSMS(selectedRows);
                          this.refreshTable();
                        }
                      })
                    );
                  }
                })
            );
          }
        });
    }
  }

  /**
   * @description -method for resend Email
   */
  onResendEmail(selectedRows: IInvoiceRowData) {
    const data = { id: selectedRows.action, type: 1 };

    this.subscriptions.push(
      this.invoiceService.resendEmail(data).subscribe((res) => {
        if (res) {
          this.alertService.successAlert({
            title: 'success',
            content: 'Email resent',
            close: true,
            timeout: 2000
          });
          this.headerservice.setHeaderValueChanged(true);
        }
      })
    );
  }

  /**
   * @description print single invoice
   * @param selectedItem -Param for the function (selected Item)
   */
  onPrintRow(selectedItem: IInvoiceRowData) {
    this.subscriptions.push(
      this.invoiceService.singleprint(selectedItem.action).subscribe((res) => {
        if (res.success) {
          const iframe = document.createElement('iframe');
          iframe.srcdoc = res.data.printData;
          iframe.style.visibility = 'hidden';
          document.body.appendChild(iframe);
        }
      })
    );
  }

  /**
   * @description -single invoice void
   * @param selectedRow -Param for the function
   */
  onDeleteRowT(selectedRow: IInvoiceRowData) {
    const data = {
      content: 'Are you sure you want to delete?'
    };

    const confirm = this.alertService.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.invoiceService
            .DeleteSingleInvoice(selectedRow.action)
            .subscribe((res) => {
              const alertData = {
                title: 'Success',
                content: 'Invoice Deleted ',
                timeout: 2000,
                close: true
              };

              if (res.success) {
                this.refreshTable();
                this.alertService.successAlert(alertData);
              }
            })
        );
      }
    });
  }

  /**
   * @description Single invoice Void
   * @param selectedRow -Param for the function
   */
  onVoidRow(selectedRow: IInvoiceRowData) {
    const data = {
      content: 'Are you sure you want to void?'
    };

    const confirm = this.alertService.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.invoiceService
            .voidSingleInvoice(selectedRow.action)
            .subscribe((res) => {
              const alertData = {
                title: 'Success',
                content: 'Invoice Voided ',
                timeout: 2000,
                close: true
              };

              if (res.success) {
                this.refreshTable();
                this.alertService.successAlert(alertData);
              }
            })
        );
      }
    });
  }

  /**
   * Single unvoid
   * */
  onUnvoidRow(selectedRow: IInvoiceRowData) {
    const data = {
      content: 'Are you sure you want to Unvoid?'
    };

    const confirm = this.alertService.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.invoiceService
            .UnvoidSingleInvoice(selectedRow.action)
            .subscribe((res) => {
              const alertData = {
                title: 'Success',
                content: 'Invoice Unvoided ',
                timeout: 2000,
                close: true
              };

              if (res.success) {
                this.refreshTable();
                this.alertService.successAlert(alertData);
              }
            })
        );
      }
    });
  }

  /**
   * Multi print invoice
   * @param -pram for the function
   */
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
      const infoData = {
        content: 'Please select at least one row'
      };
      this.alertService.infoAlert(infoData);
    } else {
      this.HeaderButtonLoadingProp.isLoading = true;
      this.HeaderButtonLoadingProp.btn_id = 'id_print';
      this.updateButtonLoading();

      this.subscriptions.push(
        this.invoiceService
          .multiprint(itemIds)
          .pipe(
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
          })
      );
    }
  }

  /**
   * Multi delete invoice
   */
  onMultiDeleteRow(selectedRow: IInvoiceRowData[]) {
    const ids: string[] = [];
    selectedRow.forEach((el: IInvoiceRowData) => {
      ids.push(el.action);
    });
    const itemId = { ids };
    if (selectedRow.length === 0) {
      const infoData = {
        content: 'Please select at least one row'
      };
      this.alertService.infoAlert(infoData);
    } else {
      const confdata = {
        content: 'Are you sure you want to delete?'
      };
      this.HeaderButtonLoadingProp.isLoading = true;
      this.HeaderButtonLoadingProp.btn_id = 'id_delete';
      this.updateButtonLoading();
      this.alertService
        .confirmAlert(confdata)
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            this.subscriptions.push(
              this.invoiceService
                .MultiDeleteInvoice(itemId)
                .pipe(
                  finalize(() => {
                    this.HeaderButtonLoadingProp.isLoading = false;
                    this.updateButtonLoading();
                    this.HeaderButtonLoadingProp.btn_id = '';
                  })
                )
                .subscribe((res) => {
                  const data = {
                    title: 'Success',
                    content: 'Invoice Deleted ',
                    timeout: 2000,
                    close: true
                  };
                  if (res.success) {
                    this.refreshTable();
                    this.alertService.successAlert(data);
                  }
                })
            );
          }
        });
    }
  }

  /**
   * Multi void
   */
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
      const infoData = {
        content: 'Please select at least one row'
      };
      this.alertService.infoAlert(infoData);
    } else {
      const confdata = {
        content: 'Are you sure you want to void?'
      };
      this.alertService
        .confirmAlert(confdata)
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            this.HeaderButtonLoadingProp.isLoading = true;
            this.HeaderButtonLoadingProp.btn_id = 'id_void';
            this.updateButtonLoading();
            this.subscriptions.push(
              this.invoiceService
                .multiVoidInvoice(itemIds)
                .pipe(
                  finalize(() => {
                    this.HeaderButtonLoadingProp.isLoading = false;
                    this.updateButtonLoading();
                    this.HeaderButtonLoadingProp.btn_id = '';
                  })
                )
                .subscribe((res) => {
                  const data = {
                    title: 'Success',
                    content: 'Invoice Voided ',
                    timeout: 2000,
                    close: true
                  };

                  if (res.success) {
                    this.refreshTable();
                    this.alertService.successAlert(data);
                  }
                })
            );
          }
        });
    }
  }

  /**
   * Mark as paid
   */
  onMarkAsPaidRow(selectedRow: IInvoiceRowData) {
    this.matDialog
      .open(AddPaymentComponent, {
        maxWidth: '310px',
        width: '53%',
        data: selectedRow.action
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.refreshTable();
        }
      });
  }

  /**
   * Edit invoice
   */
  onEditRow(selectedItem: IInvoiceRowData) {
    this.subscriptions.push(
      this.invoiceService
        .getInvoiceData(selectedItem.action)
        .subscribe((res: { data: IInvoiceData }) => {
          if (this.isEnablePricingRule) {
            this.onEditEntInvoice(res.data);
          } else {
            this.onEditInvoice(res.data);
          }
        })
    );
  }

  onEditInvoice(invoiceData: IInvoiceData) {
    this.matDialog
      .open(AddInvoiceComponent, {
        maxWidth: '1010px',
        width: '93%',
        autoFocus: false,
        data: {
          data: invoiceData,
          isClone: false
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.refreshTable();
        }
      });
  }

  onEditEntInvoice(invoiceData: IInvoiceData) {
    this.matDialog
      .open(EntAddInvoiceModalComponent, {
        disableClose: true,
        maxWidth: '900px',
        width: '99%',
        maxHeight: '83%',
        autoFocus: false,
        data: {
          data: invoiceData,
          isClone: false
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.refreshTable();
        }
      });
  }

  /**
   * clone invoice
   */
  onCloneRow(selectedItem: IInvoiceRowData) {
    this.subscriptions.push(
      this.invoiceService
        .getInvoiceData(selectedItem.action)
        .subscribe((res: { data: IInvoiceData }) => {
          if (this.isEnablePricingRule) {
            this.onEditEntInvoice(res.data);
          } else {
            this.onEditInvoice(res.data);
          }
        })
    );
  }

  onCloneInvoice(invoiceData: IInvoiceData) {
    this.matDialog
      .open(AddInvoiceComponent, {
        maxWidth: '1010px',
        width: '93%',
        autoFocus: false,
        data: {
          data: invoiceData,
          isClone: true
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.refreshTable();
        }
      });
  }

  onCloneEntInvoice(invoiceData: IInvoiceData) {
    this.matDialog
      .open(EntAddInvoiceModalComponent, {
        disableClose: true,
        maxWidth: '900px',
        width: '99%',
        maxHeight: '83%',
        autoFocus: false,
        data: {
          data: invoiceData,
          isClone: true
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.refreshTable();
        }
      });
  }

  /**
   * When the Add Comments on Action button clicked
   */
  openAddCommentModal(selectedItem: IInvoiceRowData) {
    const dRef = this.matDialog.open(AddCommentsModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      data: {
        id: selectedItem.action,
        type: 'invoices',
        enableDelete: true
      }
    });

    dRef.afterClosed().subscribe((result) => {
      if (result.refresh) {
        this.refreshTable();
      }
    });
  }

  /**
   * Method to manage row selection event
   */
  onRowSelected(event: { api: { getSelectedRows(): IInvoiceRowData[] } }) {
    const gridApi = event.api;
    const selectedRows = gridApi.getSelectedRows();
    this.disableVoidButton(selectedRows);
  }

  /*
   * method to get all colum selection data
   */
  getRowSelectionData() {
    this.subscriptions.push(
      this.v3DataTableService.v3RowSelectionData$.subscribe({
        next: (res) => {
          const selectedRowData = res.map((item) => item.data);
          this.disableVoidButton(selectedRowData);
        }
      })
    );
  }

  /*
   * method to disable void button
   */
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
  }

  /**
   * When the Add Attachment button clicked
   */
  openAddAttachmentModal(selectedItem: IInvoiceRowData) {
    const invoiceattach = this.matDialog.open(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1350px',
      data: {
        id: selectedItem.action,
        type: 'invoices',
        enableDelete: true
      }
    });
    invoiceattach.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshTable();
      }
    });
  }

  /**
   * When the cell renderer danger clicked
   */
  cellRendererDangerClick(eventData: IInvoiceEventData) {
    if (eventData.id === 'id_bank_not_verified') {
      this.openBankSelectModal(eventData);
    }
  }

  /**
   *  Bank selection modal
   */
  openBankSelectModal(eventData: IInvoiceEventData) {
    const dRef = this.matDialog.open(BankMapModalComponent, {
      width: '400px',
      maxWidth: '400px',
      data: eventData,
      panelClass: 'bank-map-select-modal'
    });

    dRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshTable();
      }
    });
  }

  /**
   * @description -Validate the unmapped bank Account
   * @param selectedItems -Parameter for the function
   * @returns
   */
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
        const warnContent = {
          title: 'Error',
          content: `Please map the bank account to process the invoice.`,
          doneMsg: 'Map now',
          cancelMsg: 'Cancel',
          isCancel: true
        };
        const warn = this.alertService.warningAlert(warnContent);
        warn.afterClosed().subscribe((r) => {
          if (r) {
            const invoicedata = {
              selectedRow: selectedItems[0],
              id: 'id_bank_not_verified',
              tableId: undefined
            };

            this.openBankSelectModal(invoicedata);
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
    const WarnMsg = {
      title: 'Error',
      content,
      doneMsg: doneMsg || 'OK'
    };
    return this.alertService.warningAlert(WarnMsg);
  }

  /**
   * method to export table data
   */
  onExportData(filterModel: {
    items: string[];
    fromDate: string | Date;
    toDate: string | Date;
    type: 'csv' | 'pdf';
  }) {
    this.subscriptions.push(
      this.v3DataTableService
        .exportTable(filterModel, 'invoices')
        .subscribe((val) => {
          if (val.message) {
            const data = {
              title: 'Success!',
              content: val.message,
              close: false
            };
            this.alertService.successAlert(data);
          } else {
            window.open(val.data.url);
          }
        })
    );
  }

  /**
   * Data table column fields
   */
  colDefId: ICoulmnDefFields = {
    headerName: '',
    field: 'id',
    suppressFloatingFilterButton: true,
    minWidth: 60,
    maxWidth: 50,
    sortable: false,
    checkboxSelection: true,
    floatingFilterComponent: 'headerCheckBoxComponent',
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    headerClass: 'pl-[8px]',
    headerCheckboxSelection: true,
    showDisabledCheckboxes: true,
    pinned: 'left' as const,
    cellClass: 'flex flex-col justify-center pl-[6px]',
    cellRenderer: () => ''
  };

  colDefDate = {
    headerName: 'Date',
    field: 'ocw_invoices.invoice_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent', // SearchBoxComponent
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    minWidth: 120,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date' },
    cellRendererForExport: (params: ICellRendererParams) =>
      // Only For when Export Table data
      params?.data?.invoice_date
  };

  colDefFrom = {
    headerName: 'From',
    field: 'bank_accounts.bank_account_nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererForExport: (params: ICellRendererParams) =>
      // Only For when Export Table data
      params?.data?.bank_account_nick_name
  };

  colDefCreditNo = {
    headerName: 'Invoice No',
    field: 'invoice_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100
  };

  colDefCreatedBy = {
    headerName: 'Created By',
    field: 'client_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100
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
    cellRenderer: 'V3PayeeNameComponent',
    cellRendererParams: {
      isPaymentsTable: true
    }
  };

  colDefPaid = {
    headerName: 'Paid',
    field: 'paid',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
    maxWidth: 200,
    cellClass: 'ag-right-aligned-cell pr-3',
    cellRenderer: (params: Params) =>
      this.currencyPipe.transform(params.value as string)
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'grand_total',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 200,
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      isAmountField: true
    }
  };

  colDefBalance = {
    headerName: 'Balance',
    field: 'ocw_invoices.balance',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
    maxWidth: 200,
    cellClass: (params: Params) =>
      `ag-right-aligned-cell pr-3 font-bold ${params.data?.balance > 0 ? '!text-red-500' : ''}`,
    cellRenderer: (params: Params) =>
      this.currencyPipe.transform(params.data.balance)
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 400,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  statusArr: string[] = [];
  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SelectBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
    cellRenderer: 'attachmentCommentStatus',
    cellRendererForExport: (params: Params) => {
      // Only For when Export Table data
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
    maxWidth: 120,
    minWidth: 100,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'invoice_table'
    }
  };

  /**
   * Pass field data
   */
  columnFields: IDtColumnFields[] = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      isChecked: true,
      colDef: this.colDefId
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
      isDisabled: false
    },

    {
      id: 'id_status',
      name: 'Status',
      colDef: this.colDefStatus,
      isChecked: true,
      isDisabled: false
    },
    {
      id: 'id_action',
      name: 'Action',
      isDisabled: false,
      isChecked: true,
      colDef: this.colDefAction
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

  buttonClickEvent() {
    this.matDialog.open(InvoiceRulesModalComponent, {
      width: '500px',
      maxWidth: '600px',
      disableClose: true
    });
  }

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.invoiceService.ngOnDestroy();
  }
}
