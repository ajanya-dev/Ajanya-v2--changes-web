import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { IInfoTooltipV4Content } from './info-tooltip-v4.model';

let nextPanelId = 0;

function takePanelId(): number {
  nextPanelId += 1;
  return nextPanelId;
}

/**
 * InfoTooltipPanelV4Component - the dark card body of the V4 info tooltip.
 *
 * Rendered into a CDK overlay by {@link InfoTooltipV4Directive}; it owns no
 * positioning of its own. Geometry follows the Paychex flow handoff: 10px
 * radius, `0 18px 40px rgba(16,24,40,.28)` shadow, 12px body type.
 */
@Component({
  selector: 'app-info-tooltip-panel-v4',
  standalone: true,
  imports: [LucideAngularModule, NgClass],
  templateUrl: './info-tooltip-panel-v4.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoTooltipPanelV4Component {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  /** Structured tooltip body. */
  content = input<IInfoTooltipV4Content>({});

  /** Panel width, any CSS length. */
  width = input<string>('352px');

  /** Panel padding shorthand. The bullet-only variant uses '13px 16px'. */
  padding = input<string>('14px 16px');

  /** Width of the label column when `rows` are used. */
  rowLabelWidth = input<string>('44px');

  /** Stable id so the trigger can point `aria-describedby` at this panel. */
  @HostBinding('attr.id') readonly panelId = `info-tooltip-v4-${takePanelId()}`;

  @HostBinding('attr.role') readonly role = 'tooltip';

  @HostBinding('class') readonly hostClass = 'block';

  /**
   * The component version faded in via `group-hover`. An overlay is created on
   * demand and is already visible on first paint, so the fade has to be driven
   * by flipping this one tick later.
   */
  protected readonly visible = signal(false);

  /** True when something renders above the `rows` / `note` dividers. */
  protected readonly hasHeader = computed(() => {
    const { title, description, bullets } = this.content();
    return !!title || !!description || !!bullets?.length;
  });

  /**
   * Called by the directive once the overlay is attached. Deferred a frame so
   * the panel paints at `opacity-0` first — flipping it in the same tick would
   * skip the transition entirely and the tooltip would just appear.
   */
  fadeIn(): void {
    requestAnimationFrame(() => {
      this.visible.set(true);
      this.changeDetectorRef.markForCheck();
    });
  }
}
