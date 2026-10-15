import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatDialogModule } from '@angular/material/dialog';
import { PayeeDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatMenuModule } from '@angular/material/menu';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { DropZoneComponent } from 'src/app/shared/components/drop-zone/drop-zone.component';
import { V3DataTableModule } from '../../v3-data-table/v3-data-table.module';
import { DocumentMailComponent } from './document-mail.component';
import { UploadDocumentModalComponent } from './components/upload-document-modal/upload-document-modal.component';
import { DocumentMailModalComponent } from './components/document-mail-modal/document-mail-modal.component';
import { DocumentsMailDataTableComponent } from './components/documents-mail-data-table/documents-mail-data-table.component';
import { AddAddressModalComponent } from './components/add-address-modal/add-address-modal.component';
import { DocumentMailTableActionComponent } from './components/document-mail-table-action/document-mail-table-action.component';
import { DocumentMailStatementModalComponent } from './components/document-mail-statement-modal/document-mail-statement-modal.component';
import { DocumentMailFilesTableComponent } from './components/document-mail-files-table/document-mail-files-table.component';
import { DocumentMailFilesTableActionComponent } from './components/document-mail-files-table/document-mail-files-table-action.component';
import { DocumentMailViewComponent } from './components/document-mail-view/document-mail-view.component';
import { AttachDocComponent } from './components/attach-doc/attach-doc.component';
import { PageSelectComponent } from './components/page-select/page-select.component';
import { DocumentSendMailPageComponent } from './components/document-send-mail-page/document-send-mail-page.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: DocumentMailComponent,
    data: { title: 'Document Mail' }
  },
  {
    path: 'view/:id',
    component: DocumentMailViewComponent,
    data: { title: 'Document Mail' }
  },
  {
    path: 'add-attachment',
    component: AttachDocComponent,
    data: { title: 'Add Attachment' }
  },
  {
    path:'page-select',
    component: PageSelectComponent,
    data: { title: 'Page Select' }
  },
  {
    path: 'mail-details',
    component: DocumentSendMailPageComponent,
    data: { title: 'Mail Details' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    SharedModule,
    PayeeDropdownV3Component,
    MatDialogModule,
    MatMenuModule,
    NgSelectModule,
    ReactiveFormsModule,
    V3DataTableModule,
    CommonButtonV35Component,
    FontAwesomeModule,
    V35CommonDropDownSelectorComponent,
    V35ControlMessageComponent,
    DropZoneComponent,
    UploadDocumentModalComponent,
    DocumentMailComponent,
    DocumentMailModalComponent,
    DocumentsMailDataTableComponent,
    AddAddressModalComponent,
    DocumentMailFilesTableActionComponent,
    DocumentMailTableActionComponent,
    DocumentMailStatementModalComponent,
    DocumentMailFilesTableComponent
  ]
})
export class DocumentMailModule {}
