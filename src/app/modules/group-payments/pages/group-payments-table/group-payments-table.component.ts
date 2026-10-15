import { CurrencyPipe, NgClass } from '@angular/common';
import { Component, OnDestroy, inject, OnInit, input } from '@angular/core';
import { Router, Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V3CommonActionsCellComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-common-actions-cell/v3-common-actions-cell.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IRowNode, IsRowSelectable, RowNode } from '@ag-grid-community/core';
import { GroupPaymentsService } from '../../services/group-payments.service';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-group-payments-table',
  templateUrl: './group-payments-table.component.html',
  styleUrls: ['./group-payments-table.component.scss'],
  standalone: true,
  imports: [CommonButtonV35Component, V3DataTableComponent, NgClass]
})
export class GroupPaymentsTableComponent implements OnInit, OnDestroy {
  private sharedService = inject(SharedService);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private groupPaymentsService = inject(GroupPaymentsService);
  private currencyPipe = inject(CurrencyPipe);
  private v3DataTableService = inject(V3DataTableService);

  asComponent = input(false);
  fieldsShownByDefault: string[] = ['id'];

  subscriptions: Subscription[] = [];
  tableId = DTTableId.groupPayment;

  // Row selection properties
  selectedRowData: RowNode[] = [];
  selectedRowCount: number = 0;

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
    this.v3DataTableService.refreshV3DataTable();
    this.getRowSelectionData();
  }

  frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    dateFilterComponent: DataRangeV35Component,
    SearchBoxComponent: DtSearchBoxComponent,
    actionsComponent: V3CommonActionsCellComponent
  };

  columnDefs = [
    {
      maxWidth: 40,
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
      headerName: 'Date',
      field: 'created_at',
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'dateFilterComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      floatingFilterComponentParams: {
        v2Table: true,
        tableId: 81
      },
      maxWidth: 300
    },
    {
      headerName: 'Name',
      field: 'group_name',
      suppressFloatingFilterButton: true,
      minWidth: 100,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true
    },
    {
      headerName: 'Payments Count',
      field: 'items',
      suppressFloatingFilterButton: true,
      minWidth: 100,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true
    },
    {
      headerName: 'Total Amount',
      field: 'totalAmount',
      suppressFloatingFilterButton: true,
      minWidth: 100,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellRenderer: (params: Params) =>
        this.currencyPipe.transform(params.value) as string
    },
    {
      headerName: 'Created By',
      field: 'created_by',
      suppressFloatingFilterButton: true,
      minWidth: 100,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true
    },
    {
      headerName: 'View',
      field: 'actions',
      minWidth: 30,
      maxWidth: 100,
      cellRenderer: 'actionsComponent',
      cellRendererParams: {
        onView: (params: Params) => {
          this.goToGroupPaymentEdit(params.data.id, params.data.created_from);
        },
        onDelete: (params: Params) => {
          this.deleteGroupPayment(params.data.id, params.data.group_name);
        }
      },
      suppressHeaderMenuButton: true,
      sortable: false
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
          this.selectedRowCount = this.selectedRowData.length;
        }
      })
    );
  }

  /**
   * Removes row selection data and deselects all rows
   */
  removeRowSelectionData() {
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  /**
   * Determines if a row is selectable based on group payment data
   */
  isRowSelectable: IsRowSelectable = (node: IRowNode) => true;

  /**
   * Navigates to the edit page for a group payment.
   * @param id The ID of the group payment to edit.
   */
  goToGroupPaymentEdit(id: string, to: number) {
    if (to === 1) {
      this.router.navigate(['/manage/group-payments/main', id]);
    } else {
      this.router.navigate(['manage/cheque/group/edit'], {
        queryParams: {
          id
        }
      });
    }
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

  saveChecks() {
    const isMultipleCheck = this.selectedRowData[0].data.created_from === 2;
    if (isMultipleCheck) {
      this.router.navigate(['/manage/cheque/group/edit'], {
        queryParams: {
          id: this.selectedRowData[0].data?.id,
          auto: true
        }
      });
    } else {
      this.router.navigate([
        '/manage/group-payments/main',
        this.selectedRowData[0].data?.id
      ]);
    }
  }

  /**
   * Navigates to the previous page.
   */
  goBack() {
    this.sharedService.goBack();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((element) => element?.unsubscribe?.());
  }
}
