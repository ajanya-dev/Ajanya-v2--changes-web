import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { MemoInputComponent } from 'src/app/shared/components/memo-input/memo-input.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { DropDownCategoryComponent } from 'src/app/shared/components/drop-downs/drop-down-category/drop-down-category.component';
import { DropDownPayeeBankComponent } from 'src/app/shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { DropDownWalletComponent } from 'src/app/shared/components/drop-downs/drop-down-wallet/drop-down-wallet.component';
import { DropDownCardComponent } from 'src/app/shared/components/drop-downs/drop-down-card/drop-down-card.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownPayeeComponent } from 'src/app/shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import { V3ActionButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-action-button/v3-action-button.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3NoRowsToShowOverlayComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-no-rows-to-show-overlay/v3-no-rows-to-show-overlay.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V3PaymentSourceTypeComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payment-source-type/v3-payment-source-type.component';
import { V3PaymentTypeComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payment-type/v3-payment-type.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { WalletDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { PayeeDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { CloudAccountDropdownV35Component } from 'src/app/shared/components/v3/drop-downs/cloud-account-dropdown-v35/cloud-account-dropdown-v35.component';
import { CardsDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/cards-dropdown-v3/cards-dropdown-v3.component';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { CategoryDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faArrowRightLong,
  faArrowsLeftRight,
  faCaretDown,
  faCircle,
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faCirclePlus,
  faCommentPlus,
  faEye,
  faMessage,
  faMobile,
  faMoneyCheckDollar,
  faPaperclip,
  faPlus,
  faPrint,
  faSquareList,
  faTimesCircle,
  faTrash,
  faTriangleExclamation,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { DropDownInternationalBankComponent } from 'src/app/shared/components/drop-downs/drop-down-international-bank/drop-down-international-bank.component';
import { CloudIntraV3Component } from './components/Cloud/cloud-intra-v3/cloud-intra-v3.component';
import { QrCodeScannerModalComponent } from './components/modals/qr-code-scanner-modal/qr-code-scanner-modal.component';
import { VerifyCardModalComponent } from './components/modals/verify-card-modal/verify-card-modal.component';
import { RaiseMyLimitModalComponent } from './components/modals/raise-my-limit-modal/raise-my-limit-modal.component';
import { V3PaymentsTableSharedModule } from '../../v3-payments-table/shared/v3-payments-table-shared.module';
import { WalletCheckV3Component } from './components/Check-Mail/wallet-check-v3/wallet-check-v3.component';
import { CardCheckV3Component } from './components/Check-Mail/card-check-v3/card-check-v3.component';
import { CardsVirtualCardV3Component } from './components/virtual-card/cards-virtual-card-v3/cards-virtual-card-v3.component';
import { ReceiveSmsBankV3Component } from './components/receive-payments/receive-sms-bank-v3/receive-sms-bank-v3.component';
import { QuickbooksExportCheckComponent } from './components/others/quickbooks-export-check/quickbooks-export-check.component';
import { BankAcCheckComponent } from './components/check/bank-ac-check/bank-ac-check.component';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { CardsAchV3Component } from './components/ACH/cards-ach-v3/cards-ach-v3.component';
import { EditRecurringModaleV3Component } from './components/receive-payments/edit-recurring-modale-v3/edit-recurring-modale-v3.component';
import { RecieveEmailBankV3Component } from './components/receive-payments/recieve-email-bank-v3/recieve-email-bank-v3.component';
import { CardWireV3Component } from './components/wire/card-wire-v3/card-wire-v3.component';
import { BankAccWireV3Component } from './components/wire/bank-acc-wire-v3/bank-acc-wire-v3.component';
import { WalletWireV3Component } from './components/wire/wallet-wire-v3/wallet-wire-v3.component';
import { WalletVirtualCardV3Component } from './components/virtual-card/wallet-virtual-card-v3/wallet-virtual-card-v3.component';
import { BankAcVirtualCardV3Component } from './components/virtual-card/bank-ac-virtual-card-v3/bank-ac-virtual-card-v3.component';
import { PaymentsMainV35Component } from './components/payments-main-v35/payments-main-v35.component';
import { CloudWireV3Component } from './components/Cloud/cloud-wire-v3/cloud-wire-v3.component';
import { OnBehalfOfV3Component } from './components/on-behalf-of-v3/on-behalf-of-v3.component';
import { CommonComponentsModule } from '../../common-components/common-components.module';
import { DefaultPaymentV3Component } from './components/modals/default-payment-v3/default-payment-v3.component';
import { BankAcAchV3Component } from './components/ACH/bank-ac-ach-v3/bank-ac-ach-v3.component';
import { AddRemitanceV3Component } from './components/modals/add-remitance-v3/add-remitance-v3.component';
import { WalletAchV3Component } from './components/ACH/wallet-ach-v3/wallet-ach-v3.component';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { RecievePayerBankV3Component } from './components/receive-payments/recieve-payer-bank-v3/recieve-payer-bank-v3.component';
import { CloudAchV3Component } from './components/ACH/cloud-ach-v3/cloud-ach-v3.component';
import { WalletCheckPrintV3Component } from './components/Check-Mail/wallet-check-print-v3/wallet-check-print-v3.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    WalletDropdownV3Component,
    PayeeDropdownV3Component,
    CardsDropdownV3Component,
    BankAcDropdownV3Component,
    CategoryDropdownV3Component,
    FormsModule,
    AngularMaterialModule,
    NgxMaskDirective,
    NgxMaskPipe,
    SharedModule,
    DropDownPayeeComponent,
    AmountInputComponent,
    DropDownBankComponent,
    DropDownCardComponent,
    DropDownWalletComponent,
    DropDownPayeeBankComponent,
    DropDownCategoryComponent,
    DemoVideoComponent,
    MemoInputComponent,
    NewPhoneInputComponent,
    NgSelectModule,
    CommonComponentsModule,
    PipesModule,
    V3PaymentsTableSharedModule,
    V3ActionButtonComponent,
    V3NoRowsToShowOverlayComponent,
    V3DataTableSelectBoxComponent,
    V3ViewButtonComponent,
    V3UpdatedAtComponent,
    V3StatusComponent,
    V3PaymentTypeComponent,
    V3PaymentSourceTypeComponent,
    V3PayeeNameComponent,
    CloudAccountDropdownV35Component,
    CommonButtonV35Component,
    V35ControlMessageComponent,
    CommonBackButtonV35Component,
    FontAwesomeModule,
    DropDownInternationalBankComponent,
    NgOptimizedImage,
    PaymentsMainV35Component,
    WalletAchV3Component,
    BankAcAchV3Component,
    DefaultPaymentV3Component,
    CloudAchV3Component,
    OnBehalfOfV3Component,
    CloudWireV3Component,
    CardsAchV3Component,
    PaymentSuccessComponent,
    BankAcCheckComponent,
    BankAcVirtualCardV3Component,
    WalletVirtualCardV3Component,
    WalletWireV3Component,
    BankAccWireV3Component,
    CardCheckV3Component,
    WalletCheckV3Component,
    RecieveEmailBankV3Component,
    EditRecurringModaleV3Component,
    CardsAchV3Component,
    CardWireV3Component,
    BankAcCheckComponent,
    ReceiveSmsBankV3Component,
    QuickbooksExportCheckComponent,
    RecievePayerBankV3Component,
    CardsVirtualCardV3Component,
    AddRemitanceV3Component,
    RaiseMyLimitModalComponent,
    VerifyCardModalComponent,
    QrCodeScannerModalComponent,
    CloudIntraV3Component,
    WalletCheckPrintV3Component
  ],
  exports: [PaymentsMainV35Component]
})
export class PaymentSharedModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faXmark,
      faPlus,
      faEye,
      faCircleInfo,
      faTrash,
      faCommentPlus,
      faPaperclip,
      faMoneyCheckDollar,
      faTriangleExclamation,
      faCaretDown,
      faPrint,
      faCircle,
      faCircleCheck,
      faCircleExclamation,
      faCommentPlus,
      faSquareList,
      faArrowRightLong,
      faArrowLeft,
      faMessage,
      faMobile,
      faTimesCircle,
      faArrowsLeftRight,
      faCirclePlus
    );
  }
}
