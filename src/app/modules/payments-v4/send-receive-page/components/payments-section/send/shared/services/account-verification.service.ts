import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, map, of, switchMap, Observable } from 'rxjs';

import type { IGettingStartedAPI } from 'src/app/models/getting-started';
import type { IHeaderData } from 'src/app/layout/model/header';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { EmailPhoneVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/email-phone-verification-modal-v4/email-phone-verification-modal-v4.component';
import { BusinessVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/business-verification-modal-v4/business-verification-modal-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { SendReceivePageService } from '../../../../../services/send-receive-page.service';

/**
 * Where this account stands with KYC, KYB and its email/phone confirmation. Card is the
 * one source the *account* has to be cleared for before it will move money.
 */
@Injectable()
export class AccountVerificationService {
  private header = inject(HeaderService);
  private userProfile = inject(UserProfileService);
  private gettingStarted = inject(GettingStartedService);
  private localStorage = inject(LocalStorageService);
  private page = inject(SendReceivePageService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private alert = inject(V4AlertService);
  private persona = inject(PersonaHelperService);

  /** `gettingStartedData.kybStatus` — 0: not started, 1: in review, 2: approved, 3: failed. */
  readonly userKybStatus = signal<number | null>(null);

  /** Raw email *and* phone confirmation, gated at submit before a payment goes out. */
  readonly isEmailPhoneVerified = signal(false);

  start(): void {
    this.readGettingStarted();
    this.watchGettingStarted();
    this.watchHeaderAndProfile();
  }

  /** The KYC/KYB statuses come from the cached getting-started payload, not an API. */
  private readGettingStarted(): void {
    const data = this.localStorage.getItem(
      'gettingStartedData'
    ) as IGettingStartedAPI | null;

    this.userKybStatus.set(data?.kybStatus ?? null);
  }

  /** The payload is refreshed elsewhere on the page; adopt each new answer. */
  private watchGettingStarted(): void {
    this.gettingStarted.gettingStartedData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.readGettingStarted());
  }

  /** Only accounts flagged as new for card KYC must confirm email and phone. */
  private watchHeaderAndProfile(): void {
    combineLatest([
      // eslint-disable-next-line no-underscore-dangle
      this.header._headerData,
      this.userProfile.UserVerification$
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([headerData, verification]) => {
        const header = headerData as IHeaderData;
        const confirmed =
          verification?.email_verified === 1 &&
          verification?.phone_verified === 1;

        this.isEmailPhoneVerified.set(confirmed);
        this.page.cardMaintenanceMessage.set(
          header?.cardPaymentMaintananceMessage ?? ''
        );
      });
  }

  openEmailPhoneVerificationModal(): Observable<boolean> {
    const dialogRef = this.dialog.open(EmailPhoneVerificationModalV4Component, {
      width: '550px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });
  
    return dialogRef.afterClosed().pipe(
      takeUntilDestroyed(this.destroyRef),
      map((result: { emailVerified: boolean; phoneVerified: boolean } | undefined) => {
        const isVerified = !!(result?.emailVerified && result?.phoneVerified);
        if (isVerified) {
          this.getGettingStartedData();
        }
        return isVerified;
      })
    );
  }

  private getGettingStartedData(): void {
    this.gettingStarted
      .getGettingStartedDataApi()
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.localStorage.setItem('gettingStartedData', res.data);
          }
        }
      });
  }

  /**
   * Gate a payment on email/phone then business verification. Returns true when the
   * account is already cleared; otherwise opens the needed flow and calls `resume` on success.
   */
  verifyForPayment(resume: () => void): boolean {
    if (!this.isEmailPhoneVerified()) {
      const dialogRef = this.alert.warningAlert({
        title: 'Verification Required',
        content:
          'Please verify your phone number to complete this payment.',
        doneMsg: 'Verify Now',
        isOk: true,
        isCancel: true
      });
      dialogRef.afterClosed().subscribe((res) => {
        if(res){
          this.openEmailPhoneVerificationModal().subscribe((verified) => {
            if (verified) {
              this.isEmailPhoneVerified.set(true);
              if (this.ensureBusinessVerified(resume)) {
                resume();
              }
            }
          });
        }

      });
      return false;
    }
    return this.ensureBusinessVerified(resume);
  }

  private ensureBusinessVerified(resume: () => void): boolean {
    const kyb = this.userKybStatus();
    if (kyb === 2 || kyb === 1) {
      return true;
    }
    if (kyb === 3) {
      this.alert.failedAlert({
        title: 'Verification Failed',
        content:
          'Your business verification has failed. Please contact support for further assistance.'
      });
      return false;
    }
    const dialogRef = this.alert.warningAlert({
      title: 'Business Verification Required',
      content:
        'Please complete your business verification to complete this payment.',
      doneMsg: 'Verify Now',
      isOk: true,
      isCancel: true
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.openBusinessVerificationModal().subscribe((verified) => {
          if (verified) {
            this.userKybStatus.set(2);
            resume();
          }
        });
      }
    });
    return false;
  }

  openBusinessVerificationModal(): Observable<boolean> {
    return this.dialog
      .open(BusinessVerificationModalV4Component, {
        width: '448px',
        maxWidth: '95vw',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true
      })
      .afterClosed()
      .pipe(
        switchMap((result: { startVerification: boolean } | undefined) => {
          if (!result?.startVerification) {
            return of(false);
          }
          return this.persona
            .openModal('kyc_kyb', CVSourceType.getting_started_v3)
            .pipe(map((res) => !!res?.data));
        }),
        map((verified) => {
          if (verified) {
            this.getGettingStartedData();
          }
          return verified;
        }),
        takeUntilDestroyed(this.destroyRef)
      );
  }
}
