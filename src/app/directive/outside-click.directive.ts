import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Output
} from '@angular/core';

@Directive({
  selector: '[appOutsideClick]',
  standalone: true
})
export class OutsideClickDirective {
  constructor(private el: ElementRef) {}

  @Output() public clickOutSide = new EventEmitter();

  @HostListener('document:click', ['$event.target'])
  public onClick(target: any) {
    const clcikedInside = this.el.nativeElement.contains(target);

    if (!clcikedInside) {
      this.clickOutSide.emit(target);
    }
  }
}
