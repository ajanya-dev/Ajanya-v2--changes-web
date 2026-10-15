import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import {
  CommonModule,
  DecimalPipe,
  DatePipe,
  NgOptimizedImage
} from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from 'src/app/shared/shared.module';
import { PayeeModalModule } from 'src/app/shared/modal/payee-modal/payee-modal.module';
import { CommentsModalModule } from 'src/app/shared/modal/comments-modal/comments-modal.module';
import { AttachmentModalModule } from 'src/app/shared/modal/attachment-modal/attachment-modal.module';
import { CategoryModalModule } from 'src/app/shared/modal/category-modal/category-modal.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { NgSelectModule } from '@ng-select/ng-select';
import { DeviceModalModule } from 'src/app/shared/modal/device-modal/device-modal.module';
import { ThirdpartyImportsModule } from 'src/app/shared/modal/thirdparty-imports/thirdparty-imports.module';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { TextEditorComponent } from 'src/app/shared/components/text-editor/text-editor.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { DropDownCategoryComponent } from 'src/app/shared/components/drop-downs/drop-down-category/drop-down-category.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { DropDownPayeeBankComponent } from 'src/app/shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { DropDownWalletComponent } from 'src/app/shared/components/drop-downs/drop-down-wallet/drop-down-wallet.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownPayeeComponent } from 'src/app/shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import {
  faAngleRight,
  faArrowDownToLine,
  faArrowLeft,
  faArrowRight,
  faArrowUpToLine,
  faBan,
  faCalculator,
  faCalendar,
  faCalendarAlt,
  faCircle,
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faClock,
  faCopy,
  faDownload,
  faEdit,
  faEllipsisV,
  faEnvelope,
  faExclamationTriangle,
  faExternalLink,
  faGlobe,
  faInfo,
  faLevelUp,
  faMessageExclamation,
  faMinus,
  faPaperPlaneTop,
  faPaperclip,
  faPen,
  faPencil,
  faPlus,
  faPrint,
  faQuestionCircle,
  faRightLeft,
  faSave,
  faSync,
  faTimes,
  faTrash,
  faTrashAlt,
  faTriangleExclamation,
  faUniversity,
  faUpToLine,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { DropZoneComponent } from 'src/app/shared/components/drop-zone/drop-zone.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { faCirclePlus, faPenField } from '@fortawesome/pro-regular-svg-icons';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { UpdatePayeeModalComponent } from './modal/mail-modals/update-payee-modal/update-payee-modal.component';
import { UpdateAllPayeeFromAddressComponent } from './modal/mail-modals/update-all-payee-from-address/update-all-payee-from-address.component';
import { AddMailAddressModalComponent } from './modal/mail-modals/add-mail-address-modal/add-mail-address-modal.component';
import { DirectDepositComponent } from './modal/direct-deposit/direct-deposit.component';
import { OpenAttachmentModalComponent } from './modal/open-attachment-modal/open-attachment-modal.component';
import { CheckAddAttachmentModalComponent } from './modal/check-add-attachment-modal/check-add-attachment-modal.component';
import { VerifySignatureModalComponent } from './modal/mail-modals/verify-signature-modal/verify-signature-modal.component';
import { GroupNameModalComponent } from './modal/group-name-modal/group-name-modal.component';
import { CheckActivityModalComponent } from './modal/check-activity-modals/check-activity-modal/check-activity-modal.component';
import { CheckAddAttachmentCommonModalComponent } from './modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { CheckAddCommentModalComponent } from './modal/check-activity-modals/check-add-comment-modal/check-add-comment-modal.component';
import { V4CheckAddCommentModalComponent } from './modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { V4CheckAddAttachmentCommonModalComponent } from './modal/check-activity-modals/v4-check-add-attachment-common-modal/v4-check-add-attachment-common-modal.component';
import { CheckEmailModalComponent } from './modal/check-email-modal/check-email-modal.component';
import { LastTransactionModalComponent } from './modal/mail-modals/last-transaction-modal/last-transaction-modal.component';
import { CheckProcessModalComponent } from './modal/process-modal/check-process-modal/check-process-modal.component';
import { CheckProcessLoadingModalComponent } from './modal/process-modal/check-process-loading-modal/check-process-loading-modal.component';
import { UpdateBankModalComponent } from './modal/mail-modals/update-bank-modal/update-bank-modal.component';
import { EmailPhoneVerifyModalComponent } from './modal/mail-modals/email-phone-verify-modal/email-phone-verify-modal.component';
import { EstimatedChargeModalComponent } from './modal/mail-modals/estimated-charge-modal/estimated-charge-modal.component';
import { CheckProcessPrintComponent } from './modal/process-modal/check-process-print/check-process-print.component';
import { CheckPrintAdModalComponent } from './modal/check-print-ad-modal/check-print-ad-modal.component';
import { DataTableModule } from '../data-table/data-table.module';
import { WalletAchModalComponent } from './modal/wallet-ach-modal/wallet-ach-modal.component';
import { CheckListComponent } from './pages/check-list/check-list.component';
import { NewCheckComponent } from './pages/new-check/new-check.component';
import { CheckViewComponent } from './pages/check-view/check-view.component';
import { MultiImportStep1Component } from './pages/multi-import-step1/multi-import-step1.component';
import { MultiImportStep2Component } from './pages/multi-import-step2/multi-import-step2.component';
import { MultiImportStep3Component } from './pages/multi-import-step3/multi-import-step3.component';
import { MultiCheckComponent } from './pages/multi-check/multi-check.component';
import { GroupsComponent } from './pages/groups/groups.component';
import { BlankCheckModalComponent } from './components/create-blank-check-modal/blank-check-modal.component';
import { CheckActivityLogComponent } from './components/check-activity-log/check-activity-log.component';
import { CheckAttachmentComponent } from './components/check-attachment/check-attachment.component';
import { CheckCommentsComponent } from './components/check-comments/check-comments.component';
import { CheckLastTransactionComponent } from './components/check-last-transaction/check-last-transaction.component';
import { CheckAddAttachmentCommentComponent } from './pages/check-list/addAttachmentComment';
import { GetRestrictedDataComponent } from './pages/get-restricted-data/get-restricted-data.component';
import { CheckMailDetailsComponent } from './components/check-mail-details/check-mail-details.component';
import { CustomCheckExportErrorAlertComponent } from './components/custom-check-export-error-alert/custom-check-export-error-alert.component';
import { MailTrackingModalComponent } from './components/mail-tracking-modal/mail-tracking-modal.component';
import { CustomCheckReportComponent } from './pages/custom-check-report/custom-check-report.component';
import { ExportCheckQbdesktopComponent } from './components/export-check-qbdesktop/export-check-qbdesktop.component';
import { TxtfileToChecksImportComponent } from './pages/txtfile-to-checks-import/txtfile-to-checks-import.component';
import { TxtfileToChecksImportLaststepComponent } from './pages/txtfile-to-checks-import-laststep/txtfile-to-checks-import-laststep.component';
import { MulitImportEqStep1Component } from './pages/mulit-import-eq-step1/mulit-import-eq-step1.component';
import { MulitImportEqStep2Component } from './pages/mulit-import-eq-step2/mulit-import-eq-step2.component';
import { MulitImportEqStep3Component } from './pages/mulit-import-eq-step3/mulit-import-eq-step3.component';
import { CheckRemittanceComponent } from './components/check-remittance/check-remittance.component';
import { EntImportChecksComponent } from './pages/ent-import-checks/ent-import-checks.component';
import { EntImportChecksStep2Component } from './pages/ent-import-checks-step2/ent-import-checks-step2.component';
import { EntImportChecksStep3Component } from './pages/ent-import-checks-step3/ent-import-checks-step3.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { EmailMessageModalComponent } from './modal/email-message-modal/email-message-modal.component';
import { CheckMailModalComponent } from './modal/mail-modals/check-mail-modal/check-mail-modal.component';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    DataTableModule,
    AngularMaterialModule,
    NgxMaskDirective,
    NgxMaskPipe,
    PayeeModalModule,
    CommentsModalModule,
    AttachmentModalModule,
    CategoryModalModule,
    SharedModule,
    DropDownPayeeComponent,
    DropDownBankComponent,
    DropDownWalletComponent,
    DropDownPayeeBankComponent,
    DropDownCategoryComponent,
    OcwBackButtonComponent,
    DemoVideoComponent,
    NewPhoneInputComponent,
    TextEditorComponent,
    NgSelectModule,
    DeviceModalModule,
    ThirdpartyImportsModule,
    V35ControlMessageComponent,
    FontAwesomeModule,
    DropZoneComponent,
    MatTooltipModule,
    PipesModule,
    CommonButtonV35Component,
    V3DataTableModule,
    BankAcDropdownV3Component,
    CommonUploadButtonV35Component,
    CommonBackButtonV35Component,
    NgOptimizedImage,
    EntImportChecksStep3Component,
    EntImportChecksStep2Component,
    EntImportChecksComponent,
    CheckListComponent,
    NewCheckComponent,
    CheckViewComponent,
    MultiImportStep1Component,
    MultiImportStep2Component,
    MultiImportStep3Component,
    MultiCheckComponent,
    GroupsComponent,
    CheckEmailModalComponent,
    LastTransactionModalComponent,
    EmailMessageModalComponent,
    CheckMailModalComponent,
    UpdatePayeeModalComponent,
    UpdateAllPayeeFromAddressComponent,
    AddMailAddressModalComponent,
    VerifySignatureModalComponent,
    BlankCheckModalComponent,
    DirectDepositComponent,
    CheckActivityLogComponent,
    CheckAttachmentComponent,
    CheckCommentsComponent,
    CheckLastTransactionComponent,
    OpenAttachmentModalComponent,
    CheckAddAttachmentModalComponent,
    GroupNameModalComponent,
    CheckAddAttachmentCommentComponent,
    CheckActivityModalComponent,
    CheckAddAttachmentCommonModalComponent,
    CheckAddCommentModalComponent,
    V4CheckAddCommentModalComponent,
    V4CheckAddAttachmentCommonModalComponent,
    CheckProcessModalComponent,
    CheckProcessLoadingModalComponent,
    GetRestrictedDataComponent,
    UpdateBankModalComponent,
    EmailPhoneVerifyModalComponent,
    EstimatedChargeModalComponent,
    CheckProcessPrintComponent,
    CheckPrintAdModalComponent,
    CheckMailDetailsComponent,
    CustomCheckExportErrorAlertComponent,
    MailTrackingModalComponent,
    CustomCheckReportComponent,
    WalletAchModalComponent,
    ExportCheckQbdesktopComponent,
    TxtfileToChecksImportComponent,
    TxtfileToChecksImportLaststepComponent,
    MulitImportEqStep1Component,
    MulitImportEqStep2Component,
    MulitImportEqStep3Component,
    CheckRemittanceComponent
  ],
  exports: [CheckListComponent],
  providers: [DatePipe, DecimalPipe, CheckdesignCanvasService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedCheckModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faXmark,
      faPlus,
      faTrash,
      faGlobe,
      faUpToLine,
      faArrowDownToLine,
      faArrowUpToLine,
      faQuestionCircle,
      faCalculator,
      faTriangleExclamation,
      faPaperPlaneTop,
      faCircleInfo,
      faCircleExclamation,
      faSave,
      faCalendar,
      faExclamationTriangle,
      faCalendarAlt,
      faSync,
      faPencil,
      faPenField,
      faEdit,
      faInfo,
      faEllipsisV,
      faUpToLine,
      faTrashAlt,
      faAngleRight,
      faDownload,
      faPrint,
      faUniversity,
      faRightLeft,
      faMinus,
      faLevelUp,
      faCircleCheck,
      faCircle,
      faPen,
      faExternalLink,
      faEnvelope,
      faTimes,
      faAngleRight,
      faDownload,
      faCircleInfo,
      faPaperclip,
      faMessageExclamation,
      faCopy,
      faArrowLeft,
      faArrowRight,
      faClock,
      faBan,
      faCirclePlus
    );
  }
}
