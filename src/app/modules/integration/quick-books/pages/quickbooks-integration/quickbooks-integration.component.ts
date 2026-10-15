import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Integration } from 'src/app/data/data/integration';
import { IAppConfig } from 'src/app/models/app_settings';
import {
  IIntegration,
  IQuickbookLinks
} from 'src/app/modules/integration/model/integration';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { NgFor, NgStyle, NgIf } from '@angular/common';

/**
 * Component for managing QuickBooks integration.
 */
@Component({
  selector: 'app-quickbooks-integration',
  templateUrl: './quickbooks-integration.component.html',
  styleUrls: ['./quickbooks-integration.component.scss'],
  standalone: true,
  imports: [NgFor, NgStyle, RouterLink, NgIf]
})
export class QuickBooksIntegrationComponent implements OnInit, OnDestroy {
  /**
   * The application configuration.
   */
  appConfig: IAppConfig;

  /**
   * Array of subscriptions to manage cleanup.
   */
  subscriptions: Subscription[] = [];

  /**
   * Array of QuickBooks links.
   */
  quickbookLinks: IQuickbookLinks[] = Integration.quickbooksLinks();

  /**
   * Array of integration links.
   */
  integrationLinks = Integration.integrationLinks();

  /**
   * Array of other integration links.
   */
  otherIntegrationLink: IIntegration[] = [];

  /**
   * The current route.
   */
  currentRoute: string;

  /**
   * The requested integration ID.
   */
  requestedId: string;

  /**
   * Constructor for the QuickBooks Integration component.
   * @param {Router} router - The Angular router.
   * @param {AppSettingsService} appSettingService - The application settings service.
   * @param {IntegrationService} _integrationservice - The integration service.
   */
  constructor(
    private router: Router,
    private appSettingService: AppSettingsService,
    private _integrationservice: IntegrationService
  ) {}

  /**
   * Initialize the component.
   */
  ngOnInit(): void {
    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe((res) => {
        if (res) {
          this.appConfig = res;
        }
      })
    );
    this.sortArray();
  }

  /**
   * Sort the array of integration links.
   */
  sortArray() {
    for (const item of this.integrationLinks) {
      if (
        item.id !== 'qb-online' &&
        item.id !== 'qb-desktop' &&
        item.id !== 'qb-payroll'
      ) {
        this.otherIntegrationLink.push(item);
      }
    }
  }

  /**
   * Navigate to a specific integration page.
   * @param {IIntegration} item - The selected integration item.
   */
  navigate(item: IIntegration) {
    if (item.routerLink) {
      this.router.navigateByUrl(item.routerLink);
    }
    if (item.comingSoon) {
      this.requestedId = item.id;
      this.thirdPartyRequestTracking(this.requestedId);
    }
  }

  /**
   * Track a third-party integration request.
   * @param {string} requestedId - The requested integration ID.
   */
  thirdPartyRequestTracking(requestedId: string) {
    const appName = {
      appName: requestedId
    };
    this.subscriptions.push(
      this._integrationservice
        .thirdPartyIntegrationRequest(appName)
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .subscribe(() => {})
    );
  }

  /**
   * Clean up and unsubscribe from subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}
