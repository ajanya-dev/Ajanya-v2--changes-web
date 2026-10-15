import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

@Directive({
  selector: '[appOcwPreventMultiClick]',
  standalone: true
})
export class OcwPreventMultiClickDirective implements OnInit, OnDestroy {
  @Input() throttleTime = 1000;

  @Output() throttledClick = new EventEmitter();

  private clicks = new Subject();
  private subscription: Subscription;

  ngOnInit() {
    this.subscription = this.clicks
      .pipe(throttleTime(this.throttleTime))
      .subscribe((e) => this.emitThrottledClick(e));
  }

  emitThrottledClick(e: any) {
    this.throttledClick.emit(e);
  }

  @HostListener('click', ['$event'])
  clickEvent(event: any) {
    event.preventDefault();
    event.stopPropagation();
    this.clicks.next(event);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
