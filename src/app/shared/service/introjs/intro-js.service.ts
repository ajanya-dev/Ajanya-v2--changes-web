/* eslint-disable @typescript-eslint/no-explicit-any */
import { OnDestroy, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IntroTour } from 'src/app/data/data/introTour';
import { environment } from 'src/environments/environment';
import { NavigationEnd, Router } from '@angular/router';
import { IApiRes } from 'src/app/models/api';
import introJs from 'intro.js';
import { IntroStep } from 'intro.js/src/core/steps';
import { LocalStorageService } from '../storage/local-storage.service';
import { LayoutService } from '../layout/layout.service';
import { DataTableService } from '../data-table/data-table.service';

const intro = introJs();

interface IIntroItemsModel {
  id: string;
  headerId: string;
  className: string;
  title: string;
  intro: string;
  position: string;
  createdAt: string;
  updatedAt: string;
  orderBy: number;
}

export type TIntroTourPages =
  | 'cheque.checkrecords'
  | 'cheque.create'
  | 'payee.index'
  | '/login'
  | 'manage.home'
  | 'manage.payments-table.index'
  | 'manage.payees'
  | 'manage.cards'
  | 'manage.bank-accounts.index'
  | 'manage.wallet.transactions';

@Injectable({
  providedIn: 'root'
})
export class IntroJsService implements OnDestroy {
  constructor(
    private http: HttpClient,
    private router: Router,
    private localStorageService: LocalStorageService,
    private layoutService: LayoutService,
    private dataTableService: DataTableService
  ) {}

  ROOT_URL = environment.rootUrl;
  subscriptions: Subscription[] = [];
  headerCheckIntro: unknown[] = IntroTour.headerAndCheck();
  showIntroTour = false;
  apiCalled = false;
  currentRoute = '';
  awaited = false;
  introTriggeredRoute: TIntroTourPages[] = [];
  emptyIntroArray = new BehaviorSubject<TIntroTourPages[]>([]);
  introTriggerPages = [
    'cheque.create',
    'payee.index',
    'manage.home',
    'manage.payments-table.index',
    'manage.payees',
    'manage.cards',
    'manage.bank-accounts.index',
    'manage.wallet.transactions'
  ];

  triggerIntroTourFunctionalityOnRouteChanges() {
    this.subscriptions.push(
      this.emptyIntroArray.subscribe((res) => {
        this.introTriggeredRoute = res;
      })
    );
    if (
      this.localStorageService.appToken &&
      this.localStorageService.getItem('isShowDemo') === null
    ) {
      this.subscriptions.push(
        this.router.events.subscribe({
          next: (res) => {
            if (res instanceof NavigationEnd) {
              const introTourRoute = this.createRoute(res);
              if (this.introTriggerPages.includes(introTourRoute)) {
                if (!this.introTriggeredRoute.includes(introTourRoute)) {
                  this.introTriggeredRoute.push(introTourRoute);
                  this.triggerIntroTour(false, res);
                }
              }
            }
          }
        })
      );
      }
  }

  createRoute(route?: { url: string }): TIntroTourPages {
    const splitRoute = route?.url.split('/');
    splitRoute?.splice(0, 2);
    const introTourRoute: TIntroTourPages = splitRoute?.join(
      '.'
    ) as TIntroTourPages;
    return introTourRoute;
  }

  triggerIntroTour(
    manuallyOverrideIntroTour = false,
    route?: { url: string } | undefined
  ) {
    this.awaited = true;
    const introTourRoute: TIntroTourPages = this.createRoute(route);
    this.currentRoute = introTourRoute;
    if (
      this.localStorageService.appToken &&
      this.localStorageService.getItem('isShowDemo') === null
    ) {
      this.subscriptions.push(
        this.userIntroInit(introTourRoute).subscribe((res) => {
          if (res.data.introStatus === 0) {
            this.showIntroTour = true;
            if (!this.apiCalled) {
              this.apiCalled = true;
              this.introTourExecution(introTourRoute, manuallyOverrideIntroTour);
            }
          }
        })
      );
    }

    if (manuallyOverrideIntroTour) {
      this.apiCalled = true;
      this.introTourExecution(introTourRoute, true);
    }
  }

  introTourExecution(
    introTourRoute: TIntroTourPages,
    manuallyOverrideIntroTour: boolean
  ) {
    let defaultTriggerForRoute: TIntroTourPages = 'manage.home';

    if (!introTourRoute) {
      this.router.navigateByUrl('/manage/home');
    } else {
      defaultTriggerForRoute = introTourRoute;
    }
    if (this.showIntroTour || manuallyOverrideIntroTour) {
      const introRoutes = this.localStorageService.getItem('intro-routes');
      if (introRoutes) {
        this.introTourRoute(defaultTriggerForRoute, manuallyOverrideIntroTour);
      } else {
        this.subscriptions.push(
          this.userIntroRoute().subscribe((resp) => {
            if (resp?.success) {
              const result = resp?.data;
              this.localStorageService.setItem('intro-routes', result);
              this.introTourRoute(
                defaultTriggerForRoute,
                manuallyOverrideIntroTour
              );
            }
          })
        );
      }
    }
  }

  //= ============= CALLING INTROFUN

  IntroJsFun(value: Partial<IntroStep>[]): void {
    if (window.matchMedia('(min-width: 1300px)').matches) {
      this.queryEl('html').style.overflow = 'hidden';
      intro
        .setOptions({
          steps: value,
          disableInteraction: false,
          exitOnOverlayClick: false,
          keyboardNavigation: true,
          scrollToElement: true,
          scrollTo: 'element',
          scrollPadding: 0
        })
        .onbeforeexit(() => {
          this.queryEl('html').style.overflow = 'auto';
          this.layoutService.shouldScrollListenerWork.next(true);
          this.dataTableService.paginationSizeController.next(50);
          this.apiCalled = false;
          return true;
        })
        .start();
    }
  }

  //= ============= INRO TOUR ROUT CHECKING
  introTourRoute(route: TIntroTourPages, manuallyTriggered: boolean): void {
    this.layoutService.shouldScrollListenerWork.next(false);
    this.dataTableService.paginationSizeController.next(15);
    const IntroRouts = this.localStorageService.getItem('intro-routes');
    const routeArray = IntroRouts.filter(
      (item: { id: string; routes: string; section: string }) =>
        item.routes === route
    );
    if (routeArray.length) {
      const result = IntroRouts;
      result.forEach((item: { routes: TIntroTourPages }) => {
        if (item.routes === route) {
          if (
            (this.showIntroTour || manuallyTriggered) &&
            !environment.isItWhiteLabel
          ) {
            this.queryEl('html').scrollTop = 0;
            this.queryEl('html').style.pointerEvents = 'none';

            this.subscriptions.push(
              this.userIntroDetails(route)
                .pipe(
                  finalize(() =>
                    setTimeout(() => {
                      this.queryEl('html').style.pointerEvents = 'auto';
                    }, 1000)
                  )
                )
                .subscribe((resp) => {
                  this.queryEl('html').scrollTop = 0;
                  if (resp?.success) {
                    const resultData: IIntroItemsModel[] = resp?.data;
                    resultData?.sort((a, b) => a.orderBy - b.orderBy);
                    resultData.forEach((item: any) => {
                      this.headerCheckIntro.push({
                        title: item.title,
                        element: `.${item.className}`,
                        intro: item.intro,
                        position: item.position,
                        orderBy: item.orderBy
                      });
                    });

                    this.IntroJsFun(
                      this.headerCheckIntro as Partial<IntroStep>[]
                    );
                    this.headerCheckIntro = [];
                  }
                })
            );
          }
        }
      });
    } else {
      this.apiCalled = false;
      this.router.navigateByUrl('/manage/home');
      this.introTourExecution('manage.home', true);
    }
  }

  //= ==========> Calling API Service ============ //
  userIntroInit(
    route: TIntroTourPages
  ): Observable<IApiRes<{ introStatus: 0 | 1 }>> {
    return this.http.get<IApiRes<{ introStatus: 0 | 1 }>>(
      `${this.ROOT_URL}/user-intro/?route=${route}`
    );
  }

  userIntroDetails(route: TIntroTourPages): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/user-intro/details/?route=${route}`
    );
  }

  userIntroRoute(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/user-intro/routes/`);
  }

  queryEl(el: any) {
    return document.querySelector(el)!;
  }

  ngOnDestroy(): void {
    this.introTriggeredRoute = [];
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
