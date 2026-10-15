import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { TextEditorComponent } from 'src/app/shared/components/text-editor/text-editor.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import {
  faCalendar,
  faCheck,
  faChevronRight,
  faCog,
  faFloppyDisk,
  faHome,
  faPaperPlane,
  faPencil,
  faPencilAlt,
  faQuestionCircle,
  faSave,
  faSms,
  faTimes,
  faTrash,
  faTrashAlt
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { PaymentLinkIndexComponent } from './pages/payment-link-index/payment-link-index.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { linkComponent } from './components/dt-components/link';
import { IsActiveComponent } from './components/dt-components/isactive-button';
import { GetPaidByLinkComponent } from './pages/get-paid-by-link/get-paid-by-link.component';
import { PaymentSettingsComponent } from './pages/payment-settings/payment-settings.component';
import { AddNewGetPaidLinkComponent } from './modals/add-new-get-paid-link/add-new-get-paid-link.component';
import { GetPaidMessageComponent } from './modals/get-paid-message/get-paid-message.component';
import { PaymentSettingsModalComponent } from './modals/payment-settingsmodal/payment-settings.component';
import { EPaymentSettingsComponent } from './pages/e-payment-settings/e-payment-settings.component';
import { ComingSoonModalComponent } from './modals/coming-soon-modal/coming-soon-modal.component';
import { EmailLinkModalComponent } from './modals/email-link-modal/email-link-modal.component';
import { DataTableModule } from '../data-table/data-table.module';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: PaymentLinkIndexComponent,
    data: { title: 'Payment Links ' }
  },
  {
    path: 'create',
    component: GetPaidByLinkComponent,
    data: { title: 'Create Payment Link ' }
  },
  {
    path: 'create/:id',
    component: GetPaidByLinkComponent
  },
  {
    path: 'edit/:id',
    component: GetPaidByLinkComponent
  },
  {
    path: 'get_html_code/:id',
    component: PaymentSettingsComponent
  },
  {
    path: 'payment-settings',
    component: EPaymentSettingsComponent
  }
];
@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    SharedModule,
    DropDownBankComponent,
    TextEditorComponent,
    DataTableModule,
    NgxMaskDirective,
    NgxMaskPipe,
    V3DataTableModule,
    CommonButtonV35Component,
    V3DataTableModule,
    CommonBackButtonV35Component,
    FontAwesomeModule,
    PaymentLinkIndexComponent,
    linkComponent,
    IsActiveComponent,
    GetPaidByLinkComponent,
    PaymentSettingsComponent,
    AddNewGetPaidLinkComponent,
    GetPaidMessageComponent,
    PaymentSettingsModalComponent,
    EPaymentSettingsComponent,
    ComingSoonModalComponent,
    EmailLinkModalComponent
  ],
  providers: [DecimalPipe]
})
export class PaymentLinkModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faChevronRight,
      faQuestionCircle,
      faTrash,
      faHome,
      faCog,
      faTrashAlt,
      faTimes,
      faQuestionCircle,
      faPencilAlt,
      faSave,
      faSms,
      faCalendar,
      faPencil,
      faFloppyDisk,
      faCheck,
      faPaperPlane
    );
  }
}
