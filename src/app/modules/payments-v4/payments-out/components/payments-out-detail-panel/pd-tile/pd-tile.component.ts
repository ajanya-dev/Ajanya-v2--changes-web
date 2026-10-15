import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  signal,
  viewChild
} from '@angular/core';
import { LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular';

/**
 * Panel-local uniform tile for the EXPANDED payments-out side panel.
 * Projects a card, caps it to the grid's tile height and — only when the
 * content actually overflows the cap — reveals a "View more / less" toggle.
 * Expanding removes the cap so the CSS-grid row grows (its row-mate stretches
 * to match). Scoped here so shared card components stay untouched.
 */
@Component({
  standalone: true,
  selector: 'app-pd-tile',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pd-tile" [class.pd-tile--expanded]="expanded()">
      <div class="pd-tile__body" #body>
        <ng-content></ng-content>
      </div>
      @if (overflowing() || expanded()) {
        <button type="button" class="pd-tile__more" (click)="toggle()">
          {{ expanded() ? 'View less' : 'View more' }}
          <lucide-icon
            [img]="expanded() ? ChevronUpIcon : ChevronDownIcon"
            [size]="13"
          ></lucide-icon>
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .pd-tile {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      // Capped viewport for the projected card. --pd-tile-body-h comes from the
      // grid (falls back if used standalone). Expanded → uncapped.
      .pd-tile__body {
        flex: 1 1 auto;
        min-height: 0;
        max-height: var(--pd-tile-body-h, 12.5rem);
        overflow: hidden;
      }
      .pd-tile--expanded .pd-tile__body {
        max-height: none;
        overflow: visible;
      }
      // "View more" footer: subtle top border, brand link styling. Sits at the
      // bottom of the tile so it reads as the card's footer even when a
      // row-mate stretches this tile taller than its content.
      .pd-tile__more {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        align-self: flex-start;
        margin-top: 6px;
        padding: 2px 0;
        border: none;
        background: transparent;
        color: var(--v4-primary-brand-color);
        font-family: var(--font-peridot);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
      }
      .pd-tile__more:hover {
        text-decoration: underline;
      }
    `
  ]
})
export class PdTileComponent implements AfterViewInit, OnDestroy {
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;

  expanded = signal(false);
  overflowing = signal(false);

  private body = viewChild<ElementRef<HTMLElement>>('body');
  private ro?: ResizeObserver;

  ngAfterViewInit(): void {
    const el = this.body()?.nativeElement;
    if (!el) return;
    // Content (tables, images) can settle after first paint, so re-measure on
    // any size change rather than a single read.
    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(el);
    this.measure();
  }

  private measure(): void {
    const el = this.body()?.nativeElement;
    if (!el || this.expanded()) return;
    // 2px slack so sub-pixel rounding doesn't show a pointless toggle.
    this.overflowing.set(el.scrollHeight > el.clientHeight + 2);
  }

  toggle(): void {
    this.expanded.update((v) => !v);
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
  }
}
