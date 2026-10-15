import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ProcessCardComponent } from './pages/process-card/process-card.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OfferPageComponent } from './pages/offer-page/offer-page.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { ProcessCardCompletedComponent } from './pages/process-card-completed/process-card-completed.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { faCheck, faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: OfferPageComponent,
    data: { title: 'Process Card ' }
  },
  { path: 'process', component: ProcessCardComponent },
  { path: 'success', component: ProcessCardCompletedComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    SharedModule,
    NgxMaskDirective,
    NgxMaskPipe,
    ProcessCardComponent,
    OfferPageComponent,
    ProcessCardCompletedComponent
  ]
})
export class ProcessCardModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faChevronRight, faCheck);
  }
}
