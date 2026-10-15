import { ICellRendererParams, ModuleRegistry } from '@ag-grid-community/core';
import { CsvExportModule } from '@ag-grid-community/csv-export';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import { ExcelExportModule } from '@ag-grid-enterprise/excel-export';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { ClipboardModule } from '@ag-grid-enterprise/clipboard';
import { CurrencyPipe } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';

import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import {
  IPaymentLinksCustomTableRes,
  IPaymentLinksListItem,
  SelectedPaymentLink
} from 'src/app/modules/data-table/components/data-table/data-table.model';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IDtFloatingFilterProp } from 'src/app/modules/data-table/model/datatable';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { SubLinksActionCellComponent } from './sub-links-action-cell/sub-links-action-cell.component';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';

import { V4PaymentLinksService } from '../../services/v4-payment-links.service';

// Register ag-grid enterprise modules required for server-side row model
ModuleRegistry.registerModules([
  ServerSideRowModelModule,
  CsvExportModule,
  ExcelExportModule,
  MenuModule,
  ClipboardModule
]);

@Component({
  selector: 'app-v4-sub-links-tab',
  standalone: true,
  imports: [V4DataTableComponent, LucideAngularModule, MatTooltipModule, CommonButtonV4Component],
  templateUrl: './sub-links-tab.component.html',
  styleUrls: ['./sub-links-tab.component.scss'],
  providers: [CurrencyPipe]
})
export class SubLinksTabComponent implements OnInit, OnDestroy {
  private currencyPipe = inject(CurrencyPipe);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private v4PaymentLinksService = inject(V4PaymentLinksService);
  private paymentLinksApiService = inject(PaymentLinkService);
  private v4AlertService = inject(V4AlertService);
  public tableId = DTTableId.customAdvanceLink;
  link = input<SelectedPaymentLink | IPaymentLinksListItem | undefined>(undefined);
  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  additionalPayload = computed(() => {
    const linkId = this.link()?.id;
    return linkId ? { linkId } : undefined;
  });

  destroy$ = new Subject<boolean>();
  selectedRows: IPaymentLinksCustomTableRes[] = [];

  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    actionComponent: SubLinksActionCellComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent
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

  constructor() {
    effect(() => {
      const link = this.link();
      if (!link) return;

      this.v3DataTableService.refreshV3DataTable();
    });
  }

  ngOnInit(): void {
    this.initializeV3DataTable();

    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingSelectBoxValues
    );

    // Track selected rows from the data table for the top-bar delete button.
    // The service exposes selection as a Subject (no current-value getter), so
    // we mirror it locally.
    this.v3DataTableService.v3RowSelectionData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rows) => {
        this.selectedRows = (rows ?? []).map(
          (n: { data: IPaymentLinksCustomTableRes }) => n.data
        );
      });
  }

  /**
   * @description Setting up the payload for loading ag grid
   */
  initializeV3DataTable(): void {
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

  getActionComp(ev: {
    id: string;
    selectedRow: IPaymentLinksCustomTableRes;
  }): void {
    switch (ev.id) {
      case 'Rid_view':
        this.openPaymentsModal(ev.selectedRow);
        break;

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

      default:
        break;
    }
  }

  headerButtonNavigation(ev: {
    id: string;
    selectedRows: IPaymentLinksCustomTableRes[];
  }): void {
    switch (ev.id) {
      case 'add-new-link':
        this.addNewCustumRecurringLink();
        break;

      case 'delete-link':
        this.deleteLink(ev.selectedRows);
        break;

      case 'import-csv':
        this.openImportModal();
        break;

      default:
        break;
    }
  }

  addNewCustumRecurringLink(): void {
    const link = this.link();
    if (!link) return;

    this.v4PaymentLinksService
      .openAddOrEditCRLink(link.id, link.shortUrl, 'C', undefined)
      .then((dialogRef) => {
        dialogRef
          .afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            if (res) {
              this.v4AlertService.successAlert({
                title: 'Success',
                content: 'New link created successfully'
              });
              this.dataTableService.setRefreshStatus(true);
              this.v3DataTableService.refreshV3DataTable();
            }
          });
      });
  }

  async deleteLink(rows: { id: string }[]): Promise<void> {
    if (!rows.length) {
      this.v4AlertService.warningAlert({
        content: 'Please select link to delete.'
      });
      return;
    }

    const ids = rows.map((el) => el.id);

    const confirmation = await firstValueFrom(
      this.v4AlertService
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
          this.v4AlertService.successAlert({
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

  editCRLink(item: IPaymentLinksCustomTableRes): void {
    const link = this.link();
    if (!link) return;

    const { is_recurring, start_date, ...rest } = item;

    const dialogData = {
      ...rest,
      isRecurring: Boolean(item.is_recurring),
      startDate: item.start_date,
      link: this.link()
    };

    this.v4PaymentLinksService
      .openAddOrEditCRLink(link.id, link.shortUrl, 'E', dialogData)
      .then((dialogRef) => {
        dialogRef
          .afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            if (!res) return;

            this.dataTableService.setRefreshStatus(true);
            this.v3DataTableService.refreshV3DataTable();
            this.v4AlertService.successAlert({
              title: 'Success',
              content: 'Updated successfully'
            });
          });
      });
  }

  openEmailSmsLinkModal(
    item: IPaymentLinksCustomTableRes,
    type: 'email' | 'sms'
  ): void {
    const link = this.link();
    if (!link) return;

    const url = `${this.staticWhiteLabelConditions.paymentShortLink}/${link.shortUrl}/${item.slugurl}`;

    this.v4PaymentLinksService
      .openEmailSmsModal(
        item.id,
        url,
        Math.round(Number(item.amount)),
        link.bankAccount?.bankName ?? '',
        link.shortUrl,
        type
      )
      .then((dialogRef) => {
        dialogRef
          .afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            if (res) {
              this.dataTableService.setRefreshStatus(true);
              this.v3DataTableService.refreshV3DataTable();
            }
          });
      });
  }

  openPaymentsModal(row: IPaymentLinksCustomTableRes): void {
    this.v4PaymentLinksService.openPaymentsModal(row);
  }

  deleteSelectedLinks(): void {
    this.deleteLink(this.selectedRows);
  }

  openImportModal(): void {
    const linkId = this.link()?.id;
    if (!linkId) return;

    this.v4PaymentLinksService
      .openImportCsvModal(linkId)
      .then((dialogRef) => {
        dialogRef
          .afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            if (res?.success === true) {
              this.dataTableService.setRefreshStatus(true);
              this.v3DataTableService.refreshV3DataTable();
            }
          });
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
        lucideIcon: 'plus',
        type: 'list',
        backGroundInput: 'var(--common-green-color)',
        isAddIcon: true
      },
      {
        text: 'Import CSV',
        id: 'import-csv',
        type: 'list',
        lucideIcon: 'upload'
      }
    ]
  };

  colDefId: ICoulmnDefFields = {
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
    headerCheckboxSelection: true,
    showDisabledCheckboxes: true,
    pinned: 'left' as const,
    cellClass: 'flex justify-center'
  };

  colDefCreatedTime: ICoulmnDefFields = {
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

  colDefNickName: ICoulmnDefFields = {
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
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: (params: ICellRendererParams) =>
      this.formatAmount(params.value)
  };

  private formatAmount(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'string' && value.includes('$')) return value;
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return String(value);
    return (
      this.currencyPipe.transform(
        numericValue,
        'USD',
        'symbol',
        '1.2-2',
        'en-US'
      ) ?? ''
    );
  }

  colDefSenderEmail: ICoulmnDefFields = {
    minWidth: 140,
    headerName: 'Sender Email',
    field: 'sender_email',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefLink: ICoulmnDefFields = {
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

  colDefType: ICoulmnDefFields = {
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

  colDefStatus: ICoulmnDefFields = {
    minWidth: 90,
    headerName: 'Payment Status',
    field: 'payment_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (
      param: ICellRendererParams<IPaymentLinksCustomTableRes>
    ) => {
      return `
        <div class="flex items-center h-full w-full gap-2">
          <span>${param.value}</span>
          <span
            title="Total Transactions"
            class="flex items-center justify-center
            rounded bg-common-secondary-green-color px-2 py-0.5 text-xs"
          >
            ${param.data?.transaction_count}
          </span>
        </div>
      `;
    }
  };

  colDefMonths: ICoulmnDefFields = {
    headerName: 'Months',
    minWidth: 90,
    field: 'months',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefStartDate: ICoulmnDefFields = {
    headerName: 'Start Date',
    minWidth: 120,
    field: 'start_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefAction: ICoulmnDefFields = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    pinned: 'left',
    lockPosition: true
  };

  columnDefs: ICoulmnDefFields[] = [
    this.colDefId,
    this.colDefCreatedTime,
    this.colDefNickName,
    this.colDefAmount,
    this.colDefSenderEmail,
    this.colDefLink,
    this.colDefType,
    this.colDefStatus,
    this.colDefMonths,
    this.colDefStartDate,
    this.colDefAction
  ];
}
