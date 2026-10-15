import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class CommonLayoutToggleV4Service {
  toggle = signal<boolean>(false);
  gridView = signal<boolean>(true);
  isSmallScreen = signal<boolean>(false);
  showMobileDetail = signal<boolean>(false);
  hideListPanel = signal<boolean>(false);

  toggleChange$ = toObservable(this.toggle);
  gridViewChange$ = toObservable(this.gridView);

  navigateToDetail(): void {
    if (this.isSmallScreen()) {
      this.showMobileDetail.set(true);
    }
  }

  navigateToList(): void {
    this.showMobileDetail.set(false);
  }
}
