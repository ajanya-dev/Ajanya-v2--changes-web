import { Component, DestroyRef, inject } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AgGridAngular } from '@ag-grid-community/angular';
import { GridApi, GridReadyEvent, RowClickedEvent, RowSelectedEvent } from '@ag-grid-community/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4TableSkeletonOverlay } from 'src/app/shared/V4/v4-table-skeleton-overlay/v4-table-skeleton-overlay';
import { UserPermissionDataTableComponent } from 'src/app/modules/user-management/components/user-permission-data-table/user-permission-data-table.component';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import {
  IV4SelectOption,
  V4SelectDropdownComponent
} from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';


@Component({
  selector: 'app-user-permission-data-table-v4',
  templateUrl: './user-permission-data-table-v4.component.html',
  styleUrls: ['./user-permission-data-table-v4.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NgStyle,
    FormsModule,
    LucideAngularModule,
    AgGridAngular,
    CommonButtonV4Component,
    V4SelectDropdownComponent
  ]
})
export class UserPermissionDataTableV4Component extends UserPermissionDataTableComponent {
  private destroyRef = inject(DestroyRef);
  private v35Service = inject(UserManagementV35Service);
  private localGridApi: GridApi | null = null;

  paginationDropdownStyle = {
    'background-color': 'var(--v4-tertiary-background-color)',
    height: '29px',
    'min-height': '29px'
  };

  v4PaginationSizeFilterOptions: IV4SelectOption[] = [
    { id: '5', name: '5', value: '5' },
    { id: '10', name: '10', value: '10' },
    { id: '20', name: '20', value: '20' },
    { id: '50', name: '50', value: '50' }
  ];

  v4PaginationSizeSelection: string = '50';

  // Syncs the v4 dropdown selection back to the base class's `paginationSizeSelection`
  // field before delegating. The inherited `goToSpecificPage()` reads that base-class
  // field when recomputing `paginationPageSize`, so binding the v4 dropdown directly
  // to `(ngModelChange)="goToSpecificPage(1)"` would leave the base field untouched
  // and the effective page size stuck at 50.
  onV4PageSizeChange(value: string): void {
    this.paginationSizeSelection = Number(value);
    this.goToSpecificPage(1);
  }

  // Override to align header + floating-filter row heights with the v4 theme.
  // The base component uses headerHeight: 35 / floatingFiltersHeight: 30, but
  // the ag-theme-v4 CSS forces `.ag-header-row-floating-filter { height: 44px
  // !important }`. That mismatch is what causes the visual breakage in the
  // floating filter row (misaligned resize-handle bars, tight input edges)
  // that the main v4-data-table doesn't show (it already uses 36 / 44).
  override setGridOptions() {
    super.setGridOptions();
    this.gridOptions = {
      ...this.gridOptions,
      headerHeight: 36,
      floatingFiltersHeight: 44,
      suppressHorizontalScroll: true,
      components: {
        ...this.gridOptions.components,
        V4TableSkeletonOverlay
      },
      loadingOverlayComponent: V4TableSkeletonOverlay,
      loadingOverlayComponentParams: { rowHeight: 44, rowCount: 8 }
    };
  }

  override onGridReady(params: GridReadyEvent) {
    super.onGridReady(params);
    this.localGridApi = params.api;
    this.setupPermissionSubscriptions();
  }

  override onRowSelected(event: RowSelectedEvent) {
    super.onRowSelected(event);
    const { node } = event;
    const permission = this.permissionName();
    const isSelected = node.isSelected() ?? false;

    const userDriven =
      event.source === 'checkboxSelected' ||
      event.source === 'rowClicked' ||
      event.source === 'spaceKey';

    if (!userDriven) {
      this.reconcileLoadedItemFromSignal(node, permission);
      return;
    }

    if (permission === 'payee-accounts') {
      const payeeRowId = node.data?.encrypted_id;
      if (!payeeRowId) return;
      const currentPayee = this.v35Service.permissionPayeeId()[permission];
      if ((currentPayee?.[payeeRowId] ?? false) === isSelected) return;

      this.v35Service.permissionPayeeId.update((v) => ({
        ...v,
        [permission]: { ...(v[permission] || {}), [payeeRowId]: isSelected }
      }));

      // Mirror V3 onRowClicked: keep permissionPayeeLimit in sync so onSubmit's
      // body.payeeAccounts (filtered by selected ids) includes this row's limit.
      const limitData = node.data?.payee_limit || { limit: 0, limit_frequency: 0 };
      this.v35Service.permissionPayeeLimit.update((cur) => {
        const filtered = cur.filter((it) => it.id !== payeeRowId);
        return [
          ...filtered,
          {
            id: payeeRowId,
            limit: limitData.limit || 0,
            frequency: limitData.limit_frequency || 0
          }
        ];
      });
      return;
    }

    const rowId = node.data?.encrypted_bankacc_id;
    if (!rowId) return;
    const current = this.v35Service.permissionBankId()[permission];
    if ((current?.[rowId] ?? false) === isSelected) return;

    this.v35Service.permissionBankId.update(v => ({
      ...v,
      [permission]: { ...(v[permission] || {}), [rowId]: isSelected }
    }));
  }

  private reconcileLoadedItemFromSignal(
    node: RowSelectedEvent['node'],
    permission: string
  ): void {
    const data = node?.data;
    if (!data) return;

    const idToCheck =
      permission === 'payee-accounts'
        ? data.encrypted_id
        : data.encrypted_bankacc_id;
    const itemName =
      permission === 'payee-accounts'
        ? data.payee_name
        : data.bank_account_nick_name || data.bank_account_account_name;
    if (!idToCheck || !itemName) return;

    const persistedSelected =
      permission === 'payee-accounts'
        ? !!this.v35Service.permissionPayeeId()[permission]?.[idToCheck]
        : !!this.v35Service.permissionBankId()[permission]?.[idToCheck];

    const items = new Map(this.loadedItemsSignal());
    const current = items.get(idToCheck);
    if (current?.selected === persistedSelected && current?.name === itemName) {
      return;
    }
    items.set(idToCheck, { name: itemName, selected: persistedSelected });
    this.loadedItemsSignal.set(items);
  }

  // Override parent methods as no-ops to prevent duplicate subscription accumulation.
  // The one-time subscriptions in setupPermissionSubscriptions handle the same logic.
  override getPermssionBanks() {}
  override getPermssionPayees() {}

  selectAllFromHeader(permission: string): void {
    const isChecked = !this.isSelecetAll?.[permission];
    this.selectAll(
      { target: { checked: isChecked } } as unknown as Event,
      permission
    );
  }

  private setupPermissionSubscriptions(): void {
    // Bank permissions — reacts to permissionBankId signal changes
    this.getBankIds$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const permission = this.permissionName();
        if (!res || !res[permission] || permission === 'payee-accounts') return;

        const allitemSelected = Object.keys(res[permission]).every(
          (key) => res[permission][key] === true
        );
        this.isSelecetAll = { [permission]: allitemSelected };

        this.localGridApi?.forEachNode((node) => {
          const { data } = node;
          const permissionBankIds = res[permission];
          const idToCheck = data?.encrypted_bankacc_id;
          const shouldSelect = permissionBankIds
            ? !!permissionBankIds[idToCheck]
            : false;
          if (node.isSelected() !== shouldSelect) {
            node.setSelected(shouldSelect);
          }
        });

        this.getSelectedNames();
      });

    // Payee permissions — reacts to permissionPayeeId signal changes
    this.getPayeeIds$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const permission = this.permissionName();
        if (!res || !res[permission] || permission !== 'payee-accounts') return;

        const allitemSelected = Object.keys(res[permission]).every(
          (key) => res[permission][key] === true
        );
        this.isSelecetAll = { [permission]: allitemSelected };

        this.localGridApi?.forEachNode((node) => {
          const { data } = node;
          const permissionPayeeIds = res[permission];
          const idToCheck = data?.encrypted_id;
          const shouldSelect = permissionPayeeIds
            ? !!permissionPayeeIds[idToCheck]
            : false;
          if (node.isSelected() !== shouldSelect) {
            node.setSelected(shouldSelect);
          }
        });

        this.getSelectedNames();
        this.permissionsLoaded.emit();
      });
  }

  override onRowClick(event: RowClickedEvent) {
    super.onRowClick(event);
  }

}
