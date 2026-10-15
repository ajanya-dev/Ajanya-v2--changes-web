import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { SortPipe } from 'src/app/pipes/sort.pipe';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faCircleInfo,
  faGear,
  faMagnifyingGlass,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { ThirdpartyImportMainModalComponent } from './thirdparty-import-main-modal/thirdparty-import-main-modal.component';
import { QBonlineImportComponent } from './qbonline-import/qbonline-import.component';
import { QBdesktopImportComponent } from './qbdesktop-import/qbdesktop-import.component';
import { ZohoImportComponent } from './zoho-import/zoho-import.component';
import { XeroImportComponent } from './xero-import/xero-import.component';
import { SharedModule } from '../../shared.module';

import { ImportFromBillDotComComponent } from '../import-from-bill-dot-com/import-from-bill-dot-com.component';
import { SageBusinessImportComponent } from './sage-business-import/sage-business-import.component';
import { FreshbooksImportComponent } from './freshbooks-import/freshbooks-import.component';
import { WaveImportComponent } from './wave-import/wave-import.component';
import { NetsuiteImportComponent } from './netsuite-import/netsuite-import.component';
import { FreeagentImportsComponent } from './freeagent-imports/freeagent-imports.component';
import { MsDynamicsImportComponent } from './ms-dynamics-import/ms-dynamics-import.component';
import { ClearbooksImportComponent } from './clearbooks-import/clearbooks-import.component';
import { SageIntacctImportComponent } from './sage-intacct-import/sage-intacct-import.component';
import { WorkdayImportComponent } from './workday-import/workday-import.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    AngularMaterialModule,
    MatTabsModule,
    PipesModule,
    FontAwesomeModule,
    ThirdpartyImportMainModalComponent,
    QBonlineImportComponent,
    QBdesktopImportComponent,
    ZohoImportComponent,
    XeroImportComponent,
    ImportFromBillDotComComponent,
    SageBusinessImportComponent,
    FreshbooksImportComponent,
    WaveImportComponent,
    NetsuiteImportComponent,
    FreeagentImportsComponent,
    MsDynamicsImportComponent,
    ClearbooksImportComponent,
    SageIntacctImportComponent,
    WorkdayImportComponent
  ],
  providers: [TruncatePipe, SortPipe]
})
export class ThirdpartyImportsModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faGear, faCircleInfo, faMagnifyingGlass, faXmark);
  }
}
