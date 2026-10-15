import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
  effect
} from '@angular/core';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { TooltipOnEllipsisComponent } from 'src/app/shared/v3/dt-cellrenderers/v35/tooltip-on-ellipsis/tooltip-on-ellipsis.component';
import { environment } from 'src/environments/environment';
import { ColDef, RowClickedEvent } from '@ag-grid-community/core';
import { UserPermissionDataTableComponent } from '../user-permission-data-table/user-permission-data-table.component';
import { UserManagementV35Service } from '../../service/user-management-v35.service';
import { PayeeLimitCellRendererComponent } from './payee-limit-cell-renderer/payee-limit-cell-renderer.component';
import { HeaderWithTooltipComponent } from 'src/app/shared/components/header-with-tooltip/header-with-tooltip.component';

@Component({
  selector: 'app-user-permission-payee',
  standalone: true,
  imports: [UserPermissionDataTableComponent],
  templateUrl: './user-permission-payee.component.html',
  styleUrl: './user-permission-payee.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserPermissionPayeeComponent implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private userManagementV35Service = inject(UserManagementV35Service);

  tableId = DTTableId.payee;
  env = environment;
  whiteLabelName: string;
  permissionName = input('');
  userId = input<string>('');
  @Output() rowClicked = new EventEmitter();

  constructor() {
    if (environment.env_id === 'compass') {
      this.columnDefs.splice(2, 1);
    }

    // Watch for userId changes and update table payload
    effect(() => {
      const currentUserId =
        this.userId() || this.userManagementV35Service.selectedUserId()?.userId;
      if (currentUserId) {
        this.v3DataTableService.defaultPayload = {
          ...this.v3DataTableService.defaultPayload,
          permissionUserId: currentUserId,
          sortModel: [{ colId: 'payee_name', sort: 'asc' }]
        };
      }
    });
  }

  frameworkComponents = {
    SearchBoxComponent: DtSearchBoxComponent,
    v3PayeeNameComponent: V3PayeeNameComponent,
    tooltipOnEllipsisComponent: TooltipOnEllipsisComponent,
    v3PayeeListDropDownFilterComponent: DtMultiDropdownPayeeComponent,
    payeeLimitCellRendererComponent: PayeeLimitCellRendererComponent,
    headerWithTooltipComponent: HeaderWithTooltipComponent
  };

  colDefId = {
    maxWidth: 45,
    headerName: '',
    sortable: false,
    field: 'boxId',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,

    lockPosition: true,
    headerCheckboxSelection: false,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    pinned: 'left',
    cellClass: 'flex flex-col justify-center pl-[6px]',
    headerClass: 'pl-[8px]',
    suppressRowClickSelection: true
  };

  colDefName: ColDef = {
    headerName: 'Name',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    minWidth: 175,
    floatingFilterComponent: 'v3PayeeListDropDownFilterComponent',
    floatingFilterComponentParams: {
      tableName: 'user-permission'
    },
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3PayeeNameComponent',
    cellClass: 'flex flex-col justify-center',
    cellRendererParams: {
      hideFilter: true
    }
  };

  colDefPayeeLimit = {
    headerName: 'Limit',
    field: 'payee_limit',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    floatingFilterComponentParams: {
      tableName: 'user-permission'
    },
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    cellRenderer: 'payeeLimitCellRendererComponent',
    cellClass: 'flex justify-start items-center cursor-pointer',
    headerComponent: 'headerWithTooltipComponent',
    headerComponentParams: {
      headerText: 'Limit',
      tooltipText:
        'Payee limits apply only to check payments. You can configure daily, weekly, monthly, or yearly limits as needed.',
      iconClass: 'fas fa-info-circle text-blue-500'
    },
    cellRendererParams: {
      onLimitChanged: (event: {
        rowId: string;
        limitData: { limit: number; limit_frequency: number };
      }) => this.onLimitChanged(event)
    }
  };

  colDefNickName = {
    headerName: 'Nick Name',
    field: 'payee_nick_name',
    suppressFloatingFilterButton: true,
    minWidth: 95,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,

    cellRenderer: 'tooltipOnEllipsisComponent'
  };

  columnDefs = [
    this.colDefId,
    this.colDefName,
    this.colDefPayeeLimit,
    this.colDefNickName
  ];

  ngOnInit(): void {
    const currentUserId =
      this.userId() || this.userManagementV35Service.selectedUserId()?.userId;

    this.v3DataTableService.defaultPayload = {
      ...this.v3DataTableService.defaultPayload,
      permissionUserId: currentUserId,
      sortModel: [{ colId: 'payee_name', sort: 'asc' }]
    };
    this.whiteLabelName =
      environment.env_id === 'compass' ? 'Vendors' : 'Payees';
  }

  onRowClicked(event: RowClickedEvent) {
    if (event.event && event.event.target) {
      const target = event.event.target as HTMLElement;
      if (
        target.closest('.ag-selection-checkbox') ||
        target.closest('[role="checkbox"]')
      ) {
        return;
      }
    }

    const rowData = event.data;
    const currentPermissionName = this.permissionName();
    const rowId = rowData.encrypted_id;

    this.userManagementV35Service.permissionPayeeId.update((currentValue) => {
      const currentMapping = currentValue[currentPermissionName] || {};
      const newSelectionState = !currentMapping[rowId];
      return {
        ...currentValue,
        [currentPermissionName]: {
          ...currentMapping,
          [rowId]: newSelectionState
        }
      };
    });

    const limitData = rowData.payee_limit || { limit: 0, limit_frequency: 0 };
    this.userManagementV35Service.permissionPayeeLimit.update(
      (currentValue) => {
        const filteredValue = currentValue.filter((item) => item.id !== rowId);

        return [
          ...filteredValue,
          {
            id: rowId,
            limit: limitData.limit || 0,
            frequency: limitData.limit_frequency || 0
          }
        ];
      }
    );

    this.rowClicked.emit(currentPermissionName);
  }

  onPermissionsLoaded() {
    setTimeout(() => {
      this.initializePayeeLimitsForSelectedPayees();
    }, 100);
  }

  onLimitChanged(event: {
    rowId: string;
    limitData: { limit: number; limit_frequency: number };
  }) {
    const { rowId, limitData } = event;

    this.userManagementV35Service.permissionPayeeLimit.update(
      (currentValue) => {
        const filteredValue = currentValue.filter((item) => item.id !== rowId);

        return [
          ...filteredValue,
          {
            id: rowId,
            limit: limitData.limit || 0,
            frequency: limitData.limit_frequency || 0
          }
        ];
      }
    );
  }

  /**
   * Initialize payee limits for already selected payees when the grid loads
   * This ensures that existing payee limit data is properly loaded into the signal
   */
  initializePayeeLimitsForSelectedPayees() {
    const currentPermissionName = this.permissionName();
    const selectedPayeeIds =
      this.userManagementV35Service.permissionPayeeId()[
        currentPermissionName
      ] || {};

    const gridApi = this.v3DataTableService.gridApi;
    if (!gridApi) return;

    gridApi.forEachNode((node) => {
      const rowData = node.data;
      const rowId = rowData.encrypted_id;

      if (selectedPayeeIds[rowId] && rowData.payee_limit) {
        const limitData = rowData.payee_limit;

        this.userManagementV35Service.permissionPayeeLimit.update(
          (currentValue) => {
            const existingItem = currentValue.find((item) => item.id === rowId);
            if (!existingItem) {
              return [
                ...currentValue,
                {
                  id: rowId,
                  limit: limitData.limit || 0,
                  frequency: limitData.limit_frequency || 0
                }
              ];
            }
            return currentValue;
          }
        );
      }
    });
  }
}
