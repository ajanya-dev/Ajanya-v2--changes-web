import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  distinctUntilChanged
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { IHeaderData, IWhatsNewSlider } from 'src/app/layout/model/header';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { UserManagementActions } from 'src/app/modules/store/userManagement/userManagement.actions';
import { Store } from '@ngrx/store';
import { FeatureApplyCouponModalComponent } from 'src/app/modules/refill-credit/modals/feature-apply-coupon-modal/feature-apply-coupon-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { IRewardData } from 'src/app/modules/auth/model/login';
import { BookADemoComponent } from 'src/app/modules/user-support/modals/book-a-demo/book-a-demo.component';
import { EddWarningModalComponent } from 'src/app/modules/compliance-freeze/modals/edd-warning-modal/edd-warning-modal.component';
import { V4EddWarningModalComponent } from 'src/app/modules/compliance-freeze/modals/v4-edd-warning-modal/v4-edd-warning-modal.component';
import { InternationalPaymentWelcomeModalComponent } from 'src/app/modules/user-support/modals/international-payment-welcome-modal/international-payment-welcome-modal.component';
import { CertificationModalComponent } from 'src/app/modules/user-support/modals/complaince-modal/certification-modal/certification-modal.component';
import { InternationalPaymentWelcomeModalV4Component } from 'src/app/modules/user-support/modals/v4/international-payment-welcome-modal-v4/international-payment-welcome-modal-v4.component';
import { CertificationModalV4Component } from 'src/app/modules/user-support/modals/v4/certification-modal-v4/certification-modal-v4.component';
import { BookADemoModalV4Component } from 'src/app/modules/user-support/modals/v4/book-a-demo-modal-v4/book-a-demo-modal-v4.component';
import { InstantDemoWidgetComponent } from 'src/app/modules/user-support/modals/book-a-demo/instant-demo-widget.component';
import { NpsService } from '../nps/nps.service';
import { LocalStorageService } from '../storage/local-storage.service';
import { IApiRes } from '../../../models/api';
import { IntroJsService } from '../introjs/intro-js.service';
import { AlertService } from '../alert/alert.service';
import { V4AlertService } from '../alert/v4-alert.service';

@Injectable({
  providedIn: 'root'
})
export class HeaderService implements OnDestroy {
  private http = inject(HttpClient);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private npsService = inject(NpsService);
  private introJsService = inject(IntroJsService);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);

  ROOT_URL = environment.rootUrl;
  headerValueChanged$ = new BehaviorSubject<boolean>(false);
  notificationValueChanged$ = new BehaviorSubject<boolean>(false);
  headerLoaded$ = new BehaviorSubject<any>([]);
  private openApplyForachModal = new Subject<boolean>();
  _headerData = new BehaviorSubject<false | IHeaderData>(false);
  isSubHeaderVisible = new BehaviorSubject<{
    hidden: boolean;
    animation: boolean;
  }>({ hidden: false, animation: false });
  private modalQueueSubject = new BehaviorSubject<
    { modal: string; wasOpened: boolean }[]
  >([]);
  autoAttachmentSetForECheck = false;
  autoAttachmentSetForCheckMailing = false;
  autoAttachmentSetForAch = false;
  subscription: Subscription[] = [];
  routerEvents = new Subject<RouterEvent>();
  refreshDynamicHeader = new Subject<boolean>();
  refillData: IRewardData | undefined;
  hideNotShowDemoBtn:number = 0;
  isRenewloading = signal<boolean>(false);
  rerurnKybStatus = signal<boolean>(false);
  eddTriggerStatus = signal<boolean>(false);
  kybPersonaVerificationStatus = signal<boolean>(false);
  isHeaderDataLoaded = signal<boolean>(false);
  hasComplianceFreeze = signal<boolean>(false);
  creditCardGatewaySwitchingStatus = signal<1 | 2 | 3 | 4>(1);
  renewClicked$ = new Subject<boolean>();
  isLoggedInAsClient = new BehaviorSubject(false);

  /**
   * @description get modals in the queue.
   */
  get modalQueue$() {
    return this.modalQueueSubject;
  }

  /**
   * @description add modal to the queue.
   * @param modalName : name of modal.
   * @param priority : place the modal ahead of the pending ones (an already
   * opened modal keeps the head slot so `dequeueModal` stays correct).
   */
  enqueueModal(modalName: string, priority = false) {
    const queue = this.modalQueueSubject.getValue();
    if (queue.some((item) => item.modal === modalName)) {
      return;
    }
    const entry = { modal: modalName, wasOpened: false };
    if (!priority) {
      this.modalQueueSubject.next(queue.concat([entry]));
      return;
    }
    const insertAt = queue.length && queue[0].wasOpened ? 1 : 0;
    this.modalQueueSubject.next([
      ...queue.slice(0, insertAt),
      entry,
      ...queue.slice(insertAt)
    ]);
  }

  /**
   * @description Method to get each route event
   * @param modalName : name of modal.
   */
  getRouterEvents() {
    this.subscription.push(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.routerEvents.next(event);
        }
      })
    );
  }

  /**
   * @description update status of already opened modal.
   */
  updateModalStatus() {
    const updatedQueue = this.modalQueueSubject.getValue();
    updatedQueue[0].wasOpened = true;
    this.modalQueueSubject.next(updatedQueue);
  }

  /**
   * @description remove modal from the queue.
   */
  dequeueModal() {
    this.modalQueueSubject.next(this.modalQueueSubject.getValue().slice(1));
  }

  getHeaderValueChanged(): Observable<any> {
    return this.headerValueChanged$;
  }

  /**
   * @description Getting the header value changed
   */
  setHeaderValueChanged(data: boolean): void {
    this.headerValueChanged$.next(data);
  }

  /**
   * @description Getting the value that Changed by home-notification
   */
  getNotificationValueChanged(): Observable<boolean> {
    return this.notificationValueChanged$;
  }

  /**
   * @description Setting the value that changed by home-notification
   * @param isChanged : Notification Count changed or not
   */
  setNotificationValueChanged(isChanged: boolean): void {
    this.notificationValueChanged$.next(isChanged);
  }

  getHeaderLoaded(): Observable<boolean> {
    return this.headerLoaded$;
  }
  setHeaderLoaded(data: boolean) {
    this.headerLoaded$.next(data);
  }

  hearderdata() {
    return this.http.get<any>(`${this.ROOT_URL}/header`);
  }

  headerData(): Observable<IApiRes<IHeaderData>> {
    return this.http.get<IApiRes<IHeaderData>>(`${this.ROOT_URL}/header`);
  }

  // whats-new data(api)
  getSliderDataDetails(): Observable<IApiRes<IWhatsNewSlider[]>> {
    return this.http.get<IApiRes<IWhatsNewSlider[]>>(
      `${this.ROOT_URL}/whats-new`
    );
  }

  /**
   * @description Retrieves the reward details for the user
   */
  refillRewards(): Observable<IApiRes<IRewardData>> {
    return this.http.get<IApiRes<IRewardData>>(
      `${this.ROOT_URL}/refill-credits/rewards`
    );
  }

  /**
   * @description Initiates the process of grabbing a reward for the user
   * @param {string} id - The unique identifier for the reward.
   */
  grabRewards(id: string): Observable<IApiRes<IRewardData>> {
    return this.http.post<IApiRes<IRewardData>>(
      `${this.ROOT_URL}/refill-credits/rewards/${id}/apply`,
      {}
    );
  }

  /** @description for opening the apply ach modal */
  set triggerApplyForachModal(data: boolean) {
    this.openApplyForachModal.next(data);
  }

  get triggerApplyForachModal$(): Observable<boolean> {
    return this.openApplyForachModal.asObservable();
  }

  switchToNewVersion(): void {
    const payloadBody = {
      userId: this.localStorageService.getItem('encryptedUserId') || '',
      enableV3: 1
    };
    this.subscription.push(this.switchVersion(payloadBody).subscribe());
  }

  switchVersion(payloadData: {
    userId: string;
    enableV3: number;
  }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/user-profile/change-layout`,
      payloadData
    );
  }

  /**
   * @description Setter for refresg dynamic header data.
   */
  set onRefreshDynamicHeader(isRefresh: boolean) {
    this.refreshDynamicHeader.next(isRefresh);
  }

  /**
   *@description Getter for refresh dynamic header data.
   *
   * @returns {Observable<boolean>} Returns an observable of type boolean.
   *   If `isV3LayoutEnabled` is true, it returns the observable `refreshDynamicHeader.asObservable()`.
   *   Otherwise, it returns `EMPTY`.
   */
  get onRefreshDynamicHeader(): Observable<boolean> {
    return this.refreshDynamicHeader.asObservable();
  }

  fetchUserVerification() {
    this.store.dispatch(UserManagementActions.loadUserVerification());
  }

  /**
   * @description Retrieves and updates the reward details for the user.
   */
  getRefillRewards(fromCompanySwitch?: boolean) {
    this.subscription.push(
      this.refillRewards().subscribe((res) => {
        if (res.success && res.data?.features?.length) {
          this.refillData = res.data;
          this.localStorageService.setItem('reward', res.data);
          if (fromCompanySwitch) {
            this.openRewardModal();
          }
        }
      })
    );
  }

  /**
   * @description Opens the Feature Coupon Modal.
   */
  openRewardModal() {
    this.enqueueModal('FeatureCouponModal');
    this.subscription.push(
      this.npsService
        .getNPSVal()
        .pipe(distinctUntilChanged())
        .subscribe((res) => {
          this.modalQueue$
            .pipe(distinctUntilChanged())
            .subscribe((modalQueue) => {
              if (
                modalQueue.length &&
                modalQueue[0].modal === 'FeatureCouponModal' &&
                !modalQueue[0].wasOpened &&
                this.refillData &&
                !res
              ) {
                this.updateModalStatus();
                const dialog = this.dialog.open(
                  FeatureApplyCouponModalComponent,
                  {
                    disableClose: true,
                    width: '420px',
                    data: { ...this.refillData, type: 'login' }
                  }
                );
                dialog.afterClosed().subscribe(() => {
                  this.dequeueModal();
                  this.refillData = undefined;
                });
              }
            });
        })
    );
  }

  /** Snapshot of `isV4LayoutEnabled` taken at call time. Avoids reading
   *  localStorage later from inside an async modal-queue subscription, where
   *  the value may have changed after a navigation/login redirect. */
  private isV4LayoutActive(): boolean {
    return (
      this.router.url.startsWith('/v4/') ||
      this.localStorageService.getItem('isV4LayoutEnabled') === 1
    );
  }

  /**
   * @description Open Book Demo modal,
   */
  openDemoModal(pageType: string) {
    const isV4 = this.isV4LayoutActive();
    this.enqueueModal('demoModal');
    this.subscription.push(
      this.modalQueue$.pipe(distinctUntilChanged()).subscribe((modalQueue) => {
        if (
          modalQueue.length &&
          modalQueue[0].modal === 'demoModal' &&
          !modalQueue[0].wasOpened
        ) {
          this.updateModalStatus();
          this.openBookDemoModal(pageType, isV4);
        }
      })
    );
  }

  openCertificationModal() {
    const isV4 = this.isV4LayoutActive();
    this.enqueueModal('certificationModal');
    this.subscription.push(
      this.modalQueue$.pipe(distinctUntilChanged()).subscribe((modalQueue) => {
        if (modalQueue.length && modalQueue[0].modal === 'certificationModal' && !modalQueue[0].wasOpened) {
          this.updateModalStatus();
          this.openCertificationModalComponent(isV4);
        }
      })
    );
  }

  openCertificationModalComponent(isV4 = this.isV4LayoutActive()) {
    const component: ComponentType<unknown> = isV4
      ? CertificationModalV4Component
      : CertificationModalComponent;
    const dialog = this.dialog.open(component, {
      disableClose: true,
      width: '560px',
      panelClass: isV4 ? 'paddingless-modal-rounded' : 'paddingless-modal'
    });

    dialog.afterClosed().subscribe((res) => {
      this.dequeueModal();
      if (res) {
        this.localStorageService.removeItem('showComplianceModal');
      }
    });
  }

  openInternationalPaymentModal() {
    const isV4 = this.isV4LayoutActive();
    this.enqueueModal('internationalPaymentWelcomeModal');
    this.subscription.push(
      this.modalQueue$.pipe(distinctUntilChanged()).subscribe((modalQueue) => {
        if (modalQueue.length && modalQueue[0].modal === 'internationalPaymentWelcomeModal' && !modalQueue[0].wasOpened) {
          this.updateModalStatus();
          this.openInternationalPaymentModalComponent(isV4);
        }
      })
    );
  }

  openInternationalPaymentModalComponent(isV4 = this.isV4LayoutActive()) {
    const component: ComponentType<unknown> = isV4
      ? InternationalPaymentWelcomeModalV4Component
      : InternationalPaymentWelcomeModalComponent;
    const dialog = this.dialog.open(component, {
      disableClose: true,
      width: '450px',
      panelClass: 'paddingless-modal-rounded'
    });

    dialog.afterClosed().subscribe((res) => {
      this.dequeueModal();
      if (res) {
        this.localStorageService.removeItem(
          'showInternationalPaymentWelcomeModal'
        );
      }
    });
  }

  openEddRerunVerificationModal(eddRequestData: { kyb_id: string; edd_inquiry_id: string }, reVerificationId?: string) {
    this.enqueueModal('eddRerunVerificationModal');
    this.subscription.push(
      this.modalQueue$.pipe(distinctUntilChanged()).subscribe((modalQueue) => {
        if (
          modalQueue.length &&
          modalQueue[0].modal === 'eddRerunVerificationModal' &&
          !modalQueue[0].wasOpened
        ) {
          this.updateModalStatus();
          const isV4 = this.isV4LayoutActive();
          const component: ComponentType<unknown> = isV4
            ? V4EddWarningModalComponent
            : EddWarningModalComponent;
          const dialog = this.dialog.open(component, {
            panelClass: 'paddingless-modal-rounded',
            width: '450px',
            disableClose: true,
            data: {businessId: eddRequestData.kyb_id}
          });
          dialog.afterClosed().subscribe(() => {
            this.dequeueModal();
          });
        }
      })
    );
  }

  openBookDemoModal(pageType: string, isV4 = this.isV4LayoutActive()) {
    if(environment.env_id === 'compass') return;
    const component: ComponentType<unknown> = isV4
    ? BookADemoModalV4Component
    : BookADemoComponent;
    const dialog = this.dialog.open(component, {
      maxWidth: isV4 ? '780px' : '800px',
      width: isV4 ? '85%' : '100%',
      data: { page: pageType, hideNotShowDemoBtn: this.hideNotShowDemoBtn },
      disableClose: true,
      panelClass: isV4 ? 'paddingless-modal-rounded' : 'paddingless-modal'
    });
    dialog.afterClosed().subscribe((res) => {
      this.dequeueModal();
      this.introJsService.triggerIntroTour(false, this.router);
      if (res) {
        this.localStorageService.removeItem('isShowDemo');
      }
    });
  }

  /**
   * @description Continues from the Book-a-Demo modal into the instant-demo
   * widget as a first-class member of the modal queue. We slot the widget entry
   * right behind the current front (the Book-a-Demo entry, which is dequeued
   * when that modal closes) and open it from a front-gated subscriber — exactly
   * like every other queued modal. Because the widget only opens once it is the
   * front entry, no other queued modal (compliance, reward, etc.) can surface
   * on top of it; they open only after the widget is closed and dequeued.
   */
  openInstantDemoFromBookDemo(isV4 = this.isV4LayoutActive()) {
    const queue = this.modalQueueSubject.getValue();
    if (!queue.some((item) => item.modal === 'instantDemoWidget')) {
      this.modalQueueSubject.next([
        ...queue.slice(0, 1),
        { modal: 'instantDemoWidget', wasOpened: false },
        ...queue.slice(1)
      ]);
    }

    this.subscription.push(
      this.modalQueue$.pipe(distinctUntilChanged()).subscribe((modalQueue) => {
        if (
          modalQueue.length &&
          modalQueue[0].modal === 'instantDemoWidget' &&
          !modalQueue[0].wasOpened
        ) {
          this.updateModalStatus();
          const dialog = this.dialog.open(InstantDemoWidgetComponent, {
            width: '100%',
            maxWidth: '440px',
            panelClass: isV4 ? 'paddingless-modal-rounded' : 'paddingless-modal',
            disableClose: true,
            data: { autoStart: true }
          });
          dialog.afterClosed().subscribe((res) => {
            this.dequeueModal();
            if(res){
              const currentAlert = isV4 ? this.v4AlertService : this.alertService;
              currentAlert.infoAlert({
                title:'Your instant demo timed out',
                content:`This instant demo session expired before it could start. You can request a new instant demo now, or schedule one at a time that works for you.`,
                doneMsg:'Request again',
                cancelMsg:'Not Now',
                isCancel:true
              }).afterClosed().subscribe((resp) => {
                if(resp){
                  this.openBookDemoModal('home');
                }
              });
            }
          });
        }
      })
    );
  }

  setQuickNavFavorites(data: number[]): Observable<{success: boolean,message:string}|{sucess:boolean,errorMsg:string}> {
    return this.http.post<{success: boolean,message:string}|{sucess:boolean,errorMsg:string}>(`${this.ROOT_URL}/zil-payments/favourite`, {favoritable_ids:data});
  }

  setRerunKybStatus(data: boolean): void {
    this.rerurnKybStatus.set(data);
  }

  setEddTriggerStatus(data: boolean): void {
    this.eddTriggerStatus.set(data);
  }

  setKybPersonaVerificationStatus(data: boolean): void {
    this.kybPersonaVerificationStatus.set(data);
  }

  setHasComplianceFreeze(data: boolean): void {
    this.hasComplianceFreeze.set(data);
  }

  setCreditCardGatewaySwitchingStatus(data: 1 | 2 | 3 | 4): void {
    this.creditCardGatewaySwitchingStatus.set(data);
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
