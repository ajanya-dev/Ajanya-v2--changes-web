import { Component, HostBinding, inject, OnDestroy } from '@angular/core';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { PayeeMultiSelectDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-multi-select-dropdown-v4/payee-multi-select-dropdown-v4.component';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

@Component({
  selector: 'app-user-permission-payee-floating-filter-v4',
  template: `
    <div class="w-full font-peridot">
      @if (noPermission) {
        <div
          class="flex items-center w-full h-7 px-2 py-1 border border-v4-input-border-color rounded-md bg-v4-secondary-background-color text-[12px] text-v4-subtle-text-color opacity-50"
        >
          Permission Denied
        </div>
      } @else {
        <app-payee-multi-select-dropdown-v4
          placeholder="Select Payee"
          (selectionEvent)="onSelectionChange($event)"
        />
      }
    </div>
  `,
  standalone: true,
  imports: [PayeeMultiSelectDropdownV4Component]
})
export class UserPermissionPayeeFloatingFilterV4Component implements OnDestroy {
  @HostBinding('class') hostClass = 'w-full';

  private sharedService = inject(SharedService);
  private paymentsService = inject(PaymentsService);
  private userManagementV35Service = inject(UserManagementV35Service);
  private v3DataTableService = inject(V3DataTableService);

  noPermission = false;
  hasSelection = false;

  agInit(_params: IFloatingFilterParams): void {
    if (!this.paymentsService.hasPermission?.payee) {
      this.noPermission = true;
    }
  }

  onParentModelChanged(): void {}

  onSelectionChange(event: IPayeeDropdown | IPayeeDropdown[]): void {
    const selections =
      event == null ? [] : ([] as IPayeeDropdown[]).concat(event);
    this.hasSelection = selections.length > 0;

    const payeeIds = selections.map((p) => p.id);
    this.sharedService.selectedPayees.setValue(selections);
    this.v3DataTableService.defaultPayload = {
      ...this.v3DataTableService.defaultPayload,
      payeeIds,
      startRow: 0,
      endRow: 50
    };
    this.userManagementV35Service.refreshV3DataTable('payee-accounts');
  }

  ngOnDestroy(): void {
    if (this.hasSelection) {
      this.v3DataTableService.defaultPayload = {
        ...this.v3DataTableService.defaultPayload,
        payeeIds: []
      };
    }
  }
}
