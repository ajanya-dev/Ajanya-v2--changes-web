import {
  Component,
  OnDestroy,
  inject,
  OnInit,
  DestroyRef,
  output,
  computed,
  signal,
  input
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IDtActionCompProp, IDtCellrendererBtn } from 'src/app/modules/data-table/model/datatable';
import { RowNode } from '@ag-grid-community/core';
import { GroupPaymentsService } from 'src/app/modules/group-payments/services/group-payments.service';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-group-payments-table',
  templateUrl: './v4-group-payments-table.component.html',
  styleUrls: ['./v4-group-payments-table.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent, CommonButtonV4Component]
})
export class V4GroupPaymentsTableComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private alertService = inject(V4AlertService);
  private groupPaymentsService = inject(GroupPaymentsService);
  private v3DataTableService = inject(V3DataTableService);
  private destroyRef = inject(DestroyRef);
  private dataTableService = inject(DataTableService);

  fieldsShownByDefault: string[] = ['id', 'action'];

  subscriptions: Subscription[] = [];
  tableId = DTTableId.groupPayment;

  // Row selection properties
  selectedRowData: RowNode[] = [];
  selectedRowCount = signal(0);
  isChildComponent = input<boolean>(false);
  isEmptyGroup = output<boolean>();
  selectedGroupId = output<string | null>();

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Make a Payment',
        id: 'id_pay',
        icon: ['far', 'money-bill-wave'],
        lucideIcon: 'banknote',
        isAddIcon: true,
        type: 'list',
        disabled: this.selectedRowCount() === 0 || this.selectedRowCount() > 1,
        floatingBarVariant: 'filled-primary',
        customClasses:
          '!text-[14px] !py-[10px] !px-[20px] whitespace-nowrap [&>div]:!gap-2 [&_lucide-angular]:!inline-flex [&_lucide-angular]:!items-center [&_svg]:!w-4 [&_svg]:!h-4'
      },
      {
        text: 'Delete',
        id: 'multipleDelete',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        lucideIcon: 'trash-2',
        backGroundInput: 'var(--v4-common-red-color)',
        type: 'list',
        disabled: this.selectedRowCount() === 0 || this.selectedRowCount() > 1,
        floatingBarVariant: 'filled-danger',
        customClasses:
          '!text-[14px] !py-[10px] !px-[20px] whitespace-nowrap [&>div]:!gap-2 [&_lucide-angular]:!inline-flex [&_lucide-angular]:!items-center [&_svg]:!w-4 [&_svg]:!h-4'
      }
    ],
    topRightButtons: []
  }));

  ngOnInit(): void {
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
    this.dataTableService.setDataFromParent(undefined, undefined, this.cellRendererAction, this.actionComponentProp);
    this.v3DataTableService.refreshV3DataTable();
    this.dataTableService.setRefreshStatus(true);
    this.getRowSelectionData();
    this.getRowCount();

    this.subscriptions.push(
      this.dataTableService.selectedViewSingleId$.subscribe((res) => {
        if (res?.selectedRow?.['id']) {
          this.goToGroupPaymentEdit(res.selectedRow['id'] as string);
        }
      })
    );

    this.subscriptions.push(
      this.dataTableService.selectedsingleId.subscribe((res) => {
        if (res?.selectedRow?.['id'] && res?.id === 'RId_delete') {
          this.deleteGroupPayment(
            res.selectedRow['id'] as string,
            res.selectedRow['group_name'] as string
          );
        }
      })
    );
  }

  getRowCount() {
    this.subscriptions.push(
      this.v3DataTableService.hasV3DataTableLoaded$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((loaded) => {
          if (
            loaded &&
            this.v3DataTableService.rowData &&
            this.v3DataTableService.rowData.length === 0
          ) {
            this.isEmptyGroup.emit(true);
          } else {
            this.isEmptyGroup.emit(false);
          }
        })
    );
  }

  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    v4CreatedAtComponent: V4CreatedAtComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    actionComponent: V4DtActionComponent,
    V4DTCommonFilterComponent
  };

  actionComponentProp: IDtActionCompProp = {
    eyeButton: true,
    actionButton: true
  };

  readonly cellRendererAction: IDtCellrendererBtn = {
    action: [
      {
        name: 'Delete',
        id: 'RId_delete',
        icon: 'trash-2',
        color: 'var(--v4-common-red-color)'
      }
    ]
  };

  columnDefs = [
    {
      width: 50,
      minWidth: 50,
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
    },
    {
      headerName: 'Action',
      field: 'action',
      suppressFloatingFilterButton: true,
      suppressHeaderMenuButton: true,
      floatingFilter: true,
      sortable: false,
      pinned: 'left',
      lockPosition: true,
      minWidth: 60,
      maxWidth: 80,
      cellRenderer: 'actionComponent'
    },
    {
      headerName: 'Date',
      field: 'created_at',
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'v4DateRangeComponent',
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      floatingFilterComponentParams: {
        v2Table: true,
        tableId: 81
      },
      minWidth: 150,
      maxWidth: 300,
      cellRenderer: 'v4CreatedAtComponent'
    },
    {
      headerName: 'Name',
      field: 'group_name',
      suppressFloatingFilterButton: true,
      minWidth: 100,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellRenderer: 'V4DTCommonFilterComponent'
    },
    {
      headerName: 'Payments Count',
      field: 'items',
      suppressFloatingFilterButton: true,
      minWidth: 170,
      width: 170,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellRenderer: 'V4DTCommonFilterComponent'
    },
    {
      headerName: 'Total Amount',
      field: 'totalAmount',
      suppressFloatingFilterButton: true,
      minWidth: 150,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellRenderer: 'V4DTCommonFilterComponent',
      cellRendererParams: { isAmountField: true }
    },
    {
      headerName: 'Created By',
      field: 'created_by',
      suppressFloatingFilterButton: true,
      flex: 1,
      minWidth: 100,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellRenderer: 'V4DTCommonFilterComponent'
    }
  ];

  /**
   * Gets row selection data from the v3 data table service
   */
  getRowSelectionData() {
    this.subscriptions.push(
      this.v3DataTableService.v3RowSelectionData$.subscribe({
        next: (res) => {
          this.selectedRowData = res;
          this.selectedRowCount.set(this.selectedRowData.length);
        }
      })
    );
  }

  headerButtonClick(event: {
    id: string;
    selectedRows: { id: string; group_name: string; created_from: number }[];
    tableId: string;
  }) {
    const { selectedRows } = event;
    switch (event.id) {
      case 'id_pay':
        this.goToGroupPaymentEdit(selectedRows[0].id);
        break;
      case 'multipleDelete':
        this.deleteGroupPayment(selectedRows[0].id, selectedRows[0].group_name);
        break;
      default:
        break;
    }
  }

  /**
   * Navigates to the edit page for a group payment.
   * @param id The ID of the group payment to edit.
   */
  goToGroupPaymentEdit(id: string) {
    this.selectedGroupId.emit(id);
  }

  onNewGroup() {
    this.selectedGroupId.emit(null);
  }

  /**
   * Deletes a group payment by ID.
   * @param id The ID of the group payment to delete.
   * @param groupName The name of the group payment to be deleted.
   */
  deleteGroupPayment(id: string, groupName: string) {
    const dRef = this.alertService.confirmAlert({
      content: `Are you sure you want to delete payment group ${groupName} permanently?`
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.groupPaymentsService
            .deletePaymentsGroup([id])
            .subscribe((data) => {
              if (data?.success) {
                this.alertService.successAlert({
                  content: 'Payment Group Deleted!',
                  close: true,
                  timeout: 1500
                });
                this.v3DataTableService.refreshV3DataTable();
              }
            })
        );
      }
    });
  }

  /**
   * Navigates to the page for creating a new payment group.
   */
  createPaymentGroup() {
    this.router.navigate(['/manage/group-payments/main']);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((element) => element?.unsubscribe?.());
  }
}
