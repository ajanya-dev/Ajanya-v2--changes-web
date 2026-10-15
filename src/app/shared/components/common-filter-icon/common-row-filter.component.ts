import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject
} from '@angular/core';
import { LucideAngularModule, ListFilter } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFilterList } from '@fortawesome/pro-solid-svg-icons';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

/**
 * Row-level "filter by this value" affordance shown on cell hover.
 *
 * Shared by both layouts, so it renders per `isV4LayoutEnabled`:
 *  • V4 — a thin-stroke Lucide icon in a compact ghost icon-button
 *    (transparent, subtle brand-tint on hover), matching the rest of the v4 UI.
 *  • V3 — the original FontAwesome solid icon on a filled blue block.
 */
@Component({
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, FontAwesomeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-common-filter-icon',
  template: `
    @if (isV4) {
      <button
        type="button"
        aria-label="Filter by This Value"
        matTooltip="Filter by This Value"
        class="dt-filter-btn"
        (click)="onFilterClicked($event)"
      >
        <lucide-angular [img]="ListFilterIcon" [size]="16" />
      </button>
    } @else {
      <div
        role="presentation"
        class="h-6 flex justify-center items-center bg-common-secondary-blue-color text-common-blue-color p-1 cursor-pointer"
        (click)="onFilterClicked()"
      >
        <fa-icon class="-my-3" [icon]="faFilterList"></fa-icon>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
      }

      .dt-filter-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
        width: 20px;
        height: 28px;
        flex-shrink: 0;
        padding: 0;
        border-radius: 4px;
        background: none;
        transition: background-color 150ms ease;
        color: var(--v4-primary-brand-bold-color);
        flex-shrink: 0;
        cursor: pointer;
      }

      .dt-filter-btn:hover {
        background-color: var(--v4-secondary-background-color);
      }
    `
  ]
})
export class CommonFilterIconComponent {
  @Output() filterEvent = new EventEmitter<string>();
  readonly ListFilterIcon = ListFilter;
  readonly faFilterList = faFilterList;

  /** Layout flag set by the header's V3/V4 switch; a reload follows it. */
  readonly isV4 =
    inject(LocalStorageService).getItem('isV4LayoutEnabled') === 1;

  onFilterClicked(event?: MouseEvent) {
    // Only the v4 button swallows the click — the v3 block never did, and the
    // grids behind it rely on that.
    event?.stopPropagation();
    this.filterEvent.emit();
  }
}
