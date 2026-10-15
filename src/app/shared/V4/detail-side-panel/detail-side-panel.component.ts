import {
  AfterViewInit,
  ApplicationRef,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild
} from '@angular/core';
import { NgClass, NgTemplateOutlet, TitleCasePipe } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { LucideAngularModule } from 'lucide-angular';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { CdkPortal, DomPortalOutlet, PortalModule } from '@angular/cdk/portal';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import {
  CommonButtonV4Component,
  TCButtonType
} from '../buttons/common-button-v4/common-button-v4.component';

export interface IDetailPanelStatusBadge {
  text: string;
  color: string;
  bgColor?: string;
  /** Render `text` verbatim. Opt in when the caller already formatted it —
   *  the default titlecase lowercases shortcuts ("PYMT" → "Pymt"). */
  preserveText?: boolean;
}

export interface IDetailPanelActionButton {
  label: string;
  icon?: IconProp;
  lucideIcon?: string;
  variant: 'primary' | 'outline' | 'danger' | 'warning';
  key: string;
  disabled?: boolean;
  customBgColor?: string;
  customTextColor?: string;
  color?: string;
  tooltip?: string;
  loading?: boolean;
  /** When set, this renders as a ⋮ overflow menu of the given items (design O3 header). */
  menu?: {
    label: string;
    key: string;
    danger?: boolean;
    lucideIcon?: string;
    disabled?: boolean;
  }[];
  /** Small uppercase label shown above the overflow menu items. */
  menuHeading?: string;
}

/** v2.1 (O3) header: variants rendered with the button's `v21-*` styles. */
const VARIANT_TYPE_MAP: Record<string, TCButtonType> = {
  primary: { style: 'primary', name: 'v2-1' },
  outline: { style: 'navy', name: 'v2-1' },
  danger: { style: 'danger', name: 'v2-1' },
  warning: { style: 'muted', name: 'v2-1' }
};

/**
 * A reusable slide-in detail side panel rendered via a CDK portal on `document.body`.
 *
 * @example
 * // In your component template:
 * ```html
 * <app-detail-side-panel
 *   [isOpen]="isPanelOpen"
 *   [title]="'Bill #1234'"
 *   [subtitle]="'John Doe'"
 *   [icon]="'file-text'"
 *   [iconBgColor]="'#6366F1'"
 *   [width]="'550px'"
 *   [statusBadge]="{ text: 'Paid', color: '#10B981' }"
 *   [actionButtons]="[
 *     { label: 'Pay', icon: ['fas', 'dollar-sign'], variant: 'primary', key: 'pay' },
 *     { label: 'Void', variant: 'danger', key: 'void' }
 *   ]"
 *   [contentTemplate]="detailContent"
 *   (closed)="isPanelOpen = false"
 *   (actionButtonClicked)="onAction($event)"
 * />
 *
 * <ng-template #detailContent>
 *   <div class="p-4">
 *     <!-- Your custom detail content here -->
 *     <p>Amount: {{ bill.amount | currency }}</p>
 *   </div>
 * </ng-template>
 * ```
 *
 * // In your component class:
 * ```ts
 * isPanelOpen = false;
 *
 * openPanel() {
 *   this.isPanelOpen = true;
 * }
 *
 * onAction(key: string) {
 *   if (key === 'pay') { ... }
 *   if (key === 'void') { ... }
 * }
 * ```
 *
 * @inputs
 * - `isOpen`          – Controls panel visibility (boolean)
 * - `title`           – Header title text
 * - `subtitle`        – Optional subtitle below the title
 * - `icon`            – Lucide icon name for the header icon (default: 'file-text')
 * - `iconBgColor`     – Background color of the icon circle (default: 'var(--primary)')
 * - `iconColor`       – Icon color on the circle (default: 'var(--primary-foreground)')
 * - `statusBadge`     – Optional `{ text, color }` badge shown in the header
 * - `actionButtons`   – Array of `{ label, icon?, variant, key }` buttons below the header
 * - `contentTemplate` – `TemplateRef` for the panel body content
 *
 * @outputs
 * - `closed`              – Emitted when the panel is closed (backdrop click, Escape key, or X button)
 * - `actionButtonClicked` – Emits the `key` of the clicked action button
 */
@Component({
  selector: 'app-detail-side-panel',
  standalone: true,
  imports: [
    NgClass,
    NgTemplateOutlet,
    LucideAngularModule,
    CommonButtonV4Component,
    PortalModule,
    MatMenuModule,
    TitleCasePipe,
    MatTooltip
  ],
  templateUrl: './detail-side-panel.component.html',
  styleUrls: ['./detail-side-panel.component.scss'],
  animations: [
    trigger('slidePanel', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('fadeBackdrop', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))])
    ])
  ]
})
export class DetailSidePanelComponent implements AfterViewInit, OnDestroy {
  isOpen = input(false);
  /** When false, clicking the backdrop will NOT close the panel. */
  closeOnBackdropClick = input(true);
  title = input('');
  /** Optional gray, lighter-weight text rendered inline after the title (e.g. "to John Myres"). */
  titleSuffix = input('');
  /** Hover text for the title — e.g. the full value when the caller shortened it. Empty = none. */
  titleTooltip = input('');
  subtitle = input('');
  subtitleDetail = input('');
  headerLoading = input(false);
  icon = input('file-text');
  iconBgColor = input('var(--primary)');
  iconColor = input('white');
  statusBadge = input<IDetailPanelStatusBadge | undefined>(undefined);
  extraBadges = input<IDetailPanelStatusBadge[]>([]);
  actionButtons = input<IDetailPanelActionButton[]>([]);
  contentTemplate = input<TemplateRef<unknown> | undefined>(undefined);
  iconTemplate = input<TemplateRef<unknown> | undefined>(undefined);
  headerExtraTemplate = input<TemplateRef<unknown> | undefined>(undefined);
  /** Rich meta line; replaces `subtitle` when set. */
  subtitleTemplate = input<TemplateRef<unknown> | undefined>(undefined);
  width = input('550px');
  /** Opt-in ⤢ expand toggle (design O4): widens the panel to expandedWidth for a two-column layout. */
  expandable = input(false);
  /** Panel width when expanded (O4 → ~75vw). */
  expandedWidth = input('75vw');
  /** Stable id used to persist the expanded state per user (localStorage). */
  panelId = input('');
  panelClass = input('');
  /** z-index for the backdrop; the panel itself uses backdropZIndex + 1. */
  backdropZIndex = input(200);

  closed = output<void>();
  actionButtonClicked = output<string>();
  /** Emits when expanded/collapsed so the host content can switch to a wide two-column layout. */
  expandedChange = output<boolean>();

  /**
   * Tablet band: too narrow for the page behind the panel to be useful, wide
   * enough for the two-column layout. There the panel is always expanded and
   * the ⤢ toggle is hidden — there is nothing worth collapsing back to.
   */
  private static readonly FORCE_EXPAND_QUERY =
    '(min-width: 768px) and (max-width: 1023.98px)';

  /** Raw breakpoint state; `forcedExpand` gates it on the panel opting in. */
  private viewportForcesExpand = signal(false);
  private forceExpandQuery?: MediaQueryList;
  private onViewportChange = (
    e: MediaQueryListEvent | MediaQueryList
  ): void => {
    this.viewportForcesExpand.set(e.matches);
    if (this.isOpen()) this.expandedChange.emit(this.isExpanded());
  };

  /** The ⤢ state the user chose; the effective state is `isExpanded`. */
  private manualExpand = signal(false);

  forcedExpand = computed(
    () => this.expandable() && this.viewportForcesExpand()
  );

  /** O4: effective expanded (wide) state — the user's choice, or the breakpoint. */
  isExpanded = computed(() => this.forcedExpand() || this.manualExpand());

  /** Hidden where the layout is forced: the toggle would have nothing to do. */
  showExpandToggle = computed(
    () => this.expandable() && !this.viewportForcesExpand()
  );

  portal = viewChild.required(CdkPortal);

  private appRef = inject(ApplicationRef);
  private portalOutlet!: DomPortalOutlet;
  private portalHost!: HTMLDivElement;

  constructor() {
    // Guarded: a constructor throw here would take down every page that hosts a
    // panel. `matchMedia` can be absent (non-browser), and Safari < 14 / iOS 13
    // only ship the deprecated addListener/removeListener pair.
    const mq = window.matchMedia?.(DetailSidePanelComponent.FORCE_EXPAND_QUERY);
    if (mq) {
      this.forceExpandQuery = mq;
      this.viewportForcesExpand.set(mq.matches);
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', this.onViewportChange);
      } else {
        mq.addListener(this.onViewportChange);
      }
    }

    effect(
      () => {
        const open = this.isOpen();
        if (document.body) {
          document.body.style.overflow = open ? 'hidden' : '';
        }
        // Always open in the small view; the enhanced (⤢) view is opt-in per open.
        // Reads only isOpen(), so a manual expand while open is not undone —
        // hence `untracked`, which also keeps the breakpoint from resetting it.
        if (open) {
          untracked(() => {
            this.manualExpand.set(false);
            this.expandedChange.emit(this.isExpanded());
          });
        }
      },
      { allowSignalWrites: true }
    );
  }

  @HostListener('document:keydown.escape')
  onEscKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  ngAfterViewInit(): void {
    // Use a wrapper div as the portal outlet instead of document.body directly.
    // DomPortalOutlet.dispose() removes its host element from the DOM — if the
    // host is document.body, the entire page is detached, causing blank screens
    // and AriaDescriber errors when switching tabs while a panel is open.
    this.portalHost = document.createElement('div');
    document.body.appendChild(this.portalHost);
    this.portalOutlet = new DomPortalOutlet(
      this.portalHost,
      undefined,
      this.appRef
    );
    this.portalOutlet.attach(this.portal());
  }

  ngOnDestroy(): void {
    if (document.body) {
      document.body.style.overflow = '';
    }
    const mq = this.forceExpandQuery;
    if (mq) {
      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', this.onViewportChange);
      } else {
        mq.removeListener(this.onViewportChange);
      }
    }
    this.portalOutlet?.detach();
    this.portalHost?.remove();
  }

  close(): void {
    this.closed.emit();
  }

  /** O4: toggle the wide/expanded two-column layout. */
  toggleExpand(): void {
    this.manualExpand.update((v) => !v);
    this.expandedChange.emit(this.isExpanded());
  }

  onBackdropClick(): void {
    if (this.closeOnBackdropClick()) {
      this.close();
    }
  }

  onBackdropKeydown(event: KeyboardEvent): void {
    if (event.key === ' ') {
      event.preventDefault();
      this.onBackdropClick();
    }
  }

  onActionClick(key: string): void {
    this.actionButtonClicked.emit(key);
  }

  badgeBackground(badge: IDetailPanelStatusBadge): string {
    return (
      badge.bgColor || `color-mix(in srgb, ${badge.color} 12%, transparent)`
    );
  }

  mapVariant(
    variant: 'primary' | 'outline' | 'danger' | 'warning'
  ): TCButtonType {
    return VARIANT_TYPE_MAP[variant] || VARIANT_TYPE_MAP.primary;
  }
}
