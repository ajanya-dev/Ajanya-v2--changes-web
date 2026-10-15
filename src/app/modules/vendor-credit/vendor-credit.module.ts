import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { ViewAuditTrailComponent } from 'src/app/shared/components/actions/view-audit-trail/view-audit-trail.component';
import { ViewCommentsComponent } from 'src/app/shared/components/actions/view-comments/view-comments.component';
import { ViewAttachmentsComponent } from 'src/app/shared/components/actions/view-attachments/view-attachments.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { faCalendar, faEllipsisV } from '@fortawesome/pro-solid-svg-icons';
import { DataTableModule } from '../data-table/data-table.module';
import { VendorCreditListComponent } from './pages/vendor-credit-list/vendor-credit-list.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { VendorCreditViewComponent } from './pages/vendor-credit-view/vendor-credit-view.component';
import { VendorCreditStatusRendererComponent } from './pages/vendor-credit-list/vendorCreditStatusRenderer';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';
import { faMessageDots, faPaperclip } from '@fortawesome/pro-regular-svg-icons';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full'
  },
  {
    path: 'index',
    component: VendorCreditListComponent,
    data: { title: 'Vendor Credit ' }
  },
  {
    path: 'view/:id',
    component: VendorCreditViewComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    DataTableModule,
    SharedModule,
    ViewAttachmentsComponent,
    ViewCommentsComponent,
    ViewAuditTrailComponent,
    V3DataTableModule,
    FontAwesomeModule,
    VendorCreditViewComponent,
    VendorCreditListComponent,
    VendorCreditStatusRendererComponent
  ],
  providers: [DecimalPipe]
})
export class VendorCreditModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faEllipsisV, faCalendar, faMessageDots, faPaperclip);
  }
}
