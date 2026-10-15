import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class CommonLayoutToggleService {
  toggle = signal<boolean>(false);

  toggleChange$ = toObservable(this.toggle);
}
