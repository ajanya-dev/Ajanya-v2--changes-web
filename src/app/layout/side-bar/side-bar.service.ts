import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SideBarService {
  private mobileSlide = new BehaviorSubject<any>(false);

  clickOnVirtualCard = new Subject<boolean>();

  getMobileMenu() {
    return this.mobileSlide;
  }

  setMobileMenu(val: any) {
    this.mobileSlide.next(val);
  }
}
