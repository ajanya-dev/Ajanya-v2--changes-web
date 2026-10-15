import { V35ControlMessageComponent } from './../../shared/v3/control-message-v35/control-message-v35.component';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { SharedModule } from '../../shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckMailBulkOcwV3Component } from './components/check-mail-bulk-ocw-v3/check-mail-bulk-ocw-v3.component';
import { CheckMailType2BulkOcwV3Component } from './components/check-mail-type2-bulk-ocw-v3/check-mail-type2-bulk-ocw-v3.component';
import { CheckEmailBulkOcwV3Component } from './components/check-email-bulk-ocw-v3/check-email-bulk-ocw-v3.component';
import { V3BulkPaymentComponent } from './pages/v3-bulk-payment/v3-bulk-payment.component';
import { RouterModule, Routes } from '@angular/router';
import { AchBulkOcwV3Component } from './components/ach-bulk-ocw-v3/ach-bulk-ocw-v3.component';
import { WireBulkOcwV3Component } from './components/wire-bulk-ocw-v3/wire-bulk-ocw-v3.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CheckModeSelectBulkV3Component } from './components/check-mode-select-bulk-v3/check-mode-select-bulk-v3.component';
import { VirtualCardBulkOcwV3Component } from './components/virtual-card-bulk-ocw-v3/virtual-card-bulk-ocw-v3.component';
import { CheckPrintBulkV3Component } from './components/check-print-bulk-v3/check-print-bulk-v3.component';
import { WalletCheckPrintBulkV3Component } from './components/wallet-check-print-bulk-v3/wallet-check-print-bulk-v3.component';
import { WalletCheckEmailBulkV3Component } from './components/wallet-check-email-bulk-v3/wallet-check-email-bulk-v3.component';
import { V3PaymentSummaryModalComponent } from './modals/v3-payment-summery-modal/v3-payment-summary-modal.component';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { CheckDdBulkOcwV3Component } from './components/check-dd-bulk-ocw-v3/check-dd-bulk-ocw-v3.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faBuildingColumns,
  faCircle,
  faCircleCheck,
  faCircleExclamation,
  faCreditCard,
  faCreditCardFront,
  faMessagePlus,
  faPaperclip,
  faPenToSquare,
  faPlus,
  faTrash,
  faWallet
} from '@fortawesome/pro-solid-svg-icons';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  { path: 'index', component: V3BulkPaymentComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    NewPhoneInputComponent,
    AngularMaterialModule,
    NgSelectModule,
    PipesModule,
    V35ControlMessageComponent,
    V3BulkPaymentComponent,
    CheckMailBulkOcwV3Component,
    CheckMailType2BulkOcwV3Component,
    CheckEmailBulkOcwV3Component,
    AchBulkOcwV3Component,
    WireBulkOcwV3Component,
    CheckModeSelectBulkV3Component,
    VirtualCardBulkOcwV3Component,
    CheckPrintBulkV3Component,
    WalletCheckPrintBulkV3Component,
    WalletCheckEmailBulkV3Component,
    V3PaymentSummaryModalComponent,
    CheckDdBulkOcwV3Component
  ]
})
export class V3BulkPaymentModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPlus,
      faWallet,
      faBuildingColumns,
      faCreditCard,
      faPaperclip,
      faCircleExclamation,
      faCircle,
      faCreditCardFront,
      faMessagePlus,
      faPaperclip,
      faPenToSquare,
      faTrash,
      faCircleCheck,
      faArrowLeft
    );
  }
}
