import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { NgSelectModule } from '@ng-select/ng-select';
import { PipesModule } from 'src/app/pipes/pipes.module';
import {
  faArrowDownToLine,
  faArrowUpToLine,
  faMagnifyingGlass,
  faPlus,
  faQuestionCircle,
  faTrash,
  faUserPlus,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { SmsPanelMainComponent } from './pages/sms-panel-main/sms-panel-main.component';
import { SmsPanelIntroComponent } from './pages/sms-panel-intro/sms-panel-intro.component';
import { DataTableModule } from '../../data-table/data-table.module';
import { SmsTableComponent } from './components/sms-table/sms-table.component';
import { GroupTableComponent } from './components/group-table/group-table.component';
import { SendSmsComponent } from './components/send-sms/send-sms.component';
import { UploadContacsModalComponent } from './modals/upload-contacs-modal/upload-contacs-modal.component';
import { GroupDetailsComponent } from './components/group-details/group-details.component';
import { AddContactModalComponent } from './modals/add-contact-modal/add-contact-modal.component';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { SMSPanelDtviewDetailsComponent } from './components/sms-panel-dtview-details/sms-panel-dtview-details.component';
import { DefaultMessageSettingsComponent } from './components/default-message-settings/default-message-settings.component';
import { CampaignDetailsComponent } from './components/campaign-details/campaign-details.component';
import { DefaultSmsDetailsComponent } from './components/default-sms-details/default-sms-details.component';
import { MoreSettingsComponent } from './components/more-settings/more-settings.component';
import { InboxComponent } from './components/inbox/inbox.component';
import { BuyPhonenumberModalComponent } from './modals/buy-phonenumber-modal/buy-phonenumber-modal.component';
import { ContactsComponent } from './components/contacts/contacts.component';
import { QuicksmsComponent } from './components/quicksms/quicksms.component';
import { AllSmsLogComponent } from './components/all-sms-log/all-sms-log.component';
import { TermsAndConditionsComponent } from './pages/terms-and-conditions/terms-and-conditions.component';
import { V3DataTableModule } from '../../v3-data-table/v3-data-table.module';

const routes: Routes = [
  {
    path: '',
    component: SmsPanelMainComponent,
    pathMatch: 'full'
  },
  {
    path: 'intro',
    component: SmsPanelIntroComponent
  },
  {
    path: 'terms',
    component: TermsAndConditionsComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedModule,
    FormsModule,
    DataTableModule,
    AngularMaterialModule,
    MatDialogModule,
    NgxMaskDirective,
    NgxMaskPipe,
    NgSelectModule,
    PipesModule,
    V3DataTableModule,
    FontAwesomeModule,
    SmsPanelMainComponent,
    SmsPanelIntroComponent,
    SmsTableComponent,
    GroupTableComponent,
    SendSmsComponent,
    UploadContacsModalComponent,
    GroupDetailsComponent,
    AddContactModalComponent,
    SMSPanelDtviewDetailsComponent,
    DefaultMessageSettingsComponent,
    CampaignDetailsComponent,
    DefaultSmsDetailsComponent,
    MoreSettingsComponent,
    InboxComponent,
    BuyPhonenumberModalComponent,
    ContactsComponent,
    QuicksmsComponent,
    AllSmsLogComponent,
    TermsAndConditionsComponent
  ]
})
export class SmsPanelModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faTrash,
      faXmark,
      faPlus,
      faUserPlus,
      faQuestionCircle,
      faArrowDownToLine,
      faArrowUpToLine,
      faMagnifyingGlass
    );
  }
}
