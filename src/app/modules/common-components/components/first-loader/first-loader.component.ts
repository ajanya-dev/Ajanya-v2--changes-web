import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IAppConfig } from 'src/app/models/app_settings';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-first-loader',
  templateUrl: './first-loader.component.html',
  styleUrls: ['./first-loader.component.scss'],
  standalone: true,
  imports: [NgOptimizedImage,NgClass]
})
export class FirstLoaderComponent implements OnInit, OnDestroy {
  @Input() currentUrl = '';
  subscriptions: Subscription[] = [];
  appConfig: IAppConfig;
  env = environment;

  isDarkMode = signal(false);

  brandLogoUrl(): string {
    if (this.isDarkMode()) {
      return (
        this.appConfig?.whiteLogo ||
        this.appConfig?.zilMoneyLogo ||
        'assets/white_label/zilmoney/assets/app_logo_white.svg'
      );
    }
    return this.appConfig?.zilMoneyLogo || 'assets/main/zil_Money_logo.svg';
  }

  mainLogoUrl(): string {
    return this.isDarkMode()
      ? 'assets/white_label/zilmoney/assets/app_logo_white.svg'
      : 'assets/white_label/zilmoney/assets/app_logo.svg';
  }

  mainLogoOldUrl(): string {
    return this.isDarkMode()
      ? 'assets/main/app_logo_white_old.svg'
      : 'assets/main/app_logo_old.svg';
  }

  constructor(
    private router: Router,
    private _localStorageService: LocalStorageService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.routeInitialLoadInit();

    this.isDarkMode.set(this.themeService.getInitialColourTheme());
    this.subscriptions.push(
      this.themeService
        .getThemeSwitch()
        .subscribe((dark) => this.isDarkMode.set(dark))
    );
  }

  /**
   * @description Initializes the route for initial loading.
   *  If a current URL is already set, it uses it; otherwise, it defaults to 'manage/cheque'.
   */
  routeInitialLoadInit() {
    this.currentUrl = this.currentUrl ? this.currentUrl : 'manage/cheque';

    setTimeout(() => {
      // navigateByUrl parses query/fragment; navigate([str]) would percent-encode `?`.
      this.router.navigateByUrl(this.currentUrl);
      this._localStorageService.setItem('ocwLoad', 1);
    }, 3000);
  }

  /**
   * @description Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}
