import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { HeaderService } from '../shared/service/header/header.service';
import { LayoutService } from '../shared/service/layout/layout.service';

@Directive({
  selector: '[appScrollListener]',
  standalone: true
})
export class ScrollListenerDirective {
  private headerService = inject(HeaderService);
  constructor(
    readonly el: ElementRef,
    private layoutService: LayoutService
  ) {}

  @HostListener('scroll', ['$event'])
  onScroll(event: Event) {
    if (this.layoutService.shouldScrollListenerWork.getValue()) {
      const element = this.el.nativeElement;
      const verticalScrollPosition = element.scrollTop;
      if (verticalScrollPosition > 0) {
        this.headerService.isSubHeaderVisible.next({
          hidden: true,
          animation: true
        });
      } else {
        this.headerService.isSubHeaderVisible.next({
          hidden: false,
          animation: true
        });
      }
    }
  }
}
