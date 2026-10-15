import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Output
} from '@angular/core';

@Directive({
  selector: '[appScrollToEnd]',
  standalone: true
})
export class ScrollToEndDirective {
  @Output() scrollToEnd = new EventEmitter<void>();

  private elementRef = inject(ElementRef);

  /**
   * Whether the bottom has already been announced. `scroll` fires many times
   * for one flick, and the previous version emitted on every one of them while
   * the list sat at the bottom — so a list that had run out went on asking its
   * source for another page, with the loading rows flashing each time. This is
   * `ng-select`'s own `scrollToEnd` contract, which the v3 dropdowns rely on:
   * one event per arrival at the end.
   */
  private announced = false;

  /**
   * The height the bottom was last announced at. A source that answers with
   * more rows makes the content taller, and that is what re-arms the emit —
   * one that answers with nothing leaves it latched.
   */
  private announcedHeight = 0;

  @HostListener('scroll')
  onScroll(): void {
    const element = this.elementRef.nativeElement as HTMLElement;
    const threshold = 2; // px

    // Nothing to scroll: no end to arrive at.
    if (element.scrollHeight <= element.clientHeight) {
      return;
    }

    const atBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + threshold;

    if (!atBottom) {
      this.announced = false;
      return;
    }

    if (this.announced && element.scrollHeight === this.announcedHeight) {
      return;
    }

    this.announced = true;
    this.announcedHeight = element.scrollHeight;
    this.scrollToEnd.emit();
  }
}
