import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MAIL_TRACK_PATH } from 'src/app/shared/utils/v4-external.util';
import { V4MailTrackComponent } from './pages/v4-mail-track/v4-mail-track.component';

const routes: Routes = [
  { path: `${MAIL_TRACK_PATH}/:tracking_code`, component: V4MailTrackComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)]
})
export class V4ExternalModule {}
