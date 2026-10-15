import { ICellRendererParams } from '@ag-grid-community/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  effect,
  inject,
  input
} from '@angular/core';
import {
  faEdit,
  faEnvelope,
  faPlus,
  faQuestionCircle,
  faSms,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import {
  IPaymentLinksCustomTableRes,
  IPaymentLinksListItem
} from 'src/app/modules/data-table/components/data-table/data-table.model';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import {
  IDtCellrendererBtn,
  IDtColumnFields,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { MatDialog } from '@angular/material/dialog';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { PaymentLinksService } from '../../services/payment-links.service';
import { PaymentLinksCustomLinksCellrendererComponent } from './payment-links-custom-links-cellrenderer/payment-links-custom-links-cellrenderer.component';
import { ImportPaymentLinksModalComponent } from '../../modals/import-payment-links-modal/import-payment-links-modal.component';
import { PaymentLinksCustomLinksPaymentsComponent } from '../payment-links-custom-links-payments/payment-links-custom-links-payments.component';

@Component({
  selector: 'app-payment-links-custom-links-table',
  standalone: true,
  imports: [V3DataTableComponent, CommonModule, V3DataTableModule, CommonButtonV35Component],
  templateUrl: './payment-links-custom-links-table.component.html',
  styleUrl: './payment-links-custom-links-table.component.scss',
  providers: [CurrencyPipe]
})
export class PaymentLinksCustomLinksTableComponent
  implements OnInit, OnDestroy
{
  private currencyPipe = inject(CurrencyPipe);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private paymentLinksService = inject(PaymentLinksService);
  private paymentLinksApiService = inject(PaymentLinkService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);

  public tableId = DTTableId.customAdvanceLink;
  link = input<IPaymentLinksListItem | undefined>(undefined);
  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  destroy$ = new Subject<boolean>();

  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: PaymentLinksCustomLinksCellrendererComponent,
    SearchBoxComponent: DtSearchBoxComponent
  };

  floatingSelectBoxValues: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'is_recurring',
        values: [
          { value: 0, name: 'Regular' },
          { value: 'is_single_use', name: 'One-Time' },
          { value: 1, name: 'Recurring' }
        ]
      },
      {
        id: 'payment_status',
        values: [
          { value: 'Pending', name: 'Pending' },
          { value: 'Completed', name: 'Completed' }
        ]
      }
    ],
    selectDate: [
      { id: 'created_at', initialRange: 'All Time', isPrimary: true },
      { id: 'start_date', initialRange: 'All Time' }
    ]
  };

  cellRenderer: IDtCellrendererBtn = {
    action: [
      {
        name: 'Edit',
        id: 'RId_edit',
        icon: faEdit
      },
      {
        name: 'Delete',
        id: 'RId_dlt',
        icon: faTrash
      },
      {
        name: 'Email Link',
        id: 'RId_email_link',
        icon: faEnvelope
      },
      {
        name: 'SMS Link',
        id: 'RId_sms_link',
        icon: faSms
      }
    ]
  } as unknown as IDtCellrendererBtn;

  constructor() {
    effect(() => {
      const link = this.link();
      if (!link) return;

      this.v3DataTableService.refreshV3DataTable();
    });
  }

  ngOnInit(): void {
    this.initializeV3DataTable();

    const actionComponentProp = {
      actionButton: true,
      eyeButton: false
    };

    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.floatingSelectBoxValues,
      this.cellRenderer,
      actionComponentProp
    );
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

  getActionComp(ev: { id: string; selectedRow: IPaymentLinksCustomTableRes }) {
    switch (ev.id) {
      case 'RId_edit':
        this.editCRLink(ev.selectedRow);
        break;

      case 'RId_dlt':
        this.deleteLink([ev.selectedRow]);
        break;

      case 'RId_email_link':
        this.openEmailSmsLinkModal(ev.selectedRow, 'email');
        break;

      case 'RId_sms_link':
        this.openEmailSmsLinkModal(ev.selectedRow, 'sms');
        break;

      case 'Rid_view':
        this.dialog.open(PaymentLinksCustomLinksPaymentsComponent, {
          width: '70%',
          minWidth: '400px',
          disableClose: true,
          data: {
            row: ev.selectedRow
          }
        });
        break;

      default:
        break;
    }
  }

  headerButtonNavigation(ev: {
    id: string;
    selectedRows: IPaymentLinksCustomTableRes[];
  }) {
    switch (ev.id) {
      case 'add-new-link':
        this.addNewCustumRecurringLink();
        break;

      case 'delete-link':
        this.deleteLink(ev.selectedRows);
        break;

      default:
        break;
    }
  }

  addNewCustumRecurringLink() {
    const link = this.link();
    if (!link) return;

    const dialogRef = this.paymentLinksService.openAddOrEditCRLink(
      link.id,
      link.shortUrl,
      'C',
      undefined
    );

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'New link created successfully'
          });
          this.dataTableService.setRefreshStatus(true);
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  async deleteLink(rows: { id: string }[]) {
    if (!rows.length) {
      this.alertService.warningAlert({
        content: 'Please select link to delete.'
      });
      return;
    }

    const ids = rows.map((el) => el.id);

    const confirmation = await firstValueFrom(
      this.alertService
        .warningAlert({
          title: 'Alert',
          content: 'Are you sure you want to delete the link?',
          doneMsg: 'Yes, Delete it!',
          cancelMsg: 'No, cancel',
          isCancel: true
        })
        .afterClosed()
    );

    if (!confirmation) return;

    this.paymentLinksApiService
      .MultiDeleteCustomAdvanceLink({ ids })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Deleted successfully'
          });
          this.dataTableService.setRefreshStatus(true);
          this.v3DataTableService.v3RowSelectionData = [];
          this.v3DataTableService.gridApi?.deselectAll();
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  editCRLink(item: IPaymentLinksCustomTableRes) {
    const link = this.link();
    if (!link) return;

    const { is_recurring, start_date, ...rest } = item;

    const dialogData = {
      ...rest,
      isRecurring: Boolean(item.is_recurring),
      startDate: item.start_date,
      link: this.link()
    };

    const dialgoRef = this.paymentLinksService.openAddOrEditCRLink(
      link.id,
      link.shortUrl,
      'E',
      dialogData
    );

    dialgoRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;

        this.dataTableService.setRefreshStatus(true);
        this.v3DataTableService.refreshV3DataTable();
        this.alertService.successAlert({
          title: 'Success',
          content: 'Updated successfully'
        });
      });
  }

  openEmailSmsLinkModal(
    item: IPaymentLinksCustomTableRes,
    type: 'email' | 'sms'
  ) {
    const link = this.link();
    if (!link) return;

    const url = `${this.staticWhiteLabelConditions.paymentShortLink}/${link.shortUrl}/${item.slugurl}`;
    const dialogRef = this.paymentLinksService.openEmailSmsCRLinkModal(
      item.id,
      url,
      Math.round(Number(item.amount)),
      link.bankAccount?.bankName ?? '',
      link.shortUrl,
      type
    );

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.dataTableService.setRefreshStatus(true);
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  openImportModal(){
    const dialogRef = this.dialog.open(ImportPaymentLinksModalComponent, {
      width: '700px',
      minWidth: '700px',
      disableClose: true,
      data: {
        parentLinkId: this.link()?.id as string
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success === true) {
        this.dataTableService.setRefreshStatus(true);
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }

  headerElements: IV3DtHeaderElements = {
    buttons: [
      {
        text: 'Create Custom Link',
        id: 'add-new-link',
        toolTip: 'New Advance Link',
        icon: faPlus,
        type: 'list',
        backGroundInput: 'var(--common-green-color)',
        isAddIcon: true
      },
      {
        toolTip: 'Custom Sub-Links allow you to quickly create unique payment requests from your main link. They inherit security settings and let you set a specific amount.',
        roundIcon: faQuestionCircle,
        customClasses: 'bg-common-secondary-background-color text-main-text-color hover:opacity-80 cursor-default',
      },
      {
        id: 'delete-link',
        roundIcon: faTrash,
        customClasses: 'bg-common-secondary-red-color text-common-red-color',
        toolTip: 'Delete.'
      },
    ]
  };

  colDefId = {
    headerName: '',
    field: 'boxId',
    suppressFloatingFilterButton: true,
    minWidth: 40,
    maxWidth: 50,
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
    cellClass: 'flex flex-col justify-center pl-[6px]'
  };

  colDefCreatedTime = {
    headerName: 'Created Time',
    minWidth: 160,
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (data: ICellRendererParams) => {
      const str = String(data.data.created_at_formated);
      const splitted = str.split('_');

      return `
        <span>
          ${splitted[0]}
          <span style="font-size:11.5px;">
            (${splitted[1]})
          </span>
        </span>
      `;
    }
  };

  colDefSenderMail = {
    minWidth: 140,
    headerName: 'Sender Email',
    field: 'sender_email',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefNickName = {
    minWidth: 90,
    headerName: 'Nick Name',
    field: 'nickname',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefAmount: ICoulmnDefFields = {
    minWidth: 100,
    maxWidth: 150,
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'ag-right-aligned-cell pr-3',
    cellRenderer: (params: ICellRendererParams) =>
      this.currencyPipe.transform(params.value)
  };

  colDefLink = {
    headerName: 'Link',
    minWidth: 200,
    field: 'slugurl',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (param: ICellRendererParams) => {
      const href = `${this.staticWhiteLabelConditions.paymentShortLink}/${this.link()?.shortUrl}/${param.value}`;

      return `
        <a
          style="color: #5867dd;text-transform: lowercase;" target="_blank"
          href="${href}"
        >
          ${this.staticWhiteLabelConditions.paymentShortLink}/${this.link()?.shortUrl}/${param.value}
        </a>
      `;
    }
  };

  colDefType = {
    minWidth: 90,
    headerName: 'Type',
    field: 'is_recurring',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      if (params.data.is_single_use === 1) {
        return 'One-Time';
      }
      return params.value === 1 ? 'Recurring' : 'Regular';
    }
  };

  colDefStatus = {
    minWidth: 90,
    headerName: 'Payment Status',
    field: 'payment_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (param: ICellRendererParams<IPaymentLinksCustomTableRes>) => {
      return `
        <div class="flex h-full w-full justify-between">
          <span>${param.value}</span>
          <span class="p-1">
            <span
              title="Total Transactions"
              class="flex items-center justify-center
              rounded bg-common-secondary-green-color p-2 h-full"
            >
              ${param.data?.transaction_count}
            </span>
          </span>
        </div>
      `;
    }
  };

  colDefMonths = {
    headerName: 'Months',
    minWidth: 90,
    field: 'months',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefStartDate = {
    headerName: 'Start Date',
    minWidth: 120,
    field: 'start_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefAction = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 60,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    cellRendererParams: {
      callBack: (p: {
        id: string;
        selectedRow: IPaymentLinksCustomTableRes;
      }) => {
        this.getActionComp(p);
      },
      buttons: [
        { name: 'Edit', id: 'RId_edit', icon: faEdit },
        { name: 'Delete', id: 'RId_dlt', icon: faTrash },
        { name: 'Email Link', id: 'RId_email_link', icon: faEnvelope },
        { name: 'SMS Link', id: 'RId_sms_link', icon: faSms }
      ]
    }
  };

  // PASS FIELD DATA
  columnFields: IDtColumnFields[] = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'id_created_time',
      name: 'Created Time',
      isDisabled: false,
      colDef: this.colDefCreatedTime,
      isChecked: true
    },
    {
      id: 'id_nickName',
      name: 'Nick Name',
      isDisabled: false,
      colDef: this.colDefNickName,
      isChecked: true
    },
    {
      id: 'id_amount',
      name: 'Amount',
      isDisabled: false,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'sender_email',
      name: 'Sender Email',
      isDisabled: false,
      colDef: this.colDefSenderMail,
      isChecked: true
    },
    {
      id: 'id_link',
      name: 'Link',
      isDisabled: false,
      colDef: this.colDefLink,
      isChecked: true
    },
    {
      id: 'id_type',
      name: 'Type',
      isDisabled: false,
      colDef: this.colDefType,
      isChecked: true
    },
    {
      id: 'payment_status',
      name: 'Payment Status',
      isDisabled: false,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'id_months',
      name: 'Months',
      isDisabled: false,
      colDef: this.colDefMonths,
      isChecked: true
    },
    {
      id: 'id_start_date',
      name: 'Start Date',
      isDisabled: true,
      colDef: this.colDefStartDate,
      isChecked: true
    },
    {
      id: 'id_Action',
      name: 'Action',
      isDisabled: false,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  columnDefs: ICoulmnDefFields[] = [
    this.colDefId,
    this.colDefCreatedTime,
    this.colDefNickName,
    this.colDefAmount,
    this.colDefSenderMail,
    this.colDefLink,
    this.colDefType,
    this.colDefStatus,
    this.colDefMonths,
    this.colDefStartDate,
    this.colDefAction
  ];
}
