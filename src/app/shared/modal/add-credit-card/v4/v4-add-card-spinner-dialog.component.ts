import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

/**
 * @description V4 blocking dialog shown while the prefill flow runs its
 * two API calls (get-card-details + get-form-token). Uses MatDialog's backdrop
 * + disableClose so the user cannot interact with the app until the next
 * dialog opens or the caller falls back.
 */
@Component({
  selector: 'app-v4-add-card-spinner-dialog',
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <div class="flex flex-col items-center justify-center px-6 py-8">
      <div class="loader-spinner"></div>
      <h4
        class="text-base font-semibold text-v4-main-text-color mt-4 font-funnel"
      >
        Verifying your card&hellip;
      </h4>
      <p class="text-sm text-v4-secondary-text-color mt-2 text-center">
        Please wait while we fetch your card details.
      </p>
    </div>
  `,
  styles: `
    .loader-spinner {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3.5px solid transparent;
      border-top-color: var(--v4-secondary-brand-color);
      border-right-color: var(--v4-secondary-brand-color);
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `
})
export class V4AddCardSpinnerDialogComponent {}
