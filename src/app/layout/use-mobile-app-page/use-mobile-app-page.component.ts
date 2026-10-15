import { environment } from './../../../environments/environment.zilmoney';
import { Component, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { WhiteLabelDirective } from '../../directive/white-label.directive';

/**
 * Component responsible for displaying information about the mobile app and navigation links to app stores.
 */
@Component({
  selector: 'app-use-mobile-app-page',
  templateUrl: './use-mobile-app-page.component.html',
  styleUrls: ['./use-mobile-app-page.component.scss'],
  standalone: true,
  imports: [WhiteLabelDirective]
})
export class UseMobileAppPageComponent implements OnInit {
  private appSettingService = inject(AppSettingsService);
  environment = environment;

  subscriptions: Subscription[] = [];
  appConfig: IAppConfig;

  ngOnInit(): void {
    this.loadAppSettings();
  }

  loadAppSettings(): void {
    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe(
        (config: IAppConfig | null) => {
          if (config) {
            this.appConfig = config;
          }
        }
      )
    );
  }
  /**
   * Opens the Google Play Store link for the mobile app in a new browser window or tab.
   */
  googlePlayStoreNavigate() {
    if (environment.env_id === 'zilMoney') {
      window.open(
        'https://play.google.com/store/apps/details?id=com.zilmoney.mob',
        '_blank'
      );
    } else {
      window.open(
        'https://play.google.com/store/apps/details?id=com.onlinecheckwriter.m&pli=1',
        '_blank'
      );
    }
  }
  /**
   * Opens the Apple App Store link for the mobile app in a new browser window or tab.
   */
  appStoreNavigate() {
    if (environment.env_id === 'zilMoney') {
      window.open(
        'https://apps.apple.com/us/app/zil-money/id6479183480',
        '_blank'
      );
    } else {
      window.open(
        'https://apps.apple.com/in/app/onlinecheckwriter-app/id1521980907',
        '_blank'
      );
    }
  }
}
