import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { ILoginDetails } from 'src/app/modules/auth/model/login';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { Utils } from 'src/app/data/utils';
import { RecaptchaService } from 'src/app/core/services/recaptcha.service';
import { ILoginPayload } from 'src/app/models/user';
import { NgOptimizedImage } from '@angular/common';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { DeleteModalComponent } from '../../../account-closing/modals/delete-modal/delete-modal.component';
import { BrowserTokenService } from 'src/app/core/services/browser-token.service';

@Component({
  selector: 'app-restore-acccount',
  templateUrl: './restore-acccount.component.html',
  styleUrls: ['./restore-acccount.component.scss'],
  standalone: true,
  imports: [CommonButtonV35Component, NgOptimizedImage]
})
export class RestoreAcccountComponent implements OnInit, OnDestroy {
  private recaptchaService = inject(RecaptchaService);
  private dialog = inject(MatDialog);
  private authDataService = inject(AuthDataService);
  private authService = inject(AuthService);
  private browserTokenService = inject(BrowserTokenService);
  private localStorageService = inject(LocalStorageService);
  private appSettingsService = inject(AppSettingsService);
  private router = inject(Router);

  appConfig: IAppConfig;
  subscriptions: Subscription[] = [];
  restoreDate: string;
  recaptchaToken = '';
  showLogoutBtn = signal(false);
  isRestoreAccount = signal(false);

  ngOnInit(): void {
    this.loadAppSettings();
    this.restoreDate = this.localStorageService.getItem('restore-date') || '';
    this.getBrowserAuthToken();
    Utils.showRecaptcheBadge();
  }

  @HostListener('window:popstate', ['$event'])
  onPopState() {
    this.localStorageService.clearLocalStorage();
    this.router.navigateByUrl('/login');
  }

  loadAppSettings(): void {
    this.subscriptions.push(
      this.appSettingsService.appConfig$.subscribe(
        (config: IAppConfig | null) => {
          if (config) {
            this.appConfig = config;
          }
        }
      )
    );
  }

  //= ==============cancel deletion=============
  cancelDeletion() {
    const dialogRef = this.dialog.open(DeleteModalComponent, {
      maxWidth: '470px',
      width: '93%',
      autoFocus: false,
      disableClose: true,
      data: { type: 'restore' }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.isRestoreAccount.set(true);
        this.onLogin(res);
      }
    });
  }

  onLogin(loginBody: ILoginPayload) {
    const doHttpRequest = () => {
      const payload = {
        ...loginBody,
        recaptcha: this.recaptchaToken
      };
      this.subscriptions.push(
        this.authService
          .login(payload)
          .pipe(
            finalize(() => {
              this.isRestoreAccount.set(false);
            })
          )
          .subscribe((res: ILoginDetails) => {
            if (res.success) {
              this.authDataService.afterLogin(res, '', '', undefined, 'email', loginBody.username);
            }
          })
      );
    };
    this.subscriptions.push(
      this.recaptchaService.recaptchaToken.subscribe(
        (res: string | undefined) => {
          this.recaptchaToken = res as string;
          doHttpRequest();
        }
      )
    );
  }

  confirmDeletetion() {
    if (!this.showLogoutBtn()) {
      this.showLogoutBtn.set(true);
    } else {
      this.localStorageService.clearLocalStorage();
      this.router.navigateByUrl('/login');
    }
  }

  getBrowserAuthToken(): void {
    this.browserTokenService.refresh();
  }

  onGoToWebsite(): void {
    window.open(StaticWhiteLabelConditions.website);
  }

  ngOnDestroy(): void {
    Utils.showRecaptcheBadge(false);
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
