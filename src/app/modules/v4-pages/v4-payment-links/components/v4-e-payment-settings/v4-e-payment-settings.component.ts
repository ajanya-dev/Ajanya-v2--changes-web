import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom, finalize } from 'rxjs';

import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IDtFloatingFilterProp } from 'src/app/modules/data-table/model/datatable';
import { ISelectedSingleRow } from 'src/app/modules/data-table/model/datatable';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';

import { V4PaymentSettingsModalComponent } from '../../modals/v4-payment-settings-modal/v4-payment-settings-modal.component';
import { PaymentSettingsActionCellComponent } from './payment-settings-action-cell.component';
import { PaymentSettingsTextCellComponent } from './payment-settings-text-cell.component';

@Component({
  selector: 'app-v4-e-payment-settings',
  standalone: true,
  imports: [V4DataTableComponent, V4PageHeaderComponent],
  templateUrl: './v4-e-payment-settings.component.html',
  styleUrls: ['./v4-e-payment-settings.component.scss']
})
export class V4EPaymentSettingsComponent implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private v4AlertService = inject(V4AlertService);
  private paymentLinkService = inject(PaymentLinkService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  public tableId = DTTableId.paymentSettings;
  deleteLoading = signal(false);

  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    actionComponent: PaymentSettingsActionCellComponent,
    textCellComponent: PaymentSettingsTextCellComponent
  };

  readonly paymentTypeMap: Record<number, string> = {
    1: 'Stripe',
    2: 'PayPal',
    3: 'Bitpay',
    4: 'Stripe Checkout'
  };

  floatingSelectBoxValues: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'payment_type',
        values: [
          { value: 1, name: 'Stripe' },
          { value: 2, name: 'PayPal' },
          { value: 3, name: 'Bitpay' },
          { value: 4, name: 'Stripe Checkout' }
        ]
      }
    ]
  };

  readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'id_add_new_link',
      text: 'New Payment Setting',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: 'Add New Payment Setting'
    }
  ];

  headerElements: IV3DtHeaderElements = {
    buttons: [
      {
        id: 'id_delete',
        text: 'Delete',
        lucideIcon: 'trash-2',
        toolTip: 'Delete Selected',
        floatingBarVariant: 'filled-danger',
        customClasses: '[&_span]:mt-px'
      }
    ]
  };

  ngOnInit(): void {
    const actionComponentProp = {
      deleteButton: true,
      editButton: true
    };

    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingSelectBoxValues,
      undefined,
      actionComponentProp
    );

    this.initializeV3DataTable();
  }

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

  headerButtonNavigation(ev: {
    id: string;
    selectedRows: { encrypted_id: string }[];
  }): void {
    switch (ev.id) {
      case 'id_add_new_link':
        this.openPaymentModal('C', '');
        break;

      case 'id_delete':
        if (!ev.selectedRows?.length) {
          this.v4AlertService.warningAlert({
            content: 'Please select payment settings to delete.'
          });
          return;
        }
        this.bulkDelete(ev.selectedRows);
        break;

      default:
        break;
    }
  }

  onCellAction(ev: ISelectedSingleRow): void {
    if (
      (ev.tableId && ev.tableId !== this.tableId) ||
      !ev.selectedRow
    ) {
      return;
    }

    switch (ev.id) {
      case 'id_edit_button':
        this.openPaymentModal('E', ev.selectedRow.encrypted_id);
        break;

      case 'id_delete_button':
        this.singleDelete(ev.selectedRow.encrypted_id);
        break;

      default:
        break;
    }
  }

  openPaymentModal(mode: 'C' | 'E', id: string): void {
    const dialogRef = this.dialog.open(V4PaymentSettingsModalComponent, {
      maxWidth: '500px',
      width: '90%',
      data: { mode, id, isExcistData: false },
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.successCallback(
            mode === 'C' ? 'Payment option added successfully' : 'Updated successfully'
          );
        }
      });
  }

  async singleDelete(id: string): Promise<void> {
    const confirmation = await firstValueFrom(
      this.v4AlertService
        .warningAlert({
          title: 'Alert',
          content: 'Are you sure you want to delete?',
          doneMsg: 'Yes, Delete it!',
          cancelMsg: 'No, cancel',
          isCancel: true
        })
        .afterClosed()
    );

    if (!confirmation) return;

    this.paymentLinkService
      .deletePaymentLink(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.successCallback('Deleted successfully');
        }
      });
  }

  async bulkDelete(items: { encrypted_id: string }[]): Promise<void> {
    const confirmation = await firstValueFrom(
      this.v4AlertService
        .warningAlert({
          title: 'Alert',
          content: 'Are you sure you want to delete?',
          doneMsg: 'Yes, Delete it!',
          cancelMsg: 'No, cancel',
          isCancel: true
        })
        .afterClosed()
    );

    if (!confirmation) return;

    const ids = items.map((el) => el.encrypted_id);

    this.deleteLoading.set(true);
    this.paymentLinkService
      .deletePaymentLinkBulk({ ids })
      .pipe(
        finalize(() => this.deleteLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.successCallback('Deleted successfully');
        }
      });
  }

  private successCallback(message: string): void {
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
    this.dataTableService.setRefreshStatus(true);
    this.v3DataTableService.refreshV3DataTable();
    this.v4AlertService.successAlert({
      title: 'Success',
      content: message
    });
  }

  // Column Definitions
  colDefId: ICoulmnDefFields = {
    headerName: '',
    field: 'boxId',
    suppressFloatingFilterButton: true,
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    checkboxSelection: true,
    floatingFilterComponent: 'headerCheckBoxComponent',
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    headerClass: 'pl-3.5',
    headerCheckboxSelection: true,
    showDisabledCheckboxes: true,
    pinned: 'left' as const,
    lockPinned: true,
    suppressMovable: true,
    sortable: false,
    cellClass: 'flex justify-center'
  };

  colDefAction: ICoulmnDefFields = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    maxWidth: 120,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    pinned: 'left' as const,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    resizable: false,
    cellClass: 'flex items-center'
  };

  colDefNickName: ICoulmnDefFields = {
    headerName: 'Nick Name',
    field: 'nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 160,
    flex: 1,
    cellClass: 'flex items-center',
    cellRenderer: 'textCellComponent'
  };

  colDefPaymentType: ICoulmnDefFields = {
    headerName: 'Payment Type',
    field: 'payment_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 180,
    flex: 1,
    cellClass: 'flex items-center',
    cellRenderer: 'textCellComponent',
    cellRendererParams: {
      valueMap: this.paymentTypeMap
    }
  };

  columnDefs: ICoulmnDefFields[] = [
    this.colDefId,
    this.colDefAction,
    this.colDefNickName,
    this.colDefPaymentType
  ];
}
