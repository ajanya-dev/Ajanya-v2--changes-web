import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  faArrowDownToLine,
  faArrowUpToLine,
  faChevronRight,
  faEllipsisVertical,
  faGear,
  faPlus,
  faPrint,
  faTrash,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterModule, Routes } from '@angular/router';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';

import { NgxImageZoomModule } from 'ngx-image-zoom';
import { DateRangeComponent } from 'src/app/shared/components/date-range/date-range.component';
import { TextEditorComponent } from 'src/app/shared/components/text-editor/text-editor.component';
import { PhoneInputComponent } from 'src/app/shared/components/phone-input/phone-input.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownPayeeComponent } from 'src/app/shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { ListHeaderV35Component } from 'src/app/shared/v3/common-components/list-header-v35/list-header-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ExistingBusinessComponent } from './modals/existing-business/existing-business.component';
import { OtpModalComponent } from './modals/otp-modal/otp-modal.component';
import { DataTableModule } from '../../data-table/data-table.module';
import { DownloadStatementComponent } from './modals/download-statement/download-statement.component';
import { OnBehalfOffComponent } from './modals/on-behalf-off/on-behalf-off.component';
import { CommonComponentsModule } from '../../common-components/common-components.module';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { WhiteLabelPipe } from '../../../pipes/white-label.pipe';

const routes: Routes = [];

/**
 * Represents Cloud Bank Module for v2
 */
@NgModule({
  exports: [CommonComponentsModule],
  providers: [SearchFilterPipe],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule,
    AmountInputComponent,
    RouterModule.forChild(routes),
    MatDatepickerModule,
    AngularMaterialModule,
    NgxMaskDirective,
    NgxMaskPipe,
    MatFormFieldModule,
    DataTableModule,
    NgSelectModule,
    SharedModule,
    DropDownPayeeComponent,
    DropDownBankComponent,
    OcwBackButtonComponent,
    DemoVideoComponent,
    PhoneInputComponent,
    TextEditorComponent,
    PipesModule,
    NgxImageZoomModule,
    CommonComponentsModule,
    DateRangeComponent,
    WhiteLabelPipe,
    NewPhoneInputComponent,
    WhiteLabelDirective,
    ListHeaderV35Component,
    CommonButtonV35Component,
    FontAwesomeModule,
    ExistingBusinessComponent,
    OtpModalComponent,
    DownloadStatementComponent,
    OnBehalfOffComponent
  ]
})
export class CloudBankModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faXmark,
      faPlus,
      faArrowDownToLine,
      faArrowUpToLine,
      faGear,
      faPrint,
      faChevronRight,
      faEllipsisVertical,
      faTrash
    );
  }
}
