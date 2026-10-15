import { animate, style, transition, trigger } from '@angular/animations';

/**
 * Inline bulk-action bar entry. No `:leave` — the bar shares the toolbar slot with the
 * pending-approvals warning, and animating the exit keeps both in that slot momentarily,
 * which reads as a double-show.
 */
export const inlineActionBarAnimation = trigger('inlineActionBar', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-6px)' }),
    animate('0.22s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);
