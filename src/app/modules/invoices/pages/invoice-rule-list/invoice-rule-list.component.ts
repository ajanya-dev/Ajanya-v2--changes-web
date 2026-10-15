import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IDtActionCompProp,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import {
  IInvoiceRuleRow
} from 'src/app/modules/invoices/model/invoice';
import { ComponentType } from '@angular/cdk/portal';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { InvoiceRulesModalComponent } from '../../modals/invoice-rules-modal/invoice-rules-modal.component';
import { ImportModalComponent } from '../../modals/import-modal/import-modal.component';

@Component({
  selector: 'app-invoice-rule-list',
  templateUrl: './invoice-rule-list.component.html',
  styleUrls: ['./invoice-rule-list.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent, ImportModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceRuleListComponent implements OnDestroy, OnInit {
  public tableId = DTTableId.invoiceRuleList; // Data Table Id

  FloatingFilterComponent: IDtFloatingFilterProp;
  cellRendererId: string;
  subscriptions: Subscription[] = [];
  err_msg: string;
  deleteLoading = signal(false);

  public dialog = inject(MatDialog);
  public alertService = inject(AlertService);
  private dataTableService = inject(DataTableService);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);
  private v3DataTableService = inject(V3DataTableService);

  deselectedColumns: string[] = this.defaultDeselectedColumns();

  defaultDeselectedColumns() {
    if (window.innerWidth < 768) {
      return [
        'view',
        'status',
        'source_name',
        'source.source',
        'updated_at',
        'reference_no',
        'created_by',
        'description'
      ];
    }
    if (window.innerWidth < 1100) {
      return ['source_name', 'source.source', 'created_by', 'description'];
    }
    return [];
  }

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'New',
        id: 'id_new',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: 'Create new deposite slip'
      },
      {
        text: 'Delete',
        id: 'multipleDelete',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        loading: this.deleteLoading()
      },
      {
        text: 'Rules',
        id: 'id_rule',
        isAddIcon: true,
        icon: ['fas', 'arrow-down-to-line'],
        backGroundInput: 'var(--common-blue-color)',
        type: 'list',
        toolTip: 'Import Rules'
      },
      {
        text: 'Customers',
        id: 'id_customer',
        isAddIcon: true,
        icon: ['fas', 'arrow-down-to-line'],
        backGroundInput: 'var(--common-blue-color)',
        type: 'list',
        toolTip: 'Import Customer'
      },
      {
        text: 'Items',
        id: 'id_item',
        isAddIcon: true,
        icon: ['fas', 'arrow-down-to-line'],
        backGroundInput: 'var(--common-blue-color)',
        type: 'list',
        toolTip: 'Import items'
      }
    ],
    topRightButtons: [
      {
        text: 'Invoice',
        id: 'invoice',
        isAddIcon: true,
        icon: ['fas', 'list-alt'],
        type: { name: 'list', style: 'green' },
        backGroundInput: 'transparent',
        customClasses: 'font-extralight p-0',
        disableHoverEffect: false
      }
    ]
  }));

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    dateRangeV35Component: DataRangeV35Component
  };

  cellRenderer: { action: { name: string; id: string; icon: string }[] } = {
    action: [
      {
        name: 'Edit',
        id: 'id_EditRow',
        icon: 'fa fa-edit'
      },
      {
        name: 'Delete',
        id: 'id_DeleteRow',
        icon: 'fa fa-trash'
      }
    ]
  };

  /**
   * Data Table Column Fields
   */
  colDefId = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    cellRenderer: () => '',
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    pinned: 'left'
  };

  colDefRule = {
    headerName: 'Name',
    field: 'name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100
  };

  colDefPrice = {
    headerName: 'Price',
    field: 'unit_price',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'description',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100
  };

  colDefCreate = {
    headerName: 'Created At',
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100
  };

  colDefUpdate = {
    headerName: 'Updated At',
    field: 'updated_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100
  };

  colDefAction = {
    headerName: 'Action',
    sortable: false,
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    minWidth: 100,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  columnDefs = [
    this.colDefId,
    this.colDefRule,
    this.colDefMemo,
    this.colDefPrice,
    this.colDefCreate,
    this.colDefUpdate,
    this.colDefAction
  ];

  /**
   * Pass field data
   */
  columnFields = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'name',
      name: 'Name',
      colDef: this.colDefRule,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'description',
      name: 'Memo',
      colDef: this.colDefMemo,
      isChecked: true
    },
    {
      id: 'unit_price',
      name: 'Price',
      colDef: this.colDefPrice,
      isChecked: true
    },
    {
      id: 'created_at',
      name: 'Created At',
      colDef: this.colDefCreate,
      isChecked: true
    },
    {
      id: 'updated_at',
      name: 'Updated At',
      colDef: this.colDefUpdate,
      isChecked: true
    },
    {
      id: 'id_action',
      name: 'Action',
      colDef: this.colDefAction,
      isChecked: true,
      isDisabled: true
    }
  ];

  actionComponentProp: IDtActionCompProp = {
    actionButton: true,
    eyeButton: false
  };

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    // PASS DATAS TO DATA TABLE SERVICE
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );

    this.refreshDataTable();
  }

  refreshDataTable(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  /**
   * Find which cell action button is clicked (Eye button or Action button)
   */
  cellRendererActionClick(event: { id: string; selectedRow: IInvoiceRuleRow }) {
    const selectedItem = event.selectedRow;

    switch (event.id) {
      case 'id_EditRow':
        this.onEditRow(selectedItem);
        break;
      case 'id_DeleteRow':
        this.onDeleteRow([selectedItem?.id]);
        break;
      default:
        break;
    }
  }

  /**
   * Find which header button is clicked
   */
  headerButtonClick(event: { id: string; selectedRows: IInvoiceRuleRow[] }) {
    switch (event.id) {
      case 'id_new':
        this.openinvoiceitem();
        break;
      case 'multipleDelete':
        this.multiDelete(event?.selectedRows);
        break;
      case 'invoice':
        this.openinvoice();
        break;
      case 'id_rule':
        this.openImportModal('rule');
        break;
      case 'id_customer':
        this.openImportModal('customer');
        break;
      case 'id_item':
        this.openImportModal('item');
        break;
      default:
        break;
    }
  }

  openinvoice() {
    this.router.navigate(['/manage/invoice']);
  }

  /**
   * Find which action button is clicked
   */
  openinvoiceitem() {
    this.dialog
      .open(InvoiceRulesModalComponent, {
        width: '500px',
        maxWidth: '600px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.refreshDataTable();
        }
      });
  }

  openImportModal(type: 'rule' | 'customer' | 'item') {
    this.dialog
      .open(ImportModalComponent, {
        width: '750px',
        disableClose: true,
        data: type
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          switch (type) {
            case 'rule':
              this.refreshDataTable();
              break;
            case 'customer':
              this.router.navigate(['/manage/payees']);
              break;
            case 'item':
              this.router.navigate(['/manage/invoice/items']);
              break;
            default:
              break;
          }
        }
      });
  }

  multiDelete(selectedRows: IInvoiceRuleRow[]) {
    const itemIds:string[] = [];

    selectedRows.forEach((val: IInvoiceRuleRow) => {
      itemIds.push(val.id);
    });

    if(selectedRows.length === 0) {
      this.alertService.warningAlert({content:'Please select a rule to delete.'});
    }else{
      this.onDeleteRow(itemIds);
    }
  }

  /**
   * Delete
   */
  onDeleteRow(selectedIds: string[]) {
    const data = {
      content: 'Are you sure you want to delete?'
    };

    const confirm = this.alertService.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.invoiceService
            .deleteinvoiceRule(selectedIds)
            .subscribe((res) => {
              const successData = {
                title: 'Success',
                content: 'Invoice rule deleted',
                timeout: 2000,
                close: true
              };

              if (res.success) {
                this.dataTableService.setRefreshStatus(true);
                this.alertService.successAlert(successData);
                this.refreshDataTable();
              }
            })
        );
      }
    });
  }

  /**
   * Edit
   */
  onEditRow(selectedRow: IInvoiceRuleRow) {
    this.dialog
      .open(InvoiceRulesModalComponent, {
        width: '500px',
        maxWidth: '600px',
        disableClose: true,
        data: selectedRow
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.refreshDataTable();
        }
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
