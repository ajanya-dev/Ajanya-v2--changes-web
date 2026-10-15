import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DateRangeComponent } from 'src/app/shared/components/date-range/date-range.component';
import { DropDownCategoryComponent } from 'src/app/shared/components/drop-downs/drop-down-category/drop-down-category.component';
import { DropDownPayeeMultiSelectComponent } from 'src/app/shared/components/drop-downs/drop-down-payee-multi-select/drop-down-payee-multi-select.component';
import { WalletDropdownMultiSelectComponent } from 'src/app/shared/components/v3/drop-downs/wallet-dropdown-multi-select/wallet-dropdown-multi-select.component';
import { CardDropdownMultiSelectComponent } from 'src/app/shared/components/v3/drop-downs/card-dropdown-multi-select/card-dropdown-multi-select.component';
import { DropDownBankMultiSelectComponent } from 'src/app/shared/components/drop-downs/drop-down-bank-multi-select/drop-down-bank-multi-select.component';
import { DropDownCategoryMultiSelectComponent } from 'src/app/shared/components/drop-downs/drop-down-category-multi-select/drop-down-category-multi-select.component';
import { DropDownBusinessComponent } from 'src/app/shared/components/drop-downs/drop-down-business/drop-down-business.component';
import { DropDownPayeeComponent } from 'src/app/shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import {
  faAngleLeft,
  faAngleRight,
  faArrowLeft,
  faCheck,
  faCircle,
  faCircleInfo,
  faCopy,
  faDownload,
  faFile,
  faFileChartColumn,
  faFloppyDisk,
  faMagnifyingGlass,
  faPaperPlaneTop,
  faPenToSquare,
  faPlus,
  faTimes,
  faTrash,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import {
  faArrowLeft as farArrowLeft,
  faCopy as farCopy,
  faPenToSquare as farPenToSquare,
  faFloppyDisk as farFloppyDisk
} from '@fortawesome/pro-regular-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DateRangeSelectorV35Component } from 'src/app/shared/components/date-range-selector-v35/date-range-selector-v35.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { AffiliateReportComponent } from './pages/affiliate-report/affiliate-report.component';
import { NotificationViewAllComponent } from './pages/notification-view-all/notification-view-all.component';
import { RadeemComponent } from './pages/radeem/radeem.component';
import { ReferalListComponent } from './pages/referal-list/referal-list.component';
import { ReferalActivityComponent } from './pages/referal-activity/referal-activity.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { DataTableModule } from '../data-table/data-table.module';
import { AllReportsComponent } from './pages/all-reports/all-reports.component';
import { PayeeReportModalComponent } from './modals/payee-report-modal/payee-report-modal.component';
import { FormNecReportModalComponent } from './modals/form-nec-report-modal/form-nec-report-modal.component';
import { NecPayeeDetailsModalComponent } from './modals/nec-payee-details-modal/nec-payee-details-modal.component';
import { CommonReportModalComponent } from './modals/common-report-modal/common-report-modal.component';
import { CustomJobsReportComponent } from './pages/custom-jobs-report/custom-jobs-report.component';
import { AffiliateJoinComponent } from './components/affilate-join/affiliate-join.component';
import { RequestToPayoutModalComponent } from './modals/request-to-payout-modal/request-to-payout-modal.component';
import { AffiliatePapWelcomeComponent } from './components/affiliate-pap-welcome/affiliate-pap-welcome.component';
import { AffiliatePapSetCouponComponent } from './components/affiliate-pap-set-coupon/affiliate-pap-set-coupon.component';
import { AffiliatePapDashboardComponent } from './components/affiliate-pap-dashboard/affiliate-pap-dashboard.component';
import { AffiliatePapComponent } from './pages/affiliate-pap/affiliate-pap.component';
import { AffiliatePapMyLinkComponent } from './components/affiliate-pap-my-link/affiliate-pap-my-link.component';
import { AffiliatePapInsightComponent } from './components/affiliate-pap-insight/affiliate-pap-insight.component';
import { AffiliatePapDashboardTableComponent } from './components/affiliate-pap-dashboard-table/affiliate-pap-dashboard-table.component';

import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';
import { VoidCheckDataTableComponent } from './pages/void-check-data-table/void-check-data-table.component';
import { DeleteCheckDataTableComponent } from './pages/delete-check-data-table/delete-check-data-table.component';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: AffiliatePapComponent,
    data: { title: 'Affiliate Dashboard' }
  },
  {
    path: 'withdraw',
    component: RadeemComponent
  },
  {
    path: 'summary',
    component: ReferalListComponent
  },
  {
    path: 'earningdetails',
    component: ReferalActivityComponent
  },
  {
    path: 'notification/show',
    component: NotificationViewAllComponent
  },
  {
    path: 'report',
    component: AllReportsComponent,
    data: { title: 'Reports' }
  },
  {
    path: 'custom-jobs-report',
    component: CustomJobsReportComponent
  },
  {
    path: 'affiliate',
    component: AffiliateReportComponent
  },
  {
    path: 'report/void',
    component: VoidCheckDataTableComponent
  },
  {
    path: 'report/delete',
    component: DeleteCheckDataTableComponent
  }
];
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatMenuModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    DropDownPayeeComponent,
    DropDownBusinessComponent,
    DropDownCategoryMultiSelectComponent,
    DropDownBankMultiSelectComponent,
    DropDownPayeeMultiSelectComponent,
    DropDownCategoryComponent,
    NgxMaskDirective,
    NgxMaskPipe,
    AngularMaterialModule,
    DataTableModule,
    PipesModule,
    MatSnackBarModule,
    DateRangeComponent,
    CardDropdownMultiSelectComponent,
    WalletDropdownMultiSelectComponent,
    FontAwesomeModule,
    DateRangeSelectorV35Component,
    CommonButtonV35Component,
    V3DataTableModule,
    CommonBackButtonV35Component,
    NgOptimizedImage,
    AffiliateReportComponent,
    NotificationViewAllComponent,
    RadeemComponent,
    ReferalListComponent,
    ReferalActivityComponent,
    AllReportsComponent,
    PayeeReportModalComponent,
    FormNecReportModalComponent,
    NecPayeeDetailsModalComponent,
    CommonReportModalComponent,
    CustomJobsReportComponent,
    AffiliateJoinComponent,
    RequestToPayoutModalComponent,
    AffiliatePapComponent,
    AffiliatePapWelcomeComponent,
    AffiliatePapSetCouponComponent,
    AffiliatePapDashboardComponent,
    AffiliatePapMyLinkComponent,
    AffiliatePapInsightComponent,
    AffiliatePapDashboardTableComponent
  ]
})
export class MoreModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faCircleInfo,
      faPlus,
      faCircle,
      faMagnifyingGlass,
      faFile,
      faFileChartColumn,
      faTimes,
      faArrowLeft,
      faCircleInfo,
      faCopy,
      faTrash,
      faPenToSquare,
      faFloppyDisk,
      faCheck,
      faXmark,
      faAngleLeft,
      faAngleRight,
      farArrowLeft,
      farCopy,
      farPenToSquare,
      farFloppyDisk,
      faPaperPlaneTop,
      faDownload
    );
  }
}
