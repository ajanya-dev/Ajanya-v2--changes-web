import { PipesModule } from 'src/app/pipes/pipes.module';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { DropDownVerifiedBusinessComponent } from 'src/app/shared/components/drop-downs/drop-down-verified-business/drop-down-verified-business.component';
import {
  faArrowDown,
  faArrowRight,
  faCircle,
  faCirclePlus,
  faCircleQuestion,
  faCircleXmark,
  faMagnifyingGlass,
  faPeriod,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { SharedModule } from '../../../shared/shared.module';
import { PlexeIntroComponent } from './pages/plexe-intro/plexe-intro.component';
import { PlexeApplyComponent } from './pages/plexe-apply/plexe-apply.component';
import { PlexeSuccessComponent } from './pages/plexe-success/plexe-success.component';
import { PlexeHomeComponent } from './pages/plexe-home/plexe-home.component';
import { LoanApplicationSetupComponent } from './pages/loan-application-setup/loan-application-setup.component';
import { PlexeDocumentFormComponent } from './components/plexe-document-form/plexe-document-form.component';
import { PlexePrimaryBankaccountComponent } from './components/plexe-primary-bankaccount/plexe-primary-bankaccount.component';
import { PlexeAgreementComponent } from './components/plexe-agreement/plexe-agreement.component';
import { PlexeAddDocumentComponent } from './components/plexe-add-document/plexe-add-document.component';
import { PlexeDashboardComponent } from './pages/plexe-dashboard/plexe-dashboard.component';
import { PlexeTransactionsComponent } from './components/plexe-transactions/plexe-transactions.component';
import { PlexeWithdrawModalComponent } from './modals/plexe-withdraw-modal/plexe-withdraw-modal.component';
import { PlexeWithdrawelsComponent } from './components/plexe-withdrawels/plexe-withdrawels.component';
import { DataTableModule } from '../../data-table/data-table.module';
import { CustomToolTipCellRendererComponent } from './components/plexe-data-table';
import { PlexeRejectComponent } from './pages/plexe-reject/plexe-reject.component';
import { PlexeInformationModalComponent } from './modals/plexe-information-modal/plexe-information-modal.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
    data: { title: 'Line of Credit' }
  },
  {
    path: 'intro',
    component: PlexeIntroComponent,
    data: { title: 'Line of Credit' }
  },
  {
    path: 'apply',
    component: PlexeApplyComponent,
    data: { title: 'Line of Credit' }
  },
  {
    path: 'success',
    component: PlexeSuccessComponent,
    data: { title: 'Line of Credit' }
  },
  {
    path: 'home',
    component: PlexeHomeComponent,
    data: { title: 'Line of Credit' }
  },
  {
    path: 'application-Setup',
    component: LoanApplicationSetupComponent,
    data: { title: 'Line of Credit' }
  },
  {
    path: 'dashboard',
    component: PlexeDashboardComponent,
    data: { title: 'Line of Credit' }
  },
  {
    path: 'reject',
    component: PlexeRejectComponent,
    data: { title: 'Line of Credit' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    DropDownVerifiedBusinessComponent,
    CustomerSupportComponent,
    FormsModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    PipesModule,
    NgxMaskDirective,
    NgxMaskPipe,
    DataTableModule,
    FontAwesomeModule,
    CommonButtonV35Component,
    NgOptimizedImage,
    PlexeIntroComponent,
    PlexeApplyComponent,
    PlexeSuccessComponent,
    PlexeHomeComponent,
    LoanApplicationSetupComponent,
    PlexeDocumentFormComponent,
    PlexePrimaryBankaccountComponent,
    PlexeAgreementComponent,
    PlexeAddDocumentComponent,
    PlexeDashboardComponent,
    PlexeTransactionsComponent,
    PlexeWithdrawModalComponent,
    PlexeWithdrawelsComponent,
    CustomToolTipCellRendererComponent,
    PlexeRejectComponent,
    PlexeInformationModalComponent
  ]
})
export class PlexeModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faCircle,
      faXmark,
      faCirclePlus,
      faMagnifyingGlass,
      faCircleXmark,
      faPeriod,
      faCircleQuestion,
      faArrowDown,
      faArrowRight
    );
  }
}
