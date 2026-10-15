import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { shakeElement } from './shake';

@Directive({
  selector: '[spShakeOn]',
  standalone: true
})
export class SpShakeOnDirective {
  readonly spShakeOn = input<unknown>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private previous: unknown;
  private primed = false;

  constructor() {
    effect(() => {
      const value = this.spShakeOn();
      const changed = value !== this.previous;
      this.previous = value;
      if (!this.primed) {
        this.primed = true;
        return;
      }
      if (!changed || !value) return;
      shakeElement(this.host.nativeElement as HTMLElement);
    });
  }
}
