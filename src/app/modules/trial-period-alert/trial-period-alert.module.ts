import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrailPeriodAlertModalComponent } from './modals/trail-period-alert-modal/trail-period-alert-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import { TrailPeriodPlanSuggestionComponent } from './pages/trail-period-plan-suggestion/trail-period-plan-suggestion.component';
import { RouterModule, Routes } from '@angular/router';
import { TrialPeriodOfferModalComponent } from './modals/trial-period-offer-modal/trial-period-offer-modal.component';
import { TrialPeriodOfferModalV4Component } from './modals/trial-period-offer-modal-v4/trial-period-offer-modal-v4.component';

const routes: Routes = [
  {
    path: '',
    component: TrailPeriodPlanSuggestionComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    RouterModule.forChild(routes),
    TrailPeriodAlertModalComponent,
    TrailPeriodPlanSuggestionComponent,
    TrialPeriodOfferModalComponent,
    TrialPeriodOfferModalV4Component
  ]
})
export class TrialPeriodAlertModule {}
