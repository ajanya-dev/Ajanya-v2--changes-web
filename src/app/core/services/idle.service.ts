import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { debounceTime, fromEvent, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TimeoutModalComponent } from '../../modules/common-components/modals/timeout-modal/timeout-modal.component';
import { TimeoutModalV4Component } from '../../modules/common-components/modals/timeout-modal/timeout-modal-v4.component';
import { AuthService } from '../../shared/service/auth/auth.service';
import { LocalStorageService } from '../../shared/service/storage/local-storage.service';

/**
 * @description Service that handles user idle behavior
 * @class IdleService class
 */
@Injectable({
  providedIn: 'root'
})
export class IdleService {
  private isIdleAfter: number = 60000 * 30; // milli-seconds
  private warningTimer: number = 60000 as const; // milli-seconds
  private timeInterval: number = 60000 * 5; // milli-seconds

  private idleTimeout: ReturnType<typeof setTimeout>;
  private currentSetInterval: ReturnType<typeof setInterval>;
  private timerDialogRef:
    | MatDialogRef<TimeoutModalComponent>
    | MatDialogRef<TimeoutModalV4Component>
    | undefined;

  public isIdle$: Subject<boolean> = new Subject();
  public isIdleForTimeInterval$: Subject<boolean> = new Subject();
  private onInteraction$: Subject<boolean> = new Subject();
  constructor(
    private dialog: MatDialog,
    private localStorageService: LocalStorageService,
    private authService: AuthService
  ) {
    if (environment.env_id === 'staging_dev') return;

    this.onInteraction();

    // Setup events
    fromEvent(document, 'mousemove').subscribe(() => this.onInteraction());
    fromEvent(document, 'touchstart').subscribe(() => this.onInteraction());
    fromEvent(document, 'keydown').subscribe(() => this.onInteraction());
    this.localStorageService.setItem('sessionTimerOpen', '0');

    /**
     * Event listener for changes in the local storage.
     */
    window.onstorage = () => {
      const sessionTimerOpen =
        this.localStorageService.getItem('sessionTimerOpen');
      if (sessionTimerOpen === '1') {
        this.openTimer();
      } else if (sessionTimerOpen === '0') {
        this.timerDialogRef?.close(true); // Stay connected
      } else if (sessionTimerOpen === '-1') {
        // Indirect Logout
        this.timerDialogRef?.close(false);
      }
    };

    this.setSessionTimer();
    this.runForEveryTimeInterval();
  }

  /**
   * Called when there is user interaction.
   * It handles the user interaction events and manages the idle behavior.
   */
  onInteraction() {
    this.onInteraction$.next(true);
  }

  runForEveryTimeInterval() {
    this.onInteraction$.subscribe(() => {
      /**
       * Clears previous setInterval
       */
      if (this.currentSetInterval) {
        clearInterval(this.currentSetInterval);
      }
      this.currentSetInterval = setInterval(() => {
        this.isIdleForTimeInterval$.next(true);
      }, this.timeInterval);
    });
  }

  setSessionTimer() {
    this.onInteraction$.pipe(debounceTime(1000)).subscribe(() => {
      const sessionTimer =
        this.localStorageService.getItem('sessionTimer')?.timestamp;
      const diff = new Date(sessionTimer).getTime() - new Date().getTime(); // milli-seconds

      /**
       * If the difference exceeds the warning timer and the user is logged in, perform a logout action
       */
      if (diff < this.warningTimer * -1 && this.localStorageService.appToken) {
        this.authService.Logout();
        this.localStorageService.clearLocalStorage();
        return;
      }

      clearTimeout(this.idleTimeout);

      /**
       * If the timer dialog is already open or the user is not logged in, return without further action
       */
      if (this.timerDialogRef || !this.localStorageService.appToken) {
        return;
      }

      /**
       * Calculates the timer for the next session expiration.
       */
      const timer = new Date(new Date().getTime() + this.isIdleAfter);
      this.localStorageService.setItem('sessionTimer', { timestamp: timer });
      this.idleTimeout = setTimeout(() => {
        this.checkUserIsIdle();
      }, this.isIdleAfter);
    });
  }

  /**
   * Checks If user idle in all tabs
   */
  checkUserIsIdle() {
    const sessionTimer =
      this.localStorageService.getItem('sessionTimer')?.timestamp;
    const diff = new Date(sessionTimer).getTime() - new Date().getTime(); // milli-seconds
    if (diff < 1) {
      this.openTimer();
    }
  }

  /**
   * Opens the timer dialog.
   * It checks if the timer dialog is already open and if the user is logged in before opening the dialog.
   */
  openTimer() {
    this.localStorageService.setItem('sessionTimerOpen', '1');
    // Don't open if already open OR user is not logged in
    if (this.timerDialogRef || !this.authService.userLoggedIn) {
      return;
    }
    const isV4 =
      this.localStorageService.getItem('isV4LayoutEnabled') === 1;
    this.timerDialogRef = isV4
      ? this.dialog.open(TimeoutModalV4Component, {
          data: { warningTimer: this.warningTimer },
          maxWidth: '430px',
          minWidth: '370px',
          width: '95%',
          disableClose: true,
          panelClass: 'paddingless-modal-rounded'
        })
      : this.dialog.open(TimeoutModalComponent, {
          data: { warningTimer: this.warningTimer },
          maxWidth: '370px',
          minWidth: '370px',
          width: '95%',
          disableClose: true,
          panelClass: 'ocw_alert_wrapper'
        });

    /**
     * Subscribe to the dialog's afterClosed event
     */
    this.timerDialogRef.afterClosed().subscribe((res: boolean) => {
      this.timerDialogRef = undefined;

      /**
       * If the dialog is closed without action and the user is still logged in, emit the isIdle$ event.
       * else trigger the onInteraction method to continue monitoring user interaction
       */
      if (!res && this.authService.userLoggedIn) {
        this.isIdle$.next(true);
      } else {
        this.onInteraction();
      }
    });
  }
}
