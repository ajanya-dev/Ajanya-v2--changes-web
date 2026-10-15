import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit
} from '@angular/core';
import { UserPermissionPayeeComponent } from 'src/app/modules/user-management/components/user-permission-payee/user-permission-payee.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { TooltipOnEllipsisComponent } from 'src/app/shared/v3/dt-cellrenderers/v35/tooltip-on-ellipsis/tooltip-on-ellipsis.component';
import { HeaderWithTooltipComponent } from 'src/app/shared/components/header-with-tooltip/header-with-tooltip.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { UserPermissionDataTableV4Component } from '../user-permission-data-table-v4/user-permission-data-table-v4.component';
import { V4PayeeLimitCellRendererComponent } from './v4-payee-limit-cell-renderer/v4-payee-limit-cell-renderer.component';

@Component({
  selector: 'app-user-permission-payee-v4',
  standalone: true,
  imports: [UserPermissionDataTableV4Component],
  templateUrl: './user-permission-payee-v4.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserPermissionPayeeV4Component
  extends UserPermissionPayeeComponent
  implements OnInit
{
  private v3DtService = inject(V3DataTableService);

  override ngOnInit(): void {
    (this as { frameworkComponents: unknown }).frameworkComponents = {
      // Floating filters → v4
      SearchBoxComponent: V4TextFloatingFilterComponent,
      v3PayeeListDropDownFilterComponent:
        V4PayeeMultiSelectFloatingFilterComponent,
      // Cell renderers → kept (render text inside v4-themed cells)
      v3PayeeNameComponent: V3PayeeNameComponent,
      tooltipOnEllipsisComponent: TooltipOnEllipsisComponent,
      payeeLimitCellRendererComponent: V4PayeeLimitCellRendererComponent,
      headerWithTooltipComponent: HeaderWithTooltipComponent
    };

      this.v3DtService.defaultPayload = {
        ...this.v3DtService.defaultPayload,
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
    super.ngOnInit();
  }
}
