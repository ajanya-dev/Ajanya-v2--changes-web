import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { faTimes } from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../../shared/shared.module';
import { EnterEmailModalComponent } from './modals/enter-email-modal/enter-email-modal.component';
import { EmailTemplateEditorComponent } from './pages/email-editor/email-editor.component';

import '../../../assets/builderjs/dist/builder.js';

const routes: Routes = [
  { path: 'mail_design/echeck', component: EmailTemplateEditorComponent },
  {
    path: 'mail_design/physical_mail',
    component: EmailTemplateEditorComponent
  },
  {
    path: 'mail_design/direct_deposit',
    component: EmailTemplateEditorComponent
  },
  {
    path: 'mail_design/direct_deposit_action_required',
    component: EmailTemplateEditorComponent
  },
  {
    path: 'mail_design/let_vendor_decide',
    component: EmailTemplateEditorComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    MatDialogModule,
    SharedModule,
    EmailTemplateEditorComponent,
    EnterEmailModalComponent
  ]
})
export class EmailTemplateDesignModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faTimes);
  }
}
