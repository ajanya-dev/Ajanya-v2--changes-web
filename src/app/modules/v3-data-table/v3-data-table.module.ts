import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { AgGridModule } from '@ag-grid-community/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { ModuleRegistry } from '@ag-grid-community/core';
import { CsvExportModule } from '@ag-grid-community/csv-export';
import { ExcelExportModule } from '@ag-grid-enterprise/excel-export';
import { V3ActionButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-action-button/v3-action-button.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3ModeOfTransferComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-mode-of-transfer/v3-mode-of-transfer.component';
import { V3NoRowsToShowOverlayComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-no-rows-to-show-overlay/v3-no-rows-to-show-overlay.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V3PaymentSourceTypeComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payment-source-type/v3-payment-source-type.component';
import { V3PaymentTypeComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payment-type/v3-payment-type.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { V3CommonActionsCellComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-common-actions-cell/v3-common-actions-cell.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownCardComponent } from 'src/app/shared/components/drop-downs/drop-down-card/drop-down-card.component';
import { DropDownWalletComponent } from 'src/app/shared/components/drop-downs/drop-down-wallet/drop-down-wallet.component';
import { DateRangeComponent } from 'src/app/shared/components/date-range/date-range.component';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { ClipboardModule } from '@ag-grid-enterprise/clipboard';
import {
  faArrowDownToLine,
  faArrowUpToLine,
  faArrowsRotate,
  faCalendar,
  faEllipsisVertical,
  faFilterList,
  faPrint,
  faUpToLine,
  faPause,
  faPlay
} from '@fortawesome/pro-solid-svg-icons';
import { ListViewToggleComponent } from 'src/app/shared/v3/common-components/list-view-toggle/list-view-toggle.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { V3DataTableComponent } from './components/v3-data-table/v3-data-table.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';

ModuleRegistry.registerModules([
  ServerSideRowModelModule,
  CsvExportModule,
  ExcelExportModule,
  MenuModule,
  ClipboardModule
]);

@NgModule({
  imports: [
    CommonModule,
    AgGridModule,
    NgSelectModule,
    FormsModule,
    AngularMaterialModule,
    SharedModule,
    DemoVideoComponent,
    V3ActionButtonComponent,
    V3ModeOfTransferComponent,
    V3NoRowsToShowOverlayComponent,
    V3DataTableSelectBoxComponent,
    V3ViewButtonComponent,
    V3UpdatedAtComponent,
    V3StatusComponent,
    V3PaymentTypeComponent,
    V3PaymentSourceTypeComponent,
    V3PayeeNameComponent,
    DropDownBankComponent,
    DropDownCardComponent,
    DropDownWalletComponent,
    CommonButtonV35Component,
    FontAwesomeModule,
    DateRangeComponent,
    ListViewToggleComponent,
    CommonBackButtonV35Component,
    V3DataTableComponent,
    V3CommonActionsCellComponent
  ],
  exports: [V3DataTableComponent]
})
export class V3DataTableModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faUpToLine,
      faArrowUpToLine,
      faEllipsisVertical,
      faFilterList,
      faArrowDownToLine,
      faArrowsRotate,
      faFilterList,
      faCalendar,
      faPrint,
      faPause,
      faPlay
    );
  }
}
