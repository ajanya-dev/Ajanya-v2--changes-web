import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/pro-solid-svg-icons';

/**
 * @description Minimal blocking dialog shown while the prefill flow runs its
 * two API calls (get-card-details + get-form-token). Uses MatDialog's backdrop
 * + disableClose so the user cannot navigate or interact with the app until
 * the next dialog opens or the caller falls back.
 */
@Component({
  selector: 'app-add-card-spinner-dialog',
  standalone: true,
  imports: [MatDialogModule, FontAwesomeModule],
  template: `
    <div class="flex items-center gap-3 p-5">
      <fa-icon
        animation="spin"
        [icon]="faSpinner"
        class="text-common-blue-color text-lg"
      />
      <span class="font-roboto text-sm text-main-text-color">
        Verifying your card details&hellip;
      </span>
    </div>
  `
})
export class AddCardSpinnerDialogComponent {
  faSpinner = faSpinner;
}
