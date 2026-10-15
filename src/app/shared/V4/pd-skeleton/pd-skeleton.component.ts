import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';

/**
 * Loading placeholder for a v4 detail panel, built from `.pd-skeleton-bar`.
 * `variant="panel"` mirrors the body's card shell down to the auto-opened action
 * panel; `variant="section"` stands in for one lazily-loaded section.
 */
@Component({
  standalone: true,
  selector: 'app-pd-skeleton',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'section') {
      <div class="flex flex-col gap-2">
        @for (bar of counter(4); track bar) {
          <div class="pd-skeleton-bar h-9 rounded"></div>
        }
      </div>
    } @else {
      <div class="pd-skeleton-panel pd-full flex flex-col gap-3">
        @if (party() && partyFirst()) {
          <ng-container [ngTemplateOutlet]="partyCard" />
        }

        @if (rows()) {
          <div class="pd-card flex flex-col gap-2.5">
            <div class="pd-skeleton-bar mb-1 h-2.5 w-1/4 rounded"></div>
            @for (row of counter(rows()); track row) {
              <div class="flex items-center justify-between gap-6">
                <div
                  class="pd-skeleton-bar h-2.5 rounded"
                  [style.width.%]="labelWidth(row)"
                ></div>
                <div
                  class="pd-skeleton-bar h-2.5 rounded"
                  [style.width.%]="valueWidth(row)"
                ></div>
              </div>
            }
          </div>
        }

        @if (party() && !partyFirst()) {
          <ng-container [ngTemplateOutlet]="partyCard" />
        }

        @if (timeline()) {
          <div class="pd-card flex flex-col gap-3">
            <div class="pd-skeleton-bar h-2.5 w-1/3 rounded"></div>
            @for (entry of counter(timeline()); track entry) {
              <div class="flex gap-2.5">
                <div
                  class="pd-skeleton-bar mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                ></div>
                <div class="flex flex-1 flex-col gap-1.5">
                  <div class="pd-skeleton-bar h-2.5 w-2/5 rounded"></div>
                  <div class="pd-skeleton-bar h-2 w-3/5 rounded"></div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Actions card: the tile row, then the section that auto-opens under it. -->
        @if (tiles()) {
          <div
            class="pd-skeleton-actions flex flex-col overflow-hidden rounded-xl border border-v4-border-color bg-v4-secondary-background-color"
          >
            <div
              class="grid gap-1.5 border-b border-v4-border-color px-3 py-2"
              [style.grid-template-columns]="tileColumns()"
            >
              @for (tile of counter(tiles()); track tile) {
                <div class="pd-skeleton-bar h-14 rounded-xl"></div>
              }
            </div>
            <div class="flex flex-1 flex-col gap-2 p-3">
              @for (line of counter(5); track line) {
                <div class="pd-skeleton-bar h-9 shrink-0 rounded"></div>
              }
            </div>
          </div>
        }
      </div>
    }

    <ng-template #partyCard>
      <div class="pd-card flex items-center gap-3">
        <div class="pd-skeleton-bar h-10 w-10 shrink-0 rounded-full"></div>
        <div class="flex flex-1 flex-col gap-2">
          <div class="pd-skeleton-bar h-3 w-2/5 rounded"></div>
          <div class="pd-skeleton-bar h-2.5 w-3/5 rounded"></div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      // Fill the panel body so a short skeleton never leaves bare grey below it.
      .pd-skeleton-panel {
        flex: 1 1 auto;
        min-height: 0;
      }

      // Whatever ends up last absorbs the leftover height — the actions card
      // normally, the timeline or details card when a panel renders no tiles.
      .pd-skeleton-panel > :last-child {
        flex: 1 1 auto;
      }

      .pd-skeleton-actions {
        min-height: 12rem;
      }
    `
  ]
})
export class PdSkeletonComponent {
  /** 'panel' = the whole body; 'section' = one lazily-loaded section. */
  variant = input<'panel' | 'section'>('panel');
  /** Label/value rows in the details card. 0 hides the card. Panel variant only. */
  rows = input(5);
  /** Show the identity card (avatar + two lines). Panel variant only. */
  party = input(true);
  /** Action-grid tiles. 0 hides the actions card. Panel variant only. */
  tiles = input(6);
  /** Timeline entries in the secondary card. 0 hides it. Panel variant only. */
  timeline = input(2);
  /** Put the identity card above the details card (payments-out's order). */
  partyFirst = input(false);

  tileColumns = computed(() => `repeat(${this.tiles()}, minmax(0, 1fr))`);

  // Inline percentages, not Tailwind widths: the varied ladder is what stops the
  // rows reading as a mechanical grid, and dynamic classes would not survive purge.
  private readonly LABEL_WIDTHS = [33, 41, 26, 36, 45, 30, 38, 28];
  private readonly VALUE_WIDTHS = [24, 18, 31, 22, 16, 28, 20, 34];

  labelWidth(i: number): number {
    return this.LABEL_WIDTHS[i % this.LABEL_WIDTHS.length];
  }

  valueWidth(i: number): number {
    return this.VALUE_WIDTHS[i % this.VALUE_WIDTHS.length];
  }

  counter(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}
