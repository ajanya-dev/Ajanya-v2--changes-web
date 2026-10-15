import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  sideBar = new BehaviorSubject<boolean>(false);
  sideBarToggle = new BehaviorSubject<boolean>(false);
  isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  env = environment;
  public isShowUseMobileApp$ = new BehaviorSubject<boolean>(false);
  enableIsShowUseMobileApp = false;
  isProgressBarInvoked = new BehaviorSubject<boolean>(false);
  shouldScrollListenerWork = new BehaviorSubject<boolean>(true);
  private isDisableSideBarAndHeader$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  /**
   * Enables the display of the "Use Mobile App" page.
   */
  enableUseMobileAppPage() {
    this.enableIsShowUseMobileApp = true;
    this.checkScreenWidthAndShowUseMobileApp();
  }

  /**
   * Checks the screen width and updates the visibility of the "Use Mobile App" page accordingly.
   */
  checkScreenWidthAndShowUseMobileApp() {
    if (!this.enableIsShowUseMobileApp) {
      return;
    }
    if (Utils.isMobile() && window.innerWidth < 768) {
      this.isShowUseMobileApp$.next(true);
      return;
    }
    this.isShowUseMobileApp$.next(false);
  }

  getMessage() {
    return this.sideBar;
  }

  setMessage(data: boolean): void {
    this.sideBar.next(data);
  }

  get getToggleValue() {
    return this.sideBarToggle.asObservable;
  }

  setToggleValue(data: boolean): void {
    this.sideBarToggle.next(data);
  }

  setLoading(isloading: boolean): void {
    this.isLoading.next(isloading);
  }

  setDisableLayouts(value: boolean): void {
    this.isDisableSideBarAndHeader$.next(value);
  }

  get disableLayouts$(): Observable<boolean> {
    return this.isDisableSideBarAndHeader$.asObservable();
  }
}
