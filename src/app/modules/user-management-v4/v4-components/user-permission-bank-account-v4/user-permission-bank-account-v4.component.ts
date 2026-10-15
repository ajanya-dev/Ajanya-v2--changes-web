import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RowClickedEvent } from '@ag-grid-community/core';
import { UserPermissionBankAccountComponent } from 'src/app/modules/user-management/components/user-permission-bank-account/user-permission-bank-account.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { UserPermissionDataTableV4Component } from '../user-permission-data-table-v4/user-permission-data-table-v4.component';

@Component({
  selector: 'app-user-permission-bank-account-v4',
  standalone: true,
  imports: [UserPermissionDataTableV4Component],
  templateUrl: './user-permission-bank-account-v4.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserPermissionBankAccountV4Component
  extends UserPermissionBankAccountComponent
  implements OnInit
{
  override ngOnInit(): void {
    (this as { frameworkComponents: unknown }).frameworkComponents = {
      SearchBoxComponent: V4TextFloatingFilterComponent
    };
    super.ngOnInit();
  }

  override onRowClicked(event: RowClickedEvent): void {
    const target = (event.event?.target as HTMLElement) ?? null;
    if (
      target?.closest('.ag-selection-checkbox') ||
      target?.closest('[role="checkbox"]')
    ) {
      return;
    }
    super.onRowClicked(event);
  }
}
