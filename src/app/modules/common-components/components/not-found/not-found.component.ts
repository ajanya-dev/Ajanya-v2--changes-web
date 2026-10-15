import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { Subscription } from 'rxjs';
import { OnInit, OnDestroy, inject } from '@angular/core';
import { Component } from '@angular/core';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { Router } from '@angular/router';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  standalone: true
})
export class NotFoundComponent implements OnInit, OnDestroy {
  private _dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  subscriptions: Subscription[] = [];
  appConfig: IAppConfig;

  constructor(
    private _appSettingsService: AppSettingsService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.themeService.removeThemes();
    this.loadAppSettings();
  }

  /**
   * @description Subscribes to the appConfig$ observable from the AppSettingsService to load application settings.
   */
  loadAppSettings(): void {
    this.subscriptions.push(
      this._appSettingsService.appConfig$.subscribe(
        (config: IAppConfig | null) => {
          if (config) {
            this.appConfig = config;
          }
        }
      )
    );
  }

  /**
   * @description Opens a chat window for user support.
   */
  openChat() {
    this._dynamicWhiteLabelService.goToLiveChat();
  }

  goHome() {
    this.router.navigate(['manage/cheque/checkrecords']);
  }

  /**
   * @description Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
