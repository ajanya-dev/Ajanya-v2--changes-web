import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { ColDef, ValueGetterParams } from '@ag-grid-community/core';
import { finalize, take } from 'rxjs';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import {
  IDtActionCompProp,
  IDtCellrendererBtn,
  IDtColumnFields,
  IDtFloatingFilterProp,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { IRowData } from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { V4ViewShippingLabelModalComponent } from '../../v4-modals/v4-view-shipping-label-modal/v4-view-shipping-label-modal.component';

@Component({
  selector: 'app-v4-shipping-label-list',
  standalone: true,
  imports: [LucideAngularModule, V4DataTableComponent, CommonButtonV4Component],
  templateUrl: './v4-shipping-label-list.component.html'
})
export class V4ShippingLabelListComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private headerService = inject(HeaderService);
  private shippingLabelService = inject(ShippingLabelService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);

  tableId = DTTableId.shippingLabel; // Data Table Id
  deselectedColumns: string[] = [];

  isPrintLoading = signal<boolean>(false);
  isDeleteLoading = signal<boolean>(false);

  frameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    actionComponent: V4DtActionComponent
  };

  /** View (eye) button + 3 dot action menu on every row. */
  actionComponentProp: IDtActionCompProp = {
    actionButton: true,
    eyeButton: true
  };

  /** Items shown inside the row action menu. */
  cellRenderer: IDtCellrendererBtn = {
    action: [
      {
        name: 'Print',
        id: 'RId_print',
        icon: 'printer',
        toolTip: 'Print this label'
      },
      {
        name: 'Delete',
        id: 'RId_delete',
        icon: 'trash-2',
        color: 'var(--v4-common-red-color)',
        toolTip: 'Delete this label'
      }
    ]
  };

  /** Floating filter values (shipping type dropdown + date range). */
  configs: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'shipping_type',
        values: [
          { value: 'USPS', name: 'USPS' },
          { value: 'Fedex', name: 'Fedex' }
        ]
      }
    ],
    selectDate: [
      {
        id: 'shipping_payment_details.created_at',
        initialRange: 'All Time',
        isPrimary: true
      }
    ]
  };

  /** Bulk actions — shown in the floating action bar once rows are selected. */
  headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Print',
        id: 'id_printlabel',
        icon: ['fas', 'print'],
        lucideIcon: 'printer',
        type: 'list',
        toolTip: 'Print Label',
        loading: this.isPrintLoading(),
        floatingBarVariant: 'outline-primary'
      },
      {
        text: 'Delete',
        id: 'id_btndelete',
        icon: ['fas', 'trash'],
        lucideIcon: 'trash-2',
        type: 'list',
        toolTip: 'Delete your label',
        loading: this.isDeleteLoading(),
        floatingBarVariant: 'filled-danger'
      }
    ]
  }));

  colDefId: ColDef = {
    maxWidth: 50,
    minWidth: 20,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    pinned: 'left',
    cellRenderer: () => ''
  };

  colDefPayee: ColDef = {
    minWidth: 120,
    headerName: 'Payee Name',
    field: 'name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'shipping_label_table',
      tableId: this.tableId
    }
  };

  colDefDate: ColDef = {
    minWidth: 180,
    maxWidth: 180,
    headerName: 'Date',
    field: 'shipping_payment_details.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'shipping_label_table',
      tableId: this.tableId
    },
    valueGetter: (params: ValueGetterParams<IRowData>) =>
      params.data?.created_at ?? ''
  };

  colDefPayeeAddr: ColDef = {
    minWidth: 140,
    headerName: 'Payee Address',
    field: 'address1',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'shipping_label_table',
      tableId: this.tableId
    }
  };

  colTrackingNo: ColDef = {
    minWidth: 180,
    headerName: 'Tracking Number',
    field: 'tracking_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'shipping_label_table',
      tableId: this.tableId
    }
  };

  colDefShippType: ColDef = {
    minWidth: 130,
    headerName: 'Shipping Type(Usps/Fedex)',
    field: 'shipping_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'shipping_label_table',
      tableId: this.tableId,
      matchTriggerWidth: true
    }
  };

  colDefComment: ColDef = {
    minWidth: 100,
    headerName: 'Comment',
    field: 'comment',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'shipping_label_table',
      tableId: this.tableId
    }
  };

  colDefAction: ColDef = {
    minWidth: 80,
    maxWidth: 120,
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  defaultColumnFields: IDtColumnFields[] = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'id_payee',
      name: 'Payee Name',
      isDisabled: true,
      colDef: this.colDefPayee,
      isChecked: true
    },
    {
      id: 'id_date',
      name: 'Date',
      isDisabled: false,
      colDef: this.colDefDate,
      isChecked: true
    },
    {
      id: 'id_address',
      name: 'Payee Address',
      isDisabled: false,
      colDef: this.colDefPayeeAddr,
      isChecked: true
    },
    {
      id: 'id_trackNo',
      name: 'Tracking Number',
      isDisabled: false,
      colDef: this.colTrackingNo,
      isChecked: true
    },
    {
      id: 'id_type',
      name: 'Shipping Type',
      isDisabled: false,
      colDef: this.colDefShippType,
      isChecked: true
    },
    {
      id: 'id_comment',
      name: 'Comment',
      isDisabled: false,
      colDef: this.colDefComment,
      isChecked: true
    },
    {
      id: 'id_action',
      name: 'Action',
      isDisabled: false,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  columnDefs: ColDef[] = [
    this.colDefId,
    this.colDefPayee,
    this.colDefDate,
    this.colDefPayeeAddr,
    this.colTrackingNo,
    this.colDefShippType,
    this.colDefComment,
    this.colDefAction
  ];

  ngOnInit(): void {
    this.headerService.isSubHeaderVisible.next({
      hidden: true,
      animation: false
    });
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.configs,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }

  /**
   * @description Floating action bar button click.
   */
  headerButtonClick(event: { id: string; selectedRows: IRowData[] }): void {
    const ids = (event.selectedRows ?? []).map((row) => row.action);

    switch (event.id) {
      case 'id_printlabel':
        if (!ids.length) {
          this.openWarningAlert('Please select shipping labels to print.');
        } else {
          this.printShippingLabel(ids);
        }
        break;

      case 'id_btndelete':
        if (!ids.length) {
          this.openWarningAlert('Please select shipping labels to delete.');
        } else {
          this.confirmDelete(ids, true);
        }
        break;

      default:
        break;
    }
  }

  /**
   * @description Row action menu click.
   */
  cellRendererActionClick(event: ISelectedSingleRow): void {
    const row = event?.selectedRow as IRowData | undefined;
    if (!row?.action) return;

    switch (event.id) {
      case 'RId_print':
        this.printShippingLabel([row.action]);
        break;
      case 'RId_delete':
        this.confirmDelete([row.action], false);
        break;
      default:
        break;
    }
  }

  /**
   * @description Row view (eye) button click — opens the details modal.
   */
  cellRendererActionView(event: ISelectedSingleRow): void {
    const row = event?.selectedRow as IRowData | undefined;
    if (!row?.action) return;
    this.openView(row.action);
  }

  /**
   * @description Open the shipping label details modal.
   */
  openView(labelId: string): void {
    this.dialog.open(V4ViewShippingLabelModalComponent, {
      width: '560px',
      maxWidth: '95vw',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: { shippLabelId: labelId }
    });
  }

  /**
   * @description Print one or more shipping labels.
   */
  printShippingLabel(ids: string[]): void {
    this.isPrintLoading.set(true);
    this.shippingLabelService
      .printMultiShippingLabel(ids)
      .pipe(
        take(1),
        finalize(() => this.isPrintLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.clearSelection();
            window.open(res?.data?.url);
          }
        },
        error: () => {
          this.openFailedAlert('Failed to print the shipping label.');
        }
      });
  }

  /**
   * @description Delete confirmation for single and multiple labels.
   */
  confirmDelete(ids: string[], isMultiple: boolean): void {
    this.alertService
      .confirmAlert({
        title: 'Delete Shipping Label',
        content: 'Are you sure you want to delete this?',
        doneMsg: 'Delete',
        cancelMsg: 'Cancel',
        icon: 'warn',
        isOk: true,
        isCancel: true
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        if (isMultiple) {
          this.deleteMultiShippingLabel(ids);
        } else {
          this.deleteSingleShippingLabel(ids[0]);
        }
      });
  }

  /**
   * @description Delete a single shipping label.
   */
  deleteSingleShippingLabel(id: string): void {
    this.shippingLabelService
      .deleteLabel(id)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.openSuccessAlert('Shipping Label Deleted.');
            this.refreshDataTable();
          }
        },
        error: () => {
          this.openFailedAlert('Failed to delete the shipping label.');
        }
      });
  }

  /**
   * @description Delete the selected shipping labels.
   */
  deleteMultiShippingLabel(ids: string[]): void {
    this.isDeleteLoading.set(true);
    this.shippingLabelService
      .deleteMutltiShippingLabel(ids)
      .pipe(
        take(1),
        finalize(() => this.isDeleteLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.openSuccessAlert('Shipping Labels Deleted.');
            this.refreshDataTable();
          }
        },
        error: () => {
          this.openFailedAlert('Failed to delete the shipping labels.');
        }
      });
  }

  /**
   * @description Open the create shipping label page.
   */
  createShippingLabel(): void {
    this.router.navigateByUrl(
      '/v4/manage/business-tools/shipping-label/create'
    );
  }

  /**
   * @description Open the quick label page.
   */
  openQuickLabel(): void {
    this.router.navigateByUrl(
      '/v4/manage/business-tools/shipping-label/quick-label'
    );
  }

  goBack(): void {
    this.router.navigate(['/v4/manage/v4-business-tools/more']);
  }

  private refreshDataTable(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.clearSelection();
  }

  private clearSelection(): void {
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  private openSuccessAlert(content: string): void {
    this.alertService.successAlert({ title: 'Success!', content, close: true });
  }

  private openWarningAlert(content: string): void {
    this.alertService.warningAlert({ title: 'Error', content });
  }

  private openFailedAlert(content: string): void {
    this.alertService.failedAlert({ title: 'Error', content });
  }
}
