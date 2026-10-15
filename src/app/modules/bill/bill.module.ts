import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { PayeeModalModule } from 'src/app/shared/modal/payee-modal/payee-modal.module';
import { CommentsModalModule } from 'src/app/shared/modal/comments-modal/comments-modal.module';
import { AttachmentModalModule } from 'src/app/shared/modal/attachment-modal/attachment-modal.module';
import { CategoryModalModule } from 'src/app/shared/modal/category-modal/category-modal.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { CommonModalModule } from 'src/app/shared/modal/common-modal/common-modal.module';
import { VendorCreditModalModule } from 'src/app/shared/modal/vendor-credit-modal/vendor-credit-modal.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { ThirdpartyImportsModule } from 'src/app/shared/modal/thirdparty-imports/thirdparty-imports.module';
import { ViewAuditTrailComponent } from 'src/app/shared/components/actions/view-audit-trail/view-audit-trail.component';
import { ViewCommentsComponent } from 'src/app/shared/components/actions/view-comments/view-comments.component';
import { ViewAttachmentsComponent } from 'src/app/shared/components/actions/view-attachments/view-attachments.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { DropDownCategoryComponent } from 'src/app/shared/components/drop-downs/drop-down-category/drop-down-category.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownPayeeComponent } from 'src/app/shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faA,
  faArrowDownToLine,
  faArrowUpToLine,
  faCalendar,
  faCircle,
  faCircleInfo,
  faEdit,
  faEllipsisV,
  faInfo,
  faMoneyCheckAlt,
  faPlus,
  faR,
  faTimes,
  faTrash,
  faTrashAlt,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';

import {
  faBan,
  faMessageDots,
  faMoneyBillWave,
  faPaperclip,
  faPrint
} from '@fortawesome/pro-regular-svg-icons';
import { DataTableModule } from '../data-table/data-table.module';
import { BillAttachmentCommentComponent } from './pages/bill-list/billAttachmentComment';
import { BillViewPageComponent } from './pages/bill-view-page/bill-view-page.component';
import { UploadExtractComponent } from './components/upload-extract/upload-extract.component';
import { AddItemsComponent } from './components/add-items/add-items.component';
import { AddBillModalComponent } from './modals/add-bill-modal/add-bill-modal.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { BillListComponent } from './pages/bill-list/bill-list.component';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { BillInvoicePageComponent } from './pages/bill-invoice-page/bill-invoice-page.component';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: BillListComponent,
    data: { title: 'Bill List ' }
  },
  {
    path: 'view/:id',
    component: BillViewPageComponent
  },
  {
    path: 'inbox',
    component: BillInvoicePageComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    HttpClientModule,
    AmountInputComponent,
    DataTableModule,
    V3DataTableModule,
    PayeeModalModule,
    FontAwesomeModule,
    CommentsModalModule,
    AttachmentModalModule,
    CategoryModalModule,
    SharedModule,
    DropDownPayeeComponent,
    DropDownBankComponent,
    DropDownCategoryComponent,
    OcwBackButtonComponent,
    DemoVideoComponent,
    ViewAttachmentsComponent,
    ViewCommentsComponent,
    ViewAuditTrailComponent,
    CommonModalModule,
    VendorCreditModalModule,
    NgSelectModule,
    NgxMaskDirective,
    NgxMaskPipe,
    ThirdpartyImportsModule,
    DataRangeV35Component,
    CommonBackButtonV35Component,
    BillListComponent,
    AddBillModalComponent,
    AddItemsComponent,
    UploadExtractComponent,
    BillViewPageComponent,
    BillAttachmentCommentComponent
  ]
})
export class BillModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPlus,
      faTrash,
      faCircleInfo,
      faCircle,
      faArrowDownToLine,
      faArrowUpToLine,
      faXmark,
      faTrashAlt,
      faTimes,
      faInfo,
      faCalendar,
      faEllipsisV,
      faMoneyCheckAlt,
      faEdit,
      faPrint,
      faBan,
      faMoneyBillWave,
      faA,
      faMessageDots,
      faPaperclip,
      faR
    );
  }
}
