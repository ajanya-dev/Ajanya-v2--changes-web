import { IPusherEvent } from 'src/app/modules/auth/model/pusher';
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { PusherService } from 'src/app/core/services/pusher.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { ILoginDetails } from 'src/app/modules/auth/model/login';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';

@Component({
  selector: 'app-ip-security-notify',
  templateUrl: './ip-security-notify.component.html',
  styleUrls: ['./ip-security-notify.component.scss'],
  standalone: true
})
export class IpSecurityNotifyComponent implements OnInit, OnDestroy {
  @Input() ipSecurityCompData: { token: string };
  @Output() ipSecurityPageEvent = new EventEmitter<{
    close?: boolean;
    verifiedDetails?: any;
  }>();

  subscriptions: Subscription[] = [];
  appConfig: IAppConfig;
  userEmail: string;
  userToken: string;
  returnUrl: string;
  returnUrlIfCompanyZero: string;

  constructor(
    private _appSettingService: AppSettingsService,
    private _pusherService: PusherService,
    private _authService: AuthService,
    private _alertService: AlertService,
    private route: ActivatedRoute,
    private router: Router,
    private _authDataService: AuthDataService,
    private _localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.getData();
    this.loadAppSettings();
    this.getPusherEvent();
  }

  getData(): void {
    this.userToken = this.route.snapshot.params.key;
    this.returnUrl =
      this.route.snapshot.queryParams.returnUrl || '/manage/company_management';
    this.returnUrlIfCompanyZero =
      this.route.snapshot.queryParams.returnUrlIfCompanyZero ||
      'manage/company_management';
    const email = this._localStorageService.getItem('email')!;

    const starts = '******************';
    const splited = email?.split('@');
    let toReplace: string;
    if (splited?.length) {
      toReplace = splited[0].substring(2, splited[0].length);
    }
    this.userEmail = email.replace(
      toReplace!,
      starts.slice(0, toReplace!.length)
    );
  }

  loadAppSettings(): void {
    this.subscriptions.push(
      this._appSettingService.appConfig$.subscribe(
        (config: IAppConfig | null) => {
          if (config) {
            this.appConfig = config;
          }
        }
      )
    );
  }

  getPusherEvent(): void {
    const channelName = `device-verification-channel-${this.userToken}`;
    const eventName = 'device-verification-event';
    this._pusherService
      .getEvent(channelName, eventName)
      .subscribe((res: IPusherEvent) => {
        if (res.event.data?.temp_token) {
          this.verifyUserToken(res.event.data?.temp_token);
        } else {
          this._alertService.warningAlert({
            content: res.event.data.message,
            close: true,
            timeout: 2550
          });
          setTimeout(() => {
            this.onClose();
          }, 2300);
        }
        this._pusherService.unsubscribePusher(channelName);
      });
  }

  verifyUserToken(token: string): void {
    this.subscriptions.push(
      this._authService.verifyToken(token).subscribe((res: ILoginDetails) => {
        if (res.success) {
          this._alertService.successAlert({
            content: 'Sign in attempt was approved.'
          });
          this._authDataService.afterLogin(
            res,
            this.returnUrlIfCompanyZero,
            this.returnUrl,
            undefined,
            'email',
            res.email
          );
        }
      })
    );
  }

  onClose(): void {
    this.router.navigate(['/login']);
  }

  privacy(): void {
    window.open(StaticWhiteLabelConditions.termsAndConditions, '_blank');
  }

  help(): void {
    window.open(StaticWhiteLabelConditions.zohoSupportChat!, '_blank');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s: Subscription) => s.unsubscribe());
  }
}
