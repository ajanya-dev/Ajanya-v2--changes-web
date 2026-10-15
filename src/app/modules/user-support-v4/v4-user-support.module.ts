import {  Routes } from '@angular/router';
import { V4SupportQuestionsComponent } from './pages/v4-support-questions/v4-support-questions.component';

export const v4UserSupportRoutes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: '',
    component: V4SupportQuestionsComponent,
    data: { title: 'Support' }
  }
];
