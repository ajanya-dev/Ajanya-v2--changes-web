import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';

/**
 * The "Show N more" / "Show less" link that caps a long list in a v4 detail
 * panel. Presentation only — the owner keeps `showAll` and slices the rows.
 */
@Component({
  standalone: true,
  selector: 'app-pd-show-more',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="pd-show-more" (click)="toggled.emit()">
      {{ showingAll() ? 'Show less' : 'Show ' + hiddenCount() + ' more' }}
    </button>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .pd-show-more {
        width: 100%;
        margin-top: 0.25rem;
        padding: 0.25rem 0;
        border: none;
        background: transparent;
        cursor: pointer;
        font-family: var(--font-peridot), 'Plus Jakarta Sans', sans-serif;
        font-size: 11px;
        font-weight: 600;
        color: var(--v4-primary-brand-bold-color);
      }

      .pd-show-more:hover {
        text-decoration: underline;
      }
    `
  ]
})
export class PdShowMoreComponent {
  /** How many rows are hidden — the number in "Show N more". */
  hiddenCount = input.required<number>();
  showingAll = input(false);
  toggled = output<void>();
}
