import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
  input,
  output
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

export interface IV4EmptyStateLink {
  label: string;
  key: string;
}

export interface IV4EmptyStateHowItWorks {
  title: string;
  videoTitle: string;
  videoSubtitle: string;
  steps: string[];
}

export interface IV4DataTableEmptyState {
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  buttonIcon?: string;
  /** Inline secondary links under the CTA (e.g. Import · Bulk). */
  links?: IV4EmptyStateLink[];
  /** "Paying from …" source chip. */
  sourceChip?: string;
  /** Optional right-side "How it works" onboarding card (design O17). */
  howItWorks?: IV4EmptyStateHowItWorks;
  /**
   * Set on grids that are embedded below other page content — the wallet, bank
   * and card detail pages, where the grid shares a fixed-height column with a
   * detail card above it.
   *
   * The default height is viewport-derived, which is what a full-page list
   * (Bills, Payees, Payments) wants; in an embedded grid that same height
   * overflows the space left over and pushes the page out of shape.
   */
  compact?: boolean;
}

/** Never collapse below this, however little viewport is left. */
const MIN_AVAILABLE_HEIGHT_PX = 320;
/** Breathing room between the card and the bottom of the viewport. */
const BOTTOM_GAP_PX = 24;

/**
 * Empty-state (design O17) for v4 data tables. Centered card — circle icon,
 * title, helper line, navy CTA, optional inline links + source chip — with an
 * optional right-side "How it works" onboarding card.
 */
@Component({
  selector: 'app-v4-data-table-empty-state',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, CommonButtonV4Component],
  templateUrl: './v4-data-table-empty-state.component.html',
  styleUrls: ['./v4-data-table-empty-state.component.scss']
})
export class V4DataTableEmptyStateComponent
  implements AfterViewInit, OnDestroy
{
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private onWindowResize?: () => void;

  icon = input.required<string>();
  title = input.required<string>();
  description = input.required<string>();
  buttonText = input<string>('');
  buttonIcon = input<string>('plus');
  links = input<IV4EmptyStateLink[]>([]);
  sourceChip = input<string>('');
  howItWorks = input<IV4EmptyStateHowItWorks | null>(null);
  /** See `IV4DataTableEmptyState.compact`. */
  compact = input(false);

  actionClick = output<void>();
  linkClick = output<string>();
  videoClick = output<void>();
  /** Emits 'chat' | 'mail' | 'phone' from the "How it works" help footer. */
  helpClick = output<'chat' | 'mail' | 'phone'>();

  onAction(): void {
    this.actionClick.emit();
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    this.zone.runOutsideAngular(() => {
      this.syncAvailableHeight();
      // The grid area is often still settling on the first frame (tabs, summary
      // cards and banners above it resolve late), so take a second reading.
      requestAnimationFrame(() => this.syncAvailableHeight());
      this.onWindowResize = () => this.syncAvailableHeight();
      window.addEventListener('resize', this.onWindowResize, { passive: true });
    });
  }

  ngOnDestroy(): void {
    if (this.onWindowResize) {
      window.removeEventListener('resize', this.onWindowResize);
    }
  }

  /**
   * The card stands in for the grid, so it should take up the room the grid
   * would have. How far down the page that starts differs per screen - some put
   * a page header, summary cards and two tab strips above it - so a static
   * min-height either runs past the fold or leaves dead space underneath.
   * Measure the real offset instead and publish it as `--v4-empty-avail`.
   */
  private syncAvailableHeight(): void {
    const el = this.host.nativeElement;
    const available =
      window.innerHeight - el.getBoundingClientRect().top - BOTTOM_GAP_PX;
    el.style.setProperty(
      '--v4-empty-avail',
      `${Math.round(Math.max(MIN_AVAILABLE_HEIGHT_PX, available))}px`
    );
  }
}
