import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faCommentPlus,
  faPlus,
  faQuestionCircle,
  faTrash,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { AccountDetailsFormModalComponent } from './components/account-details-form-modal/account-details-form-modal.component';
import { AddAccountDetailsComponent } from './components/add-account-details/add-account-details.component';
import { ChooseBankOptionModalComponent } from './components/choose-bank-option-modal/choose-bank-option-modal.component';
import { ConnectYourBankComponent } from './components/connect-your-bank/connect-your-bank.component';
import { NewBankAccountOptomizedModelComponent } from './components/new-bank-account-optomized-model/new-bank-account-optomized-model.component';
import { SelectAccountsComponent } from './components/select-accounts/select-accounts.component';
import { YodleeParentModalComponent } from './components/yodlee-parent-modal/yodlee-parent-modal.component';
import { DemoVideoComponent } from '../components/demo-video/demo-video.component';
import { SharedModule } from '../shared.module';

@NgModule({
  imports: [
    AngularMaterialModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    FormsModule,
    SharedModule,
    DemoVideoComponent,
    NgxMaskDirective,
    NgxMaskPipe,
    FontAwesomeModule,
    ChooseBankOptionModalComponent,
    YodleeParentModalComponent,
    ConnectYourBankComponent,
    SelectAccountsComponent,
    AddAccountDetailsComponent,
    AccountDetailsFormModalComponent,
    NewBankAccountOptomizedModelComponent
  ],
  exports: [
    NewBankAccountOptomizedModelComponent,
    YodleeParentModalComponent,
    ChooseBankOptionModalComponent
  ]
})
export class YodleeModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faXmark,
      faPlus,
      faTrash,
      faQuestionCircle,
      faCircleInfo,
      faCircleExclamation,
      faCircleCheck,
      faCommentPlus
    );
  }
}
