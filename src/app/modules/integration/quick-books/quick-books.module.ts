import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { CommonModalModule } from 'src/app/shared/modal/common-modal/common-modal.module';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faArrowDown,
  faArrowUp,
  faChevronRight,
  faCircleExclamation,
  faCog,
  faDownToLine,
  faFileArrowDown,
  faGear,
  faPenField,
  faPenToSquare,
  faRightLeft,
  faRotateRight,
  faSpinner,
  faTimes,
  faTrash,
  faTrashCan,
  faTriangleExclamation
} from '@fortawesome/pro-solid-svg-icons';
import { faPenToSquare as farPenToSquare } from '@fortawesome/pro-regular-svg-icons';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { MapImportedQuickBookOnlineComponent } from './pages/map-imported-quick-book-online/map-imported-quick-book-online.component';
import { QuickbooksOnlineComponent } from './pages/quickboks-online/quickbooks-online.component';
import { QuickbooksDesktopComponent } from './pages/quickbooks-desktop/quickbooks-desktop.component';
import { MappingQuickBookDesktopComponent } from './pages/mapping-quick-book-desktop/mapping-quick-book-desktop.component';
import { DataTableModule } from '../../data-table/data-table.module';
import { mapImportQbComponent } from './pages/map-imported-quick-book-online/Map-Imported-Qb';
import { QuickBooksIntegrationComponent } from './pages/quickbooks-integration/quickbooks-integration.component';
import { QuickBooksSettingsComponent } from './modals/quick-books-settings-modal/quick-books-settings.component';
import { MapBankAccountModalDesktopComponent } from './modals/map-bank-account-modal-desktop/map-bank-account-modal-desktop.component';
import { QuickbooksDesktopOldComponent } from './components/quickbooks-desktop-old/quickbooks-desktop-old.component';
import { MoreSettingsQbdesktopComponent } from './components/more-settings-qbdesktop/more-settings-qbdesktop.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

const routes: Routes = [
  {
    path: 'index',
    component: QuickBooksIntegrationComponent
  },
  // Quick book online
  {
    path: 'quickbooks_online',
    component: QuickbooksOnlineComponent,
    data: { backUrl: 'manage/thirdparty_app/index' }
  },
  // {
  //   path: 'quickbooks_online/callback', component: QuickbooksOnlineComponent
  // },
  {
    path: 'quickbooks_online/mapping',
    component: MapImportedQuickBookOnlineComponent
  },

  // Quick book desktop
  {
    path: 'qb_desktop',
    component: QuickbooksDesktopComponent,
    data: { backUrl: 'manage/thirdparty_app/index' }
  },
  {
    path: 'qb_desktop/mapping',
    component: MappingQuickBookDesktopComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    SharedModule,
    DropDownBankComponent,
    OcwBackButtonComponent,
    DemoVideoComponent,
    CustomerSupportComponent,
    CommonModalModule,
    DataTableModule,
    FontAwesomeModule,
    CommonBackButtonV35Component,
    QuickBooksIntegrationComponent,
    QuickbooksDesktopComponent,
    MapImportedQuickBookOnlineComponent,
    MappingQuickBookDesktopComponent,
    mapImportQbComponent,
    QuickBooksSettingsComponent,
    QuickbooksOnlineComponent,
    MapBankAccountModalDesktopComponent,
    QuickbooksDesktopOldComponent,
    MoreSettingsQbdesktopComponent
  ]
})
export class QuickBooksModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faTimes,
      faGear,
      faCircleExclamation,
      faDownToLine,
      faRightLeft,
      faCog,
      faTriangleExclamation,
      faPenToSquare,
      faTrash,
      faRotateRight,
      faDownToLine,
      faArrowUp,
      faArrowDown,
      faFileArrowDown,
      faPenField,
      faSpinner,
      faTrashCan,
      faChevronRight,
      farPenToSquare
    );
  }
}
