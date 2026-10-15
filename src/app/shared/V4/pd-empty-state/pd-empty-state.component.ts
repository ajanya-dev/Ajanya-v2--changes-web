import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

/** Detail-panel empty state: icon chip, bold title, one-line hint, optional projected CTA. */
@Component({
  standalone: true,
  selector: 'app-pd-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="pd-empty pd-empty-state">
      <span class="pd-empty-state__icon">
        <lucide-icon [name]="icon()" [size]="15"></lucide-icon>
      </span>
      <p class="pd-empty-state__title">{{ title() }}</p>
      @if (hint()) {
        <p class="pd-empty-state__hint">{{ hint() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
      }

      .pd-empty-state {
        justify-content: flex-start;
        padding: 1.5rem 1rem;
        font-family: var(--font-peridot), 'Plus Jakarta Sans', sans-serif;
      }

      .pd-empty-state__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        background: var(--v4-badge-neutral-bg-color);
        color: var(--v4-tertiary-text-color);
      }

      .pd-empty-state__title {
        margin: 0.5rem 0 0;
        font-size: 12px;
        font-weight: 700;
        color: var(--v4-main-text-color);
      }

      .pd-empty-state__hint {
        margin: 0.125rem 0 0;
        font-size: 11px;
        color: var(--v4-tertiary-text-color);
      }
    `
  ]
})
export class PdEmptyStateComponent {
  icon = input('inbox');
  title = input.required<string>();
  hint = input('');
}
