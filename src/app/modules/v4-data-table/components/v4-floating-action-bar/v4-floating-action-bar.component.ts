import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IV3CommonButton } from 'src/app/modules/v3-data-table/models/v3-data-table';
import {
  CommonButtonV4Component,
  TCButtonType
} from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { fitButtons } from './overflow-fit-calculator';

const NARROW_BREAKPOINT = 785;

/**
 * V4 Floating Action Bar
 *
 * Bulk-selection action bar shown when rows are selected in a v4-data-table.
 * It lives in the table toolbar row; below 785px it pins to the bottom of the
 * viewport. Buttons that do not fit on one row collapse into a "More" menu.
 *
 * Buttons are picked up from `floatingBarVariant` on each IV3CommonButton and
 * mapped to the `v2-1` button family:
 *
 * | floatingBarVariant                                          | v2-1 style |
 * |-------------------------------------------------------------|------------|
 * | `primary`                                                   | primary    |
 * | `filled-danger`, `danger-soft`, `outline-danger`            | danger     |
 * | `filled-success`, `success-soft`, `outline-success`         | success    |
 * | `filled-primary`, `outline-primary`, `outline-navy`, `outline-violet` | navy |
 * | anything else                                               | muted      |
 *
 * Buttons WITHOUT `floatingBarVariant` are not shown in the bar.
 *
 * ## Grouping & Dividers
 *
 * `barGroup` is the ONLY thing that groups buttons. Buttons that don't set one
 * share a single general group, keep their declared order, and get no dividers
 * between them — so Void and Delete sit together like any other action.
 *
 * A divider is drawn wherever `barGroup` changes, and groups sort by that
 * number. Set it only where a boundary is real (an Approve/Reject decision,
 * say); don't reach for it to separate destructive actions.
 *
 * Styling deliberately has no say here. An earlier version inferred groups from
 * `floatingBarVariant`, which split Delete off from Void purely because it was
 * redder, and stranded buttons like "Send Payment" and "Convert to Payments"
 * behind a divider for being green.
 *
 * ## Button Loading & Disabled States
 *
 * Set `loading` or `disabled` on a button by reassigning `headerElements`
 * with a new object reference (required for signal input change detection).
 *
 * Add a helper in your component:
 * ```typescript
 * private setButtonState(
 *   btnId: string,
 *   state: { loading?: boolean; disabled?: boolean }
 * ) {
 *   this.headerElements = {
 *     ...this.headerElements,
 *     buttons: this.headerElements.buttons?.map((btn) =>
 *       btn.id === btnId ? { ...btn, ...state } : btn
 *     )
 *   };
 * }
 * ```
 */
@Component({
  selector: 'app-v4-floating-action-bar',
  templateUrl: './v4-floating-action-bar.component.html',
  styleUrls: ['./v4-floating-action-bar.component.scss'],
  standalone: true,
  imports: [
    LucideAngularModule,
    FontAwesomeModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    CommonButtonV4Component
  ]
})
export class V4FloatingActionBarComponent
  implements AfterViewChecked, OnDestroy
{
  buttons = input<IV3CommonButton[]>();
  selectedRowCount = input(0);

  buttonClick = output<string | number>();
  clearSelection = output<void>();

  readonly actionsRow = viewChild<ElementRef<HTMLElement>>('actionsRow');

  /** Number of buttons rendered inline; `null` means all of them fit. */
  readonly visibleCount = signal<number | null>(null);
  /** Below 785px the bar pins to the bottom of the viewport. */
  readonly isNarrow = signal(false);

  readonly visibleButtons = computed(() => {
    const list =
      this.buttons()?.filter((b) => !b.isHidden && !!b.floatingBarVariant) ??
      [];
    return [...list].sort((a, b) => this.groupRank(a) - this.groupRank(b));
  });

  /** Buttons rendered inline; the tail beyond `visibleCount` moves to "More". */
  readonly renderButtons = computed(() => {
    const count = this.visibleCount();
    return count == null
      ? this.visibleButtons()
      : this.visibleButtons().slice(0, count);
  });

  /** Buttons that did not fit and collapse into the trailing "More" menu. */
  readonly overflowButtons = computed(() => {
    const count = this.visibleCount();
    return count == null ? [] : this.visibleButtons().slice(count);
  });

  /** True when any visible button is loading — used to disable its siblings. */
  readonly isAnyButtonLoading = computed(() =>
    this.visibleButtons().some((b) => b.loading)
  );

  private static readonly VARIANT_STYLES: Record<
    string,
    'primary' | 'navy' | 'danger' | 'success'
  > = {
    primary: 'primary',
    'filled-danger': 'danger',
    'danger-soft': 'danger',
    'outline-danger': 'danger',
    'filled-primary': 'navy',
    'outline-violet': 'navy',
    'filled-success': 'success',
    'success-soft': 'success',
    'outline-success': 'success',
    'outline-primary': 'navy',
    'outline-navy': 'navy'
  };

  private resizeObserver: ResizeObserver | undefined;
  private buttonWidths: number[] = [];
  private initialized = false;

  /**
   * Cached widths belong to one particular button set. When the set changes (a filter tab
   * swaps the actions, say) they would otherwise never be rebuilt and the overflow split
   * would stay frozen, stranding buttons in "More".
   */
  protected readonly invalidateWidths = effect(
    () => {
      this.buttons();
      this.buttonWidths = [];
      this.visibleCount.set(null);
      if (this.initialized) {
        requestAnimationFrame(() => this.checkFit());
      }
    },
    { allowSignalWrites: true }
  );

  ngAfterViewChecked(): void {
    if (!this.initialized && this.visibleButtons().length > 0) {
      this.initialized = true;
      requestAnimationFrame(() => {
        this.checkFit();
        this.observeResize();
      });
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.onWindowResize);
  }

  buttonType(variant?: string): TCButtonType {
    return {
      name: 'v2-1',
      size: 'sm',
      style:
        V4FloatingActionBarComponent.VARIANT_STYLES[variant ?? ''] ?? 'muted'
    };
  }

  /** Group every unassigned button lands in. */
  private static readonly DEFAULT_GROUP = 0;

  /**
   * Sort key. Buttons without a `barGroup` share one general group and so keep
   * their declared order.
   */
  private groupRank(btn: IV3CommonButton): number {
    return btn.barGroup ?? V4FloatingActionBarComponent.DEFAULT_GROUP;
  }

  /** Identity of a button's group, for detecting boundaries. */
  private groupKey(btn: IV3CommonButton): string {
    return `g${this.groupRank(btn)}`;
  }

  /** True when the inline button at `index` starts a new group. */
  showGroupDivider(index: number): boolean {
    if (index <= 0) return false;
    const list = this.renderButtons();
    return this.groupKey(list[index]) !== this.groupKey(list[index - 1]);
  }

  isButtonDisabled(btn: IV3CommonButton): boolean {
    return (
      (btn.disabled ?? false) || (this.isAnyButtonLoading() && !btn.loading)
    );
  }

  /**
   * Hint shown while a button is unavailable.
   *
   * It rides on the HOST element, not the inner `<button>`: `.v21-btn:disabled`
   * sets `pointer-events: none`, so a disabled button never sees a mouseenter
   * and its own `toolTip` can't fire. The events fall through to the host,
   * which is where the cursor and this tooltip live.
   */
  blockedTooltip(btn: IV3CommonButton): string {
    return this.isButtonDisabled(btn)
      ? "You can't perform this action right now."
      : '';
  }

  /** The button's own tooltip, suppressed while blocked so the two never stack. */
  enabledTooltip(btn: IV3CommonButton): string {
    return this.isButtonDisabled(btn) ? '' : (btn.toolTip ?? '');
  }

  onClear(): void {
    this.clearSelection.emit();
  }

  onButtonClick(btnId: string | number | undefined): void {
    if (btnId) {
      this.buttonClick.emit(btnId);
    }
  }

  private onWindowResize = (): void => this.checkFit();

  private observeResize(): void {
    // The table keeps a min-width at narrow viewports (the page scrolls horizontally),
    // so its own ResizeObserver never fires — watch the viewport as well.
    window.addEventListener('resize', this.onWindowResize);
    const target = this.actionsRow()?.nativeElement;
    if (!target) return;
    this.resizeObserver = new ResizeObserver(() => this.checkFit());
    this.resizeObserver.observe(target);
  }

  private checkFit(): void {
    this.isNarrow.set(window.innerWidth < NARROW_BREAKPOINT);
    requestAnimationFrame(() => this.computeOverflow());
  }

  /**
   * Natural widths are cached while every button is still inline, so later resizes
   * recompute without a show/hide measurement loop.
   */
  private computeOverflow(): void {
    const actions = this.actionsRow()?.nativeElement;
    if (!actions) return;

    if (this.visibleCount() === null) {
      const btns = [
        ...actions.querySelectorAll(':scope > app-common-button-v4')
      ] as HTMLElement[];
      if (btns.length === this.visibleButtons().length && btns.length > 0) {
        this.buttonWidths = btns.map((b) => b.offsetWidth);
      }
    }
    if (this.buttonWidths.length !== this.visibleButtons().length) return;

    this.visibleCount.set(fitButtons(this.buttonWidths, actions.clientWidth));
  }
}
