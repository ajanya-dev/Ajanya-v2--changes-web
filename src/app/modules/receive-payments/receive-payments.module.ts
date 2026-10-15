import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { ProcessModalModule } from 'src/app/shared/modal/process-modal/process-modal.module';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { DropDownBankProComponent } from 'src/app/shared/components/drop-downs/drop-down-bank-pro/drop-down-bank-pro.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownPayeeComponent } from 'src/app/shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import { BankModalModule } from 'src/app/shared/bank-modal/bank-modal.module';
import {
  faA,
  faArrowRightLong,
  faCalendar,
  faCaretDown,
  faCheck,
  faCircle,
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faCog,
  faCommentPlus,
  faEnvelope,
  faExternalLink,
  faEye,
  faMoneyCheckDollar,
  faPaperPlane,
  faPaperclip,
  faPlus,
  faPrint,
  faQuestionCircle,
  faR,
  faRetweet,
  faSquareList,
  faSyncAlt,
  faTimes,
  faTrash,
  faTriangleExclamation,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { faMessageDots } from '@fortawesome/pro-regular-svg-icons';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { ReceivedChecksComponent } from './pages/received-checks/received-checks.component';
import { RequestPaymentComponent } from './pages/request-payment/request-payment.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { ManualAchComponent } from './components/manual-ach/manual-ach.component';
import { AddPayeeBankAccountComponent } from '../../shared/modal/process-modal/add-payee-bank-account/add-payee-bank-account.component';
import { ScheduleModalComponent } from '../../shared/modal/process-modal/schedule-modal/schedule-modal.component';
import { RecurringModalComponent } from '../../shared/modal/process-modal/recurring-modal/recurring-modal.component';
import { EPaymentsComponent } from './pages/e-payments/e-payments.component';
import { RecurringPaymentsComponent } from './components/recurring-payments/recurring-payments.component';
import { RecurringComponent } from './components/recurring/recurring.component';
import { GpbfRecurringComponent } from './components/gpbf-recurring/gpbf-recurring.component';
import { AchRecurringComponent } from './components/ach-recurring/ach-recurring.component';
import { RecievedChecksShowComponent } from './pages/recieved-checks-show/recieved-checks-show.component';
import { RecurringViewComponent } from './pages/recurring-view/recurring-view.component';
import { AcceptRequestComponent } from './modals/accept-request/accept-request.component';
import { RecievedChecksAddAttachmentCommentComponent } from './pages/received-checks/addAttachmentComment';
import { AchRecurringViewComponent } from './pages/ach-recurring-view/ach-recurring-view.component';
import { GpbrSelectBoxComponent } from './components/gpbr-select-box/gpbr-select-box.component';
import { RCSelectBoxComponent } from './components/recieved-check-select-box/rc-select-box.component';
import { GpbrStatusBoxComponent } from './components/gpbr-status-box/gpbr-status-box.component';
import { PaymentPreviewModalComponent } from './modals/payment-preview-modal/payment-preview-modal.component';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';
import { EditableCellRendererComponent } from './pages/received-checks/editableCellRendererComponent';
import { DataTableModule } from '../data-table/data-table.module';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: ReceivedChecksComponent,
    data: { title: 'Receive Payments' }
  },
  {
    path: 'requestcheck',
    component: RequestPaymentComponent,
    data: { title: 'Receive Payments' }
  },
  {
    path: 'received-payments',
    component: EPaymentsComponent,
    data: { title: 'Receive Payments' }
  },
  {
    path: 'received-payments/recurring',
    component: RecurringPaymentsComponent,
    data: { title: 'Received Payment Recurring ' }
  },
  {
    path: 'recurring/index',
    component: RecurringComponent,
    data: { title: 'Recurring ' }
  },

  // SHOW COMPONENTS

  {
    path: 'show/:id',
    component: RecievedChecksShowComponent,
    data: { title: 'Receive Payments' }
  },

  {
    path: 'recurring/request_index_view',
    component: RecurringViewComponent,
    data: { title: 'Receive Payments' }
  },

  {
    path: 'recurring/show',
    component: AchRecurringViewComponent,
    data: { title: 'Receive Payments' }
  },
  {
    path: 'recurring',
    component: RecurringComponent,
    data: { title: 'Receive Payments' }
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
    DropDownPayeeComponent,
    DropDownBankComponent,
    DropDownBankProComponent,
    OcwBackButtonComponent,
    DemoVideoComponent,
    DataTableModule,
    BankModalModule,
    NgxMaskDirective,
    NgxMaskPipe,
    ProcessModalModule,
    V3DataTableModule,
    FontAwesomeModule,
    EditableCellRendererComponent,
    CommonBackButtonV35Component,
    V3DataTableModule,
    ReceivedChecksComponent,
    RequestPaymentComponent,
    ManualAchComponent,
    AddPayeeBankAccountComponent,
    ScheduleModalComponent,
    RecurringModalComponent,
    EPaymentsComponent,
    RecurringPaymentsComponent,
    RecurringComponent,
    GpbfRecurringComponent,
    AchRecurringComponent,
    RecievedChecksShowComponent,
    RecurringViewComponent,
    AcceptRequestComponent,
    RecievedChecksAddAttachmentCommentComponent,
    AchRecurringViewComponent,
    GpbrSelectBoxComponent,
    RCSelectBoxComponent,
    GpbrStatusBoxComponent,
    PaymentPreviewModalComponent
  ],
  providers: [DecimalPipe]
})
export class ReceivePaymentsModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faQuestionCircle,
      faPlus,
      faCog,
      faEnvelope,
      faExternalLink,
      faPaperPlane,
      faSyncAlt,
      faCalendar,
      faTimes,
      faCheck,
      faTrash,
      faXmark,
      faEye,
      faCircleInfo,
      faCommentPlus,
      faPaperclip,
      faMoneyCheckDollar,
      faTriangleExclamation,
      faCaretDown,
      faPrint,
      faCircle,
      faCircleCheck,
      faCircleExclamation,
      faSquareList,
      faArrowRightLong,
      faR,
      faA,
      faMessageDots,
      faRetweet
    );
  }
}
