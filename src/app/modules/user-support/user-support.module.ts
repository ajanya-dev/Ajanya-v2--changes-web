import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from 'src/app/shared/shared.module';
import {
  faCalendar,
  faCheck,
  faPaperclip,
  faHeadset,
  faPlus,
  faTimes,
  faTrashCan
} from '@fortawesome/pro-solid-svg-icons';
import { faPaperclip as fatPaperclip } from '@fortawesome/pro-thin-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { AddQuestionModalComponent } from './modals/add-question-modal/add-question-modal.component';
import { ChatHistoryComponent } from './pages/chat-history/chat-history.component';
import { DataTableModule } from '../data-table/data-table.module';
import { JpgPngModalComponent } from './modals/jpg-png-modal/jpg-png-modal.component';
import { HelpWidgetComponent } from './components/help-widget/help-widget.component';
import { SupportQuestionsComponent } from './pages/support-questions/support-questions.component';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },

  {
    path: '',
    component: SupportQuestionsComponent,
    data: { title: 'User Support ' }
  },
  {
    path: 'allMessages',
    component: ChatHistoryComponent,
    data: { title: 'Tickets' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    HttpClientModule,
    DataTableModule,
    SharedModule,
    FontAwesomeModule,
    OcwBackButtonComponent,
    V3DataTableModule,
    V3DataTableSelectBoxComponent,
    CommonBackButtonV35Component,
    SupportQuestionsComponent,
    AddQuestionModalComponent,
    ChatHistoryComponent,
    JpgPngModalComponent,
    HelpWidgetComponent
  ],
  exports: [HelpWidgetComponent]
})
export class UserSupportModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPaperclip,
      faPlus,
      faTimes,
      faCheck,
      faTrashCan,
      faCalendar,
      fatPaperclip,
      faHeadset
    );
  }
}
