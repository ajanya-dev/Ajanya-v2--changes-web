import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { neverLeave } from 'src/app/core/guards/never-leave.guard';
import { MailTrackComponent } from './pages/mail-track/mail-track.component';

const routes: Routes = [
  {
    path: 'bank-ac-add',
    canDeactivate: [neverLeave],
    loadChildren: () =>
      import('./bank-add-external/bank-add-external.module').then(
        (m) => m.BankAddExternalModule
      )
  },
  { path: 'mail-track/:tracking_code', component: MailTrackComponent }
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class ExternalModule {}
