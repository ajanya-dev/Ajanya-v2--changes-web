import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { DropDownComponent } from 'src/app/shared/components/drop-downs/drop-down/drop-down.component';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faCircleInfo,
  faGear,
  faPaperPlaneTop,
  faUser,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { BusinessToolsPanelComponent } from './pages/business-tools-panel/business-tools-panel.component';
import { DocumentVaultComponent } from './document-vault/document-vault.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';

const routes: Routes = [
  {
    path: '',
    component: BusinessToolsPanelComponent,
    pathMatch: 'full',
    data: { title: 'Business Tools' }
  },
  {
    path: 'more',
    loadComponent: () =>
      import(
        '../v4-business-tools/pages/v4-business-tools-more/v4-business-tools-more.component'
      ).then((m) => m.V4BusinessToolsMoreComponent),
    data: { title: 'Business Tools More' }
  },
  {
    path: 'article-writer',
    loadChildren: () =>
      import('./article-writer/article-writer.module').then(
        (m) => m.ArticleWriterModule
      ),
    data: { title: 'Business Tools' }
  },
  {
    path: 'sms-panel',
    loadChildren: () =>
      import('./sms-panel/sms-panel.module').then((m) => m.SmsPanelModule),
    data: { title: 'Business Tools' }
  },
  {
    path: 'shipping-label',
    loadChildren: () =>
      import('./shipping-label/shipping-label.module').then(
        (m) => m.ShippingLabelModule
      ),
    data: { title: 'Business Tools' }
  },
  {
    path: 'knowledge-base',
    loadChildren: () =>
      import('./knowledge-base/knowledge-base.module').then(
        (m) => m.KnowledgeBaseModule
      ),
    data: { title: 'Business Tools' }
  },
  {
    path: 'document-mail',
    loadChildren: () =>
      import('./document-mail/document-mail.module').then(
        (m) => m.DocumentMailModule
      ),
    data: { title: 'Business Tools' }
  },
  {
    path: 'process-card',
    loadChildren: () =>
      import('../process-card/process-card.module').then(
        (m) => m.ProcessCardModule
      ),
    data: { title: 'Business Tools' }
  },
  {
    path: 'payroll',
    loadChildren: () =>
      import('../payroll/payroll.module').then((m) => m.PayrollModule),
    data: { title: 'Business Tools' }
  },
  {
    path: 'bank-data',
    loadChildren: () =>
      import('../bank-data/bank-data.module').then((m) => m.BankDataModule),
    data: { title: 'Business Tools' }
  },
  {
    path: 'mail-dashboard',
    loadChildren: () =>
      import('./mailing-dashboard/mail-dashboard.routes').then((r) => r.routes),
    data: { title: 'Business Tools' }
  },
  {
    path: 'document-vault',
    component: DocumentVaultComponent,
    data: { title: 'Document Storage' }
  },
  {
    path: 'document-vault/folder/:folderId',
    component: DocumentVaultComponent,
    data: { title: 'Document Storage' }
  },
  {
    path: 'zil-sign',
    loadChildren: () =>
      import('./zil-sign/zil-sign-routes').then((r) => r.routes),
    data: { title: 'Zil Sign' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    FormsModule,
    AngularMaterialModule,
    PipesModule,
    DropDownComponent,
    BusinessToolsPanelComponent,
    DocumentVaultComponent
  ],
  providers: [SearchFilterPipe]
})
export class BusinessToolsModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faGear, faPaperPlaneTop, faCircleInfo, faUser, faXmark);
  }
}
