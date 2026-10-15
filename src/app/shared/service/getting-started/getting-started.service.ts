import { OnDestroy, Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import {
  IGettingStartedAPI,
  IGettingStartedData,
  IGettingStartedProgressBar
} from 'src/app/models/getting-started';
import { GettingStarted } from 'src/app/data/data/getting-started';
import { tap, finalize } from 'rxjs/operators';
import { IApiRes } from 'src/app/models/api';
import { MatDialog } from '@angular/material/dialog';
import { HeaderService } from '../header/header.service';
import { TryNewVersionV3AlertComponent } from '../../modal/try-new-version-v3-alert/try-new-version-v3-alert.component';
import { UserProfileService } from '../user/user-profile.service';
import { LocalStorageService } from '../storage/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class GettingStartedService implements OnDestroy {
  private http = inject(HttpClient);
  private userProfileService = inject(UserProfileService);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);

  gettingStartedData: IGettingStartedData = {
    isEmailVerificationDone: false,
    isPhoneVerificationDone: false,
    isBankAccountLinkingDone: false,
    isBankAccountVerificationDone: false,
    isFirstPayeeDone: false,
    isFirstPaymentDone: false,
    isKycStatusDone: false,
    isKybStatusDone: false
  };

  gettingStartedProgressBarData: IGettingStartedProgressBar = {
    gettingStartedStatusCode: 0,
    gettingStartedState: 'Getting Started',
    gettingStartedProgress: 0,
    isGettingStartedEnabled: false
  };

  gettingStartedJsonLogic = GettingStarted.gettingStartedLogic();
  private gettingStartedDataSubject = new BehaviorSubject<IGettingStartedData>(
    this.gettingStartedData
  );
  private gettingStartedUpdatedDataSubjectHeader = new Subject<number>();
  subscriptions: Subscription[] = [];
  isLoaderActivated: boolean;
  gettingStartedData$ = new BehaviorSubject<IGettingStartedAPI | false>(false);

  /**
   *  Should be true initially
   */
  gettingStartedLoading = new BehaviorSubject(true);

  ROOT_URL = environment.rootUrl;

  dataLoader() {
    this.isLoaderActivated = true;
  }

  getGettingStartedData() {
    this.gettingStartedLoading.next(true);
    this.isLoaderActivated = false;
    this.subscriptions.push(
      this.getGettingStartedDataApi()
        .pipe(
          tap(() => this.dataLoader()),
          finalize(() => this.gettingStartedLoading.next(false))
        )
        .subscribe((res) => {
          const gettingStartedData = res.data;

          if (res) {
            this.localStorageService.setItem('gettingStartedData', res.data);
            this.localStorageService.removeItem('clearedGettingStartedData');
            this.gettingStartedData$.next(res.data);
          }

          if (gettingStartedData.bankAccount === 1) {
            this.gettingStartedData.isBankAccountLinkingDone = true;
          }
          if (gettingStartedData.bankAccount === 2) {
            this.gettingStartedData.isBankAccountLinkingDone = true;
            this.gettingStartedData.isBankAccountVerificationDone = true;
          }
          if (gettingStartedData.payee === 1) {
            this.gettingStartedData.isFirstPayeeDone = true;
          }
          if (gettingStartedData.payment === 1) {
            this.gettingStartedData.isFirstPaymentDone = true;
          }
          if (gettingStartedData.kycStatus !== null) {
            this.gettingStartedData.isKycStatusDone = true;
          }
          if (gettingStartedData.kybStatus !== 0) {
            this.gettingStartedData.isKybStatusDone = true;
          }

          this.checkPhoneAndEmailVerification();
          if (
            this.localStorageService.getItem('isV4LayoutEnabled') === 0 && this.localStorageService.getItem('userPlugins')?.length === 0 &&
            this.localStorageService.getItem('versionSwitcherShown')!==1 && this.localStorageService.getItem('showNewUiSwitchModal')
          ) {
            this.headerService.enqueueModal('TryNewVersionV3AlertComponent');
            this.subscriptions.push(
              this.headerService.modalQueue$.subscribe((modalQueue) => {
                if (
                  modalQueue.length &&
                  modalQueue[0].modal === 'TryNewVersionV3AlertComponent' &&
                  !modalQueue[0].wasOpened
                ) {
                  this.headerService.updateModalStatus();
                  this.localStorageService.setItem('versionSwitcherShown',1);
                  const dialog = this.dialog.open(
                    TryNewVersionV3AlertComponent,
                    {
                      panelClass: 'paddingless-modal-rounded',
                      width: '672px',
                      maxWidth: '95vw',
                      disableClose: true
                    }
                  );
                  dialog.afterClosed().subscribe(() => {
                    this.headerService.dequeueModal();
                  });
                }
              })
            );
          }
        })
    );
  }

  checkPhoneAndEmailVerification() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        if (!res) return;

        if (res.email_verified === 1) {
          this.gettingStartedData.isEmailVerificationDone = true;
        }
        if (res.phone_verified === 1) {
          this.gettingStartedData.isPhoneVerificationDone = true;
        }

        if (
          this.localStorageService.getItem('clearedGettingStartedData') ===
          'logged-out'
        ) {
          this.gettingStartedProgressBarData.isGettingStartedEnabled = false;
        } else {
          this.gettingStartedProgressBarProcess();
        }
      })
    );
  }

  updateGettingStartedData() {
    this.subscriptions.push(
      this.updatedGettingStartedData$.subscribe((res: number) => {
        // Making Values True
        if (res === 0) {
          this.gettingStartedData.isEmailVerificationDone = true;
        } else if (res === 1) {
          this.gettingStartedData.isPhoneVerificationDone = true;
        } else if (res === 2) {
          this.gettingStartedData.isBankAccountLinkingDone = true;
        } else if (res === 3) {
          this.gettingStartedData.isBankAccountVerificationDone = true;
        } else if (res === 4) {
          this.gettingStartedData.isFirstPayeeDone = true;
        } else if (res === 5) {
          this.gettingStartedData.isFirstPaymentDone = true;
        } else if (res === 6) {
          this.gettingStartedData.isKycStatusDone = true;
        } else if (res === 7) {
          this.gettingStartedData.isKybStatusDone = true;
        } else {
          // Unknown number type
          return;
        }

        this.gettingStartedProgressBarProcess();
      })
    );
  }

  gettingStartedProgressBarProcess() {
    if (
      !this.gettingStartedData.isEmailVerificationDone &&
      !this.gettingStartedData.isPhoneVerificationDone
    ) {
      this.gettingStartedProgressBarData = this.gettingStartedJsonLogic[1];
    } else if (
      !this.gettingStartedData.isEmailVerificationDone &&
      this.gettingStartedData.isPhoneVerificationDone
    ) {
      this.gettingStartedProgressBarData = this.gettingStartedJsonLogic[2];
    } else if (
      this.gettingStartedData.isEmailVerificationDone &&
      !this.gettingStartedData.isPhoneVerificationDone
    ) {
      this.gettingStartedProgressBarData = this.gettingStartedJsonLogic[3];
    } else if (
      !this.gettingStartedData.isBankAccountLinkingDone &&
      this.gettingStartedData.isPhoneVerificationDone &&
      this.gettingStartedData.isEmailVerificationDone
    ) {
      this.gettingStartedProgressBarData = this.gettingStartedJsonLogic[4];
    } else if (
      this.gettingStartedData.isBankAccountLinkingDone &&
      !this.gettingStartedData.isBankAccountVerificationDone
    ) {
      this.gettingStartedProgressBarData = this.gettingStartedJsonLogic[5];
    } else if (
      !this.gettingStartedData.isFirstPayeeDone &&
      this.gettingStartedData.isBankAccountVerificationDone
    ) {
      this.gettingStartedProgressBarData = this.gettingStartedJsonLogic[6];
    } else if (
      !this.gettingStartedData.isFirstPaymentDone &&
      this.gettingStartedData.isFirstPayeeDone
    ) {
      this.gettingStartedProgressBarData = this.gettingStartedJsonLogic[7];
    } else if (
      !this.gettingStartedData.isKycStatusDone &&
      !this.gettingStartedData.isKybStatusDone
    ) {
      this.gettingStartedProgressBarData = this.gettingStartedJsonLogic[8];
    } else if (!this.gettingStartedData.isKybStatusDone) {
      this.gettingStartedProgressBarData = this.gettingStartedJsonLogic[9];
    } else {
      this.gettingStartedProgressBarData = this.gettingStartedJsonLogic[10];
    }

    this.initialGettingStartedData = this.gettingStartedData;
  }

  resetGettingStartedData() {
    this.gettingStartedData = {
      isEmailVerificationDone: false,
      isPhoneVerificationDone: false,
      isBankAccountLinkingDone: false,
      isBankAccountVerificationDone: false,
      isFirstPayeeDone: false,
      isFirstPaymentDone: false,
      isKycStatusDone: false,
      isKybStatusDone: false
    };
    this.gettingStartedProgressBarData = {
      gettingStartedStatusCode: 0,
      gettingStartedState: '',
      gettingStartedProgress: 0,
      isGettingStartedEnabled: false
    };

    this.localStorageService.setItem('clearedGettingStartedData', 'logged-out');
  }

  getGettingStartedDataApi(): Observable<IApiRes<IGettingStartedAPI>> {
    return this.http.get<IApiRes<IGettingStartedAPI>>(
      `${this.ROOT_URL}/getting-started/`
    );
  }

  set initialGettingStartedData(data: IGettingStartedData) {
    this.gettingStartedDataSubject.next(data);
  }

  get initialGettingStartedData$(): Observable<IGettingStartedData> {
    return this.gettingStartedDataSubject.asObservable();
  }

  initialGettingStartedDataAgain(): Observable<IGettingStartedData> {
    return this.gettingStartedDataSubject.asObservable();
  }

  set updatedGettingStartedData(data: number) {
    this.gettingStartedUpdatedDataSubjectHeader.next(data);
  }

  get updatedGettingStartedData$(): Observable<number> {
    return this.gettingStartedUpdatedDataSubjectHeader.asObservable();
  }

  getGettingStarted() {
    return this.gettingStartedData$;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
