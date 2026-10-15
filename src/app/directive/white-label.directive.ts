import { Directive, inject, ElementRef, OnInit, Input } from '@angular/core';
import { IDynamicWhiteLabelFlags } from '../modules/dynamic-white-label/model/dynamic-white-label.model';
import { DynamicWhiteLabelService } from '../modules/dynamic-white-label/service/dynamic-white-label.service';

/**
 * `WhiteLabelDirective` is a directive that checks a given flag and hides the host element if the flag check fails.
 *
 * @example
 * @description shownIf - displays the element if the flag is true.
 * ```html
 * <div appWhiteLabel shownIf="flagName"></div>
 * ```
 * @description hiddenIf - hides the element if the flag is true.
 *  * ```html
 * <div appWhiteLabel hiddenIf="flagName"></div>
 * ```
 *
 * @directive
 * @name WhiteLabelDirective
 * @description A directive to conditionally display an element based on a flag value.
 */
@Directive({
  selector: '[appWhiteLabel]',
  standalone: true
})
export class WhiteLabelDirective implements OnInit {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private elementRef = inject(ElementRef);

  @Input() shownIf: keyof IDynamicWhiteLabelFlags;
  @Input() hiddenIf: keyof IDynamicWhiteLabelFlags;

  ngOnInit() {
    if (this.shownIf) {
      this.checkFlag(this.shownIf, false);
    } else if (this.hiddenIf) {
      this.checkFlag(this.hiddenIf, true);
    }
  }

  /**
   * @description A function that accepts a flag name. It checks the flag and hides the host element if the flag check fails.
   * @param {keyof IDynamicWhiteLabelFlags} flagToCheck - The name of the flag to check.
   * @param isFlagDisabledCheck - Usually if the flag is true, the element is shown. But if this parameter is true, then element is hidden if the flag is true.
   */
  checkFlag(
    flagToCheck: keyof IDynamicWhiteLabelFlags,
    isFlagDisabledCheck: boolean
  ) {
    let flagValue =
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(flagToCheck);
    if (isFlagDisabledCheck) {
      flagValue = !flagValue;
    }
    if (!flagValue) {
      this.elementRef.nativeElement.style.display = 'none';
    }
  }
}
