import { ClipboardModule } from '@ag-grid-enterprise/clipboard';
import { MatDialogModule } from '@angular/material/dialog';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from '@ag-grid-community/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { DateRangeComponent } from 'src/app/shared/components/date-range/date-range.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { DropDownCategoryComponent } from 'src/app/shared/components/drop-downs/drop-down-category/drop-down-category.component';
import { DropDownWalletComponent } from 'src/app/shared/components/drop-downs/drop-down-wallet/drop-down-wallet.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { ModuleRegistry } from '@ag-grid-community/core';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import { CsvExportModule } from '@ag-grid-community/csv-export';
import {
  faArrowDown,
  faChevronLeft,
  faChevronRight,
  faCog,
  faEdit,
  faEllipsisVertical,
  faEye,
  faPlus,
  faSort,
  faTimes,
  faTrash,
  faTrashAlt,
  faTriangleExclamation,
  faArrowsRotate,
  faArrowUpToLine,
  faAngleLeft,
  faFilterList
} from '@fortawesome/pro-solid-svg-icons';
import {
  faTriangleExclamation as farTriangleExclamation,
  faTrashAlt as farTrashAlt
} from '@fortawesome/pro-regular-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { DtActionComponent } from './components/dt-action/dt-action.component';
import { DtSelectBoxComponent } from './components/dt-select-box/dt-select-box.component';
import { DtSelectAllCheckBoxComponent } from './components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtSelectDateComponent } from './components/dt-select-date/dt-select-date.component';
import { CustomRangeComponent } from './components/custom-range/custom-range.component';
import { DtSearchBoxComponent } from './components/dt-search-box/dt-search-box.component';
import { DtDropDownBankComponent } from './components/dt-drop-down-bank/dt-drop-down-bank.component';
import { ExportToEmailComponent } from './modals/export-to-email/export-to-email.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { DtDropDownPayeeComponent } from './components/dt-drop-down-payee/dt-drop-down-payee.component';
import { DtLoaderComponent } from './components/dt-loader/dt-loader.component';
import { DtSearchBoxCustomFilterComponent } from './components/dt-search-box-custom-filter/dt-search-box-custom-filter.component';
import { ExcelExportModule } from '@ag-grid-enterprise/excel-export';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { DataTableComponent } from './components/data-table/data-table.component';

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
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    AgGridModule,
    SharedModule,
    DropDownBankComponent,
    DropDownWalletComponent,
    DropDownCategoryComponent,
    DemoVideoComponent,
    NgSelectModule,
    MatDialogModule,
    DateRangeComponent,
    FontAwesomeModule,
    DataTableComponent,
    DtActionComponent,
    DtSelectBoxComponent,
    DtSelectAllCheckBoxComponent,
    DtSelectDateComponent,
    CustomRangeComponent,
    DtSearchBoxComponent,
    DtDropDownBankComponent,
    ExportToEmailComponent,
    DtDropDownPayeeComponent,
    DtLoaderComponent,
    DtSearchBoxCustomFilterComponent
  ],
  exports: [DataTableComponent, DtSearchBoxComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
  // entryComponents: [ActionFilterComponent, TypeSelectBoxComponent, HeaderCheckBoxComponent],
})
export class DataTableModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPlus,
      faTriangleExclamation,
      faTrash,
      faEllipsisVertical,
      faChevronLeft,
      faChevronRight,
      faSort,
      faArrowDown,
      faPlus,
      faCog,
      faEye,
      faEdit,
      faTrashAlt,
      faTimes,
      faArrowsRotate,
      faArrowUpToLine,
      faAngleLeft,
      farTriangleExclamation,
      farTrashAlt,
      faFilterList
    );
  }
}
