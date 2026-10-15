import {
  ConnectedPosition,
  HorizontalConnectionPos,
  Overlay,
  OverlayRef
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ComponentRef,
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  OnDestroy,
  ViewContainerRef,
  inject,
  input
} from '@angular/core';
import { InfoTooltipPanelV4Component } from './info-tooltip-panel-v4.component';
import {
  IInfoTooltipV4Content,
  TInfoTooltipV4Align
} from './info-tooltip-v4.model';

/** Vertical offset from the trigger, matching the handoff's `calc(100% + 8px)`. */
const PANEL_OFFSET = 8;

const ALIGN_TO_X: Record<TInfoTooltipV4Align, HorizontalConnectionPos> = {
  left: 'start',
  center: 'center',
  right: 'end'
};

/**
 * InfoTooltipV4Directive - rich hover tooltip attached to a trigger element.
 *
 * The host element is the trigger, so the caller owns the icon and its styling.
 * The panel renders through a CDK overlay rather than an absolutely positioned
 * child, which keeps it clear of the page's `overflow-*` scroll containers and
 * out of the z-index race with ng-select.
 *
 * @example
 * <lucide-icon
 *   name="info"
 *   [size]="17"
 *   class="inline-flex cursor-pointer text-v4-subtle-text-color"
 *   [appInfoTooltipV4]="paymentMethodTooltip"
 *   tooltipWidth="352px"
 * ></lucide-icon>
 */
@Directive({
  selector: '[appInfoTooltipV4]',
  standalone: true
})
export class InfoTooltipV4Directive implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly viewContainerRef = inject(ViewContainerRef);

  /** Structured tooltip body. */
  content = input.required<IInfoTooltipV4Content>({
    alias: 'appInfoTooltipV4'
  });

  /** How the panel lines up against the trigger. */
  tooltipAlign = input<TInfoTooltipV4Align>('center');

  /** Panel width, any CSS length. */
  tooltipWidth = input<string>('352px');

  /** Panel padding shorthand. The bullet-only variant uses '13px 16px'. */
  tooltipPadding = input<string>('14px 16px');

  /** Width of the label column when the content uses `rows`. */
  tooltipRowLabelWidth = input<string>('44px');

  /** Suppresses the tooltip without removing the directive. */
  tooltipDisabled = input<boolean>(false);

  private overlayRef: OverlayRef | null = null;
  private panelRef: ComponentRef<InfoTooltipPanelV4Component> | null = null;

  /** Keyboard users need to be able to reach the trigger to read the tooltip. */
  @HostBinding('attr.tabindex') readonly tabIndex = '0';

  @HostBinding('attr.aria-describedby') get describedBy(): string | null {
    return this.panelRef?.instance.panelId ?? null;
  }

  @HostListener('mouseenter')
  @HostListener('focusin')
  show(): void {
    if (this.tooltipDisabled() || this.overlayRef) return;

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.elementRef)
        .withPositions(this.positions()),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false,
      // The panel is read-only, so keeping it inert means the pointer never
      // leaves the trigger and `mouseleave` stays a reliable close signal.
      panelClass: ['pointer-events-none']
    });

    this.panelRef = this.overlayRef.attach(
      new ComponentPortal(InfoTooltipPanelV4Component, this.viewContainerRef)
    );
    this.panelRef.setInput('content', this.content());
    this.panelRef.setInput('width', this.tooltipWidth());
    this.panelRef.setInput('padding', this.tooltipPadding());
    this.panelRef.setInput('rowLabelWidth', this.tooltipRowLabelWidth());
    this.panelRef.instance.fadeIn();
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  @HostListener('document:keydown.escape')
  hide(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.panelRef = null;
  }

  ngOnDestroy(): void {
    this.hide();
  }

  /** Preferred placement first, flipped placement as the fallback. */
  private positions(): ConnectedPosition[] {
    const x = ALIGN_TO_X[this.tooltipAlign()];

    return [
      {
        originX: x,
        originY: 'bottom',
        overlayX: x,
        overlayY: 'top',
        offsetY: PANEL_OFFSET
      },
      {
        originX: x,
        originY: 'top',
        overlayX: x,
        overlayY: 'bottom',
        offsetY: -PANEL_OFFSET
      }
    ];
  }
}
