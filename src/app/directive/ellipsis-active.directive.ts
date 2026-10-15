import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  inject
} from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appEllipsisActive]',
  exportAs: 'ellipsisElement'
})
/**
 * @description Used to check whether ellipsis is shown on a div or if the content overflows the div.
 * Can be used to show tooltip only when ellipsis is show. Add below given code to the element to show tooltip only when ellipsis is shown.
 *  `appEllipsisActive
 *   #htmlElement = 'ellipsisElement'
 *   [matTooltipDisabled] = "!htmlElement.ellipsisActive"`
 */
export class EllipsisActiveDirective {
  private elementRef = inject(ElementRef);

  ellipsisActive =
    this.elementRef.nativeElement.offsetWidth <
    this.elementRef.nativeElement.scrollWidth;

  // The truncated text is the only thing that carries a tooltip, so the pointer
  // is what tells the user there is more to read behind it.
  @HostBinding('style.cursor') get cursor(): string | null {
    return this.ellipsisActive ? 'pointer' : null;
  }

  @HostListener('mouseover') onEnter() {
    const element = this.elementRef.nativeElement;
    this.ellipsisActive = element.offsetWidth < element.scrollWidth;
  }
}
