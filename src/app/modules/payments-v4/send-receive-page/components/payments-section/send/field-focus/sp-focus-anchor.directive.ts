import { Directive, ElementRef, inject, DestroyRef } from '@angular/core';
import { FieldFocusRegistry } from './field-focus.registry';

@Directive({
  selector: '[spFocusAnchor], [data-field]',
  standalone: true
})
export class SpFocusAnchorDirective {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly registry = inject(FieldFocusRegistry);

  constructor() {
    const el = this.host.nativeElement as HTMLElement;
    const key = el.getAttribute('spFocusAnchor') || el.getAttribute('data-field');
    if (!key) return;
    const unregister = this.registry.register(key, el);
    inject(DestroyRef).onDestroy(unregister);
  }
}
